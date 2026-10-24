import { useMemo, useState } from 'react';
import { Download, History as HistoryIcon, RotateCcw, Search, TriangleAlert } from 'lucide-react';
import { formatCount, formatDateTime, formatDurationMs } from '../lib/format';
import { useStore } from '../state/store';
import { EmptyState } from '../components/common';

export default function HistoryPage() {
  const { history, setNotice, t, locale } = useStore();
  const [q, setQ] = useState('');
  const [onlyFailed, setOnlyFailed] = useState(false);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return history.filter(record => {
      if (onlyFailed && record.success) return false;
      if (!query) return true;
      return `${record.toolId} ${record.action}`.toLowerCase().includes(query);
    });
  }, [history, q, onlyFailed]);

  const exportRecords = async (format: 'json' | 'csv') => {
    try {
      const saved = await window.knoux.exportHistory(format);
      if (saved) setNotice(`${t('history.exported')} ${saved}`);
    } catch (error) { setNotice(String((error as Error).message || error)); }
  };

  return (
    <section className="history-page">
      <div className="history-toolbar">
        <label className="knx-search history-search"><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={t('tools.search')} aria-label={t('tools.search')} /></label>
        <button type="button" className={onlyFailed ? 'knx-chip is-on' : 'knx-chip'} aria-pressed={onlyFailed} onClick={() => setOnlyFailed(value => !value)}>
          <TriangleAlert size={13} />{t('history.error')}
        </button>
        <span className="history-count" dir="ltr">{formatCount(filtered.length, locale)} / {formatCount(history.length, locale)}</span>
        <div className="history-actions">
          <button className="knx-btn knx-btn--secondary knx-btn--compact" onClick={() => exportRecords('json')}><Download size={14} />{t('history.exportJson')}</button>
          <button className="knx-btn knx-btn--secondary knx-btn--compact" onClick={() => exportRecords('csv')}><Download size={14} />{t('history.exportCsv')}</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState message={t('history.empty')} />
      ) : (
        <div className="history-list">
          {filtered.map(record => (
            <article key={record.operationId} className="history-card">
              <span className={record.success ? 'history-state is-success' : 'history-state is-error'} aria-hidden="true" />
              <div className="history-card__main">
                <strong dir="ltr">{record.toolId}</strong>
                <small>{formatDateTime(record.finishedAt, locale)} · {formatDurationMs(record.durationMs, locale)}</small>
              </div>
              <div className="history-card__meta">
                <span className={record.success ? 'history-badge is-success' : 'history-badge is-error'}>{record.success ? t('history.success') : t('history.error')}</span>
                {record.undoAvailable && <span className="history-badge is-undo"><RotateCcw size={11} />{t('cap.undo')}</span>}
                {record.items.length > 0 && <span className="history-items" dir="ltr"><HistoryIcon size={12} /> {formatCount(record.items.length, locale)}</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
