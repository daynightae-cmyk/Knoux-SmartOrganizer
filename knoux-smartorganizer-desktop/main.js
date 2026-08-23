const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const os = require("os");
const Store = require("electron-store");

// تهيئة مخزن الإعدادات
const store = new Store();

// --- AI Processing Libraries ---
const sharp = require("sharp");
const { RawImage } = require("@xenova/transformers");
const { phash } = require("image-hash");
const glob = require("glob");
const chokidar = require("chokidar");
const ExifParser = require("exif-parser");

// --- Import New AI Models Engine ---
const {
  initializeModels,
  models,
  areModelsReady,
} = require("./core/models.js");

// --- Import Offline AI Manager ---
const OfflineAIManager = require("./offline-ai-manager");

// --- Application State ---
let isProcessing = false;
let aiManager = null;

// --- Application Directories ---
const APP_DIRS = {
  root: app.getAppPath(),
  images: {
    raw: path.join(os.homedir(), "KnouxOrganizer", "images", "raw"),
    processed: path.join(os.homedir(), "KnouxOrganizer", "images", "processed"),
    classified: path.join(
      os.homedir(),
      "KnouxOrganizer",
      "images",
      "classified",
    ),
    duplicates: path.join(
      os.homedir(),
      "KnouxOrganizer",
      "images",
      "duplicates",
    ),
    rejected: path.join(os.homedir(), "KnouxOrganizer", "images", "rejected"),
  },
  logs: path.join(os.homedir(), "KnouxOrganizer", "logs"),
  models: path.join(os.homedir(), ".cache", "huggingface", "hub"),
  temp: path.join(os.homedir(), "KnouxOrganizer", "temp"),
};

const CLASSIFICATION_FOLDERS = {
  selfies: "الصور الشخصية",
  nature: "الطبيعة والمناظر",
  food: "الطعام والمشروبات",
  documents: "الوثائق والنصوص",
  screenshots: "لقطات الشاشة",
  animals: "الحيوانات",
  vehicles: "المركبات",
  buildings: "المباني والعمارة",
  others: "أخرى",
};

// --- Initialize Application Directories ---
async function initializeDirectories() {
  try {
    for (const dirPath of Object.values(APP_DIRS.images)) {
      await fs.mkdir(dirPath, { recursive: true });
    }

    for (const folderKey of Object.keys(CLASSIFICATION_FOLDERS)) {
      await fs.mkdir(path.join(APP_DIRS.images.classified, folderKey), {
        recursive: true,
      });
    }

    await fs.mkdir(APP_DIRS.logs, { recursive: true });
    await fs.mkdir(APP_DIRS.temp, { recursive: true });

    console.log("✅ تم تهيئة جميع المجلدات بنجاح");
    return true;
  } catch (error) {
    console.error("❌ خطأ في تهيئة المجلدات:", error);
    return false;
  }
}

// --- Load AI Models using New Engine ---
async function loadAIModels(win) {
  if (areModelsReady()) return true;

  try {
    // استخدام المحرك الجديد مع callback للتقدم
    await initializeModels((message) => {
      console.log(message);
      win.webContents.send("update-progress", message);
    });

    win.webContents.send("models-loaded", true);
    return true;
  } catch (error) {
    console.error("❌ فشل تحميل النماذج:", error);
    win.webContents.send("update-progress", `خطأ فادح: ${error.message}`);
    win.webContents.send("models-loaded", false);
    return false;
  }
}

