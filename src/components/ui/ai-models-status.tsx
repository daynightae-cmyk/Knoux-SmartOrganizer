import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Download,
  Eye,
  FileText,
  Shield,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIModel } from "@/types/organizer";

interface AIModelsStatusProps {
  models: AIModel[];
  onReloadModel?: (modelName: string) => void;
  onDownloadModels?: () => Promise<void>;
  className?: string;
}

const modelTypeIcons: Record<AIModel["type"], React.ReactNode> = {
  classification: <Tag className="w-4 h-4" />,
  detection: <Eye className="w-4 h-4" />,
  ocr: <FileText className="w-4 h-4" />,
  nsfw: <Shield className="w-4 h-4" />,
};

const modelTypeColors: Record<AIModel["type"], string> = {
  classification: "bg-blue-100 text-blue-700 border-blue-200",
  detection: "bg-purple-100 text-purple-700 border-purple-200",
  ocr: "bg-green-100 text-green-700 border-green-200",
  nsfw: "bg-red-100 text-red-700 border-red-200",
};

export function AIModelsStatus({
  models,
  onReloadModel,
  onDownloadModels,
  className,
}: AIModelsStatusProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadModels = async () => {
    if (!onDownloadModels || isDownloading) return;

    setIsDownloading(true);
    try {
      await onDownloadModels();
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };
  const loadedModels = models.filter((m) => m.loaded);
  const loadingModels = models.filter((m) => m.loading);
  const errorModels = models.filter((m) => m.error);

  const overallStatus = (): "ready" | "loading" | "error" | "partial" => {
    if (errorModels.length === models.length) return "error";
    if (loadingModels.length > 0) return "loading";
    if (loadedModels.length === models.length) return "ready";
    return "partial";
  };

  const getStatusColor = (status: ReturnType<typeof overallStatus>) => {
    switch (status) {
      case "ready":
        return "text-green-600 bg-green-100";
      case "loading":
        return "text-blue-600 bg-blue-100";
      case "error":
        return "text-red-600 bg-red-100";
      case "partial":
        return "text-yellow-600 bg-yellow-100";
    }
  };

  const getStatusMessage = (status: ReturnType<typeof overallStatus>) => {
    switch (status) {
      case "ready":
        return "All AI models ready";
      case "loading":
        return "Loading AI models...";
      case "error":
        return "Failed to load models";
      case "partial":
        return "Some models unavailable";
    }
  };

  const status = overallStatus();

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-knoux-600" />
            <span>AI Engine Status</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(status)}>
              {getStatusMessage(status)}
            </Badge>
            {onDownloadModels && (
              <Button
                onClick={handleDownloadModels}
                disabled={isDownloading}
                size="sm"
                className="bg-gradient-to-r from-knoux-500 to-purple-600 hover:from-knoux-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري التحميل...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    تحميل النماذج المتقدمة
                  </>
                )}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Models Ready</span>
            <span>
              {loadedModels.length} / {models.length}
            </span>
          </div>
          <Progress
            value={(loadedModels.length / models.length) * 100}
            className="h-2"
          />
        </div>

        {/* Individual Models */}
        <div className="space-y-3">
          {models.map((model, index) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    "p-1.5 rounded-md",
                    modelTypeColors[model.type],
                  )}
                >
                  {modelTypeIcons[model.type]}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{model.name}</h4>
                  <p className="text-xs text-gray-500">
                    v{model.version} • {model.size}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {model.loading && (
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center space-x-1 text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">
                        {model.progress ? `${model.progress}%` : "تحميل..."}
                      </span>
                    </div>
                    {model.progress !== undefined && (
                      <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${model.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {model.loaded && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs">Ready</span>
                  </div>
                )}

                {model.error && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs">Error</span>
                    </div>
                    {onReloadModel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReloadModel(model.name)}
                        className="p-1 h-auto"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Error Details */}
        {errorModels.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <h5 className="font-medium text-red-800 mb-2">
              Model Loading Errors:
            </h5>
            <ul className="space-y-1">
              {errorModels.map((model) => (
                <li key={model.name} className="text-xs text-red-700">
                  <strong>{model.name}:</strong> {model.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Performance Tips */}
        {status === "ready" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700">
              🧠 All AI models loaded successfully! The organizer is ready to
              process images with full AI capabilities.
            </p>
          </div>
        )}

        {status === "partial" && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700">
              ⚠️ Some AI features may be limited. Try refreshing or check your
              internet connection for model downloads.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
