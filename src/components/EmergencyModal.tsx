import { X } from 'lucide-react';
import { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import toast from 'react-hot-toast';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {
  const { addEmergency } = useEmergency();
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: '',
    type: 'Medical',
    severity: 'Medium' as 'Critical' | 'High' | 'Medium' | 'Low',
    location: '',
    phone: ''
  });
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Getting your location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.dismiss();
          toast.success('Location acquired!');
        },
        () => {
          toast.dismiss();
          toast.error('Could not get location. Using default.');
          // Default to Greater Noida area
          setCoordinates({ lat: 28.4744, lng: 77.4943 });
        }
      );
    } else {
      setCoordinates({ lat: 28.4744, lng: 77.4943 });
      toast.success('Using default location');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use coordinates or generate random ones in Greater Noida area
    const finalCoords = coordinates || {
      lat: 28.4700 + (Math.random() - 0.5) * 0.02,
      lng: 77.4900 + (Math.random() - 0.5) * 0.02
    };
    
    addEmergency({
      patientName: formData.patientName,
      age: formData.age,
      gender: formData.gender,
      type: formData.type,
      severity: formData.severity,
      location: formData.location,
      reporter_phone: formData.phone || '+91-9999999999',
      location_lat: finalCoords.lat,
      location_lng: finalCoords.lng,
      location_address: formData.location,
      description: `${formData.type} emergency reported`
    });
    
    toast.success('Emergency reported successfully! Dispatching nearest ambulance...');
    onClose();
    
    // Reset form
    setFormData({
      patientName: '',
      age: '',
      gender: '',
      type: 'Medical',
      severity: 'Medium',
      location: '',
      phone: ''
    });
    setCoordinates(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0F1E35] rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Report Emergency
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Patient Name
            </label>
            <input
              type="text"
              required
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0A1628] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Age
            </label>
            <input
              type="text"
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0A1628] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0A1628] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Emergency Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0A1628] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option>Medical</option>
              <option>Accident</option>
              <option>Fire</option>
              <option>Natural Disaster</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Severity
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as 'Critical' | 'High' | 'Medium' | 'Low' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0A1628] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter address or use GPS"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0A1628] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
              >
                📍 GPS
              </button>
            </div>
            {coordinates && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ GPS Location acquired: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91-9999999999"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0A1628] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>



          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Report Emergency
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
