export interface ImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  url: string;
  thumbnail?: string;
  processed: boolean;
  analysis?: ImageAnalysis;
  category?: ImageCategory;
  tags: string[];
  createdAt: Date;
  processedAt?: Date;
}

export interface ImageAnalysis {
  description: string;
  confidence: number;
  objects: DetectedObject[];
  faces: FaceDetection[];
  text: OCRResult;
  isNSFW: boolean;
  nsfwScore: number;
  dominantColors: string[];
  duplicateHash: string;
  emotions?: string[];
  location?: string;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface FaceDetection {
  bbox: BoundingBox;
  confidence: number;
  landmarks?: FaceLandmark[];
  expressions?: FaceExpression[];
  age?: number;
  gender?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceLandmark {
  type: string;
  x: number;
  y: number;
}

export interface FaceExpression {
  expression: string;
  confidence: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  language?: string;
  words: OCRWord[];
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export type ImageCategory =
  | "selfies"
  | "documents"
  | "screenshots"
  | "nature"
  | "food"
  | "art"
  | "nsfw"
  | "duplicates"
  | "general"
  | "memes"
  | "receipts"
  | "qr-codes"
  | "pets"
  | "vehicles"
  | "architecture";

export interface ProcessingStats {
  total: number;
  processed: number;
  successful: number;
  errors: number;
  categorized: Record<ImageCategory, number>;
  avgProcessingTime: number;
  startTime: Date;
  endTime?: Date;
}

export interface FilterOptions {
  categories: ImageCategory[];
  hasText: boolean;
  hasFaces: boolean;
  isNSFW: boolean;
  minSize: number;
  maxSize: number;
  dateRange: {
    start?: Date;
    end?: Date;
  };
  tags: string[];
  searchQuery: string;
}

export interface OrganizeOptions {
  autoRename: boolean;
  createSubfolders: boolean;
  moveFiles: boolean;
  addTags: boolean;
  generateThumbnails: boolean;
  extractText: boolean;
  detectFaces: boolean;
  checkNSFW: boolean;
  findDuplicates: boolean;
  qualityThreshold: number;
}

export interface AIModel {
  name: string;
  type: "classification" | "detection" | "ocr" | "nsfw";
  loaded: boolean;
  loading: boolean;
  error?: string;
  version: string;
  size: string;
  progress?: number; // 0-100
}

export interface ProcessingProgress {
  current: number;
  total: number;
  status: "idle" | "loading" | "processing" | "complete" | "error";
  currentFile?: string;
  stage: "upload" | "analysis" | "classification" | "organization" | "complete";
  message: string;
  estimatedTimeLeft?: number;
}

export interface SmartSuggestion {
  id: string;
  type: "rename" | "category" | "tag" | "merge" | "delete";
  confidence: number;
  description: string;
  imageIds: string[];
  action: () => Promise<void>;
  preview?: string;
}
