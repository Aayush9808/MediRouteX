/**
 * Auth Service Helper Functions
 * Utility functions for password hashing, token generation, and common operations
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { TokenPayload, UserRole } from '../types';

// ==================== Password Hashing ====================

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  return bcrypt.hash(password, rounds);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ==================== JWT Token Generation ====================

/**
 * Generate access token
 */
export function generateAccessToken(payload: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(
    {
      ...payload,
      type: 'access',
    } as TokenPayload,
    secret,
    { expiresIn } as jwt.SignOptions
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}): string {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      ...payload,
      type: 'refresh',
    } as TokenPayload,
    secret,
    { expiresIn } as jwt.SignOptions
  );
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, secret) as TokenPayload;
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.verify(token, secret) as TokenPayload;
}

/**
 * Get token expiry time in seconds
 */
export function getTokenExpirySeconds(expiresIn: string = '24h'): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 86400; // Default 24 hours

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  const multipliers = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return num * multipliers[unit as keyof typeof multipliers];
}

// ==================== Password Reset Token ====================

/**
 * Generate secure random token for password reset
 */
export function generateResetToken(): string {
  const length = parseInt(process.env.RESET_TOKEN_LENGTH || '64', 10);
  return crypto.randomBytes(length / 2).toString('hex');
}

/**
 * Hash reset token for storage
 */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ==================== Request ID Generation ====================

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return uuidv4();
}

// ==================== Email Utilities ====================

/**
 * Mask email for privacy (show first 2 chars and domain)
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username}***@${domain}`;
  }
  return `${username.substring(0, 2)}***@${domain}`;
}

/**
 * Generate verification link
 */
export function generateVerificationLink(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${base}/verify-email?token=${token}`;
}

/**
 * Generate password reset link
 */
export function generatePasswordResetLink(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${base}/reset-password?token=${token}`;
}

// ==================== Date/Time Utilities ====================

/**
 * Get expiry date from now
 */
export function getExpiryDate(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check if date is expired
 */
export function isExpired(date: Date): boolean {
  return new Date() > new Date(date);
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// ==================== IP Address Utilities ====================

/**
 * Extract IP address from request
 */
export function getClientIp(req: any): string | undefined {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip
  );
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: any): string | undefined {
  return req.headers['user-agent'];
}

// ==================== Sanitization ====================

/**
 * Sanitize user input (remove potentially dangerous characters)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[^\w\s@.-]/g, '') // Remove special chars except common ones
    .trim();
}

/**
 * Remove sensitive data from user object
 */
export function sanitizeUser(user: any): any {
  const { password_hash, ...sanitized } = user;
  return sanitized;
}

// ==================== Retry Logic ====================

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== Role Checking ====================

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

/**
 * Check if role has higher privilege than another
 */
export function hasHigherPrivilege(role1: UserRole, role2: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    admin: 5,
    hospital_admin: 4,
    dispatcher: 3,
    hospital_staff: 2,
    hospital: 2,
    blood_bank: 2,
    driver: 1,
    patient: 0,
    user: 0,
  };

  return roleHierarchy[role1] > roleHierarchy[role2];
}
