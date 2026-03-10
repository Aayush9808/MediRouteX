/**
 * Routing Service Routes
 * API endpoints for route calculation and navigation
 */

import { Router } from 'express';
import { RouteController } from '../controllers/route.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  routeRequestSchema,
  optimizedRouteRequestSchema,
  trafficConditionSchema,
  etaRequestSchema
} from '../utils/validators';

const router = Router();

// ==================== Route Calculation ====================

/**
 * Calculate route between two points
 * POST /api/v1/routes/calculate
 * Auth: Required
 */
router.post(
  '/calculate',
  authenticate(),
  validateRequest(routeRequestSchema),
  RouteController.calculateRoute
);

/**
 * Calculate optimized emergency route (ambulance -> patient -> hospital)
 * POST /api/v1/routes/optimize
 * Auth: Required (dispatcher, driver, admin)
 */
router.post(
  '/optimize',
  authenticate(['admin', 'dispatcher', 'driver']),
  validateRequest(optimizedRouteRequestSchema),
  RouteController.calculateOptimizedRoute
);

/**
 * Get alternative routes
 * POST /api/v1/routes/alternatives
 * Auth: Required
 */
router.post(
  '/alternatives',
  authenticate(),
  validateRequest(routeRequestSchema),
  RouteController.getAlternatives
);

/**
 * Calculate ETA
 * POST /api/v1/routes/eta
 * Auth: Required
 */
router.post(
  '/eta',
  authenticate(),
  validateRequest(etaRequestSchema),
  RouteController.calculateETA
);

/**
 * Get route by ID
 * GET /api/v1/routes/:id
 * Auth: Required
 */
router.get(
  '/:id',
  authenticate(),
  RouteController.getById
);

// ==================== Traffic ====================

/**
 * Get traffic conditions for area
 * GET /api/v1/routes/traffic
 * Auth: Optional (public endpoint with more data for authenticated users)
 */
router.get(
  '/traffic',
  optionalAuth(),
  RouteController.getTrafficConditions
);

/**
 * Report traffic condition
 * POST /api/v1/routes/traffic
 * Auth: Required
 */
router.post(
  '/traffic',
  authenticate(),
  validateRequest(trafficConditionSchema),
  RouteController.reportTraffic
);

// ==================== Utilities ====================

/**
 * Quick distance calculation
 * GET /api/v1/routes/distance
 * Auth: Optional (public utility)
 */
router.get(
  '/distance',
  optionalAuth(),
  RouteController.calculateDistanceQuick
);

/**
 * Get routing statistics
 * GET /api/v1/routes/stats
 * Auth: Required (admin, dispatcher)
 */
router.get(
  '/stats',
  authenticate(['admin', 'dispatcher']),
  RouteController.getStats
);

export default router;
