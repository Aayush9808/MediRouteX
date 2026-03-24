import { useEffect, useState } from 'react';
import { X, User, Settings, Bell, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const saveProfile = async () => {
    try {
      await updateProfile({ name, phone });
      toast.success('Profile updated successfully');
      onClose();
    } catch {
      toast.error('Could not update profile right now');
    }
  };

  const saveSettings = () => {
    localStorage.setItem('mediroutex_settings', JSON.stringify({ emailNotifications, soundAlerts }));
    toast.success('Settings saved');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[3000] flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#0F2137] border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Account</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <span className="inline-flex items-center gap-1"><User className="w-4 h-4" /> Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <span className="inline-flex items-center gap-1"><Settings className="w-4 h-4" /> Settings</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {activeTab === 'profile' ? (
            <>
              <div>
                <label className="block text-xs mb-1 text-gray-500">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0A1628] text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-500">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0A1628] text-gray-900 dark:text-white"
                />
              </div>
              <div className="rounded-lg p-3 bg-gray-50 dark:bg-[#0A1628] border border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Role: {user.role}</div>
                <div className="mt-1">Email: {user.email}</div>
              </div>
              <button onClick={saveProfile} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">Save Profile</button>
            </>
          ) : (
            <>
              <label className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <span className="text-sm text-gray-800 dark:text-gray-200 inline-flex items-center gap-2"><Bell className="w-4 h-4" /> Email Notifications</span>
                <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <span className="text-sm text-gray-800 dark:text-gray-200">Sound Alerts</span>
                <input type="checkbox" checked={soundAlerts} onChange={(e) => setSoundAlerts(e.target.checked)} />
              </label>
              <button onClick={saveSettings} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">Save Settings</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
