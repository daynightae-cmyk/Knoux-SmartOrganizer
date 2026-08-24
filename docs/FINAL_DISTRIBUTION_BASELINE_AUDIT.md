# تدقيق خط أساس التوزيع النهائي لـ KNOuX SmartOrganizer

**تاريخ التدقيق:** 2026-08-24  
**الفرع المدقَّق:** `feat/final-windows-production-distribution`  
**خط الأساس المدفوع من `main`:** `f6335c6a5e37b8abe09ace6a8c7eeec52630a702`  
**نسخة المنتج المعلنة في المصدر:** `0.4.0`

> هذا التدقيق يصف ما تحقق من المصدر والقطع والأدلة الموجودة فعلاً. ولا يرفع أي بند إلى نجاح لمجرد وجود شيفرة أو نتيجة قديمة.

## هوية المنتج وحالة التوزيع

| العنصر | القيمة المثبتة | الحالة |
|---|---|---|
| اسم المنتج | `KNOuX SmartOrganizer` | IMPLEMENTED |
| المعرف | `com.knoux.smartorganizer` | IMPLEMENTED |
| الملف التنفيذي | `KNOuX SmartOrganizer.exe` | IMPLEMENTED |
| اسم المثبّت | `KNOuX-SmartOrganizer-Setup-x64.exe` | IMPLEMENTED |
| الناشر في تعريف الحزمة | `Knoux Technologies` | IMPLEMENTED، لكن لا يثبت ناشراً موثوقاً في Windows |
| النسخة | `0.4.0` في `package.json` وبيانات EXE | IMPLEMENTED |
| توقيع Authenticode | `NotSigned` للمثبّت وEXE وفق `Get-AuthenticodeSignature` | BLOCKED خارجيًا: شهادة موثوقة غير مهيأة |
| SmartScreen | لا يوجد ادعاء أو دليل سمعة | NOT_AVAILABLE |

## تدقيق الأنظمة الرئيسية

| النظام | IMPLEMENTED | TESTED | PACKAGED TESTED | INSTALLER TESTED | حالة التوزيع |
|---|---|---|---|---|---|
| Electron/React المعزول وIPC المسمّى | نافذة آمنة، preload محدود، مخططات Zod ورفض الحقول الزائدة | اختبارات العقود والسجل والحدود | نعم، عبر دخان IPC | نعم، عبر دخان التطبيق المثبت | IMPLEMENTED |
| سجل الأدوات | 34 أداة مقيدة بحسب الفئة والمخاطر | اختبار سجل/توطين | نعم | نعم | IMPLEMENTED |
| الإعدادات | مخطط v2، ترحيل v1، كتابة ذرية وإعادة محاولة lock | 11 اختبار تخزين | كتابة/قراءة/إعادة ضبط مثبتة | نعم | IMPLEMENTED |
| سجل العمليات | مراحل دورة الحياة وNDJSON وسجل JSON | اختبارات ودخان إلغاء | نعم | نعم | IMPLEMENTED، ويتطلب تدقيق ترحيل السجل للترقية |
| التنظيف والحجر | معاينة، حجر قابل للاستعادة، journal، دون حذف دائم | اختبارات مخطط ودخان fixture | نعم | نعم | IMPLEMENTED |
| تنظيم الملفات | معاينة/تأكيد/نقل آمن/تراجع | دخان fixture | نعم | نعم | IMPLEMENTED |
| بدء التشغيل | قراءة HKCU Run، تعطيل واستعادة value مملوك | اختبارات ومدخلة ملكية مؤقتة | نعم | نعم | IMPLEMENTED، ويتطلب اختبار ترقية/إزالة |
| الأتمتة | Task Scheduler بأدوات قراءة allowlisted فقط | 3 اختبارات محلية | إنشاء/تشغيل/حذف مثبت | نعم | IMPLEMENTED، ويتطلب اختبار ترقية |
| الخدمات | جرد، حظر خدمات محمية، actions ثابتة، journal لبدء التشغيل | مخططات صارمة ورفض | جرد + dry-run لخدمة غير محمية | نعم | IMPLEMENTED؛ لا يوجد تغيير خدمة حي ضمن الاختبار لأسباب أمان |
| مركز الإصلاح | ثماني عمليات ثابتة فقط، UAC لكل عملية | 9 اختبارات للـ allowlist والحقن وdry-run | dry-run لكل العمليات الثمانية | نعم | IMPLEMENTED؛ لا إصلاح حي تلقائي |
| العربية/الإنجليزية وRTL | قواميس AR/EN وتطبيق `dir` | parity test | RTL، حجم خط 150%، reduced motion، focus | نعم | IMPLEMENTED، ويلزم قبول بصري يدوي متعدد DPI |
| عدم الاتصال | مسارات محلية من دون API أو CDN | دخان مع `MAP * 0.0.0.0` | نعم | التطبيق المثبت مدرج ضمن دخان المثبّت | IMPLEMENTED |
| NSIS | غير أحادي النقرة، مسار قابل للتغيير، اختصارات، uninstaller، عدم حذف AppData | بناء وsilent install | نعم | install → run → uninstall | IMPLEMENTED، ويلزم قبول تفاعلي وترقية وإعادة تثبيت |
| CI | `npm ci`، check، lint، test، build | CI فرع و`main` ناجحان | لا يبني NSIS في CI | غير منطبق | IMPLEMENTED |

