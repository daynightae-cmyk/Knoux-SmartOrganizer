import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Brain,
  Camera,
  Users,
  FileText,
  Palette,
  Target,
  Activity,
  Star,
  Eye,
  Shield,
  MapPin,
  Clock,
  Cpu,
  Zap,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Hash,
  Info,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Download,
  Share2,
  Edit3,
  RefreshCw,
  Maximize2,
  Settings,
  Filter,
  Search,
  Tag,
  Bookmark,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Archive,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

interface PhotoAnalysisResult {
  id: string;
  filename: string;
  file_size: number;
  dimensions: { width: number; height: number };
  format: string;
  created_at: Date;
  analysis_timestamp: Date;
  processing_time: number;
  classification: Array<{
    label: string;
    confidence: number;
    category: string;
    description?: string;
  }>;
  faces: Array<{
    bbox: [number, number, number, number];
    confidence: number;
    age: number;
    gender: "male" | "female";
    emotions: Record<string, number>;
    landmarks: number[][];
    identity?: {
      name: string;
      confidence: number;
      known_person: boolean;
    };
    accessories: {
      glasses: boolean;
      mask: boolean;
      hat: boolean;
    };
    attributes: {
      beard: boolean;
      mustache: boolean;
      makeup: boolean;
      smile: boolean;
    };
  }>;
  objects: Array<{
    label: string;
    confidence: number;
    bbox: [number, number, number, number];
    description?: string;
    category: string;
    subcategory?: string;
  }>;
  ocr: {
    text: string;
    confidence: number;
    language: string;
    regions: Array<{
      text: string;
      bbox: [number, number, number, number];
      confidence: number;
    }>;
    words: Array<{
      text: string;
      bbox: [number, number, number, number];
      confidence: number;
    }>;
  };
  colors: {
    dominant: Array<{
      color: string;
      percentage: number;
      name: string;
    }>;
    palette: string[];
    temperature: "warm" | "cool" | "neutral";
    saturation: "low" | "medium" | "high";
    brightness: "dark" | "medium" | "bright";
    contrast: "low" | "medium" | "high";
  };
  quality: {
    overall_score: number;
    sharpness: number;
    noise_level: number;
    exposure: number;
    composition: number;
    aesthetic_score: number;
    technical_issues: string[];
    recommendations: string[];
  };
  content: {
    nsfw_score: number;
    violence_score: number;
    medical_score: number;
    gore_score: number;
    adult_score: number;
    safety_rating: "safe" | "questionable" | "unsafe";
    content_tags: string[];
  };
  scene: {
    type: string;
    confidence: number;
    location_type: "indoor" | "outdoor" | "unknown";
    weather?: string;
    time_of_day?: "morning" | "afternoon" | "evening" | "night";
    season?: "spring" | "summer" | "autumn" | "winter";
    lighting: "natural" | "artificial" | "mixed";
    atmosphere: string[];
  };
  metadata: {
    camera?: {
      make: string;
      model: string;
      lens?: string;
      settings: {
        iso?: number;
        aperture?: string;
        shutter_speed?: string;
        focal_length?: string;
        flash?: boolean;
      };
    };
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
      city?: string;
      country?: string;
    };
    original_filename: string;
    file_hash: string;
    duplicate_of?: string[];
    similar_images?: Array<{
      id: string;
      similarity_score: number;
    }>;
  };
  tags: {
    auto_generated: string[];
    user_defined: string[];
    smart_categories: string[];
    suggested_albums: string[];
  };
  performance: {
    model_versions: Record<string, string>;
    processing_stages: Array<{
      stage: string;
      duration: number;
      success: boolean;
      error?: string;
    }>;
    memory_usage: number;
    gpu_used: boolean;
  };
}

interface PhotoAnalysisPanelProps {
  analysis: PhotoAnalysisResult | null;
  imageUrl?: string;
  isLoading?: boolean;
  onClose?: () => void;
  onReanalyze?: () => void;
  onSaveChanges?: (updates: Partial<PhotoAnalysisResult>) => void;
  onExport?: (format: "json" | "csv" | "pdf") => void;
  showAdvanced?: boolean;
  editable?: boolean;
}

