import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, Phone, Clock, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEmergency } from '../context/EmergencyContext';
import RealMapView from './RealMapView';
import EmergencyModal from './EmergencyModal';

export default function NormalUserDashboard() {
  const { user, logout } = useAuth();
  const { emergencies } = useEmergency();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const myRecentEmergencies = emergencies
    .filter((e) => e.patientName?.toLowerCase().includes(user?.name?.split(' ')[0]?.toLowerCase() || ''))
    .slice(0, 3);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0A1628] overflow-hidden">
      <div className="bg-white dark:bg-[#0F2137] border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <UserRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">MediRouteX User Portal</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Citizen Emergency Access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{user?.name}</p>
              <p className="text-xs text-gray-400">Normal User</p>
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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[360px_1fr] overflow-hidden">
        <div className="border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F2137] p-4 space-y-4 overflow-y-auto">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowEmergencyModal(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" /> REQUEST AMBULANCE
          </motion.button>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Quick Help</h3>
            <div className="space-y-2 text-sm">
              <a href="tel:102" className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> Ambulance Helpline</span>
                <span className="font-bold">102</span>
              </a>
              <a href="tel:108" className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> Emergency Helpline</span>
                <span className="font-bold">108</span>
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Recent Requests</h3>
            {myRecentEmergencies.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">No recent requests. Use REQUEST AMBULANCE for instant dispatch.</p>
            ) : (
              <div className="space-y-2">
                {myRecentEmergencies.map((e) => (
                  <div key={e.id} className="p-2 rounded-lg bg-gray-50 dark:bg-[#0A1628] border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{e.type}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {e.location}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {e.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <RealMapView />
        </div>
      </div>

      <EmergencyModal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} />
    </div>
  );
}
