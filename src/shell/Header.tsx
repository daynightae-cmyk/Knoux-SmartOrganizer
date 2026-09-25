import { ListChecks, Search } from 'lucide-react';
import { pageSubtitleKey, pageTitleKey } from '../lib/pages';
import { localeLabel } from '../lib/pages';
import { useStore } from '../state/store';

export default function Header() {
  const { page, t, locale, settings, update, setPaletteOpen, setOperationOpen, active } = useStore();
  const subtitleKey = pageSubtitleKey(page);

  return (
    <header className="topbar">
      <div className="topbar-title">
        <p className="eyebrow">{t('app.tagline')}</p>
        <h1>{t(pageTitleKey(page))}</h1>
        {subtitleKey && <p className="page-description">{t(subtitleKey)}</p>}
      </div>
      <div className="top-actions">
        <button
          className="search search-trigger"
          onClick={() => setPaletteOpen(true)}
          aria-label={t('shell.searchPlaceholder')}
        >
          <Search size={16} />
          <span>{t('shell.searchPlaceholder')}</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button
          className="icon-button activity-button"
          onClick={() => setOperationOpen(true)}
          aria-label={t('shell.openActivity')}
          title={t('shell.openActivity')}
        >
          <ListChecks size={19} />
          {active && <i className="activity-dot" aria-hidden="true" />}
        </button>
        <button
          className="locale-button"
          onClick={() => settings && update({ localization: { ...settings.localization, locale: locale === 'ar' ? 'en' : 'ar' } })}
          aria-label="locale"
        >
          {localeLabel(locale)}
        </button>
      </div>
    </header>
  );
}
