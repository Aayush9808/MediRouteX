/**
 * API Configuration and Base Client
 * Centralized API configuration with interceptors
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

export interface ApiCallOptions {
  successMessage?: string;
  errorMessage?: string;
  silent?: boolean;
}

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryOnStatuses?: number[];
}

interface ApiRuntimeMetrics {
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  canceledRequests: number;
  retriedRequests: number;
  totalLatencyMs: number;
  byService: Record<string, number>;
  byStatus: Record<string, number>;
  lastError?: {
    message: string;
    status?: number;
    at: string;
  };
}

export interface ApiMetricsSnapshot {
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  canceledRequests: number;
  retriedRequests: number;
  avgLatencyMs: number;
  successRate: number;
  byService: Record<string, number>;
  byStatus: Record<string, number>;
  lastError?: {
    message: string;
    status?: number;
    at: string;
  };
}

const apiMetrics: ApiRuntimeMetrics = {
  totalRequests: 0,
  successRequests: 0,
  failedRequests: 0,
  canceledRequests: 0,
  retriedRequests: 0,
  totalLatencyMs: 0,
  byService: {},
  byStatus: {},
};

const API_DEBUG_ENABLED = import.meta.env.DEV && import.meta.env.VITE_ENABLE_API_DEBUG === 'true';

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const getServiceName = (baseURL?: string) => {
  if (!baseURL) return 'unknown';
  if (baseURL.includes(':5001')) return 'emergency';
  if (baseURL.includes(':5002')) return 'ambulance';
  if (baseURL.includes(':5003')) return 'hospital';
  if (baseURL.includes(':5004')) return 'auth';
  if (baseURL.includes(':5005')) return 'routing';
  if (baseURL.includes(':5006')) return 'ml';
  return 'custom';
};

const recordMetric = (params: {
  baseURL?: string;
  status?: number;
  durationMs?: number;
  isSuccess: boolean;
  isCanceled?: boolean;
  errorMessage?: string;
}) => {
  apiMetrics.totalRequests += 1;

  if (params.isCanceled) {
    apiMetrics.canceledRequests += 1;
  } else if (params.isSuccess) {
    apiMetrics.successRequests += 1;
  } else {
    apiMetrics.failedRequests += 1;
    apiMetrics.lastError = {
      message: params.errorMessage || 'Unknown error',
      status: params.status,
      at: new Date().toISOString(),
    };
  }

  if (typeof params.durationMs === 'number' && Number.isFinite(params.durationMs)) {
    apiMetrics.totalLatencyMs += Math.max(0, params.durationMs);
  }

  const service = getServiceName(params.baseURL);
  apiMetrics.byService[service] = (apiMetrics.byService[service] || 0) + 1;

  const statusKey = String(params.status ?? (params.isCanceled ? 'canceled' : 'network'));
  apiMetrics.byStatus[statusKey] = (apiMetrics.byStatus[statusKey] || 0) + 1;

  if (API_DEBUG_ENABLED && !params.isSuccess && !params.isCanceled) {
    console.warn('[api-metrics] request failed', {
      service,
      status: params.status,
      error: params.errorMessage,
      totalRequests: apiMetrics.totalRequests,
    });
  }
};

export const getApiMetrics = (): ApiMetricsSnapshot => {
  const completed = apiMetrics.successRequests + apiMetrics.failedRequests + apiMetrics.canceledRequests;
  const avgLatencyMs = completed > 0 ? Number((apiMetrics.totalLatencyMs / completed).toFixed(2)) : 0;
  const successRate = completed > 0 ? Number(((apiMetrics.successRequests / completed) * 100).toFixed(2)) : 0;

  return {
    totalRequests: apiMetrics.totalRequests,
    successRequests: apiMetrics.successRequests,
    failedRequests: apiMetrics.failedRequests,
    canceledRequests: apiMetrics.canceledRequests,
    retriedRequests: apiMetrics.retriedRequests,
    avgLatencyMs,
    successRate,
    byService: { ...apiMetrics.byService },
    byStatus: { ...apiMetrics.byStatus },
    lastError: apiMetrics.lastError,
  };
};

export const resetApiMetrics = () => {
  apiMetrics.totalRequests = 0;
  apiMetrics.successRequests = 0;
  apiMetrics.failedRequests = 0;
  apiMetrics.canceledRequests = 0;
  apiMetrics.retriedRequests = 0;
  apiMetrics.totalLatencyMs = 0;
  apiMetrics.byService = {};
  apiMetrics.byStatus = {};
  apiMetrics.lastError = undefined;
};

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
      (config as any).__requestStartedAt = nowMs();
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
    (response) => {
      const startedAt = (response.config as any).__requestStartedAt as number | undefined;
      const durationMs = typeof startedAt === 'number' ? nowMs() - startedAt : undefined;

      recordMetric({
        baseURL: response.config.baseURL,
        status: response.status,
        durationMs,
        isSuccess: true,
      });

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      const startedAt = (originalRequest as any)?.__requestStartedAt as number | undefined;
      const durationMs = typeof startedAt === 'number' ? nowMs() - startedAt : undefined;
      const canceled = isRequestCanceled(error);

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

      recordMetric({
        baseURL: originalRequest?.baseURL,
        status: error.response?.status,
        durationMs,
        isSuccess: false,
        isCanceled: canceled,
        errorMessage: error.message,
      });

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
        (error as any).__toastShown = true;
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

const DEFAULT_RETRY_STATUSES = [408, 425, 429, 500, 502, 503, 504];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isRequestCanceled = (error: any): boolean => {
  return axios.isCancel(error) || error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';
};

const shouldRetryRequest = (
  error: any,
  attempt: number,
  retries: number,
  retryOnStatuses: number[]
): boolean => {
  if (attempt >= retries || isRequestCanceled(error)) return false;

  const status = error?.response?.status;
  if (typeof status === 'number') {
    return retryOnStatuses.includes(status);
  }

  // Retry network/transient errors without HTTP response
  return !error?.response;
};

/**
 * Generic API call wrapper with error handling
 */
