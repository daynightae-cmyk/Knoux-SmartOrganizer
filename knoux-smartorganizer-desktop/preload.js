const { contextBridge, ipcRenderer } = require("electron");

// Expose secure API to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // App Information
  getAppInfo: () => ipcRenderer.invoke("get-app-info"),

  // Settings Management
  getSettings: () => ipcRenderer.invoke("get-settings"),
  setSettings: (settings) => ipcRenderer.invoke("set-settings", settings),

  // Folder Operations
  selectSourceFolder: () => ipcRenderer.invoke("select-source-folder"),
  openFolder: (folderPath) => ipcRenderer.invoke("open-folder", folderPath),

  // AI Processing
  runOrganization: () => ipcRenderer.invoke("run-organization"),
  getStatistics: () => ipcRenderer.invoke("get-statistics"),
  getAdvancedStats: () => ipcRenderer.invoke("get-advanced-stats"),

  // Event Listeners
  onUpdateProgress: (callback) => {
    ipcRenderer.on("update-progress", (_event, message) => callback(message));
  },

  onUpdateProgressPercent: (callback) => {
    ipcRenderer.on("update-progress-percent", (_event, percent) =>
      callback(percent),
    );
  },

  onModelsLoaded: (callback) => {
    ipcRenderer.on("models-loaded", (_event, loaded) => callback(loaded));
  },

  onOrganizationComplete: (callback) => {
    ipcRenderer.on("organization-complete", (_event, result) =>
      callback(result),
    );
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Security: Remove Node.js globals
delete window.require;
delete window.exports;
delete window.module;

console.log("🔒 Preload script loaded - Secure API bridge established");
