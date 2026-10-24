import type { CSSProperties } from 'react';
import {
  Activity, CalendarClock, ClipboardCheck, Eye, FileText, Layers, LayoutGrid, Map, Search, Sparkles, Terminal
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { stateLabelKey, type ServiceDefinition, type WorkspaceKind } from '../../lib/service-catalog';
import { pick, riskLabels, workspaceLabels, type PreviewText } from '../../lib/service-preview';
import type { Locale } from '../../locales';

/**
 * One premium card per service, all 132 of them.
 *
 * The card is always interactive: a missing backend makes *execution*
 * unavailable, never the card itself. Opening it shows the design preview, the
 * intended steps and the exact limit, so a planned service is discoverable
 * instead of being a dead row.
 */

const workspaceIcons: Record<WorkspaceKind, LucideIcon> = {
  inventory: LayoutGrid,
  search: Search,
  map: Map,
  review: ClipboardCheck,
  monitor: Activity,
  wizard: Sparkles,
  console: Terminal,
  atlas: Layers,
  scheduler: CalendarClock,
  inspector: Eye,
  report: FileText,
  matrix: LayoutGrid
};

interface ServiceCardProps {
  service: ServiceDefinition;
  preview: PreviewText | null;
  locale: Locale;
  t: (key: string) => string;
  /** World accent, already resolved from the world definition. */
  hue: string;
  onOpen: (focus: 'preview' | 'details') => void;
  /** Present only when this world has a real handler for the service. */
  onRun?: () => void;
}

export function ServiceCard({ service, preview, locale, t, hue, onOpen, onRun }: ServiceCardProps) {
  const Icon = workspaceIcons[service.workspace];
  const workspace = workspaceLabels[service.workspace];
  const risk = preview ? riskLabels[preview.risk] : null;
  const pips = service.state === 'operational' ? 3 : service.state === 'partial' ? 2 : 1;

  return (
    <article
      className={`svc-card svc-card--${service.state}`}
      style={{ '--svc-hue': hue } as CSSProperties}
      data-service={service.id}
    >
      <button
        type="button"
        className="svc-card__hit"
        onClick={() => onOpen('preview')}
        aria-label={`${t(service.nameKey)} — ${t('svc.card.preview')}`}
      />
      <header className="svc-card__head">
        <span className="svc-card__icon" aria-hidden="true"><Icon size={18} /></span>
        <span className="svc-card__title">
          <strong>{t(service.nameKey)}</strong>
          <small>{pick(workspace, locale)}</small>
        </span>
        <span className={`svc-card__state svc-card__state--${service.state}`}>{t(stateLabelKey(service.state))}</span>
      </header>

      <p className="svc-card__summary">{t(service.summaryKey)}</p>

      <div className="svc-card__meta">
        <span className="svc-card__pips" aria-hidden="true">
          {[0, 1, 2].map(index => <i key={index} className={index < pips ? 'on' : ''} />)}
        </span>
        {risk && <span className="svc-card__risk">{pick(risk, locale)}</span>}
      </div>

      <footer className="svc-card__actions">
        <button type="button" className="knx-btn knx-btn--primary svc-card__primary" onClick={() => onOpen('preview')}>
          {t('svc.card.preview')}
        </button>
        <button type="button" className="knx-btn knx-btn--ghost svc-card__ghost" onClick={() => onOpen('details')}>
          {t('svc.card.details')}
        </button>
        {onRun && (
          <button type="button" className="knx-btn knx-btn--secondary svc-card__run" onClick={onRun}>
            {t('svc.card.open')}
          </button>
        )}
      </footer>
    </article>
  );
}
