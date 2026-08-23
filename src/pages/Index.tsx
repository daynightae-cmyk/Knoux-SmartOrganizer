import React, { useState, useEffect, useCallback } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useImageOrganizer } from "@/hooks/use-image-organizer";
import { aiEngine } from "@/lib/ai-engine";
import type { ImageFile } from "@/types/organizer";
import {
  Brain,
  Sparkles,
  Zap,
  Filter,
  BarChart3,
  Settings,
  Download,
  Play,
  Pause,
  RotateCcw,
  Grid3X3,
  List,
  Eye,
  Upload,
  Cpu,
  Target,
  Shuffle,
  Copy,
  Loader2,
  FolderOpen,
  Image,
  FileText,
  Users,
  Shield,
  Camera,
  Folder,
  Search,
  Star,
  Heart,
  Trash2,
  Edit3,
  Share2,
  Calendar,
  Clock,
  Bookmark,
  Tag,
  Layers,
  Maximize2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  TrendingUp,
  Activity,
  ImageIcon,
  Palette,
  Mic,
  Volume2,
  MonitorSpeaker,
} from "lucide-react";

// البيانات التجريبية الحقيقية مع تحليل شامل
const DEMO_IMAGES = [
  {
    id: "demo-1",
    name: "sunset-beach-2024.jpg",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    category: "nature" as const,
    size: 2048576,
    processed: true,
    tags: ["sunset", "beach", "nature", "ocean", "beautiful", "landscape"],
    analysis: {
      description: "منظر طبيعي خلاب لغروب الشمس على الشاطئ مع أمواج المحيط",
      confidence: 0.95,
      faces: [],
      text: { text: "", confidence: 0, words: [] },
      isNSFW: false,
      nsfwScore: 0.05,
      dominantColors: ["#FF6B35", "#F7931E", "#FFD23F", "#4A90E2"],
    },
  },
  {
    id: "demo-2",
    name: "family-portrait-2024.jpg",
    url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=600&fit=crop",
    category: "selfies" as const,
    size: 1876543,
    processed: true,
    tags: ["family", "portrait", "people", "happy", "group", "children"],
    analysis: {
      description: "صورة عائلية جميلة تضم 4 أشخاص سعداء",
      confidence: 0.92,
      faces: [
        { confidence: 0.98, age: 35, gender: "male" },
        { confidence: 0.95, age: 32, gender: "female" },
        { confidence: 0.89, age: 8, gender: "female" },
        { confidence: 0.91, age: 5, gender: "male" },
      ],
      text: { text: "", confidence: 0, words: [] },
      isNSFW: false,
      nsfwScore: 0.02,
      dominantColors: ["#8B4513", "#DEB887", "#F5F5DC", "#2E8B57"],
    },
  },
  {
    id: "demo-3",
    name: "recipe-document-scan.jpg",
    url: "https://images.unsplash.com/photo-1586017188363-cc4bde68d963?w=800&h=600&fit=crop",
    category: "documents" as const,
    size: 1234567,
    processed: true,
    tags: ["recipe", "document", "text", "cooking", "handwritten"],
    analysis: {
      description: "وثيقة وصفة طبخ مكتوبة بخط اليد تحتوي على قائمة المكونات",
      confidence: 0.88,
      faces: [],
      text: {
        text: "وصفة كوكيز الشوكولاتة\n2 كوب دقيق\n1 كوب سكر\n1/2 كوب زبدة\nاخبزي على 180 درجة لمدة 12 دقيقة",
        confidence: 0.91,
        words: [
          {
            text: "وصفة",
            confidence: 0.95,
            bbox: { x: 10, y: 5, width: 80, height: 20 },
          },
          {
            text: "كوكيز",
            confidence: 0.93,
            bbox: { x: 10, y: 30, width: 100, height: 18 },
          },
        ],
      },
      isNSFW: false,
      nsfwScore: 0.01,
      dominantColors: ["#FFFFFF", "#000000", "#F5F5F5", "#E8E8E8"],
    },
  },
  {
    id: "demo-4",
    name: "food-pizza-delicious.jpg",
    url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop",
    category: "food" as const,
    size: 2987654,
    processed: true,
    tags: ["pizza", "food", "cheese", "delicious", "italian", "dinner"],
    analysis: {
      description: "بيتزا لذيذة بالجبن والطماطم والريحان الطازج",
      confidence: 0.97,
      faces: [],
      text: { text: "", confidence: 0, words: [] },
      isNSFW: false,
      nsfwScore: 0.03,
      dominantColors: ["#FF6347", "#FFD700", "#228B22", "#8B4513"],
    },
  },
  {
    id: "demo-5",
    name: "screenshot-app-interface.png",
    url: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop",
    category: "screenshots" as const,
    size: 876543,
    processed: true,
    tags: ["screenshot", "app", "interface", "technology", "mobile", "design"],
    analysis: {
      description: "لقطة شاشة لواجهة تطبيق موبايل حديث",
      confidence: 0.85,
      faces: [],
      text: {
        text: "مرحباً بك في التطبيق\nسجل دخولك للمتابعة\nالبريد الإلكتروني: user@example.com",
        confidence: 0.87,
        words: [
          {
            text: "مرحباً",
            confidence: 0.92,
            bbox: { x: 50, y: 100, width: 120, height: 25 },
          },
        ],
      },
      isNSFW: false,
      nsfwScore: 0.02,
      dominantColors: ["#4285F4", "#FFFFFF", "#F8F9FA", "#34A853"],
    },
  },
  {
    id: "demo-6",
    name: "cityscape-night.jpg",
    url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=800&h=600&fit=crop",
    category: "nature" as const,
    size: 3456789,
    processed: true,
    tags: ["city", "night", "lights", "urban", "skyline", "buildings"],
    analysis: {
      description: "منظر ليلي رائع لأفق المدينة مع الأضواء المتلألئة",
      confidence: 0.93,
      faces: [],
      text: { text: "", confidence: 0, words: [] },
      isNSFW: false,
      nsfwScore: 0.01,
      dominantColors: ["#1a1a2e", "#16213e", "#0f3460", "#533a7b"],
    },
  },
];

