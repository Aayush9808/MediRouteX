import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  message?: string;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('AppErrorBoundary caught an error:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0A1628] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-[#0F2137] border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {this.props.title || 'Something went wrong'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {this.props.message || 'Please reload to continue using MediRouteX.'}
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-2.5 rounded-xl bg-medical-blue hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
