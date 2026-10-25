/**
 * KNOuX SmartOrganizer — Execution Monitor Workspace (Stage 7)
 *
 * The platform gate deliberately exposes no write/execute capability. This
 * stage therefore reports a blocked execution state instead of animating a
 * simulated success. Nothing here creates, moves, overwrites or deletes a file.
 */

import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CircleSlash,
  FileCheck,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { useStudio } from '../context';

export function ExecutionMonitor() {
  const { setActiveStageId, operationMode, native, locale } = useStudio();
  const plan = native.plan;
  const measured = native.mode === 'measured';

  return (
    <div className="flex-1 px-6 py-2 overflow-y-auto studio-scrollbar select-none">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="studio-glass-panel rounded-xl p-5 border border-rose-500/40 bg-rose-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <CircleSlash className="w-4 h-4" />
              <span>{locale === 'en' ? 'Write Capability Blocked' : 'قدرة الكتابة محظورة'}</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {locale === 'en' ? 'Execution Is Not Available in This Build' : 'التنفيذ غير متاح في هذا البناء'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {locale === 'en'
                ? 'The secure platform bridge currently exposes read-only discovery and immutable plan previews. No file copy, move, overwrite, delete or undo operation is reachable. Real execution requires a separately reviewed write capability and explicit user approval.'
                : 'جسر المنصة الآمن يكشف حاليًا الاكتشاف للقراءة فقط ومعاينات الخطط غير القابلة للتعديل. لا يمكن الوصول إلى نسخ أو نقل أو استبدال أو حذف أو تراجع. يتطلب التنفيذ الحقيقي قدرة كتابة مراجعة منفصلة وموافقة صريحة.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveStageId(6)}
              className="px-4 py-2 rounded-lg bg-[#0e2447] hover:bg-[#153463] text-cyan-200 border border-[#2476ff]/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{locale === 'en' ? 'Back to Plan Review' : 'العودة إلى مراجعة الخطة'}</span>
            </button>
            <button
              onClick={() => setActiveStageId(8)}
              className="px-4 py-2 rounded-lg bg-[#0a1c38] hover:bg-[#122e57] text-slate-300 border border-[#173766] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{locale === 'en' ? 'Preview receipts' : 'إيصالات المعاينة'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52]">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              {locale === 'en' ? 'Immutable preview' : 'معاينة غير قابلة للتعديل'}
            </div>
            <div className="text-sm font-bold text-white mt-2">
              {plan ? `${plan.totals.files.toLocaleString()} ${locale === 'en' ? 'files' : 'ملف'}` : (locale === 'en' ? 'No plan built' : 'لا توجد خطة')}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              {plan ? `Plan ${plan.planHash.slice(0, 12)}` : (measured ? (locale === 'en' ? 'Build a plan in Stage 6.' : 'ابنِ خطة في المرحلة 6.') : (locale === 'en' ? 'Fixture mode' : 'وضع تجريبي'))}
            </div>
          </div>

          <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52]">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              {locale === 'en' ? 'Plan mode' : 'وضع الخطة'}
            </div>
            <div className="text-sm font-bold text-white mt-2 uppercase">{operationMode}</div>
            <div className="text-[10px] text-slate-500 mt-1">
              {locale === 'en' ? 'No write is performed in preview.' : 'لا تُنفذ كتابة في المعاينة.'}
            </div>
          </div>

          <div className="studio-glass-panel rounded-xl p-4 border border-[#132c52]">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Activity className="w-4 h-4 text-cyan-400" />
              {locale === 'en' ? 'Postcondition' : 'التحقق بعد العملية'}
            </div>
            <div className="text-sm font-bold text-amber-300 mt-2">
              {locale === 'en' ? 'Not executed' : 'لم يُنفذ'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {locale === 'en' ? 'No receipt exists because no file was touched.' : 'لا يوجد إيصال لأن أي ملف لم يُلمس.'}
            </div>
          </div>
        </div>

        <div className="studio-glass-panel rounded-xl p-5 border border-[#132c52] flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-2 text-xs text-slate-300">
            <div className="font-bold text-white">{locale === 'en' ? 'Safety gate' : 'بوابة الأمان'}</div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{locale === 'en' ? 'The previous animated execution was a visual simulation and has been removed. No progress or success is claimed without a real backend.' : 'محاكاة التنفيذ المتحركة السابقة كانت عرضًا بصريًا وقد أُزيلت. لا يُدعى أي تقدم أو نجاح دون خلفية حقيقية.'}</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{locale === 'en' ? 'A future execution mission must provide a fixed capability, an approval gate, bounded cancellation, verified postconditions, a journal and only technically possible rollback.' : 'مهمة التنفيذ المستقبلية يجب أن توفر قدرة ثابتة، بوابة موافقة، إلغاء محدود، تحققًا من النتائج، سجلًا، وتراجعًا ممكنًا تقنيًا فقط.'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
