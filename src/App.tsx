import AppShell from './shell/AppShell';
import AutomationPage from './pages/AutomationPage';
import CatalogPage from './pages/CatalogPage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import SmartScanPage from './pages/SmartScanPage';
import { StoreProvider, useStore } from './state/store';
import { isCatalogPage } from './lib/pages';

function RoutedPage() {
  const { page, booted, bootError, t } = useStore();
  if (!booted) return <p>{t('common.loading')}</p>;
  if (bootError) return <div className="notice" role="alert">{bootError}</div>;
  if (page === 'home') return <HomePage />;
  if (page === 'scan') return <SmartScanPage />;
  if (page === 'automation') return <AutomationPage />;
  if (page === 'history') return <HistoryPage />;
  if (page === 'settings') return <SettingsPage />;
  if (isCatalogPage(page)) return <CatalogPage page={page} />;
  return <HomePage />;
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell>
        <RoutedPage />
      </AppShell>
    </StoreProvider>
  );
}
