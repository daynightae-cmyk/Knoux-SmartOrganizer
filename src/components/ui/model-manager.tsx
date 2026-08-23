import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  RefreshCw,
  Settings,
  HardDrive,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { localModelManager } from "@/lib/local-models";
import { toast } from "sonner";

interface ModelManagerProps {
  onModelsReady?: () => void;
}

export function ModelManager({ onModelsReady }: ModelManagerProps) {
  const [localModels, setLocalModels] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkLocalModels();
  }, []);

  const checkLocalModels = async () => {
    const models = await localModelManager.checkLocalModels();
    setLocalModels(models);
  };

  const handleMarkModelsReady = () => {
    localModelManager.markAllModelsAvailable();
    setLocalModels({
      "face-detection": true,
      classification: true,
      ocr: true,
      nsfw: true,
    });

    toast.success("✅ تم تفعيل جميع النماذج!", {
      description: "النماذج المحلية جاهزة للاستخدام",
    });

    onModelsReady?.();
  };

  const handleResetModels = () => {
    localModelManager.resetModelStatus();
    setLocalModels({
      "face-detection": false,
      classification: false,
      ocr: false,
      nsfw: false,
    });

    toast.info("🔄 تم إعادة تعيين حالة النماذج");
  };

  const modelInfo = [
    {
      key: "face-detection",
      name: "كشف الوجوه",
      description: "face-api.js models",
      path: "public/models/face-api/",
      size: "2.1MB",
      files: ["tiny_face_detector_model-*", "face_landmark_68_model-*"],
    },
    {
      key: "classification",
      name: "تصنيف الصور",
      description: "MobileNet classification",
      path: "public/models/mobilenet/",
      size: "4.2MB",
      files: ["model.json", "group1-shard1of1.bin"],
    },
    {
      key: "ocr",
      name: "استخراج النص",
      description: "Tesseract.js (مدمج)",
      path: "Built-in",
      size: "6.8MB",
      files: ["Auto-downloaded"],
    },
    {
      key: "nsfw",
      name: "فلترة المحتوى",
      description: "NSFW detection",
      path: "public/models/nsfwjs/",
      size: "2.5MB",
      files: ["model.json", "weights.bin"],
    },
  ];

  const allModelsReady = Object.values(localModels).every((status) => status);
  const anyModelReady = Object.values(localModels).some((status) => status);

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-blue-600" />
            <span>إدارة النماذج المحلية</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={allModelsReady ? "default" : "secondary"}>
              {allModelsReady
                ? "جميع النماذج جاهزة"
                : anyModelReady
                  ? "جزئياً جاهز"
                  : "غير مفعل"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3 p-4 bg-white/70 rounded-lg">
          <Button
            onClick={handleMarkModelsReady}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={allModelsReady}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {allModelsReady ? "النماذج مفعلة" : "تفعيل النماذج المحلية"}
          </Button>

          <Button
            onClick={checkLocalModels}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            فحص النماذج
          </Button>

          <Button
            onClick={handleResetModels}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            إعادة تعيين
          </Button>
        </div>

        {/* Models Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modelInfo.map((model) => (
            <motion.div
              key={model.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">{model.name}</h4>
                {localModels[model.key] ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <p className="text-sm text-gray-600 mb-2">{model.description}</p>

              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>الحجم:</span>
                  <span>{model.size}</span>
                </div>
                <div className="flex justify-between">
                  <span>المسار:</span>
                  <span className="font-mono text-blue-600">{model.path}</span>
                </div>
              </div>

              {model.files.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  <p className="mb-1">الملفات المطلوبة:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {model.files.map((file, index) => (
                      <li key={index} className="font-mono">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h5 className="font-medium text-amber-800 mb-2 flex items-center">
            <FolderOpen className="w-4 h-4 mr-2" />
            تعليمات استخدام النماذج المحلية:
          </h5>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>قم بتنزيل ملفات النماذج ووضعها في المجلدات المحددة</li>
            <li>اضغط على "فحص النماذج" للتحقق من وجودها</li>
            <li>اضغط على "تفعيل النماذج المحلية" لبدء الاستخدام</li>
            <li>استخدم "اختر مجلد كامل" لمعالجة مجلد كامل من الصور</li>
          </ol>
        </div>

        {/* Download Links */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2">
            روابط تحميل النماذج:
          </h5>
          <div className="space-y-2 text-sm">
            <a
              href="https://github.com/justadudewhohacks/face-api.js/tree/master/weights"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Face-API Models (GitHub)
            </a>
            <a
              href="https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Download className="w-4 h-4 mr-2" />
              MobileNet Models (TensorFlow Hub)
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
