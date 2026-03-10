/**
 * Route Model
 * Database operations for routes and traffic data
 */

import pool from '../config/database';
import { QueryResultRow } from 'pg';
import {
  Route,
  RouteRequest,
  Coordinates,
  TrafficCondition,
  RouteSegment,
  TrafficLevel,
  OptimizedRoute
} from '../types';
import { 
  calculateDistance, 
  calculateArrivalTime,
  getTrafficMultiplier,
  calculateRouteQuality,
  generateRouteId
} from '../utils/helpers';
import { dijkstra, buildRouteGraph, pathToSegments } from '../utils/dijkstra';
import logger from '../utils/logger';

export class RouteModel {
  /**
   * Calculate optimal route between two points
   */
  static async calculateRoute(request: RouteRequest): Promise<Route> {
    try {
      const { origin, destination, waypoints = [], emergency_mode = true } = request;

      // Get road network data from database (simplified - would be more complex in production)
      const roadSegments = await this.getRoadSegments(origin, destination);
      
      // Build graph
      const graph = buildRouteGraph(roadSegments);
      
      // Find nearest nodes to origin and destination
      const originNode = this.findNearestNode(graph.nodes, origin);
      const destNode = this.findNearestNode(graph.nodes, destination);
      
      if (!originNode || !destNode) {
        throw new Error('Could not find route nodes');
      }

      // Calculate path using Dijkstra
      const pathResult = dijkstra(graph, originNode, destNode);
      
      if (!pathResult) {
        throw new Error('No route found');
      }

      // Convert path to route segments
      const segments = pathToSegments(graph, pathResult.path);
      
      // Get traffic level for route
      const trafficLevel = await this.getRouteTrafficLevel(segments);
      
      // Calculate final metrics with traffic
      const speedMultiplier = emergency_mode ? 1.2 : 1.0;
      const trafficMultiplier = getTrafficMultiplier(trafficLevel);
      const adjustedDuration = pathResult.totalDuration * trafficMultiplier / speedMultiplier;
      
      // Calculate quality score
      const quality = calculateRouteQuality(
        pathResult.totalDistance,
        adjustedDuration,
        trafficLevel,
        segments.length
      );

      const route: Route = {
        id: generateRouteId(),
        origin: { ...origin },
        destination: { ...destination },
        waypoints,
        segments,
        total_distance_km: pathResult.totalDistance,
        total_duration_seconds: Math.round(adjustedDuration),
        estimated_arrival: calculateArrivalTime(adjustedDuration),
        traffic_level: trafficLevel,
        route_quality: quality,
        created_at: new Date()
      };

      // Save route to database
      await this.saveRoute(route);

      return route;
    } catch (error) {
      logger.error('Error calculating route:', error);
      throw error;
    }
  }

  /**
   * Calculate optimized route for emergency (ambulance -> patient -> hospital)
   */
  static async calculateOptimizedRoute(
    ambulanceLocation: Coordinates,
    emergencyLocation: Coordinates,
    hospitalLocation: Coordinates
  ): Promise<OptimizedRoute> {
    try {
      // Calculate pickup route (ambulance to emergency)
      const pickupRoute = await this.calculateRoute({
        origin: ambulanceLocation,
        destination: emergencyLocation,
        vehicle_type: 'ambulance',
        emergency_mode: true
      });

      // Calculate transport route (emergency to hospital)
      const transportRoute = await this.calculateRoute({
        origin: emergencyLocation,
        destination: hospitalLocation,
        vehicle_type: 'ambulance',
        emergency_mode: true
      });

      const totalTime = (pickupRoute.total_duration_seconds + transportRoute.total_duration_seconds) / 60;
      const totalDistance = pickupRoute.total_distance_km + transportRoute.total_distance_km;
      
      // Optimization score based on time efficiency
      const optimizationScore = Math.round(Math.max(0, 100 - totalTime));

      return {
        pickup_route: pickupRoute,
        transport_route: transportRoute,
        total_time_minutes: Math.round(totalTime),
        total_distance_km: Math.round(totalDistance * 100) / 100,
        optimization_score: optimizationScore
      };
    } catch (error) {
      logger.error('Error calculating optimized route:', error);
      throw error;
    }
  }

