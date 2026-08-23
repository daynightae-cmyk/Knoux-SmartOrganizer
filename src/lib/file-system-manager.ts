/**
 * مدير نظام الملفات للعمل مع الملفات محلياً بدون إنترنت
 * يدعم الملفات الكبيرة وإدارة المجلدات والپارتيشن
 */

export interface FolderStructure {
  path: string;
  name: string;
  size: number;
  files: FileInfo[];
  subfolders: FolderStructure[];
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: Date;
  isImage: boolean;
}

export interface OrganizationSettings {
  basePath: string;
  createSubfolders: boolean;
  organizationMethod: "category" | "date" | "size" | "type";
  maxFileSize: number; // بالميجابايت
  supportedFormats: string[];
}

export class FileSystemManager {
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private currentPath: string = "";
  private settings: OrganizationSettings;

  constructor() {
    this.settings = {
      basePath: "",
      createSubfolders: true,
      organizationMethod: "category",
      maxFileSize: 1000, // 1GB default
      supportedFormats: [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".webp",
        ".tiff",
        ".raw",
      ],
    };
  }

  /**
   * اختيار مجلد العمل الرئيسي
   */
  async selectWorkingDirectory(): Promise<string> {
    try {
      // تحقق من دعم File System Access API وكونه يعمل في السياق الحالي
      if ("showDirectoryPicker" in window && window.isSecureContext) {
        try {
          this.directoryHandle = await (window as any).showDirectoryPicker({
            mode: "readwrite",
            startIn: "pictures",
          });

          this.currentPath = this.directoryHandle.name;
          return this.currentPath;
        } catch (securityError: any) {
          // إذا كان خطأ أمني (iframe أو cross-origin)
          if (securityError.name === "SecurityError") {
            throw new Error(
              "File System Access API غير متاح في هذا السياق (iframe أو cross-origin). يرجى استخدام النسخة العاملة بدلاً من ذلك.",
            );
          }
          throw securityError;
        }
      } else {
        throw new Error("File System Access API غير مدعوم في هذا المتصفح");
      }
    } catch (error) {
      console.error("فشل في اختيار المجلد:", error);
      throw error;
    }
  }

  /**
   * فحص مجلد كامل وقراءة جميع الصور
   */
  async scanDirectory(
    directoryHandle?: FileSystemDirectoryHandle,
    maxDepth: number = 3,
    currentDepth: number = 0,
  ): Promise<FolderStructure> {
    const handle = directoryHandle || this.directoryHandle;
    if (!handle) {
      throw new Error("لم يتم اختيار مجلد العمل");
    }

    const folder: FolderStructure = {
      path: handle.name,
      name: handle.name,
      size: 0,
      files: [],
      subfolders: [],
    };

    try {
      for await (const [name, entryHandle] of handle.entries()) {
        if (entryHandle.kind === "file") {
          const file = await entryHandle.getFile();

          if (this.isImageFile(file.name)) {
            const fileInfo: FileInfo = {
              name: file.name,
              path: `${folder.path}/${file.name}`,
              size: file.size,
              type: file.type,
              lastModified: new Date(file.lastModified),
              isImage: true,
            };

            folder.files.push(fileInfo);
            folder.size += file.size;
          }
        } else if (
          entryHandle.kind === "directory" &&
          currentDepth < maxDepth
        ) {
          const subfolder = await this.scanDirectory(
            entryHandle,
            maxDepth,
            currentDepth + 1,
          );
          folder.subfolders.push(subfolder);
          folder.size += subfolder.size;
        }
      }
    } catch (error) {
      console.error("خطأ في فحص المجلد:", error);
    }

    return folder;
  }

  /**
   * قراءة ملف صورة وإرجاع البيانات
   */
  async readImageFile(fileName: string): Promise<File | null> {
    if (!this.directoryHandle) {
      throw new Error("لم يتم اختيار مجلد العمل");
    }

    try {
      const fileHandle = await this.directoryHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      return file;
    } catch (error) {
      console.error(`فشل في قراءة الملف ${fileName}:`, error);
      return null;
    }
  }

  /**
   * إنشاء هيكل مجلدات للتنظيم التلقائي
   */
  async createOrganizationStructure(): Promise<void> {
    if (!this.directoryHandle) {
      throw new Error("لم يتم اختيار مجلد العمل");
    }

    const categories = [
      "الصور_الشخصية",
      "الطبيعة_والمناظر",
      "الطعام_والوجبات",
      "الوثائق_والمستندات",
      "لقطات_الشاشة",
      "صور_متنوعة",
      "صور_مكررة",
      "صور_كبيرة_الحجم",
    ];

    try {
      for (const category of categories) {
        try {
          await this.directoryHandle.getDirectoryHandle(category, {
            create: true,
          });
        } catch (error) {
          console.log(`المجلد ${category} موجود بالفعل`);
        }
      }
    } catch (error) {
      console.error("فشل في إنشاء هيكل المجلدات:", error);
    }
  }

