/**
 * Hospital Service Main Entry Point
 * Express server with WebSocket for real-time bed capacity updates
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server as SocketServer } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';

import hospitalRoutes from './routes/hospital.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import logger from './utils/logger';
import pool from './config/database';
import redisClient from './config/redis';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5003;
const API_VERSION = process.env.API_VERSION || 'v1';

// ==================== Middleware ====================

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(`/api/${API_VERSION}`, limiter);

// ==================== Routes ====================

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    // Check Redis connection
    await redisClient.ping();

    res.json({
      status: 'healthy',
      service: 'hospital-service',
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      redis: 'connected',
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'hospital-service',
      error: 'Service dependencies unavailable',
    });
  }
});

// API routes
app.use(`/api/${API_VERSION}/hospitals`, hospitalRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ==================== WebSocket Setup ====================

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join dispatch room for real-time bed updates
  socket.on('join:dispatch', () => {
    socket.join('dispatch');
    logger.info(`Socket ${socket.id} joined dispatch room`);
  });

  // Join hospital room for hospital-specific updates
  socket.on('join:hospital', (hospitalId: string) => {
    socket.join(`hospital:${hospitalId}`);
    logger.info(`Socket ${socket.id} joined hospital room: ${hospitalId}`);
  });

  // Handle bed capacity updates (from hospital staff)
  socket.on('bed:update', async (data: {
    hospital_id: string;
    bed_type: string;
    available_beds: number;
    total_beds: number;
  }) => {
    try {
      logger.info('Bed update received via WebSocket:', data);
      
      // Broadcast to all dispatchers
      io.to('dispatch').emit('bed:updated', {
        ...data,
        timestamp: new Date(),
      });

      // Broadcast to specific hospital room
      io.to(`hospital:${data.hospital_id}`).emit('bed:updated', {
        ...data,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Error handling bed update:', error);
      socket.emit('error', { message: 'Failed to update bed capacity' });
    }
  });

  // Handle capacity alerts
  socket.on('capacity:alert', (alert: any) => {
    logger.warn('Capacity alert:', alert);
    io.to('dispatch').emit('capacity:alert', alert);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// ==================== Server Startup ====================

async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    logger.info('✓ Database connected');

    // Connect and test Redis
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    await redisClient.ping();
    logger.info('✓ Redis connected');

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🏥 Hospital Service Running                      ║
║                                                    ║
║   Port:        ${PORT}                               ║
║   Environment: ${process.env.NODE_ENV || 'development'}             ║
║   API Version: ${API_VERSION}                                 ║
║   WebSocket:   Enabled                             ║
║                                                    ║
║   Health:      http://localhost:${PORT}/health        ║
║   API Docs:    http://localhost:${PORT}/api/${API_VERSION}    ║
║                                                    ║
╚════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ==================== Graceful Shutdown ====================

async function shutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    // Close database pool
    await pool.end();
    logger.info('Database connections closed');

    // Close Redis connection
    await redisClient.quit();
    logger.info('Redis connection closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});

// Start the server
startServer();

export { app, io };
