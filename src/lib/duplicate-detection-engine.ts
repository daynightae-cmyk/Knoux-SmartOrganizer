/**
 * Knoux SmartOrganizer - Duplicate Detection Engine
 * Advanced duplicate file detection with AI-powered similarity analysis
 */

// Types
export interface DuplicateGroup {
  id: string;
  files: FileItem[];
  similarity: number;
  reason: string;
  category: "exact" | "similar" | "potential";
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  hash?: string;
  lastModified: number;
  type: string;
  isSelected: boolean;
}

export interface DetectionSettings {
  enableExactMatch: boolean;
  enableSimilarityMatch: boolean;
  similarityThreshold: number;
  includedExtensions: string[];
  excludedFolders: string[];
  checkFileContent: boolean;
}

export interface DetectionResult {
  totalFiles: number;
  duplicateGroups: DuplicateGroup[];
  spaceSavings: number;
  processingTime: number;
}

// Default settings
const DEFAULT_SETTINGS: DetectionSettings = {
  enableExactMatch: true,
  enableSimilarityMatch: true,
  similarityThreshold: 0.8,
  includedExtensions: [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".mp4",
    ".mp3",
    ".pdf",
    ".doc",
    ".docx",
  ],
  excludedFolders: ["node_modules", ".git", "temp"],
  checkFileContent: true,
};

class DuplicateDetectionEngine {
  private settings: DetectionSettings = DEFAULT_SETTINGS;
  private processingCallbacks: Map<string, (progress: number) => void> =
    new Map();

  constructor() {
    this.loadSettings();
  }

