/**
 * 🧠 أمثلة عملية لاستخدام تقنيات الذكاء الاصطناعي
 * Knoux SmartOrganizer PRO - Live Examples
 */

const { pipeline, RawImage } = require("@xenova/transformers");
const nsfw = require("nsfwjs");
const faceapi = require("@vladmandic/face-api");
const { createWorker } = require("tesseract.js");
const { phash } = require("image-hash");
const sharp = require("sharp");
const fs = require("fs");

// ==========================================
// 1. 🎯 مثال: تصنيف الصور باستخدام CLIP
// ==========================================

async function exampleImageClassification() {
  console.log("🎯 مثال: تصنيف الصو�� باستخدام CLIP");

  // تحميل النموذج
  const classifier = await pipeline(
    "zero-shot-image-classification",
    "Xenova/clip-vit-base-patch32",
  );

  // تحضير الصورة
  const imageBuffer = fs.readFileSync("example-image.jpg");
  const { data, info } = await sharp(imageBuffer).raw().toBuffer({
    resolveWithObject: true,
  });
  const rawImage = new RawImage(data, info.width, info.height, info.channels);

  // التصنيفات المحتملة
  const candidateLabels = [
    "person",
    "selfie",
    "nature",
    "landscape",
    "food",
    "animal",
    "car",
    "building",
    "document",
    "screenshot",
  ];

  // التصنيف
  const result = await classifier(rawImage, candidateLabels);

  console.log("📊 نتائج التصنيف:");
  result.forEach((r, index) => {
    console.log(`  ${index + 1}. ${r.label}: ${(r.score * 100).toFixed(1)}%`);
  });

  return {
    classification: result[0].label,
    confidence: result[0].score,
    allResults: result,
  };
}

// ==========================================
// 2. 📝 مثال: وصف الصور باستخدام Vision-GPT
// ==========================================

async function exampleImageCaptioning() {
  console.log("📝 مثال: وصف الصور باست��دام Vision-GPT");

  // تحميل النموذج
  const imageToTextGenerator = await pipeline(
    "image-to-text",
    "Xenova/vit-gpt2-image-captioning",
  );

  // تحضير الصورة
  const imageBuffer = fs.readFileSync("example-image.jpg");
  const { data, info } = await sharp(imageBuffer).raw().toBuffer({
    resolveWithObject: true,
  });
  const rawImage = new RawImage(data, info.width, info.height, info.channels);

  // توليد الوصف
  const captionResult = await imageToTextGenerator(rawImage);
  const description = captionResult[0].generated_text;

  console.log("📝 الوصف المولد:", description);

  // إنشاء اسم ملف ذكي
  const timestamp = new Date().toISOString().slice(0, 10);
  const safeDescription = description
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 30);

  const smartFilename = `${timestamp}-${safeDescription}.jpg`;
  console.log("📁 اسم الملف الذكي:", smartFilename);

  return {
    description,
    smartFilename,
  };
}

// ==========================================
// 3. 🚫 مثال: كشف المحتوى الحساس
// ==========================================

async function exampleNSFWDetection() {
  console.log("🚫 مثال: كشف المحتوى الحساس");

  // تحميل النموذج
  const nsfwModel = await nsfw.load();
  const tf = require("@tensorflow/tfjs-node");

  // تحضير الصورة
  const imageBuffer = fs.readFileSync("example-image.jpg");
  const tensor = tf.node.decodeImage(imageBuffer, 3);

  // تحليل المحتوى
  const predictions = await nsfwModel.classify(tensor);
  tensor.dispose(); // تنظيف الذاكرة

  console.log("🚫 نتائج كشف المحتوى:");
  predictions.forEach((p) => {
    console.log(`  ${p.className}: ${(p.probability * 100).toFixed(1)}%`);
  });

  // تحديد إذا كان المحتوى حساس
  const nsfwClasses = ["Porn", "Hentai"];
  const maxNsfwScore = Math.max(
    ...predictions
      .filter((p) => nsfwClasses.includes(p.className))
      .map((p) => p.probability),
  );

  const isNSFW = maxNsfwScore > 0.6;
  console.log(`🎯 النتيجة النهائية: ${isNSFW ? "مرفوض" : "مقبول"}`);

  return {
    isNSFW,
    score: maxNsfwScore,
    allPredictions: predictions,
  };
}

