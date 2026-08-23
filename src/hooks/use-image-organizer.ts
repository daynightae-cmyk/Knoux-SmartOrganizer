import { useState, useCallback, useRef } from "react";
import type {
  ImageFile,
  ProcessingProgress,
  ProcessingStats,
  FilterOptions,
  OrganizeOptions,
  SmartSuggestion,
  ImageCategory,
} from "@/types/organizer";
import { aiEngine } from "@/lib/ai-engine";

const DEFAULT_ORGANIZE_OPTIONS: OrganizeOptions = {
  autoRename: true,
  createSubfolders: true,
  moveFiles: false,
  addTags: true,
  generateThumbnails: true,
  extractText: true,
  detectFaces: true,
  checkNSFW: true,
  findDuplicates: true,
  qualityThreshold: 0.7,
};

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  categories: [],
  hasText: false,
  hasFaces: false,
  isNSFW: false,
  minSize: 0,
  maxSize: Infinity,
  dateRange: {},
  tags: [],
  searchQuery: "",
};

export function useImageOrganizer() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [progress, setProgress] = useState<ProcessingProgress>({
    current: 0,
    total: 0,
    status: "idle",
    stage: "upload",
    message: "Ready to organize images",
  });
  const [stats, setStats] = useState<ProcessingStats>({
    total: 0,
    processed: 0,
    successful: 0,
    errors: 0,
    categorized: {} as Record<ImageCategory, number>,
    avgProcessingTime: 0,
    startTime: new Date(),
  });
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);
  const [organizeOptions, setOrganizeOptions] = useState<OrganizeOptions>(
    DEFAULT_ORGANIZE_OPTIONS,
  );
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const addImages = useCallback(
    async (files: File[]) => {
      const newImages: ImageFile[] = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;

        const imageFile: ImageFile = {
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          url: URL.createObjectURL(file),
          processed: false,
          tags: [],
          createdAt: new Date(),
        };

        if (organizeOptions.generateThumbnails) {
          imageFile.thumbnail = await generateThumbnail(file);
        }

        newImages.push(imageFile);
      }

      setImages((prev) => [...prev, ...newImages]);
      return newImages;
    },
    [organizeOptions.generateThumbnails],
  );

  const generateThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        const size = 150;
        canvas.width = size;
        canvas.height = size;

        const scale = Math.min(size / img.width, size / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (size - width) / 2;
        const y = (size - height) / 2;

        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, x, y, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.8));
        URL.revokeObjectURL(img.src);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const processImages = useCallback(async () => {
    if (isProcessing || images.length === 0) return;

    setIsProcessing(true);
    abortControllerRef.current = new AbortController();

    const startTime = new Date();
    const unprocessedImages = images.filter((img) => !img.processed);

    setProgress({
      current: 0,
      total: unprocessedImages.length,
      status: "processing",
      stage: "analysis",
      message: "Analyzing images with AI...",
    });

    setStats({
      total: unprocessedImages.length,
      processed: 0,
      successful: 0,
      errors: 0,
      categorized: {} as Record<ImageCategory, number>,
      avgProcessingTime: 0,
      startTime,
    });

    let processed = 0;
    let successful = 0;
    let errors = 0;
    const categorized = {} as Record<ImageCategory, number>;
    const processingTimes: number[] = [];

    for (const image of unprocessedImages) {
      if (abortControllerRef.current?.signal.aborted) break;

      const imageStartTime = Date.now();

      try {
        setProgress((prev) => ({
          ...prev,
          current: processed + 1,
          currentFile: image.name,
          message: `Processing ${image.name}...`,
        }));

        const analysis = await aiEngine.analyzeImage(image.file);
        const category = aiEngine.categorizeImage(analysis);
        const smartName = organizeOptions.autoRename
          ? aiEngine.generateSmartFilename(analysis)
          : image.name;

        categorized[category] = (categorized[category] || 0) + 1;

        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  analysis,
                  category,
                  name: smartName,
                  processed: true,
                  processedAt: new Date(),
                  tags: [
                    ...img.tags,
                    category,
                    ...analysis.text.text.split(" ").slice(0, 3),
                  ],
                }
              : img,
          ),
        );

        successful++;
        const processingTime = Date.now() - imageStartTime;
        processingTimes.push(processingTime);
      } catch (error) {
        console.error(`Failed to process ${image.name}:`, error);
        errors++;
      }

      processed++;

      setStats((prev) => ({
        ...prev,
        processed,
        successful,
        errors,
        categorized,
        avgProcessingTime:
          processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length,
      }));
    }

    // Find duplicates
    if (organizeOptions.findDuplicates) {
      setProgress((prev) => ({
        ...prev,
        stage: "organization",
        message: "Finding duplicate images...",
      }));

      const processedImages = images
        .filter((img) => img.processed && img.analysis)
        .map((img) => ({ id: img.id, analysis: img.analysis! }));

      const duplicateGroups = aiEngine.findSimilarImages(processedImages);

      // Generate suggestions for duplicates
      const duplicateSuggestions: SmartSuggestion[] = duplicateGroups.map(
        (group) => ({
          id: crypto.randomUUID(),
          type: "merge",
          confidence: group.similarity,
          description: `Found ${group.group.length} similar images`,
          imageIds: group.group,
          action: async () => {
            // Keep the highest quality image and mark others as duplicates
            const imagesToUpdate = group.group.slice(1);
            setImages((prev) =>
              prev.map((img) =>
                imagesToUpdate.includes(img.id)
                  ? { ...img, category: "duplicates" }
                  : img,
              ),
            );
          },
        }),
      );

      setSuggestions((prev) => [...prev, ...duplicateSuggestions]);
    }

    setProgress({
      current: processed,
      total: unprocessedImages.length,
      status: "complete",
      stage: "complete",
      message: `Successfully processed ${successful} images`,
    });

    setStats((prev) => ({
      ...prev,
      endTime: new Date(),
    }));

    setIsProcessing(false);
  }, [images, isProcessing, organizeOptions]);

  const stopProcessing = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
    setProgress((prev) => ({
      ...prev,
      status: "idle",
      message: "Processing stopped",
    }));
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image?.url) {
        URL.revokeObjectURL(image.url);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((img) => {
      if (img.url) URL.revokeObjectURL(img.url);
      if (img.thumbnail) URL.revokeObjectURL(img.thumbnail);
    });
    setImages([]);
    setSuggestions([]);
    setProgress({
      current: 0,
      total: 0,
      status: "idle",
      stage: "upload",
      message: "Ready to organize images",
    });
  }, [images]);

  const filteredImages = images.filter((image) => {
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(image.category!)
    ) {
      return false;
    }

    if (
      filters.hasText &&
      (!image.analysis?.text.text || image.analysis.text.text.length === 0)
    ) {
      return false;
    }

    if (
      filters.hasFaces &&
      (!image.analysis?.faces || image.analysis.faces.length === 0)
    ) {
      return false;
    }

    if (filters.isNSFW !== image.analysis?.isNSFW) {
      return false;
    }

    if (image.size < filters.minSize || image.size > filters.maxSize) {
      return false;
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        image.name,
        image.analysis?.description || "",
        image.analysis?.text.text || "",
        ...image.tags,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });

  const getImagesByCategory = useCallback(
    (category: ImageCategory) => {
      return images.filter((img) => img.category === category);
    },
    [images],
  );

  const exportResults = useCallback(() => {
    const results = {
      timestamp: new Date().toISOString(),
      stats,
      images: images.map((img) => ({
        name: img.name,
        originalName: img.file.name,
        size: img.size,
        category: img.category,
        tags: img.tags,
        analysis: img.analysis
          ? {
              description: img.analysis.description,
              confidence: img.analysis.confidence,
              isNSFW: img.analysis.isNSFW,
              faceCount: img.analysis.faces.length,
              textLength: img.analysis.text.text.length,
            }
          : null,
      })),
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `knoux-organizer-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [images, stats]);

  return {
    // State
    images: filteredImages,
    allImages: images,
    progress,
    stats,
    filters,
    organizeOptions,
    suggestions,
    isProcessing,

    // Actions
    addImages,
    processImages,
    stopProcessing,
    removeImage,
    clearAll,
    setFilters,
    setOrganizeOptions,
    getImagesByCategory,
    exportResults,

    // Computed values
    processedCount: images.filter((img) => img.processed).length,
    unprocessedCount: images.filter((img) => !img.processed).length,
    categoryStats: Object.entries(stats.categorized).map(
      ([category, count]) => ({
        category: category as ImageCategory,
        count,
      }),
    ),
  };
}
