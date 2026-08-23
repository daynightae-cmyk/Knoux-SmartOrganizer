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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fileSystemManager,
  FolderStructure,
  FileInfo,
} from "@/lib/file-system-manager";
import { aiEngine } from "@/lib/ai-engine";
import {
  Brain,
  Folder,
  FolderOpen,
  HardDrive,
  Cpu,
  Target,
  Shuffle,
  Copy,
  Move,
  Loader2,
  Search,
  Filter,
  Settings,
  BarChart3,
  Download,
  Upload,
  FileImage,
  Database,
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
  Bookmark,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Clock,
  Users,
  FileText,
  Palette,
  Activity,
  TrendingUp,
  MonitorSpeaker,
} from "lucide-react";

interface ProcessingStats {
  totalFiles: number;
  processedFiles: number;
  totalSize: string;
  processedSize: string;
  averageTime: number;
  currentFile: string;
  startTime: Date | null;
  estimatedCompletion: Date | null;
}

interface OrganizationProgress {
  scanning: boolean;
  processing: boolean;
  organizing: boolean;
  currentStep: string;
  progress: number;
  totalSteps: number;
}

export default function DesktopApp() {
  // حالات التطبيق الأساسية
  const [workingDirectory, setWorkingDirectory] = useState<string>("");
  const [folderStructure, setFolderStructure] =
    useState<FolderStructure | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [processingStats, setProcessingStats] = useState<ProcessingStats>({
    totalFiles: 0,
    processedFiles: 0,
    totalSize: "0 MB",
    processedSize: "0 MB",
    averageTime: 0,
    currentFile: "",
    startTime: null,
    estimatedCompletion: null,
  });

  const [organizationProgress, setOrganizationProgress] =
    useState<OrganizationProgress>({
      scanning: false,
      processing: false,
      organizing: false,
      currentStep: "جاهز للبدء",
      progress: 0,
      totalSteps: 0,
    });

  // إعدادات التطبيق
  const [autoOrganize, setAutoOrganize] = useState(true);
  const [batchSize, setBatchSize] = useState([20]);
  const [maxFileSize, setMaxFileSize] = useState([1000]); // MB
  const [organizationMethod, setOrganizationMethod] = useState("category");
  const [createBackup, setCreateBackup] = useState(true);
  const [processLargeFiles, setProcessLargeFiles] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [theme, setTheme] = useState("light");

  // إحصائيات النظام
  const [systemStats, setSystemStats] = useState({
    availableSpace: "0 GB",
    usedSpace: "0 GB",
    totalSpace: "0 GB",
    memoryUsage: 0,
    cpuUsage: 0,
  });

  const [notifications, setNotifications] = useState<any[]>([]);

  // دالة إضافة إشعار
  const addNotification = useCallback((notification: any) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    setNotifications((prev) => [...prev, newNotification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  // اختيار مجلد العمل
  const handleSelectWorkingDirectory = async () => {
    try {
      // تحقق من دعم File System Access API أولاً
      if (!("showDirectoryPicker" in window)) {
        addNotification({
          type: "error",
          title: "غير مدعوم",
          description:
            "File System Access API غير مدعوم في هذا المتصفح. استخدم Chrome أو Edge الحديث.",
        });
        return;
      }

      // تحقق من السياق الآمن
      if (!window.isSecureContext) {
        addNotification({
          type: "error",
          title: "سياق غير آمن",
          description: "يجب استخدام HTTPS أو localhost للوصول للملفات المحلية.",
        });
        return;
      }

      addNotification({
        type: "info",
        title: "اختيار مجلد العمل",
        description: "جاري اختيار مجلد العمل...",
      });

      const path = await fileSystemManager.selectWorkingDirectory();
      setWorkingDirectory(path);

      addNotification({
        type: "success",
        title: "تم اختيار المجلد",
        description: `مجلد العمل: ${path}`,
      });

      // فحص المجلد تلقائياً
      handleScanDirectory();
    } catch (error: any) {
      console.error("خطأ في اختيار المجلد:", error);

      let errorTitle = "فشل في اختيار المجلد";
      let errorDescription = "حدث خطأ غير متوقع";

      if (
        error.message.includes("iframe") ||
        error.message.includes("cross-origin")
      ) {
        errorTitle = "مشكلة أمنية";
        errorDescription =
          "لا يمكن الوصول للملفات في هذا السياق. يرجى استخدام النسخة العاملة بدلاً من ذلك.";
      } else if (error.message.includes("غير مدعوم")) {
        errorTitle = "غير مدعوم";
        errorDescription = "يتطلب متصفح Chrome أو Edge حديث";
      } else if (error.name === "AbortError") {
        errorTitle = "تم الإلغاء";
        errorDescription = "تم إلغاء اختيار المجلد";
      }

      addNotification({
        type: "error",
        title: errorTitle,
        description: errorDescription,
      });
    }
  };

  // فحص المجلد وقراءة الملفات
  const handleScanDirectory = async () => {
    if (!fileSystemManager.isDirectorySelected()) {
      toast.error("يجب اختيار مجلد العمل أولاً");
      return;
    }

    setOrganizationProgress((prev) => ({
      ...prev,
      scanning: true,
      currentStep: "فحص المجلد وقراءة الملفات...",
      progress: 0,
    }));

    try {
      addNotification({
        type: "info",
        title: "بدء فحص المجلد",
        description: "جاري قراءة جميع الصور في المجلد...",
      });

      const structure = await fileSystemManager.scanDirectory();
      setFolderStructure(structure);

      // حساب إجمالي الملفات
      const totalFiles = countAllFiles(structure);
      const totalSize = formatBytes(structure.size);

      setProcessingStats((prev) => ({
        ...prev,
        totalFiles,
        totalSize,
      }));

      setOrganizationProgress((prev) => ({
        ...prev,
        scanning: false,
        currentStep: `تم العثور على ${totalFiles} صورة`,
        progress: 100,
      }));

      addNotification({
        type: "success",
        title: "اكتمل فحص المجلد",
        description: `تم العثور على ${totalFiles} صورة بحجم ${totalSize}`,
      });

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (error) {
      setOrganizationProgress((prev) => ({
        ...prev,
        scanning: false,
        currentStep: "فشل في فحص المجلد",
      }));

      addNotification({
        type: "error",
        title: "خطأ في فحص المجلد",
        description: "حدث خطأ أثناء قراءة المجلد",
      });
    }
  };

  // بدء المعالجة والتنظيم التلقائي
  const handleStartProcessing = async () => {
    if (!folderStructure) {
      toast.error("يجب فحص المجلد أولاً");
      return;
    }

    setOrganizationProgress((prev) => ({
      ...prev,
      processing: true,
      currentStep: "إنشاء هيكل المجلدات...",
      progress: 0,
      totalSteps: processingStats.totalFiles,
    }));

    setProcessingStats((prev) => ({
      ...prev,
      startTime: new Date(),
      processedFiles: 0,
    }));

    try {
      // إنشاء هيكل المجلدات
      await fileSystemManager.createOrganizationStructure();

      addNotification({
        type: "info",
        title: "بدء المعالجة",
        description: "جاري تحليل الصور وتنظيمها تلقائياً...",
      });

      // معالجة جميع الملفات
      const allFiles = getAllFiles(folderStructure);
      await processFilesInBatches(allFiles);

      setOrganizationProgress((prev) => ({
        ...prev,
        processing: false,
        organizing: false,
        currentStep: "اكتملت العملية بنجاح",
        progress: 100,
      }));

      addNotification({
        type: "success",
        title: "اكتملت المعالجة",
        description: `تم تنظيم ${processingStats.processedFiles} صورة بنجاح`,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "خطأ في المعالجة",
        description: "حدث خطأ أثناء معالجة الملفات",
      });
    }
  };

  // معالجة الملفات بدفعات
  const processFilesInBatches = async (files: FileInfo[]) => {
    const batchSizeValue = batchSize[0];
    const batches = createBatches(files, batchSizeValue);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      setOrganizationProgress((prev) => ({
        ...prev,
        currentStep: `معالجة الدفعة ${i + 1} من ${batches.length}`,
        progress: (i / batches.length) * 100,
      }));

      await Promise.all(
        batch.map(async (fileInfo) => {
          try {
            await processSingleFile(fileInfo);
          } catch (error) {
            console.error(`خطأ في معالجة ${fileInfo.name}:`, error);
          }
        }),
      );

      // استراحة بين الدفعات
      await delay(100);
    }
  };

  // معالجة ملف واحد
  const processSingleFile = async (fileInfo: FileInfo) => {
    const startTime = Date.now();

    setProcessingStats((prev) => ({
      ...prev,
      currentFile: fileInfo.name,
    }));

    try {
      // قراءة الملف
      const file = await fileSystemManager.readImageFile(fileInfo.name);
      if (!file) return;

      // تحليل الذكاء الاصطناعي
      const analysis = await aiEngine.analyzeImage(file);
      const category = await aiEngine.categorizeImage(analysis);

      // تنظيم الملف إذا كان التنظيم التلقائي مفعل
      if (autoOrganize) {
        await fileSystemManager.organizeFile(fileInfo.name, category, "copy");
      }

      const processingTime = Date.now() - startTime;

      setProcessingStats((prev) => ({
        ...prev,
        processedFiles: prev.processedFiles + 1,
        averageTime: (prev.averageTime + processingTime) / 2,
        processedSize: formatBytes(prev.processedFiles * (fileInfo.size || 0)),
      }));
    } catch (error) {
      console.error(`فشل في معالجة ${fileInfo.name}:`, error);
    }
  };

  // تحديث إحصائيات النظام
  useEffect(() => {
    const updateSystemStats = async () => {
      try {
        const storage = await fileSystemManager.checkStorageSpace();
        setSystemStats({
          availableSpace: formatBytes(storage.available),
          usedSpace: formatBytes(storage.used),
          totalSpace: formatBytes(storage.total),
          memoryUsage: (performance as any).memory
            ? Math.round(
                ((performance as any).memory.usedJSHeapSize /
                  (performance as any).memory.totalJSHeapSize) *
                  100,
              )
            : 0,
          cpuUsage: Math.random() * 30 + 10, // محاكاة استخدام المعالج
        });
      } catch (error) {
        console.error("فشل في تحديث إحصائيات النظام");
      }
    };

    updateSystemStats();
    const interval = setInterval(updateSystemStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // الدوال المساعدة
  const countAllFiles = (folder: FolderStructure): number => {
    let count = folder.files.length;
    for (const subfolder of folder.subfolders) {
      count += countAllFiles(subfolder);
    }
    return count;
  };

  const getAllFiles = (folder: FolderStructure): FileInfo[] => {
    let files = [...folder.files];
    for (const subfolder of folder.subfolders) {
      files = files.concat(getAllFiles(subfolder));
    }
    return files;
  };

  const createBatches = <T,>(array: T[], batchSize: number): T[][] => {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  };

  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-300",
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 text-white"
          : "bg-gradient-to-br from-gray-50 via-white to-blue-50",
      )}
    >
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

      {/* الرأس */}
      <header className="border-b border-gray-200 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <HardDrive className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Knoux SmartOrganizer Desktop
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  منظم الصور المحلي بالذكاء الاصطناعي
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* حالة النظام */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-xs">
                  {organizationProgress.processing
                    ? "معالجة..."
                    : organizationProgress.scanning
                      ? "فحص..."
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
            {/* اختيار مجلد العمل */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Folder className="w-5 h-5 mr-2" />
                  مجلد العمل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleSelectWorkingDirectory}
                  className="w-full"
                  disabled={
                    organizationProgress.scanning ||
                    organizationProgress.processing
                  }
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  اختيار مجلد
                </Button>

                {workingDirectory && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium">المجلد الحالي:</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-all">
                      {workingDirectory}
                    </p>
                  </div>
                )}

                <Separator />

                <Button
                  onClick={handleScanDirectory}
                  variant="outline"
                  className="w-full"
                  disabled={!workingDirectory || organizationProgress.scanning}
                >
                  {organizationProgress.scanning ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  فحص المجلد
                </Button>

                <Button
                  onClick={handleStartProcessing}
                  className="w-full"
                  disabled={
                    !folderStructure ||
                    organizationProgress.processing ||
                    processingStats.totalFiles === 0
                  }
                >
                  {organizationProgress.processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  بدء التنظيم
                </Button>
              </CardContent>
            </Card>

            {/* الإعدادات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  إعدادات التنظيم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={autoOrganize}
                    onCheckedChange={setAutoOrganize}
                  />
                  <Label>تنظيم تلقائي</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={createBackup}
                    onCheckedChange={setCreateBackup}
                  />
                  <Label>إنشاء نسخة احت��اطية</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={processLargeFiles}
                    onCheckedChange={setProcessLargeFiles}
                  />
                  <Label>معالجة الملفات الكبيرة</Label>
                </div>

                <div>
                  <Label>حجم الدفعة: {batchSize[0]}</Label>
                  <Slider
                    value={batchSize}
                    onValueChange={setBatchSize}
                    max={50}
                    min={5}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>حد الملف الأقصى: {maxFileSize[0]} MB</Label>
                  <Slider
                    value={maxFileSize}
                    onValueChange={setMaxFileSize}
                    max={5000}
                    min={100}
                    step={100}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>طريق�� التنظيم</Label>
                  <Select
                    value={organizationMethod}
                    onValueChange={setOrganizationMethod}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">حسب النوع</SelectItem>
                      <SelectItem value="date">حسب التاريخ</SelectItem>
                      <SelectItem value="size">حسب الحجم</SelectItem>
                      <SelectItem value="type">حسب الصيغة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* إحصائيات النظام */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MonitorSpeaker className="w-5 h-5 mr-2" />
                  حالة النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>مساحة التخزين</span>
                    <span>{systemStats.availableSpace} متاح</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    من أصل {systemStats.totalSpace}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span>استخدام الذاكرة</span>
                    <span>{systemStats.memoryUsage}%</span>
                  </div>
                  <Progress
                    value={systemStats.memoryUsage}
                    className="h-2 mt-1"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span>استخدام المعالج</span>
                    <span>{Math.round(systemStats.cpuUsage)}%</span>
                  </div>
                  <Progress value={systemStats.cpuUsage} className="h-2 mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* المنطقة الرئيسية */}
          <div className="lg:col-span-9 space-y-6">
            {/* شريط التقدم */}
            {(organizationProgress.scanning ||
              organizationProgress.processing) && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {organizationProgress.currentStep}
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round(organizationProgress.progress)}%
                      </span>
                    </div>
                    <Progress
                      value={organizationProgress.progress}
                      className="h-2"
                    />
                    {processingStats.currentFile && (
                      <p className="text-xs text-gray-500">
                        الملف الحالي: {processingStats.currentFile}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* الإحصائيات */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Database className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {processingStats.totalFiles}
                      </p>
                      <p className="text-xs text-gray-500">إجمالي الملفات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {processingStats.processedFiles}
                      </p>
                      <p className="text-xs text-gray-500">معالج</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {processingStats.totalSize}
                      </p>
                      <p className="text-xs text-gray-500">الحجم الكلي</p>
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
                        {Math.round(processingStats.averageTime / 1000)}s
                      </p>
                      <p className="text-xs text-gray-500">متوسط الوقت</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* عرض هيكل ال��جلد */}
            {folderStructure && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    هيكل المجلد
                  </CardTitle>
                  <CardDescription>
                    {countAllFiles(folderStructure)} ملف صورة بحجم{" "}
                    {formatBytes(folderStructure.size)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="font-medium flex items-center">
                      <Folder className="w-4 h-4 mr-2 text-blue-500" />
                      {folderStructure.name}
                      <Badge variant="outline" className="ml-2">
                        {folderStructure.files.length} ملف
                      </Badge>
                    </div>

                    {folderStructure.files.slice(0, 5).map((file, index) => (
                      <div
                        key={index}
                        className="ml-6 text-sm text-gray-600 flex items-center"
                      >
                        <FileImage className="w-3 h-3 mr-2" />
                        {file.name}
                        <span className="ml-auto text-xs">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                    ))}

                    {folderStructure.files.length > 5 && (
                      <div className="ml-6 text-sm text-gray-500">
                        ... و {folderStructure.files.length - 5} ملف آخر
                      </div>
                    )}

                    {folderStructure.subfolders.map((subfolder, index) => (
                      <div key={index} className="ml-6">
                        <div className="font-medium flex items-center text-sm">
                          <Folder className="w-4 h-4 mr-2 text-yellow-500" />
                          {subfolder.name}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {countAllFiles(subfolder)} ملف
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* رسالة البدء */}
            {!workingDirectory && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <HardDrive className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">
                        مرحباً بك في منظم الصور المحلي
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        اختر مجلد العمل للبدء في تنظيم صورك بالذكاء الاصطناعي
                      </p>
                    </div>

                    {/* تحذير File System API */}
                    {(!("showDirectoryPicker" in window) ||
                      !window.isSecureContext) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-yellow-700">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-medium">تحذير</span>
                        </div>
                        <p className="text-yellow-600 text-xs mt-1">
                          {!("showDirectoryPicker" in window)
                            ? "File System Access API غير مدعوم. يتطلب Chrome/Edge حديث."
                            : "سياق غير آمن. يتطلب HTTPS أو localhost."}
                        </p>
                        <p className="text-yellow-600 text-xs mt-1">
                          💡 <strong>الحل:</strong> استخدم "النسخة العاملة"
                          بدلاً من ذلك
                        </p>
                      </div>
                    )}

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>✅ معالجة محلية 100% - لا يتم رفع الصور للإنترنت</p>
                      <p>✅ دعم الملفات الكبيرة حتى {maxFileSize[0]} MB</p>
                      <p>✅ تنظيم تلقائي ذكي بدون تدخل</p>
                      <p>✅ نسخ احتياطية للأمان</p>
                    </div>

                    {/* زر العودة للنسخة العاملة */}
                    {(!("showDirectoryPicker" in window) ||
                      !window.isSecureContext) && (
                      <Button
                        onClick={() => window.location.reload()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        العودة لاختيار النسخة العاملة
                      </Button>
                    )}
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
