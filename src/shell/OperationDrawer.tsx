import { Ban, X } from 'lucide-react';
import { cancelAllowed, isActivePhase, phaseLabelKey, progressOf, resolveTool } from '../lib/guards';
import { formatDurationMs } from '../lib/format';
import { useStore } from '../state/store';

export default function OperationDrawer() {
  const { operationOpen, setOperationOpen, event, result, tools, t, locale, cancel, setPage, openTool } = useStore();
  if (!operationOpen) return null;

  const tool = event ? resolveTool(tools, event.toolId) : null;
  const progress = progressOf(event, result);
  const running = event ? isActivePhase(event.phase) : false;
  const canCancel = cancelAllowed(tool, event);
  const startedAt = event ? new Date(event.startedAt).getTime() : null;
  const elapsed = startedAt ? Math.max(0, Date.now() - startedAt) : null;

  const openWorkspace = () => {
    if (tool) {
      openTool(tool);
      setOperationOpen(false);
    } else if (event) {
      setPage('history');
      setOperationOpen(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={() => setOperationOpen(false)}>
      <aside
        className="operation-drawer"
        aria-label={t('operation.title')}
        role="dialog"
        aria-modal="false"
        onClick={e => e.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <h2>{t('operation.title')}</h2>
            <p>{event?.message || t('operation.ready')}</p>
          </div>
          <button className="icon-button" onClick={() => setOperationOpen(false)} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t('operation.progress')}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="operation-meta">
          <span className="pill">{t(phaseLabelKey(event?.phase || 'idle'))}</span>
          <span dir="ltr">{progress === 0 && !running ? '—' : `${progress}%`}</span>
          {elapsed != null && <span>{t('common.elapsed')}: {formatDurationMs(elapsed, locale)}</span>}
        </div>
        {event?.current != null && event?.total != null && (
          <p className="muted small" dir="ltr">{event.current} / {event.total}</p>
        )}
        {event?.warnings?.length ? (
          <details className="drawer-details"><summary>{t('operation.warnings')} ({event.warnings.length})</summary>
            <ul>{event.warnings.slice(0, 10).map(w => <li key={w}>{w}</li>)}</ul>
          </details>
        ) : null}
        {event?.errors?.length ? (
          <details className="drawer-details"><summary>{t('operation.errors')} ({event.errors.length})</summary>
            <ul>{event.errors.slice(0, 10).map(e => <li key={e}>{e}</li>)}</ul>
          </details>
        ) : null}
        {result && (
          <div className={result.success ? 'result result-success inline' : 'result result-error inline'}>
            <strong>{result.success ? t('operation.complete') : t('operation.failed')}</strong>
            <span className="muted small" dir="ltr">{result.toolId}</span>
          </div>
        )}
        <div className="drawer-actions">
          {canCancel && (
            <button className="secondary" onClick={cancel}><Ban size={16} />{t('operation.cancel')}</button>
          )}
          {!running && (tool || event) && (
            <button className="secondary" onClick={openWorkspace}>{t('operation.viewWorkspace')}</button>
          )}
          {!running && !result && <p className="drawer-empty">{t('operation.empty')}</p>}
        </div>
      </aside>
    </div>
  );
}
