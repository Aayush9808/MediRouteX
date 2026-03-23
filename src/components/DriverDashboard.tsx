import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, MapPin, AlertTriangle, CheckCircle, Clock,
  Phone, Navigation, Activity, User, LogOut
} from 'lucide-react';
import { useEmergency } from '../context/EmergencyContext';
import { useAuth } from '../contexts/AuthContext';
import RealMapView from './RealMapView';
import toast from 'react-hot-toast';

export default function DriverDashboard() {
  const { emergencies, ambulances } = useEmergency();
  const { user, logout } = useAuth();
  const [driverStatus, setDriverStatus] = useState<'Available' | 'Responding'>('Responding');
  const [activeTab, setActiveTab] = useState<'assignment' | 'navigate' | 'history'>('assignment');

  // Demo: Use first busy ambulance as the driver's vehicle
  const myAmbulance = ambulances.find(a => a.status === 'Busy') ?? ambulances[0];
  // Find the emergency assigned to this ambulance (by ambulance id)
  const myAssignment = emergencies.find(
    (e) => e.assignedAmbulance === myAmbulance?.id && e.status !== 'Completed'
  );

  const tabs = [
    { id: 'assignment', label: 'Assignment', icon: AlertTriangle },
    { id: 'navigate', label: 'Navigate', icon: Navigation },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0A1628] overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F2137] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                MediRoute<span className="text-blue-500">X</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Driver Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{user?.name}</p>
              <p className="text-xs text-gray-400">Ambulance Driver</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Vehicle & Status Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900/80 dark:to-indigo-900/80 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{myAmbulance?.driverName ?? user?.name}</p>
              <p className="text-blue-200 text-xs">
                {myAmbulance?.registration ?? 'UP16 AB 1234'} · {myAmbulance?.type ?? 'Advanced'} Life Support
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const next = driverStatus === 'Available' ? 'Responding' : 'Available';
              setDriverStatus(next);
              toast.success(`Status: ${next}`);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
              driverStatus === 'Available'
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/40'
                : 'bg-orange-500 text-white shadow-lg shadow-orange-500/40 animate-pulse'
            }`}
          >
            {driverStatus === 'Available' ? '🟢 Available' : '🔴 Responding'}
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F2137] flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div layoutId="driverTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'assignment' && (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {myAssignment ? (
              <>
                {/* Assignment Card */}
                <div className="bg-white dark:bg-[#0F2137] rounded-2xl border border-red-200 dark:border-red-800 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      Active Assignment
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">{myAssignment.type}</h2>
                  <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${
                    myAssignment.severity === 'Critical' ? 'bg-red-600 text-white' :
                    myAssignment.severity === 'High' ? 'bg-orange-500 text-white' :
                    'bg-yellow-500 text-white'
                  }`}>
                    {myAssignment.severity}
                  </span>

                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <span className="text-gray-500">Patient: </span>
                        <span className="text-gray-900 dark:text-white font-semibold">{myAssignment.patientName}</span>
                        {myAssignment.age && <span className="text-gray-500 ml-1">({myAssignment.age}y)</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">{myAssignment.location}</span>
                    </div>
                    {myAssignment.reporter_phone && (
                      <a
                        href={`tel:${myAssignment.reporter_phone}`}
                        className="flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400"
                      >
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        {myAssignment.reporter_phone}
                      </a>
                    )}
                    {myAssignment.description && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mt-2">
                        <p className="text-xs text-yellow-800 dark:text-yellow-300">
                          <span className="font-bold">⚠️ Note: </span>{myAssignment.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toast.success('✅ Arrived at patient location!')}
                      className="py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Arrived
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toast.success('🏥 Trip marked as complete!')}
                      className="py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Activity className="w-4 h-4" />
                      Complete
                    </motion.button>
                  </div>
                </div>

                {/* Route Info */}
                <div className="bg-white dark:bg-[#0F2137] rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-500" /> Route Information
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'ETA', value: '~8 min', color: 'text-green-600 dark:text-green-400' },
                      { label: 'Distance', value: '2.4 km', color: 'text-gray-900 dark:text-white' },
                      { label: 'Traffic', value: 'Moderate', color: 'text-yellow-600 dark:text-yellow-400' },
                      { label: 'Route', value: 'Via Kasna Road', color: 'text-gray-600 dark:text-gray-400' },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <span className="text-gray-500 dark:text-gray-400">{r.label}</span>
                        <span className={`font-semibold ${r.color}`}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-14">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-gray-900 dark:text-white font-bold text-xl">No Active Assignment</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">You're currently available. Stay alert!</p>
                <div className="mt-4 inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-2.5 border border-green-200 dark:border-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-green-700 dark:text-green-300 text-sm font-medium">Ready to Respond</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'navigate' && (
          <div className="h-full relative">
            <RealMapView />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="h-full overflow-y-auto p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Today's Completed Trips
            </p>
            {[
              { time: '09:30 AM', patient: 'Suresh Kumar', type: 'Road Accident', distance: '3.2 km', hospital: 'Yatharth Hospital', duration: '12 min' },
              { time: '11:15 AM', patient: 'Anita Joshi', type: 'Cardiac Emergency', distance: '1.8 km', hospital: 'Sharda Hospital', duration: '9 min' },
              { time: '02:40 PM', patient: 'Deepak Rao', type: 'Fall Injury', distance: '2.1 km', hospital: 'Kailash Hospital', duration: '11 min' },
            ].map((trip, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-white dark:bg-[#0F2137] rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{trip.type}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{trip.patient} · {trip.time}</p>
                    <p className="text-xs text-gray-400 mt-1">→ {trip.hospital}</p>
                  </div>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full font-bold">
                    ✓ Done
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-xs text-gray-400">
                  <span>📍 {trip.distance}</span>
                  <span>⏱ {trip.duration}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
