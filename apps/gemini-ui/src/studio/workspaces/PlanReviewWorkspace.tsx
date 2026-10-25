/**
 * KNOuX SmartOrganizer — Plan Review Workspace (Stage 6)
 *
 * Real native plans are immutable read-only previews. This build exposes no
 * execution capability: the approval control is intentionally blocked and no
 * file is created, moved, overwritten or deleted by this stage.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  FolderTree,
  Play,
  CircleSlash,
  RefreshCw,
} from 'lucide-react';
import { useStudio } from '../context';

function fmtBytes(bytes: number): string {
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

export function PlanReviewWorkspace() {
  const {
    files,
    destinationPath,
    operationMode,
    conflicts,
    setActiveStageId,
    native,
    previewNativePlan,
    locale,
  } = useStudio();

  const [activeTab, setActiveTab] = useState<'all' | 'conflicts'>('all');
  const requestedRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      native.mode === 'measured' &&
      native.sourceId &&
      !native.plan &&
      !native.planLoading &&
      requestedRef.current !== native.sourceId
    ) {
      requestedRef.current = native.sourceId;
      void previewNativePlan();
    }
  }, [native.mode, native.sourceId, native.plan, native.planLoading, previewNativePlan]);

  const measured = native.mode === 'measured';
  const plan = native.plan;
  // Mixed fixture/native row shapes are normalized at the render boundary.
  const sourceRows: any[] = measured ? plan?.files || [] : files;
  const conflictCount = measured
    ? plan?.totals.collisions ?? 0
    : conflicts.reduce((sum, conflict) => sum + conflict.affectedCount, 0);
  const totalFiles = measured ? plan?.totals.files ?? 0 : files.length;
  const totalBytes = measured
    ? plan?.totals.bytes ?? 0
    : files.reduce((sum, file) => sum + file.sizeBytes, 0);
  const effectiveDestination = measured
    ? native.destination?.path || null
    : destinationPath;
  const rows = activeTab === 'conflicts' && measured
    ? sourceRows.filter((row) => row.status === 'collision')
    : sourceRows;

  return (
    <div className="flex-1 px-6 py-2 overflow-y-auto studio-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <FileCheck2 className="w-4 h-4" />
              <span>{locale === 'en' ? 'Secured Plan Validation' : 'التحقق الآمن من الخطة'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${measured ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/60 text-amber-300 border-amber-500/40'}`}>
                {measured ? (locale === 'en' ? 'MEASURED PREVIEW' : 'معاينة مقيسة') : (locale === 'en' ? 'FIXTURE PREVIEW' : 'معاينة تجريبية')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {locale === 'en' ? 'Organization Plan Review & Dry Run' : 'مراجعة خطة التنظيم والمحاكاة التجريبية'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {measured
                ? locale === 'en'
                  ? 'This plan was built from the measured inventory and immutable source identities. Review targets and collisions. Execution is blocked because no write capability is exposed in this build.'
                  : 'بُنيت هذه الخطة من الفهرس المقيس وهوية المصادر غير القابلة للتعديل. راجع المسارات والتعارضات. التنفيذ محظور لعدم كشف قدرة كتابة في هذا البناء.'
                : locale === 'en'
                ? 'Fixture preview only. Nothing here describes this device; add a native source in Electron for a measured plan.'
                : 'معاينة تجريبية فقط. لا يصف هذا جهازك؛ أضف مصدرًا أصليًا في Electron لخطة مقيسة.'}
            </p>
          </div>

          <button
            onClick={() => void previewNativePlan('virtual')}
            disabled={!measured || native.planLoading}
            className="px-4 py-2 rounded-lg bg-[#0e2447] hover:bg-[#153463] disabled:opacity-50 text-cyan-200 border border-[#2476ff]/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${native.planLoading ? 'animate-spin' : ''}`} />
            <span>{locale === 'en' ? 'Rebuild read-only preview' : 'إعادة بناء معاينة للقراءة فقط'}</span>
          </button>
        </div>

        {measured && native.planError && (
          <div className="studio-glass-panel rounded-xl p-4 border border-rose-500/40 bg-rose-950/20 text-xs text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{native.planError}</span>
          </div>
        )}
        {measured && native.planLoading && (
          <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] flex items-center gap-3 text-xs text-slate-300">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            {locale === 'en' ? 'Building the immutable preview from measured identities…' : 'جارٍ بناء معاينة غير قابلة للتعديل من الهويات المقيسة…'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#08182f] border border-[#142e56] flex items-center gap-3">
            {effectiveDestination ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
            <div className="min-w-0">
              <div className="text-xs font-bold text-white">{locale === 'en' ? 'Destination' : 'الوجهة'}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{effectiveDestination || (locale === 'en' ? 'Virtual grouping (no destination)' : 'تجميع افتراضي (دون وجهة)')}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#08182f] border border-[#142e56] flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white">{locale === 'en' ? 'Plan footprint' : 'حجم الخطة'}</div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">{totalFiles.toLocaleString()} {locale === 'en' ? 'files' : 'ملف'} · {fmtBytes(totalBytes)} · {operationMode}</div>
            </div>
          </div>

          <div className={`p-3 rounded-lg border flex items-center gap-3 ${conflictCount > 0 ? 'bg-amber-950/20 border-amber-600/40' : 'bg-[#08182f] border-[#142e56]'}`}>
            <AlertTriangle className={`w-5 h-5 shrink-0 ${conflictCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            <div className="min-w-0">
              <div className={`text-xs font-bold ${conflictCount > 0 ? 'text-amber-300' : 'text-white'}`}>{locale === 'en' ? 'Conflict guard' : 'حارس التعارض'}</div>
              <div className="text-[10px] text-slate-400">{conflictCount} {locale === 'en' ? 'collision(s) in this plan' : 'تعارض في هذه الخطة'}</div>
            </div>
          </div>
        </div>

        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#0f2545]">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-cyan-400" />
              <span>
                {locale === 'en'
                  ? `Itemized Path Transformations (first ${Math.min(rows.length, 12)} of ${totalFiles.toLocaleString()})`
                  : `تحولات المسارات (أول ${Math.min(rows.length, 12)} من ${totalFiles.toLocaleString()})`}
              </span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${activeTab === 'all' ? 'bg-[#153664] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {locale === 'en' ? 'All Transformations' : 'كل التحولات'}
              </button>
              <button
                onClick={() => setActiveTab('conflicts')}
                disabled={!measured}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer disabled:opacity-50 ${activeTab === 'conflicts' ? 'bg-amber-950/60 text-amber-300 border border-amber-600/50' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {locale === 'en' ? `Conflicts (${conflictCount})` : `التعارضات (${conflictCount})`}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {rows.slice(0, 12).map((row, idx) => {
              const source = measured ? row.sourceRelative : row.sourcePath;
              const target = measured
                ? row.targetRelative || (row.targetPath ? row.targetPath : `${locale === 'en' ? 'Virtual group' : 'مجموعة افتراضية'}: ${row.category}`)
                : `${destinationPath}\\${row.name}`;
              const size = measured ? fmtBytes(row.size) : row.sizeFormatted;
              return (
                <div key={measured ? `${row.fileId}-${idx}` : row.id} className="p-2.5 rounded-lg bg-[#07152b] border border-[#122b50] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-500">{locale === 'en' ? 'Source:' : 'المصدر:'}</div>
                    <div className="text-slate-300 truncate" title={source}>{source}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 hidden sm:block" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-cyan-400 font-semibold">{locale === 'en' ? 'Planned target:' : 'الهدف المخطط:'}</div>
                    <div className="text-cyan-200 truncate" title={target}>{target}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded bg-[#0a1f3d] text-[10px] text-slate-400">{size}</span>
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-[#1a3d6d] rounded-lg">
                {measured
                  ? native.plan
                    ? locale === 'en' ? 'No collisions in this preview.' : 'لا توجد تعارضات في هذه المعاينة.'
                    : locale === 'en' ? 'Build a read-only preview to see measured paths.' : 'ابنِ معاينة للقراءة فقط لعرض المسارات المقيسة.'
                  : locale === 'en' ? 'Fixture plan is empty.' : 'الخطة التجريبية فارغة.'}
              </div>
            )}
          </div>

          {measured && plan?.truncated && (
            <div className="text-[10px] text-slate-500 font-mono">
              {locale === 'en' ? 'Showing the first 500 plan rows; totals above describe the full plan.' : 'يتم عرض أول 500 صف؛ الإجماليات أعلاه تصف الخطة الكاملة.'}
            </div>
          )}
        </div>

        <div className="studio-glass-panel rounded-xl p-4 border border-amber-500/40 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CircleSlash className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-200">
                {locale === 'en' ? 'Execution locked — explicit approval required' : 'التنفيذ مغلق — موافقة صريحة مطلوبة'}
              </div>
              <div className="text-[10px] text-amber-200/80 mt-0.5 max-w-xl">
                {locale === 'en'
                  ? 'This build exposes no file copy, move, overwrite, delete or undo capability. The plan can be reviewed only; a separately authorized write capability is required before any file is touched.'
                  : 'هذا البناء لا يكشف قدرة نسخ أو نقل أو استبدال أو حذف أو تراجع. يمكن مراجعة الخطة فقط؛ يلزم كشف قدرة كتابة مصرح بها بشكل منفصل قبل لمس أي ملف.'}
              </div>
            </div>
          </div>
          <button
            disabled
            title={locale === 'en' ? 'Blocked: explicit approval and a write capability are required.' : 'محظور: يلزم اعتماد صريح وقدرة كتابة.'}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-500 border border-slate-700 text-xs font-bold flex items-center gap-2 cursor-not-allowed shrink-0"
          >
            <Play className="w-4 h-4" />
            <span>{locale === 'en' ? 'Execute Approved Plan (blocked)' : 'تنفيذ الخطة (محظور)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
