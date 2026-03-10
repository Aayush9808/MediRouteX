import { Router } from 'express';
import { EmergencyController } from '../controllers/emergency.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createEmergencySchema, updateEmergencyStatusSchema } from '../utils/validators';

const router = Router();

/**
 * @route   POST /api/v1/emergency/create
 * @desc    Create new emergency request
 * @access  Public (can be called by anyone in emergency)
 */
router.post('/create', validateRequest(createEmergencySchema), EmergencyController.create);

/**
 * @route   GET /api/v1/emergency/active
 * @desc    Get all active emergencies
 * @access  Private (Admin, Dispatcher)
 */
router.get('/active', authMiddleware(['admin', 'dispatcher']), EmergencyController.getActive);

/**
 * @route   GET /api/v1/emergency/stats
 * @desc    Get emergency statistics
 * @access  Private (Admin, Dispatcher)
 */
router.get('/stats', authMiddleware(['admin', 'dispatcher']), EmergencyController.getStats);

/**
 * @route   GET /api/v1/emergency/:id
 * @desc    Get emergency by ID
 * @access  Private
 */
router.get('/:id', authMiddleware(), EmergencyController.getById);

/**
 * @route   GET /api/v1/emergency
 * @desc    Get all emergencies with pagination and filters
 * @access  Private (Admin, Dispatcher)
 */
router.get('/', authMiddleware(['admin', 'dispatcher']), EmergencyController.getAll);

/**
 * @route   PUT /api/v1/emergency/:id/status
 * @desc    Update emergency status
 * @access  Private (Admin, Dispatcher)
 */
router.put(
  '/:id/status',
  authMiddleware(['admin', 'dispatcher']),
  validateRequest(updateEmergencyStatusSchema),
  EmergencyController.updateStatus
);

/**
 * @route   PUT /api/v1/emergency/:id/assign-ambulance
 * @desc    Assign ambulance to emergency
 * @access  Private (Admin, Dispatcher)
 */
router.put(
  '/:id/assign-ambulance',
  authMiddleware(['admin', 'dispatcher']),
  EmergencyController.assignAmbulance
);

/**
 * @route   PUT /api/v1/emergency/:id/assign-hospital
 * @desc    Assign hospital to emergency
 * @access  Private (Admin, Dispatcher)
 */
router.put(
  '/:id/assign-hospital',
  authMiddleware(['admin', 'dispatcher']),
  EmergencyController.assignHospital
);

/**
 * @route   DELETE /api/v1/emergency/:id
 * @desc    Cancel emergency
 * @access  Private (Admin, Dispatcher)
 */
router.delete('/:id', authMiddleware(['admin', 'dispatcher']), EmergencyController.cancel);

export default router;
