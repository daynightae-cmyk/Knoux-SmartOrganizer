import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Settings,
  Zap,
  Brain,
  Shield,
  RefreshCw,
  Target,
  Sparkles,
  Activity,
  ChevronRight,
  Power,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  Signal,
  Battery,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";

interface Addon {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: React.ComponentType<any>;
  status: "active" | "inactive" | "loading" | "error";
  progress: number;
  gradient: string;
  glassColor: string;
  category: "security" | "performance" | "organization" | "analysis";
  version: string;
  size: string;
  lastUsed: string;
  features: string[];
}

const addons: Addon[] = [
  {
    id: "remove-duplicate",
    name: "RemoveDuplicate PRO",
    nameAr: "رييموف دوبليكات برو",
    description: "أداة ذكية لحذف الملفات المكررة بالذكاء الاصطناعي",
    icon: RefreshCw,
    status: "active",
    progress: 85,
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    glassColor: "bg-blue-500/20",
    category: "organization",
    version: "3.2.1",
    size: "45.2 MB",
    lastUsed: "منذ 5 دقائق",
    features: ["فحص ذكي", "حذف آمن", "استرداد الملفات"],
  },
  {
    id: "smart-organizer",
    name: "Smart Organizer",
    nameAr: "المنظم الذكي",
    description: "تنظيم متقدم للملفات بالذكاء الاصطناعي",
    icon: Brain,
    status: "active",
    progress: 92,
    gradient: "from-purple-500 via-violet-500 to-indigo-500",
    glassColor: "bg-purple-500/20",
    category: "organization",
    version: "2.8.4",
    size: "78.1 MB",
    lastUsed: "منذ 12 دقيقة",
    features: ["تصنيف تلقائي", "تحليل ذكي", "توصيات شخصية"],
  },
  {
    id: "boost-mode",
    name: "Boost Mode",
    nameAr: "وضع التسريع",
    description: "تسريع النظام وتحسين الأداء بشكل ذكي",
    icon: Zap,
    status: "loading",
    progress: 67,
    gradient: "from-yellow-500 via-orange-500 to-red-500",
    glassColor: "bg-orange-500/20",
    category: "performance",
    version: "1.9.2",
    size: "32.5 MB",
    lastUsed: "من�� ساعة",
    features: ["تسريع التطبيقات", "تنظيف الذاكرة", "تحسين القرص"],
  },
  {
    id: "system-cleanup",
    name: "System Cleanup",
    nameAr: "منظف النظام",
    description: "تنظيف شامل للنظام من الملفات غير الضرورية",
    icon: Settings,
    status: "inactive",
    progress: 0,
    gradient: "from-green-500 via-emerald-500 to-cyan-500",
    glassColor: "bg-green-500/20",
    category: "performance",
    version: "4.1.0",
    size: "28.7 MB",
    lastUsed: "منذ يوم",
    features: ["تنظيف عميق", "إزالة البرامج", "تحسين السجل"],
  },
  {
    id: "security-shield",
    name: "Security Shield",
    nameAr: "درع الحماية",
    description: "حماية متقدمة ضد البرمجيات الخبيثة",
    icon: Shield,
    status: "active",
    progress: 98,
    gradient: "from-red-500 via-pink-500 to-rose-500",
    glassColor: "bg-red-500/20",
    category: "security",
    version: "5.0.1",
    size: "156.8 MB",
    lastUsed: "منذ دقيقتين",
    features: ["حماية فورية", "فحص ذكي", "جدار حماية"],
  },
  {
    id: "ai-image-analysis",
    name: "AI Image Analysis",
    nameAr: "تحليل الصور بالذكاء الاصطناعي",
    description: "تحليل متقدم للصور باستخدام الذكاء الاصطناعي",
    icon: Target,
    status: "active",
    progress: 88,
    gradient: "from-indigo-500 via-blue-500 to-purple-500",
    glassColor: "bg-indigo-500/20",
    category: "analysis",
    version: "3.1.2",
    size: "125.7 MB",
    lastUsed: "منذ دقيقة",
    features: ["كشف الوجوه", "تحليل المحتوى", "استخراج النصوص"],
  },
];

