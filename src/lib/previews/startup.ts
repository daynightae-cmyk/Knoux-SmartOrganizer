import type { PreviewText } from '../service-preview';

/**
 * Startup — Boot Control.
 *
 * The real engine reads and writes the current user's Run key only. Everything
 * in this world inherits that boundary: no service here claims to see another
 * account's startup entries, and none invents an impact score.
 */
export const startupPreviews: Record<string, PreviewText> = {
  'startup-overview': {
    purpose: { ar: 'معرفة ما يبدأ تلقائيًا مع جلستك، ومن وضعه هناك.', en: 'Know what starts automatically with your session, and who put it there.' },
    steps: [
      { ar: 'يقرأ مفتاح Run الخاص بالمستخدم الحالي', en: 'Read the current user Run key' },
      { ar: 'يستخرج مسار كل برنامج وناشره', en: 'Extract each program path and publisher' },
      { ar: 'يعلّم العناصر المعطّلة والمنتهية', en: 'Mark entries that are disabled or missing' }
    ],
    output: { ar: 'سجل بدء حقيقي بحالة كل عنصر ومصدره، لا تقديرات أثر.', en: 'A real startup register with each entry state and source — no impact estimates.' },
    risk: 'read-only'
  },
  'startup-disable': {
    purpose: { ar: 'إيقاف برنامج من البدء مع النظام دون حذفه نهائيًا.', en: 'Stop a program from launching with Windows without deleting it.' },
    steps: [
      { ar: 'ينقل قيمة Run إلى مساحة إيقاف مؤقتة', en: 'Move the Run value into a parked holding area' },
      { ar: 'يقرأ المفتاح مجددًا للتأكد من النتيجة', en: 'Re-read the key to confirm the result' },
      { ar: 'يكتب سجلًا يذكر المسار الأصلي', en: 'Write a journal entry holding the original value' }
    ],
    output: { ar: 'قيمة محفوظة قابلة للاستعادة، وبرنامج لا يبدأ مع الجلسة.', en: 'A preserved value that can be restored, and a program that no longer starts.' },
    risk: 'reversible'
  },
  'startup-restore': {
    purpose: { ar: 'إعادة عنصر أوقفته إلى البدء التلقائي كما كان.', en: 'Return a disabled entry to automatic startup exactly as it was.' },
    steps: [
      { ar: 'يقرأ السجل ومسار القيمة الأصلية', en: 'Read the journal and the original value path' },
      { ar: 'يتأكد أن الاسم لم يُشغل به عنصر آخر', en: 'Confirm no other entry took the name' },
      { ar: 'يكتب القيمة ويعيد قراءتها', en: 'Write the value and read it back' }
    ],
    output: { ar: 'قيمة Run مستعادة ومؤكدة القراءة، وسجل يغلق الدورة.', en: 'A Run value restored and read back, with the journal closed out.' },
    risk: 'reversible'
  },
  'startup-sources': {
    purpose: { ar: 'تمييز ما يأتي من مفتاح المستخدم عمّا يأتي من مجلد البدء.', en: 'Tell what comes from the user key apart from what comes from a startup folder.' },
    steps: [
      { ar: 'يصنّف كل عنصر حسب مصدره', en: 'Classify each entry by its source' },
      { ar: 'يعرض المصادر غير المقروءة كفراغ معلن', en: 'Show unread sources as a declared gap' },
      { ar: 'يفتح مصدرًا لعرض عناصره', en: 'Open a source to list its entries' }
    ],
    output: { ar: 'خريطة مصادر صادقة، بما في ذلك المصادر التي لا تُقرأ بعد.', en: 'An honest source map, including the sources not read yet.' },
    risk: 'read-only'
  },
  'startup-journal': {
    purpose: { ar: 'مراجعة كل تغيير أُجري على البدء ومن قام به.', en: 'Review every startup change and who made it.' },
    steps: [
      { ar: 'يجمع تغييرات الجلسات السابقة', en: 'Collect changes from earlier sessions' },
      { ar: 'يعرض القيمة قبل وبعد لكل تغيير', en: 'Show the before and after value for each change' },
      { ar: 'يتيح التراجع عن تغيير واحد', en: 'Allow undoing one change' }
    ],
    output: { ar: 'سجل زمني قابل للتراجع، لا يتضمن تغييرات لم يقم بها KNOuX.', en: 'A chronological, undoable log that never claims changes KNOuX did not make.' },
    risk: 'reversible'
  },
  'startup-filter': {
    purpose: { ar: 'الوصول السريع إلى عنصر واحد داخل سجل طويل.', en: 'Reach one entry quickly inside a long register.' },
    steps: [
      { ar: 'يطابق الاسم أو الناشر أو المسار', en: 'Match on name, publisher or path' },
      { ar: 'يدعم تصفية الحالة والمصدر', en: 'Filter by state and source' },
      { ar: 'يحتفظ بالاختيار عند تغيير النمط', en: 'Keep the selection when the pattern changes' }
    ],
    output: { ar: 'قائمة مصغّرة بلا إعادة قراءة النظام.', en: 'A narrowed list without re-reading the system.' },
    risk: 'read-only'
  },
  'startup-impact': {
    purpose: { ar: 'شرح أثر عنصر البدء من دليل حقيقي لا من درجة مُختلقة.', en: 'Explain an entry impact from real evidence rather than an invented score.' },
    steps: [
      { ar: 'يعرض توقيت الإقلاع المقيس', en: 'Show measured boot timing' },
      { ar: 'يربطه بالعناصر التي تُقرأ فعلًا', en: 'Relate it to entries actually read' },
      { ar: 'يصرّح بما لا يمكن قياسه على هذا الجهاز', en: 'State what cannot be measured on this machine' }
    ],
    output: { ar: 'قراءة صادقة للأثر، أو فراغ صريح حين لا يوجد قياس.', en: 'An honest impact reading, or an explicit gap when no measurement exists.' },
    risk: 'read-only'
  },
  'startup-services': {
    purpose: { ar: 'ربط عنصر بدء بالخدمة التي يعتمد عليها.', en: 'Relate a startup entry to the service it depends on.' },
    steps: [
      { ar: 'يطابق مسار البرنامج مع سجل الخدمات', en: 'Match the program path against the service register' },
      { ar: 'يعرض الخدمة وحالتها الحالية', en: 'Show the service and its current state' },
      { ar: 'يشير إلى الاختلاف حين لا يوجد تطابق', en: 'Flag the difference when no match exists' }
    ],
    output: { ar: 'صلة موثقة بين عنصر وخدمة، أو نفي صريح.', en: 'A documented link between an entry and a service — or an explicit none.' },
    risk: 'read-only'
  },
  'startup-tasks': {
    purpose: { ar: 'عرض المهام المجدولة التي تعمل عند تسجيل الدخول.', en: 'Show scheduled tasks that run at sign-in.' },
    steps: [
      { ar: 'يستعلم Task Scheduler عن مشغلات الدخول', en: 'Query Task Scheduler for logon triggers' },
      { ar: 'يعرض المهمة ومسارها وحالتها', en: 'Show each task, its path and state' },
      { ar: 'يستبعد مهام النظام المحمية', en: 'Exclude protected system tasks' }
    ],
    output: { ar: 'قائمة مهام دخول حقيقية، دون تغيير أي مهمة.', en: 'A real list of logon tasks — no task modified.' },
    risk: 'read-only'
  },
  'startup-delay': {
    purpose: { ar: 'تأخير بدء برنامج بدل إيقافه، ليصل سطح المكتب أسرع.', en: 'Delay a program instead of disabling it, so the desktop arrives sooner.' },
    steps: [
      { ar: 'يختار عنصرًا واحدًا من السجل', en: 'Pick one entry from the register' },
      { ar: 'يعرض تأخيرًا مقترحًا بالثواني', en: 'Present a suggested delay in seconds' },
      { ar: 'يبني أمرًا معتمدًا ويعرضه قبل التنفيذ', en: 'Build an approved command and show it before running' }
    ],
    output: { ar: 'خطة تأخير مقروءة قبل التطبيق، قابلة للتراجع.', en: 'A delay plan you read before it applies, reversible afterwards.' },
    risk: 'reversible'
  },
  'startup-batch': {
    purpose: { ar: 'تحديد عدة عناصر ومراجعتها كحزمة واحدة.', en: 'Select several entries and review them as one batch.' },
    steps: [
      { ar: 'يجمع المحدد في سلة مرئية', en: 'Collect the selection into a visible tray' },
      { ar: 'يعرض ما سيحدث لكل عنصر', en: 'Show what will happen to each entry' },
      { ar: 'يتطلب تأكيدًا واحدًا للحزمة', en: 'Require one confirmation for the batch' }
    ],
    output: { ar: 'قائمة عمليات واضحة قبل أي كتابة.', en: 'An explicit operation list before any write.' },
    risk: 'reversible'
  },
  'startup-undo-all': {
    purpose: { ar: 'العودة بكل تغييرات البدء إلى حالتها الأولى.', en: 'Return every startup change to its original state.' },
    steps: [
      { ar: 'يقرأ السجل كاملًا ويتحقق من التوفر', en: 'Read the whole journal and check availability' },
      { ar: 'يعرض خطة استعادة قبل التنفيذ', en: 'Present a restore plan before running' },
      { ar: 'ينفّذ ويتحقق من كل قيمة بعدها', en: 'Apply and verify each value afterwards' }
    ],
    output: { ar: 'خطة استعادة شاملة مع تقرير تحقق لكل عنصر.', en: 'A complete restore plan with a per-entry verification report.' },
    risk: 'reversible'
  }
};
