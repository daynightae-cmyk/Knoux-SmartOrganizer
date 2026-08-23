import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Trash2,
  Download,
  Tag,
  Users,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ImageFile, ImageCategory } from "@/types/organizer";

interface ImageGridProps {
  images: ImageFile[];
  onRemove: (id: string) => void;
  onPreview?: (image: ImageFile) => void;
  selectedImages?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  viewMode?: "grid" | "list";
  showStats?: boolean;
}

const categoryColors: Record<ImageCategory, string> = {
  selfies: "bg-purple-100 text-purple-800 border-purple-200",
  documents: "bg-blue-100 text-blue-800 border-blue-200",
  screenshots: "bg-cyan-100 text-cyan-800 border-cyan-200",
  nature: "bg-green-100 text-green-800 border-green-200",
  food: "bg-orange-100 text-orange-800 border-orange-200",
  art: "bg-pink-100 text-pink-800 border-pink-200",
  nsfw: "bg-red-100 text-red-800 border-red-200",
  duplicates: "bg-yellow-100 text-yellow-800 border-yellow-200",
  general: "bg-gray-100 text-gray-800 border-gray-200",
  memes: "bg-indigo-100 text-indigo-800 border-indigo-200",
  receipts: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "qr-codes": "bg-violet-100 text-violet-800 border-violet-200",
  pets: "bg-amber-100 text-amber-800 border-amber-200",
  vehicles: "bg-slate-100 text-slate-800 border-slate-200",
  architecture: "bg-stone-100 text-stone-800 border-stone-200",
};

const categoryIcons: Record<ImageCategory, React.ReactNode> = {
  selfies: <Users className="w-3 h-3" />,
  documents: <FileText className="w-3 h-3" />,
  screenshots: <Eye className="w-3 h-3" />,
  nature: "🌿",
  food: "🍕",
  art: "���",
  nsfw: <AlertTriangle className="w-3 h-3" />,
  duplicates: "📂",
  general: "📷",
  memes: "😂",
  receipts: "🧾",
  "qr-codes": "📱",
  pets: "🐾",
  vehicles: "🚗",
  architecture: "🏗️",
};

export function ImageGrid({
  images,
  onRemove,
  onPreview,
  selectedImages = new Set(),
  onSelectionChange,
  viewMode = "grid",
  showStats = true,
}: ImageGridProps) {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  const handleImageClick = (image: ImageFile, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select mode
      const newSelection = new Set(selectedImages);
      if (newSelection.has(image.id)) {
        newSelection.delete(image.id);
      } else {
        newSelection.add(image.id);
      }
      onSelectionChange?.(newSelection);
    } else {
      onPreview?.(image);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Eye className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium mb-2">No images to display</h3>
        <p className="text-sm text-center max-w-md">
          Upload some images using the dropzone above to get started with
          AI-powered organization.
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        <AnimatePresence>
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  "transition-all duration-200 hover:shadow-md",
                  selectedImages.has(image.id) && "ring-2 ring-knoux-500",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={image.thumbnail || image.url}
                        alt={image.name}
                        className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                        onClick={(e) => handleImageClick(image, e)}
                      />
                      {image.processed && (
                        <div className="absolute -top-1 -right-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500 bg-white rounded-full" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{image.name}</h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(image.size)}
                      </p>

                      {image.analysis && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {image.analysis.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {image.category && (
                        <Badge
                          variant="secondary"
                          className={categoryColors[image.category]}
                        >
                          {categoryIcons[image.category]}
                          <span className="ml-1 capitalize">
                            {image.category}
                          </span>
                        </Badge>
                      )}

                      {showStats && image.analysis && (
                        <div className="flex space-x-1">
                          {image.analysis.faces.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {image.analysis.faces.length}
                            </Badge>
                          )}
                          {image.analysis.text.text.length > 20 && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(image.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
      <AnimatePresence>
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group relative"
            onMouseEnter={() => setHoveredImage(image.id)}
            onMouseLeave={() => setHoveredImage(null)}
          >
            <Card
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer",
                selectedImages.has(image.id) &&
                  "ring-2 ring-knoux-500 ring-offset-2",
              )}
            >
              <div className="aspect-square relative">
                <img
                  src={image.thumbnail || image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                  onClick={(e) => handleImageClick(image, e)}
                />

                {/* Processing status overlay */}
                <div className="absolute top-2 right-2">
                  {!image.processed ? (
                    <div className="bg-white/90 rounded-full p-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                  ) : (
                    <div className="bg-green-500 rounded-full p-1">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Category badge */}
                {image.category && (
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs px-2 py-1",
                        categoryColors[image.category],
                      )}
                    >
                      {categoryIcons[image.category]}
                    </Badge>
                  </div>
                )}

                {/* Hover overlay */}
                <AnimatePresence>
                  {hoveredImage === image.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center"
                    >
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreview?.(image);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Preview</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemove(image.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Image info */}
              <CardContent className="p-3">
                <h4 className="font-medium text-sm truncate" title={image.name}>
                  {image.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(image.size)}
                </p>

                {showStats && image.analysis && (
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex space-x-1">
                      {image.analysis.faces.length > 0 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          <Users className="w-3 h-3 mr-0.5" />
                          {image.analysis.faces.length}
                        </Badge>
                      )}
                      {image.analysis.text.text.length > 20 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          <FileText className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-gray-400">
                      {Math.round(image.analysis.confidence * 100)}%
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