  /**
   * نقل أو نسخ ملف إلى مجلد مناسب
   */
  async organizeFile(
    fileName: string,
    category: string,
    operation: "move" | "copy" = "copy",
  ): Promise<boolean> {
    if (!this.directoryHandle) {
      throw new Error("لم يتم اختيار مجلد العمل");
    }

    try {
      // قراءة الملف الأصلي
      const sourceFileHandle =
        await this.directoryHandle.getFileHandle(fileName);
      const file = await sourceFileHandle.getFile();

      // تحديد المجلد المناسب
      const targetFolderName = this.getCategoryFolderName(category);
      const targetDirHandle = await this.directoryHandle.getDirectoryHandle(
        targetFolderName,
        { create: true },
      );

      // إنشاء الملف في المجلد الجديد
      const newFileHandle = await targetDirHandle.getFileHandle(fileName, {
        create: true,
      });
      const writable = await newFileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      // حذف الملف الأصلي إذا كانت العملية نقل
      if (operation === "move") {
        await this.directoryHandle.removeEntry(fileName);
      }

      return true;
    } catch (error) {
      console.error(`فشل في تنظيم الملف ${fileName}:`, error);
      return false;
    }
  }

  /**
   * معالجة الملفات بدفعات للملفات الكبيرة
   */
  async processBatch(
    files: FileInfo[],
    batchSize: number = 10,
    onProgress?: (processed: number, total: number) => void,
  ): Promise<void> {
    const batches = this.createBatches(files, batchSize);
    let totalProcessed = 0;

    for (const batch of batches) {
      await Promise.all(
        batch.map(async (fileInfo) => {
          try {
            const file = await this.readImageFile(fileInfo.name);
            if (file) {
              // معالجة الملف هنا (تحليل ذكي، تصنيف، etc.)
              await this.processLargeFile(file);
            }
          } catch (error) {
            console.error(`خطأ في معالجة ${fileInfo.name}:`, error);
          }
        }),
      );

      totalProcessed += batch.length;
      if (onProgress) {
        onProgress(totalProcessed, files.length);
      }

      // استراحة بين الدفعات لتجنب إرهاق النظام
      await this.delay(100);
    }
  }

  /**
   * معالجة ملف كبير الحجم بطريقة محسنة
   */
  private async processLargeFile(file: File): Promise<void> {
    // تقليل حجم الصورة للمعالجة إذا كانت كبيرة جداً
    if (file.size > 50 * 1024 * 1024) {
      // أكبر من 50MB
      // إنشاء صورة مصغرة للمعالجة
      const thumbnail = await this.createThumbnail(file, 1024); // 1024px max
      // معالجة الصورة المصغرة بدلاً من الأصلية
      return;
    }

    // معالجة الملف العادي
    // يمكن إضافة تحليل الذكاء الاصطناعي هنا
  }

  /**
   * إنشاء صورة مصغرة للملفات الكبيرة
   */
  private async createThumbnail(
    file: File,
    maxSize: number = 512,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      img.onload = () => {
        // حساب الأبعاد الجديدة
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // رسم الصورة المصغرة
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("فشل في إنشاء الصورة المصغرة"));
            }
          },
          "image/jpeg",
          0.8,
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * حفظ تقرير التنظيم
   */
  async saveOrganizationReport(report: any): Promise<void> {
    if (!this.directoryHandle) return;

    try {
      const fileName = `تقرير_التنظيم_${new Date().toISOString().split("T")[0]}.json`;
      const fileHandle = await this.directoryHandle.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();

      await writable.write(JSON.stringify(report, null, 2));
      await writable.close();
    } catch (error) {
      console.error("فشل في حفظ التقرير:", error);
    }
  }

  /**
   * فحص مساحة التخزين المتاحة
   */
  async checkStorageSpace(): Promise<{
    available: number;
    used: number;
    total: number;
  }> {
    try {
      if (
        "navigator" in window &&
        "storage" in navigator &&
        "estimate" in navigator.storage
      ) {
        const estimate = await navigator.storage.estimate();
        return {
          available: (estimate.quota || 0) - (estimate.usage || 0),
          used: estimate.usage || 0,
          total: estimate.quota || 0,
        };
      }
    } catch (error) {
      console.error("فشل في فحص مساحة التخزين:", error);
    }

    return { available: 0, used: 0, total: 0 };
  }

  // الدوال المساعدة
  private isImageFile(fileName: string): boolean {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
    return this.settings.supportedFormats.includes(ext);
  }

  private getCategoryFolderName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      selfies: "الصور_الشخصية",
      nature: "الطبيعة_والمناظر",
      food: "الطعام_والوجبات",
      documents: "الوثائق_والمستندات",
      screenshots: "لقطات_الشاشة",
      duplicates: "صور_مكررة",
      other: "صور_متنوعة",
    };

    return categoryMap[category] || "صور_متنوعة";
  }

  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Getters and Setters
  getCurrentPath(): string {
    return this.currentPath;
  }

  getSettings(): OrganizationSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<OrganizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  isDirectorySelected(): boolean {
    return this.directoryHandle !== null;
  }
}

export const fileSystemManager = new FileSystemManager();
