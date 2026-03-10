/**
 * Hospital Service Type Definitions
 * Core types for hospital management and bed availability tracking
 */

// ==================== Base Types ====================

export type HospitalType = 'government' | 'private' | 'specialized' | 'clinic';
export type HospitalStatus = 'operational' | 'maintenance' | 'emergency_only' | 'closed';
export type BedType = 'icu' | 'emergency' | 'general' | 'ventilator' | 'isolation';
export type BedStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
export type SpecializationType = 
  | 'cardiology' 
  | 'neurology' 
  | 'orthopedics' 
  | 'pediatrics' 
  | 'trauma' 
  | 'burn' 
  | 'maternity' 
  | 'oncology'
  | 'general';

// ==================== Hospital Interface ====================

export interface Hospital {
  id: string;
  name: string;
  type: HospitalType;
  status: HospitalStatus;
  address: string;
  city: string;
  state: string;
  pincode: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  contact_number: string;
  email: string;
  emergency_contact: string;
  is_trauma_center: boolean;
  specializations: SpecializationType[];
  rating: number; // 0-5
  total_beds: number;
  available_beds: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateHospitalDTO {
  name: string;
  type: HospitalType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  contact_number: string;
  email: string;
  emergency_contact: string;
  is_trauma_center: boolean;
  specializations: SpecializationType[];
}

export interface UpdateHospitalDTO {
  name?: string;
  type?: HospitalType;
  status?: HospitalStatus;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  contact_number?: string;
  email?: string;
  emergency_contact?: string;
  is_trauma_center?: boolean;
  specializations?: SpecializationType[];
  rating?: number;
}

// ==================== Bed Capacity Interface ====================

export interface BedCapacity {
  id: string;
  hospital_id: string;
  bed_type: BedType;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  reserved_beds: number;
  maintenance_beds: number;
  last_updated: Date;
  created_at: Date;
  updated_at: Date;
}

export interface BedCapacityDTO {
  bed_type: BedType;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  reserved_beds: number;
  maintenance_beds: number;
}

export interface UpdateBedCapacityDTO {
  total_beds?: number;
  available_beds?: number;
  occupied_beds?: number;
  reserved_beds?: number;
  maintenance_beds?: number;
}

export interface BedAllocation {
  hospital_id: string;
  bed_type: BedType;
  emergency_id: string;
  allocated_by: string;
  allocated_at: Date;
  expected_release_at?: Date;
}

// ==================== Search & Filter Types ====================

export interface HospitalWithDistance extends Hospital {
  distance_km: number;
  estimated_time_minutes: number;
  bed_availability: BedCapacitySummary[];
}

export interface BedCapacitySummary {
  bed_type: BedType;
  total_beds: number;
  available_beds: number;
  occupancy_percent: number;
}

export interface NearbyHospitalFilters {
  latitude: number;
  longitude: number;
  max_distance_km: number;
  required_bed_type?: BedType;
  min_available_beds?: number;
  is_trauma_center?: boolean;
  specializations?: SpecializationType[];
  hospital_type?: HospitalType;
  status?: HospitalStatus[];
}

export interface HospitalSearchFilters {
  city?: string;
  state?: string;
  hospital_type?: HospitalType;
  status?: HospitalStatus;
  is_trauma_center?: boolean;
  specializations?: SpecializationType[];
  min_rating?: number;
  has_available_beds?: boolean;
}

// ==================== Statistics Types ====================

export interface HospitalStats {
  total_hospitals: number;
  operational_hospitals: number;
  total_beds_all_hospitals: number;
  available_beds_all_hospitals: number;
  average_occupancy_percent: number;
  bed_type_distribution: {
    bed_type: BedType;
    total_beds: number;
    available_beds: number;
    occupancy_percent: number;
  }[];
  hospitals_by_type: {
    type: HospitalType;
    count: number;
  }[];
  trauma_centers_count: number;
}

export interface HospitalCapacityStats {
  hospital_id: string;
  hospital_name: string;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  reserved_beds: number;
  overall_occupancy_percent: number;
  bed_types: {
    bed_type: BedType;
    total: number;
    available: number;
    occupancy_percent: number;
  }[];
  last_updated: Date;
}

// ==================== Alert Types ====================

export interface CapacityAlert {
  hospital_id: string;
  hospital_name: string;
  alert_type: 'low_capacity' | 'critical_capacity' | 'full_capacity';
  bed_type: BedType;
  available_beds: number;
  total_beds: number;
  occupancy_percent: number;
  timestamp: Date;
}

// ==================== WebSocket Event Types ====================

export interface BedUpdateEvent {
  hospital_id: string;
  bed_type: BedType;
  available_beds: number;
  total_beds: number;
  occupancy_percent: number;
  timestamp: Date;
}

export interface CapacityAlertEvent extends CapacityAlert {
  severity: 'warning' | 'critical';
}

// ==================== Service Response Types ====================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ==================== Auth Types ====================

import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'dispatcher' | 'driver' | 'hospital_staff' | 'hospital_admin' | 'user';
  phone?: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

// ==================== Cache Key Types ====================

export interface HospitalCacheKeys {
  HOSPITAL_BY_ID: (id: string) => string;
  HOSPITAL_CAPACITY: (id: string) => string;
  NEARBY_HOSPITALS: (lat: number, lng: number, radius: number) => string;
  HOSPITAL_STATS: () => string;
}
