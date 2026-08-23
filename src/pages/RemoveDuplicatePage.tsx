import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Search,
  Upload,
  FolderOpen,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Copy,
  Hash,
  Image,
  FileText,
  Music,
  Video,
  Archive,
  Settings,
  Brain,
  Zap,
  Target,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  Filter,
  Download,
  X,
} from "lucide-react";
import { RemoveDuplicatePreview } from "@/components/LivePreviewPanel";

// Types for duplicate detection
interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  hash?: string;
  lastModified: number;
  isSelected: boolean;
  isDuplicate: boolean;
  similarityScore?: number;
  webkitRelativePath?: string;
}

interface DuplicateGroup {
  id: string;
  hash: string;
  files: FileItem[];
  totalSize: number;
  category: string;
  confidence: number;
}

interface ScanSettings {
  scanByHash: boolean;
  scanByName: boolean;
  scanBySimilarity: boolean;
  includeImages: boolean;
  includeDocuments: boolean;
  includeVideos: boolean;
  includeAudio: boolean;
  minimumFileSize: number;
  similarityThreshold: number;
  preserveNewest: boolean;
  preserveLargest: boolean;
}

const defaultScanSettings: ScanSettings = {
  scanByHash: true,
  scanByName: false,
  scanBySimilarity: false,
  includeImages: true,
  includeDocuments: true,
  includeVideos: true,
  includeAudio: true,
  minimumFileSize: 0,
  similarityThreshold: 85,
  preserveNewest: true,
  preserveLargest: false,
};

