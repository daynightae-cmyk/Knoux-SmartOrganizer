// src/components/AIAssistant.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useImageStore } from "@/hooks/useImageStore";
import { AICommand } from "@/types/knoux-x2";

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<AICommand[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const store = useImageStore();

  // فتح المساعد تلقائياً عند الضغط على مفتاح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /**
   * معالجة الأوامر الطبيعية وتحويلها إلى إجراءات
   */
  const processCommand = async (input: string): Promise<string> => {
    const normalizedInput = input.toLowerCase().trim();

    try {
      // البحث في الصور
      if (
        normalizedInput.includes("ابحث") ||
        normalizedInput.includes("اعرض") ||
        normalizedInput.includes("أظهر")
      ) {
        // استخراج الكلمات المفتاحية
        const keywords = extractKeywords(normalizedInput);
        const results = await store.searchImages(keywords.join(" "));

        // تحديث الفلتر لعرض النتائج
        // هذا سيتطلب إضافة دالة setFilter في المتجر
        return `تم العثور على ${results.length} صورة تطابق "${keywords.join(" ")}"`;
      }

      // تصدير الو��ائق
      if (
        normalizedInput.includes("صدر") ||
        normalizedInput.includes("احفظ") ||
        normalizedInput.includes("تنزيل")
      ) {
        const keywords = extractKeywords(normalizedInput);
        if (keywords.length > 0) {
          await store.exportDocuments(keywords[0]);
          return `تم تصدير الوثائق التي تحتوي على "${keywords[0]}" بنجاح`;
        }
        return "يرجى تحديد الكلمة المفتاحية للتصدير";
      }

      // إنشاء قصة
      if (
        normalizedInput.includes("قصة") ||
        normalizedInput.includes("فيديو") ||
        normalizedInput.includes("سرد")
      ) {
        const selectedImages = Array.from(store.selectedImages);
        if (selectedImages.length === 0) {
          return "يرجى تحديد صور أولاً لإنشاء قصة منها";
        }

        const story = await store.generateStory(selectedImages);
        return `تم إنشاء قصة "${story.title}" من ${selectedImages.length} صورة`;
      }

      // البحث عن صور مشابهة
      if (
        normalizedInput.includes("مشابه") ||
        normalizedInput.includes("مثل") ||
        normalizedInput.includes("شبيه")
      ) {
        const selectedImages = Array.from(store.selectedImages);
        if (selectedImages.length === 0) {
          return "يرجى تحديد صورة أولاً للبحث عن صور مشابهة";
        }

        const similar = store.findSimilarImages(selectedImages[0]);
        return `تم العثور على ${similar.length} صورة مشابهة`;
      }

      // تجميع حسب الأحداث
      if (
        normalizedInput.includes("جمع") ||
        normalizedInput.includes("نظم") ||
        normalizedInput.includes("رتب")
      ) {
        const groups = store.groupByEvent();
        return `تم تجميع الصور في ${groups.size} مجموعة حسب الأحداث والتواريخ`;
      }

      // معلومات عامة
      if (
        normalizedInput.includes("كم") ||
        normalizedInput.includes("عدد") ||
        normalizedInput.includes("إحصائيات")
      ) {
        const totalImages = store.images.size;
        const processedImages = Array.from(store.images.values()).filter(
          (img) => img.isProcessed,
        ).length;
        return `لديك ${totalImages} صورة، تم معالجة ${processedImages} منها بالذكاء الاصطناعي`;
      }

      // تنظيف التحديد
      if (
        normalizedInput.includes("مسح") ||
        normalizedInput.includes("إلغاء") ||
        normalizedInput.includes("صافي")
      ) {
        store.clearSelection();
        return "تم مسح التحديد";
      }

      // إنشاء خريطة الذكريات
      if (
        normalizedInput.includes("خريطة") ||
        normalizedInput.includes("ذكريات") ||
        normalizedInput.includes("تنظيم")
      ) {
        await store.createMemoryMap();
        return "تم إنشاء خريطة الذكريات التفاعلية";
      }

      // أوامر التحكم في العرض
      if (normalizedInput.includes("كبر") || normalizedInput.includes("زوم")) {
        return "استخدم عجلة الماوس أو الإيماءات للتكبير والتصغير";
      }

      // مساعدة
      if (
        normalizedInput.includes("مساعدة") ||
        normalizedInput.includes("كيف") ||
        normalizedInput.includes("ماذا")
      ) {
        return getHelpMessage();
      }

      return "عذراً، لم أفهم طلبك. جرب أوامر مثل: 'ابحث عن صور الطبيعة' أو 'أنشئ قصة من الصور المحددة'";
    } catch (error: any) {
      console.error("خطأ في معالجة الأمر:", error);
      return `حدث خطأ: ${error.message}`;
    }
  };

  /**
   * استخراج الكلمات المفتاحية من النص
   */
  const extractKeywords = (text: string): string[] => {
    // كلمات يجب تجاهلها
    const stopWords = [
      "ابحث",
      "عن",
      "في",
      "من",
      "إلى",
      "على",
      "هذا",
      "هذه",
      "التي",
      "الذي",
      "أظهر",
      "اعرض",
      "صدر",
      "احفظ",
      "تنزيل",
    ];

    return text
      .split(" ")
      .filter((word) => word.length > 2 && !stopWords.includes(word))
      .slice(0, 3); // أخذ أول 3 كلمات مفيدة
  };

  /**
   * رسالة المساعدة
   */
  const getHelpMessage = (): string => {
    return `
🤖 مساعد نوكس الذكي - الأوامر المتاحة:

🔍 البحث: "ابحث عن صور الطبيعة" أو "أظهر صور 2024"
📄 التصدير: "صدر الوثائق" أو "احفظ الفواتير"
🎬 القصص: "أنشئ قصة" (بعد تحديد الصور)
🔗 التشابه: "ابحث عن صور مشابهة" (بعد تحديد صورة)
📊 التجميع: "جمع الصور حسب الأحداث"
🗺️ الخريطة: "أنشئ خريطة ا��ذكريات"
📈 الإحصائيات: "كم عدد الصور؟"
🧹 التنظيف: "مسح التحديد"

💡 نصيحة: استخدم Ctrl+K لفتح المساعد بسرعة
    `;
  };

  /**
   * معالجة إرسال الأمر
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    const commandId = `cmd-${Date.now()}`;
    const timestamp = Date.now();

    try {
      const response = await processCommand(command);

      const newCommand: AICommand = {
        id: commandId,
        input: command,
        output: response,
        type: determineCommandType(command),
        timestamp,
        success: true,
      };

      setCommandHistory((prev) => [newCommand, ...prev.slice(0, 9)]); // احتفظ بآخر 10 أوامر
      setCommand("");
    } catch (error: any) {
      const errorCommand: AICommand = {
        id: commandId,
        input: command,
        output: `خطأ: ${error.message}`,
        type: "search",
        timestamp,
        success: false,
      };

      setCommandHistory((prev) => [errorCommand, ...prev.slice(0, 9)]);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * تحديد نوع الأمر
   */
  const determineCommandType = (cmd: string): AICommand["type"] => {
    const lower = cmd.toLowerCase();
    if (lower.includes("ابحث") || lower.includes("أظهر")) return "search";
    if (lower.includes("صدر") || lower.includes("احفظ")) return "export";
    if (lower.includes("قصة")) return "story";
    if (lower.includes("جمع") || lower.includes("نظم")) return "organize";
    if (lower.includes("مشابه")) return "search";
    return "search";
  };

  /**
   * اختصارات الأوامر السريعة
   */
  const quickCommands = [
    { label: "صور اليوم", command: "ابحث عن صور اليوم" },
    { label: "إنشاء قصة", command: "أنشئ قصة من الصور المحددة" },
    { label: "صور مشابهة", command: "ابحث عن صور مشابهة" },
    { label: "إحصائيات", command: "كم عدد الصور؟" },
  ];

  return (
    <>
      {/* زر فتح المساعد */}
      {!isOpen && (
        <motion.button
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl"
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          🤖
        </motion.button>
      )}

      {/* واجهة المساعد */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* خلفية مظلمة */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* نافذة المساعد */}
            <motion.div
              className="relative w-full max-w-2xl bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* رأس النافذة */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    🧠
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">
                      مساعد نوكس الذكي
                    </h2>
                    <p className="text-gray-400 text-sm">
                      اطلب أي شيء بلغتك الطبيعية
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              {/* منطقة المحادثة */}
              <div className="p-6 max-h-96 overflow-y-auto space-y-4">
                {commandHistory.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-4xl mb-4">💭</div>
                    <p>ابدأ محادثة مع مساعدك الذكي</p>
                    <p className="text-sm mt-2">
                      جرب: "ابحث عن صور الطبيعة" أو "أنشئ قصة"
                    </p>
                  </div>
                ) : (
                  commandHistory.map((cmd) => (
                    <motion.div
                      key={cmd.id}
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* الأمر المدخل */}
                      <div className="flex justify-end">
                        <div className="bg-blue-500 text-white rounded-2xl px-4 py-2 max-w-xs">
                          {cmd.input}
                        </div>
                      </div>

                      {/* الاستجابة */}
                      <div className="flex justify-start">
                        <div
                          className={`rounded-2xl px-4 py-2 max-w-md whitespace-pre-line ${
                            cmd.success
                              ? "bg-gray-700 text-white"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {cmd.output}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* الأوامر السريعة */}
              <div className="px-6 pb-4">
                <div className="flex flex-wrap gap-2">
                  {quickCommands.map((quick) => (
                    <button
                      key={quick.label}
                      onClick={() => setCommand(quick.command)}
                      className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                      {quick.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* حقل الإدخال */}
              <form
                onSubmit={handleSubmit}
                className="p-6 border-t border-white/10"
              >
                <div className="flex space-x-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="اكتب أمرك هنا... (مثال: ابحث عن صور الطبيعة)"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                  <motion.button
                    type="submit"
                    disabled={!command.trim() || isProcessing}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isProcessing ? "..." : "إرسال"}
                  </motion.button>
                </div>

                <div className="mt-3 text-xs text-gray-400 text-center">
                  اضغط <kbd className="bg-white/10 px-2 py-1 rounded">Ctrl</kbd>{" "}
                  + <kbd className="bg-white/10 px-2 py-1 rounded">K</kbd> لفتح
                  المساعد بسرعة
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
