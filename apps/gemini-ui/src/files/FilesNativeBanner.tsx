import React from 'react';
import { AlertTriangle, FolderPlus, Loader2, RefreshCw, ShieldCheck, Ban } from 'lucide-react';
import { formatBytes } from './useFilesNative';
import type { FilesOverview } from '../../shared/native-contracts';

interface FilesNativeBannerProps {
  locale: 'en' | 'ar';
  available: boolean;
  mode: 'fixture' | 'measured';
  overview: FilesOverview | null;
  scanning: boolean;
  progress: { files: number; folders: number; bytes: number } | null;
  error: string | null;
  warnings: string[];
  onAdd: () => void;
  onRescan: () => void;
  onCancel: () => void;
}

export function FilesNativeBanner({
  locale,
  available,
  mode,
  overview,
  scanning,
  progress,
  error,
  warnings,
  onAdd,
  onRescan,
  onCancel,
}: FilesNativeBannerProps) {
  const measured = mode === 'measured';
  const tone = error ? 'rose' : measured ? 'emerald' : 'amber';
  const toneClass =
    tone === 'rose'
      ? 'border-rose-500/40 bg-rose-950/20 text-rose-200'
      : tone === 'emerald'
      ? 'border-emerald-500/35 bg-emerald-950/20 text-emerald-200'
      : 'border-amber-500/40 bg-amber-950/20 text-amber-200';

  return (
    <div
      data-testid="files-native-banner"
      className={`relative z-10 mb-2 rounded-lg border px-3 py-1.5 text-[10px] flex flex-wrap items-center gap-x-3 gap-y-1 select-none ${toneClass}`}
    >
      <span className="flex items-center gap-1.5 font-semibold">
        {error ? <AlertTriangle className="w-3.5 h-3.5" /> : measured ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        {error
          ? (locale === 'en' ? 'Files provider error' : 'خطأ في مزود الملفات')
          : measured
          ? (locale === 'en' ? 'Native measured index — read-only' : 'فهرس أصلي مقيس — للقراءة فقط')
          : available
          ? (locale === 'en' ? 'Native bridge ready — authorize a folder' : 'الجسر الأصلي جاهز — مصرّح بمجلد')
          : (locale === 'en' ? 'Design fixture preview — not this device' : 'معاينة تصميم تجريبية — ليست لهذا الجهاز')}
      </span>

      {measured && overview && (
        <>
          <span className="font-mono text-slate-200">
            {overview.totals.files.toLocaleString()} {locale === 'en' ? 'files' : 'ملف'} · {formatBytes(overview.totals.bytes)} · {overview.totals.folders.toLocaleString()} {locale === 'en' ? 'folders' : 'مجلد'}
          </span>
          <span className="text-slate-400 font-mono truncate max-w-[280px]" title={overview.source.path}>
            {overview.source.label}
          </span>
          {overview.coverage === 'partial' && (
            <span className="text-amber-300">{locale === 'en' ? 'Partial index' : 'فهرس جزئي'}</span>
          )}
        </>
      )}

      {scanning && (
        <span className="flex items-center gap-1.5 text-cyan-200">
          <Loader2 className="w-3 h-3 animate-spin" />
          {progress
            ? `${progress.files.toLocaleString()} ${locale === 'en' ? 'files' : 'ملف'} · ${progress.folders.toLocaleString()} ${locale === 'en' ? 'folders' : 'مجلد'}`
            : (locale === 'en' ? 'Indexing metadata…' : 'جارٍ فهرسة البيانات…')}
          <button onClick={onCancel} className="underline hover:text-white cursor-pointer">
            {locale === 'en' ? 'cancel' : 'إلغاء'}
          </button>
        </span>
      )}

      {error && <span className="max-w-[420px] truncate" title={error}>{error}</span>}
      {warnings.slice(0, 2).map((warning) => {
        const localized =
          locale === 'ar' && warning.includes('Windows file attributes')
            ? 'سمات ملفات Windows غير متاحة من مزود البيانات الوصفية الحالي.'
            : warning;
        return (
          <span key={warning} className="flex items-center gap-1 text-amber-300/90 max-w-[360px] truncate" title={localized}>
            <Ban className="w-3 h-3 shrink-0" />
            {localized}
          </span>
        );
      })}

      <span className="ml-auto flex items-center gap-1.5">
        {available ? (
          <>
            <button
              onClick={onAdd}
              disabled={scanning}
              className="px-2 py-0.5 rounded border border-current/30 hover:border-current flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <FolderPlus className="w-3 h-3" />
              {locale === 'en' ? 'Add folder' : 'إضافة مجلد'}
            </button>
            <button
              onClick={onRescan}
              disabled={scanning || !overview}
              className="px-2 py-0.5 rounded border border-current/30 hover:border-current flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
              {locale === 'en' ? 'Rescan' : 'إعادة فحص'}
            </button>
          </>
        ) : (
          <span>{locale === 'en' ? 'Open the Electron client to index real folders.' : 'افتح عميل Electron لفهرسة مجلدات حقيقية.'}</span>
        )}
        <span className="font-mono text-slate-400">
          {locale === 'en' ? 'Metadata-only · no mutation' : 'بيانات وصفية فقط · دون تعديل'}
        </span>
      </span>
    </div>
  );
}
