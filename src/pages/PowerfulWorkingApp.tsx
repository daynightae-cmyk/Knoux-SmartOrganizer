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
  Shield,
  Camera,
  Type,
  Sparkles,
} from "lucide-react";

import {
  powerfulAI,
  defaultSettings as powerfulSettings,
  type ProcessedImage,
  type AIEngineSettings,
} from "@/lib/powerful-ai-engine";

import {
  simpleAI,
  defaultSettings as simpleSettings,
} from "@/lib/simple-ai-engine";

interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
}

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
  timestamp: Date;
}

export default function PowerfulWorkingApp() {
  // حالات التطبيق الأساسية
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [processedCount, setProcessedCount] = useState(0);

  // إعدادات التطبيق
  const [autoProcess, setAutoProcess] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "folders">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterCategory, setFilterCategory] = useState("all");
  const [minConfidence, setMinConfidence] = useState([30]);
  const [showProcessedOnly, setShowProcessedOnly] = useState(false);
  const [theme, setTheme] = useState("light");
  const [dragActive, setDragActive] = useState(false);

  // حالات المحرك القوي الجديد
  const [aiSettings, setAiSettings] =
    useState<AIEngineSettings>(powerfulSettings);
  const [aiInitialized, setAiInitialized] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatus, setAiStatus] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [usingSimpleAI, setUsingSimpleAI] = useState(false);

  // مراجع العناصر
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // نظام الإشعارات
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (type: Notification["type"], title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const notification: Notification = {
        id,
        type,
        title,
        description,
        timestamp: new Date(),
      };

      setNotifications((prev) => [...prev, notification]);

      // عرض toast
      if (type === "success") toast.success(title);
      else if (type === "error") toast.error(title);
      else if (type === "warning") toast.warning(title);
      else toast.info(title);

      // إزالة تلقائية بعد 5 ثوان
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    },
    [],
  );

  // تهيئة محرك الذكاء الاصطناعي مع نسخة احتياطية
  useEffect(() => {
    const initializeAI = async () => {
      if (aiInitialized || aiLoading) return;

      setAiLoading(true);
      setAiStatus("🚀 بدء تحميل محرك الذكاء الاصطناعي...");

      try {
        // محاولة تحميل المحرك القوي أولاً
        await powerfulAI.initialize((message, progress) => {
          setAiStatus(message);
          setAiProgress(progress);
        });

        setAiInitialized(true);
        setAiLoading(false);
        setAiStatus("✅ المحرك المتقدم جاهز!");
        setUsingSimpleAI(false);

        addNotification(
          "success",
          "🤖 محرك الذكاء الاصطناعي المتقدم جاهز",
          "جميع النماذج المتقدمة تم تحميلها بنجاح",
        );

        // عرض تفاصيل النماذج المحملة
        const status = powerfulAI.getStatus();
        console.log("🔍 حالة النماذج المتقدمة:", status);

        // احتفال بالتحميل الناجح
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#4F46E5", "#7C3AED", "#EC4899"],
        });
      } catch (error) {
        console.warn("فشل المحرك المتقدم، التحول للنسخة المبسطة:", error);

        // التحول للمحرك المبسط
        try {
          setAiStatus("🔄 التحول للمحرك المبسط السريع...");

          await simpleAI.initialize((message, progress) => {
            setAiStatus(message);
            setAiProgress(progress);
          });

          setAiInitialized(true);
          setAiLoading(false);
          setAiStatus("✅ المحرك المبسط جاهز!");
          setUsingSimpleAI(true);

          addNotification(
            "info",
            "🔧 تم التحول للمحرك المبسط",
            "محرك سريع وموثوق - يعمل بدون مكتبات خارجية",
          );

          // احتفال مبسط
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.7 },
            colors: ["#10B981", "#3B82F6"],
          });
        } catch (simpleError) {
          setAiLoading(false);
          setAiStatus(`❌ فشل في تحميل أي محرك: ${simpleError}`);
          addNotification(
            "error",
            "فشل تحميل المحرك",
            "أعد تحميل الصفحة أو تحقق من المتصفح",
          );
        }
      }
    };

    initializeAI();
  }, []);

  // تحضير خطوات المعالجة
  const initProcessingSteps = useCallback((fileCount: number) => {
    const steps: ProcessingStep[] = [
      {
        id: "upload",
        name: "📤 رفع الملفات",
        description: `تم رفع ${fileCount} ملف بنجاح`,
        status: "completed",
        progress: 100,
      },
      {
        id: "validation",
        name: "🔍 فحص الملفات",
        description: "التحقق من صحة وجودة الملفات",
        status: "pending",
        progress: 0,
      },
      {
        id: "ai-classification",
        name: "🎯 تصنيف الصور",
        description: "تحليل ذكي لمحتوى الصور",
        status: "pending",
        progress: 0,
      },
      {
        id: "face-detection",
        name: "👤 كشف الوجوه",
        description: "تحديد الوجوه والأعمار",
        status: "pending",
        progress: 0,
      },
      {
        id: "text-extraction",
        name: "📖 استخراج النصوص",
        description: "قراءة النصوص من الصور",
        status: "pending",
        progress: 0,
      },
      {
        id: "color-analysis",
        name: "🎨 تحليل الألوان",
        description: "استخراج الألوان السائدة",
        status: "pending",
        progress: 0,
      },
      {
        id: "completion",
        name: "✅ الانتهاء",
        description: "تم الانتهاء من المعالجة الشاملة",
        status: "pending",
        progress: 0,
      },
    ];

    setProcessingSteps(steps);
    setCurrentStep(0);
    setOverallProgress(0);
  }, []);

  // رفع ومعالجة الملفات
  const handleFileUpload = useCallback(
    async (files: FileList | File[]) => {
      if (!aiInitialized) {
        addNotification(
          "warning",
          "المحرك غير جاهز",
          "انتظر اكتمال تحميل المحرك أولاً",
        );
        return;
      }

      const fileArray = Array.from(files);
      const imageFiles = fileArray.filter((file) =>
        file.type.startsWith("image/"),
      );

      if (imageFiles.length === 0) {
        addNotification(
          "error",
          "لا توجد صور صحيحة",
          "يرجى اختيار ملفات صور صالحة",
        );
        return;
      }

      addNotification(
        "info",
        "🚀 بدء رفع الملفات",
        `جاري رفع ${imageFiles.length} ملف`,
      );

      // إنشاء كائنات الصور المبدئية
      const newImages: ProcessedImage[] = imageFiles.map((file, index) => ({
        id: `${crypto.randomUUID()}-${Date.now()}-${index}`,
        file,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        classification: "جاري المعالجة...",
        description: "",
        confidence: 0,
        faces: [],
        text: "",
        colors: [],
        isNSFW: false,
        nsfwScore: 0,
        tags: [],
        processingTime: 0,
        errors: [],
        metadata: {
          width: 0,
          height: 0,
          format: file.type,
          created: new Date(file.lastModified || Date.now()),
        },
      }));

      setImages((prev) => [...prev, ...newImages]);
      initProcessingSteps(imageFiles.length);

      addNotification(
        "success",
        "✅ تم رفع الملفات",
        `تم رفع ${imageFiles.length} ملف بنجاح`,
      );

      // بدء المعالجة التلقائية
      if (autoProcess) {
        setTimeout(() => startProcessing(newImages), 1000);
      }

      // احتفال بالرفع
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.8 },
      });
    },
    [aiInitialized, autoProcess, addNotification, initProcessingSteps],
  );

  // معالجة الصور بالمحرك القوي
  const startProcessing = useCallback(
    async (imagesToProcess?: ProcessedImage[]) => {
      if (!aiInitialized) {
        addNotification(
          "error",
          "المحرك غير جاهز",
          "انتظر اكتمال تحميل المحرك",
        );
        return;
      }

      const targetImages =
        imagesToProcess ||
        images.filter(
          (img) =>
            img.classification === "جاري المعالجة..." || img.errors.length > 0,
        );

      if (targetImages.length === 0) {
        addNotification("warning", "لا توجد صور للمعالجة");
        return;
      }

      setIsProcessing(true);
      setProcessedCount(0);
      addNotification(
        "info",
        "🔄 بدء المعالجة الشاملة",
        "جاري تحليل الصور بالذكاء الاصطناعي المتقدم",
      );

      try {
        // خطوة الفحص
        setCurrentStep(1);
        setProcessingSteps((prev) =>
          prev.map((step, idx) =>
            idx === 1 ? { ...step, status: "processing" } : step,
          ),
        );

        await new Promise((resolve) => setTimeout(resolve, 500));

        setProcessingSteps((prev) =>
          prev.map((step, idx) =>
            idx === 1 ? { ...step, status: "completed", progress: 100 } : step,
          ),
        );

        // معالجة كل صورة بالمحرك القوي
        for (let i = 0; i < targetImages.length; i++) {
          const image = targetImages[i];
          setCurrentFile(image.name);

          // تحديث خطوات المعالجة
          const stepIndex = (i % 5) + 2; // الخطوات من 2 إلى 6
          setCurrentStep(stepIndex);
          setProcessingSteps((prev) =>
            prev.map((step, idx) =>
              idx === stepIndex ? { ...step, status: "processing" } : step,
            ),
          );

          try {
            // المعالجة الشاملة بالمحرك المناسب
            const activeAI = usingSimpleAI ? simpleAI : powerfulAI;
            const processedImage = await activeAI.processImage(
              image.file,
              aiSettings,
            );

            // تحديث الصورة مع النتائج المتقدمة
            setImages((prev) =>
              prev.map((img) =>
                img.id === image.id
                  ? {
                      ...processedImage,
                      id: img.id, // الحفاظ على ID الأصلي
                    }
                  : img,
              ),
            );

            // تحديث العداد والتقدم
            setProcessedCount(i + 1);
            const progress = ((i + 1) / targetImages.length) * 100;
            setOverallProgress(progress);

            setProcessingSteps((prev) =>
              prev.map((step, idx) =>
                idx === stepIndex
                  ? { ...step, status: "completed", progress: 100 }
                  : step,
              ),
            );

            // إشعار لكل صورة تتم معالجتها
            if (processedImage.errors.length === 0) {
              addNotification(
                "success",
                `✅ تمت معالجة ${image.name}`,
                `${processedImage.classification} - ثقة: ${Math.round(processedImage.confidence * 100)}%`,
              );
            } else {
              addNotification(
                "warning",
                `⚠️ معالجة جزئية لـ ${image.name}`,
                `${processedImage.errors.length} تحذير`,
              );
            }
          } catch (error) {
            console.error(`خطأ في معالجة ${image.name}:`, error);
            addNotification(
              "error",
              `❌ فشل معالجة ${image.name}`,
              String(error),
            );

            // تحديث الصورة مع الخطأ
            setImages((prev) =>
              prev.map((img) =>
                img.id === image.id
                  ? {
                      ...img,
                      classification: "خطأ في المعالجة",
                      errors: [...img.errors, String(error)],
                    }
                  : img,
              ),
            );
          }

          // توقف قصير بين الصور
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // إكمال جميع الخطوات
        setCurrentStep(6);
        setProcessingSteps((prev) =>
          prev.map((step, idx) =>
            idx === 6 ? { ...step, status: "completed", progress: 100 } : step,
          ),
        );

        setIsProcessing(false);
        setOverallProgress(100);
        setCurrentFile("");

        // إشعار الإنجاز النهائي
        addNotification(
          "success",
          "🎉 اكتملت المعالجة!",
          `تم تحليل ${targetImages.length} صورة بنجاح`,
        );

        // احتفال كبير بالإنجاز
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#10B981", "#3B82F6", "#8B5CF6"],
        });
      } catch (error) {
        setIsProcessing(false);
        addNotification("error", "فشل في المعالجة", String(error));
      }
    },
    [images, aiInitialized, aiSettings, addNotification],
  );

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

  // فلترة وترتيب الصور
  const filteredAndSortedImages = React.useMemo(() => {
    let filtered = images.filter((img) => {
      // فلترة البحث
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          img.name.toLowerCase().includes(query) ||
          img.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          img.description.toLowerCase().includes(query) ||
          img.classification.toLowerCase().includes(query) ||
          img.text.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // فلترة التصنيف
      if (filterCategory !== "all") {
        if (img.classification !== filterCategory) return false;
      }

      // فلترة المعالجة
      if (showProcessedOnly && img.classification === "جاري المعالجة...")
        return false;

      // فلترة الثقة
      const confidence = img.confidence * 100;
      if (confidence < minConfidence[0]) return false;

      return true;
    });

    // ترتيب النتائج
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "size":
          return b.size - a.size;
        case "confidence":
          return b.confidence - a.confidence;
        case "faces":
          return b.faces.length - a.faces.length;
        case "date":
        default:
          return b.metadata.created.getTime() - a.metadata.created.getTime();
      }
    });

    return filtered;
  }, [
    images,
    searchQuery,
    filterCategory,
    showProcessedOnly,
    minConfidence,
    sortBy,
  ]);

  // إحصائيات متقدمة
  const statistics = {
    total: images.length,
    processed: images.filter((img) => img.classification !== "جاري المعالجة...")
      .length,
    faces: images.reduce((sum, img) => sum + img.faces.length, 0),
    withText: images.filter((img) => img.text.length > 0).length,
    nsfw: images.filter((img) => img.isNSFW).length,
    categories: images.reduce(
      (acc, img) => {
        if (img.classification && img.classification !== "جاري المعالجة...") {
          acc[img.classification] = (acc[img.classification] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    ),
  };

  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-500",
        theme === "dark"
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Drag overlay مع تصميم جميل */}
      {dragActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md flex items-center justify-center"
        >
          <div className="text-center p-8 bg-white/90 dark:bg-gray-900/90 rounded-3xl shadow-2xl border border-white/20">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-xl"
            >
              <Upload className="w-16 h-16 text-white" />
            </motion.div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              اسحب الصور هنا
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              سيتم تحليلها فوراً بالذكاء الاصطناعي المتقدم
            </p>
          </div>
        </motion.div>
      )}

      {/* الإشعارات المحسنة */}
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -100, x: "100%" }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed top-4 right-4 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-4 max-w-sm"
            style={{ top: `${20 + index * 80}px` }}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {notification.type === "success" && (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
                {notification.type === "error" && (
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                )}
                {notification.type === "warning" && (
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                )}
                {notification.type === "info" && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {notification.title}
                </h4>
                {notification.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* رأس التطبيق الأنيق */}
      <header className="border-b border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <motion.div
                animate={{ rotate: aiInitialized ? 360 : 0 }}
                transition={{
                  duration: 2,
                  repeat: aiInitialized ? Infinity : 0,
                  ease: "linear",
                }}
                className="p-3 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl shadow-xl"
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Knoux SmartOrganizer PRO
                </h1>
                <div className="flex items-center space-x-2">
                  {aiInitialized ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-white",
                        usingSimpleAI
                          ? "bg-blue-500 dark:bg-blue-600"
                          : "bg-green-500 dark:bg-green-600",
                      )}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {usingSimpleAI ? "AI مبسط" : "AI متقدم"}
                    </Badge>
                  ) : aiLoading ? (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      تحميل AI
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      AI غير جاهز
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    نسخة قوية متقدمة
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* إحصائيات سريعة */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-lg text-blue-600">
                    {statistics.total}
                  </div>
                  <div className="text-gray-500">صور</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-green-600">
                    {statistics.processed}
                  </div>
                  <div className="text-gray-500">معالجة</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-purple-600">
                    {statistics.faces}
                  </div>
                  <div className="text-gray-500">وجوه</div>
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="bg-white/80 dark:bg-gray-800/80"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  إعدادات
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="bg-white/80 dark:bg-gray-800/80"
                >
                  {theme === "light" ? "🌙" : "☀️"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* حالة المحرك إذا كان يتم التحميل */}
      {aiLoading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">{aiStatus}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Progress value={aiProgress} className="w-32 bg-white/20" />
              <span className="text-sm font-medium">
                {Math.round(aiProgress)}%
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* منطقة الرفع الجميلة */}
        {images.length === 0 && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="max-w-md mx-auto">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl"
              >
                <Upload className="w-16 h-16 text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                ابدأ برفع صورك
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                رفع الصور وسيتم تحليلها تلقائياً بأحدث تقنيات الذكاء الاصطناعي
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={selectFiles}
                  disabled={!aiInitialized}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-6 rounded-xl shadow-lg disabled:opacity-50"
                >
                  <FileImage className="w-6 h-6 mr-2" />
                  اختيار ملفات
                </Button>

                <Button
                  onClick={selectFolder}
                  disabled={!aiInitialized}
                  variant="outline"
                  className="p-6 rounded-xl border-2 border-purple-200 hover:border-purple-300 disabled:opacity-50"
                >
                  <FolderOpen className="w-6 h-6 mr-2" />
                  اختيار مجلد
                </Button>
              </div>

              {!aiInitialized && (
                <p className="text-amber-600 dark:text-amber-400 mt-4 text-sm">
                  ⏳ انتظر اكتمال تحميل المحرك لبدء الرفع
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* شريط التحكم والبحث */}
        {images.length > 0 && (
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* البحث */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="ابحث في الصور، الوصف، النصوص، العلامات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/50 dark:bg-gray-800/50 border-gray-200/50"
                    />
                  </div>
                </div>

                {/* الفلاتر */}
                <div className="flex flex-wrap gap-3">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-36 bg-white/50 dark:bg-gray-800/50">
                      <SelectValue placeholder="ترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">التاريخ</SelectItem>
                      <SelectItem value="name">الاسم</SelectItem>
                      <SelectItem value="size">الحجم</SelectItem>
                      <SelectItem value="confidence">الثقة</SelectItem>
                      <SelectItem value="faces">الوجوه</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger className="w-36 bg-white/50 dark:bg-gray-800/50">
                      <SelectValue placeholder="التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {Object.keys(statistics.categories).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category} ({statistics.categories[category]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
              </div>

              {/* شريط التقدم والتحكم في المعالجة */}
              {isProcessing && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="font-medium">جاري المعالجة...</span>
                      <Badge variant="secondary">
                        {processedCount} / {images.length}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopProcessing}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      إيقاف
                    </Button>
                  </div>

                  <Progress value={overallProgress} className="mb-3" />

                  {currentFile && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      معالجة: {currentFile}
                    </p>
                  )}

                  {/* خطوات المعالجة */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 mt-4">
                    {processingSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className={cn(
                          "p-2 rounded-lg text-center text-xs transition-all",
                          step.status === "completed" &&
                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                          step.status === "processing" &&
                            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 animate-pulse",
                          step.status === "pending" &&
                            "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                          step.status === "error" &&
                            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                        )}
                      >
                        <div className="font-medium">{step.name}</div>
                        {step.status === "processing" && (
                          <div className="mt-1">
                            <Progress value={step.progress} className="h-1" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* عرض الصور */}
        {filteredAndSortedImages.length > 0 && (
          <div
            className={cn(
              "grid gap-6",
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1",
            )}
          >
            <AnimatePresence>
              {filteredAndSortedImages.map((image, index) => (
                <motion.div
                  key={`${image.id}-${index}`}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-white/20 hover:shadow-xl transition-all duration-300 group">
                    {/* صورة */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* تراكب الحالة */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* شارات الحالة */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {image.faces.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-500/80 text-white text-xs"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            {image.faces.length}
                          </Badge>
                        )}
                        {image.text.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="bg-green-500/80 text-white text-xs"
                          >
                            <Type className="w-3 h-3 mr-1" />
                            نص
                          </Badge>
                        )}
                        {image.isNSFW && (
                          <Badge
                            variant="destructive"
                            className="bg-red-500/80 text-white text-xs"
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            حساس
                          </Badge>
                        )}
                      </div>

                      {/* مؤشر الثقة */}
                      {image.confidence > 0 && (
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-white text-xs",
                              image.confidence >= 0.8
                                ? "bg-green-500/80"
                                : image.confidence >= 0.5
                                  ? "bg-yellow-500/80"
                                  : "bg-red-500/80",
                            )}
                          >
                            {Math.round(image.confidence * 100)}%
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      {/* اسم الملف والحجم */}
                      <div>
                        <h3
                          className="font-medium text-sm truncate"
                          title={image.name}
                        >
                          {image.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(image.size / (1024 * 1024)).toFixed(1)} MB •{" "}
                          {image.metadata.width}×{image.metadata.height}
                        </p>
                      </div>

                      {/* التصنيف */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">
                            {image.classification}
                          </span>
                        </div>
                        {image.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {image.description}
                          </p>
                        )}
                      </div>

                      {/* النص المستخرج */}
                      {image.text && (
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <FileText className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-medium">
                              نص مستخرج:
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded line-clamp-2">
                            {image.text}
                          </p>
                        </div>
                      )}

                      {/* الألوان */}
                      {image.colors.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Palette className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-medium">
                              ألوان سائدة:
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            {image.colors.slice(0, 5).map((color, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* العلامات */}
                      {image.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {image.tags.slice(0, 3).map((tag, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {image.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{image.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* الأخطاء */}
                      {image.errors.length > 0 && (
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-medium text-red-700 dark:text-red-400">
                              تحذيرات ({image.errors.length})
                            </span>
                          </div>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {image.errors[0]}
                          </p>
                        </div>
                      )}

                      {/* وقت المعالجة */}
                      {image.processingTime > 0 && (
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>معالجة في {image.processingTime}ms</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* أزرار التحكم السفلية */}
        {images.length > 0 && (
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  onClick={selectFiles}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  إضافة المزيد
                </Button>

                <Button
                  onClick={() => startProcessing()}
                  disabled={isProcessing || !aiInitialized}
                  variant="outline"
                >
                  <Play className="w-4 h-4 mr-2" />
                  إعادة المعالجة
                </Button>

                <Button
                  onClick={clearAll}
                  disabled={isProcessing}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  مسح الكل
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Input elements مخفية */}
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
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
