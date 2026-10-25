/**
 * RecoveryLab.tsx
 * ------------------------------------------------------------------------
 * UI-ONLY page composition for the Repair / Recovery Lab screen.
 *
 * This component mounts INSIDE the existing AppShell (sidebar/header are
 * provided by the host app and are not reproduced here). It is purely a
 * frontend state machine: selecting a tool, expanding the stepper, opening
 * a review-only dialog, copying inert text, and exporting a clearly-labeled
 * unverified notes file. No native bridge, IPC, execution, or network calls.
 */

import React, { useMemo, useState, type ReactNode } from 'react';
import {
  Cpu,
  FileText,
  Globe,
  BookOpen,
  ShieldCheck,
  ScanSearch,
  Wrench,
  FileCheck2,
  FileCog,
  Globe2,
  Network,
  Router as RouterIcon,
  History,
  LifeBuoy,
  RotateCcw,
  RefreshCcw,
  ArrowRight,
  Eye,
  ClipboardList,
  Download,
  XCircle,
  Lock,
} from 'lucide-react';
import {
  REPAIR_TOOLS,
  GUIDED_SEQUENCE,
  getDefaultSelectedToolId,
  Locale,
  RepairToolId,
  RepairIconKey,
} from './repair-ui-data';
import RepairServicePreview from './RepairServicePreview';

const TOOL_ICONS: Record<RepairIconKey, typeof ShieldCheck> = {
  ShieldCheck,
  ScanSearch,
  Wrench,
  FileCheck2,
  FileCog,
  Globe2,
  Network,
  RouterIcon,
  History,
  LifeBuoy,
  RotateCcw,
  RefreshCcw,
};

export interface RepairHistoryEntry {
  id: string;
  dateTime: string;
  tool: string;
  result: string;
  details?: string;
}

export interface RecoveryLabProps {
  /** Locale read from the host app's store; defaults to 'en'. */
  locale?: Locale;
  /** Text direction; derived from locale when not provided. */
  dir?: 'ltr' | 'rtl';
  /**
   * Already-read, typed history entries from existing app state, if any.
   * This component never fetches or invents history — an empty/undefined
   * value renders an honest empty state.
   */
  historyEntries?: RepairHistoryEntry[];
  children?: ReactNode;
}

function t<T extends { en: string; ar: string }>(field: T, locale: Locale): string {
  return locale === 'ar' ? field.ar : field.en;
}

