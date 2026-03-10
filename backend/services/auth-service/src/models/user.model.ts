/**
 * User Model
 * Database operations for user management and authentication
 */

import { QueryResultRow } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import logger from '../utils/logger';
import {
  User,
  UserWithPassword,
  CreateUserDTO,
  UpdateUserDTO,
  UserRole,
  UserStatus,
  PasswordResetToken,
  UserSession,
  UserStats,
  PaginatedResponse,
} from '../types';
import {
  hashPassword,
  generateResetToken,
  hashResetToken,
  getExpiryDate,
} from '../utils/helpers';

export class UserModel {
  // ==================== User CRUD Operations ====================

  static async create(data: CreateUserDTO): Promise<User> {
    const id = uuidv4();
    const passwordHash = await hashPassword(data.password);

    const sql = `
      INSERT INTO users (
        id, email, password_hash, name, phone, role, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING id, email, name, phone, role, status, created_at, updated_at, 
                last_login, email_verified, avatar_url
    `;

    const values = [
      id,
      data.email.toLowerCase(),
      passwordHash,
      data.name,
      data.phone || null,
      data.role || 'user',
    ];

    try {
      const result = await pool.query<User & QueryResultRow>(sql, values);
      logger.info(`User created: ${id} - ${data.email}`);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error('Email already registered');
      }
      logger.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async findById(id: string): Promise<User | null> {
    const sql = `
      SELECT id, email, name, phone, role, status, created_at, updated_at,
             last_login, email_verified, avatar_url
      FROM users
      WHERE id = $1
    `;

    try {
      const result = await pool.query<User & QueryResultRow>(sql, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error(`Error finding user ${id}:`, error);
      throw new Error('Failed to fetch user');
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    const sql = `
      SELECT id, email, name, phone, role, status, created_at, updated_at,
             last_login, email_verified, avatar_url
      FROM users
      WHERE email = $1
    `;

    try {
      const result = await pool.query<User & QueryResultRow>(sql, [email.toLowerCase()]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error(`Error finding user by email ${email}:`, error);
      throw new Error('Failed to fetch user');
    }
  }

  static async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    const sql = `
      SELECT id, email, password_hash, name, phone, role, status, 
             created_at, updated_at, last_login, email_verified, avatar_url
      FROM users
      WHERE email = $1
    `;

    try {
      const result = await pool.query<UserWithPassword & QueryResultRow>(sql, [email.toLowerCase()]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error(`Error finding user with password by email ${email}:`, error);
      throw new Error('Failed to fetch user');
    }
  }

  static async findAll(
    filters: {
      role?: UserRole;
      status?: UserStatus;
      search?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<User>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (filters.role) {
      conditions.push(`role = $${++paramCount}`);
      values.push(filters.role);
    }

    if (filters.status) {
      conditions.push(`status = $${++paramCount}`);
      values.push(filters.status);
    }

    if (filters.search) {
      conditions.push(`(name ILIKE $${++paramCount} OR email ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM users ${whereClause}`;
    const countResult = await pool.query<{ count: string } & QueryResultRow>(countSql, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated data
    const dataSql = `
      SELECT id, email, name, phone, role, status, created_at, updated_at,
             last_login, email_verified, avatar_url
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    values.push(limit, offset);

    try {
      const result = await pool.query<User & QueryResultRow>(dataSql, values);
      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  static async update(id: string, data: UpdateUserDTO): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.name) {
      updates.push(`name = $${++paramCount}`);
      values.push(data.name);
    }

    if (data.phone !== undefined) {
      updates.push(`phone = $${++paramCount}`);
      values.push(data.phone);
    }

    if (data.avatar_url !== undefined) {
      updates.push(`avatar_url = $${++paramCount}`);
      values.push(data.avatar_url);
    }

    if (data.status) {
      updates.push(`status = $${++paramCount}`);
      values.push(data.status);
    }

    if (data.role) {
      updates.push(`role = $${++paramCount}`);
      values.push(data.role);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING id, email, name, phone, role, status, created_at, updated_at,
                last_login, email_verified, avatar_url
    `;

    try {
      const result = await pool.query<User & QueryResultRow>(sql, values);
      if (result.rows.length === 0) {
        return null;
      }
      logger.info(`User updated: ${id}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      throw new Error('Failed to update user');
    }
  }

  static async updatePassword(id: string, newPasswordHash: string): Promise<boolean> {
    const sql = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    try {
      const result = await pool.query(sql, [newPasswordHash, id]);
      const updated = (result.rowCount ?? 0) > 0;
      if (updated) {
        logger.info(`Password updated for user: ${id}`);
      }
      return updated;
    } catch (error) {
      logger.error(`Error updating password for user ${id}:`, error);
      throw new Error('Failed to update password');
    }
  }

  static async updateLastLogin(id: string): Promise<boolean> {
    const sql = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    try {
      await pool.query(sql, [id]);
      return true;
    } catch (error) {
      logger.error(`Error updating last login for user ${id}:`, error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM users WHERE id = $1';

    try {
      const result = await pool.query(sql, [id]);
      const deleted = (result.rowCount ?? 0) > 0;
      if (deleted) {
        logger.info(`User deleted: ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      throw new Error('Failed to delete user');
    }
  }

  // ==================== Password Reset Operations ====================

  static async createPasswordResetToken(userId: string): Promise<string> {
    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresMinutes = parseInt(process.env.RESET_TOKEN_EXPIRES_MINUTES || '30', 10);
    const expiresAt = getExpiryDate(expiresMinutes);

    const sql = `
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) 
      DO UPDATE SET token_hash = $2, expires_at = $3, used = false, created_at = CURRENT_TIMESTAMP
    `;

    try {
      await pool.query(sql, [userId, tokenHash, expiresAt]);
      logger.info(`Password reset token created for user: ${userId}`);
      return token; // Return original token (not hash)
    } catch (error) {
      logger.error(`Error creating password reset token for user ${userId}:`, error);
      throw new Error('Failed to create password reset token');
    }
  }

  static async findPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const tokenHash = hashResetToken(token);

    const sql = `
      SELECT id, user_id, token_hash as token, expires_at, created_at, used
      FROM password_reset_tokens
      WHERE token_hash = $1 AND used = false AND expires_at > NOW()
    `;

    try {
      const result = await pool.query<PasswordResetToken & QueryResultRow>(sql, [tokenHash]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error finding password reset token:', error);
      throw new Error('Failed to find password reset token');
    }
  }

  static async markPasswordResetTokenUsed(token: string): Promise<boolean> {
    const tokenHash = hashResetToken(token);

    const sql = `
      UPDATE password_reset_tokens
      SET used = true
      WHERE token_hash = $1
    `;

    try {
      const result = await pool.query(sql, [tokenHash]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error marking password reset token as used:', error);
      throw new Error('Failed to mark token as used');
    }
  }

  // ==================== Session Management ====================

  static async createSession(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserSession> {
    const id = uuidv4();
    const expiresAt = getExpiryDate(7 * 24 * 60); // 7 days

    const sql = `
      INSERT INTO user_sessions (id, user_id, refresh_token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    try {
      const result = await pool.query<UserSession & QueryResultRow>(sql, [
        id,
        userId,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt,
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating session for user ${userId}:`, error);
      throw new Error('Failed to create session');
    }
  }

  static async findSessionByToken(refreshToken: string): Promise<UserSession | null> {
    const sql = `
      SELECT * FROM user_sessions
      WHERE refresh_token = $1 AND expires_at > NOW()
    `;

    try {
      const result = await pool.query<UserSession & QueryResultRow>(sql, [refreshToken]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error finding session:', error);
      throw new Error('Failed to find session');
    }
  }

  static async deleteSession(refreshToken: string): Promise<boolean> {
    const sql = 'DELETE FROM user_sessions WHERE refresh_token = $1';

    try {
      const result = await pool.query(sql, [refreshToken]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
    }
  }

  static async deleteUserSessions(userId: string): Promise<boolean> {
    const sql = 'DELETE FROM user_sessions WHERE user_id = $1';

    try {
      await pool.query(sql, [userId]);
      logger.info(`All sessions deleted for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting sessions for user ${userId}:`, error);
      throw new Error('Failed to delete sessions');
    }
  }

  // ==================== Statistics ====================

  static async getStats(): Promise<UserStats> {
    const sql = `
      WITH user_counts AS (
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE status = 'active') as active_users,
          COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d
        FROM users
      ),
      role_counts AS (
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
      )
      SELECT
        uc.total_users,
        uc.active_users,
        uc.verified_users,
        uc.new_users_30d,
        COALESCE(json_agg(json_build_object('role', rc.role, 'count', rc.count)), '[]'::json) as users_by_role
      FROM user_counts uc
      CROSS JOIN role_counts rc
      GROUP BY uc.total_users, uc.active_users, uc.verified_users, uc.new_users_30d
    `;

    try {
      const result = await pool.query<any>(sql);
      const row = result.rows[0];

      return {
        total_users: parseInt(row.total_users, 10),
        active_users: parseInt(row.active_users, 10),
        verified_users: parseInt(row.verified_users, 10),
        new_users_last_30_days: parseInt(row.new_users_30d, 10),
        users_by_role: row.users_by_role || [],
      };
    } catch (error) {
      logger.error('Error fetching user stats:', error);
      throw new Error('Failed to fetch statistics');
    }
  }
}

export default UserModel;
