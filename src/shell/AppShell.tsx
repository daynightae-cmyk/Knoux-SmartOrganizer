import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import Header from './Header';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import OperationDrawer from './OperationDrawer';
import { SkipLink } from '../lib/a11y';
import { useStore } from '../state/store';
import type { PageId } from '../lib/pages';

const shortcutPages: PageId[] = ['home', 'scan', 'storage', 'files', 'applications', 'cleanup', 'startup', 'history', 'settings'];

export default function AppShell({ children }: { children: ReactNode }) {
  const { notice, sidebarCollapsed, operationOpen, setOperationOpen, t, booted, page, setPage, setPaletteOpen, setSidebarCollapsed, runById, locale, settings, update } = useStore();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);

  /**
   * At the narrow width the sidebar becomes an overlay above the content.
   *
   * It has to start closed, because an overlay that covers the content with no
   * way to dismiss it leaves the application unusable at its smallest
   * supported window size. The header carries the toggle that opens it, and
   * the backdrop closes it again.
   */
  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)');
    const apply = () => {
      setNarrow(query.matches);
      if (query.matches) setSidebarCollapsed(true);
    };
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [setSidebarCollapsed]);

  // Navigating from the overlay closes it, so the chosen page is visible.
  useEffect(() => { if (narrow) setSidebarCollapsed(true); }, [page, narrow, setSidebarCollapsed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;
      const target = event.target as HTMLElement | null;
      const editing = Boolean(target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)));
      if (key === 'escape' && shortcutsOpen) { setShortcutsOpen(false); return; }
      if (editing && !(modifier && key === 'k')) return;
      if (modifier && key === 'k') { event.preventDefault(); setPaletteOpen(true); return; }
      if (modifier && event.shiftKey && key === 'o') { event.preventDefault(); setOperationOpen(true); return; }
      if (modifier && event.shiftKey && key === 's') { event.preventDefault(); void runById('smart-scan'); return; }
      if (modifier && !event.shiftKey && !event.altKey && key === 'b') { event.preventDefault(); setSidebarCollapsed(!sidebarCollapsed); return; }
      if (modifier && event.altKey && ['1', '2', '3'].includes(key)) {
        event.preventDefault();
        const accent = ({ '1': 'cyberpunk', '2': 'neon', '3': 'minimalist' } as const)[key as '1' | '2' | '3'];
        if (settings) void update({ appearance: { ...settings.appearance, accent } });
        return;
      }
      if (modifier && event.altKey && key === 'l') {
        event.preventDefault();
        if (settings) void update({ localization: { ...settings.localization, locale: locale === 'ar' ? 'en' : 'ar' } });
        return;
      }
      if (modifier && !event.shiftKey && !event.altKey && /^[1-9]$/.test(key)) {
        event.preventDefault();
        const next = shortcutPages[Number(key) - 1];
        if (next) setPage(next);
        return;
      }
      if (event.altKey && (key === 'arrowleft' || key === 'arrowright')) {
        event.preventDefault();
        const current = Math.max(0, shortcutPages.indexOf(page));
        const nextIndex = key === 'arrowleft' ? Math.max(0, current - 1) : Math.min(shortcutPages.length - 1, current + 1);
        setPage(shortcutPages[nextIndex]);
        return;
      }
      if (!modifier && !event.altKey && (event.key === '?' || event.key === '/')) { event.preventDefault(); setShortcutsOpen(true); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [locale, page, runById, setPage, setPaletteOpen, setSidebarCollapsed, setOperationOpen, settings, shortcutsOpen, sidebarCollapsed, t, update]);

  return (
    <MotionConfig reducedMotion={settings?.appearance.reduceMotion || settings?.appearance.animations === false ? 'always' : 'user'}>
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
      {narrow && !sidebarCollapsed && <div className="shell-backdrop" onClick={() => setSidebarCollapsed(true)} aria-hidden="true" />}
      <main className="main" id="main" tabIndex={-1}>
        <Header />
        {notice && <div className="notice" role="status">{notice}</div>}
        <div className="workspace-scroll">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={page} className="page-transition" initial={{ opacity: 0, y: 12, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .99 }} transition={{ duration: .28, ease: [0.22, 1, 0.36, 1] }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <CommandPalette />
      <OperationDrawer />
      <ShortcutHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} t={t} />
    </div>
    </MotionConfig>
  );
}

function ShortcutHelp({ open, onClose, t }: { open: boolean; onClose: () => void; t: (key: string) => string }) {
  return <AnimatePresence>{open && <motion.div className="shortcut-help-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
    <motion.section className="shortcut-help" role="dialog" aria-modal="true" aria-labelledby="shortcut-help-title" initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }} transition={{ type: 'spring', stiffness: 360, damping: 28 }} onClick={event => event.stopPropagation()}>
      <div className="shortcut-help-head"><div><p className="eyebrow">KNOuX / CONTROL LAYER</p><h2 id="shortcut-help-title">{t('shortcuts.title')}</h2><p>{t('shortcuts.subtitle')}</p></div><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>
      <div className="shortcut-list">
        {[
          ['Ctrl / ⌘ K', t('shortcuts.search')], ['Ctrl / ⌘ ⇧ S', t('shortcuts.scan')], ['Ctrl / ⌘ ⇧ O', t('shortcuts.operations')], ['Ctrl / ⌘ B', t('shortcuts.sidebar')], ['Ctrl / ⌘ 1–9', t('shortcuts.pages')], ['Alt ← / →', t('shortcuts.previousNext')], ['Ctrl / ⌘ Alt L', t('shortcuts.language')], ['Ctrl / ⌘ Alt 1–3', t('shortcuts.palettes')], ['? or /', t('shortcuts.help')]
        ].map(([binding, label]) => <div className="shortcut-row" key={binding}><kbd>{binding}</kbd><span>{label}</span></div>)}
      </div>
      <p className="shortcut-help-foot">ESC · {t('shortcuts.close')}</p>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}
