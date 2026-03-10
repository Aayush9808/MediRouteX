/**
 * Routing Service
 * Handles route calculation and navigation
 */

import { routingApi, apiCall } from './api';

export interface RouteRequest {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  waypoints?: Array<{
    latitude: number;
    longitude: number;
  }>;
  optimize_for?: 'time' | 'distance' | 'traffic';
  vehicle_type?: string;
}

export interface Route {
  id: string;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  distance_km: number;
  duration_minutes: number;
  traffic_level: string;
  quality_score: number;
  segments: RouteSegment[];
  created_at: string;
}

export interface RouteSegment {
  start_location: { latitude: number; longitude: number };
  end_location: { latitude: number; longitude: number };
  distance_km: number;
  duration_minutes: number;
  instruction: string;
  road_name?: string;
}

export interface OptimizedRoute {
  ambulance_to_patient: Route;
  patient_to_hospital: Route;
  total_distance_km: number;
  total_duration_minutes: number;
  estimated_arrival_time: string;
}

export interface ETACalculation {
  distance_km: number;
  estimated_duration_minutes: number;
  estimated_arrival_time: string;
  traffic_delay_minutes: number;
  confidence_score: number;
}

class RoutingService {
  /**
   * Calculate route between two points
   */
  async calculateRoute(request: RouteRequest): Promise<Route> {
    return apiCall<Route>(
      routingApi.post('/routes/calculate', request),
      { silent: true }
    );
  }

  /**
   * Calculate optimized emergency route (3-leg)
   */
  async calculateOptimizedRoute(
    ambulanceLocation: { latitude: number; longitude: number },
    patientLocation: { latitude: number; longitude: number },
    hospitalLocation: { latitude: number; longitude: number }
  ): Promise<OptimizedRoute> {
    return apiCall<OptimizedRoute>(
      routingApi.post('/routes/optimize', {
        ambulance_location: ambulanceLocation,
        patient_location: patientLocation,
        hospital_location: hospitalLocation
      }),
      { silent: true }
    );
  }

  /**
   * Get alternative routes
   */
  async getAlternatives(request: RouteRequest): Promise<Route[]> {
    const response = await apiCall<{ routes: Route[] }>(
      routingApi.post('/routes/alternatives', request),
      { silent: true }
    );
    return response.routes;
  }

  /**
   * Calculate ETA
   */
  async calculateETA(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    vehicleType?: string
  ): Promise<ETACalculation> {
    return apiCall<ETACalculation>(
      routingApi.post('/routes/eta', {
        origin,
        destination,
        vehicle_type: vehicleType
      }),
      { silent: true }
    );
  }

  /**
   * Get route by ID
   */
  async getById(id: string): Promise<Route> {
    return apiCall<Route>(
      routingApi.get(`/routes/${id}`),
      { silent: true }
    );
  }

  /**
   * Get traffic conditions (public endpoint)
   */
  async getTrafficConditions(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<any[]> {
    const response = await apiCall<{ conditions: any[] }>(
      routingApi.get('/routes/traffic', {
        params: { lat: latitude, lng: longitude, radius_km: radiusKm }
      }),
      { silent: true }
    );
    return response.conditions;
  }

  /**
   * Report traffic condition
   */
  async reportTraffic(data: {
    location_lat: number;
    location_lng: number;
    traffic_level: string;
    delay_minutes: number;
    description?: string;
  }): Promise<any> {
    return apiCall(
      routingApi.post('/routes/traffic', data),
      { successMessage: 'Traffic reported successfully!' }
    );
  }

  /**
   * Calculate distance between two points (public endpoint)
   */
  async calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): Promise<{ distance_km: number; distance_miles: number }> {
    return apiCall(
      routingApi.get('/routes/distance', {
        params: { lat1, lng1, lat2, lng2 }
      }),
      { silent: true }
    );
  }

  /**
   * Get routing statistics
   */
  async getStats(): Promise<any> {
    return apiCall(
      routingApi.get('/routes/stats'),
      { silent: true }
    );
  }
}

export const routingService = new RoutingService();
