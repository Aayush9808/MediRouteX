/**
 * Auth Controller
 * Handles HTTP requests for authentication and user management
 */

import { Request, Response, NextFunction } from 'express';
import UserModel from '../models/user.model';
import { validate } from '../utils/validators';
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
  updatePasswordSchema,
  passwordResetRequestSchema,
  passwordResetVerifySchema,
  refreshTokenSchema,
  userListQuerySchema,
} from '../utils/validators';
import {
  comparePassword,
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpirySeconds,
  getClientIp,
  getUserAgent,
  sanitizeUser,
  generatePasswordResetLink,
} from '../utils/helpers';
import emailService from '../utils/email';
import logger from '../utils/logger';
import { AuthRequest } from '../types';

export class AuthController {
  // ==================== Authentication Operations ====================

  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = validate(registerSchema, req.body);

      // Check if email already exists
      const existingUser = await UserModel.findByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
        });
      }

      // Create user
      const user = await UserModel.create(validatedData);

      // Send welcome email (non-blocking)
      emailService.sendWelcomeEmail({
        name: user.name,
        email: user.email,
      }).catch(err => logger.error('Failed to send welcome email:', err));

      // Generate tokens
      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      // Create session
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);
      await UserModel.createSession(user.id, refreshToken, ipAddress, userAgent);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: sanitizeUser(user),
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: getTokenExpirySeconds(process.env.JWT_EXPIRES_IN),
        },
      });
    } catch (error) {
      logger.error('Error in register:', error);
      return next(error);
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = validate(loginSchema, req.body);

      // Find user with password
      const user = await UserModel.findByEmailWithPassword(validatedData.email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Check if account is active
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: `Account is ${user.status}. Please contact support.`,
        });
      }

      // Verify password
      const isPasswordValid = await comparePassword(
        validatedData.password,
        user.password_hash
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Update last login
      await UserModel.updateLastLogin(user.id);

      // Generate tokens
      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      // Create session
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);
      await UserModel.createSession(user.id, refreshToken, ipAddress, userAgent);

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: sanitizeUser(user),
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: getTokenExpirySeconds(process.env.JWT_EXPIRES_IN),
        },
      });
    } catch (error) {
      logger.error('Error in login:', error);
      return next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = validate(refreshTokenSchema, req.body);

      // Verify refresh token
      let payload;
      try {
        payload = verifyRefreshToken(validatedData.refresh_token);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
        });
      }

      // Check if session exists
      const session = await UserModel.findSessionByToken(validatedData.refresh_token);
      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'Session not found or expired',
        });
      }

      // Get user
      const user = await UserModel.findById(payload.id);
      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          access_token: accessToken,
          expires_in: getTokenExpirySeconds(process.env.JWT_EXPIRES_IN),
        },
      });
    } catch (error) {
      logger.error('Error in refresh:', error);
      return next(error);
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = validate(refreshTokenSchema, req.body);

      // Delete session
      await UserModel.deleteSession(validatedData.refresh_token);

      return res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Error in logout:', error);
      return next(error);
    }
  }

  /**
   * Logout from all devices
   * POST /api/v1/auth/logout-all
   */
  static async logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Delete all user sessions
      await UserModel.deleteUserSessions(req.user.id);

      return res.json({
        success: true,
        message: 'Logged out from all devices',
      });
    } catch (error) {
      logger.error('Error in logoutAll:', error);
      return next(error);
    }
  }

  // ==================== Password Management ====================

  /**
   * Request password reset
   * POST /api/v1/auth/password-reset/request
   */
  static async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = validate(passwordResetRequestSchema, req.body);

      // Find user
      const user = await UserModel.findByEmail(validatedData.email);
      
      // Always return success (prevent email enumeration)
      if (!user) {
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        });
      }

      // Create reset token
      const resetToken = await UserModel.createPasswordResetToken(user.id);

      // Generate reset link
      const resetLink = generatePasswordResetLink(resetToken);

      // Send email
      const emailSent = await emailService.sendPasswordResetEmail({
        name: user.name,
        reset_link: resetLink,
        expires_minutes: parseInt(process.env.RESET_TOKEN_EXPIRES_MINUTES || '30', 10),
      });

      if (!emailSent) {
        logger.error(`Failed to send password reset email to ${user.email}`);
      }

      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      logger.error('Error in requestPasswordReset:', error);
      return next(error);
    }
  }

  /**
   * Reset password with token
   * POST /api/v1/auth/password-reset/verify
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = validate(passwordResetVerifySchema, req.body);

      // Find reset token
      const resetToken = await UserModel.findPasswordResetToken(validatedData.token);
      if (!resetToken) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        });
      }

      // Get user
      const user = await UserModel.findById(resetToken.user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(validatedData.new_password);

      // Update password
      await UserModel.updatePassword(user.id, newPasswordHash);

      // Mark token as used
      await UserModel.markPasswordResetTokenUsed(validatedData.token);

      // Delete all sessions (force re-login)
      await UserModel.deleteUserSessions(user.id);

      // Send confirmation email
      emailService.sendPasswordChangedEmail(user.email, user.name)
        .catch(err => logger.error('Failed to send password changed email:', err));

      return res.json({
        success: true,
        message: 'Password reset successful. Please login with your new password.',
      });
    } catch (error) {
      logger.error('Error in resetPassword:', error);
      return next(error);
    }
  }

  /**
   * Change password (authenticated)
   * POST /api/v1/auth/password-change
   */
  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const validatedData = validate(updatePasswordSchema, req.body);

      // Get user with password
      const user = await UserModel.findByEmailWithPassword(req.user.email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(
        validatedData.current_password,
        user.password_hash
      );

      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(validatedData.new_password);

      // Update password
      await UserModel.updatePassword(user.id, newPasswordHash);

      // Send confirmation email
      emailService.sendPasswordChangedEmail(user.email, user.name)
        .catch(err => logger.error('Failed to send password changed email:', err));

      return res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Error in changePassword:', error);
      return next(error);
    }
  }

  // ==================== User Management ====================

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Fetch fresh user data
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Error in getProfile:', error);
      return next(error);
    }
  }

  /**
   * Update current user profile
   * PATCH /api/v1/auth/me
   */
  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const validatedData = validate(updateUserSchema, req.body);

      // Remove role/status if not admin (prevent privilege escalation)
      if (req.user.role !== 'admin') {
        delete (validatedData as any).role;
        delete (validatedData as any).status;
      }

      const user = await UserModel.update(req.user.id, validatedData);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Error in updateProfile:', error);
      return next(error);
    }
  }

  /**
   * Get all users (admin only)
   * GET /api/v1/auth/users
   */
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = validate(userListQuerySchema, req.query) as any;
      const { page, limit, ...filters } = validatedQuery;

      const result = await UserModel.findAll(filters, page, limit);

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error in getAllUsers:', error);
      return next(error);
    }
  }

  /**
   * Get user by ID (admin only)
   * GET /api/v1/auth/users/:id
   */
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Error in getUserById:', error);
      return next(error);
    }
  }

  /**
   * Update user (admin only)
   * PUT /api/v1/auth/users/:id
   */
  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = validate(updateUserSchema, req.body);

      const user = await UserModel.update(id, validatedData);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Error in updateUser:', error);
      return next(error);
    }
  }

  /**
   * Delete user (admin only)
   * DELETE /api/v1/auth/users/:id
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await UserModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Error in deleteUser:', error);
      return next(error);
    }
  }

  /**
   * Get user statistics (admin only)
   * GET /api/v1/auth/stats
   */
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await UserModel.getStats();

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error in getStats:', error);
      return next(error);
    }
  }
}

export default AuthController;