// --- Comprehensive Image Analysis Function ---
async function analyzeImage(filePath, fileName, win, settings = {}) {
  const results = {
    fileName,
    filePath,
    processed: false,
    classification: "unknown",
    description: "",
    confidence: 0,
    faces: [],
    text: "",
    isNSFW: false,
    nsfwScore: 0,
    isDuplicate: false,
    hash: "",
    metadata: {},
    suggestedName: "",
    tags: [],
    errors: [],
  };

  try {
    // Read image file
    const imageBuffer = await fs.readFile(filePath);
    const imageStats = await fs.stat(filePath);

    // Extract metadata
    try {
      const parser = ExifParser.create(imageBuffer);
      const exifData = parser.parse();
      results.metadata = {
        size: imageStats.size,
        created: imageStats.birthtime,
        modified: imageStats.mtime,
        exif: exifData,
      };
    } catch (e) {
      results.metadata = {
        size: imageStats.size,
        created: imageStats.birthtime,
        modified: imageStats.mtime,
      };
    }

    // Process image with Sharp
    const { data, info } = await sharp(imageBuffer)
      .resize(640, 640, { fit: "inside", withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const rawImage = new RawImage(data, info.width, info.height, info.channels);

    // 1. Generate perceptual hash for duplicate detection
    try {
      results.hash = await new Promise((resolve, reject) => {
        phash(filePath, (err, hash) => {
          if (err) reject(err);
          else resolve(hash);
        });
      });
    } catch (e) {
      results.errors.push(`Hash generation failed: ${e.message}`);
    }

    // 2. NSFW Content Detection - تشغيل شرطي
    if (settings.runNsfw !== false) {
      try {
        const tf = require("@tensorflow/tfjs-node");
        const tensor = tf.node.decodeImage(imageBuffer, 3);
        const predictions = await models.nsfw.classify(tensor);
        tensor.dispose();

        const nsfwClasses = ["Porn", "Hentai"];
        const maxNsfwScore = Math.max(
          ...predictions
            .filter((p) => nsfwClasses.includes(p.className))
            .map((p) => p.probability),
        );

        results.nsfwScore = maxNsfwScore;
        results.isNSFW = maxNsfwScore > (settings.nsfwThreshold || 0.6);
      } catch (e) {
        results.errors.push(`NSFW detection failed: ${e.message}`);
      }
    }

    // 3. Face Detection and Analysis - تشغيل شرطي
    if (settings.runFaces !== false) {
      try {
        const tf = require("@tensorflow/tfjs-node");
        const tensor = tf.node.decodeImage(imageBuffer);
        const detections = await faceapi
          .detectAllFaces(tensor)
          .withFaceLandmarks()
          .withAgeAndGender();
        tensor.dispose();

        results.faces = detections
          .filter(
            (detection) =>
              detection.detection.score >
              (settings.faceConfidenceThreshold || 0.5),
          )
          .map((detection) => ({
            confidence: detection.detection.score,
            age: Math.round(detection.age),
            gender: detection.gender,
            genderConfidence: detection.genderProbability,
            box: detection.detection.box,
          }));
      } catch (e) {
        results.errors.push(`Face detection failed: ${e.message}`);
      }
    }

    // 4. OCR Text Extraction - تشغيل شرطي
    if (settings.runOcr !== false) {
      try {
        const ocrResult = await models.ocr.recognize(imageBuffer);
        results.text = ocrResult.data.text.trim();
      } catch (e) {
        results.errors.push(`OCR failed: ${e.message}`);
      }
    }

    // 5. Image Classification - تشغيل شرطي
    if (settings.runClassifier !== false) {
      try {
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

        const classificationResult = await models.classifier(
          rawImage,
          candidateLabels,
        );
        results.classification = classificationResult[0].label;
        results.confidence = classificationResult[0].score;
      } catch (e) {
        results.errors.push(`Classification failed: ${e.message}`);
      }
    }

    // 6. Generate Description - تشغيل شرطي
    if (settings.runDescription !== false) {
      try {
        const captionResult = await models.captioner(rawImage);
        results.description = captionResult[0].generated_text;
      } catch (e) {
        results.errors.push(`Caption generation failed: ${e.message}`);
      }
    }

    // 7. Generate Tags and Smart Filename
    results.tags = [
      results.classification,
      ...(results.faces.length > 0
        ? ["faces", `${results.faces.length}-people`]
        : []),
      ...(results.text.length > 30 ? ["text", "document"] : []),
      ...(results.isNSFW ? ["nsfw"] : []),
      ...(results.confidence > 0.8 ? ["high-confidence"] : []),
    ].filter(Boolean);

    // Generate smart filename باستخدام القالب المخصص
    const timestamp = new Date().toISOString().slice(0, 10);
    const safeDescription = (results.description || "image")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 30);
    const extension = path.extname(fileName);

    // استخدام قالب التسمية المخصص
    const template = settings.renameTemplate || "{date}-{desc}";
    let finalName = template
      .replace("{date}", timestamp)
      .replace("{desc}", safeDescription || "general")
      .replace("{class}", results.classification || "image")
      .replace("{faces}", results.faces.length.toString())
      .replace(
        "{confidence}",
        Math.round((results.confidence || 0) * 100).toString(),
      );

    results.suggestedName = `${finalName}${extension}`;
    results.processed = true;

    return results;
  } catch (error) {
    results.errors.push(`General processing failed: ${error.message}`);
    return results;
  }
}

// --- Smart Organization Function ---
async function organizeImages(win) {
  if (isProcessing) {
    win.webContents.send("update-progress", "عملية أخرى قيد التنفيذ...");
    return { success: false, message: "عملية أخرى قيد التنفيذ" };
  }

  // التحقق من جاهزية النماذج أولاً
  if (!areModelsReady()) {
    win.webContents.send(
      "update-progress",
      "❌ النماذج غير جاهزة بعد. الرجاء الانتظار حتى يكتمل التحميل.",
    );
    return { success: false, message: "النماذج غير جاهزة بعد" };
  }

  isProcessing = true;

  // جلب الإعدادات الحديثة
  const settings = store.get("settings", {});

  const logTimestamp = new Date().toISOString().replace(/:/g, "-");
  const logFilePath = path.join(
    APP_DIRS.logs,
    `organization-${logTimestamp}.log`,
  );
  let logContent = `--- بدء جلسة التنظيم: ${new Date().toLocaleString("ar")} ---\n\n`;

  const stats = {
    total: 0,
    processed: 0,
    faces: 0,
    nsfw: 0,
    documents: 0,
    duplicates: 0,
    moved: 0,
    errors: 0,
    classifications: {},
  };

  const imageHashes = new Map();

  const writeLog = (message) => {
    console.log(message);
    logContent += `${message}\n`;
    win.webContents.send("update-progress", message);
  };

  try {
    writeLog("🔍 البحث عن الصور في مجلد المصدر...");

    // Find all image files
    const imageExtensions = [
      "jpg",
      "jpeg",
      "png",
      "bmp",
      "gif",
      "webp",
      "tiff",
    ];
    const pattern = path.join(
      APP_DIRS.images.raw,
      `**/*.{${imageExtensions.join(",")}}`,
    );
    const imageFiles = glob.sync(pattern, { nocase: true });

    stats.total = imageFiles.length;

    if (imageFiles.length === 0) {
      writeLog("⚠️ لم يتم العثور على أي صور في مجلد المصدر");
      return { success: false, message: "لا توجد صور للمعالجة", stats };
    }

    writeLog(`📊 تم العثور على ${imageFiles.length} صورة للمعالجة`);

    // Process each image
    for (const [index, filePath] of imageFiles.entries()) {
      const fileName = path.basename(filePath);
      const progress = Math.round(((index + 1) / imageFiles.length) * 100);

      writeLog(
        `[${index + 1}/${imageFiles.length}] (${progress}%) معالجة: ${fileName}`,
      );
      win.webContents.send("update-progress-percent", progress);

      const analysis = await analyzeImage(filePath, fileName, win, settings);

      if (analysis.processed) {
        stats.processed++;

        // Update statistics
        if (analysis.faces.length > 0) stats.faces += analysis.faces.length;
        if (analysis.isNSFW) stats.nsfw++;
        if (analysis.text.length > 50) stats.documents++;

        // Track classifications
        if (!stats.classifications[analysis.classification]) {
          stats.classifications[analysis.classification] = 0;
        }
        stats.classifications[analysis.classification]++;

        // Check for duplicates - تشغيل شرطي
        if (settings.runDuplicates !== false && analysis.hash) {
          if (imageHashes.has(analysis.hash)) {
            analysis.isDuplicate = true;
            stats.duplicates++;
            writeLog(
              `  🔄 صورة مكررة: ${fileName} (مماثلة لـ ${imageHashes.get(analysis.hash)})`,
            );
          } else {
            imageHashes.set(analysis.hash, fileName);
          }
        }

        // Determine classification folder
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
          ["car", "vehicle"].some((term) =>
            analysis.classification.includes(term),
          )
        ) {
          targetFolder = "vehicles";
        } else if (
          ["building", "architecture"].some((term) =>
            analysis.classification.includes(term),
          )
        ) {
          targetFolder = "buildings";
        }

        // Copy to processed folder with new name
        const processedPath = path.join(
          APP_DIRS.images.processed,
          analysis.suggestedName,
        );
        await fs.copyFile(filePath, processedPath);

        // Copy to classified folder
        const classifiedPath = path.join(
          analysis.isNSFW
            ? APP_DIRS.images.rejected
            : APP_DIRS.images.classified,
          analysis.isDuplicate ? "duplicates" : targetFolder,
          fileName,
        );
        await fs.mkdir(path.dirname(classifiedPath), { recursive: true });
        await fs.copyFile(filePath, classifiedPath);

        stats.moved++;

        // حذف الملف الأصلي إذا كان مفعلاً
        if (settings.deleteOriginals) {
          try {
            await fs.unlink(filePath);
            writeLog(`  🗑️ تم حذف الملف الأصلي: ${fileName}`);
          } catch (deleteError) {
            writeLog(`  ⚠️ فشل في حذف الملف الأصلي: ${deleteError.message}`);
          }
        }

        writeLog(
          `  ✅ تم التصنيف: ${targetFolder} | الوجوه: ${analysis.faces.length} | النص: ${analysis.text.length > 0 ? "نعم" : "لا"}`,
        );

        if (analysis.errors.length > 0) {
          writeLog(`  ⚠️ تحذيرات: ${analysis.errors.join(", ")}`);
        }
      } else {
        stats.errors++;
        writeLog(`  ❌ فشل في معالجة: ${fileName}`);
      }
    }

    writeLog("\n🎉 --- اكتملت عملية التنظيم بنجاح ---");
    writeLog(`📊 الإحصائيات النهائية:`);
    writeLog(`  • المعالج: ${stats.processed}/${stats.total}`);
    writeLog(`  • الوجوه المكتشفة: ${stats.faces}`);
    writeLog(`  • المحتوى الحساس: ${stats.nsfw}`);
    writeLog(`  • الوثائق: ${stats.documents}`);
    writeLog(`  • المتكررات: ${stats.duplicates}`);
    writeLog(`  • تم النقل: ${stats.moved}`);
    writeLog(`  • الأخطاء: ${stats.errors}`);

    // Save log file
    await fs.writeFile(logFilePath, logContent);

    // حفظ إحصائيات المعالجة
    const processingTime =
      Date.now() - Date.parse(logTimestamp.replace(/-/g, ":"));
    store.set("lastProcessed", new Date().toISOString());
    store.set(
      "totalProcessingTime",
      store.get("totalProcessingTime", 0) + processingTime,
    );

    win.webContents.send("organization-complete", { success: true, stats });

    return { success: true, stats, logPath: logFilePath };
  } catch (error) {
    writeLog(`❌ خطأ فادح: ${error.message}`);
    await fs.writeFile(logFilePath, logContent);
    stats.errors++;

    win.webContents.send("organization-complete", {
      success: false,
      error: error.message,
      stats,
    });

    return { success: false, error: error.message, stats };
  } finally {
    isProcessing = false;
  }
}

