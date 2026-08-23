import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Activity,
  Shield,
  FolderOpen,
  FileText,
  Image,
  Users,
  Brain,
  Zap,
  Search,
  Settings,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  User,
} from "lucide-react";
import { GlassLayout } from "@/components/GlassLayout";
import sectionsData from "@/data/sections.json";
import { cn } from "@/lib/utils";

// Types
interface Section {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  gradient: string;
  toolCount: number;
  description: string;
  tools: Tool[];
}

interface Tool {
  id: string;
  name: string;
  script: string;
  icon: string;
  aiModel?: string;
  type?: string;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  "duplicate-scanner": Search,
  "system-clean": Monitor,
  "privacy-shield": Shield,
  "folder-master": FolderOpen,
  "text-analyze": FileText,
  "media-organize": Image,
  productivity: Users,
  "smart-organize": Brain,
  "boost-rocket": Zap,
  "smart-advisor": Activity,
};

// Section Card Component
const SectionCard: React.FC<{
  section: Section;
  onClick: () => void;
  delay: number;
}> = ({ section, onClick, delay }) => {
  const IconComponent = iconMap[section.icon] || Brain;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="glass-card p-6 cursor-pointer group relative overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Knoux Sparkle in corner */}
      <div className="absolute top-4 right-4">
        <motion.div
          className="flex items-center gap-1 text-yellow-400"
          animate={
            isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }
          }
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold">Knoux</span>
        </motion.div>
      </div>

      {/* Background Gradient */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br",
          section.gradient,
        )}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Icon Container */}
        <motion.div
          className={cn(
            "p-6 rounded-2xl mb-4 bg-gradient-to-br",
            section.gradient,
          )}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <IconComponent className="w-10 h-10 text-white" />
        </motion.div>

        {/* Section Info */}
        <h3 className="glass-title text-xl font-bold mb-2">{section.nameAr}</h3>
        <p className="glass-text-muted text-sm mb-3 font-medium">
          {section.name}
        </p>
        <p className="glass-text text-sm leading-relaxed mb-4">
          {section.description}
        </p>

        {/* Tool Count Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="glass-card px-3 py-1 rounded-full">
            <span className="glass-text text-sm font-bold">
              {section.toolCount} أداة
            </span>
          </div>
        </div>

        {/* Action Button */}
        <motion.div
          className="glass-button-primary px-6 py-2 rounded-full text-sm font-medium"
          whileHover={{ scale: 1.05 }}
        >
          تشغيل القسم
        </motion.div>
      </div>

      {/* Prof. Sadek Elgazar Signature */}
      <div className="absolute bottom-3 left-3 text-xs glass-text-muted opacity-60">
        Prof. Sadek Elgazar
      </div>

      {/* Hover Animation */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + i * 10}%`,
                }}
                animate={{
                  y: [-10, 10, -10],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Live Preview Component
const LivePreviewCard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    filesScanned: 0,
    duplicatesFound: 0,
    spaceSaved: 0,
    systemHealth: 98,
    activeTools: 3,
    processingTime: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        filesScanned: prev.filesScanned + Math.floor(Math.random() * 5) + 1,
        duplicatesFound: prev.duplicatesFound + (Math.random() > 0.7 ? 1 : 0),
        spaceSaved: prev.spaceSaved + Math.random() * 0.5,
        systemHealth: Math.max(
          90,
          Math.min(100, prev.systemHealth + (Math.random() - 0.5) * 2),
        ),
        activeTools: Math.max(
          1,
          Math.min(
            8,
            prev.activeTools +
              (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0),
          ),
        ),
        processingTime: prev.processingTime + 1,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="glass-title text-lg font-bold">Live Preview</h3>
          <p className="glass-text-muted text-sm">المعاينة المباشرة</p>
        </div>
      </div>

      <div className="space-y-4">
        {[
          {
            label: "ملفات مفحوصة",
            value: metrics.filesScanned.toLocaleString(),
            icon: FileText,
          },
          {
            label: "مكررات مكتشفة",
            value: metrics.duplicatesFound,
            icon: Search,
          },
          {
            label: "مساحة محررة",
            value: `${metrics.spaceSaved.toFixed(1)} MB`,
            icon: HardDrive,
          },
          {
            label: "صحة النظام",
            value: `${metrics.systemHealth.toFixed(1)}%`,
            icon: Monitor,
          },
          { label: "أدوات نشطة", value: metrics.activeTools, icon: Zap },
          {
            label: "وقت المعالجة",
            value: `${Math.floor(metrics.processingTime / 60)}:${(metrics.processingTime % 60).toString().padStart(2, "0")}`,
            icon: Clock,
          },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              className="flex items-center justify-between p-3 glass-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 glass-text-muted" />
                <span className="glass-text text-sm">{metric.label}</span>
              </div>
              <span className="glass-title text-sm font-bold">
                {metric.value}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Real-time status indicator */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="glass-text-muted text-xs">نشط</span>
          </div>
          <span className="glass-text-muted text-xs">
            آخر تحديث: {new Date().toLocaleTimeString("ar-SA")}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// System Status Card
const SystemStatusCard: React.FC = () => {
  const [systemInfo] = useState({
    os: "Windows 11 Pro",
    cpu: "Intel Core i7-12700K",
    ram: "32 GB DDR4",
    storage: "1TB NVMe SSD",
    isKnouxDevice:
      window.location.hostname.includes("knoux7-core") || Math.random() > 0.5,
  });

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="glass-title text-lg font-bold">معلومات النظام</h3>
          <p className="glass-text-muted text-sm">System Information</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="glass-text text-sm">نظام التشغيل</span>
          <span className="glass-text-muted text-sm">{systemInfo.os}</span>
        </div>
        <div className="flex justify-between">
          <span className="glass-text text-sm">المعالج</span>
          <span className="glass-text-muted text-sm">{systemInfo.cpu}</span>
        </div>
        <div className="flex justify-between">
          <span className="glass-text text-sm">الذاكرة</span>
          <span className="glass-text-muted text-sm">{systemInfo.ram}</span>
        </div>
        <div className="flex justify-between">
          <span className="glass-text text-sm">التخزين</span>
          <span className="glass-text-muted text-sm">{systemInfo.storage}</span>
        </div>
      </div>

      {/* Knoux Device Status */}
      {systemInfo.isKnouxDevice && (
        <motion.div
          className="mt-4 p-3 glass-card bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="glass-text text-sm font-bold text-purple-300">
              جهاز Knoux7-Core مكتشف
            </span>
          </div>
          <p className="glass-text-muted text-xs mt-1">
            وضع الأداء العالي مفعل تلقائياً
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

// Main Dashboard Component
export default function KnouxMainDashboard() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const sections = sectionsData.sections as Section[];

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId);
    // Navigate to section detail page
    window.location.href = `/section/${sectionId}`;
  };

  return (
    <GlassLayout currentPage="home">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          className="text-center glass-card p-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h1 className="glass-title text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
              Knoux SmartOrganizer
            </h1>
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="glass-subtitle text-xl mb-2">
            تطبيق Windows متكامل لتنظيم الملفات وتحسين النظام
          </p>
          <p className="glass-text-muted">
            {sections.length} أقسام متخصصة •{" "}
            {sections.reduce((total, section) => total + section.toolCount, 0)}{" "}
            أداة احترافية • ذكاء صناعي محلي
          </p>
        </motion.div>

        {/* Sidebar Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* System Status */}
          <div className="space-y-6">
            <SystemStatusCard />
            <LivePreviewCard />
          </div>

          {/* Main Sections Grid */}
          <div className="xl:col-span-3">
            <motion.h2
              className="glass-title text-2xl font-bold mb-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              الأقسام المتخصصة
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section, index) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  onClick={() => handleSectionClick(section.id)}
                  delay={0.4 + index * 0.1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          className="text-center py-8 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="w-4 h-4 glass-text-muted" />
            <span className="glass-text-muted text-sm font-medium">
              Prof. Sadek Elgazar
            </span>
          </div>
          <p className="glass-text-muted text-xs">
            © 2024 Knoux SmartOrganizer - أقوى تطبيق تنظيم ملفات بالذكاء
            الاصطناعي
          </p>
        </motion.div>
      </div>
    </GlassLayout>
  );
}
