import { CircleDashed, ListChecks, Power, Rocket, RotateCcw } from 'lucide-react';
import { useStore } from '../state/store';
import { Stage, StageHead, StageStats, StageSplit, StagePanel, StageFlow, StageNote } from '../components/world/Stage';
import { EngineConsole, WorldLedger, summaryNumber } from '../components/world/EngineConsole';
import { formatCount } from '../lib/format';

/**
 * Startup — Boot Control.
 *
 * The register is read from the current user Run key, which is exactly the
 * scope the engine can also write, and the page says so. The sequence strip is
 * how Windows brings a session up; it is documentation of the order, not a
 * measurement, so it carries no numbers of its own.
 */
export default function StartupPage() {
  const { t, locale, result } = useStore();
  const read = result && result.toolId === 'startup-items' ? result : null;
  const entries = read ? read.items.length : null;
  const managed = summaryNumber(read, 'managedSources');
  const sources = Array.isArray(read?.summary.sources) ? (read.summary.sources as unknown[]).length : null;

  return (
    <Stage world="startup">
      <StageHead
        icon={Rocket}
        title={t('stage.startup.name')}
        lead={t('stage.startup.lead')}
        readout={<span className="stage__stamp">{read ? t('stage.measured') : t('stage.awaiting')}</span>}
      />

      <StageStats items={[
        { icon: ListChecks, label: t('stage.startup.stat1'), value: entries == null ? '—' : formatCount(entries, locale), detail: read ? t('stage.startup.stat1d') : t('stage.awaiting') },
        { icon: Power, label: t('stage.startup.stat2'), value: managed == null ? '—' : formatCount(managed, locale), detail: t('stage.startup.stat2d') },
        { icon: RotateCcw, label: t('stage.startup.stat3'), value: t('stage.startup.stat3v'), detail: t('stage.startup.stat3d'), tone: 'good' },
        { icon: CircleDashed, label: t('stage.startup.stat4'), value: t('stage.startup.stat4v'), detail: t('stage.startup.stat4d') }
      ]} />

      <StageSplit
        main={<EngineConsole
          title={t('stage.startup.console')}
          hint={t('stage.startup.consoleHint')}
          engines={['startup-items', 'startup-disable', 'startup-restore']}
          emptyTitle={t('stage.startup.empty')}
          emptyNote={t('stage.startup.emptyNote')}
        />}
        rail={<>
          <StagePanel title={t('stage.startup.scope')} hint={t('stage.startup.scopeHint')}>
            <StageNote tone="good" icon={CircleDashed}>{t('stage.startup.scopeNote')}</StageNote>
            {sources != null && <StageNote icon={CircleDashed}>{t('stage.startup.sourceCount')}: {formatCount(sources, locale)}</StageNote>}
          </StagePanel>
          <StagePanel title={t('stage.startup.impact')}>
            <StageNote icon={CircleDashed}>{t('stage.startup.impactNote')}</StageNote>
          </StagePanel>
        </>}
      />

      <StagePanel title={t('stage.startup.flow')} hint={t('stage.startup.flowHint')}>
        <StageFlow steps={[
          t('stage.startup.s1'), t('stage.startup.s2'), t('stage.startup.s3'),
          t('stage.startup.s4'), t('stage.startup.s5'), t('stage.startup.s6')
        ]} />
      </StagePanel>

      <WorldLedger world="startup" t={t} locale={locale} />
    </Stage>
  );
}
