/**
 * API Configuration and Base Client
 * Centralized API configuration with interceptors
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const normalizeServiceUrl = (rawUrl: string, fallback: string) => {
  const url = (rawUrl || '').trim() || fallback;
  return /\/api\/v\d+$/i.test(url) ? url : `${url.replace(/\/$/, '')}/api/v1`;
};

// API Base URLs
export const API_CONFIG = {
  EMERGENCY_SERVICE: normalizeServiceUrl(import.meta.env.VITE_EMERGENCY_SERVICE_URL, 'http://localhost:5001/api/v1'),
  AMBULANCE_SERVICE: normalizeServiceUrl(import.meta.env.VITE_AMBULANCE_SERVICE_URL, 'http://localhost:5002/api/v1'),
  HOSPITAL_SERVICE: normalizeServiceUrl(import.meta.env.VITE_HOSPITAL_SERVICE_URL, 'http://localhost:5003/api/v1'),
  AUTH_SERVICE: normalizeServiceUrl(import.meta.env.VITE_AUTH_SERVICE_URL, 'http://localhost:5004/api/v1'),
  ROUTING_SERVICE: normalizeServiceUrl(import.meta.env.VITE_ROUTING_SERVICE_URL, 'http://localhost:5005/api/v1'),
  ML_SERVICE: normalizeServiceUrl(import.meta.env.VITE_ML_SERVICE_URL, 'http://localhost:5006/api/v1'),
};

// Token management
export const TOKEN_KEY = 'mediroutex_access_token';
export const REFRESH_TOKEN_KEY = 'mediroutex_refresh_token';
export const USER_KEY = 'mediroutex_user';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: any) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Create axios instance with interceptors
 */
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle errors
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Handle 401 - Token expired
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh token
          const refreshToken = getRefreshToken();
          if (refreshToken) {
            const response = await axios.post(`${API_CONFIG.AUTH_SERVICE}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            const { access_token } = response.data.data;
            setTokens(access_token, refreshToken);

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - logout user
          clearTokens();
          window.location.href = '/';
          toast.error('Session expired. Please login again.');
          return Promise.reject(refreshError);
        }
      }

      // Handle other errors
      const responseData = error.response?.data as { error?: string; message?: string } | undefined;
      const errorMessage = responseData?.error || responseData?.message || error.message || 'An error occurred';
      
      // Don't show toast for certain routes (like initial data fetching)
      const isNetworkIssue = !error.response;
      const shouldSilence =
        isNetworkIssue ||
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/me') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/logout') ||
        originalRequest.url?.includes('/health') ||
        originalRequest.url?.includes('/active') ||
        originalRequest.url?.includes('/ambulance') ||
        originalRequest.url?.includes('/hospitals');

      if (!shouldSilence) {
        toast.error(errorMessage);
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Create API clients for each service
export const emergencyApi = createApiClient(API_CONFIG.EMERGENCY_SERVICE);
export const ambulanceApi = createApiClient(API_CONFIG.AMBULANCE_SERVICE);
export const hospitalApi = createApiClient(API_CONFIG.HOSPITAL_SERVICE);
export const authApi = createApiClient(API_CONFIG.AUTH_SERVICE);
export const routingApi = createApiClient(API_CONFIG.ROUTING_SERVICE);
export const mlApi = createApiClient(API_CONFIG.ML_SERVICE);

/**
 * Generic API call wrapper with error handling
 */
export const apiCall = async <T>(
  promise: Promise<any>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    silent?: boolean;
  }
): Promise<T> => {
  try {
    const response = await promise;
    
    if (options?.successMessage && !options.silent) {
      toast.success(options.successMessage);
    }
    
    return response.data.data || response.data;
  } catch (error: any) {
    const errorMsg = options?.errorMessage || error?.response?.data?.error || error?.message || 'An error occurred';
    
    if (!options?.silent) {
      toast.error(errorMsg);
    }
    
    throw error;
  }
};
