'use strict';

/**
 * KNOuX Gemini — minimal preload.
 *
 * The renderer receives four fixed read-only capabilities plus window chrome
 * controls. There is no raw ipcRenderer, no generic invoke, no Node, no path or
 * environment access. Channel names mirror shared/native-contract.json; the
 * native contract test checks the mirror.
 */

const { contextBridge, ipcRenderer } = require('electron');

const CONTRACT_VERSION = 1;
const CHANNELS = Object.freeze({
  status: 'knoux:native:v1:status',
  systemSummary: 'knoux:native:v1:system-summary',
  servicesSummary: 'knoux:native:v1:services-summary',
  chooseFolder: 'knoux:native:v1:choose-folder',
  windowControl: 'knoux:window:v1:control',
  studioSources: 'knoux:studio:v1:sources',
  studioSourceChoose: 'knoux:studio:v1:source-choose',
  studioSourceRemove: 'knoux:studio:v1:source-remove',
  studioInventoryScan: 'knoux:studio:v1:inventory-scan',
  studioInventoryCancel: 'knoux:studio:v1:inventory-cancel',
  studioInventoryQuery: 'knoux:studio:v1:inventory-query',
  studioThumbnails: 'knoux:studio:v1:thumbnails',
  studioDestinationChoose: 'knoux:studio:v1:destination-choose',
  studioPlanPreview: 'knoux:studio:v1:plan-preview',
  studioPreviewHistory: 'knoux:studio:v1:preview-history',
  studioEvent: 'knoux:studio:v1:event',
});
const WINDOW_ACTIONS = Object.freeze(['minimize', 'maximize', 'close']);

contextBridge.exposeInMainWorld(
  'knouxShell',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    getStatus: () => ipcRenderer.invoke(CHANNELS.status),
    getSystemSummary: () => ipcRenderer.invoke(CHANNELS.systemSummary),
    getServicesSummary: () => ipcRenderer.invoke(CHANNELS.servicesSummary),
    chooseFolder: () => ipcRenderer.invoke(CHANNELS.chooseFolder),
    windowControl: (action) => {
      if (!WINDOW_ACTIONS.includes(action)) {
        return Promise.resolve({
          contractVersion: CONTRACT_VERSION,
          capability: 'window.control',
          status: 'failed',
          error: { code: 'INVALID_WINDOW_ACTION', message: 'Unsupported window action.', retryable: false },
        });
      }
      return ipcRenderer.invoke(CHANNELS.windowControl, action);
    },
  })
);

/* Studio v1 uses a separate namespace so the platform shell and the Studio
   domain stay independently auditable. All channels are fixed; there is no
   generic invoke and no raw ipcRenderer exposure. */
contextBridge.exposeInMainWorld(
  'knouxStudioV1',
  Object.freeze({
    contractVersion: CONTRACT_VERSION,
    listSources: () => ipcRenderer.invoke(CHANNELS.studioSources),
    chooseSource: () => ipcRenderer.invoke(CHANNELS.studioSourceChoose),
    removeSource: (sourceId) => ipcRenderer.invoke(CHANNELS.studioSourceRemove, { sourceId }),
    scanSource: (sourceId) => ipcRenderer.invoke(CHANNELS.studioInventoryScan, { sourceId }),
    cancelScan: (sourceId) => ipcRenderer.invoke(CHANNELS.studioInventoryCancel, { sourceId }),
    query: (request) => ipcRenderer.invoke(CHANNELS.studioInventoryQuery, request),
    thumbnails: (sourceId, fileIds) => ipcRenderer.invoke(CHANNELS.studioThumbnails, { sourceId, fileIds }),
    chooseDestination: () => ipcRenderer.invoke(CHANNELS.studioDestinationChoose),
    previewPlan: (request) => ipcRenderer.invoke(CHANNELS.studioPlanPreview, request),
    previewHistory: () => ipcRenderer.invoke(CHANNELS.studioPreviewHistory),
    onEvent: (callback) => {
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on(CHANNELS.studioEvent, listener);
      return () => ipcRenderer.removeListener(CHANNELS.studioEvent, listener);
    },
  })
);
