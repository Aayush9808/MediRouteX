import { z } from 'zod';

/**
 * Validation Schemas for Hospital Service
 * Using Zod for runtime validation and type inference
 */

// ==================== Hospital Validation Schemas ====================

export const createHospitalSchema = z.object({
  name: z.string().min(3, 'Hospital name must be at least 3 characters').max(200),
  type: z.enum(['government', 'private', 'specialized', 'clinic']),
  address: z.string().min(10, 'Address must be at least 10 characters').max(500),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  contact_number: z.string().regex(/^\+?[\d\s-()]{10,15}$/, 'Invalid contact number'),
  email: z.string().email('Invalid email address'),
  emergency_contact: z.string().regex(/^\+?[\d\s-()]{10,15}$/, 'Invalid emergency contact'),
  is_trauma_center: z.boolean().default(false),
  specializations: z.array(z.enum([
    'cardiology',
    'neurology',
    'orthopedics',
    'pediatrics',
    'trauma',
    'burn',
    'maternity',
    'oncology',
    'general'
  ])).min(1, 'At least one specialization is required'),
});

export const updateHospitalSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  type: z.enum(['government', 'private', 'specialized', 'clinic']).optional(),
  status: z.enum(['operational', 'maintenance', 'emergency_only', 'closed']).optional(),
  address: z.string().min(10).max(500).optional(),
  city: z.string().min(2).max(100).optional(),
  state: z.string().min(2).max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  contact_number: z.string().regex(/^\+?[\d\s-()]{10,15}$/).optional(),
  email: z.string().email().optional(),
  emergency_contact: z.string().regex(/^\+?[\d\s-()]{10,15}$/).optional(),
  is_trauma_center: z.boolean().optional(),
  specializations: z.array(z.enum([
    'cardiology',
    'neurology',
    'orthopedics',
    'pediatrics',
    'trauma',
    'burn',
    'maternity',
    'oncology',
    'general'
  ])).optional(),
  rating: z.number().min(0).max(5).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// ==================== Bed Capacity Validation Schemas ====================

export const bedCapacitySchema = z.object({
  bed_type: z.enum(['icu', 'emergency', 'general', 'ventilator', 'isolation']),
  total_beds: z.number().int().min(0, 'Total beds cannot be negative'),
  available_beds: z.number().int().min(0, 'Available beds cannot be negative'),
  occupied_beds: z.number().int().min(0, 'Occupied beds cannot be negative'),
  reserved_beds: z.number().int().min(0, 'Reserved beds cannot be negative'),
  maintenance_beds: z.number().int().min(0, 'Maintenance beds cannot be negative'),
}).refine(data => {
  const sum = data.available_beds + data.occupied_beds + data.reserved_beds + data.maintenance_beds;
  return sum === data.total_beds;
}, {
  message: 'Sum of available, occupied, reserved, and maintenance beds must equal total beds',
});

export const updateBedCapacitySchema = z.object({
  total_beds: z.number().int().min(0).optional(),
  available_beds: z.number().int().min(0).optional(),
  occupied_beds: z.number().int().min(0).optional(),
  reserved_beds: z.number().int().min(0).optional(),
  maintenance_beds: z.number().int().min(0).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const bedAllocationSchema = z.object({
  bed_type: z.enum(['icu', 'emergency', 'general', 'ventilator', 'isolation']),
  emergency_id: z.string().uuid('Invalid emergency ID'),
  allocated_by: z.string().uuid('Invalid user ID'),
  expected_release_at: z.string().datetime().optional(),
});

// ==================== Search & Query Validation Schemas ====================

export const nearbyHospitalsQuerySchema = z.object({
  latitude: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(-90).max(90)
  ),
  longitude: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(-180).max(180)
  ),
  max_distance_km: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0.1).max(100).default(20)
  ),
  required_bed_type: z.enum(['icu', 'emergency', 'general', 'ventilator', 'isolation']).optional(),
  min_available_beds: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(1).optional()
  ),
  is_trauma_center: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional()
  ),
  specializations: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',') : val),
    z.array(z.enum([
      'cardiology',
      'neurology',
      'orthopedics',
      'pediatrics',
      'trauma',
      'burn',
      'maternity',
      'oncology',
      'general'
    ])).optional()
  ),
  hospital_type: z.enum(['government', 'private', 'specialized', 'clinic']).optional(),
});

export const hospitalSearchQuerySchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  hospital_type: z.enum(['government', 'private', 'specialized', 'clinic']).optional(),
  status: z.enum(['operational', 'maintenance', 'emergency_only', 'closed']).optional(),
  is_trauma_center: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional()
  ),
  specializations: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',') : val),
    z.array(z.enum([
      'cardiology',
      'neurology',
      'orthopedics',
      'pediatrics',
      'trauma',
      'burn',
      'maternity',
      'oncology',
      'general'
    ])).optional()
  ),
  min_rating: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).max(5).optional()
  ),
  has_available_beds: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional()
  ),
  page: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(1).default(1)
  ),
  limit: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(1).max(100).default(20)
  ),
});

// ==================== Helper Functions ====================

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${messages}`);
    }
    throw error;
  }
}
