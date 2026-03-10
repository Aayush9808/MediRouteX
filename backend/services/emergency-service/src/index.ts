import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Import configurations
import pool from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';

// Import routes
import emergencyRoutes from './routes/emergency.routes';

// Initialize Express app
const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Port configuration
const PORT = process.env.PORT || 5001;
const API_VERSION = process.env.API_VERSION || 'v1';

// Trust proxy (for production behind load balancer)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(`/api/${API_VERSION}`, limiter);

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check database
    await pool.query('SELECT 1');
    
    res.json({
      success: true,
      service: 'emergency-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: API_VERSION,
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      success: false,
      service: 'emergency-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use(`/api/${API_VERSION}/emergency`, emergencyRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'MediRouteX Emergency Service API',
    version: API_VERSION,
    documentation: `/api/${API_VERSION}/docs`,
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('WebSocket client connected', { socketId: socket.id });

  socket.on('disconnect', () => {
    logger.info('WebSocket client disconnected', { socketId: socket.id });
  });

  // Join emergency room for real-time updates
  socket.on('join:emergency', (emergencyId: string) => {
    socket.join(`emergency:${emergencyId}`);
    logger.info('Client joined emergency room', { socketId: socket.id, emergencyId });
  });

  socket.on('leave:emergency', (emergencyId: string) => {
    socket.leave(`emergency:${emergencyId}`);
    logger.info('Client left emergency room', { socketId: socket.id, emergencyId });
  });

  // Join admin dashboard room
  socket.on('join:dashboard', () => {
    socket.join('dashboard');
    logger.info('Client joined dashboard room', { socketId: socket.id });
  });
});

// Export io for use in controllers
export { io };

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing server gracefully...');
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await pool.end();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database', { error });
  }

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Test database connection
    await pool.query('SELECT NOW()');
    logger.info('Database connected successfully');

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`🚑 Emergency Service running on port ${PORT}`);
      logger.info(`📡 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API: http://localhost:${PORT}/api/${API_VERSION}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
