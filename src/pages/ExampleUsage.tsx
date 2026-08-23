import React from "react";
import { RemoveDuplicatePreview } from "@/components/LivePreviewPanel";

// مثال تطبيقي فعلي لاستخدام المكون
export default function ExampleUsage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          مثال تطبيقي فعلي
        </h1>

        {/* المكون يعمل فعلياً هنا */}
        <RemoveDuplicatePreview
          className="max-w-6xl mx-auto mb-8"
          onStatsUpdate={(stats) => {
            console.log("📊 Live Stats Update:", stats);
            // هنا يمكن إرسال البيانات لـ API أو قاعدة البيانات
            // fetch('/api/stats', { method: 'POST', body: JSON.stringify(stats) })
          }}
        />

        {/* مثال مع بيانات مخصصة */}
        <RemoveDuplicatePreview
          initialStats={{
            filesScanned: 150,
            duplicatesFound: 8,
            spaceSavedMB: 45.2,
            isActive: true,
            timeElapsed: 120,
            progress: 75,
            status: "🎯 تحليل متقدم...",
            lastUpdate: new Date(),
          }}
          onStatsUpdate={(stats) => {
            // تحديث في الوقت الفعلي
            console.log("Updated stats:", stats);
          }}
        />
      </div>
    </div>
  );
}
