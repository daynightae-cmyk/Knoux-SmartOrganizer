const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('knoux', Object.freeze({
  appInfo: () => ipcRenderer.invoke('knoux:app-info'),
  completeFirstRun: () => ipcRenderer.invoke('knoux:first-run-complete'),
  exportDiagnostics: () => ipcRenderer.invoke('knoux:diagnostics-export'),
  listTools: () => ipcRenderer.invoke('knoux:tools-list'),
  getSettings: () => ipcRenderer.invoke('knoux:settings-get'),
  updateSettings: (patch) => ipcRenderer.invoke('knoux:settings-update', patch),
  exportSettings: () => ipcRenderer.invoke('knoux:settings-export'),
  importSettings: () => ipcRenderer.invoke('knoux:settings-import'),
  resetSettingsSection: (section) => ipcRenderer.invoke('knoux:settings-reset-section', section),
  resetSettings: () => ipcRenderer.invoke('knoux:settings-reset'),
  listHistory: () => ipcRenderer.invoke('knoux:history-list'),
  exportHistory: (format) => ipcRenderer.invoke('knoux:history-export', format),
  listAutomations: () => ipcRenderer.invoke('knoux:automation-list'),
  createAutomation: (input) => ipcRenderer.invoke('knoux:automation-create', input),
  removeAutomation: (id) => ipcRenderer.invoke('knoux:automation-remove', id),
  setAutomationEnabled: (request) => ipcRenderer.invoke('knoux:automation-set-enabled', request),
  runAutomation: (id) => ipcRenderer.invoke('knoux:automation-run', id),
  chooseFolder: () => ipcRenderer.invoke('knoux:folder-choose'),
  chooseFile: () => ipcRenderer.invoke('knoux:file-choose'),
  runTool: (request) => ipcRenderer.invoke('knoux:tool-run', request),
  cancelOperation: (operationId) => ipcRenderer.invoke('knoux:operation-cancel', operationId),
  openPath: (target) => ipcRenderer.invoke('knoux:open-path', target),
  onSettingsChanged: (callback) => { const listener = (_event, payload) => callback(payload); ipcRenderer.on('knoux:settings-changed', listener); return () => ipcRenderer.removeListener('knoux:settings-changed', listener); },
  onOperationEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('knoux:operation-event', listener);
    return () => ipcRenderer.removeListener('knoux:operation-event', listener);
  }
}));
