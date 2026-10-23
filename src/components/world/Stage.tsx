import type { ReactNode } from 'react';
import { CircleDashed, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { worlds, type WorldId } from '../../lib/service-catalog';
import { pick } from '../../lib/service-preview';
import { worldBriefs } from '../../lib/world-briefs';
import { useStore } from '../../state/store';
import type { CSSProperties } from 'react';

/**
 * Building blocks shared by the specialist worlds.
 *
 * Every world composes its own function out of these parts, so the product
 * reads as one application while Cleanup, Boot Control, Live Pulse, Recovery
 * Lab, Service Commander, Network Radar and Device Atlas each look like the
 * thing they do. Nothing here invents a number: a panel with no reading shows
 * an empty state that says so.
 */

export function Stage({ world, children }: { world: WorldId; children: ReactNode }) {
  const { t, locale } = useStore();
  const def = worlds.find(item => item.id === world) ?? worlds[0];
  const brief = worldBriefs[world];
  return (
    <div className="stage" data-world={world} style={{ '--world-hue': def.accent.hue } as CSSProperties}>
      <span className="stage__horizon" aria-hidden="true" />
      {children}
      {brief && (
        <section className="stage__panel" aria-label={t('world.page.brief')}>
          <div className="stage__panel-head">
            <h3>{t('world.page.brief')}</h3>
          </div>
          <div className="stage__kv">
            {brief.facts.map((fact, index) => (
              <div key={index}><dt style={{ maxWidth: 'none', whiteSpace: 'normal', textAlign: 'start' }}>{pick(fact, locale)}</dt></div>
            ))}
          </div>
          <p className="stage__note stage__note--good"><ShieldCheck size={15} aria-hidden="true" /><span>{pick(brief.boundary, locale)}</span></p>
        </section>
      )}
    </div>
  );
}

export function StageHead({ icon: Icon, title, lead, readout }: { icon: LucideIcon; title: string; lead: string; readout?: ReactNode }) {
  return (
    <section className="stage__head">
      <div className="stage__head-row">
        <div className="stage__identity">
          <span className="stage__glyph" aria-hidden="true"><Icon size={23} /></span>
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            <p className="stage__lead">{lead}</p>
          </div>
        </div>
        {readout && <div className="stage__readout">{readout}</div>}
      </div>
    </section>
  );
}

export interface Stat {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: 'good' | 'warn' | 'danger';
}

export function StageStats({ items }: { items: Stat[] }) {
  return (
    <div className="stage__stats">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={index} className={`stage__stat${item.tone ? ` stage__stat--${item.tone}` : ''}`}>
            {Icon && <Icon size={19} aria-hidden="true" />}
            <div style={{ minWidth: 0 }}>
              <b>{item.value}</b>
              <span>{item.label}</span>
              {item.detail && <small>{item.detail}</small>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StagePanel({ title, hint, actions, children }: { title: string; hint?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="stage__panel">
      <div className="stage__panel-head">
        <div>
          <h3>{title}</h3>
          {hint && <p>{hint}</p>}
        </div>
        {actions && <div className="stage__panel-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function StageSplit({ main, rail }: { main: ReactNode; rail: ReactNode }) {
  return (
    <div className="stage__split">
      {main}
      <div className="stage__stack">{rail}</div>
    </div>
  );
}

export function StageFlow({ steps }: { steps: string[] }) {
  return (
    <div className="stage__flow">
      {steps.map((step, index) => (
        <div className="stage__step" key={index}>
          <b aria-hidden="true">{index + 1}</b>
          <span style={{ minWidth: 0 }}>
            <span>{step}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function StageEmpty({ title, note, icon: Icon }: { title: string; note: string; icon?: LucideIcon }) {
  const Glyph = Icon ?? CircleDashed;
  return (
    <div className="stage__empty" role="status">
      <Glyph size={22} aria-hidden="true" />
      <strong>{title}</strong>
      <p>{note}</p>
    </div>
  );
}

export function StageKv({ rows }: { rows: Array<{ k: string; v: ReactNode; ltr?: boolean }> }) {
  return (
    <dl className="stage__kv">
      {rows.map((row, index) => (
        <div key={index}>
          <dt>{row.k}</dt>
          <dd dir={row.ltr ? 'ltr' : undefined}>{row.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StageNote({ tone = 'plain', icon: Icon, children }: { tone?: 'plain' | 'good' | 'warn'; icon?: LucideIcon; children: ReactNode }) {
  const Glyph = Icon;
  return (
    <p className={`stage__note${tone !== 'plain' ? ` stage__note--${tone}` : ''}`}>
      {Glyph && <Glyph size={15} aria-hidden="true" />}
      <span>{children}</span>
    </p>
  );
}

export function StageChips({ items }: { items: Array<{ label: string; tone?: 'live' | 'warn' }> }) {
  return (
    <div className="stage__chips">
      {items.map((item, index) => (
        <span key={index} className={`stage__chip${item.tone ? ` stage__chip--${item.tone}` : ''}`}>{item.label}</span>
      ))}
    </div>
  );
}
