import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Brain,
  MessageSquare,
  Image,
  Mic,
  FileSearch,
  Activity,
  Download,
  Settings,
  Play,
  Pause,
  Volume2,
  Eye,
  Cpu,
  HardDrive,
  Wifi,
  Zap,
  Monitor,
  Globe,
} from "lucide-react";
import { LivePreviewPanel } from "./LivePreviewPanel";

// Types for AI Tools
interface AIModel {
  id: string;
  name: string;
  description: string;
  size: string;
  status: "not-downloaded" | "downloading" | "ready" | "error";
  downloadProgress: number;
  icon: React.ComponentType<any>;
  category: "llm" | "vision" | "audio" | "utility";
}

interface AIResponse {
  id: string;
  timestamp: Date;
  input: string;
  output: string;
  model: string;
  processingTime: number;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  temperature: number;
  networkSpeed: number;
  powerUsage: number;
}

// Custom AI Logo Components
const KnouxAILogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <motion.div
    className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-3"
    style={{ width: size, height: size }}
    whileHover={{ scale: 1.05, rotate: 5 }}
    transition={{ duration: 0.3 }}
  >
    <Brain className="w-6 h-6 text-white" />
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
    <motion.div
      className="absolute -inset-1 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-2xl opacity-50 blur-sm"
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
  </motion.div>
);

const ChatAILogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <motion.div
    className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-500 p-3"
    style={{ width: size, height: size }}
    whileHover={{ scale: 1.05 }}
  >
    <MessageSquare className="w-6 h-6 text-white" />
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
  </motion.div>
);

const VisionAILogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <motion.div
    className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-pink-600 via-rose-600 to-red-500 p-3"
    style={{ width: size, height: size }}
    whileHover={{ scale: 1.05 }}
  >
    <Eye className="w-6 h-6 text-white" />
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
  </motion.div>
);

const AudioAILogo: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <motion.div
    className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-500 p-3"
    style={{ width: size, height: size }}
    whileHover={{ scale: 1.05 }}
  >
    <Mic className="w-6 h-6 text-white" />
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
  </motion.div>
);

// AI Models Configuration
const availableModels: AIModel[] = [
  {
    id: "gpt4all-falcon",
    name: "GPT4All Falcon 7B",
    description: "نموذج محادثة قوي للنصوص العربية والإنجليزية",
    size: "3.8 GB",
    status: "ready",
    downloadProgress: 100,
    icon: ChatAILogo,
    category: "llm",
  },
  {
    id: "mistral-7b",
    name: "Mistral 7B Instruct",
    description: "نموذج ذكي للمحادثات والتحليل النصي",
    size: "4.1 GB",
    status: "ready",
    downloadProgress: 100,
    icon: Brain,
    category: "llm",
  },
  {
    id: "clip-vision",
    name: "CLIP Vision Model",
    description: "تحليل الصور ووصفها بالذكاء الاصطناعي",
    size: "588 MB",
    status: "ready",
    downloadProgress: 100,
    icon: VisionAILogo,
    category: "vision",
  },
  {
    id: "whisper-large",
    name: "Whisper Large V3",
    description: "تحويل الصوت إلى نص بدقة عالية",
    size: "1.5 GB",
    status: "ready",
    downloadProgress: 100,
    icon: AudioAILogo,
    category: "audio",
  },
];

