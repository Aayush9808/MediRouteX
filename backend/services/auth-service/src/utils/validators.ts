import { z } from 'zod';

const userRoleEnum = z.enum([
  'admin',
  'dispatcher',
  'driver',
  'hospital_staff',
  'hospital_admin',
  'hospital',
  'patient',
  'blood_bank',
  'user',
]);

/**
 * Validation Schemas for Auth Service
 * Using Zod for runtime validation and type inference
 */

// ==================== User Registration Schema ====================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  phone: z
    .string()
    .regex(/^\+?[\d\s-()]{10,15}$/, 'Invalid phone number format')
    .optional(),
  role: userRoleEnum.default('user'),
});

// ==================== Login Schema ====================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// ==================== Update User Schema ====================

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s-()]{10,15}$/, 'Invalid phone number format')
    .optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending_verification']).optional(),
  role: userRoleEnum.optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// ==================== Password Update Schema ====================

export const updatePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must not exceed 128 characters')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'New password must contain at least one special character'),
}).refine(data => data.current_password !== data.new_password, {
  message: 'New password must be different from current password',
  path: ['new_password'],
});

// ==================== Password Reset Schemas ====================

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});

export const passwordResetVerifySchema = z.object({
  token: z.string().length(64, 'Invalid reset token'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

// ==================== Refresh Token Schema ====================

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

// ==================== Query Schemas ====================

export const userListQuerySchema = z.object({
  role: userRoleEnum.optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending_verification']).optional(),
  search: z.string().optional(),
  page: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(1).default(1)
  ),
  limit: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(1).max(100).default(20)
  ),
});

// ==================== Helper Functions ====================

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${messages}`);
    }
    throw error;
  }
}

// ==================== Email Validation ====================

export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

// ==================== Password Strength Check ====================

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters long');
  }

  // Character type checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push('Use both uppercase and lowercase letters');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Include at least one number');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Include at least one special character');

  // Common patterns check
  if (/^(?=.*(.)\1{2,})/.test(password)) {
    feedback.push('Avoid repeated characters');
    score = Math.max(0, score - 1);
  }

  return {
    score: Math.min(4, score),
    feedback,
    isStrong: score >= 3,
  };
}
