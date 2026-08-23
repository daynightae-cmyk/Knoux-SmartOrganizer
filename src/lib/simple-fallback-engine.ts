// src/lib/simple-fallback-engine.ts
// نسخة مبسطة تعمل بدون نماذج خارجية للاستخدام كبديل

export interface SimplifiedImageAnalysis {
  id: string;
  file: File;
  previewUrl: string;
  dimensions: { width: number; height: number };
  size: number;
  classification: { label: string; score: number }[];
  description: string;
  faces: any[];
  ocrText: string;
  nsfw: any[];
  palette: string[];
  quality: {
    sharpness: number;
    contrast: number;
    brightness: number;
    score: number;
  };
  processingTime: number;
  timestamp: Date;
}

export class SimplifiedAIEngine {
  async analyze(file: File): Promise<SimplifiedImageAnalysis> {
    const startTime = Date.now();
    const previewUrl = URL.createObjectURL(file);
    const imageElement = await this.createImageElement(previewUrl);

    const analysis: SimplifiedImageAnalysis = {
      id: crypto.randomUUID(),
      file,
      previewUrl,
      dimensions: { width: imageElement.width, height: imageElement.height },
      size: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
      classification: [],
      description: "",
      faces: [],
      ocrText: "",
      nsfw: [],
      palette: [],
      quality: {
        sharpness: 0,
        contrast: 0,
        brightness: 0,
        score: 0,
      },
      processingTime: 0,
      timestamp: new Date(),
    };

    try {
      // تصنيف مبسط بناءً على اسم الملف وخصائص الصورة
      analysis.classification = this.classifyImageSimple(file, imageElement);

      // وصف بسيط
      analysis.description = this.generateSimpleDescription(
        file,
        imageElement,
        analysis.classification[0]?.label,
      );

      // تحليل ألوان بسيط
      analysis.palette = await this.extractSimpleColors(imageElement);

      // تحليل جودة مبسط
      analysis.quality = await this.analyzeSimpleQuality(imageElement);

      // محاكاة آمنة للمحتوى
      analysis.nsfw = [
        { className: "Neutral", probability: 0.95 },
        { className: "Drawing", probability: 0.03 },
        { className: "Sexy", probability: 0.01 },
        { className: "Porn", probability: 0.005 },
        { className: "Hentai", probability: 0.005 },
      ];
    } catch (error) {
      console.error("خطأ في التحليل المبسط:", error);
    }

    analysis.processingTime = Date.now() - startTime;
    return analysis;
  }

  private classifyImageSimple(
    file: File,
    img: HTMLImageElement,
  ): { label: string; score: number }[] {
    const fileName = file.name.toLowerCase();
    const aspectRatio = img.width / img.height;
    const categories = [];

    // تصنيف بناءً على اسم الملف
    if (
      fileName.includes("selfie") ||
      fileName.includes("portrait") ||
      fileName.includes("photo")
    ) {
      categories.push({ label: "person", score: 0.9 });
    } else if (fileName.includes("screenshot") || fileName.includes("screen")) {
      categories.push({ label: "screenshot", score: 0.95 });
    } else if (fileName.includes("doc") || fileName.includes("text")) {
      categories.push({ label: "document", score: 0.85 });
    } else if (fileName.includes("food") || fileName.includes("meal")) {
      categories.push({ label: "food", score: 0.8 });
    } else if (fileName.includes("car") || fileName.includes("vehicle")) {
      categories.push({ label: "car", score: 0.8 });
    } else if (fileName.includes("nature") || fileName.includes("landscape")) {
      categories.push({ label: "nature", score: 0.8 });
    }

    // تصنيف بناءً على نسبة العرض إلى الارتفاع
    if (aspectRatio > 2) {
      categories.push({ label: "panorama", score: 0.7 });
    } else if (aspectRatio < 0.5) {
      categories.push({ label: "vertical photo", score: 0.7 });
    } else if (Math.abs(aspectRatio - 1) < 0.1) {
      categories.push({ label: "square image", score: 0.75 });
    }

    // تصنيف بناءً على الحجم
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB < 0.1) {
      categories.push({ label: "thumbnail", score: 0.8 });
    } else if (sizeInMB > 10) {
      categories.push({ label: "high resolution", score: 0.85 });
    }

