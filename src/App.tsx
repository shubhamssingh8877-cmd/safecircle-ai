import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export const App = () => {
  return (
    <ThemeProvider>
      <JourneyProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing & Marketing Pages */}
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* App Internal Pages */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/journey" element={<JourneyPage />} />
              <Route path="/risk-map" element={<RiskMapPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </JourneyProvider>
    </ThemeProvider>
  );
};

export default App;
