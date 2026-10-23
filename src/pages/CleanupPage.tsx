import { Boxes, FlaskConical, HardDriveDownload, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useStore } from '../state/store';
import { Stage, StageHead, StageStats, StageSplit, StagePanel, StageFlow, StageNote, StageEmpty } from '../components/world/Stage';
import { EngineConsole, WorldLedger, sumField, summaryNumber } from '../components/world/EngineConsole';
import { formatBytes, formatCount } from '../lib/format';

/**
 * Cleanup — the Clean Room.
 *
 * The composition the reference asks for: what has been measured, what could
 * come back, what needs a second look, and the candidate list behind it. The
 * one engine this world really has is the temporary-file scan; quarantine and
 * undo stay behind their own confirmation, so the page never implies a delete
 * happened.
 */
export default function CleanupPage() {
  const { t, locale, result } = useStore();
  const scan = result && result.toolId.startsWith('temp-cleanup') ? result : null;
  const candidates = scan ? scan.items.length : null;
  const bytes = scan ? sumField(scan.items, ['sizeBytes', 'bytes', 'size']) : null;
  const flagged = summaryNumber(scan, 'reviewRequired');

  return (
    <Stage world="cleanup">
      <StageHead
        icon={FlaskConical}
        title={t('stage.cleanup.name')}
        lead={t('stage.cleanup.lead')}
        readout={<span className="stage__stamp">{scan ? t('stage.measured') : t('stage.awaiting')}</span>}
      />

      <StageStats items={[
        { icon: Boxes, label: t('stage.cleanup.stat1'), value: candidates == null ? '—' : formatCount(candidates, locale), detail: scan ? t('stage.cleanup.stat1d') : t('stage.awaiting') },
        { icon: HardDriveDownload, label: t('stage.cleanup.stat2'), value: bytes == null ? '—' : formatBytes(bytes, locale), detail: t('stage.cleanup.stat2d') },
        { icon: ShieldCheck, label: t('stage.cleanup.stat3'), value: t('stage.cleanup.stat3v'), detail: t('stage.cleanup.stat3d') },
        { icon: TriangleAlert, label: t('stage.cleanup.stat4'), value: flagged == null ? '—' : formatCount(flagged, locale), detail: t('stage.cleanup.stat4d'), tone: 'warn' }
      ]} />

      <StageSplit
        main={<EngineConsole
          title={t('stage.cleanup.console')}
          hint={t('stage.cleanup.consoleHint')}
          engines={['temp-cleanup-preview', 'temp-cleanup-apply', 'temp-cleanup-undo']}
          emptyTitle={t('stage.cleanup.empty')}
          emptyNote={t('stage.cleanup.emptyNote')}
        />}
        rail={<>
          <StagePanel title={t('stage.cleanup.rule')} hint={t('stage.cleanup.ruleHint')}>
            <StageNote tone="good" icon={ShieldCheck}>{t('stage.cleanup.ruleNote')}</StageNote>
            <StageNote icon={TriangleAlert}>{t('stage.cleanup.ruleWarn')}</StageNote>
          </StagePanel>
          <StagePanel title={t('stage.cleanup.other')}>
            <StageEmpty title={t('stage.cleanup.otherEmpty')} note={t('stage.cleanup.otherNote')} />
          </StagePanel>
        </>}
      />

      <StagePanel title={t('stage.cleanup.flow')} hint={t('stage.cleanup.flowHint')}>
        <StageFlow steps={[
          t('stage.cleanup.s1'), t('stage.cleanup.s2'), t('stage.cleanup.s3'),
          t('stage.cleanup.s4'), t('stage.cleanup.s5'), t('stage.cleanup.s6'),
          t('stage.cleanup.s7'), t('stage.cleanup.s8')
        ]} />
      </StagePanel>

      <WorldLedger world="cleanup" t={t} locale={locale} />
    </Stage>
  );
}
