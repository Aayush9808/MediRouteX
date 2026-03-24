/**
 * Hospital Service
 * Handles hospital and bed capacity operations
 */

import { hospitalApi, apiCall, apiCallWithRetry } from './api';

export interface Hospital {
  id: string;
  name: string;
  type: string;
  location_lat: number;
  location_lng: number;
  address: string;
  phone: string;
  email?: string;
  specializations: string[];
  total_beds: number;
  available_beds: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BedCapacity {
  id: string;
  hospital_id: string;
  bed_type: string;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  reserved_beds: number;
  maintenance_beds: number;
}

class HospitalService {
  /**
   * Get all hospitals
   */
  async getAll(params?: { type?: string; status?: string }, signal?: AbortSignal): Promise<Hospital[]> {
    const response = await apiCallWithRetry<{ hospitals: Hospital[] }>(
      () => hospitalApi.get('/hospitals', { params, signal }),
      { silent: true }
    );
    return response.hospitals;
  }

  /**
   * Get nearby hospitals (public endpoint)
   */
  async getNearby(
    latitude: number,
    longitude: number,
    radius: number = 20,
    bedType?: string,
    signal?: AbortSignal
  ): Promise<Hospital[]> {
    const response = await apiCallWithRetry<{ hospitals: Hospital[] }>(
      () => hospitalApi.get('/hospitals/nearby', {
        params: { latitude, longitude, radius_km: radius, bed_type: bedType },
        signal,
      }),
      { silent: true }
    );
    return response.hospitals;
  }

  /**
   * Get hospital by ID
   */
  async getById(id: string, signal?: AbortSignal): Promise<Hospital> {
    return apiCallWithRetry<Hospital>(
      () => hospitalApi.get(`/hospitals/${id}`, { signal }),
      { silent: true }
    );
  }

  /**
   * Get bed capacity for hospital
   */
  async getBedCapacity(hospitalId: string, signal?: AbortSignal): Promise<BedCapacity[]> {
    const response = await apiCallWithRetry<{ capacities: BedCapacity[] }>(
      () => hospitalApi.get(`/hospitals/${hospitalId}/bed-capacity`, { signal }),
      { silent: true }
    );
    return response.capacities;
  }

  /**
   * Update bed capacity
   */
  async updateBedCapacity(
    hospitalId: string,
    bedType: string,
    data: {
      available_beds?: number;
      occupied_beds?: number;
      reserved_beds?: number;
      maintenance_beds?: number;
    }
  ): Promise<BedCapacity> {
    return apiCall<BedCapacity>(
      hospitalApi.patch(`/hospitals/${hospitalId}/bed-capacity/${bedType}`, data),
      { successMessage: 'Bed capacity updated!' }
    );
  }

  /**
   * Get hospital statistics
   */
  async getStats(signal?: AbortSignal): Promise<any> {
    return apiCallWithRetry(
      () => hospitalApi.get('/hospitals/stats', { signal }),
      { silent: true }
    );
  }

  /**
   * Get capacity statistics
   */
  async getCapacityStats(signal?: AbortSignal): Promise<any> {
    return apiCallWithRetry(
      () => hospitalApi.get('/hospitals/capacity-stats', { signal }),
      { silent: true }
    );
  }
}

export const hospitalService = new HospitalService();
