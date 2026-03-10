import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { 
  emergencyService, 
  ambulanceService, 
  hospitalService,
  websocketService,
  Emergency as APIEmergency,
  Ambulance as APIAmbulance,
  Hospital as APIHospital
} from '../services';
import toast from 'react-hot-toast';

// Re-export types with UI-friendly names
export interface Emergency {
  id: string;
  type: string;
  location: string;
  patientName: string;
  age?: string;
  gender?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Dispatched' | 'En Route' | 'Arrived' | 'Completed';
  timestamp: Date;
  assignedAmbulance?: string;
  assignedHospital?: string;
  // API fields
  reporter_name?: string;
  reporter_phone?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  description?: string;
}

export interface Ambulance {
  id: string;
  registration: string;
  driverName?: string;
  driverPhoto?: string;
  status: 'Available' | 'Busy' | 'Offline';
  currentLocation: string;
  type: 'Basic' | 'Advanced';
  assignedEmergency?: string;
  lastUpdated: Date;
  // API fields
  registration_number?: string;
  current_location_lat?: number;
  current_location_lng?: number;
  equipment?: string[];
}

export interface Hospital {
  id: string;
  name: string;
  distance?: string;
  icuBeds?: { available: number; total: number };
  emergencyBeds?: { available: number; total: number };
  generalBeds?: { available: number; total: number };
  facilities?: string[];
  verified?: boolean;
  // API fields
  location_lat: number;
  location_lng: number;
  address: string;
  phone: string;
  total_beds: number;
  available_beds: number;
  specializations: string[];
}

export interface Notification {
  id: string;
  type: 'emergency' | 'ambulance' | 'hospital' | 'system';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'success' | 'error';
}

interface EmergencyContextType {
  emergencies: Emergency[];
  ambulances: Ambulance[];
  hospitals: Hospital[];
  notifications: Notification[];
  activeEmergencies: number;
  avgResponseTime: number;
  isLoading: boolean;
  addEmergency: (emergency: Omit<Emergency, 'id' | 'status' | 'timestamp'>) => Promise<void>;
  updateAmbulanceStatus: (id: string, status: Ambulance['status']) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  refreshData: () => Promise<void>;
}

const EmergencyContext = createContext<EmergencyContextType | null>(null);

// Transform API data to UI format
const transformEmergency = (apiEmergency: APIEmergency): Emergency => ({
  id: apiEmergency.id,
  type: apiEmergency.type,
  location: apiEmergency.location_address,
  patientName: apiEmergency.reporter_name,
  severity: apiEmergency.severity.charAt(0).toUpperCase() + apiEmergency.severity.slice(1) as any,
  status: apiEmergency.status === 'pending' ? 'Pending' :
          apiEmergency.status === 'dispatched' ? 'Dispatched' :
          apiEmergency.status === 'en_route' ? 'En Route' :
          apiEmergency.status === 'arrived' ? 'Arrived' : 'Completed',
  timestamp: new Date(apiEmergency.created_at),
  assignedAmbulance: apiEmergency.assigned_ambulance_id,
  assignedHospital: apiEmergency.assigned_hospital_id,
  reporter_name: apiEmergency.reporter_name,
  reporter_phone: apiEmergency.reporter_phone,
  location_lat: apiEmergency.location_lat,
  location_lng: apiEmergency.location_lng,
  location_address: apiEmergency.location_address,
  description: apiEmergency.description,
});

const transformAmbulance = (apiAmbulance: APIAmbulance): Ambulance => ({
  id: apiAmbulance.id,
  registration: apiAmbulance.registration_number,
  driverName: apiAmbulance.driver_name || 'Not assigned',
  status: apiAmbulance.status === 'available' ? 'Available' :
          apiAmbulance.status === 'busy' ? 'Busy' : 'Offline',
  currentLocation: apiAmbulance.current_location_lat && apiAmbulance.current_location_lng
    ? `${apiAmbulance.current_location_lat.toFixed(4)}, ${apiAmbulance.current_location_lng.toFixed(4)}`
    : 'Unknown',
  type: apiAmbulance.type === 'basic' ? 'Basic' : 'Advanced',
  lastUpdated: new Date(apiAmbulance.updated_at),
  registration_number: apiAmbulance.registration_number,
  current_location_lat: apiAmbulance.current_location_lat,
  current_location_lng: apiAmbulance.current_location_lng,
  equipment: apiAmbulance.equipment,
});

const transformHospital = (apiHospital: APIHospital): Hospital => ({
  id: apiHospital.id,
  name: apiHospital.name,
  location_lat: apiHospital.location_lat,
  location_lng: apiHospital.location_lng,
  address: apiHospital.address,
  phone: apiHospital.phone,
  total_beds: apiHospital.total_beds,
  available_beds: apiHospital.available_beds,
  specializations: apiHospital.specializations,
  facilities: apiHospital.specializations,
  verified: true,
});

