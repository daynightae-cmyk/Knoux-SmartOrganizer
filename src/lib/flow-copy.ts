/**
 * Copy for the Automation Flow Studio.
 *
 * The studio is a design surface, never an execution engine. Every string that
 * mentions running something either points at the real Windows Task Scheduler
 * path or names the absence of a flow engine. Drafts are explicitly labelled
 * session-only so the interface never implies a persistence it does not have.
 */
export const flowCopy: Record<string, { ar: string; en: string }> = {
  // Identity
  'flow.eyebrow': { ar: 'مختبر الأتمتة', en: 'Automation lab' },
  'flow.title': { ar: 'استوديو التدفق', en: 'Flow Studio' },
  'flow.lead': {
    ar: 'صمّم تدفقات محلية، راجع كل خطوة وصلاحية، ثم جدول فقط ما يستطيع Windows تنفيذه فعلاً.',
    en: 'Design local workflows, review every step and permission, then schedule only what Windows can really run.'
  },
  'flow.newSchedule': { ar: 'جدول جديد', en: 'New schedule' },
  'flow.newDraft': { ar: 'مسودة جديدة', en: 'New draft' },
  'flow.history': { ar: 'السجل', en: 'History' },
  'flow.previewJump': { ar: 'معاينة التدفق', en: 'Preview flow' },
  'flow.boundary': {
    ar: 'استوديو التدفق سطح تصميم. الجداول الحقيقية فقط تُنفّذ، عبر مجدول مهام Windows، وضمن مهام القراءة المسموح بها.',
    en: 'Flow Studio is a design surface. Only real schedules execute, through Windows Task Scheduler, inside the read-only allowlist.'
  },

  // Measured header statistics
  'flow.stat.schedules': { ar: 'جداول محلية', en: 'Local schedules' },
  'flow.stat.schedulesDetail': { ar: 'مسجلة في Windows', en: 'Registered in Windows' },
  'flow.stat.enabled': { ar: 'مفعّلة', en: 'Enabled' },
  'flow.stat.enabledDetail': { ar: 'ستعمل عند محفّزها', en: 'Will run on their trigger' },
  'flow.stat.templates': { ar: 'قوالب', en: 'Templates' },
  'flow.stat.templatesDetail': { ar: 'معاينة تصميم فقط', en: 'Design preview only' },
  'flow.stat.services': { ar: 'خدمات الأتمتة', en: 'Automation services' },
  'flow.stat.servicesDetail': { ar: 'من الكتالوج المعتمد', en: 'From the canonical catalogue' },

  // Library
  'flow.library.title': { ar: 'مكتبة التدفقات', en: 'Workflow library' },
  'flow.library.hint': { ar: 'جداول حقيقية وقوالب ومسودات جلسة.', en: 'Real schedules, templates and session drafts.' },
  'flow.library.search': { ar: 'ابحث في التدفقات والقوالب…', en: 'Search workflows, templates…' },
  'flow.library.filter': { ar: 'تصفية المكتبة', en: 'Filter the library' },
  'flow.library.all': { ar: 'الكل', en: 'All' },
  'flow.library.schedules': { ar: 'الجداول', en: 'Schedules' },
  'flow.library.templates': { ar: 'القوالب', en: 'Templates' },
  'flow.library.drafts': { ar: 'المسودات', en: 'Drafts' },
  'flow.library.categories': { ar: 'الفئات', en: 'Categories' },
  'flow.library.saved': { ar: 'الجداول الحقيقية', en: 'Real schedules' },
  'flow.library.savedHint': { ar: 'أنشأها مجدول مهام Windows', en: 'Created by Windows Task Scheduler' },
  'flow.library.templateSection': { ar: 'القوالب', en: 'Templates' },
  'flow.library.templateHint': { ar: 'تُحمَّل في المسودة ولا تسجل مهمة', en: 'Load into a draft; they register nothing' },
  'flow.library.draftSection': { ar: 'مسودات الجلسة', en: 'Session drafts' },
  'flow.library.draftHint': { ar: 'تبقى في هذه النافذة حتى إغلاق KNOuX', en: 'Kept in this window until KNOuX closes' },
  'flow.library.working': { ar: 'مسودة قيد العمل', en: 'Working draft' },
  'flow.library.empty': { ar: 'لا نتائج. امسح البحث أو اختر فئة أخرى.', en: 'No matches. Clear the search or choose another category.' },
  'flow.library.noSchedules': { ar: 'لا توجد جداول حقيقية بعد. أنشئ جدولاً لتسجيل مهمة Windows.', en: 'No real schedules yet. Create one to register a Windows task.' },
  'flow.library.noDrafts': { ar: 'لا توجد مسودات محفوظة في هذه الجلسة.', en: 'No drafts saved in this session.' },
  'flow.library.real': { ar: 'حقيقي', en: 'Real' },
  'flow.library.templateBadge': { ar: 'قالب', en: 'Template' },
  'flow.library.draftBadge': { ar: 'مسودة', en: 'Draft' },
  'flow.library.private': { ar: 'محلي وخاص', en: 'Local & private' },
  'flow.library.privateNote': {
    ar: 'الجداول تُخزَّن على هذا الجهاز. المسودات تعيش في هذه الجلسة فقط. لا سحابة ولا تتبع.',
    en: 'Schedules are stored on this device. Drafts live in this session only. No cloud, no tracking.'
  },
  'flow.library.unsaved': { ar: 'غير محفوظة', en: 'Not saved' },
  'flow.library.savedInSession': { ar: 'محفوظة في الجلسة', en: 'Saved in session' },
  'flow.library.check': { ar: 'فحص', en: 'Check' },
  'flow.library.warnings': { ar: 'تحذيرات', en: 'Warnings' },

  // Categories
  'flow.cat.all': { ar: 'كل الفئات', en: 'All categories' },
  'flow.cat.scans': { ar: 'فحوص', en: 'Scans' },
  'flow.cat.health': { ar: 'الصحة', en: 'Health' },
  'flow.cat.files': { ar: 'الملفات', en: 'Files' },
  'flow.cat.cleanup': { ar: 'التنظيف', en: 'Cleanup' },
  'flow.cat.utilities': { ar: 'أدوات مساعدة', en: 'Utilities' },

  // Composer
  'flow.composer.title': { ar: 'تسجيل جدول حقيقي', en: 'Register a real schedule' },
  'flow.composer.hint': {
    ar: 'الجدول يُنشأ عبر مجدول مهام Windows. لا يحفظ هذا النموذج مسودة استوديو.',
    en: 'The task is created through Windows Task Scheduler. This form does not save a studio draft.'
  },
  'flow.composer.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'flow.composer.foot': {
    ar: 'مهمة قراءة فقط · بلا صلاحيات إدارية · بلا حذف أو إصلاح تلقائي.',
    en: 'Read-only task · no administrator · no automatic deletion or repair.'
  },

  // Canvas
  'flow.canvas.title': { ar: 'لوحة التدفق', en: 'Workflow canvas' },
  'flow.canvas.hint': { ar: 'اختر عقدة لإعدادها. اسحب الخلفية للتحريك.', en: 'Select a node to configure it. Drag the background to pan.' },
  'flow.canvas.zoomIn': { ar: 'تكبير', en: 'Zoom in' },
  'flow.canvas.zoomOut': { ar: 'تصغير', en: 'Zoom out' },
  'flow.canvas.fit': { ar: 'ملاءمة', en: 'Fit' },
  'flow.canvas.reset': { ar: 'إعادة العرض', en: 'Reset view' },
  'flow.canvas.zoom': { ar: 'التكبير', en: 'Zoom' },
  'flow.canvas.add': { ar: 'إضافة عقدة', en: 'Add node' },
  'flow.canvas.addType': { ar: 'نوع العقدة الجديدة', en: 'New node type' },
  'flow.canvas.nodeCount': { ar: 'عقد', en: 'nodes' },
  'flow.canvas.designDraft': { ar: 'مسودة تصميم — غير محفوظة على القرص', en: 'Design draft — not saved to disk' },
  'flow.canvas.sessionSaved': { ar: 'محفوظة في هذه الجلسة فقط', en: 'Saved in this session only' },
  'flow.canvas.realView': { ar: 'جدول حقيقي — عرض تصميم للقراءة فقط', en: 'Real schedule — read-only design view' },
  'flow.canvas.selectPrompt': { ar: 'اختر جدولاً أو حمّل قالباً لبدء التصميم.', en: 'Select a schedule or load a template to start designing.' },
  'flow.canvas.removeNode': { ar: 'إزالة العقدة من المسودة', en: 'Remove node from draft' },
  'flow.canvas.deselect': { ar: 'إلغاء تحديد العقدة', en: 'Clear node selection' },
  'flow.canvas.realEditNote': {
    ar: 'هذه العقدة تعرض جدولاً حقيقياً. استخدم عناصر تحكم الجدول للتفعيل أو التشغيل أو الحذف؛ اللوحة لا تعدّل المهمة.',
    en: 'This node describes a real schedule. Use the schedule controls to enable, run or delete it; the canvas does not edit the task.'
  },
  'flow.canvas.draftEditNote': {
    ar: 'التعديلات تنطبق على هذه المسودة المحلية فقط ولا تنشئ مهمة Windows.',
    en: 'Changes apply to this local draft only and create no Windows task.'
  },

  // Node kinds and defaults
  'flow.kind.trigger': { ar: 'المحفّز', en: 'Trigger' },
  'flow.kind.condition': { ar: 'الشرط', en: 'Condition' },
  'flow.kind.action': { ar: 'الإجراء', en: 'Action' },
  'flow.kind.approval': { ar: 'الموافقة', en: 'Approval' },
  'flow.kind.result': { ar: 'النتيجة', en: 'Result' },
  'flow.node.trigger.title': { ar: 'تشغيل الجدول', en: 'Schedule fires' },
  'flow.node.trigger.sub': { ar: 'مجدول مهام Windows', en: 'Windows Task Scheduler' },
  'flow.node.condition.title': { ar: 'فحص الشرط', en: 'Check the condition' },
  'flow.node.condition.sub': { ar: 'قبل اقتراح الإجراء', en: 'Before proposing the action' },
  'flow.node.action.title': { ar: 'تشغيل مهمة قراءة فقط', en: 'Run a read-only task' },
  'flow.node.action.sub': { ar: 'ضمن القائمة المسموح بها', en: 'Inside the allowlist' },
  'flow.node.approval.title': { ar: 'طلب موافقة المستخدم', en: 'Require user approval' },
  'flow.node.approval.sub': { ar: 'توقف حتى التأكيد', en: 'Pause for confirmation' },
  'flow.node.result.title': { ar: 'تسجيل نتيجة موثقة', en: 'Record a verified result' },
  'flow.node.result.sub': { ar: 'في سجل العمليات المحلي', en: 'In local operation history' },
  'flow.node.status.ready': { ar: 'جاهز', en: 'Ready' },
  'flow.node.status.review': { ar: 'يحتاج مراجعة', en: 'Needs review' },
  'flow.node.status.readOnly': { ar: 'قراءة فقط', en: 'Read-only' },
  'flow.node.status.required': { ar: 'موافقة مطلوبة', en: 'Approval' },
  'flow.node.status.off': { ar: 'الموافقة مغلقة', en: 'Approval off' },
  'flow.node.status.record': { ar: 'عند التشغيل الحقيقي', en: 'On real runs' },

  // Configuration
  'flow.config.title': { ar: 'إعداد العقدة', en: 'Node configuration' },
  'flow.config.none': { ar: 'اختر عقدة على اللوحة لعرض إعدادها.', en: 'Select a node on the canvas to see its settings.' },
  'flow.config.readOnly': { ar: 'للقراءة فقط', en: 'Read-only' },
  'flow.config.general': { ar: 'عام', en: 'General' },
  'flow.config.nodeTitle': { ar: 'عنوان العقدة', en: 'Node title' },
  'flow.config.nodeTitleHint': { ar: 'اتركه فارغاً لاستخدام الاسم المعتمد.', en: 'Leave empty to use the canonical name.' },
  'flow.config.remove': { ar: 'إزالة من المسودة', en: 'Remove from draft' },
  'flow.config.trigger': { ar: 'إعداد المحفّز', en: 'Trigger configuration' },
  'flow.config.triggerKind': { ar: 'نوع المحفّز', en: 'Trigger type' },
  'flow.config.condition': { ar: 'الشرط والتحقق', en: 'Condition and validation' },
  'flow.config.conditionField': { ar: 'القيمة المفحوصة', en: 'Value checked' },
  'flow.config.conditionOp': { ar: 'المقارنة', en: 'Comparison' },
  'flow.config.conditionValue': { ar: 'الحد', en: 'Threshold' },
  'flow.config.conditionHint': {
    ar: 'يقارن هذا الشرط نتيجة الأداة قبل اقتراح الإجراء. لا يوقف أي شيء من تلقاء نفسه.',
    en: 'The condition compares the tool result before the action is proposed. It never changes anything by itself.'
  },
  'flow.config.action': { ar: 'معاملات الإجراء', en: 'Action parameters' },
  'flow.config.tool': { ar: 'المهمة المسموح بها', en: 'Allowlisted task' },
  'flow.config.actionHint': {
    ar: 'الأدوات الخمس هذه فقط يمكن جدولتها. الاستوديو لا ينفذها؛ التشغيل الحقيقي يظل عبر مجدول المهام.',
    en: 'Only these five tools can be scheduled. The studio does not execute them; real runs stay with Task Scheduler.'
  },
  'flow.config.approval': { ar: 'متطلب الموافقة', en: 'Approval requirement' },
  'flow.config.approvalMode': { ar: 'اطلب الموافقة', en: 'Ask for approval' },
  'flow.config.notify': { ar: 'الإشعار', en: 'Notification' },
  'flow.config.notifyHint': { ar: 'إشعارات Windows والبريد غير متصلة في هذه المرحلة.', en: 'Windows notifications and email are not connected at this stage.' },
  'flow.config.result': { ar: 'معالجة النتيجة', en: 'Result handling' },
  'flow.config.retention': { ar: 'عدد التشغيلات المحفوظة', en: 'Runs kept' },
  'flow.config.retentionHint': { ar: 'السجل الحقيقي يضيف تشغيلات الجدول الفعلية فقط.', en: 'History receives real schedule runs only.' },
  'flow.config.safety': { ar: 'الصلاحيات والسلامة', en: 'Permissions and safety' },
  'flow.config.errorHandling': { ar: 'معالجة الأخطاء', en: 'Error handling' },
  'flow.config.retry': { ar: 'عند الفشل', en: 'On failure' },
  'flow.config.onFailure': { ar: 'بعدها', en: 'Then' },
  'flow.config.validation': { ar: 'فحوص التصميم', en: 'Design checks' },
  'flow.config.validationOk': { ar: 'كل فحوص التصميم ناجحة.', en: 'All design checks pass.' },
  'flow.config.draftNote': {
    ar: 'تسري التعديلات على مسودة هذه الجلسة فقط. لا تُسجَّل مهمة Windows من هنا.',
    en: 'Changes apply to this session draft only. No Windows task is registered here.'
  },
  'flow.config.scheduleControls': { ar: 'عناصر تحكم الجدول الحقيقي', en: 'Real schedule controls' },
  'flow.config.lastRun': { ar: 'آخر تشغيل حقيقي', en: 'Last real run' },
  'flow.config.neverRun': { ar: 'لم يُشغَّل هذا الجدول بعد.', en: 'This schedule has not run yet.' },
  'flow.config.permissions': {
    ar: 'مهمة قراءة فقط · بلا رفع صلاحيات · بلا تغيير ملفات · بلا خدمة شبكة.',
    en: 'Read-only task · no elevation · no file changes · no network service.'
  },

  // Trigger values
  'flow.trigger.daily': { ar: 'يومي', en: 'Daily' },
  'flow.trigger.weekly': { ar: 'أسبوعي', en: 'Weekly' },
  'flow.trigger.monthly': { ar: 'شهري', en: 'Monthly' },
  'flow.trigger.startup': { ar: 'عند بدء التشغيل', en: 'At startup' },
  'flow.trigger.dailyLine': { ar: 'يوميًا في {time}', en: 'Daily at {time}' },
  'flow.trigger.weeklyLine': { ar: 'كل {day} في {time}', en: 'Every {day} at {time}' },
  'flow.trigger.monthlyLine': { ar: 'في اليوم {day} من كل شهر، {time}', en: 'Day {day} of each month, {time}' },
  'flow.trigger.startupLine': { ar: 'عند تسجيل الدخول إلى Windows', en: 'When Windows signs in' },

  // Conditions
  'flow.field.warnings': { ar: 'تحذيرات الفحص', en: 'Scan warnings' },
  'flow.field.candidates': { ar: 'عناصر تحتاج مراجعة', en: 'Items needing review' },
  'flow.field.freeSpace': { ar: 'المساحة الحرة (غ.ب)', en: 'Free space (GB)' },
  'flow.field.always': { ar: 'المتابعة دائمًا', en: 'Always continue' },
  'flow.op.atLeast': { ar: 'على الأقل', en: 'At least' },
  'flow.op.atMost': { ar: 'على الأكثر', en: 'At most' },
  'flow.op.equals': { ar: 'يساوي', en: 'Equals' },
  'flow.op.line': { ar: '{field} {op} {value}', en: '{field} {op} {value}' },
  'flow.op.alwaysLine': { ar: 'لا شرط — المتابعة دائمًا', en: 'No condition — always continue' },

  // Approval / notification / result
  'flow.approval.always': { ar: 'دائمًا', en: 'Always' },
  'flow.approval.warnings': { ar: 'عند ظهور عناصر للمراجعة', en: 'When review items appear' },
  'flow.approval.never': { ar: 'أبدًا (غير مستحسن)', en: 'Never (not recommended)' },
  'flow.approval.lineAlways': { ar: 'توقف للموافقة قبل كل إجراء', en: 'Pause for approval before every action' },
  'flow.approval.lineWarnings': { ar: 'توقف فقط عند وجود عناصر للمراجعة', en: 'Pause only when review items exist' },
  'flow.approval.lineNever': { ar: 'بلا بوابة موافقة', en: 'No approval gate' },
  'flow.notify.inApp': { ar: 'داخل التطبيق', en: 'In-app' },
  'flow.notify.windows': { ar: 'إشعار Windows', en: 'Windows notification' },
  'flow.notify.email': { ar: 'البريد الإلكتروني', en: 'Email' },
  'flow.notify.unavailable': { ar: 'غير متاح — لا تكامل متصل', en: 'Unavailable — no connected integration' },
  'flow.retention.10': { ar: 'آخر 10 تشغيلات', en: 'Last 10 runs' },
  'flow.retention.25': { ar: 'آخر 25 تشغيلًا', en: 'Last 25 runs' },
  'flow.retention.50': { ar: 'آخر 50 تشغيلًا', en: 'Last 50 runs' },
  'flow.retry.none': { ar: 'بلا إعادة محاولة', en: 'Do not retry' },
  'flow.retry.once': { ar: 'إعادة واحدة', en: 'Retry once' },
  'flow.retry.twice': { ar: 'إعادتان', en: 'Retry twice' },
  'flow.failure.pause': { ar: 'إيقاف مؤقت وإشعار', en: 'Pause and notify' },
  'flow.failure.disable': { ar: 'تعطيل الجدول', en: 'Disable the schedule' },
  'flow.failure.keep': { ar: 'إبقاء الجدول مفعّلًا', en: 'Keep the schedule enabled' },

  // Design validation
  'flow.valid.triggerRequired': { ar: 'أضف محفّزًا واحدًا على الأقل.', en: 'Add at least one trigger.' },
  'flow.valid.triggerSingle': { ar: 'يمكن أن يحتوي التدفق على محفّز واحد فقط.', en: 'A flow can contain only one trigger.' },
  'flow.valid.actionRequired': { ar: 'أضف إجراءً واحدًا على الأقل.', en: 'Add at least one action.' },
  'flow.valid.resultMissing': { ar: 'أضف خطوة نتيجة ليبقى أثر التشغيل واضحًا.', en: 'Add a result step so a run leaves a clear record.' },
  'flow.valid.conditionValue': { ar: 'أدخل حدًا رقميًا صالحًا لهذا الشرط.', en: 'Enter a valid numeric threshold for this condition.' },
  'flow.valid.approvalOff': { ar: 'الموافقة مغلقة؛ سيُقترح الإجراء بلا بوابة تأكيد.', en: 'Approval is off; the action would be proposed with no confirmation gate.' },
  'flow.valid.checksPass': { ar: 'كل فحوص التصميم ناجحة.', en: 'All design checks pass.' },
  'flow.valid.errors': { ar: 'أخطاء', en: 'errors' },
  'flow.valid.warnings': { ar: 'تحذيرات', en: 'warnings' },

  // Preview
  'flow.preview.title': { ar: 'معاينة التنفيذ', en: 'Execution preview' },
  'flow.preview.design': { ar: 'معاينة تصميم — لم يُنفّذ', en: 'Design preview — not executed' },
  'flow.preview.real': { ar: 'جدول حقيقي — يعمل عبر مجدول المهام', en: 'Real schedule — runs via Task Scheduler' },
  'flow.preview.steps': { ar: 'الخطوات المقترحة', en: 'Proposed steps' },
  'flow.preview.inputs': { ar: 'المدخلات', en: 'Inputs' },
  'flow.preview.output': { ar: 'المخرجات المتوقعة', en: 'Expected output' },
  'flow.preview.permissions': { ar: 'مراجعة الصلاحيات', en: 'Permission review' },
  'flow.preview.summary': { ar: 'الملخص', en: 'Summary' },
  'flow.preview.events': { ar: 'أحداث التشغيل', en: 'Operation events' },
  'flow.preview.noEvents': {
    ar: 'لا أحداث تشغيل. المسودة التصميمية لا تُنفّذ.',
    en: 'No execution events. A design draft cannot run.'
  },
  'flow.preview.eventPending': { ar: 'لم يسجل هذا الجدول تشغيلًا بعد.', en: 'This schedule has no recorded run yet.' },
  'flow.preview.eventHead': { ar: 'آخر تشغيل حقيقي مسجل', en: 'Last real recorded run' },
  'flow.preview.eventSuccess': { ar: 'ناجح', en: 'Succeeded' },
  'flow.preview.eventFailure': { ar: 'فشل', en: 'Failed' },
  'flow.preview.stepThrough': { ar: 'تقدّم خطوة', en: 'Step through' },
  'flow.preview.inspect': { ar: 'عرض المدخلات', en: 'Inspect inputs' },
  'flow.preview.reviewPerm': { ar: 'مراجعة الصلاحيات', en: 'Review permissions' },
  'flow.preview.saveDraft': { ar: 'حفظ مسودة الجلسة', en: 'Save session draft' },
  'flow.preview.hide': { ar: 'إخفاء المعاينة', en: 'Hide preview' },
  'flow.preview.show': { ar: 'إظهار المعاينة', en: 'Show preview' },
  'flow.preview.saved': {
    ar: 'حُفظت المسودة في هذه الجلسة فقط. إغلاق KNOuX يمحوها.',
    en: 'Draft saved in this session only. Closing KNOuX clears it.'
  },
  'flow.preview.executionDisabled': {
    ar: 'التنفيذ معطّل للمسودات. سجّل جدولاً حقيقياً لتشغيل مهمة قراءة فقط.',
    en: 'Execution is disabled for drafts. Register a real schedule to run a read-only task.'
  },
  'flow.preview.runSchedule': { ar: 'تشغيل الجدول الآن', en: 'Run schedule now' },
  'flow.preview.outputDefault': {
    ar: 'نتيجة أداة KNOuX معيارية تُحفظ في سجل العمليات المحلي.',
    en: 'A normalized KNOuX tool result stored in local operation history.'
  },
  'flow.preview.inputsNote': {
    ar: 'تأتي نطاقات المجلدات والحدود من مدخلات المهمة الحقيقية عند التشغيل.',
    en: 'Folder scopes and thresholds come from the task’s real inputs at run time.'
  },
  'flow.preview.perm.task': { ar: 'مجدول مهام Windows', en: 'Windows Task Scheduler' },
  'flow.preview.perm.taskDraft': { ar: 'التسجيل يحدث فقط عند حفظ جدول حقيقي.', en: 'Registration happens only when a real schedule is created.' },
  'flow.preview.perm.taskReal': { ar: 'المهمة مسجلة في Windows لهذا الجدول.', en: 'The task is registered in Windows for this schedule.' },
  'flow.preview.perm.readOnly': { ar: 'الأدوات المسموح بها قراءة فقط.', en: 'Allowlisted tools are read-only.' },
  'flow.preview.perm.admin': { ar: 'لا تُطلب صلاحيات إدارية.', en: 'No administrator elevation is requested.' },
  'flow.preview.perm.files': { ar: 'لا تغيير لملفات أو خدمات أو سجل النظام.', en: 'No file, service or registry changes.' },
  'flow.preview.perm.engine': { ar: 'اللوحة بلا محرك تنفيذ؛ الجداول الحقيقية تعمل عبر Windows.', en: 'The canvas has no executor; real schedules run through Windows.' },
  'flow.preview.permissionAllowed': { ar: 'ضمن الحدود', en: 'Within bounds' },
  'flow.preview.permissionDraft': { ar: 'تصميم فقط', en: 'Design only' },
  'flow.preview.approvalGate': { ar: 'بوابة الموافقة', en: 'Approval gate' },
  'flow.preview.readOnlyGate': { ar: 'قراءة فقط', en: 'Read-only' },
  'flow.preview.noEngine': { ar: 'لا محرك تدفق', en: 'No flow engine' },

  // Templates
  'flow.template.weeklyScan.name': { ar: 'فحص ذكي أسبوعي', en: 'Weekly Smart Scan' },
  'flow.template.weeklyScan.desc': { ar: 'ضغط القرص والتنزيلات والملفات المؤقتة كل يوم اثنين.', en: 'Disk pressure, Downloads and temporary files every Monday.' },
  'flow.template.healthDaily.name': { ar: 'لقطة صحة يومية', en: 'Daily health snapshot' },
  'flow.template.healthDaily.desc': { ar: 'قراءة المعالج والذاكرة والتخزين ووقت التشغيل مرة كل يوم.', en: 'Read CPU, memory, storage and uptime once a day.' },
  'flow.template.downloadsMonthly.name': { ar: 'جرد التنزيلات الشهري', en: 'Monthly Downloads audit' },
  'flow.template.downloadsMonthly.desc': { ar: 'جرد مجلد التنزيلات وإظهار أكبر ملفاته.', en: 'Inventory Downloads and surface its largest files.' },
  'flow.template.tempReview.name': { ar: 'مراجعة الملفات المؤقتة', en: 'Temporary files review' },
  'flow.template.tempReview.desc': { ar: 'معاينة المرشحين المؤقتين دون تنظيف.', en: 'Preview temporary candidates without cleaning.' },
  'flow.template.diskMonthly.name': { ar: 'نظرة شهرية للأقراص', en: 'Monthly disk overview' },
  'flow.template.diskMonthly.desc': { ar: 'سعة الأقراص والمساحة الحرة ونظام الملفات.', en: 'Drive capacity, free space and filesystem.' },
  'flow.template.blank.name': { ar: 'لوحة فارغة', en: 'Blank canvas' },
  'flow.template.blank.desc': { ar: 'ابدأ بالشكل الخماسي المعتمد: محفّز، شرط، إجراء، موافقة، نتيجة.', en: 'Start with the canonical five steps: trigger, condition, action, approval, result.' },
  'flow.template.use': { ar: 'استخدام القالب', en: 'Use template' },
  'flow.template.designOnly': { ar: 'تصميم فقط', en: 'Design only' },

  // Draft naming
  'flow.draft.untitled': { ar: 'تصميم بلا عنوان', en: 'Untitled design' },
  'flow.draft.fromTemplate': { ar: 'مسودة من قالب', en: 'Draft from template' },
  'flow.draft.name': { ar: 'اسم المسودة', en: 'Draft name' },
  'flow.draft.sessionOnly': { ar: 'للجلسة فقط', en: 'Session only' },

  // Canvas notices
  'flow.notice.draftCreated': { ar: 'حُمّل القالب في مسودة جلسة جديدة.', en: 'Template loaded into a new session draft.' },
  'flow.notice.draftReset': { ar: 'بدأت مسودة جديدة.', en: 'Started a new draft.' },
  'flow.notice.nodeAdded': { ar: 'أُضيفت العقدة إلى المسودة.', en: 'Node added to the draft.' },
  'flow.notice.nodeRemoved': { ar: 'أُزيلت العقدة من المسودة.', en: 'Node removed from the draft.' },
  'flow.notice.scheduleSelected': { ar: 'عرض تصميم للجدول الحقيقي. لا تعديل على المهمة.', en: 'Design view of the real schedule. The task is not edited.' }
};