  // Settings management
  getSettings(): DetectionSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<DetectionSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem("knoux-duplicate-detection-settings");
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn("Failed to load duplicate detection settings:", error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(
        "knoux-duplicate-detection-settings",
        JSON.stringify(this.settings),
      );
    } catch (error) {
      console.warn("Failed to save duplicate detection settings:", error);
    }
  }

  // File processing
  async processFiles(
    files: File[],
    onProgress?: (progress: number) => void,
  ): Promise<DetectionResult> {
    const startTime = Date.now();
    let processedFiles = 0;

    const fileItems: FileItem[] = [];

    // Convert File objects to FileItem
    for (const file of files) {
      const fileItem: FileItem = {
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        path: file.webkitRelativePath || file.name,
        size: file.size,
        lastModified: file.lastModified,
        type: file.type || this.getFileTypeFromExtension(file.name),
        isSelected: false,
      };

      // Generate hash for exact matching
      if (this.settings.enableExactMatch) {
        fileItem.hash = await this.generateFileHash(file);
      }

      fileItems.push(fileItem);
      processedFiles++;

      if (onProgress) {
        onProgress((processedFiles / files.length) * 50); // First 50% for file processing
      }
    }

    // Detect duplicates
    const duplicateGroups = await this.detectDuplicates(
      fileItems,
      (progress) => {
        if (onProgress) {
          onProgress(50 + progress * 50); // Second 50% for duplicate detection
        }
      },
    );

    const processingTime = Date.now() - startTime;
    const spaceSavings = this.calculateSpaceSavings(duplicateGroups);

    return {
      totalFiles: fileItems.length,
      duplicateGroups,
      spaceSavings,
      processingTime,
    };
  }

  private async detectDuplicates(
    files: FileItem[],
    onProgress?: (progress: number) => void,
  ): Promise<DuplicateGroup[]> {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();
    let checked = 0;

    for (let i = 0; i < files.length; i++) {
      if (processed.has(files[i].id)) continue;

      const currentFile = files[i];
      const duplicates: FileItem[] = [currentFile];

      // Find exact matches by hash
      if (this.settings.enableExactMatch && currentFile.hash) {
        for (let j = i + 1; j < files.length; j++) {
          if (processed.has(files[j].id)) continue;

          if (files[j].hash === currentFile.hash) {
            duplicates.push(files[j]);
            processed.add(files[j].id);
          }
        }
      }

      // Find similar files
      if (this.settings.enableSimilarityMatch && duplicates.length === 1) {
        for (let j = i + 1; j < files.length; j++) {
          if (processed.has(files[j].id)) continue;

          const similarity = this.calculateSimilarity(currentFile, files[j]);
          if (similarity >= this.settings.similarityThreshold) {
            duplicates.push(files[j]);
            processed.add(files[j].id);
          }
        }
      }

      if (duplicates.length > 1) {
        groups.push({
          id: `group-${groups.length}`,
          files: duplicates,
          similarity:
            duplicates.length > 1 && duplicates[0].hash === duplicates[1].hash
              ? 1.0
              : this.settings.similarityThreshold,
          reason:
            duplicates[0].hash === duplicates[1]?.hash
              ? "Exact match"
              : "Similar files",
          category:
            duplicates[0].hash === duplicates[1]?.hash ? "exact" : "similar",
        });
      }

      processed.add(currentFile.id);
      checked++;

      if (onProgress) {
        onProgress(checked / files.length);
      }
    }

    return groups;
  }

  private calculateSimilarity(file1: FileItem, file2: FileItem): number {
    let similarity = 0;
    let factors = 0;

    // Name similarity
    const nameSimilarity = this.calculateNameSimilarity(file1.name, file2.name);
    similarity += nameSimilarity * 0.4;
    factors += 0.4;

    // Size similarity
    const sizeDiff = Math.abs(file1.size - file2.size);
    const avgSize = (file1.size + file2.size) / 2;
    const sizeSimilarity =
      avgSize > 0 ? Math.max(0, 1 - sizeDiff / avgSize) : 1;
    similarity += sizeSimilarity * 0.3;
    factors += 0.3;

    // Type similarity
    const typeSimilarity = file1.type === file2.type ? 1 : 0;
    similarity += typeSimilarity * 0.3;
    factors += 0.3;

    return factors > 0 ? similarity / factors : 0;
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    // Simple Levenshtein distance
    const longer = name1.length > name2.length ? name1 : name2;
    const shorter = name1.length > name2.length ? name2 : name1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + cost, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private async generateFileHash(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (error) {
      console.warn("Failed to generate hash for file:", file.name, error);
      // Fallback to simple hash based on size and name
      return `${file.size}-${file.name}-${file.lastModified}`;
    }
  }

  private getFileTypeFromExtension(filename: string): string {
    const ext = filename.toLowerCase().split(".").pop();
    const typeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    return typeMap[ext || ""] || "application/octet-stream";
  }

  private calculateSpaceSavings(groups: DuplicateGroup[]): number {
    let savings = 0;

    for (const group of groups) {
      if (group.files.length > 1) {
        // Calculate space that would be saved by keeping only the first file
        const keepFile = group.files[0];
        const duplicateFiles = group.files.slice(1);
        savings += duplicateFiles.reduce((sum, file) => sum + file.size, 0);
      }
    }

    return savings;
  }

  // Utility methods
  getFormattedSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  exportResults(result: DetectionResult): string {
    const report = {
      summary: {
        totalFiles: result.totalFiles,
        duplicateGroups: result.duplicateGroups.length,
        spaceSavings: this.getFormattedSize(result.spaceSavings),
        processingTime: `${result.processingTime}ms`,
      },
      groups: result.duplicateGroups.map((group) => ({
        id: group.id,
        category: group.category,
        similarity: `${(group.similarity * 100).toFixed(1)}%`,
        files: group.files.map((file) => ({
          name: file.name,
          path: file.path,
          size: this.getFormattedSize(file.size),
        })),
      })),
      settings: this.settings,
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(report, null, 2);
  }
}

// Export singleton instance
export const duplicateDetectionEngine = new DuplicateDetectionEngine();
export default duplicateDetectionEngine;
