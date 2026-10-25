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
