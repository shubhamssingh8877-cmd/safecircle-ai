import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Navigation, Compass, Plus, ArrowRight } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-950/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-surface-900 dark:text-surface-50 flex items-center gap-1.5">
              SafeCircle <span className="text-brand-600 dark:text-brand-400">AI</span>
            </span>
            <span className="text-[10px] text-surface-500 dark:text-surface-400 font-medium tracking-wide uppercase">
              Autonomous Safety Net
            </span>
          </div>
        </Link>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-surface-600 dark:text-surface-300">
          <Link to="/journey" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5">
            <Navigation className="w-4 h-4" />
            <span>Safe Journey</span>
          </Link>
          <Link to="/risk-map" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            <span>Risk Map</span>
          </Link>
          <Link to="/reports" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            <span>Community Feed</span>
          </Link>
        </nav>

        {/* Right CTA / Theme Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/dashboard">
            <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
              Launch App
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