export default function Index() {
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

  // حالات التطبيق الرئيسية
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);
  const [aiModels, setAiModels] = useState(aiEngine.getModelStatus());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [showDemo, setShowDemo] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [currentFolder, setCurrentFolder] = useState("all");
  const [showStats, setShowStats] = useState(true);
  const [autoOrganize, setAutoOrganize] = useState(false);
  const [theme, setTheme] = useState("light");
  const [aiThreshold, setAiThreshold] = useState([0.8]);
  const [processingSpeed, setProcessingSpeed] = useState("balanced");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [batchSize, setBatchSize] = useState([10]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  // دالة إضافة إشعار
  const addNotification = useCallback((notification: any) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    setNotifications((prev) => [...prev, newNotification]);

    // إزالة الإشعار تلقائياً بعد 5 ثوان
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  // تحميل البيانات التجريبية عند بدء التطبيق
  useEffect(() => {
    if (showDemo && images.length === 0) {
      addNotification({
        type: "info",
        title: "تحميل البيانات التجريبية",
        description: "جاري تحميل صور تجريبية لعرض إمكانيات التطبيق",
      });

      const demoFiles = DEMO_IMAGES.map((img) => ({
        ...img,
        file: new File([], img.name, { type: "image/jpeg" }),
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ),
        processedAt: new Date(),
      }));

      // محاكاة إضافة الصور التجريبية
      setTimeout(() => {
        // تحويل البيانات التجريبية لتتناسب مع useImageOrganizer
        const convertedFiles = demoFiles.map((file) => file.file);
        addImages(convertedFiles);

        addNotification({
          type: "success",
          title: "تم تحميل البيانات التجريبية",
          description: `تم تحميل ${demoFiles.length} صورة مع تحليل الذكاء الاصطناعي`,
        });

        // إضافة كونفيتي احتفالي
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 1500);
    }
  }, [showDemo, images.length, addImages, addNotification]);

  // تحديث نماذج الذكاء الاصطناعي
  useEffect(() => {
    const interval = setInterval(() => {
      setAiModels(aiEngine.getModelStatus());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // معالجة رفع الملفات
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        addImages(files);
        addNotification({
          type: "info",
          title: "بدء رفع الملفات",
          description: `جاري رفع ${files.length} ملف`,
        });
      }
    },
    [addImages, addNotification],
  );

  // تشغيل المعالجة
  const handleStartProcessing = useCallback(async () => {
    if (images.length === 0) {
      toast.error("لا توجد صور للمعالجة");
      return;
    }

    addNotification({
      type: "info",
      title: "بدء المعالجة",
      description: "جاري تشغيل خوارزميات الذكاء الاصطناعي",
    });

    try {
      await processImages();
      addNotification({
        type: "success",
        title: "اكتملت المعالجة",
        description: "تم تحليل جميع الصور بنجاح",
      });

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "خطأ في المعالجة",
        description: "حدث خطأ أثناء معالجة الصور",
      });
    }
  }, [images.length, processImages, addNotification]);

  // فلترة وترتيب الصور
  const filteredImages = images.filter((img) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        img.name.toLowerCase().includes(query) ||
        img.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        img.analysis?.description.toLowerCase().includes(query)
      );
    }
    if (currentFolder !== "all") {
      return img.category === currentFolder;
    }
    return true;
  });

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

  // إحصائيات متقدمة
  const advancedStats = {
    totalSize: images.reduce((sum, img) => sum + img.size, 0),
    averageConfidence:
      images.length > 0
        ? images.reduce(
            (sum, img) => sum + (img.analysis?.confidence || 0),
            0,
          ) / images.length
        : 0,
    faceCount: images.reduce(
      (sum, img) => sum + (img.analysis?.faces.length || 0),
      0,
    ),
    textImages: images.filter(
      (img) => img.analysis?.text.text && img.analysis.text.text.length > 10,
    ).length,
    nsfwImages: images.filter((img) => img.analysis?.isNSFW).length,
    duplicates: images.filter((img) => img.category === "duplicates").length,
    categoryDistribution: images.reduce(
      (acc, img) => {
        acc[img.category || "uncategorized"] =
          (acc[img.category || "uncategorized"] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };

  // عمليات مجمعة
  const handleBulkAction = (action: string) => {
    const selectedCount = selectedImages.size;

    switch (action) {
      case "delete":
        selectedImages.forEach((id) => removeImage(id));
        setSelectedImages(new Set());
        toast.success(`تم حذف ${selectedCount} صورة`);
        break;
      case "favorite":
        selectedImages.forEach((id) => favorites.add(id));
        setFavorites(new Set(favorites));
        toast.success(`تم إضافة ${selectedCount} صورة للمفضلة`);
        break;
      case "export":
        exportResults();
        toast.success(`تم تصدير ${selectedCount} صورة`);
        break;
    }
  };

  // تبديل المفضلة
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
        toast.info("تم إزالة من المفضلة");
      } else {
        newFavorites.add(id);
        toast.success("تم إضافة للمفضلة");
      }
      return newFavorites;
    });
  };

  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-300",
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 text-white"
          : "bg-gradient-to-br from-gray-50 via-white to-knoux-50",
      )}
    >
      {/* شريط الإشعارات المتحرك */}
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
              {notification.type === "info" && (
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-sm">{notification.title}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  {notification.description}
                </p>
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

      {/* الرأس المتطور */}
      <header className="border-b border-gray-200 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* العلامة التجارية */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-knoux-500 to-purple-600 rounded-xl shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-knoux-600 to-purple-600 bg-clip-text text-transparent">
                  Knoux SmartOrganizer PRO
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  الجيل الجديد من تنظيم الصور بالذكاء الاصطناعي
                </p>
              </div>
            </div>

            {/* شريط البحث المتقدم */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="البحث في الصور، العلامات، الأوصاف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-gray-800/50"
                />
              </div>
            </div>

            {/* أدوات التحكم */}
            <div className="flex items-center space-x-3">
              {/* مؤشر الحالة */}
              <div className="flex items-center space-x-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isProcessing
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-green-500",
                  )}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {isProcessing ? "معالجة..." : "جاهز"}
                </span>
              </div>

              {/* إعدادات المظهر */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? "🌙" : "☀️"}
              </Button>

              {/* الفلاتر */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && "bg-knoux-100 text-knoux-700")}
              >
                <Filter className="w-4 h-4 mr-2" />
                فلاتر
                {showFilters && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-knoux-500 rounded-full" />
                )}
              </Button>

              {/* طرق العرض */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* إعدادات متقدمة */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    الإعدادات
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    الإعدادات المتقدمة
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowStats(!showStats)}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    لوحة الإحصائيات
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setRealTimeMode(!realTimeMode)}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    الوضع الفوري
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAutoSave(!autoSave)}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    الحفظ التلقائي
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* الشريط الجانبي للفلاتر والتحكم */}
          <div
            className={cn(
              "lg:col-span-3 space-y-6",
              !showFilters && "hidden lg:block",
            )}
          >
            {/* أدوات الرفع */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  رفع الصور
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    className="w-full"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    اختر ملفات
                  </Button>
                  <Button
                    onClick={() =>
                      document.getElementById("folder-upload")?.click()
                    }
                    variant="outline"
                    className="w-full"
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    اختر مجلد
                  </Button>
                </div>

                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <input
                  id="folder-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Separator />

                {/* أزرار المعالجة */}
                <div className="space-y-2">
                  <Button
                    onClick={handleStartProcessing}
                    disabled={isProcessing || images.length === 0}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {isProcessing ? "جاري المعالجة..." : "ابدأ المعالجة"}
                  </Button>

                  {isProcessing && (
                    <Button
                      onClick={stopProcessing}
                      variant="outline"
                      className="w-full"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      إيقاف المعالجة
                    </Button>
                  )}

                  <Button
                    onClick={clearAll}
                    variant="destructive"
                    className="w-full"
                    disabled={images.length === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    مسح الكل
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* حالة نماذج الذكاء الاصطناعي */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cpu className="w-5 h-5 mr-2" />
                  نماذج الذكاء الاصطناعي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from(aiModels.values()).map((model) => (
                  <div key={model.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{model.name}</span>
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          model.loaded
                            ? "bg-green-500"
                            : model.loading
                              ? "bg-yellow-500 animate-pulse"
                              : "bg-red-500",
                        )}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {model.loaded
                        ? "جاهز"
                        : model.loading
                          ? "جاري التحميل..."
                          : "غير محمل"}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* الفلاتر */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  تصفية الصور
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>التصنيف</Label>
                  <Select
                    value={currentFolder}
                    onValueChange={setCurrentFolder}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الصور</SelectItem>
                      <SelectItem value="nature">طبيعة</SelectItem>
                      <SelectItem value="food">طعام</SelectItem>
                      <SelectItem value="selfies">صور شخصية</SelectItem>
                      <SelectItem value="documents">وثائق</SelectItem>
                      <SelectItem value="screenshots">لقطات شاشة</SelectItem>
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

                <div className="flex items-center space-x-2">
                  <Switch checked={showDemo} onCheckedChange={setShowDemo} />
                  <Label>عرض البيانات التجريبية</Label>
                </div>
              </CardContent>
            </Card>

            {/* الإعدادات المتقدمة */}
            {showAdvanced && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    إعدادات متقدمة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>عتبة الذكاء الاصطناعي: {aiThreshold[0]}%</Label>
                    <Slider
                      value={aiThreshold}
                      onValueChange={setAiThreshold}
                      max={100}
                      min={10}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>حجم الدفعة: {batchSize[0]}</Label>
                    <Slider
                      value={batchSize}
                      onValueChange={setBatchSize}
                      max={50}
                      min={1}
                      step={5}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>سرعة المعالجة</Label>
                    <Select
                      value={processingSpeed}
                      onValueChange={setProcessingSpeed}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">سريع</SelectItem>
                        <SelectItem value="balanced">متوازن</SelectItem>
                        <SelectItem value="accurate">دقيق</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={autoOrganize}
                        onCheckedChange={setAutoOrganize}
                      />
                      <Label>تنظيم تلقائي</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={realTimeMode}
                        onCheckedChange={setRealTimeMode}
                      />
                      <Label>معالجة فورية</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={autoSave}
                        onCheckedChange={setAutoSave}
                      />
                      <Label>حفظ تلقائي</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* المنطقة الرئيسية */}
          <div className="lg:col-span-9 space-y-6">
            {/* شريط التقدم */}
            {isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {progress.stage}: {progress.message}
                      </span>
                      <span className="text-sm text-gray-500">
                        {progress.current} / {progress.total}
                      </span>
                    </div>
                    <Progress
                      value={(progress.current / progress.total) * 100}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* الإحصائيات */}
            {showStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="w-8 h-8 text-blue-500" />
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
                        <p className="text-xs text-gray-500">معالجة</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Users className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {advancedStats.faceCount}
                        </p>
                        <p className="text-xs text-gray-500">وجه مكتشف</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-8 h-8 text-red-500" />
                      <div>
                        <p className="text-2xl font-bold">{favorites.size}</p>
                        <p className="text-xs text-gray-500">مفضلة</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* إحصائيات متقدمة */}
            {showStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    تحليلات متقدمة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">
                        {(advancedStats.totalSize / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <p className="text-xs text-gray-500">الحجم الإجمالي</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {Math.round(advancedStats.averageConfidence * 100)}%
                      </p>
                      <p className="text-xs text-gray-500">متوسط الدقة</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">
                        {advancedStats.textImages}
                      </p>
                      <p className="text-xs text-gray-500">صور تحتوي نص</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* أدوات الإجراءات المجمعة */}
            {selectedImages.size > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      تم تحديد {selectedImages.size} صورة
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleBulkAction("favorite")}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        إضافة للمفضلة
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction("export")}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        تصدير
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleBulkAction("delete")}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* عرض الصور */}
            {sortedImages.length > 0 ? (
              <div className="space-y-4">
                {/* معلومات العرض */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    عرض {sortedImages.length} من {images.length} صورة
                    {searchQuery && ` • البحث: "${searchQuery}"`}
                    {currentFolder !== "all" && ` • المجلد: ${currentFolder}`}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedImages(
                          new Set(sortedImages.map((img) => img.id)),
                        )
                      }
                    >
                      تحديد الكل
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={exportResults}>
                          <Download className="w-4 h-4 mr-2" />
                          تصدير الكل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={clearAll}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          حذف الكل
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* شبكة الصور */}
                <div
                  className={cn(
                    "grid gap-4",
                    viewMode === "grid"
                      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
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
                        <Card
                          className={cn(
                            "overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer",
                            selectedImages.has(image.id) &&
                              "ring-2 ring-knoux-500 ring-offset-2",
                            viewMode === "list" && "flex flex-row",
                          )}
                        >
                          {/* منطق�� الصورة */}
                          <div
                            className={cn(
                              "relative aspect-square bg-gray-100 dark:bg-gray-800",
                              viewMode === "list" && "w-32 h-32 flex-shrink-0",
                            )}
                          >
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-full h-full object-cover"
                              onClick={() => setPreviewImage(image)}
                            />

                            {/* حالة المعالجة */}
                            <div className="absolute top-2 right-2">
                              {image.processed ? (
                                <div className="bg-green-500 rounded-full p-1">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                              ) : (
                                <div className="bg-yellow-500 rounded-full p-1">
                                  <Clock className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>

                            {/* تصنيف الصورة */}
                            {image.category && (
                              <div className="absolute top-2 left-2">
                                <Badge className="text-xs px-2 py-1">
                                  {image.category}
                                </Badge>
                              </div>
                            )}

                            {/* أدوات سريعة */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(image.id);
                                }}
                                className={cn(
                                  favorites.has(image.id) && "text-red-500",
                                )}
                              >
                                <Heart className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage(image);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(image.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* مربع التحديد */}
                            <div className="absolute bottom-2 left-2">
                              <input
                                type="checkbox"
                                checked={selectedImages.has(image.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedImages);
                                  if (e.target.checked) {
                                    newSelected.add(image.id);
                                  } else {
                                    newSelected.delete(image.id);
                                  }
                                  setSelectedImages(newSelected);
                                }}
                                className="w-4 h-4 text-knoux-600 rounded"
                              />
                            </div>
                          </div>

                          {/* معلومات الصورة */}
                          <div
                            className={cn(
                              "p-3",
                              viewMode === "list" &&
                                "flex-1 flex flex-col justify-between",
                            )}
                          >
                            <div>
                              <h4
                                className="font-medium text-sm truncate mb-1"
                                title={image.name}
                              >
                                {image.name}
                              </h4>

                              <div className="text-xs text-gray-500 space-y-1">
                                <div>
                                  {(image.size / 1024 / 1024).toFixed(1)} MB
                                </div>

                                {image.analysis && (
                                  <div className="space-y-1">
                                    <div className="truncate">
                                      {image.analysis.description}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <span>دقة:</span>
                                      <div className="flex-1 bg-gray-200 rounded-full h-1">
                                        <div
                                          className="bg-green-500 h-1 rounded-full"
                                          style={{
                                            width: `${image.analysis.confidence * 100}%`,
                                          }}
                                        />
                                      </div>
                                      <span>
                                        {Math.round(
                                          image.analysis.confidence * 100,
                                        )}
                                        %
                                      </span>
                                    </div>

                                    {image.analysis.faces.length > 0 && (
                                      <div className="flex items-center space-x-1">
                                        <Users className="w-3 h-3" />
                                        <span>
                                          {image.analysis.faces.length} وجه
                                        </span>
                                      </div>
                                    )}

                                    {image.analysis.text.text && (
                                      <div className="flex items-center space-x-1">
                                        <FileText className="w-3 h-3" />
                                        <span>نص مكتشف</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* العلامات */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {image.tags.slice(0, 3).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {image.tags.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      +{image.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* أيقونات الحالة */}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex space-x-1">
                                {favorites.has(image.id) && (
                                  <Heart className="w-3 h-3 text-red-500 fill-current" />
                                )}
                                {bookmarks.has(image.id) && (
                                  <Bookmark className="w-3 h-3 text-blue-500 fill-current" />
                                )}
                              </div>
                              <div className="text-xs text-gray-400">
                                {image.createdAt.toLocaleDateString("ar")}
                              </div>
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
                    <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">لا توجد صور</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        ارفع صور لبدء التنظيم الذكي بالذكاء الاصطناعي
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة صور
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* معاينة الصورة */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden max-w-6xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium">{previewImage.name}</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(previewImage.id)}
                    className={cn(
                      favorites.has(previewImage.id) && "text-red-500",
                    )}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewImage(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex max-h-[calc(90vh-120px)]">
                {/* منطقة الصورة */}
                <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800">
                  <img
                    src={previewImage.url}
                    alt={previewImage.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* لوحة التحليل */}
                <div className="w-80 p-4 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-2 text-purple-500" />
                        تحليل الذكاء الاصطناعي
                      </h4>

                      {previewImage.analysis ? (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-gray-500">
                              الوصف
                            </Label>
                            <p className="text-sm mt-1">
                              {previewImage.analysis.description}
                            </p>
                          </div>

                          <div>
                            <Label className="text-xs text-gray-500">
                              دقة التحليل
                            </Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Progress
                                value={previewImage.analysis.confidence * 100}
                                className="flex-1 h-2"
                              />
                              <span className="text-xs font-medium">
                                {Math.round(
                                  previewImage.analysis.confidence * 100,
                                )}
                                %
                              </span>
                            </div>
                          </div>

                          {previewImage.analysis.faces.length > 0 && (
                            <div>
                              <Label className="text-xs text-gray-500">
                                الوجوه المكتشفة
                              </Label>
                              <div className="mt-1 space-y-2">
                                {previewImage.analysis.faces.map((face, i) => (
                                  <div
                                    key={i}
                                    className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded"
                                  >
                                    <div>
                                      الثقة: {Math.round(face.confidence * 100)}
                                      %
                                    </div>
                                    {face.age && (
                                      <div>العمر: ~{face.age} سنة</div>
                                    )}
                                    {face.gender && (
                                      <div>الجنس: {face.gender}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {previewImage.analysis.text.text && (
                            <div>
                              <Label className="text-xs text-gray-500">
                                النص المستخرج
                              </Label>
                              <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                                {previewImage.analysis.text.text}
                              </div>
                            </div>
                          )}

                          <div>
                            <Label className="text-xs text-gray-500">
                              الألوان السائدة
                            </Label>
                            <div className="flex space-x-1 mt-1">
                              {previewImage.analysis.dominantColors.map(
                                (color, i) => (
                                  <div
                                    key={i}
                                    className="w-6 h-6 rounded border"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          لم يتم تحليل هذه الصورة بعد
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <Tag className="w-4 h-4 mr-2 text-blue-500" />
                        العلامات
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {previewImage.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <Info className="w-4 h-4 mr-2 text-gray-500" />
                        معلومات الملف
                      </h4>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div>
                          الحجم: {(previewImage.size / 1024 / 1024).toFixed(1)}{" "}
                          MB
                        </div>
                        <div>
                          التصنيف: {previewImage.category || "غير مصنف"}
                        </div>
                        <div>
                          تاريخ الإضافة:{" "}
                          {previewImage.createdAt.toLocaleDateString("ar")}
                        </div>
                        {previewImage.processedAt && (
                          <div>
                            تاريخ المعالجة:{" "}
                            {previewImage.processedAt.toLocaleDateString("ar")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
