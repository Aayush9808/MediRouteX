"""
ML Service Main Application
FastAPI app for machine learning predictions
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime
import time

from app.config import settings
from app.database import db
from app.redis_client import redis_client
from app.routes import router
from loguru import logger
import sys

# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL
)
logger.add(
    settings.LOG_FILE,
    rotation="500 MB",
    retention="10 days",
    level=settings.LOG_LEVEL
)


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("Starting ML Service...")
    
    try:
        await db.connect()
        await redis_client.connect()
        logger.info("All connections established")
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down ML Service...")
    await db.disconnect()
    await redis_client.disconnect()
    logger.info("All connections closed")


# Create FastAPI app
app = FastAPI(
    title="MediRouteX ML Service",
    description="Machine Learning service for emergency demand prediction and resource optimization",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s"
    )
    
    return response


# Include routers
app.include_router(router, prefix=f"/api/{settings.API_VERSION}/ml", tags=["ML Predictions"])


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "MediRouteX ML Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "demand_prediction": f"/api/{settings.API_VERSION}/ml/predict/demand",
            "heatmap": f"/api/{settings.API_VERSION}/ml/predict/heatmap",
            "resource_optimization": f"/api/{settings.API_VERSION}/ml/optimize/resources",
            "response_time": f"/api/{settings.API_VERSION}/ml/predict/response-time",
            "training": f"/api/{settings.API_VERSION}/ml/train/{{model_type}}",
            "statistics": f"/api/{settings.API_VERSION}/ml/stats"
        },
        "documentation": "/docs"
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database
        await db.fetch_one("SELECT 1")
        db_status = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "disconnected"
    
    try:
        # Check Redis
        await redis_client.client.ping()
        redis_status = "connected"
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        redis_status = "disconnected"
    
    # Count loaded models
    from app.ml.demand_forecaster import forecaster
    from app.ml.response_predictor import response_predictor
    
    models_loaded = sum([
        forecaster.is_trained,
        response_predictor.is_trained
    ])
    
    healthy = db_status == "connected" and redis_status == "connected"
    
    return {
        "status": "healthy" if healthy else "unhealthy",
        "service": "ml-service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "database": db_status,
        "redis": redis_status,
        "models_loaded": models_loaded
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.ENVIRONMENT == "development" else None
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    logger.info("=" * 50)
    logger.info("🤖 MediRouteX ML Service Starting")
    logger.info("=" * 50)
    logger.info(f"Host: {settings.HOST}")
    logger.info(f"Port: {settings.PORT}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"API Version: {settings.API_VERSION}")
    logger.info("=" * 50)
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development"
    )
