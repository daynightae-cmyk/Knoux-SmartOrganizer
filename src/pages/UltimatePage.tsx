import React from "react";
import { motion } from "framer-motion";
import { GlassAddonManager } from "@/components/GlassAddonManager";

export default function UltimatePage() {
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
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📺</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Knoux SmartOrganizer PRO
          </h1>
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">
            مدير الإضافات الذكي
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            لوحة تحكم متطورة مع شاشة مراقبة حية لجميع إضافات النظام والذكاء
            الاصطناعي
          </p>
        </motion.div>

        {/* Glass Addon Manager */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassAddonManager className="w-full" />
        </motion.div>
      </div>
    </div>
  );
}
