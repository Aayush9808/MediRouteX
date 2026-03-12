/**
 * Authentication Service
 * Handles login, registration, and user management
 */

import { authApi, apiCall, setTokens, setCurrentUser, clearTokens, getCurrentUser } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  status: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await apiCall<AuthResponse>(
        authApi.post('/auth/login', credentials),
        { successMessage: 'Login successful!', errorMessage: 'Login failed' }
      );

      setTokens(response.access_token, response.refresh_token);
      setCurrentUser(response.user);

      return response.user;
    } catch (error) {
      // Fallback: Mock authentication when backend is not available
      console.log('Backend not available, using mock authentication');
      
      // Check demo credentials
      if (credentials.email === 'demo@mediroutex.com' && credentials.password === 'demo1234') {
        const mockUser: User = {
          id: 'demo-user-1',
          email: 'demo@mediroutex.com',
          name: 'Demo User',
          phone: '+91-9999999999',
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString()
        };

        // Store mock tokens
        setTokens('mock-access-token', 'mock-refresh-token');
        setCurrentUser(mockUser);

        // Show success toast
        const toast = (await import('react-hot-toast')).default;
        toast.success('Login successful! (Mock Mode)');

        return mockUser;
      }
      
      // If wrong credentials, throw error
      throw new Error('Invalid credentials');
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<User> {
    const response = await apiCall<AuthResponse>(
      authApi.post('/auth/register', data),
      { successMessage: 'Registration successful!', errorMessage: 'Registration failed' }
    );

    setTokens(response.access_token, response.refresh_token);
    setCurrentUser(response.user);

    return response.user;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await authApi.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiCall<User>(
      authApi.get('/auth/me'),
      { silent: true }
    );

    setCurrentUser(response);
    return response;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiCall<User>(
      authApi.patch('/auth/me', data),
      { successMessage: 'Profile updated successfully!' }
    );

    setCurrentUser(response);
    return response;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!getCurrentUser();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return getCurrentUser();
  }
}

export const authService = new AuthService();
