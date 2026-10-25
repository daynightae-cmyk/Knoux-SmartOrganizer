/**
 * repair-ui-data.ts
 * ------------------------------------------------------------------------
 * UI-ONLY, read-only descriptors for the Recovery Lab screen.
 *
 * These are PRESENTATION descriptors used to drive the UI (cards, inspector,
 * operation-preview console, stepper). They are NOT engine/service
 * registrations and must never be wired to execution, IPC, child_process,
 * PowerShell/CMD, the filesystem, the registry, or any native bridge.
 *
 * `service-catalog` / `service-preview` (imported by the real RepairPage.tsx
 * in the host app) are intentionally NOT reproduced or guessed here — this
 * file only exports local types/data consumed by the three new Repair
 * components shipped alongside it.
 */

export type Locale = 'en' | 'ar';

export type RiskLevel = 'low' | 'medium' | 'high';

export type PrivilegeRequirement =
  | 'admin-required'
  | 'admin-typically-required'
  | 'environment-dependent'
  | 'none-declared';

/** The kind of operation-preview console RepairServicePreview should render. */
export type PreviewKind =
  | 'command'       // a single, well-defined, inert command/line to show as read-only text
  | 'workflow'       // a staged workflow preview (no single representative command)
  | 'history-ledger' // the repair-history specific preview
  | 'issue-picker'   // the troubleshooters category/issue picker preview
  | 'restore-points' // the restore-point inspection preview
  | 'update-checklist'; // the Windows Update diagnostics/repair checklist preview

export interface LocalizedText {
  en: string;
  ar: string;
}

export interface LocalizedList {
  en: string[];
  ar: string[];
}

export interface RepairPrerequisite {
  id: string;
  label: LocalizedText;
}

export interface RepairStep {
  id: string;
  label: LocalizedText;
}

export interface OperationCommandPreview {
  kind: 'command';
  /** Inert text only. Never executed, never passed to any API. */
  commandText: string;
  /** Clearly-labeled illustrative output; never real telemetry. */
  expectedOutputLines: string[];
}

export interface OperationWorkflowPreview {
  kind: 'workflow';
  summary: LocalizedText;
  phases: RepairStep[];
}

export interface OperationHistoryPreview {
  kind: 'history-ledger';
  emptyStateLabel: LocalizedText;
}

export interface OperationIssuePickerPreview {
  kind: 'issue-picker';
  categories: LocalizedList;
}

export interface OperationRestorePointsPreview {
  kind: 'restore-points';
  emptyStateLabel: LocalizedText;
}

export interface OperationUpdateChecklistPreview {
  kind: 'update-checklist';
  checklist: LocalizedList;
}

export type OperationPreview =
  | OperationCommandPreview
  | OperationWorkflowPreview
  | OperationHistoryPreview
  | OperationIssuePickerPreview
  | OperationRestorePointsPreview
  | OperationUpdateChecklistPreview;

/** The 12 "ui ids" are presentation ids only — not engine registrations. */
export type RepairToolId =
  | 'repair-component-check'
  | 'repair-component-scan'
  | 'repair-component-restore'
  | 'repair-files-verify'
  | 'repair-files-repair'
  | 'repair-dns-flush'
  | 'repair-winsock-reset'
  | 'repair-tcpip-reset'
  | 'repair-history'
  | 'repair-troubleshooters'
  | 'repair-restore-point'
  | 'repair-update-reset';

/** Lucide icon name kept as a string key; RecoveryLab.tsx maps this to a component. */
export type RepairIconKey =
  | 'ShieldCheck'
  | 'ScanSearch'
  | 'Wrench'
  | 'FileCheck2'
  | 'FileCog'
  | 'Globe2'
  | 'Network'
  | 'RouterIcon'
  | 'History'
  | 'LifeBuoy'
  | 'RotateCcw'
  | 'RefreshCcw';

export interface RepairToolDescriptor {
  id: RepairToolId;
  icon: RepairIconKey;
  name: LocalizedText;
  shortDescription: LocalizedText;
  badgeCapability: LocalizedText;
  defaultSelected?: boolean;

  whatItDoes: LocalizedList;
  changesSystem: boolean;
  userImpact: LocalizedText;
  privilege: PrivilegeRequirement;
  privilegeNote: LocalizedText;
  prerequisites: RepairPrerequisite[];
  risk: RiskLevel;
  riskNote: LocalizedText;
  steps: RepairStep[];
  expectedResultFormat: LocalizedText;
  recoveryNotes: LocalizedText;

  preview: OperationPreview;
}

export const PRIVILEGE_LABEL: Record<PrivilegeRequirement, LocalizedText> = {
  'admin-required': { en: 'Administrator access required', ar: 'يتطلب صلاحيات المسؤول' },
  'admin-typically-required': {
    en: 'Administrator access typically required',
    ar: 'عادةً ما يتطلب صلاحيات المسؤول',
  },
  'environment-dependent': {
    en: 'Privilege requirement depends on your environment',
    ar: 'متطلبات الصلاحية تعتمد على بيئة النظام',
  },
  'none-declared': { en: 'No privilege data declared', ar: 'لا توجد بيانات صلاحية معلنة' },
};

