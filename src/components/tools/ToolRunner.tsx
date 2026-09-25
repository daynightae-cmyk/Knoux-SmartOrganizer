import { useEffect, useState } from 'react';
import { Ban, Play, RotateCcw, ShieldAlert } from 'lucide-react';
import type { ToolDefinition } from '@shared/contracts';
import { formatDurationMs } from '../../lib/format';
import { canRunTool, cancelAllowed, isActivePhase, progressOf, requiresConfirmation, undoAllowed } from '../../lib/guards';
import { toolIcon } from '../../lib/icons';
import { useStore } from '../../state/store';
import { AdminBadge, AvailabilityBadge, CapabilityBadges, RiskBadge } from './ToolBadges';
import { ToolResultView } from './ToolResult';

export function ToolDetail({ tool }: { tool: ToolDefinition }) {
  const { t } = useStore();
  const Icon = toolIcon(tool.icon);
  return (
    <div className="tool-heading">
      <span className="tool-heading-icon" aria-hidden="true"><Icon size={22} /></span>
      <div>
        <h2>{t(tool.nameKey)}</h2>
        <p>{t(tool.descriptionKey)}</p>
        <div className="tool-heading-badges">
          <RiskBadge tool={tool} t={t} /><AdminBadge tool={tool} t={t} /><AvailabilityBadge tool={tool} t={t} />
        </div>
        <CapabilityBadges tool={tool} t={t} />
        <p className="muted small">{t('tools.estimatedCost')}: {t(`common.cost.${tool.estimatedCost}`)}</p>
      </div>
    </div>
  );
}

export function ToolWarnings({ tool }: { tool: ToolDefinition }) {
  const { t } = useStore();
  if (!tool.advisory) {
    if (tool.riskLevel === 'read-only') return <p className="muted small">{t('tools.readOnlyNote')}</p>;
    return null;
  }
  return (
    <dl className="tool-advisory">
      <div><dt>{t('repair.what')}</dt><dd>{t(tool.advisory.effectKey)}</dd></div>
      <div><dt>{t('repair.admin')}</dt><dd>{tool.requiresAdmin ? t('common.yes') : t('common.no')}</dd></div>
      <div><dt>{t('repair.risk')}</dt><dd>{t(`risk.${tool.riskLevel}`)}</dd></div>
      <div><dt>{t('repair.duration')}</dt><dd>{t(tool.advisory.durationKey)}</dd></div>
      <div><dt>{t('repair.restart')}</dt><dd>{tool.advisory.restartMayBeRequired ? t('common.mayBeRequired') : t('common.no')}</dd></div>
      <div><dt>{t('repair.doesNot')}</dt><dd>{t(tool.advisory.doesNotKey)}</dd></div>
    </dl>
  );
}

function inputsFor(toolId: string, extra: Record<string, unknown>, confirmed: boolean, aux: { journalId: string; serviceName: string; serviceAction: string; startupValue: string; dryRun: boolean }) {
  if (['organize-downloads-undo', 'temp-cleanup-undo'].includes(toolId)) return { journalId: aux.journalId, ...extra };
  if (toolId === 'service-startup-undo' || toolId === 'startup-restore') return { journalId: aux.journalId, confirm: true, ...extra };
  if (toolId === 'service-control') {
    return { serviceName: aux.serviceName, action: aux.serviceAction, confirm: true, ...(aux.dryRun ? { dryRun: true } : {}), ...extra };
  }
  if (toolId === 'startup-disable') return { valueName: aux.startupValue, confirm: true, ...extra };
  if (['organize-downloads-apply', 'temp-cleanup-apply'].includes(toolId)) {
    return { confirm: true, ...(aux.dryRun ? { dryRun: true } : {}), ...extra };
  }
  const adminLike = extra.__admin === true;
  const base: Record<string, unknown> = adminLike || toolId.startsWith('repair-') ? { confirm: true, ...(aux.dryRun ? { dryRun: true } : {}), ...extra } : { ...extra };
  delete base.__admin;
  if (confirmed) base.confirm = true;
  return base;
}

