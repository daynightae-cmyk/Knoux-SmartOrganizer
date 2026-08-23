import React, { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Brain,
  Upload,
  Camera,
  Users,
  FileText,
  Palette,
  Target,
  Activity,
  Star,
  Settings,
  ImageIcon,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface SimplePhoto {
  id: string;
  name: string;
  size: number;
  previewUrl: string;
  status: "processing" | "completed" | "error";
  analysis?: {
    categories: string[];
    confidence: number;
    hasText: boolean;
    hasFaces: boolean;
    quality: number;
  };
}

export function SimplePage() {
  const [photos, setPhotos] = useState<SimplePhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      setIsProcessing(true);

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const photoId = Math.random().toString(36).substr(2, 9);
          const previewUrl = URL.createObjectURL(file);

          const newPhoto: SimplePhoto = {
            id: photoId,
            name: file.name,
            size: Math.round((file.size / (1024 * 1024)) * 100) / 100,
            previewUrl,
            status: "processing",
          };

          setPhotos((prev) => [...prev, newPhoto]);

          // محاكاة التحليل
          setTimeout(
            () => {
              const mockAnalysis = {
                categories: ["طبيعة", "صورة", "منظر"],
                confidence: 0.85 + Math.random() * 0.15,
                hasText: Math.random() > 0.7,
                hasFaces: Math.random() > 0.6,
                quality: 0.7 + Math.random() * 0.3,
              };

              setPhotos((prev) =>
                prev.map((p) =>
                  p.id === photoId
                    ? { ...p, status: "completed", analysis: mockAnalysis }
                    : p,
                ),
              );
            },
            1000 + Math.random() * 2000,
          );
        }

        toast.success(`تم رفع ${files.length} صورة للتحليل`);
      } catch (error) {
        console.error("خطأ في رفع الصور:", error);
        toast.error("حدث خطأ أثناء رفع الصور");
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const togglePhotoSelection = useCallback((photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, []);

  const clearAllPhotos = useCallback(() => {
    photos.forEach((photo) => {
      URL.revokeObjectURL(photo.previewUrl);
    });
    setPhotos([]);
    setSelectedPhotos(new Set());
    toast.info("تم مسح جميع الصور");
  }, [photos]);

  const stats = {
    total: photos.length,
    completed: photos.filter((p) => p.status === "completed").length,
    withText: photos.filter((p) => p.analysis?.hasText).length,
    withFaces: photos.filter((p) => p.analysis?.hasFaces).length,
    highQuality: photos.filter((p) => (p.analysis?.quality || 0) > 0.8).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* رأس التطبيق */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Knoux SmartOrganizer PRO
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  منظم الصور الذكي بالذكاء الاصطناعي - النسخة المبسطة
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                رفع الصور
              </Button>

              {photos.length > 0 && (
                <Button variant="outline" onClick={clearAllPhotos}>
                  <Settings className="w-4 h-4 mr-2" />
                  مسح الكل
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="container mx-auto px-4 py-6">
        {/* إحصائيات سريعة */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-600">إجمالي الصور</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </div>
                <div className="text-sm text-gray-600">تم تحليلها</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.withText}
                </div>
                <div className="text-sm text-gray-600">بها نصوص</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.withFaces}
                </div>
                <div className="text-sm text-gray-600">بها وجوه</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.highQuality}
                </div>
                <div className="text-sm text-gray-600">عالية الجودة</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* عرض الصور */}
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">لا توجد صور بعد</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ابدأ برفع صورك للحصول على تحليل ذكي شامل
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              رفع أول صورة
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden",
                  "cursor-pointer border-2 transition-all duration-300",
                  selectedPhotos.has(photo.id)
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-transparent hover:border-gray-300",
                )}
                onClick={() => togglePhotoSelection(photo.id)}
              >
                {/* معاينة الصورة */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={photo.previewUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* حالة المعالجة */}
                  {photo.status === "processing" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <div className="text-sm">جاري التحليل...</div>
                      </div>
                    </div>
                  )}

                  {/* مؤشرات التحليل */}
                  {photo.analysis && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {photo.analysis.hasFaces && (
                        <Badge className="bg-blue-500/80 text-white text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          وجوه
                        </Badge>
                      )}
                      {photo.analysis.hasText && (
                        <Badge className="bg-green-500/80 text-white text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          نص
                        </Badge>
                      )}
                      {photo.analysis.quality > 0.8 && (
                        <Badge className="bg-yellow-500/80 text-white text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          عالي
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* مؤشر الثقة */}
                  {photo.analysis && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/90 text-gray-800 text-xs">
                        {Math.round(photo.analysis.confidence * 100)}%
                      </Badge>
                    </div>
                  )}

                  {/* مؤشر الاختيار */}
                  {selectedPhotos.has(photo.id) && (
                    <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500">
                      <CheckCircle className="absolute top-2 left-2 w-6 h-6 text-blue-500 bg-white rounded-full" />
                    </div>
                  )}
                </div>

                {/* معلومات الصورة */}
                <div className="p-3 space-y-2">
                  <div
                    className="font-medium text-sm truncate"
                    title={photo.name}
                  >
                    {photo.name}
                  </div>

                  <div className="text-xs text-gray-500">
                    {photo.size} MB •{" "}
                    {photo.status === "completed" ? "مكتمل" : "جاري المعالجة"}
                  </div>

                  {/* الفئات */}
                  {photo.analysis && (
                    <div className="flex flex-wrap gap-1">
                      {photo.analysis.categories
                        .slice(0, 2)
                        .map((category, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {category}
                          </Badge>
                        ))}
                      {photo.analysis.categories.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{photo.analysis.categories.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* شري�� الجودة */}
                  {photo.analysis && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>الجودة</span>
                        <span>{Math.round(photo.analysis.quality * 100)}%</span>
                      </div>
                      <Progress
                        value={photo.analysis.quality * 100}
                        className="h-1"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* شريط التحميل */}
        {isProcessing && (
          <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <div>
                <div className="font-medium text-sm">جاري معالجة الصور...</div>
                <div className="text-xs text-gray-500">
                  الذكاء الاصطناعي يعمل
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Input مخفي للملفات */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}

export default SimplePage;
