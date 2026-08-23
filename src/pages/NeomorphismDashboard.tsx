import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Image,
  Music,
  FileSearch,
  Settings,
  Activity,
  Users,
  TrendingUp,
  Download,
  Play,
  Pause,
  Volume2,
  Heart,
  Star,
  Clock,
  Calendar,
  Bell,
  Search,
  Menu,
  X,
  Home,
  Library,
  Headphones,
  Camera,
  Folder,
  Cpu,
  BarChart3,
} from "lucide-react";

import {
  NeoCard,
  NeoButton,
  NeoInput,
  NeoIconButton,
  NeoContainer,
  NeoGrid,
  NeoFeatureCard,
  NeoStatsCard,
  NeoProgress,
  NeoToggle,
} from "@/components/ui/neomorphism";
import { NeoMusicPlayer } from "@/components/NeoMusicPlayer";
import { cn } from "@/lib/utils";

// Import the neomorphism styles
import "../styles/neomorphism.css";

// Mock data
const statsData = [
  {
    icon: Activity,
    label: "الملفات ��لمعالجة",
    value: "1,234",
    change: { value: 12, positive: true },
  },
  {
    icon: Users,
    label: "المستخدمين النشطين",
    value: "856",
    change: { value: 8, positive: true },
  },
  {
    icon: TrendingUp,
    label: "معدل النجاح",
    value: "98.5%",
    change: { value: 2.3, positive: true },
  },
  {
    icon: Download,
    label: "المساحة المحررة",
    value: "2.4 GB",
    change: { value: 15, positive: true },
  },
];

const aiTools = [
  {
    icon: Brain,
    title: "الذكاء الاصطناعي",
    description: "محادثة ذكية وتحليل النصوص بنماذج محلية متقدمة",
    gradient: true,
  },
  {
    icon: Camera,
    title: "تحليل الصور",
    description: "كشف الوجوه والكائنات وتصنيف الصور تلقائياً",
    gradient: false,
  },
  {
    icon: Headphones,
    title: "معالجة الصوت",
    description: "تحويل الصوت إلى نص وتحليل المحتوى الصوتي",
    gradient: false,
  },
  {
    icon: Folder,
    title: "تنظيم الملفات",
    description: "ترتيب وتصنيف الملفات بذكاء اصطناعي متطور",
    gradient: false,
  },
];

const recentActivities = [
  {
    id: 1,
    type: "image",
    title: "تم تحليل 15 صورة جديدة",
    time: "منذ 5 دقائق",
    status: "success",
  },
  {
    id: 2,
    type: "audio",
    title: "تحويل ملف صوتي إلى نص",
    time: "منذ 12 دقيقة",
    status: "processing",
  },
  {
    id: 3,
    type: "organize",
    title: "تنظيم مجلد المستندات",
    time: "منذ 30 دقيقة",
    status: "success",
  },
  {
    id: 4,
    type: "duplicate",
    title: "حذف 8 ملفات مكررة",
    time: "منذ ساعة",
    status: "success",
  },
];

