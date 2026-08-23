const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('knoux', Object.freeze({
  appInfo: () => ipcRenderer.invoke('knoux:app-info'),
  listTools: () => ipcRenderer.invoke('knoux:tools-list'),
  getSettings: () => ipcRenderer.invoke('knoux:settings-get'),
  updateSettings: (patch) => ipcRenderer.invoke('knoux:settings-update', patch),
  listHistory: () => ipcRenderer.invoke('knoux:history-list'),
  chooseFolder: () => ipcRenderer.invoke('knoux:folder-choose'),
  chooseFile: () => ipcRenderer.invoke('knoux:file-choose'),
  runTool: (request) => ipcRenderer.invoke('knoux:tool-run', request),
  cancelOperation: (operationId) => ipcRenderer.invoke('knoux:operation-cancel', operationId),
  openPath: (target) => ipcRenderer.invoke('knoux:open-path', target),
  onOperationEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('knoux:operation-event', listener);
    return () => ipcRenderer.removeListener('knoux:operation-event', listener);
  }
}));
