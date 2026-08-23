import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Image,
  Music,
  Sparkles,
  Zap,
  Shield,
  Star,
  ArrowRight,
  Activity,
  TrendingUp,
  FileSearch,
  Settings,
} from "lucide-react";
import { GlassLayout } from "@/components/GlassLayout";
import { cn } from "@/lib/utils";

// Stats data
const statsData = [
  {
    icon: FileSearch,
    label: "ملفات منظمة",
    value: "12,847",
    change: "+23%",
    color: "from-blue-400 to-cyan-400",
  },
  {
    icon: Brain,
    label: "تحليلات AI",
    value: "3,256",
    change: "+45%",
    color: "from-purple-400 to-pink-400",
  },
  {
    icon: Activity,
    label: "مساحة محررة",
    value: "2.8 GB",
    change: "+12%",
    color: "from-green-400 to-emerald-400",
  },
  {
    icon: TrendingUp,
    label: "ك��اءة النظام",
    value: "98.5%",
    change: "+5%",
    color: "from-orange-400 to-red-400",
  },
];

// Feature cards data
const featuresData = [
  {
    id: "ai-tools",
    title: "أدوات الذكاء الاصطناعي",
    description: "محادثة ذكية وتحليل الملفات بتقنيات متطورة",
    icon: Brain,
    path: "/offline-ai-tools",
    gradient: "from-purple-500 to-pink-500",
    delay: 0.1,
  },
  {
    id: "image-analysis",
    title: "تحليل الصور",
    description: "كشف الوجوه والكائنات وتصنيف الصور تلقائياً",
    icon: Image,
    path: "/ai-analysis",
    gradient: "from-blue-500 to-cyan-500",
    delay: 0.2,
  },
  {
    id: "music-player",
    title: "مشغل الموسيقى",
    description: "استمتع بالموسيقى مع واجهة أنيقة ومتطورة",
    icon: Music,
    path: "/neomorphism-dashboard",
    gradient: "from-green-500 to-emerald-500",
    delay: 0.3,
  },
  {
    id: "advanced-settings",
    title: "إعدادات متقدمة",
    description: "تخصيص كامل للنظام وأدوات التحكم الذكية",
    icon: Settings,
    path: "/settings",
    gradient: "from-gray-500 to-slate-500",
    delay: 0.4,
  },
];

// Quick actions data
const quickActions = [
  {
    title: "فحص سريع",
    description: "تحليل فوري للملفات",
    icon: Zap,
    color: "from-yellow-400 to-orange-400",
  },
  {
    title: "حماية متقدمة",
    description: "فحص الأمان والخصوصية",
    icon: Shield,
    color: "from-blue-400 to-indigo-400",
  },
  {
    title: "تحسين الأداء",
    description: "تسريع النظام وتنظيف الملفات",
    icon: Star,
    color: "from-purple-400 to-pink-400",
  },
];

// Stats Card Component
const StatsCard: React.FC<{
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  change: string;
  color: string;
  delay: number;
}> = ({ icon: Icon, label, value, change, color, delay }) => {
  return (
    <motion.div
      className="glass-card p-6 hover:glass-card-luxury transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-xl bg-gradient-to-br", color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="glass-text-muted text-sm">{change}</span>
      </div>
      <div>
        <p className="glass-text-muted text-sm mb-1">{label}</p>
        <p className="glass-title text-2xl font-bold">{value}</p>
      </div>
    </motion.div>
  );
};

// Feature Card Component
const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  path: string;
  gradient: string;
  delay: number;
  onClick: (path: string) => void;
}> = ({ title, description, icon: Icon, path, gradient, delay, onClick }) => {
  return (
    <motion.div
      className="glass-card p-6 cursor-pointer group hover:glass-card-luxury transition-all duration-300"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(path)}
    >
      <div className="flex flex-col items-center text-center">
        <motion.div
          className={cn("p-6 rounded-2xl bg-gradient-to-br mb-4", gradient)}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="glass-title text-lg font-bold mb-2">{title}</h3>
        <p className="glass-text-muted text-sm leading-relaxed mb-4">
          {description}
        </p>
        <motion.div
          className="flex items-center gap-2 glass-text-muted group-hover:glass-text transition-colors"
          whileHover={{ x: 4 }}
        >
          <span className="text-sm font-medium">استكشف</span>
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </div>
    </motion.div>
  );
};

// Quick Action Component
const QuickAction: React.FC<{
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  delay: number;
}> = ({ title, description, icon: Icon, color, delay }) => {
  return (
    <motion.div
      className="glass-card p-4 cursor-pointer hover:glass-card-luxury transition-all duration-300"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-gradient-to-br", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="glass-text font-medium text-sm">{title}</h4>
          <p className="glass-text-muted text-xs">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default function GlassHomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ar-SA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <GlassLayout currentPage="home" onNavigate={handleNavigation}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <motion.div
          className="glass-card p-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="flex items-center justify-center gap-3 mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <h1 className="glass-title text-3xl font-bold">
              مرحباً بك في Knoux SmartOrganizer
            </h1>
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </motion.div>
          <p className="glass-subtitle text-lg mb-4">
            المنظم الذكي الأكثر تطوراً لإدارة ملفاتك
          </p>
          <div className="flex items-center justify-center gap-6 glass-text-muted text-sm">
            <div className="flex items-center gap-2">
              <span>{formatDate(currentTime)}</span>
            </div>
            <div className="w-1 h-1 bg-white/30 rounded-full" />
            <div className="flex items-center gap-2">
              <span>{formatTime(currentTime)}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <StatsCard key={stat.label} {...stat} delay={0.4 + index * 0.1} />
          ))}
        </div>

        {/* Main Features */}
        <div>
          <motion.h2
            className="glass-title text-2xl font-bold mb-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            الأدوات الرئيسية
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuresData.map((feature) => (
              <FeatureCard
                key={feature.id}
                {...feature}
                onClick={handleNavigation}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <motion.h3
              className="glass-title text-xl font-bold mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              إجراءات سريعة
            </motion.h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <QuickAction
                  key={action.title}
                  {...action}
                  delay={1.4 + index * 0.1}
                />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <motion.h3
              className="glass-title text-xl font-bold mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              النشاط الأخير
            </motion.h3>
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              <div className="space-y-4">
                {[
                  {
                    action: "تم تحليل 24 صورة جديدة",
                    time: "منذ 5 دقائق",
                    type: "success",
                  },
                  {
                    action: "تحويل ملف صوتي إلى نص",
                    time: "منذ 15 دقيقة",
                    type: "processing",
                  },
                  {
                    action: "تنظيم مجلد المستندات",
                    time: "منذ 30 دقيقة",
                    type: "success",
                  },
                  {
                    action: "حذف 12 ملف مكرر",
                    time: "منذ ساعة",
                    type: "success",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center justify-between p-3 glass-card hover:glass-card-luxury transition-all duration-300"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.6 + index * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          item.type === "success"
                            ? "bg-green-400"
                            : "bg-blue-400",
                        )}
                      />
                      <span className="glass-text">{item.action}</span>
                    </div>
                    <span className="glass-text-muted text-sm">
                      {item.time}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <p className="glass-text-muted text-sm">
            © 2024 Knoux SmartOrganizer - المنظم الذكي الأكثر تطوراً
          </p>
        </motion.div>
      </div>
    </GlassLayout>
  );
}
