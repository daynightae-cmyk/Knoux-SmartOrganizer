import type { PreviewText } from '../service-preview';

/**
 * Cleanup — the Quarantine Bay.
 *
 * The only destructive-adjacent world, and the one where the copy has to be
 * most careful: the product never deletes on the user's behalf. Every service
 * below either measures, or moves a file into a journaled quarantine that can
 * put it back.
 */
export const cleanupPreviews: Record<string, PreviewText> = {
  'cleanup-temp-preview': {
    purpose: { ar: 'معرفة ما يمكن تنظيفه فعلًا قبل الموافقة على تنظيف أي شيء.', en: 'Learn what can actually be cleaned before agreeing to clean anything.' },
    steps: [
      { ar: 'يحدّد جذر TEMP للمستخدم والنظام', en: 'Resolve the user and system TEMP roots' },
      { ar: 'يستبعد كل ملف أحدث من الحد العمري المحدد', en: 'Skip every file younger than the configured minimum age' },
      { ar: 'يقيس كل مرشح ويجمع النتيجة حسب الفئة', en: 'Measure each candidate and total them by category' }
    ],
    output: { ar: 'قائمة مرشحين حقيقية بأحجامها وتواريخها ودرجة أمان كل عنصر، دون تغيير أي ملف.', en: 'A real candidate list with sizes, dates and a per-item safety tier — no file changed.' },
    risk: 'read-only',
    inputs: [
      { kind: 'number', label: { ar: 'الحد العمري بالأيام', en: 'Minimum file age (days)' }, hint: { ar: 'الافتراضي من الإعدادات', en: 'Defaults to your setting' } }
    ]
  },
  'cleanup-temp-quarantine': {
    purpose: { ar: 'تحرير المساحة عبر نقل المرشحين إلى الحجر الصحي، لا حذفهم.', en: 'Free space by moving approved candidates into quarantine, never by deleting them.' },
    steps: [
      { ar: 'يعيد التحقق من هوية كل ملف معتمد', en: 'Re-verify the identity of every approved file' },
      { ar: 'ينقل الملف إلى مجلد الحجر مع بصمة SHA-256', en: 'Move it into the quarantine folder with its SHA-256 digest' },
      { ar: 'يكتب سجلًا قابلًا للتراجع لكل عنصر', en: 'Write one undoable journal entry per item' }
    ],
    output: { ar: 'حزمة حجر صحي تحمل كل ما نُقل، مع سجل يسمح بإعادته إلى مساره الأصلي.', en: 'A quarantine batch holding everything moved, plus a journal that can put it back.' },
    risk: 'reversible'
  },
  'cleanup-temp-undo': {
    purpose: { ar: 'إعادة أي ملف نُقل إلى الحجر، مع التحقق من بصمته قبل الإرجاع.', en: 'Put any quarantined file back, after confirming its digest still matches.' },
    steps: [
      { ar: 'يقرأ سجل الحزمة المختارة', en: 'Read the journal of the chosen batch' },
      { ar: 'يتأكد أن المسار الأصلي ما زال متاحًا', en: 'Confirm the original path is still free' },
      { ar: 'يعيد الملف ويتحقق من بصمته بعد الإرجاع', en: 'Restore the file and verify its digest afterwards' }
    ],
    output: { ar: 'ملف في مساره الأصلي، وسجل يقول صراحةً إن الاستعادة نجحت أو لماذا رُفضت.', en: 'The file back at its original path, with a journal entry stating success or the reason it refused.' },
    risk: 'reversible'
  },
  'cleanup-quarantine-list': {
    purpose: { ar: 'رؤية ما يحتجزه KNOuX الآن، ومتى انتهت مدة الاحتفاظ به.', en: 'See what KNOuX is holding right now and when each item stops being held.' },
    steps: [
      { ar: 'يجمع حزم الحجر الصحي من السجل', en: 'Collect quarantine batches from the journal' },
      { ar: 'يعرض حجم كل حزمة وتاريخها وعدد عناصرها', en: 'Show each batch size, date and item count' },
      { ar: 'يفتح الحزمة لعرض عناصرها فرادى', en: 'Open a batch to list its items individually' }
    ],
    output: { ar: 'جرد لما هو محتجز، لا شيء منه محذوف من القرص.', en: 'An inventory of what is being held — none of it removed from disk.' },
    risk: 'reversible'
  },
  'cleanup-estimate': {
    purpose: { ar: 'معرفة حجم ما يمكن استعادته، مقيسًا لا مقدَّرًا.', en: 'Know how much could be reclaimed, measured rather than guessed.' },
    steps: [
      { ar: 'يجمع نتائج الفحوصات المكتملة فقط', en: 'Collect only scans that actually completed' },
      { ar: 'يصنّف المجموع حسب الفئة والمصدر', en: 'Group the total by category and source' },
      { ar: 'يذكر صراحةً أي فئة لم تُفحص بعد', en: 'Name every category that has not been scanned yet' }
    ],
    output: { ar: 'مجموع مبني على قياسات حقيقية، مع فراغات معلنة بدل أرقام مُقدرة.', en: 'A total built from real measurements, with declared gaps instead of estimated numbers.' },
    risk: 'read-only'
  },
  'cleanup-recycle': {
    purpose: { ar: 'مراجعة محتويات سلة المحذوفات قبل تحرير مساحتها.', en: 'Review what the Recycle Bin holds before releasing its space.' },
    steps: [
      { ar: 'يقرأ حجم السلة من Windows', en: 'Read the bin size from Windows' },
      { ar: 'يعرض العناصر القابلة للإفراغ مع تواريخها', en: 'List the items that can be emptied with their dates' },
      { ar: 'يطلب موافقة صريحة قبل أي إفراغ', en: 'Require explicit approval before any emptying' }
    ],
    output: { ar: 'قائمة بالسلة وحجمها، والإفراغ يبقى خطوة معتمدة منفصلة.', en: 'The bin ledger and its size; emptying stays a separate approved step.' },
    risk: 'changes-system'
  },
  'cleanup-unused': {
    purpose: { ar: 'إيجاد ملفات لم تُفتح منذ مدة طويلة دون الحكم عليها تلقائيًا.', en: 'Find files nobody has opened in a long time without judging them automatically.' },
    steps: [
      { ar: 'يقرأ وقت آخر وصول لكل ملف', en: 'Read the last-access time of each file' },
      { ar: 'يرتّب النتائج من الأقدم وصولًا', en: 'Rank results by oldest access' },
      { ar: 'يستبعد ملفات النظام والمجلدات المحمية', en: 'Exclude system files and protected folders' }
    ],
    output: { ar: 'قائمة مرتّبة بآخر وصول، لا توصية حذف تلقائية.', en: 'A list ranked by last access — not an automatic deletion recommendation.' },
    risk: 'read-only',
    inputs: [
      { kind: 'select', label: { ar: 'عتبة الخمول', en: 'Idle threshold' }, options: [{ ar: '٩٠ يومًا', en: '90 days' }, { ar: 'سنة', en: 'One year' }] }
    ]
  },
  'cleanup-update-cache': {
    purpose: { ar: 'عرض ما يحتفظ به Windows Update من حزم تنزيل قديمة.', en: 'Show what Windows Update is holding in old download packages.' },
    steps: [
      { ar: 'يقرأ مجلد التنزيل في SoftwareDistribution', en: 'Read the SoftwareDistribution download folder' },
      { ar: 'يقيس الحزم غير المستخدمة حاليًا', en: 'Measure packages that are not in use' },
      { ar: 'يستبعد أي حزمة مرتبطة بتحديث قيد التنفيذ', en: 'Exclude any package tied to an update in flight' }
    ],
    output: { ar: 'حجم قابل للاستعادة مع تحذير: إيقاف خدمة التحديث مطلوب قبل التنظيف.', en: 'A reclaimable size, with the warning that the update service must stop first.' },
    risk: 'needs-admin'
  },
  'cleanup-browser-cache': {
    purpose: { ar: 'قياس ذاكرة التخزين المؤقت لكل متصفح وحساب على حدة.', en: 'Measure each browser profile cache on its own.' },
    steps: [
      { ar: 'يكتشف ملفات التعريف الموجودة', en: 'Discover the profiles that exist' },
      { ar: 'يقيس مجلد Cache لكل ملف تعريف', en: 'Measure each profile Cache folder' },
      { ar: 'يذكر أن المتصفح قد يعيد بناءها فورًا', en: 'Note that the browser may rebuild it immediately' }
    ],
    output: { ar: 'جدول لكل متصفح وملف تعريف، دون لمس أي ملف.', en: 'A row per browser and profile, without touching a single file.' },
    risk: 'read-only'
  },
  'cleanup-logs': {
    purpose: { ar: 'فحص سجلات النظام القديمة قبل التخلص منها.', en: 'Inspect old system logs before letting go of them.' },
    steps: [
      { ar: 'يجمع السجلات من مجلدات Windows وبرامجها', en: 'Collect logs from Windows and application folders' },
      { ar: 'يستبعد السجلات النشطة والمفتوحة', en: 'Exclude logs that are active or held open' },
      { ar: 'يعرض الأعمار والأحجام للمراجعة', en: 'Present ages and sizes for review' }
    ],
    output: { ar: 'قائمة سجلات مرشحة، مع تمييز ما لا يجوز حذفه.', en: 'A candidate log list, marking what must not be deleted.' },
    risk: 'changes-system'
  },
  'cleanup-schedule': {
    purpose: { ar: 'جدولة فحص التنظيف عبر Task Scheduler دون منحه حق الحذف.', en: 'Schedule the cleanup scan through Task Scheduler without granting it deletion rights.' },
    steps: [
      { ar: 'يبني مهمة تفحص فقط', en: 'Build a scan-only task' },
      { ar: 'يطلب رقم حسابك ومستوى الصلاحية', en: 'Ask for your account and privilege level' },
      { ar: 'يسجّل المهمة ويقرأها مرة أخرى للتأكيد', en: 'Register the task and read it back to confirm' }
    ],
    output: { ar: 'مهمة مجدولة للفحص فقط؛ الحجر يبقى بموافقتك اليدوية.', en: 'A scheduled scan only; quarantining stays your manual approval.' },
    risk: 'reversible'
  },
  'cleanup-reports': {
    purpose: { ar: 'الاحتفاظ بسجل لما نُظّف، ومتى، وبأي نتيجة.', en: 'Keep a record of what was cleaned, when, and with what result.' },
    steps: [
      { ar: 'يجمع تقارير الجلسات السابقة', en: 'Collect reports from previous sessions' },
      { ar: 'يعرض المحتجز والمنقول والسجل لكل جلسة', en: 'Show held, moved and journaled per session' },
      { ar: 'يتيح تصدير التقرير كملف محلي', en: 'Allow exporting the report as a local file' }
    ],
    output: { ar: 'أرشيف تقارير محلي قابل للتصدير، لا يُرسل إلى أي جهة.', en: 'A local archive of reports you can export — nothing sent anywhere.' },
    risk: 'read-only'
  }
};
