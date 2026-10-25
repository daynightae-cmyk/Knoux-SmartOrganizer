/**
 * KNOuX SmartOrganizer — History & Undo Inspector (Stage 8)
 *
 * Measured mode lists immutable plan preview receipts only. There is no
 * execution journal and no undo control because this build exposes no write
 * capability. Fixture entries are explicitly labelled and are never presented
 * as real file operations.
 */

import React from 'react';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  FileCheck,
  AlertTriangle,
  CircleSlash,
} from 'lucide-react';
import { useStudio } from '../context';

function formatReceiptBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function HistoryUndoInspector() {
  const { historyJournal, setActiveStageId, native, locale } = useStudio();
  const measured = native.mode === 'measured';

  // Measured mode shows persisted preview receipts only. Fixture journal rows
  // are never merged into a measured history.
  const entries = measured
    ? native.previewHistory.map((receipt) => ({
        id: receipt.planHash || receipt.id,
        timestamp: new Date(receipt.createdAt).toLocaleString(),
        filesProcessed: receipt.files,
        totalSizeFormatted: formatReceiptBytes(receipt.bytes),
        summaryEn: `${receipt.operation} preview · ${receipt.categories.toLocaleString()} categories · ${receipt.collisions.toLocaleString()} collision(s)`,
        summaryAr: `معاينة ${receipt.operation} · ${receipt.categories.toLocaleString()} فئة · ${receipt.collisions.toLocaleString()} تعارض`,
        destinationPath: receipt.destinationSummary || (locale === 'en' ? 'Virtual grouping (no destination)' : 'تجميع افتراضي (دون وجهة)'),
        status: 'preview' as const,
        previewOnly: true as const,
      }))
    : historyJournal;

  return (
    <div className="flex-1 px-6 py-2 overflow-y-auto studio-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <RotateCcw className="w-4 h-4" />
              <span>{locale === 'en' ? 'Journal & Recoverability' : 'السجل والاستعادة'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${measured ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/60 text-amber-300 border-amber-500/40'}`}>
                {measured ? (locale === 'en' ? 'PREVIEW RECEIPTS' : 'إيصالات معاينة') : (locale === 'en' ? 'FIXTURE' : 'تجريبي')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {locale === 'en' ? 'Plan Preview Receipts' : 'إيصالات معاينة الخطط'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {locale === 'en'
                ? 'Every measured plan preview is recorded with its hash, totals and collisions. No execution journal exists yet, so undo is not available and no receipt is presented as a completed file operation.'
                : 'تُسجل كل معاينة خطة مقيسة مع بصمتها وإجمالياتها وتعارضاتها. لا يوجد سجل تنفيذ بعد، لذلك التراجع غير متاح ولا يُعرض أي إيصال كعملية ملفات مكتملة.'}
            </p>
          </div>

          <button
            onClick={() => setActiveStageId(9)}
            className="px-4 py-2 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(36,118,255,0.4)] cursor-pointer shrink-0"
          >
            <span>{locale === 'en' ? 'View Suggestions' : 'عرض المقترحات'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="studio-glass-panel rounded-xl p-4 border border-amber-500/40 bg-amber-950/15 flex items-start gap-2.5 text-[11px] text-amber-200">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {locale === 'en'
              ? 'Write operations and undo are blocked in this build. A real execution journal, verified postconditions and recoverability must be implemented behind a separate approval gate before this stage can claim rollback.'
              : 'عمليات الكتابة والتراجع محظورة في هذا البناء. يجب تنفيذ سجل تنفيذ حقيقي وتحقق من النتائج واستعادة خلف بوابة موافقة منفصلة قبل أن تدعي هذه المرحلة التراجع.'}
          </span>
        </div>

        <div className="space-y-3">
          {entries.map((entry) => {
            const preview = entry.previewOnly || entry.status === 'preview';
            return (
              <div key={entry.id} className="studio-glass-panel rounded-xl p-4 border border-[#132c52] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${preview ? 'bg-sky-950/40 border-cyan-500/40 text-cyan-300' : 'bg-amber-950/40 border-amber-500/40 text-amber-400'}`}>
                    {preview ? <FileCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-300">{entry.id.slice(0, 18)}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{entry.timestamp}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${preview ? 'bg-cyan-950/60 text-cyan-300' : 'bg-amber-950/60 text-amber-300'}`}>
                        {preview ? (locale === 'en' ? 'Preview only' : 'معاينة فقط') : entry.status}
                      </span>
                    </div>
                    <div className="text-xs text-white font-medium mt-1">
                      {locale === 'en' ? entry.summaryEn : entry.summaryAr}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1 flex flex-wrap items-center gap-3">
                      <span>{entry.filesProcessed.toLocaleString()} {locale === 'en' ? 'files' : 'ملف'}</span>
                      <span>•</span>
                      <span className="text-cyan-300">{entry.totalSizeFormatted}</span>
                      <span>•</span>
                      <span className="truncate max-w-[340px]">{locale === 'en' ? 'Destination' : 'الوجهة'}: {entry.destinationPath}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 shrink-0">
                  <CircleSlash className="w-3.5 h-3.5" />
                  {locale === 'en' ? 'No undo' : 'لا تراجع'}
                </span>
              </div>
            );
          })}
          {entries.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-[#1a3d6d] rounded-xl">
              <Clock className="w-5 h-5 mx-auto mb-2 text-slate-500" />
              {measured
                ? locale === 'en'
                  ? 'No plan previews recorded yet. Build one in Stage 6.'
                  : 'لا توجد معاينات مسجلة. ابنِ واحدة في المرحلة 6.'
                : locale === 'en'
                ? 'Fixture journal only; no real execution records exist.'
                : 'سجل تجريبي فقط؛ لا توجد سجلات تنفيذ حقيقية.'}
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-500 flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>
            {locale === 'en'
              ? 'Receipts are stored under the application user-data folder; they contain plan hashes and counts, not file contents.'
              : 'تُخزن الإيصالات في مجلد بيانات التطبيق؛ تحتوي على بصمات الخطط والأعداد لا محتوى الملفات.'}
          </span>
        </div>
      </div>
    </div>
  );
}
