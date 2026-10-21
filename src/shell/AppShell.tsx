import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import OperationDrawer from './OperationDrawer';
import { SkipLink } from '../lib/a11y';
import { useStore } from '../state/store';

export default function AppShell({ children }: { children: ReactNode }) {
  const { notice, sidebarCollapsed, operationOpen, setOperationOpen, t, booted } = useStore();
  return (
    <div className={sidebarCollapsed ? 'app-shell collapsed' : 'app-shell'}>
      {!booted && (
        <div className="startup-splash" role="status" aria-live="polite" aria-label={t('common.loading')}>
          <div className="startup-grid" aria-hidden="true" />
          <div className="startup-orbit startup-orbit-one" aria-hidden="true" />
          <div className="startup-orbit startup-orbit-two" aria-hidden="true" />
          <div className="startup-core" aria-hidden="true"><span>K</span></div>
          <div className="startup-copy">
            <strong>KNOuX</strong>
            <span>SMART ORGANIZER</span>
            <i aria-hidden="true" />
          </div>
        </div>
      )}
      <div className="shell-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <SkipLink href="#main" label={t('shell.skipToContent')} />
      <Sidebar />
      {operationOpen && <div className="shell-backdrop" onClick={() => setOperationOpen(false)} aria-hidden="true" />}
      <main className="main" id="main" tabIndex={-1}>
        <Header />
        {notice && <div className="notice" role="status">{notice}</div>}
        <div className="workspace-scroll">{children}</div>
      </main>
      <CommandPalette />
      <OperationDrawer />
    </div>
  );
}
