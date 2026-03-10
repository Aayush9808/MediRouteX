"""
Redis client for caching
"""

import redis.asyncio as redis
from typing import Optional
from app.config import settings
from loguru import logger
import json


class RedisClient:
    """Redis cache manager"""
    
    def __init__(self):
        self.client: Optional[redis.Redis] = None
    
    async def connect(self):
        """Connect to Redis"""
        try:
            self.client = await redis.from_url(
                f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}",
                password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                encoding="utf-8",
                decode_responses=True
            )
            await self.client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.client:
            await self.client.close()
            logger.info("Redis connection closed")
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from cache"""
        try:
            return await self.client.get(key)
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None
    
    async def set(self, key: str, value: str, ttl: int = None):
        """Set value in cache"""
        try:
            if ttl:
                await self.client.setex(key, ttl, value)
            else:
                await self.client.set(key, value)
        except Exception as e:
            logger.error(f"Redis set error: {e}")
    
    async def get_json(self, key: str):
        """Get JSON value from cache"""
        value = await self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return None
        return None
    
    async def set_json(self, key: str, value: dict, ttl: int = None):
        """Set JSON value in cache"""
        try:
            json_str = json.dumps(value)
            await self.set(key, json_str, ttl)
        except Exception as e:
            logger.error(f"Redis set JSON error: {e}")
    
    async def delete(self, key: str):
        """Delete key from cache"""
        try:
            await self.client.delete(key)
        except Exception as e:
            logger.error(f"Redis delete error: {e}")


# Global Redis client
redis_client = RedisClient()
