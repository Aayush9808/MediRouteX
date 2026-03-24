import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, MapPin, Activity, Clock, Phone,
  CheckCircle, Navigation, LogOut, Ambulance, Building2, Settings
} from 'lucide-react';
import { useEmergency } from '../context/EmergencyContext';
import { useAuth } from '../contexts/AuthContext';
import EmergencyModal from './EmergencyModal';
import RealMapView from './RealMapView';
import ProfileSettingsModal from './ProfileSettingsModal';

export default function PatientDashboard() {
  const { emergencies, hospitals, ambulances } = useEmergency();
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'hospitals' | 'map'>('status');

  const availableAmbulances = ambulances.filter(a => a.status === 'Available').length;
  const activeEmergencies = emergencies.filter(e => e.status !== 'Completed');
  const nearbyHospitals = hospitals.slice(0, 5);

  const tabs = [
    { id: 'status', label: 'My Status', icon: Activity },
    { id: 'hospitals', label: 'Hospitals', icon: Building2 },
    { id: 'map', label: 'Live Map', icon: Navigation },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0A1628] overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F2137] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Ambulance className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                MediRoute<span className="text-red-500">X</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Patient Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{user?.name}</p>
              <p className="text-xs text-gray-400">Patient</p>
            </div>
            <button
              onClick={() => setShowProfileSettings(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Profile & Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
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

      {/* SOS Button Banner */}
      <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 px-4 py-4 border-b border-red-100 dark:border-red-900/30 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)}
          className="w-full py-5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xl rounded-2xl shadow-xl shadow-red-500/40 flex items-center justify-center gap-4 transition-all"
        >
          <AlertTriangle className="w-8 h-8" />
              <ProfileSettingsModal isOpen={showProfileSettings} onClose={() => setShowProfileSettings(false)} />
          🚨 REQUEST EMERGENCY AMBULANCE
        </motion.button>
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
            {availableAmbulances} ambulance{availableAmbulances !== 1 ? 's' : ''} ready
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {nearbyHospitals.length} hospitals nearby
          </span>
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
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div layoutId="patientTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'status' && (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {/* Active emergencies */}
            {activeEmergencies.length > 0 ? (
              <>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Active Emergency Requests
                </p>
                {activeEmergencies.slice(0, 3).map((e) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-4 border ${
                      e.severity === 'Critical'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'
                        : e.severity === 'High'
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        e.severity === 'Critical' ? 'bg-red-600 text-white' :
                        e.severity === 'High' ? 'bg-orange-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {e.severity}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        {e.status}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white">{e.type}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{e.location}
                    </p>
                    {e.assignedAmbulance ? (
                      <div className="mt-3 flex items-center gap-2 bg-green-100 dark:bg-green-900/30 rounded-lg p-2.5">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-green-800 dark:text-green-300 font-semibold">
                            Ambulance {e.assignedAmbulance} dispatched
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">ETA ~8 minutes</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2.5">
                        <Clock className="w-4 h-4 text-yellow-600 animate-pulse flex-shrink-0" />
                        <div>
                          <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold">Locating nearest ambulance...</p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400">Please stay on location</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">You're Safe!</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  No active emergencies. Use the button above if you need help.
                </p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-[#0F2137] rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-3xl font-black text-green-600">{availableAmbulances}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ambulances Available</p>
              </div>
              <div className="bg-white dark:bg-[#0F2137] rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-3xl font-black text-blue-600">{nearbyHospitals.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hospitals Nearby</p>
              </div>
            </div>

            {/* Emergency Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">📋 While waiting for ambulance:</p>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>Stay calm and keep the patient still</li>
                <li>Keep someone near the entrance to guide ambulance</li>
                <li>Clear the path for stretcher access</li>
                <li>Gather any medical records or prescriptions</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'hospitals' && (
          <div className="h-full overflow-y-auto p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Nearby Hospitals ({nearbyHospitals.length})
            </p>
            {nearbyHospitals.map((hospital, idx) => {
              const icuAvail = hospital.icuBeds?.available ?? 0;
              const emAvail = hospital.emergencyBeds?.available ?? 0;
              const totalAvail = icuAvail + emAvail + (hospital.generalBeds?.available ?? 0);
              return (
                <motion.div
                  key={hospital.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-[#0F2137] rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white">{hospital.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{hospital.address}</p>
                      {hospital.distance && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{hospital.distance} away
                        </p>
                      )}
                    </div>
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${
                      totalAvail > 10 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      totalAvail > 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {totalAvail} beds
                    </span>
                  </div>

                  {/* Bed mini grid */}
                  <div className="mt-3 flex gap-2">
                    {[
                      { label: 'ICU', val: icuAvail, total: hospital.icuBeds?.total ?? 0 },
                      { label: 'Emergency', val: emAvail, total: hospital.emergencyBeds?.total ?? 0 },
                    ].map((b) => (
                      <div key={b.label} className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                        <p className={`text-sm font-black ${b.val === 0 ? 'text-red-600' : b.val <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {b.val}/{b.total}
                        </p>
                        <p className="text-xs text-gray-500">{b.label}</p>
                      </div>
                    ))}
                  </div>

                  {hospital.phone && (
                    <a
                      href={`tel:${hospital.phone}`}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Phone className="w-4 h-4" /> {hospital.phone}
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-full relative">
            <RealMapView />
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && <EmergencyModal isOpen={showModal} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
