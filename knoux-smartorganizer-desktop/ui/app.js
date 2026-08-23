const { useState, useEffect, useRef } = React;

// تعريف الأيقونات من مكتبة react-icons
const RiTeamLine = () =>
  React.createElement("i", { className: "ri-team-line" });
const RiShieldForbidLine = () =>
  React.createElement("i", { className: "ri-shield-forbid-line" });
const RiFileList3Line = () =>
  React.createElement("i", { className: "ri-file-list-3-line" });
const RiPictureInPictureLine = () =>
  React.createElement("i", { className: "ri-picture-in-picture-line" });
const RiFileEditLine = () =>
  React.createElement("i", { className: "ri-file-edit-line" });
const RiBubbleChartLine = () =>
  React.createElement("i", { className: "ri-bubble-chart-line" });
const RiSettings3Line = () =>
  React.createElement("i", { className: "ri-settings-3-line" });
const RiRocketLine = () =>
  React.createElement("i", { className: "ri-rocket-line" });
const RiFolderOpenLine = () =>
  React.createElement("i", { className: "ri-folder-open-line" });
const RiEyeLine = () => React.createElement("i", { className: "ri-eye-line" });
const RiImageLine = () =>
  React.createElement("i", { className: "ri-image-line" });
const RiCpuLine = () => React.createElement("i", { className: "ri-cpu-line" });

// مكون إضافي لعرض بطاقة إحصائية
function StatCard({ icon, value, label, folder, onOpenFolder }) {
  return React.createElement(
    "div",
    { className: "stat-card" },
    React.createElement("div", { className: "stat-card-icon" }, icon),
    React.createElement("h3", null, value),
    React.createElement("p", null, label),
    folder &&
      React.createElement(
        "button",
        {
          className: "open-folder-btn",
          onClick: () => onOpenFolder(folder),
        },
        "افتح المجلد ",
        React.createElement(RiFolderOpenLine),
      ),
  );
}

