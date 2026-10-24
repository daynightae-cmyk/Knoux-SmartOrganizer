import {
  Activity, ArrowRight, ArrowUpRight, CheckCircle2, ClipboardCopy, Cpu, FolderOpen,
  History, LockKeyhole, MemoryStick, ScanSearch, ShieldCheck, Timer, XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import { formatBytes, formatCount, formatDateTime } from '../lib/format';
import { countByState, worlds } from '../lib/service-catalog';
import { toolIcon } from '../lib/icons';
import { pageDef } from '../lib/pages';
import { useStore } from '../state/store';
import { SectionTitle } from '../components/common';

const sectionMotion = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: .34, ease: [0.22, 1, 0.36, 1] as const } } };
const cardMotion = { hidden: { opacity: 0, y: 10, scale: .985 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: .28, ease: [0.22, 1, 0.36, 1] as const } } };

export default function HomePage() {
  const { tools, health, history, settings, t, locale, runById, setPage, openTool } = useStore();
  const workspace = settings?.appearance.workspace ?? { showMetrics: true, showWorkspaces: true, showRecent: true, showQuickTools: true, cardDensity: 'comfortable' as const, soundEffects: true };

  const diskTotal = Number(health?.systemDriveTotalBytes);
  const diskFree = Number(health?.systemDriveFreeBytes);
  const diskUsed = Number.isFinite(diskTotal) && Number.isFinite(diskFree) && diskTotal > 0 ? diskTotal - diskFree : null;
  const diskPercent = diskUsed != null ? Math.round((diskUsed / diskTotal) * 100) : null;
  const memPercent = typeof health?.memoryUsedPercent === 'number' ? health.memoryUsedPercent as number : null;
  const lastScan = history.find(record => record.toolId === 'smart-scan' || record.action === 'smart-scan') ?? null;
  const recent = history.slice(0, 5);

  const startScan = () => { void runById('smart-scan'); };

  return (
    <div className={`home-workspace workspace-density-${workspace.cardDensity}`}>
      <motion.section
        className={`hero hero--aurora${workspace.showMetrics ? '' : ' hero--solo'}`}
        aria-label={t('home.today')}
        variants={sectionMotion}
        initial="hidden"
        animate="show"
      >
        <div className="hero__scene" aria-hidden="true">
          <span className="hero__stars" />
          <span className="hero__horizon" />
          <span className="hero__flare" />
        </div>
        <div className="hero__copy">
          <div className="hero__meta">
            <span className="local-badge"><LockKeyhole size={13} />{t('common.local')}</span>
            <span className="hero__chip">{t('home.commandDeck')}</span>
          </div>
          <h2>{t('home.today')}</h2>
          <p className="hero__lead">{t('home.subtitle')}</p>
          <div className="hero-actions">
            <button className="primary hero__primary" onClick={() => setPage('studio')}><FolderOpen size={18} />{t('studio.title')}<ArrowRight size={15} /></button>
            <button className="secondary" onClick={startScan}><ScanSearch size={18} />{t('home.scan')}</button>
            <button className="secondary" onClick={() => setPage('clipboard')}><ClipboardCopy size={16} />{t('nav.clipboard')}</button>
            <button className="secondary" onClick={() => setPage('history')}><History size={16} />{t('home.recent')}</button>
          </div>
          <p className="hero__last">
            <span className="hero__pulse" aria-hidden="true" />
            {lastScan ? `${t('smartScan.lastRun')}: ${formatDateTime(lastScan.finishedAt, locale)}` : t('smartScan.neverRun')}
          </p>
        </div>
        {workspace.showMetrics && <div className="hero__instrument" data-health={diskPercent == null ? 'loading' : 'ready'}>
          <div className="instrument-head">
            <span><Activity size={14} aria-hidden="true" />{t('home.systemPulse')}</span>
            <small>{t('stage.measured')}</small>
          </div>
          <div className="instrument-core">
            <div className="instrument-ring" style={{ '--score': `${diskPercent ?? 0}%` } as CSSProperties}>
              <span className="instrument-ring__inner">
                <strong>{diskPercent == null ? '—' : `${diskPercent}%`}</strong>
                <small>{t('home.storage')}</small>
              </span>
            </div>
            <div className="instrument-lines">
              <div className="instrument-line">
                <MemoryStick size={15} aria-hidden="true" />
                <span>{t('home.memory')}</span>
                <b>{memPercent == null ? '—' : `${memPercent}%`}</b>
                <small>{health ? `${t('home.freeSpace')}: ${formatBytes(health.memoryFreeBytes, locale)}` : t('common.loading')}</small>
              </div>
              <div className="instrument-line">
                <Timer size={15} aria-hidden="true" />
                <span>{t('home.uptime')}</span>
                <b>{typeof health?.uptimeSeconds === 'number' ? uptime(health.uptimeSeconds as number, locale) : '—'}</b>
                <small>{t('home.ready')}</small>
              </div>
            </div>
          </div>
          <div className="instrument-foot">
            <Cpu size={15} aria-hidden="true" />
            <span title={String(health?.cpuModel || '')}>{String(health?.cpuModel || t('common.loading'))}</span>
            <b>{health?.cpuCores != null ? formatCount(health.cpuCores as number, locale) : '—'}</b>
          </div>
        </div>}
      </motion.section>

      <motion.section className="studio-gateway" variants={sectionMotion} initial="hidden" animate="show" aria-labelledby="home-studio-title">
        <span className="studio-gateway__aura" aria-hidden="true" />
        <div className="studio-gateway__visual" aria-hidden="true">
          <span className="studio-gateway__orbit studio-gateway__orbit--a" />
          <span className="studio-gateway__orbit studio-gateway__orbit--b" />
          <span className="studio-gateway__core"><FolderOpen size={25} /></span>
          <span className="studio-gateway__node studio-gateway__node--one" />
          <span className="studio-gateway__node studio-gateway__node--two" />
          <span className="studio-gateway__node studio-gateway__node--three" />
        </div>
        <div className="studio-gateway__copy">
          <span className="eyebrow">{t('home.flagship')}</span>
          <h2 id="home-studio-title">{t('studio.title')}</h2>
          <p>{t('home.studioBody')}</p>
          <span className="studio-gateway__facts"><ShieldCheck size={13} aria-hidden="true" />{t('home.studioFacts')}</span>
        </div>
        <button className="primary studio-gateway__cta" onClick={() => setPage('studio')}>
          {t('home.studioCta')}<ArrowRight size={16} />
        </button>
      </motion.section>

      {workspace.showWorkspaces && <motion.section className="section world-portal" variants={sectionMotion} initial="hidden" animate="show">
        <SectionTitle
          title={t('home.worlds')}
          subtitle={t('home.worldsHint')}
          action={<button className="text-button" onClick={() => setPage('scan')}>{t('home.viewAll')}<ArrowRight size={13} /></button>}
        />
        <div className="portal-grid">
          {worlds.map((world, index) => {
            const counts = countByState(world.id);
            const target = pageDef(world.id);
            const Icon = target?.icon;
            return (
              <motion.button
                key={world.id}
                className="portal-tile"
                style={{ '--world-hue': world.accent.hue } as CSSProperties}
                variants={cardMotion}
                onClick={() => setPage(world.id)}
                aria-label={`${t('home.openWorld')}: ${t(world.labelKey)}`}
              >
                <span className="portal-tile__wash" aria-hidden="true" />
                <span className="portal-tile__head">
                  <span className="portal-tile__icon" aria-hidden="true">{Icon && <Icon size={18} />}</span>
                  <span className="portal-tile__title">
                    <strong>{t(world.labelKey)}</strong>
                    <small>{String(index + 1).padStart(2, '0')}</small>
                  </span>
                  <span className="portal-tile__arrow" aria-hidden="true"><ArrowUpRight size={15} /></span>
                </span>
                <small className="portal-tile__tagline">{t(world.taglineKey)}</small>
                <span className="portal-tile__meter" aria-hidden="true">
                  <i className="live" style={{ flexGrow: counts.operational }} />
                  <i className="partial" style={{ flexGrow: counts.partial }} />
                  <i style={{ flexGrow: counts.planned }} />
                </span>
                <span className="portal-tile__counts">
                  <span><i className="live" aria-hidden="true" />{formatCount(counts.operational, locale)}</span>
                  <span><i className="partial" aria-hidden="true" />{formatCount(counts.partial, locale)}</span>
                  <span><i aria-hidden="true" />{formatCount(counts.planned, locale)}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
        <p className="portal-legend">
          <i className="live" aria-hidden="true" />{t('world.page.live')}
          <i className="partial" aria-hidden="true" />{t('world.page.partial')}
          <i aria-hidden="true" />{t('world.page.planned')}
        </p>
      </motion.section>}

      {(workspace.showRecent || workspace.showQuickTools) && <div className="home-lower">
        {workspace.showRecent && <motion.section className="section home-activity" variants={sectionMotion} initial="hidden" animate="show">
          <SectionTitle title={t('home.recent')} action={<button className="text-button" onClick={() => setPage('history')}>{t('home.viewAll')}<ArrowRight size={13} /></button>} />
          {recent.length === 0 ? (
            <div className="home-empty">
              <span><Activity size={19} /></span>
              <p>{t('home.noRecentOps')}</p>
            </div>
          ) : (
            <div className="activity-rail">
              {recent.map(record => {
                const tool = tools.find(item => item.id === record.toolId);
                return (
                  <motion.article key={record.operationId} className="activity-item" variants={cardMotion}>
                    <span className={`activity-orb${record.success ? ' is-success' : ' is-error'}`} aria-hidden="true">
                      {record.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                    </span>
                    <div className="activity-copy">
                      <strong>{tool ? t(tool.nameKey) : record.toolId}</strong>
                      <small>{formatDateTime(record.finishedAt, locale)}</small>
                    </div>
                    <span className="activity-state">{record.success ? t('history.success') : t('history.error')}</span>
                    <span className="activity-count" dir="ltr">{formatCount(record.items.length, locale)}</span>
                  </motion.article>
                );
              })}
            </div>
          )}
        </motion.section>}

        {workspace.showQuickTools && <motion.section className="section home-quick" variants={sectionMotion} initial="hidden" animate="show">
          <SectionTitle title={t('tools.title')} subtitle={t('home.offline')} />
          <div className="quick-list">
            {tools.slice(0, 6).map(tool => {
              const Icon = toolIcon(tool.icon);
              return (
                <motion.button key={tool.id} className="quick-row" variants={cardMotion} disabled={!tool.availability.available} onClick={() => openTool(tool)}>
                  <span className="quick-row__icon" aria-hidden="true"><Icon size={17} /></span>
                  <span className="quick-row__copy"><strong>{t(tool.nameKey)}</strong><small>{t(tool.descriptionKey)}</small></span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </motion.button>
              );
            })}
          </div>
          <p className="quick-note"><Activity size={12} aria-hidden="true" /> {formatCount(tools.length, locale)} {t('home.entries')}</p>
        </motion.section>}
      </div>}
    </div>
  );
}

function uptime(seconds: number, locale: 'ar' | 'en'): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en').format(h)}:${String(m).padStart(2, '0')}`;
}
