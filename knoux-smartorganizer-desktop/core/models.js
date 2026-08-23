/**
 * Knoux SmartOrganizer PRO - AI Engine
 * هذا الملف مسؤول عن تثبيت، تحميل، وتفعيل جميع نماذج الذكاء الاصطناعي.
 * يعمل كوحدة مركزية للتعامل مع الذكاء الاصطناعي.
 */

const { pipeline } = require("@xenova/transformers");
const nsfw = require("nsfwjs");
const faceapi = require("@vladmandic/face-api");
const { createWorker } = require("tesseract.js");
const path = require("path");
const os = require("os");

// للمساعدة في تحديد مسار النماذج المحملة
require("@tensorflow/tfjs-node");

// هذا الكائن سيحتفظ بالنماذج بعد تحميلها لتكون جاهزة للاستخدام الفوري
const models = {
  classifier: null,
  captioner: null,
  nsfw: null,
  ocr: null,
  faceDetector: true, // Face-API لا يحتاج كائن منفصل، فقط نتأكد من تحميل الشبكات
};

// كائن لتتبع حالة التحميل
let status = {
  isLoading: false,
  isReady: false,
  message: "لم يتم البدء بعد.",
};

/**
 * دالة مركزية لتحميل وتفعيل جميع النماذج المطلوبة.
 * تستدعي دالة callback لتحديث الواجهة بحالة التحميل.
 * @param {function(string): void} progressCallback - دالة يتم استدعاؤها مع رسائل التقدم.
 */
async function initializeModels(progressCallback) {
  if (status.isReady || status.isLoading) {
    progressCallback("النماذج جاهزة بالفعل أو قيد التحميل.");
    return;
  }

  status.isLoading = true;

  try {
    // === 1. تفعيل وتثبيت نماذج Transformers.js (CLIP & Captioning) ===
    // هذه المكتبة ذكية: عند أول تشغيل، تقوم بـ "تنزيل وتثبيت" النماذج تلقائيًا في مجلد cache خاص بالمستخدم.
    // في المرات اللاحقة، تقوم بـ "تحميل" النموذج من الـ cache مباشرة (يعمل بدون انترنت).
    progressCallback(
      "1/5 - جاري تفعيل نموذج تصنيف الصور (CLIP)... قد يستغرق بعض الوقت في المرة الأولى.",
    );
    models.classifier = await pipeline(
      "zero-shot-image-classification",
      "Xenova/clip-vit-base-patch32",
    );

    progressCallback("2/5 - جاري تفعيل نموذج وصف الصور (Captioning)...");
    models.captioner = await pipeline(
      "image-to-text",
      "Xenova/vit-gpt2-image-captioning",
    );

    // === 2. تفعيل وتثبيت نموذج كشف المحتوى (NSFWJS) ===
    // يقوم بتحميل النموذج الخاص به (خفيف نسبيًا).
    progressCallback("3/5 - جاري تفعيل نموذج كشف المحتوى الحساس (NSFW)...");
    models.nsfw = await nsfw.load();

    // === 3. تفعيل وتثبيت نماذج كشف الوجوه (Face-API.js) ===
    // هذه النماذج تأتي "مثبتة" مسبقًا داخل مجلد node_modules عند تنفيذ npm install.
    // مهمتنا هنا هي فقط "تفعيلها" عبر تحميلها من القرص الصلب إلى الذاكرة.
    progressCallback("4/5 - جاري تفعيل نماذج كشف الوجوه...");
    const modelDir = path.join(
      __dirname,
      "../node_modules",
      "@vladmandic",
      "face-api",
      "model",
    );

    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelDir);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelDir);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelDir);
    await faceapi.nets.ageGenderNet.loadFromDisk(modelDir);

    // إعداد بيئة TensorFlow.js للوجوه
    const { Canvas, Image, ImageData } = require("canvas");
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    // === 4. تهيئة محرك قراءة النصوص (Tesseract.js) ===
    // هذه المكتبة لا تحمل نموذجًا كبيرًا بل "عامل" (worker) يقوم بالمعالجة.
    progressCallback("5/5 - جاري تهيئة محرك قراءة النصوص (OCR)...");
    models.ocr = await createWorker();
    await models.ocr.loadLanguage("eng+ara");
    await models.ocr.initialize("eng+ara");

    status.isReady = true;
    status.isLoading = false;
    status.message = "جميع النماذج جاهزة ومفعلة.";
    progressCallback(
      "✅ اكتمل التحميل! كل أدوات الذكاء الاصطناعي جاهزة للاستخدام.",
    );
  } catch (error) {
    status.isLoading = false;
    status.isReady = false;
    status.message = `فشل تحميل النماذج: ${error.message}`;
    console.error("خطأ فادح أثناء تهيئة النماذج:", error);
    // إرسال الخطأ للواجهة ليراه المستخدم
    progressCallback(
      `❌ فشل تفعيل النماذج: ${error.message}. قد تحتاج لاتصال بالإنترنت في التشغيل الأول.`,
    );
    throw error; // إيقاف العملية
  }
}

/**
 * دالة للتحقق من جاهزية النماذج
 * @returns {boolean} true إذا كانت النماذج جاهزة
 */
function areModelsReady() {
  return status.isReady;
}

/**
 * دالة لإعادة تعيين النماذج (للتطوير والاختبار)
 */
async function resetModels() {
  if (models.ocr) {
    await models.ocr.terminate();
  }

  models.classifier = null;
  models.captioner = null;
  models.nsfw = null;
  models.ocr = null;
  models.faceDetector = false;

  status.isLoading = false;
  status.isReady = false;
  status.message = "تم إعادة تعيين النماذج.";
}

/**
 * دالة للحصول على معلومات حالة النماذج
 * @returns {object} كائن يحتوي على معلومات الحالة
 */
function getModelsStatus() {
  return {
    ...status,
    modelsLoaded: {
      classifier: !!models.classifier,
      captioner: !!models.captioner,
      nsfw: !!models.nsfw,
      ocr: !!models.ocr,
      faceDetector: models.faceDetector,
    },
  };
}

// تصدير الدالة الرئيسية والكائن الذي سيحمل النماذج
module.exports = {
  initializeModels,
  areModelsReady,
  resetModels,
  getModelsStatus,
  models,
  status,
};
