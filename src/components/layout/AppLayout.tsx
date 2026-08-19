import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { EmergencySosModal } from './EmergencySosModal';
import { JourneyArrivalModal } from './JourneyArrivalModal';
import { useJourney } from '../../context/JourneyContext';
import { AlertTriangle } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { journey, recordCheckIn } = useJourney();

  const isDeviated = journey?.status === 'active' && journey?.deviationDetected;

  return (
    <div className="h-screen flex bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop and Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-surface-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full w-64 max-w-[80vw]">
            <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AppHeader onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)} />

        {/* Global Urgent Alert Banner: Deviation Detected */}
        {isDeviated && (
          <div className="bg-danger-600 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm shadow-md animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
              <span className="font-semibold truncate">
                Route Deviation Detected: 420m off planned route.
              </span>
              <span className="hidden md:inline text-danger-100">
                Are you safe? Check-in prompt sent.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => recordCheckIn('confirmed', 'User dismissed route deviation alert.')}
                className="px-2.5 py-1 rounded bg-white text-danger-700 font-semibold text-xs hover:bg-danger-50 transition-colors shadow-xs"
              >
                I am Safe
              </button>
              <Link to="/journey">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded bg-danger-700 text-white text-xs hover:bg-danger-800 transition-colors border border-danger-500"
                >
                  View Route
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Emergency SOS Modal */}
      <EmergencySosModal />

      {/* Global Journey Arrival Safety Summary Modal */}
      <JourneyArrivalModal />
    </div>
  );
};
