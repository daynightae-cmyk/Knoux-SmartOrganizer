import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { countByState, servicesForWorld, worlds, type WorldId } from '../../lib/service-catalog';
import { previewFor } from '../../lib/service-preview';
import { fill, formatCount } from '../../lib/format';
import { useStore } from '../../state/store';
import type { Locale } from '../../locales';
import { ServiceCard } from './ServiceCard';
import { ServicePreview } from './ServicePreview';

/**
 * The service ledger every world carries.
 *
 * Each of the eleven worlds carries all twelve of its services here. The cards
 * are the same in every world and are always interactive: the catalogue state
 * decides whether the primary action *runs* or merely opens the design, never
 * whether the card exists. That is the difference between a promise ledger and
 * a wall of dead controls.
 */
interface ServicesRailProps {
  world: WorldId;
  titleKey: string;
  hintKey: string;
  /** Copy of the form "{live} of {total} services respond today". */
  liveKey: string;
  /** Tooltip for a row that really runs something. */
  openKey?: string;
  /** Service ids this world can invoke from the rail, mapped to their handler. */
  invoke?: Record<string, (() => void) | undefined>;
  t: (key: string) => string;
  locale: Locale;
}

export function ServicesRail({ world, titleKey, hintKey, liveKey, invoke = {}, t, locale }: ServicesRailProps) {
  const { tools, openTool } = useStore();
  const [open, setOpen] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focus, setFocus] = useState<'preview' | 'details'>('preview');
  const services = useMemo(() => servicesForWorld(world), [world]);
  const counts = useMemo(() => countByState(world), [world]);
  const worldDef = useMemo(() => worlds.find(item => item.id === world) ?? worlds[0], [world]);
  const live = counts.operational + counts.partial;

  const active = activeId ? services.find(service => service.id === activeId) ?? null : null;
  const activeTool = active?.engine ? tools.find(tool => tool.id === active.engine) ?? null : null;

  const runService = (service: (typeof services)[number]) => {
    const handler = invoke[service.id];
    if (handler) {
      setActiveId(null);
      handler();
      return;
    }
    const tool = service.engine ? tools.find(item => item.id === service.engine) : null;
    if (tool) {
      setActiveId(null);
      openTool(tool);
    }
  };

  const canRun = (service: (typeof services)[number]) =>
    service.state !== 'planned' && (Boolean(invoke[service.id]) || Boolean(service.engine && tools.some(tool => tool.id === service.engine)));

  const runActive = () => { if (active) runService(active); };

  return (
    <section className="world-services">
      <button type="button" className="world-services__head" onClick={() => setOpen(value => !value)} aria-expanded={open}>
        <span>
          <h3>{t(titleKey)}</h3>
          <p>{t(hintKey)}</p>
        </span>
        <span className="world-services__state">
          <span className="world-services__dots" aria-hidden="true">
            {Array.from({ length: counts.operational }).map((_, index) => <i key={`o${index}`} className="live" />)}
            {Array.from({ length: counts.partial }).map((_, index) => <i key={`p${index}`} className="partial" />)}
            {Array.from({ length: counts.planned }).map((_, index) => <i key={`q${index}`} />)}
          </span>
          {fill(t(liveKey), { live: formatCount(live, locale), total: formatCount(services.length, locale) })}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && (
        <div className="world-services__grid">
          {services.map(service => {
            const preview = previewFor(service);
            return (
              <ServiceCard
                key={service.id}
                service={service}
                preview={preview}
                locale={locale}
                t={t}
                hue={worldDef.accent.hue}
                onOpen={kind => { setFocus(kind); setActiveId(service.id); }}
                onRun={canRun(service) ? () => runService(service) : undefined}
              />
            );
          })}
        </div>
      )}
      {active && (
        <ServicePreview
          service={active}
          preview={previewFor(active)}
          world={worldDef}
          tool={activeTool}
          locale={locale}
          t={t}
          focus={focus}
          onClose={() => setActiveId(null)}
          onRun={active.state === 'planned' ? undefined : runActive}
        />
      )}
    </section>
  );
}
