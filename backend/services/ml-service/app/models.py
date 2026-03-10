"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum


class SeverityLevel(str, Enum):
    """Emergency severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TimeGranularity(str, Enum):
    """Time granularity for predictions"""
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"


# ==================== Demand Prediction ====================

class DemandPredictionRequest(BaseModel):
    """Request for demand prediction"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(default=10.0, gt=0, le=50)
    forecast_hours: int = Field(default=24, gt=0, le=168)
    granularity: TimeGranularity = TimeGranularity.HOURLY


class DemandPrediction(BaseModel):
    """Single demand prediction"""
    timestamp: datetime
    predicted_count: float
    confidence: float
    severity_distribution: Dict[str, float]


class DemandPredictionResponse(BaseModel):
    """Response with demand predictions"""
    location: Dict[str, float]
    radius_km: float
    predictions: List[DemandPrediction]
    total_predicted: float
    peak_time: datetime
    peak_demand: float
    generated_at: datetime


# ==================== Heatmap ====================

class HeatmapRequest(BaseModel):
    """Request for demand heatmap"""
    bounds: Dict[str, float] = Field(
        ...,
        description="Map bounds: {north, south, east, west}"
    )
    timestamp: Optional[datetime] = None
    resolution: int = Field(default=50, ge=10, le=200)


class HeatmapPoint(BaseModel):
    """Single heatmap point"""
    latitude: float
    longitude: float
    intensity: float
    predicted_count: int


class HeatmapResponse(BaseModel):
    """Response with heatmap data"""
    points: List[HeatmapPoint]
    timestamp: datetime
    total_predicted: int
    max_intensity: float
    generated_at: datetime


# ==================== Resource Optimization ====================

class ResourceOptimizationRequest(BaseModel):
    """Request for resource optimization"""
    current_ambulances: List[Dict[str, any]]
    current_emergencies: List[Dict[str, any]]
    forecast_hours: int = Field(default=4, gt=0, le=24)


class AmbulanceRecommendation(BaseModel):
    """Recommendation for ambulance positioning"""
    ambulance_id: str
    current_location: Dict[str, float]
    recommended_location: Dict[str, float]
    reason: str
    priority: int
    estimated_demand: float


class ResourceOptimizationResponse(BaseModel):
    """Response with optimization recommendations"""
    recommendations: List[AmbulanceRecommendation]
    total_ambulances: int
    optimal_coverage: float
    expected_demand: float
    generated_at: datetime


# ==================== Response Time Prediction ====================

class ResponseTimePrediction(BaseModel):
    """Predicted response time"""
    emergency_location: Dict[str, float]
    predicted_response_minutes: float
    confidence: float
    factors: Dict[str, float]


class ResponseTimePredictionResponse(BaseModel):
    """Response with response time prediction"""
    prediction: ResponseTimePrediction
    historical_average: float
    comparison: str
    generated_at: datetime


# ==================== Training ====================

class TrainingRequest(BaseModel):
    """Request to train models"""
    model_type: str = Field(..., description="Type of model to train")
    force_retrain: bool = False
    training_days: Optional[int] = None


class TrainingStatus(BaseModel):
    """Training status response"""
    model_type: str
    status: str
    accuracy: Optional[float] = None
    samples_used: Optional[int] = None
    training_time_seconds: Optional[float] = None
    last_trained: Optional[datetime] = None
    error: Optional[str] = None


# ==================== Statistics ====================

class MLStatistics(BaseModel):
    """ML service statistics"""
    total_predictions: int
    total_training_runs: int
    models_trained: List[str]
    average_accuracy: float
    cache_hit_rate: float
    uptime_seconds: float


# ==================== Health Check ====================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    timestamp: datetime
    database: str
    redis: str
    models_loaded: int
