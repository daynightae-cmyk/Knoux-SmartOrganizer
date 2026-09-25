import { Activity, Cpu, HardDrive, History, LockKeyhole, MemoryStick, ScanSearch, Timer } from 'lucide-react';
import { formatBytes, formatCount, formatDateTime } from '../lib/format';
import { filterToolsByPage } from '../lib/guards';
import { toolIcon } from '../lib/icons';
import { pageGroups } from '../lib/pages';
import { useStore } from '../state/store';
import { SectionTitle, StatCard } from '../components/common';

export default function HomePage() {
  const { tools, health, history, t, locale, runById, setPage, openTool } = useStore();

  const diskTotal = Number(health?.systemDriveTotalBytes);
  const diskFree = Number(health?.systemDriveFreeBytes);
  const diskUsed = Number.isFinite(diskTotal) && Number.isFinite(diskFree) && diskTotal > 0 ? diskTotal - diskFree : null;
  const diskPercent = diskUsed != null ? Math.round((diskUsed / diskTotal) * 100) : null;
  const memPercent = typeof health?.memoryUsedPercent === 'number' ? health.memoryUsedPercent as number : null;
  const lastScan = history.find(record => record.toolId === 'smart-scan' || record.action === 'smart-scan') ?? null;
  const recent = history.slice(0, 5);

  const startScan = () => { void runById('smart-scan'); };

  return (
    <>
      <section className="hero" aria-label={t('home.today')}>
        <div>
          <span className="local-badge"><LockKeyhole size={14} />{t('common.local')}</span>
          <h2>{t('home.today')}</h2>
          <p>{t('home.subtitle')}</p>
          <div className="hero-actions">
            <button className="primary" onClick={startScan}><ScanSearch size={18} />{t('home.scan')}</button>
            <button className="secondary" onClick={() => setPage('history')}><History size={16} />{t('home.recent')}</button>
          </div>
          <p className="muted small">
            {lastScan ? `${t('smartScan.lastRun')}: ${formatDateTime(lastScan.finishedAt, locale)}` : t('smartScan.neverRun')}
          </p>
        </div>
        <div className="hero-side">
          <StatCard label={t('home.memory')} value={memPercent == null ? '—' : `${memPercent}%`} detail={health ? `${t('home.freeSpace')}: ${formatBytes(health.memoryFreeBytes, locale)}` : t('common.loading')} icon={<MemoryStick size={18} />} />
          <StatCard label={t('home.storage')} value={diskFree != null && Number.isFinite(diskFree) ? formatBytes(diskFree, locale) : '—'} detail={diskPercent == null ? t('common.loading') : `${t('common.used')} ${diskPercent}%`} icon={<HardDrive size={18} />} />
          <StatCard label={t('home.uptime')} value={typeof health?.uptimeSeconds === 'number' ? uptime(health.uptimeSeconds as number, locale) : '—'} detail={t('home.ready')} icon={<Timer size={18} />} />
          <StatCard label={t('home.cpu')} value={health?.cpuCores != null ? String(health.cpuCores) : '—'} detail={String(health?.cpuModel || t('common.loading')).slice(0, 42)} icon={<Cpu size={18} />} />
        </div>
      </section>

      <section className="section">
        <SectionTitle title={t('home.workspaces')} subtitle={t('home.offline')} action={<button className="text-button" onClick={() => setPage('scan')}>{t('home.viewAll')}</button>} />
        <div className="workspace-grid">
          {pageGroups.filter(g => g.id !== 'system').flatMap(g => g.pages).filter(p => p.id !== 'home').slice(0, 8).map(item => {
            const count = filterToolsByPage(tools, item.id).length;
            return (
              <button key={item.id} className="workspace-card" onClick={() => setPage(item.id)}>
                <span className="workspace-icon" aria-hidden="true"><item.icon size={18} /></span>
                <strong>{t(item.nameKey)}</strong>
                <small>{formatCount(count, locale)} {t('home.entries')}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section">
        <SectionTitle title={t('home.recent')} action={<button className="text-button" onClick={() => setPage('history')}>{t('home.viewAll')}</button>} />
        {recent.length === 0 ? (
          <p className="muted">{t('home.noRecentOps')}</p>
        ) : (
          <div className="history-list compact">
            {recent.map(record => (
              <article key={record.operationId} className="history-card">
                <div>
                  <span className={record.success ? 'status success' : 'status error'}>{record.success ? t('history.success') : t('history.error')}</span>
                  <strong dir="ltr">{record.toolId}</strong>
                  <small>{formatDateTime(record.finishedAt, locale)}</small>
                </div>
                <span className="muted small" dir="ltr">{formatCount(record.items.length, locale)}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <SectionTitle title={t('tools.title')} subtitle={t('home.offline')} />
        <div className="quick-grid">
          {tools.slice(0, 6).map(tool => {
            const Icon = toolIcon(tool.icon);
            return (
              <button key={tool.id} className="quick-card" disabled={!tool.availability.available} onClick={() => openTool(tool)}>
                <Icon size={18} />
                <span><strong>{t(tool.nameKey)}</strong><small>{t(tool.descriptionKey)}</small></span>
              </button>
            );
          })}
        </div>
        <p className="muted small"><Activity size={12} /> {formatCount(tools.length, locale)} {t('home.entries')}</p>
      </section>
    </>
  );
}

function uptime(seconds: number, locale: 'ar' | 'en'): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en').format(h)}:${String(m).padStart(2, '0')}`;
}
