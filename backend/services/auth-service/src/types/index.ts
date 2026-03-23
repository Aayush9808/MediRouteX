/**
 * Auth Service Type Definitions
 * Core types for authentication and user management
 */

import { Request } from 'express';

// ==================== User Types ====================

export type UserRole =
  | 'admin'
  | 'dispatcher'
  | 'driver'
  | 'hospital_staff'
  | 'hospital_admin'
  | 'hospital'
  | 'patient'
  | 'blood_bank'
  | 'user';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  email_verified: boolean;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserDTO {
  name?: string;
  phone?: string;
  avatar_url?: string;
  status?: UserStatus;
  role?: UserRole;
}

export interface UpdatePasswordDTO {
  current_password: string;
  new_password: string;
}

// ==================== Auth Types ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshTokenDTO {
  refresh_token: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface AuthRequest extends Request {
  user?: User;
}

// ==================== Password Reset Types ====================

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetVerify {
  token: string;
  new_password: string;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  used: boolean;
}

// ==================== Session Types ====================

export interface UserSession {
  id: string;
  user_id: string;
  refresh_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: Date;
  created_at: Date;
  last_activity: Date;
}

// ==================== Statistics Types ====================

export interface UserStats {
  total_users: number;
  active_users: number;
  users_by_role: {
    role: UserRole;
    count: number;
  }[];
  new_users_last_30_days: number;
  verified_users: number;
}

// ==================== Validation Types ====================

export interface ValidationError {
  field: string;
  message: string;
}

// ==================== Service Response Types ====================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ==================== Email Types ====================

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
}

export interface PasswordResetEmailData {
  name: string;
  reset_link: string;
  expires_minutes: number;
}

// ==================== Cache Keys ====================

export interface AuthCacheKeys {
  USER_BY_ID: (id: string) => string;
  USER_BY_EMAIL: (email: string) => string;
  SESSION: (token: string) => string;
  RESET_TOKEN: (token: string) => string;
  LOGIN_ATTEMPTS: (email: string) => string;
}

// ==================== Error Types ====================

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: ValidationError[],
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
