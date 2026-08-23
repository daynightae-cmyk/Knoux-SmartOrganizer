/**
 * 🧠 AI Engine Configuration for Knoux SmartOrganizer PRO
 *
 * This file contains configuration and utilities for the AI models
 * used in the application. It centralizes model settings and provides
 * helper functions for AI operations.
 */

// Model Configurations
const AI_MODELS = {
  // Image Classification Model (CLIP)
  classifier: {
    name: "Xenova/clip-vit-base-patch32",
    task: "zero-shot-image-classification",
    labels: [
      // People & Portraits
      "person",
      "people",
      "selfie",
      "portrait",
      "face",
      "human",
      "man",
      "woman",
      "child",
      "baby",
      "family",
      "group",
      "crowd",

      // Nature & Outdoors
      "nature",
      "landscape",
      "outdoor",
      "tree",
      "forest",
      "mountain",
      "sky",
      "cloud",
      "sunset",
      "sunrise",
      "beach",
      "ocean",
      "river",
      "lake",
      "flower",
      "garden",
      "park",
      "field",

      // Animals
      "animal",
      "pet",
      "dog",
      "cat",
      "bird",
      "horse",
      "wildlife",
      "zoo",

      // Food & Dining
      "food",
      "meal",
      "restaurant",
      "dinner",
      "lunch",
      "breakfast",
      "drink",
      "coffee",
      "pizza",
      "cake",
      "fruit",
      "vegetable",
      "cooking",
      "kitchen",

      // Documents & Text
      "document",
      "text",
      "paper",
      "book",
      "page",
      "handwriting",
      "printed",
      "receipt",
      "invoice",
      "letter",
      "form",
      "certificate",

      // Technology & Screenshots
      "screenshot",
      "computer",
      "phone",
      "screen",
      "website",
      "app",
      "interface",
      "technology",
      "device",

      // Transportation
      "car",
      "vehicle",
      "truck",
      "bus",
      "train",
      "plane",
      "bike",
      "motorcycle",
      "transportation",
      "traffic",
      "road",
      "street",

      // Buildings & Architecture
      "building",
      "house",
      "home",
      "architecture",
      "city",
      "urban",
      "construction",
      "bridge",
      "church",
      "office",
      "shop",
      "store",

      // Sports & Activities
      "sport",
      "game",
      "activity",
      "exercise",
      "running",
      "swimming",
      "football",
      "basketball",
      "tennis",
      "gym",

      // Events & Celebrations
      "party",
      "wedding",
      "birthday",
      "celebration",
      "event",
      "ceremony",
      "festival",
      "concert",

      // Art & Culture
      "art",
      "painting",
      "museum",
      "culture",
      "statue",
      "artwork",

      // Shopping & Products
      "shopping",
      "product",
      "clothing",
      "fashion",
      "jewelry",
      "toy",

      // General
      "indoor",
      "room",
      "furniture",
      "decoration",
      "object",
      "item",
    ],
  },

  // Image Captioning Model
  captioner: {
    name: "Xenova/vit-gpt2-image-captioning",
    task: "image-to-text",
    options: {
      max_length: 50,
      num_beams: 4,
      temperature: 0.8,
    },
  },

  // NSFW Detection Model
  nsfw: {
    name: "nsfwjs",
    thresholds: {
      porn: 0.6,
      hentai: 0.6,
      sexy: 0.8,
      neutral: 0.2,
      drawing: 0.7,
    },
  },

  // Face Detection Models
  faceDetection: {
    models: [
      "ssdMobilenetv1",
      "faceLandmark68Net",
      "faceRecognitionNet",
      "ageGenderNet",
    ],
    options: {
      minConfidence: 0.5,
      maxResults: 50,
    },
  },

  // OCR Configuration
  ocr: {
    languages: ["eng", "ara"], // English and Arabic
    options: {
      logger: (m) => {}, // Disable tesseract logging
    },
  },
};

