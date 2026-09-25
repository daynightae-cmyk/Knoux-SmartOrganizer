import { useMemo, useState } from 'react';
import { Download, History as HistoryIcon, Search } from 'lucide-react';
import { formatCount, formatDateTime, formatDurationMs } from '../lib/format';
import { useStore } from '../state/store';
import { SectionTitle } from '../components/common';
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
    <section>
      <SectionTitle
        title={t('history.title')}
        subtitle={t('history.subtitle')}
        action={(
          <div className="automation-actions">
            <button className="secondary" onClick={() => exportRecords('json')}><Download size={14} />{t('history.exportJson')}</button>
            <button className="secondary" onClick={() => exportRecords('csv')}><Download size={14} />{t('history.exportCsv')}</button>
          </div>
        )}
      />
      <div className="history-toolbar">
        <label className="search"><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={t('tools.search')} aria-label={t('tools.search')} /></label>
        <label className="confirmation inline"><input type="checkbox" checked={onlyFailed} onChange={e => setOnlyFailed(e.target.checked)} /><span>{t('history.error')}</span></label>
        <span className="muted small">{formatCount(filtered.length, locale)} / {formatCount(history.length, locale)}</span>
      </div>
      {filtered.length === 0 ? (
        <EmptyState message={t('history.empty')} />
      ) : (
        <div className="history-list">
          {filtered.map(record => (
            <article key={record.operationId} className="history-card">
              <div>
                <span className={record.success ? 'status success' : 'status error'}>{record.success ? t('history.success') : t('history.error')}</span>
                <strong dir="ltr">{record.toolId}</strong>
                <small>{formatDateTime(record.finishedAt, locale)} · {formatDurationMs(record.durationMs, locale)}</small>
                {record.undoAvailable && <span className="pill ghost">{t('cap.undo')}</span>}
              </div>
              <span className="muted small" dir="ltr"><HistoryIcon size={12} /> {formatCount(record.items.length, locale)}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
