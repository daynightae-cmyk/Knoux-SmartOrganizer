import type { PreviewText } from '../service-preview';

/**
 * Storage — Volume Atlas.
 *
 * Every number in this world is either read from the Windows volume table, or
 * measured by a walk the person started. Nothing is summed across
 * measurements that were not taken together.
 */
export const storagePreviews: Record<string, PreviewText> = {
  'storage-disks': {
    purpose: { ar: 'رؤية كل وحدة تخزين وسعتها الحقيقية وما بقي فيها.', en: 'See every volume, its real capacity and what is left on it.' },
    steps: [
      { ar: 'يقرأ جدول الوحدات المنطقية من Windows', en: 'Read the logical volume table from Windows' },
      { ar: 'يقرأ الأقراص المادية ونوع الوسيط', en: 'Read physical disks and media type' },
      { ar: 'يحسب حد الضغط عند 20% و10% و5%', en: 'Mark the pressure levels at 20%, 10% and 5%' }
    ],
    output: { ar: 'أطلس أحجام بأرقام مقروءة فقط، دون جمع قياسات متفرقة.', en: 'A volume atlas of read figures only — no summing of separate measurements.' },
    risk: 'read-only'
  },
  'storage-large-files': {
    purpose: { ar: 'إيجاد الملفات الكبيرة داخل مجلد اخترت مشيه.', en: 'Find large files inside a folder you chose to walk.' },
    steps: [
      { ar: 'يمشي المجلد بميزانية قراءة معلنة', en: 'Walk the folder under a declared read budget' },
      { ar: 'يقيس كل ملف ويحتفظ بالأكبر', en: 'Measure each file and keep the largest' },
      { ar: 'يذكر ما لم يُقرأ من الملفات', en: 'Report the files it could not read' }
    ],
    output: { ar: 'سجل ملفات ثقيلة بأحجامها وأعمارها، مع حدود المشي.', en: 'A heavy-file ledger with sizes and ages, plus the walk limits.' },
    risk: 'read-only'
  },
  'storage-duplicates': {
    purpose: { ar: 'كشف الملفات المكررة بالبصمة لا بالاسم.', en: 'Detect duplicate files by digest, not by name.' },
    steps: [
      { ar: 'يجمع المرشحين بالحجم أولًا', en: 'Group candidates by size first' },
      { ar: 'يحسب بصمة كل مرشح متطابق', en: 'Hash each size-matched candidate' },
      { ar: 'يعرض المجموعات مع نسخة أصلية مقترحة', en: 'Present groups with a suggested keeper' }
    ],
    output: { ar: 'مجموعات مكررة مؤكدة بالبصمة، دون حذف أي نسخة.', en: 'Digest-confirmed duplicate groups — no copy deleted.' },
    risk: 'read-only'
  },
  'storage-treemap': {
    purpose: { ar: 'تمثيل المساحة كخريطة متداخلة تُرى بنظرة.', en: 'Represent space as a nested map you can read at a glance.' },
    steps: [
      { ar: 'يختار مجلدًا جذريًا للمسح', en: 'Choose a root folder to scan' },
      { ar: 'يجمع أحجام المجلدات الفرعية', en: 'Total the subfolder sizes' },
      { ar: 'يرسم المستطيلات بنسبة الحجم', en: 'Draw rectangles by size share' }
    ],
    output: { ar: 'خريطة متداخلة للمجلد الممسوح فقط.', en: 'A nested map for the scanned folder only.' },
    risk: 'read-only',
    inputs: [{ kind: 'folder', label: { ar: 'المجلد الجذر', en: 'Root folder' } }]
  },
  'storage-top-folders': {
    purpose: { ar: 'ترتيب المجلدات حسب ما شغله المسح فعلًا.', en: 'Rank folders by what the walk actually measured in them.' },
    steps: [
      { ar: 'يجمع حجم كل مجلد أثناء المشي', en: 'Total each folder size during the walk' },
      { ar: 'يرتّب من الأكبر إلى الأصغر', en: 'Order largest to smallest' },
      { ar: 'يعرض حصة كل مجلد من المقيس', en: 'Show each folder share of the measured total' }
    ],
    output: { ar: 'سلّم مجلدات مبني على المسح لا على وحدة التخزين كاملة.', en: 'A folder ladder built from the walk — not from the whole volume.' },
    risk: 'read-only'
  },
  'storage-filetypes': {
    purpose: { ar: 'معرفة أنواع الملفات التي تستهلك المساحة المقيسة.', en: 'See which kinds of file consume the measured space.' },
    steps: [
      { ar: 'يصنّف الملفات المقيسة حسب النوع', en: 'Classify the measured files by kind' },
      { ar: 'يجمع الحجم والعدد لكل نوع', en: 'Total size and count per kind' },
      { ar: 'يعرض النوع الأكبر أولًا', en: 'Show the largest kind first' }
    ],
    output: { ar: 'توزيع أنواع بنسب من المقيس فقط.', en: 'A kind distribution whose shares come only from what was measured.' },
    risk: 'read-only'
  },
  'storage-scan-overview': {
    purpose: { ar: 'تسجيل ما قيس ومتى ومن أي مصدر.', en: 'Record what was measured, when, and from which source.' },
    steps: [
      { ar: 'يسجّل كل قراءة بمصدرها ووقتها', en: 'Log every read with its source and time' },
      { ar: 'يعرض المشي وحالته وحدوده', en: 'Show the walk, its state and its limits' },
      { ar: 'لا يجمع قراءتين منفصلتين', en: 'Never add two separate reads together' }
    ],
    output: { ar: 'لوحة قراءة صريحة، بما فيها ما لم يُقرأ بعد.', en: 'An explicit read board, including what has not been read yet.' },
    risk: 'read-only'
  },
  'storage-fragmentation': {
    purpose: { ar: 'معرفة حالة تفتّت الملفات كما يبلّغها Windows.', en: 'Know file fragmentation as Windows reports it.' },
    steps: [
      { ar: 'يستعلم حالة تفتّت وحدة التخزين', en: 'Query the volume fragmentation state' },
      { ar: 'يعرض النسبة مع مصدرها', en: 'Show the percentage with its source' },
      { ar: 'يشرح أن الإصلاح خارج هذا العالم حاليًا', en: 'Explain that defragmentation is outside this world for now' }
    ],
    output: { ar: 'قراءة تفتّت للقراءة فقط، بلا إجراء إصلاح.', en: 'A read-only fragmentation figure — no defragmentation action.' },
    risk: 'read-only'
  },
  'storage-smart': {
    purpose: { ar: 'عرض بيانات SMART للقرص حين يوفّرها المحرّك.', en: 'Show disk SMART data when the drive exposes it.' },
    steps: [
      { ar: 'يستعلم حالة القرص من Windows', en: 'Query the drive health from Windows' },
      { ar: 'يقرأ السمات المتاحة فقط', en: 'Read only the attributes that are exposed' },
      { ar: 'يعلن عدم التوفر بوضوح', en: 'Declare unavailability explicitly' }
    ],
    output: { ar: 'لوحة صحة قرص صادقة، أو حالة "غير متاح" صريحة.', en: 'An honest drive-health panel, or an explicit unavailable state.' },
    risk: 'read-only'
  },
  'storage-reclaim': {
    purpose: { ar: 'بناء خطة استعادة مساحة من نتائج مقيسة.', en: 'Build a space-reclaim plan from measured results.' },
    steps: [
      { ar: 'يجمع نتائج المسح المكتملة', en: 'Collect the completed scan results' },
      { ar: 'يرتّب الفرص حسب الحجم والأمان', en: 'Order opportunities by size and safety' },
      { ar: 'يعرض خطة قبل أي إجراء', en: 'Present a plan before any action' }
    ],
    output: { ar: 'خطة استعادة قابلة للمراجعة، لا حذفًا تلقائيًا.', en: 'A reviewable reclaim plan — never automatic deletion.' },
    risk: 'reversible'
  },
  'storage-history': {
    purpose: { ar: 'مقارنة قياسات سابقة بقياس اليوم.', en: 'Compare earlier measurements with today.' },
    steps: [
      { ar: 'يجمع القياسات المحفوظة بتواريخها', en: 'Collect saved measurements with their dates' },
      { ar: 'يرسم التغيّر بين قراءتين', en: 'Chart the change between two reads' },
      { ar: 'يميّز التغيّر الحقيقي من اختلاف النطاق', en: 'Separate a real change from a different scope' }
    ],
    output: { ar: 'سجل قياسات صادق يشرح سبب كل فرق.', en: 'An honest measurement history that explains each difference.' },
    risk: 'read-only'
  },
  'storage-removable': {
    purpose: { ar: 'استكشاف الأقراص الخارجية ومساحتها.', en: 'Explore removable drives and their space.' },
    steps: [
      { ar: 'يعدّد الأقراص القابلة للإزالة', en: 'Enumerate the removable volumes' },
      { ar: 'يقرأ السعة والحالة', en: 'Read capacity and state' },
      { ar: 'يفتح محتواها للقراءة فقط', en: 'Open their contents read-only' }
    ],
    output: { ar: 'جرد أقراص خارجية حقيقي، دون أي كتابة عليها.', en: 'A real removable-drive inventory — nothing written to them.' },
    risk: 'read-only'
  }
};