// مكون نافذة الإعدادات
function SettingsModal({ isOpen, onClose, settings, setSettings }) {
  if (!isOpen) return null;

  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    window.electronAPI.setSettings(newSettings);
  };

  const modalOverlay = React.createElement(
    "div",
    {
      className: "modal-overlay",
      onClick: onClose,
    },
    React.createElement(
      "div",
      {
        className: "modal-content",
        onClick: (e) => e.stopPropagation(),
      },
      React.createElement(
        "h2",
        null,
        React.createElement(RiSettings3Line),
        " إعدادات التطبيق",
      ),

      // إعداد كشف الوجوه
      React.createElement(
        "div",
        { className: "setting-item" },
        React.createElement(
          "label",
          null,
          React.createElement("strong", null, "تفعيل كشف الوجوه"),
          React.createElement(
            "div",
            { className: "setting-description" },
            "كشف الوجوه وتقدير العمر والجنس في الصور",
          ),
        ),
        React.createElement(
          "label",
          { className: "switch" },
          React.createElement("input", {
            type: "checkbox",
            checked: settings.runFaces,
            onChange: (e) => handleChange("runFaces", e.target.checked),
          }),
          React.createElement("span", { className: "slider" }),
        ),
      ),

      // إعداد كشف المحتوى الحساس
      React.createElement(
        "div",
        { className: "setting-item" },
        React.createElement(
          "label",
          null,
          React.createElement(
            "strong",
            null,
            "تفعيل كشف المحتوى الحساس (NSFW)",
          ),
          React.createElement(
            "div",
            { className: "setting-description" },
            "فلترة المحتوى غير المناسب تلقائياً",
          ),
        ),
        React.createElement(
          "label",
          { className: "switch" },
          React.createElement("input", {
            type: "checkbox",
            checked: settings.runNsfw,
            onChange: (e) => handleChange("runNsfw", e.target.checked),
          }),
          React.createElement("span", { className: "slider" }),
        ),
      ),

      // إعداد استخراج النصوص
      React.createElement(
        "div",
        { className: "setting-item" },
        React.createElement(
          "label",
          null,
          React.createElement("strong", null, "تفعيل استخراج النصوص (OCR)"),
          React.createElement(
            "div",
            { className: "setting-description" },
            "استخراج النصوص العربية والإنجليزية من الصور",
          ),
        ),
        React.createElement(
          "label",
          { className: "switch" },
          React.createElement("input", {
            type: "checkbox",
            checked: settings.runOcr,
            onChange: (e) => handleChange("runOcr", e.target.checked),
          }),
          React.createElement("span", { className: "slider" }),
        ),
      ),

      // إعداد كشف التكرار
      React.createElement(
        "div",
        { className: "setting-item" },
        React.createElement(
          "label",
          null,
          React.createElement("strong", null, "تفعيل كشف الصور المتكررة"),
          React.createElement(
            "div",
            { className: "setting-description" },
            "العثور على الصور المتشابهة والمتكررة",
          ),
        ),
        React.createElement(
          "label",
          { className: "switch" },
          React.createElement("input", {
            type: "checkbox",
            checked: settings.runDuplicates,
            onChange: (e) => handleChange("runDuplicates", e.target.checked),
          }),
          React.createElement("span", { className: "slider" }),
        ),
      ),

      // إعداد التصنيف
      React.createElement(
        "div",
        { className: "setting-item" },
        React.createElement(
          "label",
          null,
          React.createElement("strong", null, "تفعيل التصنيف الذكي"),
          React.createElement(
            "div",
            { className: "setting-description" },
            "تصنيف الصور تلقائياً باستخدام الذكاء الاصطناعي",
          ),
        ),
        React.createElement(
          "label",
          { className: "switch" },
          React.createElement("input", {
            type: "checkbox",
            checked: settings.runClassifier,
            onChange: (e) => handleChange("runClassifier", e.target.checked),
          }),
          React.createElement("span", { className: "slider" }),
        ),
      ),

      // إعداد وصف الصور
      React.createElement(
        "div",
        { className: "setting-item" },
        React.createElement(
          "label",
          null,
          React.createElement("strong", null, "تفعيل وصف الصور"),
          React.createElement(
            "div",
            { className: "setting-description" },
            "توليد أوصاف ذكية للصور لإعادة التسمية",
          ),
        ),
        React.createElement(
          "label",
          { className: "switch" },
          React.createElement("input", {
            type: "checkbox",
            checked: settings.runDescription,
            onChange: (e) => handleChange("runDescription", e.target.checked),
          }),
          React.createElement("span", { className: "slider" }),
        ),
      ),

      // إعداد عتبة NSFW
      React.createElement(
        "div",
        { className: "setting-item" },
        React.createElement(
          "label",
          null,
          React.createElement(
            "strong",
            null,
            `عتبة كشف المحتوى الحساس: ${Math.round(settings.nsfwThreshold * 100)}%`,
          ),
          React.createElement(
            "div",
            { className: "setting-description" },
            "حساسية كشف المحتوى غير المناسب",
          ),
        ),
        React.createElement("input", {
          type: "range",
          className: "setting-slider",
          min: "0.3",
          max: "0.9",
          step: "0.1",
          value: settings.nsfwThreshold,
          onChange: (e) =>
            handleChange("nsfwThreshold", parseFloat(e.target.value)),
        }),
      ),

      // إعداد قالب إعادة التسمية
      React.createElement(
        "div",
        { className: "setting-item" },
        React.createElement(
          "label",
          null,
          React.createElement("strong", null, "قالب إعادة التسمية"),
          React.createElement(
            "div",
            { className: "setting-description" },
            "استخدم {date}, {desc}, {class}, {faces} كمتغيرات",
          ),
        ),
        React.createElement("input", {
          type: "text",
          className: "setting-input",
          value: settings.renameTemplate,
          onChange: (e) => handleChange("renameTemplate", e.target.value),
          placeholder: "{date}-{desc}",
        }),
      ),

      // إعداد خطير: حذف الملفات الأصلية
      React.createElement(
        "div",
        {
          className: "setting-item",
          style: { backgroundColor: "rgba(244, 67, 54, 0.1)" },
        },
        React.createElement(
          "label",
          null,
          React.createElement(
            "strong",
            null,
            "⚠️ حذف الملفات الأصلية بعد النقل",
          ),
          React.createElement(
            "div",
            { className: "setting-description" },
            "تحذير: هذا الخيار خطير ولا يمكن التراجع عنه!",
          ),
        ),
        React.createElement(
          "label",
          { className: "switch" },
          React.createElement("input", {
            type: "checkbox",
            checked: settings.deleteOriginals,
            onChange: (e) => handleChange("deleteOriginals", e.target.checked),
          }),
          React.createElement("span", {
            className: "slider",
            style: settings.deleteOriginals
              ? { backgroundColor: "#f44336" }
              : {},
          }),
        ),
      ),

      React.createElement(
        "button",
        {
          className: "main-button",
          onClick: onClose,
          style: { marginTop: "30px" },
        },
        "إغلاق وحفظ الإعدادات",
      ),
    ),
  );

  return modalOverlay;
}

