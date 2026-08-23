import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  EyeOff,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Calendar,
  HardDrive,
  Hash,
  Zap,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  Trash2,
  Star,
  Copy,
  ArrowUpDown,
  Info,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: number;
  hash?: string;
  isSelected: boolean;
  isDuplicate: boolean;
  preview?: string;
  metadata?: Record<string, any>;
}

interface DuplicateGroup {
  id: string;
  files: FileItem[];
  similarity: number;
  method: string;
  confidence: number;
  category: string;
}

interface FileComparisonProps {
  duplicateGroup: DuplicateGroup;
  onFileAction: (fileId: string, action: "keep" | "delete" | "preview") => void;
  onGroupAction: (
    groupId: string,
    action: "keep_newest" | "keep_largest" | "keep_first",
  ) => void;
}

export default function FileComparison({
  duplicateGroup,
  onFileAction,
  onGroupAction,
}: FileComparisonProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentView, setCurrentView] = useState<
    "grid" | "comparison" | "detailed"
  >("grid");
  const [sortBy, setSortBy] = useState<"name" | "size" | "date" | "path">(
    "date",
  );
  const [showMetadata, setShowMetadata] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const sortedFiles = [...duplicateGroup.files].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "size":
        return b.size - a.size;
      case "date":
        return b.lastModified - a.lastModified;
      case "path":
        return a.path.localeCompare(b.path);
      default:
        return 0;
    }
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("ar", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (type.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (type.startsWith("audio/")) return <Music className="w-4 h-4" />;
    if (type.includes("text") || type.includes("document"))
      return <FileText className="w-4 h-4" />;
    return <Archive className="w-4 h-4" />;
  };

  const getRecommendation = (files: FileItem[]) => {
    const newest = files.reduce((prev, current) =>
      prev.lastModified > current.lastModified ? prev : current,
    );
    const largest = files.reduce((prev, current) =>
      prev.size > current.size ? prev : current,
    );

    if (newest.id === largest.id) {
      return {
        file: newest,
        reason: "الأحدث والأكبر",
        confidence: 95,
        type: "excellent",
      };
    }

    const sizeDiff =
      Math.abs(newest.size - largest.size) /
      Math.max(newest.size, largest.size);
    if (sizeDiff < 0.1) {
      return {
        file: newest,
        reason: "الأحدث (أحجام متشابهة)",
        confidence: 85,
        type: "good",
      };
    }

    const timeDiff = newest.lastModified - largest.lastModified;
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    if (daysDiff < 30 && largest.size > newest.size * 1.5) {
      return {
        file: largest,
        reason: "أكبر حجماً (تحديث حديث)",
        confidence: 75,
        type: "good",
      };
    }

    return {
      file: newest,
      reason: "الأحدث",
      confidence: 70,
      type: "fair",
    };
  };

  const recommendation = getRecommendation(duplicateGroup.files);

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const selectRecommended = () => {
    const newSelection = new Set<string>();
    duplicateGroup.files.forEach((file) => {
      if (file.id !== recommendation.file.id) {
        newSelection.add(file.id);
      }
    });
    setSelectedFiles(newSelection);
  };

  const getFileStatusColor = (file: FileItem) => {
    if (file.id === recommendation.file.id) {
      return "border-green-500 bg-green-900/20";
    }
    if (selectedFiles.has(file.id)) {
      return "border-red-500 bg-red-900/20";
    }
    return "border-gray-600 bg-gray-900/20";
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-yellow-400">
            <Copy className="w-5 h-5" />
            مقارنة الملفات المكررة
            <Badge variant="outline" className="ml-2">
              {duplicateGroup.files.length} ملفات
            </Badge>
            <Badge className="bg-blue-600">
              {duplicateGroup.confidence}% ثقة
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMetadata(!showMetadata)}
            >
              <Info className="w-4 h-4 mr-1" />
              {showMetadata ? "إخفاء" : "عرض"} التفاصيل
            </Button>
            <Button
              onClick={selectRecommended}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Star className="w-4 h-4 mr-1" />
              اختيار المُوصى
            </Button>
          </div>
        </div>

        {/* Recommendation Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-3 rounded-lg border",
            recommendation.type === "excellent"
              ? "bg-green-900/30 border-green-500/50"
              : recommendation.type === "good"
                ? "bg-blue-900/30 border-blue-500/50"
                : "bg-yellow-900/30 border-yellow-500/50",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {recommendation.type === "excellent" ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : recommendation.type === "good" ? (
                <Info className="w-4 h-4 text-blue-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
              )}
              <span className="font-medium">
                يُنصح بالاحتفاظ بـ: {recommendation.file.name}
              </span>
              <Badge variant="outline" className="text-xs">
                {recommendation.reason}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Progress
                value={recommendation.confidence}
                className="w-20 h-2"
              />
              <span className="text-xs text-gray-400">
                {recommendation.confidence}%
              </span>
            </div>
          </div>
        </motion.div>
      </CardHeader>

      <CardContent>
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">ترتيب حسب:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black/20 border border-white/20 rounded px-2 py-1 text-sm"
            >
              <option value="date">التاريخ</option>
              <option value="size">الحجم</option>
              <option value="name">الاسم</option>
              <option value="path">المسار</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={currentView === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("grid")}
            >
              شبكة
            </Button>
            <Button
              variant={currentView === "comparison" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView("comparison")}
            >
              مقارنة
            </Button>
          </div>
        </div>

        {/* Grid View */}
        {currentView === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105",
                  getFileStatusColor(file),
                )}
                onClick={() => toggleFileSelection(file.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(file.type)}
                    <span className="font-medium text-sm truncate">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {file.id === recommendation.file.id && (
                      <Badge className="bg-green-600 text-xs">مُوصى</Badge>
                    )}
                    {selectedFiles.has(file.id) && (
                      <Badge variant="destructive" className="text-xs">
                        للحذف
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(file.lastModified)}</span>
                  </div>
                  {file.hash && (
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      <span className="font-mono text-xs">
                        {file.hash.substring(0, 8)}...
                      </span>
                    </div>
                  )}
                  {showMetadata && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="font-mono text-xs break-all">
                        {file.path}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileAction(file.id, "preview");
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    معاينة
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Copy to clipboard or download
                      navigator.clipboard?.writeText(file.path);
                    }}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    نسخ
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Comparison View */}
        {currentView === "comparison" && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-3">ملف</th>
                    <th className="text-left p-3">الحجم</th>
                    <th className="text-left p-3">تاريخ التعديل</th>
                    <th className="text-left p-3">المسار</th>
                    <th className="text-left p-3">الحالة</th>
                    <th className="text-left p-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFiles.map((file, index) => (
                    <motion.tr
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "border-b border-white/10 hover:bg-white/5",
                        file.id === recommendation.file.id && "bg-green-900/20",
                        selectedFiles.has(file.id) && "bg-red-900/20",
                      )}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.id)}
                            onChange={() => toggleFileSelection(file.id)}
                            className="rounded"
                          />
                          {getCategoryIcon(file.type)}
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-400">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="p-3 text-gray-400">
                        {formatDate(file.lastModified)}
                      </td>
                      <td className="p-3 text-gray-400 font-mono text-xs">
                        {file.path}
                      </td>
                      <td className="p-3">
                        {file.id === recommendation.file.id ? (
                          <Badge className="bg-green-600">مُوصى</Badge>
                        ) : selectedFiles.has(file.id) ? (
                          <Badge variant="destructive">للحذف</Badge>
                        ) : (
                          <Badge variant="outline">عادي</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onFileAction(file.id, "preview")}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onFileAction(file.id, "keep")}
                          >
                            <Star className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>محدد للحذف: {selectedFiles.size}</span>
            <span>•</span>
            <span>
              سيتم توفير:{" "}
              {formatFileSize(
                Array.from(selectedFiles).reduce((sum, fileId) => {
                  const file = duplicateGroup.files.find(
                    (f) => f.id === fileId,
                  );
                  return sum + (file?.size || 0);
                }, 0),
              )}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onGroupAction(duplicateGroup.id, "keep_newest")}
            >
              <Calendar className="w-4 h-4 mr-1" />
              الاحتفاظ بالأحدث
            </Button>
            <Button
              variant="outline"
              onClick={() => onGroupAction(duplicateGroup.id, "keep_largest")}
            >
              <HardDrive className="w-4 h-4 mr-1" />
              الاحتفاظ بالأكبر
            </Button>
            <Button
              onClick={() => {
                Array.from(selectedFiles).forEach((fileId) => {
                  onFileAction(fileId, "delete");
                });
              }}
              disabled={selectedFiles.size === 0}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              حذف المحدد ({selectedFiles.size})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
