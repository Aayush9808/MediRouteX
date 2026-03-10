import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, X, AlertTriangle, Building2, ChevronDown } from 'lucide-react';
import { useBlood, BloodType, HospitalBloodStock, UrgencyLevel } from '../contexts/BloodContext';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface Props {
  hospital: HospitalBloodStock | null;
  defaultBloodType: BloodType | null;
  onClose: () => void;
}

export default function BloodEmergencyModal({ hospital: defaultHospital, defaultBloodType, onClose }: Props) {
  const { hospitals, triggerBloodAlert } = useBlood();
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(defaultHospital?.hospitalId ?? hospitals[0]?.hospitalId ?? '');
  const [bloodType, setBloodType] = useState<BloodType>(defaultBloodType ?? 'O-');
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState<UrgencyLevel>('Urgent');
  const [patientInfo, setPatientInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedHospital = hospitals.find(h => h.hospitalId === selectedHospitalId);
  const currentStock = selectedHospital?.inventory.find(i => i.type === bloodType)?.units ?? 0;

  const handleSubmit = async () => {
    if (!selectedHospitalId) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    triggerBloodAlert({ hospitalId: selectedHospitalId, bloodType, unitsNeeded: units, urgency, patientInfo });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(onClose, 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-[#0F2137] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-700 to-rose-600 p-5 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Droplets className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Blood Emergency Alert</h2>
                <p className="text-red-100 text-sm">Notify all hospitals & blood banks</p>
              </div>
            </div>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="w-20 h-20 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Alert Broadcast!</h3>
              <p className="text-gray-500 text-sm">All hospitals and blood banks have been notified for <strong>{bloodType}</strong> blood.</p>
            </motion.div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Hospital Selector */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                  Requesting Hospital
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={selectedHospitalId}
                    onChange={e => setSelectedHospitalId(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none appearance-none"
                  >
                    {hospitals.map(h => (
                      <option key={h.hospitalId} value={h.hospitalId}>{h.hospitalName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Blood Type */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                  <span>Blood Type Needed</span>
                  {currentStock > 0 && (
                    <span className={`text-[11px] font-normal ${currentStock <= 2 ? 'text-red-500' : 'text-green-500'}`}>
                      Current stock: {currentStock} units
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_TYPES.map(bt => {
                    const stock = selectedHospital?.inventory.find(i => i.type === bt)?.units ?? 0;
                    return (
                      <button
                        key={bt}
                        onClick={() => setBloodType(bt)}
                        className={`py-2.5 rounded-xl text-sm font-black transition-all relative ${
                          bloodType === bt
                            ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {bt}
                        {stock <= 2 && (
                          <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${stock === 0 ? 'bg-gray-400' : 'bg-red-500'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Units + Urgency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                    Units Needed
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUnits(Math.max(1, units - 1))}
                      className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 transition-colors"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-xl font-black text-gray-900 dark:text-white">{units}</span>
                    <button
                      onClick={() => setUnits(Math.min(20, units + 1))}
                      className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                    Urgency Level
                  </label>
                  <div className="space-y-1">
                    {(['Critical', 'Urgent', 'Standard'] as UrgencyLevel[]).map(u => (
                      <button
                        key={u}
                        onClick={() => setUrgency(u)}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-left ${
                          urgency === u
                            ? u === 'Critical'
                              ? 'bg-red-600 text-white'
                              : u === 'Urgent'
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {u === 'Critical' ? '🚨' : u === 'Urgent' ? '⚠️' : '🩸'} {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">
                  Patient Info (optional)
                </label>
                <textarea
                  value={patientInfo}
                  onChange={e => setPatientInfo(e.target.value)}
                  placeholder="e.g. Road accident victim, surgery in progress..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Alert Preview */}
              <div className={`p-3 rounded-xl border-l-4 ${
                urgency === 'Critical'
                  ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                  : urgency === 'Urgent'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Alert Preview</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  <strong>{urgency.toUpperCase()}</strong>: {units} units of <strong>{bloodType}</strong> blood needed at{' '}
                  <strong>{selectedHospital?.hospitalName}</strong>
                </p>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={submitting}
                className={`w-full py-3.5 rounded-xl font-black text-white text-base transition-all ${
                  urgency === 'Critical'
                    ? 'bg-gradient-to-r from-red-700 to-rose-600 shadow-lg shadow-red-500/30'
                    : 'bg-gradient-to-r from-red-600 to-rose-500 shadow-lg shadow-red-500/20'
                } disabled:opacity-70 flex items-center justify-center gap-2`}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Broadcasting Alert...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    BROADCAST BLOOD ALERT
                  </>
                )}
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
