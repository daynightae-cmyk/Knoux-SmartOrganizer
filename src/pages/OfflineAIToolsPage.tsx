import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  Brain,
  Cpu,
  Monitor,
  Settings,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
  Globe,
  WifiOff,
} from "lucide-react";

// Import our components
import { OfflineAIToolsSuite } from "@/components/OfflineAIToolsSuite";
import { LivePreviewPanel } from "@/components/LivePreviewPanel";
import { offlineAI } from "@/lib/offline-ai-engine";
import { systemMonitor, useSystemMonitor } from "@/lib/websocket-monitor";

// Master Branding Components
const KnouxOfflineAILogo: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <motion.div
    className="relative flex items-center justify-center"
    style={{ width: size, height: size }}
  >
    {/* Main logo container */}
    <motion.div
      className="relative w-full h-full rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4 shadow-2xl"
      whileHover={{ scale: 1.05, rotate: 2 }}
      transition={{ duration: 0.3 }}
    >
      {/* AI Brain Icon */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <Brain className="w-8 h-8 text-white" />
        <WifiOff className="absolute -top-1 -right-1 w-4 h-4 text-green-400 bg-black rounded-full p-0.5" />
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl" />

      {/* Animated ring */}
      <motion.div
        className="absolute -inset-2 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-3xl opacity-50 blur-lg"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>

    {/* Floating particles */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-blue-400 rounded-full"
        style={{
          left: `${20 + i * 15}%`,
          top: `${25 + i * 12}%`,
        }}
        animate={{
          y: [-10, 10, -10],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 2 + i * 0.5,
          repeat: Infinity,
          delay: i * 0.3,
        }}
      />
    ))}
  </motion.div>
);

