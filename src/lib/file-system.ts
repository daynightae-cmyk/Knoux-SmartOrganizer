// File System Access API for local folder management
export class FileSystemManager {
  private static instance: FileSystemManager;
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private selectedPath: string = "";

  static getInstance(): FileSystemManager {
    if (!this.instance) {
      this.instance = new FileSystemManager();
    }
    return this.instance;
  }

  // Check if File System Access API is supported
  isSupported(): boolean {
    return "showDirectoryPicker" in window;
  }

  // Select a local directory
  async selectDirectory(): Promise<{ path: string; files: File[] }> {
    if (!this.isSupported()) {
      throw new Error("File System Access API غير مدعوم في هذا المتصفح");
    }

    try {
      this.directoryHandle = await (window as any).showDirectoryPicker({
        mode: "read",
      });

      this.selectedPath = this.directoryHandle.name;
      const files = await this.scanDirectoryForImages();

      return {
        path: this.selectedPath,
        files,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("تم إلغاء اختيار المجلد");
      }
      throw new Error(`فشل في الوصول للمجلد: ${error.message}`);
    }
  }

  // Scan directory for image files
  private async scanDirectoryForImages(): Promise<File[]> {
    if (!this.directoryHandle) return [];

    const imageFiles: File[] = [];
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".bmp",
      ".tiff",
      ".svg",
    ];

    async function scanDirectory(
      dirHandle: FileSystemDirectoryHandle,
      currentPath: string = "",
    ) {
      for await (const [name, handle] of dirHandle.entries()) {
        const fullPath = currentPath ? `${currentPath}/${name}` : name;

        if (handle.kind === "file") {
          const extension = name.toLowerCase().substring(name.lastIndexOf("."));
          if (imageExtensions.includes(extension)) {
            try {
              const file = await handle.getFile();
              // Add path info to file object
              Object.defineProperty(file, "fullPath", {
                value: fullPath,
                writable: false,
              });
              imageFiles.push(file);
            } catch (error) {
              console.warn(`Could not access file: ${fullPath}`, error);
            }
          }
        } else if (handle.kind === "directory") {
          // Recursively scan subdirectories (limit depth to avoid infinite loops)
          const pathDepth = fullPath.split("/").length;
          if (pathDepth < 5) {
            // Max 5 levels deep
            await scanDirectory(handle, fullPath);
          }
        }
      }
    }

    await scanDirectory(this.directoryHandle);
    return imageFiles;
  }

  // Get currently selected path
  getSelectedPath(): string {
    return this.selectedPath;
  }

  // Check if a directory is selected
  hasSelectedDirectory(): boolean {
    return !!this.directoryHandle;
  }

  // Create organized folders in the selected directory
  async createOrganizedFolders(): Promise<boolean> {
    if (!this.directoryHandle) return false;

    const folders = [
      "منظم_بالذكاء_الاصطناعي",
      "منظم_بالذكاء_الاصطناعي/صور_شخصية",
      "منظم_بالذكاء_الاصطناعي/وثائق",
      "منظم_بالذكاء_الاصطناعي/لقطات_شا��ة",
      "منظم_بالذكاء_الاصطناعي/طبيعة",
      "منظم_بالذكاء_الاصطناعي/طعام",
      "منظم_بالذكاء_الاصطناعي/فن",
      "منظم_بالذكاء_الاصطناعي/مكرر",
      "منظم_بالذكاء_الاصطناعي/عام",
    ];

    try {
      let currentHandle = this.directoryHandle;

      // Create main folder
      const mainFolder = await currentHandle.getDirectoryHandle(
        "منظم_بالذكاء_الاصطناعي",
        { create: true },
      );

      // Create subfolders
      const subfolders = [
        "صور_شخصية",
        "وثائق",
        "لقطات_شاشة",
        "طبيعة",
        "طعام",
        "فن",
        "مكرر",
        "عام",
      ];

      for (const folder of subfolders) {
        await mainFolder.getDirectoryHandle(folder, { create: true });
      }

      return true;
    } catch (error) {
      console.error("Failed to create folders:", error);
      return false;
    }
  }

  // Move file to organized folder (simulation - browsers don't allow direct file manipulation)
  async simulateFileOrganization(
    fileName: string,
    category: string,
  ): Promise<boolean> {
    // In a real implementation, this would move files
    // For web apps, we can only provide instructions to the user
    console.log(`Would move ${fileName} to category: ${category}`);
    return true;
  }

  // Clear selected directory
  clearSelection(): void {
    this.directoryHandle = null;
    this.selectedPath = "";
  }
}

export const fileSystemManager = FileSystemManager.getInstance();
