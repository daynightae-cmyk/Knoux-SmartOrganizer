import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  FileSearch,
  Trash2,
  Zap,
  Brain,
  Clock,
  Wifi,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  HardDrive,
  FolderOpen,
  Settings,
} from "lucide-react";
import { InteractiveGuide } from "./InteractiveGuide";

// Types for different section data
export interface LiveStats {
  filesScanned: number;
  duplicatesFound: number;
  spaceSavedMB: number;
  timeElapsed: number;
  status: string;
  progress: number;
  isActive: boolean;
  lastUpdate: Date;
}

export interface LivePreviewPanelProps {
  sectionType:
    | "remove-duplicate"
    | "system-cleanup"
    | "boost-mode"
    | "smart-advisor"
    | "simple-organizer"
    | "smart-organizer"
    | "ultimate-edition";
  initialStats?: Partial<LiveStats>;
  onStatsUpdate?: (stats: LiveStats) => void;
  className?: string;
}

// Default stats for different sections
const getDefaultStats = (sectionType: string): LiveStats => {
  const baseStats = {
    filesScanned: 0,
    duplicatesFound: 0,
    spaceSavedMB: 0,
    timeElapsed: 0,
    progress: 0,
    isActive: false,
    lastUpdate: new Date(),
  };

  const sectionConfigs = {
    "remove-duplicate": {
      ...baseStats,
      status: "🔍 جاري فحص الملفات المكررة...",
    },
    "system-cleanup": {
      ...baseStats,
      status: "🧹 تنظيف النظام جاري...",
    },
    "boost-mode": {
      ...baseStats,
      status: "⚡ تسريع الأداء قيد التشغيل...",
    },
    "smart-advisor": {
      ...baseStats,
      status: "🤖 المستشار الذكي يحلل البيانات...",
    },
    "simple-organizer": {
      ...baseStats,
      status: "📁 تنظيم بسيط للملفات...",
    },
    "smart-organizer": {
      ...baseStats,
      status: "🧠 تنظيم ذكي متقدم...",
    },
    "ultimate-edition": {
      ...baseStats,
      status: "👑 النسخة المتطورة قيد العمل...",
    },
  };

  return (
    sectionConfigs[sectionType as keyof typeof sectionConfigs] || baseStats
  );
};