    // تصنيفات افتراضية إذا لم يوجد شيء محدد
    if (categories.length === 0) {
      categories.push(
        { label: "image", score: 0.6 },
        { label: "photo", score: 0.5 },
        { label: "picture", score: 0.4 },
      );
    }

    return categories.slice(0, 5); // أفضل 5 تصنيفات
  }

  private generateSimpleDescription(
    file: File,
    img: HTMLImageElement,
    topCategory?: string,
  ): string {
    const fileName = file.name;
    const aspectRatio = img.width / img.height;

    const descriptions = [
      "A clear and well-composed image",
      "An interesting visual capture",
      "A quality photograph with good details",
      "A well-framed digital image",
      "A nice visual content piece",
    ];

    // تخصيص الوصف بناءً على التصنيف
    if (topCategory) {
      if (topCategory.includes("person")) {
        return "A portrait or photo featuring people";
      } else if (topCategory.includes("nature")) {
        return "A beautiful nature or landscape scene";
      } else if (topCategory.includes("food")) {
        return "An appetizing food or meal photograph";
      } else if (topCategory.includes("screenshot")) {
        return "A screenshot or screen capture image";
      } else if (topCategory.includes("document")) {
        return "A document or text-based image";
      }
    }

    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private async extractSimpleColors(img: HTMLImageElement): Promise<string[]> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // تصغير الصورة لتسريع المعالجة
    canvas.width = 50;
    canvas.height = 50;
    ctx.drawImage(img, 0, 0, 50, 50);

    const imageData = ctx.getImageData(0, 0, 50, 50);
    const colorCounts = new Map<string, number>();

    // جمع عينات من الألوان
    for (let i = 0; i < imageData.data.length; i += 16) {
      // كل 4 بكسل
      const r = Math.floor(imageData.data[i] / 32) * 32;
      const g = Math.floor(imageData.data[i + 1] / 32) * 32;
      const b = Math.floor(imageData.data[i + 2] / 32) * 32;

      const hex =
        "#" +
        [r, g, b]
          .map((c) => c.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase();

      colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
    }

    // ترتيب الألوان حسب التكرار
    const sortedColors = Array.from(colorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([color]) => color);

    return sortedColors;
  }

  private async analyzeSimpleQuality(img: HTMLImageElement): Promise<{
    sharpness: number;
    contrast: number;
    brightness: number;
    score: number;
  }> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // تصغير للمعالجة السريعة
    canvas.width = 100;
    canvas.height = 100;
    ctx.drawImage(img, 0, 0, 100, 100);

    const imageData = ctx.getImageData(0, 0, 100, 100);
    let totalBrightness = 0;
    const brightnesses = [];

    // حساب السطوع
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      brightnesses.push(brightness);
    }

    const avgBrightness = totalBrightness / brightnesses.length;

    // حساب التباين
    let variance = 0;
    for (const brightness of brightnesses) {
      variance += Math.pow(brightness - avgBrightness, 2);
    }
    const contrast = Math.sqrt(variance / brightnesses.length) / 255;

    // تقدير الحدة (مبسط)
    const sharpness = Math.min(contrast * 2, 1);

    // درجة إجمالية
    const brightnessScore = 1 - Math.abs(avgBrightness - 128) / 128;
    const contrastScore = Math.min(contrast * 2, 1);
    const overallScore = (brightnessScore + contrastScore + sharpness) / 3;

    return {
      sharpness: parseFloat(sharpness.toFixed(3)),
      contrast: parseFloat(contrast.toFixed(3)),
      brightness: parseFloat((avgBrightness / 255).toFixed(3)),
      score: parseFloat(overallScore.toFixed(3)),
    };
  }

  private createImageElement(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}

export const simplifiedEngine = new SimplifiedAIEngine();
