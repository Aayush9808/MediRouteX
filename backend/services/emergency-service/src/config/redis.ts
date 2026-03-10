import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

redisClient.on('error', (err) => {
  logger.error('Redis error', err);
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis', error);
    throw error;
  }
};

// Cache helpers
export const cacheGet = async (key: string): Promise<any | null> => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Redis GET error for key: ${key}`, error);
    return null;
  }
};

export const cacheSet = async (key: string, value: any, expirationSeconds: number = 300): Promise<void> => {
  try {
    await redisClient.setEx(key, expirationSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error(`Redis SET error for key: ${key}`, error);
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error(`Redis DELETE error for key: ${key}`, error);
  }
};

export const cacheInvalidatePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.error(`Redis pattern invalidation error: ${pattern}`, error);
  }
};

export default redisClient;
