/**
 * Storage world copy.
 *
 * Every label names something the interface can actually show. Three engines
 * feed this world — the volume table, the large-file walk and the duplicate
 * walk — and none of them deletes anything, so no string here promises freed
 * space, only space that could be recovered after a review the product does not
 * perform for you.
 */
export const storageCopy: Record<string, { ar: string; en: string }> = {
  // Head
  'store.head.title': { ar: 'أطلس المساحة', en: 'The Volume Atlas' },
  'store.head.subtitle': {
    ar: 'قراءة مباشرة لجدول الأقراص في Windows، ومشيٌ حقيقي في مجلد تختاره أنت. لا يُحذف شيء، ولا يُجمَع رقمٌ مع رقمٍ آخر لا ينتميان إلى قياس واحد.',
    en: 'A live read of the Windows volume table, plus a real walk through one folder you choose. Nothing is deleted, and no two measurements that were not taken together are ever added.'
  },
  'store.head.read': { ar: 'قراءة الأقراص', en: 'Read volumes' },
  'store.head.reading': { ar: 'جارٍ القراءة…', en: 'Reading…' },
  'store.head.readAt': { ar: 'قُرئت الأقراص {time}', en: 'Volumes read {time}' },
  'store.head.providers': { ar: 'المصدر: {volume} · {physical}', en: 'Sources: {volume} · {physical}' },

  // Metrics
  'store.metric.volumes': { ar: 'أحجام محلية', en: 'Local volumes' },
  'store.metric.volumesNote': { ar: 'من جدول الأقراص المنطقية', en: 'from the logical disk table' },
  'store.metric.capacity': { ar: 'السعة المقاسة', en: 'Measured capacity' },
  'store.metric.capacityNote': { ar: 'مجموع ما أبلغت عنه Windows', en: 'summed only over reported volumes' },
  // The sum is only a sum of what answered. A volume Windows gave no capacity
  // for is named here rather than silently counted as zero bytes of disk.
  'store.metric.unmeasured': { ar: '{count} بلا سعة مُبلَغ عنها', en: '{count} reported no capacity' },
  'store.metric.unlabelled': { ar: '{count} بلا تصنيف ضغط', en: '{count} carried no pressure label' },
  'store.metric.free': { ar: 'المتبقي', en: 'Room left' },
  'store.metric.freeNote': { ar: 'عبر كل الأحجام', en: 'across every volume' },
  'store.metric.pressured': { ar: 'تحت الضغط', en: 'Under pressure' },
  'store.metric.pressuredNote': { ar: 'أقل من 10% مساحة حرة', en: 'below 10% free space' },
  'store.metric.physical': { ar: 'أقراص فعلية', en: 'Physical disks' },
  'store.metric.reclaim': { ar: 'قابل للاسترجاع', en: 'Recoverable' },
  'store.metric.reclaimNote': { ar: 'نسخ مطابقة تحقّقت منها SHA-256', en: 'copies matched byte-for-byte' },

  // Volume bays
  'store.bay.title': { ar: 'الأحجام على هذا الجهاز', en: 'The volumes on this machine' },
  'store.bay.hint': {
    ar: 'كل شريط حجم واحد: ما يشغله Windows منه وما بقي له. العلامات هي حدود المساحة الحرة التي يعتبرها النظام ضغطًا.',
    en: 'Each rail is one volume — what it holds and what it still has room for. The ticks mark the free-space levels Windows itself treats as pressure.'
  },
  'store.bay.unnamed': { ar: 'حجم بلا اسم', en: 'Unnamed volume' },
  'store.bay.used': { ar: 'مستخدم', en: 'used' },
  'store.bay.free': { ar: 'حر', en: 'free' },
  'store.bay.of': { ar: 'من', en: 'of' },
  'store.bay.noCapacity': { ar: 'لم تُبلِغ Windows عن السعة', en: 'Windows reported no capacity' },
  'store.bay.fileSystem': { ar: 'نظام الملفات', en: 'File system' },
  'store.bay.serial': { ar: 'الرقم التسلسلي', en: 'Serial' },
  'store.bay.basis': { ar: 'أساس التصنيف: {basis}', en: 'Pressure basis: {basis}' },
  'store.bay.walk': { ar: 'امشِ في هذا الحجم', en: 'Walk this volume' },
  'store.bay.walkHint': { ar: 'يفحص الجذر حتى حدود الميزانية، ولا يغيّر شيئًا.', en: 'Reads the root up to the scan budget and changes nothing.' },
  'store.bay.railLabel': { ar: '{id}: {used} مستخدم، {free} متاح، {size} إجمالًا', en: '{id}: {used} used, {free} free of {size} total' },
  'store.bay.selected': { ar: 'الحجم المحدد', en: 'Selected volume' },
  'store.pressure.critical': { ar: 'حرج', en: 'Critical' },
  'store.pressure.high': { ar: 'مرتفع', en: 'High' },
  'store.pressure.medium': { ar: 'متوسط', en: 'Medium' },
  'store.pressure.healthy': { ar: 'مريح', en: 'Healthy' },
  'store.pressure.unknown': { ar: 'غير معروف', en: 'Unknown' },

  // Physical disks
  'store.metal.title': { ar: 'الأقراص الفعلية', en: 'Physical disks' },
  'store.metal.hint': { ar: 'من MSFT_PhysicalDisk: الطراز، والوسط، والناقل، والحالة التي أبلغ عنها النظام.', en: 'From MSFT_PhysicalDisk: model, media, bus and the health Windows reports.' },
  'store.metal.media': { ar: 'الوسط', en: 'Media' },
  'store.metal.bus': { ar: 'الناقل', en: 'Bus' },
  'store.metal.health': { ar: 'الصحة', en: 'Health' },
  'store.metal.temperature': { ar: 'الحرارة', en: 'Temperature' },
  'store.metal.temperatureAbsent': { ar: 'لا يبلّغ هذا المصدر عن درجة حرارة', en: 'This source reports no temperature' },
  'store.metal.unavailable': { ar: 'لم يُجب مصدر الأقراص الفعلية، فبياناتها غائبة عن هذه القراءة.', en: 'The physical disk provider did not answer, so its details are absent from this read.' },
  'store.metal.empty': { ar: 'لم يُبلِغ النظام عن أي قرص فعلي.', en: 'Windows reported no physical disks.' },

  // Reclaim deck
  'store.deck.title': { ar: 'منضدة المشي', en: 'The walk bench' },
  'store.deck.hint': {
    ar: 'ثلاثة مشي مستقلة على مجلد واحد. لكل مشي نتائجه وميزانيته، ولا يُجمَع مجموعها معًا.',
    en: 'Three independent walks over one folder. Each has its own result and its own budget, and their totals are never summed.'
  },
  'store.deck.root': { ar: 'المجلد', en: 'Walking' },
  'store.deck.choose': { ar: 'اختيار مجلد…', en: 'Choose folder…' },
  'store.deck.threshold': { ar: 'حدّ الملف الكبير', en: 'Large-file threshold' },
  'store.deck.minimum': { ar: 'أصغر حجم للتكرار', en: 'Smallest duplicate' },
  'store.deck.limit': { ar: 'حدّ النتائج', en: 'Result limit' },
  'store.deck.heavy': { ar: 'الملفات الثقيلة', en: 'Heavy files' },
  'store.deck.heavyNote': { ar: 'أكبر من الحدّ الذي حددته', en: 'over the threshold you set' },
  'store.deck.duplicates': { ar: 'التكرارات المطابقة', en: 'Verified duplicates' },
  'store.deck.duplicatesNote': { ar: 'تطابق في الحجم ثم تحقق بـ SHA-256', en: 'size match, then SHA-256' },
  'store.deck.empties': { ar: 'المجلدات الفارغة', en: 'Empty folders' },
  'store.deck.emptiesNote': { ar: 'لا تسترجع بايتًا واحدًا', en: 'recovers no bytes at all' },
  // What the figure counts, before any walk has answered. It cannot be the note
  // below: that one is a caveat about bytes, and a lane that has not walked was
  // showing the same sentence twice in a row.
  'store.deck.emptiesUnit': { ar: 'مجلد لا يحوي شيئًا', en: 'holding nothing' },
  'store.deck.run': { ar: 'امشِ', en: 'Walk' },
  'store.deck.runAll': { ar: 'المشي الثلاثي', en: 'Run all three' },
  'store.deck.running': { ar: 'جارٍ المشي…', en: 'Walking…' },
  'store.deck.rerun': { ar: 'إعادة المشي', en: 'Walk again' },
  // Every one of these carries its own count: `fill` replaces only the tokens a
  // template actually contains, so a key written as a bare noun silently drops
  // the number the caller passed and renders "files examined" with nothing in
  // front of it. The placeholder test in tests/copy-placeholders.test.ts keeps
  // the four count-bearing keys honest.
  'store.deck.filesScanned': { ar: '{count} ملفًا فُحص', en: '{count} files examined' },
  'store.deck.matching': { ar: '{count} ملفًا مطابقًا', en: '{count} matching files' },
  'store.deck.groups': { ar: '{count} مجموعة مطابقة', en: '{count} verified sets' },
  'store.deck.duplicateFiles': { ar: '{count} ملفًا مكررًا', en: '{count} duplicate files' },
  'store.deck.reclaimable': { ar: 'قابل للاسترجاع', en: 'recoverable' },
  'store.deck.walkedBytes': { ar: 'بايتات قِيست', en: 'bytes measured' },
  'store.deck.thresholdAt': { ar: 'الحدّ {size}', en: 'threshold {size}' },
  'store.deck.at': { ar: 'في {time}', en: 'at {time}' },
  'store.deck.traversal': { ar: 'ممشٍ في {folders} مجلدًا · {files} ملفًا', en: '{folders} folders walked · {files} files' },
  'store.deck.accessDenied': { ar: '{count} مجلدًا لم يُسمح بقراءته', en: '{count} folders could not be read' },
  'store.deck.skippedLinks': { ar: '{count} نقطة إعادة توجيه لم تُتبع', en: '{count} reparse points not followed' },
  'store.deck.placeholders': { ar: '{count} عنصر سحابي لم يُفتح', en: '{count} cloud placeholders left unopened' },
  'store.deck.hardlinked': { ar: '{count} ملف مرتبط صلبًا', en: '{count} hard-linked files' },
  'store.deck.partial': { ar: 'اكتمل المشي جزئيًا: توقف عند ميزانية الفحص، فالأرقام تغطي ما مُشي ولا تشمل المجلد كله.', en: 'The walk stopped at its scan budget, so these numbers cover what was walked, not the whole folder.' },
  'store.deck.cancelled': { ar: 'أُلغي هذا المشي. النتائج المعروضة من قراءة سابقة.', en: 'This walk was cancelled. What is shown is from an earlier read.' },

  // Honesty band
  'store.overlap.none': { ar: 'لم يَجْرِ بعد مشيان على نفس المجلد للمقارنة بينهما.', en: 'Two walks over the same folder have not run yet, so there is nothing to compare.' },
  'store.overlap.text': {
    ar: 'المشيان يمشيان في نفس المجلد، لذا يتداخلان: {count} من الملفات الثقيلة هي أيضًا نسخ مكررة محسوبة أعلاه. لا يُجمع الرقمون.',
    en: 'Both walks cover the same folder, so they overlap: {count} of the heavy files are also verified duplicate copies already counted above. The two numbers are not added.'
  },
  'store.overlap.bytes': { ar: '{size} مغطى بالتكرارات', en: '{size} of it is covered by the duplicate sets' },
  // Both walks ran over the same folder and did not meet: the honest statement
  // is that they are two readings of one place, not two piles to add up.
  'store.overlap.zero': { ar: 'المشيان جريا في نفس المجلد ولا ملف مشترك بينهما: الرقمون قياسان متداخلان لا مجموعان.', en: 'Both walks covered the same folder and share no file: the two figures are overlapping measurements, not two piles.' },
  'store.hardlink.policy': { ar: 'مجموعة الروابط الصلبة ملف واحد فعلي: مسترجعها صفر بايت.', en: 'A set of hard links is one physical file, so its recoverable size is zero bytes.' },
  'store.hardlink.zero': { ar: 'روابط صلبة · 0 بايت', en: 'hard links · 0 bytes' },
  'store.keeper': { ar: 'النسخة المقترح إبقاؤها', en: 'Suggested keeper' },
  'store.review': { ar: 'نسخ للمراجعة', en: 'copies to review' },
  'store.risk.high': { ar: 'مسار محمي', en: 'Protected path' },

  // Composition ladders
  'store.ladder.title': { ar: 'أين ذهبت البايتات', en: 'Where the walked bytes went' },
  'store.ladder.hint': { ar: 'نسبة كل صف من {size} قاسها المشي — لا من سعة القرص.', en: 'Each row is a share of the {size} the walk measured, not of the disk.' },
  'store.ladder.types': { ar: 'بالنوع', en: 'By kind' },
  'store.ladder.ages': { ar: 'بالعمر', en: 'By age' },
  'store.ladder.folders': { ar: 'بالمجلد', en: 'By folder' },
  'store.ladder.extensions': { ar: 'بالامتداد', en: 'By extension' },
  'store.ladder.files': { ar: '{count} ملفًا', en: '{count} files' },
  'store.ladder.empty': { ar: 'لا شيء بعد — شغّل أحد المشيات.', en: 'Nothing yet — run one of the walks.' },

  // Ledger
  'store.ledger.title': { ar: 'سجل المشي', en: 'The walk ledger' },
  'store.ledger.name': { ar: 'الملف', en: 'File' },
  // The empties tab lists folders, and a column headed "File" over eighty
  // folder names is the same mistake as labelling unread folders "files".
  'store.ledger.folder': { ar: 'المجلد', en: 'Folder' },
  'store.ledger.where': { ar: 'المكان', en: 'Where' },
  'store.ledger.kind': { ar: 'النوع', en: 'Kind' },
  'store.ledger.age': { ar: 'العمر', en: 'Age' },
  'store.ledger.size': { ar: 'الحجم', en: 'Size' },
  'store.ledger.modified': { ar: 'عُدّل', en: 'Modified' },
  'store.ledger.hash': { ar: 'البصمة', en: 'Digest' },
  'store.ledger.empty': { ar: 'لم يُعثر على شيء لهذا المجلد بعد.', en: 'Nothing has been found in this folder yet.' },
  'store.ledger.count': { ar: 'عرض {current} من {total}', en: 'Showing {current} of {total}' },
  'store.ledger.copies': { ar: 'النسخ', en: 'Copies' },
  'store.ledger.set': { ar: 'المجموعة', en: 'Set' },
  'store.ledger.risk': { ar: 'الحالة', en: 'Standing' },
  'store.ledger.folderscanned': { ar: '{count} مجلدًا مُشي', en: '{count} folders walked' },
  'store.duplicates.physicalGroups': { ar: 'مجموعات الملف الفعلي', en: 'Physical file groups' },
  'store.ledger.empties.empty': { ar: 'لا مجلد فارغ في هذا المشي.', en: 'That walk found no empty folder.' },
  'store.ledger.duplicates.empty': { ar: 'لا مجموعات مطابقة بعد التحقق في هذا المجلد.', en: 'No content-verified sets in this folder.' },
  'store.ledger.heavy.empty': { ar: 'لا ملف فوق الحدّ في ما مُشي من هذا المجلد.', en: 'No file in what was walked reaches the threshold.' },
  'store.filter.reset': { ar: 'إلغاء التصفية', en: 'Clear the ladder filter' },
  'store.risk.normal': { ar: 'مسار عادي', en: 'Ordinary path' },

  // The age ramp, named the same way the Files bench names it, because a file
  // does not change its age by moving between two worlds.
  'store.age.today': { ar: 'اليوم', en: 'Today' },
  'store.age.week': { ar: 'هذا الأسبوع', en: 'This week' },
  'store.age.month': { ar: 'هذا الشهر', en: 'This month' },
  // Latin digits, deliberately: every computed figure on this page comes out of
  // Intl.NumberFormat('ar'), which in this runtime prints Latin numerals, so an
  // Arabic-Indic ninety here would sit on the same rung as "18 files" and make
  // the ladder look like it speaks two languages.
  'store.age.quarter': { ar: '90 يومًا', en: '90 days' },
  'store.age.year': { ar: 'هذا العام', en: 'This year' },
  'store.age.older': { ar: 'أقدم من سنة', en: 'Older' },
  'store.age.unknown': { ar: 'بلا تاريخ', en: 'Undated' },

  // The walk's kind column. The labels travel with the engine's own classifier
  // (electron/advanced-local-services.cjs), whose group names are identifiers,
  // not text — a rung, a ledger cell and an inspector row all print the same
  // word, so all three read it from here.
  'store.kind.Images': { ar: 'صور', en: 'Images' },
  'store.kind.Video': { ar: 'فيديو', en: 'Video' },
  'store.kind.Audio': { ar: 'صوت', en: 'Audio' },
  'store.kind.Documents': { ar: 'مستندات', en: 'Documents' },
  'store.kind.Archives': { ar: 'أرشيفات', en: 'Archives' },
  'store.kind.Installers': { ar: 'برامج تثبيت', en: 'Installers' },
  'store.kind.Development': { ar: 'ملفات تطوير', en: 'Development' },
  'store.kind.Databases': { ar: 'قواعد بيانات', en: 'Databases' },
  'store.kind.Fonts': { ar: 'خطوط', en: 'Fonts' },
  'store.kind.Other': { ar: 'أخرى', en: 'Other' },
  'store.kind.No extension': { ar: 'بلا امتداد', en: 'No extension' },

  // Inspector
  // "الفاحص" reads as *the scanner* — an agent that examines things, which in
  // this world collides with the three walks that actually do the examining.
  // The panel is a place where a record is shown, and "المفتِّش" is the word
  // Arabic Windows and the Arabic browser tools already use for Inspector.
  'store.inspector.title': { ar: 'المفتِّش', en: 'Inspector' },
  'store.inspector.empty': { ar: 'اختر ملفًا من السجل أو مجموعة مكررات لعرض ما قياسه فعلًا.', en: 'Select a ledger row or a duplicate set to see what is actually measured about it.' },
  'store.inspector.attributes': { ar: 'الصفات المسجلة', en: 'Recorded attributes' },
  'store.inspector.members': { ar: 'أفراد المجموعة', en: 'Set members' },
  'store.inspector.actions': { ar: 'إجراءات على هذا العنصر', en: 'Actions on this item' },
  'store.inspector.noAction': { ar: 'لا يغيّر هذا العالم أي ملف: لا حذف ولا نقل من هنا.', en: 'This world changes nothing: no delete and no move from here.' },
  'store.action.reveal': { ar: 'إظهار في المستكشف', en: 'Show in Explorer' },
  'store.action.hash': { ar: 'احسب البصمة', en: 'Hash this file' },
  'store.action.hashing': { ar: 'جارٍ الحساب…', en: 'Hashing…' },
  'store.action.hashReady': { ar: 'محسوبة', en: 'Ready' },
  'store.action.deferred': { ar: 'عنصر سحابي: الحساب سيحمّله', en: 'Cloud placeholder: hashing would fetch it' },

  // The read board: what the inspector shows while nothing is selected.
  'store.read.standing': { ar: 'الحجم المعروض', en: 'Volume in view' },
  'store.read.noVolume': { ar: 'لم تُجب Windows عن جدول الأحجام، فلا سعة تُعرض هنا أيضًا.', en: 'Windows has not answered the volume table, so no capacity is shown here either.' },
  'store.read.reads': { ar: 'القراءات المسجلة', en: 'Reads on record' },
  'store.read.notrun': { ar: 'لم تَجْرِ بعد', en: 'not read yet' },
  'store.read.open': { ar: 'افتح هذا السجل', en: 'Open this ledger' },
  // Three shapes, decided by what is actually on record: nothing walked, one
  // walk, several walks that agree, several that do not. A single read has no
  // comparison to make, so it must not be counted as a unanimous set of one —
  // the board says there is nothing to combine yet instead.
  'store.read.agreeOne': { ar: 'قراءة واحدة مسجَّلة، فلا شيء يُجمَع معها بعد.', en: 'One read is on record, so there is nothing to combine with it yet.' },
  'store.read.agree': { ar: 'كل القراءات ({count}) مشَت على الجذر نفسه، فأرقامها تصف مجلدًا واحدًا.', en: 'All {count} reads walked the same root, so their figures describe one folder.' },
  'store.read.disagree': { ar: 'مشَت {reads} قراءة على {roots} جذور مختلفة، فلا تُجمَع أرقامها معًا.', en: '{reads} reads walked {roots} different roots, so their figures cannot be added together.' },
  'store.read.none': { ar: 'لم تُجب أي مشيٍ بعد، فلا شيء يُقارَن: خانات الأرقام الثلاثة أعلاه ما زالت فارغة.', en: 'No walk has answered yet, so there is nothing to compare — the three figure slots above are still empty.' },

  // An empty folder is a finding about a walk, not a measurement of a folder,
  // so its record reports the read that made it — root, coverage, time — rather
  // than the zero bytes every row already shows in the ledger column.
  'store.folder.parent': { ar: 'المجلد الأب', en: 'Parent folder' },
  'store.folder.reportedBy': { ar: 'المشي الذي وجده', en: 'Found empty by' },
  'store.folder.root': { ar: 'بدأ من', en: 'Walked from' },
  'store.folder.covered': { ar: 'مجلدات مُشِيَة', en: 'Folders walked' },
  'store.folder.at': { ar: 'وقت التقرير', en: 'Reported at' },
  'store.folder.note': { ar: 'الفراغ خبرٌ عن لحظة المشي لا عن المجلد الآن: قد يمتلئ لاحقًا، وحذفه لا يحرّر إلا مدخله في جدول الملفات.', en: 'Emptiness reports the moment of the walk, not the folder now: it can be refilled, and deleting it frees only its own entry in the file table.' },
  'store.action.walkFolder': { ar: 'امشِ في هذا المجلد', en: 'Walk this folder' },

  // States
  'store.state.idle': { ar: 'لم يَجْرِ', en: 'Not run' },
  'store.state.running': { ar: 'جارٍ', en: 'Running' },
  'store.state.ready': { ar: 'جاهز', en: 'Ready' },
  // A walk that hit its budget or lost files while being read: the numbers are
  // real, but they cover less than the folder, so the state is neither ready nor
  // failed and must not borrow either label.
  'store.state.partial': { ar: 'ناقص التغطية', en: 'Partly covered' },
  'store.state.failed': { ar: 'فشل', en: 'Failed' },
  'store.state.unavailable': { ar: 'الأداة غير متاحة', en: 'Engine unavailable' },
  'store.state.noVolumes': { ar: 'لم تُجب Windows عن جدول الأحجام، فلا تُعرض أي بيانات أقراص.', en: 'Windows did not answer the volume table, so no volume data is shown.' },
  'store.state.readFailed': { ar: 'تعذّرت قراءة الأقراص.', en: 'The volume read did not complete.' },
  'store.error.walk': { ar: 'لم يكتمل المشي: {reason}', en: 'The walk did not finish: {reason}' },
  'store.notice.picked': { ar: 'المجلد: {folder}', en: 'Folder set to {folder}' },
  'store.notice.revealFailed': { ar: 'لم يفتح المستكشف هذا المسار.', en: 'Explorer did not open that path.' },
  'store.services.title': { ar: 'خدمات هذا العالم', en: 'What this world offers' },
  'store.services.hint': { ar: 'الثنتا عشرة خدمة مصنّفة حسب ما هو مشغّل فعلًا وما لم يُبنَ بعد.', en: 'All twelve services are labelled by what really runs and what has not been built.' },
  'store.services.live': { ar: '{live} من {total} خدمات تستجيب اليوم', en: '{live} of {total} services respond today' },
  'store.services.openTool': { ar: 'شغّل هذا المحرك الآن', en: 'Run this engine now' }
};