  /**
   * Get alternative routes
   */
  static async getAlternativeRoutes(request: RouteRequest, _count: number = 2): Promise<Route[]> {
    try {
      // For now, return single route - full implementation would use K-shortest paths
      const mainRoute = await this.calculateRoute(request);
      
      // Could add alternative routes by:
      // 1. Avoiding certain road types
      // 2. Using different waypoints
      // 3. Optimizing for distance vs time
      
      return [mainRoute];
    } catch (error) {
      logger.error('Error getting alternative routes:', error);
      throw error;
    }
  }

  /**
   * Get traffic conditions for area
   */
  static async getTrafficConditions(
    location: Coordinates,
    radiusKm: number = 10
  ): Promise<TrafficCondition[]> {
    try {
      const query = `
        SELECT 
          id,
          ST_Y(location::geometry) as latitude,
          ST_X(location::geometry) as longitude,
          radius_km,
          congestion_level as level,
          description,
          delay_minutes,
          reported_at,
          expires_at
        FROM traffic_data
        WHERE ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3 * 1000
        )
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY reported_at DESC
      `;

      const result = await pool.query<QueryResultRow>(query, [
        location.longitude,
        location.latitude,
        radiusKm
      ]);

      return result.rows.map((row: any) => ({
        id: row.id,
        location: {
          latitude: parseFloat(row.latitude as string),
          longitude: parseFloat(row.longitude as string)
        },
        radius_km: parseFloat(row.radius_km as string),
        level: row.level as TrafficLevel,
        description: row.description as string,
        delay_minutes: parseInt(row.delay_minutes as string, 10),
        reported_at: new Date(row.reported_at as string),
        expires_at: row.expires_at ? new Date(row.expires_at as string) : undefined
      }));
    } catch (error) {
      logger.error('Error getting traffic conditions:', error);
      return [];
    }
  }

