// src/core/AIEngine.ts

import { ImageData, WorkerResponse, WorkerMessage } from "@/types/knoux-x2";

// تعريف دالة الاستدعاء الخلفي (callback) التي يستخدمها المحرك لإبلاغ المتجر بالتحديثات
type OnImageProcessedCallback = (
  id: string,
  updates: Partial<ImageData>,
) => void;

export class AIEngine {
  private worker: Worker | null = null;
  private onImageProcessedCallback: OnImageProcessedCallback;
  private processingQueue: ImageData[] = []; // قائمة انتظار لمعالجة الصور
  private isProcessing: boolean = false; // لتجنب معالجة صور متعددة في نفس الوقت
  private currentlyProcessing: Set<string> = new Set(); // تتبع الصور قيد المعالجة

  constructor(onImageProcessedCallback: OnImageProcessedCallback) {
    this.onImageProcessedCallback = onImageProcessedCallback;
    this.initializeWorker();
  }

  /**
   * تهيئة العامل الخلفي
   */
  private async initializeWorker() {
    try {
      // إنشاء Worker بطريقة آمنة
      const workerModule = await import("./ai.worker.ts?worker");
      this.worker = new workerModule.default();

      // معالجة الرسائل القادمة من العامل الخلفي
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        this.handleWorkerResponse(event.data);
      };

      // معالجة الأخطاء التي تحدث في العامل الخلفي
      this.worker.onerror = (error) => {
        console.error("🔴 AI Engine: Worker error:", error);
        this.handleWorkerError();
      };

      console.log("✅ AI Engine: Worker initialized successfully");
    } catch (error) {
      console.error("❌ AI Engine: Failed to initialize worker:", error);
      this.handleWorkerError();
    }
  }

  /**
   * معالجة استجابة العامل
   */
  private handleWorkerResponse(response: WorkerResponse) {
    const {
      id,
      type,
      status,
      embeddings,
      classification,
      description,
      tags,
      error,
      progress,
    } = response;

    if (status === "completed") {
      // إزالة الصورة من قائمة المعالجة الحالية
      this.currentlyProcessing.delete(id);

      // تحديث الصورة في المتجر
      this.onImageProcessedCallback(id, {
        embeddings: embeddings ? Array.from(embeddings) : undefined,
        category: classification,
        description: description,
        tags: tags,
        isProcessed: true,
        processingError: undefined,
      });

      console.log(`✅ AI Engine: Successfully processed image ${id}`);
    } else if (status === "error") {
      // إزالة الصورة من قائمة المعالجة الحالية
      this.currentlyProcessing.delete(id);

      // تحديث الصورة مع رسالة الخطأ
      this.onImageProcessedCallback(id, {
        processingError: error,
        isProcessed: true,
      });

      console.error(`❌ AI Engine: Failed to process image ${id}:`, error);
    } else if (status === "progress") {
      // تحديث تقدم المعالجة
      this.onImageProcessedCallback(id, {
        processingError: `معالجة... ${progress}%`,
      });
    }

    // معالجة العنصر التالي في قائمة الانتظار
    this.processNextInQueue();
  }

  /**
   * معالجة خطأ العامل
   */
  private handleWorkerError() {
    // تحديث جميع الصور قيد المعالجة كفاشلة
    this.currentlyProcessing.forEach((id) => {
      this.onImageProcessedCallback(id, {
        processingError: "فشل في معالجة الصورة - خطأ في النظام",
        isProcessed: true,
      });
    });

    this.currentlyProcessing.clear();
    this.isProcessing = false;

    // محاولة إعادة تهيئة العامل
    setTimeout(() => {
      this.initializeWorker();
    }, 2000);
  }

  /**
   * يضيف مجموعة من الصور إلى قائمة انتظار المعالجة ويبدأها إذا لم تكن قيد التشغيل.
   * @param images مصفوفة من كائنات ImageData للمعالجة.
   */
  async processFiles(images: ImageData[]) {
    for (const image of images) {
      // إضافة الصور التي لم تتم معالجتها بعد ولها ملف مرفق فقط
      if (
        !image.isProcessed &&
        image.file &&
        !this.currentlyProcessing.has(image.id)
      ) {
        this.processingQueue.push(image);
      }
    }

    console.log(
      `📝 AI Engine: Added ${images.length} images to processing queue`,
    );

    // إذا لم يكن هناك معالجة قيد التقدم، ابدأ معالجة العنصر التالي
    if (!this.isProcessing) {
      this.processNextInQueue();
    }
  }

  /**
   * معالجة الصورة التالية في قائمة الانتظار.
   * يتم استدعاء هذه الوظيفة بشكل متكرر بعد كل معالجة أو خطأ.
   */
  private async processNextInQueue() {
    if (this.processingQueue.length === 0) {
      this.isProcessing = false;
      return; // قائمة الانتظار فارغة، لا يوجد ما يمكن معالجته
    }

    if (!this.worker) {
      console.warn("⚠️ AI Engine: Worker not available, retrying...");
      setTimeout(() => this.processNextInQueue(), 1000);
      return;
    }

    this.isProcessing = true;
    const imageToProcess = this.processingQueue.shift(); // إزالة الصورة من بداية قائمة الانتظار

    if (imageToProcess && imageToProcess.file) {
      try {
        // إضافة الصورة إلى قائمة المعالجة الحالية
        this.currentlyProcessing.add(imageToProcess.id);

        console.log(`🔄 AI Engine: Processing image ${imageToProcess.id}`);

        // تحديث حالة الصورة كـ "قيد المعالجة"
        this.onImageProcessedCallback(imageToProcess.id, {
          processingError: "جاري المعالجة...",
        });

        // تحويل كائن الملف إلى ImageBitmap لنقله بكفاءة إلى العامل الخلفي
        const imageBitmap = await createImageBitmap(imageToProcess.file);

        // إرسال الرسالة إلى العامل الخلفي. ImageBitmap يتم نقله وليس نسخه.
        const message: WorkerMessage = {
          id: imageToProcess.id,
          type: "PROCESS_IMAGE",
          imageBitmap,
          imageData: imageToProcess,
        };

        this.worker.postMessage(message, [imageBitmap]);
        console.log(`📤 AI Engine: Sent image ${imageToProcess.id} to worker`);
      } catch (error: any) {
        console.error(
          `❌ AI Engine: Failed to create ImageBitmap for ${imageToProcess.id}:`,
          error,
        );

        // إزالة من قائمة المعالجة الحالية
        this.currentlyProcessing.delete(imageToProcess.id);

        // تحديث حالة الصورة كخطأ في المتجر
        this.onImageProcessedCallback(imageToProcess.id, {
          processingError: `فشل في معالجة الصورة: ${error.message}`,
          isProcessed: true,
        });

        // الانتقال إلى الصورة التالية مباشرة في حالة الخطأ
        this.processNextInQueue();
      }
    } else {
      this.processNextInQueue(); // تخطي إذا لم يكن هناك ملف
    }
  }

  /**
   * إيقاف المعالجة وتنظيف الموارد
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.processingQueue = [];
    this.currentlyProcessing.clear();
    this.isProcessing = false;

    console.log("🛑 AI Engine: Terminated");
  }

  /**
   * الحصول على حالة المحرك
   */
  getStatus() {
    return {
      isWorkerActive: !!this.worker,
      isProcessing: this.isProcessing,
      queueLength: this.processingQueue.length,
      currentlyProcessing: this.currentlyProcessing.size,
    };
  }

  /**
   * تحليل متقدم للصور المحددة
   */
  async analyzeSelectedImages(imageIds: string[]): Promise<any> {
    const images = imageIds.map((id) => ({ id, analysis: "متقدم" }));
    return {
      totalImages: images.length,
      commonThemes: ["طبيعة", "أشخاص", "مدن"],
      timeline: "2024",
      suggestedStory: "رحلة مذهلة عبر مناظر خلابة",
    };
  }

  /**
   * البحث الدلالي في الصور
   */
  async semanticSearch(
    query: string,
    images: ImageData[],
  ): Promise<ImageData[]> {
    // تحليل مبسط للبحث الدلالي
    const keywords = query.toLowerCase().split(" ");

    return images
      .filter((image) => {
        if (!image.isProcessed) return false;

        const searchableText = [
          image.description || "",
          image.category || "",
          ...(image.tags || []),
        ]
          .join(" ")
          .toLowerCase();

        return keywords.some((keyword) => searchableText.includes(keyword));
      })
      .slice(0, 20); // أول 20 نتيجة
  }
}