export default function RemoveDuplicatePage() {
  // State management
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanSettings, setScanSettings] =
    useState<ScanSettings>(defaultScanSettings);
  const [selectedTab, setSelectedTab] = useState("scan");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [scanResults, setScanResults] = useState<{
    totalFiles: number;
    duplicateFiles: number;
    spaceSavings: number;
    scanTime: number;
  } | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // File processing functions
  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const getFileCategory = (file: File): string => {
    const type = file.type.toLowerCase();
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.startsWith("audio/")) return "audio";
    if (
      type.includes("document") ||
      type.includes("pdf") ||
      type.includes("text")
    )
      return "document";
    return "other";
  };

  const shouldIncludeFile = (file: File, settings: ScanSettings): boolean => {
    if (file.size < settings.minimumFileSize) return false;

    const category = getFileCategory(file);
    switch (category) {
      case "image":
        return settings.includeImages;
      case "video":
        return settings.includeVideos;
      case "audio":
        return settings.includeAudio;
      case "document":
        return settings.includeDocuments;
      default:
        return true;
    }
  };

  const calculateStringSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 100;

    const editDistance = levenshteinDistance(longer, shorter);
    return ((longer.length - editDistance) / longer.length) * 100;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  // Main scanning logic
  const scanForDuplicates = async (files: File[]) => {
    setIsScanning(true);
    setScanProgress(0);
    const startTime = Date.now();

    try {
      // Filter files based on settings
      const filteredFiles = files.filter((file) =>
        shouldIncludeFile(file, scanSettings),
      );

      // Convert to FileItem objects
      const fileItems: FileItem[] = [];

      for (let i = 0; i < filteredFiles.length; i++) {
        const file = filteredFiles[i];
        setScanProgress((i / filteredFiles.length) * 50);

        const fileItem: FileItem = {
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          path: file.webkitRelativePath || file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          isSelected: false,
          isDuplicate: false,
        };

        // Calculate hash if enabled
        if (scanSettings.scanByHash) {
          try {
            fileItem.hash = await calculateFileHash(file);
          } catch (error) {
            console.warn(`Failed to hash file ${file.name}:`, error);
          }
        }

        fileItems.push(fileItem);
      }

      // Find duplicates
      const groups: Map<string, FileItem[]> = new Map();

      // Group by hash
      if (scanSettings.scanByHash) {
        fileItems.forEach((item) => {
          if (item.hash) {
            if (!groups.has(item.hash)) {
              groups.set(item.hash, []);
            }
            groups.get(item.hash)!.push(item);
          }
        });
      }

      // Group by name similarity
      if (scanSettings.scanByName) {
        const nameGroups: Map<string, FileItem[]> = new Map();

        fileItems.forEach((item) => {
          let foundGroup = false;

          for (const [groupKey, groupFiles] of nameGroups) {
            const similarity = calculateStringSimilarity(
              item.name.toLowerCase(),
              groupKey.toLowerCase(),
            );
            if (similarity >= scanSettings.similarityThreshold) {
              groupFiles.push(item);
              foundGroup = true;
              break;
            }
          }

          if (!foundGroup) {
            nameGroups.set(item.name, [item]);
          }
        });

        // Merge with existing groups
        nameGroups.forEach((files, key) => {
          if (files.length > 1) {
            const groupKey = `name-${key}`;
            groups.set(groupKey, files);
          }
        });
      }

      setScanProgress(75);

      // Create duplicate groups
      const duplicateGroups: DuplicateGroup[] = [];

      groups.forEach((files, key) => {
        if (files.length > 1) {
          // Mark all but one as duplicates
          const sortedFiles = [...files].sort((a, b) => {
            if (scanSettings.preserveNewest) {
              return b.lastModified - a.lastModified;
            }
            if (scanSettings.preserveLargest) {
              return b.size - a.size;
            }
            return a.name.localeCompare(b.name);
          });

          // Keep first file, mark others as duplicates
          sortedFiles.forEach((file, index) => {
            file.isDuplicate = index > 0;
            file.isSelected = index > 0; // Auto-select duplicates for deletion
          });

          duplicateGroups.push({
            id: `group-${key}`,
            hash: key,
            files: sortedFiles,
            totalSize: files.reduce((sum, f) => sum + f.size, 0),
            category: getFileCategory({ type: files[0].type } as File),
            confidence: scanSettings.scanByHash ? 100 : 85,
          });
        }
      });

      setScanProgress(100);

      // Calculate results
      const totalDuplicateFiles = duplicateGroups.reduce(
        (sum, group) => sum + group.files.filter((f) => f.isDuplicate).length,
        0,
      );
      const spaceSavings = duplicateGroups.reduce(
        (sum, group) =>
          sum +
          group.files
            .filter((f) => f.isDuplicate)
            .reduce((s, f) => s + f.size, 0),
        0,
      );

      setScanResults({
        totalFiles: fileItems.length,
        duplicateFiles: totalDuplicateFiles,
        spaceSavings,
        scanTime: Date.now() - startTime,
      });

      setSelectedFiles(fileItems);
      setDuplicateGroups(duplicateGroups);
      setSelectedTab("results");

      toast.success(`🎉 تم العثور على ${duplicateGroups.length} مجموعة تكرار!`);
    } catch (error) {
      console.error("خطأ في فحص التكرارات:", error);
      toast.error("حدث خطأ أثناء فحص التكرارات");
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  // File handlers
  const handleFileSelection = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        scanForDuplicates(Array.from(files));
      }
    },
    [scanSettings],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        scanForDuplicates(Array.from(files));
      }
    },
    [scanSettings],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Removal logic (simulated for web environment)
  const removeDuplicates = async () => {
    const filesToRemove = selectedFiles.filter(
      (f) => f.isSelected && f.isDuplicate,
    );

    if (filesToRemove.length === 0) {
      toast.warning("الرجاء تحديد ملفات للحذف");
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف ${filesToRemove.length} ملف؟\n` +
        `سيتم توفير ${(filesToRemove.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)).toFixed(2)} ميجابايت من المساحة.`,
    );

    if (!confirmed) return;

    setIsRemoving(true);

    try {
      // في بيئة الويب، لا يمكن حذف الملفات فعلياً
      // نقوم بمحاكاة العملية
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // تحديث القوائم
      const remainingFiles = selectedFiles.filter(
        (f) => !f.isSelected || !f.isDuplicate,
      );
      setSelectedFiles(remainingFiles);

      // تحديث المجموعات
      const updatedGroups = duplicateGroups
        .map((group) => ({
          ...group,
          files: group.files.filter((f) => !f.isSelected || !f.isDuplicate),
        }))
        .filter((group) => group.files.length > 1);

      setDuplicateGroups(updatedGroups);

      toast.success(`✅ تم حذف ${filesToRemove.length} ملف (محاكاة)`);
    } catch (error) {
      console.error("خطأ في حذف الملفات:", error);
      toast.error("حدث خطأ أثناء حذف الملفات");
    } finally {
      setIsRemoving(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "image":
        return <Image className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "audio":
        return <Music className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      default:
        return <Archive className="w-4 h-4" />;
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {dragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md flex items-center justify-center"
          >
            <div className="text-center p-8 bg-white/10 rounded-3xl shadow-2xl border border-white/20">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-xl"
              >
                <Upload className="w-16 h-16 text-white" />
              </motion.div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
                اسحب الملفات هنا
              </h3>
              <p className="text-lg text-gray-300">
                سيتم فحصها تلقائياً للبحث عن التكرارات
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8">
        {/* Live Preview Panel */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <RemoveDuplicatePreview className="max-w-6xl mx-auto" />
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl shadow-xl">
              <RefreshCw className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            RemoveDuplicate
          </h1>
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">
            رييموف دوبليكات
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            أداتك الذكية المتكاملة لحذف التكرار من كل شيء على جهازك بكفاءة ودقة
            فائقة، معززة بالذكاء الاصطناعي
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-md">
              <TabsTrigger
                value="scan"
                className="data-[state=active]:bg-purple-600"
              >
                <Search className="w-4 h-4 mr-2" />
                فحص التكرارات
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="data-[state=active]:bg-purple-600"
              >
                <Target className="w-4 h-4 mr-2" />
                النتائج
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-purple-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                الإعدادات
              </TabsTrigger>
            </TabsList>

            {/* Scan Tab */}
            <TabsContent value="scan" className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-cyan-400">
                    <FolderOpen className="w-5 h-5" />
                    اختيار الملفات والمجلدات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isScanning}
                      className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <div className="font-bold">اختيار ملفات</div>
                        <div className="text-sm opacity-80">ملفات متعددة</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => folderInputRef.current?.click()}
                      disabled={isScanning}
                      variant="outline"
                      className="h-32 border-2 border-purple-400 hover:bg-purple-400/20"
                    >
                      <div className="text-center">
                        <FolderOpen className="w-8 h-8 mx-auto mb-2" />
                        <div className="font-bold">اختيار مجلد</div>
                        <div className="text-sm opacity-80">مجلد كامل</div>
                      </div>
                    </Button>
                  </div>

                  {/* Quick Settings */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-black/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="scanImages"
                        checked={scanSettings.includeImages}
                        onCheckedChange={(checked) =>
                          setScanSettings((prev) => ({
                            ...prev,
                            includeImages: !!checked,
                          }))
                        }
                      />
                      <Label
                        htmlFor="scanImages"
                        className="flex items-center gap-1"
                      >
                        <Image className="w-4 h-4" />
                        صور
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="scanVideos"
                        checked={scanSettings.includeVideos}
                        onCheckedChange={(checked) =>
                          setScanSettings((prev) => ({
                            ...prev,
                            includeVideos: !!checked,
                          }))
                        }
                      />
                      <Label
                        htmlFor="scanVideos"
                        className="flex items-center gap-1"
                      >
                        <Video className="w-4 h-4" />
                        فيديو
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="scanDocuments"
                        checked={scanSettings.includeDocuments}
                        onCheckedChange={(checked) =>
                          setScanSettings((prev) => ({
                            ...prev,
                            includeDocuments: !!checked,
                          }))
                        }
                      />
                      <Label
                        htmlFor="scanDocuments"
                        className="flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        مستندات
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="scanAudio"
                        checked={scanSettings.includeAudio}
                        onCheckedChange={(checked) =>
                          setScanSettings((prev) => ({
                            ...prev,
                            includeAudio: !!checked,
                          }))
                        }
                      />
                      <Label
                        htmlFor="scanAudio"
                        className="flex items-center gap-1"
                      >
                        <Music className="w-4 h-4" />
                        صوت
                      </Label>
                    </div>
                  </div>

                  {/* Scanning Progress */}
                  {isScanning && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                          <span className="font-medium">
                            جاري فحص الملفات...
                          </span>
                        </div>
                        <span className="text-sm">
                          {Math.round(scanProgress)}%
                        </span>
                      </div>
                      <Progress value={scanProgress} className="mb-2" />
                      <p className="text-sm text-gray-300">
                        جاري تحليل الملفات والبحث عن التكرارات...
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6">
              {scanResults && (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      نتائج الفحص
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-black/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">
                          {scanResults.totalFiles}
                        </div>
                        <div className="text-sm text-gray-300">
                          إجمالي الملفات
                        </div>
                      </div>
                      <div className="text-center p-4 bg-black/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">
                          {duplicateGroups.length}
                        </div>
                        <div className="text-sm text-gray-300">
                          مجموعات التكرار
                        </div>
                      </div>
                      <div className="text-center p-4 bg-black/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-400">
                          {scanResults.duplicateFiles}
                        </div>
                        <div className="text-sm text-gray-300">ملفات مكررة</div>
                      </div>
                      <div className="text-center p-4 bg-black/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {formatFileSize(scanResults.spaceSavings)}
                        </div>
                        <div className="text-sm text-gray-300">
                          مساحة محتملة
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Duplicate Groups */}
              {duplicateGroups.length > 0 && (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-yellow-400">
                      <Copy className="w-5 h-5" />
                      الملفات المكررة ({duplicateGroups.length} مجموعة)
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const newFiles = selectedFiles.map((f) => ({
                            ...f,
                            isSelected: f.isDuplicate,
                          }));
                          setSelectedFiles(newFiles);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        تحديد الكل
                      </Button>
                      <Button
                        onClick={removeDuplicates}
                        disabled={
                          isRemoving ||
                          !selectedFiles.some(
                            (f) => f.isSelected && f.isDuplicate,
                          )
                        }
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isRemoving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        حذف المحدد
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                    {duplicateGroups.map((group, groupIndex) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIndex * 0.1 }}
                        className="p-4 bg-black/20 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(group.category)}
                            <span className="font-bold">
                              مجموعة #{groupIndex + 1}
                            </span>
                            <Badge variant="secondary">
                              {group.files.length} ملفات
                            </Badge>
                            <Badge variant="outline">
                              {formatFileSize(group.totalSize)}
                            </Badge>
                            <Badge className="bg-green-600">
                              {group.confidence}% ثقة
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {group.files.map((file, fileIndex) => (
                            <div
                              key={file.id}
                              className={cn(
                                "flex items-center justify-between p-3 rounded border",
                                file.isDuplicate
                                  ? "bg-red-900/20 border-red-500/30"
                                  : "bg-green-900/20 border-green-500/30",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={file.isSelected}
                                  onCheckedChange={(checked) => {
                                    const newFiles = selectedFiles.map((f) =>
                                      f.id === file.id
                                        ? { ...f, isSelected: !!checked }
                                        : f,
                                    );
                                    setSelectedFiles(newFiles);
                                  }}
                                  disabled={!file.isDuplicate}
                                />
                                <div>
                                  <div className="font-medium text-sm">
                                    {file.name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {formatFileSize(file.size)} •{" "}
                                    {new Date(
                                      file.lastModified,
                                    ).toLocaleDateString("ar")}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!file.isDuplicate && (
                                  <Badge className="bg-green-600 text-xs">
                                    محفوظ
                                  </Badge>
                                )}
                                {file.isDuplicate && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    مكرر
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {duplicateGroups.length === 0 && scanResults && (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="text-center py-12">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                    <h3 className="text-xl font-bold text-green-400 mb-2">
                      🎉 لم يتم العثور على تكرارات!
                    </h3>
                    <p className="text-gray-300">
                      جميع ملفاتك فريدة ولا توجد حاجة لحذف أي شيء
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-400">
                    <Settings className="w-5 h-5" />
                    إعدادات الفحص المتقدمة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Scan Methods */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-cyan-400">
                      طرق الفحص
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-black/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label
                            htmlFor="scanByHash"
                            className="flex items-center gap-2"
                          >
                            <Hash className="w-4 h-4" />
                            فحص بالمحتوى (Hash)
                          </Label>
                          <Switch
                            id="scanByHash"
                            checked={scanSettings.scanByHash}
                            onCheckedChange={(checked) =>
                              setScanSettings((prev) => ({
                                ...prev,
                                scanByHash: checked,
                              }))
                            }
                          />
                        </div>
                        <p className="text-sm text-gray-400">
                          دقة 100% لإيجاد الملفات المتطابقة تماماً
                        </p>
                      </div>

                      <div className="p-4 bg-black/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label
                            htmlFor="scanByName"
                            className="flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            فحص بالاسم
                          </Label>
                          <Switch
                            id="scanByName"
                            checked={scanSettings.scanByName}
                            onCheckedChange={(checked) =>
                              setScanSettings((prev) => ({
                                ...prev,
                                scanByName: checked,
                              }))
                            }
                          />
                        </div>
                        <p className="text-sm text-gray-400">
                          إيجاد ملفات بأسماء متشابهة
                        </p>
                      </div>

                      <div className="p-4 bg-black/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label
                            htmlFor="scanBySimilarity"
                            className="flex items-center gap-2"
                          >
                            <Brain className="w-4 h-4" />
                            فحص ذكي (AI)
                          </Label>
                          <Switch
                            id="scanBySimilarity"
                            checked={scanSettings.scanBySimilarity}
                            onCheckedChange={(checked) =>
                              setScanSettings((prev) => ({
                                ...prev,
                                scanBySimilarity: checked,
                              }))
                            }
                          />
                        </div>
                        <p className="text-sm text-gray-400">
                          استخدام الذكاء الاصطناعي للتشابه
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* File Size Filter */}
                  <div>
                    <Label className="text-cyan-400 mb-2 block">
                      الحد الأدنى لحجم الملف (بايت)
                    </Label>
                    <Input
                      type="number"
                      value={scanSettings.minimumFileSize}
                      onChange={(e) =>
                        setScanSettings((prev) => ({
                          ...prev,
                          minimumFileSize: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="bg-black/20 border-white/20"
                    />
                  </div>

                  {/* Similarity Threshold */}
                  {scanSettings.scanByName && (
                    <div>
                      <Label className="text-cyan-400 mb-2 block">
                        عتبة التشابه: {scanSettings.similarityThreshold}%
                      </Label>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={scanSettings.similarityThreshold}
                        onChange={(e) =>
                          setScanSettings((prev) => ({
                            ...prev,
                            similarityThreshold: parseInt(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Preservation Options */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-cyan-400">
                      خيارات الحفظ
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="preserveNewest"
                          checked={scanSettings.preserveNewest}
                          onCheckedChange={(checked) => {
                            setScanSettings((prev) => ({
                              ...prev,
                              preserveNewest: checked,
                              preserveLargest: checked
                                ? false
                                : prev.preserveLargest,
                            }));
                          }}
                        />
                        <Label htmlFor="preserveNewest">الاحتفاظ بالأحدث</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="preserveLargest"
                          checked={scanSettings.preserveLargest}
                          onCheckedChange={(checked) => {
                            setScanSettings((prev) => ({
                              ...prev,
                              preserveLargest: checked,
                              preserveNewest: checked
                                ? false
                                : prev.preserveNewest,
                            }));
                          }}
                        />
                        <Label htmlFor="preserveLargest">
                          الاحتفاظ بالأكبر
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelection}
        className="hidden"
        accept="*/*"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        webkitdirectory=""
        onChange={handleFileSelection}
        className="hidden"
      />
    </div>
  );
}