// ==========================================
// 4. 👥 مثال: كشف الوجوه والعمر والجنس
// ==========================================

async function exampleFaceDetection() {
  console.log("👥 مثال: كشف الوجوه والعمر والجنس");

  // تحميل النماذج
  const modelPath = "./node_modules/@vladmandic/face-api/model";
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.ageGenderNet.loadFromDisk(modelPath);

  // تهيئة البيئة
  const tf = require("@tensorflow/tfjs-node");
  const { Canvas, Image, ImageData } = require("canvas");
  faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

  // تحضير الصورة
  const imageBuffer = fs.readFileSync("example-image.jpg");
  const tensor = tf.node.decodeImage(imageBuffer);

  // كشف الوجوه
  const detections = await faceapi
    .detectAllFaces(tensor)
    .withFaceLandmarks()
    .withAgeAndGender();

  tensor.dispose();

  console.log(`👥 تم العثور على ${detections.length} وجه:`);

  const faces = detections.map((detection, index) => {
    const face = {
      index: index + 1,
      confidence: Math.round(detection.detection.score * 100),
      age: Math.round(detection.age),
      gender: detection.gender,
      genderConfidence: Math.round(detection.genderProbability * 100),
      box: detection.detection.box,
    };

    console.log(`  الوجه ${face.index}:`);
    console.log(`    الثقة: ${face.confidence}%`);
    console.log(`    ��لعمر: ${face.age} سنة`);
    console.log(`    الجنس: ${face.gender} (${face.genderConfidence}%)`);
    console.log(
      `    الموقع: x=${Math.round(face.box.x)}, y=${Math.round(face.box.y)}`,
    );

    return face;
  });

  return {
    faceCount: detections.length,
    faces,
  };
}

// ==========================================
// 5. 📖 مثال: استخراج النصوص (OCR)
// ==========================================

async function exampleOCR() {
  console.log("📖 مثال: استخراج النصوص (OCR)");

  // تهيئة OCR
  const worker = await createWorker();
  await worker.loadLanguage("eng+ara"); // إنجليزي + عربي
  await worker.initialize("eng+ara");

  // قراءة النص من الصورة
  const imageBuffer = fs.readFileSync("example-document.jpg");
  const {
    data: { text, confidence },
  } = await worker.recognize(imageBuffer);

  await worker.terminate();

  console.log("📖 النص المستخرج:");
  console.log(text);
  console.log(`🎯 الثقة: ${Math.round(confidence)}%`);

  // تحديد إذا كانت وثيقة
  const isDocument = text.trim().length > 50;
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);

  console.log(`📄 نوع المحتوى: ${isDocument ? "وثيقة" : "نص قصير"}`);
  console.log(
    `🌍 اللغات: ${hasArabic ? "عربي " : ""}${hasEnglish ? "إنجليزي" : ""}`,
  );

  return {
    text: text.trim(),
    confidence,
    isDocument,
    hasArabic,
    hasEnglish,
    wordCount: text.trim().split(/\s+/).length,
  };
}

// ==========================================
// 6. 🔄 مثال: كشف الصور المتكررة
// ==========================================

async function exampleDuplicateDetection() {
  console.log("🔄 مثال: كشف الصور المتكررة");

  // قائمة الصور للفحص
  const imageFiles = [
    "image1.jpg",
    "image2.jpg",
    "image1_copy.jpg", // نسخة مطابقة
    "image3.jpg",
  ];

  const imageHashes = new Map();
  const duplicates = [];

  for (const file of imageFiles) {
    // إنشاء البصمة الإدراكية
    const hash = await new Promise((resolve, reject) => {
      phash(file, (err, hash) => {
        if (err) reject(err);
        else resolve(hash);
      });
    });

    console.log(`📁 ${file}: ${hash}`);

    // فحص التكرار
    if (imageHashes.has(hash)) {
      const originalFile = imageHashes.get(hash);
      duplicates.push({
        original: originalFile,
        duplicate: file,
        hash,
      });
      console.log(`🔄 تكرار مكتشف: ${file} مطابق لـ ${originalFile}`);
    } else {
      imageHashes.set(hash, file);
    }
  }

  console.log(`🎯 النتيجة: ${duplicates.length} صورة مكررة`);

  return {
    totalImages: imageFiles.length,
    uniqueImages: imageHashes.size,
    duplicates,
  };
}

