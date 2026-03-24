import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets, AlertTriangle, Clock, CheckCircle,
  XCircle, ChevronDown, ChevronUp, Building2,
  Phone, Zap, RefreshCw, Users
} from 'lucide-react';
import { useBlood, BloodType, HospitalBloodStock, BloodEmergencyAlert } from '../contexts/BloodContext';
import BloodEmergencyModal from './BloodEmergencyModal';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function unitColor(units: number) {
  if (units === 0) return 'bg-gray-200 dark:bg-gray-700 text-gray-500';
  if (units <= 2) return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700';
  if (units <= 5) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700';
  return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700';
}

function unitDot(units: number) {
  if (units === 0) return 'bg-gray-400';
  if (units <= 2) return 'bg-red-500 animate-pulse';
  if (units <= 5) return 'bg-amber-500';
  return 'bg-green-500';
}

function urgencyBadge(urgency: string) {
  if (urgency === 'Critical') return 'bg-red-600 text-white animate-pulse';
  if (urgency === 'Urgent') return 'bg-amber-500 text-white';
  return 'bg-blue-500 text-white';
}

function timeAgo(date: Date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function HospitalBloodCard({ hospital }: { hospital: HospitalBloodStock }) {
  const [expanded, setExpanded] = useState(false);
  const { alerts } = useBlood();
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedType, setSelectedType] = useState<BloodType | null>(null);

  const criticalTypes = hospital.inventory.filter(i => i.units <= 2 && i.units > 0);
  const zeroTypes = hospital.inventory.filter(i => i.units === 0);
  const hasAlert = alerts.some(a => a.hospitalId === hospital.hospitalId && a.status === 'Active');

  return (
    <motion.div
      layout
      className={`rounded-xl border transition-all ${
        hasAlert
          ? 'border-red-400 dark:border-red-600 bg-red-50/30 dark:bg-red-900/10'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F2137]'
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasAlert ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{hospital.hospitalName}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{hospital.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hospital.isBloodBank && (
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
              BLOOD BANK
            </span>
          )}
          {zeroTypes.length > 0 && (
            <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-medium">
              {zeroTypes.length} OUT
            </span>
          )}
          {criticalTypes.length > 0 && (
            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
              {criticalTypes.length} LOW
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Blood type dots (mini view) */}
      {!expanded && (
        <div className="px-3 pb-3 flex gap-1.5">
          {hospital.inventory.map(inv => (
            <div key={inv.type} className="flex flex-col items-center gap-0.5">
              <div className={`w-2 h-2 rounded-full ${unitDot(inv.units)}`} />
              <span className="text-[9px] text-gray-500 dark:text-gray-400">{inv.type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expanded blood inventory */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {hospital.inventory.map(inv => (
                  <button
                    key={inv.type}
                    onClick={() => { setSelectedType(inv.type); setShowAlertModal(true); }}
                    className={`rounded-lg p-2 text-center transition-all hover:scale-105 ${unitColor(inv.units)}`}
                    title={`${inv.type}: ${inv.units} units — click to alert`}
                  >
                    <div className="text-xs font-bold">{inv.type}</div>
                    <div className="text-lg font-black leading-tight">{inv.units}</div>
                    <div className="text-[9px] opacity-70">units</div>
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="flex gap-3 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />&gt;5 OK</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />2-5 Low</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />&lt;2 Critical</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />0 Out</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <a href={`tel:${hospital.phone}`} className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
                  <Phone className="w-3 h-3" />{hospital.phone}
                </a>
                <div className="ml-auto">
                  <button
                    onClick={() => { setSelectedType(null); setShowAlertModal(true); }}
                    className="flex items-center gap-1 text-[11px] bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors"
                  >
                    <Zap className="w-3 h-3" />
                    Send Alert
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Synced {timeAgo(hospital.lastSync)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAlertModal && (
        <BloodEmergencyModal
          hospital={hospital}
          defaultBloodType={selectedType}
          onClose={() => { setShowAlertModal(false); setSelectedType(null); }}
        />
      )}
    </motion.div>
  );
}

function AlertCard({ alert }: { alert: BloodEmergencyAlert }) {
  const { respondToAlert, fulfillAlert, cancelAlert, hospitals } = useBlood();
  const [responding, setResponding] = useState(false);

  const timeLeft = Math.max(0, Math.floor((alert.expiresAt.getTime() - Date.now()) / 60000));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-xl border p-3 space-y-2 ${
        alert.urgency === 'Critical'
          ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20'
          : alert.urgency === 'Urgent'
          ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/20'
          : 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgencyBadge(alert.urgency)}`}>
            {alert.urgency.toUpperCase()}
          </span>
          <span className="text-sm font-black text-gray-900 dark:text-white">{alert.bloodType}</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">{alert.unitsNeeded} units</span>
        </div>
        <span className="text-[10px] text-gray-500 flex items-center gap-1 flex-shrink-0">
          <Clock className="w-3 h-3" />{timeLeft}m left
        </span>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <Building2 className="w-3 h-3" />{alert.hospitalName}
        </p>
        {alert.patientInfo && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{alert.patientInfo}</p>
        )}
      </div>

      {alert.respondedBy.length > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
          <Users className="w-3 h-3" />
          {alert.respondedBy.length} hospital(s) responded
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {/* Respond buttons from other hospitals */}
        {!responding && (
          <button
            onClick={() => setResponding(true)}
            className="flex-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Respond
          </button>
        )}
        {responding && (
          <div className="flex-1 flex gap-1">
            {hospitals.slice(0, 3).map(h => (
              <button
                key={h.hospitalId}
                onClick={() => {
                  const inv = h.inventory.find(i => i.type === alert.bloodType);
                  respondToAlert(alert.id, h.hospitalId, inv?.units ?? 0);
                  setResponding(false);
                }}
                disabled={alert.respondedBy.includes(h.hospitalId)}
                className="flex-1 text-[10px] bg-green-600 hover:bg-green-500 disabled:bg-gray-400 text-white py-1 rounded font-medium transition-colors truncate px-1"
              >
                {h.hospitalName.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => fulfillAlert(alert.id)}
          className="text-[11px] bg-green-600 hover:bg-green-500 text-white px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
          title="Mark as fulfilled"
        >
          ✓
        </button>
        <button
          onClick={() => cancelAlert(alert.id)}
          className="text-[11px] bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
          title="Cancel alert"
        >
          ✕
        </button>
      </div>

      <p className="text-[10px] text-gray-400">{timeAgo(alert.createdAt)}</p>
    </motion.div>
  );
}

export default function BloodBankPanel() {
  const { hospitals, activeAlerts, alerts, getCriticalShortages } = useBlood();
  const [tab, setTab] = useState<'inventory' | 'alerts' | 'shortages'>('alerts');
  const [filterBloodType, setFilterBloodType] = useState<BloodType | 'All'>('All');
  const [showNewAlert, setShowNewAlert] = useState(false);

  const shortages = getCriticalShortages();
  const fulfilledToday = alerts.filter(a => a.status === 'Fulfilled').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/70 dark:border-gray-700/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-rose-500 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Blood Bank</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Live Availability & Alerts</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewAlert(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg shadow-red-500/30 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            BLOOD ALERT
          </motion.button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-soft rounded-lg p-2 text-center">
            <div className="text-lg font-black text-red-600 dark:text-red-400">{activeAlerts.length}</div>
            <div className="text-[10px] text-gray-500">Active Alerts</div>
          </div>
          <div className="glass-soft rounded-lg p-2 text-center">
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">{shortages.length}</div>
            <div className="text-[10px] text-gray-500">Shortages</div>
          </div>
          <div className="glass-soft rounded-lg p-2 text-center">
            <div className="text-lg font-black text-green-600 dark:text-green-400">{fulfilledToday}</div>
            <div className="text-[10px] text-gray-500">Fulfilled</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200/70 dark:border-gray-700/60">
        {[
          { id: 'alerts', label: 'Alerts', count: activeAlerts.length },
          { id: 'inventory', label: 'Inventory', count: hospitals.length },
          { id: 'shortages', label: 'Critical', count: shortages.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative flex items-center justify-center gap-1 ${
              tab === t.id ? 'text-red-600 dark:text-red-400' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.id
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}>
                {t.count}
              </span>
            )}
            {tab === t.id && (
              <motion.div layoutId="bloodTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* Active Alerts Tab */}
        {tab === 'alerts' && (
          <>
            {activeAlerts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-60" />
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No active blood alerts</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">All blood needs are currently met</p>
              </div>
            ) : (
              <AnimatePresence>
                {activeAlerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </AnimatePresence>
            )}

            {/* Past alerts */}
            {alerts.filter(a => a.status !== 'Active').length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Past Alerts</p>
                <div className="space-y-2">
                  {alerts.filter(a => a.status !== 'Active').slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {a.status === 'Fulfilled'
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <XCircle className="w-4 h-4 text-gray-400" />
                        }
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{a.bloodType}</span>
                        <span className="text-xs text-gray-500">{a.hospitalName.split(' ')[0]}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        a.status === 'Fulfilled'
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-600'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Inventory Tab */}
        {tab === 'inventory' && (
          <>
            {/* Blood Type Filter */}
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setFilterBloodType('All')}
                className={`text-[11px] px-2 py-1 rounded-lg font-semibold transition-colors ${
                  filterBloodType === 'All'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {BLOOD_TYPES.map(bt => (
                <button
                  key={bt}
                  onClick={() => setFilterBloodType(bt)}
                  className={`text-[11px] px-2 py-1 rounded-lg font-semibold transition-colors ${
                    filterBloodType === bt
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>

            {hospitals.map(h => (
              <HospitalBloodCard key={h.hospitalId} hospital={
                filterBloodType === 'All'
                  ? h
                  : { ...h, inventory: h.inventory.filter(i => i.type === filterBloodType) }
              } />
            ))}
          </>
        )}

        {/* Critical Shortages Tab */}
        {tab === 'shortages' && (
          <>
            {shortages.length === 0 ? (
              <div className="text-center py-12">
                <Droplets className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-60" />
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No critical shortages</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">All blood types well stocked</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shortages.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      s.units === 0
                        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700'
                        : 'bg-red-50/50 dark:bg-red-900/20 border-red-300 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                        s.units === 0 ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                      }`}>
                        {s.type}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{s.hospital.hospitalName}</p>
                        <p className="text-[11px] text-gray-500">{s.hospital.address}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-black ${s.units === 0 ? 'text-gray-500' : 'text-red-600 dark:text-red-400'}`}>
                        {s.units}
                      </div>
                      <div className="text-[10px] text-gray-400">units</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* New Alert Modal */}
      {showNewAlert && (
        <BloodEmergencyModal
          hospital={null}
          defaultBloodType={null}
          onClose={() => setShowNewAlert(false)}
        />
      )}
    </div>
  );
}
