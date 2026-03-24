/**
 * Ambulance Service
 * Handles ambulance operations and tracking
 */

import { ambulanceApi, apiCall, apiCallWithRetry } from './api';

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
  async getAll(params?: { status?: string; type?: string }, signal?: AbortSignal): Promise<Ambulance[]> {
    const response = await apiCallWithRetry<{ ambulances: Ambulance[] }>(
      () => ambulanceApi.get('/ambulances', { params, signal }),
      { silent: true }
    );
    return response.ambulances;
  }

  /**
   * Get available ambulances
   */
  async getAvailable(signal?: AbortSignal): Promise<Ambulance[]> {
    const response = await apiCallWithRetry<{ ambulances: Ambulance[] }>(
      () => ambulanceApi.get('/ambulances/available', { signal }),
      { silent: true }
    );
    return response.ambulances;
  }

  /**
   * Get nearby ambulances (public endpoint)
   */
  async getNearby(latitude: number, longitude: number, radius: number = 20, signal?: AbortSignal): Promise<Ambulance[]> {
    const response = await apiCallWithRetry<{ ambulances: Ambulance[] }>(
      () => ambulanceApi.get('/ambulances/nearby', {
        params: { latitude, longitude, radius_km: radius },
        signal,
      }),
      { silent: true }
    );
    return response.ambulances;
  }

  /**
   * Get ambulance by ID
   */
  async getById(id: string, signal?: AbortSignal): Promise<Ambulance> {
    return apiCallWithRetry<Ambulance>(
      () => ambulanceApi.get(`/ambulances/${id}`, { signal }),
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
  async getStats(signal?: AbortSignal): Promise<any> {
    return apiCallWithRetry(
      () => ambulanceApi.get('/ambulances/stats', { signal }),
      { silent: true }
    );
  }
}

export const ambulanceService = new AmbulanceService();
