import { Activity, Cpu, Gauge, HardDrive, MemoryStick, Timer } from 'lucide-react';
import { useEffect } from 'react';
import { useStore } from '../state/store';
import { Stage, StageHead, StageStats, StageSplit, StagePanel, StageFlow, StageNote, StageKv } from '../components/world/Stage';
import { EngineConsole, WorldLedger } from '../components/world/EngineConsole';
import { formatBytes, formatCount } from '../lib/format';

/**
 * System — Live Pulse.
 *
 * The four headline readings come from the health summary the shell already
 * collects at boot; the charts stay empty until a repeated sample exists,
 * because a line drawn from one point would be decoration, not telemetry.
 */
export default function SystemPage() {
  const { t, locale, health, result, runById, event } = useStore();
  const read = result && ['system-health', 'event-warnings', 'process-inventory'].includes(result.toolId) ? result : null;

  const total = Number(health?.systemDriveTotalBytes);
  const free = Number(health?.systemDriveFreeBytes);
  const usedPercent = Number.isFinite(total) && Number.isFinite(free) && total > 0 ? Math.round(((total - free) / total) * 100) : null;
  const memory = Number(health?.memoryUsedPercent);
  const uptime = Number(health?.uptimeSeconds);
  const cores = Number(health?.cpuCores);

  useEffect(() => {
    if (!health && event?.toolId !== 'system-health') void runById('system-health', {}, true);
  // The observatory starts with one genuine Windows sample. Historical lines
  // remain absent until the backend has more than one point. One read per mount,
  // so the dependency list stays deliberately empty.
  }, []);

  return (
    <Stage world="system" state={health ? 'ready' : event?.toolId === 'system-health' ? 'reading' : 'idle'}>
      <StageHead
        icon={Activity}
        title={t('stage.system.name')}
        lead={t('stage.system.lead')}
        readout={<span className="stage__stamp">{health ? t('stage.measured') : t('stage.awaiting')}</span>}
      />

      <StageStats items={[
        { icon: Cpu, label: t('stage.system.stat1'), value: Number.isFinite(cores) ? formatCount(cores, locale) : '—', detail: String(health?.cpuModel ?? t('stage.awaiting')).slice(0, 34) },
        { icon: MemoryStick, label: t('stage.system.stat2'), value: Number.isFinite(memory) ? `${memory}%` : '—', detail: health ? formatBytes(Number(health.memoryFreeBytes), locale) : t('stage.awaiting'), meter: Number.isFinite(memory) ? memory : null },
        { icon: HardDrive, label: t('stage.system.stat3'), value: usedPercent == null ? '—' : `${usedPercent}%`, detail: free > 0 ? formatBytes(free, locale) : t('stage.awaiting'), meter: usedPercent },
        { icon: Timer, label: t('stage.system.stat4'), value: Number.isFinite(uptime) ? uptimeLabel(uptime) : '—', detail: t('stage.system.stat4d') }
      ]} />

      <StageSplit
        main={<EngineConsole
          title={t('stage.system.console')}
          hint={t('stage.system.consoleHint')}
          engines={['system-health', 'event-warnings', 'process-inventory']}
          emptyTitle={t('stage.system.empty')}
          emptyNote={t('stage.system.emptyNote')}
        />}
        rail={<>
          <StagePanel title={t('stage.system.info')} hint={t('stage.system.infoHint')}>
            <StageKv rows={[
              { k: t('stage.system.k1'), v: String(health?.osVersion ?? '—'), ltr: true },
              { k: t('stage.system.k2'), v: String(health?.osBuild ?? '—'), ltr: true },
              { k: t('stage.system.k3'), v: String(health?.cpuModel ?? '—'), ltr: true },
              { k: t('stage.system.k4'), v: health ? formatBytes(Number(health.memoryTotalBytes), locale) : '—', ltr: true }
            ]} />
          </StagePanel>
          <StagePanel title={t('stage.system.telemetry')}>
            <StageNote icon={Gauge}>{read ? t('stage.system.telemetryRead') : t('stage.system.telemetryNote')}</StageNote>
          </StagePanel>
        </>}
      />

      <StagePanel title={t('stage.system.flow')} hint={t('stage.system.flowHint')}>
        <StageFlow steps={[t('stage.system.s1'), t('stage.system.s2'), t('stage.system.s3'), t('stage.system.s4')]} />
      </StagePanel>

      <WorldLedger world="system" t={t} locale={locale} />
    </Stage>
  );
}

function uptimeLabel(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}
