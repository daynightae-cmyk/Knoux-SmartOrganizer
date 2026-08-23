// src/types/knoux-x2.ts

// تعريف بيانات الصورة المخزنة في المتجر
export interface ImageData {
  id: string; // معرف فريد للصورة (UUID، اسم الملف + تاريخ التعديل)
  file?: File; // كائن الملف الأصلي (اختياري إذا تم تخزينه خارجياً)
  previewUrl?: string; // URL للمعاينة في الواجهة الأمامية
  embeddings?: number[]; // متجه التضمين الدلالي من AI (لتحديد الموضع على اللوحة العصبية)
  description?: string; // وصف تم إنشاؤه بواسطة الذكاء الاصطناعي
  tags?: string[]; // علامات تم إنشاؤها بواسطة الذكاء الاصطناعي
  faces?: { id: string; name?: string; boundingBox: number[] }[]; // الوجوه المكتشفة
  isProcessed: boolean; // هل تم معالجة الصورة بواسطة الذكاء الاصطناعي؟
  processingError?: string; // رسالة الخطأ في حالة فشل المعالجة
  timestamp: number; // تاريخ ووقت إنشاء الصورة (للفحص الزمني)
  qualityScore?: number; // درجة الجودة (للتعامل مع التكرارات)
  category?: string; // التصنيف الرئيسي
  colors?: string[]; // الألوان السائدة
  location?: { lat: number; lng: number; name?: string }; // الموقع الجغرافي
  people?: string[]; // أسماء الأشخاص المتعرف عليهم
}

// تعريف الرسالة المستلمة بواسطة العامل الخلفي (Web Worker)
export interface WorkerMessage {
  id: string;
  type: "PROCESS_IMAGE" | "EXTRACT_EMBEDDINGS" | "CLASSIFY_IMAGE";
  imageBitmap?: ImageBitmap; // بيانات الصورة كـ ImageBitmap لنقل فعال
  imageData?: ImageData; // بيانات إضافية للصورة
}

// تعريف الاستجابة المرسلة من العامل الخلفي (Web Worker)
export interface WorkerResponse {
  id: string;
  type:
    | "EMBEDDINGS_EXTRACTED"
    | "IMAGE_CLASSIFIED"
    | "PROCESSING_COMPLETE"
    | "ERROR";
  status: "completed" | "error" | "progress";
  embeddings?: Float32Array; // التضمينات الناتجة
  classification?: string; // التصنيف المحدد
  description?: string; // الوصف المولد
  tags?: string[]; // العلامات المستخرجة
  faces?: any[]; // الوجوه المكتشفة
  error?: string; // رسالة الخطأ
  progress?: number; // نسبة التقدم (0-100)
}

// تعريف حالة متجر الصور (Zustand Store State)
export interface ImageStoreState {
  images: Map<string, ImageData>; // خريطة بجميع الصور (مفتاحها هو الـ ID)
  selectedImages: Set<string>; // الصور المحددة
  currentFilter: string; // الفلتر الحالي
  searchQuery: string; // استعلام البحث
  aiEngine: any; // محرك الذكاء الاصطناعي

  // الإجراءات الأساسية
  loadFolder: (files: File[]) => Promise<void>; // تحميل ملفات جديدة
  updateImage: (id: string, updates: Partial<ImageData>) => void; // تحديث بيانات صورة
  removeImage: (id: string) => void; // إزالة صورة
  selectImage: (id: string) => void; // تحديد صورة
  clearSelection: () => void; // مسح التحديد

  // وظائف مساعد KnouxAI والتعامل مع الذكريات
  filterImages: (query: string) => ImageData[];
  searchImages: (query: string) => ImageData[];
  exportDocuments: (keyword: string) => Promise<void>;
  generateStory: (imageIds: string[]) => Promise<any>;
  findSimilarImages: (imageId: string) => ImageData[];
  groupByEvent: () => Map<string, ImageData[]>;
  createMemoryMap: () => Promise<void>;
}

// تعريف موضع الصورة على اللوحة العصبية
export interface PositionedImage {
  id: string;
  previewUrl?: string;
  x: number;
  y: number;
  cluster?: string; // مجموعة التجميع
  similarity?: number; // درجة التشابه
  connections?: string[]; // الصور المرتبطة
}

// تعريف أوامر مساعد الذكاء الاصطناعي
export interface AICommand {
  id: string;
  input: string;
  output: string;
  type: "search" | "filter" | "organize" | "export" | "story" | "identify";
  timestamp: number;
  success: boolean;
}

// تعريف إعدادات التطبيق
export interface AppSettings {
  theme: "light" | "dark" | "neural";
  language: "ar" | "en";
  aiProcessing: {
    enableFaceRecognition: boolean;
    enableObjectDetection: boolean;
    enableSceneAnalysis: boolean;
    enableTextExtraction: boolean;
    enableDuplicateDetection: boolean;
  };
  privacy: {
    storeLocally: boolean;
    shareAnalytics: boolean;
    cloudSync: boolean;
  };
  performance: {
    maxConcurrentProcessing: number;
    useGPUAcceleration: boolean;
    cacheSize: number;
  };
}

// تعريف حالة اللوحة العصبية
export interface NeuralCanvasState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  selectedCluster?: string;
  viewMode: "overview" | "cluster" | "timeline" | "similarity";
  connections: boolean;
  animations: boolean;
}

// تعريف بيانات القصة المولدة
export interface GeneratedStory {
  id: string;
  title: string;
  description: string;
  images: string[]; // معرفات الصور
  timeline: { imageId: string; timestamp: number; duration: number }[];
  soundtrack?: string; // مسار الموسيقى
  videoUrl?: string; // رابط الفيديو المولد
  createdAt: number;
}

// تعريف بيانات التصدير
export interface ExportData {
  format: "json" | "csv" | "pdf" | "video" | "zip";
  filters: any;
  images: string[];
  metadata: boolean;
  aiAnalysis: boolean;
}
