import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  RemoveDuplicatePreview,
  SystemCleanupPreview,
  BoostModePreview,
  SmartAdvisorPreview,
  SimpleOrganizerPreview,
  SmartOrganizerPreview,
  UltimateEditionPreview,
} from "@/components/LivePreviewPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Monitor,
  Sparkles,
  RefreshCw,
  Settings,
  Zap,
  Brain,
  FolderOpen,
  Activity,
  CheckCircle,
  Code,
  Eye,
} from "lucide-react";

export default function LivePreviewDemo() {
  const [currentDemo, setCurrentDemo] = useState("remove-duplicate");

  const demoSections = [
    {
      id: "remove-duplicate",
      title: "RemoveDuplicate",
      subtitle: "رييموف دوبليكات",
      icon: RefreshCw,
      component: RemoveDuplicatePreview,
      description: "لوحة معلومات مباشرة لكشف وحذف الملفات المكررة",
    },
    {
      id: "system-cleanup",
      title: "System Cleanup",
      subtitle: "تنظيف النظام",
      icon: Settings,
      component: SystemCleanupPreview,
      description: "مراقبة عملية تنظيف النظام وتحسين الأداء",
    },
    {
      id: "boost-mode",
      title: "Boost Mode",
      subtitle: "وضع التسريع",
      icon: Zap,
      component: BoostModePreview,
      description: "مؤشرات أداء فورية لوضع التسريع المتقدم",
    },
    {
      id: "smart-advisor",
      title: "Smart Advisor",
      subtitle: "المستشار الذكي",
      icon: Brain,
      component: SmartAdvisorPreview,
      description: "تحليل ذكي مباشر واقتراحات تحسين فورية",
    },
    {
      id: "simple-organizer",
      title: "Simple Organizer",
      subtitle: "المنظم البسيط",
      icon: FolderOpen,
      component: SimpleOrganizerPreview,
      description: "مراقبة تنظيم الملفات البسيط والآمن",
    },
    {
      id: "smart-organizer",
      title: "Smart Organizer",
      subtitle: "المنظم الذكي",
      icon: Activity,
      component: SmartOrganizerPreview,
      description: "لوحة ذكية متقدمة لتنظيم الملفات بالذكاء الاصطناعي",
    },
    {
      id: "ultimate-edition",
      title: "Ultimate Edition",
      subtitle: "النسخة المتطورة",
      icon: CheckCircle,
      component: UltimateEditionPreview,
      description: "أقوى لوحة معلومات شاملة مع جميع المميزات",
    },
  ];

  const currentSection = demoSections.find((s) => s.id === currentDemo);
  const CurrentComponent = currentSection?.component || RemoveDuplicatePreview;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white">
      <div className="w-full px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl shadow-xl">
              <Monitor className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Live Preview Panels Demo
          </h1>
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">
            عرض توضيحي للوحات المعلومات المباشرة
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            شاهد كيف تعمل لوحات المعلومات المباشرة في جميع أقسام تطبيق Knoux
            SmartOrganizer مع البيانات الحية والتحديثات الفورية
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <Tabs
          value={currentDemo}
          onValueChange={setCurrentDemo}
          className="w-full mb-8"
        >
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 bg-white/10 backdrop-blur-md">
            {demoSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="data-[state=active]:bg-purple-600 text-xs lg:text-sm"
                >
                  <IconComponent className="w-4 h-4 mr-1 lg:mr-2" />
                  <span className="hidden lg:inline">{section.title}</span>
                  <span className="lg:hidden">{section.subtitle}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Current Section Info */}
        {currentSection && (
          <motion.div
            key={currentSection.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <currentSection.icon className="w-6 h-6 text-cyan-400" />
                  <div>
                    <div className="text-white">{currentSection.title}</div>
                    <div className="text-sm text-cyan-400 font-normal">
                      {currentSection.subtitle}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{currentSection.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* لوحة العرض الرئيسية - شاشة عريضة */}
        <motion.div
          key={currentDemo}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {/* المكون الحي يعمل فعلياً - شاشة عريضة كاملة */}
          <CurrentComponent
            className="w-full max-w-full mx-auto"
            initialStats={{
              filesScanned: 1250,
              duplicatesFound: 32,
              spaceSavedMB: 156.8,
              isActive: true,
            }}
            onStatsUpdate={(stats) => {
              console.log("📊 Live Stats Update:", stats);
              // هنا يمكن ربطه بـ WebSocket أو API
            }}
          />
        </motion.div>

        {/* معلومات سريعة */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <Eye className="w-5 h-5" />
                المكونات تعمل فعلياً - ليست نص
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">
                    ✅ ما يعمل الآن:
                  </h4>
                  <ul className="space-y-2 text-gray-300">
                    <li>• بيانات حية تتحدث كل 2-3 ثوان</li>
                    <li>• إحصائيات واقعية مع مؤشرات الأداء</li>
                    <li>• تفاعل كامل مع أزرار التحكم</li>
                    <li>• إشعارات ذكية عند الأحداث المهمة</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">
                    🔧 للربط مع APIs حقيقية:
                  </h4>
                  <ul className="space-y-2 text-gray-300">
                    <li>• استبدال محاكاة البيانات بـ WebSocket</li>
                    <li>• ربط onStatsUpdate بقاعدة البيانات</li>
                    <li>• استخدام REST API للتحديثات</li>
                    <li>• تخصيص initialStats من الخادم</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
