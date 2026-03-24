import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Crosshair,
  Layers,
  Search,
  Navigation,
  Hospital,
  Truck,
  AlertCircle
} from 'lucide-react';
import { useEmergency, Hospital as HospitalType, Ambulance as AmbulanceType } from '../context/EmergencyContext';

export default function MapView() {
  const { hospitals, ambulances, emergencies } = useEmergency();
  const [zoom, setZoom] = useState(14);
  const [showLayers, setShowLayers] = useState({
    ambulances: true,
    hospitals: true,
    emergencies: true,
    traffic: false,
  });
  const [selectedItem, setSelectedItem] = useState<HospitalType | AmbulanceType | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return '#22C55E';
      case 'Busy': return '#EF4444';
      case 'Offline': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Simulated Map Grid */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(30, 136, 229, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30, 136, 229, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoom(z => Math.min(z + 1, 20))}
          className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
        >
          <ZoomIn className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoom(z => Math.max(z - 1, 10))}
          className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
        >
          <ZoomOut className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
        >
          <Crosshair className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Layer Controls */}
      <div className="absolute top-4 right-4 z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2"
        >
          <div className="flex items-center gap-2 mb-2 px-2">
            <Layers className="w-4 h-4 text-white" />
            <span className="text-xs font-medium text-white">Layers</span>
          </div>
          {Object.entries(showLayers).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setShowLayers(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                value ? 'bg-medical-blue/30 text-white' : 'text-white/60 hover:bg-white/10'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${value ? 'bg-medical-blue' : 'bg-gray-500'}`} />
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Search Box */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-80">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search location..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-medical-blue text-sm"
          />
        </div>
      </div>

      {/* Emergency Location Markers */}
      {showLayers.emergencies && emergencies.filter(e => e.status !== 'Completed').map((emergency, index) => (
        <motion.div
          key={emergency.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="absolute cursor-pointer"
          style={{
            left: `${30 + Math.random() * 40}%`,
            top: `${30 + Math.random() * 40}%`,
          }}
          onClick={() => setSelectedItem(emergency as any)}
        >
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
              emergency.severity === 'Critical' ? 'bg-red-500' : 'bg-orange-500'
            }`}>
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`absolute inset-0 rounded-full ${emergency.severity === 'Critical' ? 'bg-red-500' : 'bg-orange-500'}`}
            />
          </div>
          <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-medium text-gray-900 shadow-sm">
              {emergency.id}
            </span>
          </div>
        </motion.div>
      ))}

      {/* Ambulance Markers */}
      {showLayers.ambulances && ambulances.map((ambulance, index) => (
        <motion.div
          key={ambulance.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          className="absolute cursor-pointer"
          style={{
            left: `${20 + (index * 10) % 60}%`,
            top: `${25 + (index * 8) % 50}%`,
          }}
          onClick={() => setSelectedItem(ambulance)}
        >
          <div className="relative">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
              style={{ backgroundColor: getStatusColor(ambulance.status) }}
            >
              <Truck className="w-4 h-4 text-white" />
            </div>
            {ambulance.status === 'Available' && (
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 rounded-lg bg-green-500"
              />
            )}
          </div>
        </motion.div>
      ))}

      {/* Hospital Markers */}
      {showLayers.hospitals && hospitals.map((hospital, index) => (
        <motion.div
          key={hospital.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.08 }}
          className="absolute cursor-pointer"
          style={{
            left: `${15 + (index * 15) % 70}%`,
            top: `${20 + (index * 12) % 60}%`,
          }}
          onClick={() => setSelectedItem(hospital)}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg">
              <Hospital className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
              <span className="text-[8px] font-bold text-gray-900">
                {(hospital.icuBeds?.available ?? 0) + (hospital.emergencyBeds?.available ?? 0)}
              </span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Route Lines */}
      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {emergencies.filter(e => e.status === 'En Route').map((emergency, index) => (
          <g key={emergency.id}>
            <motion.line
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: index * 0.2 }}
              x1="35%" y1="35%" x2="55%" y2="55%"
              stroke="#3B82F6"
              strokeWidth="3"
              strokeDasharray="8 4"
              strokeLinecap="round"
            />
            <motion.circle
              initial={{ r: 0 }}
              animate={{ r: 6 }}
              cx="55%" cy="55%"
              fill="#3B82F6"
            >
              <animate attributeName="r" values="4;8;4" dur="1.5s" repeatCount="indefinite" />
            </motion.circle>
          </g>
        ))}
      </svg>

      {/* Selected Item Popup */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {'icuBeds' in selectedItem ? (
              // Hospital popup
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedItem.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Navigation className="w-3 h-3" />
                      {selectedItem.distance}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-medium">
                    Open
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500">ICU</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedItem.icuBeds?.available ?? 0}/{selectedItem.icuBeds?.total ?? 0}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500">Emergency</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedItem.emergencyBeds?.available ?? 0}/{selectedItem.emergencyBeds?.total ?? 0}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500">General</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedItem.generalBeds?.available ?? 0}/{selectedItem.generalBeds?.total ?? 0}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="w-full mt-4 py-2 bg-medical-blue text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  View Details
                </button>
              </div>
            ) : 'registration' in selectedItem ? (
              // Ambulance popup
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedItem.registration}</h3>
                    <p className="text-sm text-gray-500">{selectedItem.driverName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedItem.status === 'Available' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : selectedItem.status === 'Busy'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedItem.status}
                  </span>
                  <span className="text-xs text-gray-500">{selectedItem.type}</span>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="w-full mt-4 py-2 bg-medical-blue text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  Track Ambulance
                </button>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3">
        <p className="text-[10px] font-medium text-white mb-2">LEGEND</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] text-white/80">Emergency</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-[10px] text-white/80">Ambulance Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] text-white/80">Ambulance Busy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-[10px] text-white/80">Hospital</span>
          </div>
        </div>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5">
          <span className="text-xs text-white font-mono">Zoom: {zoom}x</span>
        </div>
      </div>
    </div>
  );
}

function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
