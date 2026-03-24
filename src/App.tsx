import { useState, useEffect, ReactNode, ComponentType, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';
import LoginPage from './components/LoginPage';
import AppErrorBoundary from './components/AppErrorBoundary';
import { EmergencyProvider } from './context/EmergencyContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BloodProvider } from './contexts/BloodContext';
import { AppRole, PortalRole, normalizeRole, isPortalRole, getRoleLabel } from './utils/roles';
const THEME_STORAGE_KEY = 'mediroutex_theme';

const Navigation = lazy(() => import('./components/Navigation'));
const LeftSidebar = lazy(() => import('./components/LeftSidebar'));
const RealMapView = lazy(() => import('./components/RealMapView'));
const RightSidebar = lazy(() => import('./components/RightSidebar'));
const BloodBankPanel = lazy(() => import('./components/BloodBankPanel'));
const EmergencyModal = lazy(() => import('./components/EmergencyModal'));
const MobileNav = lazy(() => import('./components/MobileNav'));

const PatientDashboard = lazy(() => import('./components/PatientDashboard'));
const DriverDashboard = lazy(() => import('./components/DriverDashboard'));
const HospitalDashboard = lazy(() => import('./components/HospitalDashboard'));
const NormalUserDashboard = lazy(() => import('./components/NormalUserDashboard'));
const BloodBankDashboard = lazy(() => import('./components/BloodBankDashboard'));

const ROLE_DASHBOARD_MAP: Record<PortalRole, ComponentType> = {
  patient: PatientDashboard,
  driver: DriverDashboard,
  hospital: HospitalDashboard,
  user: NormalUserDashboard,
  blood_bank: BloodBankDashboard,
};

const preloadRoleDashboard = (role: PortalRole) => {
  switch (role) {
    case 'patient':
      import('./components/PatientDashboard');
      break;
    case 'driver':
      import('./components/DriverDashboard');
      break;
    case 'hospital':
      import('./components/HospitalDashboard');
      break;
    case 'user':
      import('./components/NormalUserDashboard');
      break;
    case 'blood_bank':
      import('./components/BloodBankDashboard');
      break;
    default:
      break;
  }
};

function AccessDenied({ role, onLogout }: { role: string; onLogout: () => Promise<void> }) {
  return (
    <div className="min-h-screen app-bg ambient-grid flex items-center justify-center px-4">
      <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          The role <span className="font-semibold">{getRoleLabel(role)}</span> is not configured for this portal.
        </p>
        <button
          onClick={onLogout}
          className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-gray-800 dark:text-white', duration: 4000 }} />
    </div>
  );
}

function FullScreenLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="h-screen flex items-center justify-center app-bg ambient-grid">
      <div className="text-center glass-panel px-10 py-8 rounded-2xl">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function MainApp() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;

    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  });
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activePanel, setActivePanel] = useState<'main' | 'blood'>('main');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [isDark]);

  const role = normalizeRole(user?.role) as AppRole | string;

  useEffect(() => {
    if (isPortalRole(role)) {
      preloadRoleDashboard(role);
    }
  }, [role]);

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => undefined} />;
  }

  const withRoleProviders = (component: ReactNode) => (
    <EmergencyProvider>
      <BloodProvider>
        {component}
        <Toaster position="top-right" toastOptions={{ className: 'dark:bg-gray-800 dark:text-white', duration: 4000 }} />
      </BloodProvider>
    </EmergencyProvider>
  );

  // ── Role-specific portals (wrapped in providers) ──────────────────────
  if (isPortalRole(role)) {
    const RoleDashboard = ROLE_DASHBOARD_MAP[role];

    return withRoleProviders(
      <Suspense fallback={<FullScreenLoader label="Loading dashboard..." />}>
        <RoleDashboard />
      </Suspense>
    );
  }

  if (role !== 'admin') {
    return <AccessDenied role={role} onLogout={logout} />;
  }

  // ── Admin / default full dashboard ───────────────────────────────────
  return (
    <EmergencyProvider>
      <BloodProvider>
      <Suspense fallback={<FullScreenLoader label="Loading control center..." />}>
      <div className="h-screen flex flex-col app-bg ambient-grid overflow-hidden">
        <Navigation 
          isDark={isDark} 
          onToggleTheme={() => setIsDark(!isDark)}
          activePanel={activePanel}
          onToggleBloodPanel={() => setActivePanel(p => p === 'blood' ? 'main' : 'blood')}
        />
        
        <main className="flex-1 flex overflow-hidden relative">
          {/* Desktop Layout */}
          <AnimatePresence>
            {!isMobile && (
              <>
                <motion.div
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-1/4 min-w-[320px] max-w-[400px] m-3 mr-1 rounded-2xl glass-panel overflow-hidden flex flex-col"
                >
                  <LeftSidebar onRequestEmergency={() => setShowEmergencyModal(true)} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex-1 relative"
                >
                  <RealMapView />
                </motion.div>

                <motion.div
                  key={activePanel}
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-1/4 min-w-[320px] max-w-[400px] m-3 ml-1 rounded-2xl glass-panel overflow-hidden flex flex-col"
                >
                  {activePanel === 'blood' ? <BloodBankPanel /> : <RightSidebar />}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Mobile Layout */}
          {isMobile && (
            <div className="flex-1 relative">
              <RealMapView />
              <MobileNav isOpen={showMobileNav} onClose={() => setShowMobileNav(false)} />
            </div>
          )}
        </main>

        <AnimatePresence>
          {showEmergencyModal && (
            <EmergencyModal isOpen={showEmergencyModal} onClose={() => setShowEmergencyModal(false)} />
          )}
        </AnimatePresence>

        <Toaster
          position="top-right"
          toastOptions={{
            className: 'dark:bg-gray-800 dark:text-white',
            duration: 4000,
          }}
        />
      </div>
      </Suspense>
      </BloodProvider>
    </EmergencyProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppErrorBoundary
        title="Unable to load dashboard"
        message="An unexpected UI error occurred. Please reload the app."
      >
        <MainApp />
      </AppErrorBoundary>
    </AuthProvider>
  );
}

