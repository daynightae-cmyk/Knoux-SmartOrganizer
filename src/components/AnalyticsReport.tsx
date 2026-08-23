import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  HardDrive,
  Clock,
  Target,
  Zap,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Calendar,
  Hash,
  Brain,
  Download,
  Share2,
  Filter,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Info,
  AlertCircle,
  CheckCircle,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileStats {
  totalFiles: number;
  duplicateFiles: number;
  uniqueFiles: number;
  totalSize: number;
  duplicateSize: number;
  potentialSavings: number;
  avgFileSize: number;
  largestFile: number;
  smallestFile: number;
}

interface CategoryStats {
  category: string;
  icon: React.ComponentType<any>;
  color: string;
  count: number;
  duplicates: number;
  size: number;
  duplicateSize: number;
  percentage: number;
  savingsPercentage: number;
}

interface TimelineData {
  period: string;
  filesCreated: number;
  duplicatesFound: number;
  sizeImpact: number;
}

interface AnalyticsReportProps {
  duplicateGroups: any[];
  scanResults?: {
    totalFiles: number;
    duplicateFiles: number;
    spaceSavings: number;
    scanTime: number;
  };
  onExportReport?: (format: "pdf" | "csv" | "json") => void;
}

export default function AnalyticsReport({
  duplicateGroups,
  scanResults,
  onExportReport,
}: AnalyticsReportProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "day" | "week" | "month" | "year"
  >("month");
  const [showDetailed, setShowDetailed] = useState(false);
  const [sortBy, setSortBy] = useState<"size" | "count" | "savings">("size");

  // Calculate comprehensive statistics
  const stats = useMemo((): FileStats => {
    const allFiles = duplicateGroups.flatMap((group) => group.files);
    const duplicateFiles = allFiles.filter((file) => file.isDuplicate);

    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);
    const duplicateSize = duplicateFiles.reduce(
      (sum, file) => sum + file.size,
      0,
    );

    const fileSizes = allFiles.map((file) => file.size).sort((a, b) => a - b);

    return {
      totalFiles: allFiles.length,
      duplicateFiles: duplicateFiles.length,
      uniqueFiles: allFiles.length - duplicateFiles.length,
      totalSize,
      duplicateSize,
      potentialSavings: duplicateSize * 0.85, // Conservative estimate
      avgFileSize: totalSize / allFiles.length || 0,
      largestFile: fileSizes[fileSizes.length - 1] || 0,
      smallestFile: fileSizes[0] || 0,
    };
  }, [duplicateGroups]);

  // Calculate category statistics
  const categoryStats = useMemo((): CategoryStats[] => {
    const categories = new Map();

    duplicateGroups.forEach((group) => {
      const category = group.category || "other";
      if (!categories.has(category)) {
        categories.set(category, {
          category,
          count: 0,
          duplicates: 0,
          size: 0,
          duplicateSize: 0,
          files: [],
        });
      }

      const catData = categories.get(category);
      group.files.forEach((file: any) => {
        catData.count++;
        catData.size += file.size;
        if (file.isDuplicate) {
          catData.duplicates++;
          catData.duplicateSize += file.size;
        }
        catData.files.push(file);
      });
    });

    const categoryArray = Array.from(categories.values()).map((cat) => ({
      ...cat,
      icon: getCategoryIcon(cat.category),
      color: getCategoryColor(cat.category),
      percentage: (cat.size / stats.totalSize) * 100,
      savingsPercentage: (cat.duplicateSize / cat.size) * 100,
    }));

    // Sort by selected criteria
    return categoryArray.sort((a, b) => {
      switch (sortBy) {
        case "size":
          return b.size - a.size;
        case "count":
          return b.count - a.count;
        case "savings":
          return b.duplicateSize - a.duplicateSize;
        default:
          return 0;
      }
    });
  }, [duplicateGroups, stats.totalSize, sortBy]);

  // Generate timeline data
  const timelineData = useMemo((): TimelineData[] => {
    const allFiles = duplicateGroups.flatMap((group) => group.files);
    const timeGroups = new Map();

    allFiles.forEach((file) => {
      const date = new Date(file.lastModified);
      let key = "";

      switch (selectedTimeframe) {
        case "day":
          key = date.toDateString();
          break;
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toDateString();
          break;
        case "month":
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        case "year":
          key = date.getFullYear().toString();
          break;
      }

      if (!timeGroups.has(key)) {
        timeGroups.set(key, {
          period: key,
          filesCreated: 0,
          duplicatesFound: 0,
          sizeImpact: 0,
        });
      }

      const timeData = timeGroups.get(key);
      timeData.filesCreated++;
      if (file.isDuplicate) {
        timeData.duplicatesFound++;
        timeData.sizeImpact += file.size;
      }
    });

    return Array.from(timeGroups.values())
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-12); // Last 12 periods
  }, [duplicateGroups, selectedTimeframe]);

  function getCategoryIcon(category: string) {
    switch (category) {
      case "image":
        return Image;
      case "video":
        return Video;
      case "audio":
        return Music;
      case "document":
        return FileText;
      default:
        return Archive;
    }
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case "image":
        return "text-blue-400";
      case "video":
        return "text-red-400";
      case "audio":
        return "text-purple-400";
      case "document":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}س ${minutes % 60}د`;
    if (minutes > 0) return `${minutes}د ${seconds % 60}ث`;
    return `${seconds}ث`;
  };

  const duplicatePercentage = (stats.duplicateFiles / stats.totalFiles) * 100;
  const savingsPercentage = (stats.potentialSavings / stats.totalSize) * 100;

  if (duplicateGroups.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">
            لا توجد بيانات للتحليل
          </h3>
          <p className="text-gray-500">
            قم بفحص الملفات أولاً لعرض التقارير والإحصائيات
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with export options */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-400">
              <BarChart3 className="w-5 h-5" />
              تقرير التحليل الشامل
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailed(!showDetailed)}
              >
                <Info className="w-4 h-4 mr-1" />
                {showDetailed ? "مبسط" : "تفصيلي"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportReport?.("pdf")}
              >
                <Download className="w-4 h-4 mr-1" />
                تصدير PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportReport?.("csv")}
              >
                <Share2 className="w-4 h-4 mr-1" />
                تصدير CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-purple-600"
          >
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="data-[state=active]:bg-purple-600"
          >
            التصنيفات
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="data-[state=active]:bg-purple-600"
          >
            الخط الزمني
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-purple-600"
          >
            نتائج ذكية
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30">
                <CardContent className="p-6 text-center">
                  <HardDrive className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                  <div className="text-2xl font-bold text-blue-400">
                    {stats.totalFiles}
                  </div>
                  <div className="text-sm text-gray-300">إجمالي الملفات</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatBytes(stats.totalSize)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-red-900/30 to-red-800/30 border-red-500/30">
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 mx-auto text-red-400 mb-2" />
                  <div className="text-2xl font-bold text-red-400">
                    {stats.duplicateFiles}
                  </div>
                  <div className="text-sm text-gray-300">ملفات مكررة</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {duplicatePercentage.toFixed(1)}% من الإجمالي
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-500/30">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto text-green-400 mb-2" />
                  <div className="text-2xl font-bold text-green-400">
                    {formatBytes(stats.potentialSavings)}
                  </div>
                  <div className="text-sm text-gray-300">توفير محتمل</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {savingsPercentage.toFixed(1)}% من المساحة
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <Zap className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                  <div className="text-2xl font-bold text-purple-400">
                    {duplicateGroups.length}
                  </div>
                  <div className="text-sm text-gray-300">مجموعات تكرار</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {scanResults && formatDuration(scanResults.scanTime)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Detailed Statistics */}
          {showDetailed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-cyan-400">
                    إحصائيات تفصيلية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-yellow-400">
                        تفاصيل الملفات
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">ملفات فريدة:</span>
                          <span className="text-green-400">
                            {stats.uniqueFiles}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            متوسط حجم الملف:
                          </span>
                          <span>{formatBytes(stats.avgFileSize)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">أكبر ملف:</span>
                          <span>{formatBytes(stats.largestFile)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">أصغر ملف:</span>
                          <span>{formatBytes(stats.smallestFile)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-yellow-400">
                        تحليل المساحة
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            المساحة المستخدمة:
                          </span>
                          <span>{formatBytes(stats.totalSize)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            مساحة التكرارات:
                          </span>
                          <span className="text-red-400">
                            {formatBytes(stats.duplicateSize)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">نسبة التكرار:</span>
                          <span className="text-yellow-400">
                            {(
                              (stats.duplicateSize / stats.totalSize) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">كفاءة الحذف:</span>
                          <span className="text-green-400">85%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-yellow-400">
                        أداء الفحص
                      </h4>
                      <div className="space-y-2 text-sm">
                        {scanResults && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-400">وقت الفحص:</span>
                              <span>
                                {formatDuration(scanResults.scanTime)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">
                                ملفات في الثانية:
                              </span>
                              <span>
                                {Math.round(
                                  (stats.totalFiles / scanResults.scanTime) *
                                    1000,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">دقة الكشف:</span>
                              <span className="text-green-400">
                                {(
                                  duplicateGroups.reduce(
                                    (sum, g) => sum + g.confidence,
                                    0,
                                  ) / duplicateGroups.length || 0
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">حالة المحرك:</span>
                          <span className="text-green-400">مُحسن</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Progress Bars */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>نسبة التكرار</span>
                    <span>{duplicatePercentage.toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={duplicatePercentage}
                    className="h-3"
                    // Custom color based on percentage
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>إمكانية التوفير</span>
                    <span>{savingsPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={savingsPercentage} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-cyan-400">تحليل التصنيفات</CardTitle>
                <div className="flex items-center gap-2">
                  <label className="text-sm">ترتيب حسب:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-black/20 border border-white/20 rounded px-2 py-1 text-sm"
                  >
                    <option value="size">الحجم</option>
                    <option value="count">العدد</option>
                    <option value="savings">التوفير</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats.map((category, index) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-black/20 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <category.icon
                          className={cn("w-6 h-6", category.color)}
                        />
                        <div>
                          <h4 className="font-semibold capitalize">
                            {category.category}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {category.count} ملفات • {category.duplicates} مكرر
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatBytes(category.size)}
                        </div>
                        <div className="text-sm text-green-400">
                          توفير: {formatBytes(category.duplicateSize)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>نسبة من الإجمالي</span>
                        <span>{category.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />

                      <div className="flex justify-between text-sm">
                        <span>نسبة التوفير</span>
                        <span>{category.savingsPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={category.savingsPercentage}
                        className="h-2"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-cyan-400">
                  تحليل الخط الزمني
                </CardTitle>
                <div className="flex items-center gap-2">
                  {(["day", "week", "month", "year"] as const).map((period) => (
                    <Button
                      key={period}
                      variant={
                        selectedTimeframe === period ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedTimeframe(period)}
                    >
                      {period === "day"
                        ? "يوم"
                        : period === "week"
                          ? "أسبوع"
                          : period === "month"
                            ? "شهر"
                            : "سنة"}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineData.map((period, index) => (
                  <motion.div
                    key={period.period}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-black/20 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{period.period}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-blue-400">
                          {period.filesCreated} ملف
                        </span>
                        <span className="text-red-400">
                          {period.duplicatesFound} مكرر
                        </span>
                        <span className="text-green-400">
                          {formatBytes(period.sizeImpact)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">
                          إنشاء ملفات
                        </div>
                        <Progress
                          value={
                            (period.filesCreated /
                              Math.max(
                                ...timelineData.map((p) => p.filesCreated),
                              )) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">
                          تكرارات
                        </div>
                        <Progress
                          value={
                            (period.duplicatesFound /
                              Math.max(
                                ...timelineData.map((p) => p.duplicatesFound),
                              )) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">
                          حجم التأثير
                        </div>
                        <Progress
                          value={
                            (period.sizeImpact /
                              Math.max(
                                ...timelineData.map((p) => p.sizeImpact),
                              )) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Brain className="w-5 h-5" />
                نتائج ذكية ونصائح مخصصة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Smart Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-500/30 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-400">
                    تحليل إيجابي
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  تم العثور على {duplicateGroups.length} مجموعة تكرار مع إمكانية
                  توفير {formatBytes(stats.potentialSavings)} من المساحة. هذا
                  يعتبر معدل تحسن ممتاز لتنظيم ملفاتك.
                </p>
              </motion.div>

              {duplicatePercentage > 30 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border border-yellow-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold text-yellow-400">
                      نسبة تكرار عالية
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    نسبة التكرار ({duplicatePercentage.toFixed(1)}%) عالية
                    نسبياً. يُنصح بتطبيق حذف التكرارات بانتظام لتحسين تنظيم
                    الملفات.
                  </p>
                </motion.div>
              )}

              {/* Top Categories Insight */}
              {categoryStats.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-blue-400">
                      أولوية التنظيف
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    أكبر فرصة للتوفير في فئة{" "}
                    <span className="font-semibold">
                      {categoryStats[0]?.category}
                    </span>{" "}
                    مع إمكانية توفير{" "}
                    {formatBytes(categoryStats[0]?.duplicateSize || 0)}. ابدأ من
                    هنا للحصول على أفضل النتائج.
                  </p>
                </motion.div>
              )}

              {/* Performance Insight */}
              {scanResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 bg-gradient-to-r from-purple-900/30 to-purple-800/30 border border-purple-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-purple-400">
                      أداء الفحص
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    تم فحص {stats.totalFiles} ملف في{" "}
                    {formatDuration(scanResults.scanTime)} بمعدل{" "}
                    {Math.round(
                      (stats.totalFiles / scanResults.scanTime) * 1000,
                    )}{" "}
                    ملف/ثانية. أداء ممتاز لمحرك الكشف!
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
