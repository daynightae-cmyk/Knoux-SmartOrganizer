import { ShieldPlus, Terminal, TriangleAlert, Wand2 } from 'lucide-react';
import { useMemo } from 'react';
import { useStore } from '../state/store';
import { Stage, StageHead, StageStats, StageSplit, StagePanel, StageFlow, StageNote, StageKv, StageEmpty } from '../components/world/Stage';
import { EngineConsole, WorldLedger } from '../components/world/EngineConsole';
import { previewFor } from '../lib/service-preview';
import { serviceCatalog } from '../lib/service-catalog';
import { formatCount } from '../lib/format';

/**
 * Repair — Recovery Lab.
 *
 * Eight real Windows repair commands, every one of them elevated. The page is
 * built to be read before it is run: the command, what it does, what it needs
 * and what it can cost, then the same approval path the runner already
 * enforces. Nothing here executes because a panel is open.
 */
const REPAIR_ENGINES = [
  'repair-dism-check-health', 'repair-dism-scan-health', 'repair-dism-restore-health',
  'repair-sfc-verify-only', 'repair-sfc-scan-now', 'repair-dns-flush',
  'repair-winsock-reset', 'repair-tcpip-reset'
];

export default function RepairPage() {
  const { t, locale, result } = useStore();
  const run = result && REPAIR_ENGINES.includes(result.toolId) ? result : null;
  const tools = useMemo(() => serviceCatalog.filter(service => service.world === 'repair' && service.engine), []);

  return (
    <Stage world="repair" state={run ? 'ready' : 'idle'}>
      <StageHead
        icon={ShieldPlus}
        title={t('stage.repair.name')}
        lead={t('stage.repair.lead')}
        readout={<span className="stage__stamp">{run ? t('stage.measured') : t('stage.awaiting')}</span>}
      />

      <StageStats items={[
        { icon: Terminal, label: t('stage.repair.stat1'), value: formatCount(tools.length, locale), detail: t('stage.repair.stat1d') },
        { icon: TriangleAlert, label: t('stage.repair.stat2'), value: formatCount(tools.filter(item => item.requiresAdmin).length, locale), detail: t('stage.repair.stat2d'), tone: 'warn' },
        { icon: Wand2, label: t('stage.repair.stat3'), value: run ? t('stage.repair.stat3vRun') : t('stage.repair.stat3v'), detail: t('stage.repair.stat3d') },
        { icon: ShieldPlus, label: t('stage.repair.stat4'), value: t('stage.repair.stat4v'), detail: t('stage.repair.stat4d'), tone: 'good' }
      ]} />

      <StageSplit
        main={<EngineConsole
          title={t('stage.repair.console')}
          hint={t('stage.repair.consoleHint')}
          engines={REPAIR_ENGINES}
          emptyTitle={t('stage.repair.empty')}
          emptyNote={t('stage.repair.emptyNote')}
        />}
        rail={<>
          <StagePanel title={t('stage.repair.guide')} hint={t('stage.repair.guideHint')}>
            {tools.map(service => {
              const preview = previewFor(service);
              return (
                <div key={service.id} className="stage__note" style={{ marginBottom: 6 }}>
                  <Terminal size={15} aria-hidden="true" />
                  <span>
                    <strong>{t(service.nameKey)}</strong>
                    {preview ? ` — ${preview.steps[0]?.[locale] ?? ''}` : ''}
                  </span>
                </div>
              );
            })}
          </StagePanel>
          <StagePanel title={t('stage.repair.authority')}>
            <StageNote tone="warn" icon={TriangleAlert}>{t('stage.repair.authorityNote')}</StageNote>
            <StageKv rows={[
              { k: t('stage.repair.k1'), v: t('stage.repair.k1v') },
              { k: t('stage.repair.k2'), v: t('stage.repair.k2v') }
            ]} />
          </StagePanel>
          {!run && <StageEmpty title={t('stage.repair.consoleEmpty')} note={t('stage.repair.consoleEmptyNote')} />}
        </>}
      />

      <StagePanel title={t('stage.repair.flow')} hint={t('stage.repair.flowHint')}>
        <StageFlow steps={[
          t('stage.repair.s1'), t('stage.repair.s2'), t('stage.repair.s3'), t('stage.repair.s4'),
          t('stage.repair.s5'), t('stage.repair.s6'), t('stage.repair.s7')
        ]} />
      </StagePanel>

      <WorldLedger world="repair" t={t} locale={locale} />
    </Stage>
  );
}
