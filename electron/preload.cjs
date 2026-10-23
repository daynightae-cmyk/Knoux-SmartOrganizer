const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('knoux', Object.freeze({
  appInfo: () => ipcRenderer.invoke('knoux:app-info'),
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
  exportDiagnostics: () => ipcRenderer.invoke('knoux:diagnostics-export'),
  codeSigning: () => ipcRenderer.invoke('knoux:code-signing'),
  clipboardStatus: () => ipcRenderer.invoke('knoux:clipboard-status'),
  clipboardList: (request) => ipcRenderer.invoke('knoux:clipboard-list', request),
  clipboardGet: (id) => ipcRenderer.invoke('knoux:clipboard-get', id),
  clipboardSetPinned: (request) => ipcRenderer.invoke('knoux:clipboard-pin', request),
  clipboardDelete: (id) => ipcRenderer.invoke('knoux:clipboard-delete', id),
  clipboardClear: () => ipcRenderer.invoke('knoux:clipboard-clear'),
  clipboardCopyBack: (id) => ipcRenderer.invoke('knoux:clipboard-copy-back', id),
  clipboardOpenSource: (id) => ipcRenderer.invoke('knoux:clipboard-open-source', id),
  onClipboardChanged: (callback) => { const listener = (_event, payload) => callback(payload); ipcRenderer.on('knoux:clipboard-changed', listener); return () => ipcRenderer.removeListener('knoux:clipboard-changed', listener); },
  onSettingsChanged: (callback) => { const listener = (_event, payload) => callback(payload); ipcRenderer.on('knoux:settings-changed', listener); return () => ipcRenderer.removeListener('knoux:settings-changed', listener); },
  onOperationEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('knoux:operation-event', listener);
    return () => ipcRenderer.removeListener('knoux:operation-event', listener);
  }
}));

/* Studio is an explicit, narrowly scoped bridge. No raw ipcRenderer exposure. */
const studioChannels = Object.freeze({
  pick:'knoux:studio:pick', sources:'knoux:studio:sources', remove:'knoux:studio:remove',
  scan:'knoux:studio:scan', cancel:'knoux:studio:cancel', query:'knoux:studio:query',
  reveal:'knoux:studio:reveal', event:'knoux:studio:event',
  pickDestination:'knoux:studio:destination-pick', destinations:'knoux:studio:destinations', listDestination:'knoux:studio:destination-list',
  validateFolder:'knoux:studio:folder-validate', createFolder:'knoux:studio:folder-create',
  buildPlan:'knoux:studio:plan-build', executePlan:'knoux:studio:plan-execute',
  cancelExecution:'knoux:studio:execution-cancel', history:'knoux:studio:history',
  undoPreview:'knoux:studio:undo-preview', undoApply:'knoux:studio:undo-apply',
  thumbnail:'knoux:studio:thumbnail'
});
contextBridge.exposeInMainWorld('knouxStudio', Object.freeze({
  pickSource: () => ipcRenderer.invoke(studioChannels.pick),
  listSources: () => ipcRenderer.invoke(studioChannels.sources),
  removeSource: id => ipcRenderer.invoke(studioChannels.remove,id),
  scan: request => ipcRenderer.invoke(studioChannels.scan,request),
  cancel: operationId => ipcRenderer.invoke(studioChannels.cancel,operationId),
  query: request => ipcRenderer.invoke(studioChannels.query,request),
  reveal: request => ipcRenderer.invoke(studioChannels.reveal,request),
  pickDestination: () => ipcRenderer.invoke(studioChannels.pickDestination),
  listDestinations: () => ipcRenderer.invoke(studioChannels.destinations),
  listDestination: request => ipcRenderer.invoke(studioChannels.listDestination,request),
  validateFolder: request => ipcRenderer.invoke(studioChannels.validateFolder,request),
  createFolder: request => ipcRenderer.invoke(studioChannels.createFolder,request),
  buildPlan: request => ipcRenderer.invoke(studioChannels.buildPlan,request),
  executePlan: request => ipcRenderer.invoke(studioChannels.executePlan,request),
  cancelExecution: request => ipcRenderer.invoke(studioChannels.cancelExecution,request),
  listHistory: () => ipcRenderer.invoke(studioChannels.history),
  previewUndo: request => ipcRenderer.invoke(studioChannels.undoPreview,request),
  applyUndo: request => ipcRenderer.invoke(studioChannels.undoApply,request),
  thumbnail: request => ipcRenderer.invoke(studioChannels.thumbnail,request),
  onEvent: callback => {
    const listener = (_event,data) => callback(data);
    ipcRenderer.on(studioChannels.event,listener);
    return () => ipcRenderer.removeListener(studioChannels.event,listener);
  }
}));
