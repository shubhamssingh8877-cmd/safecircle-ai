import React from 'react';
import { Shield, Bell, Menu } from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';
import { ThemeToggle } from './ThemeToggle';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AppHeaderProps {
  onToggleMobileSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleMobileSidebar }) => {
  const { journey, userProfile } = useJourney();

  const isJourneyActive = journey && journey.status === 'active';

  return (
    <header className="h-16 border-b border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
      {/* Left: Mobile Menu Toggle & App Status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 lg:hidden focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-surface-900 dark:text-surface-50 hidden sm:inline">
              SafeCircle
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              AI Guardian Active
            </span>
          </div>

          {isJourneyActive ? (
            <Badge variant="safe" size="sm" className="hidden md:inline-flex animate-pulse">
              ● Active Guarded Corridor
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm" className="hidden md:inline-flex">
              Standby Mode
            </Badge>
          )}
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* User Quick Info */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-surface-200 dark:border-surface-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
            {userProfile.fullName
              .split(' ')
              .map(n => n[0])
              .join('')}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-surface-900 dark:text-surface-100 leading-tight">
              {userProfile.fullName}
            </div>
            <div className="text-[10px] text-surface-500 dark:text-surface-400 font-mono leading-tight">
              Score: {userProfile.circleHealthScore}%
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
