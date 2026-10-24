import { LockKeyhole, Server, ShieldCheck, Square, Play, Settings2 } from 'lucide-react';
import { useEffect } from 'react';
import { useStore } from '../state/store';
import { Stage, StageHead, StageStats, StageSplit, StagePanel, StageFlow, StageNote } from '../components/world/Stage';
import { EngineConsole, WorldLedger, summaryNumber } from '../components/world/EngineConsole';
import { formatCount } from '../lib/format';

/**
 * Windows Services — Service Commander.
 *
 * The register is read live, and the two numbers that matter most here are the
 * ones that keep a person out of trouble: how many services are protected, and
 * how many are running right now. Start, stop and rollback run through the
 * same approval path the runner already requires — the page adds no new power.
 */
export default function ServicesPage() {
  const { t, locale, result, runById, event } = useStore();
  const read = result && result.toolId.startsWith('service') ? result : null;
  const total = summaryNumber(read, 'services');
  const running = summaryNumber(read, 'running');
  const protectedCount = summaryNumber(read, 'protectedServices');
  const delayed = summaryNumber(read, 'delayedAutomatic');

  useEffect(() => {
    if (!read && event?.toolId !== 'services-inventory') void runById('services-inventory', { limit: 2000 }, true);
  // Inventory is read-only. Start/stop/configuration remain explicit, confirmed
  // actions in the existing runner. One read per mount, so the dependency list
  // stays deliberately empty.
  }, []);

  return (
    <Stage world="services" state={read ? 'ready' : event?.toolId === 'services-inventory' ? 'reading' : 'idle'}>
      <StageHead
        icon={Server}
        title={t('stage.services.name')}
        lead={t('stage.services.lead')}
        readout={<span className="stage__stamp">{read ? t('stage.measured') : t('stage.awaiting')}</span>}
      />

      <StageStats items={[
        { icon: Server, label: t('stage.services.stat1'), value: total == null ? '—' : formatCount(total, locale), detail: read ? String(read.summary.provider ?? '') : t('stage.awaiting') },
        { icon: Play, label: t('stage.services.stat2'), value: running == null ? '—' : formatCount(running, locale), detail: t('stage.services.stat2d'), tone: 'good', meter: total && running != null ? running / total * 100 : null },
        { icon: Square, label: t('stage.services.stat3'), value: total == null || running == null ? '—' : formatCount(total - running, locale), detail: t('stage.services.stat3d') },
        { icon: ShieldCheck, label: t('stage.services.stat4'), value: protectedCount == null ? '—' : formatCount(protectedCount, locale), detail: t('stage.services.stat4d'), tone: 'warn' }
      ]} />

      <StageSplit
        main={<EngineConsole
          title={t('stage.services.console')}
          hint={t('stage.services.consoleHint')}
          engines={['services-inventory', 'service-control', 'service-startup-undo']}
          emptyTitle={t('stage.services.empty')}
          emptyNote={t('stage.services.emptyNote')}
        />}
        rail={<>
          <StagePanel title={t('stage.services.protect')} hint={t('stage.services.protectHint')}>
            <StageNote tone="good" icon={LockKeyhole}>{t('stage.services.protectNote')}</StageNote>
            {delayed != null && <StageNote icon={Settings2}>{t('stage.services.delayed')}: {formatCount(delayed, locale)}</StageNote>}
          </StagePanel>
          <StagePanel title={t('stage.services.journal')}>
            <StageNote icon={ShieldCheck}>{t('stage.services.journalNote')}</StageNote>
          </StagePanel>
        </>}
      />

      <StagePanel title={t('stage.services.flow')} hint={t('stage.services.flowHint')}>
        <StageFlow steps={[
          t('stage.services.s1'), t('stage.services.s2'), t('stage.services.s3'),
          t('stage.services.s4'), t('stage.services.s5'), t('stage.services.s6')
        ]} />
      </StagePanel>

      <WorldLedger world="services" t={t} locale={locale} />
    </Stage>
  );
}