// ==========================================
// 7. 🎯 مثال شامل: تحليل صورة كامل
// ==========================================

async function exampleCompleteAnalysis() {
  console.log("🎯 مثال شامل: تحليل صورة كامل");
  console.log("=" * 50);

  try {
    // 1. تصنيف الصورة
    console.log("\n1️⃣ تصنيف الصورة...");
    const classificationResult = await exampleImageClassification();
    console.log(`✅ التصنيف: ${classificationResult.classification}`);

    // 2. وصف الصورة
    console.log("\n2️⃣ وصف الصورة...");
    const captionResult = await exampleImageCaptioning();
    console.log(`✅ الوصف: ${captionResult.description}`);

    // 3. كشف المحتوى الحساس
    console.log("\n3️⃣ فحص المحتوى...");
    const nsfwResult = await exampleNSFWDetection();
    console.log(`✅ الحال��: ${nsfwResult.isNSFW ? "مرفوض" : "مقبول"}`);

    // 4. كشف الوجوه
    console.log("\n4️⃣ كشف الوجوه...");
    const faceResult = await exampleFaceDetection();
    console.log(`✅ عدد الوجوه: ${faceResult.faceCount}`);

    // 5. استخراج النصوص
    console.log("\n5️⃣ استخراج النصوص...");
    const ocrResult = await exampleOCR();
    console.log(`✅ طول النص: ${ocrResult.wordCount} كلمة`);

    // 6. تحديد المجلد المناسب
    console.log("\n6️⃣ تحديد المجلد...");
    let targetFolder = "others";

    if (nsfwResult.isNSFW) {
      targetFolder = "rejected";
    } else if (
      faceResult.faceCount > 0 &&
      classificationResult.classification.includes("person")
    ) {
      targetFolder = "selfies";
    } else if (ocrResult.isDocument) {
      targetFolder = "documents";
    } else if (
      ["nature", "landscape"].some((term) =>
        classificationResult.classification.includes(term),
      )
    ) {
      targetFolder = "nature";
    } else if (
      ["food", "meal"].some((term) =>
        classificationResult.classification.includes(term),
      )
    ) {
      targetFolder = "food";
    } else if (classificationResult.classification.includes("animal")) {
      targetFolder = "animals";
    }

    console.log(`✅ المجلد المقترح: ${targetFolder}`);

    // النتيجة النهائية
    const finalResult = {
      classification: classificationResult.classification,
      confidence: classificationResult.confidence,
      description: captionResult.description,
      suggestedFilename: captionResult.smartFilename,
      isNSFW: nsfwResult.isNSFW,
      faceCount: faceResult.faceCount,
      faces: faceResult.faces,
      hasText: ocrResult.isDocument,
      extractedText: ocrResult.text.slice(0, 100) + "...",
      targetFolder,
      processingComplete: true,
    };

    console.log("\n🎉 التحليل الشامل مكتمل!");
    console.log("📊 النتيجة النهائية:");
    console.log(JSON.stringify(finalResult, null, 2));

    return finalResult;
  } catch (error) {
    console.error("❌ خطأ في التحليل:", error.message);
    return { error: error.message };
  }
}

// ==========================================
// 8. 🚀 تشغيل جميع الأمثلة
// ==========================================

async function runAllExamples() {
  console.log("🚀 بدء تشغيل جميع الأمثلة...");
  console.log("=" * 60);

  try {
    // تشغيل التحليل الشامل
    await exampleCompleteAnalysis();

    // تشغيل مثال كشف التكرار
    console.log("\n" + "=" * 60);
    await exampleDuplicateDetection();

    console.log("\n🎉 تم الانتهاء من جميع الأمثلة بنجاح!");
  } catch (error) {
    console.error("❌ خطأ في تشغيل الأمثلة:", error);
  }
}

// تصدير الدوال للاستخدام الخارجي
module.exports = {
  exampleImageClassification,
  exampleImageCaptioning,
  exampleNSFWDetection,
  exampleFaceDetection,
  exampleOCR,
  exampleDuplicateDetection,
  exampleCompleteAnalysis,
  runAllExamples,
};

// تشغيل الأمثلة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runAllExamples();
}
