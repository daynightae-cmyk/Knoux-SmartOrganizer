import AppShell from './shell/AppShell';
import ApplicationsPage from './pages/ApplicationsPage';
import AutomationPage from './pages/AutomationPage';
import ClipboardVaultPage from './pages/ClipboardVaultPage';
import FilesPage from './pages/FilesPage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import SmartScanPage from './pages/SmartScanPage';
import StoragePage from './pages/StoragePage';
import WorldPage from './pages/WorldPage';
import StudioPage from './studio/StudioPage';
import { StoreProvider, useStore } from './state/store';
import Splash from './shell/Splash';
import { isCatalogPage } from './lib/pages';
import type { WorldId } from './lib/service-catalog';

function RoutedPage() {
  const { page, booted, bootError } = useStore();
  if (!booted) return <Splash />;
  if (bootError) return <div className="notice" role="alert">{bootError}</div>;
  if (page === 'home') return <HomePage />;
  if (page === 'applications') return <ApplicationsPage />;
  if (page === 'files') return <FilesPage />;
  if (page === 'storage') return <StoragePage />;
  if (page === 'scan') return <SmartScanPage />;
  if (page === 'studio') return <StudioPage />;
  if (page === 'clipboard') return <ClipboardVaultPage />;
  if (page === 'automation') return <AutomationPage />;
  if (page === 'history') return <HistoryPage />;
  if (page === 'settings') return <SettingsPage />;
  if (isCatalogPage(page)) return <WorldPage page={page as WorldId} />;
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
