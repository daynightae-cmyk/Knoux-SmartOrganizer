import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  Clock,
  HardDrive,
  FileText,
  Image,
  Video,
  Music,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileAnalysis {
  category: string;
  count: number;
  totalSize: number;
  duplicates: number;
  suggestion: string;
  priority: "high" | "medium" | "low";
  potential_savings: number;
}

interface SmartSuggestion {
  id: string;
  type: "cleanup" | "organize" | "optimize" | "security";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "easy" | "medium" | "complex";
  category: string;
  estimatedSavings?: number;
  estimatedTime?: number;
  confidence: number;
  icon: React.ComponentType<any>;
  action?: string;
}

interface SmartSuggestionsProps {
  duplicateGroups?: any[];
  totalFiles?: number;
  onApplySuggestion?: (suggestion: SmartSuggestion) => void;
}

export default function SmartSuggestions({
  duplicateGroups = [],
  totalFiles = 0,
  onApplySuggestion,
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [analysis, setAnalysis] = useState<FileAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generate AI-powered suggestions
  useEffect(() => {
    if (duplicateGroups.length > 0) {
      generateSmartSuggestions();
    }
  }, [duplicateGroups, totalFiles]);

  const generateSmartSuggestions = async () => {
    setIsAnalyzing(true);

    // محاكاة تحليل AI
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // تحليل البيانات
    const fileAnalysis = analyzeDuplicateData();
    setAnalysis(fileAnalysis);

    // إنشاء الاقتراحات الذكية
    const smartSuggestions = createSmartSuggestions(fileAnalysis);
    setSuggestions(smartSuggestions);

    setIsAnalyzing(false);
  };

  const analyzeDuplicateData = (): FileAnalysis[] => {
    const categoryMap = new Map();

    duplicateGroups.forEach((group) => {
      const category = group.category || "other";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          count: 0,
          totalSize: 0,
          duplicates: 0,
          files: [],
        });
      }

      const catData = categoryMap.get(category);
      catData.count += group.files.length;
      catData.totalSize += group.totalSize;
      catData.duplicates += group.files.filter(
        (f: any) => f.isDuplicate,
      ).length;
      catData.files.push(...group.files);
    });

    return Array.from(categoryMap.values()).map((cat) => ({
      ...cat,
      suggestion: generateCategorySuggestion(cat),
      priority: determinePriority(cat),
      potential_savings: cat.totalSize * 0.7, // تقدير المساحة المحتملة
    }));
  };

  const generateCategorySuggestion = (category: any): string => {
    const { category: catName, duplicates, totalSize } = category;

    switch (catName) {
      case "image":
        return `تم العثور على ${duplicates} صورة مكررة. يمكن توفير ${formatBytes(totalSize * 0.8)} من المساحة بحذف الصور المكررة والاحتفاظ بأعلى جودة.`;
      case "video":
        return `${duplicates} ملف فيديو مكرر يستهلك ${formatBytes(totalSize)}. حذف هذه الملفات سيوفر مساحة كبيرة.`;
      case "document":
        return `تم اكتشاف ${duplicates} مستند مكرر. يُنصح بمراجعة المحتوى قبل الحذف للتأكد من عدم وجود اختلافات مهمة.`;
      case "audio":
        return `${duplicates} ملف صوتي مكرر. يمكن دمج المكتبة الموسيقية وحذف التكرارات لتوفير المساحة.`;
      default:
        return `${duplicates} ملف مكرر في فئة ${catName}. مراجعة وحذف هذه الملفات سيحسن التنظيم.`;
    }
  };

  const determinePriority = (category: any): "high" | "medium" | "low" => {
    const { totalSize, duplicates } = category;

    if (totalSize > 100 * 1024 * 1024 && duplicates > 10) return "high"; // >100MB and >10 files
    if (totalSize > 50 * 1024 * 1024 || duplicates > 5) return "medium";
    return "low";
  };

  const createSmartSuggestions = (
    analysis: FileAnalysis[],
  ): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = [];

    // اقتراحات أساسية بناءً على التحليل
    if (analysis.length > 0) {
      const totalPotentialSavings = analysis.reduce(
        (sum, cat) => sum + cat.potential_savings,
        0,
      );

      suggestions.push({
        id: "bulk-cleanup",
        type: "cleanup",
        title: "تنظيف شامل للملفات المكررة",
        description: `حذف جميع الملفات المكررة المحددة تلقائياً مع الاحتفاظ بأفضل نسخة من كل ملف.`,
        impact: "high",
        effort: "easy",
        category: "general",
        estimatedSavings: totalPotentialSavings,
        estimatedTime: 5,
        confidence: 95,
        icon: Sparkles,
        action: "apply-bulk-cleanup",
      });
    }

    // اقتراحات للصور
    const imageAnalysis = analysis.find((a) => a.category === "image");
    if (imageAnalysis && imageAnalysis.duplicates > 3) {
      suggestions.push({
        id: "image-optimization",
        type: "optimize",
        title: "تحسين مكتبة الصور",
        description: `تم العثور على ${imageAnalysis.duplicates} صورة مكررة. يُنصح بتطبيق ضغط ذكي وحذف النسخ المكررة.`,
        impact: "high",
        effort: "medium",
        category: "image",
        estimatedSavings: imageAnalysis.potential_savings,
        estimatedTime: 10,
        confidence: 88,
        icon: Image,
        action: "optimize-images",
      });
    }

    // اقتراحات للفيديو
    const videoAnalysis = analysis.find((a) => a.category === "video");
    if (videoAnalysis && videoAnalysis.totalSize > 500 * 1024 * 1024) {
      suggestions.push({
        id: "video-management",
        type: "organize",
        title: "إدارة مكتبة الفيديو",
        description: `ملفات الفيديو المكررة تستهلك ${formatBytes(videoAnalysis.totalSize)}. تنظيم وحذف المكررات سيوفر مساحة كبيرة.`,
        impact: "high",
        effort: "medium",
        category: "video",
        estimatedSavings: videoAnalysis.potential_savings,
        estimatedTime: 15,
        confidence: 92,
        icon: Video,
        action: "manage-videos",
      });
    }

    // اقتراحات أمنية
    if (totalFiles > 100) {
      suggestions.push({
        id: "security-scan",
        type: "security",
        title: "فحص أمني للملفات المشبوهة",
        description:
          "تحليل الملفات المكررة للتأكد من عدم وجود ملفات ضارة أو مشبوهة قبل الحذف.",
        impact: "medium",
        effort: "easy",
        category: "security",
        estimatedTime: 3,
        confidence: 85,
        icon: AlertTriangle,
        action: "security-scan",
      });
    }

    // اقتراحات تحسين الأداء
    suggestions.push({
      id: "performance-boost",
      type: "optimize",
      title: "تحسين أداء النظام",
      description: "حذف الملفات المكررة سيحسن سرعة البحث وأداء النظام العام.",
      impact: "medium",
      effort: "easy",
      category: "performance",
      estimatedTime: 2,
      confidence: 78,
      icon: TrendingUp,
      action: "boost-performance",
    });

    return suggestions.sort((a, b) => {
      const impactScore = { high: 3, medium: 2, low: 1 };
      const effortScore = { easy: 3, medium: 2, complex: 1 };

      const scoreA =
        impactScore[a.impact] * effortScore[a.effort] * a.confidence;
      const scoreB =
        impactScore[b.impact] * effortScore[b.effort] * b.confidence;

      return scoreB - scoreA;
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-400 bg-red-900/20 border-red-500/30";
      case "medium":
        return "text-yellow-400 bg-yellow-900/20 border-yellow-500/30";
      case "low":
        return "text-green-400 bg-green-900/20 border-green-500/30";
      default:
        return "text-gray-400 bg-gray-900/20 border-gray-500/30";
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "easy":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "complex":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (duplicateGroups.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Brain className="w-5 h-5" />
            الاقتراحات الذكية المدعومة بالذكاء الاصطناعي
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="text-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4"
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
              <p className="text-lg font-medium text-purple-400 mb-2">
                جاري تحليل البيانات بالذكاء الاصطناعي...
              </p>
              <p className="text-gray-400">
                إنشاء اقتراحات مخصصة لتحسين التنظيم
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Category Analysis */}
              {analysis.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {analysis.map((cat, index) => (
                    <motion.div
                      key={cat.category}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-black/20 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {cat.category === "image" && (
                          <Image className="w-4 h-4 text-blue-400" />
                        )}
                        {cat.category === "video" && (
                          <Video className="w-4 h-4 text-red-400" />
                        )}
                        {cat.category === "document" && (
                          <FileText className="w-4 h-4 text-green-400" />
                        )}
                        {cat.category === "audio" && (
                          <Music className="w-4 h-4 text-purple-400" />
                        )}
                        <span className="font-medium capitalize text-sm">
                          {cat.category}
                        </span>
                        <Badge
                          className={cn(
                            "text-xs",
                            cat.priority === "high"
                              ? "bg-red-600"
                              : cat.priority === "medium"
                                ? "bg-yellow-600"
                                : "bg-green-600",
                          )}
                        >
                          {cat.priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>{cat.duplicates} ملف مكرر</div>
                        <div>{formatBytes(cat.totalSize)}</div>
                        <div className="text-green-400">
                          توفير: {formatBytes(cat.potential_savings)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Smart Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-cyan-400">
                    الاقتراحات المخصصة ({suggestions.length})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                  </Button>
                </div>

                <AnimatePresence>
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gradient-to-r from-black/20 to-black/10 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                            <suggestion.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-semibold text-white">
                                {suggestion.title}
                              </h5>
                              <Badge
                                className={cn(
                                  "text-xs border",
                                  getImpactColor(suggestion.impact),
                                )}
                              >
                                تأثير {suggestion.impact}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  getEffortColor(suggestion.effort),
                                )}
                              >
                                {suggestion.effort}
                              </Badge>
                            </div>
                            <p className="text-gray-300 text-sm mb-3">
                              {suggestion.description}
                            </p>

                            {showAdvanced && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                {suggestion.estimatedSavings && (
                                  <div className="flex items-center gap-1">
                                    <HardDrive className="w-3 h-3 text-green-400" />
                                    <span className="text-green-400">
                                      {formatBytes(suggestion.estimatedSavings)}
                                    </span>
                                  </div>
                                )}
                                {suggestion.estimatedTime && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-blue-400" />
                                    <span className="text-blue-400">
                                      {suggestion.estimatedTime} دقيقة
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Target className="w-3 h-3 text-purple-400" />
                                  <span className="text-purple-400">
                                    {suggestion.confidence}% ثقة
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Lightbulb className="w-3 h-3 text-yellow-400" />
                                  <span className="text-yellow-400 capitalize">
                                    {suggestion.category}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => onApplySuggestion?.(suggestion)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          size="sm"
                        >
                          تطبيق
                        </Button>
                      </div>

                      {/* Confidence bar */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          مستوى الثقة:
                        </span>
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${suggestion.confidence}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {suggestion.confidence}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
