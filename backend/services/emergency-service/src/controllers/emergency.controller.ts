import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { EmergencyModel } from '../models/emergency.model';
import { validate, createEmergencySchema, updateEmergencyStatusSchema, paginationSchema, filterEmergenciesSchema } from '../utils/validators';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../config/redis';
import axios from 'axios';

export class EmergencyController {
  // Create new emergency
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = validate(createEmergencySchema, req.body);
      const userId = req.user?.id;

      // Create emergency
      const emergency = await EmergencyModel.create(validatedData, userId);

      // Find nearest available ambulances
      const ambulances = await EmergencyController.findNearestAmbulances(
        validatedData.location.lat,
        validatedData.location.lng
      );

      // Find nearby hospitals with beds
      const hospitals = await EmergencyController.findNearbyHospitals(
        validatedData.location.lat,
        validatedData.location.lng
      );

      // Auto-assign if critical and ambulance available
      if (validatedData.severity === 'Critical' && ambulances.length > 0) {
        await EmergencyModel.assignAmbulance(
          emergency.id,
          ambulances[0].id,
          userId
        );
        await EmergencyModel.updateStatus(emergency.id, 'Dispatched', userId);
        logger.info('Auto-assigned ambulance for critical emergency', {
          emergencyId: emergency.id,
          ambulanceId: ambulances[0].id,
        });
      }

      // Invalidate cache
      await cacheInvalidatePattern('emergencies:*');

      // TODO: Emit WebSocket event for real-time update
      // TODO: Send notifications to dispatchers

      const response: ApiResponse = {
        success: true,
        data: {
          emergency,
          nearestAmbulances: ambulances.slice(0, 5),
          nearbyHospitals: hospitals.slice(0, 5),
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      logger.info('Emergency created successfully', { emergencyId: emergency.id });
      res.status(201).json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Get emergency by ID
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Try cache first
      const cacheKey = `emergency:${id}`;
      let emergency = await cacheGet(cacheKey);

      if (!emergency) {
        emergency = await EmergencyModel.findById(id);
        if (!emergency) {
          return res.status(404).json({
            success: false,
            error: { message: 'Emergency not found' },
          });
        }
        await cacheSet(cacheKey, emergency, 60); // Cache for 1 minute
      }

      const response: ApiResponse = {
        success: true,
        data: emergency,
        meta: { timestamp: new Date().toISOString() },
      };

      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Get all emergencies with pagination and filters
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const paginationParams: any = paginationSchema.parse(req.query);
      const filters: any = filterEmergenciesSchema.parse(req.query);

      const result = await EmergencyModel.findAll(paginationParams, filters);

      const response: ApiResponse = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          pagination: result.pagination,
        },
      };

