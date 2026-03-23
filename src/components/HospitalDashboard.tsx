import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Activity, Droplets, AlertTriangle,
  Users, CheckCircle, Clock, LogOut, Phone, BedDouble
} from 'lucide-react';
import { useEmergency } from '../context/EmergencyContext';
import { useAuth } from '../contexts/AuthContext';
import { useBlood } from '../contexts/BloodContext';
import toast from 'react-hot-toast';

export default function HospitalDashboard() {
  const { emergencies, hospitals } = useEmergency();
  const { user, logout } = useAuth();
  const { activeAlerts, getCriticalShortages } = useBlood();
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'blood'>('overview');
  const [beds, setBeds] = useState({ icu: 8, emergency: 12, general: 45 });

  // Demo: use first hospital as "my hospital"
  const myHospital = hospitals[0];
  const incomingPatients = emergencies.filter((e) => e.status !== 'Completed');
  const criticalShortages = getCriticalShortages();

  const icuTotal = myHospital?.icuBeds?.total ?? 20;
  const emTotal = myHospital?.emergencyBeds?.total ?? 30;
  const genTotal = myHospital?.generalBeds?.total ?? 100;

  const bedConfig = [
    { key: 'icu' as const, label: 'ICU', available: beds.icu, total: icuTotal, color: 'red' },
    { key: 'emergency' as const, label: 'Emergency', available: beds.emergency, total: emTotal, color: 'orange' },
    { key: 'general' as const, label: 'General', available: beds.general, total: genTotal, color: 'green' },
  ];

  const adjustBed = (key: 'icu' | 'emergency' | 'general', delta: number) => {
    const max = key === 'icu' ? icuTotal : key === 'emergency' ? emTotal : genTotal;
    setBeds((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(max, prev[key] + delta)),
    }));
    toast.success('Bed count updated');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'patients', label: `Patients (${incomingPatients.length})`, icon: Users },
    { id: 'blood', label: `Blood ${criticalShortages.length > 0 ? '⚠️' : ''}`, icon: Droplets },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0A1628] overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-[#0F2137] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                MediRoute<span className="text-cyan-500">X</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hospital Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{user?.name}</p>
              <p className="text-xs text-gray-400">Hospital Staff</p>
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

      {/* Hospital Info Bar */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-900/80 dark:to-blue-900/80 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold">{myHospital?.name ?? 'Yatharth Super Speciality Hospital'}</p>
            <p className="text-cyan-100 text-xs">{myHospital?.address ?? 'Greater Noida'}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {activeAlerts.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                {activeAlerts.length} BLOOD ALERT
              </span>
            )}
            {incomingPatients.length > 0 && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {incomingPatients.length} INCOMING
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F2137] flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-cyan-600 dark:text-cyan-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">
              {tab.id === 'overview' ? 'Overview' : tab.id === 'patients' ? 'Patients' : 'Blood'}
            </span>
            {activeTab === tab.id && (
              <motion.div layoutId="hospitalTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {/* Bed Availability */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BedDouble className="w-4 h-4" /> Bed Availability (Live)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {bedConfig.map((b) => (
                  <div
                    key={b.key}
                    className={`bg-white dark:bg-[#0F2137] rounded-xl border p-3 text-center ${
                      b.available === 0
                        ? 'border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                        : b.available <= 3
                        ? 'border-yellow-400 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <p className={`text-3xl font-black leading-none ${
                      b.available === 0 ? 'text-red-600' :
                      b.available <= 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>{b.available}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">/{b.total}</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">{b.label}</p>
                    <div className="flex gap-1 mt-2 justify-center">
                      <button
                        onClick={() => adjustBed(b.key, -1)}
                        className="w-6 h-6 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-bold text-sm hover:bg-red-200 transition-colors"
                      >−</button>
                      <button
                        onClick={() => adjustBed(b.key, +1)}
                        className="w-6 h-6 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-bold text-sm hover:bg-green-200 transition-colors"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-[#0F2137] rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Active Emergencies</span>
                </div>
                <p className="text-3xl font-black text-red-600">{incomingPatients.length}</p>
              </div>
              <div className="bg-white dark:bg-[#0F2137] rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Blood Shortages</span>
                </div>
                <p className="text-3xl font-black text-orange-500">{criticalShortages.length}</p>
              </div>
            </div>

            {/* Facilities */}
            {myHospital?.facilities && myHospital.facilities.length > 0 && (
              <div className="bg-white dark:bg-[#0F2137] rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Active Facilities
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {myHospital.facilities.map((f, i) => (
                    <span
                      key={i}
                      className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-full font-medium"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            {myHospital?.phone && (
              <a
                href={`tel:${myHospital.phone}`}
                className="flex items-center gap-2 bg-white dark:bg-[#0F2137] rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-blue-600 dark:text-blue-400 font-medium text-sm hover:bg-blue-50 transition-colors"
              >
                <Phone className="w-4 h-4" /> {myHospital.phone}
              </a>
            )}
          </div>
        )}

        {/* PATIENTS TAB */}
        {activeTab === 'patients' && (
          <div className="h-full overflow-y-auto p-4 space-y-3">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Incoming / Active Patients ({incomingPatients.length})
            </p>
            {incomingPatients.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">No active incoming patients</p>
              </div>
            ) : (
              incomingPatients.map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white dark:bg-[#0F2137] rounded-xl border p-4 ${
                    e.severity === 'Critical'
                      ? 'border-red-400 dark:border-red-700'
                      : e.severity === 'High'
                      ? 'border-orange-400 dark:border-orange-700'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          e.severity === 'Critical' ? 'bg-red-600 text-white' :
                          e.severity === 'High' ? 'bg-orange-500 text-white' :
                          'bg-yellow-500 text-white'
                        }`}>
                          {e.severity}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{e.status}</span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">{e.type}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {e.patientName}{e.age ? ` · ${e.age}y` : ''}{e.gender ? ` · ${e.gender}` : ''}
                      </p>
                    </div>
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>

                  {e.assignedAmbulance && (
                    <div className="mt-2.5 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                        Ambulance {e.assignedAmbulance} en route
                      </span>
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toast.success(`✅ Patient ${e.patientName} accepted`)}
                      className="py-2 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Accept
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toast('↩️ Redirected to alternate hospital', { icon: '🏥' })}
                      className="py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold transition-colors flex items-center justify-center gap-1 hover:bg-gray-200"
                    >
                      Redirect
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* BLOOD TAB */}
        {activeTab === 'blood' && (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-700 rounded-xl p-4">
                <p className="text-red-700 dark:text-red-300 text-sm font-bold mb-2">
                  🚨 {activeAlerts.length} Active Blood Alert{activeAlerts.length > 1 ? 's' : ''}
                </p>
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="text-xs text-red-600 dark:text-red-400 flex justify-between py-1 border-b border-red-200 dark:border-red-800 last:border-0">
                    <span>{alert.bloodType} · {alert.unitsNeeded} units needed</span>
                    <span className="font-bold">{alert.urgency}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Critical Shortages */}
            {criticalShortages.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Critical Shortages
                </p>
                {criticalShortages.map((s, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-[#0F2137] rounded-xl border border-red-300 dark:border-red-700 p-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-black text-red-600 text-base">{s.type}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.hospital.hospitalName}</p>
                    </div>
                    <span className="text-xl font-black text-red-600">{s.units}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">No critical blood shortages</p>
              </div>
            )}

            {/* Send Network Alert */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => toast.success('🩸 Blood network alert sent to all hospitals!')}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
            >
              <Droplets className="w-5 h-5" /> Send Blood Network Alert
            </motion.button>

            {/* Update Blood Stock */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => toast.success('📋 Blood inventory sync requested')}
              className="w-full py-3 bg-white dark:bg-[#0F2137] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              Sync Blood Inventory
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
