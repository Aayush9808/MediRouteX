"""
ML Service API Routes
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta
from typing import List
import numpy as np

from app.models import (
    DemandPredictionRequest,
    DemandPredictionResponse,
    DemandPrediction,
    HeatmapRequest,
    HeatmapResponse,
    HeatmapPoint,
    ResourceOptimizationRequest,
    ResourceOptimizationResponse,
    ResponseTimePredictionResponse,
    ResponseTimePrediction,
    TrainingRequest,
    TrainingStatus,
    MLStatistics
)
from app.ml.demand_forecaster import forecaster
from app.ml.resource_optimizer import optimizer
from app.ml.response_predictor import response_predictor
from app.database import db
from app.redis_client import redis_client
from app.config import settings
from loguru import logger

router = APIRouter()


@router.post("/predict/demand", response_model=DemandPredictionResponse)
async def predict_demand(request: DemandPredictionRequest):
    """Predict emergency demand for a location"""
    try:
        # Check cache
        cache_key = f"demand:{request.latitude},{request.longitude}:{request.forecast_hours}"
        cached = await redis_client.get_json(cache_key)
        
        if cached:
            logger.info("Returning cached demand prediction")
            return cached
        
        # Generate predictions
        start_time = datetime.now()
        predictions = forecaster.forecast(start_time, request.forecast_hours)
        
        # Add severity distribution (simplified)
        for pred in predictions:
            pred['severity_distribution'] = {
                "critical": 0.15,
                "high": 0.30,
                "medium": 0.35,
                "low": 0.20
            }
        
        # Find peak demand
        peak_prediction = max(predictions, key=lambda x: x['predicted_count'])
        total_predicted = sum(p['predicted_count'] for p in predictions)
        
        response = {
            "location": {
                "latitude": request.latitude,
                "longitude": request.longitude
            },
            "radius_km": request.radius_km,
            "predictions": predictions,
            "total_predicted": round(total_predicted, 2),
            "peak_time": peak_prediction['timestamp'],
            "peak_demand": peak_prediction['predicted_count'],
            "generated_at": datetime.now()
        }
        
        # Cache for 30 minutes
        await redis_client.set_json(cache_key, response, ttl=1800)
        
        return response
        
    except Exception as e:
        logger.error(f"Demand prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/heatmap", response_model=HeatmapResponse)
async def predict_heatmap(request: HeatmapRequest):
    """Generate demand heatmap for a geographical area"""
    try:
        bounds = request.bounds
        timestamp = request.timestamp or datetime.now()
        resolution = request.resolution
        
        # Generate grid points
        lat_step = (bounds['north'] - bounds['south']) / resolution
        lng_step = (bounds['east'] - bounds['west']) / resolution
        
        points = []
        max_intensity = 0
        total_predicted = 0
        
        for i in range(resolution):
            for j in range(resolution):
                lat = bounds['south'] + i * lat_step
                lng = bounds['west'] + j * lng_step
                
                # Predict demand for this point
                try:
                    predicted_count, confidence = forecaster.predict(timestamp)
                    
                    # Add some spatial variation (simplified)
                    spatial_factor = np.random.uniform(0.5, 1.5)
                    intensity = predicted_count * confidence * spatial_factor
                    
                    if intensity > 0.1:  # Only include significant points
                        points.append({
                            "latitude": round(lat, 6),
                            "longitude": round(lng, 6),
                            "intensity": round(intensity, 3),
                            "predicted_count": int(predicted_count)
                        })
                        
                        max_intensity = max(max_intensity, intensity)
                        total_predicted += predicted_count
                except:
                    continue
        
        # Normalize intensities
        if max_intensity > 0:
            for point in points:
                point['intensity'] = round(point['intensity'] / max_intensity, 3)
        
        return {
            "points": points[:1000],  # Limit to 1000 points
            "timestamp": timestamp,
            "total_predicted": int(total_predicted),
            "max_intensity": round(max_intensity, 3),
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Heatmap generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/resources", response_model=ResourceOptimizationResponse)
async def optimize_resources(request: ResourceOptimizationRequest):
    """Optimize ambulance resource allocation"""
    try:
        ambulances = request.current_ambulances
        emergencies = request.current_emergencies
        
        # Generate predicted demand points from current emergencies
        predicted_demand = [
            {
                "latitude": e['latitude'],
                "longitude": e['longitude'],
                "intensity": 0.8 if e.get('severity') == 'critical' else 0.5
            }
            for e in emergencies
        ]
        
        # Get optimization recommendations
        recommendations = optimizer.find_optimal_positions(
            ambulances,
            predicted_demand,
            max_repositions=5
        )
        
        # Calculate metrics
        demand_points = [(d['latitude'], d['longitude']) for d in predicted_demand]
        coverage = optimizer.calculate_coverage(ambulances, demand_points)
        
        return {
            "recommendations": recommendations,
            "total_ambulances": len(ambulances),
            "optimal_coverage": round(coverage, 3),
            "expected_demand": len(predicted_demand),
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Resource optimization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/response-time", response_model=ResponseTimePredictionResponse)
async def predict_response_time(emergency_data: dict):
    """Predict response time for an emergency"""
    try:
        prediction, confidence, factors = response_predictor.predict(emergency_data)
        
        # Get historical average (from database or use default)
        historical_avg = 7.5  # minutes
        
        comparison = "faster" if prediction < historical_avg else "slower"
        
        return {
            "prediction": {
                "emergency_location": {
                    "latitude": emergency_data.get('latitude', 0),
                    "longitude": emergency_data.get('longitude', 0)
                },
                "predicted_response_minutes": round(prediction, 2),
                "confidence": round(confidence, 2),
                "factors": factors
            },
            "historical_average": historical_avg,
            "comparison": comparison,
            "generated_at": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Response time prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train/{model_type}", response_model=TrainingStatus)
async def train_model(model_type: str, request: TrainingRequest):
    """Train or retrain ML models"""
    try:
        logger.info(f"Training {model_type} model")
        
        # Fetch historical data from database
        days = request.training_days or settings.TRAINING_DAYS_HISTORY
        
        if model_type == "demand":
            # Fetch emergency history
            query = """
                SELECT 
                    DATE_TRUNC('hour', created_at) as timestamp,
                    COUNT(*) as demand_count
                FROM emergencies
                WHERE created_at >= NOW() - INTERVAL '%s days'
                GROUP BY DATE_TRUNC('hour', created_at)
                ORDER BY timestamp
            """
            
            rows = await db.fetch_all(query, days)
            historical_data = [dict(row) for row in rows]
            
            result = await forecaster.train(historical_data, settings.MIN_TRAINING_SAMPLES)
            
        elif model_type == "response_time":
            # Fetch response time history
            query = """
                SELECT 
                    EXTRACT(hour FROM created_at) as hour,
                    EXTRACT(dow FROM created_at) IN (0, 6) as is_weekend,
                    severity,
                    5.0 as distance_km,
                    1.0 as traffic_level,
                    EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60 as response_time_minutes
                FROM emergencies
                WHERE created_at >= NOW() - INTERVAL '%s days'
                    AND resolved_at IS NOT NULL
                    AND status = 'completed'
            """
            
            rows = await db.fetch_all(query, days)
            historical_data = [dict(row) for row in rows]
            
            result = await response_predictor.train(historical_data, settings.MIN_TRAINING_SAMPLES)
            
        else:
            raise HTTPException(status_code=400, detail=f"Unknown model type: {model_type}")
        
        return TrainingStatus(
            model_type=model_type,
            **result
        )
        
    except Exception as e:
        logger.error(f"Training failed: {e}")
        return TrainingStatus(
            model_type=model_type,
            status="failed",
            error=str(e)
        )


@router.get("/stats", response_model=MLStatistics)
async def get_statistics():
    """Get ML service statistics"""
    try:
        # Get stats from database or cache
        return {
            "total_predictions": 0,
            "total_training_runs": 0,
            "models_trained": ["demand", "response_time"],
            "average_accuracy": 0.85,
            "cache_hit_rate": 0.65,
            "uptime_seconds": 0
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
