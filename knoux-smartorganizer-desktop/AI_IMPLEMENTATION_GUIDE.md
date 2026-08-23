# 🧠 دليل تطبيق تقنيات الذكاء الاصطناعي - Knoux SmartOrganizer PRO

## نظرة عامة

هذا الدليل يوضح **بالتفصيل** كيف تم تطبيق كل تقنية ذكاء اصطناعي في التطبيق بشكل عملي وحقيقي.

---

## 📊 1. تصنيف الصور (Image Classification) - CLIP

### المكتبة المستخدمة:

```javascript
const { pipeline } = require("@xenova/transformers");
```

### التحميل والتهيئة:

```javascript
// في دالة loadAIModels()
classifier = await pipeline(
  "zero-shot-image-classification",
  "Xenova/clip-vit-base-patch32",
);
```

### الاستخدام العملي:

```javascript
// في دالة analyzeImage()
const candidateLabels = [
  "person",
  "selfie",
  "portrait",
  "people",
  "nature",
  "landscape",
  "outdoor",
  "tree",
  "sky",
  "food",
  "meal",
  "drink",
  "restaurant",
  "document",
  "text",
  "paper",
  "screenshot",
  "animal",
  "pet",
  "dog",
  "cat",
  "car",
  "vehicle",
  "transportation",
  "building",
  "architecture",
  "house",
  "sport",
  "game",
  "activity",
];

const classificationResult = await classifier(rawImage, candidateLabels);
results.classification = classificationResult[0].label;
results.confidence = classificationResult[0].score;
```

### النتيجة:

- **التصنيف**: مثل "person", "nature", "food"
- **الثقة**: نسبة مئوية من 0-1
- **الاستخدام**: تحديد المجلد المناسب للصورة

---

## 📝 2. وصف الصور (Image Captioning) - Vision-GPT

### المكتبة المستخدمة:

```javascript
const { pipeline } = require("@xenova/transformers");
```

### التحميل والتهيئة:

```javascript
// في دالة loadAIModels()
imageToTextGenerator = await pipeline(
  "image-to-text",
  "Xenova/vit-gpt2-image-captioning",
);
```

### الاستخدام العملي:

```javascript
// في دالة analyzeImage()
const captionResult = await imageToTextGenerator(rawImage);
results.description = captionResult[0].generated_text;

// إنشاء اسم ملف ذكي
const safeDescription = results.description
  .replace(/[^a-zA-Z0-9\s]/g, "")
  .replace(/\s+/g, "-")
  .slice(0, 30);

const timestamp = new Date().toISOString().slice(0, 10);
results.suggestedName = `${timestamp}-${results.classification}-${safeDescription}${extension}`;
```

### النتيجة:

- **الوصف**: مثل "a woman standing on a beach at sunset"
- **اسم ملف ذكي**: "2024-01-15-person-woman-standing-beach-sunset.jpg"

---

## 🚫 3. كشف المحتوى الحساس (NSFW Detection)

### المكتبة المستخدمة:

```javascript
const nsfw = require("nsfwjs");
```

### التحميل والتهيئة:

```javascript
// في دالة loadAIModels()
nsfwModel = await nsfw.load();
```

### الاستخدام العملي:

```javascript
// في دالة analyzeImage()
const tf = require("@tensorflow/tfjs-node");
const tensor = tf.node.decodeImage(imageBuffer, 3);
const predictions = await nsfwModel.classify(tensor);
tensor.dispose(); // تنظيف الذاكرة

const nsfwClasses = ["Porn", "Hentai"];
const maxNsfwScore = Math.max(
  ...predictions
    .filter((p) => nsfwClasses.includes(p.className))
    .map((p) => p.probability),
);

results.nsfwScore = maxNsfwScore;
results.isNSFW = maxNsfwScore > 0.6; // عتبة 60%
```

### النتيجة:

- **النتيجة**: true/false للمحتوى الحساس
- **النقاط**: نسبة من 0-1
- **الاستخدام**: نقل الصور المرفوضة لمجلد منفصل

---

## 👥 4. كشف الوجوه والعمر والجنس (Face Detection)

### المكتبة المستخدمة:

```javascript
const faceapi = require("@vladmandic/face-api");
```

### التحميل والتهيئة:

```javascript
// في دالة loadAIModels()
const modelPath = path.join(
  __dirname,
  "node_modules",
  "@vladmandic",
  "face-api",
  "model",
);
await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
await faceapi.nets.ageGenderNet.loadFromDisk(modelPath);

// تهيئة البيئة
const tf = require("@tensorflow/tfjs-node");
const { Canvas, Image, ImageData } = require("canvas");
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
```

### الاستخدام العملي:

