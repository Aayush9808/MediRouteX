import { createClient } from 'redis';
import logger from '../utils/logger';

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis reconnection attempts exceeded');
        return new Error('Redis reconnection failed');
      }
      const delay = Math.min(retries * 100, 3000);
      logger.info(`Reconnecting to Redis in ${delay}ms...`);
      return delay;
    },
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0'),
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error', { error: err });
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis client reconnecting...');
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    throw error;
  }
};

// Cache helpers
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Cache get error', { key, error });
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: any,
  ttlSeconds: number = 300
): Promise<boolean> => {
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error('Cache set error', { key, error });
    return false;
  }
};

export const cacheDelete = async (key: string): Promise<boolean> => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error', { key, error });
    return false;
  }
};

export const cacheInvalidatePattern = async (pattern: string): Promise<number> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;
    return await redisClient.del(keys);
  } catch (error) {
    logger.error('Cache invalidate pattern error', { pattern, error });
    return 0;
  }
};

// Ambulance location cache helpers
export const cacheAmbulanceLocation = async (
  ambulanceId: string,
  location: { lat: number; lng: number },
  ttlSeconds: number = 60
): Promise<boolean> => {
  return cacheSet(`ambulance:location:${ambulanceId}`, location, ttlSeconds);
};

export const getCachedAmbulanceLocation = async (
  ambulanceId: string
): Promise<{ lat: number; lng: number } | null> => {
  return cacheGet<{ lat: number; lng: number }>(`ambulance:location:${ambulanceId}`);
};

export default redisClient;