## القطع والأدلة المتاحة الآن

| الدليل | الغرض | نتيجة التدقيق |
|---|---|---|
| `docs/evidence/installer-smoke.json` | تثبيت NSIS، تشغيل التطبيق المثبت، إزالة التثبيت | PASS للسيناريو الصامت الحالي |
| `docs/evidence/offline-smoke.json` | تشغيل الحزمة مع حظر hosts خارجيًا | PASS للعمليات المحلية الممثلة |
| `docs/evidence/packaged-operations-smoke.json` | IPC، تنظيف، بدء تشغيل، خدمات dry-run، إصلاح dry-run، أتمتة، RTL | PASS للقطعة السابقة؛ يجب تجديده بعد أي rebuild نهائي |
| `docs/evidence/packaged-settings-smoke.json` | إعدادات runtime | PASS للقطعة السابقة؛ يجب تجديده بعد أي rebuild نهائي |
| `docs/evidence/admin-capability-smoke.json` | قابلية/حالة العمليات الإدارية | PASS للأدوات المسموح بها |

## الفجوات التي تمنع حكم «توزيع إنتاجي جاهز» الآن

| الفجوة | التصنيف | سبب عدم إغلاقها الآن | مسار الإغلاق |
|---|---|---|---|
| شهادة Authenticode موثوقة | BLOCKED خارجيًا | لا توجد شهادة أو أسرار توقيع موثوقة مهيأة | إضافة شهادة فعلية عبر متغيرات/أسرار CI ثم التحقق بـ `Get-AuthenticodeSignature` |
| قبول جهاز Windows نظيف مستقل | NOT_AVAILABLE | لا تتوافر بيئة منفصلة موثقة بعد | تنفيذ مصفوفة Windows 10/11 ورفع الأدلة |
| ترقية نسخة سابقة إلى الحالية | NOT_IMPLEMENTED | لم يوثق artefact سابق ثابت ولا سيناريو upgrade | بناء/الحصول على نسخة سابقة واختبار إعدادات وسجل وأتمتة وحجر |
| قبول المثبّت التفاعلي | NOT_IMPLEMENTED | لا يمكن إثبات حوارات GUI من smoke الصامت فقط | فحص بصري يدوي موثق على Windows حقيقي |
| قبول بصري متعدد DPI/دقة | NOT_IMPLEMENTED | لا يوجد دليل مرئي فعلي لكل المصفوفة | تنفيذ خطة DPI/resolution وتسجيل النتائج الصادقة |
| سياسة بيانات الإزالة والتشخيص والمانيفست | PARTIAL | `deleteAppDataOnUninstall:false` موجود، لكن الوثائق/الاختبارات التفصيلية غير مكتملة | تنفيذ التوثيق والاختبارات والمانيفست في هذا الفرع |

## قرار التدقيق

**الحالة الحالية: `UNSIGNED_PRODUCTION_CANDIDATE`.**  
النواة المحلية آمنة ومختبرة ومعبأة، لكن لا يجوز تسميتها «توزيع إنتاجي جاهز» قبل إغلاق اختبارات الترقية/إعادة التثبيت/قبول الواجهة وتوثيق حالة التوقيع. شهادة Authenticode وبيئات Windows النظيفة التزامات خارجية يجب الإبلاغ عنها بصراحة إذا بقيت غير متاحة.

## مصادر التدقيق المحلية

- `package.json`
- `electron/main.cjs`، `electron/preload.cjs`، `electron/privileged-runner.cjs`
- `electron/settings.cjs`، `electron/automation.cjs`، `electron/startup-manager.cjs`
- `scripts/` و`tests/`
- `docs/` و`docs/evidence/`
- فحص `Get-AuthenticodeSignature` للقطع الموجودة وقت التدقيق
