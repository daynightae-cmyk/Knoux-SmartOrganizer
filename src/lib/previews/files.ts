import type { PreviewText } from '../service-preview';

/**
 * Files — Instant Find.
 *
 * Six real engines around the Downloads folder: inventory, the preview/apply/
 * undo organisation cycle, empty folders and hashing. Nothing here builds a
 * durable index of the whole disk.
 */
export const filePreviews: Record<string, PreviewText> = {
  'file-downloads-inventory': {
    purpose: { ar: 'فهم محتوى مجلد التنزيلات دون فتحه ملفًا ملفًا.', en: 'Understand what the Downloads folder holds without opening it file by file.' },
    steps: [
      { ar: 'يقرأ شجرة التنزيلات ومجلداتها', en: 'Read the Downloads tree and its folders' },
      { ar: 'يجمع كل ملف بنوعه وحجمه وعمره', en: 'Collect each file with type, size and age' },
      { ar: 'يجمّع النتائج في أشرطة', en: 'Group the results into bands' }
    ],
    output: { ar: 'جرد تنزيلات حقيقي بأشرطة النوع والعمر والمجلد.', en: 'A real Downloads inventory with kind, age and folder bands.' },
    risk: 'read-only'
  },
  'file-organize-preview': {
    purpose: { ar: 'معاينة خطة ترتيب كاملة قبل نقل أي ملف.', en: 'Preview a complete organisation plan before any file moves.' },
    steps: [
      { ar: 'يصنّف كل ملف حسب القواعد', en: 'Classify each file against the rules' },
      { ar: 'يحسب الاسم النهائي والمسار', en: 'Compute the final name and destination' },
      { ar: 'يكشف التعارض قبل التنفيذ', en: 'Detect conflicts before execution' }
    ],
    output: { ar: 'خطة قابلة للمراجعة لكل ملف، دون نقل شيء.', en: 'A reviewable per-file plan — nothing moved.' },
    risk: 'read-only'
  },
  'file-organize-apply': {
    purpose: { ar: 'تنفيذ خطة راجعتها أنت فقط.', en: 'Execute a plan you have personally reviewed.' },
    steps: [
      { ar: 'يتحقق أن الخطة لم تتقادم', en: 'Confirm the plan has not gone stale' },
      { ar: 'ينقل كل ملف مع التحقق من بصمته', en: 'Move each file with digest verification' },
      { ar: 'يكتب سجل تراجع لكل عملية', en: 'Write one undo entry per operation' }
    ],
    output: { ar: 'ملفات في أماكنها الجديدة وسجل يستطيع إرجاعها.', en: 'Files in their new homes, with a journal that can return them.' },
    risk: 'reversible'
  },
  'file-organize-undo': {
    purpose: { ar: 'إرجاع تنظيم سابق إلى ما كان عليه بالضبط.', en: 'Return a previous organisation to exactly what it was.' },
    steps: [
      { ar: 'يقرأ سجل الحزمة المختارة', en: 'Read the chosen batch journal' },
      { ar: 'يتأكد أن الهدف الأصلي متاح', en: 'Confirm the original destination is free' },
      { ar: 'يعيد الملف ويتحقق من بصمته', en: 'Restore the file and verify its digest' }
    ],
    output: { ar: 'ملفات في مساراتها الأولى، مؤكدة بالبصمة.', en: 'Files back at their original paths, confirmed by digest.' },
    risk: 'reversible'
  },
  'file-empty-folders': {
    purpose: { ar: 'إيجاد المجلدات الفارغة فعلًا داخل نطاق محدد.', en: 'Find folders that are genuinely empty inside a chosen scope.' },
    steps: [
      { ar: 'يمشي المجلدات ضمن ميزانية قراءة', en: 'Walk the folders inside a read budget' },
      { ar: 'يتحقق أن كل مرشح فارغ فعلًا', en: 'Confirm each candidate is really empty' },
      { ar: 'يعلن ما لم يُقرأ من المساحة', en: 'Declare the area left unread' }
    ],
    output: { ar: 'قائمة مجلدات فارغة موثقة، لا حذف ولا نقل.', en: 'A documented empty-folder list — no deletion, no move.' },
    risk: 'read-only'
  },
  'file-hash': {
    purpose: { ar: 'حساب بصمة SHA-256 لملف والتحقق منها.', en: 'Compute and verify a SHA-256 digest for a file.' },
    steps: [
      { ar: 'يقرأ الملف على شكل تدفق', en: 'Read the file as a stream' },
      { ar: 'يحسب SHA-256 أو SHA-512', en: 'Compute SHA-256 or SHA-512' },
      { ar: 'يعرض البصمة وحجم المصدر', en: 'Show the digest and the source size' }
    ],
    output: { ar: 'بصمة حقيقية قابلة للمقارنة، مع وقت الحساب.', en: 'A real comparable digest, with the time it took.' },
    risk: 'read-only',
    inputs: [{ kind: 'select', label: { ar: 'الخوارزمية', en: 'Algorithm' }, options: [{ ar: 'SHA-256', en: 'SHA-256' }, { ar: 'SHA-512', en: 'SHA-512' }] }]
  },
  'file-search': {
    purpose: { ar: 'البحث داخل ما فُهرس فقط، بحدود معلنة.', en: 'Search inside what has actually been indexed, with declared limits.' },
    steps: [
      { ar: 'يطابق الاسم أو الامتداد', en: 'Match on name or extension' },
      { ar: 'يحدد نطاق البحث الحالي', en: 'Restrict to the current scope' },
      { ar: 'يذكر أن البحث غير شامل للقرص', en: 'State that the search does not cover the whole disk' }
    ],
    output: { ar: 'نتائج من الجرد المحمّل، مع نطاقها الصريح.', en: 'Results from the loaded inventory, with their explicit scope.' },
    risk: 'read-only'
  },
  'file-type-map': {
    purpose: { ar: 'رؤية تركيب الملفات حسب النوع لا حسب المجلد.', en: 'See the file composition by kind rather than by folder.' },
    steps: [
      { ar: 'يصنّف كل ملف حسب امتداده', en: 'Classify each file by extension' },
      { ar: 'يجمع الحجم والعدد لكل نوع', en: 'Total size and count per kind' },
      { ar: 'يعرض النسبة من المقيس فقط', en: 'Show the share of what was measured only' }
    ],
    output: { ar: 'خريطة أنواع بنسب من الملفات المقيسة.', en: 'A kind map whose shares come from the measured files.' },
    risk: 'read-only'
  },
  'file-recents': {
    purpose: { ar: 'عرض الملفات التي تغيّرت مؤخرًا في نطاق محدد.', en: 'Show the files that changed most recently inside a scope.' },
    steps: [
      { ar: 'يقرأ تاريخ التعديل لكل ملف', en: 'Read each file modification time' },
      { ar: 'يجمعها في نطاقات زمنية', en: 'Group them into time bands' },
      { ar: 'يرتّب الأحدث أولًا', en: 'Order newest first' }
    ],
    output: { ar: 'خط زمني حقيقي للتعديلات، دون استنتاج نية.', en: 'A real modification timeline — no inference of intent.' },
    risk: 'read-only'
  },
  'file-largest': {
    purpose: { ar: 'إيجاد أثقل الملفات في المجلد المفحوص.', en: 'Find the heaviest files in the folder that was walked.' },
    steps: [
      { ar: 'يقيس حجم كل ملف أثناء المشي', en: 'Measure each file while walking' },
      { ar: 'يرتّب الأكبر مع عمره ونوعه', en: 'Rank largest with its age and kind' },
      { ar: 'يعلن حدود المشي إن بلغها', en: 'Declare the walk limits if they were reached' }
    ],
    output: { ar: 'قائمة أثقل الملفات المقيسة، لا تقديرًا للمجلد.', en: 'The heaviest measured files — not a guess about the folder.' },
    risk: 'read-only'
  },
  'file-metadata': {
    purpose: { ar: 'قراءة بيانات ملف الوصفية التي يخزّنها NTFS.', en: 'Read the descriptive metadata NTFS actually stores.' },
    steps: [
      { ar: 'يقرأ الحجم والتواريخ والسمات', en: 'Read size, timestamps and attributes' },
      { ar: 'يستخرج هوية الملف من NTFS', en: 'Read the NTFS file identity' },
      { ar: 'يعرض ما لا يخزنه النظام', en: 'Show what the filesystem does not store' }
    ],
    output: { ar: 'بطاقة وصفية حقيقية مع فراغات صريحة.', en: 'A real metadata sheet with explicit gaps.' },
    risk: 'read-only'
  },
  'file-provenance': {
    purpose: { ar: 'تتبّع أصل ملف: من كتبه ومتى وصل.', en: 'Trace a file origin: what wrote it and when it arrived.' },
    steps: [
      { ar: 'يقرأ تاريخ الإنشاء والتعديل', en: 'Read creation and modification times' },
      { ar: 'يستخرج المنطقة القادمة منها', en: 'Read the zone it arrived from' },
      { ar: 'يفصل الدليل عن الاستنتاج', en: 'Separate evidence from inference' }
    ],
    output: { ar: 'سجل أصل مبني على ما تخزنه الملفات فعلًا.', en: 'A provenance record built on what the file actually stores.' },
    risk: 'read-only'
  }
};
