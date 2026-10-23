import { useMemo, type CSSProperties } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import CatalogPage from './CatalogPage';
import { ServicesRail } from '../components/world/ServicesRail';
import { countByState, worlds, type WorldId } from '../lib/service-catalog';
import { pick } from '../lib/service-preview';
import { worldBriefs } from '../lib/world-briefs';
import { useStore } from '../state/store';

/**
 * A world landing for the categories that have no specialist page yet.
 *
 * It states the world's identity, how much of its ledger actually responds on
 * this machine, then shows the same twelve premium cards every other world
 * carries. Below them sits the real workspace — the registered engines and
 * their runner — so nothing here is a mock-up of functionality that lives
 * elsewhere.
 */
export default function WorldPage({ page }: { page: WorldId }) {
  const { t, locale } = useStore();
  const world = useMemo(() => worlds.find(item => item.id === page) ?? worlds[0], [page]);
  const counts = useMemo(() => countByState(page), [page]);
  const total = counts.operational + counts.partial + counts.planned;
  const share = total ? Math.round((counts.operational / total) * 100) : 0;
  const brief = worldBriefs[page];

  return (
    <div className="world-page" style={{ '--world-hue': world.accent.hue } as CSSProperties}>
      <header className="world-page__hero">
        <div className="world-page__intro">
          <p className="eyebrow">{t('world.page.eyebrow')}</p>
          <h2>{t(world.labelKey)}</h2>
          <p>{t(world.taglineKey)}</p>
        </div>
        <div className="world-page__meter" aria-hidden="true">
          <span className="world-page__meter-track"><i style={{ width: `${share}%` }} /></span>
          <small>{t('world.page.meter')}</small>
        </div>
        <dl className="world-page__counts">
          <div><dt>{t('world.page.live')}</dt><dd>{counts.operational}</dd></div>
          <div><dt>{t('world.page.partial')}</dt><dd>{counts.partial}</dd></div>
          <div><dt>{t('world.page.planned')}</dt><dd>{counts.planned}</dd></div>
        </dl>
      </header>

      {brief && (
        <section className="world-page__brief" aria-label={t('world.page.brief')}>
          <ul>
            {brief.facts.map((fact, index) => (
              <li key={index}><Check size={14} aria-hidden="true" /><span>{pick(fact, locale)}</span></li>
            ))}
          </ul>
          <p className="world-page__boundary"><ShieldCheck size={15} aria-hidden="true" /><span>{pick(brief.boundary, locale)}</span></p>
        </section>
      )}

      <ServicesRail
        world={page}
        titleKey="svc.services.title"
        hintKey="svc.services.hint"
        liveKey="world.page.liveOf"
        t={t}
        locale={locale}
      />

      <section className="world-page__workspace" aria-label={t('world.page.workspace')}>
        <div className="world-page__workspace-head">
          <h3>{t('world.page.workspace')}</h3>
          <p><ShieldCheck size={14} /> {t('world.page.workspaceHint')}</p>
        </div>
        <CatalogPage page={page} />
      </section>
    </div>
  );
}
