import type { PreviewText } from '../service-preview';

/**
 * Applications — Software Command.
 *
 * One real engine (the installed-apps inventory) plus the native icon service.
 * Install, repair and uninstall are review surfaces only: nothing here claims a
 * package operation happened.
 */
export const applicationPreviews: Record<string, PreviewText> = {
  'app-inventory': {
    purpose: { ar: 'جرد كل برنامج مثبّت على الجهاز مع ناشره وإصداره.', en: 'Inventory every program installed on the machine with its publisher and version.' },
    steps: [
      { ar: 'يقرأ سجلات التثبيت من Windows', en: 'Read the installation registers from Windows' },
      { ar: 'يستخرج الاسم والناشر والإصدار', en: 'Extract name, publisher and version' },
      { ar: 'يزيل التكرار بين السجلات', en: 'De-duplicate across the registers' }
    ],
    output: { ar: 'قائمة تطبيقات حقيقية قابلة للبحث والفرز.', en: 'A real, searchable, sortable application list.' },
    risk: 'read-only'
  },
  'app-identity': {
    purpose: { ar: 'عرض أيقونة كل برنامج كما يعرضه Windows نفسه.', en: 'Show each program icon exactly as Windows renders it.' },
    steps: [
      { ar: 'يقرأ الأيقونة من ملف التنفيذ', en: 'Read the icon from the executable' },
      { ar: 'يتحقق من التوقيع الرقمي', en: 'Check the digital signature' },
      { ar: 'يعرض الهوية أو بديلًا صريحًا', en: 'Show the identity, or an explicit fallback' }
    ],
    output: { ar: 'أيقونات حقيقية وبيانات هوية، دون تنزيل أي شعار.', en: 'Real icons and identity data — no logo ever downloaded.' },
    risk: 'read-only'
  },
  'app-search': {
    purpose: { ar: 'العثور على برنامج بالاسم أو الناشر أو الميزة.', en: 'Find a program by name, publisher or feature.' },
    steps: [
      { ar: 'يطابق الاسم والناشر معًا', en: 'Match name and publisher together' },
      { ar: 'يصفّي حسب النطاق والحجم', en: 'Filter by scope and size' },
      { ar: 'يحتفظ بالاختيار أثناء الكتابة', en: 'Keep the selection while typing' }
    ],
    output: { ar: 'نتائج فورية من الجرد المحمّل، دون إعادة قراءة.', en: 'Instant results from the loaded inventory — no re-read.' },
    risk: 'read-only'
  },
  'app-publisher': {
    purpose: { ar: 'معرفة من نشر البرامج المثبتة ومدى ثقتها.', en: 'See who published the installed programs and how trustworthy they are.' },
    steps: [
      { ar: 'يجمع البرامج حسب الناشر', en: 'Group programs by publisher' },
      { ar: 'يقرأ حالة التوقيع لكل ناشر', en: 'Read each publisher signature state' },
      { ar: 'يبرز الناشرين بلا توقيع', en: 'Highlight publishers with no signature' }
    ],
    output: { ar: 'ملف ناشر مبني على توقيعات حقيقية.', en: 'A publisher profile built from real signatures.' },
    risk: 'read-only'
  },
  'app-recent': {
    purpose: { ar: 'رؤية ما ثُبّت أو تغيّر مؤخرًا فقط.', en: 'See only what was installed or changed recently.' },
    steps: [
      { ar: 'يقرأ تاريخ التثبيت لكل برنامج', en: 'Read each program install date' },
      { ar: 'يرتّب الأحدث أولًا', en: 'Order newest first' },
      { ar: 'يميّز التثبيت من التحديث', en: 'Separate a fresh install from an update' }
    ],
    output: { ar: 'خط زمني للتغييرات الأخيرة بلا استنتاج.', en: 'A recent-change timeline without inference.' },
    risk: 'read-only'
  },
  'app-uninstall-queue': {
    purpose: { ar: 'تجهيز إزالة برامج ومراجعتها قبل التنفيذ.', en: 'Stage program removals and review them before anything runs.' },
    steps: [
      { ar: 'يجمع البرامج المحددة في قائمة', en: 'Collect the selected programs into a list' },
      { ar: 'يعرض أمر الإزالة لكل برنامج', en: 'Show the removal command per program' },
      { ar: 'يطلب موافقة صريحة منفصلة', en: 'Require a separate explicit approval' }
    ],
    output: { ar: 'خطة إزالة مقروءة؛ لا إزالة صامتة ولا نتيجة مُختلقة.', en: 'A readable removal plan — no silent removal, no invented result.' },
    risk: 'changes-system'
  },
  'app-leftovers': {
    purpose: { ar: 'إيجاد بقايا برامج أُزيلت من قبل.', en: 'Find what programs left behind after they were removed.' },
    steps: [
      { ar: 'يقارن مجلدات البرامج بالجرد', en: 'Compare program folders against the inventory' },
      { ar: 'يقرأ بقايا AppData والريجستري', en: 'Read AppData and registry remnants' },
      { ar: 'يعرض المرشح مع دليله', en: 'Show each candidate with its evidence' }
    ],
    output: { ar: 'قائمة بقايا مع تفسير سبب اعتبارها كذلك.', en: 'A leftover list with the reason each one counts as a leftover.' },
    risk: 'read-only'
  },
  'app-updates': {
    purpose: { ar: 'مقارنة الإصدار المثبت بأحدث إصدار معروف.', en: 'Compare the installed version against the newest known one.' },
    steps: [
      { ar: 'يقرأ الإصدار المثبت', en: 'Read the installed version' },
      { ar: 'يعرض المصدر الذي قارن معه', en: 'Name the source it compared against' },
      { ar: 'يميّز "لا تحديث" من "لا بيانات"', en: 'Separate "up to date" from "no data"' }
    ],
    output: { ar: 'حالة تحديث مع مصدرها وتاريخها.', en: 'An update state with its source and date.' },
    risk: 'read-only'
  },
  'app-size': {
    purpose: { ar: 'معرفة أي البرامج تشغل أكبر مساحة فعلًا.', en: 'See which programs actually occupy the most space.' },
    steps: [
      { ar: 'يجمع حجم مجلد كل برنامج', en: 'Total each program folder size' },
      { ar: 'يستبعد الملفات المشتركة', en: 'Exclude shared files' },
      { ar: 'يرتّب من الأكبر مع نسبة من القرص', en: 'Rank largest first with a share of the disk' }
    ],
    output: { ar: 'ترتيب أحجام مبني على قياس المجلدات.', en: 'A size ranking built from measured folders.' },
    risk: 'read-only'
  },
  'app-store-packages': {
    purpose: { ar: 'تمييز حزم المتجر من مثبّتات سطح المكتب.', en: 'Tell store packages apart from desktop installers.' },
    steps: [
      { ar: 'يقرأ حزم Appx المثبتة', en: 'Read the installed Appx packages' },
      { ar: 'يصنّف المصدر لكل حزمة', en: 'Classify the source of each package' },
      { ar: 'يعرض ما لا يمكن إدارته من هنا', en: 'Declare what cannot be managed from here' }
    ],
    output: { ar: 'جدول حزم حقيقي مع حدوده معلنة.', en: 'A real package table with its limits declared.' },
    risk: 'read-only'
  },
  'app-associations': {
    purpose: { ar: 'مراجعة البرنامج الافتراضي لكل نوع ملف.', en: 'Review the default program for each file type.' },
    steps: [
      { ar: 'يقرأ الارتباطات من الريجستري', en: 'Read the associations from the registry' },
      { ar: 'يعرض البرنامج الحالي لكل امتداد', en: 'Show the current handler per extension' },
      { ar: 'يطلب موافقة قبل أي تغيير', en: 'Require approval before any change' }
    ],
    output: { ar: 'جدول ارتباطات للقراءة فقط.', en: 'A read-only association table.' },
    risk: 'read-only'
  },
  'app-startup-impact': {
    purpose: { ar: 'ربط برنامج مثبّت بمدخل بدء تشغيل له.', en: 'Relate an installed program to the startup entry it owns.' },
    steps: [
      { ar: 'يطابق مسارات التنفيذ مع سجل البدء', en: 'Match executable paths against the startup register' },
      { ar: 'يعرض المدخل وحالته', en: 'Show the entry and its state' },
      { ar: 'يعلن عدم وجود صلة حين لا توجد', en: 'Declare no link when none exists' }
    ],
    output: { ar: 'صلة موثقة بين برنامج ومدخل بدء، أو نفي صريح.', en: 'A documented program-to-startup link, or an explicit none.' },
    risk: 'read-only'
  }
};
