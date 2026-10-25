/**
 * KNOuX SmartOrganizer — Shared Design-Preview Modal
 *
 * Honest, reusable shell for preview-only surfaces that are reached from the
 * world pages (service change review, startup-type picker, activity viewer,
 * workflow previews). It deliberately states that nothing is connected to
 * Windows: every action stays inside the design fixture.
 */

import React from 'react';
import { X, ShieldCheck, Info, Zap, ChevronLeft } from 'lucide-react';

export interface DesignPreviewField {
  label: string;
  value: React.ReactNode;
  tone?: 'default' | 'muted' | 'emerald' | 'amber' | 'rose' | 'cyan';
}

export interface DesignPreviewModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  worldLabel?: string;
  icon?: React.ReactNode;
  fields?: DesignPreviewField[];
  children?: React.ReactNode;
  notice?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
  isArabic?: boolean;
}

const TONE_CLASS: Record<NonNullable<DesignPreviewField['tone']>, string> = {
  default: 'text-slate-100',
  muted: 'text-slate-400',
  emerald: 'text-emerald-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
  cyan: 'text-cyan-300',
};

export const DesignPreviewModal: React.FC<DesignPreviewModalProps> = ({
  open,
  title,
  subtitle,
  worldLabel,
  icon,
  fields = [],
  children,
  notice,
  confirmLabel,
  cancelLabel,
  confirmDisabled = false,
  onConfirm,
  onClose,
  isArabic = false,
}) => {
  if (!open) return null;

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none font-sans"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg bg-[#040a16] border border-[#1b3f70] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[92vh]">
        {/* Header */}
        <header className="px-4 py-3 bg-[#061226] border-b border-[#0f2444] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon}
            <div className="min-w-0">
              {worldLabel && (
                <div className="text-[10.5px] font-mono text-cyan-400 uppercase truncate">{worldLabel}</div>
              )}
              <h2 className="text-sm font-bold text-white tracking-wide leading-tight truncate">{title}</h2>
              {subtitle && <div className="text-[10.5px] text-slate-400 truncate">{subtitle}</div>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#081528] hover:bg-rose-950 hover:text-rose-300 border border-[#142e56] text-slate-400 transition cursor-pointer shrink-0"
            title={isArabic ? 'إغلاق' : 'Close'}
            aria-label={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Safety banner */}
        <div className="px-4 py-2 bg-[#050e1f] border-b border-[#0f2444] flex items-center gap-2 text-[10.5px] font-mono text-cyan-300 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">
            {isArabic
              ? 'معاينة تصميم فقط • غير متصل • لا يتم إجراء أي تغيير على ويندوز'
              : 'DESIGN PREVIEW • NOT CONNECTED • NO WINDOWS CHANGES'}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto knx-custom-scrollbar p-4 space-y-3">
          {fields.length > 0 && (
            <div className="rounded-xl bg-[#050e1f] border border-slate-800/80 p-3 space-y-1.5">
              {fields.map((f, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400 shrink-0">{f.label}</span>
                  <span className={`font-mono text-end truncate ${TONE_CLASS[f.tone ?? 'default']}`}>{f.value}</span>
                </div>
              ))}
            </div>
          )}

          {children}

          {notice && (
            <div className="flex items-start gap-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 px-3 py-2 text-[11px] text-cyan-200">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-cyan-400" />
              <div className="min-w-0">{notice}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-4 py-2.5 bg-[#050e1f] border-t border-[#0f2444] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 min-w-0">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              {isArabic
                ? 'التنفيذ الأصلي يتطلب المرحلة الثانية'
                : 'Phase Two Native Connection Required for Execution'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#081528] hover:bg-[#0e213e] text-slate-300 border border-[#142e56] font-medium text-xs cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{cancelLabel ?? (isArabic ? 'إلغاء' : 'Cancel')}</span>
            </button>

            {confirmLabel && (
              <button
                type="button"
                onClick={onConfirm}
                disabled={confirmDisabled || !onConfirm}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:hover:bg-slate-800 text-white disabled:border-slate-700 font-bold text-xs shadow-[0_0_12px_rgba(37,99,235,0.6)] cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>{confirmLabel}</span>
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DesignPreviewModal;
