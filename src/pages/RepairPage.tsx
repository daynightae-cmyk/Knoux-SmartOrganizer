/**
 * REF-08 visual composition inside the existing KNOuX shell.
 * All native actions remain behind the already-guarded EngineConsole.
 */
import { useMemo } from 'react';
import { useStore } from '../state/store';
import { EngineConsole, WorldLedger } from '../components/world/EngineConsole';
import RecoveryLab, { type RepairHistoryEntry } from '../components/repair/RecoveryLab';
import '../repair-recovery-lab.css';

const REPAIR_ENGINE_IDS = [
  'repair-dism-check-health', 'repair-dism-scan-health', 'repair-dism-restore-health',
  'repair-sfc-verify-only', 'repair-sfc-scan-now', 'repair-dns-flush',
  'repair-winsock-reset', 'repair-tcpip-reset'
];
const REPAIR_ENGINE_SET = new Set(REPAIR_ENGINE_IDS);

export default function RepairPage() {
  const { locale, t, history, tools } = useStore();
  const historyEntries = useMemo<RepairHistoryEntry[]>(() =>
    history.filter(item => REPAIR_ENGINE_SET.has(item.toolId)).map(item => ({
      id: item.operationId,
      dateTime: new Date(item.finishedAt).toLocaleString(locale === 'ar' ? 'ar' : 'en'),
      tool: (() => {
        const tool = tools.find(entry => entry.id === item.toolId);
        return tool ? t(tool.nameKey) : item.toolId;
      })(),
      result: item.success ? t('history.success') : t('history.error'),
      details: String(item.items.length)
    })), [history, tools, t, locale]);

  return <RecoveryLab locale={locale} historyEntries={historyEntries}>
    <details className="knx-recovery-connected">
      <summary>{locale === 'ar' ? 'محركات الإصلاح المتصلة والسجل الفعلي' : 'Connected repair engines and actual results'}</summary>
      <div className="knx-recovery-connected__inner">
        <p>{locale === 'ar'
          ? 'اللوحة التالية هي مسار KNOuX الأصلي، وتحتفظ بصلاحيات Windows ومراجعة التشغيل والتاريخ الحقيقي.'
          : 'This is the existing KNOuX runtime, retaining its Windows permission, review, and result safeguards.'}</p>
        <EngineConsole
          title={t('stage.repair.console')}
          hint={t('stage.repair.consoleHint')}
          engines={REPAIR_ENGINE_IDS}
          emptyTitle={t('stage.repair.empty')}
          emptyNote={t('stage.repair.emptyNote')}
        />
        <WorldLedger world="repair" t={t} locale={locale} />
      </div>
    </details>
  </RecoveryLab>;
}
