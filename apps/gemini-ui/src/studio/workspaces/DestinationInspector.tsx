/**
 * KNOuX SmartOrganizer — Destination Inspector Workspace (Stage 5)
 *
 * Native mode uses the Windows folder picker and real volume capacity from the
 * read-only platform provider. No typed renderer path becomes an authorization,
 * and no execution/write capability is exposed here.
 */

import React, { useEffect, useState } from 'react';
import {
  Folder,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Compass,
  RefreshCw,
} from 'lucide-react';
import { useStudio } from '../context';
import { readSystemSummary } from '../../native/client';

interface DriveCard {
  mount: string;
  label: string;
  totalGb: number;
  freeGb: number;
  fs: string;
  measured: boolean;
}

const FIXTURE_DRIVES: DriveCard[] = [
  { mount: 'D:\\', label: 'Fast Storage SSD', totalGb: 2048, freeGb: 1420, fs: 'NTFS', measured: false },
  { mount: 'E:\\', label: 'Media Archive HDD', totalGb: 4096, freeGb: 890, fs: 'NTFS', measured: false },
  { mount: 'C:\\', label: 'System OS NVMe', totalGb: 1024, freeGb: 240, fs: 'NTFS', measured: false },
];

function gb(bytes: number | null | undefined): number {
  return typeof bytes === 'number' && Number.isFinite(bytes) ? Number((bytes / 1_000_000_000).toFixed(1)) : 0;
}

