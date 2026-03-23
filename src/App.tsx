import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navigation from './components/Navigation';
import LeftSidebar from './components/LeftSidebar';
import RealMapView from './components/RealMapView';
import RightSidebar from './components/RightSidebar';
import BloodBankPanel from './components/BloodBankPanel';
import EmergencyModal from './components/EmergencyModal';
import MobileNav from './components/MobileNav';
import LoginPage from './components/LoginPage';
import PatientDashboard from './components/PatientDashboard';
import DriverDashboard from './components/DriverDashboard';
import HospitalDashboard from './components/HospitalDashboard';
import NormalUserDashboard from './components/NormalUserDashboard';
import BloodBankDashboard from './components/BloodBankDashboard';
import { EmergencyProvider } from './context/EmergencyContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BloodProvider } from './contexts/BloodContext';

function MainApp() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogin, setShowLogin] = useState(!isAuthenticated);
  const [activePanel, setActivePanel] = useState<'main' | 'blood'>('main');

  useEffect(() => {
    setShowLogin(!isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A1628]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return <LoginPage onSuccess={() => setShowLogin(false)} />;
  }

  const role = user?.role ?? 'admin';

  // ── Role-specific portals (wrapped in providers) ──────────────────────
  if (role === 'patient') {
    return (
      <EmergencyProvider>
        <BloodProvider>
          <PatientDashboard />
          <Toaster position="top-right" toastOptions={{ className: 'dark:bg-gray-800 dark:text-white', duration: 4000 }} />
        </BloodProvider>
      </EmergencyProvider>
    );
  }

  if (role === 'driver') {
    return (
      <EmergencyProvider>
        <BloodProvider>
          <DriverDashboard />
          <Toaster position="top-right" toastOptions={{ className: 'dark:bg-gray-800 dark:text-white', duration: 4000 }} />
        </BloodProvider>
      </EmergencyProvider>
    );
  }

  if (role === 'hospital') {
    return (
      <EmergencyProvider>
        <BloodProvider>
          <HospitalDashboard />
          <Toaster position="top-right" toastOptions={{ className: 'dark:bg-gray-800 dark:text-white', duration: 4000 }} />
        </BloodProvider>
      </EmergencyProvider>
    );
  }

  if (role === 'user') {
    return (
      <EmergencyProvider>
        <BloodProvider>
          <NormalUserDashboard />
          <Toaster position="top-right" toastOptions={{ className: 'dark:bg-gray-800 dark:text-white', duration: 4000 }} />
        </BloodProvider>
      </EmergencyProvider>
    );
  }

  if (role === 'blood_bank') {
    return (
      <EmergencyProvider>
        <BloodProvider>
          <BloodBankDashboard />
          <Toaster position="top-right" toastOptions={{ className: 'dark:bg-gray-800 dark:text-white', duration: 4000 }} />
        </BloodProvider>
      </EmergencyProvider>
    );
  }

  // ── Admin / default full dashboard ───────────────────────────────────
  return (
    <EmergencyProvider>
      <BloodProvider>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0A1628] overflow-hidden">
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
                  className="w-1/4 min-w-[320px] max-w-[400px] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F2137] overflow-hidden flex flex-col"
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
                  className="w-1/4 min-w-[320px] max-w-[400px] border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F2137] overflow-hidden flex flex-col"
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
      </BloodProvider>
    </EmergencyProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

