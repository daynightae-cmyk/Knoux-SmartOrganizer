import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FixedSizeGrid as Grid } from "react-window";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Heart,
  Star,
  Users,
  FileText,
  Shield,
  Camera,
  MoreHorizontal,
  Maximize2,
  Edit3,
  Share2,
  Trash2,
  Tag,
  Download,
  Copy,
  Archive,
  Flag,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Clock,
  Palette,
  Target,
  Activity,
  Zap,
  TrendingUp,
} from "lucide-react";

interface SmartPhoto {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  dimensions: { width: number; height: number };
  format: string;
  status: "processing" | "completed" | "error";

  // AI Analysis Results
  classification: Array<{
    label: string;
    confidence: number;
    category: string;
  }>;
  description: string;
  faces: Array<{
    bbox: [number, number, number, number];
    confidence: number;
    age: number;
    gender: "male" | "female";
    emotions: Record<string, number>;
  }>;
  objects: Array<{
    label: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  ocr_text: string;
  dominant_colors: string[];
  quality_score: number;
  aesthetics_score: number;
  nsfw_score: number;
  tags: string[];
  smart_categories: string[];
  auto_album: string;

  // Metadata
  created_at: Date;
  processed_at?: Date;
  processing_time?: number;
  file_hash?: string;
  location?: { lat: number; lng: number };
  camera_info?: Record<string, any>;

  // User interactions
  is_favorite: boolean;
  is_selected: boolean;
  is_archived: boolean;
  is_flagged: boolean;
  rating?: number;
  user_tags: string[];
  notes?: string;
}

interface SmartPhotoGridProps {
  photos: SmartPhoto[];
  onPhotoSelect?: (photoId: string, selected: boolean) => void;
  onPhotoAction?: (action: string, photoId: string, data?: any) => void;
  selectedPhotos?: Set<string>;
  viewMode?: "grid" | "masonry" | "timeline";
  itemSize?: number;
  showDetails?: boolean;
  enableVirtualization?: boolean;
  sortBy?: "name" | "date" | "quality" | "size" | "relevance";
  sortDirection?: "asc" | "desc";
  filterConfig?: {
    quality_min?: number;
    nsfw_max?: number;
    has_faces?: boolean;
    has_text?: boolean;
    categories?: string[];
    favorites_only?: boolean;
  };
}

export function SmartPhotoGrid({
  photos,
  onPhotoSelect,
  onPhotoAction,
  selectedPhotos = new Set(),
  viewMode = "grid",
  itemSize = 280,
  showDetails = true,
  enableVirtualization = false,
  sortBy = "date",
  sortDirection = "desc",
  filterConfig = {},
}: SmartPhotoGridProps) {
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [gridColumns, setGridColumns] = useState(4);

  // حساب أبعاد الشبكة بناءً على حجم الشاشة
  useEffect(() => {
    const updateGridColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setGridColumns(2);
      else if (width < 1024) setGridColumns(3);
      else if (width < 1280) setGridColumns(4);
      else if (width < 1536) setGridColumns(5);
      else setGridColumns(6);
    };

    updateGridColumns();
    window.addEventListener("resize", updateGridColumns);
    return () => window.removeEventListener("resize", updateGridColumns);
  }, []);