// Classification Mappings
const CLASSIFICATION_MAPPINGS = {
  // Map CLIP results to our folder structure
  folderMappings: {
    selfies: [
      "person",
      "people",
      "selfie",
      "portrait",
      "face",
      "human",
      "man",
      "woman",
    ],
    nature: [
      "nature",
      "landscape",
      "outdoor",
      "tree",
      "forest",
      "mountain",
      "sky",
      "sunset",
      "beach",
      "ocean",
    ],
    food: ["food", "meal", "restaurant", "dinner", "lunch", "drink", "cooking"],
    documents: ["document", "text", "paper", "book", "receipt", "form"],
    screenshots: ["screenshot", "computer", "screen", "website", "app"],
    animals: ["animal", "pet", "dog", "cat", "bird", "wildlife"],
    vehicles: ["car", "vehicle", "truck", "bus", "train", "plane"],
    buildings: ["building", "house", "architecture", "city", "bridge"],
    sports: ["sport", "game", "activity", "exercise", "running"],
    events: ["party", "wedding", "birthday", "celebration", "event"],
  },

  // Arabic translations for categories
  arabicNames: {
    selfies: "الصور ��لشخصية",
    nature: "الطبيعة والمناظر",
    food: "الطعام والمشروبات",
    documents: "الوثائق والنصوص",
    screenshots: "لقطات الشاشة",
    animals: "الحيوانات",
    vehicles: "المركبات",
    buildings: "المباني والعمارة",
    sports: "الرياضة والأنشطة",
    events: "المناسبات والفعاليات",
    others: "أخرى",
  },
};

// Processing Configurations
const PROCESSING_CONFIG = {
  // Image processing settings
  image: {
    maxDimension: 1024, // Resize large images for faster processing
    quality: 85, // JPEG quality for processed images
    formats: ["jpg", "jpeg", "png", "bmp", "gif", "webp", "tiff"],
  },

  // Batch processing settings
  batch: {
    size: 5, // Number of images to process in parallel
    delay: 100, // Delay between batches (ms)
  },

  // Confidence thresholds
  confidence: {
    classification: 0.3, // Minimum confidence for classification
    faceDetection: 0.5, // Minimum confidence for face detection
    nsfw: 0.6, // Threshold for NSFW detection
    duplicates: 0.85, // Similarity threshold for duplicates
  },

  // Text detection settings
  text: {
    minLength: 20, // Minimum text length to consider as document
    languages: ["eng", "ara"],
  },
};

// Utility Functions
const AI_UTILS = {
  /**
   * Determine folder based on classification result
   */
  getFolderFromClassification(classification, confidence) {
    if (confidence < PROCESSING_CONFIG.confidence.classification) {
      return "others";
    }

    for (const [folder, keywords] of Object.entries(
      CLASSIFICATION_MAPPINGS.folderMappings,
    )) {
      if (
        keywords.some((keyword) =>
          classification.toLowerCase().includes(keyword.toLowerCase()),
        )
      ) {
        return folder;
      }
    }

    return "others";
  },

  /**
   * Generate smart filename from analysis results
   */
  generateSmartFilename(analysis, originalName) {
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const extension = originalName.split(".").pop();

    // Clean description for filename
    const cleanDescription = analysis.description
      ? analysis.description
          .replace(/[^a-zA-Z0-9\s]/g, "")
          .replace(/\s+/g, "-")
          .toLowerCase()
          .slice(0, 30)
      : "";

    // Build filename components
    const components = [timestamp];

    if (analysis.classification) {
      components.push(analysis.classification.replace(/[^a-zA-Z0-9]/g, ""));
    }

    if (cleanDescription) {
      components.push(cleanDescription);
    }

    if (analysis.faces && analysis.faces.length > 0) {
      components.push(`${analysis.faces.length}faces`);
    }

    return `${components.join("-")}.${extension}`;
  },

  /**
   * Calculate image similarity score
   */
  calculateSimilarity(hash1, hash2) {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) {
      return 0;
    }

    let differences = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) {
        differences++;
      }
    }

    return 1 - differences / hash1.length;
  },

  /**
   * Validate image file
   */
  isValidImageFile(filename) {
    const extension = filename.split(".").pop().toLowerCase();
    return PROCESSING_CONFIG.image.formats.includes(extension);
  },

  /**
   * Get Arabic category name
   */
  getArabicCategoryName(category) {
    return (
      CLASSIFICATION_MAPPINGS.arabicNames[category] ||
      CLASSIFICATION_MAPPINGS.arabicNames.others
    );
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Estimate processing time based on image count
   */
  estimateProcessingTime(imageCount) {
    // Rough estimation: 2-5 seconds per image depending on complexity
    const baseTimePerImage = 3; // seconds
    const totalSeconds = imageCount * baseTimePerImage;

    if (totalSeconds < 60) {
      return `${totalSeconds} ثانية تقريباً`;
    } else if (totalSeconds < 3600) {
      const minutes = Math.round(totalSeconds / 60);
      return `${minutes} دقيقة تقريباً`;
    } else {
      const hours = Math.round(totalSeconds / 3600);
      return `${hours} ساعة تقريباً`;
    }
  },
};

// Export all configurations and utilities
module.exports = {
  AI_MODELS,
  CLASSIFICATION_MAPPINGS,
  PROCESSING_CONFIG,
  AI_UTILS,
};
