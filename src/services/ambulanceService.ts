/**
 * Ambulance Service
 * Handles ambulance operations and tracking
 */

import { ambulanceApi, apiCall } from './api';

export interface Ambulance {
  id: string;
  registration_number: string;
  type: string;
  status: 'available' | 'on_route' | 'busy' | 'maintenance';
  current_location_lat?: number;
  current_location_lng?: number;
  driver_id?: string;
  driver_name?: string;
  equipment: string[];
  created_at: string;
  updated_at: string;
}

class AmbulanceService {
  /**
   * Get all ambulances
   */
  async getAll(params?: { status?: string; type?: string }): Promise<Ambulance[]> {
    const response = await apiCall<{ ambulances: Ambulance[] }>(
      ambulanceApi.get('/ambulances', { params }),
      { silent: true }
    );
    return response.ambulances;
  }

  /**
   * Get available ambulances
   */
  async getAvailable(): Promise<Ambulance[]> {
    const response = await apiCall<{ ambulances: Ambulance[] }>(
      ambulanceApi.get('/ambulances/available'),
      { silent: true }
    );
    return response.ambulances;
  }

  /**
   * Get nearby ambulances (public endpoint)
   */
  async getNearby(latitude: number, longitude: number, radius: number = 20): Promise<Ambulance[]> {
    const response = await apiCall<{ ambulances: Ambulance[] }>(
      ambulanceApi.get('/ambulances/nearby', {
        params: { latitude, longitude, radius_km: radius }
      }),
      { silent: true }
    );
    return response.ambulances;
  }

  /**
   * Get ambulance by ID
   */
  async getById(id: string): Promise<Ambulance> {
    return apiCall<Ambulance>(
      ambulanceApi.get(`/ambulances/${id}`),
      { silent: true }
    );
  }

  /**
   * Update ambulance location
   */
  async updateLocation(id: string, latitude: number, longitude: number): Promise<Ambulance> {
    return apiCall<Ambulance>(
      ambulanceApi.patch(`/ambulances/${id}/location`, {
        latitude,
        longitude
      }),
      { silent: true }
    );
  }

  /**
   * Update ambulance status
   */
  async updateStatus(id: string, status: string): Promise<Ambulance> {
    return apiCall<Ambulance>(
      ambulanceApi.patch(`/ambulances/${id}/status`, { status }),
      { successMessage: 'Status updated successfully!' }
    );
  }

  /**
   * Get ambulance statistics
   */
  async getStats(): Promise<any> {
    return apiCall(
      ambulanceApi.get('/ambulances/stats'),
      { silent: true }
    );
  }
}

export const ambulanceService = new AmbulanceService();