      res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Get active emergencies
  static async getActive(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Try cache first
      const cacheKey = 'emergencies:active';
      let emergencies = await cacheGet(cacheKey);

      if (!emergencies) {
        emergencies = await EmergencyModel.findActive();
        await cacheSet(cacheKey, emergencies, 30); // Cache for 30 seconds
      }

      const response: ApiResponse = {
        success: true,
        data: emergencies,
        meta: { timestamp: new Date().toISOString() },
      };

      res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Update emergency status
  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = validate(updateEmergencyStatusSchema, req.body);
      const userId = req.user?.id;

      const emergency = await EmergencyModel.updateStatus(
        id,
        validatedData.status,
        userId
      );

      if (!emergency) {
        return res.status(404).json({
          success: false,
          error: { message: 'Emergency not found' },
        });
      }

      // Invalidate cache
      await cacheInvalidatePattern('emergencies:*');
      await cacheInvalidatePattern(`emergency:${id}`);

      // TODO: Emit WebSocket event
      // TODO: Send notification

      const response: ApiResponse = {
        success: true,
        data: emergency,
        meta: { timestamp: new Date().toISOString() },
      };

      logger.info('Emergency status updated', { id, status: validatedData.status });
      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Assign ambulance to emergency
  static async assignAmbulance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { ambulanceId } = req.body;
      const userId = req.user?.id;

      if (!ambulanceId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Ambulance ID is required' },
        });
      }

      // Assign ambulance
      const emergency = await EmergencyModel.assignAmbulance(id, ambulanceId, userId);

      if (!emergency) {
        return res.status(404).json({
          success: false,
          error: { message: 'Emergency not found' },
        });
      }

      // Update ambulance status to Busy (call ambulance service)
      try {
        await axios.put(
          `${process.env.AMBULANCE_SERVICE_URL}/api/v1/ambulance/${ambulanceId}/status`,
          { status: 'Busy', assignedEmergency: id }
        );
      } catch (error) {
        logger.error('Failed to update ambulance status', { error, ambulanceId });
      }

      // Update emergency status to Dispatched
      await EmergencyModel.updateStatus(id, 'Dispatched', userId);

      // Invalidate cache
      await cacheInvalidatePattern('emergencies:*');
      await cacheInvalidatePattern(`emergency:${id}`);

      const response: ApiResponse = {
        success: true,
        data: emergency,
        meta: { timestamp: new Date().toISOString() },
      };

      logger.info('Ambulance assigned', { emergencyId: id, ambulanceId });
      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Assign hospital to emergency
  static async assignHospital(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { hospitalId } = req.body;

      if (!hospitalId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Hospital ID is required' },
        });
      }

      const emergency = await EmergencyModel.assignHospital(id, hospitalId);

      if (!emergency) {
        return res.status(404).json({
          success: false,
          error: { message: 'Emergency not found' },
        });
      }

      // Notify hospital (call hospital service)
      try {
        await axios.post(
          `${process.env.HOSPITAL_SERVICE_URL}/api/v1/hospital/${hospitalId}/notify`,
          { emergencyId: id, type: emergency.type, severity: emergency.severity }
        );
      } catch (error) {
        logger.error('Failed to notify hospital', { error, hospitalId });
      }

      // Invalidate cache
      await cacheInvalidatePattern(`emergency:${id}`);

      const response: ApiResponse = {
        success: true,
        data: emergency,
        meta: { timestamp: new Date().toISOString() },
      };

      logger.info('Hospital assigned', { emergencyId: id, hospitalId });
      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Get emergency statistics
  static async getStats(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Try cache first
      const cacheKey = 'emergencies:stats';
      let stats = await cacheGet(cacheKey);

      if (!stats) {
        stats = await EmergencyModel.getStats();
        await cacheSet(cacheKey, stats, 60); // Cache for 1 minute
      }

      const response: ApiResponse = {
        success: true,
        data: stats,
        meta: { timestamp: new Date().toISOString() },
      };

      res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Delete/Cancel emergency
  static async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const emergency = await EmergencyModel.updateStatus(id, 'Cancelled', userId);

      if (!emergency) {
        return res.status(404).json({
          success: false,
          error: { message: 'Emergency not found' },
        });
      }

      // If ambulance was assigned, make it available again
      if (emergency.assignedAmbulanceId) {
        try {
          await axios.put(
            `${process.env.AMBULANCE_SERVICE_URL}/api/v1/ambulance/${emergency.assignedAmbulanceId}/status`,
            { status: 'Available', assignedEmergency: null }
          );
        } catch (error) {
          logger.error('Failed to update ambulance status', { error });
        }
      }

      // Invalidate cache
      await cacheInvalidatePattern('emergencies:*');
      await cacheInvalidatePattern(`emergency:${id}`);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Emergency cancelled successfully' },
        meta: { timestamp: new Date().toISOString() },
      };

      logger.info('Emergency cancelled', { id });
      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Helper: Find nearest ambulances
  private static async findNearestAmbulances(lat: number, lng: number) {
    try {
      const response = await axios.get(
        `${process.env.AMBULANCE_SERVICE_URL}/api/v1/ambulance/nearby`,
        { params: { lat, lng, maxDistance: 50 }, timeout: 5000 }
      );
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to fetch ambulances', { error });
      return [];
    }
  }

  // Helper: Find nearby hospitals
  private static async findNearbyHospitals(lat: number, lng: number) {
    try {
      const response = await axios.get(
        `${process.env.HOSPITAL_SERVICE_URL}/api/v1/hospital/nearby`,
        { params: { lat, lng, maxDistance: 30 }, timeout: 5000 }
      );
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to fetch hospitals', { error });
      return [];
    }
  }
}