export function PhotoAnalysisPanel({
  analysis,
  imageUrl,
  isLoading = false,
  onClose,
  onReanalyze,
  onSaveChanges,
  onExport,
  showAdvanced = true,
  editable = false,
}: PhotoAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["classification", "quality", "colors"]),
  );
  const [editMode, setEditMode] = useState(false);
  const [userTags, setUserTags] = useState<string[]>([]);

  useEffect(() => {
    if (analysis) {
      setUserTags(analysis.tags.user_defined || []);
    }
  }, [analysis]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600 bg-green-100";
    if (confidence >= 0.7) return "text-yellow-600 bg-yellow-100";
    if (confidence >= 0.5) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getSafetyColor = (rating: string) => {
    switch (rating) {
      case "safe":
        return "text-green-600 bg-green-100";
      case "questionable":
        return "text-yellow-600 bg-yellow-100";
      case "unsafe":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-4">
            <Brain className="w-6 h-6 animate-pulse text-blue-500" />
            <div>
              <div className="font-medium">جاري تحليل الصورة...</div>
              <div className="text-sm text-gray-500">
                الذكاء الاصطناعي يعمل على التحليل
              </div>
            </div>
          </div>
          <Progress value={65} className="mt-4" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="w-full max-w-4xl">
        <CardContent className="p-6 text-center">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            لا توجد نتائج تحليل
          </h3>
          <p className="text-gray-500">
            اختر صورة للحصول على تحليل شامل بالذكاء الاصطناعي
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* رأس اللوحة */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  تحليل الصورة بالذكاء الاصطناعي
                </CardTitle>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{analysis.filename}</span>
                  <span>•</span>
                  <span>{formatFileSize(analysis.file_size)}</span>
                  <span>•</span>
                  <span>
                    {analysis.dimensions.width}×{analysis.dimensions.height}
                  </span>
                  <span>•</span>
                  <span>
                    معالج في {formatProcessingTime(analysis.processing_time)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {editable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {editMode ? "حفظ" : "تحرير"}
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={onReanalyze}>
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة تحليل
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport?.("json")}
              >
                <Download className="w-4 h-4 mr-2" />
                تصدير
              </Button>

              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* عرض الصورة */}
        {imageUrl && (
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={imageUrl}
                    alt={analysis.filename}
                    className="w-full h-full object-contain"
                  />

                  {/* عرض مناطق الوجوه والكائنات */}
                  {analysis.faces.map((face, index) => (
                    <div
                      key={`face-${index}`}
                      className="absolute border-2 border-blue-500 bg-blue-500/20"
                      style={{
                        left: `${(face.bbox[0] / analysis.dimensions.width) * 100}%`,
                        top: `${(face.bbox[1] / analysis.dimensions.height) * 100}%`,
                        width: `${(face.bbox[2] / analysis.dimensions.width) * 100}%`,
                        height: `${(face.bbox[3] / analysis.dimensions.height) * 100}%`,
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        وجه {index + 1}
                      </div>
                    </div>
                  ))}

                  {analysis.objects.map((object, index) => (
                    <div
                      key={`object-${index}`}
                      className="absolute border-2 border-green-500 bg-green-500/20"
                      style={{
                        left: `${(object.bbox[0] / analysis.dimensions.width) * 100}%`,
                        top: `${(object.bbox[1] / analysis.dimensions.height) * 100}%`,
                        width: `${(object.bbox[2] / analysis.dimensions.width) * 100}%`,
                        height: `${(object.bbox[3] / analysis.dimensions.height) * 100}%`,
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        {object.label}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* تبويبات التحليل */}
        <div
          className={cn(
            "space-y-6",
            imageUrl ? "lg:col-span-2" : "lg:col-span-3",
          )}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="objects">الكائنات</TabsTrigger>
              <TabsTrigger value="text">النصوص</TabsTrigger>
              <TabsTrigger value="quality">الجودة</TabsTrigger>
              <TabsTrigger value="metadata">البيانات</TabsTrigger>
              <TabsTrigger value="performance">الأداء</TabsTrigger>
            </TabsList>

            {/* نظرة عامة */}
            <TabsContent value="overview" className="space-y-4">
              {/* تصنيف الصورة */}
              <Collapsible
                open={expandedSections.has("classification")}
                onOpenChange={() => toggleSection("classification")}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Target className="w-5 h-5 text-blue-500" />
                          <CardTitle className="text-lg">
                            تصنيف الصورة
                          </CardTitle>
                          <Badge variant="outline">
                            {analysis.classification.length} تصنيف
                          </Badge>
                        </div>
                        {expandedSections.has("classification") ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                      {analysis.classification
                        .slice(0, 10)
                        .map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <Badge
                                variant="outline"
                                className="w-8 text-center"
                              >
                                {index + 1}
                              </Badge>
                              <div>
                                <div className="font-medium">{item.label}</div>
                                {item.description && (
                                  <div className="text-sm text-gray-500">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Progress
                                value={item.confidence * 100}
                                className="w-20 h-2"
                              />
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-xs",
                                  getConfidenceColor(item.confidence),
                                )}
                              >
                                {Math.round(item.confidence * 100)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* تحليل الألوان */}
              <Collapsible
                open={expandedSections.has("colors")}
                onOpenChange={() => toggleSection("colors")}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Palette className="w-5 h-5 text-purple-500" />
                          <CardTitle className="text-lg">
                            تحليل الألوان
                          </CardTitle>
                        </div>
                        {expandedSections.has("colors") ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {/* الألوان السائدة */}
                      <div>
                        <h4 className="font-medium mb-3">الألوان السائدة</h4>
                        <div className="space-y-2">
                          {analysis.colors.dominant.map((color, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-3"
                            >
                              <div
                                className="w-8 h-8 rounded-full border-2 border-gray-300"
                                style={{ backgroundColor: color.color }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {color.name}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {color.percentage.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress
                                  value={color.percentage}
                                  className="h-2 mt-1"
                                />
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {color.color}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* خصائص الألوان */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">
                            درجة الحرارة
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {analysis.colors.temperature === "warm"
                              ? "دافئة"
                              : analysis.colors.temperature === "cool"
                                ? "باردة"
                                : "محايدة"}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">التشبع</div>
                          <Badge variant="outline" className="mt-1">
                            {analysis.colors.saturation === "high"
                              ? "عالي"
                              : analysis.colors.saturation === "medium"
                                ? "متوسط"
                                : "منخفض"}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">السطوع</div>
                          <Badge variant="outline" className="mt-1">
                            {analysis.colors.brightness === "bright"
                              ? "مشرق"
                              : analysis.colors.brightness === "medium"
                                ? "متوسط"
                                : "داكن"}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">التباين</div>
                          <Badge variant="outline" className="mt-1">
                            {analysis.colors.contrast === "high"
                              ? "عالي"
                              : analysis.colors.contrast === "medium"
                                ? "متوسط"
                                : "منخفض"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* أمان ا��محتوى */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    <CardTitle className="text-lg">أمان المحتوى</CardTitle>
                    <Badge
                      variant="outline"
                      className={getSafetyColor(analysis.content.safety_rating)}
                    >
                      {analysis.content.safety_rating === "safe"
                        ? "آمن"
                        : analysis.content.safety_rating === "questionable"
                          ? "مشكوك"
                          : "غير آمن"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">محتوى بالغين</div>
                      <div className="font-medium">
                        {Math.round(analysis.content.nsfw_score * 100)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">عنف</div>
                      <div className="font-medium">
                        {Math.round(analysis.content.violence_score * 100)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">محتوى طبي</div>
                      <div className="font-medium">
                        {Math.round(analysis.content.medical_score * 100)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">محتوى صادم</div>
                      <div className="font-medium">
                        {Math.round(analysis.content.gore_score * 100)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب الكائنات */}
            <TabsContent value="objects" className="space-y-4">
              {analysis.objects.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-green-500" />
                      <span>الكائنات المكتشفة</span>
                      <Badge variant="outline">
                        {analysis.objects.length} كائن
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.objects.map((object, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant="outline"
                              className="w-8 text-center"
                            >
                              {index + 1}
                            </Badge>
                            <div>
                              <div className="font-medium">{object.label}</div>
                              <div className="text-sm text-gray-500">
                                {object.category}
                                {object.subcategory &&
                                  ` • ${object.subcategory}`}
                              </div>
                              {object.description && (
                                <div className="text-sm text-gray-400">
                                  {object.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={getConfidenceColor(object.confidence)}
                          >
                            {Math.round(object.confidence * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      لم يتم اكتشاف كائنات
                    </h3>
                    <p className="text-gray-500">
                      لم يتمكن النظام من تحديد كائنات واضحة في هذه الصورة
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* تبويب النصوص */}
            <TabsContent value="text" className="space-y-4">
              {analysis.ocr.text ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span>النصوص المستخرجة</span>
                      <Badge variant="outline">
                        {analysis.ocr.language || "غير محدد"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* النص الكامل */}
                    <div>
                      <h4 className="font-medium mb-2">النص المستخرج:</h4>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">
                          {analysis.ocr.text}
                        </pre>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                        <span>
                          ثقة الاستخراج:{" "}
                          {Math.round(analysis.ocr.confidence * 100)}%
                        </span>
                        <span>اللغة: {analysis.ocr.language}</span>
                      </div>
                    </div>

                    {/* المناطق النصية */}
                    {analysis.ocr.regions.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">المناطق النصية:</h4>
                        <div className="space-y-2">
                          {analysis.ocr.regions.map((region, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                  منطقة {index + 1}
                                </span>
                                <Badge variant="outline">
                                  {Math.round(region.confidence * 100)}%
                                </Badge>
                              </div>
                              <div className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                {region.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      لا توجد نصوص
                    </h3>
                    <p className="text-gray-500">
                      لم يتم اكتشاف أي نصوص في هذه الصورة
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* تبويب الجودة المفصل */}
            <TabsContent value="quality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>تحليل الجودة التفصيلي</span>
                    <Badge
                      variant="outline"
                      className={getQualityColor(
                        analysis.quality.overall_score,
                      )}
                    >
                      {Math.round(analysis.quality.overall_score * 100)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* مؤشرات الجودة */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-4">المؤشرات التقنية</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">الحدة</span>
                            <span className="text-sm font-medium">
                              {Math.round(analysis.quality.sharpness * 100)}%
                            </span>
                          </div>
                          <Progress
                            value={analysis.quality.sharpness * 100}
                            className="h-3"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">مستوى الضوضاء</span>
                            <span className="text-sm font-medium">
                              {Math.round(
                                (1 - analysis.quality.noise_level) * 100,
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={(1 - analysis.quality.noise_level) * 100}
                            className="h-3"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">التعرض</span>
                            <span className="text-sm font-medium">
                              {Math.round(analysis.quality.exposure * 100)}%
                            </span>
                          </div>
                          <Progress
                            value={analysis.quality.exposure * 100}
                            className="h-3"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">التركيب</span>
                            <span className="text-sm font-medium">
                              {Math.round(analysis.quality.composition * 100)}%
                            </span>
                          </div>
                          <Progress
                            value={analysis.quality.composition * 100}
                            className="h-3"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4">المؤشرات الجمالية</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">الدرجة الجمالية</span>
                            <span className="text-sm font-medium">
                              {Math.round(
                                analysis.quality.aesthetic_score * 100,
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={analysis.quality.aesthetic_score * 100}
                            className="h-3"
                          />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <div className="text-center">
                            <div className="text-2xl font-bold mb-2">
                              {Math.round(analysis.quality.overall_score * 100)}
                              %
                            </div>
                            <div className="text-sm text-gray-500">
                              الدرجة الإجمالية
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* المشاكل التقنية */}
                  {analysis.quality.technical_issues.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                        المشاكل التقنية المكتشفة
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {analysis.quality.technical_issues.map(
                          (issue, index) => (
                            <Badge
                              key={index}
                              variant="destructive"
                              className="justify-start"
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {issue}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* التوصيات */}
                  {analysis.quality.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        توصيات التحسين
                      </h4>
                      <div className="space-y-2">
                        {analysis.quality.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* تبويب البيانات الوصفية */}
            <TabsContent value="metadata" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* معلومات الكاميرا */}
                {analysis.metadata.camera && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Camera className="w-5 h-5 text-blue-500" />
                        <span>معلومات الكاميرا</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">الصانع:</span>
                          <div className="font-medium">
                            {analysis.metadata.camera.make}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">الطراز:</span>
                          <div className="font-medium">
                            {analysis.metadata.camera.model}
                          </div>
                        </div>
                        {analysis.metadata.camera.lens && (
                          <div className="col-span-2">
                            <span className="text-gray-500">العدسة:</span>
                            <div className="font-medium">
                              {analysis.metadata.camera.lens}
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <h5 className="font-medium mb-2">إعدادات التصوير</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {analysis.metadata.camera.settings.iso && (
                            <div>
                              <span className="text-gray-500">ISO:</span>
                              <div className="font-medium">
                                {analysis.metadata.camera.settings.iso}
                              </div>
                            </div>
                          )}
                          {analysis.metadata.camera.settings.aperture && (
                            <div>
                              <span className="text-gray-500">
                                فتحة العدسة:
                              </span>
                              <div className="font-medium">
                                {analysis.metadata.camera.settings.aperture}
                              </div>
                            </div>
                          )}
                          {analysis.metadata.camera.settings.shutter_speed && (
                            <div>
                              <span className="text-gray-500">
                                سرعة الغالق:
                              </span>
                              <div className="font-medium">
                                {
                                  analysis.metadata.camera.settings
                                    .shutter_speed
                                }
                              </div>
                            </div>
                          )}
                          {analysis.metadata.camera.settings.focal_length && (
                            <div>
                              <span className="text-gray-500">
                                البعد البؤري:
                              </span>
                              <div className="font-medium">
                                {analysis.metadata.camera.settings.focal_length}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* معلومات الموقع */}
                {analysis.metadata.location && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-green-500" />
                        <span>معلومات الموقع</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500">خط العرض:</span>
                            <div className="font-medium font-mono">
                              {analysis.metadata.location.latitude.toFixed(6)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">خط الطول:</span>
                            <div className="font-medium font-mono">
                              {analysis.metadata.location.longitude.toFixed(6)}
                            </div>
                          </div>
                        </div>

                        {analysis.metadata.location.address && (
                          <div className="mt-3">
                            <span className="text-gray-500">العنوان:</span>
                            <div className="font-medium">
                              {analysis.metadata.location.address}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {analysis.metadata.location.city && (
                            <div>
                              <span className="text-gray-500">المدينة:</span>
                              <div className="font-medium">
                                {analysis.metadata.location.city}
                              </div>
                            </div>
                          )}
                          {analysis.metadata.location.country && (
                            <div>
                              <span className="text-gray-500">الدولة:</span>
                              <div className="font-medium">
                                {analysis.metadata.location.country}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* معلومات الملف */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Hash className="w-5 h-5 text-purple-500" />
                      <span>معلومات الملف</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="text-gray-500">الاسم الأصلي:</span>
                        <div className="font-medium break-all">
                          {analysis.metadata.original_filename}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">بصمة الملف:</span>
                        <div className="font-mono text-xs break-all">
                          {analysis.metadata.file_hash}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">تاريخ الإنشاء:</span>
                        <div className="font-medium">
                          {analysis.created_at.toLocaleDateString("ar")}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">تاريخ التحليل:</span>
                        <div className="font-medium">
                          {analysis.analysis_timestamp.toLocaleDateString("ar")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* الصور المشابهة والمكررة */}
                {(analysis.metadata.duplicate_of?.length ||
                  analysis.metadata.similar_images?.length) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Copy className="w-5 h-5 text-orange-500" />
                        <span>الصور المرتبطة</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.metadata.duplicate_of &&
                        analysis.metadata.duplicate_of.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">
                              صور مكررة مكتشفة:
                            </h5>
                            <div className="space-y-1">
                              {analysis.metadata.duplicate_of.map(
                                (dupId, index) => (
                                  <Badge
                                    key={index}
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    {dupId.substring(0, 8)}...
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {analysis.metadata.similar_images &&
                        analysis.metadata.similar_images.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">
                              صور مشابهة:
                            </h5>
                            <div className="space-y-2">
                              {analysis.metadata.similar_images.map(
                                (sim, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <span className="font-mono">
                                      {sim.id.substring(0, 12)}...
                                    </span>
                                    <Badge variant="outline">
                                      {Math.round(sim.similarity_score * 100)}%
                                      تشابه
                                    </Badge>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* تبويب الأداء */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* إحصائيات المعالجة */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Cpu className="w-5 h-5 text-blue-500" />
                      <span>إحصائيات المعالجة</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {formatProcessingTime(analysis.processing_time)}
                        </div>
                        <div className="text-gray-500">وقت المعالجة</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {analysis.performance.memory_usage.toFixed(1)} MB
                        </div>
                        <div className="text-gray-500">استخدام الذاكرة</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm">معالج الرسوميات</span>
                      <Badge
                        variant={
                          analysis.performance.gpu_used
                            ? "default"
                            : "secondary"
                        }
                      >
                        {analysis.performance.gpu_used
                          ? "مُستخدم"
                          : "غير مُستخدم"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* إصدارات النماذج */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-purple-500" />
                      <span>إصدارات النماذج</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analysis.performance.model_versions).map(
                        ([model, version]) => (
                          <div
                            key={model}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-medium">{model}</span>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {version}
                            </Badge>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* مراحل المعالجة */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-green-500" />
                      <span>مراحل المعالجة</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.performance.processing_stages.map(
                        (stage, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <Badge
                                variant="outline"
                                className="w-8 text-center"
                              >
                                {index + 1}
                              </Badge>
                              <div>
                                <div className="font-medium">{stage.stage}</div>
                                <div className="text-sm text-gray-500">
                                  {formatProcessingTime(stage.duration)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {stage.success ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                              )}
                              {stage.error && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  خطأ
                                </Badge>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default PhotoAnalysisPanel;
