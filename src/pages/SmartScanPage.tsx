import { useMemo } from 'react';
import { Ban, CheckCircle2, Circle, CircleDot, Loader2, LockKeyhole, Play } from 'lucide-react';
import { formatBytes, formatCount, formatDateTime } from '../lib/format';
import { isActivePhase, progressOf, resolveTool } from '../lib/guards';
import { SMART_SCAN_STAGES, findingTitleKey, smartScanFindings, smartScanStageFromEvent, smartScore, smartScoreReasons, scoreReasonKey } from '../lib/smartscan';
import { useStore } from '../state/store';

export default function SmartScanPage() {
  const { tools, event, result, history, t, locale, runById, cancel } = useStore();
  const tool = useMemo(() => resolveTool(tools, 'smart-scan'), [tools]);
  const activeForScan = event && event.toolId === 'smart-scan' && isActivePhase(event.phase) ? event : null;
  const lastResult = result && result.toolId === 'smart-scan' ? result : null;
  const lastHistory = history.find(record => record.toolId === 'smart-scan' || record.action === 'smart-scan') ?? null;
  const stage = smartScanStageFromEvent(activeForScan);
  const progress = progressOf(activeForScan, lastResult);
  const findings = smartScanFindings(lastResult);
  const score = smartScore(lastResult);
  const reasons = smartScoreReasons(lastResult);

  const start = () => { void runById('smart-scan'); };

  return (
    <div className="scan-page">
      <p className="page-description">{t('smartScan.subtitle')}</p>

      <section className="panel scan-hero">
        <div>
          <span className="local-badge"><LockKeyhole size={13} />{t('common.local')}</span>
          <h2>{t('nav.scan')}</h2>
          {activeForScan ? (
            <>
              <p aria-live="polite"><Loader2 size={14} className="spin" /> {activeForScan.message}</p>
              <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t('tools.progress')}>
                <i style={{ width: `${progress}%` }} />
              </div>
              <p className="muted small" dir="ltr">{activeForScan.current ?? '—'} / {activeForScan.total ?? 7} · {progress}%</p>
              {tool?.supportsCancel && <button className="secondary" onClick={cancel}><Ban size={15} />{t('operation.cancel')}</button>}
            </>
          ) : (
            <>
              <p className="muted">{lastHistory ? `${t('smartScan.lastRun')}: ${formatDateTime(lastHistory.finishedAt, locale)}` : t('smartScan.neverRun')}</p>
              <button className="primary" disabled={!tool?.availability.available} onClick={start}>
                <Play size={16} />{lastResult ? t('smartScan.again') : t('smartScan.start')}
              </button>
              {!tool?.availability.available && <p className="notice">{tool?.availability.reason || t('tools.unavailable')}</p>}
            </>
          )}
        </div>
        <ol className="scan-stages" aria-label={t('smartScan.checks')}>
          {SMART_SCAN_STAGES.map(item => {
            const done = activeForScan ? item.index <= stage : !!lastResult;
            const current = activeForScan && item.index === Math.max(1, stage + (stage >= 7 ? 0 : 1)) && stage < 7;
            return (
              <li key={item.index} className={done ? 'done' : current ? 'current' : ''}>
                {done ? <CheckCircle2 size={15} /> : current ? <CircleDot size={15} /> : <Circle size={15} />}
                <span>{t(item.key)}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {lastResult && (
        <section className="panel">
          <h3>{t('smartScan.score')}: <strong dir="ltr">{score == null ? '—' : formatCount(score, locale)}</strong></h3>
          {reasons.length > 0 && (
            <>
              <h4>{t('smartScan.reasons')}</h4>
              <ul className="reason-list">
                {reasons.map(reason => {
                  const key = scoreReasonKey(reason);
                  return <li key={reason}>{key.startsWith('smartScan.') ? t(key) : reason}</li>;
                })}
              </ul>
            </>
          )}
          <h4>{t('smartScan.findings')} ({formatCount(findings.length, locale)})</h4>
          {findings.length === 0 ? (
            <p className="muted">{t('smartScan.findingsEmpty')}</p>
          ) : (
            <ul className="finding-list">
              {findings.map((finding, index) => (
                <li key={`${finding.key}-${index}`} className={finding.severity === 'warning' ? 'warning' : ''}>
                  <strong>{t(findingTitleKey(finding))}</strong>
                  <span className="muted small">
                    {finding.key === 'diskPressure' && ` · ${String(finding.drive ?? '')} · ${String(finding.pressure ?? '')}`}
                    {finding.key === 'largeDownloads' && ` · ${formatCount(finding.value, locale)} · ${formatBytes(finding.bytes, locale)}`}
                    {finding.key === 'exactDuplicates' && ` · ${formatCount(finding.groups, locale)} · ${formatBytes(finding.reclaimableBytes, locale)}`}
                    {finding.key === 'privacyMetadataReview' && ` · ${formatCount(finding.value, locale)}`}
                    {finding.key === 'tempReview' && ` · ${formatCount(finding.value, locale)} · ${formatBytes(finding.bytes, locale)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="muted small">{t('smartScan.metadataNote')}</p>
        </section>
      )}
    </div>
  );
}
