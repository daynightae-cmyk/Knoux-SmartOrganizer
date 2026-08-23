// src/hooks/useImageStore.ts
import { create } from "zustand";

// Define types inline to avoid dependency issues
interface ImageData {
  id: string;
  file: File;
  name: string;
  previewUrl: string;
  embeddings?: number[];
  analysis?: any;
}

interface ImageStoreState {
  images: Map<string, ImageData>;
  selectedImages: Set<string>;
  currentFilter: string;
  searchQuery: string;
  addImage: (image: ImageData) => void;
  removeImage: (id: string) => void;
  selectImage: (id: string) => void;
  deselectImage: (id: string) => void;
  clearSelection: () => void;
  setFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
}

// إنشاء متجر Zustand
export const useImageStore = create<ImageStoreState>((set, get) => ({
  images: new Map(),
  selectedImages: new Set(),
  currentFilter: "",
  searchQuery: "",

  addImage: (image: ImageData) => {
    set((state) => {
      const newImages = new Map(state.images);
      newImages.set(image.id, image);
      return { images: newImages };
    });
  },

  removeImage: (id: string) => {
    set((state) => {
      const newImages = new Map(state.images);
      const newSelected = new Set(state.selectedImages);
      newImages.delete(id);
      newSelected.delete(id);
      return { images: newImages, selectedImages: newSelected };
    });
  },

  selectImage: (id: string) => {
    set((state) => {
      const newSelected = new Set(state.selectedImages);
      newSelected.add(id);
      return { selectedImages: newSelected };
    });
  },

  deselectImage: (id: string) => {
    set((state) => {
      const newSelected = new Set(state.selectedImages);
      newSelected.delete(id);
      return { selectedImages: newSelected };
    });
  },

  clearSelection: () => {
    set({ selectedImages: new Set() });
  },

  setFilter: (filter: string) => {
    set({ currentFilter: filter });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
}));

export default useImageStore;
