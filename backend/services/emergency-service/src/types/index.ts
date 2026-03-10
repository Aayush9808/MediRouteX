import { Request } from 'express';

// Emergency Types
export interface Emergency {
  id: string;
  emergencyNumber: string;
  userId?: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  patientPhone?: string;
  type: EmergencyType;
  severity: Severity;
  description?: string;
  locationLat: number;
  locationLng: number;
  locationAddress?: string;
  status: EmergencyStatus;
  priorityScore: number;
  assignedAmbulanceId?: string;
  assignedHospitalId?: string;
  assignedDispatcherId?: string;
  createdAt: Date;
  updatedAt: Date;
  dispatchedAt?: Date;
  arrivedAt?: Date;
  completedAt?: Date;
  responseTimeSeconds?: number;
  arrivalTimeSeconds?: number;
  totalTimeSeconds?: number;
}

export type EmergencyType = 'Medical' | 'Accident' | 'Fire' | 'Natural Disaster' | 'Other';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type EmergencyStatus = 'Pending' | 'Dispatched' | 'En Route' | 'Arrived' | 'Completed' | 'Cancelled';

export interface CreateEmergencyInput {
  patientName: string;
  patientAge: string;
  patientGender: string;
  patientPhone?: string;
  type: EmergencyType;
  severity: Severity;
  description?: string;
  location: {
    lat: number;
    lng: number;
  };
  locationAddress?: string;
}

export interface UpdateEmergencyStatusInput {
  status: EmergencyStatus;
  notes?: string;
}

export interface AssignAmbulanceInput {
  ambulanceId: string;
  estimatedArrivalMinutes?: number;
}

export interface AssignHospitalInput {
  hospitalId: string;
}

// Ambulance Types (from ambulance service)
export interface Ambulance {
  id: string;
  registrationNumber: string;
  driverName?: string;
  type: 'Basic' | 'Advanced' | 'ICU';
  status: 'Available' | 'Busy' | 'Offline' | 'Maintenance';
  currentLocationLat?: number;
  currentLocationLng?: number;
  distanceKm?: number;
  estimatedTimeMinutes?: number;
}

// Hospital Types (from hospital service)
export interface Hospital {
  id: string;
  name: string;
  address: string;
  distanceKm?: number;
  icuBedsAvailable: number;
  emergencyBedsAvailable: number;
  generalBedsAvailable: number;
}

// Route Types (from routing service)
export interface RouteResult {
  distance: number;
  duration: number;
  path: [number, number][];
}

// Analytics Types
export interface EmergencyStats {
  totalEmergencies: number;
  activeEmergencies: number;
  completedToday: number;
  avgResponseTime: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'dispatcher' | 'driver' | 'hospital_staff' | 'user';
}

// Request with authenticated user
export interface AuthRequest extends Request {
  user?: User;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// WebSocket Events
export interface EmergencyUpdateEvent {
  type: 'emergency:created' | 'emergency:updated' | 'emergency:completed';
  emergency: Emergency;
}

export interface AmbulanceDispatchedEvent {
  type: 'ambulance:dispatched';
  emergencyId: string;
  ambulanceId: string;
  eta: number;
}
