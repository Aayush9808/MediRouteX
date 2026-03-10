import { z } from 'zod';

// Emergency validation schemas
export const createEmergencySchema = z.object({
  patientName: z.string().min(2, 'Patient name must be at least 2 characters').max(255),
  patientAge: z.string().min(1).max(10),
  patientGender: z.string().min(1).max(20),
  patientPhone: z.string().optional(),
  type: z.enum(['Medical', 'Accident', 'Fire', 'Natural Disaster', 'Other']),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  description: z.string().max(1000).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  locationAddress: z.string().max(500).optional(),
});

export const updateEmergencyStatusSchema = z.object({
  status: z.enum(['Pending', 'Dispatched', 'En Route', 'Arrived', 'Completed', 'Cancelled']),
  notes: z.string().max(500).optional(),
});

export const assignAmbulanceSchema = z.object({
  ambulanceId: z.string().uuid(),
  estimatedArrivalMinutes: z.number().positive().optional(),
});

export const assignHospitalSchema = z.object({
  hospitalId: z.string().uuid(),
});

export const paginationSchema = z.object({
  page: z.preprocess(val => Number(val) || 1, z.number().positive().default(1)),
  limit: z.preprocess(val => Number(val) || 20, z.number().positive().max(100).default(20)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const filterEmergenciesSchema = z.object({
  status: z.enum(['Pending', 'Dispatched', 'En Route', 'Arrived', 'Completed', 'Cancelled']).optional(),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
  type: z.enum(['Medical', 'Accident', 'Fire', 'Natural Disaster', 'Other']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

// Validation helper
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

export const validateAsync = async <T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> => {
  return await schema.parseAsync(data);
};
