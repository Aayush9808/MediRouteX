/**
 * Routing Service Validators
 * Zod schemas for request validation
 */

import { z } from 'zod';
import { TrafficLevel } from '../types';

// ==================== Coordinate Schemas ====================

export const coordinatesSchema = z.object({
  latitude: z.number()
    .min(-90, 'Latitude must be >= -90')
    .max(90, 'Latitude must be <= 90'),
  longitude: z.number()
    .min(-180, 'Longitude must be >= -180')
    .max(180, 'Longitude must be <= 180')
});

export const locationSchema = coordinatesSchema.extend({
  address: z.string().optional(),
  name: z.string().optional()
});

// ==================== Route Request Schemas ====================

export const routeRequestSchema = z.object({
  origin: coordinatesSchema,
  destination: coordinatesSchema,
  waypoints: z.array(coordinatesSchema).optional(),
  avoid_traffic: z.boolean().optional().default(false),
  vehicle_type: z.enum(['ambulance', 'car']).optional().default('ambulance'),
  emergency_mode: z.boolean().optional().default(true)
});

export const optimizedRouteRequestSchema = z.object({
  ambulance_location: coordinatesSchema,
  emergency_location: coordinatesSchema,
  hospital_location: coordinatesSchema,
  constraints: z.object({
    max_distance_km: z.number().positive().optional(),
    max_duration_minutes: z.number().positive().optional(),
    avoid_areas: z.array(coordinatesSchema).optional(),
    prefer_highways: z.boolean().optional(),
    avoid_tolls: z.boolean().optional()
  }).optional()
});

// ==================== Traffic Schemas ====================

export const trafficLevelSchema = z.enum(['clear', 'light', 'moderate', 'heavy', 'severe']);

export const trafficConditionSchema = z.object({
  location: coordinatesSchema,
  radius_km: z.number().positive().max(50),
  level: trafficLevelSchema,
  description: z.string().min(3).max(500),
  delay_minutes: z.number().nonnegative()
});

export const trafficQuerySchema = z.object({
  latitude: z.string().transform(val => parseFloat(val)),
  longitude: z.string().transform(val => parseFloat(val)),
  radius_km: z.string().optional().transform(val => val ? parseFloat(val) : 10)
});

// ==================== ETA Schemas ====================

export const etaRequestSchema = z.object({
  current_location: coordinatesSchema,
  destination: coordinatesSchema,
  route_id: z.string().uuid().optional(),
  include_traffic: z.boolean().optional().default(true)
});

// ==================== Navigation Schemas ====================

export const navigationUpdateSchema = z.object({
  route_id: z.string().uuid(),
  current_location: coordinatesSchema,
  current_step: z.number().int().nonnegative()
});

// ==================== Query Schemas ====================

export const routeQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  limit: z.string().optional().transform(val => parseInt(val || '20', 10)),
  emergency_id: z.string().uuid().optional(),
  ambulance_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional()
});

// ==================== Helper Functions ====================

/**
 * Validate coordinates are within valid ranges
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Validate distance is reasonable (not too large)
 */
export function validateDistance(distanceKm: number, maxDistanceKm: number = 500): boolean {
  return distanceKm > 0 && distanceKm <= maxDistanceKm;
}

/**
 * Validate traffic level enum
 */
export function validateTrafficLevel(level: string): level is TrafficLevel {
  return ['clear', 'light', 'moderate', 'heavy', 'severe'].includes(level);
}

/**
 * Calculate route complexity score based on segments and waypoints
 */
export function calculateRouteComplexity(
  segmentCount: number,
  waypointCount: number,
  totalDistance: number
): number {
  // Simple scoring: more segments/waypoints = higher complexity
  const segmentScore = Math.min(segmentCount / 10, 1) * 40;
  const waypointScore = Math.min(waypointCount / 5, 1) * 30;
  const distanceScore = Math.min(totalDistance / 100, 1) * 30;
  
  return Math.round(segmentScore + waypointScore + distanceScore);
}

/**
 * Validate route quality score (0-100)
 */
export function validateRouteQuality(quality: number): boolean {
  return quality >= 0 && quality <= 100;
}

/**
 * Sanitize route request to prevent injection attacks
 */
export function sanitizeRouteRequest(request: any): any {
  return {
    origin: {
      latitude: Number(request.origin?.latitude),
      longitude: Number(request.origin?.longitude)
    },
    destination: {
      latitude: Number(request.destination?.latitude),
      longitude: Number(request.destination?.longitude)
    },
    waypoints: request.waypoints?.map((wp: any) => ({
      latitude: Number(wp.latitude),
      longitude: Number(wp.longitude)
    })),
    avoid_traffic: Boolean(request.avoid_traffic),
    vehicle_type: ['ambulance', 'car'].includes(request.vehicle_type) 
      ? request.vehicle_type 
      : 'ambulance',
    emergency_mode: Boolean(request.emergency_mode)
  };
}

/**
 * Validate and preprocess request data
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Check if coordinates are approximately equal (within tolerance)
 */
export function coordinatesEqual(
  c1: { latitude: number; longitude: number },
  c2: { latitude: number; longitude: number },
  toleranceMeters: number = 10
): boolean {
  const R = 6371000; // Earth radius in meters
  const lat1Rad = c1.latitude * Math.PI / 180;
  const lat2Rad = c2.latitude * Math.PI / 180;
  const deltaLat = (c2.latitude - c1.latitude) * Math.PI / 180;
  const deltaLng = (c2.longitude - c1.longitude) * Math.PI / 180;
  
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= toleranceMeters;
}
