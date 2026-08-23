import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Zap,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Eye,
  Shield,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ProcessingProgress,
  ProcessingStats,
  ImageCategory,
} from "@/types/organizer";

interface ProcessingDashboardProps {
  progress: ProcessingProgress;
  stats: ProcessingStats;
  categoryStats: Array<{ category: ImageCategory; count: number }>;
  isProcessing: boolean;
}

const categoryIcons: Record<ImageCategory, React.ReactNode> = {
  selfies: <Users className="w-4 h-4" />,
  documents: <FileText className="w-4 h-4" />,
  screenshots: <Eye className="w-4 h-4" />,
  nature: "🌿",
  food: "🍕",
  art: "🎨",
  nsfw: <Shield className="w-4 h-4" />,
  duplicates: <Copy className="w-4 h-4" />,
  general: "📷",
  memes: "😂",
  receipts: "🧾",
  "qr-codes": "📱",
  pets: "🐾",
  vehicles: "🚗",
  architecture: "🏗️",
};

const stageMessages = {
  upload: "Preparing images for processing...",
  analysis: "AI is analyzing image content...",
  classification: "Categorizing images intelligently...",
  organization: "Organizing into smart folders...",
  complete: "Processing complete!",
};

export function ProcessingDashboard({
  progress,
  stats,
  categoryStats,
  isProcessing,
}: ProcessingDashboardProps) {
  const progressPercentage =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getEstimatedTimeLeft = (): string => {
    if (!isProcessing || progress.current === 0) return "—";

    const avgTime = stats.avgProcessingTime;
    const remaining = progress.total - progress.current;
    const estimatedMs = avgTime * remaining;

    return formatTime(estimatedMs);
  };

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  "p-2 rounded-full",
                  isProcessing
                    ? "bg-knoux-100 text-knoux-600"
                    : "bg-green-100 text-green-600",
                )}
              >
                {isProcessing ? (
                  <Brain className="w-5 h-5 animate-ai-thinking" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">
                  {isProcessing ? "AI Processing" : "Processing Complete"}
                </h3>
                <p className="text-sm text-gray-600">
                  {progress.message ||
                    stageMessages[progress.stage] ||
                    "Ready to organize"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="font-medium">
                {progress.current} / {progress.total}
              </div>
              <div className="text-sm text-gray-500">
                {Math.round(progressPercentage)}%
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Progress value={progressPercentage} className="h-2" />

            {progress.currentFile && (
              <p className="text-xs text-gray-500 truncate">
                Currently processing: {progress.currentFile}
              </p>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <Badge
                  variant={
                    progress.stage === "complete" ? "default" : "secondary"
                  }
                  className="capitalize"
                >
                  {progress.stage}
                </Badge>

                {isProcessing && (
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>ETA: {getEstimatedTimeLeft()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 text-gray-500">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span>{stats.successful}</span>
                </div>
                {stats.errors > 0 && (
                  <div className="flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span>{stats.errors}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Images</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Processed</p>
                <p className="text-xl font-bold">{stats.processed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Time</p>
                <p className="text-xl font-bold">
                  {stats.avgProcessingTime > 0
                    ? `${(stats.avgProcessingTime / 1000).toFixed(1)}s`
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-xl font-bold">
                  {stats.total > 0
                    ? `${Math.round((stats.successful / stats.total) * 100)}%`
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {categoryStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Category Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categoryStats
                .sort((a, b) => b.count - a.count)
                .map(({ category, count }) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="text-lg">
                      {categoryIcons[category] || "📷"}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{category}</p>
                      <p className="text-sm text-gray-600">{count} images</p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Timeline */}
      {stats.endTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Processing Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Started:</span>
                <span>{stats.startTime.toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Completed:</span>
                <span>{stats.endTime.toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Total Duration:</span>
                <span>
                  {formatTime(
                    stats.endTime.getTime() - stats.startTime.getTime(),
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
