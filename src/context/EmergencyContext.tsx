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

// Mock data generators
const getMockEmergencies = (): Emergency[] => [
  {
    id: 'emer-1',
    type: 'Road Accident',
    location: 'Knowledge Park III, Greater Noida',
    patientName: 'Rahul Kumar',
    age: '28',
    gender: 'Male',
    severity: 'Critical',
    status: 'En Route',
    timestamp: new Date(Date.now() - 10 * 60000), // 10 min ago
    assignedAmbulance: 'AMB-001',
    assignedHospital: 'HSP-001',
    reporter_phone: '+91-9999888877',
    location_lat: 28.4744,
    location_lng: 77.4943,
    location_address: 'Knowledge Park III, Greater Noida',
    description: 'Multi-vehicle collision, patient unconscious'
  },
  {
    id: 'emer-2',
    type: 'Heart Attack',
    location: 'Sector 16, Greater Noida',
    patientName: 'Priya Sharma',
    age: '45',
    gender: 'Female',
    severity: 'Critical',
    status: 'Dispatched',
    timestamp: new Date(Date.now() - 5 * 60000), // 5 min ago
    assignedAmbulance: 'AMB-002',
    reporter_phone: '+91-9888777666',
    location_lat: 28.4700,
    location_lng: 77.5026,
    location_address: 'Sector 16, Greater Noida',
    description: 'Chest pain, shortness of breath'
  },
  {
    id: 'emer-3',
    type: 'Fall Injury',
    location: 'GL Bajaj Institute, Greater Noida',
    patientName: 'Amit Singh',
    age: '21',
    gender: 'Male',
    severity: 'Medium',
    status: 'Pending',
    timestamp: new Date(Date.now() - 2 * 60000), // 2 min ago
    reporter_phone: '+91-9777666555',
    location_lat: 28.4682,
    location_lng: 77.4948,
    location_address: 'GL Bajaj Institute, Greater Noida',
    description: 'Fell from stairs, leg injury'
  }
];

const getMockAmbulances = (): Ambulance[] => [
  {
    id: 'AMB-001',
    registration: 'UP16 AB 1234',
    registration_number: 'UP16 AB 1234',
    driverName: 'Rajesh Kumar',
    status: 'Busy',
    currentLocation: 'Kasna Road',
    type: 'Advanced',
    assignedEmergency: 'emer-1',
    lastUpdated: new Date(),
    current_location_lat: 28.4720,
    current_location_lng: 77.4950,
    equipment: ['Defibrillator', 'Oxygen', 'Stretcher', 'First Aid']
  },
  {
    id: 'AMB-002',
    registration: 'UP16 CD 5678',
    registration_number: 'UP16 CD 5678',
    driverName: 'Suresh Verma',
    status: 'Busy',
    currentLocation: 'Alpha-1',
    type: 'Basic',
    assignedEmergency: 'emer-2',
    lastUpdated: new Date(),
    current_location_lat: 28.4680,
    current_location_lng: 77.5010,
    equipment: ['Oxygen', 'Stretcher', 'First Aid']
  },
  {
    id: 'AMB-003',
    registration: 'UP16 EF 9012',
    registration_number: 'UP16 EF 9012',
    driverName: 'Vikram Singh',
    status: 'Available',
    currentLocation: 'Pari Chowk',
    type: 'Advanced',
    lastUpdated: new Date(),
    current_location_lat: 28.4650,
    current_location_lng: 77.4900,
    equipment: ['Defibrillator', 'Ventilator', 'Oxygen', 'Stretcher']
  },
  {
    id: 'AMB-004',
    registration: 'UP16 GH 3456',
    registration_number: 'UP16 GH 3456',
    driverName: 'Manoj Gupta',
    status: 'Available',
    currentLocation: 'Knowledge Park II',
    type: 'Basic',
    lastUpdated: new Date(),
    current_location_lat: 28.4730,
    current_location_lng: 77.4960,
    equipment: ['Oxygen', 'Stretcher', 'First Aid']
  },
  {
    id: 'AMB-005',
    registration: 'UP16 IJ 7890',
    registration_number: 'UP16 IJ 7890',
    driverName: 'Anil Kumar',
    status: 'Offline',
    currentLocation: 'Service Center',
    type: 'Advanced',
    lastUpdated: new Date(Date.now() - 30 * 60000), // 30 min ago
    current_location_lat: 28.4640,
    current_location_lng: 77.4880,
    equipment: ['Defibrillator', 'Oxygen', 'Stretcher']
  }
];

