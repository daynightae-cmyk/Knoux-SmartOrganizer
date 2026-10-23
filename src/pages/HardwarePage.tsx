import { Cpu, Database, Thermometer, Usb } from 'lucide-react';
import { useStore } from '../state/store';
import { Stage, StageHead, StageStats, StageSplit, StagePanel, StageFlow, StageEmpty } from '../components/world/Stage';
import { EngineConsole, WorldLedger } from '../components/world/EngineConsole';
import { formatCount } from '../lib/format';

/**
 * Hardware — Device Atlas.
 *
 * Two engines report this machine: the WMI inventory and the battery report.
 * Everything the firmware does not tell Windows — temperatures, SMART
 * attributes, wear levels — is drawn as an empty panel with the reason inside
 * it, which is the honest version of a gauge.
 */
export default function HardwarePage() {
  const { t, locale, result } = useStore();
  const read = result && ['hardware-inventory', 'battery-status'].includes(result.toolId) ? result : null;
  const components = read ? read.items.length : null;
  const providers = Array.isArray(read?.summary.providers) ? (read.summary.providers as unknown[]).length : null;

  return (
    <Stage world="hardware">
      <StageHead
        icon={Cpu}
        title={t('stage.hardware.name')}
        lead={t('stage.hardware.lead')}
        readout={<span className="stage__stamp">{read ? t('stage.measured') : t('stage.awaiting')}</span>}
      />

      <StageStats items={[
        { icon: Database, label: t('stage.hardware.stat1'), value: components == null ? '—' : formatCount(components, locale), detail: read ? t('stage.hardware.stat1d') : t('stage.awaiting') },
        { icon: Cpu, label: t('stage.hardware.stat2'), value: providers == null ? '—' : formatCount(providers, locale), detail: t('stage.hardware.stat2d') },
        { icon: Thermometer, label: t('stage.hardware.stat3'), value: t('stage.hardware.stat3v'), detail: t('stage.hardware.stat3d') },
        { icon: Usb, label: t('stage.hardware.stat4'), value: t('stage.hardware.stat4v'), detail: t('stage.hardware.stat4d') }
      ]} />

      <StageSplit
        main={<EngineConsole
          title={t('stage.hardware.console')}
          hint={t('stage.hardware.consoleHint')}
          engines={['hardware-inventory', 'battery-status']}
          emptyTitle={t('stage.hardware.empty')}
          emptyNote={t('stage.hardware.emptyNote')}
        />}
        rail={<>
          <StagePanel title={t('stage.hardware.unavailable')} hint={t('stage.hardware.unavailableHint')}>
            <StageEmpty title={t('stage.hardware.thermal')} note={t('stage.hardware.thermalNote')} />
            <StageEmpty title={t('stage.hardware.smart')} note={t('stage.hardware.smartNote')} />
          </StagePanel>
        </>}
      />

      <StagePanel title={t('stage.hardware.flow')} hint={t('stage.hardware.flowHint')}>
        <StageFlow steps={[t('stage.hardware.s1'), t('stage.hardware.s2'), t('stage.hardware.s3'), t('stage.hardware.s4')]} />
      </StagePanel>

      <WorldLedger world="hardware" t={t} locale={locale} />
    </Stage>
  );
}
