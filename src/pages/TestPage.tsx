import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, Zap, Star, Crown, Gem } from "lucide-react";
import {
  KnouxMainLogo,
  SimpleOrganizerLogo,
  SmartOrganizerLogo,
  UltimateEditionLogo,
  RemoveDuplicateLogo,
  RemoveDuplicateProLogo,
  MasterBrandingBanner,
  LogoText,
} from "@/components/LogoSystem";

interface AppCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  LogoComponent: React.ComponentType<{ size?: number }>;
  route: string;
  gradient: string;
  glassColor: string;
  shadowColor: string;
  level: "basic" | "advanced" | "pro" | "ultimate";
}

const apps: AppCard[] = [
  {
    id: "simple",
    title: "التطبيق المبسط",
    subtitle: "Simple Organizer",
    description: "واجهة بسيطة وآمنة لتنظيم الملفات بسهولة تامة مع حماية كاملة",
    LogoComponent: SimpleOrganizerLogo,
    route: "/simple",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    glassColor: "bg-emerald-500/20",
    shadowColor: "shadow-emerald-500/50",
    level: "basic",
  },
  {
    id: "organizer",
    title: "المنظم الذكي",
    subtitle: "Smart Organizer",
    description: "تنظيم متقدم بالذكاء الاصطناعي وتصنيف تلقائي ذكي للملفات",
    LogoComponent: SmartOrganizerLogo,
    route: "/organizer",
    gradient: "from-blue-400 via-indigo-500 to-purple-600",
    glassColor: "bg-blue-500/20",
    shadowColor: "shadow-blue-500/50",
    level: "advanced",
  },
  {
    id: "ultimate",
    title: "التطبيق المتطور",
    subtitle: "Ultimate Edition",
    description: "النسخة الأكثر تطوراً مع جميع المميزات المتقدمة والاحترافية",
    LogoComponent: UltimateEditionLogo,
    route: "/ultimate",
    gradient: "from-purple-400 via-violet-500 to-indigo-600",
    glassColor: "bg-purple-500/20",
    shadowColor: "shadow-purple-500/50",
    level: "ultimate",
  },
  {
    id: "remove-duplicate",
    title: "رييموف دوبليكات",
    subtitle: "RemoveDuplicate",
    description: "أداة ذكية لحذف الملفات المكررة وتوفير المساحة بأمان كامل",
    LogoComponent: RemoveDuplicateLogo,
    route: "/remove-duplicate",
    gradient: "from-cyan-400 via-teal-500 to-blue-600",
    glassColor: "bg-cyan-500/20",
    shadowColor: "shadow-cyan-500/50",
    level: "pro",
  },
  {
    id: "remove-duplicate-pro",
    title: "رييموف دوبليكات برو",
    subtitle: "RemoveDuplicate PRO",
    description:
      "النسخة الاحترافية بالذكاء الاصطناعي وفحص النظام الكامل المتطور",
    LogoComponent: RemoveDuplicateProLogo,
    route: "/remove-duplicate-pro",
    gradient: "from-pink-400 via-rose-500 to-red-600",
    glassColor: "bg-pink-500/20",
    shadowColor: "shadow-pink-500/50",
    level: "ultimate",
  },
];

const floatingShapes = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  size: 60 + i * 10, // Fixed sizes to avoid random issues
  x: (i * 12.5) % 100, // Distributed positions
  y: (i * 15) % 100,
  duration: 10 + i * 2, // Fixed durations: 10, 12, 14, etc.
  delay: i * 0.5, // Fixed delays: 0, 0.5, 1.0, etc.
}));