const getMockHospitals = (): Hospital[] => [
  {
    id: 'HSP-001',
    name: 'Yatharth Super Speciality Hospital',
    address: 'Plot No 1, Knowledge Park III, Greater Noida',
    phone: '+91-120-4322222',
    location_lat: 28.4750,
    location_lng: 77.4945,
    distance: '2.3 km',
    icuBeds: { available: 8, total: 20 },
    emergencyBeds: { available: 12, total: 30 },
    generalBeds: { available: 45, total: 100 },
    total_beds: 150,
    available_beds: 65,
    facilities: ['24/7 Emergency', 'ICU', 'Trauma Center', 'Blood Bank', 'CT Scan', 'MRI'],
    specializations: ['Cardiology', 'Neurology', 'Trauma', 'General Surgery'],
    verified: true
  },
  {
    id: 'HSP-002',
    name: 'Sharda Hospital',
    address: 'Plot 32-34, Knowledge Park III, Greater Noida',
    phone: '+91-120-4888888',
    location_lat: 28.4765,
    location_lng: 77.4958,
    distance: '3.1 km',
    icuBeds: { available: 5, total: 25 },
    emergencyBeds: { available: 8, total: 35 },
    generalBeds: { available: 30, total: 120 },
    total_beds: 180,
    available_beds: 43,
    facilities: ['24/7 Emergency', 'ICU', 'NICU', 'Blood Bank', 'CT Scan', 'MRI', 'Cath Lab'],
    specializations: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'],
    verified: true
  },
  {
    id: 'HSP-003',
    name: 'Kailash Hospital',
    address: 'Sector 27, Noida',
    phone: '+91-120-4555555',
    location_lat: 28.5700,
    location_lng: 77.3280,
    distance: '8.5 km',
    icuBeds: { available: 3, total: 15 },
    emergencyBeds: { available: 6, total: 25 },
    generalBeds: { available: 20, total: 80 },
    total_beds: 120,
    available_beds: 29,
    facilities: ['24/7 Emergency', 'ICU', 'Blood Bank', 'CT Scan'],
    specializations: ['General Surgery', 'Orthopedics', 'Cardiology'],
    verified: true
  },
  {
    id: 'HSP-004',
    name: 'Prakash Hospital',
    address: 'Sector Alpha-1, Greater Noida',
    phone: '+91-120-4666666',
    location_lat: 28.4685,
    location_lng: 77.5015,
    distance: '4.2 km',
    icuBeds: { available: 10, total: 18 },
    emergencyBeds: { available: 15, total: 28 },
    generalBeds: { available: 35, total: 90 },
    total_beds: 136,
    available_beds: 60,
    facilities: ['24/7 Emergency', 'ICU', 'Trauma Center', 'Blood Bank'],
    specializations: ['Trauma', 'General Surgery', 'Neurology'],
    verified: true
  },
  {
    id: 'HSP-005',
    name: 'Metro Heart Institute',
    address: 'Sector 16A, Noida',
    phone: '+91-120-4777777',
    location_lat: 28.5750,
    location_lng: 77.3200,
    distance: '9.8 km',
    icuBeds: { available: 2, total: 30 },
    emergencyBeds: { available: 4, total: 20 },
    generalBeds: { available: 15, total: 60 },
    total_beds: 110,
    available_beds: 21,
    facilities: ['24/7 Emergency', 'Cardiac ICU', 'Cath Lab', 'CT Scan', 'MRI'],
    specializations: ['Cardiology', 'Cardiac Surgery'],
    verified: true
  }
];

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

  const activeEmergencies = emergencies.filter(e => e.status !== 'Completed').length;
  const avgResponseTime = 8.5; // Can be fetched from ML service

  // Simulate ambulance movement for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setAmbulances(prev => prev.map(amb => {
        // Only move busy ambulances slightly to simulate movement
        if (amb.status === 'Busy' && amb.current_location_lat && amb.current_location_lng) {
          return {
            ...amb,
            current_location_lat: amb.current_location_lat + (Math.random() - 0.5) * 0.001,
            current_location_lng: amb.current_location_lng + (Math.random() - 0.5) * 0.001
          };
        }
        return amb;
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

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
      // Try to load from backend
      const [emergenciesData, ambulancesData, hospitalsData] = await Promise.all([
        emergencyService.getActive().catch(() => []),
        ambulanceService.getAll().catch(() => []),
        hospitalService.getAll().catch(() => []),
      ]);

      // If backend returned data, use it
      if (emergenciesData.length > 0 || ambulancesData.length > 0 || hospitalsData.length > 0) {
        setEmergencies(emergenciesData.map(transformEmergency));
        setAmbulances(ambulancesData.map(transformAmbulance));
        setHospitals(hospitalsData.map(transformHospital));
      } else {
        // Use mock data when backend is unavailable
        console.log('Backend unavailable, using mock data');
        setEmergencies(getMockEmergencies());
        setAmbulances(getMockAmbulances());
        setHospitals(getMockHospitals());
        toast.success('Running in demo mode with mock data');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Load mock data on error
      setEmergencies(getMockEmergencies());
      setAmbulances(getMockAmbulances());
      setHospitals(getMockHospitals());
      console.log('Loaded mock data due to backend error');
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
      // Try to create emergency via API
      const newEmergency = await emergencyService.create({
        reporter_name: emergency.patientName,
        reporter_phone: emergency.reporter_phone || '',
        location_lat: emergency.location_lat || 0,
        location_lng: emergency.location_lng || 0,
        location_address: emergency.location,
        type: emergency.type,
        severity: emergency.severity.toLowerCase(),
        description: emergency.description || ''
      }).catch(() => null);

      if (newEmergency) {
        const transformedEmergency = transformEmergency(newEmergency);
        setEmergencies(prev => [transformedEmergency, ...prev]);
        toast.success('Emergency created successfully!');
        
        addNotification({
          type: 'emergency',
          message: `Emergency #${transformedEmergency.id} reported successfully`,
          severity: 'success',
        });
      } else {
        // Fallback: Create mock emergency
        const mockEmergency: Emergency = {
          id: `emer-${Date.now()}`,
          ...emergency,
          status: 'Pending',
          timestamp: new Date(),
        };
        setEmergencies(prev => [mockEmergency, ...prev]);
        toast.success('Emergency created (Mock Mode)!');
        
        addNotification({
          type: 'emergency',
          message: `Emergency #${mockEmergency.id} created in demo mode`,
          severity: 'success',
        });
        
        // Simulate ambulance assignment after 2 seconds
        setTimeout(() => {
          const availableAmbulance = ambulances.find(a => a.status === 'Available');
          if (availableAmbulance) {
            setEmergencies(prev => prev.map(e => 
              e.id === mockEmergency.id 
                ? { ...e, status: 'Dispatched', assignedAmbulance: availableAmbulance.id }
                : e
            ));
            setAmbulances(prev => prev.map(a => 
              a.id === availableAmbulance.id 
                ? { ...a, status: 'Busy', assignedEmergency: mockEmergency.id }
                : a
            ));
            toast.success(`Ambulance ${availableAmbulance.registration} dispatched!`);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating emergency:', error);
      toast.error('Failed to create emergency');
    }
  }, [ambulances]);

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

