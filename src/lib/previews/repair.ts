import type { PreviewText } from '../service-preview';

/**
 * Repair — Recovery Lab.
 *
 * Eight real repair engines, all of which need elevation. The copy never
 * promises a fix: it describes diagnosis, the command that would run, and the
 * verification step that follows it.
 */
export const repairPreviews: Record<string, PreviewText> = {
  'repair-component-check': {
    purpose: { ar: 'فحص سريع لسلامة مخزن مكوّنات Windows دون تغييره.', en: 'A fast check of the Windows component store health, without changing it.' },
    steps: [
      { ar: 'يشغّل DISM CheckHealth بصلاحية مسؤول', en: 'Run DISM CheckHealth with administrator rights' },
      { ar: 'يقرأ مخرجات الفحص كما هي', en: 'Read the tool output as it comes' },
      { ar: 'يصنّف النتيجة: سليم أو تلف أو غير معروف', en: 'Classify the verdict: healthy, corrupt, or unknown' }
    ],
    output: { ar: 'حكم واحد مع مخرجات الأداة الأصلية، دون أي إصلاح.', en: 'One verdict with the tool original output — no repair.' },
    risk: 'needs-admin'
  },
  'repair-component-scan': {
    purpose: { ar: 'فحص أعمق يكشف تلف المكوّنات المخفي عن الفحص السريع.', en: 'A deeper scan that finds component corruption the quick check misses.' },
    steps: [
      { ar: 'يشغّل DISM ScanHealth كمسؤول', en: 'Run DISM ScanHealth as administrator' },
      { ar: 'ينقل تقدّم العملية إلى السجل المرئي', en: 'Stream progress into the visible journal' },
      { ar: 'يعرض نتيجة الفحص لا تعديلًا', en: 'Report the scan result, not a modification' }
    ],
    output: { ar: 'نتيجة فحص موثقة؛ الإصلاح يبقى خدمة منفصلة.', en: 'A documented scan result; repair stays a separate service.' },
    risk: 'needs-admin'
  },
  'repair-component-restore': {
    purpose: { ar: 'إصلاح مخزن المكوّنات من مصدر Windows موثوق.', en: 'Repair the component store from a trusted Windows source.' },
    steps: [
      { ar: 'يعرض الأمر الكامل قبل التشغيل', en: 'Show the full command before it runs' },
      { ar: 'يحذر من المدة الطويلة والاعتماد على الشبكة', en: 'Warn about the long duration and network dependency' },
      { ar: 'يشغّل RestoreHealth ويقرأ نتيجته', en: 'Run RestoreHealth and read its verdict' }
    ],
    output: { ar: 'سجل إصلاح حقيقي بمخرجاته، ونجاح مثبت لا مُفترض.', en: 'A real repair log with its output, and a proven rather than assumed success.' },
    risk: 'needs-admin'
  },
  'repair-files-verify': {
    purpose: { ar: 'التحقق من ملفات النظام دون إصلاحها.', en: 'Verify the system files without repairing them.' },
    steps: [
      { ar: 'يشغّل SFC VerifyOnly كمسؤول', en: 'Run SFC VerifyOnly as administrator' },
      { ar: 'يجمع الملفات التالفة إن وُجدت', en: 'Collect any corrupt files it names' },
      { ar: 'يوصي بالإصلاح فقط عند وجود خلل', en: 'Recommend repair only when it found a fault' }
    ],
    output: { ar: 'قائمة أضرار الفحص فقط، دون كتابة أي ملف نظام.', en: 'A verification-only damage list — no system file written.' },
    risk: 'needs-admin'
  },
  'repair-files-repair': {
    purpose: { ar: 'إصلاح ملفات النظام التالفة باستبدالها بنسخ سليمة.', en: 'Repair corrupt system files by replacing them with known-good copies.' },
    steps: [
      { ar: 'يعرض الأمر والتحذير قبل التشغيل', en: 'Show the command and the warning before running' },
      { ar: 'يشغّل SFC ScanNow بمخرجات حية', en: 'Run SFC ScanNow with live output' },
      { ar: 'يتحقق من النتيجة بإعادة الفحص', en: 'Verify the result by re-verifying' }
    ],
    output: { ar: 'تقرير إصلاح ملفات نظام، مع إعادة تحقق مستقلة.', en: 'A system-file repair report with an independent re-verification.' },
    risk: 'needs-admin'
  },
  'repair-dns-flush': {
    purpose: { ar: 'مسح ذاكرة DNS المؤقتة حين تشير أسماء إلى عناوين قديمة.', en: 'Clear the DNS cache when names point at stale addresses.' },
    steps: [
      { ar: 'يعرض الأوامر التي سيُشغلها', en: 'Show the commands that will run' },
      { ar: 'ينفّذ ipconfig /flushdns كمسؤول', en: 'Execute ipconfig /flushdns as administrator' },
      { ar: 'يعرض مخرجات الأمر كما هي', en: 'Present the raw command output' }
    ],
    output: { ar: 'ذاكرة DNS فارغة وتأكيد من الأداة نفسها.', en: 'An empty DNS cache and the tool own confirmation.' },
    risk: 'needs-admin'
  },
  'repair-winsock-reset': {
    purpose: { ar: 'إعادة كتالوج Winsock إلى حالته الافتراضية عند تلفه.', en: 'Reset the Winsock catalog to its default when it is damaged.' },
    steps: [
      { ar: 'ينبّه إلى أن إعادة الإقلاع ستحتاج لاحقًا', en: 'Warn that a restart will be required afterwards' },
      { ar: 'يشغّل netsh winsock reset كمسؤول', en: 'Run netsh winsock reset as administrator' },
      { ar: 'يعرض ما غيّره الأمر بالضبط', en: 'Report exactly what the command reported' }
    ],
    output: { ar: 'كتالوج مُعاد وتنبيه إقلاع، لا وعد باتصال سليم.', en: 'A reset catalog and a restart notice — not a promise of working connectivity.' },
    risk: 'needs-admin'
  },
  'repair-tcpip-reset': {
    purpose: { ar: 'إعادة مكدس TCP/IP إلى إعداداته الأصلية.', en: 'Restore the TCP/IP stack to its original configuration.' },
    steps: [
      { ar: 'يعرض الحجم الكامل للتغيير قبل الموافقة', en: 'Show the full extent of the change before approval' },
      { ar: 'يشغّل netsh int ip reset كمسؤول', en: 'Run netsh int ip reset as administrator' },
      { ar: 'يطلب إعادة إقلاع ويقرأ الحالة بعدها', en: 'Ask for a restart and read the state afterwards' }
    ],
    output: { ar: 'سجل إعادة تعيين صريح، مع خطوة تحقق بعد الإقلاع.', en: 'An explicit reset log, with a verification step after the restart.' },
    risk: 'needs-admin'
  },
  'repair-history': {
    purpose: { ar: 'مراجعة ما جرى في جلسات الإصلاح السابقة ونتيجته.', en: 'Review what previous repair sessions ran and what came of them.' },
    steps: [
      { ar: 'يقرأ سجل الإصلاح المحلي', en: 'Read the local repair journal' },
      { ar: 'يعرض الأمر والنتيجة والوقت', en: 'Show the command, outcome and time' },
      { ar: 'يميّز المحاولة الفاشلة عن الناجحة', en: 'Separate a failed attempt from a successful one' }
    ],
    output: { ar: 'أرشيف إصلاح صادق، بما فيه ما لم ينجح.', en: 'An honest repair archive, including what did not succeed.' },
    risk: 'read-only'
  },
  'repair-troubleshooters': {
    purpose: { ar: 'الوصول إلى أدوات استكشاف أخطاء Windows من مكان واحد.', en: 'Reach the Windows troubleshooters from one place.' },
    steps: [
      { ar: 'يعدّد أدوات الاستكشاف المثبتة', en: 'List the installed troubleshooters' },
      { ar: 'يشرح ما تفحصه كل أداة', en: 'Explain what each one examines' },
      { ar: 'يفتح الأداة الأصلية بدل محاكاتها', en: 'Open the original tool instead of imitating it' }
    ],
    output: { ar: 'فهرس أدوات حقيقية، لا تنفيذ داخلي مزعوم.', en: 'An index of real tools — no claimed internal execution.' },
    risk: 'read-only'
  },
  'repair-restore-point': {
    purpose: { ar: 'معاينة نقاط استعادة النظام المتاحة قبل استخدامها.', en: 'Preview the available system restore points before using one.' },
    steps: [
      { ar: 'يستعلم نقاط الاستعادة من Windows', en: 'Query restore points from Windows' },
      { ar: 'يعرض التاريخ والوصف لكل نقطة', en: 'Show each point date and description' },
      { ar: 'يشرح أثر الاستعادة قبل الموافقة', en: 'Explain the restore impact before approval' }
    ],
    output: { ar: 'قائمة نقاط حقيقية وخطة استعادة، دون تنفيذ تلقائي.', en: 'A real point list and a restore plan — never applied automatically.' },
    risk: 'needs-admin'
  },
  'repair-update-reset': {
    purpose: { ar: 'إصلاح مكوّنات Windows Update حين تتعطل التحديثات.', en: 'Repair the Windows Update components when updates stall.' },
    steps: [
      { ar: 'يوقف خدمات التحديث بالترتيب الصحيح', en: 'Stop the update services in the documented order' },
      { ar: 'يعيد تسمية مجلدات التوزيع لا يحذفها', en: 'Rename the distribution folders rather than delete them' },
      { ar: 'يعيد تشغيل الخدمات ويتحقق منها', en: 'Restart the services and verify them' }
    ],
    output: { ar: 'خطة إصلاح خطوة بخطوة مع تحقق لكل خدمة.', en: 'A step-by-step repair plan with a check per service.' },
    risk: 'needs-admin'
  }
};