  // فلترة وترتيب الصور
  const filteredAndSortedPhotos = useMemo(() => {
    let filtered = [...photos];

    // تطبيق الفلاتر
    if (filterConfig.quality_min !== undefined) {
      filtered = filtered.filter(
        (photo) => photo.quality_score >= filterConfig.quality_min!,
      );
    }

    if (filterConfig.nsfw_max !== undefined) {
      filtered = filtered.filter(
        (photo) => photo.nsfw_score <= filterConfig.nsfw_max!,
      );
    }

    if (filterConfig.has_faces) {
      filtered = filtered.filter((photo) => photo.faces.length > 0);
    }

    if (filterConfig.has_text) {
      filtered = filtered.filter((photo) => photo.ocr_text.length > 0);
    }

    if (filterConfig.categories && filterConfig.categories.length > 0) {
      filtered = filtered.filter((photo) =>
        photo.smart_categories.some((cat) =>
          filterConfig.categories!.includes(cat),
        ),
      );
    }

    if (filterConfig.favorites_only) {
      filtered = filtered.filter((photo) => photo.is_favorite);
    }

    // ترتيب النتائج
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "date":
          comparison = a.created_at.getTime() - b.created_at.getTime();
          break;
        case "quality":
          comparison = a.quality_score - b.quality_score;
          break;
        case "size":
          comparison = a.size - b.size;
          break;
        case "relevance":
          const aScore =
            a.quality_score * 0.4 +
            a.aesthetics_score * 0.3 +
            (a.classification[0]?.confidence || 0) * 0.3;
          const bScore =
            b.quality_score * 0.4 +
            b.aesthetics_score * 0.3 +
            (b.classification[0]?.confidence || 0) * 0.3;
          comparison = aScore - bScore;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [photos, filterConfig, sortBy, sortDirection]);

  const handlePhotoClick = useCallback(
    (photo: SmartPhoto, action: string = "select") => {
      switch (action) {
        case "select":
          onPhotoSelect?.(photo.id, !selectedPhotos.has(photo.id));
          break;
        case "favorite":
          onPhotoAction?.("toggle_favorite", photo.id);
          break;
        case "preview":
          setExpandedPhoto(expandedPhoto === photo.id ? null : photo.id);
          break;
        case "edit":
          onPhotoAction?.("edit", photo.id);
          break;
        case "share":
          onPhotoAction?.("share", photo.id);
          break;
        case "delete":
          onPhotoAction?.("delete", photo.id);
          break;
        case "download":
          onPhotoAction?.("download", photo.id);
          break;
        case "archive":
          onPhotoAction?.("archive", photo.id);
          break;
        case "flag":
          onPhotoAction?.("flag", photo.id);
          break;
      }
    },
    [selectedPhotos, expandedPhoto, onPhotoSelect, onPhotoAction],
  );

  // مكون الصورة المفردة
  const PhotoCard = React.memo(
    ({ photo, style }: { photo: SmartPhoto; style?: React.CSSProperties }) => {
      const isSelected = selectedPhotos.has(photo.id);
      const isHovered = hoveredPhoto === photo.id;
      const isExpanded = expandedPhoto === photo.id;
      const topClassification = photo.classification[0];

      return (
        <motion.div
          style={style}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          whileHover={{ y: -4 }}
          className={cn(
            "relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden",
            "cursor-pointer border-2 transition-all duration-300",
            isSelected
              ? "border-blue-500 ring-2 ring-blue-200"
              : "border-transparent hover:border-gray-300",
            photo.status === "processing" && "animate-pulse",
            isExpanded && "z-20 scale-105",
          )}
          onMouseEnter={() => setHoveredPhoto(photo.id)}
          onMouseLeave={() => setHoveredPhoto(null)}
          onClick={() => handlePhotoClick(photo, "select")}
        >
          {/* الصورة الرئيسية */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={photo.previewUrl}
              alt={photo.name}
              className={cn(
                "w-full h-full object-cover transition-transform duration-300",
                isHovered && "scale-110",
              )}
              loading="lazy"
            />

            {/* تراكب الحالة */}
            {photo.status === "processing" && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-center">
                  <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <div className="text-sm">جاري التحليل...</div>
                </div>
              </div>
            )}

            {photo.status === "error" && (
              <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                <div className="text-white text-center">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm">خطأ في التحليل</div>
                </div>
              </div>
            )}

            {/* مؤشرات الذكاء الاصطناعي */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {photo.faces.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-blue-500/80 text-white text-xs"
                >
                  <Users className="w-3 h-3 mr-1" />
                  {photo.faces.length}
                </Badge>
              )}

              {photo.ocr_text && (
                <Badge
                  variant="secondary"
                  className="bg-green-500/80 text-white text-xs"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  نص
                </Badge>
              )}

              {photo.nsfw_score > 0.3 && (
                <Badge
                  variant="destructive"
                  className="bg-red-500/80 text-white text-xs"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  حساس
                </Badge>
              )}

              {photo.quality_score > 0.8 && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-500/80 text-white text-xs"
                >
                  <Star className="w-3 h-3 mr-1" />
                  عالي
                </Badge>
              )}

              {photo.objects.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-purple-500/80 text-white text-xs"
                >
                  <Target className="w-3 h-3 mr-1" />
                  {photo.objects.length}
                </Badge>
              )}
            </div>

            {/* أزرار التحكم السريع */}
            <AnimatePresence>
              {(isHovered || isSelected) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-2 right-2 flex gap-1"
                >
                  <Button
                    size="sm"
                    variant={photo.is_favorite ? "default" : "secondary"}
                    className="w-8 h-8 p-0 backdrop-blur-sm bg-white/80 hover:bg-white/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePhotoClick(photo, "favorite");
                    }}
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4",
                        photo.is_favorite && "fill-current text-red-500",
                      )}
                    />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-8 h-8 p-0 backdrop-blur-sm bg-white/80 hover:bg-white/90"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handlePhotoClick(photo, "preview")}
                      >
                        <Maximize2 className="w-4 h-4 mr-2" />
                        عرض كامل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePhotoClick(photo, "edit")}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        تحرير
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePhotoClick(photo, "share")}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        مشاركة
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePhotoClick(photo, "download")}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        تحميل
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handlePhotoClick(photo, "archive")}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        أرشفة
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePhotoClick(photo, "flag")}
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        إبلاغ
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handlePhotoClick(photo, "delete")}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              )}
            </AnimatePresence>

            {/* مؤشر الاختيار */}
            {isSelected && (
              <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500">
                <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            {/* مؤشر التقييم */}
            {photo.rating && (
              <div className="absolute bottom-2 left-2 flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3",
                      i < photo.rating!
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300",
                    )}
                  />
                ))}
              </div>
            )}

            {/* شارات إضافية */}
            <div className="absolute bottom-2 right-2 flex gap-1">
              {photo.is_archived && (
                <Badge
                  variant="secondary"
                  className="bg-gray-500/80 text-white text-xs"
                >
                  <Archive className="w-3 h-3" />
                </Badge>
              )}
              {photo.is_flagged && (
                <Badge
                  variant="destructive"
                  className="bg-red-500/80 text-white text-xs"
                >
                  <Flag className="w-3 h-3" />
                </Badge>
              )}
            </div>
          </div>

          {/* معلومات الصورة */}
          {showDetails && (
            <div className="p-3 space-y-2">
              <div className="font-medium text-sm truncate" title={photo.name}>
                {photo.name}
              </div>

              <div className="text-xs text-gray-500 flex items-center justify-between">
                <span>
                  {photo.dimensions.width}×{photo.dimensions.height}
                </span>
                <span>{(photo.size / (1024 * 1024)).toFixed(1)} MB</span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {photo.processing_time ? `${photo.processing_time}ms` : "-"}
                </span>
              </div>

              {/* التصنيف الذكي */}
              {topClassification && (
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    {topClassification.label}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(topClassification.confidence * 100)}%
                  </Badge>
                </div>
              )}

              {/* الوصف الذكي */}
              {photo.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  "{photo.description}"
                </p>
              )}

              {/* الفئات الذكية */}
              {photo.smart_categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {photo.smart_categories.slice(0, 3).map((category, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {photo.smart_categories.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{photo.smart_categories.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* العلامات المخصصة */}
              {photo.user_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {photo.user_tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {photo.user_tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{photo.user_tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* مؤشرات الجودة */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>الجودة</span>
                  <span>{Math.round(photo.quality_score * 100)}%</span>
                </div>
                <Progress value={photo.quality_score * 100} className="h-1" />
              </div>

              {/* مؤشر الجمالية */}
              {photo.aesthetics_score > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>الجمالية</span>
                    <span>{Math.round(photo.aesthetics_score * 100)}%</span>
                  </div>
                  <Progress
                    value={photo.aesthetics_score * 100}
                    className="h-1"
                  />
                </div>
              )}

              {/* الألوان السائدة */}
              {photo.dominant_colors.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Palette className="w-3 h-3 text-gray-500" />
                  <div className="flex space-x-1">
                    {photo.dominant_colors.slice(0, 5).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      );
    },
  );

  // مكون الشبكة المحسنة
  const VirtualizedGrid = useCallback(
    ({ columnIndex, rowIndex, style }: any) => {
      const photoIndex = rowIndex * gridColumns + columnIndex;
      const photo = filteredAndSortedPhotos[photoIndex];

      if (!photo) return null;

      return (
        <div style={style} className="p-2">
          <PhotoCard photo={photo} />
        </div>
      );
    },
    [filteredAndSortedPhotos, gridColumns],
  );

  if (filteredAndSortedPhotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Camera className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          لا توجد صور تطابق الفلاتر المحددة
        </h3>
        <p className="text-gray-500">
          جرب تغيير إعدادات الفلتر أو إضافة المزيد من الصور
        </p>
      </div>
    );
  }

  const rowCount = Math.ceil(filteredAndSortedPhotos.length / gridColumns);

  return (
    <div className="w-full h-full">
      {enableVirtualization && filteredAndSortedPhotos.length > 50 ? (
        <Grid
          columnCount={gridColumns}
          rowCount={rowCount}
          columnWidth={itemSize}
          rowHeight={itemSize + (showDetails ? 120 : 40)}
          height={600}
          width="100%"
          itemData={{
            photos: filteredAndSortedPhotos,
            columns: gridColumns,
          }}
        >
          {VirtualizedGrid}
        </Grid>
      ) : (
        <div
          className={cn(
            "grid gap-6",
            `grid-cols-${Math.min(gridColumns, 6)}`,
            viewMode === "masonry" && "masonry-grid",
          )}
          style={{
            gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          }}
        >
          <AnimatePresence>
            {filteredAndSortedPhotos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default SmartPhotoGrid;
