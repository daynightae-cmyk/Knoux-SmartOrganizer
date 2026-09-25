import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import OperationDrawer from './OperationDrawer';
import { useStore } from '../state/store';

export default function AppShell({ children }: { children: ReactNode }) {
  const { notice, sidebarCollapsed, operationOpen, setOperationOpen } = useStore();
  return (
    <div className={sidebarCollapsed ? 'app-shell collapsed' : 'app-shell'}>
      <Sidebar />
      {operationOpen && <div className="shell-backdrop" onClick={() => setOperationOpen(false)} aria-hidden="true" />}
      <main className="main" id="main">
        <Header />
        {notice && <div className="notice" role="status">{notice}</div>}
        <div className="workspace-scroll">{children}</div>
      </main>
      <CommandPalette />
      <OperationDrawer />
    </div>
  );
}
