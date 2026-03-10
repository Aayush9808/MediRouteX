import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { AmbulanceModel } from '../models/ambulance.model';
import {
  validate,
  createAmbulanceSchema,
  updateAmbulanceStatusSchema,
  updateLocationSchema,
  assignDriverSchema,
  paginationSchema,
  filterAmbulancesSchema,
  nearbyQuerySchema,
} from '../utils/validators';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet, cacheInvalidatePattern, cacheAmbulanceLocation } from '../config/redis';

export class AmbulanceController {
  // Create new ambulance
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = validate(createAmbulanceSchema, req.body);

      // Check if registration number already exists
      const existing = await AmbulanceModel.findByRegistrationNumber(
        validatedData.registrationNumber
      );

      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            message: 'Ambulance with this registration number already exists',
            code: 'DUPLICATE_REGISTRATION',
          },
        });
      }

      const ambulance = await AmbulanceModel.create(validatedData);

      // Invalidate cache
      await cacheInvalidatePattern('ambulances:*');

      const response: ApiResponse = {
        success: true,
        data: ambulance,
        meta: { timestamp: new Date().toISOString() },
      };

      logger.info('Ambulance created', { id: ambulance.id });
      return res.status(201).json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Get ambulance by ID
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Try cache first
      const cacheKey = `ambulance:${id}`;
      let ambulance = await cacheGet(cacheKey);

      if (!ambulance) {
        ambulance = await AmbulanceModel.findById(id);
        if (!ambulance) {
          return res.status(404).json({
            success: false,
            error: { message: 'Ambulance not found' },
          });
        }
        await cacheSet(cacheKey, ambulance, 60);
      }

      const response: ApiResponse = {
        success: true,
        data: ambulance,
        meta: { timestamp: new Date().toISOString() },
      };

      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Get all ambulances with pagination
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const paginationParams: any = paginationSchema.parse(req.query);
      const filters: any = filterAmbulancesSchema.parse(req.query);

      const result = await AmbulanceModel.findAll(paginationParams, filters);

      const response: ApiResponse = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          pagination: result.pagination,
        },
      };

      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Get available ambulances
  static async getAvailable(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cacheKey = 'ambulances:available';
      let ambulances = await cacheGet(cacheKey);

      if (!ambulances) {
        ambulances = await AmbulanceModel.findAvailable();
        await cacheSet(cacheKey, ambulances, 30);
      }

      const response: ApiResponse = {
        success: true,
        data: ambulances,
        meta: { timestamp: new Date().toISOString() },
      };

      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Get nearby ambulances
  static async getNearby(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const queryData: any = validate(nearbyQuerySchema, req.query);
      const { lat, lng, maxDistance, type, status } = queryData;

      const ambulances = await AmbulanceModel.findNearby(
        lat as number,
        lng as number,
        maxDistance as number,
        { type, status: status || 'Available' }
      );

      const response: ApiResponse = {
        success: true,
        data: ambulances,
        meta: { timestamp: new Date().toISOString() },
      };

      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Update ambulance status
  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = validate(updateAmbulanceStatusSchema, req.body);

      const ambulance = await AmbulanceModel.updateStatus(id, validatedData);

      if (!ambulance) {
        return res.status(404).json({
          success: false,
          error: { message: 'Ambulance not found' },
        });
      }

      // Invalidate cache
      await cacheInvalidatePattern('ambulances:*');
      await cacheInvalidatePattern(`ambulance:${id}`);

      // TODO: Emit WebSocket event for status change

      const response: ApiResponse = {
        success: true,
        data: ambulance,
        meta: { timestamp: new Date().toISOString() },
      };

      logger.info('Ambulance status updated', { id, status: validatedData.status });
      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Update ambulance location (GPS tracking)
  static async updateLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = validate(updateLocationSchema, req.body);

      const ambulance = await AmbulanceModel.updateLocation(id, validatedData);

      if (!ambulance) {
        return res.status(404).json({
          success: false,
          error: { message: 'Ambulance not found' },
        });
      }

      // Cache location for quick access
      await cacheAmbulanceLocation(
        id,
        { lat: validatedData.lat, lng: validatedData.lng },
        60
      );

      // Invalidate ambulance cache
      await cacheInvalidatePattern(`ambulance:${id}`);

      // TODO: Emit WebSocket event for real-time location tracking

      const response: ApiResponse = {
        success: true,
        data: ambulance,
        meta: { timestamp: new Date().toISOString() },
      };

      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Assign driver to ambulance
  static async assignDriver(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { driverId, driverName, driverPhone } = validate(assignDriverSchema, req.body);

      const ambulance = await AmbulanceModel.assignDriver(
        id,
        driverId,
        driverName,
        driverPhone
      );

      if (!ambulance) {
        return res.status(404).json({
          success: false,
          error: { message: 'Ambulance not found' },
        });
      }

      // Invalidate cache
      await cacheInvalidatePattern(`ambulance:${id}`);

      const response: ApiResponse = {
        success: true,
        data: ambulance,
        meta: { timestamp: new Date().toISOString() },
      };

      logger.info('Driver assigned', { ambulanceId: id, driverId, driverName });
      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Remove driver from ambulance
  static async removeDriver(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const ambulance = await AmbulanceModel.removeDriver(id);

      if (!ambulance) {
        return res.status(404).json({
          success: false,
          error: { message: 'Ambulance not found' },
        });
      }

      // Invalidate cache
      await cacheInvalidatePattern(`ambulance:${id}`);

      const response: ApiResponse = {
        success: true,
        data: ambulance,
        meta: { timestamp: new Date().toISOString() },
      };

      logger.info('Driver removed from ambulance', { ambulanceId: id });
      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Get ambulance statistics
  static async getStats(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cacheKey = 'ambulances:stats';
      let stats = await cacheGet(cacheKey);

      if (!stats) {
        stats = await AmbulanceModel.getStats();
        await cacheSet(cacheKey, stats, 60);
      }

      const response: ApiResponse = {
        success: true,
        data: stats,
        meta: { timestamp: new Date().toISOString() },
      };

      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Delete ambulance
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const deleted = await AmbulanceModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: { message: 'Ambulance not found' },
        });
      }

      // Invalidate cache
      await cacheInvalidatePattern('ambulances:*');
      await cacheInvalidatePattern(`ambulance:${id}`);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Ambulance removed from service' },
        meta: { timestamp: new Date().toISOString() },
      };

      logger.info('Ambulance deleted', { id });
      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }
}
