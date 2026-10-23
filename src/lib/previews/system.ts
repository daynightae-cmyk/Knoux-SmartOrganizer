import type { PreviewText } from '../service-preview';

/**
 * System — Live Pulse.
 *
 * Readings come from three real engines (health, events, processes). The rest
 * of the world is honest empty state: axes without a line, a ledger without
 * invented rows.
 */
export const systemPreviews: Record<string, PreviewText> = {
  'system-health-check': {
    purpose: { ar: 'قراءة واحدة تجيب: هل هذا الجهاز بحالة جيدة الآن؟', en: 'One reading that answers: is this machine healthy right now?' },
    steps: [
      { ar: 'يقرأ المعالج والذاكرة والقرص', en: 'Read processor, memory and disk' },
      { ar: 'يجمع عدّادات الأداء من Windows', en: 'Collect the performance counters from Windows' },
      { ar: 'يحسب حكمًا واحدًا مع سببه', en: 'Derive one verdict with its reason' }
    ],
    output: { ar: 'ملخص صحة مع القيم المقيسة ووقت القراءة، لا درجات تجميلية.', en: 'A health summary with the measured values and read time — no cosmetic scores.' },
    risk: 'read-only'
  },
  'system-events': {
    purpose: { ar: 'رؤية تحذيرات Windows الحديثة دون فتح Event Viewer.', en: 'See recent Windows warnings without opening Event Viewer.' },
    steps: [
      { ar: 'يستعلم سجل النظام عن الأخطاء والتحذيرات', en: 'Query the System log for errors and warnings' },
      { ar: 'يستبعد الضجيج المتكرر المعروف', en: 'Exclude known recurring noise' },
      { ar: 'يرتّب الأحدث أولًا مع مصدره', en: 'Order newest first, with each source' }
    ],
    output: { ar: 'قائمة أحداث حقيقية بالمعرّف والمصدر والوقت.', en: 'A real event list with id, source and time.' },
    risk: 'read-only'
  },
  'system-processes': {
    purpose: { ar: 'جرد العمليات الجارية مع استهلاكها اللحظي.', en: 'An inventory of running processes with their live usage.' },
    steps: [
      { ar: 'يعدّد العمليات من Windows', en: 'Enumerate processes from Windows' },
      { ar: 'يقرأ المعالج والذاكرة لكل عملية', en: 'Read CPU and memory per process' },
      { ar: 'يرتّب حسب الاستهلاك الحالي', en: 'Rank by current usage' }
    ],
    output: { ar: 'جدول عمليات حقيقي قابل للفرز، دون إنهاء أي عملية.', en: 'A sortable real process table — no process is ever terminated.' },
    risk: 'read-only'
  },
  'system-signatures': {
    purpose: { ar: 'التحقق من توقيع ملف قبل الثقة به.', en: 'Check a file signature before trusting it.' },
    steps: [
      { ar: 'يقرأ شهادة الملف من Windows', en: 'Read the file certificate from Windows' },
      { ar: 'يعرض الموقّع وسلسلة الثقة', en: 'Show the signer and the trust chain' },
      { ar: 'يعلن صراحةً حين لا توجد شهادة', en: 'Declare explicitly when there is no certificate' }
    ],
    output: { ar: 'حكم توقيع مع هوية الموقّع، لا افتراض سلامة.', en: 'A signature verdict with the signer identity — never an assumption of safety.' },
    risk: 'read-only'
  },
  'system-uptime': {
    purpose: { ar: 'معرفة مدة التشغيل وموعد آخر إعادة إقلاع.', en: 'Know how long the machine has been up and when it last restarted.' },
    steps: [
      { ar: 'يقرأ وقت الإقلاع من النظام', en: 'Read the boot time from the system' },
      { ar: 'يحسب المدة المنسابة', en: 'Compute the elapsed duration' },
      { ar: 'يعرض الإقلاعات المفاجئة إن وُجدت', en: 'Show unexpected restarts, if any' }
    ],
    output: { ar: 'مدة تشغيل دقيقة، مع الإشارة إلى أي انقطاع غير مخطط.', en: 'An exact uptime, flagging any unplanned gap.' },
    risk: 'read-only'
  },
  'system-perf': {
    purpose: { ar: 'رسم أداء الجهاز عبر الزمن بدل لحظة واحدة.', en: 'Chart machine performance over time instead of a single instant.' },
    steps: [
      { ar: 'يعيّن عدّادات المعالج والذاكرة والقرص', en: 'Sample processor, memory and disk counters' },
      { ar: 'يرسم خط الزمن مع محاور حقيقية', en: 'Draw the timeline with real axes' },
      { ar: 'يحفظ القراءات في الجلسة فقط', en: 'Keep readings in the session only' }
    ],
    output: { ar: 'رسم بلا خط حتى تصل أول قراءة حقيقية.', en: 'A chart with no line until the first real reading arrives.' },
    risk: 'read-only'
  },
  'system-drivers': {
    purpose: { ar: 'جرد برامج التشغيل المثبتة وإصداراتها.', en: 'Inventory installed drivers and their versions.' },
    steps: [
      { ar: 'يستعلم برامج التشغيل من Windows', en: 'Query drivers from Windows' },
      { ar: 'يعرض المزوّد والتاريخ والتوقيع', en: 'Show provider, date and signature' },
      { ar: 'يعلّم أي برنامج بلا توقيع', en: 'Flag any driver without a signature' }
    ],
    output: { ar: 'جدول برامج تشغيل حقيقي، دون تثبيت أو تعطيل.', en: 'A real driver table — nothing installed or disabled.' },
    risk: 'read-only'
  },
  'system-logs': {
    purpose: { ar: 'قراءة سجلات النظام في مكان واحد بحثًا عن سبب.', en: 'Read system logs in one place while hunting a cause.' },
    steps: [
      { ar: 'يختار السجل ونطاق الوقت', en: 'Choose a log and a time range' },
      { ar: 'يقرأ الأحداث ويعرضها خامًا', en: 'Read events and present them raw' },
      { ar: 'يتيح نسخ حدث واحد للتقارير', en: 'Allow copying one event into a report' }
    ],
    output: { ar: 'قارئ سجلات للقراءة فقط، لا تعديل ولا حذف.', en: 'A read-only log reader — no edits, no deletion.' },
    risk: 'read-only'
  },
  'system-resources': {
    purpose: { ar: 'معرفة أي مورد يوشك أن يصبح عنق زجاجة.', en: 'See which resource is about to become the bottleneck.' },
    steps: [
      { ar: 'يقرأ المعالج والذاكرة والقرص والشبكة', en: 'Read processor, memory, disk and network' },
      { ar: 'يعرض كل مورد مقابل سعته', en: 'Show each resource against its capacity' },
      { ar: 'يميّز النقص الحقيقي عن الارتفاع اللحظي', en: 'Separate real shortage from a momentary spike' }
    ],
    output: { ar: 'أربع بطاقات موارد بقيمها الحقيقية ووقتها.', en: 'Four resource cards with real values and their timestamps.' },
    risk: 'read-only'
  },
  'system-autostart': {
    purpose: { ar: 'تتبّع ما يبدأ تلقائيًا من كل مسارات النظام.', en: 'Trace everything that starts automatically across system routes.' },
    steps: [
      { ar: 'يجمع Run والمجلدات والمهام والخدمات', en: 'Collect Run keys, folders, tasks and services' },
      { ar: 'يوحّد النتائج في جدول واحد', en: 'Unify the results into one table' },
      { ar: 'يشير إلى المصدر لكل صف', en: 'Name the source of every row' }
    ],
    output: { ar: 'جدول بدء موحّد مع تمييز المسارات غير المقروءة.', en: 'A unified startup table, marking the routes that were not read.' },
    risk: 'read-only'
  },
  'system-services-map': {
    purpose: { ar: 'فهم اعتماديات الخدمات قبل تعطيل أي منها.', en: 'Understand service dependencies before disabling any of them.' },
    steps: [
      { ar: 'يقرأ اعتماديات كل خدمة', en: 'Read each service dependencies' },
      { ar: 'يرسم الروابط بينها', en: 'Draw the links between them' },
      { ar: 'يعلّم الخدمات المحمية', en: 'Mark protected services' }
    ],
    output: { ar: 'خريطة اعتماديات من بيانات الخدمات الحقيقية.', en: 'A dependency map built from the real service data.' },
    risk: 'read-only'
  },
  'system-timeline': {
    purpose: { ar: 'وضع الأحداث والإقلاع والتغييرات على خط زمني واحد.', en: 'Place events, boots and changes on one timeline.' },
    steps: [
      { ar: 'يوحّد مصادر الأحداث بترتيبها الزمني', en: 'Merge event sources in time order' },
      { ar: 'يجمع المتقارب في مجموعة واحدة', en: 'Group events that cluster together' },
      { ar: 'يفتح الحدث لتفاصيله الأصلية', en: 'Open an event to its original details' }
    ],
    output: { ar: 'خط زمني مبني على أحداث مسجلة فعلًا فقط.', en: 'A timeline built only from events that were actually recorded.' },
    risk: 'read-only'
  }
};