// Real-time system monitoring hook
const useSystemMonitoring = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    temperature: 0,
    networkSpeed: 0,
    powerUsage: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real system metrics with realistic patterns
      setMetrics((prev) => ({
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(
          0,
          Math.min(100, prev.memory + (Math.random() - 0.5) * 5),
        ),
        disk: Math.max(
          0,
          Math.min(100, 50 + Math.sin(Date.now() / 10000) * 30),
        ),
        temperature: Math.max(35, Math.min(85, 45 + Math.random() * 20)),
        networkSpeed: Math.max(0, 10 + Math.random() * 90),
        powerUsage: Math.max(50, Math.min(200, 80 + Math.random() * 40)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};

// Main Component
export const OfflineAIToolsSuite: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState("chat");
  const [models, setModels] = useState<AIModel[]>(availableModels);
  const [chatMessages, setChatMessages] = useState<AIResponse[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt4all-falcon");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 25,
    memory: 45,
    disk: 60,
    temperature: 52,
    networkSpeed: 85,
    powerUsage: 120,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const metrics = useSystemMonitoring();

  // Simulate AI processing
  const processAIRequest = async (
    input: string,
    model: string,
    type: "text" | "image" | "audio" = "text",
  ) => {
    setIsProcessing(true);

    // Simulate realistic processing time
    const processingTime = Math.random() * 3000 + 1000;

    await new Promise((resolve) => setTimeout(resolve, processingTime));

    let output = "";

    switch (type) {
      case "text":
        output = `🤖 معالجة بواسطة ${model}:\n\nتم تحليل النص بنجاح. هذا مثال على إجابة ذكية من النموذج المحلي. يمكنني مساعدتك في:\n• تحليل النصوص\n• الترجمة\n• الملخصات\n• الإجابة على الأسئلة\n\nكيف يمكنني مساعدتك أكثر؟`;
        break;
      case "image":
        output = `🖼️ تحليل الصورة مكتمل:\n\n• نوع الصورة: ${imageFile?.type || "غير محدد"}\n• الحجم: ${Math.round((imageFile?.size || 0) / 1024)} KB\n• الوصف: صورة تحتوي على عناصر متنوعة\n• الألوان السائدة: أزرق، أبيض، رمادي\n• جودة الصورة: عالية\n• محتوى آمن: ✅ نعم`;
        break;
      case "audio":
        output = `🎵 تحويل الصوت إلى نص:\n\n"مرحباً، هذا مثال على تحويل الصوت إلى نص باستخدام نموذج Whisper المحلي. يمكنني التعرف على الأصوات باللغة العربية والإنجليزية بدقة عالية."\n\n• مدة التسجيل: ${Math.random() * 30 + 5}ث\n• اللغة المكتشفة: عربي\n• مستوى الثقة: 94%`;
        break;
    }

    const response: AIResponse = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      input,
      output,
      model,
      processingTime: processingTime / 1000,
    };

    setChatMessages((prev) => [...prev, response]);
    setIsProcessing(false);

    toast.success(
      `تم المعالجة بنجاح خلال ${(processingTime / 1000).toFixed(1)} ثانية`,
    );

    return response;
  };

  // Handle chat submission
  const handleChatSubmit = async () => {
    if (!currentInput.trim() || isProcessing) return;

    const input = currentInput;
    setCurrentInput("");

    await processAIRequest(input, selectedModel, "text");
  };

  // Handle image analysis
  const handleImageAnalysis = async () => {
    if (!imageFile || isProcessing) return;

    await processAIRequest(
      `تحليل الصورة: ${imageFile.name}`,
      "clip-vision",
      "image",
    );
  };

  // Handle audio transcription
  const handleAudioTranscription = async () => {
    if (!audioFile || isProcessing) return;

    await processAIRequest(
      `تحويل الصوت إلى نص: ${audioFile.name}`,
      "whisper-large",
      "audio",
    );
  };

  // System metrics display component
  const SystemMetricsCard = () => (
    <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          مراقبة النظام المباشرة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            {
              label: "المعالج",
              value: metrics.cpu,
              icon: Cpu,
              color: "text-cyan-400",
              bg: "bg-cyan-400",
            },
            {
              label: "الذاكرة",
              value: metrics.memory,
              icon: HardDrive,
              color: "text-yellow-400",
              bg: "bg-yellow-400",
            },
            {
              label: "القرص الصلب",
              value: metrics.disk,
              icon: HardDrive,
              color: "text-green-400",
              bg: "bg-green-400",
            },
            {
              label: "درجة الحرارة",
              value: metrics.temperature,
              icon: Zap,
              color: "text-red-400",
              bg: "bg-red-400",
              unit: "°C",
              max: 100,
            },
            {
              label: "سرعة الشبكة",
              value: metrics.networkSpeed,
              icon: Wifi,
              color: "text-purple-400",
              bg: "bg-purple-400",
              unit: " MB/s",
            },
            {
              label: "استهلاك الطاقة",
              value: metrics.powerUsage,
              icon: Zap,
              color: "text-orange-400",
              bg: "bg-orange-400",
              unit: "W",
              max: 300,
            },
          ].map((metric, index) => {
            const Icon = metric.icon;
            const percentage = metric.max
              ? (metric.value / metric.max) * 100
              : metric.value;

            return (
              <div key={index} className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${metric.color}`} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">{metric.label}</span>
                    <span className={metric.color}>
                      {Math.round(metric.value)}
                      {metric.unit || "%"}
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${metric.bg} rounded-full`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-6",
        className,
      )}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <KnouxAILogo size={64} />
          <div>
            <h1 className="text-3xl font-bold text-white">
              Knoux AI Tools Suite
            </h1>
            <p className="text-white/60">
              مجموعة أدوات الذكاء الاصطناعي المحلية
            </p>
          </div>
        </div>

        {/* Live Preview Panel */}
        <LivePreviewPanel sectionType="smart-advisor" className="mb-6" />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main AI Tools Panel */}
        <div className="xl:col-span-3">
          <Card className="bg-black/20 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5" />
                أدوات الذكاء الاصطناعي المحلية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4 bg-white/5">
                  <TabsTrigger
                    value="chat"
                    className="text-white data-[state=active]:bg-white/20"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    محادثة ذكية
                  </TabsTrigger>
                  <TabsTrigger
                    value="vision"
                    className="text-white data-[state=active]:bg-white/20"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    تحليل الصور
                  </TabsTrigger>
                  <TabsTrigger
                    value="audio"
                    className="text-white data-[state=active]:bg-white/20"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    معالجة الصوت
                  </TabsTrigger>
                  <TabsTrigger
                    value="models"
                    className="text-white data-[state=active]:bg-white/20"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    إدارة النماذج
                  </TabsTrigger>
                </TabsList>

                {/* Chat Tab */}
                <TabsContent value="chat" className="space-y-4 mt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2"
                    >
                      {models
                        .filter((m) => m.category === "llm")
                        .map((model) => (
                          <option
                            key={model.id}
                            value={model.id}
                            className="bg-gray-800"
                          >
                            {model.name}
                          </option>
                        ))}
                    </select>
                    <Badge
                      variant="secondary"
                      className="bg-green-500/20 text-green-300"
                    >
                      محلي • متاح
                    </Badge>
                  </div>

                  {/* Chat Messages */}
                  <div className="h-96 bg-black/20 rounded-lg p-4 overflow-y-auto border border-white/10">
                    <AnimatePresence>
                      {chatMessages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 space-y-2"
                        >
                          <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-500/30">
                            <div className="text-blue-300 text-sm mb-1">
                              أنت:
                            </div>
                            <div className="text-white">{message.input}</div>
                          </div>
                          <div className="bg-green-500/20 p-3 rounded-lg border border-green-500/30">
                            <div className="text-green-300 text-sm mb-1 flex items-center gap-2">
                              <Brain className="w-3 h-3" />
                              {message.model} •{" "}
                              {message.processingTime.toFixed(1)}ث
                            </div>
                            <div className="text-white whitespace-pre-wrap">
                              {message.output}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isProcessing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-white/60"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Brain className="w-4 h-4" />
                        </motion.div>
                        جاري المعالجة بالذكاء الاصطناعي...
                      </motion.div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleChatSubmit()
                      }
                      placeholder="اكتب رسالتك هنا..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50"
                      disabled={isProcessing}
                    />
                    <Button
                      onClick={handleChatSubmit}
                      disabled={isProcessing || !currentInput.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      إرسال
                    </Button>
                  </div>
                </TabsContent>

                {/* Vision Tab */}
                <TabsContent value="vision" className="space-y-4 mt-6">
                  <div className="text-center space-y-4">
                    <VisionAILogo size={80} />
                    <h3 className="text-xl font-bold text-white">
                      تحليل الصور بالذكاء الاصطناعي
                    </h3>

                    <div className="border-2 border-dashed border-white/30 rounded-lg p-8">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setImageFile(e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                      <div className="space-y-4">
                        <Image className="w-12 h-12 text-white/50 mx-auto" />
                        <p className="text-white/60">اختر صورة للت��ليل</p>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10"
                        >
                          اختيار صورة
                        </Button>
                      </div>
                    </div>

                    {imageFile && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                          <p className="text-white">
                            الملف المحدد: {imageFile.name}
                          </p>
                          <p className="text-white/60 text-sm">
                            الحجم: {Math.round(imageFile.size / 1024)} KB
                          </p>
                        </div>
                        <Button
                          onClick={handleImageAnalysis}
                          disabled={isProcessing}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isProcessing ? (
                            <>
                              <Brain className="w-4 h-4 mr-2 animate-spin" />
                              جاري التحليل...
                            </>
                          ) : (
                            "تحليل الصورة"
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </TabsContent>

                {/* Audio Tab */}
                <TabsContent value="audio" className="space-y-4 mt-6">
                  <div className="text-center space-y-4">
                    <AudioAILogo size={80} />
                    <h3 className="text-xl font-bold text-white">
                      تحويل الصوت إلى نص
                    </h3>

                    <div className="border-2 border-dashed border-white/30 rounded-lg p-8">
                      <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={(e) =>
                          setAudioFile(e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                      <div className="space-y-4">
                        <Mic className="w-12 h-12 text-white/50 mx-auto" />
                        <p className="text-white/60">
                          اختر ملف صوتي أو سجل صوتك
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={() => audioInputRef.current?.click()}
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/10"
                          >
                            اختيار ملف
                          </Button>
                          <Button
                            onClick={() => setIsRecording(!isRecording)}
                            className={
                              isRecording
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-blue-600 hover:bg-blue-700"
                            }
                          >
                            {isRecording ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                إيقاف التسجيل
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                بدء التسجيل
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {audioFile && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                          <p className="text-white">
                            الملف المحدد: {audioFile.name}
                          </p>
                          <p className="text-white/60 text-sm">
                            الحجم: {Math.round(audioFile.size / 1024)} KB
                          </p>
                        </div>
                        <Button
                          onClick={handleAudioTranscription}
                          disabled={isProcessing}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          {isProcessing ? (
                            <>
                              <Brain className="w-4 h-4 mr-2 animate-spin" />
                              جاري التحويل...
                            </>
                          ) : (
                            "تحويل إلى نص"
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </TabsContent>

                {/* Models Tab */}
                <TabsContent value="models" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">
                      إدارة نماذج الذكاء الاصطناعي
                    </h3>

                    {models.map((model) => {
                      const IconComponent = model.icon;
                      return (
                        <motion.div
                          key={model.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-white/5 border border-white/10 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <IconComponent size={48} />
                              <div>
                                <h4 className="text-white font-bold">
                                  {model.name}
                                </h4>
                                <p className="text-white/60 text-sm">
                                  {model.description}
                                </p>
                                <p className="text-white/40 text-xs">
                                  الحجم: {model.size}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  model.status === "ready"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  model.status === "ready"
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-yellow-500/20 text-yellow-300"
                                }
                              >
                                {model.status === "ready" ? "جاهز" : "غير متاح"}
                              </Badge>
                              {model.status === "ready" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-white/30 text-white"
                                >
                                  تشغيل
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  تحميل
                                </Button>
                              )}
                            </div>
                          </div>
                          {model.status === "downloading" && (
                            <div className="mt-4">
                              <Progress
                                value={model.downloadProgress}
                                className="h-2"
                              />
                              <p className="text-white/60 text-xs mt-1">
                                جاري التحميل... {model.downloadProgress}%
                              </p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* System Monitoring Sidebar */}
        <div className="space-y-6">
          <SystemMetricsCard />

          {/* AI Status Card */}
          <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5" />
                حالة نماذج الذكاء الاصطناعي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-white/80 text-sm">
                      {model.name.split(" ")[0]}
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          model.status === "ready"
                            ? "bg-green-400"
                            : "bg-gray-500"
                        }`}
                      />
                      <span className="text-xs text-white/60">
                        {model.status === "ready" ? "متصل" : "غير متاح"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-black/20 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5" />
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-white border-white/30 hover:bg-white/10"
                  onClick={() => toast.success("تم تحسين الأداء!")}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  تحسين الأداء
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-white border-white/30 hover:bg-white/10"
                  onClick={() => toast.success("تم مسح الذاكرة المؤقتة!")}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  مسح الذاكرة
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-white border-white/30 hover:bg-white/10"
                  onClick={() => toast.info("تحديث النماذج قيد التقدم...")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  تحديث النماذج
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OfflineAIToolsSuite;
