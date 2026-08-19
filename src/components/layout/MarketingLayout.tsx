import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Shield } from 'lucide-react';

export const MarketingLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 font-sans transition-colors duration-200 selection:bg-brand-500 selection:text-white">
      {/* Top Sticky Navigation */}
      <Navbar />

      {/* Main Marketing Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Marketing Footer */}
      <footer className="border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-surface-900 dark:text-surface-50">
              SafeCircle AI
            </span>
            <span className="text-xs text-surface-500 dark:text-surface-400">
              — Autonomous Travel Safety Net
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-surface-500 dark:text-surface-400">
            <Link to="/journey" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Live Radar
            </Link>
            <Link to="/risk-map" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Risk Map
            </Link>
            <Link to="/reports" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Community Reports
            </Link>
            <Link to="/settings" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Security Rules
            </Link>
          </div>

          <div className="text-xs text-surface-400 dark:text-surface-500 font-mono">
            Smart India Hackathon • Built with Zero-Friction Safety
          </div>
        </div>
      </footer>
    </div>
  );
};
