import type { PreviewText } from '../service-preview';

/**
 * Hardware — Device Atlas.
 *
 * Two real engines. Temperatures and SMART attributes are genuinely not
 * available on this machine, so those services say so instead of drawing a
 * plausible gauge.
 */
export const hardwarePreviews: Record<string, PreviewText> = {
  'hardware-inventory': {
    purpose: { ar: 'تجميع مواصفات الجهاز الحقيقية في صفحة واحدة.', en: 'Gather the machine real specifications into one page.' },
    steps: [
      { ar: 'يقرأ اللوحة والمعالج والذاكرة', en: 'Read the board, processor and memory' },
      { ar: 'يضيف وحدات التخزين والشاشة', en: 'Add storage units and the display' },
      { ar: 'يعلن الحقول التي لا يبلّغها النظام', en: 'Declare the fields Windows does not report' }
    ],
    output: { ar: 'بطاقة جهاز بمواصفات مقروءة فعلًا، مع فراغات صريحة.', en: 'A device sheet with genuinely read specifications and explicit gaps.' },
    risk: 'read-only'
  },
  'hardware-battery': {
    purpose: { ar: 'قراءة حالة البطارية ونسبة الشحن وأثرها.', en: 'Read battery health, charge level and its effect.' },
    steps: [
      { ar: 'يقرأ تقرير البطارية من Windows', en: 'Read the battery report from Windows' },
      { ar: 'يعرض السعة المتبقية مقابل الأصلية', en: 'Show remaining capacity against design capacity' },
      { ar: 'يميّز غياب البطارية عن نفادها', en: 'Separate no battery from an empty one' }
    ],
    output: { ar: 'حالة بطارية حقيقية، أو "لا توجد بطارية" صريحة.', en: 'A real battery state, or an explicit "no battery".' },
    risk: 'read-only'
  },
  'hardware-cpu': {
    purpose: { ar: 'تفاصيل المعالج التي يبلّغها النظام عنه.', en: 'The processor details Windows actually reports.' },
    steps: [
      { ar: 'يقرأ الطراز والأنوية والخيوط', en: 'Read model, cores and threads' },
      { ar: 'يعرض التردد الأساسي والحالي', en: 'Show base and current clock' },
      { ar: 'يعلن ما لا يقرأه النظام', en: 'Declare what the system does not expose' }
    ],
    output: { ar: 'بطاقة معالج بلا أرقام مُقدّرة.', en: 'A processor card with no estimated figures.' },
    risk: 'read-only'
  },
  'hardware-gpu': {
    purpose: { ar: 'معرفة كرت الرسوميات والذاكرة المتاحة له.', en: 'Know the graphics adapter and its available memory.' },
    steps: [
      { ar: 'يعدّد محوّلات العرض', en: 'Enumerate the display adapters' },
      { ar: 'يقرأ الذاكرة والإصدار', en: 'Read memory and driver version' },
      { ar: 'يميّز المدمج من المنفصل', en: 'Separate integrated from discrete' }
    ],
    output: { ar: 'بطاقة رسوميات من بيانات الأجهزة، لا من التخمين.', en: 'A graphics card from device data — not from guesswork.' },
    risk: 'read-only'
  },
  'hardware-memory': {
    purpose: { ar: 'تفصيل وحدات الذاكرة والفتحات المتاحة.', en: 'Break down the memory modules and available slots.' },
    steps: [
      { ar: 'يقرأ حجم كل وحدة وسرعتها', en: 'Read each module size and speed' },
      { ar: 'يعرض توزيع الفتحات', en: 'Show the slot layout' },
      { ar: 'يحسب المتاح مقابل المستخدم', en: 'Compute available against used' }
    ],
    output: { ar: 'خريطة ذاكرة حقيقية بالمقادير المثبتة.', en: 'A real memory map with the installed amounts.' },
    risk: 'read-only'
  },
  'hardware-cycles': {
    purpose: { ar: 'مراجعة دورات شحن البطارية وتدهورها.', en: 'Review battery charge cycles and degradation.' },
    steps: [
      { ar: 'يقرأ عدد الدورات من تقرير البطارية', en: 'Read the cycle count from the battery report' },
      { ar: 'يقارن السعة الحالية بالأصلية', en: 'Compare current capacity to design capacity' },
      { ar: 'يشرح ما يعنيه التدهور', en: 'Explain what the degradation means' }
    ],
    output: { ar: 'قراءة دورات صادقة، أو إعلان عدم توفرها.', en: 'An honest cycle reading, or a declaration that it is unavailable.' },
    risk: 'read-only'
  },
  'hardware-thermal': {
    purpose: { ar: 'عرض حرارة المكوّنات حين يبلّغها النظام.', en: 'Show component temperature when the system reports it.' },
    steps: [
      { ar: 'يستعلم المستشعرات المتاحة', en: 'Query the available sensors' },
      { ar: 'يعرض القراءات مع وقتها', en: 'Show readings with their timestamps' },
      { ar: 'يعلن عدم التوفر بدل تخمين قيمة', en: 'Declare unavailability instead of guessing a value' }
    ],
    output: { ar: 'لوحة حرارة، أو حالة "المستشعر غير متاح" بوضوح.', en: 'A thermal panel, or a clear "sensor unavailable" state.' },
    risk: 'read-only'
  },
  'hardware-disks': {
    purpose: { ar: 'تفاصيل الأقراص المادية ونوع الوسيط.', en: 'Physical disk details and their media type.' },
    steps: [
      { ar: 'يعدّد الأقراص المادية', en: 'Enumerate the physical disks' },
      { ar: 'يقرأ النموذج والوسيط والحجم', en: 'Read model, media and size' },
      { ar: 'يربط كل قرص بوحداته المنطقية', en: 'Attach each disk to its volumes' }
    ],
    output: { ar: 'جدول أقراص حقيقي، بلا نسب صحة مُختلقة.', en: 'A real disk table — no invented health percentages.' },
    risk: 'read-only'
  },
  'hardware-usb': {
    purpose: { ar: 'جرد أجهزة USB المتصلة الآن.', en: 'Inventory the USB devices connected right now.' },
    steps: [
      { ar: 'يعدّد أجهزة الناقل المتصلة', en: 'Enumerate the connected bus devices' },
      { ar: 'يعرض الفئة والشركة', en: 'Show the class and vendor' },
      { ar: 'يميّز المتصل من المنفصل', en: 'Separate connected from detached' }
    ],
    output: { ar: 'قائمة USB حقيقية بحالة كل جهاز.', en: 'A real USB list with each device state.' },
    risk: 'read-only'
  },
  'hardware-display': {
    purpose: { ar: 'قراءة دقة الشاشة ومعدل تحديثها.', en: 'Read the display resolution and refresh rate.' },
    steps: [
      { ar: 'يعدّد الشاشات المتصلة', en: 'Enumerate the connected displays' },
      { ar: 'يقرأ الدقة والمعدل', en: 'Read resolution and refresh rate' },
      { ar: 'يعرض ترتيب الشاشات', en: 'Show the display arrangement' }
    ],
    output: { ar: 'بطاقة شاشة حقيقية لكل مخرج.', en: 'A real display card for each output.' },
    risk: 'read-only'
  },
  'hardware-audio': {
    purpose: { ar: 'جرد أجهزة الصوت وافتراضياتها.', en: 'Inventory audio devices and their defaults.' },
    steps: [
      { ar: 'يعدّد أجهزة الإخراج والإدخال', en: 'Enumerate output and input devices' },
      { ar: 'يعرض الجهاز الافتراضي', en: 'Show the default device' },
      { ar: 'يعلن الأجهزة المعطلة', en: 'Declare the disabled devices' }
    ],
    output: { ar: 'قائمة صوت حقيقية مع الافتراضي مميزًا.', en: 'A real audio list with the default marked.' },
    risk: 'read-only'
  },
  'hardware-health-report': {
    purpose: { ar: 'تجميع ما يمكن قوله عن صحة العتاد بصدق.', en: 'Gather what can honestly be said about hardware health.' },
    steps: [
      { ar: 'يجمع البطارية والحرارة والقرص', en: 'Collect battery, thermal and disk evidence' },
      { ar: 'يصنّف كل مصدر كمتاح أو غير متاح', en: 'Classify each source as available or not' },
      { ar: 'ينتج تقريرًا قابلًا للتصدير', en: 'Produce an exportable report' }
    ],
    output: { ar: 'تقرير عتاد يصرّح بحدوده قبل أرقامه.', en: 'A hardware report that declares its limits before its numbers.' },
    risk: 'read-only'
  }
};
