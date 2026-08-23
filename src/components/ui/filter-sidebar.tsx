import React from "react";
import { motion } from "framer-motion";
import {
  Filter,
  Search,
  Calendar,
  Sliders,
  Tag,
  Users,
  FileText,
  Shield,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { FilterOptions, ImageCategory } from "@/types/organizer";

interface FilterSidebarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClose?: () => void;
  categoryStats: Array<{ category: ImageCategory; count: number }>;
  isOpen?: boolean;
}

const categoryLabels: Record<ImageCategory, string> = {
  selfies: "Selfies & Portraits",
  documents: "Documents",
  screenshots: "Screenshots",
  nature: "Nature & Landscape",
  food: "Food & Dining",
  art: "Art & Creative",
  nsfw: "Sensitive Content",
  duplicates: "Duplicates",
  general: "General",
  memes: "Memes & Humor",
  receipts: "Receipts & Bills",
  "qr-codes": "QR Codes",
  pets: "Pets & Animals",
  vehicles: "Vehicles",
  architecture: "Architecture",
};

const categoryIcons: Record<ImageCategory, React.ReactNode> = {
  selfies: <Users className="w-4 h-4" />,
  documents: <FileText className="w-4 h-4" />,
  screenshots: "📱",
  nature: "🌿",
  food: "🍕",
  art: "🎨",
  nsfw: <Shield className="w-4 h-4" />,
  duplicates: "📂",
  general: "📷",
  memes: "😂",
  receipts: "🧾",
  "qr-codes": "📱",
  pets: "🐾",
  vehicles: "🚗",
  architecture: "🏗️",
};

export function FilterSidebar({
  filters,
  onFiltersChange,
  onClose,
  categoryStats,
  isOpen = true,
}: FilterSidebarProps) {
  const handleCategoryToggle = (category: ImageCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    onFiltersChange({
      ...filters,
      categories: newCategories,
    });
  };

  const handleReset = () => {
    onFiltersChange({
      categories: [],
      hasText: false,
      hasFaces: false,
      isNSFW: false,
      minSize: 0,
      maxSize: Infinity,
      dateRange: {},
      tags: [],
      searchQuery: "",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const activeFiltersCount =
    filters.categories.length +
    (filters.hasText ? 1 : 0) +
    (filters.hasFaces ? 1 : 0) +
    (filters.isNSFW ? 1 : 0) +
    (filters.searchQuery ? 1 : 0) +
    (filters.minSize > 0 ? 1 : 0) +
    (filters.maxSize < Infinity ? 1 : 0);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      className="w-80 bg-white border-r border-gray-200 h-full overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-knoux-600" />
            <h2 className="text-lg font-semibold">Smart Filters</h2>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Search Images</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search descriptions, text, tags..."
              value={filters.searchQuery}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  searchQuery: e.target.value,
                })
              }
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Tag className="w-4 h-4" />
              <span>Categories</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categoryStats
              .sort((a, b) => b.count - a.count)
              .map(({ category, count }) => (
                <div
                  key={category}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleCategoryToggle(category)}
                >
                  <Checkbox
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-sm">
                      {categoryIcons[category] || "📷"}
                    </span>
                    <span className="text-sm font-medium">
                      {categoryLabels[category] || category}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {count}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Content Features */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Sliders className="w-4 h-4" />
              <span>Content Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <Label htmlFor="has-faces" className="text-sm">
                  Has Faces
                </Label>
              </div>
              <Switch
                id="has-faces"
                checked={filters.hasFaces}
                onCheckedChange={(checked) =>
                  onFiltersChange({
                    ...filters,
                    hasFaces: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <Label htmlFor="has-text" className="text-sm">
                  Contains Text
                </Label>
              </div>
              <Switch
                id="has-text"
                checked={filters.hasText}
                onCheckedChange={(checked) =>
                  onFiltersChange({
                    ...filters,
                    hasText: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <Label htmlFor="is-nsfw" className="text-sm">
                  Sensitive Content
                </Label>
              </div>
              <Switch
                id="is-nsfw"
                checked={filters.isNSFW}
                onCheckedChange={(checked) =>
                  onFiltersChange({
                    ...filters,
                    isNSFW: checked,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* File Size */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">File Size Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">
                Minimum Size: {formatFileSize(filters.minSize)}
              </Label>
              <Slider
                value={[filters.minSize / (1024 * 1024)]}
                onValueChange={([value]) =>
                  onFiltersChange({
                    ...filters,
                    minSize: value * 1024 * 1024,
                  })
                }
                max={50}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-2 block">
                Maximum Size:{" "}
                {filters.maxSize === Infinity
                  ? "No limit"
                  : formatFileSize(filters.maxSize)}
              </Label>
              <Slider
                value={[
                  filters.maxSize === Infinity
                    ? 50
                    : filters.maxSize / (1024 * 1024),
                ]}
                onValueChange={([value]) =>
                  onFiltersChange({
                    ...filters,
                    maxSize: value === 50 ? Infinity : value * 1024 * 1024,
                  })
                }
                max={50}
                step={0.1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Date Range */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Date Range</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="start-date" className="text-xs text-gray-500">
                From
              </Label>
              <Input
                id="start-date"
                type="date"
                value={
                  filters.dateRange.start
                    ? filters.dateRange.start.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    dateRange: {
                      ...filters.dateRange,
                      start: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs text-gray-500">
                To
              </Label>
              <Input
                id="end-date"
                type="date"
                value={
                  filters.dateRange.end
                    ? filters.dateRange.end.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    dateRange: {
                      ...filters.dateRange,
                      end: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