export function DestinationInspector() {
  const {
    destinationPath,
    setDestinationPath,
    operationMode,
    setOperationMode,
    setActiveStageId,
    chooseNativeDestination,
    native,
    locale,
  } = useStudio();

  const [drives, setDrives] = useState<DriveCard[]>(FIXTURE_DRIVES);
  const [volumeState, setVolumeState] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');

  useEffect(() => {
    if (!native.available) {
      setDrives(FIXTURE_DRIVES);
      setVolumeState('idle');
      return;
    }
    let active = true;
    setVolumeState('loading');
    void readSystemSummary()
      .then((envelope) => {
        if (!active) return;
        if (envelope?.status === 'complete' && envelope.data) {
          const measured = envelope.data.volumes.map((volume) => ({
            mount: volume.deviceId || '—',
            label: volume.label || 'Mounted volume',
            totalGb: gb(volume.sizeBytes),
            freeGb: gb(volume.freeBytes),
            fs: volume.fileSystem || '—',
            measured: true,
          }));
          setDrives(measured);
          setVolumeState(measured.length ? 'ready' : 'unavailable');
        } else {
          setDrives([]);
          setVolumeState('unavailable');
        }
      })
      .catch(() => {
        if (active) {
          setDrives([]);
          setVolumeState('unavailable');
        }
      });
    return () => {
      active = false;
    };
  }, [native.available]);

  const measured = native.mode === 'measured';
  const destination = native.destination?.path || (measured ? '' : destinationPath);
  const preserveOriginals = operationMode !== 'move';

  return (
    <div className="flex-1 px-6 py-2 overflow-y-auto studio-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Folder className="w-4 h-4" />
              <span>{locale === 'en' ? 'Target Output Volume' : 'وحدة التخزين والوجهة المستهدفة'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${measured ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/60 text-amber-300 border-amber-500/40'}`}>
                {measured ? (locale === 'en' ? 'MEASURED' : 'مقيس') : (locale === 'en' ? 'FIXTURE' : 'تجريبي')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {locale === 'en' ? 'Destination & Storage Strategy' : 'استراتيجية الوجهة والتخزين'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {locale === 'en'
                ? 'Choose a destination with the native picker. The path is validated below a real directory and checked for write access without writing anything. Planning remains read-only.'
                : 'اختر وجهة بمنتقي ويندوز. يتم التحقق من مسار حقيقي وفحص صلاحية الكتابة دون كتابة أي شيء. يظل التخطيط للقراءة فقط.'}
            </p>
          </div>

          <button
            onClick={() => setActiveStageId(6)}
            className="px-4 py-2 rounded-lg bg-[#2476ff] hover:bg-[#3282ff] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(36,118,255,0.4)] cursor-pointer shrink-0"
          >
            <span>{locale === 'en' ? 'Proceed to Plan Review' : 'الانتقال إلى مراجعة الخطة'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-cyan-400" />
              <span>{locale === 'en' ? 'Native destination grant' : 'تصريح الوجهة الأصلية'}</span>
            </h3>
            {native.available && (
              <button
                onClick={() => void chooseNativeDestination()}
                className="px-3 py-1.5 rounded-lg bg-[#0e274d] hover:bg-[#163c75] text-cyan-200 border border-[#2476ff]/60 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{locale === 'en' ? 'Choose native folder…' : 'اختيار مجلد أصلي…'}</span>
              </button>
            )}
          </div>

          {native.available ? (
            <div className="rounded-lg bg-[#050e1a] border border-[#0d213d] p-3">
              <div className="font-mono text-xs text-slate-200 break-all">
                {destination || (locale === 'en' ? 'No destination authorized. Virtual grouping preview can still be built.' : 'لا توجد وجهة مصرح بها. يمكن بناء معاينة تجميع افتراضية.')}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {locale === 'en'
                  ? 'Native grants are session-only. Re-authorize after restarting the application.'
                  : 'تصاريح الوجهة للجلسة فقط. أعد التصريح بعد إعادة تشغيل التطبيق.'}
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={destinationPath}
                onChange={(e) => setDestinationPath(e.target.value)}
                className="w-full bg-[#061226] border border-[#173766] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#2476ff]"
                placeholder="Fixture destination (browser preview only)"
              />
              <div className="text-[10px] text-amber-300/80">
                {locale === 'en' ? 'Fixture scenario — no native authorization exists in the browser preview.' : 'سيناريو تجريبي — لا يوجد تصريح أصلي في معاينة المتصفح.'}
              </div>
            </>
          )}
        </div>

        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>{locale === 'en' ? 'Storage Volume Capacity' : 'سعة وحدات التخزين'}</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              {measured ? (locale === 'en' ? 'Win32_LogicalDisk · read-only' : 'Win32_LogicalDisk · للقراءة فقط') : (locale === 'en' ? 'Fixture capacity' : 'سعة تجريبية')}
            </span>
          </div>

          {volumeState === 'loading' && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              {locale === 'en' ? 'Reading measured volumes…' : 'جارٍ قراءة وحدات التخزين…'}
            </div>
          )}
          {volumeState === 'unavailable' && (
            <div className="text-[11px] text-amber-300/90 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              {locale === 'en' ? 'Measured volume data is unavailable from the platform provider.' : 'بيانات وحدات التخزين المقيسة غير متاحة من مزود المنصة.'}
            </div>
          )}
          {drives.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {drives.map((drive) => {
                const usedGb = Math.max(0, drive.totalGb - drive.freeGb);
                const usedPercent = drive.totalGb ? Math.round((usedGb / drive.totalGb) * 100) : 0;
                return (
                  <div key={`${drive.mount}-${drive.label}`} className="p-3 rounded-lg bg-[#08182f] border border-[#142e56] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white font-mono">{drive.mount}</span>
                      <span className={`text-[10px] flex items-center gap-1 ${drive.measured ? 'text-cyan-300' : 'text-amber-300'}`}>
                        {drive.measured ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {drive.measured ? (locale === 'en' ? 'Measured' : 'مقيس') : (locale === 'en' ? 'Fixture' : 'تجريبي')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{drive.label} · {drive.fs}</div>
                    <div className="w-full h-2 rounded-full bg-[#050e1a] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#2476ff] to-[#26c6ff]" style={{ width: `${usedPercent}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{drive.freeGb} GB free</span>
                      <span>{drive.totalGb} GB total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!measured && (
            <div className="text-[10px] text-amber-300/80">
              {locale === 'en' ? 'These volume cards are design fixtures, not this device.' : 'بطاقات التخزين هذه بيانات تصميم وليست لهذا الجهاز.'}
            </div>
          )}
        </div>

        <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52] space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>{locale === 'en' ? 'Plan Mode (read-only)' : 'وضع الخطة (للقراءة فقط)'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'copy' as const, title: locale === 'en' ? 'Copy plan' : 'خطة نسخ', desc: locale === 'en' ? 'Preview copying originals to the destination. Originals remain untouched. No execution is exposed.' : 'معاينة نسخ الأصول إلى الوجهة. تبقى الأصول دون تغيير. لا تنفيذ مكشوف.' },
              { id: 'move' as const, title: locale === 'en' ? 'Move plan' : 'خطة نقل', desc: locale === 'en' ? 'Preview moving files after verified copies. Requires separate explicit approval and is blocked in this build.' : 'معاينة نقل الملفات بعد نسخ موثق. تتطلب موافقة صريحة منفصلة وهي محظورة في هذا البناء.' },
              { id: 'virtual' as const, title: locale === 'en' ? 'Virtual grouping' : 'تجميع افتراضي', desc: locale === 'en' ? 'Build a grouped plan without a destination. No shortcuts, links or files are written.' : 'بناء خطة مجمعة دون وجهة. لا تُكتب اختصارات أو روابط أو ملفات.' },
            ].map((mode) => (
              <div
                key={mode.id}
                onClick={() => setOperationMode(mode.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  operationMode === mode.id
                    ? 'bg-[#122e5a] border-[#2476ff] shadow-[0_0_12px_rgba(36,118,255,0.4)]'
                    : 'bg-[#08182f] hover:bg-[#0c203b] border-[#142e56]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="modeSelect"
                    checked={operationMode === mode.id}
                    onChange={() => setOperationMode(mode.id)}
                    className="accent-[#2476ff]"
                  />
                  <span className="text-xs font-bold text-white">{mode.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{mode.desc}</p>
              </div>
            ))}
          </div>

          <div className={`flex items-start gap-2 rounded-lg border p-2.5 text-[11px] ${preserveOriginals ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-amber-950/25 border-amber-500/40 text-amber-200'}`}>
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {locale === 'en'
                ? 'Read-only phase: building a plan never creates, copies, moves, overwrites or deletes a file. Execution and undo require a separately approved write capability.'
                : 'مرحلة قراءة فقط: بناء الخطة لا ينشئ أو ينسخ أو ينقل أو يستبدل أو يحذف ملفًا. التنفيذ والتراجع يتطلبان قدرة كتابة معتمدة منفصلة.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