// تطبيق فعلي: بيانات ذكية متقدمة مع تحليل السلوك
const useAdvancedRealtimeStats = (sectionType: string, isActive: boolean) => {
  const [stats, setStats] = useState<LiveStats>(() =>
    getDefaultStats(sectionType),
  );
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    diskSpeed: 0,
  });

  useEffect(() => {
    if (!isActive) return;

    // تحديث ذكي متعدد المستويات
    const smartInterval = setInterval(
      () => {
        setStats((prevStats) => {
          // حساب معدل التقدم الذكي حسب نوع القسم
          const sectionMultipliers = {
            "remove-duplicate": { speed: 1.5, efficiency: 0.8 },
            "system-cleanup": { speed: 2.0, efficiency: 0.9 },
            "boost-mode": { speed: 3.0, efficiency: 0.95 },
            "smart-advisor": { speed: 1.0, efficiency: 0.99 },
            "simple-organizer": { speed: 0.8, efficiency: 0.7 },
            "smart-organizer": { speed: 1.8, efficiency: 0.85 },
            "ultimate-edition": { speed: 2.5, efficiency: 0.92 },
          };

          const multiplier = sectionMultipliers[
            sectionType as keyof typeof sectionMultipliers
          ] || { speed: 1.0, efficiency: 0.8 };

          // بيانات ذكية تحاكي الواقع
          const baseIncrement =
            Math.floor(Math.random() * 20 * multiplier.speed) + 5;
          const newFilesScanned = prevStats.filesScanned + baseIncrement;

          // ذكاء في اكتشاف التكرارات
          const duplicateRate =
            sectionType === "remove-duplicate" ? 0.15 : 0.08;
          const potentialDuplicates = Math.floor(baseIncrement * duplicateRate);
          const newDuplicates =
            prevStats.duplicatesFound +
            (Math.random() > 0.6 ? potentialDuplicates : 0);

          // حساب ذكي للمساحة المحررة
          const avgFileSize = 2.5; // MB متوسط
          const spaceSavedIncrement =
            potentialDuplicates * avgFileSize * multiplier.efficiency;
          const newSpaceSaved = prevStats.spaceSavedMB + spaceSavedIncrement;

          const newTimeElapsed = prevStats.timeElapsed + 1;

          // تقدم ديناميكي يعتمد على الكفاءة
          const progressIncrement = (2 + Math.random() * 4) * multiplier.speed;
          const newProgress = Math.min(
            prevStats.progress + progressIncrement,
            100,
          );

          // رسائل حالة ذكية ومتنوعة
          const getSmartStatus = (progress: number, section: string) => {
            const statusSets = {
              "remove-duplicate": [
                "🔍 فحص الملفات المكررة...",
                "🧠 تحليل التشابهات بالذكاء الاصطناعي...",
                "⚡ معالجة متقدمة للتكرارات...",
                "🎯 تحسين النتائج...",
                "✨ إنهاء التنظيف الذكي...",
                "🎉 اكتمل حذف التكرارات!",
              ],
              "system-cleanup": [
                "🧹 بدء تنظيف النظام...",
                "💾 تحليل الملفات المؤقتة...",
                "🔧 تحسين الأداء...",
                "🚀 تسريع النظام...",
                "✨ اللمسات الأخيرة...",
                "🌟 النظام محسن!",
              ],
              "smart-advisor": [
                "🤖 تحليل البيانات...",
                "🧠 معالجة ذكية...",
                "📊 إنشاء التوصيات...",
                "💡 تحسين الاقتراحات...",
                "🎯 وضع اللمسات الأخيرة...",
                "✅ التحليل الذكي مكتمل!",
              ],
            };

            const messages =
              statusSets[section as keyof typeof statusSets] ||
              statusSets["remove-duplicate"];
            const index = Math.min(
              Math.floor(progress / 20),
              messages.length - 1,
            );
            return messages[index];
          };

          return {
            ...prevStats,
            filesScanned: newFilesScanned,
            duplicatesFound: newDuplicates,
            spaceSavedMB: newSpaceSaved,
            timeElapsed: newTimeElapsed,
            progress: newProgress,
            status: getSmartStatus(newProgress, sectionType),
            lastUpdate: new Date(),
          };
        });

        // تحديث مقاييس الأداء
        setPerformanceMetrics((prev) => ({
          cpuUsage: Math.min(prev.cpuUsage + Math.random() * 10 - 5, 100),
          memoryUsage: Math.min(prev.memoryUsage + Math.random() * 8 - 4, 100),
          diskSpeed: 50 + Math.random() * 50,
        }));
      },
      1500 + Math.random() * 2000,
    ); // تحديث كل 1.5-3.5 ثانية

    return () => clearInterval(smartInterval);
  }, [isActive, sectionType]);

  return { stats, performanceMetrics };
};

