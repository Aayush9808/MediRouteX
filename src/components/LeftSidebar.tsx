import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Clock, 
  MapPin, 
  AlertTriangle,
  Activity,
  Truck,
  Timer,
  History,
  ChevronRight,
  Droplets
} from 'lucide-react';
import { useEmergency } from '../context/EmergencyContext';
import { useBlood } from '../contexts/BloodContext';
import StatsCard from './StatsCard';
import { getApiMetrics, ApiMetricsSnapshot } from '../services';

interface LeftSidebarProps {
  onRequestEmergency: () => void;
}

export default function LeftSidebar({ onRequestEmergency }: LeftSidebarProps) {
  const { emergencies, ambulances, avgResponseTime, hospitals } = useEmergency();
  const { activeAlerts, getCriticalShortages } = useBlood();
  const [activeTab, setActiveTab] = useState<'form' | 'stats' | 'history'>('stats');
  const [apiMetrics, setApiMetrics] = useState<ApiMetricsSnapshot>(getApiMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setApiMetrics(getApiMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const availableAmbulances = ambulances.filter(a => a.status === 'Available').length;
  const totalAmbulances = ambulances.length;
  const avgBeds = hospitals.length > 0 ? hospitals.reduce((acc, h) => {
    const total = (h.icuBeds?.total ?? 0) + (h.emergencyBeds?.total ?? 0) + (h.generalBeds?.total ?? 0);
    const available = (h.icuBeds?.available ?? 0) + (h.emergencyBeds?.available ?? 0) + (h.generalBeds?.available ?? 0);
    return acc + (total > 0 ? (available / total) * 100 : 0);
  }, 0) / hospitals.length : 0;

  const recentEmergencies = emergencies.slice(0, 5);
  const bloodShortages = getCriticalShortages().length;

  return (
    <div className="flex flex-col h-full">
      {/* Emergency Request Button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRequestEmergency}
          className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-3 transition-all"
        >
          <Plus className="w-6 h-6" />
          REQUEST AMBULANCE
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'stats', label: 'Stats', icon: Activity },
          { id: 'form', label: 'Request', icon: Plus },
          { id: 'history', label: 'History', icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors relative ${
              activeTab === tab.id 
                ? 'text-medical-blue dark:text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden lg:inline">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-medical-blue"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'stats' && (
          <>
            <StatsCard
              title="Active Emergencies"
              value={emergencies.filter(e => e.status !== 'Completed').length}
              icon={AlertTriangle}
              trend={+12}
              color="red"
            />
            <StatsCard
              title="Available Ambulances"
              value={availableAmbulances}
              subtitle={`of ${totalAmbulances}`}
              icon={Truck}
              color="green"
              progress={(availableAmbulances / totalAmbulances) * 100}
            />
            <StatsCard
              title="Avg Response Time"
              value={avgResponseTime}
              unit="min"
              icon={Timer}
              trend={-8}
              target={12}
              color="blue"
            />
            <StatsCard
              title="Hospital Occupancy"
              value={Math.round(avgBeds)}
              unit="%"
              icon={Activity}
              trend={+3}
              color="amber"
            />
            <StatsCard
              title="Blood Alerts"
              value={activeAlerts.length}
              subtitle={bloodShortages > 0 ? `${bloodShortages} shortages` : 'All stocked'}
              icon={Droplets}
              color={activeAlerts.length > 0 ? 'red' : 'green'}
            />

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">API Diagnostics</h3>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Live</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center py-2 rounded-lg bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] text-gray-500">Requests</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{apiMetrics.totalRequests}</p>
                </div>
                <div className="text-center py-2 rounded-lg bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] text-gray-500">Success</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{apiMetrics.successRate}%</p>
                </div>
                <div className="text-center py-2 rounded-lg bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] text-gray-500">Avg Latency</p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{apiMetrics.avgLatencyMs}ms</p>
                </div>
              </div>
            </div>

            {/* Recent History */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Emergencies
              </h3>
              <div className="space-y-2">
                {recentEmergencies.map((emergency) => (
                  <motion.div
                    key={emergency.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-medical-blue/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {emergency.type}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {emergency.location}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        emergency.severity === 'Critical' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : emergency.severity === 'High'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : emergency.severity === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {emergency.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        emergency.status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : emergency.status === 'En Route'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {emergency.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {emergencies.map((emergency) => (
              <motion.div
                key={emergency.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-medical-blue">{emergency.id}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(emergency.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{emergency.type}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{emergency.location}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    emergency.status === 'Completed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {emergency.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'form' && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Click the "REQUEST AMBULANCE" button above to open the emergency request form.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
