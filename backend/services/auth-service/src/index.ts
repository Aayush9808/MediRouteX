/**
 * Auth Service Main Entry Point
 * Express server for authentication and user management
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import logger from './utils/logger';
import pool from './config/database';
import redisClient from './config/redis';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5004;
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

// Stricter rate limit for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || '5', 10),
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

app.use(`/api/${API_VERSION}`, limiter);
app.use(`/api/${API_VERSION}/auth/login`, loginLimiter);

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
      service: 'auth-service',
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
      service: 'auth-service',
      error: 'Service dependencies unavailable',
    });
  }
});

// API routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

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
    app.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🔐 Auth Service Running                          ║
║                                                    ║
║   Port:        ${PORT}                               ║
║   Environment: ${process.env.NODE_ENV || 'development'}             ║
║   API Version: ${API_VERSION}                                 ║
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

  // Close database pool
  try {
    await pool.end();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database:', error);
  }

  // Close Redis connection
  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis:', error);
  }

  logger.info('Graceful shutdown completed');
  process.exit(0);
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

export { app };