export const RecoveryLab: React.FC<RecoveryLabProps> = ({
  locale = 'en',
  dir,
  historyEntries,
  children,
}) => {
  const resolvedDir = dir ?? (locale === 'ar' ? 'rtl' : 'ltr');
  const [selectedId, setSelectedId] = useState<RepairToolId>(getDefaultSelectedToolId());
  const [activeStageId, setActiveStageId] = useState<string>(GUIDED_SEQUENCE[2].id); // "Choose Repair" default focus
  const [reviewOpen, setReviewOpen] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const selectedTool = useMemo(
    () => REPAIR_TOOLS.find((tool) => tool.id === selectedId) ?? REPAIR_TOOLS[0],
    [selectedId],
  );

  const history = historyEntries ?? [];

  const handleSelectTool = (id: RepairToolId) => {
    setSelectedId(id);
    setActiveStageId('choose-repair');
  };

  const handleExportNotes = () => {
    const lines = [
      'KNOuX Recovery Lab — Diagnostic Notes (UNVERIFIED PREVIEW)',
      '============================================================',
      `Tool: ${t(selectedTool.name, locale)}`,
      `Status: Preview only — no operation has been executed.`,
      '',
      'What it does:',
      ...selectedTool.whatItDoes[locale].map((l) => `  - ${l}`),
      '',
      `Privilege requirement: ${t(
        { en: 'see inspector panel', ar: 'انظر لوحة الفحص' },
        locale,
      )}`,
      `Potential impact / risk: ${t(selectedTool.riskNote, locale)}`,
      '',
      'This file contains illustrative UI notes only. It does not represent',
      'the result of any executed scan, repair, or system measurement.',
    ].join('\n');

    try {
      const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recovery-lab-notes-${selectedTool.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNote(t({ en: 'Notes exported (unverified preview).', ar: 'تم تصدير الملاحظات (معاينة غير موثّقة).' }, locale));
    } catch {
      setExportNote(
        t(
          { en: 'Export unavailable in this environment — notes copied to view instead.', ar: 'التصدير غير متاح في هذه البيئة — تم عرض الملاحظات بدلاً من ذلك.' },
          locale,
        ),
      );
    }
    window.setTimeout(() => setExportNote(null), 3200);
  };

  const handleCancel = () => {
    setReviewOpen(false);
  };

  return (
    <div className="knx-recovery" dir={resolvedDir}>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="knx-recovery-hero" aria-label={t({ en: 'Recovery Lab', ar: 'مختبر الاستعادة' }, locale)}>
        <div className="knx-recovery-hero__orb" aria-hidden="true" />
        <div className="knx-recovery-hero__text">
          <h1>{t({ en: 'Recovery Lab', ar: 'مختبر الاستعادة' }, locale)}</h1>
          <p>
            {t(
              {
                en: 'Diagnose Windows problems. Understand each repair before authorizing it.',
                ar: 'شخّص مشكلات Windows. افهم كل إصلاح قبل التفويض به.',
              },
              locale,
            )}
          </p>
        </div>
        <div className="knx-recovery-hero__signage" aria-hidden="true">
          <span className="knx-recovery-hero__signage-title">KNOuX</span>
          <span className="knx-recovery-hero__signage-sub">{t({ en: 'RECOVERY LAB', ar: 'مختبر الاستعادة' }, locale)}</span>
          <div className="knx-recovery-hero__micro">
            <span>{t({ en: 'Diagnose', ar: 'تشخيص' }, locale)}</span>
            <span>{t({ en: 'Understand', ar: 'فهم' }, locale)}</span>
            <span>{t({ en: 'Repair', ar: 'إصلاح' }, locale)}</span>
            <span>{t({ en: 'Restore', ar: 'استعادة' }, locale)}</span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Status cards                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="knx-recovery-status" aria-label={t({ en: 'System status overview', ar: 'نظرة عامة على حالة النظام' }, locale)}>
        <article className="knx-recovery-status-card">
          <Cpu size={18} aria-hidden="true" />
          <div>
            <h3>{t({ en: 'System Components', ar: 'مكونات النظام' }, locale)}</h3>
            <p>{t({ en: 'Not checked', ar: 'لم يتم الفحص' }, locale)}</p>
          </div>
        </article>
        <article className="knx-recovery-status-card">
          <FileText size={18} aria-hidden="true" />
          <div>
            <h3>{t({ en: 'Windows File Integrity', ar: 'سلامة ملفات Windows' }, locale)}</h3>
            <p>{t({ en: 'Awaiting inspection', ar: 'بانتظار الفحص' }, locale)}</p>
          </div>
        </article>
        <article className="knx-recovery-status-card">
          <Globe size={18} aria-hidden="true" />
          <div>
            <h3>{t({ en: 'Network Configuration', ar: 'إعدادات الشبكة' }, locale)}</h3>
            <p>{t({ en: 'No verified reading', ar: 'لا توجد قراءة موثّقة' }, locale)}</p>
          </div>
        </article>
        <article className="knx-recovery-status-card">
          <BookOpen size={18} aria-hidden="true" />
          <div>
            <h3>{t({ en: 'Repair Journal', ar: 'سجل الإصلاحات' }, locale)}</h3>
            <p>{history.length} {t({ en: 'repairs this session', ar: 'إصلاحات في هذه الجلسة' }, locale)}</p>
          </div>
        </article>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Main content: tool rack + guided sequence/workspace               */}
      {/* ---------------------------------------------------------------- */}
      <section className="knx-recovery-main">
        <div className="knx-recovery-rack">
          <h2 className="knx-recovery-section-title">
            {t({ en: 'Repair Tools', ar: 'أدوات الإصلاح' }, locale)} ({REPAIR_TOOLS.length})
          </h2>
          <div className="knx-recovery-grid" role="list">
            {REPAIR_TOOLS.map((tool) => {
              const Icon = TOOL_ICONS[tool.icon];
              const selected = tool.id === selectedId;
              return (
                <article
                  key={tool.id}
                  role="listitem"
                  className={`knx-recovery-card${selected ? ' knx-recovery-card--selected' : ''}`}
                >
                  <div className="knx-recovery-card__icon" aria-hidden="true">
                    <Icon size={20} />
                  </div>
                  <h3 className="knx-recovery-card__title">{t(tool.name, locale)}</h3>
                  <p className="knx-recovery-card__desc">{t(tool.shortDescription, locale)}</p>
                  <span className="knx-recovery-card__badge">{t(tool.badgeCapability, locale)}</span>
                  <button
                    type="button"
                    className="knx-recovery-card__preview-btn"
                    onClick={() => handleSelectTool(tool.id)}
                    aria-pressed={selected}
                    aria-label={`${t({ en: 'Preview', ar: 'معاينة' }, locale)}: ${t(tool.name, locale)}`}
                  >
                    <Eye size={14} aria-hidden="true" />
                    {t({ en: 'Preview', ar: 'معاينة' }, locale)}
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        <div className="knx-recovery-analysis">
          <h2 className="knx-recovery-section-title">{t({ en: 'Guided Repair Sequence', ar: 'تسلسل الإصلاح الموجّه' }, locale)}</h2>
          <ol className="knx-recovery-stepper" aria-label={t({ en: 'Guided repair stages, explanatory only', ar: 'مراحل الإصلاح الموجّه، للشرح فقط' }, locale)}>
            {GUIDED_SEQUENCE.map((stage, i) => (
              <li key={stage.id} className="knx-recovery-stepper__item">
                <button
                  type="button"
                  className={`knx-recovery-stepper__node${activeStageId === stage.id ? ' knx-recovery-stepper__node--active' : ''}`}
                  onClick={() => setActiveStageId(stage.id)}
                  aria-current={activeStageId === stage.id ? 'step' : undefined}
                >
                  {stage.index}
                </button>
                <div className="knx-recovery-stepper__label">
                  <span>{t(stage.label, locale)}</span>
                  <small>{t(stage.description, locale)}</small>
                </div>
                {i < GUIDED_SEQUENCE.length - 1 && (
                  <ArrowRight size={14} className="knx-recovery-stepper__arrow" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>

          <RepairServicePreview
            tool={selectedTool}
            locale={locale}
            reviewOpen={reviewOpen}
            onCloseReview={handleCancel}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* History + actions                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="knx-recovery-footer">
        <div className="knx-recovery-history">
          <h2 className="knx-recovery-section-title">{t({ en: 'Recent Repair History', ar: 'سجل الإصلاحات الأخير' }, locale)}</h2>
          <div className="knx-recovery-history__table" role="table">
            <div className="knx-recovery-history__row knx-recovery-history__row--head" role="row">
              <span role="columnheader">{t({ en: 'Date & Time', ar: 'التاريخ والوقت' }, locale)}</span>
              <span role="columnheader">{t({ en: 'Tool', ar: 'الأداة' }, locale)}</span>
              <span role="columnheader">{t({ en: 'Result', ar: 'النتيجة' }, locale)}</span>
              <span role="columnheader">{t({ en: 'Details', ar: 'التفاصيل' }, locale)}</span>
            </div>
            {history.length === 0 ? (
              <div className="knx-recovery-history__empty">
                <ClipboardList size={24} aria-hidden="true" />
                <p>{t({ en: 'No repair operations yet', ar: 'لا توجد عمليات إصلاح بعد' }, locale)}</p>
                <small>{t({ en: 'Your repair history will appear here after you run a tool.', ar: 'سيظهر سجل الإصلاحات هنا بعد تشغيل إحدى الأدوات.' }, locale)}</small>
              </div>
            ) : (
              history.map((entry) => (
                <div className="knx-recovery-history__row" role="row" key={entry.id}>
                  <span role="cell">{entry.dateTime}</span>
                  <span role="cell">{entry.tool}</span>
                  <span role="cell">{entry.result}</span>
                  <span role="cell">{entry.details ?? '—'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="knx-recovery-actions">
          <h2 className="knx-recovery-section-title">{t({ en: 'Actions', ar: 'الإجراءات' }, locale)}</h2>
          <button type="button" className="knx-recovery-btn knx-recovery-btn--primary" onClick={() => setReviewOpen(true)}>
            <ClipboardList size={15} aria-hidden="true" />
            <span>
              {t({ en: 'Review Repair', ar: 'مراجعة الإصلاح' }, locale)}
              <small>{t({ en: 'See full details, impact and what to expect.', ar: 'الاطلاع على التفاصيل والأثر وما يُتوقّع.' }, locale)}</small>
            </span>
          </button>
          <button type="button" className="knx-recovery-btn knx-recovery-btn--secondary" onClick={() => setReviewOpen(true)}>
            <FileCheck2 size={15} aria-hidden="true" />
            <span>
              {t({ en: 'View Prerequisites', ar: 'عرض المتطلبات' }, locale)}
              <small>{t({ en: 'Check requirements and system readiness.', ar: 'التحقق من المتطلبات وجاهزية النظام.' }, locale)}</small>
            </span>
          </button>
          <button type="button" className="knx-recovery-btn knx-recovery-btn--secondary" onClick={handleExportNotes}>
            <Download size={15} aria-hidden="true" />
            <span>
              {t({ en: 'Export Diagnostic Notes', ar: 'تصدير ملاحظات التشخيص' }, locale)}
              <small>{t({ en: 'Save details for support or later review.', ar: 'حفظ التفاصيل للدعم أو المراجعة لاحقًا.' }, locale)}</small>
            </span>
          </button>
          <div className="knx-recovery-actions__row">
            <button type="button" className="knx-recovery-btn knx-recovery-btn--ghost" onClick={handleCancel}>
              <XCircle size={15} aria-hidden="true" />
              {t({ en: 'Cancel', ar: 'إلغاء' }, locale)}
            </button>
            <button type="button" className="knx-recovery-btn knx-recovery-btn--disabled" disabled aria-disabled="true">
              <Lock size={14} aria-hidden="true" />
              {t({ en: 'Execute Repair (Admin Required)', ar: 'تنفيذ الإصلاح (صلاحية مسؤول مطلوبة)' }, locale)}
            </button>
          </div>
          {exportNote && (
            <p role="status" className="knx-recovery-actions__status">
              {exportNote}
            </p>
          )}
        </div>
      </section>
      {children}
    </div>
  );
};

export default RecoveryLab;