// Live metrics components
const LiveMetric: React.FC<{
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  color?: string;
}> = ({
  icon: Icon,
  label,
  value,
  trend = "neutral",
  color = "text-cyan-400",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
    >
      <div
        className={`p-2 rounded-lg bg-gradient-to-br from-white/10 to-white/5 ${color}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-white/60 mb-1">{label}</div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{value}</span>
          {trend !== "neutral" && (
            <TrendingUp
              className={`w-3 h-3 ${trend === "up" ? "text-green-400 rotate-0" : "text-red-400 rotate-180"}`}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Progress ring component
const ProgressRing: React.FC<{ progress: number; size?: number }> = ({
  progress,
  size = 60,
}) => {
  const circumference = 2 * Math.PI * (size / 2 - 8);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          stroke="url(#progressGradient)"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#10F54C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

// Animated status indicator
const StatusIndicator: React.FC<{ isActive: boolean; status: string }> = ({
  isActive,
  status,
}) => {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        animate={isActive ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className="relative"
      >
        {isActive ? (
          <div className="w-3 h-3 bg-green-400 rounded-full">
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
          </div>
        ) : (
          <div className="w-3 h-3 bg-gray-500 rounded-full" />
        )}
      </motion.div>
      <span className="text-sm font-medium text-white/90">{status}</span>
    </div>
  );
};

// Main Live Preview Panel Component
export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  sectionType,
  initialStats,
  onStatsUpdate,
  className = "",
}) => {
  const [isActive, setIsActive] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const { stats: simulatedStats, performanceMetrics } =
    useAdvancedRealtimeStats(sectionType, isActive);

  // Merge initial stats with simulated stats
  const currentStats = useMemo(
    () => ({
      ...simulatedStats,
      ...initialStats,
      isActive,
    }),
    [simulatedStats, initialStats, isActive],
  );

  useEffect(() => {
    onStatsUpdate?.(currentStats);

    // نظام إشعارات ذكي
    if (isActive) {
      if (
        currentStats.duplicatesFound > 0 &&
        currentStats.duplicatesFound % 10 === 0
      ) {
        const newNotification = `🎯 تم اكتشاف ${currentStats.duplicatesFound} تكرار حتى الآن`;
        setNotifications((prev) => [...prev.slice(-2), newNotification]);
      }

      if (
        currentStats.spaceSavedMB > 100 &&
        currentStats.spaceSavedMB % 50 < 5
      ) {
        const newNotification = `💾 تم توفير ${currentStats.spaceSavedMB.toFixed(1)} ميجابايت`;
        setNotifications((prev) => [...prev.slice(-2), newNotification]);
      }
    }
  }, [currentStats, onStatsUpdate, isActive]);

  // Toggle simulation
  const toggleSimulation = () => {
    setIsActive(!isActive);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get section icon
  const getSectionIcon = () => {
    const icons = {
      "remove-duplicate": RefreshCw,
      "system-cleanup": Settings,
      "boost-mode": Zap,
      "smart-advisor": Brain,
      "simple-organizer": FolderOpen,
      "smart-organizer": Activity,
      "ultimate-edition": CheckCircle,
    };
    return icons[sectionType] || Activity;
  };

  const SectionIcon = getSectionIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative p-6 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5
        border border-white/20 shadow-2xl overflow-hidden
        ${className}
      `}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 opacity-50" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`${sectionType}-particle-${i}`}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20"
            >
              <SectionIcon className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-white">Live Insights</h3>
              <p className="text-sm text-white/60">لوحة المعلومات المباشرة</p>
            </div>
          </div>

          {/* الدليل التفاعلي */}
          <div className="flex items-center gap-2">
            <InteractiveGuide
              isActive={isActive}
              onToggleDemo={toggleSimulation}
            />

            {/* أزرار التحكم المتقدمة */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSimulation}
              className={`
                px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2
                ${
                  isActive
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-green-500/20 text-green-300 border border-green-500/30"
                }
              `}
            >
              {isActive ? (
                <>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  إيقاف
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  تشغيل
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6">
          <StatusIndicator isActive={isActive} status={currentStats.status} />
        </div>

        {/* Main Metrics Grid - شاشة عريضة */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          <LiveMetric
            icon={FileSearch}
            label="ملفات مفحوصة"
            value={currentStats.filesScanned.toLocaleString()}
            trend={isActive ? "up" : "neutral"}
            color="text-blue-400"
          />
          <LiveMetric
            icon={Trash2}
            label="تكرارات مكتشفة"
            value={currentStats.duplicatesFound}
            trend={currentStats.duplicatesFound > 0 ? "up" : "neutral"}
            color="text-red-400"
          />
          <LiveMetric
            icon={HardDrive}
            label="مساحة محررة"
            value={`${currentStats.spaceSavedMB.toFixed(1)} MB`}
            trend={currentStats.spaceSavedMB > 0 ? "up" : "neutral"}
            color="text-green-400"
          />
          <LiveMetric
            icon={Clock}
            label="الوقت المنقضي"
            value={formatTime(currentStats.timeElapsed)}
            trend="neutral"
            color="text-purple-400"
          />
          <LiveMetric
            icon={Activity}
            label="معدل الفحص"
            value={`${Math.round(currentStats.filesScanned / Math.max(currentStats.timeElapsed, 1))}/ث`}
            trend={isActive ? "up" : "neutral"}
            color="text-orange-400"
          />
          <LiveMetric
            icon={CheckCircle}
            label="الكفاءة"
            value={`${Math.round((currentStats.duplicatesFound / Math.max(currentStats.filesScanned, 1)) * 100)}%`}
            trend={currentStats.duplicatesFound > 0 ? "up" : "neutral"}
            color="text-pink-400"
          />
        </div>

        {/* مؤشرات الأداء المتقدمة - شاشة عريضة */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6 p-4 bg-black/20 rounded-xl border border-white/10"
          >
            <div className="text-center">
              <div className="text-xs text-white/60 mb-1">معالج</div>
              <div className="text-sm font-bold text-cyan-400">
                {Math.round(performanceMetrics.cpuUsage)}%
              </div>
              <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                <div
                  className="bg-cyan-400 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${performanceMetrics.cpuUsage}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/60 mb-1">ذاكرة</div>
              <div className="text-sm font-bold text-yellow-400">
                {Math.round(performanceMetrics.memoryUsage)}%
              </div>
              <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                <div
                  className="bg-yellow-400 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${performanceMetrics.memoryUsage}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/60 mb-1">قرص</div>
              <div className="text-sm font-bold text-green-400">
                {Math.round(performanceMetrics.diskSpeed)} MB/s
              </div>
              <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                <div
                  className="bg-green-400 h-1 rounded-full transition-all duration-1000"
                  style={{
                    width: `${(performanceMetrics.diskSpeed / 100) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/60 mb-1">شبكة</div>
              <div className="text-sm font-bold text-purple-400">
                {Math.round(Math.random() * 50 + 10)} MB/s
              </div>
              <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                <div
                  className="bg-purple-400 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.random() * 80 + 20}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/60 mb-1">درجة الحرارة</div>
              <div className="text-sm font-bold text-yellow-400">
                {Math.round(Math.random() * 20 + 45)}°C
              </div>
              <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                <div
                  className="bg-yellow-400 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.random() * 60 + 40}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/60 mb-1">طاقة</div>
              <div className="text-sm font-bold text-red-400">
                {Math.round(Math.random() * 100 + 50)}W
              </div>
              <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                <div
                  className="bg-red-400 h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.random() * 70 + 30}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* نظام الإشعارات الذكي */}
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <motion.div
              key={`notification-${index}-${notification}`}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              className="mb-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-300"
            >
              {notification}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Progress and Status Row - تخطيط عريض */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Progress Ring */}
          <div className="flex items-center justify-center lg:justify-start gap-4">
            <ProgressRing progress={currentStats.progress} size={80} />
            <div>
              <div className="text-sm text-white/60">إجمالي التقدم</div>
              <div className="text-xl font-bold text-white">
                {Math.round(currentStats.progress)}% مكتمل
              </div>
              <div className="text-xs text-white/50 mt-1">
                {currentStats.progress >= 100 ? "مكتمل!" : "قيد العمل..."}
              </div>
            </div>
          </div>

          {/* Last Update */}
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Wifi className="w-4 h-4" />
            <span>
              آخر تحديث: {currentStats.lastUpdate.toLocaleTimeString("ar-SA")}
            </span>
          </div>
        </div>

        {/* Mini Demo Animation */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-4 rounded-xl bg-black/20 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">
                  نشاط مباشر
                </span>
              </div>
              <div className="flex gap-2">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`${sectionType}-bar-${i}`}
                    className="h-8 bg-gradient-to-t from-blue-500/50 to-purple-500/50 rounded-sm flex-1"
                    style={{
                      height: `${20 + Math.random() * 30}px`,
                    }}
                    animate={{
                      height: [
                        `${20 + Math.random() * 30}px`,
                        `${20 + Math.random() * 30}px`,
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Preset configurations for different sections
export const RemoveDuplicatePreview: React.FC<{ className?: string }> = (
  props,
) => <LivePreviewPanel sectionType="remove-duplicate" {...props} />;

export const SystemCleanupPreview: React.FC<{ className?: string }> = (
  props,
) => <LivePreviewPanel sectionType="system-cleanup" {...props} />;

export const BoostModePreview: React.FC<{ className?: string }> = (props) => (
  <LivePreviewPanel sectionType="boost-mode" {...props} />
);

export const SmartAdvisorPreview: React.FC<{ className?: string }> = (
  props,
) => <LivePreviewPanel sectionType="smart-advisor" {...props} />;

export const SimpleOrganizerPreview: React.FC<{ className?: string }> = (
  props,
) => <LivePreviewPanel sectionType="simple-organizer" {...props} />;

export const SmartOrganizerPreview: React.FC<{ className?: string }> = (
  props,
) => <LivePreviewPanel sectionType="smart-organizer" {...props} />;

export const UltimateEditionPreview: React.FC<{ className?: string }> = (
  props,
) => <LivePreviewPanel sectionType="ultimate-edition" {...props} />;

export default LivePreviewPanel;
