import React, { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Brain,
  Image,
  Music,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GlassLayoutProps {
  children: ReactNode;
  currentPage?: string;
  onNavigate?: (path: string) => void;
}

// Premium Glass Logo Component
const GlassLogo: React.FC<{ size?: "sm" | "md" | "lg" }> = ({
  size = "md",
}) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <motion.div
      className={cn(
        "relative glass-card flex items-center justify-center border-white/30",
        sizes[size],
      )}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-blue-400/20 to-cyan-400/20 rounded-lg filter blur-md" />

      {/* Logo icon */}
      <svg
        className="relative z-10 text-white w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>

      {/* Rotating ring */}
      <motion.div
        className="absolute inset-0 border border-white/20 rounded-lg"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
};

// Navigation items
const navigationItems = [
  {
    id: "home",
    label: "الرئيسية",
    icon: Home,
    path: "/",
    color: "from-blue-400 to-cyan-400",
  },
  {
    id: "ai",
    label: "الذكاء الاصطناعي",
    icon: Brain,
    path: "/offline-ai-tools",
    color: "from-purple-400 to-pink-400",
  },
  {
    id: "images",
    label: "الصور",
    icon: Image,
    path: "/ai-analysis",
    color: "from-green-400 to-emerald-400",
  },
  {
    id: "music",
    label: "الموسيقى",
    icon: Music,
    path: "/neomorphism-dashboard",
    color: "from-orange-400 to-red-400",
  },
  {
    id: "settings",
    label: "الإعدادات",
    icon: Settings,
    path: "/settings",
    color: "from-gray-400 to-slate-400",
  },
];

export const GlassLayout: React.FC<GlassLayoutProps> = ({
  children,
  currentPage = "home",
  onNavigate,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen glass-background">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass-sidebar z-50"
            >
              {/* Sidebar Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GlassLogo size="md" />
                    <div>
                      <h1 className="glass-title text-lg font-bold">Knoux</h1>
                      <p className="glass-text-muted text-xs">SmartOrganizer</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="glass-button p-2 lg:hidden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-6 space-y-3">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-xl text-right transition-all duration-300 group",
                        isActive
                          ? "glass-card-luxury border-white/30"
                          : "glass-card hover:glass-card-luxury",
                      )}
                      whileHover={{ x: 4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg bg-gradient-to-br",
                          item.color,
                        )}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="glass-text font-medium flex-1">
                        {item.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </nav>

              {/* Sidebar Footer */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="glass-card p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="glass-text-muted text-sm">
                      إصدار متطور
                    </span>
                  </div>
                  <p className="glass-text-muted text-xs">
                    مدعوم بالذكاء الاصطناعي
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className={cn("glass-main", sidebarOpen && "lg:ml-280")}>
        {/* Header */}
        <motion.header
          className="glass-nav mb-6 p-4 mx-6 mt-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="glass-button p-3 lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden lg:flex items-center gap-3">
                <GlassLogo size="sm" />
                <div>
                  <h2 className="glass-title text-xl font-bold">
                    Knoux SmartOrganizer
                  </h2>
                  <p className="glass-text-muted text-sm">
                    المنظم الذكي للملفات
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
                <input
                  type="text"
                  placeholder="ابحث في ملفاتك..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input pl-10 w-80"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button className="glass-button p-3">
                  <Bell className="w-5 h-5" />
                </button>
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                >
                  <span className="text-white text-xs font-bold">3</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <motion.main
          className="px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {children}
        </motion.main>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-30">
        <div className="glass-nav p-4">
          <div className="flex items-center justify-around">
            {navigationItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "p-3 rounded-xl transition-all duration-300",
                    isActive ? "glass-card-luxury" : "glass-card",
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6",
                      isActive ? "text-white" : "text-white/70",
                    )}
                  />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default GlassLayout;
