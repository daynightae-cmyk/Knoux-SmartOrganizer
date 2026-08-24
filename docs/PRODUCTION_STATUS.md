# حالة إنتاج KNOuX SmartOrganizer — توزيع Windows 0.4.0

> **الحكم الحالي:** اجتازت بوابات المصدر والحزمة والتثبيت والإزالة وإعادة التثبيت وعدم الاتصال محلياً. القطعة **مرشح توزيع غير موقّع** وليست إصداراً تجارياً موقعاً. لا يُسمح بوصفها كقطعة موثوقة لدى SmartScreen أو متوافقة مع بيئة Windows نظيفة مستقلة قبل توفر دليلها.

| المجال | التنفيذ | الدليل المحلي الحالي | الحالة |
|---|---|---|---|
| معمارية Electron موحدة | Main + preload محدود + React/Vite؛ عزل renderer وsandbox وwebSecurity | check/lint/tests وpackaged smoke | PASS |
| IPC والأدوات | 34 أداة مسجلة بمخططات Zod، مخرجات منظمة، ومسبارات قدرة آمنة | اختبارات registry/contract/localization؛ packaged operations smoke | PASS |
| سجل العمليات والإعدادات | إعدادات v2 وترحيل ونسخ احتياطي وكتابة ذرية وretry وسجل NDJSON محدود | 38 Vitest tests؛ packaged settings smoke | PASS |
| القراءة والنظام | أدوات نظام وملفات وشبكة وعتاد وعمليات وبطارية مقيدة | packaged operations smoke | PASS |
| عمليات الكتابة والاستعادة | تنظيم تنزيلات قابل للتراجع، تنظيف بالحجر والاستعادة، وتعطيل/استعادة بدء التشغيل | disposable fixtures وحزمة فعلية | PASS |
| الخدمات والإصلاح | allowlist وخطط dry-run؛ لا جسر أوامر ولا اختبار تغيير خدمة/إصلاح حي | privileged-runner tests وpackaged dry-run | PASS |
| الأتمتة | Task Scheduler لأدوات قراءة allowlisted فقط | create/run/history/delete في الحزمة | PASS |
| الوصولية والترجمة | AR/EN وRTL وتباين عالٍ وتقليل الحركة وحجم خط | visual acceptance في الحزمة، التركيز وغياب التمرير الأفقي ضمن سيناريوهات نافذة/zoom محددة | PASS ضمن النطاق |
| المثبّت والإزالة | NSIS silent install وتشغيل التطبيق وإزالة مجلد البرنامج | `installer-smoke.json` | PASS |
| إعادة التثبيت وبيانات المستخدم | حفظ إعدادات وسجل ومخزن أتمتة معزول بعد الإزالة ثم قراءتها بعد التثبيت | `reinstall-smoke.json` | PASS |
| تشغيل دون اتصال | حظر Chromium hosts وتشغيل التدفقات المحلية | `offline-smoke.json` | PASS |
| الاعتمادات | `npm audit` بلا vulnerabilities | `dependency-audit.json` | PASS |
| فحص القطع | فحص Defender لمجلد `release` على جهاز التحقق | `defender-scan.json` | PASS: تنفيذ محلي؛ ليس شهادة خلو شاملة |
| أسرار التوقيع | بوابة ترفض ملفات الشهادات والمفاتيح والمحتوى المشبوه | `verify-release.cjs` | PASS |
| توقيع Authenticode | المثبّت وEXE سجلا `NotSigned` عبر `pwsh.exe` | `code-signing.json` | BLOCKED EXTERNAL: شهادة موثوقة غير مهيأة |
| سمعة SmartScreen | لا يمكن استنتاجها من التوقيع أو اختبارات محلية | لا يوجد دليل | BLOCKED EXTERNAL |
| Windows نظيف مستقل | جهاز تحقق Windows 10 `10.0.19045` فقط | `WINDOWS_SUPPORT_MATRIX.md` | BLOCKED EXTERNAL |
| ترقية من artifact سابق | لا يوجد release منشور سابق في المستودع | `gh release list` بلا releases؛ reinstall acceptance فقط | BLOCKED EXTERNAL |
| CI الخارجي لفرع التوزيع | لم يُدفع فرع التوزيع الجديد بعد | workflow موجود فقط | PENDING EXTERNAL |

## أدلة التنفيذ النهائي

| البوابة | النتيجة |
|---|---|
| تثبيت نظيف للحزم | `npm ci` نجح؛ ظهرت تحذيرات deprecation في سلاسل build فقط، ولا توجد vulnerabilities في `npm audit`. |
| TypeScript وESLint | PASS |
| Vitest | PASS: 38 اختباراً في 7 ملفات. |
| Vite / electron-builder | PASS؛ تحذير حجم chunk Vite أكبر من 500 kB قائم ولا يوقف البناء. |
| packaged operations | PASS |
| visual acceptance | PASS؛ أربع حالات RTL/LTR ومقاسات/zoom؛ ليس بديلاً عن Windows DPI الأصلي أو مراجعة بشرية. |
| NSIS installer | PASS |
| uninstall / reinstall | PASS |
| offline smoke | PASS |
| Authenticode | `UNSIGNED_PRODUCTION_CANDIDATE`؛ حالة القطعتين `NotSigned`. |

## القطع الأخيرة

| القطعة | الحجم | SHA-256 | التوقيع |
|---|---:|---|---|
| `KNOuX-SmartOrganizer-Setup-x64.exe` | 114,093,959 bytes | `ee4a803a9d855e542ccc12ad8ac7bfd77843d580d731ed4b8b09e9dae3cd4a4b` | NotSigned |
| `win-unpacked/KNOuX SmartOrganizer.exe` | 235,566,592 bytes | `35d4faa2e56b0a43a2f4dae9540987448ac25ee21aeaeab0dda173df1ff79558` | NotSigned |

المانيفست المصدر للحجوم والبصمات وحالة التوقيع هو [`docs/evidence/FINAL_ARTIFACT_MANIFEST.json`](evidence/FINAL_ARTIFACT_MANIFEST.json). راجع [التحقق من الإصدار](RELEASE_VERIFICATION.md) قبل الدفع أو الدمج.
