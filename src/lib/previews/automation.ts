import type { PreviewText } from '../service-preview';

/**
 * Automation — Flow Studio.
 *
 * Real scheduling through Task Scheduler for an allowlist of read-only tools.
 * Everything else is a design-ready rule: the copy says "would", not "does".
 */
export const automationPreviews: Record<string, PreviewText> = {
  'auto-smart-scan': {
    purpose: { ar: 'تشغيل الفحص الذكي تلقائيًا وفق جدول تختاره.', en: 'Run the smart scan automatically on a schedule you choose.' },
    steps: [
      { ar: 'يبني مهمة تشغيل للفحص فقط', en: 'Build a task that only runs the scan' },
      { ar: 'يسجّلها في Task Scheduler باسمك', en: 'Register it in Task Scheduler under your account' },
      { ar: 'يقرأها مجددًا ليتأكد من التكرار', en: 'Read it back to confirm the repetition' }
    ],
    output: { ar: 'مهمة مجدولة حقيقية، ونتائجها تظهر في سجل التشغيل.', en: 'A real scheduled task, whose runs appear in the execution history.' },
    risk: 'reversible'
  },
  'auto-schedule-manager': {
    purpose: { ar: 'رؤية المهام التي أنشأها KNOuX وتعديلها أو إيقافها.', en: 'See the tasks KNOuX created, edit them or stop them.' },
    steps: [
      { ar: 'يقرأ المهام المسجلة باسم KNOuX', en: 'Read the tasks registered under KNOuX' },
      { ar: 'يعرض التكرار والحالة التالية', en: 'Show the repeat and next run state' },
      { ar: 'يتيح التعطيل أو الحذف بموافقة', en: 'Allow disabling or deleting with approval' }
    ],
    output: { ar: 'جدول مهام حقيقي مع حالة كل مهمة.', en: 'A real task table with each task state.' },
    risk: 'reversible'
  },
  'auto-run-history': {
    purpose: { ar: 'مراجعة ما جرى فعليًا في كل تشغيل مجدول.', en: 'Review what each scheduled run actually did.' },
    steps: [
      { ar: 'يقرأ نتائج آخر التشغيلات', en: 'Read the most recent run results' },
      { ar: 'يعرض وقت البدء والنتيجة', en: 'Show start time and outcome' },
      { ar: 'يفتح نتيجة التشغيل كاملة', en: 'Open a full run result' }
    ],
    output: { ar: 'سجل تشغيل حقيقي، بما فيه المحاولات الفاشلة.', en: 'A real run history, including the attempts that failed.' },
    risk: 'read-only'
  },
  'auto-templates': {
    purpose: { ar: 'البدء من قاعدة جاهزة بدل بناء قاعدة من الصفر.', en: 'Start from a ready base instead of building a rule from nothing.' },
    steps: [
      { ar: 'يعرض القوالب المتاحة ومحتواها', en: 'Show the available templates and their content' },
      { ar: 'يشرح ما سيفعله كل قالب', en: 'Explain what each template would do' },
      { ar: 'ينسخ القالب إلى مسودة قابلة للتعديل', en: 'Copy a template into an editable draft' }
    ],
    output: { ar: 'مسودة قاعدة لم تُسجَّل بعد، ولا تعمل حتى توافق.', en: 'A draft rule that is not registered and does nothing until you approve it.' },
    risk: 'reversible'
  },
  'auto-schedule-plan': {
    purpose: { ar: 'رؤية كل الأوقات المجدولة معًا قبل تفعيلها.', en: 'See every scheduled time together before enabling them.' },
    steps: [
      { ar: 'يجمع المهام النشطة على خط زمني', en: 'Place active tasks on one timeline' },
      { ar: 'يكشف التعارض والتقارب', en: 'Detect overlap and clustering' },
      { ar: 'يقترح تعديلًا دون تطبيقه', en: 'Suggest an adjustment without applying it' }
    ],
    output: { ar: 'خطة جدولة مرئية، لا تغيير تلقائي في المهام.', en: 'A visible schedule plan — no automatic task change.' },
    risk: 'read-only'
  },
  'auto-cleanup-plan': {
    purpose: { ar: 'جدولة فحص التنظيف الدوري دون منحه حق الحذف.', en: 'Schedule the recurring cleanup scan without granting deletion rights.' },
    steps: [
      { ar: 'يختار الحد العمري والفئات', en: 'Choose the minimum age and categories' },
      { ar: 'يعرض ما سيفحصه فقط', en: 'Show exactly what it would scan' },
      { ar: 'يسجّل مهمة فحص بلا تنفيذ', en: 'Register a scan-only task' }
    ],
    output: { ar: 'مهمة فحص دورية؛ الحجر يبقى بموافقتك.', en: 'A recurring scan task; quarantining stays yours to approve.' },
    risk: 'reversible'
  },
  'auto-notify': {
    purpose: { ar: 'تحديد متى يُخطرك KNOuX بنتيجة مهمة.', en: 'Decide when KNOuX tells you about a task result.' },
    steps: [
      { ar: 'يختار الحدث: نجاح أو فشل أو كلاهما', en: 'Choose the event: success, failure or both' },
      { ar: 'يحدد القناة المحلية', en: 'Choose the local channel' },
      { ar: 'يعرض معاينة للرسالة', en: 'Preview the message' }
    ],
    output: { ar: 'قاعدة إشعار محلية، لا إرسال خارجي.', en: 'A local notification rule — nothing sent off the machine.' },
    risk: 'reversible'
  },
  'auto-quiet-hours': {
    purpose: { ar: 'منع المهام من العمل في ساعات محددة.', en: 'Keep tasks from running during particular hours.' },
    steps: [
      { ar: 'يحدد نطاق الساعات', en: 'Define the hour range' },
      { ar: 'يشرح مصير مهمة تصادف النطاق', en: 'Explain what happens to a task that lands inside it' },
      { ar: 'يعرض المهام المتأثرة', en: 'List the affected tasks' }
    ],
    output: { ar: 'نافذة صمت واضحة مع سلوك معلن لكل مهمة.', en: 'A clear quiet window with declared behaviour per task.' },
    risk: 'reversible'
  },
  'auto-battery-policy': {
    purpose: { ar: 'ربط تشغيل المهام بحالة الطاقة.', en: 'Tie task execution to the power state.' },
    steps: [
      { ar: 'يقرأ حالة البطارية الحقيقية', en: 'Read the real battery state' },
      { ar: 'يختار الشرط: على البطارية أو على التيار', en: 'Choose the condition: on battery or on AC' },
      { ar: 'يشرح ما يحدث عند تغيّر الحالة', en: 'Explain what happens when the state changes' }
    ],
    output: { ar: 'سياسة طاقة صادقة، لا ادعاء توفير طاقة محسوب.', en: 'An honest power policy — no claimed measured energy saving.' },
    risk: 'reversible'
  },
  'auto-retention': {
    purpose: { ar: 'تحديد مدة الاحتفاظ بنتائج التشغيل.', en: 'Decide how long run results are kept.' },
    steps: [
      { ar: 'يختار مدة الاحتفاظ', en: 'Choose the retention period' },
      { ar: 'يعرض ما سيُحذف من السجل', en: 'Show what would leave the history' },
      { ar: 'يتيح تصديرًا قبل التنظيف', en: 'Offer an export before pruning' }
    ],
    output: { ar: 'سياسة احتفاظ مع معاينة أثرها قبل التطبيق.', en: 'A retention policy with its effect previewed before it applies.' },
    risk: 'reversible'
  },
  'auto-export': {
    purpose: { ar: 'تصدير تعريفات المهام كملف محلي.', en: 'Export the task definitions as a local file.' },
    steps: [
      { ar: 'يجمع تعريفات المهام النشطة', en: 'Collect the active task definitions' },
      { ar: 'ينتج ملفًا محليًا قابلًا للمراجعة', en: 'Produce a reviewable local file' },
      { ar: 'يذكر ما لا يُصدَّر من بيانات اعتماد', en: 'State what credentials are never exported' }
    ],
    output: { ar: 'ملف تصدير محلي بلا أسرار ولا كلمات مرور.', en: 'A local export file with no secrets or passwords.' },
    risk: 'read-only'
  },
  'auto-backup-plan': {
    purpose: { ar: 'تصميم نسخة احتياطية دورية لمجلد تختاره.', en: 'Design a recurring backup for a folder you choose.' },
    steps: [
      { ar: 'يختار المجلد المصدر والهدف', en: 'Choose the source and destination folders' },
      { ar: 'يعرض خطة النسخ وحجمها المتوقع', en: 'Show the backup plan and its expected size' },
      { ar: 'يشرح كيف تُتحقق كل نسخة', en: 'Explain how each copy would be verified' }
    ],
    output: { ar: 'خطة نسخ احتياطي قابلة للمراجعة، لا نسخ صامت.', en: 'A reviewable backup plan — never a silent copy.' },
    risk: 'reversible',
    inputs: [
      { kind: 'folder', label: { ar: 'المجلد المصدر', en: 'Source folder' } },
      { kind: 'folder', label: { ar: 'مجلد النسخ', en: 'Backup folder' } }
    ]
  }
};
