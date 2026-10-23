import { Globe2, Radio, Router, ShieldCheck } from 'lucide-react';
import { useStore } from '../state/store';
import { Stage, StageHead, StageStats, StageSplit, StagePanel, StageFlow, StageEmpty } from '../components/world/Stage';
import { EngineConsole, WorldLedger } from '../components/world/EngineConsole';
import { formatCount } from '../lib/format';

/**
 * Network — Network Radar.
 *
 * One engine, read-only, and it reads what Windows itself reports about the
 * interfaces on this machine. There is no ping, no traceroute and no drawn
 * topology, because none of those exist here — the panels that would hold them
 * say so instead of showing a plausible picture.
 */
export default function NetworkPage() {
  const { t, locale, result } = useStore();
  const read = result && result.toolId === 'network-diagnostics' ? result : null;
  const interfaces = read ? read.items.length : null;

  return (
    <Stage world="network">
      <StageHead
        icon={Radio}
        title={t('stage.network.name')}
        lead={t('stage.network.lead')}
        readout={<span className="stage__stamp">{read ? t('stage.measured') : t('stage.awaiting')}</span>}
      />

      <StageStats items={[
        { icon: Router, label: t('stage.network.stat1'), value: interfaces == null ? '—' : formatCount(interfaces, locale), detail: read ? t('stage.network.stat1d') : t('stage.awaiting') },
        { icon: Globe2, label: t('stage.network.stat2'), value: t('stage.network.stat2v'), detail: t('stage.network.stat2d') },
        { icon: ShieldCheck, label: t('stage.network.stat3'), value: t('stage.network.stat3v'), detail: t('stage.network.stat3d'), tone: 'good' },
        { icon: Radio, label: t('stage.network.stat4'), value: t('stage.network.stat4v'), detail: t('stage.network.stat4d') }
      ]} />

      <StageSplit
        main={<EngineConsole
          title={t('stage.network.console')}
          hint={t('stage.network.consoleHint')}
          engines={['network-diagnostics']}
          emptyTitle={t('stage.network.empty')}
          emptyNote={t('stage.network.emptyNote')}
        />}
        rail={<>
          <StagePanel title={t('stage.network.unsupported')} hint={t('stage.network.unsupportedHint')}>
            <StageEmpty title={t('stage.network.traceroute')} note={t('stage.network.tracerouteNote')} />
            <StageEmpty title={t('stage.network.throughput')} note={t('stage.network.throughputNote')} />
            <StageEmpty title={t('stage.network.topology')} note={t('stage.network.topologyNote')} />
          </StagePanel>
        </>}
      />

      <StagePanel title={t('stage.network.flow')} hint={t('stage.network.flowHint')}>
        <StageFlow steps={[t('stage.network.s1'), t('stage.network.s2'), t('stage.network.s3'), t('stage.network.s4')]} />
      </StagePanel>

      <WorldLedger world="network" t={t} locale={locale} />
    </Stage>
  );
}