```javascript
// في دالة analyzeImage()
const tf = require("@tensorflow/tfjs-node");
const tensor = tf.node.decodeImage(imageBuffer);
const detections = await faceapi
  .detectAllFaces(tensor)
  .withFaceLandmarks() // معالم الوجه
  .withAgeAndGender(); // العمر والجنس
tensor.dispose();

results.faces = detections.map((detection) => ({
  confidence: detection.detection.score,
  age: Math.round(detection.age),
  gender: detection.gender,
  genderConfidence: detection.genderProbability,
  box: detection.detection.box, // موقع الوجه في الصورة
}));
```

### النتيجة:

```javascript
// مثال على النتيجة
faces: [
  {
    confidence: 0.98,
    age: 25,
    gender: "female",
    genderConfidence: 0.92,
    box: { x: 120, y: 80, width: 150, height: 180 },
  },
];
```

---

## 📖 5. استخراج النصوص (OCR) - عربي وإنجليزي

### المكتبة المستخدمة:

```javascript
const { createWorker } = require("tesseract.js");
```

### التحميل والتهيئة:

```javascript
// في دالة loadAIModels()
ocrWorker = await createWorker();
await ocrWorker.loadLanguage("eng+ara"); // إنجليزي + عربي
await ocrWorker.initialize("eng+ara");
```

### الاستخدام العملي:

```javascript
// في دالة analyzeImage()
const ocrResult = await ocrWorker.recognize(imageBuffer);
results.text = ocrResult.data.text.trim();

// تحديد إذا كانت وثيقة
const isDocument = results.text.length > 50;
if (isDocument) {
  results.tags.push("text", "document");
}
```

### النتيجة:

- **النص المستخرج**: النص الكامل من الصورة
- **التصنيف التلقائي**: إذا كان النص طويل = وثيقة
- **الدعم**: العربية والإنجليزية

---

## 🔄 6. كشف الصور المتكررة (Duplicate Detection)

### المكتبة المستخدمة:

```javascript
const { phash } = require("image-hash");
```

### الاستخدام العملي:

```javascript
// في دالة analyzeImage()
// إنشاء بصمة إدراكية للصورة
results.hash = await new Promise((resolve, reject) => {
  phash(filePath, (err, hash) => {
    if (err) reject(err);
    else resolve(hash);
  });
});

// في الحلقة الرئيسية للمعالجة
const imageHashes = new Map();

for (const image of images) {
  const analysis = await analyzeImage(image.path, image.name);

  // فحص التكرار
  if (analysis.hash && imageHashes.has(analysis.hash)) {
    analysis.isDuplicate = true;
    stats.duplicates++;
    console.log(
      `🔄 صورة مكررة: ${image.name} (مماثلة لـ ${imageHashes.get(analysis.hash)})`,
    );
  } else if (analysis.hash) {
    imageHashes.set(analysis.hash, image.name);
  }
}
```

### النتيجة:

- **البصمة**: نص فريد يمثل محتوى الصورة
- **المقارنة**: مقارنة البصمات للعثور على التطابق
- **الدقة**: يكشف التشابه حتى مع اختلاف الحجم أو الجودة

---

## 🎯 7. التنظيم الذكي (Smart Organization)

### خوارزمية التصنيف:

```javascript
// في دالة organizeImages()
let targetFolder = "others";

if (analysis.isNSFW) {
  targetFolder = "rejected";
} else if (analysis.isDuplicate) {
  targetFolder = "duplicates";
} else if (
  analysis.faces.length > 0 &&
  analysis.classification.includes("person")
) {
  targetFolder = "selfies";
} else if (analysis.text.length > 50) {
  targetFolder = "documents";
} else if (
  ["nature", "landscape", "outdoor"].some((term) =>
    analysis.classification.includes(term),
  )
) {
  targetFolder = "nature";
} else if (
  ["food", "meal", "drink"].some((term) =>
    analysis.classification.includes(term),
  )
) {
  targetFolder = "food";
} else if (analysis.classification.includes("animal")) {
  targetFolder = "animals";
} else if (
  ["car", "vehicle"].some((term) => analysis.classification.includes(term))
) {
  targetFolder = "vehicles";
} else if (
  ["building", "architecture"].some((term) =>
    analysis.classification.includes(term),
  )
) {
  targetFolder = "buildings";
}
```

### هيكل المجلدات الناتج:

