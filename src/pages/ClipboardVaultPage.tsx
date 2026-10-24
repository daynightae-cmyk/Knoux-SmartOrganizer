import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClipboardCopy, FileText, FolderOpen, Image as ImageIcon, Lock, Pause, Play,
  Pin, PinOff, Search, ShieldAlert, Trash2, X
} from 'lucide-react';
import type { ClipboardItem, ClipboardStatus } from '../vite-env';
import { formatBytes, formatCount, formatDateTime } from '../lib/format';
import { useStore } from '../state/store';
import { EmptyState } from '../components/common';

type Filter = 'all' | 'text' | 'image' | 'files';

const TYPE_ICONS = {
  text: FileText,
  image: ImageIcon,
  files: FolderOpen
} as const;

function dayKey(value: string, locale: 'ar' | 'en'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

export default function ClipboardVaultPage() {
  const { t, locale, settings, update, setNotice } = useStore();
  const [status, setStatus] = useState<ClipboardStatus | null>(null);
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = useCallback(async () => {
    const [nextStatus, nextItems] = await Promise.all([
      window.knoux.clipboardStatus(),
      window.knoux.clipboardList({ query, type: filter, pinnedOnly })
    ]);
    setStatus(nextStatus);
    setItems(nextItems);
  }, [query, filter, pinnedOnly]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const nextStatus = await window.knoux.clipboardStatus();
        if (!cancelled) setStatus(nextStatus);
      } catch { /* the vault is unavailable on this platform */ }
    })();
    const remove = window.knoux.onClipboardChanged(() => { void refresh(); });
    return () => { cancelled = true; remove(); };
  }, [refresh]);

  useEffect(() => { void refresh(); }, [refresh]);

  const grouped = useMemo(() => {
    const map = new Map<string, ClipboardItem[]>();
    for (const item of items) {
      const key = dayKey(item.createdAt, locale);
      const bucket = map.get(key) || [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return [...map.entries()];
  }, [items, locale]);

  const policy = settings?.clipboard;

  const patchPolicy = async (patch: Partial<NonNullable<typeof policy>>) => {
    if (!settings) return;
    await update({ clipboard: { ...settings.clipboard, ...patch } });
    await refresh();
  };

  const toggleCapture = async () => {
    const next = !policy?.enabled;
    await patchPolicy({ enabled: next, paused: next ? false : policy?.paused });
    setNotice(next ? t('clipboard.captureEnabled') : t('clipboard.captureDisabled'));
  };

  const copyBack = async (item: ClipboardItem) => {
    const restored = await window.knoux.clipboardCopyBack(item.id);
    if (restored) setNotice(t('clipboard.copiedBack'));
    else setNotice(t('clipboard.copyFailed'));
    await refresh();
  };

  const removeItem = async (item: ClipboardItem) => {
    await window.knoux.clipboardDelete(item.id);
    await refresh();
  };

  const togglePin = async (item: ClipboardItem) => {
    await window.knoux.clipboardSetPinned({ id: item.id, pinned: !item.pinned });
    await refresh();
  };

  const clearAll = async () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    const removed = await window.knoux.clipboardClear();
    setConfirmClear(false);
    setNotice(t('clipboard.cleared').replace('{count}', formatCount(removed, locale)));
    await refresh();
  };

  const openSource = async (item: ClipboardItem) => {
    try {
      await window.knoux.clipboardOpenSource(item.id);
    } catch (error) {
      setNotice(String((error as Error)?.message || error));
    }
  };

  const monitoring = status?.monitoring === true;
  const storageMode = status?.storageMode ?? 'memory-only';

  return (
    <section className="clipboard-page">
      {/* The shell header already carries the page title and subtitle, so this
          page opens straight into its own controls. */}
      <div className="clipboard-toolbar">
        <div className="clipboard-status" role="status">
          <span className={`pill ${monitoring ? 'ok' : 'muted'}`}>
            {monitoring ? <Play size={11} /> : <Pause size={11} />}
            {monitoring ? t('clipboard.monitoring') : (policy?.enabled ? t('clipboard.paused') : t('clipboard.captureOff'))}
          </span>
          {status?.privateMode && <span className="pill warn"><Lock size={11} />{t('clipboard.privateMode')}</span>}
          <span className="pill ghost">
            <ShieldAlert size={11} />
            {storageMode === 'encrypted' ? t('clipboard.encrypted') : t('clipboard.memoryOnly')}
          </span>
          <span className="muted small">
            {t('clipboard.storageUsage')}: {formatBytes(status?.storageBytes ?? 0, locale)}
          </span>
          <span className="muted small">
            {t('clipboard.itemCount')}: {formatCount(status?.items ?? 0, locale)}
          </span>
        </div>
        <div className="automation-actions">
          <button className={policy?.enabled ? 'knx-btn knx-btn--secondary' : 'knx-btn knx-btn--primary'} onClick={() => { void toggleCapture(); }}>
            {policy?.enabled ? <Pause size={14} /> : <Play size={14} />}
            {policy?.enabled ? t('clipboard.disableCapture') : t('clipboard.enableCapture')}
          </button>
        </div>
      </div>

      {!policy?.enabled && (
        <div className="notice clipboard-welcome" role="note">
          <p className="clipboard-welcome-line">{t('clipboard.welcome')}</p>
          <p className="muted small">{t('clipboard.welcomeNote')}</p>
        </div>
      )}

      <div className="clipboard-controls">
        <label className="knx-search">
          <Search size={15} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('clipboard.search')}
            aria-label={t('clipboard.search')}
            type="search"
          />
        </label>
        <div className="clipboard-filters" role="group" aria-label={t('clipboard.filter')}>
          {(['all', 'text', 'image', 'files'] as Filter[]).map(value => (
            <button
              key={value}
              className={filter === value ? 'chip active' : 'chip'}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {t(`clipboard.type.${value}`)}
            </button>
          ))}
          <button className={pinnedOnly ? 'chip active' : 'chip'} onClick={() => setPinnedOnly(!pinnedOnly)} aria-pressed={pinnedOnly}>
            <Pin size={12} />{t('clipboard.pinnedOnly')}
          </button>
        </div>
      </div>

      <div className="clipboard-privacy">
        <h3>{t('clipboard.privacyTitle')}</h3>
        <div className="clipboard-privacy-grid">
          <label className="setting toggle">
            <span>{t('clipboard.pauseCapture')}</span>
            <input
              type="checkbox"
              checked={Boolean(policy?.paused)}
              disabled={!policy?.enabled}
              onChange={e => { void patchPolicy({ paused: e.target.checked }); }}
            />
          </label>
          <label className="setting toggle">
            <span>{t('clipboard.privateModeLabel')}</span>
            <input
              type="checkbox"
              checked={Boolean(policy?.privateMode)}
              onChange={e => { void patchPolicy({ privateMode: e.target.checked }); }}
            />
          </label>
          <label className="setting toggle">
            <span>{t('clipboard.sensitiveProtection')}</span>
            <input
              type="checkbox"
              checked={Boolean(policy?.sensitiveProtection)}
              onChange={e => { void patchPolicy({ sensitiveProtection: e.target.checked }); }}
            />
          </label>
          <label className="setting toggle">
            <span>{t('clipboard.captureImages')}</span>
            <input
              type="checkbox"
              checked={Boolean(policy?.captureImages)}
              onChange={e => { void patchPolicy({ captureImages: e.target.checked }); }}
            />
          </label>
          <label className="setting toggle">
            <span>{t('clipboard.captureFiles')}</span>
            <input
              type="checkbox"
              checked={Boolean(policy?.captureFiles)}
              onChange={e => { void patchPolicy({ captureFiles: e.target.checked }); }}
            />
          </label>
          <label className="setting">
            <span>{t('clipboard.retentionDays')}</span>
            <input
              type="number"
              min={1}
              max={365}
              value={policy?.retentionDays ?? 14}
              onChange={e => { void patchPolicy({ retentionDays: Math.max(1, Math.min(365, Number(e.target.value) || 1)) }); }}
            />
          </label>
          <label className="setting">
            <span>{t('clipboard.maxItems')}</span>
            <input
              type="number"
              min={10}
              max={2000}
              value={policy?.maxItems ?? 200}
              onChange={e => { void patchPolicy({ maxItems: Math.max(10, Math.min(2000, Number(e.target.value) || 200)) }); }}
            />
          </label>
        </div>
        <p className="muted small">{t('clipboard.privacyNote')}</p>
        {status && !status.persistenceAvailable && (
          <p className="notice" role="alert">{t('clipboard.memoryOnlyWarning')}</p>
        )}
        {status && status.unreadableItems > 0 && (
          <p className="notice" role="alert">{t('clipboard.unreadableWarning').replace('{count}', formatCount(status.unreadableItems, locale))}</p>
        )}
        {status && status.skippedSensitive > 0 && (
          <p className="muted small">{t('clipboard.skippedSensitive').replace('{count}', formatCount(status.skippedSensitive, locale))}</p>
        )}
        <div className="automation-actions">
          <button className="knx-btn knx-btn--destructive" onClick={() => { void clearAll(); }}>
            {confirmClear ? <X size={14} /> : <Trash2 size={14} />}
            {confirmClear ? t('clipboard.confirmClear') : t('clipboard.clearAll')}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState message={t('clipboard.empty')} />
      ) : (
        <div className="clipboard-timeline">
          {grouped.map(([day, dayItems]) => (
            <section key={day} className="clipboard-day">
              <h3 className="clipboard-day-head">{day}</h3>
              {dayItems.map(item => {
                const Icon = TYPE_ICONS[item.type] ?? FileText;
                const isExpanded = expanded === item.id;
                return (
                  <article key={item.id} className={`clipboard-card${item.pinned ? ' pinned' : ''}${isExpanded ? ' expanded' : ''}`}>
                    <div className="clipboard-card-main">
                      <span className="clipboard-type" aria-hidden="true"><Icon size={16} /></span>
                      <div className="clipboard-card-body">
                        <p className="clipboard-preview" dir="auto">{item.preview || t(`clipboard.type.${item.type}`)}</p>
                        <div className="clipboard-meta">
                          <span className="muted small">{formatDateTime(item.createdAt, locale)}</span>
                          <span className="muted small">{t(`clipboard.type.${item.type}`)}</span>
                          <span className="muted small">{formatBytes(item.sizeBytes, locale)}</span>
                          {item.type === 'text' && item.lineCount > 1 && <span className="muted small">{t('clipboard.lines').replace('{count}', formatCount(item.lineCount, locale))}</span>}
                          {item.sensitive && <span className="pill warn">{t('clipboard.possibleSensitive')}</span>}
                          {item.pinned && <span className="pill ok"><Pin size={10} />{t('clipboard.pinned')}</span>}
                        </div>
                        {isExpanded && item.type === 'text' && (
                          <pre className="clipboard-full" dir="auto">{item.text}</pre>
                        )}
                        {isExpanded && item.type === 'files' && (
                          <ul className="clipboard-files">
                            {(item.files || []).map(file => <li key={file} dir="ltr">{file}</li>)}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="clipboard-card-actions">
                      <button className="knx-btn knx-btn--icon" onClick={() => { void copyBack(item); }} aria-label={t('clipboard.copyBack')} title={t('clipboard.copyBack')}>
                        <ClipboardCopy size={14} />
                      </button>
                      <button className="knx-btn knx-btn--icon" onClick={() => { void togglePin(item); }} aria-label={item.pinned ? t('clipboard.unpin') : t('clipboard.pin')} title={item.pinned ? t('clipboard.unpin') : t('clipboard.pin')}>
                        {item.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                      {item.type === 'files' && (
                        <button className="knx-btn knx-btn--icon" onClick={() => { void openSource(item); }} aria-label={t('clipboard.openSource')} title={t('clipboard.openSource')}>
                          <FolderOpen size={14} />
                        </button>
                      )}
                      <button className="knx-btn knx-btn--icon" onClick={() => setExpanded(isExpanded ? null : item.id)} aria-label={t('clipboard.preview')} title={t('clipboard.preview')} aria-expanded={isExpanded}>
                        <FileText size={14} />
                      </button>
                      <button className="knx-btn knx-btn--icon" onClick={() => { void removeItem(item); }} aria-label={t('clipboard.remove')} title={t('clipboard.remove')}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
