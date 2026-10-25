import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  FolderOpen,
  HardDrive,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import type {
  BridgeStatusData,
  FolderChoiceData,
  NativeEnvelope,
  ServicesSummaryData,
  SystemSummaryData,
} from '../../shared/native-contracts';
import {
  chooseFolder as chooseNativeFolder,
  getNativeShell,
  readBridgeStatus,
  readServicesSummary,
  readSystemSummary,
} from './client';

interface NativeBridgePanelProps {
  open: boolean;
  onClose: () => void;
  isArabic: boolean;
}

type SectionState<T> = {
  loading: boolean;
  error: string | null;
  envelope: NativeEnvelope<T> | null;
};

const emptyState = <T,>(): SectionState<T> => ({ loading: false, error: null, envelope: null });

function formatBytes(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let amount = value;
  let index = 0;
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index += 1;
  }
  return `${amount.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatObserved(value: string | undefined, isArabic: boolean): string {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(isArabic ? 'ar' : 'en', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function providerStatusLabel(status: string | undefined, isArabic: boolean): string {
  const labels: Record<string, [string, string]> = {
    available: ['Available', 'متاح'],
    complete: ['Complete', 'مكتمل'],
    partial: ['Partial', 'جزئي'],
    unavailable: ['Unavailable', 'غير متاح'],
    unsupported: ['Unsupported', 'غير مدعوم'],
    permission_denied: ['Permission denied', 'مرفوض'],
    cancelled: ['Cancelled', 'أُلغي'],
    failed: ['Failed', 'فشل'],
  };
  return labels[status || ''] ? labels[status || ''][isArabic ? 1 : 0] : status || '—';
}

export const NativeBridgePanel: React.FC<NativeBridgePanelProps> = ({ open, onClose, isArabic }) => {
  const [status, setStatus] = useState<SectionState<BridgeStatusData>>(emptyState);
  const [system, setSystem] = useState<SectionState<SystemSummaryData>>(emptyState);
  const [services, setServices] = useState<SectionState<ServicesSummaryData>>(emptyState);
  const [folder, setFolder] = useState<SectionState<FolderChoiceData>>(emptyState);
  const bridge = getNativeShell();

  const loadStatus = useCallback(async () => {
    setStatus({ loading: true, error: null, envelope: null });
    try {
      const envelope = await readBridgeStatus();
      if (!envelope) {
        setStatus({ loading: false, error: isArabic ? 'جسر Electron غير متاح.' : 'The Electron bridge is not available.', envelope: null });
        return;
      }
      setStatus({ loading: false, error: null, envelope });
    } catch (error) {
      setStatus({ loading: false, error: error instanceof Error ? error.message : 'Bridge handshake failed.', envelope: null });
    }
  }, [isArabic]);

  const loadSystem = useCallback(async () => {
    setSystem({ loading: true, error: null, envelope: null });
    try {
      const envelope = await readSystemSummary();
      setSystem({ loading: false, error: null, envelope });
    } catch (error) {
      setSystem({ loading: false, error: error instanceof Error ? error.message : 'The system provider failed.', envelope: null });
    }
  }, []);

  const loadServices = useCallback(async () => {
    setServices({ loading: true, error: null, envelope: null });
    try {
      const envelope = await readServicesSummary();
      setServices({ loading: false, error: null, envelope });
    } catch (error) {
      setServices({ loading: false, error: error instanceof Error ? error.message : 'The service provider failed.', envelope: null });
    }
  }, []);

  const openFolderPicker = async () => {
    setFolder({ loading: true, error: null, envelope: null });
    try {
      const envelope = await chooseNativeFolder();
      setFolder({ loading: false, error: null, envelope });
    } catch (error) {
      setFolder({ loading: false, error: error instanceof Error ? error.message : 'The folder picker failed.', envelope: null });
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadStatus();
    void loadSystem();
  }, [open, loadStatus, loadSystem]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const statusData = status.envelope?.data;
  const isFixture = statusData?.providerMode === 'fixture';
  const systemData = system.envelope?.data;
  const serviceData = services.envelope?.data;
  const folderData = folder.envelope?.data;

  const panel = (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        data-testid="native-bridge-panel"
        role="dialog"
        aria-modal="true"
        aria-label={isArabic ? 'جسر النظام الأصلي للقراءة فقط' : 'Read-only native platform bridge'}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto knx-custom-scrollbar rounded-2xl bg-[#071329] border border-[#1b3f70] shadow-[0_28px_80px_rgba(0,0,0,0.75)] text-slate-100"
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-[#0f2545]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                {isArabic ? 'جسر النظام الأصلي' : 'Native platform bridge'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isArabic
                  ? 'قراءة فقط — لا توجد أي عملية تعديل أو حذف في هذه المرحلة.'
                  : 'Read-only platform gate — no mutation, deletion or elevation is exposed here.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0f2444] transition-colors cursor-pointer"
            aria-label={isArabic ? 'إغلاق' : 'Close'}
            title={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {isFixture && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {isArabic
                  ? 'وضع بيانات تطوير ثابتة مفعّل (KNOUX_NATIVE_FIXTURES=1). هذه ليست قراءات من الجهاز، والبناء النهائي يتجاهل هذا الوضع.'
                  : 'Development fixture mode is active (KNOUX_NATIVE_FIXTURES=1). These are not measured readings; the packaged build ignores this mode.'}
              </span>
            </div>
          )}

          {status.loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              {isArabic ? 'جارٍ التحقق من العقد الإصدار 1…' : 'Verifying contract v1…'}
            </div>
          )}
          {status.error && <div className="text-xs text-rose-300">{status.error}</div>}

          {statusData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
              <div className="p-2.5 rounded-lg bg-[#0a182e] border border-[#132c52]">
                <div className="text-slate-400">{isArabic ? 'الحالة' : 'State'}</div>
                <div className="font-bold text-emerald-300 mt-0.5">{isArabic ? 'جاهز' : 'Ready'}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0a182e] border border-[#132c52]">
                <div className="text-slate-400">{isArabic ? 'المصدر' : 'Provider mode'}</div>
                <div className={`font-bold mt-0.5 ${isFixture ? 'text-amber-300' : 'text-cyan-300'}`}>
                  {isFixture ? (isArabic ? 'بيانات تطوير' : 'Fixture') : isArabic ? 'قياس فعلي' : 'Measured'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0a182e] border border-[#132c52]">
                <div className="text-slate-400">{isArabic ? 'العقد' : 'Contract'}</div>
                <div className="font-bold text-slate-200 mt-0.5">v{statusData.contractVersion}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0a182e] border border-[#132c52]">
                <div className="text-slate-400">Electron</div>
                <div className="font-bold text-slate-200 mt-0.5">{statusData.electronVersion || '—'}</div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-[#132c52] bg-[#061226] p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                {isArabic ? 'ملخص الجهاز (قراءة فقط)' : 'Machine summary (read-only)'}
              </h3>
              <button
                onClick={() => void loadSystem()}
                disabled={system.loading}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#0a1a38] border border-[#1b3f70] text-[10px] text-cyan-300 hover:bg-[#122b54] disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${system.loading ? 'animate-spin' : ''}`} />
                {isArabic ? 'قراءة' : 'Read'}
              </button>
            </div>
            {system.loading && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                {isArabic ? 'جارٍ استدعاء مزوّد Windows عبر IPC…' : 'Calling the Windows provider over IPC…'}
              </div>
            )}
            {system.error && <div className="text-[11px] text-rose-300">{system.error}</div>}
            {system.envelope?.status && !system.loading && (
              <div className="text-[10px] text-slate-500 mb-2">
                {providerStatusLabel(system.envelope.status, isArabic)} · {system.envelope.source} · {formatObserved(system.envelope.observedAt, isArabic)}
              </div>
            )}
            {systemData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 w-24 shrink-0">{isArabic ? 'النظام' : 'OS'}</span>
                  <span className="text-slate-200">{systemData.osCaption || '—'} {systemData.osBuild ? `(${systemData.osBuild})` : ''}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 w-24 shrink-0">{isArabic ? 'المعالج' : 'CPU'}</span>
                  <span dir="ltr" title={systemData.cpuModel || undefined} className="text-slate-200 truncate">{systemData.cpuModel || '—'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 w-24 shrink-0">{isArabic ? 'حمل المعالج' : 'CPU load'}</span>
                  <span className="text-slate-200">{systemData.cpuLoadPercent != null ? `${systemData.cpuLoadPercent}%` : '—'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 w-24 shrink-0">{isArabic ? 'الذاكرة' : 'Memory'}</span>
                  <span className="text-slate-200">
                    {systemData.memoryUsedPercent != null ? `${systemData.memoryUsedPercent}%` : '—'} · {formatBytes(systemData.memoryFreeBytes)} {isArabic ? 'متاحة' : 'free'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 w-24 shrink-0">{isArabic ? 'قرص النظام' : 'System drive'}</span>
                  <span className="text-slate-200">
                    {systemData.systemDrive || '—'} · {formatBytes(systemData.systemDriveFreeBytes)} {isArabic ? 'حرة' : 'free'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 w-24 shrink-0">{isArabic ? 'الأقراص' : 'Volumes'}</span>
                  <span className="text-slate-200">{systemData.volumes.length}</span>
                </div>
              </div>
            )}
            {system.envelope?.warnings?.map((warning) => (
              <div key={warning} className="mt-2 text-[10px] text-amber-300/90">{warning}</div>
            ))}
          </div>

          <div className="rounded-xl border border-[#132c52] bg-[#061226] p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                {isArabic ? 'ملخص خدمات ويندوز' : 'Windows services summary'}
              </h3>
              <button
                onClick={() => void loadServices()}
                disabled={services.loading}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#0a1a38] border border-[#1b3f70] text-[10px] text-cyan-300 hover:bg-[#122b54] disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${services.loading ? 'animate-spin' : ''}`} />
                {isArabic ? 'عدّ الخدمات' : 'Count services'}
              </button>
            </div>
            {services.loading && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                {isArabic ? 'جارٍ قراءة Win32_Service…' : 'Reading Win32_Service…'}
              </div>
            )}
            {services.error && <div className="text-[11px] text-rose-300">{services.error}</div>}
            {serviceData && (
              <>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {services.envelope?.source} · {formatObserved(services.envelope?.observedAt, isArabic)}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-[10px]">
                  {[
                    [isArabic ? 'الكل' : 'Total', serviceData.total],
                    [isArabic ? 'يعمل' : 'Running', serviceData.running],
                    [isArabic ? 'متوقف' : 'Stopped', serviceData.stopped],
                    [isArabic ? 'تلقائي' : 'Automatic', serviceData.automatic],
                    [isArabic ? 'يدوي' : 'Manual', serviceData.manual],
                    [isArabic ? 'معطل' : 'Disabled', serviceData.disabled],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="p-1.5 rounded bg-[#0a182e] border border-[#132c52]">
                      <div className="text-slate-500">{label}</div>
                      <div className="font-bold text-slate-200 font-mono mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-[#132c52] bg-[#061226] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                  {isArabic ? 'اختيار مجلد (بدون فحص)' : 'Folder picker (no scan)'}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {isArabic ? 'اختيار صريح من المستخدم؛ لا يقرأ الجسر محتويات المجلد.' : 'Explicit user action; the bridge does not read the folder contents.'}
                </p>
              </div>
              <button
                onClick={() => void openFolderPicker()}
                disabled={folder.loading}
                className="px-2.5 py-1.5 rounded-lg bg-[#0e274d] hover:bg-[#163c75] text-cyan-200 border border-[#2476ff]/60 text-[10px] font-semibold disabled:opacity-50 cursor-pointer"
              >
                {folder.loading ? (isArabic ? 'جارٍ الاختيار…' : 'Choosing…') : isArabic ? 'اختيار مجلد…' : 'Choose folder…'}
              </button>
            </div>
            {folderData && (
              <div className="mt-2 text-[10px] font-mono text-slate-300 break-all">
                {folderData.canceled ? (isArabic ? 'أُلغي الاختيار.' : 'Selection cancelled.') : folderData.path}
              </div>
            )}
            {folder.error && <div className="mt-2 text-[10px] text-rose-300">{folder.error}</div>}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <HardDrive className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>
              {isArabic
                ? 'هذه القراءات محلية فقط ولا تُرسل إلى أي خدمة خارجية. لا توجد عمليات كتابة في جسر المنصة.'
                : 'These readings stay local and are not sent to an external service. The platform bridge exposes no write operations.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return bridge ? createPortal(panel, document.body) : null;
};
