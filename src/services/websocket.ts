/**
 * WebSocket Service
 * Real-time updates for ambulances, emergencies, and system events
 */

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';
import toast from 'react-hot-toast';
import { normalizeRole } from '../utils/roles';

const WS_CONFIG = {
  AMBULANCE_WS: import.meta.env.VITE_AMBULANCE_WS_URL || 'http://localhost:5002',
  EMERGENCY_WS: import.meta.env.VITE_EMERGENCY_WS_URL || 'http://localhost:5001',
};

type EventCallback = (data: any) => void;

class WebSocketService {
  private ambulanceSocket: Socket | null = null;
  private emergencySocket: Socket | null = null;
  private isConnected = false;
  private connectedRole: string | null = null;

  private readonly supportedRoles = new Set([
    'admin',
    'patient',
    'driver',
    'hospital',
    'user',
    'blood_bank',
  ]);

  /**
   * Connect to WebSocket services
   */
  connect(role?: string) {
    const normalizedRole = normalizeRole(role);

    if (role && !this.supportedRoles.has(normalizedRole)) {
      return;
    }

    if (this.isConnected && this.connectedRole === normalizedRole) {
      return;
    }

    if (this.isConnected && this.connectedRole !== normalizedRole) {
      this.disconnect();
    }

    const token = getAccessToken();
    // In demo/mock mode we intentionally avoid backend sockets
    if (!token || token.startsWith('mock-')) {
      return;
    }
    const auth = token ? { auth: { token } } : {};

    try {
      // Connect to Ambulance Service WebSocket
      this.ambulanceSocket = io(WS_CONFIG.AMBULANCE_WS, {
        ...auth,
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        randomizationFactor: 0.5,
        reconnectionAttempts: 5,
      });

      // Connect to Emergency Service WebSocket
      this.emergencySocket = io(WS_CONFIG.EMERGENCY_WS, {
        ...auth,
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        randomizationFactor: 0.5,
        reconnectionAttempts: 5,
      });

      // Setup connection handlers
      this.setupConnectionHandlers();
      this.isConnected = true;
      this.connectedRole = normalizedRole;
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers() {
    // Ambulance socket handlers
    if (this.ambulanceSocket) {
      this.ambulanceSocket.on('connect', () => {
        console.log('✅ Connected to Ambulance WebSocket');
      });

      this.ambulanceSocket.on('disconnect', () => {
        console.log('❌ Disconnected from Ambulance WebSocket');
      });

      this.ambulanceSocket.on('connect_error', (error) => {
        console.error('Ambulance WebSocket error:', error);
      });
    }

    // Emergency socket handlers
    if (this.emergencySocket) {
      this.emergencySocket.on('connect', () => {
        console.log('✅ Connected to Emergency WebSocket');
      });

      this.emergencySocket.on('disconnect', () => {
        console.log('❌ Disconnected from Emergency WebSocket');
      });

      this.emergencySocket.on('connect_error', (error) => {
        console.error('Emergency WebSocket error:', error);
      });
    }
  }

  /**
   * Subscribe to ambulance location updates
   */
  onAmbulanceLocationUpdate(callback: EventCallback) {
    if (this.ambulanceSocket) {
      this.ambulanceSocket.on('location_update', callback);
    }
  }

  /**
   * Subscribe to ambulance status updates
   */
  onAmbulanceStatusUpdate(callback: EventCallback) {
    if (this.ambulanceSocket) {
      this.ambulanceSocket.on('status_update', callback);
    }
  }

  /**
   * Subscribe to new emergencies
   */
  onNewEmergency(callback: EventCallback) {
    if (this.emergencySocket) {
      this.emergencySocket.on('emergency_created', (data) => {
        callback(data);
        toast.success(`New ${data.severity} emergency reported!`);
      });
    }
  }

  /**
   * Subscribe to emergency status updates
   */
  onEmergencyStatusUpdate(callback: EventCallback) {
    if (this.emergencySocket) {
      this.emergencySocket.on('emergency_status_update', callback);
    }
  }

  /**
   * Subscribe to emergency assignments
   */
  onEmergencyAssignment(callback: EventCallback) {
    if (this.emergencySocket) {
      this.emergencySocket.on('emergency_assigned', (data) => {
        callback(data);
        toast('Emergency assignment updated', { icon: 'ℹ️' });
      });
    }
  }

  /**
   * Emit ambulance location update (for drivers)
   */
  updateAmbulanceLocation(ambulanceId: string, latitude: number, longitude: number) {
    if (this.ambulanceSocket) {
      this.ambulanceSocket.emit('update_location', {
        ambulance_id: ambulanceId,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Join emergency room (for real-time updates on specific emergency)
   */
  joinEmergencyRoom(emergencyId: string) {
    if (this.emergencySocket) {
      this.emergencySocket.emit('join_emergency', { emergency_id: emergencyId });
    }
  }

  /**
   * Leave emergency room
   */
  leaveEmergencyRoom(emergencyId: string) {
    if (this.emergencySocket) {
      this.emergencySocket.emit('leave_emergency', { emergency_id: emergencyId });
    }
  }

  /**
   * Disconnect all sockets
   */
  disconnect() {
    if (this.ambulanceSocket) {
      this.ambulanceSocket.disconnect();
      this.ambulanceSocket = null;
    }

    if (this.emergencySocket) {
      this.emergencySocket.disconnect();
      this.emergencySocket = null;
    }

    this.isConnected = false;
    this.connectedRole = null;
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    if (this.ambulanceSocket) {
      this.ambulanceSocket.removeAllListeners();
    }

    if (this.emergencySocket) {
      this.emergencySocket.removeAllListeners();
    }
  }

  /**
   * Check connection status
   */
  getConnectionStatus() {
    return {
      ambulance: this.ambulanceSocket?.connected || false,
      emergency: this.emergencySocket?.connected || false,
    };
  }
}

export const websocketService = new WebSocketService();