// المكون الرئيسي للتطبيق
function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [log, setLog] = useState("في انتظار بدء العملية...\n");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    runClassifier: true,
    runDescription: true,
    runNsfw: true,
    runFaces: true,
    runOcr: true,
    runDuplicates: true,
    nsfwThreshold: 0.7,
    renameTemplate: "{date}-{desc}",
    deleteOriginals: false,
  });
  const [appInfo, setAppInfo] = useState(null);
  const logRef = useRef(null);

  // تحميل الإعدادات عند أول عرض
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await window.electronAPI.getSettings();
        setSettings(savedSettings);

        const info = await window.electronAPI.getAppInfo();
        setAppInfo(info);

        setLog((prev) => prev + "✅ تم تحميل الإعدادات بنجاح\n");
      } catch (error) {
        setLog(
          (prev) => prev + `❌ فشل في تحميل الإعدادات: ${error.message}\n`,
        );
      }
    };

    loadSettings();
  }, []);

  // تحديث سجل التشغيل المباشر
  useEffect(() => {
    const handleProgress = (message) => {
      setLog((prev) => `${prev}${message}\n`);
    };

    const handleComplete = (result) => {
      setIsLoading(false);
      if (result.success) {
        setStats(result.stats);
        setLog((prev) => `${prev}\n🎉 تمت العملية بنجاح!\n`);
      } else {
        setLog((prev) => `${prev}\n❌ فشلت العملية: ${result.error}\n`);
      }
    };

    window.electronAPI.onUpdateProgress(handleProgress);
    window.electronAPI.onOrganizationComplete(handleComplete);

    return () => {
      window.electronAPI.removeAllListeners("update-progress");
      window.electronAPI.removeAllListeners("organization-complete");
    };
  }, []);

  // التمرير التلقائي للسجل
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const handleOrganize = async () => {
    setIsLoading(true);
    setStats(null);
    setLog("⏳ بدأت عملية التنظيم الذكي...\n");

    try {
      await window.electronAPI.runOrganization();
    } catch (err) {
      setIsLoading(false);
      setLog((prev) => `${prev}\n❌ خطأ فادح: ${err.message}\n`);
    }
  };

  const openFolder = (folderName) => {
    const basePath =
      appInfo?.directories?.images?.classified || "images/classified";
    const fullPath = `${basePath}/${folderName}`;
    window.electronAPI.openFolder(fullPath);
  };

  const getEnabledFeaturesCount = () => {
    return Object.values(settings).filter((value) => value === true).length;
  };

  const getProcessingSpeed = () => {
    const enabledCount = getEnabledFeaturesCount();
    if (enabledCount >= 6) return "بطيء (دقة عالية)";
    if (enabledCount >= 4) return "متوسط (متوازن)";
    return "سريع (أساسي)";
  };

  // بناء الواجهة
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(SettingsModal, {
      isOpen: isSettingsOpen,
      onClose: () => setIsSettingsOpen(false),
      settings: settings,
      setSettings: setSettings,
    }),

    React.createElement(
      "div",
      { className: "app-container" },

      // الشريط الجانبي
      React.createElement(
        "aside",
        { className: "sidebar" },
        React.createElement(
          "h1",
          null,
          React.createElement(RiBubbleChartLine),
          " Knoux PRO",
        ),
        React.createElement("p", null, "منظم الصور الذكي بالذكاء الاصطناعي"),

        React.createElement(
          "button",
          {
            className: "main-button",
            onClick: handleOrganize,
            disabled: isLoading,
          },
          isLoading
            ? React.createElement(
                React.Fragment,
                null,
                "⏳ جاري العمل...",
                React.createElement("span", { className: "loading-spinner" }),
              )
            : React.createElement(
                React.Fragment,
                null,
                React.createElement(RiRocketLine),
                " نظّم الآن",
              ),
        ),

        React.createElement(
          "div",
          { className: "instruction-text" },
          "📁 ضع صورك في مجلد ",
          React.createElement("strong", null, "images/raw"),
          " أولاً، ثم اضغط على زر التنظيم.",
        ),

        // معلومات الإعدادات
        React.createElement(
          "div",
          {
            style: {
              background: "rgba(0, 188, 212, 0.1)",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "20px",
              border: "1px solid rgba(0, 188, 212, 0.3)",
            },
          },
          React.createElement(
            "div",
            { style: { fontSize: "0.9rem", color: "#b0b0b0" } },
            React.createElement(
              "strong",
              { style: { color: "#00bcd4" } },
              "الإعدادات الحالية:",
            ),
            React.createElement("br"),
            `✨ ميزات مفعلة: ${getEnabledFeaturesCount()}/6`,
            React.createElement("br"),
            `⚡ السرعة: ${getProcessingSpeed()}`,
            React.createElement("br"),
            `🎯 عتبة NSFW: ${Math.round(settings.nsfwThreshold * 100)}%`,
          ),
        ),

        React.createElement(
          "button",
          {
            className: "main-button settings-button",
            onClick: () => setIsSettingsOpen(true),
          },
          React.createElement(RiSettings3Line),
          " الإعدادات المتقدمة",
        ),
      ),

      // المحتوى الرئيسي
      React.createElement(
        "main",
        { className: "main-content" },

        // قسم النتائج
        stats &&
          React.createElement(
            "div",
            { className: "stats-section fade-in" },
            React.createElement(
              "h2",
              null,
              React.createElement(RiCpuLine),
              " النتائج النهائية",
            ),
            React.createElement(
              "div",
              { className: "stats-grid" },
              React.createElement(StatCard, {
                icon: React.createElement(RiTeamLine),
                value: stats.faces || 0,
                label: "الوجوه المكتشفة",
                folder: "selfies",
                onOpenFolder: openFolder,
              }),
              React.createElement(StatCard, {
                icon: React.createElement(RiShieldForbidLine),
                value: stats.nsfw || 0,
                label: "محتوى حساس",
                folder: "rejected",
                onOpenFolder: openFolder,
              }),
              React.createElement(StatCard, {
                icon: React.createElement(RiFileList3Line),
                value: stats.documents || 0,
                label: "وثائق",
                folder: "documents",
                onOpenFolder: openFolder,
              }),
              React.createElement(StatCard, {
                icon: React.createElement(RiPictureInPictureLine),
                value: stats.duplicates || 0,
                label: "صور مكررة",
                folder: "duplicates",
                onOpenFolder: openFolder,
              }),
              React.createElement(StatCard, {
                icon: React.createElement(RiFileEditLine),
                value: stats.moved || 0,
                label: "إجمالي المنقول",
              }),
              React.createElement(StatCard, {
                icon: React.createElement(RiImageLine),
                value: stats.total || 0,
                label: "إجمالي المعالج",
              }),
            ),
          ),

        // سجل التشغيل
        React.createElement(
          "div",
          { className: "progress-log" },
          React.createElement("h2", null, "📜 سجل العمليات المباشر"),
          React.createElement(
            "div",
            {
              id: "log-output",
              ref: logRef,
            },
            log,
          ),
        ),
      ),
    ),
  );
}

ReactDOM.render(React.createElement(App), document.getElementById("root"));