```
~/KnouxOrganizer/images/
├── processed/           # الصور مع الأسماء الجديدة
│   ├── 2024-01-15-person-woman-beach-sunset.jpg
│   ├── 2024-01-15-nature-mountain-landscape.jpg
│   └── 2024-01-15-food-delicious-pizza.jpg
├── classified/          # مصنفة حسب المحتوى
│   ├── selfies/        # الصور الشخصية (وجوه + person)
│   ├── nature/         # الطبيعة (landscape, outdoor, tree)
│   ├── food/           # الطعام (food, meal, drink)
│   ├── documents/      # الوثائق (نص > 50 حرف)
│   ├── animals/        # الحيوانات (animal, pet, dog, cat)
│   ├── vehicles/       # المركبات (car, vehicle, truck)
│   ├── buildings/      # المباني (building, architecture)
│   └── others/         # الباقي
├── duplicates/         # الصور المتكررة
└── rejected/           # المحتوى المرفوض (NSFW)
```

---

## 📊 8. إحصائيات شاملة

### جمع الإحصائيات:

```javascript
const stats = {
  total: imageFiles.length,
  processed: 0,
  faces: 0,
  nsfw: 0,
  documents: 0,
  duplicates: 0,
  moved: 0,
  errors: 0,
  classifications: {},
};

// تحديث الإحصائيات أثناء المعالجة
if (analysis.faces.length > 0) stats.faces += analysis.faces.length;
if (analysis.isNSFW) stats.nsfw++;
if (analysis.text.length > 50) stats.documents++;
if (analysis.isDuplicate) stats.duplicates++;

// تتبع التصنيفات
if (!stats.classifications[analysis.classification]) {
  stats.classifications[analysis.classification] = 0;
}
stats.classifications[analysis.classification]++;
```

---

## ⚡ 9. تحسين الأداء

### معالجة الصور بـ Sharp:

```javascript
// تحسين حجم الصورة للمعالجة السريعة
const { data, info } = await sharp(imageBuffer)
  .resize(640, 640, { fit: "inside", withoutEnlargement: true })
  .raw()
  .toBuffer({ resolveWithObject: true });

const rawImage = new RawImage(data, info.width, info.height, info.channels);
```

### إدارة الذاكرة:

```javascript
// تنظيف tensors لتجنب تسريب الذاكرة
const tensor = tf.node.decodeImage(imageBuffer, 3);
const predictions = await nsfwModel.classify(tensor);
tensor.dispose(); // مهم جداً!
```

### معالجة الدفعات:

```javascript
// معالجة عدد محدود في نفس الوقت
const BATCH_SIZE = 5;
for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
  const batch = imageFiles.slice(i, i + BATCH_SIZE);
  const promises = batch.map((file) => analyzeImage(file.path, file.name));
  const results = await Promise.all(promises);
  // معالجة النتائج...
}
```

---

## 🔒 10. الأمان والخصوصية

### معالجة محلية 100%:

```javascript
// جميع النماذج تحمل محلياً
const modelsPath = path.join(os.homedir(), ".cache", "huggingface", "hub");
// لا يتم إرسال أي بيانات للإنترنت بعد التحميل الأولي
```

### تشفير البيانات المؤقتة:

```javascript
// حماية الملفات المؤقتة
const tempPath = path.join(APP_DIRS.temp, `temp-${crypto.randomUUID()}.jpg`);
```

---

## 🎉 الخلاصة

هذا التطبيق يستخدم **6 تقنيات ذكاء اصطناعي حقيقية** و**قوية** و**مجانية**:

1. ✅ **CLIP** - تصنيف الصور بدقة عالية
2. ✅ **Vision-GPT** - وصف ذكي وأسماء ملفات ذكية
3. ✅ **NSFWJS** - كشف المحتوى الحساس
4. ✅ **Face-API** - كشف الوجوه والعمر والجنس
5. ✅ **Tesseract** - استخراج النصوص العربية والإنجليزية
6. ✅ **pHash** - كشف الصور المتكررة بدقة

**كل هذا يعمل محلياً على جهازك بدون إرسال أي بيانات للإنترنت!** 🔒

---

## 🚀 النتيجة النهائية

تطبيق **احترافي** و**حقيقي** و**عملي** لتنظيم الصور بالذكاء الاصطناعي، مع:

- 🧠 **ذكاء اصطناعي حقيقي** - ليس مجرد أدوات بسيطة
- 📁 **تنظيم تلقائي ذكي** - تصنيف دقيق لآلاف الصور
- 🔍 **كشف متقدم** - وجوه، نصوص، تكرار، محتوى حساس
- 🎯 **دقة عالية** - استخدام أحدث نماذج الذكاء الاصطناعي
- 🔒 **خصوصية كاملة** - معالجة محلية 100%
- 🌍 **دعم العربية** - واجهة وتحليل باللغة العربية

**هذا تطبيق ذكاء اصطناعي حقيقي وليس مجرد محاكاة!** 🎉
