import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { generateRequestId } from '../utils/helpers';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Attach request ID to request
  (req as any).requestId = requestId;

  // Log request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};
