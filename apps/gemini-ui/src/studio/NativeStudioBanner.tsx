/**
 * Studio provenance and safety banner.
 *
 * It always states whether the visible inventory is measured or a fixture and
 * makes the read-only execution boundary visible before the user reaches the
 * plan stage.
 */
import React from 'react';
import { AlertTriangle, FolderPlus, Loader2, RefreshCw, ShieldCheck, Ban } from 'lucide-react';
import { useStudio } from './context';

export function NativeStudioBanner() {
  const {
    native,
    inventory,
    addNativeSource,
    scanActiveSource,
    cancelActiveScan,
    setActiveStageId,
    locale,
  } = useStudio();

  const measured = native.mode === 'measured';
  const tone = native.error ? 'rose' : measured ? 'emerald' : 'amber';
  const toneClass =
    tone === 'rose'
      ? 'border-rose-500/40 bg-rose-950/20 text-rose-200'
      : tone === 'emerald'
      ? 'border-emerald-500/35 bg-emerald-950/20 text-emerald-200'
      : 'border-amber-500/40 bg-amber-950/20 text-amber-200';

  return (
    <div
      data-testid="studio-native-banner"
      className={`mx-6 my-1.5 rounded-lg border px-3 py-1.5 text-[10px] flex flex-wrap items-center gap-x-3 gap-y-1 select-none ${toneClass}`}
    >
      <span className="flex items-center gap-1.5 font-semibold">
        {native.error ? <AlertTriangle className="w-3.5 h-3.5" /> : measured ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        {measured
          ? locale === 'en'
            ? 'Native measured index — read-only'
            : 'فهرس أصلي مقيس — للقراءة فقط'
          : locale === 'en'
          ? 'Design fixture preview — not this device'
          : 'معاينة تصميم تجريبية — ليست لهذا الجهاز'}
      </span>

      {measured && (
        <span className="font-mono text-slate-300">
          {inventory.totalFiles.toLocaleString()} {locale === 'en' ? 'files' : 'ملف'} · {inventory.totalSizeGb} GB · {inventory.totalFolders.toLocaleString()} {locale === 'en' ? 'folders' : 'مجلد'}
        </span>
      )}

      {native.scanning && (
        <span className="flex items-center gap-1.5 text-cyan-200">
          <Loader2 className="w-3 h-3 animate-spin" />
          {native.progress
            ? `${native.progress.files.toLocaleString()} files · ${native.progress.folders.toLocaleString()} folders`
            : locale === 'en'
            ? 'Indexing metadata…'
            : 'جارٍ فهرسة البيانات…'}
          <button onClick={() => void cancelActiveScan()} className="underline hover:text-white cursor-pointer">
            {locale === 'en' ? 'cancel' : 'إلغاء'}
          </button>
        </span>
      )}

      <span className="font-mono text-slate-400">
        {locale === 'en'
          ? 'Plan preview only — execution/undo blocked'
          : 'معاينة خطة فقط — التنفيذ/التراجع محظور'}
      </span>

      {native.warnings.slice(0, 2).map((warning) => (
        <span key={warning} className="flex items-center gap-1 text-amber-300/90 max-w-[420px] truncate" title={warning}>
          <Ban className="w-3 h-3 shrink-0" />
          {warning}
        </span>
      ))}
      {native.error && <span className="max-w-[520px] truncate" title={native.error}>{native.error}</span>}

      <span className="ml-auto flex items-center gap-1.5">
        {native.available ? (
          <>
            <button
              onClick={() => void addNativeSource()}
              disabled={native.scanning}
              className="px-2 py-0.5 rounded border border-current/30 hover:border-current flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <FolderPlus className="w-3 h-3" />
              {locale === 'en' ? 'Add folder' : 'إضافة مجلد'}
            </button>
            <button
              onClick={() => void scanActiveSource()}
              disabled={native.scanning}
              className="px-2 py-0.5 rounded border border-current/30 hover:border-current flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${native.scanning ? 'animate-spin' : ''}`} />
              {locale === 'en' ? 'Rescan' : 'إعادة فحص'}
            </button>
          </>
        ) : (
          <span>{locale === 'en' ? 'Open the Electron client to index real folders.' : 'افتح عميل Electron لفهرسة مجلدات حقيقية.'}</span>
        )}
        <button
          onClick={() => setActiveStageId(1)}
          className="px-2 py-0.5 rounded border border-current/30 hover:border-current cursor-pointer"
        >
          {locale === 'en' ? 'Sources' : 'المصادر'}
        </button>
      </span>
    </div>
  );
}
