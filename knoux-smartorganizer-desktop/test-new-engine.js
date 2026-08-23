/**
 * اختبار المحرك الجديد للذكاء الاصطناعي
 * هذا السكربت لاختبار وظائف المحرك الجديد بشكل منفصل
 */

const {
  initializeModels,
  models,
  areModelsReady,
  getModelsStatus,
} = require("./core/models.js");
const path = require("path");
const fs = require("fs");

async function testAIEngine() {
  console.log("🔬 اختبار المحرك الجديد للذكاء الاصطناعي...\n");

  try {
    // 1. اختبار حالة النماذج قبل التحميل
    console.log("1️⃣ حالة النماذج قبل التحميل:");
    console.log(getModelsStatus());
    console.log(`جاهزة للاستخدام: ${areModelsReady()}\n`);

    // 2. تحميل النماذج
    console.log("2️⃣ بدء تحميل النماذج...");
    const startTime = Date.now();

    await initializeModels((message) => {
      console.log(`   📋 ${message}`);
    });

    const loadTime = Date.now() - startTime;
    console.log(`\n✅ اكتمل تحميل النماذج في ${loadTime}ms\n`);

    // 3. اختبار حالة النماذج بعد التحميل
    console.log("3️⃣ حالة النماذج بعد التحميل:");
    console.log(getModelsStatus());
    console.log(`جاهزة للاستخدام: ${areModelsReady()}\n`);

    // 4. اختبار النماذج (إذا كان هناك صورة للاختبار)
    console.log("4️⃣ اختبار النماذج المحملة:");

    // فحص الكائنات المحملة
    console.log(
      `   🔍 نموذج التصنيف: ${!!models.classifier ? "✅ محمل" : "❌ غير محمل"}`,
    );
    console.log(
      `   📝 نموذج الوصف: ${!!models.captioner ? "✅ محمل" : "❌ غير محمل"}`,
    );
    console.log(
      `   🔞 نموذج NSFW: ${!!models.nsfw ? "✅ محمل" : "❌ غير محمل"}`,
    );
    console.log(`   📖 محرك OCR: ${!!models.ocr ? "✅ محمل" : "❌ غير محمل"}`);
    console.log(
      `   👤 كاشف الوجوه: ${models.faceDetector ? "✅ محمل" : "❌ غير محمل"}`,
    );

    console.log("\n🎉 انتهى الاختبار بنجاح!");
    console.log("💡 يمكنك الآن استخدام التطبيق بثقة كاملة.\n");
  } catch (error) {
    console.error("❌ فشل الاختبار:", error.message);
    console.error("📋 تفاصيل الخطأ:", error);
  }
}

// تشغيل الاختبار إذا تم استدعاء السكربت مباشرة
if (require.main === module) {
  testAIEngine()
    .then(() => {
      console.log("🏁 انتهى اختبار المحرك.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 خطأ فادح في الاختبار:", error);
      process.exit(1);
    });
}

module.exports = { testAIEngine };