export const apiCall = async <T>(
  promise: Promise<any>,
  options?: ApiCallOptions
): Promise<T> => {
  try {
    const response = await promise;
    
    if (options?.successMessage && !options.silent) {
      toast.success(options.successMessage);
    }
    
    return response.data.data || response.data;
  } catch (error: any) {
    const errorMsg = options?.errorMessage || error?.response?.data?.error || error?.message || 'An error occurred';
    const isNetworkIssue = !error?.response;
    const shouldShowToast = !options?.silent && !error?.__toastShown && !isNetworkIssue;
    
    if (shouldShowToast) {
      toast.error(errorMsg);
    }
    
    throw error;
  }
};

/**
 * API call wrapper with retry/backoff for transient failures.
 * Useful for background refresh/initial dashboard hydration.
 */
export const apiCallWithRetry = async <T>(
  requestFactory: () => Promise<any>,
  options?: ApiCallOptions,
  retryOptions?: RetryOptions
): Promise<T> => {
  const retries = retryOptions?.retries ?? 2;
  const baseDelayMs = retryOptions?.baseDelayMs ?? 350;
  const maxDelayMs = retryOptions?.maxDelayMs ?? 2500;
  const retryOnStatuses = retryOptions?.retryOnStatuses ?? DEFAULT_RETRY_STATUSES;

  let attempt = 0;

  while (true) {
    try {
      const response = await requestFactory();

      if (options?.successMessage && !options.silent) {
        toast.success(options.successMessage);
      }

      return response.data.data || response.data;
    } catch (error: any) {
      if (shouldRetryRequest(error, attempt, retries, retryOnStatuses)) {
        apiMetrics.retriedRequests += 1;
        const backoff = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
        const jitter = Math.floor(Math.random() * 120);
        await sleep(backoff + jitter);
        attempt += 1;
        continue;
      }

      if (isRequestCanceled(error)) {
        throw error;
      }

      const errorMsg = options?.errorMessage || error?.response?.data?.error || error?.message || 'An error occurred';
      const isNetworkIssue = !error?.response;
      const shouldShowToast = !options?.silent && !error?.__toastShown && !isNetworkIssue;

      if (shouldShowToast) {
        toast.error(errorMsg);
      }

      throw error;
    }
  }
};
