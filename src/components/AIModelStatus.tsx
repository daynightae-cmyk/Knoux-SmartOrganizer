import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Brain,
  Eye,
  Users,
  FileText,
  Shield,
  Palette,
  Camera,
  Zap,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Download,
  WifiOff,
  Wifi,
  HardDrive,
  Cloud,
  Activity,
} from "lucide-react";

interface AIModel {
  id: string;
  name: string;
  description: string;
  version: string;
  size: number; // في MB
  status: "not_loaded" | "loading" | "loaded" | "error" | "updating";
  progress: number;
  capabilities: string[];
  icon: React.ComponentType<any>;
  color: string;
  priority: number;
  dependencies: string[];
  lastUsed?: Date;
  accuracy?: number;
  performance?: number;
  memoryUsage?: number;
}

const AI_MODELS: AIModel[] = [
  {
    id: "mobilenet",
    name: "MobileNet",
    description: "تصنيف الصور والكائنات",
    version: "2.1.0",
    size: 16.9,
    status: "not_loaded",
    progress: 0,
    capabilities: ["تصنيف الصور", "كشف الكائنات", "تحليل المشاهد"],
    icon: Camera,
    color: "bg-blue-500",
    priority: 1,
    dependencies: [],
    accuracy: 0.87,
    performance: 0.92,
  },
  {
    id: "face-api",
    name: "Face API",
    description: "كشف وتحليل الوجوه",
    version: "0.22.2",
    size: 6.2,
    status: "not_loaded",
    progress: 0,
    capabilities: ["كشف الوجوه", "تحليل المشاعر", "تقدير العمر", "تحديد الجنس"],
    icon: Users,
    color: "bg-green-500",
    priority: 2,
    dependencies: [],
    accuracy: 0.91,
    performance: 0.88,
  },
  {
    id: "nsfw-detector",
    name: "NSFW Detector",
    description: "كشف المحتوى الحساس",
    version: "3.0.0",
    size: 4.1,
    status: "not_loaded",
    progress: 0,
    capabilities: ["كشف المحتوى", "تصنيف الأمان", "مرشح المحتوى"],
    icon: Shield,
    color: "bg-red-500",
    priority: 3,
    dependencies: ["mobilenet"],
    accuracy: 0.94,
    performance: 0.89,
  },
  {
    id: "ocr-engine",
    name: "OCR Engine",
    description: "استخراج النصوص",
    version: "4.1.1",
    size: 2.8,
    status: "not_loaded",
    progress: 0,
    capabilities: ["قراءة النصوص", "كشف اللغات", "تحليل المستندات"],
    icon: FileText,
    color: "bg-purple-500",
    priority: 4,
    dependencies: [],
    accuracy: 0.85,
    performance: 0.91,
  },
  {
    id: "color-analyzer",
    name: "Color Analyzer",
    description: "تحليل الألوا��",
    version: "1.2.0",
    size: 1.5,
    status: "not_loaded",
    progress: 0,
    capabilities: ["استخراج الألوان", "تحليل التباين", "نظرية الألوان"],
    icon: Palette,
    color: "bg-pink-500",
    priority: 5,
    dependencies: [],
    accuracy: 0.96,
    performance: 0.95,
  },
  {
    id: "quality-assessor",
    name: "Quality Assessor",
    description: "تقييم جودة الصورة",
    version: "2.0.1",
    size: 3.2,
    status: "not_loaded",
    progress: 0,
    capabilities: ["تقييم الحدة", "كشف الضوضاء", "تحليل التعرض"],
    icon: Eye,
    color: "bg-yellow-500",
    priority: 6,
    dependencies: [],
    accuracy: 0.88,
    performance: 0.93,
  },
];

interface AIModelStatusProps {
  onModelStatusChange?: (modelId: string, status: string) => void;
  autoLoad?: boolean;
  showDetails?: boolean;
}

