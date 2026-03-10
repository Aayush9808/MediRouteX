/**
 * Routing Controller
 * Handles route calculation and navigation requests
 */

import { Response } from 'express';
import { RouteModel } from '../models/route.model';
import { AuthRequest } from '../types';
import {
  routeRequestSchema,
  optimizedRouteRequestSchema,
  trafficConditionSchema,
  etaRequestSchema,
  validate
} from '../utils/validators';
import { calculateDistance, calculateETA, calculateArrivalTime, formatDuration } from '../utils/helpers';
import logger from '../utils/logger';
import redis from '../config/redis';

export class RouteController {
  /**
   * Calculate route between two points
   * POST /api/v1/routes/calculate
   */
  static async calculateRoute(req: AuthRequest, res: Response) {
    try {
      const validatedData = validate(routeRequestSchema, req.body);

      logger.info('Calculating route', {
        user_id: req.user?.id,
        origin: validatedData.origin,
        destination: validatedData.destination
      });

      // Check cache first
      const cacheKey = `route:${validatedData.origin.latitude},${validatedData.origin.longitude}:${validatedData.destination.latitude},${validatedData.destination.longitude}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        logger.info('Route found in cache');
        return res.json({
          success: true,
          data: JSON.parse(cached),
          cached: true
        });
      }

      const route = await RouteModel.calculateRoute(validatedData);
      
      // Cache for 5 minutes
      await redis.setEx(cacheKey, 300, JSON.stringify(route));

      return res.status(201).json({
        success: true,
        data: route,
        message: 'Route calculated successfully'
      });
    } catch (error: any) {
      logger.error('Error calculating route:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate route'
      });
    }
  }

  /**
   * Calculate optimized route for emergency (ambulance -> patient -> hospital)
   * POST /api/v1/routes/optimize
   */
  static async calculateOptimizedRoute(req: AuthRequest, res: Response) {
    try {
      const validatedData = validate(optimizedRouteRequestSchema, req.body);

      logger.info('Calculating optimized emergency route', {
        user_id: req.user?.id,
        ambulance: validatedData.ambulance_location,
        emergency: validatedData.emergency_location,
        hospital: validatedData.hospital_location
      });

      const optimizedRoute = await RouteModel.calculateOptimizedRoute(
        validatedData.ambulance_location,
        validatedData.emergency_location,
        validatedData.hospital_location
      );

      return res.status(201).json({
        success: true,
        data: optimizedRoute,
        message: 'Optimized route calculated successfully'
      });
    } catch (error: any) {
      logger.error('Error calculating optimized route:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate optimized route'
      });
    }
  }

  /**
   * Get alternative routes
   * POST /api/v1/routes/alternatives
   */
  static async getAlternatives(req: AuthRequest, res: Response) {
    try {
      const validatedData = validate(routeRequestSchema, req.body);
      const count = Math.min(parseInt(req.query.count as string) || 2, 5);

      logger.info('Getting alternative routes', {
        user_id: req.user?.id,
        count
      });

      const routes = await RouteModel.getAlternativeRoutes(validatedData, count);

      return res.json({
        success: true,
        data: {
          routes,
          count: routes.length
        }
      });
    } catch (error: any) {
      logger.error('Error getting alternative routes:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to get alternative routes'
      });
    }
  }

  /**
   * Calculate ETA
   * POST /api/v1/routes/eta
   */
  static async calculateETA(req: AuthRequest, res: Response) {
    try {
      const validatedData = validate(etaRequestSchema, req.body);

      const distance = calculateDistance(
        validatedData.current_location,
        validatedData.destination
      );

      const duration = calculateETA(distance, 50, 1.0); // 50 km/h, no traffic
      const arrival = calculateArrivalTime(duration);

      return res.json({
        success: true,
        data: {
          distance_km: distance,
          duration_seconds: duration,
          duration_formatted: formatDuration(duration),
          estimated_arrival: arrival,
          confidence: 0.85
        }
      });
    } catch (error: any) {
      logger.error('Error calculating ETA:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate ETA'
      });
    }
  }

  /**
   * Get route by ID
   * GET /api/v1/routes/:id
   */
  static async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const route = await RouteModel.getById(id);

      if (!route) {
        return res.status(404).json({
          success: false,
          error: 'Route not found'
        });
      }

      return res.json({
        success: true,
        data: route
      });
    } catch (error: any) {
      logger.error('Error getting route:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to get route'
      });
    }
  }

  /**
   * Get traffic conditions for area
   * GET /api/v1/routes/traffic
   */
  static async getTrafficConditions(req: AuthRequest, res: Response) {
    try {
      const query = req.query;
      const latitude = parseFloat(query.latitude as string);
      const longitude = parseFloat(query.longitude as string);
      const radius_km = query.radius_km ? parseFloat(query.radius_km as string) : 10;

      const conditions = await RouteModel.getTrafficConditions(
        { latitude, longitude },
        radius_km
      );

      return res.json({
        success: true,
        data: {
          conditions,
          count: conditions.length,
          location: { latitude, longitude },
          radius_km
        }
      });
    } catch (error: any) {
      logger.error('Error getting traffic conditions:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to get traffic conditions'
      });
    }
  }

  /**
   * Report traffic condition
   * POST /api/v1/routes/traffic
   */
  static async reportTraffic(req: AuthRequest, res: Response) {
    try {
      const validatedData = validate(trafficConditionSchema, req.body);

      logger.info('Reporting traffic condition', {
        user_id: req.user?.id,
        location: validatedData.location,
        level: validatedData.level
      });

      // Set expiry to 1 hour from now if not provided
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      const condition = await RouteModel.reportTraffic({
        ...validatedData,
        expires_at: expiresAt
      });

      return res.status(201).json({
        success: true,
        data: condition,
        message: 'Traffic condition reported successfully'
      });
    } catch (error: any) {
      logger.error('Error reporting traffic:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to report traffic'
      });
    }
  }

  /**
   * Get routing statistics
   * GET /api/v1/routes/stats
   */
  static async getStats(_req: AuthRequest, res: Response) {
    try {
      const stats = await RouteModel.getStats();

      return res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Error getting route stats:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to get statistics'
      });
    }
  }

  /**
   * Quick distance calculation (utility endpoint)
   * GET /api/v1/routes/distance
   */
  static async calculateDistanceQuick(req: AuthRequest, res: Response) {
    try {
      const { from_lat, from_lng, to_lat, to_lng } = req.query;

      if (!from_lat || !from_lng || !to_lat || !to_lng) {
        return res.status(400).json({
          success: false,
          error: 'Missing coordinates: from_lat, from_lng, to_lat, to_lng required'
        });
      }

      const from = {
        latitude: parseFloat(from_lat as string),
        longitude: parseFloat(from_lng as string)
      };

      const to = {
        latitude: parseFloat(to_lat as string),
        longitude: parseFloat(to_lng as string)
      };

      const distance = calculateDistance(from, to);
      const duration = calculateETA(distance);

      return res.json({
        success: true,
        data: {
          distance_km: distance,
          duration_seconds: duration,
          duration_formatted: formatDuration(duration)
        }
      });
    } catch (error: any) {
      logger.error('Error calculating distance:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to calculate distance'
      });
    }
  }
}
