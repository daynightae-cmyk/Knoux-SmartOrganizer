import type { PreviewText } from '../service-preview';

/**
 * Windows Services — Service Commander.
 *
 * Three real engines, one of which changes service state. Protected services
 * always refuse, and the copy says so before the control appears.
 */
export const servicesPreviews: Record<string, PreviewText> = {
  'services-inventory': {
    purpose: { ar: 'جرد كامل لخدمات Windows بحالتها ونوع بدئها وحسابها.', en: 'A full register of Windows services with state, startup type and account.' },
    steps: [
      { ar: 'يعدّد الخدمات من مدير التحكم', en: 'Enumerate services from the service control manager' },
      { ar: 'يقرأ نوع البدء والاعتماديات', en: 'Read startup type and dependencies' },
      { ar: 'يصنّف الخدمات المحمية بوضوح', en: 'Classify protected services explicitly' }
    ],
    output: { ar: 'سجل خدمات حقيقي قابل للفرز، دون تغيير أي حالة.', en: 'A sortable real service register — no state changed.' },
    risk: 'read-only'
  },
  'services-control': {
    purpose: { ar: 'بدء أو إيقاف خدمة واحدة بخطوة معتمدة ومسجلة.', en: 'Start or stop one service as an approved, journaled step.' },
    steps: [
      { ar: 'يتحقق أن الخدمة ليست محمية', en: 'Confirm the service is not protected' },
      { ar: 'يعرض الحالة الحالية والمقترحة', en: 'Show the current and proposed state' },
      { ar: 'ينفّذ ويعيد قراءة الحالة للتأكيد', en: 'Execute and read the state back to confirm' }
    ],
    output: { ar: 'حالة خدمة جديدة مؤكدة القراءة، وسجل يذكر ما تغيّر.', en: 'A confirmed new service state, with a journal naming what changed.' },
    risk: 'needs-admin'
  },
  'services-undo': {
    purpose: { ar: 'إعادة نوع بدء الخدمة إلى ما كان عليه قبل تغييرك.', en: 'Return a service startup type to what it was before your change.' },
    steps: [
      { ar: 'يقرأ سجل تغييرات KNOuX', en: 'Read the KNOuX change journal' },
      { ar: 'يعرض القيمة السابقة واللاحقة', en: 'Show the previous and new values' },
      { ar: 'يستعيد السابقة ويتحقق منها', en: 'Restore the previous value and verify it' }
    ],
    output: { ar: 'نوع بدء مستعاد ومؤكد، مع إغلاق السجل.', en: 'A restored, confirmed startup type with the journal closed out.' },
    risk: 'needs-admin'
  },
  'services-dependencies': {
    purpose: { ar: 'معرفة ما تعتمد عليه الخدمة وما يعتمد عليها.', en: 'See what a service depends on and what depends on it.' },
    steps: [
      { ar: 'يقرأ شجرتي الاعتماد', en: 'Read both dependency directions' },
      { ar: 'يرسم العلاقة بين الخدمات', en: 'Draw the relationship between services' },
      { ar: 'يعلّم أي حلقة أو اعتماد مفقود', en: 'Flag any cycle or missing dependency' }
    ],
    output: { ar: 'شجرة اعتماد من بيانات الخدمات الفعلية.', en: 'A dependency tree from the actual service data.' },
    risk: 'read-only'
  },
  'services-protected': {
    purpose: { ar: 'تمييز الخدمات التي يرفض KNOuX المساس بها ولماذا.', en: 'Mark the services KNOuX refuses to touch, and why.' },
    steps: [
      { ar: 'يطبّق قائمة الحماية والعلامات', en: 'Apply the protection list and markers' },
      { ar: 'يعرض سبب الحماية لكل خدمة', en: 'Show the protection reason per service' },
      { ar: 'يعطّل عناصر التحكم الخاصة بها', en: 'Disable their controls' }
    ],
    output: { ar: 'قائمة حماية مع سبب صريح لكل إدخال.', en: 'A protection list with an explicit reason per entry.' },
    risk: 'read-only'
  },
  'services-search': {
    purpose: { ar: 'الوصول إلى خدمة بالاسم أو الاسم المعروض أو حالتها.', en: 'Reach a service by name, display name or state.' },
    steps: [
      { ar: 'يطابق عدة حقول في وقت واحد', en: 'Match several fields at once' },
      { ar: 'يصفّي حسب الحالة والبدء', en: 'Filter by state and startup type' },
      { ar: 'يحتفظ بالاختيار أثناء الكتابة', en: 'Keep the selection while typing' }
    ],
    output: { ar: 'نتائج فورية من السجل المحمّل مسبقًا.', en: 'Instant results from the register already loaded.' },
    risk: 'read-only'
  },
  'services-startup-report': {
    purpose: { ar: 'نظرة مجمّعة على أنواع بدء الخدمات.', en: 'An aggregate view of service startup types.' },
    steps: [
      { ar: 'يجمع الأنواع حسب الحالة', en: 'Group types by current state' },
      { ar: 'يعرض الأعداد الحقيقية', en: 'Present the real counts' },
      { ar: 'يفتح القائمة خلف كل رقم', en: 'Open the list behind each number' }
    ],
    output: { ar: 'تقرير بدء بلا أي استنتاج عن الأداء.', en: 'A startup report with no performance inference.' },
    risk: 'read-only'
  },
  'services-state-history': {
    purpose: { ar: 'تتبّع تغيّرات حالة الخدمة عبر الجلسات.', en: 'Track service state changes across sessions.' },
    steps: [
      { ar: 'يقرأ تغييرات الحالة المسجلة', en: 'Read the recorded state changes' },
      { ar: 'يرتّبها زمنيًا مع السبب', en: 'Order them in time, with the cause' },
      { ar: 'يبرز التغييرات التي أجراها KNOuX', en: 'Highlight changes KNOuX made' }
    ],
    output: { ar: 'سجل حالة صادق، لا يُنسب للنظام ما لم يُرصد.', en: 'An honest state log that attributes nothing it did not observe.' },
    risk: 'read-only'
  },
  'services-dependents': {
    purpose: { ar: 'معرفة ما سيتأثر إن أوقفت هذه الخدمة.', en: 'Know what breaks if this service stops.' },
    steps: [
      { ar: 'يقرأ الخدمات التابعة مباشرة', en: 'Read the direct dependents' },
      { ar: 'يوسّع الشجرة إلى نهايتها', en: 'Expand the tree to its end' },
      { ar: 'يعدّ ما سيتوقف فعليًا', en: 'Count what would actually stop' }
    ],
    output: { ar: 'أثر إيقاف متوقع مبني على الاعتماديات فقط.', en: 'An expected stop impact built only from dependencies.' },
    risk: 'read-only'
  },
  'services-diagnose': {
    purpose: { ar: 'تشخيص خدمة لا تبدأ بخطوات مرتبة.', en: 'Diagnose a service that will not start, in ordered steps.' },
    steps: [
      { ar: 'يقرأ رمز الخطأ من المدير', en: 'Read the error code from the manager' },
      { ar: 'يفحص الحساب والمسار والصراع', en: 'Check account, path and conflict' },
      { ar: 'يعرض فرضية واحدة قابلة للاختبار', en: 'Present one testable hypothesis' }
    ],
    output: { ar: 'مسارات تشخيص مع أوامر للقراءة فقط، لا إصلاح تلقائي.', en: 'Diagnostic paths with read-only commands — no automatic repair.' },
    risk: 'read-only'
  },
  'services-config': {
    purpose: { ar: 'تعديل نوع بدء الخدمة بعد مراجعة آثاره.', en: 'Change a service startup type after reviewing the consequences.' },
    steps: [
      { ar: 'يعرض الحالة المقترحة وتبعاتها', en: 'Show the proposed state and its consequences' },
      { ar: 'يطلب موافقة صريحة', en: 'Require explicit approval' },
      { ar: 'ينفّذ ويعيد القراءة', en: 'Apply and read back' }
    ],
    output: { ar: 'إعداد خدمة محدث ومؤكد، مع سجل.' , en: 'An updated, confirmed service configuration, with a journal.' },
    risk: 'needs-admin'
  },
  'services-perf': {
    purpose: { ar: 'مقارنة استهلاك الخدمات دون ادعاء تحسين سرعة.', en: 'Compare service resource use without claiming a speed improvement.' },
    steps: [
      { ar: 'يقرأ استخدام المعالج والذاكرة', en: 'Read processor and memory use' },
      { ar: 'يعرض القيم مقابل وقتها', en: 'Show values against their sample time' },
      { ar: 'يميّز الحدس عن القياس', en: 'Separate inference from measurement' }
    ],
    output: { ar: 'جدول استهلاك حقيقي، بلا نسب تحسين.', en: 'A real usage table — no improvement percentages.' },
    risk: 'read-only'
  }
};
