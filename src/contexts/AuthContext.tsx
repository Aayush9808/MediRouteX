/**
 * Authentication Context
 * Manages user authentication state and operations
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { authService, User, LoginCredentials, RegisterData, websocketService, isRequestCanceled } from '../services';
import toast from 'react-hot-toast';
import { normalizeRole } from '../utils/roles';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const initAbortRef = useRef<AbortController | null>(null);

  const safeSetUser = (value: User | null) => {
    if (isMountedRef.current) {
      setUser(value);
    }
  };

  const safeSetIsLoading = (value: boolean) => {
    if (isMountedRef.current) {
      setIsLoading(value);
    }
  };

  // Initialize - Check if user is already logged in
  useEffect(() => {
    isMountedRef.current = true;
    initAbortRef.current?.abort();
    const controller = new AbortController();
    initAbortRef.current = controller;

    const initializeAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        
        if (currentUser) {
          // Verify token is still valid by fetching profile
          const profile = await authService.getProfile(controller.signal);
          if (controller.signal.aborted) return;

          safeSetUser(profile);
          
          // Connect WebSocket
          websocketService.connect(normalizeRole(profile.role));
        }
      } catch (error) {
        if (isRequestCanceled(error)) {
          return;
        }

        console.error('Auth initialization error:', error);
        // Token expired or invalid - clear storage
        authService.logout();
        safeSetUser(null);
      } finally {
        if (!controller.signal.aborted) {
          safeSetIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMountedRef.current = false;
      controller.abort();
      websocketService.disconnect();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    safeSetIsLoading(true);
    try {
      const loggedInUser = await authService.login(credentials);
      safeSetUser(loggedInUser);
      
      // Connect WebSocket after login
      websocketService.connect(normalizeRole(loggedInUser.role));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      safeSetIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    safeSetIsLoading(true);
    try {
      const newUser = await authService.register(data);
      safeSetUser(newUser);
      
      // Connect WebSocket after registration
      websocketService.connect(normalizeRole(newUser.role));
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      safeSetIsLoading(false);
    }
  };

  const logout = async () => {
    safeSetIsLoading(true);
    try {
      await authService.logout();
      safeSetUser(null);
      
      // Disconnect WebSocket
      websocketService.disconnect();
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      safeSetIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      safeSetUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getProfile();
      safeSetUser(profile);
    } catch (error) {
      console.error('Refresh profile error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
