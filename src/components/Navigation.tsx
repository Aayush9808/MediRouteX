import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ambulance, 
  Search, 
  Bell, 
  User, 
  Moon, 
  Sun, 
  Settings,
  LogOut,
  ChevronDown,
  Droplets
} from 'lucide-react';
import { useBlood } from '../contexts/BloodContext';
import { useAuth } from '../contexts/AuthContext';
import ProfileSettingsModal from './ProfileSettingsModal';

interface NavigationProps {
  isDark: boolean;
  onToggleTheme: () => void;
  activePanel: 'main' | 'blood';
  onToggleBloodPanel: () => void;
}

export default function Navigation({ isDark, onToggleTheme, activePanel, onToggleBloodPanel }: NavigationProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { activeAlerts } = useBlood();
  const { user, logout } = useAuth();
  const [notifications] = useState([
    { id: 1, text: 'New emergency in Lajpat Nagar', time: '2 min ago' },
    { id: 2, text: 'Ambulance DL-01 available', time: '5 min ago' },
    { id: 3, text: 'Hospital capacity updated', time: '10 min ago' },
  ]);

  return (
    <nav className="h-16 bg-white dark:bg-[#0F2137] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-medical-blue to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <Ambulance className="w-6 h-6 text-white" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            MediRoute<span className="text-medical-blue">X</span>
          </h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-1 font-mono">EMERGENCY RESPONSE</p>
        </div>
      </div>

      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-xl mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search location, ambulance, hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-medical-blue focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>

        {/* Blood Bank Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleBloodPanel}
          className={`p-2.5 rounded-xl relative transition-colors ${
            activePanel === 'blood'
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
              : 'bg-gray-100 dark:bg-gray-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
          title="Blood Bank & Alerts"
        >
          <Droplets className="w-5 h-5" />
          {activeAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 animate-pulse">
              {activeAlerts.length}
            </span>
          )}
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <p className="text-sm text-gray-900 dark:text-white">{notif.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pr-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
              {(user?.name || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{user?.role || 'Member'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden lg:block" />
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.email || ''}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowProfileSettings(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileSettings(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ProfileSettingsModal isOpen={showProfileSettings} onClose={() => setShowProfileSettings(false)} />
    </nav>
  );
}
