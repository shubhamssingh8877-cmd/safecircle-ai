import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Navigation,
  Compass,
  AlertTriangle,
  Users,
  Settings,
  Shield,
  Radio,
  X,
  PlusCircle,
} from 'lucide-react';
import { useJourney } from '../../context/JourneyContext';
import { Button } from '../ui/Button';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { journey, openSosModal } = useJourney();

  const navItems = [
    { name: 'Guardian Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Journey Radar', path: '/journey', icon: Navigation, badge: journey?.status === 'active' ? 'Active' : undefined },
    { name: 'Contextual Risk Map', path: '/risk-map', icon: Compass },
    { name: 'Community Reports', path: '/reports', icon: AlertTriangle },
    { name: 'Trusted Circle', path: '/contacts', icon: Users },
    { name: 'Safety Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-full bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col justify-between p-4 select-none">
      <div className="space-y-6">
        {/* Logo Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-md shadow-brand-600/20">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-surface-900 dark:text-surface-50">
                SafeCircle <span className="text-brand-600 dark:text-brand-400">AI</span>
              </span>
              <span className="text-[9px] text-surface-400 dark:text-surface-500 uppercase tracking-widest font-semibold">
                Autonomous Safety Net
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 shadow-xs'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-200'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-safe-100 dark:bg-safe-950 text-safe-700 dark:text-safe-300 border border-safe-300 dark:border-safe-800 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Emergency SOS Trigger & Quick Actions */}
      <div className="space-y-3 pt-4 border-t border-surface-200 dark:border-surface-800">
        <Button
          variant="danger"
          size="md"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            openSosModal();
          }}
          className="w-full justify-center font-bold tracking-wide shadow-md shadow-danger-600/25 uppercase text-xs"
          icon={<Radio className="w-4 h-4 animate-pulse" />}
        >
          Emergency SOS
        </Button>

        <div className="px-2 text-center">
          <p className="text-[10px] text-surface-400 dark:text-surface-500 font-mono">
            Autonomous Safety Protocol • v0.1.0
          </p>
        </div>
      </div>
    </aside>
  );
};