// --- Electron App Setup ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 750,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, "assets", "icon.png"),
    show: false,
    titleBarStyle: "default",
  });

  // Load UI
  win.loadFile(path.join(__dirname, "ui", "index.html"));

  // Show window when ready
  win.once("ready-to-show", async () => {
    win.show();

    // Initialize directories and load models
    const dirsReady = await initializeDirectories();
    if (dirsReady) {
      await loadAIModels(win);
    }
  });

  // Development mode
  if (process.argv.includes("--dev")) {
    win.webContents.openDevTools();
  }

  return win;
}

// --- IPC Handlers للإعدادات والوظائف الجديدة ---

// جلب الإعدادات المحفوظة
ipcMain.handle("get-settings", () => {
  return store.get("settings", {
    // قيم افتراضية
    runClassifier: true,
    runDescription: true,
    runNsfw: true,
    runFaces: true,
    runOcr: true,
    runDuplicates: true,
    nsfwThreshold: 0.7, // عتبة الحساسية
    renameTemplate: "{date}-{desc}", // قالب إعادة التسمية
    deleteOriginals: false, // خيار لحذف الصور الأصلية بعد النقل
    classificationThreshold: 0.3, // حد الثقة للتصنيف
    faceConfidenceThreshold: 0.5, // حد الثقة لكشف الوجوه
    textMinLength: 30, // الحد الأدنى لطول النص
  });
});