export const GlassAddonManager: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [selectedAddon, setSelectedAddon] = useState<string | null>(null);
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    temperature: 0,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // تحديث إحصائيات النظام
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats({
        cpu: Math.random() * 80 + 10,
        memory: Math.random() * 70 + 20,
        disk: Math.random() * 60 + 30,
        network: Math.random() * 100 + 50,
        temperature: Math.random() * 15 + 45,
      });
      setCurrentTime(new Date());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "loading":
        return <Activity className="w-4 h-4 text-yellow-400 animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <PauseCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      security: "text-red-400",
      performance: "text-yellow-400",
      organization: "text-blue-400",
      analysis: "text-purple-400",
    };
    return colors[category as keyof typeof colors] || "text-gray-400";
  };

  const activeAddons = addons.filter((addon) => addon.status === "active");
  const avgProgress =
    activeAddons.reduce((sum, addon) => sum + addon.progress, 0) /
    activeAddons.length;

  return (
    <div className={`relative w-full ${className}`}>
      {/* شاشة التلفزيون العلوية */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8"
      >
        {/* إطار التلفزيون */}
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-2xl border border-white/10">
          {/* مؤشرات الحالة العلوية */}
          <div className="flex items-center justify-between mb-4 text-white/80">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm">Live</span>
              </div>
              <div className="text-sm">
                {currentTime.toLocaleTimeString("ar-SA")}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Signal className="w-4 h-4" />
              <Wifi className="w-4 h-4" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* الشاشة الرئيسية */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50 rounded-2xl p-6 backdrop-blur-xl border border-white/10">
            {/* إحصائيات النظام */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <Cpu className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">
                  {Math.round(systemStats.cpu)}%
                </div>
                <div className="text-xs text-white/60">معالج</div>
                <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                  <div
                    className="bg-blue-400 h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${systemStats.cpu}%` }}
                  />
                </div>
              </div>

              <div className="text-center">
                <MemoryStick className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">
                  {Math.round(systemStats.memory)}%
                </div>
                <div className="text-xs text-white/60">ذاكرة</div>
                <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                  <div
                    className="bg-green-400 h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${systemStats.memory}%` }}
                  />
                </div>
              </div>

              <div className="text-center">
                <HardDrive className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">
                  {Math.round(systemStats.disk)}%
                </div>
                <div className="text-xs text-white/60">قرص</div>
                <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                  <div
                    className="bg-purple-400 h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${systemStats.disk}%` }}
                  />
                </div>
              </div>

              <div className="text-center">
                <Activity className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">
                  {Math.round(systemStats.network)} MB/s
                </div>
                <div className="text-xs text-white/60">شبكة</div>
                <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                  <div
                    className="bg-orange-400 h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${(systemStats.network / 150) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center">
                <Clock className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">
                  {Math.round(systemStats.temperature)}°C
                </div>
                <div className="text-xs text-white/60">حرارة</div>
                <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                  <div
                    className="bg-red-400 h-1 rounded-full transition-all duration-1000"
                    style={{
                      width: `${(systemStats.temperature / 80) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* معلومات النظام العامة */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">
                    الإضافات النشطة
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {activeAddons.length}
                </div>
                <div className="text-xs text-white/60">
                  من أصل {addons.length} إضافات
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">متوسط الأداء</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(avgProgress)}%
                </div>
                <div className="text-xs text-white/60">كفاءة الإضافات</div>
              </div>

              <div className="bg-black/30 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">حالة النظام</span>
                </div>
                <div className="text-lg font-bold text-purple-400">ممتاز</div>
                <div className="text-xs text-white/60">جميع الأنظمة تعمل</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* قائ��ة الإضافات الزجاجية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addons.map((addon, index) => {
          const IconComponent = addon.icon;
          const isSelected = selectedAddon === addon.id;

          return (
            <motion.div
              key={addon.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setSelectedAddon(isSelected ? null : addon.id)}
              className="group cursor-pointer"
            >
              {/* بطاقة الإضافة الزجاجية */}
              <div
                className={`
                  relative p-6 rounded-2xl backdrop-blur-xl border border-white/20
                  ${addon.glassColor} hover:bg-white/10
                  shadow-2xl transition-all duration-500 ease-out
                  hover:shadow-3xl hover:border-white/30
                  ${isSelected ? "ring-2 ring-white/50 shadow-3xl" : ""}
                `}
              >
                {/* تأثير التوهج */}
                <div
                  className={`
                    absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20
                    bg-gradient-to-r ${addon.gradient}
                    transition-opacity duration-500 blur-xl
                  `}
                />

                <div className="relative z-10">
                  {/* الرأس */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          p-3 rounded-xl bg-gradient-to-br ${addon.gradient}
                          shadow-xl group-hover:shadow-2xl
                          transition-all duration-500
                        `}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {addon.nameAr}
                        </h3>
                        <p className="text-sm text-white/60">{addon.name}</p>
                      </div>
                    </div>
                    {getStatusIcon(addon.status)}
                  </div>

                  {/* الوصف */}
                  <p className="text-white/80 text-sm mb-4 leading-relaxed">
                    {addon.description}
                  </p>

                  {/* شريط التقدم */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-white/60 mb-2">
                      <span>التقدم</span>
                      <span>{addon.progress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${addon.gradient} transition-all duration-1000`}
                        style={{ width: `${addon.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* المعلومات الإضافية */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-white/50">
                    <div>
                      <span>الإصدار: </span>
                      <span className="text-white/70">{addon.version}</span>
                    </div>
                    <div>
                      <span>الحجم: </span>
                      <span className="text-white/70">{addon.size}</span>
                    </div>
                    <div className="col-span-2">
                      <span>آخر استخدام: </span>
                      <span className="text-white/70">{addon.lastUsed}</span>
                    </div>
                  </div>

                  {/* الميزات المطوية */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-white/20"
                      >
                        <h4 className="text-sm font-semibold text-white mb-2">
                          الميزات الرئيسية:
                        </h4>
                        <div className="space-y-2">
                          {addon.features.map((feature, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm"
                            >
                              <ChevronRight className="w-3 h-3 text-white/50" />
                              <span className="text-white/80">{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* أزرار الإجراءات */}
                        <div className="flex gap-2 mt-4">
                          <button
                            className={`
                              flex-1 px-3 py-2 rounded-lg text-sm font-medium
                              ${
                                addon.status === "active"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : "bg-green-500/20 text-green-300 border border-green-500/30"
                              }
                              transition-colors hover:bg-opacity-30
                            `}
                          >
                            {addon.status === "active" ? "إيقاف" : "تشغيل"}
                          </button>
                          <button className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 transition-colors hover:bg-opacity-30">
                            إعدادات
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GlassAddonManager;