export function TestPage() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Add CSS animations to head
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
        50% { transform: translateY(-20px) scale(1.1); opacity: 0.6; }
      }

      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes gradient-x {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .animate-spin-slow {
        animation: spin-slow 20s linear infinite;
      }

      .animate-gradient-x {
        background-size: 200% 200%;
        animation: gradient-x 6s ease infinite;
      }

      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleAppClick = (route: string) => {
    window.location.href = route;
  };

  const getLevelBadge = (level: string) => {
    const badges = {
      basic: {
        text: "أساسي",
        color: "from-green-400 to-emerald-600",
        icon: Shield,
      },
      advanced: {
        text: "متقدم",
        color: "from-blue-400 to-indigo-600",
        icon: Zap,
      },
      pro: { text: "احترافي", color: "from-cyan-400 to-teal-600", icon: Star },
      ultimate: {
        text: "نهائي",
        color: "from-purple-400 to-pink-600",
        icon: Crown,
      },
    };

    const badge = badges[level as keyof typeof badges];
    const IconComponent = badge.icon;

    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${badge.color} text-white text-xs font-bold shadow-lg`}
      >
        <IconComponent className="w-3 h-3" />
        {badge.text}
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Dynamic gradient overlay */}
        <div
          className="absolute inset-0 opacity-30 transition-all duration-300 ease-out"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)`,
          }}
        />

        {/* Floating shapes with pure CSS animations */}
        {floatingShapes.map((shape) => (
          <div
            key={shape.id}
            className="absolute rounded-full bg-white/5 backdrop-blur-sm animate-pulse"
            style={{
              width: shape.size,
              height: shape.size,
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              animation: `float ${shape.duration}s ease-in-out infinite`,
              animationDelay: `${shape.delay}s`,
            }}
          />
        ))}

        {/* Mesh gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(236,72,153,0.3),transparent_50%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Master Branding Banner */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8"
        >
          <MasterBrandingBanner className="rounded-3xl backdrop-blur-md bg-white/5 border border-white/10" />
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="text-center mb-12"
        >
          {/* Professional Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8"
          >
            <KnouxMainLogo size={120} animated={true} />
          </motion.div>

          {/* Professional Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <LogoText
              title="Knoux SmartOrganizer"
              subtitle="نوكس المنظم الذكي"
              size="lg"
              className="mb-6"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            منصة شاملة لتنظيم الملفات بالذكاء الاصطناعي - اختر التطبيق المناسب
            لاحتياجاتك
          </motion.p>
        </motion.div>

        {/* Apps Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
        >
          {apps.map((app, index) => {
            const LogoComponent = app.LogoComponent;

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.5 }}
                whileHover={{
                  y: -10,
                  scale: 1.02,
                  transition: { duration: 0.3 },
                }}
                onHoverStart={() => setSelectedApp(app.id)}
                onHoverEnd={() => setSelectedApp(null)}
                onClick={() => handleAppClick(app.route)}
                className="group cursor-pointer"
              >
                {/* Glass Card */}
                <div
                  className={`
                  relative p-8 rounded-3xl backdrop-blur-xl border border-white/20
                  ${app.glassColor} hover:bg-white/10
                  shadow-2xl ${app.shadowColor}
                  transition-all duration-500 ease-out
                  hover:shadow-3xl hover:border-white/30
                  min-h-[320px] flex flex-col
                `}
                >
                  {/* Glow effect */}
                  <div
                    className={`
                    absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20
                    bg-gradient-to-r ${app.gradient}
                    transition-opacity duration-500 blur-xl
                  `}
                  />

                  {/* Level Badge */}
                  <div className="absolute top-4 right-4">
                    {getLevelBadge(app.level)}
                  </div>

                  {/* Professional Logo Container */}
                  <div className="relative mb-6 flex justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1, y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <LogoComponent size={80} />

                      {/* Logo glow effect */}
                      <div
                        className={`
                          absolute inset-0 rounded-full opacity-0 group-hover:opacity-40
                          bg-gradient-to-br ${app.gradient} blur-xl
                          transition-opacity duration-500
                        `}
                      />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col text-right">
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-white/90 transition-colors">
                      {app.title}
                    </h3>

                    <h4 className="text-lg text-white/60 mb-4 font-medium">
                      {app.subtitle}
                    </h4>

                    <p className="text-white/70 leading-relaxed flex-1 mb-6">
                      {app.description}
                    </p>

                    {/* Action Button */}
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center justify-end gap-2 text-white/80 group-hover:text-white transition-colors"
                    >
                      <span className="font-medium">تشغيل التطبيق</span>
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </div>

                  {/* Selection glow */}
                  <AnimatePresence>
                    {selectedApp === app.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`
                          absolute inset-0 rounded-3xl
                          bg-gradient-to-br ${app.gradient} opacity-20
                          border-2 border-white/40
                        `}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-300 text-sm font-medium">
              جميع الأنظمة تعمل بشكل مثالي
            </span>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-16 text-center text-white/40 text-sm"
        >
          <div className="flex items-center justify-center gap-1 mb-2">
            <Gem className="w-4 h-4" />
            <span>مدعوم بأحدث تقنيات الذكاء الاصطناعي</span>
            <Gem className="w-4 h-4" />
          </div>
          <p>© 2024 Knoux SmartOrganizer PRO - أجمل منظم للملفات في العالم</p>
        </motion.footer>

        {/* Developer Demo Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="mt-16 text-center"
        >
          <div className="p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-3xl backdrop-blur-md border border-white/10 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-3">
              🎯 للمطورين: عرض توضيحي للوحات المعلومات المباشرة
            </h3>
            <p className="text-white/70 mb-4 text-sm">
              شاهد كيف تعمل لوحات Live Preview في جميع أقسام التطبيق مع البيانات
              الحية والتحديثات الفورية
            </p>
            <div className="space-y-3">
              <button
                onClick={() => (window.location.href = "/remove-duplicate-pro")}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:via-pink-700 hover:to-red-700 transition-colors shadow-lg border-2 border-yellow-400/30"
              >
                🚀 RemoveDuplicate PRO - النسخة المتطورة بالذكاء الاصطناعي
              </button>
              <button
                onClick={() => (window.location.href = "/ultimate")}
                className="w-full bg-gradient-to-r from-slate-600 via-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-slate-700 hover:via-blue-700 hover:to-purple-700 transition-colors shadow-lg border-2 border-cyan-400/30"
              >
                📺 مدير الإضافات الزجاجي - شاشة التحكم المتطورة
              </button>
              <button
                onClick={() => (window.location.href = "/ai-analysis")}
                className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 text-white px-6 py-3 rounded-lg hover:from-pink-700 hover:via-rose-700 hover:to-red-700 transition-colors shadow-lg border-2 border-purple-400/30"
              >
                🧠 تحليل الصور بالذكاء الاصطناعي - مطابق للصور المرفقة
              </button>
              <button
                onClick={() => (window.location.href = "/offline-ai-tools")}
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 transition-colors shadow-lg border-2 border-green-400/30"
              >
                🤖 أدوات الذكاء الاصطناعي المحلية - يعمل بدون إنترنت
              </button>
              <button
                onClick={() =>
                  (window.location.href = "/neomorphism-dashboard")
                }
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-colors shadow-lg border-2 border-amber-400/30"
              >
                🎨 لوحة التحكم Neomorphism - تصميم ناعم متطور
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default TestPage;