export function AIModelStatus({
  onModelStatusChange,
  autoLoad = false,
  showDetails = true,
}: AIModelStatusProps) {
  const [models, setModels] = useState<AIModel[]>(AI_MODELS);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [totalProgress, setTotalProgress] = useState(0);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  // مراقبة حالة الاتصال
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // تحميل تلقائي عند بدء التشغيل
  useEffect(() => {
    if (autoLoad && isOnline) {
      loadAllModels();
    }
  }, [autoLoad, isOnline]);

  // حساب التقدم الإجمالي
  useEffect(() => {
    const totalModels = models.length;
    const loadedModels = models.filter(
      (m) => m.status === "loaded" || m.status === "error",
    ).length;
    const loadingProgress = models.reduce(
      (sum, m) => sum + (m.status === "loading" ? m.progress : 0),
      0,
    );

    const progress =
      totalModels === 0
        ? 0
        : ((loadedModels * 100 + loadingProgress) / totalModels / 100) * 100;

    setTotalProgress(progress);
  }, [models]);

  const updateModelStatus = (
    modelId: string,
    status: AIModel["status"],
    progress = 0,
    additionalData?: Partial<AIModel>,
  ) => {
    setModels((prev) =>
      prev.map((model) =>
        model.id === modelId
          ? { ...model, status, progress, ...additionalData }
          : model,
      ),
    );
    onModelStatusChange?.(modelId, status);
  };

  const loadModel = async (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    if (!model || model.status === "loading" || model.status === "loaded") {
      return;
    }

    // تحقق من التبعيات
    for (const depId of model.dependencies) {
      const dependency = models.find((m) => m.id === depId);
      if (!dependency || dependency.status !== "loaded") {
        await loadModel(depId);
      }
    }

    updateModelStatus(modelId, "loading", 0);

    try {
      // محاكاة تحميل النموذج
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        updateModelStatus(modelId, "loading", progress);
      }

      // محاكاة ته��ئة النموذج
      await new Promise((resolve) => setTimeout(resolve, 500));

      updateModelStatus(modelId, "loaded", 100, {
        lastUsed: new Date(),
        memoryUsage: Math.random() * 50 + 10, // 10-60 MB
      });
    } catch (error) {
      console.error(`Failed to load model ${modelId}:`, error);
      updateModelStatus(modelId, "error", 0);
    }
  };

  const loadAllModels = async () => {
    if (!isOnline) return;

    setIsLoadingAll(true);

    try {
      // ترتيب النماذج حسب الأولوية
      const sortedModels = [...models].sort((a, b) => a.priority - b.priority);

      // تحميل النماذج بالتوازي (مع مراعاة التبعيات)
      const loadPromises = sortedModels.map((model) => loadModel(model.id));
      await Promise.all(loadPromises);
    } catch (error) {
      console.error("Failed to load all models:", error);
    } finally {
      setIsLoadingAll(false);
    }
  };

  const unloadModel = (modelId: string) => {
    updateModelStatus(modelId, "not_loaded", 0, {
      lastUsed: undefined,
      memoryUsage: 0,
    });
  };

  const unloadAllModels = () => {
    setModels((prev) =>
      prev.map((model) => ({
        ...model,
        status: "not_loaded" as const,
        progress: 0,
        lastUsed: undefined,
        memoryUsage: 0,
      })),
    );
  };

  const getStatusColor = (status: AIModel["status"]) => {
    switch (status) {
      case "loaded":
        return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "loading":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/20";
      case "error":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      case "updating":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-800";
    }
  };

  const getStatusIcon = (status: AIModel["status"]) => {
    switch (status) {
      case "loaded":
        return <CheckCircle className="w-4 h-4" />;
      case "loading":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "error":
        return <AlertTriangle className="w-4 h-4" />;
      case "updating":
        return <Download className="w-4 h-4 animate-bounce" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: AIModel["status"]) => {
    switch (status) {
      case "loaded":
        return "محمل";
      case "loading":
        return "جاري التحميل";
      case "error":
        return "خطأ";
      case "updating":
        return "جاري التحديث";
      default:
        return "غير محمل";
    }
  };

  const loadedModels = models.filter((m) => m.status === "loaded").length;
  const totalSize = models.reduce((sum, model) => sum + model.size, 0);
  const loadedSize = models
    .filter((m) => m.status === "loaded")
    .reduce((sum, model) => sum + model.size, 0);
  const totalMemoryUsage = models.reduce(
    (sum, model) => sum + (model.memoryUsage || 0),
    0,
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <span>حالة نماذج الذكاء الاصطناعي</span>
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {loadedModels}/{models.length} محمل
            </Badge>
            {isLoadingAll && (
              <Badge variant="secondary" className="text-xs">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                تحميل...
              </Badge>
            )}
          </div>
        </CardTitle>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-blue-500" />
            <span>
              {loadedSize.toFixed(1)}/{totalSize.toFixed(1)} MB
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span>{totalMemoryUsage.toFixed(1)} MB RAM</span>
          </div>
          <div className="flex items-center space-x-2">
            <Cloud className="w-4 h-4 text-purple-500" />
            <span>{isOnline ? "متصل" : "غير متصل"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>
              {Math.round(
                (models
                  .filter((m) => m.status === "loaded")
                  .reduce((sum, m) => sum + (m.performance || 0), 0) /
                  loadedModels) *
                  100,
              )}
              % أداء
            </span>
          </div>
        </div>

        {/* شريط التقدم الإجمالي */}
        {isLoadingAll && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>التقدم الإجمالي</span>
              <span>{Math.round(totalProgress)}%</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* أزرار التحكم */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={loadAllModels}
            disabled={!isOnline || isLoadingAll}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            تحميل جميع النماذج
          </Button>

          <Button
            onClick={unloadAllModels}
            variant="outline"
            size="sm"
            disabled={loadedModels === 0}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            إلغاء تحميل الكل
          </Button>

          {!isOnline && (
            <Badge variant="destructive" className="text-xs">
              <WifiOff className="w-3 h-3 mr-1" />
              مطلوب اتصال بالإنترنت
            </Badge>
          )}
        </div>

        <Separator />

        {/* قائمة النماذج */}
        <div className="space-y-3">
          {models.map((model) => {
            const IconComponent = model.icon;
            const isExpanded = expandedModel === model.id;

            return (
              <motion.div
                key={model.id}
                layout
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedModel(isExpanded ? null : model.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                        model.color,
                      )}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-500">
                        {model.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getStatusColor(model.status))}
                    >
                      {getStatusIcon(model.status)}
                      <span className="mr-1">
                        {getStatusText(model.status)}
                      </span>
                    </Badge>

                    {model.status === "loading" && (
                      <Badge variant="outline" className="text-xs">
                        {model.progress}%
                      </Badge>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0"
                      disabled={!isOnline}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (model.status === "loaded") {
                          unloadModel(model.id);
                        } else if (model.status === "not_loaded") {
                          loadModel(model.id);
                        }
                      }}
                    >
                      {model.status === "loaded" ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* شريط التقدم للتحميل */}
                {model.status === "loading" && (
                  <div className="mt-3">
                    <Progress value={model.progress} className="h-2" />
                  </div>
                )}

                {/* تفاصيل موسعة */}
                <AnimatePresence>
                  {isExpanded && showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-3 border-t pt-3"
                    >
                      {/* معلومات أساسية */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">الإصدار:</span>
                          <span className="mr-2 font-mono">
                            {model.version}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">الحجم:</span>
                          <span className="mr-2">{model.size} MB</span>
                        </div>
                        {model.memoryUsage && (
                          <div>
                            <span className="text-gray-500">الذاكرة:</span>
                            <span className="mr-2">
                              {model.memoryUsage.toFixed(1)} MB
                            </span>
                          </div>
                        )}
                        {model.accuracy && (
                          <div>
                            <span className="text-gray-500">الدقة:</span>
                            <span className="mr-2">
                              {Math.round(model.accuracy * 100)}%
                            </span>
                          </div>
                        )}
                        {model.performance && (
                          <div>
                            <span className="text-gray-500">الأداء:</span>
                            <span className="mr-2">
                              {Math.round(model.performance * 100)}%
                            </span>
                          </div>
                        )}
                        {model.lastUsed && (
                          <div>
                            <span className="text-gray-500">آخر استخدام:</span>
                            <span className="mr-2">
                              {model.lastUsed.toLocaleDateString("ar")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* القدرات */}
                      <div>
                        <div className="text-sm text-gray-500 mb-2">
                          القدرات:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {model.capabilities.map((capability, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* التبعيات */}
                      {model.dependencies.length > 0 && (
                        <div>
                          <div className="text-sm text-gray-500 mb-2">
                            التبعيات:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {model.dependencies.map((depId, index) => {
                              const dep = models.find((m) => m.id === depId);
                              return (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    dep?.status === "loaded"
                                      ? "border-green-500 text-green-600"
                                      : "border-red-500 text-red-600",
                                  )}
                                >
                                  {dep?.name || depId}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* مؤشرات الأداء */}
                      {model.status === "loaded" && model.accuracy && (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-500">
                            مؤشرات الأداء:
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center justify-between text-xs">
                                <span>الدقة</span>
                                <span>{Math.round(model.accuracy * 100)}%</span>
                              </div>
                              <Progress
                                value={model.accuracy * 100}
                                className="h-1 mt-1"
                              />
                            </div>
                            {model.performance && (
                              <div>
                                <div className="flex items-center justify-between text-xs">
                                  <span>الأد��ء</span>
                                  <span>
                                    {Math.round(model.performance * 100)}%
                                  </span>
                                </div>
                                <Progress
                                  value={model.performance * 100}
                                  className="h-1 mt-1"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default AIModelStatus;
