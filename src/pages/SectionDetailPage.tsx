import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  Settings,
  Download,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  User,
  Activity,
  Zap,
  Shield,
  Cpu,
  HardDrive,
  Eye,
} from "lucide-react";
import { GlassLayout } from "@/components/GlassLayout";
import sectionsData from "@/data/sections.json";
import { cn } from "@/lib/utils";

// Types
interface Tool {
  id: string;
  name: string;
  script: string;
  icon: string;
  aiModel?: string;
  type?: string;
}

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

interface ToolExecution {
  toolId: string;
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  startTime?: Date;
  endTime?: Date;
  logs: string[];
  results?: any;
}

// Live Preview Component
const LivePreviewBox: React.FC<{
  executions: ToolExecution[];
  className?: string;
}> = ({ executions, className }) => {
  const [metrics, setMetrics] = useState({
    filesProcessed: 0,
    duplicatesFound: 0,
    spaceSaved: 0,
    timeElapsed: 0,
    activeOperations: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const activeTools = executions.filter((e) => e.status === "running");

      setMetrics((prev) => ({
        filesProcessed:
          prev.filesProcessed + Math.floor(Math.random() * 10) + 1,
        duplicatesFound:
          prev.duplicatesFound +
          (Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0),
        spaceSaved: prev.spaceSaved + Math.random() * 2,
        timeElapsed: prev.timeElapsed + 1,
        activeOperations: activeTools.length,
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, [executions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      className={cn("glass-card p-6", className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
          <Eye className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="glass-title text-lg font-bold">Live Preview</h3>
          <p className="glass-text-muted text-sm">معاينة مباشرة للنتائج</p>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          {
            label: "ملفات معالجة",
            value: metrics.filesProcessed.toLocaleString(),
            icon: FileText,
            color: "text-blue-400",
          },
          {
            label: "عمليات مكتشفة",
            value: metrics.duplicatesFound,
            icon: CheckCircle,
            color: "text-green-400",
          },
          {
            label: "مساحة محررة",
            value: `${metrics.spaceSaved.toFixed(1)} MB`,
            icon: HardDrive,
            color: "text-purple-400",
          },
          {
            label: "وقت المعالجة",
            value: formatTime(metrics.timeElapsed),
            icon: Clock,
            color: "text-orange-400",
          },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              className="glass-card p-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Icon className={cn("w-5 h-5 mx-auto mb-2", metric.color)} />
              <div className="glass-title text-lg font-bold">
                {metric.value}
              </div>
              <div className="glass-text-muted text-xs">{metric.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Active Operations */}
      <div className="space-y-3">
        <h4 className="glass-title text-sm font-bold">العمليات النشطة</h4>
        <AnimatePresence>
          {executions
            .filter((e) => e.status === "running")
            .slice(0, 3)
            .map((execution) => (
              <motion.div
                key={execution.toolId}
                className="glass-card p-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="glass-text text-sm font-medium">
                    {execution.toolId}
                  </span>
                  <span className="glass-text-muted text-xs">
                    {execution.progress}%
                  </span>
                </div>
                <div className="h-1 glass-card rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${execution.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            ))}
        </AnimatePresence>

        {metrics.activeOperations === 0 && (
          <div className="text-center py-4">
            <span className="glass-text-muted text-sm">
              لا توجد عمليات نشطة
            </span>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              className={cn(
                "w-2 h-2 rounded-full",
                metrics.activeOperations > 0 ? "bg-green-400" : "bg-gray-400",
              )}
              animate={
                metrics.activeOperations > 0
                  ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
                  : {}
              }
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="glass-text-muted text-xs">
              {metrics.activeOperations > 0 ? "يعمل" : "في الانتظار"}
            </span>
          </div>
          <span className="glass-text-muted text-xs">
            آخر تحديث: {new Date().toLocaleTimeString("ar-SA")}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Tool Card Component
const ToolCard: React.FC<{
  tool: Tool;
  execution: ToolExecution;
  onExecute: (toolId: string) => void;
  onStop: (toolId: string) => void;
  delay: number;
}> = ({ tool, execution, onExecute, onStop, delay }) => {
  const getStatusIcon = () => {
    switch (execution.status) {
      case "running":
        return <Play className="w-4 h-4 text-green-400" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Settings className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (execution.status) {
      case "running":
        return "border-green-500/30 bg-green-500/10";
      case "completed":
        return "border-green-500/30 bg-green-500/10";
      case "error":
        return "border-red-500/30 bg-red-500/10";
      default:
        return "border-gray-500/30";
    }
  };

  return (
    <motion.div
      className={cn(
        "glass-card p-4 relative overflow-hidden",
        getStatusColor(),
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ y: -2, scale: 1.02 }}
    >
      {/* Status Indicator */}
      <div className="absolute top-3 right-3">{getStatusIcon()}</div>

      {/* AI Model Badge */}
      {tool.aiModel && (
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">
            <Zap className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-300 font-medium">
              {tool.aiModel}
            </span>
          </div>
        </div>
      )}

      {/* Tool Content */}
      <div className="mt-8 mb-4">
        <h4 className="glass-title text-sm font-bold mb-2">{tool.name}</h4>
        <p className="glass-text-muted text-xs mb-3">{tool.script}</p>

        {/* Progress Bar for Running Tools */}
        {execution.status === "running" && (
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="glass-text-muted text-xs">التقدم</span>
              <span className="glass-text-muted text-xs">
                {execution.progress}%
              </span>
            </div>
            <div className="h-1 glass-card rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                initial={{ width: 0 }}
                animate={{ width: `${execution.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {execution.status === "running" ? (
          <motion.button
            className="flex-1 glass-button-primary bg-red-500/20 border-red-500/30 text-red-300"
            onClick={() => onStop(tool.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Square className="w-3 h-3 mr-2" />
            إيقاف
          </motion.button>
        ) : (
          <motion.button
            className="flex-1 glass-button-primary"
            onClick={() => onExecute(tool.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-3 h-3 mr-2" />
            تشغيل
          </motion.button>
        )}
      </div>

      {/* Execution Time */}
      {execution.startTime && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <span className="glass-text-muted text-xs">
            {execution.status === "running" && "يعمل منذ: "}
            {execution.status === "completed" && "اكتمل في: "}
            {execution.startTime.toLocaleTimeString("ar-SA")}
          </span>
        </div>
      )}
    </motion.div>
  );
};

// Section Detail Page Component
export default function SectionDetailPage({
  sectionId,
}: {
  sectionId: string;
}) {
  const section = sectionsData.sections.find(
    (s: Section) => s.id === sectionId,
  ) as Section;
  const [executions, setExecutions] = useState<Map<string, ToolExecution>>(
    new Map(),
  );
  const executionRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!section) return;

    // Initialize execution states
    const initialExecutions = new Map<string, ToolExecution>();
    section.tools.forEach((tool) => {
      initialExecutions.set(tool.id, {
        toolId: tool.id,
        status: "idle",
        progress: 0,
        logs: [],
      });
    });
    setExecutions(initialExecutions);

    // Cleanup on unmount
    return () => {
      executionRef.current.forEach((timeout) => clearTimeout(timeout));
      executionRef.current.clear();
    };
  }, [section]);

  const executeToolSimulation = (toolId: string) => {
    setExecutions((prev) => {
      const newExecutions = new Map(prev);
      const execution = newExecutions.get(toolId);
      if (execution) {
        execution.status = "running";
        execution.progress = 0;
        execution.startTime = new Date();
        execution.logs = [`بدء تشغيل الأداة ${toolId}...`];
        newExecutions.set(toolId, execution);
      }
      return newExecutions;
    });

    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15 + 5;

      setExecutions((prev) => {
        const newExecutions = new Map(prev);
        const execution = newExecutions.get(toolId);
        if (execution && execution.status === "running") {
          execution.progress = Math.min(progress, 100);
          execution.logs.push(`معالجة... ${Math.round(execution.progress)}%`);

          if (execution.progress >= 100) {
            execution.status = "completed";
            execution.endTime = new Date();
            execution.logs.push("اكتملت العملية بنجاح!");
            clearInterval(progressInterval);
            executionRef.current.delete(toolId);
          }

          newExecutions.set(toolId, execution);
        }
        return newExecutions;
      });
    }, 800);

    executionRef.current.set(toolId, progressInterval);
  };

  const stopTool = (toolId: string) => {
    const timeout = executionRef.current.get(toolId);
    if (timeout) {
      clearTimeout(timeout);
      executionRef.current.delete(toolId);
    }

    setExecutions((prev) => {
      const newExecutions = new Map(prev);
      const execution = newExecutions.get(toolId);
      if (execution) {
        execution.status = "idle";
        execution.progress = 0;
        execution.logs.push("تم إيقاف العملية.");
        newExecutions.set(toolId, execution);
      }
      return newExecutions;
    });
  };

  if (!section) {
    return (
      <GlassLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="glass-title text-2xl font-bold mb-2">
              القسم غير موجود
            </h1>
            <p className="glass-text-muted mb-4">
              لم يتم العثور على القسم المطلوب
            </p>
            <button
              onClick={() => window.history.back()}
              className="glass-button-primary"
            >
              العودة
            </button>
          </div>
        </div>
      </GlassLayout>
    );
  }

  return (
    <GlassLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => window.history.back()}
              className="glass-button flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة
            </button>

            {/* Knoux Sparkle */}
            <div className="flex items-center gap-2 text-yellow-400">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">Knoux</span>
            </div>
          </div>

          <div className="text-center">
            <div
              className={cn(
                "inline-flex p-4 rounded-2xl mb-4 bg-gradient-to-br",
                section.gradient,
              )}
            >
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="glass-title text-3xl font-bold mb-2">
              {section.nameAr}
            </h1>
            <p className="glass-subtitle text-lg mb-2">{section.name}</p>
            <p className="glass-text mb-4">{section.description}</p>
            <div className="glass-card inline-flex px-4 py-2 rounded-full">
              <span className="glass-text font-bold">
                {section.toolCount} أداة متخصصة
              </span>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Tools Grid */}
          <div className="xl:col-span-3">
            <motion.h2
              className="glass-title text-2xl font-bold mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              أدوات القسم
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.tools.map((tool, index) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  execution={
                    executions.get(tool.id) || {
                      toolId: tool.id,
                      status: "idle",
                      progress: 0,
                      logs: [],
                    }
                  }
                  onExecute={executeToolSimulation}
                  onStop={stopTool}
                  delay={0.4 + index * 0.05}
                />
              ))}
            </div>
          </div>

          {/* Live Preview Sidebar */}
          <div className="space-y-6">
            <LivePreviewBox executions={Array.from(executions.values())} />

            {/* Logs Panel */}
            <motion.div
              className="glass-card p-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="glass-title text-lg font-bold mb-4">
                سجل العمليات
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Array.from(executions.values())
                  .flatMap((execution) =>
                    execution.logs.map((log, index) => ({
                      log,
                      toolId: execution.toolId,
                      timestamp: new Date(),
                      key: `${execution.toolId}-${index}`,
                    })),
                  )
                  .slice(-10)
                  .map((entry) => (
                    <motion.div
                      key={entry.key}
                      className="glass-card p-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex items-start gap-2">
                        <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="glass-text text-xs">
                            {entry.log}
                          </span>
                          <div className="glass-text-muted text-xs">
                            {entry.timestamp.toLocaleTimeString("ar-SA")}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                {Array.from(executions.values()).every(
                  (e) => e.logs.length === 0,
                ) && (
                  <div className="text-center py-4">
                    <span className="glass-text-muted text-sm">
                      لا توجد عمليات بعد
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          className="text-center py-6 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="w-4 h-4 glass-text-muted" />
            <span className="glass-text-muted text-sm">
              Prof. Sadek Elgazar
            </span>
          </div>
          <p className="glass-text-muted text-xs">
            جميع الأدوات تدعم التشغيل المحلي والذكاء الاصطناعي المدمج
          </p>
        </motion.div>
      </div>
    </GlassLayout>
  );
}
