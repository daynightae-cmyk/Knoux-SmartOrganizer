/**
 * RepairServicePreview.tsx
 * ------------------------------------------------------------------------
 * UI-ONLY. Renders:
 *  - the specialized inspector (What it does / Privilege / Prerequisites / Impact)
 *  - a contextual "Operation Preview — Not Executed" console whose shape
 *    depends on the tool's `preview.kind`
 *  - an accessible review-only dialog summarizing potential impact
 *
 * Nothing in this file calls any native bridge, IPC, child_process, fetch,
 * or shell/registry/system API. All actions are local React state only.
 */

import React, { useId, useState } from 'react';
import {
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
  Copy,
  Check,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import {
  Locale,
  RepairToolDescriptor,
  RepairIconKey,
  PRIVILEGE_LABEL,
  RISK_LABEL,
} from './repair-ui-data';

const ICONS: Record<RepairIconKey, typeof ShieldCheck> = {
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

function t<T extends { en: string; ar: string }>(field: T, locale: Locale): string {
  return locale === 'ar' ? field.ar : field.en;
}

export interface RepairServicePreviewProps {
  tool: RepairToolDescriptor;
  locale: Locale;
  reviewOpen: boolean;
  onCloseReview: () => void;
}

export const RepairServicePreview: React.FC<RepairServicePreviewProps> = ({
  tool,
  locale,
  reviewOpen,
  onCloseReview,
}) => {
  const Icon = ICONS[tool.icon];
  const dialogTitleId = useId();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
    window.setTimeout(() => { setCopied(false); setCopyError(false); }, 1600);
  };

  return (
    <div className="knx-recovery-workspace">
      {/* --- Inspector ------------------------------------------------- */}
      <section className="knx-recovery-inspector" aria-label={t({ en: 'Repair tool details', ar: 'تفاصيل أداة الإصلاح' }, locale)}>
        <header className="knx-recovery-inspector__head">
          <span className="knx-recovery-inspector__icon" aria-hidden="true">
            <Icon size={22} />
          </span>
          <div>
            <h3 className="knx-recovery-inspector__title">{t(tool.name, locale)}</h3>
            <p className="knx-recovery-inspector__subtitle">{t(tool.shortDescription, locale)}</p>
          </div>
          <span className="knx-recovery-chip knx-recovery-chip--ready">
            <Info size={13} aria-hidden="true" />
            {t({ en: 'Preview available', ar: 'المعاينة متاحة' }, locale)}
          </span>
        </header>

        <div className="knx-recovery-inspector__grid">
          <div className="knx-recovery-inspector__block">
            <h4>{t({ en: 'What it does', ar: 'ما الذي تفعله' }, locale)}</h4>
            <ul>
              {tool.whatItDoes[locale].map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="knx-recovery-inspector__block">
            <h4>{t({ en: 'Privilege requirement', ar: 'متطلب الصلاحية' }, locale)}</h4>
            <p className="knx-recovery-inspector__privilege">
              <ShieldCheck size={15} aria-hidden="true" />
              {t(PRIVILEGE_LABEL[tool.privilege], locale)}
            </p>
            <p className="knx-recovery-inspector__note">{t(tool.privilegeNote, locale)}</p>
          </div>

          <div className="knx-recovery-inspector__block">
            <h4>{t({ en: 'Prerequisites', ar: 'المتطلبات المسبقة' }, locale)}</h4>
            {tool.prerequisites.length ? (
              <ul className="knx-recovery-inspector__checklist">
                {tool.prerequisites.map((p) => (
                  <li key={p.id}>
                    <Check size={13} aria-hidden="true" />
                    {t(p.label, locale)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="knx-recovery-inspector__note">{t({ en: 'None declared.', ar: 'لا يوجد.' }, locale)}</p>
            )}
          </div>

          <div className="knx-recovery-inspector__block">
            <h4 className="knx-recovery-inspector__risk-head">{t({ en: 'Potential impact / risk', ar: 'الأثر المحتمل / الخطورة' }, locale)}</h4>
            <p className={`knx-recovery-risk knx-recovery-risk--${tool.risk}`}>
              <AlertTriangle size={14} aria-hidden="true" />
              {t(RISK_LABEL[tool.risk], locale)}
            </p>
            <p className="knx-recovery-inspector__note">{t(tool.riskNote, locale)}</p>
          </div>
        </div>
      </section>

      {/* --- Operation preview console ---------------------------------- */}
      <section className="knx-recovery-console" aria-label={t({ en: 'Operation preview, not executed', ar: 'معاينة العملية، غير منفّذة' }, locale)}>
        <header className="knx-recovery-console__head">
          <AlertTriangle size={15} aria-hidden="true" />
          <span>{t({ en: 'Operation Preview — Not Executed', ar: 'معاينة العملية — غير منفّذة' }, locale)}</span>
        </header>

        {tool.preview.kind === 'command' && (
          <>
            <div className="knx-recovery-console__row">
              <span className="knx-recovery-console__label">{t({ en: 'Command preview (elevated)', ar: 'معاينة الأمر (مرتفع الصلاحية)' }, locale)}</span>
              <button
                type="button"
                className="knx-recovery-copy-btn"
                onClick={() => handleCopy(tool.preview.kind === 'command' ? tool.preview.commandText : '')}
                aria-label={t({ en: 'Copy preview text', ar: 'نسخ نص المعاينة' }, locale)}
              >
                {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                {copied ? t({ en: 'Copied', ar: 'تم النسخ' }, locale) : copyError ? t({ en: 'Copy unavailable', ar: 'النسخ غير متاح' }, locale) : t({ en: 'Copy', ar: 'نسخ' }, locale)}
              </button>
            </div>
            <pre className="knx-recovery-console__command" dir="ltr">
              <code>{tool.preview.commandText}</code>
            </pre>

            <div className="knx-recovery-console__row">
              <span className="knx-recovery-console__label">{t({ en: 'Expected output (preview)', ar: 'المخرجات المتوقعة (معاينة)' }, locale)}</span>
            </div>
            <pre className="knx-recovery-console__output" dir="ltr">
              <code>{tool.preview.expectedOutputLines.join('\n')}</code>
            </pre>
          </>
        )}

        {tool.preview.kind === 'workflow' && (
          <div className="knx-recovery-console__workflow">
            <p className="knx-recovery-inspector__note">{t(tool.preview.summary, locale)}</p>
            <ol className="knx-recovery-console__phases">
              {tool.preview.phases.map((phase, i) => (
                <li key={phase.id}>
                  <span className="knx-recovery-console__phase-index">{i + 1}</span>
                  {t(phase.label, locale)}
                </li>
              ))}
            </ol>
          </div>
        )}

        {tool.preview.kind === 'history-ledger' && (
          <div className="knx-recovery-console__empty">
            <History size={26} aria-hidden="true" />
            <p>{t(tool.preview.emptyStateLabel, locale)}</p>
            <span className="knx-recovery-inspector__note">
              {t({ en: 'This panel mirrors the main history ledger below.', ar: 'تعكس هذه اللوحة سجل الإصلاحات الرئيسي أدناه.' }, locale)}
            </span>
          </div>
        )}

        {tool.preview.kind === 'issue-picker' && (
          <div className="knx-recovery-console__picker">
            {tool.preview.categories[locale].map((cat) => (
              <span key={cat} className="knx-recovery-chip knx-recovery-chip--muted">
                {cat}
              </span>
            ))}
            <p className="knx-recovery-inspector__note">
              {t({ en: 'Launch is unimplemented and disabled in this preview.', ar: 'التشغيل غير مُنفَّذ ومُعطَّل في هذه المعاينة.' }, locale)}
            </p>
          </div>
        )}

        {tool.preview.kind === 'restore-points' && (
          <div className="knx-recovery-console__empty">
            <RotateCcw size={26} aria-hidden="true" />
            <p>{t(tool.preview.emptyStateLabel, locale)}</p>
          </div>
        )}

        {tool.preview.kind === 'update-checklist' && (
          <ul className="knx-recovery-console__checklist">
            {tool.preview.checklist[locale].map((item) => (
              <li key={item}>
                <Info size={13} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        )}

        {tool.preview.kind === 'command' && (
          <>
            <div className="knx-recovery-console__row">
              <span className="knx-recovery-console__label">{t({ en: 'Execution stages', ar: 'مراحل التنفيذ' }, locale)}</span>
            </div>
            <ol className="knx-recovery-console__stages">
              {tool.steps.map((s) => (
                <li key={s.id}>{t(s.label, locale)}</li>
              ))}
            </ol>
          </>
        )}

        <div
          className={`knx-recovery-console__banner knx-recovery-console__banner--${
            tool.privilege === 'admin-required' ? 'warn' : 'info'
          }`}
        >
          <AlertTriangle size={14} aria-hidden="true" />
          <span>{t(tool.privilegeNote, locale)}</span>
        </div>
      </section>

      {/* --- Review-only dialog ------------------------------------------ */}
      {reviewOpen && (
        <div className="knx-recovery-dialog-overlay" role="presentation" onMouseDown={onCloseReview}>
          <div
            className="knx-recovery-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="knx-recovery-dialog__head">
              <h3 id={dialogTitleId}>{t({ en: 'Review Repair — Not Executed', ar: 'مراجعة الإصلاح — غير منفّذ' }, locale)}</h3>
              <button
                type="button"
                className="knx-recovery-icon-btn"
                onClick={onCloseReview}
                aria-label={t({ en: 'Close review', ar: 'إغلاق المراجعة' }, locale)}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </header>
            <div className="knx-recovery-dialog__body">
              <p className="knx-recovery-dialog__tool">{t(tool.name, locale)}</p>
              <p className="knx-recovery-inspector__note">{t(tool.userImpact, locale)}</p>

              <h4>{t({ en: 'Expected result format', ar: 'شكل النتيجة المتوقعة' }, locale)}</h4>
              <p className="knx-recovery-inspector__note">{t(tool.expectedResultFormat, locale)}</p>

              <h4>{t({ en: 'Recovery notes', ar: 'ملاحظات الاستعادة' }, locale)}</h4>
              <p className="knx-recovery-inspector__note">{t(tool.recoveryNotes, locale)}</p>

              <div className="knx-recovery-dialog__badge-row">
                <span className={`knx-recovery-risk knx-recovery-risk--${tool.risk}`}>
                  <AlertTriangle size={13} aria-hidden="true" />
                  {t(RISK_LABEL[tool.risk], locale)}
                </span>
                <span className="knx-recovery-inspector__privilege">
                  <ShieldCheck size={13} aria-hidden="true" />
                  {t(PRIVILEGE_LABEL[tool.privilege], locale)}
                </span>
              </div>

              <p className="knx-recovery-dialog__disclaimer">
                {t(
                  {
                    en: 'This is a review-only summary. No repair has been run and no system changes have been made.',
                    ar: 'هذا ملخص للمراجعة فقط. لم يتم تنفيذ أي إصلاح ولم تُجرَ أي تغييرات على النظام.',
                  },
                  locale,
                )}
              </p>
            </div>
            <footer className="knx-recovery-dialog__foot">
              <button type="button" className="knx-recovery-btn knx-recovery-btn--ghost" onClick={onCloseReview}>
                {t({ en: 'Close', ar: 'إغلاق' }, locale)}
              </button>
              <button type="button" className="knx-recovery-btn knx-recovery-btn--disabled" disabled aria-disabled="true">
                {t({ en: 'Execute Repair (Admin Required)', ar: 'تنفيذ الإصلاح (صلاحية مسؤول مطلوبة)' }, locale)}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairServicePreview;