export default function NeomorphismDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const sidebarItems = [
    { icon: Home, label: "الرئيسية", active: true },
    { icon: Brain, label: "الذكاء الاصطناعي", active: false },
    { icon: Camera, label: "الصور", active: false },
    { icon: Music, label: "الموسيقى", active: false },
    { icon: Library, label: "المكتبة", active: false },
    { icon: BarChart3, label: "التحليلات", active: false },
    { icon: Settings, label: "الإعدادات", active: false },
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed top-0 left-0 h-full w-72 neo-card bg-white/80 backdrop-blur-md z-50 p-6 lg:relative lg:translate-x-0"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="neo-icon-button w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="neo-title text-lg font-bold">Knoux</h1>
                    <p className="neo-text-muted text-xs">Smart Organizer</p>
                  </div>
                </div>
                <NeoIconButton
                  icon={X}
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden"
                />
              </div>

              <nav className="space-y-2">
                {sidebarItems.map((item) => (
                  <motion.button
                    key={item.label}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-right transition-all duration-200",
                      item.active
                        ? "neo-card-inset bg-gradient-to-l from-indigo-500/10 to-purple-500/10 text-indigo-600"
                        : "hover:bg-white/50 neo-text",
                    )}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </nav>

              {/* Mini Music Player in Sidebar */}
              <motion.div
                className="mt-8 p-4 neo-card bg-gradient-to-br from-purple-500/10 to-pink-500/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 neo-card rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="neo-title text-sm font-semibold truncate">
                      موسيقى تركيز
                    </p>
                    <p className="neo-text-muted text-xs">Knoux تشيل</p>
                  </div>
                </div>
                <NeoProgress value={65} className="mb-2" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <NeoIconButton icon={Play} size="sm" variant="primary" />
                    <NeoIconButton icon={Heart} size="sm" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3 neo-text-muted" />
                    <div className="w-12">
                      <NeoProgress value={75} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72">
        {/* Header */}
        <motion.header
          className="neo-card m-6 p-6 bg-white/60 backdrop-blur-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <NeoIconButton
                icon={Menu}
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              />
              <div>
                <motion.h2
                  className="neo-title text-2xl font-bold"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  مرحباً، أهلاً وسهلاً! 👋
                </motion.h2>
                <motion.div
                  className="flex items-center gap-4 mt-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="neo-text-muted text-sm">
                    {formatDate(currentTime)}
                  </p>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="neo-text-muted text-sm">
                      {formatTime(currentTime)}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <motion.div
                className="hidden md:block w-80"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 neo-text-muted" />
                  <NeoInput
                    placeholder="ابحث في ملفاتك..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12"
                  />
                </div>
              </motion.div>

              {/* Dark Mode Toggle */}
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="neo-text-muted text-sm">مظلم</span>
                <NeoToggle
                  checked={darkMode}
                  onChange={setDarkMode}
                  className="scale-75"
                />
              </motion.div>

              {/* Notifications */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <NeoIconButton icon={Bell} />
                {notifications > 0 && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <span className="text-white text-xs font-bold">
                      {notifications}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.header>

        <NeoContainer>
          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <NeoGrid cols={4} gap="md">
              {statsData.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <NeoStatsCard {...stat} />
                </motion.div>
              ))}
            </NeoGrid>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            {/* AI Tools */}
            <motion.div
              className="xl:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <NeoCard padding="lg">
                <h3 className="neo-title text-xl font-bold mb-6 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-indigo-600" />
                  أدوات الذكاء الاصطناعي
                </h3>
                <NeoGrid cols={2} gap="md">
                  {aiTools.map((tool, index) => (
                    <motion.div
                      key={tool.title}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <NeoFeatureCard {...tool} />
                    </motion.div>
                  ))}
                </NeoGrid>
              </NeoCard>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <NeoCard padding="lg">
                <h3 className="neo-title text-xl font-bold mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-green-600" />
                  النشاط الأخير
                </h3>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50/50 cursor-pointer group"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ x: 4 }}
                    >
                      <div
                        className={cn(
                          "neo-icon-button w-10 h-10",
                          activity.status === "success" &&
                            "bg-green-50 text-green-600",
                          activity.status === "processing" &&
                            "bg-blue-50 text-blue-600",
                        )}
                      >
                        {activity.type === "image" && (
                          <Camera className="w-4 h-4" />
                        )}
                        {activity.type === "audio" && (
                          <Headphones className="w-4 h-4" />
                        )}
                        {activity.type === "organize" && (
                          <Folder className="w-4 h-4" />
                        )}
                        {activity.type === "duplicate" && (
                          <FileSearch className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="neo-text text-sm font-medium group-hover:text-indigo-600 transition-colors">
                          {activity.title}
                        </p>
                        <p className="neo-text-muted text-xs">
                          {activity.time}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          activity.status === "success" && "bg-green-400",
                          activity.status === "processing" && "bg-blue-400",
                        )}
                      />
                    </motion.div>
                  ))}
                </div>
              </NeoCard>
            </motion.div>
          </div>

          {/* Music Player Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-8"
          >
            <NeoMusicPlayer />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <NeoCard padding="lg">
              <h3 className="neo-title text-xl font-bold mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                إجراءات سريعة
              </h3>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Camera, label: "تحليل الصور", color: "purple" },
                  { icon: Music, label: "تشغيل الموسيقى", color: "pink" },
                  { icon: FileSearch, label: "البحث الذكي", color: "blue" },
                  { icon: Brain, label: "محادثة AI", color: "indigo" },
                  { icon: Folder, label: "تنظيم الملفات", color: "green" },
                  { icon: Settings, label: "الإعدادات", color: "gray" },
                ].map((action, index) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + index * 0.05 }}
                  >
                    <NeoButton className="flex items-center gap-2">
                      <action.icon className="w-4 h-4" />
                      <span className="text-sm">{action.label}</span>
                    </NeoButton>
                  </motion.div>
                ))}
              </div>
            </NeoCard>
          </motion.div>
        </NeoContainer>
      </div>
    </div>
  );
}
