import { useState } from 'react';
import { Droplets, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBlood } from '../contexts/BloodContext';
import BloodBankPanel from './BloodBankPanel';
import ProfileSettingsModal from './ProfileSettingsModal';

export default function BloodBankDashboard() {
  const { user, logout } = useAuth();
  const { alerts } = useBlood();
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  const activeAlerts = alerts.filter((a) => a.status === 'Active').length;
  const criticalAlerts = alerts.filter((a) => a.status === 'Active' && a.urgency === 'Critical').length;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0A1628] overflow-hidden">
      <div className="bg-white dark:bg-[#0F2137] border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">MediRouteX Blood Bank Portal</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Inventory & Emergency Coordination</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{user?.name}</p>
              <p className="text-xs text-gray-400">Blood Bank</p>
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

      <div className="px-4 py-3 bg-white dark:bg-[#0F2137] border-b border-gray-200 dark:border-gray-800 grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-300">Active Blood Alerts</p>
          <p className="text-2xl font-black text-red-700 dark:text-red-300">{activeAlerts}</p>
        </div>
        <div className="rounded-xl p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">Critical Alerts</p>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{criticalAlerts}</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <BloodBankPanel />
      </div>

      <ProfileSettingsModal isOpen={showProfileSettings} onClose={() => setShowProfileSettings(false)} />
    </div>
  );
}
