/**
 * Authentication Service
 * Handles login, registration, and user management
 */

import { authApi, apiCall, setTokens, setCurrentUser, clearTokens, getCurrentUser, getAccessToken } from './api';

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
        { silent: true }
      );

      setTokens(response.access_token, response.refresh_token);
      setCurrentUser(response.user);
      const toast = (await import('react-hot-toast')).default;
      toast.success('Login successful!');

      return response.user;
    } catch (error) {
      // Fallback: Mock authentication when backend is not available
      console.log('Backend not available, using mock authentication');
      
      const toast = (await import('react-hot-toast')).default;

      // Mock user table — add more roles here for demo
      const mockUsers: Record<string, User> = {
        'demo@mediroutex.com:demo1234': {
          id: 'demo-user-1',
          email: 'demo@mediroutex.com',
          name: 'Demo User (Admin)',
          phone: '+91-9999999999',
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString()
        },
        'patient@mediroutex.com:patient1234': {
          id: 'patient-user-1',
          email: 'patient@mediroutex.com',
          name: 'Rohan Sharma',
          phone: '+91-9876543210',
          role: 'patient',
          status: 'active',
          created_at: new Date().toISOString()
        },
        'driver@mediroutex.com:driver1234': {
          id: 'driver-user-1',
          email: 'driver@mediroutex.com',
          name: 'Rajesh Kumar',
          phone: '+91-9812345678',
          role: 'driver',
          status: 'active',
          created_at: new Date().toISOString()
        },
        'hospital@mediroutex.com:hospital1234': {
          id: 'hospital-user-1',
          email: 'hospital@mediroutex.com',
          name: 'Dr. Priya Mehta',
          phone: '+91-9900112233',
          role: 'hospital',
          status: 'active',
          created_at: new Date().toISOString()
        },
        'user@mediroutex.com:user1234': {
          id: 'normal-user-1',
          email: 'user@mediroutex.com',
          name: 'Aman Verma',
          phone: '+91-9898989898',
          role: 'user',
          status: 'active',
          created_at: new Date().toISOString()
        },
        'bloodbank@mediroutex.com:blood1234': {
          id: 'blood-bank-1',
          email: 'bloodbank@mediroutex.com',
          name: 'Metro Blood Center',
          phone: '+91-9777700000',
          role: 'blood_bank',
          status: 'active',
          created_at: new Date().toISOString()
        },
      };

      const key = `${credentials.email}:${credentials.password}`;
      const mockUser = mockUsers[key];

      if (mockUser) {
        setTokens('mock-access-token', 'mock-refresh-token');
        setCurrentUser(mockUser);
        toast.success(`Welcome, ${mockUser.name}! (Mock Mode)`);
        return mockUser;
      }

      // If wrong credentials, throw error
      toast.error('Invalid credentials');
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
      const token = getAccessToken();
      if (token && !token.startsWith('mock-')) {
        await authApi.post('/auth/logout');
      }
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
    const token = getAccessToken();
    const current = getCurrentUser();

    if (token?.startsWith('mock-') && current) {
      return current;
    }

    try {
      const response = await apiCall<User>(
        authApi.get('/auth/me'),
        { silent: true }
      );

      setCurrentUser(response);
      return response;
    } catch (error) {
      if (current) return current;
      throw error;
    }
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
