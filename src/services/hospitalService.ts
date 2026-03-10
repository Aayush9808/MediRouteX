/**
 * Hospital Service
 * Handles hospital and bed capacity operations
 */

import { hospitalApi, apiCall } from './api';

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
  async getAll(params?: { type?: string; status?: string }): Promise<Hospital[]> {
    const response = await apiCall<{ hospitals: Hospital[] }>(
      hospitalApi.get('/hospitals', { params }),
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
    bedType?: string
  ): Promise<Hospital[]> {
    const response = await apiCall<{ hospitals: Hospital[] }>(
      hospitalApi.get('/hospitals/nearby', {
        params: { latitude, longitude, radius_km: radius, bed_type: bedType }
      }),
      { silent: true }
    );
    return response.hospitals;
  }

  /**
   * Get hospital by ID
   */
  async getById(id: string): Promise<Hospital> {
    return apiCall<Hospital>(
      hospitalApi.get(`/hospitals/${id}`),
      { silent: true }
    );
  }

  /**
   * Get bed capacity for hospital
   */
  async getBedCapacity(hospitalId: string): Promise<BedCapacity[]> {
    const response = await apiCall<{ capacities: BedCapacity[] }>(
      hospitalApi.get(`/hospitals/${hospitalId}/bed-capacity`),
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
  async getStats(): Promise<any> {
    return apiCall(
      hospitalApi.get('/hospitals/stats'),
      { silent: true }
    );
  }

  /**
   * Get capacity statistics
   */
  async getCapacityStats(): Promise<any> {
    return apiCall(
      hospitalApi.get('/hospitals/capacity-stats'),
      { silent: true }
    );
  }
}

export const hospitalService = new HospitalService();
