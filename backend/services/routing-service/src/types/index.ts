/**
 * Routing Service Type Definitions
 * Core types for route calculation and navigation
 */

import { Request } from 'express';

// ==================== Location Types ====================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location extends Coordinates {
  address?: string;
  name?: string;
}

// ==================== Route Types ====================

export interface RouteSegment {
  start: Coordinates;
  end: Coordinates;
  distance_km: number;
  duration_seconds: number;
  instruction?: string;
  road_name?: string;
}

export interface Route {
  id: string;
  origin: Location;
  destination: Location;
  waypoints: Coordinates[];
  segments: RouteSegment[];
  total_distance_km: number;
  total_duration_seconds: number;
  estimated_arrival: Date;
  traffic_level: TrafficLevel;
  route_quality: number; // 0-100 score
  created_at: Date;
}

export interface RouteRequest {
  origin: Coordinates;
  destination: Coordinates;
  waypoints?: Coordinates[];
  avoid_traffic?: boolean;
  vehicle_type?: 'ambulance' | 'car';
  emergency_mode?: boolean;
}

export interface RouteResponse {
  route: Route;
  alternatives: Route[];
  traffic_conditions: TrafficCondition[];
}

// ==================== Traffic Types ====================

export type TrafficLevel = 'clear' | 'light' | 'moderate' | 'heavy' | 'severe';

export interface TrafficCondition {
  id: string;
  location: Coordinates;
  radius_km: number;
  level: TrafficLevel;
  description: string;
  delay_minutes: number;
  reported_at: Date;
  expires_at?: Date;
}

export interface TrafficData {
  road_segment_id: string;
  average_speed_kmh: number;
  congestion_level: TrafficLevel;
  incident_count: number;
  last_updated: Date;
}

// ==================== Navigation Types ====================

export interface NavigationStep {
  step_number: number;
  instruction: string;
  distance_km: number;
  duration_seconds: number;
  start_location: Coordinates;
  end_location: Coordinates;
  maneuver: ManeuverType;
}

export type ManeuverType = 
  | 'straight'
  | 'turn_left'
  | 'turn_right'
  | 'sharp_left'
  | 'sharp_right'
  | 'u_turn'
  | 'roundabout'
  | 'merge'
  | 'exit'
  | 'arrive';

export interface NavigationRoute {
  route_id: string;
  steps: NavigationStep[];
  current_step: number;
  distance_remaining_km: number;
  time_remaining_seconds: number;
  next_instruction: string;
}

// ==================== ETA Types ====================

export interface ETACalculation {
  estimated_time_seconds: number;
  estimated_arrival: Date;
  distance_km: number;
  average_speed_kmh: number;
  traffic_delay_seconds: number;
  confidence_score: number; // 0-1
}

export interface LiveETA {
  route_id: string;
  current_location: Coordinates;
  destination: Coordinates;
  distance_remaining_km: number;
  time_remaining_seconds: number;
  estimated_arrival: Date;
  traffic_impact: number; // percentage
  last_updated: Date;
}

// ==================== Optimization Types ====================

export interface RouteOptimizationRequest {
  ambulance_location: Coordinates;
  emergency_location: Coordinates;
  hospital_location: Coordinates;
  constraints?: RouteConstraints;
}

export interface RouteConstraints {
  max_distance_km?: number;
  max_duration_minutes?: number;
  avoid_areas?: Coordinates[];
  prefer_highways?: boolean;
  avoid_tolls?: boolean;
}

export interface OptimizedRoute {
  pickup_route: Route; // Ambulance to emergency
  transport_route: Route; // Emergency to hospital
  total_time_minutes: number;
  total_distance_km: number;
  optimization_score: number;
}

// ==================== Graph/Network Types ====================

export interface GraphNode {
  id: string;
  location: Coordinates;
  type: 'intersection' | 'hospital' | 'emergency' | 'waypoint';
}

export interface GraphEdge {
  from: string;
  to: string;
  distance_km: number;
  base_duration_seconds: number;
  traffic_multiplier: number;
  road_type: RoadType;
  traffic_level: TrafficLevel;
}

export type RoadType = 'highway' | 'main_road' | 'street' | 'residential';

export interface RouteGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge[]>;
}

// ==================== Statistics Types ====================

export interface RoutingStats {
  total_routes_calculated: number;
  average_route_distance_km: number;
  average_route_duration_minutes: number;
  routes_with_traffic: number;
  emergency_routes_count: number;
  cache_hit_rate: number;
}

// ==================== Auth Types ====================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'dispatcher' | 'driver' | 'hospital_staff' | 'hospital_admin' | 'user';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  email_verified: boolean;
}

export interface AuthRequest extends Request {
  user?: User;
}

// ==================== Service Response Types ====================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== Cache Keys ====================

export interface RouteCacheKeys {
  ROUTE: (origin: string, destination: string) => string;
  TRAFFIC: (areaId: string) => string;
  ETA: (routeId: string) => string;
}

// ==================== Error Types ====================

export class RoutingError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'RoutingError';
  }
}
