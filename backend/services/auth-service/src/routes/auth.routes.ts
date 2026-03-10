/**
 * Auth Service Routes
 * API endpoints for authentication and user management
 */

import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
  updatePasswordSchema,
  passwordResetRequestSchema,
  passwordResetVerifySchema,
  refreshTokenSchema,
} from '../utils/validators';

const router = Router();

// ==================== Public Routes (No Authentication) ====================

/**
 * POST /register - Register new user
 */
router.post(
  '/register',
  validateRequest(registerSchema),
  AuthController.register
);

/**
 * POST /login - User login
 */
router.post(
  '/login',
  validateRequest(loginSchema),
  AuthController.login
);

/**
 * POST /refresh - Refresh access token
 */
router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  AuthController.refresh
);

/**
 * POST /password-reset/request - Request password reset
 */
router.post(
  '/password-reset/request',
  validateRequest(passwordResetRequestSchema),
  AuthController.requestPasswordReset
);

/**
 * POST /password-reset/verify - Reset password with token
 */
router.post(
  '/password-reset/verify',
  validateRequest(passwordResetVerifySchema),
  AuthController.resetPassword
);

// ==================== Protected Routes (Require Authentication) ====================

/**
 * POST /logout - Logout user
 */
router.post(
  '/logout',
  authenticate(),
  validateRequest(refreshTokenSchema),
  AuthController.logout
);

/**
 * POST /logout-all - Logout from all devices
 */
router.post(
  '/logout-all',
  authenticate(),
  AuthController.logoutAll
);

/**
 * GET /me - Get current user profile
 */
router.get(
  '/me',
  authenticate(),
  AuthController.getProfile
);

/**
 * PATCH /me - Update current user profile
 */
router.patch(
  '/me',
  authenticate(),
  validateRequest(updateUserSchema),
  AuthController.updateProfile
);

/**
 * POST /password-change - Change password (authenticated)
 */
router.post(
  '/password-change',
  authenticate(),
  validateRequest(updatePasswordSchema),
  AuthController.changePassword
);

// ==================== Admin Routes ====================

/**
 * GET /users - Get all users (admin only)
 */
router.get(
  '/users',
  authenticate(['admin', 'dispatcher']),
  AuthController.getAllUsers
);

/**
 * GET /stats - Get user statistics (admin only)
 */
router.get(
  '/stats',
  authenticate(['admin', 'dispatcher']),
  AuthController.getStats
);

/**
 * GET /users/:id - Get user by ID (admin only)
 */
router.get(
  '/users/:id',
  authenticate(['admin']),
  AuthController.getUserById
);

/**
 * PUT /users/:id - Update user (admin only)
 */
router.put(
  '/users/:id',
  authenticate(['admin']),
  validateRequest(updateUserSchema),
  AuthController.updateUser
);

/**
 * DELETE /users/:id - Delete user (admin only)
 */
router.delete(
  '/users/:id',
  authenticate(['admin']),
  AuthController.deleteUser
);

export default router;