export function ToolRunner({ tool, folder, file }: { tool: ToolDefinition; folder: string; file: string }) {
  const { t, locale, event, result, run, cancel, chooseFolder, chooseFile } = useStore();
  const [confirmed, setConfirmed] = useState(false);
  const [journalId, setJournalId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceAction, setServiceAction] = useState('restart');
  const [startupValue, setStartupValue] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setConfirmed(false); setBusy(false); }, [tool.id]);

  const needsConfirm = requiresConfirmation(tool);
  const available = canRunTool(tool);
  const activeForTool = event && event.toolId === tool.id && isActivePhase(event.phase) ? event : null;
  const progress = progressOf(activeForTool, result && result.toolId === tool.id ? result : null);
  const showUndo = undoAllowed(tool, result && result.toolId === tool.id ? result : null);
  const showCancel = cancelAllowed(tool, activeForTool);
  const elapsed = activeForTool ? formatDurationMs(Date.now() - new Date(activeForTool.startedAt).getTime(), locale) : null;

  const extra: Record<string, unknown> = {};
  if (folder && ['large-files', 'duplicate-files', 'empty-folders', 'organize-downloads-preview', 'organize-downloads-apply'].includes(tool.id)) extra.folder = folder;
  if (file && tool.id === 'file-hash') extra.filePath = file;
  if (tool.requiresAdmin || tool.riskLevel !== 'read-only') extra.__admin = true;

  const execute = async () => {
    if (!available || busy || activeForTool) return;
    if (needsConfirm && !confirmed) return;
    setBusy(true);
    try {
      await run(tool, inputsFor(tool.id, extra, confirmed, { journalId, serviceName, serviceAction, startupValue, dryRun }));
    } finally {
      setBusy(false);
    }
  };

  const undoToolId = tool.id === 'organize-downloads-apply' ? 'organize-downloads-undo'
    : tool.id === 'temp-cleanup-apply' ? 'temp-cleanup-undo' : null;

  return (
    <div className="runner-body">
      <ToolDetail tool={tool} />
      <ToolWarnings tool={tool} />

      {!available && (
        <p className="notice" role="alert">{t('tools.unavailableReason')}: {tool.availability.reason || t('tools.unavailable')}</p>
      )}
      {tool.requiresAdmin && (
        <p className="admin-note"><ShieldAlert size={14} /> {t('tools.adminRequired')}. {t('tools.elevationNote')}</p>
      )}

      {['large-files', 'duplicate-files', 'empty-folders', 'organize-downloads-preview', 'organize-downloads-apply'].includes(tool.id) && (
        <div className="input-group">
          <label>{t('common.folder')}</label>
          <div><input value={folder} readOnly placeholder={t('tools.defaultFolder')} aria-label={t('common.folder')} /><button className="secondary" onClick={chooseFolder}>{t('tools.chooseFolder')}</button></div>
        </div>
      )}
      {tool.id === 'file-hash' && (
        <div className="input-group">
          <label>{t('tools.hashFile')}</label>
          <div><input value={file} readOnly placeholder={t('tools.hashFile')} aria-label={t('tools.hashFile')} /><button className="secondary" onClick={chooseFile}>{t('tools.hashFile')}</button></div>
        </div>
      )}
      {tool.id === 'service-control' && (
        <div className="service-inputs">
          <label className="setting"><span>{t('services.name')}</span><input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder={t('services.name')} /></label>
          <label className="setting"><span>{t('services.action')}</span>
            <select value={serviceAction} onChange={e => setServiceAction(e.target.value)}>
              <option value="start">{t('services.action.start')}</option>
              <option value="stop">{t('services.action.stop')}</option>
              <option value="restart">{t('services.action.restart')}</option>
              <option value="manual">{t('services.action.manual')}</option>
              <option value="automatic">{t('services.action.automatic')}</option>
              <option value="disabled">{t('services.action.disabled')}</option>
            </select>
          </label>
        </div>
      )}
      {tool.id === 'startup-disable' && (
        <label className="setting"><span>{t('startup.valueName')}</span><input value={startupValue} onChange={e => setStartupValue(e.target.value)} placeholder={t('startup.valueName')} /></label>
      )}
      {['organize-downloads-undo', 'temp-cleanup-undo', 'service-startup-undo', 'startup-restore'].includes(tool.id) && (
        <label className="setting"><span>{t('tools.journal')}</span><input value={journalId} onChange={e => setJournalId(e.target.value)} placeholder={t('tools.journalHint')} dir="ltr" /></label>
      )}
      {tool.supportsDryRun && (
        <label className="confirmation dryrun"><input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} /><span>{t('tools.dryRun') ?? 'Dry run'}</span></label>
      )}

      {needsConfirm && (
        <label className="confirmation">
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
          <span>{t('tools.confirmRequired')}</span>
        </label>
      )}

      {activeForTool && (
        <div className="run-progress">
          <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t('tools.progress')}>
            <i style={{ width: `${progress}%` }} />
          </div>
          <p className="muted small">{activeForTool.message}{elapsed ? ` · ${elapsed}` : ''}</p>
        </div>
      )}

      <div className="runner-actions">
        <button className="primary run-button" disabled={!available || busy || !!activeForTool || (needsConfirm && !confirmed)} onClick={execute}>
          <Play size={16} /> {t('tools.run')}
        </button>
        {showCancel && <button className="secondary" onClick={cancel}><Ban size={16} />{t('operation.cancel')}</button>}
        {showUndo && undoToolId == null && <span className="pill ok"><RotateCcw size={11} /> {t('cap.undo')}</span>}
      </div>

      {result && result.toolId === tool.id && <ToolResultView result={result} />}
    </div>
  );
}
