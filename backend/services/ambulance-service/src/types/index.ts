import { Request } from 'express';

// Ambulance Types
export interface Ambulance {
  id: string;
  registrationNumber: string;
  type: 'Basic' | 'Advanced' | 'ICU';
  equipmentLevel: string;
  status: 'Available' | 'Busy' | 'Offline' | 'Maintenance';
  currentLocationLat: number | null;
  currentLocationLng: number | null;
  lastLocationUpdate: Date | null;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  assignedEmergencyId: string | null;
  baseLocationLat: number;
  baseLocationLng: number;
  baseLocationAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create Ambulance Input
export interface CreateAmbulanceInput {
  registrationNumber: string;
  type: 'Basic' | 'Advanced' | 'ICU';
  equipmentLevel?: string;
  baseLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  driverName?: string;
  driverPhone?: string;
}

// Update Ambulance Status
export interface UpdateAmbulanceStatusInput {
  status: 'Available' | 'Busy' | 'Offline' | 'Maintenance';
  assignedEmergencyId?: string | null;
}

// Update Location Input
export interface UpdateLocationInput {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: string;
}

// Assign Driver Input
export interface AssignDriverInput {
  driverId: string;
  driverName: string;
  driverPhone: string;
}

// Nearby Ambulance Query
export interface NearbyAmbulanceQuery {
  lat: number;
  lng: number;
  maxDistance?: number; // in kilometers
  type?: 'Basic' | 'Advanced' | 'ICU';
  status?: 'Available' | 'Busy';
}

// Ambulance with Distance
export interface AmbulanceWithDistance extends Ambulance {
  distanceKm: number;
  estimatedTimeMinutes: number;
}

// GPS Tracking Data
export interface GPSTrackingData {
  ambulanceId: string;
  lat: number;
  lng: number;
  speed?: number; // km/h
  heading?: number; // degrees
  accuracy: number; // meters
  timestamp: Date;
}

// Ambulance Statistics
export interface AmbulanceStats {
  totalAmbulances: number;
  availableAmbulances: number;
  busyAmbulances: number;
  offlineAmbulances: number;
  maintenanceAmbulances: number;
  basicCount: number;
  advancedCount: number;
  icuCount: number;
  avgResponseTime: number;
  totalTripsToday: number;
}

// User Types (from auth service)
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

// Filter Ambulances
export interface FilterAmbulancesParams {
  status?: 'Available' | 'Busy' | 'Offline' | 'Maintenance';
  type?: 'Basic' | 'Advanced' | 'ICU';
  hasDriver?: boolean;
}

// WebSocket Events
export interface AmbulanceLocationUpdateEvent {
  type: 'ambulance:location';
  ambulanceId: string;
  location: {
    lat: number;
    lng: number;
  };
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface AmbulanceStatusUpdateEvent {
  type: 'ambulance:status';
  ambulanceId: string;
  status: string;
  assignedEmergencyId?: string;
  timestamp: string;
}

export interface AmbulanceDispatchedEvent {
  type: 'ambulance:dispatched';
  ambulanceId: string;
  emergencyId: string;
  eta: number;
  distance: number;
  timestamp: string;
}
