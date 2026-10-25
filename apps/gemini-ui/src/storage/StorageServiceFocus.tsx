import React from 'react';
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock, Copy, ShieldAlert, X } from 'lucide-react';
import type {
  StorageAnalysis,
  StorageCapacityPoint,
  StorageDuplicateResult,
  StorageVolume,
} from '../../shared/native-contracts';
import { formatStorageBytes } from './useStorageNative';
import type { StorageTabKey } from './StorageTabContent';

interface StorageServiceFocusProps {
  serviceKey: string;
  isArabic: boolean;
  volumes: StorageVolume[];
  analysis: StorageAnalysis | null;
  duplicates: StorageDuplicateResult | null;
  history: StorageCapacityPoint[];
  verifying: boolean;
  onClose: () => void;
  onChoose: () => void;
  onRescan: () => void;
  onTab: (tab: StorageTabKey) => void;
  onVerify: () => void;
  onNavigateFiles: () => void;
  onNavigateCleanup: () => void;
  onNavigateStudio: () => void;
}

const LABELS: Record<string, { en: string; ar: string; descEn: string; descAr: string }> = {
  'storage-disks': { en: 'Volume Bays', ar: 'خليج وحدات التخزين', descEn: 'Measured mounted volumes and capacity.', descAr: 'وحدات التخزين المثبتة والسعة المقيسة.' },
  'storage-large-files': { en: 'Heavy-File Ledger', ar: 'سجل الملفات الثقيلة', descEn: 'Largest indexed files in the authorized scope.', descAr: 'أكبر الملفات المفهرسة في النطاق المصرح.' },
  'storage-duplicates': { en: 'Duplicate Hash Groups', ar: 'مجموعات التكرار', descEn: 'Size candidates and bounded byte-exact verification.', descAr: 'مرشحات الحجم وتحقق محتوى محدود.' },
  'storage-treemap': { en: 'Storage Treemap', ar: 'خريطة المساحة', descEn: 'Measured folder tree proportional to bytes.', descAr: 'شجرة مجلدات مقيسة تتناسب مع البايتات.' },
  'storage-top-folders': { en: 'Folder Ranking', ar: 'ترتيب المجلدات', descEn: 'Largest top-level folders in the scope.', descAr: 'أكبر المجلدات في النطاق.' },
  'storage-filetypes': { en: 'Type Distribution', ar: 'توزيع الأنواع', descEn: 'Measured extension counts and bytes.', descAr: 'الأعداد والبايتات حسب الامتداد.' },
  'storage-scan-overview': { en: 'Scan Coverage', ar: 'تغطية الفحص', descEn: 'What was actually indexed, and what was not.', descAr: 'ما تمت فهرسته فعليًا وما لم يتم.' },
  'storage-fragmentation': { en: 'Optimization & TRIM', ar: 'التحسين وTRIM', descEn: 'Blocked: no supported defrag/TRIM or media-type provider.', descAr: 'محظور: لا يوجد مزود مدعوم لإلغاء التجزئة أو TRIM أو نوع الوسائط.' },
  'storage-smart': { en: 'S.M.A.R.T. Health', ar: 'صحة S.M.A.R.T.', descEn: 'Unavailable: no supported SMART provider is exposed.', descAr: 'غير متاح: لا يوجد مزود SMART مدعوم.' },
  'storage-reclaim': { en: 'Reclaim Planner', ar: 'مخطط الاستعادة', descEn: 'Blocked: plans must be reviewed in Cleanup or Studio.', descAr: 'محظور: يجب مراجعة الخطط في التنظيف أو الاستوديو.' },
  'storage-history': { en: 'Capacity Trend', ar: 'اتجاه السعة', descEn: 'Snapshots captured while this app measured volumes.', descAr: 'لقطات مسجلة أثناء قياس التطبيق للأحجام.' },
  'storage-removable': { en: 'Removable Dock', ar: 'قاعدة الوسائط', descEn: 'Unsupported: the current provider does not expose drive type.', descAr: 'غير مدعوم: المزود الحالي لا يعرض نوع محرك الأقراص.' },
};

