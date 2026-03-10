/**
 * Hospital Controller
 * Handles HTTP requests for hospital and bed capacity management
 */

import { Request, Response, NextFunction } from 'express';
import HospitalModel from '../models/hospital.model';
import { validate } from '../utils/validators';
import {
  createHospitalSchema,
  updateHospitalSchema,
  nearbyHospitalsQuerySchema,
  hospitalSearchQuerySchema,
  bedCapacitySchema,
  updateBedCapacitySchema,
} from '../utils/validators';
import { generateCapacityAlert } from '../utils/helpers';
import logger from '../utils/logger';

export class HospitalController {
  // ==================== Hospital CRUD Operations ====================

  /**
   * Create a new hospital
   * POST /api/v1/hospitals
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = validate(createHospitalSchema, req.body) as any;
      const hospital = await HospitalModel.create(validatedData);

      // TODO: Emit WebSocket event for new hospital registration
      // io.to('dispatch').emit('hospital:created', hospital);

      return res.status(201).json({
        success: true,
        message: 'Hospital created successfully',
        data: hospital,
      });
    } catch (error) {
      logger.error('Error in create hospital:', error);
      return next(error);
    }
  }

  /**
   * Get hospital by ID
   * GET /api/v1/hospitals/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const hospital = await HospitalModel.findById(id);

      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: 'Hospital not found',
        });
      }

      return res.json({
        success: true,
        data: hospital,
      });
    } catch (error) {
      logger.error('Error in getById hospital:', error);
      return next(error);
    }
  }

  /**
   * Get all hospitals with filters and pagination
   * GET /api/v1/hospitals
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = validate(hospitalSearchQuerySchema, req.query) as any;
      const { page, limit, ...filters } = validatedQuery;

      const result = await HospitalModel.findAll(filters, page, limit);

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error in getAll hospitals:', error);
      return next(error);
    }
  }

  /**
   * Get nearby hospitals with available beds (Public API - No auth required)
   * GET /api/v1/hospitals/nearby
   */
  static async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = validate(nearbyHospitalsQuerySchema, req.query) as any;
      
      const hospitals = await HospitalModel.findNearby(validatedQuery);

      return res.json({
        success: true,
        message: `Found ${hospitals.length} hospitals within ${validatedQuery.max_distance_km} km`,
        data: hospitals,
      });
    } catch (error) {
      logger.error('Error in getNearby hospitals:', error);
      return next(error);
    }
  }

  /**
   * Update hospital
   * PUT /api/v1/hospitals/:id
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = validate(updateHospitalSchema, req.body);

      const hospital = await HospitalModel.update(id, validatedData);

      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: 'Hospital not found',
        });
      }

      // TODO: Emit WebSocket event for hospital update
      // io.to('dispatch').emit('hospital:updated', hospital);

      return res.json({
        success: true,
        message: 'Hospital updated successfully',
        data: hospital,
      });
    } catch (error) {
      logger.error('Error in update hospital:', error);
      return next(error);
    }
  }

  /**
   * Delete hospital
   * DELETE /api/v1/hospitals/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await HospitalModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Hospital not found',
        });
      }

      return res.json({
        success: true,
        message: 'Hospital deleted successfully',
      });
    } catch (error) {
      logger.error('Error in delete hospital:', error);
      return next(error);
    }
  }

  // ==================== Bed Capacity Operations ====================

  /**
   * Create bed capacity for a hospital
   * POST /api/v1/hospitals/:id/beds
   */
  static async createBedCapacity(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: hospitalId } = req.params;
      
      // Check if hospital exists
      const hospital = await HospitalModel.findById(hospitalId);
      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: 'Hospital not found',
        });
      }

      const validatedData = validate(bedCapacitySchema, req.body);
      const bedCapacity = await HospitalModel.createBedCapacity(hospitalId, validatedData);

      // Check if capacity alert needed
      const alert = generateCapacityAlert(hospitalId, hospital.name, bedCapacity);
      if (alert) {
        // TODO: Emit WebSocket alert
        // io.to('dispatch').emit('capacity:alert', alert);
        logger.warn(`Capacity alert for ${hospital.name}: ${alert.alert_type}`);
      }

      return res.status(201).json({
        success: true,
        message: 'Bed capacity created successfully',
        data: bedCapacity,
        alert: alert || undefined,
      });
    } catch (error) {
      logger.error('Error in createBedCapacity:', error);
      return next(error);
    }
  }

  /**
   * Get bed capacity for a hospital
   * GET /api/v1/hospitals/:id/beds
   */
  static async getBedCapacity(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: hospitalId } = req.params;
      
      const bedCapacities = await HospitalModel.getBedCapacity(hospitalId);

      return res.json({
        success: true,
        data: bedCapacities,
      });
    } catch (error) {
      logger.error('Error in getBedCapacity:', error);
      return next(error);
    }
  }

  /**
   * Update bed capacity
   * PATCH /api/v1/hospitals/:id/beds/:bedType
   */
  static async updateBedCapacity(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: hospitalId, bedType } = req.params;
      
      // Check if hospital exists
      const hospital = await HospitalModel.findById(hospitalId);
      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: 'Hospital not found',
        });
      }

      const validatedData = validate(updateBedCapacitySchema, req.body);
      const bedCapacity = await HospitalModel.updateBedCapacity(
        hospitalId,
        bedType,
        validatedData
      );

      if (!bedCapacity) {
        return res.status(404).json({
          success: false,
          message: 'Bed capacity not found for this bed type',
        });
      }

      // Emit WebSocket event for real-time bed updates
      // TODO: Uncomment after WebSocket setup
      // io.to('dispatch').emit('bed:updated', {
      //   hospital_id: hospitalId,
      //   bed_type: bedType,
      //   available_beds: bedCapacity.available_beds,
      //   total_beds: bedCapacity.total_beds,
      //   timestamp: new Date(),
      // });

      // Check if capacity alert needed
      const alert = generateCapacityAlert(hospitalId, hospital.name, bedCapacity);
      if (alert) {
        // TODO: Emit WebSocket alert
        // io.to('dispatch').emit('capacity:alert', alert);
        logger.warn(`Capacity alert for ${hospital.name}: ${alert.alert_type}`);
      }

      return res.json({
        success: true,
        message: 'Bed capacity updated successfully',
        data: bedCapacity,
        alert: alert || undefined,
      });
    } catch (error) {
      logger.error('Error in updateBedCapacity:', error);
      return next(error);
    }
  }

  // ==================== Statistics Operations ====================

  /**
   * Get overall hospital statistics
   * GET /api/v1/hospitals/stats/overview
   */
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await HospitalModel.getStats();

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error in getStats:', error);
      return next(error);
    }
  }

  /**
   * Get capacity statistics for a specific hospital
   * GET /api/v1/hospitals/:id/stats/capacity
   */
  static async getCapacityStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: hospitalId } = req.params;
      
      const stats = await HospitalModel.getHospitalCapacityStats(hospitalId);

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Hospital not found',
        });
      }

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error in getCapacityStats:', error);
      return next(error);
    }
  }
}

export default HospitalController;
