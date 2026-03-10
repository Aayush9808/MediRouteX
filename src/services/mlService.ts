/**
 * ML Prediction Service
 * Handles demand forecasting, resource optimization, and response time prediction
 */

import { mlApi, apiCall } from './api';

export interface DemandPrediction {
  timestamp: string;
  predicted_demand: number;
  confidence: number;
  severity_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  predicted_demand: number;
}

export interface ResourceRecommendation {
  ambulance_id: string;
  current_location: { latitude: number; longitude: number };
  recommended_location: { latitude: number; longitude: number };
  distance_km: number;
  priority: number;
  estimated_demand: number;
  reason: string;
}

export interface ResponseTimePrediction {
  predicted_minutes: number;
  confidence: number;
  factors: {
    distance: number;
    traffic: number;
    time_of_day: number;
    severity: number;
  };
  historical_average_minutes: number;
  comparison: string;
}

class MLService {
  /**
   * Get demand predictions
   */
  async predictDemand(
    latitude: number,
    longitude: number,
    forecastHours: number = 24
  ): Promise<{
    predictions: DemandPrediction[];
    total_predicted: number;
    peak_time: string;
    peak_demand: number;
  }> {
    return apiCall(
      mlApi.post('/ml/predict/demand', {
        latitude,
        longitude,
        forecast_hours: forecastHours
      }),
      { silent: true }
    );
  }

  /**
   * Get demand heatmap
   */
  async getHeatmap(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    resolution: number = 50
  ): Promise<HeatmapPoint[]> {
    const response = await apiCall<{ heatmap: HeatmapPoint[] }>(
      mlApi.post('/ml/predict/heatmap', {
        bounds,
        resolution
      }),
      { silent: true }
    );
    return response.heatmap;
  }

  /**
   * Get resource optimization recommendations
   */
  async optimizeResources(
    ambulances: Array<{
      id: string;
      latitude: number;
      longitude: number;
      status: string;
    }>,
    emergencies: Array<{
      latitude: number;
      longitude: number;
      severity: string;
      status: string;
    }>
  ): Promise<{
    recommendations: ResourceRecommendation[];
    current_coverage: number;
    optimal_coverage: number;
    expected_demand_reduction: number;
  }> {
    return apiCall(
      mlApi.post('/ml/optimize/resources', {
        ambulances,
        emergencies
      }),
      { silent: true }
    );
  }

  /**
   * Predict response time
   */
  async predictResponseTime(
    emergencyLocation: { latitude: number; longitude: number },
    ambulanceLocation: { latitude: number; longitude: number },
    severity: string,
    trafficLevel: number = 1.0
  ): Promise<ResponseTimePrediction> {
    return apiCall<ResponseTimePrediction>(
      mlApi.post('/ml/predict/response-time', {
        emergency_location: emergencyLocation,
        ambulance_location: ambulanceLocation,
        severity,
        traffic_level: trafficLevel
      }),
      { silent: true }
    );
  }

  /**
   * Train ML model
   */
  async trainModel(modelType: 'demand' | 'response_time', daysHistory: number = 90): Promise<{
    model_type: string;
    accuracy: number;
    samples_used: number;
    training_time_seconds: number;
    status: string;
  }> {
    return apiCall(
      mlApi.post(`/ml/train/${modelType}`, {
        days_history: daysHistory
      }),
      { successMessage: `${modelType} model trained successfully!` }
    );
  }

  /**
   * Get ML statistics
   */
  async getStats(): Promise<any> {
    return apiCall(
      mlApi.get('/ml/stats'),
      { silent: true }
    );
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    database: boolean;
    redis: boolean;
    models_loaded: number;
  }> {
    return apiCall(
      mlApi.get('/ml/health'),
      { silent: true }
    );
  }
}

export const mlService = new MLService();
