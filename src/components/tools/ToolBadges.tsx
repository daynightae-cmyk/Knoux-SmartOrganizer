import { Ban, CircleOff, Hourglass, ShieldAlert, Undo2, Zap } from 'lucide-react';
import type { ToolDefinition } from '@shared/contracts';
import type { Translate } from '../../state/store';

export function RiskBadge({ tool, t }: { tool: ToolDefinition; t: Translate }) {
  const tone = tool.riskLevel === 'read-only' ? 'safe' : tool.requiresAdmin ? 'admin' : 'write';
  const label = tool.riskLevel === 'read-only' ? t('common.readOnly') : tool.requiresAdmin ? t('common.administrator') : t('common.safeWrite');
  return <span className={`pill risk-${tone}`}>{label}</span>;
}

export function AvailabilityBadge({ tool, t }: { tool: ToolDefinition; t: Translate }) {
  if (tool.availability.available) return <span className="pill ok">{t('common.availableBadge')}</span>;
  return (
    <span className="pill muted" title={tool.availability.reason || t('tools.unavailable')}>
      <CircleOff size={11} /> {t('common.unavailable')}
    </span>
  );
}

export function AdminBadge({ tool, t }: { tool: ToolDefinition; t: Translate }) {
  if (!tool.requiresAdmin) return null;
  return <span className="pill admin"><ShieldAlert size={11} /> {t('common.adminRequired')}</span>;
}

export function CapabilityBadges({ tool, t }: { tool: ToolDefinition; t: Translate }) {
  return (
    <span className="cap-list" aria-label={t('common.capabilities')}>
      {tool.supportsProgress && <span className="pill ghost"><Zap size={11} /> {t('cap.progress')}</span>}
      {tool.supportsCancel && <span className="pill ghost"><Ban size={11} /> {t('cap.cancel')}</span>}
      {tool.supportsUndo && <span className="pill ghost"><Undo2 size={11} /> {t('cap.undo')}</span>}
      {tool.supportsDryRun && <span className="pill ghost"><Hourglass size={11} /> {t('cap.dryRun')}</span>}
    </span>
  );
}

export function ToolStatusBadge({ available, adminRequired, t }: { available: boolean; adminRequired: boolean; t: Translate }) {
  if (!available) return <span className="pill muted">{t('common.unavailable')}</span>;
  if (adminRequired) return <span className="pill admin">{t('common.adminRequired')}</span>;
  return <span className="pill ok">{t('common.availableBadge')}</span>;
}
