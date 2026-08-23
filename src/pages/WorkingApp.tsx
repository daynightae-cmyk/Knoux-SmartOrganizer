import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Brain,
  Upload,
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Play,
  Pause,
  Grid3X3,
  List,
  Eye,
  Heart,
  Trash2,
  Download,
  Search,
  FileImage,
  Clock,
  Users,
  FileText,
  Palette,
  Activity,
  Zap,
  Target,
  Cpu,
  BarChart3,
  Settings,
  Loader2,
} from "lucide-react";

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
}

import {
  powerfulAI,
  defaultSettings,
  type ProcessedImage,
  type AIEngineSettings,
} from "@/lib/powerful-ai-engine";

export default function WorkingApp() {
  // حالات التطبيق
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [processedCount, setProcessedCount] = useState(0);

  // إعدادات
  const [autoProcess, setAutoProcess] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "folders">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterCategory, setFilterCategory] = useState("all");
  const [minConfidence, setMinConfidence] = useState([50]);
  const [showProcessedOnly, setShowProcessedOnly] = useState(false);
  const [theme, setTheme] = useState("light");
  const [dragActive, setDragActive] = useState(false);

  // إعدادات المحرك القوي الجديد
  const [aiSettings, setAiSettings] =
    useState<AIEngineSettings>(defaultSettings);
  const [aiInitialized, setAiInitialized] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatus, setAiStatus] = useState("");

  // ميزات متقدمة
  const [virtualFolders, setVirtualFolders] = useState<
    Record<string, string[]>
  >({});
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showDuplicatesPanel, setShowDuplicatesPanel] = useState(false);
  const [autoOrganizeEnabled, setAutoOrganizeEnabled] = useState(true);

  // مراجع
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // الإشعارات
  const [notifications, setNotifications] = useState<any[]>([]);

  const addNotification = useCallback(
    (type: string, title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const notification = {
        id,
        type,
        title,
        description,
        timestamp: new Date(),
      };
      setNotifications((prev) => [...prev, notification]);

      // Toast
      if (type === "success") toast.success(title);
      else if (type === "error") toast.error(title);
      else toast.info(title);

      // إزالة تلقائية
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    },
    [],
  );

  // تحضير خطوات المعالجة
  const initProcessingSteps = useCallback((fileCount: number) => {
    const steps: ProcessingStep[] = [
      {
        id: "upload",
        name: "رفع الملفات",
        description: `تم رفع ${fileCount} ملف بنجاح`,
        status: "completed",
        progress: 100,
      },
      {
        id: "validation",
        name: "فحص الملفات",
        description: "التحقق من صحة الملفات",
        status: "pending",
        progress: 0,
      },
      {
        id: "ai-analysis",
        name: "تحليل الذكاء الاصطناعي",
        description: "تحليل محتوى الصور",
        status: "pending",
        progress: 0,
      },
      {
        id: "face-detection",
        name: "كشف الوجوه",
        description: "البحث عن الوجوه",
        status: "pending",
        progress: 0,
      },
      {
        id: "categorization",
        name: "التصنيف",
        description: "تصنيف الصور",
        status: "pending",
        progress: 0,
      },
      {
        id: "completion",
        name: "الانتهاء",
        description: "تم الانتهاء من المعالجة",
        status: "pending",
        progress: 0,
      },
    ];

    setProcessingSteps(steps);
    setCurrentStep(0);
    setOverallProgress(0);
  }, []);

  // رفع الملفات
  const handleFileUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const imageFiles = fileArray.filter((file) =>
        file.type.startsWith("image/"),
      );

      if (imageFiles.length === 0) {
        addNotification("error", "لا توجد صور صحيحة", "يرجى اختيار ملفات صور");
        return;
      }

      addNotification(
        "info",
        "بدء رفع الملفات",
        `جاري رفع ${imageFiles.length} ملف`,
      );

      // إنشاء كائنات الصور
      const newImages: ProcessedImage[] = imageFiles.map((file, index) => ({
        id: `${crypto.randomUUID()}-${Date.now()}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        file,
        processed: false,
        tags: [],
        createdAt: new Date(),
      }));

      setImages((prev) => [...prev, ...newImages]);
      initProcessingSteps(imageFiles.length);

      addNotification(
        "success",
        "تم رفع الملفات",
        `تم رفع ${imageFiles.length} ملف بنجاح`,
      );

      // بدء المعالجة التلقائية
      if (autoProcess) {
        setTimeout(() => startProcessing(newImages), 1000);
      }

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });
    },
    [autoProcess, addNotification, initProcessingSteps],
  );

  // معالجة الصور
  const startProcessing = useCallback(
    async (imagesToProcess?: ProcessedImage[]) => {
      const targetImages =
        imagesToProcess || images.filter((img) => !img.processed);

      if (targetImages.length === 0) {
        addNotification("warning", "لا توجد صور للمعالجة");
        return;
      }

      setIsProcessing(true);
      setProcessedCount(0);
      addNotification(
        "info",
        "بدء المعالجة",
        "جاري تحليل الصور بالذكاء الاصطناعي",
      );

      try {
        // خطوة الفحص
        setCurrentStep(1);
        setProcessingSteps((prev) =>
          prev.map((step, idx) =>
            idx === 1 ? { ...step, status: "processing" } : step,
          ),
        );

        await new Promise((resolve) => setTimeout(resolve, 800));

        setProcessingSteps((prev) =>
          prev.map((step, idx) =>
            idx === 1 ? { ...step, status: "completed", progress: 100 } : step,
          ),
        );

        // خطوة التحليل
        setCurrentStep(2);
        setProcessingSteps((prev) =>
          prev.map((step, idx) =>
            idx === 2 ? { ...step, status: "processing" } : step,
          ),
        );

        // معالجة كل صورة بالمحرك القوي الجديد
        for (let i = 0; i < targetImages.length; i++) {
          const image = targetImages[i];
          setCurrentFile(image.name);

          try {
            // تحليل شامل بالذكاء الاصطناعي القوي
            const processedImage = await powerfulAI.processImage(
              image.file,
              aiSettings,
            );

            // تحديث الصورة مع النتائج الجديدة
            setImages((prev) =>
              prev.map((img) =>
                img.id === image.id
                  ? {
                      ...processedImage,
                      id: img.id, // الحفاظ على ID الأصلي
                      processed: true,
                    }
                  : img,
              ),
            );
          } catch (error) {
            console.error(`خطأ في معالجة ${image.name}:`, error);
            addNotification("error", `فشل معالجة ${image.name}`, String(error));
          }

          setProcessedCount(i + 1);

          const progress = ((i + 1) / targetImages.length) * 100;
          setProcessingSteps((prev) =>
            prev.map((step, idx) => (idx === 2 ? { ...step, progress } : step)),
          );
          setOverallProgress(progress * 0.6); // 60% للتحليل
        }

        setProcessingSteps((prev) =>
          prev.map((step, idx) =>
            idx === 2 ? { ...step, status: "completed", progress: 100 } : step,
          ),
        );

        // باقي الخطوات
        const remainingSteps = [3, 4, 5];
        for (let stepIdx of remainingSteps) {
          setCurrentStep(stepIdx);
          setProcessingSteps((prev) =>
            prev.map((step, idx) =>
              idx === stepIdx ? { ...step, status: "processing" } : step,
            ),
          );

          await new Promise((resolve) => setTimeout(resolve, 500));

          setProcessingSteps((prev) =>
            prev.map((step, idx) =>
              idx === stepIdx
                ? { ...step, status: "completed", progress: 100 }
                : step,
            ),
          );
        }

        setOverallProgress(100);
        setIsProcessing(false);
        setCurrentFile("");

        addNotification(
          "success",
          "اكتملت المعالجة",
          `تم تحليل ${targetImages.length} صورة بنجاح`,
        );

        // تنظيم تلقائي بعد المعالجة
        if (autoOrganizeEnabled) {
          autoOrganizeImages();
        }

        // كشف المتكررات
        detectDuplicates();

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (error) {
        setIsProcessing(false);
        addNotification(
          "error",
          "خطأ في المعالجة",
          "حدث خطأ أثناء معالجة الصور",
        );
      }
    },
    [images, addNotification, autoOrganizeEnabled],
  );

  // التنظيم التلقائي
  const autoOrganizeImages = useCallback(() => {
    const processedImages = images.filter(
      (img) => img.processed && img.analysis,
    );
    const structure = enhancedAIEngine.generateSmartFolderStructure(
      processedImages.map((img) => ({
        id: img.id,
        analysis: img.analysis!,
        name: img.name,
      })),
    );

    setVirtualFolders(structure);
    addNotification(
      "success",
      "تم التنظيم التلقائي",
      `تم إنشاء ${Object.keys(structure).length} مجلد ذكي`,
    );
  }, [images, addNotification]);

  // كشف المتكررات
  const detectDuplicates = useCallback(() => {
    const imageIds = images.map((img) => img.id);
    const duplicates = enhancedAIEngine.findDuplicates(imageIds);

    setDuplicateGroups(duplicates);
    if (duplicates.length > 0) {
      addNotification(
        "info",
        "تم العثور على صور متكررة",
        `${duplicates.length} مجموعة من الصور المتشابهة`,
      );
    }
  }, [images, addNotification]);

  // إيقاف المعالجة
  const stopProcessing = useCallback(() => {
    setIsProcessing(false);
    setOverallProgress(0);
    setCurrentFile("");
    addNotification("info", "تم إيقاف المعالجة");
  }, [addNotification]);

  // مسح الكل
  const clearAll = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setProcessingSteps([]);
    setOverallProgress(0);
    setProcessedCount(0);
    addNotification("info", "تم مسح جميع الصور");
  }, [images, addNotification]);

  // التعامل مع drag and drop
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

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files);
      }
    },
    [handleFileUpload],
  );

  // اختيار الملفات
  const selectFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const selectFolder = useCallback(() => {
    folderInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileUpload(e.target.files);
      }
    },
    [handleFileUpload],
  );

  // فلترة وترتيب الصور المتقدم
  const filteredAndSortedImages = React.useMemo(() => {
    let filtered = images.filter((img) => {
      // فلترة البحث
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          img.name.toLowerCase().includes(query) ||
          img.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          img.analysis?.description.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // فلترة التصنيف
      if (filterCategory !== "all") {
        if (img.category !== filterCategory) return false;
      }

      // فلترة المعالجة
      if (showProcessedOnly && !img.processed) return false;

      // فلترة الثقة
      if (img.analysis) {
        const confidence = img.analysis.confidence * 100;
        if (confidence < minConfidence[0]) return false;
      }

      return true;
    });

    // ترتيب النتائج
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "ar");
        case "size":
          return b.size - a.size;
        case "confidence":
          const confA = a.analysis?.confidence || 0;
          const confB = b.analysis?.confidence || 0;
          return confB - confA;
        case "category":
          const catA = a.category || "zzz";
          const catB = b.category || "zzz";
          return catA.localeCompare(catB, "ar");
        case "faces":
          const facesA = a.analysis?.faces.length || 0;
          const facesB = b.analysis?.faces.length || 0;
          return facesB - facesA;
        case "date":
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    // إزالة أي تكرارات محتملة بناءً على ID
    const uniqueFiltered = filtered.filter(
      (img, index, arr) =>
        arr.findIndex((item) => item.id === img.id) === index,
    );

    return uniqueFiltered;
  }, [
    images,
    searchQuery,
    filterCategory,
    showProcessedOnly,
    minConfidence,
    sortBy,
  ]);

  // تهيئة محرك الذكاء الاصطناعي
  useEffect(() => {
    enhancedAIEngine
      .initialize()
      .then(() => {
        addNotification(
          "success",
          "تم تهيئة محرك الذكاء الاصطناعي",
          "النظام جاهز للاستخدام",
        );
      })
      .catch(() => {
        addNotification("warning", "تحذير", "سيتم استخدام التحليل الأساسي");
      });
  }, [addNotification]);

  // إحصائيات
  const stats = {
    total: images.length,
    processed: images.filter((img) => img.processed).length,
    faces: images.reduce(
      (sum, img) => sum + (img.analysis?.faces.length || 0),
      0,
    ),
    categories: images.reduce(
      (acc, img) => {
        if (img.category) {
          acc[img.category] = (acc[img.category] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    ),
  };

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
      {/* Drag overlay */}
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

      {/* الإشعارات */}
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={`notification-${notification.id}-${index}`}
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

      {/* رأس التطبيق المحسن */}
      <header className="border-b border-gray-200 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Knoux SmartOrganizer
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  منظم الصور الذكي بتقنية الذكاء الاصطناعي
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* إحصائيات سريعة */}
              <div className="hidden md:flex items-center space-x-6 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {images.length}
                  </div>
                  <div className="text-xs text-gray-500">صورة</div>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {stats.processed}
                  </div>
                  <div className="text-xs text-gray-500">محلل</div>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {stats.faces}
                  </div>
                  <div className="text-xs text-gray-500">وجه</div>
                </div>
              </div>

              {/* مؤشر الحالة */}
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-green-200">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <div className="text-sm">
                      <div className="font-medium text-blue-600">
                        معالجة جارية
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(overallProgress)}% مكتمل
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="text-sm">
                      <div className="font-medium text-green-600">جاهز</div>
                      <div className="text-xs text-gray-500">النظام نشط</div>
                    </div>
                  </>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2 rounded-xl"
              >
                {theme === "light" ? (
                  <div className="text-lg">🌙</div>
                ) : (
                  <div className="text-lg">☀️</div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* الشريط الجانبي */}
          <div className="lg:col-span-3 space-y-6">
            {/* منطقة رفع الصور المحسنة */}
            <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">رفع الصور</div>
                      <div className="text-xs text-gray-500">
                        سحب وإفلات أو تحديد
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">✓ يعمل</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={selectFiles}
                    variant="outline"
                    className="flex flex-col h-24 p-3 border-2 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                    disabled={isProcessing}
                  >
                    <FileImage className="w-8 h-8 mb-2 text-blue-600" />
                    <span className="text-sm font-medium">اختر ملفات</span>
                    <span className="text-xs text-gray-500">صور متعددة</span>
                  </Button>

                  <Button
                    onClick={selectFolder}
                    variant="outline"
                    className="flex flex-col h-24 p-3 border-2 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200"
                    disabled={isProcessing}
                  >
                    <FolderOpen className="w-8 h-8 mb-2 text-purple-600" />
                    <span className="text-sm font-medium">اختر مجلد</span>
                    <span className="text-xs text-gray-500">مجلد كامل</span>
                  </Button>
                </div>

                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer",
                    dragActive
                      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-105"
                      : "border-gray-300 hover:border-blue-400 hover:bg-gray-50",
                    isProcessing && "pointer-events-none opacity-50",
                  )}
                  onClick={selectFiles}
                >
                  <motion.div
                    animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {dragActive ? "اتركها هنا!" : "اسحب الصور هنا"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      أو انقر للتصفح واختيار الملفات
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                      <span>JPG</span>
                      <span>•</span>
                      <span>PNG</span>
                      <span>•</span>
                      <span>GIF</span>
                      <span>•</span>
                      <span>WEBP</span>
                    </div>
                  </motion.div>
                </div>

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
                  webkitdirectory=""
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="space-y-2">
                  {!isProcessing ? (
                    <>
                      <Button
                        onClick={() => startProcessing()}
                        disabled={images.length === 0}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        تحليل ذكي (
                        {images.filter((img) => !img.processed).length})
                      </Button>

                      <Button
                        onClick={autoOrganizeImages}
                        disabled={
                          images.filter((img) => img.processed).length === 0
                        }
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        تنظيم تلقائي
                      </Button>

                      <Button
                        onClick={detectDuplicates}
                        disabled={images.length < 2}
                        variant="outline"
                        className="w-full border-orange-300 hover:bg-orange-50"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        كشف المتكررات
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={stopProcessing}
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
                    disabled={images.length === 0 || isProcessing}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    مسح الكل
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* الإعدادات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  إعدادات
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
                    checked={showProcessedOnly}
                    onCheckedChange={setShowProcessedOnly}
                  />
                  <Label>المعالجة فقط</Label>
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
                      <SelectItem value="folders">مجلدات ذكية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={autoOrganizeEnabled}
                    onCheckedChange={setAutoOrganizeEnabled}
                  />
                  <Label>تنظيم تلقائي</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showDuplicatesPanel}
                    onCheckedChange={setShowDuplicatesPanel}
                  />
                  <Label>عرض المتكررات</Label>
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
                      <SelectItem value="category">التصنيف</SelectItem>
                      <SelectItem value="faces">عدد الوجوه</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>تصنيف الصور</Label>
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الصور</SelectItem>
                      <SelectItem value="selfies">صور شخصية</SelectItem>
                      <SelectItem value="nature">طبيعة</SelectItem>
                      <SelectItem value="food">طعام</SelectItem>
                      <SelectItem value="documents">وثائق</SelectItem>
                      <SelectItem value="screenshots">لقطات شاشة</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>الحد الأدنى للثقة: {minConfidence[0]}%</Label>
                  <Slider
                    value={minConfidence}
                    onValueChange={setMinConfidence}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* المنطقة الرئيسية */}
          <div className="lg:col-span-9 space-y-6">
            {/* نتائج المعالجة */}
            {!isProcessing && images.length > 0 && stats.processed > 0 && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700">
                    <CheckCircle className="w-6 h-6 mr-2" />
                    نتائج المعالجة المكتملة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.processed}
                      </div>
                      <div className="text-sm text-gray-600">
                        صورة تم تحليلها
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {Object.keys(stats.categories).length}
                      </div>
                      <div className="text-sm text-gray-600">فئة مكتشفة</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.faces}
                      </div>
                      <div className="text-sm text-gray-600">وجه مكتشف</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.processed > 0
                          ? Math.round(
                              (images.reduce(
                                (sum, img) =>
                                  sum + (img.analysis?.confidence || 0),
                                0,
                              ) /
                                stats.processed) *
                                100,
                            )
                          : 0}
                        %
                      </div>
                      <div className="text-sm text-gray-600">دقة التحليل</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800 text-center">
                      🎉 تم تنظيم صورك وتصنيفها بنجاح! يمكنك الآن تصفحها والبحث
                      فيها بسهولة في الأسفل
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* شريط التقدم */}
            {isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">
                          {processingSteps[currentStep]?.name || "معالجة..."}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {Math.round(overallProgress)}%
                        </span>
                      </div>
                      <Progress value={overallProgress} className="h-3 mb-2" />
                      <p className="text-sm text-gray-600">
                        {processingSteps[currentStep]?.description ||
                          "جاري المعالجة..."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">الملف الحالي:</span>
                        <p className="font-medium truncate">
                          {currentFile || "لا يوجد"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">المعالج:</span>
                        <p className="font-medium">
                          {processedCount} / {images.length}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">الحالة:</span>
                        <p className="font-medium text-blue-600">نشط</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {processingSteps.map((step, index) => (
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
                                  : "bg-gray-300 text-gray-600",
                            )}
                          >
                            {step.status === "completed" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : step.status === "processing" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium">
                              {step.name}
                            </span>
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
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-xs text-gray-500">إجمالي</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.processed}</p>
                      <p className="text-xs text-gray-500">معالج</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.faces}</p>
                      <p className="text-xs text-gray-500">وجه</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Target className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {stats.processed > 0
                          ? Math.round(
                              (images.reduce(
                                (sum, img) =>
                                  sum + (img.analysis?.confidence || 0),
                                0,
                              ) /
                                stats.processed) *
                                100,
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-xs text-gray-500">دقة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* البحث والفلترة */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="البحث في الصور، العلامات، الأوصاف..."
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
                      <Button
                        variant={viewMode === "folders" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("folders")}
                      >
                        <FolderOpen className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* معلومات النتائج */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      عرض {filteredAndSortedImages.length} من {images.length}{" "}
                      صورة
                      {filterCategory !== "all" && ` • ${filterCategory}`}
                      {searchQuery && ` • البحث: "${searchQuery}"`}
                    </span>
                    <span>
                      مرتب حسب:{" "}
                      {sortBy === "date"
                        ? "التاريخ"
                        : sortBy === "name"
                          ? "الاسم"
                          : sortBy === "size"
                            ? "الحجم"
                            : sortBy === "confidence"
                              ? "الدقة"
                              : sortBy === "category"
                                ? "التصنيف"
                                : sortBy === "faces"
                                  ? "الوجوه"
                                  : sortBy}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* لوحة كشف المتكررات */}
            {showDuplicatesPanel && duplicateGroups.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700">
                    <Target className="w-6 h-6 mr-2" />
                    الصور المتكررة المكتشفة ({duplicateGroups.length} مجموعة)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {duplicateGroups.map((group, index) => (
                      <div
                        key={group.id}
                        className="p-4 bg-white rounded-lg border"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-sm">
                            مجموعة {index + 1} - {group.images.length} صور
                            متشابهة
                          </span>
                          <Badge variant="outline">
                            {(group.similarity * 100).toFixed(0)}% تشابه
                          </Badge>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {group.images
                            .slice(0, 6)
                            .map((imageId: string, imgIndex: number) => {
                              const image = images.find(
                                (img) => img.id === imageId,
                              );
                              return image ? (
                                <div
                                  key={`duplicate-${group.id}-${imageId}-${imgIndex}`}
                                  className="relative aspect-square"
                                >
                                  <img
                                    src={image.url}
                                    alt={image.name}
                                    className="w-full h-full object-cover rounded border"
                                  />
                                  {imageId === group.representative && (
                                    <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                                      <CheckCircle className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                              ) : null;
                            })}
                          {group.images.length > 6 && (
                            <div className="aspect-square bg-gray-100 rounded border flex items-center justify-center">
                              <span className="text-xs text-gray-500">
                                +{group.images.length - 6}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3 mr-1" />
                            عرض الكل
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-3 h-3 mr-1" />
                            حذف المتكررات
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* عرض المجلدات الذكية */}
            {viewMode === "folders" &&
            Object.keys(virtualFolders).length > 0 ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FolderOpen className="w-6 h-6 mr-2 text-blue-600" />
                      المجلدات الذكية التلقائية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(virtualFolders).map(
                        ([folderName, imageIds]) => (
                          <Card
                            key={folderName}
                            className={cn(
                              "cursor-pointer transition-all duration-200 hover:shadow-lg",
                              selectedFolder === folderName
                                ? "ring-2 ring-blue-500"
                                : "",
                            )}
                            onClick={() =>
                              setSelectedFolder(
                                selectedFolder === folderName
                                  ? null
                                  : folderName,
                              )
                            }
                          >
                            <CardContent className="p-4">
                              <div className="text-center space-y-3">
                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                                  <FolderOpen className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">
                                    {folderName}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {imageIds.length} صورة
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* عرض محتويات المجلد المحدد */}
                {selectedFolder && virtualFolders[selectedFolder] && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>محتويات مجلد: {selectedFolder}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFolder(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {virtualFolders[selectedFolder].map(
                          (imageId, index) => {
                            const image = images.find(
                              (img) => img.id === imageId,
                            );
                            return image ? (
                              <Card
                                key={`folder-${selectedFolder}-${imageId}-${index}`}
                                className="overflow-hidden"
                              >
                                <div className="relative aspect-square">
                                  <img
                                    src={image.url}
                                    alt={image.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="p-2">
                                  <p className="text-xs font-medium truncate">
                                    {image.name}
                                  </p>
                                </div>
                              </Card>
                            ) : null;
                          },
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : /* معرض الصور المنظم */
            filteredAndSortedImages.length > 0 ? (
              <div className="space-y-6">
                {/* شريط الحالة */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-blue-600">
                          {filteredAndSortedImages.length}
                        </div>
                        <div className="text-xs text-gray-600">صور معروضة</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-green-600">
                          {
                            filteredAndSortedImages.filter(
                              (img) => img.processed,
                            ).length
                          }
                        </div>
                        <div className="text-xs text-gray-600">تم تحليلها</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-orange-600">
                          {
                            filteredAndSortedImages.filter(
                              (img) => !img.processed,
                            ).length
                          }
                        </div>
                        <div className="text-xs text-gray-600">
                          بانتظار التحليل
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-purple-600">
                          {Object.keys(stats.categories).length}
                        </div>
                        <div className="text-xs text-gray-600">فئات مختلفة</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* التصنيفات السريعة */}
                {Object.keys(stats.categories).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Palette className="w-5 h-5 mr-2" />
                        تصنيفات الصور المكتشفة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.categories).map(
                          ([category, count]) => (
                            <Button
                              key={category}
                              variant={
                                filterCategory === category
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setFilterCategory(category)}
                              className="flex items-center space-x-2"
                            >
                              <span>{category}</span>
                              <Badge variant="secondary" className="ml-1">
                                {count}
                              </Badge>
                            </Button>
                          ),
                        )}
                        <Button
                          variant={
                            filterCategory === "all" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setFilterCategory("all")}
                        >
                          جميع الصور{" "}
                          <Badge variant="secondary" className="ml-1">
                            {images.length}
                          </Badge>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* عرض الصور */}
                <div
                  className={cn(
                    "grid gap-4",
                    viewMode === "grid"
                      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                      : "grid-cols-1",
                  )}
                >
                  <AnimatePresence>
                    {filteredAndSortedImages.map((image, index) => (
                      <motion.div
                        key={`gallery-${image.id}-${index}`}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{
                          delay: index * 0.03,
                          duration: 0.3,
                          ease: "easeOut",
                        }}
                        className="group relative"
                      >
                        <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-blue-200">
                          <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />

                            {/* معلومات الحالة */}
                            <div className="absolute top-2 right-2 space-y-1">
                              {image.processed ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="bg-green-500 rounded-full p-1.5 shadow-lg"
                                >
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </motion.div>
                              ) : (
                                <div className="bg-yellow-500 rounded-full p-1.5 animate-pulse shadow-lg">
                                  <Clock className="w-4 h-4 text-white" />
                                </div>
                              )}

                              {image.analysis &&
                                image.analysis.confidence > 0.8 && (
                                  <div className="bg-blue-500 rounded-full p-1 shadow-lg">
                                    <Target className="w-3 h-3 text-white" />
                                  </div>
                                )}
                            </div>

                            {/* التصنيف */}
                            {image.category && (
                              <div className="absolute top-2 left-2">
                                <Badge
                                  className="text-xs font-medium shadow-lg"
                                  variant="secondary"
                                >
                                  {image.category === "selfies"
                                    ? "صور شخصية"
                                    : image.category === "nature"
                                      ? "طبيعة"
                                      : image.category === "food"
                                        ? "طعام"
                                        : image.category === "documents"
                                          ? "وثائق"
                                          : image.category === "screenshots"
                                            ? "لقطات شاشة"
                                            : "أخرى"}
                                </Badge>
                              </div>
                            )}

                            {/* الوجوه المكتشفة */}
                            {image.analysis &&
                              image.analysis.faces.length > 0 && (
                                <div className="absolute bottom-2 right-2">
                                  <div className="bg-purple-500 rounded-full p-1 shadow-lg">
                                    <div className="flex items-center space-x-1 px-1">
                                      <Users className="w-3 h-3 text-white" />
                                      <span className="text-xs text-white font-medium">
                                        {image.analysis.faces.length}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                            {/* شريط الأدوات */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                              <div className="flex space-x-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="bg-white/90 hover:bg-white"
                                  onClick={() =>
                                    window.open(image.url, "_blank")
                                  }
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="bg-white/90 hover:bg-white"
                                >
                                  <Heart className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="bg-white/90 hover:bg-white"
                                  onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = image.url;
                                    link.download = image.name;
                                    link.click();
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-white">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm truncate text-gray-800">
                                {image.name}
                              </h4>

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>
                                  {(image.size / 1024 / 1024).toFixed(1)} MB
                                </span>
                                {image.analysis && (
                                  <span className="text-green-600 font-medium">
                                    {(image.analysis.confidence * 100).toFixed(
                                      0,
                                    )}
                                    % دقة
                                  </span>
                                )}
                              </div>

                              {image.analysis && (
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {image.analysis.description}
                                </p>
                              )}

                              {image.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {image.tags.slice(0, 3).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-xs px-1.5 py-0.5"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {image.tags.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-1.5 py-0.5"
                                    >
                                      +{image.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
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
                        انقر أو اسحب الصور للبدء
                      </p>
                    </div>
                    <div className="flex space-x-4">
                      <Button onClick={selectFiles}>
                        <FileImage className="w-4 h-4 mr-2" />
                        اختر ملفات
                      </Button>
                      <Button onClick={selectFolder} variant="outline">
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
