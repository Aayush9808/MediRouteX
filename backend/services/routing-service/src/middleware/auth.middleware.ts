import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, User } from '../types';
import logger from '../utils/logger';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export const authenticate = (allowedRoles?: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Get token from header
      const authHeader = req.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'No token provided. Authorization required.',
            code: 'NO_TOKEN',
          },
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET not configured');
        return res.status(500).json({
          success: false,
          error: { message: 'Server configuration error' },
        });
      }

      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      // Attach user to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role as User['role'],
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        email_verified: true,
      };

      // Check role authorization
      if (allowedRoles && allowedRoles.length > 0 && req.user) {
        if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: {
              message: 'Access forbidden. Insufficient permissions.',
              code: 'FORBIDDEN',
            },
          });
        }
      }

      return next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Token expired. Please login again.',
            code: 'TOKEN_EXPIRED',
          },
        });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid token. Authorization failed.',
            code: 'INVALID_TOKEN',
          },
        });
      }

      logger.error('Auth middleware error', { error });
      return res.status(500).json({
        success: false,
        error: { message: 'Authorization error' },
      });
    }
  };
};

// Optional auth - doesn't fail if no token, but sets user if token is valid
export const optionalAuthMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET;
      
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
        req.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role as User['role'],
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
          email_verified: true,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

// Export as optionalAuth for convenience
export const optionalAuth = () => optionalAuthMiddleware;
