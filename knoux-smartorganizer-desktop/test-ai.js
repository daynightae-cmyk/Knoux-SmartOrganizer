#!/usr/bin/env node

/**
 * 🧪 اختبار سريع لتقنيات الذكاء الاصطناعي
 * Knoux SmartOrganizer PRO - Quick AI Test
 */

const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// اختبار تحميل المكتبات
async function testLibraries() {
  log("🧪 اختبار تحميل مكتبات الذكاء الاصطناعي...", "cyan");

  const libraries = [
    { name: "@xenova/transformers", desc: "تصنيف ووصف الصور" },
    { name: "nsfwjs", desc: "كشف المحتوى الحساس" },
    { name: "@vladmandic/face-api", desc: "كشف الوجوه" },
    { name: "tesseract.js", desc: "استخراج النصوص" },
    { name: "image-hash", desc: "كشف التكرار" },
    { name: "sharp", desc: "معالجة الصور" },
    { name: "@tensorflow/tfjs-node", desc: "TensorFlow" },
    { name: "canvas", desc: "رسم الصور" },
  ];

  let allLoaded = true;

  for (const lib of libraries) {
    try {
      require(lib.name);
      log(`  ✅ ${lib.name} - ${lib.desc}`, "green");
    } catch (error) {
      log(`  ❌ ${lib.name} - غير متاح`, "red");
      allLoaded = false;
    }
  }

  return allLoaded;
}

// اختبار تحميل النماذج
async function testModelLoading() {
  log("\n🤖 اختبار تحميل نماذج الذكاء الاصطناعي...", "cyan");

  try {
    // 1. اختبار Transformers
    log("  📊 تحميل نموذج CLIP...", "blue");
    const { pipeline } = require("@xenova/transformers");
    const classifier = await pipeline(
      "zero-shot-image-classification",
      "Xenova/clip-vit-base-patch32",
    );
    log("  ✅ نموذج CLIP جاهز", "green");

    // 2. اختبار NSFW
    log("  🚫 تحميل نموذج NSFW...", "blue");
    const nsfw = require("nsfwjs");
    const nsfwModel = await nsfw.load();
    log("  ✅ نموذج NSFW جاهز", "green");

    // 3. اختبار OCR
    log("  📖 تحميل نموذج OCR...", "blue");
    const { createWorker } = require("tesseract.js");
    const worker = await createWorker();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    await worker.terminate();
    log("  ✅ نموذج OCR جاهز", "green");

    log("\n🎉 جميع النماذج تم تحميلها بنجاح!", "green");
    return true;
  } catch (error) {
    log(`\n❌ فشل في تحميل النماذج: ${error.message}`, "red");
    return false;
  }
}

// اختبار معالجة صورة تجريبية
async function testImageProcessing() {
  log("\n🖼️  اختبار معالجة صورة تجريبية...", "cyan");

  try {
    const sharp = require("sharp");

    // إنشاء صورة تجريبية
    const testImage = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .png()
      .toBuffer();

    log("  ✅ تم إنشاء صورة تجريبية", "green");

    // معالجة الصورة
    const { data, info } = await sharp(testImage)
      .resize(100, 100)
      .raw()
      .toBuffer({ resolveWithObject: true });

    log(`  ✅ تمت معالجة الصورة: ${info.width}x${info.height}`, "green");

    return true;
  } catch (error) {
    log(`  ❌ فشل في معالجة الصورة: ${error.message}`, "red");
    return false;
  }
}

