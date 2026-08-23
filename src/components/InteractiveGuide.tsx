import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Play,
  Pause,
  Settings,
  Zap,
  Target,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

interface GuideStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  icon: React.ComponentType<any>;
  type: "info" | "action" | "warning";
}

const guideSteps: GuideStep[] = [
  {
    id: "start",
    title: "بدء النظام",
    description:
      "اضغط على زر 'تشغيل' لبدء عرض البيانات المباشرة والمحاكاة الذكية",
    action: "انقر على الزر الأخضر",
    icon: Play,
    type: "action",
  },
  {
    id: "monitor",
    title: "مراقبة الأداء",
    description:
      "شاهد المؤشرات المباشرة: الملفات المفحوصة، التكرارات المكتشفة، المساحة المحررة",
    icon: Target,
    type: "info",
  },
  {
    id: "performance",
    title: "مقاييس الأداء",
    description: "تابع مؤشرات النظام: استخدام المعالج، الذاكرة، وسرعة القرص",
    icon: Zap,
    type: "info",
  },
  {
    id: "notifications",
    title: "الإشعارات الذكية",
    description:
      "ستظهر إشعارات تلقائية عند اكتشاف تكرارات أو توفير مساحة كبيرة",
    icon: AlertCircle,
    type: "warning",
  },
  {
    id: "settings",
    title: "التخصيص",
    description:
      "يمكن ربط النظام ببيانات حقيقية أو APIs خارجية للتحديثات الفعلية",
    icon: Settings,
    type: "info",
  },
];

export const InteractiveGuide: React.FC<{
  className?: string;
  isActive?: boolean;
  onToggleDemo?: () => void;
}> = ({ className = "", isActive = false, onToggleDemo }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(0);
    }
  };

  const currentGuideStep = guideSteps[currentStep];
  const IconComponent = currentGuideStep.icon;

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* زر فتح الدليل */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl font-medium text-sm"
      >
        <BookOpen className="w-4 h-4" />
        دليل التفاعل
        <ChevronRight
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
        />
      </motion.button>

      {/* الدليل التفاعلي */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-xl border border-white/20 rounded-xl z-50"
          >
            {/* شريط التقدم */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-1">
                {guideSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= currentStep ? "bg-indigo-400" : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-white/60">
                {currentStep + 1} / {guideSteps.length}
              </span>
            </div>

            {/* محتوى الخطوة الحالية */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    currentGuideStep.type === "action"
                      ? "bg-green-500/20"
                      : currentGuideStep.type === "warning"
                        ? "bg-yellow-500/20"
                        : "bg-blue-500/20"
                  }`}
                >
                  <IconComponent
                    className={`w-4 h-4 ${
                      currentGuideStep.type === "action"
                        ? "text-green-400"
                        : currentGuideStep.type === "warning"
                          ? "text-yellow-400"
                          : "text-blue-400"
                    }`}
                  />
                </div>
                <h4 className="font-semibold text-white">
                  {currentGuideStep.title}
                </h4>
              </div>

              <p className="text-sm text-white/80 leading-relaxed">
                {currentGuideStep.description}
              </p>

              {currentGuideStep.action && (
                <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-xs text-green-400 font-medium">
                    📋 خطوة عملية: {currentGuideStep.action}
                  </p>
                </div>
              )}

              {/* أزرار التحكم */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-sm hover:bg-indigo-500/30 transition-colors"
                >
                  {currentStep === guideSteps.length - 1 ? "إعادة" : "التالي"}
                  <ChevronRight className="w-3 h-3" />
                </button>

                {currentStep === 0 && onToggleDemo && (
                  <button
                    onClick={onToggleDemo}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-green-500/20 text-green-300 border border-green-500/30"
                    }`}
                  >
                    {isActive ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    {isActive ? "إيقاف العرض" : "تجربة مباشرة"}
                  </button>
                )}
              </div>
            </motion.div>

            {/* معلومات تقنية */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Info className="w-3 h-3" />
                <span>
                  النظام يحاكي البيانات الحقيقية ويمكن ربطه بـ APIs فعلية
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InteractiveGuide;
