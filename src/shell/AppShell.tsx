import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import OperationDrawer from './OperationDrawer';
import { SkipLink } from '../lib/a11y';
import { useStore } from '../state/store';

export default function AppShell({ children }: { children: ReactNode }) {
  const { notice, sidebarCollapsed, operationOpen, setOperationOpen, t } = useStore();
  return (
    <div className={sidebarCollapsed ? 'app-shell collapsed' : 'app-shell'}>
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
