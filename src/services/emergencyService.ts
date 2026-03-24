/**
 * Emergency Service
 * Handles emergency operations
 */

import { emergencyApi, apiCall, apiCallWithRetry } from './api';

export interface Emergency {
  id: string;
  reporter_name: string;
  reporter_phone: string;
  location_lat: number;
  location_lng: number;
  location_address: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  status: string;
  assigned_ambulance_id?: string;
  assigned_hospital_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmergencyData {
  reporter_name: string;
  reporter_phone: string;
  location_lat: number;
  location_lng: number;
  location_address: string;
  severity: string;
  type: string;
  description: string;
}

class EmergencyService {
  /**
   * Create new emergency
   */
  async create(data: CreateEmergencyData): Promise<Emergency> {
    return apiCall<Emergency>(
      emergencyApi.post('/emergencies', data),
      { successMessage: 'Emergency reported successfully!', errorMessage: 'Failed to report emergency' }
    );
  }

  /**
   * Get all emergencies
   */
  async getAll(
    params?: { status?: string; severity?: string; page?: number; limit?: number },
    signal?: AbortSignal
  ): Promise<{ emergencies: Emergency[]; total: number }> {
    return apiCallWithRetry(
      () => emergencyApi.get('/emergencies', { params, signal }),
      { silent: true }
    );
  }

  /**
   * Get active emergencies
   */
  async getActive(signal?: AbortSignal): Promise<Emergency[]> {
    const response = await apiCallWithRetry<{ emergencies: Emergency[] }>(
      () => emergencyApi.get('/emergencies/active', { signal }),
      { silent: true }
    );
    return response.emergencies;
  }

  /**
   * Get emergency by ID
   */
  async getById(id: string, signal?: AbortSignal): Promise<Emergency> {
    return apiCallWithRetry<Emergency>(
      () => emergencyApi.get(`/emergencies/${id}`, { signal }),
      { silent: true }
    );
  }

  /**
   * Update emergency status
   */
  async updateStatus(id: string, status: string, notes?: string): Promise<Emergency> {
    return apiCall<Emergency>(
      emergencyApi.patch(`/emergencies/${id}/status`, { status, notes }),
      { successMessage: 'Status updated successfully!' }
    );
  }

  /**
   * Assign ambulance to emergency
   */
  async assignAmbulance(emergencyId: string, ambulanceId: string): Promise<Emergency> {
    return apiCall<Emergency>(
      emergencyApi.post(`/emergencies/${emergencyId}/assign-ambulance`, { ambulance_id: ambulanceId }),
      { successMessage: 'Ambulance assigned successfully!' }
    );
  }

  /**
   * Assign hospital to emergency
   */
  async assignHospital(emergencyId: string, hospitalId: string): Promise<Emergency> {
    return apiCall<Emergency>(
      emergencyApi.post(`/emergencies/${emergencyId}/assign-hospital`, { hospital_id: hospitalId }),
      { successMessage: 'Hospital assigned successfully!' }
    );
  }

  /**
   * Cancel emergency
   */
  async cancel(id: string, reason: string): Promise<Emergency> {
    return apiCall<Emergency>(
      emergencyApi.post(`/emergencies/${id}/cancel`, { reason }),
      { successMessage: 'Emergency cancelled' }
    );
  }

  /**
   * Get emergency statistics
   */
  async getStats(signal?: AbortSignal): Promise<any> {
    return apiCallWithRetry(
      () => emergencyApi.get('/emergencies/stats', { signal }),
      { silent: true }
    );
  }
}

export const emergencyService = new EmergencyService();
