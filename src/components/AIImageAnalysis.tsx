import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Search,
  FileText,
  Target,
  Zap,
  Camera,
  Upload,
  Settings,
  Brain,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

interface AIFeature {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  color: string;
}

const aiFeatures: AIFeature[] = [
  {
    id: "face-detection",
    name: "Face Detection",
    nameAr: "كشف الوجوه",
    icon: Eye,
    enabled: false,
    color: "text-blue-400",
  },
  {
    id: "content-detection",
    name: "Content Detection",
    nameAr: "كشف المحتوى",
    icon: Search,
    enabled: false,
    color: "text-green-400",
  },
  {
    id: "auto-description",
    name: "Auto Description",
    nameAr: "وصف تلقائي",
    icon: FileText,
    enabled: false,
    color: "text-purple-400",
  },
  {
    id: "classification",
    name: "Classification",
    nameAr: "تصنيف",
    icon: Target,
    enabled: false,
    color: "text-orange-400",
  },
  {
    id: "quality-analysis",
    name: "Quality Analysis",
    nameAr: "تحليل الجودة",
    icon: Zap,
    enabled: false,
    color: "text-yellow-400",
  },
  {
    id: "text-recognition",
    name: "Text Recognition",
    nameAr: "قراءة النصوص",
    icon: Camera,
    enabled: false,
    color: "text-indigo-400",
  },
];

export const AIImageAnalysis: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [features, setFeatures] = useState(aiFeatures);
  const [hasImages, setHasImages] = useState(false);

  const toggleFeature = (id: string) => {
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === id ? { ...feature, enabled: !feature.enabled } : feature,
      ),
    );
  };

  const handleImageUpload = () => {
    setHasImages(true);
  };

  if (!hasImages) {
    // حالة عدم وجود صور - مطابقة للصورة الأولى
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl shadow-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Knoux SmartOrganizer PRO
            </h1>
            <p className="text-cyan-400 text-lg font-semibold">
              محرك الذكاء الاصطناعي المتقدم مع 10 قدرات قوية
            </p>
          </div>

          {/* منطقة فارغة */}
          <div className="text-center py-16">
            <div className="w-32 h-32 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/30">
              <ImageIcon className="w-16 h-16 text-white/40" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
              لا توجد صور بعد
            </h2>

            <p className="text-white/60 mb-8 max-w-md mx-auto">
              ابدأ برفع صورك للحصول على تحليل ذكي شامل
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleImageUpload}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              رفع أول صورة
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // حالة وجود صور - مطابقة للصورة الثانية
  return (
    <div className={`w-full ${className}`}>
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl shadow-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Knoux SmartOrganizer PRO
          </h1>
          <p className="text-cyan-400 text-lg font-semibold">
            محرك الذكاء الاصطناعي المتقدم مع 10 قدرات قوية
          </p>
        </div>

        {/* رسالة الحالة */}
        <div className="text-center mb-8 p-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl border border-pink-500/30">
          <div className="flex items-center justify-center gap-2 text-pink-300">
            <span>🎯</span>
            <span className="font-medium">
              جاهز للبدء. قم بضبط الإعدادات واختيار الصور.
            </span>
            <span>🚀</span>
          </div>
        </div>

        {/* لوحة التحكم بالذكاء الاصطناعي */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              لوحة التحكم بالذكاء الاصطناعي
            </h2>
          </div>

          {/* إعدادات متقدمة */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 text-white/80">
              <Settings className="w-4 h-4" />
              <span>إعدادات متقدمة</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {features.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <IconComponent className={`w-4 h-4 ${feature.color}`} />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">
                          {feature.nameAr}
                        </div>
                        <div className="text-white/50 text-xs">
                          {feature.name}
                        </div>
                      </div>
                    </div>

                    {/* مفتاح التبديل */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleFeature(feature.id)}
                      className={`
                        relative w-12 h-6 rounded-full transition-all duration-300
                        ${feature.enabled ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gray-600"}
                      `}
                    >
                      <motion.div
                        animate={{
                          x: feature.enabled ? 24 : 2,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                      />
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* زر الاختيار والتحليل */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-4">
              جاهز للبدء قم بضبط الإعدادات واختيار الصور
            </h3>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 mx-auto"
            >
              <Upload className="w-5 h-5" />
              اختيار الصور للتحليل
            </motion.button>
          </div>
        </motion.div>

        {/* معلومات إضافية */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-white/70 text-sm">
              تقنية متقدمة للذكاء الاصطناعي
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIImageAnalysis;
