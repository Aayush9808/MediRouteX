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
import ambulanceRoutes from './routes/ambulance.routes';

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
const PORT = process.env.PORT || 5002;
const API_VERSION = process.env.API_VERSION || 'v1';

// Trust proxy
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
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
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
    await pool.query('SELECT 1');
    
    res.json({
      success: true,
      service: 'ambulance-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: API_VERSION,
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      success: false,
      service: 'ambulance-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use(`/api/${API_VERSION}/ambulance`, ambulanceRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'MediRouteX Ambulance Service API',
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

  // Join ambulance tracking room
  socket.on('track:ambulance', (ambulanceId: string) => {
    socket.join(`ambulance:${ambulanceId}`);
    logger.info('Client tracking ambulance', { socketId: socket.id, ambulanceId });
  });

  socket.on('untrack:ambulance', (ambulanceId: string) => {
    socket.leave(`ambulance:${ambulanceId}`);
    logger.info('Client stopped tracking ambulance', { socketId: socket.id, ambulanceId });
  });

  // Join dispatcher dashboard room
  socket.on('join:dispatch', () => {
    socket.join('dispatch-dashboard');
    logger.info('Client joined dispatch dashboard', { socketId: socket.id });
  });

  // Driver location updates
  socket.on('location:update', (data: { ambulanceId: string; lat: number; lng: number }) => {
    // Broadcast to tracking clients
    io.to(`ambulance:${data.ambulanceId}`).emit('ambulance:location', data);
    io.to('dispatch-dashboard').emit('ambulance:location', data);
    logger.debug('Location update broadcast', { ambulanceId: data.ambulanceId });
  });

  socket.on('disconnect', () => {
    logger.info('WebSocket client disconnected', { socketId: socket.id });
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
      logger.info(`🚑 Ambulance Service running on port ${PORT}`);
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
