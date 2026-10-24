import { ListChecks, Menu, Search } from 'lucide-react';
import { localeLabel, pageDef, pageSubtitleKey, pageTitleKey, worldOwnsHeader } from '../lib/pages';
import { useStore } from '../state/store';

export default function Header() {
  const { page, t, locale, settings, update, setPaletteOpen, setOperationOpen, active, sidebarCollapsed, setSidebarCollapsed } = useStore();
  const subtitleKey = pageSubtitleKey(page);
  const ownsHead = worldOwnsHeader(page);
  const current = pageDef(page);
  const ContextIcon = current?.icon;

  return (
    <header className={`topbar${ownsHead ? ' topbar--bare' : ''}`}>
      {ownsHead ? (
        <div className="topbar-context">
          <span className="topbar-context__crest" aria-hidden="true">K</span>
          <span className="topbar-context__copy">
            <small>KNOuX / {t('app.tagline')}</small>
            <strong>{ContextIcon && <ContextIcon size={14} aria-hidden="true" />}{t(current?.nameKey ?? 'nav.home')}</strong>
          </span>
          <span className="topbar-context__status">
            <span className="activity-dot" aria-hidden="true" />
            {t('common.local')}
          </span>
        </div>
      ) : (
        <div className="topbar-title">
          <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" />{t('app.tagline')}</p>
          <h1>{t(pageTitleKey(page))}</h1>
          {subtitleKey && <p className="page-description">{t(subtitleKey)}</p>}
        </div>
      )}
      <div className="top-actions">
        <button
          className="knx-btn knx-btn--icon narrow-menu-button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={t('shell.toggleSidebar')}
          title={t('shell.toggleSidebar')}
          aria-expanded={!sidebarCollapsed}
        >
          <Menu size={19} />
        </button>
        <button
          className="knx-btn knx-btn--ghost search-trigger"
          onClick={() => setPaletteOpen(true)}
          aria-label={t('shell.searchPlaceholder')}
          aria-keyshortcuts="Control+K"
          title={t('shell.searchPlaceholder')}
        >
          <Search size={16} />
          <span>{t('shell.searchPlaceholder')}</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button
          className="knx-btn knx-btn--icon activity-button"
          onClick={() => setOperationOpen(true)}
          aria-label={t('shell.openActivity')}
          title={t('shell.openActivity')}
        >
          <ListChecks size={19} />
          {active && <span className="activity-dot" aria-hidden="true" />}
        </button>
        <button
          className="knx-btn knx-btn--ghost locale-button"
          onClick={() => settings && update({ localization: { ...settings.localization, locale: locale === 'ar' ? 'en' : 'ar' } })}
          aria-label="locale"
        >
          {localeLabel(locale)}
        </button>
      </div>
    </header>
  );
}