function metricRow(label: string, value: string) {
  return (
    <div className="flex items-center justify-between gap-2 text-[10px]">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono text-slate-200 text-right">{value}</span>
    </div>
  );
}

export function StorageServiceFocus({
  serviceKey,
  isArabic,
  volumes,
  analysis,
  duplicates,
  history,
  verifying,
  onClose,
  onChoose,
  onRescan,
  onTab,
  onVerify,
  onNavigateFiles,
  onNavigateCleanup,
  onNavigateStudio,
}: StorageServiceFocusProps) {
  const meta = LABELS[serviceKey] || { en: serviceKey, ar: serviceKey, descEn: '', descAr: '' };
  const measured = Boolean(analysis) || volumes.length > 0;
  const warnings = analysis?.coverage.warnings || [];

  const renderBody = () => {
    switch (serviceKey) {
      case 'storage-disks':
        return (
          <div className="space-y-1.5">
            {volumes.length ? volumes.map((volume) => (
              <div key={volume.id} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="font-mono text-white">{volume.letter} <span className="text-slate-400 font-sans">{volume.label}</span></span>
                <span className="font-mono text-slate-300">{formatStorageBytes(volume.freeBytes)} free / {formatStorageBytes(volume.totalBytes)}</span>
              </div>
            )) : <div className="text-[10px] text-amber-300">{isArabic ? 'لا توجد أحجام مقيسة.' : 'No measured volumes.'}</div>}
            <div className="text-[9px] text-slate-500">{isArabic ? 'الهوية الفيزيائية وSMART غير متاحين من المزود الحالي.' : 'Physical identity and SMART are not exposed by the current provider.'}</div>
            <button onClick={onChoose} className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer">
              {isArabic ? 'تحديد نطاق التحليل' : 'Authorize analysis scope'}
            </button>
          </div>
        );
      case 'storage-large-files':
        return (
          <div className="space-y-1.5">
            {(analysis?.largest || []).slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="text-slate-300 truncate" title={item.relative}>{item.name}</span>
                <span className="font-mono text-cyan-300 shrink-0">{formatStorageBytes(item.size)}</span>
              </div>
            ))}
            {!analysis && <div className="text-[10px] text-amber-300">{isArabic ? 'افهرس نطاقًا لعرض الملفات الكبيرة.' : 'Index a scope to list large files.'}</div>}
            <button onClick={() => onTab('large')} className="text-cyan-300 text-[10px] underline flex items-center gap-1">{isArabic ? 'فتح السجل' : 'Open ledger'}<ArrowRight className="w-3 h-3" /></button>
          </div>
        );
      case 'storage-duplicates':
        return (
          <div className="space-y-2">
            {analysis ? (
              <>
                {metricRow(isArabic ? 'مرشحات الحجم' : 'Size candidates', (analysis.duplicateCandidates.length || 0).toString())}
                {metricRow(isArabic ? 'بايتات مهدورة محتملة' : 'Potential wasted', formatStorageBytes(analysis.duplicateCandidates.reduce((sum, group) => sum + group.wastedBytes, 0)))}
                <div className="text-[9px] text-amber-300">{isArabic ? 'المطابقة بالحجم ليست دليلًا؛ تحقق المحتوى محدود.' : 'Size matches are not proof; content verification is bounded.'}</div>
                <button onClick={onVerify} disabled={verifying} className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 text-[10px] cursor-pointer disabled:opacity-50">
                  {verifying ? (isArabic ? 'جارٍ التحقق…' : 'Verifying…') : (isArabic ? 'تحقق من المحتوى' : 'Verify content')}
                </button>
                {duplicates && (
                  <div className="text-[9px] text-slate-300 space-y-1">
                    {metricRow(isArabic ? 'مجموعات مؤكدة' : 'Verified groups', duplicates.summary.verifiedGroups.toString())}
                    {metricRow(isArabic ? 'قابل للاستعادة' : 'Verified reclaimable', formatStorageBytes(duplicates.summary.reclaimableVerifiedBytes))}
                    {duplicates.summary.budgetReached && <div className="text-amber-300">{isArabic ? 'النتيجة جزئية بسبب حد الميزانية.' : 'Partial due to bounded budget.'}</div>}
                  </div>
                )}
              </>
            ) : <div className="text-[10px] text-amber-300">{isArabic ? 'افهرس نطاقًا لتحليل التكرار.' : 'Index a scope for duplicate analysis.'}</div>}
          </div>
        );
      case 'storage-treemap':
        return (
          <div className="space-y-2 text-[10px] text-slate-300">
            {analysis ? (
              <>
                {metricRow(isArabic ? 'العقد' : 'Folders modeled', analysis.folders.length.toString())}
                {metricRow(isArabic ? 'الحجم المفهرس' : 'Indexed bytes', formatStorageBytes(analysis.totals.bytes))}
                <div className="text-slate-500 font-mono truncate">{analysis.coverage.scope}</div>
                <button onClick={() => onTab('treemap')} className="text-cyan-300 underline flex items-center gap-1">{isArabic ? 'فتح الخريطة' : 'Open map'}<ArrowRight className="w-3 h-3" /></button>
              </>
            ) : <div className="text-amber-300">{isArabic ? 'افهرس نطاقًا لبناء الخريطة.' : 'Index a scope to build the map.'}</div>}
          </div>
        );
      case 'storage-top-folders':
        return (
          <div className="space-y-1.5">
            {(analysis?.folders || []).slice(0, 6).map((folder) => (
              <div key={folder.id} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="text-slate-300 truncate">{folder.name}</span>
                <span className="font-mono text-cyan-300">{formatStorageBytes(folder.sizeBytes)}</span>
              </div>
            ))}
            {!analysis && <div className="text-[10px] text-amber-300">{isArabic ? 'لا توجد مجلدات مقيسة.' : 'No measured folders.'}</div>}
            <button onClick={() => onTab('folders')} className="text-cyan-300 text-[10px] underline flex items-center gap-1">{isArabic ? 'فتح الترتيب' : 'Open ranking'}<ArrowRight className="w-3 h-3" /></button>
          </div>
        );
      case 'storage-filetypes':
        return (
          <div className="space-y-1.5">
            {(analysis?.extensions || []).slice(0, 6).map((item) => (
              <div key={item.ext} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="text-slate-300 font-mono">.{item.ext}</span>
                <span className="font-mono text-slate-400">{item.count.toLocaleString()} · {formatStorageBytes(item.bytes)}</span>
              </div>
            ))}
            <button onClick={() => onTab('types')} className="text-cyan-300 text-[10px] underline flex items-center gap-1">{isArabic ? 'فتح الأنواع' : 'Open types'}<ArrowRight className="w-3 h-3" /></button>
          </div>
        );
      case 'storage-scan-overview':
        return analysis ? (
          <div className="space-y-1.5 text-[10px] text-slate-300">
            <div className="flex items-center gap-1.5 text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" />{analysis.coverage.partial ? (isArabic ? 'تغطية جزئية' : 'Partial coverage') : (isArabic ? 'تغطية مكتملة للنطاق' : 'Complete for the scope')}</div>
            {metricRow(isArabic ? 'الملفات' : 'Files', analysis.coverage.files.toLocaleString())}
            {metricRow(isArabic ? 'المجلدات' : 'Folders', analysis.coverage.folders.toLocaleString())}
            {metricRow(isArabic ? 'آخر فحص' : 'Last scan', analysis.coverage.lastScanned || '—')}
            <div className="text-slate-500 break-all">{analysis.coverage.scope}</div>
            {warnings.slice(0, 3).map((warning) => <div key={warning} className="text-amber-300/90">{warning}</div>)}
            <button onClick={onRescan} className="text-cyan-300 underline text-[10px]">{isArabic ? 'إعادة فحص النطاق' : 'Rescan scope'}</button>
          </div>
        ) : <div className="text-[10px] text-amber-300">{isArabic ? 'لا يوجد نطاق مفهرس بعد.' : 'No indexed scope yet.'}</div>;
      case 'storage-fragmentation':
        return (
          <div className="text-[11px] text-rose-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{isArabic ? 'محظور في هذا البناء. لا يوجد كشف لنوع الوسائط ولا مزود defrag/TRIM، ولا نوصي بأي تحسين دون دليل.' : 'Blocked in this build. Media type and defrag/TRIM providers are unavailable, so no optimization is recommended without evidence.'}</span>
          </div>
        );
      case 'storage-smart':
        return (
          <div className="text-[11px] text-rose-200 flex items-start gap-2">
            <Activity className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{isArabic ? 'SMART غير متاح؛ لم يُكشف أي مزود صحة موثوق. لا يتم اختلاق درجات.' : 'SMART is unavailable; no supported health provider is exposed. Telemetry is not invented.'}</span>
          </div>
        );
      case 'storage-reclaim':
        return (
          <div className="space-y-2 text-[10px]">
            <div className="text-rose-200 flex items-start gap-2"><ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" /><span>{isArabic ? 'لا تحذف هذه الصفحة أي ملف. الاستعادة تُخطط وتُراجع في التنظيف أو الاستوديو.' : 'This page deletes nothing. Reclaim plans must be staged and reviewed in Cleanup or Studio.'}</span></div>
            <div className="flex gap-2">
              <button onClick={onNavigateCleanup} className="px-2 py-1 rounded bg-[#0e274d] border border-[#2476ff]/50 text-cyan-200 cursor-pointer">{isArabic ? 'فتح التنظيف' : 'Open Cleanup'}</button>
              <button onClick={onNavigateStudio} className="px-2 py-1 rounded bg-[#0a1c38] border border-[#173766] text-slate-300 cursor-pointer">{isArabic ? 'فتح الاستوديو' : 'Open Studio'}</button>
            </div>
          </div>
        );
      case 'storage-history':
        return (
          <div className="space-y-1.5 text-[10px] text-slate-300">
            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-cyan-400" />{history.length.toLocaleString()} {isArabic ? 'لقطة سعة' : 'capacity snapshots'}</div>
            {history.slice(-3).reverse().map((point) => (
              <div key={point.capturedAt} className="flex items-center justify-between gap-2 font-mono">
                <span className="text-slate-500">{new Date(point.capturedAt).toLocaleString()}</span>
                <span className="text-cyan-300">{formatStorageBytes(point.volumes.reduce((sum, volume) => sum + (volume.freeBytes || 0), 0))} free</span>
              </div>
            ))}
            {!history.length && <div className="text-amber-300">{isArabic ? 'لا توجد لقطات بعد.' : 'No snapshots captured yet.'}</div>}
            <button onClick={onNavigateFiles} className="text-cyan-300 underline">{isArabic ? 'فتح نطاق الملفات' : 'Open Files scope'}</button>
          </div>
        );
      case 'storage-removable':
        return (
          <div className="space-y-1.5 text-[10px] text-slate-300">
            <div className="text-amber-300">{isArabic ? 'نوع محرك الأقراص غير متاح من المزود الحالي؛ قد تشمل القائمة وحدات قابلة للإزالة دون تمييز.' : 'Drive type is not exposed by the current provider; removable volumes cannot be distinguished.'}</div>
            {volumes.slice(0, 5).map((volume) => <div key={volume.id} className="flex justify-between font-mono"><span>{volume.letter}</span><span>{formatStorageBytes(volume.totalBytes)}</span></div>)}
          </div>
        );
      default:
        return <div className="text-[10px] text-amber-300">{isArabic ? 'خدمة غير معروفة.' : 'Unknown service.'}</div>;
    }
  };

  return (
    <div data-testid="storage-service-focus" className="bg-[#07152b] rounded-xl p-3 border border-[#2476ff]/40 space-y-2 shadow-[0_0_12px_rgba(36,118,255,0.15)]">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#0f2545]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white min-w-0">
          <Copy className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">{isArabic ? meta.ar : meta.en}</span>
          <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${measured ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/60 text-amber-300 border-amber-500/40'}`}>
            {measured ? (isArabic ? 'مقيس' : 'MEASURED') : (isArabic ? 'تجريبي' : 'FIXTURE')}
          </span>
        </div>
        <button onClick={onClose} aria-label={isArabic ? 'إغلاق' : 'Close'} className="text-slate-500 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
      </div>
      <p className="text-[10px] text-slate-400">{isArabic ? meta.descAr : meta.descEn}</p>
      {renderBody()}
    </div>
  );
}
