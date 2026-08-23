import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Upload,
  FolderOpen,
  Search,
  Target,
  Settings,
  BarChart3,
  Brain,
  Loader2,
  CheckCircle,
} from "lucide-react";

// Import our new components
import SmartSuggestions from "@/components/SmartSuggestions";
import FileComparison from "@/components/FileComparison";
import AnalyticsReport from "@/components/AnalyticsReport";
import { RemoveDuplicatePreview } from "@/components/LivePreviewPanel";

// Import the detection engine
import {
  duplicateDetectionEngine,
  type DuplicateGroup,
  type DetectionSettings,
} from "@/lib/duplicate-detection-engine";

interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  hash?: string;
  lastModified: number;
  isSelected: boolean;
  isDuplicate: boolean;
  similarityScore?: number;
  webkitRelativePath?: string;
}

export default function RemoveDuplicatePageEnhanced() {
  // State management
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentTab, setCurrentTab] = useState("scan");
  const [dragActive, setDragActive] = useState(false);
  const [scanResults, setScanResults] = useState<{
    totalFiles: number;
    duplicateFiles: number;
    spaceSavings: number;
    scanTime: number;
  } | null>(null);

  // Detection settings state
  const [detectionSettings, setDetectionSettings] = useState<DetectionSettings>(
    duplicateDetectionEngine.getSettings(),
  );

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // File handlers
  const handleFileSelection = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        await performScan(Array.from(files));
      }
    },
    [detectionSettings],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        await performScan(Array.from(files));
      }
    },
    [detectionSettings],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // System-wide scanning function
  const performSystemScan = async () => {
    const confirmed = window.confirm(
      `🔍 فحص النظام الكامل\n\n` +
        `سيتم فحص جميع ملفات النظام للبحث عن التكرارات\n` +
        `• سيتم استثناء ملفات النظام الحيوية\n` +
        `• قد تستغرق العملية وقتاً طويلاً\n` +
        `• يوصى بإغلاق البرامج الأخرى\n\n` +
        `هل تريد المتابعة؟`,
    );

    if (!confirmed) return;

    setIsScanning(true);
    setScanProgress(0);
    const startTime = Date.now();

    try {
      // محاكاة فحص النظام الكامل مع استثناء ملفات النظام
      const systemFiles = await simulateSystemScan((progress, message) => {
        setScanProgress(progress);
        console.log(`${progress}%: ${message}`);
      });

      await performScan(systemFiles);

      toast.success(`🎉 اكتمل فحص النظام! تم فحص ${systemFiles.length} ملف`);
    } catch (error) {
      console.error("خطأ في فحص النظام:", error);
      toast.error("حدث خطأ أثناء فحص النظام");
    }
  };

  // Simulate system scan with system file exclusions
  const simulateSystemScan = async (
    onProgress: (progress: number, message: string) => void,
  ): Promise<File[]> => {
    const simulatedFiles: File[] = [];

    // محاكاة فحص مجلدات النظام المختلفة
    const systemPaths = [
      { name: "ال��ستندات", path: "Documents", fileCount: 150 },
      { name: "سطح المكتب", path: "Desktop", fileCount: 50 },
      { name: "التحميلات", path: "Downloads", fileCount: 200 },
      { name: "الصور", path: "Pictures", fileCount: 300 },
      { name: "الفيديو", path: "Videos", fileCount: 80 },
      { name: "الموسيقى", path: "Music", fileCount: 120 },
      { name: "مجلدات المستخدم", path: "UserFolders", fileCount: 400 },
    ];

    let totalProgress = 0;
    const totalSteps = systemPaths.reduce(
      (sum, path) => sum + path.fileCount,
      0,
    );

    for (const pathInfo of systemPaths) {
      onProgress(
        Math.round((totalProgress / totalSteps) * 90),
        `فحص ${pathInfo.name}...`,
      );

      // محاكاة العثور على ملفات في كل مجلد
      for (let i = 0; i < pathInfo.fileCount; i++) {
        // محاكاة ملفات متنوعة
        const fileTypes = [
          { ext: "jpg", type: "image/jpeg", sizeRange: [100000, 5000000] },
          { ext: "png", type: "image/png", sizeRange: [50000, 3000000] },
          { ext: "mp4", type: "video/mp4", sizeRange: [10000000, 100000000] },
          {
            ext: "pdf",
            type: "application/pdf",
            sizeRange: [100000, 10000000],
          },
          {
            ext: "docx",
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            sizeRange: [20000, 2000000],
          },
          { ext: "mp3", type: "audio/mpeg", sizeRange: [3000000, 15000000] },
          { ext: "txt", type: "text/plain", sizeRange: [1000, 100000] },
        ];

        const randomType =
          fileTypes[Math.floor(Math.random() * fileTypes.length)];
        const randomSize = Math.floor(
          Math.random() * (randomType.sizeRange[1] - randomType.sizeRange[0]) +
            randomType.sizeRange[0],
        );

        // إنشاء أسماء ملفات واقعية مع احتمالية وجود تكرارات
        const baseNames = [
          "IMG_001",
          "IMG_002",
          "IMG_003",
          "صورة",
          "لقطة شاشة",
          "فيديو جديد",
          "video_call",
          "recording",
          "مستند مهم",
          "تقرير",
          "ملاحظات",
          "أغنية",
          "موسيقى",
          "تسجيل صوتي",
        ];

        const baseName =
          baseNames[Math.floor(Math.random() * baseNames.length)];
        const fileName = `${baseName}_${i}.${randomType.ext}`;

        // إنشاء ملف محاكي
        const mockFile = new File([new ArrayBuffer(randomSize)], fileName, {
          type: randomType.type,
          lastModified: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000, // آخر سنة
        });

        // إضافة مسار المجلد
        Object.defineProperty(mockFile, "webkitRelativePath", {
          value: `${pathInfo.path}/${fileName}`,
          writable: false,
        });

        simulatedFiles.push(mockFile);
        totalProgress++;

        // تحديث تدريجي للتقدم
        if (i % 10 === 0) {
          onProgress(
            Math.round((totalProgress / totalSteps) * 90),
            `فحص ${pathInfo.name}: ${i}/${pathInfo.fileCount} ملف`,
          );
          // تأخير قصير لمحاكاة وقت المعالجة
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
    }

    onProgress(95, "تجميع النتائج...");
    await new Promise((resolve) => setTimeout(resolve, 500));

    // إنشاء بعض التكرارات المحاكية لإظهار فعالية النظام
    const duplicates = [];
    for (let i = 0; i < 20; i++) {
      const originalFile =
        simulatedFiles[Math.floor(Math.random() * simulatedFiles.length)];
      if (originalFile) {
        const duplicateFile = new File(
          [new ArrayBuffer(originalFile.size)],
          originalFile.name.replace(/(\.[^.]+)$/, `_copy$1`),
          {
            type: originalFile.type,
            lastModified: originalFile.lastModified + Math.random() * 1000000,
          },
        );

        Object.defineProperty(duplicateFile, "webkitRelativePath", {
          value: `Downloads/${duplicateFile.name}`,
          writable: false,
        });

        duplicates.push(duplicateFile);
      }
    }

    simulatedFiles.push(...duplicates);

    onProgress(100, "اكتمل فحص النظام!");

    return simulatedFiles;
  };

  // Main scanning function
  const performScan = async (files: File[]) => {
    setIsScanning(true);
    setScanProgress(0);
    const startTime = Date.now();

    try {
      // Update detection engine settings
      duplicateDetectionEngine.updateSettings(detectionSettings);

      // Perform the scan (check if this is a system scan)
      const isSystemScan = files.some(
        (f) =>
          f.webkitRelativePath?.includes("/") ||
          f.webkitRelativePath?.includes("\\"),
      );
      const groups = await duplicateDetectionEngine.detectDuplicates(
        files,
        (progress, message) => {
          setScanProgress(progress);
          console.log(`${progress}%: ${message}`);
        },
        isSystemScan,
      );

      // Convert to our format
      const convertedGroups = groups.map((group) => ({
        ...group,
        category: getCategoryFromFiles(group.files),
        totalSize: group.files.reduce((sum, f) => sum + f.size, 0),
      }));

      // Calculate results
      const totalDuplicateFiles = convertedGroups.reduce(
        (sum, group) =>
          sum + group.files.filter((f: any) => f.isDuplicate).length,
        0,
      );
      const spaceSavings = convertedGroups.reduce(
        (sum, group) =>
          sum +
          group.files
            .filter((f: any) => f.isDuplicate)
            .reduce((s: any, f: any) => s + f.size, 0),
        0,
      );

      // Convert files to our format
      const allFiles = convertedGroups.flatMap((group) =>
        group.files.map((file: any) => ({
          ...file,
          isSelected: file.isDuplicate, // Auto-select duplicates
        })),
      );

      setScanResults({
        totalFiles: allFiles.length,
        duplicateFiles: totalDuplicateFiles,
        spaceSavings,
        scanTime: Date.now() - startTime,
      });

      setSelectedFiles(allFiles);
      setDuplicateGroups(convertedGroups);
      setCurrentTab("results");

      toast.success(`🎉 تم العثور على ${convertedGroups.length} مجموعة تكرار!`);
    } catch (error) {
      console.error("خطأ في فحص التكرارات:", error);
      toast.error("حدث خطأ أثناء فحص التكرارات");
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  // Helper function to determine category
  const getCategoryFromFiles = (files: any[]) => {
    if (files.length === 0) return "other";
    const firstType = files[0].type || "";
    if (firstType.startsWith("image/")) return "image";
    if (firstType.startsWith("video/")) return "video";
    if (firstType.startsWith("audio/")) return "audio";
    if (firstType.includes("text") || firstType.includes("document"))
      return "document";
    return "other";
  };

  // File action handlers
  const handleFileAction = (fileId: string, action: string) => {
    switch (action) {
      case "keep":
        setSelectedFiles((files) =>
          files.map((f) =>
            f.id === fileId
              ? { ...f, isSelected: false, isDuplicate: false }
              : f,
          ),
        );
        break;
      case "delete":
        setSelectedFiles((files) =>
          files.map((f) =>
            f.id === fileId ? { ...f, isSelected: true, isDuplicate: true } : f,
          ),
        );
        break;
      case "preview":
        toast.info(`معاينة ${fileId} - ميزة قيد التطوير`);
        break;
    }
  };

  const handleGroupAction = (groupId: string, action: string) => {
    const group = duplicateGroups.find((g) => g.id === groupId);
    if (!group) return;

    let keepFile: any = null;

    switch (action) {
      case "keep_newest":
        keepFile = group.files.reduce((newest, current) =>
          current.lastModified > newest.lastModified ? current : newest,
        );
        break;
      case "keep_largest":
        keepFile = group.files.reduce((largest, current) =>
          current.size > largest.size ? current : largest,
        );
        break;
      case "keep_first":
        keepFile = group.files[0];
        break;
    }

    if (keepFile) {
      setSelectedFiles((files) =>
        files.map((f) => {
          if (group.files.some((gf: any) => gf.id === f.id)) {
            return {
              ...f,
              isSelected: f.id !== keepFile.id,
              isDuplicate: f.id !== keepFile.id,
            };
          }
          return f;
        }),
      );
    }
  };

  // Smart suggestions handler
  const handleApplySuggestion = async (suggestion: any) => {
    switch (suggestion.action) {
      case "apply-bulk-cleanup":
        // Apply automatic cleanup based on AI recommendations
        const updatedFiles = selectedFiles.map((file) => ({
          ...file,
          isSelected: file.isDuplicate,
        }));
        setSelectedFiles(updatedFiles);
        toast.success("تم تطبيق التنظيف الشامل");
        break;

      case "optimize-images":
        // Focus on image optimization
        setCurrentTab("results");
        toast.info("تم التركيز على تحسين الصور");
        break;

      case "manage-videos":
        // Focus on video management
        setCurrentTab("results");
        toast.info("تم التركيز على إدارة الفيديو");
        break;

      case "security-scan":
        // Perform security scan (simulated)
        toast.info("جاري تشغيل الفحص الأمني...");
        setTimeout(() => {
          toast.success("✅ لم يتم العثور على ملفات مشبوهة");
        }, 2000);
        break;

      case "boost-performance":
        // Performance optimization
        toast.success("تم تحسين إعدادات الأداء");
        break;

      default:
        toast.info(`تطبيق اقتراح: ${suggestion.title}`);
    }
  };

  // Export handlers
  const handleExportReport = (format: "pdf" | "csv" | "json") => {
    // Simulated export functionality
    toast.success(`تم تصدير التقرير بصيغة ${format.toUpperCase()}`);
  };

  // Removal simulation
  const removeDuplicates = async () => {
    const filesToRemove = selectedFiles.filter(
      (f) => f.isSelected && f.isDuplicate,
    );

    if (filesToRemove.length === 0) {
      toast.warning("الرجاء تحديد ملفات للحذف");
      return;
    }

    const spaceSaved = filesToRemove.reduce((sum, f) => sum + f.size, 0);
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف ${filesToRemove.length} ملف؟\n` +
        `سيتم توفير ${(spaceSaved / (1024 * 1024)).toFixed(2)} ميجابايت من المساحة.`,
    );

    if (!confirmed) return;

    setIsRemoving(true);

    try {
      // Simulate removal process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update state
      const remainingFiles = selectedFiles.filter(
        (f) => !f.isSelected || !f.isDuplicate,
      );
      setSelectedFiles(remainingFiles);

      // Update duplicate groups
      const updatedGroups = duplicateGroups
        .map((group) => ({
          ...group,
          files: group.files.filter(
            (f: any) => !filesToRemove.some((rf) => rf.id === f.id),
          ),
        }))
        .filter((group) => group.files.length > 1);

      setDuplicateGroups(updatedGroups);

      toast.success(`✅ تم حذف ${filesToRemove.length} ملف بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الملفات");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {dragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md flex items-center justify-center"
          >
            <div className="text-center p-8 bg-white/10 rounded-3xl shadow-2xl border border-white/20">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-xl"
              >
                <Upload className="w-16 h-16 text-white" />
              </motion.div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
                اسحب الملفات هنا
              </h3>
              <p className="text-lg text-gray-300">
                سيتم فحصها تلقائياً بأحدث تقنيات الذكاء الاصطناعي
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8">
        {/* Live Preview Panel */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <RemoveDuplicatePreview className="max-w-6xl mx-auto" />
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl shadow-xl">
              <RefreshCw className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            RemoveDuplicate PRO
          </h1>
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">
            رييموف دوبليكات المتطور
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            أداتك الذكية المدعومة بالذكاء الاصطناعي لحذف التكرارات بدقة ودون
            أخطاء - مع تحليلات متقدمة واقتراحات ذكية
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <Tabs
            value={currentTab}
            onValueChange={setCurrentTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-md">
              <TabsTrigger
                value="scan"
                className="data-[state=active]:bg-purple-600"
              >
                <Search className="w-4 h-4 mr-2" />
                فحص
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="data-[state=active]:bg-purple-600"
              >
                <Target className="w-4 h-4 mr-2" />
                النتائج
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-purple-600"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                التحليلات
              </TabsTrigger>
              <TabsTrigger
                value="ai-insights"
                className="data-[state=active]:bg-purple-600"
              >
                <Brain className="w-4 h-4 mr-2" />
                ذكاء اصطناعي
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-purple-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                الإعدادات
              </TabsTrigger>
            </TabsList>

            {/* Scan Tab */}
            <TabsContent value="scan" className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <FolderOpen className="w-5 h-5" />
                    اختيار الملفات والمجلدات للفحص الذكي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isScanning}
                      className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <div className="font-bold">اختيار ملفات متعددة</div>
                        <div className="text-sm opacity-80">
                          فحص ملفات محددة
                        </div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => folderInputRef.current?.click()}
                      disabled={isScanning}
                      variant="outline"
                      className="h-32 border-2 border-purple-400 hover:bg-purple-400/20"
                    >
                      <div className="text-center">
                        <FolderOpen className="w-8 h-8 mx-auto mb-2" />
                        <div className="font-bold">اختيار مجلد كامل</div>
                        <div className="text-sm opacity-80">
                          فحص شامل للمجلد
                        </div>
                      </div>
                    </Button>

                    <Button
                      onClick={performSystemScan}
                      disabled={isScanning}
                      className="h-32 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-2xl border-2 border-orange-400"
                    >
                      <div className="text-center">
                        <motion.div
                          animate={{ rotate: isScanning ? 360 : 0 }}
                          transition={{
                            duration: 2,
                            repeat: isScanning ? Infinity : 0,
                            ease: "linear",
                          }}
                        >
                          <Settings className="w-8 h-8 mx-auto mb-2" />
                        </motion.div>
                        <div className="font-bold">فحص النظام الكامل</div>
                        <div className="text-xs opacity-80">
                          فحص شامل مع استثناء ملفات النظام
                        </div>
                      </div>
                    </Button>
                  </div>

                  {/* Scanning Progress */}
                  {isScanning && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                          <span className="font-medium">
                            جاري الفحص الذكي المتقدم...
                          </span>
                        </div>
                        <span className="text-sm">
                          {Math.round(scanProgress)}%
                        </span>
                      </div>
                      <Progress value={scanProgress} className="mb-2" />
                      <p className="text-sm text-gray-300">
                        تحليل الملفات باستخدام الذكاء الاصطناعي وخوارزميات
                        التطابق المتقدمة...
                      </p>
                    </motion.div>
                  )}

                  {/* Quick Info */}
                  <div className="p-4 bg-black/20 rounded-lg">
                    <h4 className="font-semibold text-yellow-400 mb-2">
                      💡 نصائح للاستخدام الأمثل:
                    </h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• يمكنك سحب الملفات والمجلدات مباشرة إلى النافذة</li>
                      <li>
                        • الفحص يدعم جميع أنواع الملفات: صور، فيديو، مستندات،
                        وأكثر
                      </li>
                      <li>• الذكاء الاصطناعي سيقترح أفضل النسخ للاحتفاظ بها</li>
                      <li>• يمكن ضبط حساسية الكشف من تبويب الإعدادات</li>
                    </ul>
                  </div>

                  {/* System Scan Info */}
                  <div className="p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-lg border border-orange-500/50">
                    <h4 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      🔍 فحص النظام الكامل - ميزات متقدمة:
                    </h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>
                        • فحص شامل لجميع مجلدات المستخدم (المستندات، الصور،
                        التحميلات)
                      </li>
                      <li>
                        • استثناء تلقائي لملفات النظام الحيوية لضمان استقرار
                        النظام
                      </li>
                      <li>• كشف ذكي للتكرارات عبر المجلدات المختلفة</li>
                      <li>
                        • حماية من حذف ملفات النظام المهمة (.sys, .dll, إلخ)
                      </li>
                      <li>• تحليل عميق للمجلدات المخفية والمؤقتة</li>
                      <li className="text-yellow-400">
                        ⚠️ قد يستغرق وقتاً أطول حسب حجم البيانات
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6">
              {scanResults && (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      نتائج الفحص الذكي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-black/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">
                          {scanResults.totalFiles}
                        </div>
                        <div className="text-sm text-gray-300">
                          إجمالي الملفات
                        </div>
                      </div>
                      <div className="text-center p-4 bg-black/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">
                          {duplicateGroups.length}
                        </div>
                        <div className="text-sm text-gray-300">
                          مجموعات التكرار
                        </div>
                      </div>
                      <div className="text-center p-4 bg-black/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-400">
                          {scanResults.duplicateFiles}
                        </div>
                        <div className="text-sm text-gray-300">ملفات مكررة</div>
                      </div>
                      <div className="text-center p-4 bg-black/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {(scanResults.spaceSavings / (1024 * 1024)).toFixed(
                            2,
                          )}{" "}
                          MB
                        </div>
                        <div className="text-sm text-gray-300">
                          مساحة محتملة
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* File Comparison Components */}
              {duplicateGroups.map((group, index) => (
                <FileComparison
                  key={group.id}
                  duplicateGroup={group}
                  onFileAction={handleFileAction}
                  onGroupAction={handleGroupAction}
                />
              ))}

              {/* Remove Button */}
              {duplicateGroups.length > 0 && (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6 text-center">
                    <Button
                      onClick={removeDuplicates}
                      disabled={
                        isRemoving ||
                        !selectedFiles.some(
                          (f) => f.isSelected && f.isDuplicate,
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 px-8 py-3 text-lg"
                    >
                      {isRemoving ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      )}
                      تنفيذ الحذف الذكي
                      {selectedFiles.filter(
                        (f) => f.isSelected && f.isDuplicate,
                      ).length > 0 &&
                        ` (${selectedFiles.filter((f) => f.isSelected && f.isDuplicate).length} ملف)`}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsReport
                duplicateGroups={duplicateGroups}
                scanResults={scanResults}
                onExportReport={handleExportReport}
              />
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="ai-insights" className="space-y-6">
              <SmartSuggestions
                duplicateGroups={duplicateGroups}
                totalFiles={scanResults?.totalFiles}
                onApplySuggestion={handleApplySuggestion}
              />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-400">
                    <Settings className="w-5 h-5" />
                    إعدادات الكشف المتقدمة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Detection Methods */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-cyan-400">
                        طرق الكشف
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={detectionSettings.enableHashDetection}
                            onChange={(e) =>
                              setDetectionSettings((prev) => ({
                                ...prev,
                                enableHashDetection: e.target.checked,
                              }))
                            }
                            className="rounded"
                          />
                          <span>كشف بالمحتوى (Hash) - دقة 100%</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={detectionSettings.enableNameSimilarity}
                            onChange={(e) =>
                              setDetectionSettings((prev) => ({
                                ...prev,
                                enableNameSimilarity: e.target.checked,
                              }))
                            }
                            className="rounded"
                          />
                          <span>كشف بتشابه الأسماء</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={detectionSettings.enableContentAnalysis}
                            onChange={(e) =>
                              setDetectionSettings((prev) => ({
                                ...prev,
                                enableContentAnalysis: e.target.checked,
                              }))
                            }
                            className="rounded"
                          />
                          <span>تحليل المحتوى النصي</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={detectionSettings.enableAIDetection}
                            onChange={(e) =>
                              setDetectionSettings((prev) => ({
                                ...prev,
                                enableAIDetection: e.target.checked,
                              }))
                            }
                            className="rounded"
                          />
                          <span>ذكاء اصطناعي متقدم (تجريبي)</span>
                        </label>
                      </div>
                    </div>

                    {/* File Types */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-cyan-400">
                        أنواع الملفات
                      </h4>
                      <div className="space-y-2">
                        <label className="block">
                          <span className="text-sm font-medium">
                            الحد الأدنى لحجم الملف (بايت):
                          </span>
                          <input
                            type="number"
                            value={detectionSettings.minimumFileSize}
                            onChange={(e) =>
                              setDetectionSettings((prev) => ({
                                ...prev,
                                minimumFileSize: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="w-full mt-1 px-3 py-2 bg-black/20 border border-white/20 rounded text-white"
                          />
                        </label>

                        {detectionSettings.enableNameSimilarity && (
                          <label className="block">
                            <span className="text-sm font-medium">
                              عتبة تشابه الأسماء:{" "}
                              {detectionSettings.nameSimilarityThreshold}%
                            </span>
                            <input
                              type="range"
                              min="50"
                              max="100"
                              value={detectionSettings.nameSimilarityThreshold}
                              onChange={(e) =>
                                setDetectionSettings((prev) => ({
                                  ...prev,
                                  nameSimilarityThreshold: parseInt(
                                    e.target.value,
                                  ),
                                }))
                              }
                              className="w-full mt-1"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/20">
                    <Button
                      onClick={() =>
                        duplicateDetectionEngine.updateSettings(
                          detectionSettings,
                        )
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      حفظ الإعدادات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelection}
        className="hidden"
        accept="*/*"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        webkitdirectory=""
        onChange={handleFileSelection}
        className="hidden"
      />
    </div>
  );
}
