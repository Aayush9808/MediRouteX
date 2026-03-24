/**
 * Login Page
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const { login, register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await login(formData);
      toast.success('Welcome back!');
      onSuccess();
    } catch (error) {
      console.error('Login error:', error);
      // Error is already shown by auth service
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.email || !registerData.password || !registerData.name || !registerData.phone) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await register(registerData);
      toast.success('Registration successful!');
      onSuccess();
    } catch (error) {
      console.error('Registration error:', error);
      // Error is already shown by auth service
    }
  };

  if (showRegister) {
    return (
      <div className="min-h-screen app-bg ambient-grid flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl shadow-2xl p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Join MediRouteX Emergency System
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                className="w-full px-4 py-3 glass-soft rounded-lg focus:ring-2 focus:ring-blue-500/70 focus:outline-none dark:text-white"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className="w-full px-4 py-3 glass-soft rounded-lg focus:ring-2 focus:ring-blue-500/70 focus:outline-none dark:text-white"
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={registerData.phone}
                onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                className="w-full px-4 py-3 glass-soft rounded-lg focus:ring-2 focus:ring-blue-500/70 focus:outline-none dark:text-white"
                placeholder="+1 234 567 8900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                className="w-full px-4 py-3 glass-soft rounded-lg focus:ring-2 focus:ring-blue-500/70 focus:outline-none dark:text-white"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => setShowRegister(false)}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Sign In
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg ambient-grid p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-white/40 dark:border-slate-700/60"
      >
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-600 text-white relative overflow-hidden">
          <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 -left-10 w-56 h-56 rounded-full bg-purple-300/20 blur-2xl" />
          <div>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm mb-5">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-4xl font-black leading-tight mb-3">MediRouteX</h2>
            <p className="text-blue-100 text-sm leading-relaxed">Real-time emergency orchestration with ambulance, hospital and blood-bank intelligence.</p>
          </div>
          <div className="text-xs text-blue-100/90 space-y-1">
            <p>⚡ Dispatch in seconds</p>
            <p>🩸 Emergency blood network</p>
            <p>🏥 Live capacity visibility</p>
          </div>
        </div>

        <div className="glass-panel p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to MediRouteX Emergency System
            </p>
          </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 glass-soft rounded-lg focus:ring-2 focus:ring-blue-500/70 focus:outline-none dark:text-white"
              placeholder="demo@mediroutex.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 glass-soft rounded-lg focus:ring-2 focus:ring-blue-500/70 focus:outline-none dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 text-left space-y-0.5">
              <span className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Demo accounts:</span>
              <span className="block">👤 Admin: demo@mediroutex.com / demo1234</span>
              <span className="block">🧑 Requester (Citizen): user@mediroutex.com / user1234</span>
              <span className="block">🚑 Driver: driver@mediroutex.com / driver1234</span>
              <span className="block">🏥 Hospital: hospital@mediroutex.com / hospital1234</span>
              <span className="block">🧑 Patient: patient@mediroutex.com / patient1234</span>
              <span className="block">🩸 Blood Bank: bloodbank@mediroutex.com / blood1234</span>
            </p>
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={() => setShowRegister(true)}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Sign Up
            </button>
          </p>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
