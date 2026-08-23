// src/pages/OrganizerPage.tsx

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  aiEngine,
  AiSettings,
  ImageAnalysis,
  defaultAiSettings,
} from "@/lib/ai-engine";
import { simplifiedEngine } from "@/lib/simple-fallback-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Brain,
  Upload,
  Settings,
  Eye,
  EyeOff,
  Users,
  FileText,
  Palette,
  Zap,
  Target,
  Camera,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  Download,
  Trash2,
  RotateCcw,
} from "lucide-react";

// --- مكون لعرض بطاقة نتائج تفصيلية ---
function AnalysisCard({ analysis }: { analysis: ImageAnalysis }) {
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);

  // تحديد إذا كانت الصورة حساسة
  const isSensitive = analysis.nsfw?.some(
    (p) =>
      (p.className === "Porn" ||
        p.className === "Hentai" ||
        p.className === "Sexy") &&
      p.probability > 0.7,
  );

  // الحصول على أفضل تصنيف
  const topClassification = analysis.classification?.[0];

  // تنسيق الوقت
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-xl",
        isSensitive
          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
          : "border-gray-200 dark:border-gray-700",
        showDetails && "col-span-2 row-span-2",
      )}
    >
      {/* صورة المعاينة */}
      <div className="relative aspect-square overflow-hidden">
        {!imageError ? (
          <img
            src={analysis.previewUrl}
            alt={analysis.file.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* تراكب المعلومات السريعة */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-2 left-2 right-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full bg-white/90 text-black hover:bg-white"
            >
              {showDetails ? (
                <EyeOff className="w-4 h-4 mr-1" />
              ) : (
                <Eye className="w-4 h-4 mr-1" />
              )}
              {showDetails ? "إخفاء التفاصيل" : "عرض التفاصيل"}
            </Button>
          </div>
        </div>

        {/* شارات الحالة */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {analysis.faces && analysis.faces.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-blue-500/80 text-white text-xs"
            >
              <Users className="w-3 h-3 mr-1" />
              {analysis.faces.length}
            </Badge>
          )}
          {analysis.ocrText && analysis.ocrText.length > 10 && (
            <Badge
              variant="secondary"
              className="bg-green-500/80 text-white text-xs"
            >
              <FileText className="w-3 h-3 mr-1" />
              نص
            </Badge>
          )}
          {isSensitive && (
            <Badge
              variant="destructive"
              className="bg-red-500/80 text-white text-xs"
            >
              ⚠️ حساس
            </Badge>
          )}
          {analysis.quality && analysis.quality.score > 0.8 && (
            <Badge
              variant="secondary"
              className="bg-yellow-500/80 text-white text-xs"
            >
              ⭐ عالي الجودة
            </Badge>
          )}
        </div>

        {/* مؤشر الثقة */}
        {topClassification && (
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className={cn(
                "text-white text-xs",
                topClassification.score >= 0.8
                  ? "bg-green-500/80"
                  : topClassification.score >= 0.5
                    ? "bg-yellow-500/80"
                    : "bg-red-500/80",
              )}
            >
              {Math.round(topClassification.score * 100)}%
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* اسم الملف والمعلومات الأساسية */}
        <div>
          <h3
            className="font-medium text-sm truncate"
            title={analysis.file.name}
          >
            {analysis.file.name}
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {analysis.dimensions.width}×{analysis.dimensions.height}
            </span>
            <span>{analysis.size} MB</span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(analysis.processingTime)}
            </span>
          </div>
        </div>

        {/* التصنيف الرئيسي */}
        {topClassification && (
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">
              {topClassification.label}
            </span>
            <Badge variant="outline" className="text-xs">
              {Math.round(topClassification.score * 100)}%
            </Badge>
          </div>
        )}

        {/* الوصف */}
        {analysis.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            "{analysis.description}"
          </p>
        )}

        {/* عرض تفصيلي */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 border-t pt-3"
          >
            {/* التصنيفات الكاملة */}
            {analysis.classification && analysis.classification.length > 1 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  جميع التصنيفات:
                </h4>
                <div className="space-y-1">
                  {analysis.classification.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs"
                    >
                      <span>{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={item.score * 100}
                          className="w-16 h-1"
                        />
                        <span className="text-gray-500">
                          {Math.round(item.score * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* الوجوه المكتشفة */}
            {analysis.faces && analysis.faces.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  الوجوه المكتشفة ({analysis.faces.length}):
                </h4>
                <div className="space-y-2">
                  {analysis.faces.map((face, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span>
                          {face.gender === "male" ? "♂️ ذكر" : "♀️ أنثى"} •{" "}
                          {face.age} سنة
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(face.confidence * 100)}%
                        </Badge>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400">
                        التعبير: {face.expression}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* تحليل المحتوى الحساس */}
            {analysis.nsfw && analysis.nsfw.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  تحليل المحتوى:
                </h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {analysis.nsfw.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span
                        className={cn(
                          item.className === "Neutral"
                            ? "text-green-600"
                            : item.probability > 0.5
                              ? "text-red-600"
                              : "text-gray-600",
                        )}
                      >
                        {item.className}
                      </span>
                      <span>{Math.round(item.probability * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* النص المستخرج */}
            {analysis.ocrText && analysis.ocrText.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  النص المستخرج:
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs max-h-24 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    {analysis.ocrText.substring(0, 200)}
                  </pre>
                  {analysis.ocrText.length > 200 && (
                    <span className="text-gray-500">... (اقتطاع)</span>
                  )}
                </div>
              </div>
            )}

            {/* تحليل الجودة */}
            {analysis.quality && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center">
                  <Activity className="w-4 h-4 mr-1" />
                  تحليل الجودة:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span>الحدة:</span>
                    <span>{Math.round(analysis.quality.sharpness * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>التباين:</span>
                    <span>{Math.round(analysis.quality.contrast * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>السطوع:</span>
                    <span>
                      {Math.round(analysis.quality.brightness * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span>الدرجة الإجمالية:</span>
                    <Badge
                      variant={
                        analysis.quality.score > 0.7 ? "default" : "secondary"
                      }
                    >
                      {Math.round(analysis.quality.score * 100)}%
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* لوحة الألوان */}
            {analysis.palette && analysis.palette.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center">
                  <Palette className="w-4 h-4 mr-1" />
                  الألوان السائدة:
                </h4>
                <div className="flex space-x-1">
                  {analysis.palette.map((color, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* معلومات إضافية */}
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
              <div className="flex items-center justify-between">
                <span>معرف الصورة:</span>
                <span className="font-mono">{analysis.id.substring(0, 8)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>وقت المعالجة:</span>
                <span>{formatTime(analysis.processingTime)}</span>
              </div>
              {analysis.pHash && (
                <div className="flex items-center justify-between">
                  <span>بصمة الصورة:</span>
                  <span className="font-mono">
                    {analysis.pHash.substring(0, 12)}...
                  </span>
                </div>
              )}
            </div>

            {/* عرض الأخطاء إن وجدت */}
            {analysis.error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                {analysis.error}
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// --- المكون الرئيسي ---
export function OrganizerPage() {
  const [settings, setSettings] = useState<AiSettings>(defaultAiSettings);
  const [results, setResults] = useState<ImageAnalysis[]>([]);
  const [status, setStatus] = useState(
    "🚀 جاهز للبدء. قم بضبط الإعدادات واختيار الصور.",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // تهيئة المحرك مع البديل المبسط
  const initializeEngine = useCallback(async () => {
    if (isInitialized || isProcessing) return;

    setIsProcessing(true);
    setStatus("جاري تهيئة محرك الذكاء الاصطناعي...");

    try {
      // محاولة تحميل المحرك المتقدم
      await aiEngine.initialize(settings, (statusMsg, prog) => {
        setStatus(statusMsg);
        setProgress(prog);
      });

      setIsInitialized(true);
      setIsProcessing(false);
      setUsingFallback(false);
      setStatus("✅ المحرك المتقدم جاهز! جميع الـ 10 قدرات متاحة.");

      toast.success("تم تحميل جميع النماذج المتقدمة بنجاح!");

      // احتفال بالتحميل الناجح
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#4F46E5", "#7C3AED", "#EC4899"],
      });
    } catch (error) {
      console.warn("فشل المحرك المتقدم، التحول للمحرك المبسط:", error);

      // التحول للمحرك المبسط
      setStatus("🔄 التحول للمحرك المبسط السريع...");
      setProgress(50);

      setTimeout(() => {
        setIsInitialized(true);
        setIsProcessing(false);
        setUsingFallback(true);
        setProgress(100);
        setStatus("✅ المحرك المبسط جاهز! تحليل سريع وموثوق.");

        toast.info("تم التحول للمحرك المبسط - يعمل بدون اتصال!");

        // احتفال مبسط
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 },
          colors: ["#10B981", "#3B82F6"],
        });
      }, 1000);
    }
  }, [settings, isInitialized, isProcessing]);

  // معالجة الملفات
  const handleAnalyze = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;

      // تهيئة المحرك إذا لم يكن جاهزاً
      if (!isInitialized) {
        await initializeEngine();
        if (!isInitialized) return; // فشل في التهيئة
      }

      const files = Array.from(e.target.files);
      setIsProcessing(true);
      setResults([]); // مسح النتائج السابقة

      let completedFiles = 0;

      for (const file of files) {
        try {
          setStatus(`📊 جاري تحليل ${file.name}...`);
          setProgress((completedFiles / files.length) * 100);

          let analysis;
          if (usingFallback) {
            // استخدام المحرك المبسط
            analysis = await simplifiedEngine.analyze(file);
          } else {
            // استخدام المحرك المتقدم
            analysis = await aiEngine.analyze(file, settings);
          }

          setResults((prev) => [...prev, analysis]);

          completedFiles++;
          setProgress((completedFiles / files.length) * 100);

          toast.success(`تم تحليل ${file.name} بنجاح!`);
        } catch (error) {
          console.error(`خطأ في تحليل ${file.name}:`, error);
          toast.error(`فشل في تحليل ${file.name}`);
        }
      }

      setIsProcessing(false);
      setProgress(100);
      setStatus(
        `🎉 اكتمل التحليل! تم معالجة ${completedFiles} من ${files.length} صورة.`,
      );

      // احتفال بالانتهاء
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });

      // إعادة تعيين input الملفات
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [settings, isInitialized, initializeEngine],
  );

  // مسح النتائج
  const clearResults = useCallback(() => {
    // تحرير عناوين الصور
    results.forEach((result) => {
      URL.revokeObjectURL(result.previewUrl);
    });

    setResults([]);
    setStatus("🚀 تم مسح النتائج. جاهز لتحليل صور جديدة.");
    toast.info("تم مسح جميع النتائج");
  }, [results]);

  // إعادة تعيين المحرك
  const resetEngine = useCallback(async () => {
    setIsInitialized(false);
    setIsProcessing(false);
    setProgress(0);
    clearResults();

    try {
      await aiEngine.terminate();
      setStatus(
        "🔄 تم إعادة تعيين المحرك. يمكنك تغيير الإعدادات والبدء من جديد.",
      );
      toast.info("تم إعادة تعيين المحرك");
    } catch (error) {
      console.error("خطأ في إعادة تعيين المحرك:", error);
    }
  }, [clearResults]);

  // إحصائيات سريعة
  const stats = {
    total: results.length,
    withFaces: results.filter((r) => r.faces && r.faces.length > 0).length,
    withText: results.filter((r) => r.ocrText && r.ocrText.length > 10).length,
    sensitive: results.filter((r) =>
      r.nsfw?.some(
        (p) =>
          (p.className === "Porn" || p.className === "Hentai") &&
          p.probability > 0.7,
      ),
    ).length,
    highQuality: results.filter((r) => r.quality && r.quality.score > 0.8)
      .length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-4">
      {/* رأس التطبيق */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Knoux SmartOrganizer PRO
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            محرك الذكاء الاصطناعي المتقدم مع 10 قدرات قوية
          </p>

          {/* شريط الحالة */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/20">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  isInitialized
                    ? usingFallback
                      ? "bg-blue-500 animate-pulse"
                      : "bg-green-500 animate-pulse"
                    : isProcessing
                      ? "bg-yellow-500 animate-spin"
                      : "bg-gray-400",
                )}
              />
              <span className="font-medium">{status}</span>
              {isInitialized && (
                <Badge
                  variant={usingFallback ? "secondary" : "default"}
                  className={cn(
                    "text-xs",
                    usingFallback
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                  )}
                >
                  {usingFallback ? "محرك مبسط" : "محرك متقدم"}
                </Badge>
              )}
            </div>

            {(isProcessing || progress > 0) && (
              <Progress value={progress} className="w-full" />
            )}
          </div>
        </div>

        {/* الإحصائيات السريعة */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي الصور
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.withFaces}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                بها وجوه
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.withText}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                بها نصوص
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.highQuality}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                عالية الجودة
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.sensitive}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                حساسة
              </div>
            </div>
          </div>
        )}
      </header>

      {/* لوحة التحكم */}
      <div className="max-w-7xl mx-auto mb-8">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-6 h-6 text-purple-600" />
                <span>لوحة التحكم بالذكاء الاصطناعي</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4 mr-1" />
                {showSettings ? "إخفاء الإعدادات" : "إعدادات متقدمة"}
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* الإعدادات الأساسية */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.runClassifier}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, runClassifier: checked })
                  }
                  disabled={isInitialized && isProcessing}
                />
                <Label className="text-sm">🎯 تصنيف</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.runCaptioner}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, runCaptioner: checked })
                  }
                  disabled={isInitialized && isProcessing}
                />
                <Label className="text-sm">📝 وصف تلقائي</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.runNsfw}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, runNsfw: checked })
                  }
                  disabled={isInitialized && isProcessing}
                />
                <Label className="text-sm">🔍 كشف المحتوى</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.runFaceDetection}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, runFaceDetection: checked })
                  }
                  disabled={isInitialized && isProcessing}
                />
                <Label className="text-sm">👤 كشف الوجوه</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.runOcr}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, runOcr: checked })
                  }
                  disabled={isInitialized && isProcessing}
                />
                <Label className="text-sm">📖 قراءة النصوص</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.runQualityAnalysis}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, runQualityAnalysis: checked })
                  }
                  disabled={isInitialized && isProcessing}
                />
                <Label className="text-sm">⭐ تحليل الجودة</Label>
              </div>
            </div>

            {/* الإعدادات المتقدمة */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 border-t pt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.runObjectDetection}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            runObjectDetection: checked,
                          })
                        }
                        disabled={isInitialized && isProcessing}
                      />
                      <Label className="text-sm">🎯 كشف الأجسام (YOLOS)</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.runDuplicateDetection}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            runDuplicateDetection: checked,
                          })
                        }
                        disabled={isInitialized && isProcessing}
                      />
                      <Label className="text-sm">🔍 كشف المكررات</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.runColorPalette}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, runColorPalette: checked })
                        }
                        disabled={isInitialized && isProcessing}
                      />
                      <Label className="text-sm">🎨 لوحة الألوان</Label>
                    </div>
                  </div>

                  {/* عتبة المحتوى الحساس */}
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center justify-between">
                      <span>🔍 عتبة المحتوى الحساس</span>
                      <span className="font-mono">
                        {settings.nsfwThreshold}
                      </span>
                    </Label>
                    <Slider
                      value={[settings.nsfwThreshold]}
                      onValueChange={([value]) =>
                        setSettings({ ...settings, nsfwThreshold: value })
                      }
                      min={0.1}
                      max={0.9}
                      step={0.1}
                      className="w-full"
                      disabled={isInitialized && isProcessing}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>متساهل (0.1)</span>
                      <span>صارم (0.9)</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* أزرار التحكم */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                اختيار الصور للتحليل
              </Button>

              {!isInitialized && (
                <Button
                  onClick={initializeEngine}
                  disabled={isProcessing}
                  variant="outline"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  تهيئة المحرك
                </Button>
              )}

              {results.length > 0 && (
                <Button
                  onClick={clearResults}
                  variant="outline"
                  disabled={isProcessing}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  مسح النتائج
                </Button>
              )}

              {isInitialized && (
                <Button
                  onClick={resetEngine}
                  variant="outline"
                  disabled={isProcessing}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  إعادة تعيين المحرك
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* عرض النتائج */}
      {results.length > 0 && (
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">
            نتائج التحليل ({results.length} صورة)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            <AnimatePresence>
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <AnalysisCard analysis={result} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Input مخفي للملفات */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleAnalyze}
        className="hidden"
      />
    </div>
  );
}

export default OrganizerPage;
