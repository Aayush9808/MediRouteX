/**
 * Hospital Service Routes
 * API endpoints for hospital and bed capacity management
 */

import { Router } from 'express';
import HospitalController from '../controllers/hospital.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createHospitalSchema,
  updateHospitalSchema,
  bedCapacitySchema,
  updateBedCapacitySchema,
} from '../utils/validators';

const router = Router();

// ==================== Public Routes (No Authentication) ====================

/**
 * GET /nearby - Find nearby hospitals with available beds
 * Public API for emergency services and patients
 */
router.get('/nearby', HospitalController.getNearby);

// ==================== Protected Routes (Require Authentication) ====================

/**
 * POST / - Create a new hospital
 * Requires: admin role
 */
router.post(
  '/',
  authenticate(['admin', 'hospital_admin']),
  validateRequest(createHospitalSchema),
  HospitalController.create
);

/**
 * GET / - Get all hospitals with filters
 * Requires: authenticated user
 */
router.get(
  '/',
  authenticate(['admin', 'dispatcher', 'hospital_staff', 'hospital_admin']),
  HospitalController.getAll
);

/**
 * GET /stats/overview - Get overall statistics
 * Requires: admin or dispatcher role
 */
router.get(
  '/stats/overview',
  authenticate(['admin', 'dispatcher']),
  HospitalController.getStats
);

/**
 * GET /:id - Get hospital by ID
 * Requires: authenticated user
 */
router.get(
  '/:id',
  authenticate(['admin', 'dispatcher', 'hospital_staff', 'hospital_admin', 'driver']),
  HospitalController.getById
);

/**
 * PUT /:id - Update hospital
 * Requires: admin or hospital_admin role
 */
router.put(
  '/:id',
  authenticate(['admin', 'hospital_admin']),
  validateRequest(updateHospitalSchema),
  HospitalController.update
);

/**
 * DELETE /:id - Delete hospital
 * Requires: admin role only
 */
router.delete(
  '/:id',
  authenticate(['admin']),
  HospitalController.delete
);

// ==================== Bed Capacity Routes ====================

/**
 * POST /:id/beds - Create bed capacity entry
 * Requires: admin or hospital_admin role
 */
router.post(
  '/:id/beds',
  authenticate(['admin', 'hospital_admin', 'hospital_staff']),
  validateRequest(bedCapacitySchema),
  HospitalController.createBedCapacity
);

/**
 * GET /:id/beds - Get bed capacity for hospital
 * Requires: authenticated user
 */
router.get(
  '/:id/beds',
  authenticate(['admin', 'dispatcher', 'hospital_staff', 'hospital_admin']),
  HospitalController.getBedCapacity
);

/**
 * PATCH /:id/beds/:bedType - Update bed capacity
 * Requires: hospital_staff or higher
 */
router.patch(
  '/:id/beds/:bedType',
  authenticate(['admin', 'hospital_admin', 'hospital_staff']),
  validateRequest(updateBedCapacitySchema),
  HospitalController.updateBedCapacity
);

// ==================== Statistics Routes ====================

/**
 * GET /:id/stats/capacity - Get capacity statistics for hospital
 * Requires: authenticated user
 */
router.get(
  '/:id/stats/capacity',
  authenticate(['admin', 'dispatcher', 'hospital_staff', 'hospital_admin']),
  HospitalController.getCapacityStats
);

export default router;
