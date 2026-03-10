/**
 * Routing Service Helper Functions
 * Utilities for distance calculation, ETA, traffic analysis
 */

import { Coordinates, TrafficLevel, RouteSegment } from '../types';

// ==================== Distance & Geospatial Calculations ====================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth radius in kilometers
  const lat1Rad = coord1.latitude * Math.PI / 180;
  const lat2Rad = coord2.latitude * Math.PI / 180;
  const deltaLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const deltaLng = (coord2.longitude - coord1.longitude) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate bearing (direction) between two points
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  from: Coordinates,
  to: Coordinates
): number {
  const lat1 = from.latitude * Math.PI / 180;
  const lat2 = to.latitude * Math.PI / 180;
  const deltaLng = (to.longitude - from.longitude) * Math.PI / 180;

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
}

/**
 * Calculate midpoint between two coordinates
 */
export function calculateMidpoint(
  coord1: Coordinates,
  coord2: Coordinates
): Coordinates {
  const lat1 = coord1.latitude * Math.PI / 180;
  const lat2 = coord2.latitude * Math.PI / 180;
  const lng1 = coord1.longitude * Math.PI / 180;
  const deltaLng = (coord2.longitude - coord1.longitude) * Math.PI / 180;

  const Bx = Math.cos(lat2) * Math.cos(deltaLng);
  const By = Math.cos(lat2) * Math.sin(deltaLng);

  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By)
  );
  const lng3 = lng1 + Math.atan2(By, Math.cos(lat1) + Bx);

  return {
    latitude: lat3 * 180 / Math.PI,
    longitude: lng3 * 180 / Math.PI
  };
}

// ==================== ETA Calculations ====================

/**
 * Calculate ETA based on distance and speed
 * @param distanceKm Distance in kilometers
 * @param speedKmh Average speed in km/h
 * @param trafficMultiplier Traffic delay multiplier (1.0 = no delay)
 * @returns Duration in seconds
 */
export function calculateETA(
  distanceKm: number,
  speedKmh: number = 50,
  trafficMultiplier: number = 1.0
): number {
  const baseTimeHours = distanceKm / speedKmh;
  const adjustedTimeHours = baseTimeHours * trafficMultiplier;
  return Math.round(adjustedTimeHours * 3600); // Convert to seconds
}

/**
 * Get speed multiplier based on vehicle type and emergency mode
 */
export function getSpeedMultiplier(
  vehicleType: 'ambulance' | 'car',
  emergencyMode: boolean
): number {
  if (vehicleType === 'ambulance' && emergencyMode) {
    return 1.2; // 20% faster in emergency mode
  }
  return 1.0;
}

/**
 * Calculate estimated arrival time
 */