  /**
   * Report traffic condition
   */
  static async reportTraffic(condition: Omit<TrafficCondition, 'id' | 'reported_at'>): Promise<TrafficCondition> {
    try {
      const query = `
        INSERT INTO traffic_data (
          location,
          radius_km,
          congestion_level,
          description,
          delay_minutes,
          expires_at
        ) VALUES (
          ST_SetSRID(ST_MakePoint($1, $2), 4326),
          $3, $4, $5, $6, $7
        )
        RETURNING 
          id,
          ST_Y(location::geometry) as latitude,
          ST_X(location::geometry) as longitude,
          radius_km,
          congestion_level as level,
          description,
          delay_minutes,
          reported_at,
          expires_at
      `;

      const result = await pool.query<QueryResultRow>(query, [
        condition.location.longitude,
        condition.location.latitude,
        condition.radius_km,
        condition.level,
        condition.description,
        condition.delay_minutes,
        condition.expires_at || null
      ]);

      const row = result.rows[0];
      return {
        id: row.id as string,
        location: {
          latitude: parseFloat(row.latitude as string),
          longitude: parseFloat(row.longitude as string)
        },
        radius_km: parseFloat(row.radius_km as string),
        level: row.level as TrafficLevel,
        description: row.description as string,
        delay_minutes: parseInt(row.delay_minutes as string, 10),
        reported_at: new Date(row.reported_at as string),
        expires_at: row.expires_at ? new Date(row.expires_at as string) : undefined
      };
    } catch (error) {
      logger.error('Error reporting traffic:', error);
      throw error;
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * Get road segments from database (simplified)
   */
  private static async getRoadSegments(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<any[]> {
    // In production, this would query actual road network data
    // For now, return simplified grid-based segments
    
    const latStep = 0.01; // ~1.1 km
    const lngStep = 0.01;
    
    const segments: any[] = [];
    
    // Create a simple grid between origin and destination
    const latDiff = destination.latitude - origin.latitude;
    const lngDiff = destination.longitude - origin.longitude;
    const steps = Math.max(Math.abs(Math.round(latDiff / latStep)), Math.abs(Math.round(lngDiff / lngStep)));
    
    for (let i = 0; i < steps; i++) {
      const fromLat = origin.latitude + (latDiff * i / steps);
      const fromLng = origin.longitude + (lngDiff * i / steps);
      const toLat = origin.latitude + (latDiff * (i + 1) / steps);
      const toLng = origin.longitude + (lngDiff * (i + 1) / steps);
      
      const distance = calculateDistance(
        { latitude: fromLat, longitude: fromLng },
        { latitude: toLat, longitude: toLng }
      );
      
      segments.push({
        from_lat: fromLat,
        from_lng: fromLng,
        to_lat: toLat,
        to_lng: toLng,
        distance_km: distance,
        road_type: 'main_road',
        traffic_level: 'light'
      });
    }
    
    return segments;
  }

  /**
   * Find nearest node in graph to coordinates
   */
  private static findNearestNode(
    nodes: Map<string, any>,
    target: Coordinates
  ): string | null {
    let nearest: string | null = null;
    let minDistance = Infinity;
    
    for (const [nodeId, node] of nodes) {
      const distance = calculateDistance(target, node.location);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = nodeId;
      }
    }
    
    return nearest;
  }

  /**
   * Get average traffic level for route
   */
  private static async getRouteTrafficLevel(_segments: RouteSegment[]): Promise<TrafficLevel> {
    // Simplified - would check traffic data for each segment
    // For now, return default based on time of day
    
    const hour = new Date().getHours();
    
    if (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19) {
      return 'heavy'; // Rush hour
    } else if (hour >= 10 && hour <= 16) {
      return 'moderate'; // Midday
    } else {
      return 'light'; // Off-peak
    }
  }

  /**
   * Save route to database
   */
  private static async saveRoute(route: Route): Promise<void> {
    try {
      const query = `
        INSERT INTO routes (
          id,
          origin_lat,
          origin_lng,
          destination_lat,
          destination_lng,
          total_distance_km,
          total_duration_seconds,
          estimated_arrival,
          traffic_level,
          route_quality,
          route_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      await pool.query(query, [
        route.id,
        route.origin.latitude,
        route.origin.longitude,
        route.destination.latitude,
        route.destination.longitude,
        route.total_distance_km,
        route.total_duration_seconds,
        route.estimated_arrival,
        route.traffic_level,
        route.route_quality,
        JSON.stringify({ segments: route.segments, waypoints: route.waypoints })
      ]);
    } catch (error) {
      logger.error('Error saving route:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Get route by ID
   */
  static async getById(routeId: string): Promise<Route | null> {
    try {
      const query = `
        SELECT * FROM routes WHERE id = $1
      `;

      const result = await pool.query<QueryResultRow>(query, [routeId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const routeData = JSON.parse(row.route_data as string);

      return {
        id: row.id as string,
        origin: {
          latitude: parseFloat(row.origin_lat as string),
          longitude: parseFloat(row.origin_lng as string)
        },
        destination: {
          latitude: parseFloat(row.destination_lat as string),
          longitude: parseFloat(row.destination_lng as string)
        },
        waypoints: routeData.waypoints || [],
        segments: routeData.segments || [],
        total_distance_km: parseFloat(row.total_distance_km as string),
        total_duration_seconds: parseInt(row.total_duration_seconds as string, 10),
        estimated_arrival: new Date(row.estimated_arrival as string),
        traffic_level: row.traffic_level as TrafficLevel,
        route_quality: parseInt(row.route_quality as string, 10),
        created_at: new Date(row.created_at as string)
      };
    } catch (error) {
      logger.error('Error getting route by ID:', error);
      return null;
    }
  }

  /**
   * Get routing statistics
   */
  static async getStats(): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_routes,
          AVG(total_distance_km) as avg_distance,
          AVG(total_duration_seconds / 60.0) as avg_duration_minutes,
          COUNT(CASE WHEN traffic_level IN ('heavy', 'severe') THEN 1 END) as routes_with_heavy_traffic
        FROM routes
        WHERE created_at > NOW() - INTERVAL '30 days'
      `;

      const result = await pool.query<QueryResultRow>(query);
      const row = result.rows[0];

      return {
        total_routes: parseInt(row.total_routes as string, 10),
        average_distance_km: parseFloat(row.avg_distance as string) || 0,
        average_duration_minutes: parseFloat(row.avg_duration_minutes as string) || 0,
        routes_with_heavy_traffic: parseInt(row.routes_with_heavy_traffic as string, 10)
      };
    } catch (error) {
      logger.error('Error getting route stats:', error);
      return {
        total_routes: 0,
        average_distance_km: 0,
        average_duration_minutes: 0,
        routes_with_heavy_traffic: 0
      };
    }
  }
}
