import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface BloodInventory {
  type: BloodType;
  units: number;
  lastUpdated: Date;
}

export interface HospitalBloodStock {
  hospitalId: string;
  hospitalName: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  inventory: BloodInventory[];
  lastSync: Date;
  isBloodBank: boolean;
}

export type UrgencyLevel = 'Critical' | 'Urgent' | 'Standard';

export interface BloodEmergencyAlert {
  id: string;
  hospitalId: string;
  hospitalName: string;
  bloodType: BloodType;
  unitsNeeded: number;
  urgency: UrgencyLevel;
  patientInfo?: string;
  status: 'Active' | 'Fulfilled' | 'Cancelled';
  respondedBy: string[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface BloodResponse {
  alertId: string;
  respondingHospitalId: string;
  respondingHospitalName: string;
  unitsAvailable: number;
  eta: string;
  timestamp: Date;
}

interface BloodContextType {
  hospitals: HospitalBloodStock[];
  alerts: BloodEmergencyAlert[];
  responses: BloodResponse[];
  activeAlerts: BloodEmergencyAlert[];
  triggerBloodAlert: (params: {
    hospitalId: string;
    bloodType: BloodType;
    unitsNeeded: number;
    urgency: UrgencyLevel;
    patientInfo?: string;
  }) => void;
  respondToAlert: (alertId: string, respondingHospitalId: string, unitsAvailable: number) => void;
  fulfillAlert: (alertId: string) => void;
  cancelAlert: (alertId: string) => void;
  updateBloodStock: (hospitalId: string, bloodType: BloodType, delta: number) => void;
  getHospitalStock: (hospitalId: string) => HospitalBloodStock | undefined;
  getCriticalShortages: () => { hospital: HospitalBloodStock; type: BloodType; units: number }[];
}

const BloodContext = createContext<BloodContextType | null>(null);

export const useBlood = () => {
  const ctx = useContext(BloodContext);
  if (!ctx) throw new Error('useBlood must be used within BloodProvider');
  return ctx;
};

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function randomUnits(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const INITIAL_HOSPITALS: HospitalBloodStock[] = [
  {
    hospitalId: 'h1',
    hospitalName: 'City General Hospital',
    address: 'Lajpat Nagar, New Delhi',
    phone: '+91-11-2983-4567',
    lat: 28.5672,
    lng: 77.2435,
    isBloodBank: true,
    lastSync: new Date(),
    inventory: BLOOD_TYPES.map(type => ({
      type,
      units: randomUnits(0, 20),
      lastUpdated: new Date(),
    })),
  },
  {
    hospitalId: 'h2',
    hospitalName: 'Metro Medical Center',
    address: 'Connaught Place, New Delhi',
    phone: '+91-11-4567-8901',
    lat: 28.6329,
    lng: 77.2195,
    isBloodBank: true,
    lastSync: new Date(),
    inventory: BLOOD_TYPES.map(type => ({
      type,
      units: randomUnits(0, 15),
      lastUpdated: new Date(),
    })),
  },
  {
    hospitalId: 'h3',
    hospitalName: 'Downtown Emergency',
    address: 'Karol Bagh, New Delhi',
    phone: '+91-11-2345-6789',
    lat: 28.6519,
    lng: 77.1909,
    isBloodBank: false,
    lastSync: new Date(),
    inventory: BLOOD_TYPES.map(type => ({
      type,
      units: randomUnits(0, 10),
      lastUpdated: new Date(),
    })),
  },
  {
    hospitalId: 'h4',
    hospitalName: 'AIIMS Blood Bank',
    address: 'Ansari Nagar, New Delhi',
    phone: '+91-11-2658-8500',
    lat: 28.5672,
    lng: 77.2100,
    isBloodBank: true,
    lastSync: new Date(),
    inventory: BLOOD_TYPES.map(type => ({
      type,
      units: randomUnits(5, 40),
      lastUpdated: new Date(),
    })),
  },
  {
    hospitalId: 'h5',
    hospitalName: 'Safdarjung Hospital',
    address: 'Ring Road, New Delhi',
    phone: '+91-11-2616-5060',
    lat: 28.5688,
    lng: 77.2068,
    isBloodBank: true,
    lastSync: new Date(),
    inventory: BLOOD_TYPES.map(type => ({
      type,
      units: randomUnits(2, 30),
      lastUpdated: new Date(),
    })),
  },
];

const INITIAL_ALERTS: BloodEmergencyAlert[] = [
  {
    id: 'ba1',
    hospitalId: 'h3',
    hospitalName: 'Downtown Emergency',
    bloodType: 'O-',
    unitsNeeded: 4,
    urgency: 'Critical',
    patientInfo: 'Road accident victim, surgery in progress',
    status: 'Active',
    respondedBy: ['h1'],
    createdAt: new Date(Date.now() - 8 * 60000),
    updatedAt: new Date(Date.now() - 2 * 60000),
    expiresAt: new Date(Date.now() + 52 * 60000),
  },
  {
    id: 'ba2',
    hospitalId: 'h2',
    hospitalName: 'Metro Medical Center',
    bloodType: 'AB+',
    unitsNeeded: 2,
    urgency: 'Urgent',
    patientInfo: 'Scheduled surgery, low reserves',
    status: 'Active',
    respondedBy: [],
    createdAt: new Date(Date.now() - 25 * 60000),
    updatedAt: new Date(Date.now() - 25 * 60000),
    expiresAt: new Date(Date.now() + 35 * 60000),
  },
];

export function BloodProvider({ children }: { children: ReactNode }) {
  const [hospitals, setHospitals] = useState<HospitalBloodStock[]>(INITIAL_HOSPITALS);
  const [alerts, setAlerts] = useState<BloodEmergencyAlert[]>(INITIAL_ALERTS);
  const [responses, setResponses] = useState<BloodResponse[]>([]);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate live stock fluctuations every 30 seconds
  useEffect(() => {
    simulationRef.current = setInterval(() => {
      setHospitals(prev =>
        prev.map(h => ({
          ...h,
          lastSync: new Date(),
          inventory: h.inventory.map(inv => ({
            ...inv,
            units: Math.max(0, inv.units + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
            lastUpdated: new Date(),
          })),
        }))
      );
    }, 30000);
    return () => { if (simulationRef.current) clearInterval(simulationRef.current); };
  }, []);

  // Auto-expire alerts older than 1 hour
  useEffect(() => {
    const expiry = setInterval(() => {
      setAlerts(prev =>
        prev.map(a =>
          a.status === 'Active' && new Date() > a.expiresAt
            ? { ...a, status: 'Cancelled' as const, updatedAt: new Date() }
            : a
        )
      );
    }, 60000);
    return () => clearInterval(expiry);
  }, []);

  const triggerBloodAlert = useCallback(({
    hospitalId, bloodType, unitsNeeded, urgency, patientInfo
  }: {
    hospitalId: string;
    bloodType: BloodType;
    unitsNeeded: number;
    urgency: UrgencyLevel;
    patientInfo?: string;
  }) => {
    const hospital = hospitals.find(h => h.hospitalId === hospitalId);
    if (!hospital) return;

    const alert: BloodEmergencyAlert = {
      id: `ba${Date.now()}`,
      hospitalId,
      hospitalName: hospital.hospitalName,
      bloodType,
      unitsNeeded,
      urgency,
      patientInfo,
      status: 'Active',
      respondedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60000),
    };

    setAlerts(prev => [alert, ...prev]);

    const urgencyEmoji = urgency === 'Critical' ? '🚨' : urgency === 'Urgent' ? '⚠️' : '🩸';
    toast.error(
      `${urgencyEmoji} BLOOD ALERT: ${bloodType} needed at ${hospital.hospitalName} — ${unitsNeeded} units (${urgency})`,
      { duration: 8000, id: `blood-alert-${alert.id}` }
    );
  }, [hospitals]);

  const respondToAlert = useCallback((alertId: string, respondingHospitalId: string, unitsAvailable: number) => {
    const respondingHospital = hospitals.find(h => h.hospitalId === respondingHospitalId);
    if (!respondingHospital) return;

    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId && !a.respondedBy.includes(respondingHospitalId)
          ? { ...a, respondedBy: [...a.respondedBy, respondingHospitalId], updatedAt: new Date() }
          : a
      )
    );

    const response: BloodResponse = {
      alertId,
      respondingHospitalId,
      respondingHospitalName: respondingHospital.hospitalName,
      unitsAvailable,
      eta: `${Math.floor(Math.random() * 20) + 5} min`,
      timestamp: new Date(),
    };
    setResponses(prev => [response, ...prev]);

    toast.success(`✅ ${respondingHospital.hospitalName} responded with ${unitsAvailable} units`, { duration: 5000 });
  }, [hospitals]);

  const fulfillAlert = useCallback((alertId: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId ? { ...a, status: 'Fulfilled' as const, updatedAt: new Date() } : a
      )
    );
    toast.success('🩸 Blood alert marked as fulfilled!', { duration: 4000 });
  }, []);

  const cancelAlert = useCallback((alertId: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId ? { ...a, status: 'Cancelled' as const, updatedAt: new Date() } : a
      )
    );
  }, []);

  const updateBloodStock = useCallback((hospitalId: string, bloodType: BloodType, delta: number) => {
    setHospitals(prev =>
      prev.map(h =>
        h.hospitalId === hospitalId
          ? {
              ...h,
              inventory: h.inventory.map(inv =>
                inv.type === bloodType
                  ? { ...inv, units: Math.max(0, inv.units + delta), lastUpdated: new Date() }
                  : inv
              ),
            }
          : h
      )
    );
  }, []);

  const getHospitalStock = useCallback(
    (hospitalId: string) => hospitals.find(h => h.hospitalId === hospitalId),
    [hospitals]
  );

  const getCriticalShortages = useCallback(() => {
    const shortages: { hospital: HospitalBloodStock; type: BloodType; units: number }[] = [];
    hospitals.forEach(h => {
      h.inventory.forEach(inv => {
        if (inv.units <= 2) {
          shortages.push({ hospital: h, type: inv.type, units: inv.units });
        }
      });
    });
    return shortages;
  }, [hospitals]);

  const activeAlerts = alerts.filter(a => a.status === 'Active');

  return (
    <BloodContext.Provider value={{
      hospitals, alerts, responses, activeAlerts,
      triggerBloodAlert, respondToAlert, fulfillAlert,
      cancelAlert, updateBloodStock, getHospitalStock, getCriticalShortages,
    }}>
      {children}
    </BloodContext.Provider>
  );
}