// حفظ الإعدادات
ipcMain.handle("set-settings", (event, settings) => {
  store.set("settings", settings);
  return true;
});

// فتح مجلد في مستكشف الملفات
ipcMain.handle("open-folder", (event, folderPath) => {
  const fullPath = path.resolve(folderPath);
  shell.openPath(fullPath);
});

// جلب معلومات التطبيق
ipcMain.handle("get-app-info", () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    directories: APP_DIRS,
    modelsLoaded,
    isProcessing,
  };
});

ipcMain.handle("select-source-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "اختر مجلد الصور المصدر",
  });

  if (!result.canceled && result.filePaths.length > 0) {
    APP_DIRS.images.raw = result.filePaths[0];
    return { success: true, path: result.filePaths[0] };
  }

  return { success: false };
});

ipcMain.handle("run-organization", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return await organizeImages(win);
});

// إحصائيات متقدمة
ipcMain.handle("get-advanced-stats", async () => {
  try {
    const stats = {
      totalFiles: 0,
      processedFiles: 0,
      folderSizes: {},
      lastProcessed: store.get("lastProcessed", null),
      totalProcessingTime: store.get("totalProcessingTime", 0),
    };

    // حساب أحجام المجلدات
    for (const [key, folderPath] of Object.entries(APP_DIRS.images)) {
      try {
        const files = await fs.readdir(folderPath);
        stats.folderSizes[key] = files.length;
      } catch (error) {
        stats.folderSizes[key] = 0;
      }
    }

    return stats;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("open-folder", async (event, folderType) => {
  const folderPath = APP_DIRS.images[folderType] || APP_DIRS.images.classified;
  shell.openPath(folderPath);
});

ipcMain.handle("get-statistics", async () => {
  // Implementation to get current statistics
  return {
    totalImages: 0,
    processed: 0,
    classifications: {},
  };
});

// --- App Event Handlers ---
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Cleanup resources
    if (models.ocr) {
      models.ocr.terminate();
    }
    app.quit();
  }
});

app.on("before-quit", () => {
  isProcessing = false;
});

console.log("🚀 Knoux SmartOrganizer PRO Desktop started");
