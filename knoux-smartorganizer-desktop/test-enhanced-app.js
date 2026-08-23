#!/usr/bin/env node

/**
 * 🧪 اختبار التطبيق المحسن
 * Knoux SmartOrganizer PRO - Enhanced Features Test
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

// اختبار ملفات الواجهة الجديدة
async function testUIFiles() {
  log("🎨 اختبار ملفات الواجهة الجديدة...", "cyan");

  const uiFiles = [
    { path: "ui/index.html", desc: "ملف HTML الرئيسي" },
    { path: "ui/app.js", desc: "تطبيق React الجديد" },
    { path: "ui/style.css", desc: "ملف التصميم الاحترافي" },
  ];

  let allExists = true;

  for (const file of uiFiles) {
    if (fs.existsSync(file.path)) {
      const stats = fs.statSync(file.path);
      const sizeKB = Math.round(stats.size / 1024);
      log(`  ✅ ${file.desc} - ${sizeKB} KB`, "green");
    } else {
      log(`  ❌ ${file.desc} - غير موجود`, "red");
      allExists = false;
    }
  }

  return allExists;
}

// اختبار مكتبات الإعدادات
async function testSettingsLibraries() {
  log("\n📦 اختبار مكتبات الإعدادات...", "cyan");

  const libraries = [
    { name: "electron-store", desc: "مكتبة حفظ الإعدادات" },
    { name: "react-icons", desc: "مكتبة الأيقونات" },
  ];

  let allLoaded = true;

  for (const lib of libraries) {
    try {
      require(lib.name);
      log(`  ✅ ${lib.desc} - متاحة`, "green");
    } catch (error) {
      log(`  ❌ ${lib.desc} - غير متاحة`, "red");
      log(`    💡 قم بتثبيتها: npm install ${lib.name}`, "yellow");
      allLoaded = false;
    }
  }

  return allLoaded;
}

// اختبار ملف main.js المحدث
async function testMainJSUpdates() {
  log("\n🔧 اختبار تحديثات main.js...", "cyan");

  try {
    const mainContent = fs.readFileSync("main.js", "utf8");

    const checks = [
      {
        pattern: /const Store = require\("electron-store"\)/,
        desc: "استيراد مكتبة electron-store",
      },
      {
        pattern: /ipcMain\.handle\("get-settings"/,
        desc: "معالج جلب الإعدادات",
      },
      {
        pattern: /ipcMain\.handle\("set-settings"/,
        desc: "معالج حفظ الإعدادات",
      },
      {
        pattern: /settings\.runNsfw/,
        desc: "استخدام إعدادات NSFW",
      },
      {
        pattern: /settings\.deleteOriginals/,
        desc: "خيار حذف الملفات الأصلية",
      },
      {
        pattern: /settings\.renameTemplate/,
        desc: "قالب إعادة التسمية المخصص",
      },
    ];

    let allChecks = true;

    for (const check of checks) {
      if (check.pattern.test(mainContent)) {
        log(`  ✅ ${check.desc}`, "green");
      } else {
        log(`  ❌ ${check.desc} - غير موجود`, "red");
        allChecks = false;
      }
    }

    return allChecks;
  } catch (error) {
    log(`  ❌ فشل في قراءة main.js: ${error.message}`, "red");
    return false;
  }
}

// اختبار ملف preload.js المحدث
async function testPreloadUpdates() {
  log("\n🔗 اختبار تحديثات preload.js...", "cyan");

  try {
    const preloadContent = fs.readFileSync("preload.js", "utf8");

    const checks = [
      {
        pattern: /getSettings.*ipcRenderer\.invoke\("get-settings"\)/,
        desc: "ربط جلب الإعدادات",
      },
      {
        pattern: /setSettings.*ipcRenderer\.invoke\("set-settings"/,
        desc: "ربط حفظ الإعدادات",
      },
      {
        pattern: /openFolder.*ipcRenderer\.invoke\("open-folder"/,
        desc: "ربط فتح المجلدات",
      },
    ];

    let allChecks = true;

    for (const check of checks) {
      if (check.pattern.test(preloadContent)) {
        log(`  ✅ ${check.desc}`, "green");
      } else {
        log(`  ❌ ${check.desc} - غير موجود`, "red");
        allChecks = false;
      }
    }

    return allChecks;
  } catch (error) {
    log(`  ❌ فشل في قراءة preload.js: ${error.message}`, "red");
    return false;
  }
}

// اختبار ملف CSS الجديد
async function testCSSFeatures() {
  log("\n🎨 اختبار ميزات CSS الجديدة...", "cyan");

  try {
    const cssContent = fs.readFileSync("ui/style.css", "utf8");

    const checks = [
      { pattern: /:root.*--primary-color/, desc: "متغيرات CSS" },
      { pattern: /\.app-container/, desc: "تقسيم التطبيق" },
      { pattern: /\.sidebar/, desc: "الشريط الجانبي" },
      { pattern: /\.main-button/, desc: "أزرار محسنة" },
      { pattern: /\.modal-overlay/, desc: "نافذة الإعدادات" },
      { pattern: /\.stat-card/, desc: "بطاقات الإحصائيات" },
      { pattern: /\.switch/, desc: "مفاتيح التفعيل" },
      { pattern: /@keyframes/, desc: "انيميشن" },
    ];

    let allChecks = true;

    for (const check of checks) {
      if (check.pattern.test(cssContent)) {
        log(`  ✅ ${check.desc}`, "green");
      } else {
        log(`  ❌ ${check.desc} - غير موجود`, "red");
        allChecks = false;
      }
    }

    return allChecks;
  } catch (error) {
    log(`  ❌ فشل في قراءة style.css: ${error.message}`, "red");
    return false;
  }
}

// اختبار مكونات React الجديدة
async function testReactComponents() {
  log("\n⚛️ اختبار مكونات React الجديدة...", "cyan");

  try {
    const appContent = fs.readFileSync("ui/app.js", "utf8");

    const checks = [
      { pattern: /function StatCard/, desc: "مكون بطاقة الإحصائيات" },
      { pattern: /function SettingsModal/, desc: "مكون نافذة الإعدادات" },
      { pattern: /useState.*settings/, desc: "حالة الإعدادات" },
      { pattern: /electronAPI\.getSettings/, desc: "جلب الإعدادات" },
      { pattern: /electronAPI\.setSettings/, desc: "حفظ الإعدادات" },
      { pattern: /className="switch"/, desc: "مفاتيح التفعيل/الإيقاف" },
      { pattern: /renameTemplate/, desc: "قالب إعادة التسمية" },
      { pattern: /deleteOriginals/, desc: "خيار حذف الملفات" },
    ];

    let allChecks = true;

    for (const check of checks) {
      if (check.pattern.test(appContent)) {
        log(`  ✅ ${check.desc}`, "green");
      } else {
        log(`  ❌ ${check.desc} - غير موجود`, "red");
        allChecks = false;
      }
    }

    return allChecks;
  } catch (error) {
    log(`  ❌ فشل في قراءة app.js: ${error.message}`, "red");
    return false;
  }
}

// اختبار معالجة الأخطاء
async function testErrorHandling() {
  log("\n🛡️ اختبار معالجة الأخطاء...", "cyan");

  try {
    // محاولة إنشاء Store للاختبار
    const Store = require("electron-store");
    const testStore = new Store({ name: "test-settings" });

    // اختبار حفظ واسترجاع
    const testSettings = { test: true, value: 42 };
    testStore.set("test", testSettings);
    const retrieved = testStore.get("test");

    if (JSON.stringify(retrieved) === JSON.stringify(testSettings)) {
      log("  ✅ حفظ واسترجاع الإعدادات يعمل", "green");
    } else {
      log("  ❌ مشكلة في حفظ الإعدادات", "red");
      return false;
    }

    // تنظيف
    testStore.clear();

    return true;
  } catch (error) {
    log(`  ❌ خطأ في اختبار الإعدادات: ${error.message}`, "red");
    return false;
  }
}

// اختبار تكامل الميزات
async function testFeatureIntegration() {
  log("\n🔗 اختبار تكامل الميزات...", "cyan");

  const integrationChecks = [
    {
      check: () => fs.existsSync("main.js") && fs.existsSync("preload.js"),
      desc: "ملفات الخلفية موجودة",
    },
    {
      check: () => fs.existsSync("ui/index.html") && fs.existsSync("ui/app.js"),
      desc: "ملفات الواجهة موجودة",
    },
    {
      check: () => fs.existsSync("ui/style.css"),
      desc: "ملف التصميم موجود",
    },
    {
      check: () => {
        try {
          require("electron-store");
          return true;
        } catch {
          return false;
        }
      },
      desc: "مكتبة الإعدادات متاحة",
    },
  ];

  let allIntegrated = true;

  for (const check of integrationChecks) {
    if (check.check()) {
      log(`  ✅ ${check.desc}`, "green");
    } else {
      log(`  ❌ ${check.desc}`, "red");
      allIntegrated = false;
    }
  }

  return allIntegrated;
}

// دالة الاختبار الشامل
async function runEnhancedTest() {
  console.clear();
  log("=" * 70, "cyan");
  log("🚀 Knoux SmartOrganizer PRO - اختبار الميزات المحسنة", "bright");
  log("=" * 70, "cyan");

  const testResults = [];

  try {
    // تشغيل جميع الاختبارات
    testResults.push({
      name: "ملفات الواجهة",
      result: await testUIFiles(),
    });

    testResults.push({
      name: "مكتبات الإعدادات",
      result: await testSettingsLibraries(),
    });

    testResults.push({
      name: "تحديثات main.js",
      result: await testMainJSUpdates(),
    });

    testResults.push({
      name: "تحديثات preload.js",
      result: await testPreloadUpdates(),
    });

    testResults.push({
      name: "ميزات CSS",
      result: await testCSSFeatures(),
    });

    testResults.push({
      name: "مكونات React",
      result: await testReactComponents(),
    });

    testResults.push({
      name: "معالجة الأخطاء",
      result: await testErrorHandling(),
    });

    testResults.push({
      name: "تكامل الميزات",
      result: await testFeatureIntegration(),
    });

    // النتائج النهائية
    log("\n" + "=" * 70, "cyan");
    log("📊 النتائج النهائية:", "bright");
    log("=" * 70, "cyan");

    const passedTests = testResults.filter((test) => test.result).length;
    const totalTests = testResults.length;

    testResults.forEach((test) => {
      const status = test.result ? "✅ نجح" : "❌ فشل";
      const color = test.result ? "green" : "red";
      log(`  ${status} ${test.name}`, color);
    });

    log("\n📈 الإحصائيات:", "cyan");
    log(`  • اختبارات ناجحة: ${passedTests}/${totalTests}`, "blue");
    log(
      `  • نسبة النجاح: ${Math.round((passedTests / totalTests) * 100)}%`,
      "blue",
    );

    if (passedTests === totalTests) {
      log("\n🎉 جميع الاختبارات نجحت! التطبيق المحسن جاهز للاستخدام.", "green");
      log("🚀 يمكنك الآن تشغيل التطبيق: npm start", "cyan");
      log("\n✨ الميزات الجديدة:", "yellow");
      log("  • نافذة إعدادات تفاعلية", "blue");
      log("  • واجهة احترافية محسنة", "blue");
      log("  • حفظ دائم للإعدادات", "blue");
      log("  • تحكم مرن في الميزات", "blue");
      log("  • إحصائيات تفاعلية", "blue");
      log("  • قوالب تسمية مخصصة", "blue");
    } else {
      log("\n⚠️ بعض الاختبارات ف��لت. يرجى مراجعة المشاكل أعلاه.", "yellow");
      log("🔧 نصائح لحل المشاكل:", "cyan");
      log("  1. تأكد من تثبيت المكتبات: npm install", "blue");
      log("  2. تحقق من وجود جميع الملفات", "blue");
      log("  3. راجع الأخطاء في الرسائل أعلاه", "blue");
    }

    log("=" * 70, "cyan");
  } catch (error) {
    log(`\n❌ خطأ في الاختبار: ${error.message}`, "red");
    log("🔧 يرجى التأكد من تثبيت جميع المكتبات والملفات", "yellow");
  }
}

// تشغيل الاختبار
if (require.main === module) {
  runEnhancedTest();
}

module.exports = {
  testUIFiles,
  testSettingsLibraries,
  testMainJSUpdates,
  testPreloadUpdates,
  testCSSFeatures,
  testReactComponents,
  testErrorHandling,
  testFeatureIntegration,
  runEnhancedTest,
};
