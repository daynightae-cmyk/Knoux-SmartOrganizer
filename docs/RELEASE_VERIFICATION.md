# التحقق من توزيع Windows

## البوابات المحلية

شغّل من checkout نظيف على Windows:

```powershell
npm ci
npm run check
npm run lint
npm test
npm run build
npm run desktop:pack
npm run desktop:dist
npm run smoke:packaged-operations
npm run smoke:visual
npm run smoke:installer
npm run smoke:reinstall
npm run smoke:offline
npm run signing:verify
npm run verify:release
```

لا تنفذ `npm audit fix --force` كجزء من البوابة؛ يسجل `npm audit` النتائج وتراجع الترقية قبل تغيير Electron أو حزم البناء.

## الأدلة

| الملف | الدليل |
|---|---|
| `packaged-operations-smoke.json` | IPC، الأدوات المحلية، التنظيف بالحجر والاستعادة، بدء التشغيل، الخدمات dry-run، الإصلاح dry-run، الأتمتة، الوصولية، والتشخيصات. |
| `installer-smoke.json` | تثبيت NSIS الصامت، تشغيل التطبيق المثبت، وإزالة التثبيت. |
| `reinstall-smoke.json` | بقاء بيانات مستخدم معزولة بعد الإزالة وقراءتها بعد إعادة التثبيت. |
| `offline-smoke.json` | تشغيل الحزمة مع حظر الشبكة. |
| `visual-acceptance.json` | RTL/LTR، ضوابط قابلة للتركيز، وغياب التمرير الأفقي ضمن مقاسات واختبار zoom محدد. |
| `code-signing.json` | حالة Authenticode الفعلية للمثبت وEXE. |
| `dependency-audit.json` | مخرجات `npm audit` الخام. |
| `defender-scan.json` | تسجيل تشغيل فحص Defender لمجلد القطع. |

## القيود الصادقة

لا يمكن لنجاح build أو smoke وحده إثبات توزيع إنتاجي تجاري. تظل البنود التالية خارجية أو تحتاج بيئة مستقلة:

| البند | الحالة عندما لا يتوفر دليله |
|---|---|
| شهادة Authenticode موثوقة | `CODE_SIGNING_CERTIFICATE_NOT_CONFIGURED` |
| سمعة SmartScreen | لا يمكن ضمانها. |
| اختبار Windows نظيف منفصل | `CLEAN_WINDOWS_ENVIRONMENT_UNAVAILABLE` حتى ينفذ على بيئة موثقة مستقلة. |
| ترقية من artifact سابق منشور | `PREVIOUS_RELEASE_ARTIFACT_UNAVAILABLE` حتى يتوفر إصدار سابق فعلي. |
| قبول installer تفاعلي وDPI نظامي كامل | يتطلب مراجعة بشرية موثقة؛ اختبار zoom الداخلي ليس بديلاً. |

## القطع والبصمات

يبني `desktop:dist` المثبت و`win-unpacked`. بعد **آخر build فقط**، ينشأ `FINAL_ARTIFACT_MANIFEST.json` بحجم القطع وبصمتها وحالة التوقيع ونسخ أدوات البناء. لا تعيد البناء بعد تسجيل البصمات؛ إذا حدث ذلك فأنشئ المانيفست من جديد.

## CI

CI غير التفاعلي يشغل `npm ci` وcheck وlint وtest وbuild. لا يشغل إصلاحات حية أو تغيير خدمات أو عمليات خطرة. قبل الدمج، يجب أن تنجح بوابات الفرع ثم CI على `main` بعد الدمج. لا تدمج إذا كانت الأدلة أو حواجز التوزيع الخارجية موصوفة بصورة مضللة.
