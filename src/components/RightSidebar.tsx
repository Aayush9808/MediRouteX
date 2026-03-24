import { Bell, Clock, AlertTriangle } from 'lucide-react';
import { useEmergency } from '../context/EmergencyContext';

export default function RightSidebar() {
  const { notifications } = useEmergency();

  return (
    <div className="w-80 h-full flex flex-col">
      {/* Notifications Header */}
      <div className="p-4 border-b border-gray-200/70 dark:border-gray-700/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <span className="bg-red-100/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded-full font-semibold">
            {notifications.length}
          </span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="p-4 border-b border-gray-200/70 dark:border-gray-700/60 hover:bg-white/60 dark:hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                notification.severity === 'error' 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : notification.severity === 'warning'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30'
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {notification.severity === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                ) : (
                  <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {notification.type}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {notification.message}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
