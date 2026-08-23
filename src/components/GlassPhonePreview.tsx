import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Wifi,
  Battery,
  Signal,
  Home,
  Settings,
  Search,
  RefreshCw,
  Target,
  Brain,
  Sparkles,
  ChevronLeft,
  MoreHorizontal,
  Play,
  Pause,
} from "lucide-react";

interface GlassPhonePreviewProps {
  className?: string;
  autoPlay?: boolean;
}

export const GlassPhonePreview: React.FC<GlassPhonePreviewProps> = ({
  className = "",
  autoPlay = true,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(75);
  const [isActive, setIsActive] = useState(autoPlay);
  const [currentApp, setCurrentApp] = useState("home");
  const [liveStats, setLiveStats] = useState({
    filesScanned: 0,
    duplicatesFound: 0,
    spaceSaved: 0,
    progress: 0,
  });

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // محاكاة البيانات المباشرة
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setLiveStats((prev) => ({
        filesScanned: prev.filesScanned + Math.floor(Math.random() * 8) + 2,
        duplicatesFound: prev.duplicatesFound + (Math.random() > 0.7 ? 1 : 0),
        spaceSaved: prev.spaceSaved + Math.random() * 1.5,
        progress: Math.min(prev.progress + Math.random() * 3, 100),
      }));

      setBatteryLevel((prev) => Math.max(prev - 0.1, 20));
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const apps = [
    {
      id: "remove-duplicate",
      name: "رييموف دوبليكات",
      icon: RefreshCw,
      color: "from-blue-500 to-purple-600",
    },
    {
      id: "smart-organizer",
      name: "المنظم الذكي",
      icon: Brain,
      color: "from-purple-500 to-pink-600",
    },
    {
      id: "boost-mode",
      name: "وضع التسريع",
      icon: Target,
      color: "from-green-500 to-blue-600",
    },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* الخلفية التفاعلية */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl" />

      {/* هيكل الهاتف الزجاجي */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative mx-auto max-w-sm bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-[3rem] p-3 shadow-2xl"
        style={{
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* الشاشة الداخلية */}
        <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 rounded-[2.5rem] overflow-hidden">
          {/* شريط الحالة */}
          <div className="flex items-center justify-between px-6 py-3 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <span>{formatTime(currentTime)}</span>
            </div>

            <div className="flex items-center gap-1">
              <Signal className="w-4 h-4 text-white/80" />
              <Wifi className="w-4 h-4 text-white/80" />
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/70">{batteryLevel}%</span>
                <Battery
                  className={`w-4 h-4 ${batteryLevel > 50 ? "text-green-400" : batteryLevel > 20 ? "text-yellow-400" : "text-red-400"}`}
                />
              </div>
            </div>
          </div>

          {/* محتوى التطبيق */}
          <div className="h-[600px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {currentApp === "home" && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="absolute inset-0 p-6"
                >
                  {/* العنوان الرئيسي */}
                  <div className="text-center mb-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-xl font-bold text-white mb-2">
                      Knoux SmartOrganizer
                    </h1>
                    <p className="text-cyan-400 text-sm">نوكس المنظم الذكي</p>
                  </div>

                  {/* التطبيقات */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {apps.map((app, index) => {
                      const IconComponent = app.icon;
                      return (
                        <motion.button
                          key={app.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentApp(app.id)}
                          className={`p-4 rounded-2xl bg-gradient-to-br ${app.color} shadow-lg`}
                        >
                          <IconComponent className="w-8 h-8 text-white mb-2" />
                          <div className="text-white text-sm font-medium">
                            {app.name}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* الإحصائيات السريعة */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <h3 className="text-white font-semibold mb-3 text-center">
                      الإحصائيات المباشرة
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {liveStats.filesScanned.toLocaleString()}
                        </div>
                        <div className="text-xs text-white/60">
                          ملفات مفحوصة
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">
                          {liveStats.duplicatesFound}
                        </div>
                        <div className="text-xs text-white/60">تكرارات</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentApp === "remove-duplicate" && (
                <motion.div
                  key="remove-duplicate"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="absolute inset-0 p-6"
                >
                  {/* شريط التنقل */}
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => setCurrentApp("home")}
                      className="p-2 rounded-lg bg-white/10 backdrop-blur-sm"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <h2 className="text-lg font-bold text-white">
                      رييموف دوبليكات
                    </h2>
                    <button className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      <MoreHorizontal className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* لوحة المعلومات المباشرة */}
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-4 border border-white/20 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
                        />
                        <span className="text-white text-sm">
                          {isActive ? "قيد التشغيل" : "متوقف"}
                        </span>
                      </div>
                      <button
                        onClick={() => setIsActive(!isActive)}
                        className={`p-1 rounded-lg ${
                          isActive
                            ? "bg-red-500/20 text-red-300"
                            : "bg-green-500/20 text-green-300"
                        }`}
                      >
                        {isActive ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* دائرة التقدم */}
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <svg
                        className="w-20 h-20 transform -rotate-90"
                        viewBox="0 0 80 80"
                      >
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="6"
                          fill="transparent"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="url(#progressGradient)"
                          strokeWidth="6"
                          fill="transparent"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 35}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 35 * (1 - liveStats.progress / 100)
                          }`}
                          className="transition-all duration-1000"
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
                            <stop offset="100%" stopColor="#8B5CF6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {Math.round(liveStats.progress)}%
                        </span>
                      </div>
                    </div>

                    {/* المقاييس */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-400">
                          {liveStats.duplicatesFound}
                        </div>
                        <div className="text-xs text-white/60">تكرارات</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">
                          {liveStats.spaceSaved.toFixed(1)} MB
                        </div>
                        <div className="text-xs text-white/60">مساحة محررة</div>
                      </div>
                    </div>
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="space-y-3">
                    <button className="w-full p-3 bg-blue-500/20 backdrop-blur-sm rounded-xl border border-blue-500/30 text-blue-300 font-medium">
                      🔍 فحص ملفات جديدة
                    </button>
                    <button className="w-full p-3 bg-red-500/20 backdrop-blur-sm rounded-xl border border-red-500/30 text-red-300 font-medium">
                      🗑️ حذف التكرارات المحددة
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* شريط التنقل السفلي */}
          <div className="flex items-center justify-around py-4 bg-black/30 backdrop-blur-sm border-t border-white/10">
            <button
              onClick={() => setCurrentApp("home")}
              className={`p-2 rounded-lg ${
                currentApp === "home"
                  ? "bg-white/20 text-white"
                  : "text-white/60"
              }`}
            >
              <Home className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg text-white/60">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg text-white/60">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* مؤشر الهاتف */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-white/20 rounded-full" />
      </motion.div>

      {/* التحكم الخارجي */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
              isActive
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "bg-green-500/20 text-green-300 border border-green-500/30"
            }`}
          >
            {isActive ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isActive ? "إيقاف العرض" : "تشغيل العرض"}
          </button>
          <span className="text-white/60 text-sm">عرض مباشر تفاعلي</span>
        </div>
      </motion.div>
    </div>
  );
};

export default GlassPhonePreview;