export const RISK_LABEL: Record<RiskLevel, LocalizedText> = {
  low: { en: 'Low Risk', ar: 'خطورة منخفضة' },
  medium: { en: 'Medium Risk', ar: 'خطورة متوسطة' },
  high: { en: 'Higher Risk', ar: 'خطورة أعلى' },
};

/* ------------------------------------------------------------------------ */
/* Guided Repair Sequence — 7 explanatory UI stages, not an executed flow.  */
/* ------------------------------------------------------------------------ */

export interface GuidedStage {
  id: string;
  index: number;
  label: LocalizedText;
  description: LocalizedText;
}

export const GUIDED_SEQUENCE: GuidedStage[] = [
  {
    id: 'diagnose',
    index: 1,
    label: { en: 'Diagnose', ar: 'تشخيص' },
    description: { en: 'Identify the problem.', ar: 'تحديد المشكلة.' },
  },
  {
    id: 'inspect-evidence',
    index: 2,
    label: { en: 'Inspect Evidence', ar: 'فحص الأدلة' },
    description: { en: 'Review details and logs.', ar: 'مراجعة التفاصيل والسجلات.' },
  },
  {
    id: 'choose-repair',
    index: 3,
    label: { en: 'Choose Repair', ar: 'اختيار الإصلاح' },
    description: { en: 'Select the best tool.', ar: 'اختيار الأداة الأنسب.' },
  },
  {
    id: 'review-impact',
    index: 4,
    label: { en: 'Review Impact', ar: 'مراجعة الأثر' },
    description: { en: 'Understand what will change.', ar: 'فهم ما الذي سيتغير.' },
  },
  {
    id: 'confirm-permission',
    index: 5,
    label: { en: 'Confirm Permission', ar: 'تأكيد الإذن' },
    description: { en: 'Authorize with elevation.', ar: 'التفويض برفع الصلاحيات.' },
  },
  {
    id: 'execute',
    index: 6,
    label: { en: 'Execute', ar: 'تنفيذ' },
    description: { en: 'Run the repair safely.', ar: 'تشغيل الإصلاح بأمان.' },
  },
  {
    id: 'verify-result',
    index: 7,
    label: { en: 'Verify Result', ar: 'التحقق من النتيجة' },
    description: { en: 'Check and confirm success.', ar: 'التحقق وتأكيد النجاح.' },
  },
];

/* ------------------------------------------------------------------------ */
/* 12 tool descriptors                                                       */
/* ------------------------------------------------------------------------ */

const DISM_STAGES: RepairStep[] = [
  { id: 'init', label: { en: 'Initializing DISM', ar: 'تهيئة DISM' } },
  { id: 'scan', label: { en: 'Scanning component store', ar: 'فحص مخزن المكونات' } },
  { id: 'analyze', label: { en: 'Analyzing results', ar: 'تحليل النتائج' } },
  { id: 'finalize', label: { en: 'Finalizing', ar: 'الإنهاء' } },
];