// System Health Indicator
const SystemHealthCard: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { data, isConnected } = useSystemMonitor();
  const [engineStatus, setEngineStatus] = useState(offlineAI.getStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setEngineStatus(offlineAI.getStatus());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const systemHealth = data ? systemMonitor.getSystemHealth() : null;

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "text-green-400 bg-green-400/20 border-green-400/30";
      case "good":
        return "text-blue-400 bg-blue-400/20 border-blue-400/30";
      case "warning":
        return "text-yellow-400 bg-yellow-400/20 border-yellow-400/30";
      case "critical":
        return "text-red-400 bg-red-400/20 border-red-400/30";
      default:
        return "text-gray-400 bg-gray-400/20 border-gray-400/30";
    }
  };

  return (
    <Card
      className={cn("bg-black/20 border-white/10 backdrop-blur-sm", className)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          حالة النظام والذكاء الاصطناعي
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">حالة الاتصال</span>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-gray-500"
                }`}
              />
              <span className="text-xs text-white/60">
                {isConnected ? "متصل (محاكاة)" : "غير متصل"}
              </span>
            </div>
          </div>

          {/* System Health */}
          {systemHealth && (
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">صحة النظام</span>
              <Badge
                className={getHealthColor(systemHealth.overall)}
                variant="outline"
              >
                {systemHealth.overall === "excellent" && "ممتاز"}
                {systemHealth.overall === "good" && "جيد"}
                {systemHealth.overall === "warning" && "تحذير"}
                {systemHealth.overall === "critical" && "حرج"}
                {" • "}
                {Math.round(systemHealth.score)}%
              </Badge>
            </div>
          )}

          {/* AI Engine Status */}
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">محرك الذكاء الاصطناعي</span>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  engineStatus.initialized ? "bg-green-400" : "bg-red-400"
                }`}
              />
              <span className="text-xs text-white/60">
                {engineStatus.initialized ? "جاهز" : "غير جاهز"}
              </span>
            </div>
          </div>

          {/* Models Status */}
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">النماذج المحملة</span>
            <span className="text-sm text-cyan-400">
              {engineStatus.modelsLoaded}/{engineStatus.totalModels}
            </span>
          </div>

          {/* Memory Usage */}
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">استخدام الذاكرة</span>
            <span className="text-sm text-purple-400">
              {Math.round(engineStatus.memoryUsage)} MB
            </span>
          </div>

          {/* Alerts */}
          {data?.alerts && data.alerts.length > 0 && (
            <div className="space-y-2">
              <Separator className="bg-white/10" />
              <div className="text-sm text-white/80">التنبيهات الحديثة:</div>
              {data.alerts.slice(0, 3).map((alert, index) => {
                const Icon =
                  alert.type === "error"
                    ? AlertTriangle
                    : alert.type === "warning"
                      ? AlertTriangle
                      : Info;
                const colorClass =
                  alert.type === "error"
                    ? "text-red-400"
                    : alert.type === "warning"
                      ? "text-yellow-400"
                      : "text-blue-400";

                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-2 text-xs"
                  >
                    <Icon className={`w-3 h-3 mt-0.5 ${colorClass}`} />
                    <span className="text-white/70">{alert.message}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Stats Card
const QuickStatsCard: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { data } = useSystemMonitor();

  const stats = [
    {
      label: "معدل المعالج",
      value: data ? `${Math.round(data.system.cpu.usage)}%` : "—",
      color: "text-cyan-400",
    },
    {
      label: "الذاكرة",
      value: data ? `${Math.round(data.system.memory.percentage)}%` : "—",
      color: "text-yellow-400",
    },
    {
      label: "الشبكة",
      value: data ? `${Math.round(data.system.network.download)} MB/s` : "—",
      color: "text-green-400",
    },
    {
      label: "درجة الحرارة",
      value: data ? `${Math.round(data.system.cpu.temperature)}°C` : "—",
      color: "text-red-400",
    },
  ];

  return (
    <Card
      className={cn("bg-black/20 border-white/10 backdrop-blur-sm", className)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          إحصائيات سريعة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-xs text-white/60 mb-1">{stat.label}</div>
              <div className={`text-lg font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Page Component
export default function OfflineAIToolsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [modelsReady, setModelsReady] = useState(false);

  useEffect(() => {
    // Initialize page
    const initializePage = async () => {
      try {
        // Check AI engine status
        const status = offlineAI.getStatus();
        setModelsReady(status.initialized && status.modelsLoaded > 0);

        // Simulate loading time for dramatic effect
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setIsLoading(false);
        toast.success("✅ أدوات الذكاء الاصطناعي المحلية جاهزة!");
      } catch (error) {
        console.error("خطأ في تهيئة الصفحة:", error);
        setIsLoading(false);
        toast.error("❌ حدث خطأ في تحميل الأدوات");
      }
    };

    initializePage();
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <KnouxOfflineAILogo size={120} />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              تحميل أدوات الذكاء الاصطناعي
            </h1>
            <p className="text-white/60">
              جاري تهيئة النماذج المحلية وإعداد البيئة...
            </p>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-8 h-8 text-cyan-400 mx-auto" />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border-b border-white/10 backdrop-blur-sm bg-black/10"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              العودة
            </Button>

            <div className="flex items-center gap-4">
              <KnouxOfflineAILogo size={48} />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Knoux AI Tools Suite
                </h1>
                <p className="text-white/60 text-sm">
                  مجموعة أدوات الذكاء الاصطناعي المحلية • لا يتطلب إنترنت
                </p>
              </div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className={
                modelsReady
                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                  : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
              }
            >
              <div className="w-2 h-2 bg-current rounded-full mr-2" />
              {modelsReady ? "جاهز للاستخدام" : "قيد التحميل"}
            </Badge>

            <Badge
              variant="outline"
              className="bg-blue-500/20 text-blue-300 border-blue-500/30"
            >
              <WifiOff className="w-3 h-3 mr-2" />
              وضع عدم الاتصال
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Status Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {/* Live Preview */}
            <div className="xl:col-span-2">
              <LivePreviewPanel
                sectionType="smart-advisor"
                className="h-full"
              />
            </div>

            {/* System Health */}
            <div className="space-y-6">
              <SystemHealthCard />
              <QuickStatsCard />
            </div>
          </div>

          {/* Main AI Tools Suite */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <OfflineAIToolsSuite />
          </motion.div>

          {/* Information Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Features Card */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  المميزات المتاحة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {[
                    "💬 محادثة ذكية مع GPT4All",
                    "🖼️ تحليل الصور بـ CLIP",
                    "🎵 تحويل الصوت إلى نص",
                    "📊 مراقبة النظام المباشرة",
                    "🔒 خصوصية كاملة (محلي)",
                    "⚡ أداء سريع ومحسن",
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-white/80"
                    >
                      <div className="w-1 h-1 bg-cyan-400 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Privacy Card */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <WifiOff className="w-5 h-5 text-green-400" />
                  الخصوصية والأمان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {[
                    "🔐 جميع البيانات محلية",
                    "🚫 لا توجد مشاركة مع خوادم خارجية",
                    "💾 معالجة كاملة على جهازك",
                    "🔒 تشفير البيانات الحساسة",
                    "👥 لا يتم جمع بيانات شخصية",
                    "⭐ مفتوح المصدر وقابل للتدقيق",
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-white/80"
                    >
                      <div className="w-1 h-1 bg-green-400 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Card */}
            <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  الأداء والتحسين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {[
                    "⚡ معالجة سريعة مع WebWorkers",
                    "🧠 نماذج محسنة للأجهزة المحلية",
                    "💾 إدارة ذكية للذاكرة",
                    "🔄 تحديثات مباشرة بدون تأخير",
                    "📈 مراقبة الأداء المستمرة",
                    "🎯 تحسين تلقائي للمعالجة",
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-white/80"
                    >
                      <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 text-center text-white/40 text-sm border-t border-white/10 pt-8"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Brain className="w-4 h-4" />
              <span>مدعوم بأحدث تقنيات الذكاء الاصطناعي المحلية</span>
            </div>
            <p>
              © 2024 Knoux SmartOrganizer PRO - جميع أدوات الذكاء الاصطناعي
              تعمل محلياً على جهازك
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