export function calculateArrivalTime(durationSeconds: number): Date {
  const now = new Date();
  return new Date(now.getTime() + durationSeconds * 1000);
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

// ==================== Traffic Analysis ====================

/**
 * Get traffic multiplier based on traffic level
 */
export function getTrafficMultiplier(level: TrafficLevel): number {
  const multipliers: Record<TrafficLevel, number> = {
    clear: 1.0,
    light: 1.15,
    moderate: 1.35,
    heavy: 1.6,
    severe: 2.0
  };
  return multipliers[level];
}

/**
 * Determine traffic level from congestion percentage
 */
export function determineTrafficLevel(congestionPercent: number): TrafficLevel {
  if (congestionPercent >= 80) return 'severe';
  if (congestionPercent >= 60) return 'heavy';
  if (congestionPercent >= 40) return 'moderate';
  if (congestionPercent >= 20) return 'light';
  return 'clear';
}

/**
 * Calculate traffic delay in seconds
 */
export function calculateTrafficDelay(
  baseTimeSeconds: number,
  trafficLevel: TrafficLevel
): number {
  const multiplier = getTrafficMultiplier(trafficLevel);
  return Math.round(baseTimeSeconds * (multiplier - 1));
}

/**
 * Analyze route for traffic impact
 */
export function analyzeTrafficImpact(
  segments: RouteSegment[],
  trafficLevel: TrafficLevel
): number {
  const totalTime = segments.reduce((sum, seg) => sum + seg.duration_seconds, 0);
  const delay = calculateTrafficDelay(totalTime, trafficLevel);
  return Math.round((delay / totalTime) * 100); // Return percentage
}

// ==================== Route Quality & Scoring ====================

/**
 * Calculate route quality score (0-100)
 * Higher score = better route
 */
export function calculateRouteQuality(
  distanceKm: number,
  durationSeconds: number,
  trafficLevel: TrafficLevel,
  segmentCount: number
): number {
  // Distance score (shorter is better, but not too short = more direct)
  const distanceScore = Math.max(0, 100 - (distanceKm * 2));
  
  // Time score (faster is better)
  const timeScore = Math.max(0, 100 - (durationSeconds / 60));
  
  // Traffic score (less traffic is better)
  const trafficScores: Record<TrafficLevel, number> = {
    clear: 100,
    light: 80,
    moderate: 60,
    heavy: 40,
    severe: 20
  };
  const trafficScore = trafficScores[trafficLevel];
  
  // Simplicity score (fewer segments = simpler route)
  const simplicityScore = Math.max(0, 100 - (segmentCount * 5));
  
  // Weighted average
  const quality = (
    distanceScore * 0.3 +
    timeScore * 0.4 +
    trafficScore * 0.2 +
    simplicityScore * 0.1
  );
  
  return Math.round(Math.max(0, Math.min(100, quality)));
}

/**
 * Compare two routes and return the better one
 */
export function compareRoutes(
  route1: { distance: number; duration: number; quality: number },
  route2: { distance: number; duration: number; quality: number }
): number {
  // Positive = route1 is better, Negative = route2 is better
  const qualityDiff = route1.quality - route2.quality;
  const timeDiff = route2.duration - route1.duration;
  const distanceDiff = route2.distance - route1.distance;
  
  // Weighted comparison
  return (qualityDiff * 0.4) + (timeDiff * 0.4) + (distanceDiff * 0.2);
}

// ==================== Navigation Helpers ====================

/**
 * Generate turn-by-turn instruction
 */
export function generateInstruction(
  bearing: number,
  distance: number,
  roadName?: string
): string {
  const direction = getBearingDirection(bearing);
  const distanceStr = distance < 1 
    ? `${Math.round(distance * 1000)}m` 
    : `${distance.toFixed(1)}km`;
  
  const roadPart = roadName ? ` onto ${roadName}` : '';
  return `${direction}${roadPart} for ${distanceStr}`;
}

/**
 * Get direction from bearing
 */
function getBearingDirection(bearing: number): string {
  if (bearing >= 337.5 || bearing < 22.5) return 'Continue north';
  if (bearing >= 22.5 && bearing < 67.5) return 'Turn northeast';
  if (bearing >= 67.5 && bearing < 112.5) return 'Turn east';
  if (bearing >= 112.5 && bearing < 157.5) return 'Turn southeast';
  if (bearing >= 157.5 && bearing < 202.5) return 'Turn south';
  if (bearing >= 202.5 && bearing < 247.5) return 'Turn southwest';
  if (bearing >= 247.5 && bearing < 292.5) return 'Turn west';
  return 'Turn northwest';
}

// ==================== Utility Functions ====================

/**
 * Generate route cache key
 */
export function generateRouteCacheKey(
  origin: Coordinates,
  destination: Coordinates,
  waypoints: Coordinates[] = []
): string {
  const originKey = `${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}`;
  const destKey = `${destination.latitude.toFixed(4)},${destination.longitude.toFixed(4)}`;
  const waypointKey = waypoints.length > 0 
    ? `-${waypoints.map(w => `${w.latitude.toFixed(4)},${w.longitude.toFixed(4)}`).join('-')}` 
    : '';
  return `route:${originKey}:${destKey}${waypointKey}`;
}

/**
 * Parse coordinates from string
 */
export function parseCoordinates(coordString: string): Coordinates | null {
  const parts = coordString.split(',').map(s => parseFloat(s.trim()));
  if (parts.length !== 2 || parts.some(isNaN)) {
    return null;
  }
  return { latitude: parts[0], longitude: parts[1] };
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates): string {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}

/**
 * Calculate confidence score for ETA (based on traffic data freshness)
 */
export function calculateConfidenceScore(
  trafficDataAge: number, // in minutes
  routeDistance: number
): number {
  // Fresher data = higher confidence
  const ageScore = Math.max(0, 1 - (trafficDataAge / 60)); // Decreases over 60 min
  
  // Shorter routes = higher confidence
  const distanceScore = Math.max(0, 1 - (routeDistance / 100)); // Decreases over 100 km
  
  return Math.round((ageScore * 0.6 + distanceScore * 0.4) * 100) / 100;
}

/**
 * Generate unique route ID
 */
export function generateRouteId(): string {
  return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
