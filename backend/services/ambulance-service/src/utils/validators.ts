import { z } from 'zod';

// Create Ambulance Schema
export const createAmbulanceSchema = z.object({
  registrationNumber: z.string().min(3).max(50),
  type: z.enum(['Basic', 'Advanced', 'ICU']),
  equipmentLevel: z.string().optional(),
  baseLocation: z.object({
    address: z.string().min(5),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  driverName: z.string().min(2).max(100).optional(),
  driverPhone: z.string().regex(/^\+?[\d\s\-()]+$/).optional(),
});

// Update Status Schema
export const updateAmbulanceStatusSchema = z.object({
  status: z.enum(['Available', 'Busy', 'Offline', 'Maintenance']),
  assignedEmergencyId: z.string().uuid().nullable().optional(),
});

// Update Location Schema
export const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
  timestamp: z.string().datetime().optional(),
});

// Assign Driver Schema
export const assignDriverSchema = z.object({
  driverId: z.string().uuid(),
  driverName: z.string().min(2).max(100),
  driverPhone: z.string().regex(/^\+?[\d\s\-()]+$/),
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.preprocess(val => Number(val) || 1, z.number().positive().default(1)),
  limit: z.preprocess(val => Number(val) || 20, z.number().positive().max(100).default(20)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Filter Ambulances Schema
export const filterAmbulancesSchema = z.object({
  status: z.enum(['Available', 'Busy', 'Offline', 'Maintenance']).optional(),
  type: z.enum(['Basic', 'Advanced', 'ICU']).optional(),
  hasDriver: z.preprocess(val => val === 'true' || val === true, z.boolean()).optional(),
});

// Nearby Query Schema
export const nearbyQuerySchema = z.object({
  lat: z.preprocess(val => parseFloat(val as string), z.number().min(-90).max(90)),
  lng: z.preprocess(val => parseFloat(val as string), z.number().min(-180).max(180)),
  maxDistance: z.preprocess(val => val ? parseFloat(val as string) : 50, z.number().positive().default(50)),
  type: z.enum(['Basic', 'Advanced', 'ICU']).optional(),
  status: z.enum(['Available', 'Busy']).optional(),
});

// Validation helper
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

export const validateAsync = async <T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> => {
  return await schema.parseAsync(data);
};