export const REPAIR_TOOLS: RepairToolDescriptor[] = [
  {
    id: 'repair-component-check',
    icon: 'ShieldCheck',
    name: { en: 'DISM CheckHealth', ar: 'DISM — فحص الحالة' },
    shortDescription: {
      en: 'Check if the component store is flagged as corrupted.',
      ar: 'التحقق مما إذا كان مخزن المكونات موسومًا بالتلف.',
    },
    badgeCapability: { en: 'Read-only check', ar: 'فحص للقراءة فقط' },
    whatItDoes: {
      en: [
        'Reads cached component-store corruption flags',
        'Does not scan the full store',
        'Fastest of the three DISM checks',
      ],
      ar: ['يقرأ أعلام تلف مخزن المكونات المخزّنة مؤقتًا', 'لا يقوم بفحص كامل للمخزن', 'الأسرع بين فحوصات DISM الثلاثة'],
    },
    changesSystem: false,
    userImpact: { en: 'No changes to your system.', ar: 'لا توجد تغييرات على نظامك.' },
    privilege: 'admin-typically-required',
    privilegeNote: {
      en: 'This tool is typically run with elevated privileges.',
      ar: 'عادةً ما تُشغَّل هذه الأداة بصلاحيات مرتفعة.',
    },
    prerequisites: [
      { id: 'p1', label: { en: 'Windows must be running normally', ar: 'يجب أن يعمل Windows بشكل طبيعي' } },
    ],
    risk: 'low',
    riskNote: { en: 'Read-only operation. No changes are made to your system.', ar: 'عملية للقراءة فقط. لا تُجرى أي تغييرات على نظامك.' },
    steps: [
      { id: 'init', label: { en: 'Initializing DISM', ar: 'تهيئة DISM' } },
      { id: 'read-flags', label: { en: 'Reading corruption flags', ar: 'قراءة أعلام التلف' } },
      { id: 'finalize', label: { en: 'Finalizing', ar: 'الإنهاء' } },
    ],
    expectedResultFormat: {
      en: 'A short status indicating whether corruption is flagged.',
      ar: 'حالة مختصرة تشير إلى ما إذا كان هناك تلف موسوم.',
    },
    recoveryNotes: { en: 'No recovery needed; this tool cannot alter the system.', ar: 'لا حاجة لاستعادة؛ لا يمكن لهذه الأداة تغيير النظام.' },
    preview: {
      kind: 'command',
      commandText: 'DISM /Online /Cleanup-Image /CheckHealth',
      expectedOutputLines: [
        'Illustrative preview — no command executed',
        'Deployment Image Servicing and Management tool',
        'Image Version: 10.0.22621.1',
        'No component store corruption detected. (illustrative)',
      ],
    },
  },
  {
    id: 'repair-component-scan',
    icon: 'ScanSearch',
    name: { en: 'DISM ScanHealth', ar: 'DISM — فحص شامل' },
    shortDescription: {
      en: 'Scan the component store for corruption.',
      ar: 'فحص مخزن المكونات بحثًا عن التلف.',
    },
    badgeCapability: { en: 'Read-only scan', ar: 'فحص للقراءة فقط' },
    defaultSelected: true,
    whatItDoes: {
      en: [
        'Checks the health of the component store',
        'Detects corruption and inconsistencies',
        'Does not modify any files',
      ],
      ar: ['يتحقق من سلامة مخزن المكونات', 'يكتشف التلف والتناقضات', 'لا يعدّل أي ملفات'],
    },
    changesSystem: false,
    userImpact: {
      en: 'Read-only analysis. May take several minutes.',
      ar: 'تحليل للقراءة فقط. قد يستغرق عدة دقائق.',
    },
    privilege: 'admin-required',
    privilegeNote: { en: 'This tool must be run with elevated privileges.', ar: 'يجب تشغيل هذه الأداة بصلاحيات مرتفعة.' },
    prerequisites: [
      { id: 'p1', label: { en: 'Windows must be running normally', ar: 'يجب أن يعمل Windows بشكل طبيعي' } },
      { id: 'p2', label: { en: 'Sufficient disk space (at least 1 GB)', ar: 'مساحة قرص كافية (1 جيجابايت على الأقل)' } },
      { id: 'p3', label: { en: 'Be patient (scan may take several minutes)', ar: 'يُرجى التحلي بالصبر (قد يستغرق الفحص عدة دقائق)' } },
    ],
    risk: 'low',
    riskNote: { en: 'Read-only operation. No changes are made to your system.', ar: 'عملية للقراءة فقط. لا تُجرى أي تغييرات على نظامك.' },
    steps: DISM_STAGES,
    expectedResultFormat: {
      en: 'A report describing whether the component store is repairable, corrupt, or healthy.',
      ar: 'تقرير يوضح ما إذا كان مخزن المكونات قابلاً للإصلاح أو تالفًا أو سليمًا.',
    },
    recoveryNotes: { en: 'No recovery needed; this scan does not alter the system.', ar: 'لا حاجة لاستعادة؛ لا يغيّر هذا الفحص النظام.' },
    preview: {
      kind: 'command',
      commandText: 'DISM /Online /Cleanup-Image /ScanHealth',
      expectedOutputLines: [
        'Illustrative preview — no command executed',
        'Deployment Image Servicing and Management tool',
        'Version: 10.0.22621.1',
        'Image Version: 10.0.22631.3155',
        '[====================100.0%====================]',
        'Scanning component store... (illustrative)',
      ],
    },
  },
  {
    id: 'repair-component-restore',
    icon: 'Wrench',
    name: { en: 'DISM RestoreHealth', ar: 'DISM — استعادة السلامة' },
    shortDescription: {
      en: 'Repair the component store if corruption is found.',
      ar: 'إصلاح مخزن المكونات في حال وجود تلف.',
    },
    badgeCapability: { en: 'Can modify system', ar: 'قد يُعدّل النظام' },
    whatItDoes: {
      en: [
        'Attempts to repair a corrupted component store',
        'May use Windows Update or a specified source',
        'May require a restart to complete servicing',
      ],
      ar: ['يحاول إصلاح مخزن مكونات تالف', 'قد يستخدم Windows Update أو مصدرًا محددًا', 'قد يتطلب إعادة تشغيل لإتمام الصيانة'],
    },
    changesSystem: true,
    userImpact: {
      en: 'Would modify Windows if ever executed. Treat as a change-making operation.',
      ar: 'سيُعدّل Windows في حال تنفيذه فعليًا. يُعامَل كعملية تُحدث تغييرًا.',
    },
    privilege: 'admin-required',
    privilegeNote: { en: 'This tool must be run with elevated privileges.', ar: 'يجب تشغيل هذه الأداة بصلاحيات مرتفعة.' },
    prerequisites: [
      { id: 'p1', label: { en: 'Internet connection or valid source media', ar: 'اتصال بالإنترنت أو وسائط مصدر صالحة' } },
      { id: 'p2', label: { en: 'Sufficient disk space (at least 2 GB)', ar: 'مساحة قرص كافية (جيجابايتان على الأقل)' } },
      { id: 'p3', label: { en: 'Be prepared for a possible restart', ar: 'التجهّز لاحتمال إعادة التشغيل' } },
    ],
    risk: 'high',
    riskNote: {
      en: 'Warning: if ever executed, this operation would modify Windows system files.',
      ar: 'تحذير: في حال تنفيذها فعليًا، ستُعدّل هذه العملية ملفات نظام Windows.',
    },
    steps: [
      ...DISM_STAGES,
      { id: 'restore', label: { en: 'Restoring flagged components', ar: 'استعادة المكونات الموسومة' } },
      { id: 'restart-check', label: { en: 'Checking restart requirement', ar: 'التحقق من الحاجة لإعادة التشغيل' } },
    ],
    expectedResultFormat: {
      en: 'A report describing which components were repaired, and whether a restart is required.',
      ar: 'تقرير يوضح المكونات التي تم إصلاحها وما إذا كانت هناك حاجة لإعادة التشغيل.',
    },
    recoveryNotes: {
      en: 'If executed and interrupted, Windows servicing may need to be resumed or re-run.',
      ar: 'في حال التنفيذ والمقاطعة، قد تحتاج صيانة Windows إلى الاستئناف أو إعادة التشغيل.',
    },
    preview: {
      kind: 'command',
      commandText: 'DISM /Online /Cleanup-Image /RestoreHealth',
      expectedOutputLines: [
        'Illustrative preview — no command executed',
        'Deployment Image Servicing and Management tool',
        'This command would attempt repairs if ever run.',
        'No changes have been made. (illustrative)',
      ],
    },
  },
  {
    id: 'repair-files-verify',
    icon: 'FileCheck2',
    name: { en: 'SFC VerifyOnly', ar: 'SFC — تحقّق فقط' },
    shortDescription: { en: 'Verify system files without repairing.', ar: 'التحقق من ملفات النظام دون إصلاح.' },
    badgeCapability: { en: 'Read-only inspection', ar: 'فحص للقراءة فقط' },
    whatItDoes: {
      en: ['Scans protected system files', 'Reports integrity violations only', 'Makes no repairs'],
      ar: ['يفحص ملفات النظام المحمية', 'يُبلغ عن انتهاكات السلامة فقط', 'لا يُجري أي إصلاحات'],
    },
    changesSystem: false,
    userImpact: { en: 'Read-only scan of protected files.', ar: 'فحص للقراءة فقط للملفات المحمية.' },
    privilege: 'admin-required',
    privilegeNote: { en: 'This tool must be run with elevated privileges.', ar: 'يجب تشغيل هذه الأداة بصلاحيات مرتفعة.' },
    prerequisites: [
      { id: 'p1', label: { en: 'Windows must be running normally', ar: 'يجب أن يعمل Windows بشكل طبيعي' } },
    ],
    risk: 'low',
    riskNote: { en: 'Read-only operation. No changes are made to your system.', ar: 'عملية للقراءة فقط. لا تُجرى أي تغييرات على نظامك.' },
    steps: [
      { id: 'init', label: { en: 'Initializing SFC', ar: 'تهيئة SFC' } },
      { id: 'verify', label: { en: 'Verifying protected files', ar: 'التحقق من الملفات المحمية' } },
      { id: 'report', label: { en: 'Preparing report', ar: 'إعداد التقرير' } },
    ],
    expectedResultFormat: { en: 'A list of any integrity violations found, with no files changed.', ar: 'قائمة بأي انتهاكات سلامة تم العثور عليها، دون تغيير أي ملفات.' },
    recoveryNotes: { en: 'No recovery needed; this scan does not alter the system.', ar: 'لا حاجة لاستعادة؛ لا يغيّر هذا الفحص النظام.' },
    preview: {
      kind: 'command',
      commandText: 'sfc /verifyonly',
      expectedOutputLines: [
        'Illustrative preview — no command executed',
        'Beginning verification phase of system scan.',
        'Verification 100% complete. (illustrative)',
      ],
    },
  },
  {
    id: 'repair-files-repair',
    icon: 'FileCog',
    name: { en: 'SFC ScanNow', ar: 'SFC — فحص وإصلاح' },
    shortDescription: { en: 'Scan and repair protected system files.', ar: 'فحص وإصلاح ملفات النظام المحمية.' },
    badgeCapability: { en: 'Can modify system', ar: 'قد يُعدّل النظام' },
    whatItDoes: {
      en: [
        'Scans protected system files for violations',
        'Attempts to replace corrupted files from a cached copy',
        'May require a restart to complete',
      ],
      ar: ['يفحص ملفات النظام المحمية بحثًا عن انتهاكات', 'يحاول استبدال الملفات التالفة من نسخة مخزّنة', 'قد يتطلب إعادة تشغيل لإتمام العملية'],
    },
    changesSystem: true,
    userImpact: {
      en: 'Would replace protected files if ever executed. Possible restart required.',
      ar: 'سيستبدل الملفات المحمية في حال التنفيذ الفعلي. قد يتطلب إعادة تشغيل.',
    },
    privilege: 'admin-required',
    privilegeNote: { en: 'This tool must be run with elevated privileges.', ar: 'يجب تشغيل هذه الأداة بصلاحيات مرتفعة.' },
    prerequisites: [
      { id: 'p1', label: { en: 'Windows must be running normally', ar: 'يجب أن يعمل Windows بشكل طبيعي' } },
      { id: 'p2', label: { en: 'Be prepared for a possible restart', ar: 'التجهّز لاحتمال إعادة التشغيل' } },
    ],
    risk: 'medium',
    riskNote: { en: 'If executed, this operation can replace protected system files.', ar: 'في حال التنفيذ، يمكن لهذه العملية استبدال ملفات نظام محمية.' },
    steps: [
      { id: 'init', label: { en: 'Initializing SFC', ar: 'تهيئة SFC' } },
      { id: 'scan', label: { en: 'Scanning protected files', ar: 'فحص الملفات المحمية' } },
      { id: 'repair', label: { en: 'Repairing flagged files', ar: 'إصلاح الملفات الموسومة' } },
      { id: 'restart-check', label: { en: 'Checking restart requirement', ar: 'التحقق من الحاجة لإعادة التشغيل' } },
    ],
    expectedResultFormat: { en: 'A report of files repaired, skipped, or that could not be fixed.', ar: 'تقرير بالملفات التي تم إصلاحها أو تخطّيها أو تعذّر إصلاحها.' },
    recoveryNotes: { en: 'If files cannot be repaired, review the CBS log for details (if ever executed).', ar: 'إذا تعذّر إصلاح الملفات، راجع سجل CBS للتفاصيل (في حال التنفيذ الفعلي).' },
    preview: {
      kind: 'command',
      commandText: 'sfc /scannow',
      expectedOutputLines: [
        'Illustrative preview — no command executed',
        'Beginning system scan. This process will take some time.',
        'Verification 100% complete. (illustrative)',
      ],
    },
  },
  {
    id: 'repair-dns-flush',
    icon: 'Globe2',
    name: { en: 'Flush DNS', ar: 'تفريغ ذاكرة DNS' },
    shortDescription: { en: 'Clear the DNS resolver cache.', ar: 'مسح ذاكرة تخزين محلل DNS المؤقتة.' },
    badgeCapability: { en: 'Low-impact network reset', ar: 'إعادة ضبط شبكة منخفضة الأثر' },
    whatItDoes: {
      en: ['Clears cached DNS resolution entries', 'Forces fresh lookups on next request'],
      ar: ['يمسح إدخالات تحليل DNS المخزّنة مؤقتًا', 'يفرض عمليات بحث جديدة عند الطلب التالي'],
    },
    changesSystem: true,
    userImpact: {
      en: 'Temporary name-resolution delay on first lookups after flushing.',
      ar: 'تأخير مؤقت في تحليل الأسماء عند أول عمليات البحث بعد التفريغ.',
    },
    privilege: 'environment-dependent',
    privilegeNote: {
      en: 'Elevation requirement varies by system configuration; not guaranteed to succeed without it.',
      ar: 'يختلف طلب رفع الصلاحيات حسب إعداد النظام؛ لا يُضمن النجاح دونه.',
    },
    prerequisites: [{ id: 'p1', label: { en: 'Active network stack', ar: 'مكدّس شبكة نشط' } }],
    risk: 'low',
    riskNote: { en: 'Low impact; cache rebuilds automatically on next lookups.', ar: 'أثر منخفض؛ تُعاد بناء الذاكرة المؤقتة تلقائيًا عند عمليات البحث التالية.' },
    steps: [
      { id: 'init', label: { en: 'Preparing resolver cache command', ar: 'تجهيز أمر ذاكرة المحلل المؤقتة' } },
      { id: 'flush', label: { en: 'Flushing cache entries', ar: 'تفريغ إدخالات الذاكرة المؤقتة' } },
    ],
    expectedResultFormat: { en: 'A short confirmation that the resolver cache was flushed.', ar: 'تأكيد مختصر بتفريغ ذاكرة المحلل المؤقتة.' },
    recoveryNotes: { en: 'No recovery needed; the cache rebuilds automatically.', ar: 'لا حاجة لاستعادة؛ تُعاد بناء الذاكرة المؤقتة تلقائيًا.' },
    preview: {
      kind: 'command',
      commandText: 'ipconfig /flushdns',
      expectedOutputLines: [
        'Illustrative preview — no command executed',
        'Windows IP Configuration',
        'Successfully flushed the DNS Resolver Cache. (illustrative)',
      ],
    },
  },
  {
    id: 'repair-winsock-reset',
    icon: 'Network',
    name: { en: 'Reset Winsock', ar: 'إعادة ضبط Winsock' },
    shortDescription: { en: 'Reset the Winsock catalog to default.', ar: 'إعادة ضبط فهرس Winsock إلى الوضع الافتراضي.' },
    badgeCapability: { en: 'Network stack reset', ar: 'إعادة ضبط مكدّس الشبكة' },
    whatItDoes: {
      en: ['Resets the Winsock catalog entries', 'Can resolve certain network connectivity issues'],
      ar: ['يعيد ضبط إدخالات فهرس Winsock', 'قد يحل بعض مشكلات اتصال الشبكة'],
    },
    changesSystem: true,
    userImpact: { en: 'May disrupt active network connections; a restart is often recommended.', ar: 'قد يُعطّل اتصالات الشبكة النشطة؛ غالبًا ما يُنصح بإعادة التشغيل.' },
    privilege: 'admin-required',
    privilegeNote: { en: 'This tool must be run with elevated privileges.', ar: 'يجب تشغيل هذه الأداة بصلاحيات مرتفعة.' },
    prerequisites: [{ id: 'p1', label: { en: 'Be prepared for a possible restart', ar: 'التجهّز لاحتمال إعادة التشغيل' } }],
    risk: 'medium',
    riskNote: { en: 'If executed, networking may be interrupted until restart.', ar: 'في حال التنفيذ، قد تنقطع الشبكة حتى إعادة التشغيل.' },
    steps: [
      { id: 'init', label: { en: 'Preparing Winsock reset', ar: 'تجهيز إعادة ضبط Winsock' } },
      { id: 'reset', label: { en: 'Resetting catalog entries', ar: 'إعادة ضبط إدخالات الفهرس' } },
      { id: 'restart-check', label: { en: 'Checking restart requirement', ar: 'التحقق من الحاجة لإعادة التشغيل' } },
    ],
    expectedResultFormat: { en: 'A confirmation that the Winsock catalog was reset, and whether a restart is needed.', ar: 'تأكيد بإعادة ضبط فهرس Winsock وما إذا كانت هناك حاجة لإعادة التشغيل.' },
    recoveryNotes: { en: 'If connectivity issues persist after reset, a restart is typically required.', ar: 'إذا استمرت مشكلات الاتصال بعد إعادة الضبط، عادةً ما تكون إعادة التشغيل مطلوبة.' },
    preview: {
      kind: 'command',
      commandText: 'netsh winsock reset',
      expectedOutputLines: [
        'Illustrative preview — no command executed',
        'Successfully reset the Winsock Catalog.',
        'You must restart the computer for the reset to take effect. (illustrative)',
      ],
    },
  },
  {
    id: 'repair-tcpip-reset',
    icon: 'RouterIcon',
    name: { en: 'Reset TCP/IP', ar: 'إعادة ضبط TCP/IP' },
    shortDescription: { en: 'Reset the TCP/IP stack to default.', ar: 'إعادة ضبط مكدّس TCP/IP إلى الوضع الافتراضي.' },
    badgeCapability: { en: 'Network stack reset', ar: 'إعادة ضبط مكدّس الشبكة' },
    whatItDoes: {
      en: ['Resets IPv4 and IPv6 configuration to default', 'Can resolve certain connectivity and addressing issues'],
      ar: ['يعيد ضبط إعدادات IPv4 و IPv6 إلى الوضع الافتراضي', 'قد يحل بعض مشكلات الاتصال والعنونة'],
    },
    changesSystem: true,
    userImpact: { en: 'Clears custom IP configuration; a restart is required to complete.', ar: 'يمسح إعدادات IP المخصّصة؛ إعادة التشغيل مطلوبة للإتمام.' },
    privilege: 'admin-required',
    privilegeNote: { en: 'This tool must be run with elevated privileges.', ar: 'يجب تشغيل هذه الأداة بصلاحيات مرتفعة.' },
    prerequisites: [{ id: 'p1', label: { en: 'Be prepared for a required restart', ar: 'التجهّز لإعادة تشغيل مطلوبة' } }],
    risk: 'medium',
    riskNote: { en: 'If executed, any custom network configuration would be cleared.', ar: 'في حال التنفيذ، سيتم مسح أي إعدادات شبكة مخصّصة.' },
    steps: [
      { id: 'init', label: { en: 'Preparing TCP/IP reset', ar: 'تجهيز إعادة ضبط TCP/IP' } },
      { id: 'reset', label: { en: 'Resetting IP stack', ar: 'إعادة ضبط مكدّس IP' } },
      { id: 'restart-required', label: { en: 'Restart required to finish', ar: 'إعادة التشغيل مطلوبة للإنهاء' } },
    ],
    expectedResultFormat: { en: 'A confirmation that the IP stack was reset, pending restart.', ar: 'تأكيد بإعادة ضبط مكدّس IP، بانتظار إعادة التشغيل.' },
    recoveryNotes: { en: 'Previously customized IP settings would need to be reconfigured after reset.', ar: 'ستحتاج إعدادات IP المخصّصة سابقًا إلى إعادة الضبط بعد التصفير.' },
    preview: {
      kind: 'command',
      commandText: 'netsh int ip reset',
      expectedOutputLines: [
        'Illustrative preview — no command executed',
        'Resetting Global, OK!',
        'Restart the computer to complete this action. (illustrative)',
      ],
    },
  },
  {
    id: 'repair-history',
    icon: 'History',
    name: { en: 'Repair History', ar: 'سجل الإصلاحات' },
    shortDescription: { en: 'View past repair operations.', ar: 'عرض عمليات الإصلاح السابقة.' },
    badgeCapability: { en: 'View only', ar: 'للعرض فقط' },
    whatItDoes: {
      en: ['Displays a ledger of past repair operations', 'Supports filtering and viewing details'],
      ar: ['يعرض سجلًا لعمليات الإصلاح السابقة', 'يدعم التصفية وعرض التفاصيل'],
    },
    changesSystem: false,
    userImpact: { en: 'No changes; view-only ledger.', ar: 'لا تغييرات؛ سجل للعرض فقط.' },
    privilege: 'none-declared',
    privilegeNote: { en: 'Viewing history does not require elevated privileges.', ar: 'عرض السجل لا يتطلب صلاحيات مرتفعة.' },
    prerequisites: [],
    risk: 'low',
    riskNote: { en: 'View-only. No system changes.', ar: 'للعرض فقط. لا تغييرات على النظام.' },
    steps: [
      { id: 'load', label: { en: 'Loading repair history', ar: 'تحميل سجل الإصلاحات' } },
      { id: 'render', label: { en: 'Rendering ledger', ar: 'عرض السجل' } },
    ],
    expectedResultFormat: { en: 'A list of past entries, or an empty state if none exist.', ar: 'قائمة بالإدخالات السابقة، أو حالة فارغة في حال عدم وجودها.' },
    recoveryNotes: { en: 'Not applicable; this is a read-only ledger.', ar: 'لا ينطبق؛ هذا سجل للقراءة فقط.' },
    preview: {
      kind: 'history-ledger',
      emptyStateLabel: { en: 'No repair operations yet', ar: 'لا توجد عمليات إصلاح بعد' },
    },
  },
  {
    id: 'repair-troubleshooters',
    icon: 'LifeBuoy',
    name: { en: 'Windows Troubleshooters', ar: 'مستكشفو أخطاء Windows' },
    shortDescription: { en: 'Run built-in Windows troubleshooters.', ar: 'تشغيل مستكشفي أخطاء Windows المدمجين.' },
    badgeCapability: { en: 'Guided selection', ar: 'اختيار موجّه' },
    whatItDoes: {
      en: ['Presents built-in troubleshooter categories', 'Launch control is unimplemented and disabled in this preview'],
      ar: ['يعرض فئات مستكشفي الأخطاء المدمجين', 'عنصر التشغيل غير مُنفَّذ ومُعطَّل في هذه المعاينة'],
    },
    changesSystem: false,
    userImpact: { en: 'No changes; selection only in this preview.', ar: 'لا تغييرات؛ اختيار فقط في هذه المعاينة.' },
    privilege: 'environment-dependent',
    privilegeNote: { en: 'Individual troubleshooters vary in privilege requirement.', ar: 'تختلف متطلبات الصلاحية بين مستكشفي الأخطاء.' },
    prerequisites: [{ id: 'p1', label: { en: 'Windows must be running normally', ar: 'يجب أن يعمل Windows بشكل طبيعي' } }],
    risk: 'low',
    riskNote: { en: 'Selection only; launch is disabled in this preview.', ar: 'اختيار فقط؛ التشغيل مُعطَّل في هذه المعاينة.' },
    steps: [
      { id: 'categorize', label: { en: 'Browsing categories', ar: 'تصفّح الفئات' } },
      { id: 'select', label: { en: 'Selecting a troubleshooter', ar: 'اختيار مستكشف أخطاء' } },
    ],
    expectedResultFormat: { en: 'A chosen troubleshooter category, pending future launch support.', ar: 'فئة مستكشف أخطاء مختارة، بانتظار دعم التشغيل مستقبلًا.' },
    recoveryNotes: { en: 'Not applicable in this preview.', ar: 'لا ينطبق في هذه المعاينة.' },
    preview: {
      kind: 'issue-picker',
      categories: {
        en: ['Internet Connections', 'Playing Audio', 'Printer', 'Windows Update', 'Bluetooth', 'Power'],
        ar: ['اتصالات الإنترنت', 'تشغيل الصوت', 'الطابعة', 'تحديث Windows', 'البلوتوث', 'الطاقة'],
      },
    },
  },
  {
    id: 'repair-restore-point',
    icon: 'RotateCcw',
    name: { en: 'Restore Point Review', ar: 'مراجعة نقاط الاستعادة' },
    shortDescription: { en: 'Review available restore points.', ar: 'مراجعة نقاط الاستعادة المتاحة.' },
    badgeCapability: { en: 'Inspection only', ar: 'للفحص فقط' },
    whatItDoes: {
      en: ['Lists available system restore points, if any', 'Does not initiate a restore'],
      ar: ['يسرد نقاط استعادة النظام المتاحة إن وُجدت', 'لا يبدأ عملية استعادة'],
    },
    changesSystem: false,
    userImpact: { en: 'No changes; inspection only.', ar: 'لا تغييرات؛ للفحص فقط.' },
    privilege: 'admin-typically-required',
    privilegeNote: { en: 'Viewing restore points typically requires elevated privileges.', ar: 'عادةً ما يتطلب عرض نقاط الاستعادة صلاحيات مرتفعة.' },
    prerequisites: [{ id: 'p1', label: { en: 'System Protection must be enabled', ar: 'يجب تفعيل حماية النظام' } }],
    risk: 'low',
    riskNote: { en: 'Inspection only. No restore is performed.', ar: 'للفحص فقط. لا تُجرى أي عملية استعادة.' },
    steps: [
      { id: 'query', label: { en: 'Querying restore points', ar: 'الاستعلام عن نقاط الاستعادة' } },
      { id: 'render', label: { en: 'Rendering results', ar: 'عرض النتائج' } },
    ],
    expectedResultFormat: { en: 'A list of restore points with dates, or an explicit empty state.', ar: 'قائمة بنقاط الاستعادة وتواريخها، أو حالة فارغة صريحة.' },
    recoveryNotes: { en: 'Not applicable; no restore action is available here.', ar: 'لا ينطبق؛ لا يتوفر إجراء استعادة هنا.' },
    preview: {
      kind: 'restore-points',
      emptyStateLabel: { en: 'No restore points loaded', ar: 'لم يتم تحميل أي نقاط استعادة' },
    },
  },
  {
    id: 'repair-update-reset',
    icon: 'RefreshCcw',
    name: { en: 'Windows Update Repair', ar: 'إصلاح تحديثات Windows' },
    shortDescription: { en: 'Fix common Windows Update issues.', ar: 'إصلاح مشكلات تحديث Windows الشائعة.' },
    badgeCapability: { en: 'Checklist preview', ar: 'معاينة قائمة التحقق' },
    whatItDoes: {
      en: ['Presents a diagnostics and repair checklist for Update issues', 'Covers cache and service-related checks'],
      ar: ['يعرض قائمة تحقق لتشخيص وإصلاح مشكلات التحديث', 'يغطي فحوصات الذاكرة المؤقتة والخدمات'],
    },
    changesSystem: true,
    userImpact: { en: 'Some checklist items would reset Update caches or services if ever executed.', ar: 'بعض عناصر القائمة ستعيد ضبط ذاكرة التحديث المؤقتة أو خدماته في حال التنفيذ الفعلي.' },
    privilege: 'admin-required',
    privilegeNote: { en: 'This tool must be run with elevated privileges.', ar: 'يجب تشغيل هذه الأداة بصلاحيات مرتفعة.' },
    prerequisites: [{ id: 'p1', label: { en: 'Windows Update service must be present', ar: 'يجب توفر خدمة Windows Update' } }],
    risk: 'medium',
    riskNote: { en: 'Resetting Update components can affect pending updates if ever executed.', ar: 'قد تؤثر إعادة ضبط مكونات التحديث على التحديثات المعلّقة في حال التنفيذ الفعلي.' },
    steps: [
      { id: 'diagnose', label: { en: 'Diagnosing Update components', ar: 'تشخيص مكونات التحديث' } },
      { id: 'checklist', label: { en: 'Reviewing checklist items', ar: 'مراجعة عناصر القائمة' } },
      { id: 'permission-note', label: { en: 'Noting permission requirements', ar: 'ملاحظة متطلبات الصلاحية' } },
    ],
    expectedResultFormat: { en: 'A checklist of diagnostics with pass/attention states, no speculative script.', ar: 'قائمة تحقق تشخيصية بحالات ناجحة/تحتاج انتباه، دون أي نص برمجي افتراضي.' },
    recoveryNotes: { en: 'If Update issues persist, checklist items would need to be reviewed individually.', ar: 'إذا استمرت مشكلات التحديث، ستحتاج عناصر القائمة إلى مراجعة فردية.' },
    preview: {
      kind: 'update-checklist',
      checklist: {
        en: [
          'Windows Update service status',
          'SoftwareDistribution cache state',
          'Pending update queue',
          'Last successful update check',
        ],
        ar: [
          'حالة خدمة Windows Update',
          'حالة ذاكرة SoftwareDistribution المؤقتة',
          'قائمة التحديثات المعلّقة',
          'آخر عملية تحقق ناجحة من التحديثات',
        ],
      },
    },
  },
];

export function getToolById(id: RepairToolId): RepairToolDescriptor | undefined {
  return REPAIR_TOOLS.find((t) => t.id === id);
}

export function getDefaultSelectedToolId(): RepairToolId {
  return REPAIR_TOOLS.find((t) => t.defaultSelected)?.id ?? REPAIR_TOOLS[0].id;
}
