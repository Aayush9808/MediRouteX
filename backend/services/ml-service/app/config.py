"""
Configuration settings for ML Service
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # Server
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 5006
    API_VERSION: str = "v1"
    
    # Database
    DATABASE_URL: str = "postgresql://mediroutex:mediroutex_password@localhost:5432/mediroutex_db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0
    REDIS_CACHE_TTL: int = 3600
    
    # JWT
    JWT_SECRET: str = "your-super-secret-jwt-key"
    JWT_ALGORITHM: str = "HS256"
    
    # ML Models
    MODEL_CACHE_DIR: str = "./models"
    MODEL_UPDATE_INTERVAL_HOURS: int = 24
    PREDICTION_CONFIDENCE_THRESHOLD: float = 0.7
    
    # Training
    TRAINING_DAYS_HISTORY: int = 90
    MIN_TRAINING_SAMPLES: int = 100
    AUTO_RETRAIN_ENABLED: bool = True
    RETRAIN_INTERVAL_DAYS: int = 7
    
    # Predictions
    FORECAST_HORIZON_HOURS: int = 24
    DEMAND_GRID_SIZE_KM: float = 5.0
    HEATMAP_RESOLUTION: float = 0.01  # Changed to float
    
    # External Services
    EMERGENCY_SERVICE_URL: str = "http://localhost:5001"
    AMBULANCE_SERVICE_URL: str = "http://localhost:5002"
    HOSPITAL_SERVICE_URL: str = "http://localhost:5003"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/ml-service.log"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env


settings = Settings()
