/**
 * Routing Service - Main Entry Point
 * Port 5005
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routeRoutes from './routes/route.routes';
import logger from './utils/logger';
import pool from './config/database';
import redis from './config/redis';
import { errorHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;
const API_VERSION = process.env.API_VERSION || 'v1';

// ==================== Middleware ====================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// ==================== Health Check ====================

app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check database
    await pool.query('SELECT 1');
    
    // Check Redis
    await redis.ping();

    res.json({
      status: 'healthy',
      service: 'routing-service',
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      redis: 'connected'
    });
  } catch (error: any) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'routing-service',
      error: error.message
    });
  }
});

// ==================== API Routes ====================

app.use(`/api/${API_VERSION}/routes`, routeRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'MediRouteX Routing Service',
    version: API_VERSION,
    status: 'running',
    endpoints: {
      health: '/health',
      routes: `/api/${API_VERSION}/routes`,
      calculate: `/api/${API_VERSION}/routes/calculate`,
      optimize: `/api/${API_VERSION}/routes/optimize`,
      alternatives: `/api/${API_VERSION}/routes/alternatives`,
      eta: `/api/${API_VERSION}/routes/eta`,
      traffic: `/api/${API_VERSION}/routes/traffic`,
      distance: `/api/${API_VERSION}/routes/distance`,
      stats: `/api/${API_VERSION}/routes/stats`
    },
    documentation: 'See README.md for API documentation'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use(errorHandler);

// ==================== Server Startup ====================

async function startServer() {
  try {
    // Connect Redis before starting server
    if (!redis.isOpen) {
      await redis.connect();
      logger.info('✓ Redis connected');
    }
    
    // Test database
    await pool.query('SELECT 1');
    logger.info('✓ Database connected');

    const server = app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info('🚑 MediRouteX Routing Service Started');
      logger.info('='.repeat(50));
      logger.info(`Port: ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API Version: ${API_VERSION}`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
      logger.info(`API Endpoint: http://localhost:${PORT}/api/${API_VERSION}/routes`);
      logger.info('='.repeat(50));
    });
    
    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
let server: any;
startServer().then(s => { server = s; });

// ==================== Graceful Shutdown ====================

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database pool
      await pool.end();
      logger.info('Database pool closed');

      // Close Redis connection
      await redis.quit();
      logger.info('Redis connection closed');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;