export function EmergencyProvider({ children }: { children: ReactNode }) {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const [isLoading, setIsLoading] = useState(true);

  const activeEmergencies = emergencies.filter(e => e.status !== 'Completed').length;
  const avgResponseTime = 8.5; // Can be fetched from ML service

  // Load initial data
  useEffect(() => {
    loadInitialData();
    setupWebSocketListeners();

    return () => {
      websocketService.removeAllListeners();
    };
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [emergenciesData, ambulancesData, hospitalsData] = await Promise.all([
        emergencyService.getActive().catch(() => []),
        ambulanceService.getAll().catch(() => []),
        hospitalService.getAll().catch(() => []),
      ]);

      setEmergencies(emergenciesData.map(transformEmergency));
      setAmbulances(ambulancesData.map(transformAmbulance));
      setHospitals(hospitalsData.map(transformHospital));
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocketListeners = () => {
    // Listen for new emergencies
    websocketService.onNewEmergency((data: APIEmergency) => {
      const newEmergency = transformEmergency(data);
      setEmergencies(prev => [newEmergency, ...prev]);
      
      addNotification({
        type: 'emergency',
        message: `New ${newEmergency.severity} emergency: ${newEmergency.type}`,
        severity: 'error',
      });
    });

    // Listen for emergency status updates
    websocketService.onEmergencyStatusUpdate((data: APIEmergency) => {
      const updatedEmergency = transformEmergency(data);
      setEmergencies(prev =>
        prev.map(e => e.id === updatedEmergency.id ? updatedEmergency : e)
      );
    });

    // Listen for ambulance location updates
    websocketService.onAmbulanceLocationUpdate((data: any) => {
      setAmbulances(prev =>
        prev.map(amb => {
          if (amb.id === data.ambulance_id) {
            return {
              ...amb,
              current_location_lat: data.latitude,
              current_location_lng: data.longitude,
              currentLocation: `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`,
              lastUpdated: new Date(),
            };
          }
          return amb;
        })
      );
    });

    // Listen for ambulance status updates
    websocketService.onAmbulanceStatusUpdate((data: APIAmbulance) => {
      const updatedAmbulance = transformAmbulance(data);
      setAmbulances(prev =>
        prev.map(amb => amb.id === updatedAmbulance.id ? updatedAmbulance : amb)
      );
    });
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  const addEmergency = useCallback(async (emergency: Omit<Emergency, 'id' | 'status' | 'timestamp'>) => {
    try {
      // Create emergency via API
      const newEmergency = await emergencyService.create({
        reporter_name: emergency.patientName,
        reporter_phone: emergency.reporter_phone || '',
        location_lat: emergency.location_lat || 0,
        location_lng: emergency.location_lng || 0,
        location_address: emergency.location,
        severity: emergency.severity.toLowerCase(),
        type: emergency.type,
        description: emergency.description || '',
      });

      const transformedEmergency = transformEmergency(newEmergency);
      setEmergencies(prev => [transformedEmergency, ...prev]);
      
      addNotification({
        type: 'emergency',
        message: `Emergency #${transformedEmergency.id} reported successfully`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error creating emergency:', error);
      toast.error('Failed to report emergency');
      throw error;
    }
  }, []);

  const updateAmbulanceStatus = useCallback(async (id: string, status: Ambulance['status']) => {
    try {
      // Map UI status to API status
      const apiStatus = status === 'Available' ? 'available' :
                        status === 'Busy' ? 'busy' : 'maintenance';
      
      const updatedAmbulance = await ambulanceService.updateStatus(id, apiStatus);
      const transformed = transformAmbulance(updatedAmbulance);
      
      setAmbulances(prev =>
        prev.map(amb => amb.id === id ? transformed : amb)
      );
      
      addNotification({
        type: 'ambulance',
        message: `Ambulance ${transformed.registration} status updated to ${status}`,
        severity: 'info',
      });
    } catch (error) {
      console.error('Error updating ambulance status:', error);
      toast.error('Failed to update ambulance status');
      throw error;
    }
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `N-${Date.now()}`,
      timestamp: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  return (
    <EmergencyContext.Provider value={{
      emergencies,
      ambulances,
      hospitals,
      notifications,
      activeEmergencies,
      avgResponseTime,
      isLoading: loading,
      addEmergency,
      updateAmbulanceStatus,
      addNotification,
      refreshData,
    }}>
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  const context = useContext(EmergencyContext);
  if (!context) throw new Error('useEmergency must be used within EmergencyProvider');
  return context;
}

