import { useState } from 'react';
import { CheckCircle2, Copy, XCircle } from 'lucide-react';
import type { ToolResult } from '@shared/contracts';
import { fill, formatBytes, formatCount, formatDateTime, formatDurationMs, shortHash } from '../../lib/format';
import { useStore } from '../../state/store';

const BYTE_KEYS = new Set(['memoryFreeBytes', 'memoryTotalBytes', 'systemDriveFreeBytes', 'systemDriveTotalBytes', 'thresholdBytes', 'totalMatchingBytes', 'totalScannedBytes', 'reclaimableBytes', 'eligibleBytes', 'quarantinedBytes', 'duplicateReclaimableBytes', 'tempEligibleBytes', 'privacyExposureBytes']);
const COUNT_KEYS = new Set(['filesScanned', 'matchingFiles', 'candidateFiles', 'duplicateGroups', 'duplicateFiles', 'eligibleFiles', 'quarantinedFiles', 'entries', 'applications', 'services', 'events', 'processes', 'largeDownloads', 'exactDuplicateGroups', 'privacyExposureCount', 'movedFiles', 'skippedFiles', 'restoredFiles', 'plannedMoves']);

function renderValue(key: string, value: unknown, locale: 'ar' | 'en', t: (k: string) => string): string {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no');
  if (key === 'durationMs') return formatDurationMs(value, locale);
  if (key === 'uptimeSeconds') {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    const h = Math.floor(n / 3600);
    const m = Math.floor((n % 3600) / 60);
    return `${new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en').format(h)}:${String(m).padStart(2, '0')}`;
  }
  if (BYTE_KEYS.has(key)) return formatBytes(value, locale);
  if (COUNT_KEYS.has(key)) return formatCount(value, locale);
  if (key === 'memoryUsedPercent') {
    const n = Number(value);
    return Number.isFinite(n) ? `${new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', { maximumFractionDigits: 1 }).format(n)}%` : '—';
  }
  if (key === 'smartScore') {
    const n = Number(value);
    return Number.isFinite(n) ? formatCount(n, locale) : '—';
  }
  if (key === 'finishedAt' || key === 'startedAt') return formatDateTime(value, locale);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function ToolResultView({ result }: { result: ToolResult }) {
  const { t, locale } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState('');
  const entries = Object.entries(result.summary);
  const items = expanded ? result.items : result.items.slice(0, 8);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      window.setTimeout(() => setCopied(''), 1500);
    } catch { /* clipboard unavailable in sandbox */ }
  };

  return (
    <div className={result.success ? 'result result-success' : 'result result-error'}>
      <h3>
        {result.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        {result.success ? t('common.result') : t('operation.failed')}
      </h3>
      <p className="muted small">{t('result.summaryNote')}</p>
      {result.errors.map(error => <p key={error} role="alert">{error}</p>)}
      {result.warnings.length > 0 && (
        <details><summary>{t('common.warnings')} ({result.warnings.length})</summary>
          <ul>{result.warnings.map(w => <li key={w}>{w}</li>)}</ul>
        </details>
      )}
      <dl className="result-grid">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt>{t(`result.key.${key}`) !== `result.key.${key}` ? t(`result.key.${key}`) : key}</dt>
            <dd dir={typeof value === 'number' || key.toLowerCase().includes('path') || key.toLowerCase().includes('hash') ? 'ltr' : undefined}>
              {renderValue(key, value, locale, t)}
            </dd>
          </div>
        ))}
      </dl>
      {result.undoMetadata && typeof result.undoMetadata === 'object' && 'journalId' in result.undoMetadata && (
        <p className="muted small" dir="ltr">journal: {String((result.undoMetadata as Record<string, unknown>).journalId)}</p>
      )}
      {result.items.length > 0 && (
        <details open={expanded}>
          <summary onClick={e => { e.preventDefault(); setExpanded(!expanded); }}>
            {expanded ? t('operation.collapse') : fill(t('tools.showAllItems'), { count: formatCount(result.items.length, locale) })}
          </summary>
          <div className="result-items">
            {items.map((item, index) => {
              const path = (item.path ?? item.source ?? item.destination ?? item.file ?? item.name ?? '') as string;
              const key = `${index}-${path}`;
              return (
                <div key={key} className="result-item">
                  <code dir="ltr" title={String(path)}>{path ? (String(path).length > 90 ? `…${String(path).slice(-89)}` : String(path)) : shortHash(JSON.stringify(item))}</code>
                  {path && (
                    <button className="icon-button" onClick={() => copy(String(path))} aria-label={t('files.copy')} title={copied === String(path) ? t('files.copied') : t('files.copy')}>
                      <Copy size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
