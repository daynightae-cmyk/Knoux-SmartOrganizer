import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useImageOrganizer } from "@/hooks/use-image-organizer";
import { aiEngine } from "@/lib/ai-engine";
import type { ImageFile } from "@/types/organizer";
import {
  Brain,
  Upload,
  FolderOpen,
  Cpu,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Play,
  Pause,
  RotateCcw,
  Grid3X3,
  List,
  Eye,
  Star,
  Heart,
  Trash2,
  Download,
  Search,
  Filter,
  Settings,
  BarChart3,
  FileImage,
  Clock,
  TrendingUp,
  Activity,
  Users,
  FileText,
  Palette,
  Layers,
  MousePointer,
  ArrowUp,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  duration?: number;
  details?: string;
}

interface RealTimeProgress {
  currentStep: ProcessingStep;
  allSteps: ProcessingStep[];
  overallProgress: number;
  isProcessing: boolean;
  startTime: Date | null;
  estimatedCompletion: Date | null;
  processingSpeed: number; // files per second
  currentFile: string;
  filesProcessed: number;
  totalFiles: number;
}

export default function ModernApp() {
  const {
    images,
    progress,
    stats,
    filters,
    organizeOptions,
    suggestions,
    isProcessing,
    addImages,
    processImages,
    stopProcessing,
    removeImage,
    clearAll,
    setFilters,
    setOrganizeOptions,
    categoryStats,
    exportResults,
    processedCount,
    unprocessedCount,
  } = useImageOrganizer();

  // حالات متقدمة للتطبيق
  const [realTimeProgress, setRealTimeProgress] = useState<RealTimeProgress>({
    currentStep: {
      id: "idle",
      name: "جاهز للبدء",
      description: "ارفع الصور أو اختر مجلداً للبدء",
      status: "pending",
      progress: 0,
    },
    allSteps: [],
    overallProgress: 0,
    isProcessing: false,
    startTime: null,
    estimatedCompletion: null,
    processingSpeed: 0,
    currentFile: "",
    filesProcessed: 0,
    totalFiles: 0,
  });

  const [dragActive, setDragActive] = useState(false);
  const [uploadMode, setUploadMode] = useState<"files" | "folder" | "url">(
    "files",
  );
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoProcess, setAutoProcess] = useState(true);
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [smartSuggestions, setSmartSuggestions] = useState(true);
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState<any[]>([]);

  // المراجع للعناصر
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // دالة إضافة إشعار محسنة
  const addNotification = useCallback(
    (
      type: "success" | "error" | "info" | "warning",
      title: string,
      description?: string,
    ) => {
      const id = Date.now().toString();
      const notification = {
        id,
        type,
        title,
        description,
        timestamp: new Date(),
      };
      setNotifications((prev) => [...prev, notification]);

      // إزالة تلقائية بعد 5 ثوان
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);

      // Toast مطابق
      if (type === "success") toast.success(title);
      else if (type === "error") toast.error(title);
      else if (type === "warning") toast.warning(title);
      else toast.info(title);
    },
    [],
  );

  // خطوات المعالجة المحددة مسبقاً
  const initializeProcessingSteps = useCallback((fileCount: number) => {
    const steps: ProcessingStep[] = [
      {
        id: "upload",
        name: "رفع الملفات",
        description: `رفع ${fileCount} ملف`,
        status: "completed",
        progress: 100,
      },
      {
        id: "validation",
        name: "فحص الملفات",
        description: "التحقق من صحة وصيغة الملفات",
        status: "pending",
        progress: 0,
      },
      {
        id: "ai-analysis",
        name: "تحليل الذكاء الاصطناعي",
        description: "تحليل المحتوى ووصف الصور",
        status: "pending",
        progress: 0,
      },
      {
        id: "face-detection",
        name: "كشف الوجوه",
        description: "تحديد الوجوه والأعمار",
        status: "pending",
        progress: 0,
      },
      {
        id: "ocr-extraction",
        name: "استخراج النصوص",
        description: "قراءة النصوص من الصور",
        status: "pending",
        progress: 0,
      },
      {
        id: "categorization",
        name: "التصنيف الذكي",
        description: "تصنيف الصور حسب المحتوى",
        status: "pending",
        progress: 0,
      },
      {
        id: "duplicate-detection",
        name: "كشف المكررات",
        description: "البحث عن الصور المتشابهة",
        status: "pending",
        progress: 0,
      },
      {
        id: "organization",
        name: "التنظيم النهائي",
        description: "ترتيب وتنظيم النتائج",
        status: "pending",
        progress: 0,
      },
    ];

    setRealTimeProgress((prev) => ({
      ...prev,
      allSteps: steps,
      totalFiles: fileCount,
      currentStep: steps[1], // البدء من فحص الملفات
    }));
  }, []);

  // تحديث خطوة المعالجة
  const updateProcessingStep = useCallback(
    (stepId: string, updates: Partial<ProcessingStep>) => {
      setRealTimeProgress((prev) => {
        const updatedSteps = prev.allSteps.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step,
        );

        const currentStepIndex = updatedSteps.findIndex(
          (step) => step.id === stepId,
        );
        const currentStep = updatedSteps[currentStepIndex];

        // حساب التقدم الإجمالي
        const totalProgress = updatedSteps.reduce(
          (sum, step) => sum + step.progress,
          0,
        );
        const overallProgress = totalProgress / updatedSteps.length;

        return {
          ...prev,
          allSteps: updatedSteps,
          currentStep,
          overallProgress,
        };
      });
    },
    [],
  );

  // رفع الملفات المتقدم
  const handleAdvancedFileUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const imageFiles = fileArray.filter((file) =>
        file.type.startsWith("image/"),
      );

      if (imageFiles.length === 0) {
        addNotification(
          "warning",
          "لا توجد ملفات صور",
          "يرجى اختيار ملفات صور صحيحة",
        );
        return;
      }

      addNotification(
        "info",
        "بدء رفع الملفات",
        `جاري رفع ${imageFiles.length} ملف`,
      );

      // تحديث حالة التقدم
      setRealTimeProgress((prev) => ({
        ...prev,
        isProcessing: true,
        startTime: new Date(),
        filesProcessed: 0,
        totalFiles: imageFiles.length,
        currentFile: imageFiles[0]?.name || "",
      }));

      // تهيئة خطوات المعالجة
      initializeProcessingSteps(imageFiles.length);

      try {
        // رفع الملفات مع تحديث التقدم
        await addImages(imageFiles);

        addNotification(
          "success",
          "تم رفع الملفات بنجاح",
          `تم رفع ${imageFiles.length} ملف`,
        );

        // بدء المعالجة التلقائية إذا كانت مفعلة
        if (autoProcess) {
          setTimeout(() => handleAdvancedProcessing(), 1000);
        }

        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch (error) {
        addNotification(
          "error",
          "فشل في رفع الملفات",
          "حدث خطأ أثناء رفع الملفات",
        );
      }
    },
    [addImages, addNotification, autoProcess, initializeProcessingSteps],
  );

  // معالجة متقدمة مع تحديث الخطوات
  const handleAdvancedProcessing = useCallback(async () => {
    if (images.length === 0) {
      addNotification("warning", "لا توجد صور للمعالجة", "يرجى رفع صور أولاً");
      return;
    }

    setRealTimeProgress((prev) => ({
      ...prev,
      isProcessing: true,
      startTime: new Date(),
    }));

    const startTime = Date.now();

    try {
      // خطوة فحص الملفات
      updateProcessingStep("validation", {
        status: "processing",
        description: `فحص ${images.length} ملف...`,
      });

      await simulateStep(1000); // محاكاة الفحص

      updateProcessingStep("validation", {
        status: "completed",
        progress: 100,
        duration: 1,
      });

      // خطوة تحليل الذكاء الاصطناعي
      updateProcessingStep("ai-analysis", {
        status: "processing",
        description: "تحليل المحتوى والوصف...",
      });

      // معالجة كل صورة مع تحديث التقدم
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        setRealTimeProgress((prev) => ({
          ...prev,
          currentFile: image.name,
          filesProcessed: i + 1,
        }));

        updateProcessingStep("ai-analysis", {
          progress: ((i + 1) / images.length) * 100,
          details: `معالجة ${image.name}`,
        });

        await simulateStep(200); // محاكاة معالجة كل صورة
      }

      updateProcessingStep("ai-analysis", {
        status: "completed",
        progress: 100,
      });

      // خطوة كشف الوجوه
      updateProcessingStep("face-detection", {
        status: "processing",
        description: "تحديد الوجوه والأعمار...",
      });

      await simulateProgressiveStep("face-detection", 2000);

      // خطوة استخراج النصوص
      updateProcessingStep("ocr-extraction", {
        status: "processing",
        description: "قراءة النصوص من الصور...",
      });

      await simulateProgressiveStep("ocr-extraction", 1500);

      // خطوة التصنيف
      updateProcessingStep("categorization", {
        status: "processing",
        description: "تصنيف الصور ذكياً...",
      });

      await simulateProgressiveStep("categorization", 1000);

      // خطوة كشف المكررات
      updateProcessingStep("duplicate-detection", {
        status: "processing",
        description: "البحث عن الصور المتشابهة...",
      });

      await simulateProgressiveStep("duplicate-detection", 800);

      // خطوة التنظيم النهائي
      updateProcessingStep("organization", {
        status: "processing",
        description: "ترتيب وتنظيم النتائج...",
      });

      await simulateProgressiveStep("organization", 500);

      // المعالجة الفعلية
      await processImages();

      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;

      setRealTimeProgress((prev) => ({
        ...prev,
        isProcessing: false,
        overallProgress: 100,
        currentStep: {
          id: "completed",
          name: "اكتملت المعالجة",
          description: `تم تحليل ${images.length} صورة في ${totalTime.toFixed(1)} ثانية`,
          status: "completed",
          progress: 100,
        },
      }));

      addNotification(
        "success",
        "اكتملت المعالجة بنجاح",
        `تم تحليل ${images.length} صورة في ${totalTime.toFixed(1)} ثانية`,
      );

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (error) {
      setRealTimeProgress((prev) => ({
        ...prev,
        isProcessing: false,
      }));

      addNotification("error", "فشل في المعالجة", "حدث خطأ أثناء معالجة الصور");
    }
  }, [images, processImages, addNotification, updateProcessingStep]);

  // دوال مساعدة للمحاكاة
  const simulateStep = (duration: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, duration));
  };

  const simulateProgressiveStep = async (
    stepId: string,
    totalDuration: number,
  ): Promise<void> => {
    const steps = 20;
    const stepDuration = totalDuration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = (i / steps) * 100;
      updateProcessingStep(stepId, { progress });
      await simulateStep(stepDuration);
    }

    updateProcessingStep(stepId, { status: "completed", progress: 100 });
  };

  // drag and drop متقدم
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleAdvancedFileUpload(e.dataTransfer.files);
      }
    },
    [handleAdvancedFileUpload],
  );

  // اختيار مجلد باستخدام webkitdirectory
  const handleFolderSelect = useCallback(() => {
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  }, []);

  const handleFolderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleAdvancedFileUpload(e.target.files);
      }
    },
    [handleAdvancedFileUpload],
  );

  // اختيار ملفات عادية
  const handleFileSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleAdvancedFileUpload(e.target.files);
      }
    },
    [handleAdvancedFileUpload],
  );

  // إيقاف المعالجة
  const handleStopProcessing = useCallback(() => {
    stopProcessing();
    setRealTimeProgress((prev) => ({
      ...prev,
      isProcessing: false,
      currentStep: {
        id: "stopped",
        name: "تم إيقاف المعالجة",
        description: "تم إيقاف العملية بواسطة المستخدم",
        status: "error",
        progress: prev.overallProgress,
      },
    }));

    addNotification("info", "��م إيقاف المعالجة", "تم إيقاف العملية بنجاح");
  }, [stopProcessing, addNotification]);

  // فلترة الصور
  const filteredImages = images.filter((img) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        img.name.toLowerCase().includes(query) ||
        img.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        img.analysis?.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // ترتيب الصور
  const sortedImages = [...filteredImages].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "size":
        return b.size - a.size;
      case "confidence":
        return (b.analysis?.confidence || 0) - (a.analysis?.confidence || 0);
      case "date":
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-300",
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 text-white"
          : "bg-gradient-to-br from-blue-50 via-white to-purple-50",
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* overlay للـ drag and drop */}
      {dragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-24 h-24 mx-auto bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-blue-600 mb-2">
              اسحب الملفات هنا
            </h3>
            <p className="text-blue-500">سيتم رفع ومعالجة الصور تلقائياً</p>
          </div>
        </motion.div>
      )}

      {/* شريط الإشعارات */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -100, x: "100%" }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 max-w-sm"
          >
            <div className="flex items-start space-x-3">
              {notification.type === "success" && (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              )}
              {notification.type === "error" && (
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
              {notification.type === "warning" && (
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
              )}
              {notification.type === "info" && (
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-sm">{notification.title}</h4>
                {notification.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {notification.description}
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  setNotifications((prev) =>
                    prev.filter((n) => n.id !== notification.id),
                  )
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* الرأس */}
      <header className="border-b border-gray-200 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Knoux SmartOrganizer PRO
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  منظم الصور الذكي المتطور
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* حالة المعالجة */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {realTimeProgress.isProcessing ? (
                  <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span className="text-xs">
                  {realTimeProgress.isProcessing
                    ? `معالجة... ${Math.round(realTimeProgress.overallProgress)}%`
                    : "جاهز"}
                </span>
              </div>

              {/* تبديل المظهر */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? "🌙" : "☀️"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* الشريط الجانبي */}
          <div className="lg:col-span-3 space-y-6">
            {/* منطقة الرفع */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  رفع الصور
                </CardTitle>
                <CardDescription>اختر طريقة رفع الصور المناسبة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* أزرار الرفع */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleFileSelect}
                    variant="outline"
                    className="flex flex-col h-20 p-2"
                    disabled={realTimeProgress.isProcessing}
                  >
                    <FileImage className="w-6 h-6 mb-1" />
                    <span className="text-xs">ملفات</span>
                  </Button>

                  <Button
                    onClick={handleFolderSelect}
                    variant="outline"
                    className="flex flex-col h-20 p-2"
                    disabled={realTimeProgress.isProcessing}
                  >
                    <FolderOpen className="w-6 h-6 mb-1" />
                    <span className="text-xs">مجلد</span>
                  </Button>
                </div>

                {/* منطقة السحب والإفلات */}
                <div
                  ref={dragRef}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300",
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400",
                  )}
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    اسحب الملفات هنا أو انقر لاختيار
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    يدعم JPG, PNG, GIF, WEBP
                  </p>
                </div>

                {/* inputs مخفية */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  onChange={handleFolderChange}
                  className="hidden"
                />

                <Separator />

                {/* أزرار التحكم */}
                <div className="space-y-2">
                  {!realTimeProgress.isProcessing ? (
                    <Button
                      onClick={handleAdvancedProcessing}
                      disabled={images.length === 0}
                      className="w-full"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      بدء المعالجة المتقدمة
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopProcessing}
                      variant="destructive"
                      className="w-full"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      إيقاف المعالجة
                    </Button>
                  )}

                  <Button
                    onClick={clearAll}
                    variant="outline"
                    className="w-full"
                    disabled={
                      images.length === 0 || realTimeProgress.isProcessing
                    }
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    مسح الكل
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* الإعدادات السريعة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  إعدادات سريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={autoProcess}
                    onCheckedChange={setAutoProcess}
                  />
                  <Label>معالجة تلقائية</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={realTimeMode}
                    onCheckedChange={setRealTimeMode}
                  />
                  <Label>تحديث فوري</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={smartSuggestions}
                    onCheckedChange={setSmartSuggestions}
                  />
                  <Label>اقتراحات ذكية</Label>
                </div>

                <div>
                  <Label>طريقة العرض</Label>
                  <Select value={viewMode} onValueChange={setViewMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">شبكة</SelectItem>
                      <SelectItem value="list">قائمة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>ترتيب حسب</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">التاريخ</SelectItem>
                      <SelectItem value="name">الاسم</SelectItem>
                      <SelectItem value="size">الحجم</SelectItem>
                      <SelectItem value="confidence">دقة التحليل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* المنطقة الرئيسية */}
          <div className="lg:col-span-9 space-y-6">
            {/* شريط التقدم المتقدم */}
            {realTimeProgress.isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* التقدم الإجمالي */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">
                          {realTimeProgress.currentStep.name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {Math.round(realTimeProgress.overallProgress)}%
                        </span>
                      </div>
                      <Progress
                        value={realTimeProgress.overallProgress}
                        className="h-3 mb-2"
                      />
                      <p className="text-sm text-gray-600">
                        {realTimeProgress.currentStep.description}
                      </p>
                    </div>

                    {/* معلومات التقدم */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">الملف الحالي:</span>
                        <p className="font-medium truncate">
                          {realTimeProgress.currentFile || "لا يوجد"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">المعالج:</span>
                        <p className="font-medium">
                          {realTimeProgress.filesProcessed} /{" "}
                          {realTimeProgress.totalFiles}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">الوقت المتبقي:</span>
                        <p className="font-medium">
                          {realTimeProgress.estimatedCompletion
                            ? "~" +
                              Math.round(
                                (realTimeProgress.estimatedCompletion.getTime() -
                                  Date.now()) /
                                  1000,
                              ) +
                              "ث"
                            : "غير محدد"}
                        </p>
                      </div>
                    </div>

                    {/* خطوات التقدم */}
                    <div className="space-y-2">
                      {realTimeProgress.allSteps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-center space-x-3"
                        >
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                              step.status === "completed"
                                ? "bg-green-500 text-white"
                                : step.status === "processing"
                                  ? "bg-blue-500 text-white"
                                  : step.status === "error"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-300 text-gray-600",
                            )}
                          >
                            {step.status === "completed" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : step.status === "processing" ? (
                              <Zap className="w-3 h-3" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {step.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Math.round(step.progress)}%
                              </span>
                            </div>
                            {step.status === "processing" && (
                              <Progress
                                value={step.progress}
                                className="h-1 mt-1"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* الإحصائيات */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <FileImage className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{images.length}</p>
                      <p className="text-xs text-gray-500">إجمالي الصور</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{processedCount}</p>
                      <p className="text-xs text-gray-500">معالج</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Target className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {images.length > 0
                          ? Math.round(
                              (images.reduce(
                                (sum, img) =>
                                  sum + (img.analysis?.confidence || 0),
                                0,
                              ) /
                                images.length) *
                                100,
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-xs text-gray-500">دقة التحليل</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {realTimeProgress.startTime
                          ? Math.round(
                              (Date.now() -
                                realTimeProgress.startTime.getTime()) /
                                1000,
                            )
                          : 0}
                        s
                      </p>
                      <p className="text-xs text-gray-500">وقت المعالجة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* شريط البحث والفلاتر */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="البحث في الصور والعلامات والأوصاف..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* عرض الصور */}
            {sortedImages.length > 0 ? (
              <div
                className={cn(
                  "grid gap-4",
                  viewMode === "grid"
                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                    : "grid-cols-1",
                )}
              >
                <AnimatePresence>
                  {sortedImages.map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative"
                    >
                      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer">
                        <div className="relative aspect-square bg-gray-100">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />

                          {/* حالة المعالجة */}
                          <div className="absolute top-2 right-2">
                            {image.processed ? (
                              <div className="bg-green-500 rounded-full p-1">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="bg-yellow-500 rounded-full p-1 animate-pulse">
                                <Clock className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>

                          {/* تصنيف الصورة */}
                          {image.category && (
                            <div className="absolute top-2 left-2">
                              <Badge className="text-xs">
                                {image.category}
                              </Badge>
                            </div>
                          )}

                          {/* أدوات سريعة */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            <Button variant="secondary" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="secondary" size="sm">
                              <Heart className="w-4 h-4" />
                            </Button>
                            <Button variant="secondary" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* معلومات الصورة */}
                        <div className="p-3">
                          <h4 className="font-medium text-sm truncate mb-1">
                            {image.name}
                          </h4>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>
                              {(image.size / 1024 / 1024).toFixed(1)} MB
                            </div>
                            {image.analysis && (
                              <div className="truncate">
                                {image.analysis.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">ابدأ بإضافة صورك</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        اسحب الصور هنا أو انقر لاختيارها
                      </p>
                    </div>
                    <div className="flex space-x-4">
                      <Button onClick={handleFileSelect}>
                        <FileImage className="w-4 h-4 mr-2" />
                        اختر ملفات
                      </Button>
                      <Button onClick={handleFolderSelect} variant="outline">
                        <FolderOpen className="w-4 h-4 mr-2" />
                        اختر مجلد
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
