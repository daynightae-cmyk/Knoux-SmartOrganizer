import type { ToolDefinition } from '@shared/contracts';
import { toolIcon } from '../../lib/icons';
import type { Translate } from '../../state/store';
import { AdminBadge, AvailabilityBadge, RiskBadge } from './ToolBadges';

export function ToolCard({ tool, t, selected, onSelect }: {
  tool: ToolDefinition; t: Translate; selected: boolean; onSelect: (tool: ToolDefinition) => void;
}) {
  const Icon = toolIcon(tool.icon);
  return (
    <button
      disabled={!tool.availability.available}
      className={selected ? 'tool-card selected' : 'tool-card'}
      onClick={() => onSelect(tool)}
      aria-disabled={!tool.availability.available}
      title={!tool.availability.available ? (tool.availability.reason || t('tools.unavailable')) : t(tool.descriptionKey)}
    >
      <span className="tool-card-icon" aria-hidden="true"><Icon size={18} /></span>
      <span className="tool-card-body">
        <strong>{t(tool.nameKey)}</strong>
        <small>{t(tool.descriptionKey)}</small>
        <span className="tool-card-badges"><RiskBadge tool={tool} t={t} /><AdminBadge tool={tool} t={t} /><AvailabilityBadge tool={tool} t={t} /></span>
      </span>
    </button>
  );
}

export function ToolListItem({ tool, t, selected, onSelect }: {
  tool: ToolDefinition; t: Translate; selected: boolean; onSelect: (tool: ToolDefinition) => void;
}) {
  const Icon = toolIcon(tool.icon);
  return (
    <button
      disabled={!tool.availability.available}
      className={selected ? 'tool-row selected' : 'tool-row'}
      onClick={() => onSelect(tool)}
    >
      <Icon size={16} />
      <span className="tool-row-main"><strong>{t(tool.nameKey)}</strong><small>{tool.category}</small></span>
      <RiskBadge tool={tool} t={t} />
    </button>
  );
}
