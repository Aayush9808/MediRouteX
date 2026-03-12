import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import {
  Layers,
  Search,
  MapPin,
  Hospital,
  Truck,
  AlertCircle,
  Navigation,
  Activity
} from 'lucide-react';
import { useEmergency, Hospital as HospitalType, Ambulance as AmbulanceType, Emergency } from '../context/EmergencyContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom marker icons
const createCustomIcon = (color: string, IconComponent: typeof Truck) => {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        position: relative;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${IconComponent === Truck ? '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="m16 8 3-3 3 3"/><path d="M19 8v13"/>' : 
            IconComponent === Hospital ? '<path d="M12 6v4"/><path d="M14 14h-4"/><path d="M14 18h-4"/><path d="M14 8h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 22V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v17"/>' :
            '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
        </svg>
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid ${color};
        "></div>
      </div>
    `,
    className: 'custom-marker-icon',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
};

const ambulanceAvailableIcon = createCustomIcon('#22C55E', Truck);
const ambulanceBusyIcon = createCustomIcon('#EF4444', Truck);
const ambulanceOfflineIcon = createCustomIcon('#6B7280', Truck);
const hospitalIcon = createCustomIcon('#3B82F6', Hospital);
const emergencyCriticalIcon = createCustomIcon('#DC2626', AlertCircle);
const emergencyHighIcon = createCustomIcon('#F59E0B', AlertCircle);
const emergencyMediumIcon = createCustomIcon('#EAB308', AlertCircle);
const emergencyLowIcon = createCustomIcon('#22C55E', AlertCircle);

// Component to recenter map when needed
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function RealMapView() {
  const { hospitals, ambulances, emergencies } = useEmergency();
  const [showLayers, setShowLayers] = useState({
    ambulances: true,
    hospitals: true,
    emergencies: true,
    traffic: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [center, setCenter] = useState<[number, number]>([28.5355, 77.3910]); // Greater Noida default
  const mapRef = useRef<L.Map | null>(null);

  const getAmbulanceIcon = (status: string) => {
    switch (status) {
      case 'Available': return ambulanceAvailableIcon;
      case 'Busy': return ambulanceBusyIcon;
      case 'Offline': return ambulanceOfflineIcon;
      default: return ambulanceOfflineIcon;
    }
  };

  const getEmergencyIcon = (severity: string) => {
    switch (severity) {
      case 'Critical': return emergencyCriticalIcon;
      case 'High': return emergencyHighIcon;
      case 'Medium': return emergencyMediumIcon;
      case 'Low': return emergencyLowIcon;
      default: return emergencyMediumIcon;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-600';
      case 'High': return 'text-orange-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'text-green-600';
      case 'Busy': return 'text-red-600';
      case 'Offline': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Real Map with OpenStreetMap tiles */}
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterMap center={center} />

        {/* Ambulance Markers */}
        {showLayers.ambulances && ambulances.map((ambulance) => (
          ambulance.current_location_lat && ambulance.current_location_lng && (
            <Marker
              key={ambulance.id}
              position={[ambulance.current_location_lat, ambulance.current_location_lng]}
              icon={getAmbulanceIcon(ambulance.status)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-lg">{ambulance.registration}</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-semibold ${getStatusColor(ambulance.status)}`}>
                        {ambulance.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{ambulance.type}</span>
                    </div>
                    {ambulance.driver && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Driver:</span>
                        <span className="font-medium">{ambulance.driver}</span>
                      </div>
                    )}
                    {ambulance.currentLocation && (
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-gray-600 text-xs">{ambulance.currentLocation}</span>
                      </div>
                    )}
                    {ambulance.equipment && ambulance.equipment.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-gray-600 text-xs">Equipment:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ambulance.equipment.map((eq, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Hospital Markers */}
        {showLayers.hospitals && hospitals.map((hospital) => (
          hospital.location_lat && hospital.location_lng && (
            <Marker
              key={hospital.id}
              position={[hospital.location_lat, hospital.location_lng]}
              icon={hospitalIcon}
            >
              <Popup>
                <div className="p-2 min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Hospital className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-lg">{hospital.name}</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="font-semibold text-blue-900 mb-1">Bed Availability</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-600">ICU</div>
                          <div className="font-bold text-blue-600">
                            {hospital.available_beds?.icu || 0}/{hospital.total_beds?.icu || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Emergency</div>
                          <div className="font-bold text-blue-600">
                            {hospital.available_beds?.emergency || 0}/{hospital.total_beds?.emergency || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">General</div>
                          <div className="font-bold text-blue-600">
                            {hospital.available_beds?.general || 0}/{hospital.total_beds?.general || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                    {hospital.facilities && hospital.facilities.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-700">Facilities:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {hospital.facilities.map((facility, idx) => (
                            <span key={idx} className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                              {facility}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {hospital.specializations && hospital.specializations.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-700">Specializations:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {hospital.specializations.map((spec, idx) => (
                            <span key={idx} className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Emergency Markers */}
        {showLayers.emergencies && emergencies.map((emergency) => (
          emergency.location_lat && emergency.location_lng && emergency.status !== 'Completed' && (
            <Marker
              key={emergency.id}
              position={[emergency.location_lat, emergency.location_lng]}
              icon={getEmergencyIcon(emergency.severity)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-lg">{emergency.type}</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Severity:</span>
                      <span className={`font-semibold ${getSeverityColor(emergency.severity)}`}>
                        {emergency.severity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">{emergency.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patient:</span>
                      <span className="font-medium">{emergency.patientName}</span>
                    </div>
                    {emergency.location && (
                      <div className="mt-2 pt-2 border-t">
                        <MapPin className="w-3 h-3 inline mr-1 text-gray-600" />
                        <span className="text-gray-600 text-xs">{emergency.location}</span>
                      </div>
                    )}
                    {emergency.assignedAmbulance && (
                      <div className="mt-2 pt-2 border-t bg-green-50 p-1 rounded">
                        <Activity className="w-3 h-3 inline mr-1 text-green-600" />
                        <span className="text-green-800 text-xs font-medium">
                          Ambulance Assigned: {emergency.assignedAmbulance}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>

      {/* Search Bar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-96">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </motion.div>
      </div>

      {/* Layer Controls */}
      <div className="absolute top-4 right-4 z-[1000]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-semibold text-gray-700">Layers</span>
          </div>
          <div className="space-y-2">
            {Object.entries(showLayers).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => setShowLayers(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">{key}</span>
              </label>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-4 shadow-lg"
        >
          <h4 className="text-sm font-semibold text-gray-700 mb-3">LEGEND</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-gray-700">Emergency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-gray-700">Ambulance Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-gray-700">Ambulance Busy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-gray-700">Hospital</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Current Location Button */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setCenter([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                  console.error('Error getting location:', error);
                }
              );
            }
          }}
          className="p-3 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
        >
          <Navigation className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
