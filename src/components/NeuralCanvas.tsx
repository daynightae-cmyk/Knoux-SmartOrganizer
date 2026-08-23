// src/components/NeuralCanvas.tsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { useImageStore } from "@/hooks/useImageStore";

// Define types inline to avoid dependency issues
interface ImageData {
  id: string;
  previewUrl: string;
  embeddings?: number[];
}

interface PositionedImage {
  id: string;
  previewUrl: string;
  x: number;
  y: number;
  cluster: string;
}

// Simple linear scale implementation
const createLinearScale = (
  domain: [number, number],
  range: [number, number],
) => {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const slope = (r1 - r0) / (d1 - d0);
  return (value: number) => r0 + slope * (value - d0);
};

/**
 * وظيفة لتحويل التضمينات عالية الأبعاد إلى إحداثيات ثنائية الأبعاد (X, Y).
 * في تطبيق حقيقي، ستُستخدم خوارزمية لتقليل الأبعاد مثل UMAP أو t-SNE.
 */
const mapEmbeddingsToPositions = (
  imagesMap: Map<string, any>,
): PositionedImage[] => {
  // تصفية الصور التي تحتوي على تضمينات صالحة
  const allImages = Array.from(imagesMap.values()).filter(
    (img) => img.embeddings && img.embeddings.length >= 2,
  );

  if (allImages.length === 0) return [];

  // إذا كانت هناك صورة واحدة فقط، ضعها في المركز
  if (allImages.length === 1) {
    return [
      {
        id: allImages[0].id,
        previewUrl: allImages[0].previewUrl,
        x: 0,
        y: 0,
        cluster: "single",
      },
    ];
  }

  // استخراج أول بُعدين للتضمين لإنشاء إحداثيات X, Y
  const xValues = allImages.map((img) => img.embeddings![0]);
  const yValues = allImages.map((img) => img.embeddings![1]);

  const xDomain = [Math.min(...xValues), Math.max(...xValues)] as [
    number,
    number,
  ];
  const yDomain = [Math.min(...yValues), Math.max(...yValues)] as [
    number,
    number,
  ];

  // تحديد نطاق الإحداثيات
  const canvasSize = 3000; // حجم اللوحة الافتراضي
  const xScale = createLinearScale(xDomain, [-canvasSize / 2, canvasSize / 2]);
  const yScale = createLinearScale(yDomain, [-canvasSize / 2, canvasSize / 2]);

  // تحويل كل صورة إلى إحداثيات موضعية
  return allImages.map((img, index) => ({
    id: img.id,
    previewUrl: img.previewUrl,
    x: xScale(img.embeddings![0]),
    y: yScale(img.embeddings![1]),
    cluster: `cluster-${index % 5}`, // تصنيف بسيط للألوان
  }));
};

/**
 * مكون لوحة الرسم العصبية - يعرض الصور في فضاء ثنائي الأبعاد بناءً على التضمينات
 */
const NeuralCanvas: React.FC = () => {
  const { images } = useImageStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // حالات التكبير والحركة
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // تحويل الصور إلى مواضع ثنائية الأبعاد
  const positionedImages = useMemo(() => {
    return mapEmbeddingsToPositions(images);
  }, [images]);

  // معالجة السحب والإفلات
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrag = (event: any, info: PanInfo) => {
    setPosition({
      x: position.x + info.delta.x,
      y: position.y + info.delta.y,
    });
  };

  // معالجة التكبير والتصغير
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY * -0.01;
    const newScale = Math.max(0.1, Math.min(3, scale + delta));
    setScale(newScale);
  };

  // إعادة تعيين المنظر
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    controls.start({
      scale: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    });
  };

  // تجميع الصور المتشابهة
  const clusterColors = {
    "cluster-0": "#3B82F6", // أزرق
    "cluster-1": "#EF4444", // أحمر
    "cluster-2": "#10B981", // أخضر
    "cluster-3": "#F59E0B", // برتقالي
    "cluster-4": "#8B5CF6", // بنفسجي
    single: "#6B7280", // رمادي
  };

  // إذا لم توجد صور، عرض رسالة
  if (positionedImages.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">🧠 لوحة الرسم العصبية</h3>
          <p className="text-sm">
            أضف صورًا وقم بمعالجتها بالذكاء الاصطناعي لرؤية خريطة التشابه
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden relative border">
      {/* أدوات التحكم */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={resetView}
          className="px-3 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md text-sm font-medium hover:bg-white dark:hover:bg-gray-700 transition-colors"
        >
          🔄 إعادة تعيين
        </button>
        <div className="px-3 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md text-sm">
          {positionedImages.length} صورة
        </div>
        <div className="px-3 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md text-sm">
          تكبير: {(scale * 100).toFixed(0)}%
        </div>
      </div>

      {/* مفتاح الألوان */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md p-3">
        <h4 className="text-sm font-medium mb-2">المجموعات:</h4>
        <div className="space-y-1">
          {Object.entries(clusterColors).map(([cluster, color]) => (
            <div key={cluster} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>
                {cluster === "single"
                  ? "منفردة"
                  : `مجموعة ${cluster.split("-")[1]}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* اللوحة التفاعلية */}
      <motion.div
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{
          scale,
          x: position.x,
          y: position.y,
        }}
        drag
        dragConstraints={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDrag={handleDrag}
        onWheel={handleWheel}
        animate={controls}
      >
        {/* الشبكة الخلفية */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <pattern
                id="grid"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* الصور المتموضعة */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            width: "3000px",
            height: "3000px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {positionedImages.map((image) => (
            <motion.div
              key={image.id}
              className="absolute group"
              style={{
                left: `${image.x + 1500}px`, // تحويل إلى إحداثيات موجبة
                top: `${image.y + 1500}px`,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.2, zIndex: 10 }}
            >
              {/* حلقة ملونة */}
              <div
                className="absolute inset-0 rounded-full border-4 opacity-70"
                style={{
                  borderColor:
                    clusterColors[
                      image.cluster as keyof typeof clusterColors
                    ] || clusterColors.single,
                  width: "60px",
                  height: "60px",
                  transform: "translate(-2px, -2px)",
                }}
              />

              {/* الصورة */}
              <img
                src={image.previewUrl}
                alt={`صورة ${image.id}`}
                className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-lg"
                draggable={false}
              />

              {/* نص التوضيح عند التمرير */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {image.id}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* خطوط الربط بين الصور المتشابهة */}
        <svg className="absolute inset-0 pointer-events-none">
          {positionedImages.slice(0, 5).map((image, index) => {
            const nextImage = positionedImages[index + 1];
            if (!nextImage) return null;

            return (
              <line
                key={`${image.id}-${nextImage.id}`}
                x1={image.x + 1500}
                y1={image.y + 1500}
                x2={nextImage.x + 1500}
                y2={nextImage.y + 1500}
                stroke="rgba(99, 102, 241, 0.3)"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            );
          })}
        </svg>
      </motion.div>

      {/* تعليمات الاستخدام */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 dark:text-gray-400">
        🖱️ اسحب للتحرك • 🔍 اعجلة الفأرة للتكبير • 🖱️ مرر فوق الصور للتفاصيل
      </div>
    </div>
  );
};

export default NeuralCanvas;
