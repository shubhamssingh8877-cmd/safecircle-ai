import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { JourneyProvider } from './context/JourneyContext';
import { MarketingLayout } from './components/layout/MarketingLayout';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { JourneyPage } from './pages/JourneyPage';
import { RiskMapPage } from './pages/RiskMapPage';
import { ReportsPage } from './pages/ReportsPage';
import { ContactsPage } from './pages/ContactsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <ThemeProvider>
      <JourneyProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Marketing Route */}
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Guarded App Layout Routes */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/journey" element={<JourneyPage />} />
              <Route path="/risk-map" element={<RiskMapPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallbacks */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </JourneyProvider>
    </ThemeProvider>
  );
}

export default App;
