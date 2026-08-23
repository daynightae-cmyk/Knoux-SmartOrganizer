import React from "react";
import { motion } from "framer-motion";
import { AIImageAnalysis } from "@/components/AIImageAnalysis";

export default function AIAnalysisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="w-full px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <AIImageAnalysis />
        </motion.div>
      </div>
    </div>
  );
}
