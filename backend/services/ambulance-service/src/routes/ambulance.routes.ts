import { Router } from 'express';
import { AmbulanceController } from '../controllers/ambulance.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createAmbulanceSchema,
  updateAmbulanceStatusSchema,
  updateLocationSchema,
  assignDriverSchema,
} from '../utils/validators';

const router = Router();

/**
 * @route   POST /api/v1/ambulance/create
 * @desc    Create new ambulance
 * @access  Private (Admin only)
 */
router.post(
  '/create',
  authMiddleware(['admin']),
  validateRequest(createAmbulanceSchema),
  AmbulanceController.create
);

/**
 * @route   GET /api/v1/ambulance/available
 * @desc    Get all available ambulances
 * @access  Private (Admin, Dispatcher)
 */
router.get(
  '/available',
  authMiddleware(['admin', 'dispatcher']),
  AmbulanceController.getAvailable
);

/**
 * @route   GET /api/v1/ambulance/nearby
 * @desc    Find nearest ambulances to a location
 * @access  Public (for emergency requests)
 */
router.get('/nearby', AmbulanceController.getNearby);

/**
 * @route   GET /api/v1/ambulance/stats
 * @desc    Get ambulance statistics
 * @access  Private (Admin, Dispatcher)
 */
router.get(
  '/stats',
  authMiddleware(['admin', 'dispatcher']),
  AmbulanceController.getStats
);

/**
 * @route   GET /api/v1/ambulance/:id
 * @desc    Get ambulance by ID
 * @access  Private
 */
router.get('/:id', authMiddleware(), AmbulanceController.getById);

/**
 * @route   GET /api/v1/ambulance
 * @desc    Get all ambulances with pagination
 * @access  Private (Admin, Dispatcher)
 */
router.get('/', authMiddleware(['admin', 'dispatcher']), AmbulanceController.getAll);

/**
 * @route   PUT /api/v1/ambulance/:id/status
 * @desc    Update ambulance status
 * @access  Private (Admin, Dispatcher, Driver)
 */
router.put(
  '/:id/status',
  authMiddleware(['admin', 'dispatcher', 'driver']),
  validateRequest(updateAmbulanceStatusSchema),
  AmbulanceController.updateStatus
);

/**
 * @route   PUT /api/v1/ambulance/:id/location
 * @desc    Update ambulance GPS location
 * @access  Private (Driver - for their ambulance)
 */
router.put(
  '/:id/location',
  authMiddleware(['admin', 'dispatcher', 'driver']),
  validateRequest(updateLocationSchema),
  AmbulanceController.updateLocation
);

/**
 * @route   PUT /api/v1/ambulance/:id/assign-driver
 * @desc    Assign driver to ambulance
 * @access  Private (Admin, Dispatcher)
 */
router.put(
  '/:id/assign-driver',
  authMiddleware(['admin', 'dispatcher']),
  validateRequest(assignDriverSchema),
  AmbulanceController.assignDriver
);

/**
 * @route   DELETE /api/v1/ambulance/:id/driver
 * @desc    Remove driver from ambulance
 * @access  Private (Admin, Dispatcher)
 */
router.delete(
  '/:id/driver',
  authMiddleware(['admin', 'dispatcher']),
  AmbulanceController.removeDriver
);

/**
 * @route   DELETE /api/v1/ambulance/:id
 * @desc    Remove ambulance from service
 * @access  Private (Admin only)
 */
router.delete('/:id', authMiddleware(['admin']), AmbulanceController.delete);

export default router;
