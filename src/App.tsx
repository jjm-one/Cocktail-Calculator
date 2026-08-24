import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { AppStateProvider } from './state/AppStateContext';
import { UI_LANG_KEY } from './lib/state';
import type { Lang } from './lib/types';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import PurchasesPage from './pages/PurchasesPage';
import RecipesPage from './pages/RecipesPage';
import PlanningPage from './pages/PlanningPage';
import CalculationPage from './pages/CalculationPage';
import LeftoverPage from './pages/LeftoverPage';
import DataPage from './pages/DataPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';

function preferredLang(): Lang {
  try {
    const stored = localStorage.getItem(UI_LANG_KEY);
    if (stored === 'de' || stored === 'en') return stored;
  } catch {
    // ignore
  }
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'de';
}

function RootRedirect() {
  return <Navigate to={`/${preferredLang()}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ToastProvider>
        <AppStateProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/:lang" element={<Layout />}>
              <Route index element={<LandingPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="purchases" element={<PurchasesPage />} />
              <Route path="recipes" element={<RecipesPage />} />
              <Route path="planning" element={<PlanningPage />} />
              <Route path="calculation" element={<CalculationPage />} />
              <Route path="leftover" element={<LeftoverPage />} />
              <Route path="data" element={<DataPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="*" element={<Navigate to="." replace />} />
            </Route>
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AppStateProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
