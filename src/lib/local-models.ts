export class LocalModelManager {
  private static instance: LocalModelManager;

  static getInstance(): LocalModelManager {
    if (!this.instance) {
      this.instance = new LocalModelManager();
    }
    return this.instance;
  }

  // Check if models are available locally
  async checkLocalModels(): Promise<{ [key: string]: boolean }> {
    const models = {
      "face-detection": false,
      classification: false,
      ocr: false,
      nsfw: false,
    };

    // Check localStorage for model status
    const savedModels = localStorage.getItem("knoux-models-status");
    if (savedModels) {
      const parsedModels = JSON.parse(savedModels);
      Object.assign(models, parsedModels);
    }

    return models;
  }

  // Save model status locally
  saveModelStatus(modelKey: string, isAvailable: boolean): void {
    const current = this.getStoredModels();
    current[modelKey] = isAvailable;
    localStorage.setItem("knoux-models-status", JSON.stringify(current));
  }

  // Get stored models status
  private getStoredModels(): { [key: string]: boolean } {
    const stored = localStorage.getItem("knoux-models-status");
    return stored ? JSON.parse(stored) : {};
  }

  // Mark all models as available (when user loads them manually)
  markAllModelsAvailable(): void {
    const models = {
      "face-detection": true,
      classification: true,
      ocr: true,
      nsfw: true,
    };
    localStorage.setItem("knoux-models-status", JSON.stringify(models));
    localStorage.setItem("knoux-models-loaded-at", Date.now().toString());
  }

  // Check if models were recently loaded
  areModelsRecentlyLoaded(): boolean {
    const loadedAt = localStorage.getItem("knoux-models-loaded-at");
    if (!loadedAt) return false;

    const loadTime = parseInt(loadedAt);
    const dayInMs = 24 * 60 * 60 * 1000;
    return Date.now() - loadTime < dayInMs; // Valid for 24 hours
  }

  // Reset model status (force re-check)
  resetModelStatus(): void {
    localStorage.removeItem("knoux-models-status");
    localStorage.removeItem("knoux-models-loaded-at");
  }

  // Get model folder paths for user guidance
  getModelPaths(): { [key: string]: string } {
    return {
      "face-detection": "public/models/face-api/",
      classification: "public/models/mobilenet/",
      ocr: "Built-in (Tesseract.js)",
      nsfw: "public/models/nsfwjs/",
    };
  }
}

export const localModelManager = LocalModelManager.getInstance();