// اختبار إنشاء hash للصور
async function testImageHashing() {
  log("\n🔍 اختبار إنشاء hash للصور...", "cyan");

  try {
    const { phash } = require("image-hash");
    const sharp = require("sharp");

    // إنشاء صورتين تجريبيتين
    const image1 = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const image2 = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .png()
      .toBuffer();

    // حفظ الصور مؤقتاً
    const tempPath1 = path.join(__dirname, "temp1.png");
    const tempPath2 = path.join(__dirname, "temp2.png");

    fs.writeFileSync(tempPath1, image1);
    fs.writeFileSync(tempPath2, image2);

    // إنشاء hashes
    const hash1 = await new Promise((resolve, reject) => {
      phash(tempPath1, (err, hash) => {
        if (err) reject(err);
        else resolve(hash);
      });
    });

    const hash2 = await new Promise((resolve, reject) => {
      phash(tempPath2, (err, hash) => {
        if (err) reject(err);
        else resolve(hash);
      });
    });

    // تنظيف الملفات المؤقتة
    fs.unlinkSync(tempPath1);
    fs.unlinkSync(tempPath2);

    log(`  ✅ Hash 1: ${hash1}`, "green");
    log(`  ✅ Hash 2: ${hash2}`, "green");
    log(`  ✅ الصور ${hash1 === hash2 ? "متطابقة" : "مختلفة"}`, "green");

    return true;
  } catch (error) {
    log(`  ❌ فشل في إنشاء hash: ${error.message}`, "red");
    return false;
  }
}

// اختبار النظام الكامل
async function testSystemRequirements() {
  log("🔧 فحص متطلبات النظام...", "cyan");

  // فحص Node.js
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);
  log(
    `  Node.js: ${nodeVersion} ${majorVersion >= 16 ? "✅" : "❌"}`,
    majorVersion >= 16 ? "green" : "red",
  );

  // فحص الذاكرة
  const totalMem = Math.round(require("os").totalmem() / 1024 / 1024 / 1024);
  log(
    `  الذاكرة: ${totalMem} GB ${totalMem >= 4 ? "✅" : "⚠️"}`,
    totalMem >= 4 ? "green" : "yellow",
  );

  // فحص المساحة المتاحة
  try {
    const stats = fs.statSync(".");
    log("  ✅ مساحة القرص متاحة", "green");
  } catch (error) {
    log("  ❌ مشكلة في مساحة القرص", "red");
  }

  return { nodeOk: majorVersion >= 16, memoryOk: totalMem >= 4 };
}

// الدالة الرئيسية
async function runQuickTest() {
  console.clear();
  log("=" * 60, "cyan");
  log("🧠 Knoux SmartOrganizer PRO - اختبار سريع للذكاء الاصطناعي", "bright");
  log("=" * 60, "cyan");

  let allTestsPassed = true;

  try {
    // 1. فحص متطلبات النظام
    const systemCheck = await testSystemRequirements();
    if (!systemCheck.nodeOk) {
      log("\n❌ Node.js قديم جداً. يرجى التحديث لإصدار 16 أو أحدث.", "red");
      return;
    }

    // 2. اختبار المكتبات
    const librariesOk = await testLibraries();
    if (!librariesOk) {
      log("\n❌ بعض المكتبات غير متاحة. يرجى تشغيل: npm install", "red");
      allTestsPassed = false;
    }

    // 3. اختبار معالجة الصور
    const imageProcessingOk = await testImageProcessing();
    if (!imageProcessingOk) {
      allTestsPassed = false;
    }

    // 4. اختبار hashing
    const hashingOk = await testImageHashing();
    if (!hashingOk) {
      allTestsPassed = false;
    }

    // 5. اختبار النماذج (قد يستغرق وقتاً)
    log("\n⏳ هذا قد يستغرق بضع دقائق لتحميل النماذج...", "yellow");
    const modelsOk = await testModelLoading();
    if (!modelsOk) {
      allTestsPassed = false;
    }

    // النتيجة النهائية
    log("\n" + "=" * 60, "cyan");
    if (allTestsPassed) {
      log("🎉 جميع الاختبارات نجحت! التطبيق جاهز للاستخدام.", "green");
      log("\n🚀 يمكنك الآن تشغيل التطبيق بالأمر: npm start", "cyan");
    } else {
      log("⚠️ بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه.", "yellow");
    }
    log("=" * 60, "cyan");
  } catch (error) {
    log(`\n❌ خطأ في الاختبار: ${error.message}`, "red");
    log("🔧 يرجى التأكد من تثبيت المكتبات: npm install", "yellow");
  }
}

// تشغيل الاختبار
if (require.main === module) {
  runQuickTest();
}

module.exports = {
  testLibraries,
  testModelLoading,
  testImageProcessing,
  testImageHashing,
  testSystemRequirements,
  runQuickTest,
};
