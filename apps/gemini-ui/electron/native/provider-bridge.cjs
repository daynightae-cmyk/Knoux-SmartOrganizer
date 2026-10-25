'use strict';

/**
 * KNOuX Gemini — read-only native provider adapter.
 *
 * The root repository already contains documented Windows providers. This
 * module reuses that implementation instead of introducing a second engine.
 * It only exposes bounded read-only summaries and a user-initiated folder
 * picker. It never builds PowerShell from renderer input and never mutates the
 * machine.
 */

const path = require('node:path');
const fs = require('node:fs');

const PROVIDER_RELATIVE = path.resolve(__dirname, '..', '..', '..', '..', 'electron', 'windows-providers.cjs');
const MAX_SERVICE_SUMMARY_TIMEOUT_MS = 30000;
const MAX_SYSTEM_SUMMARY_TIMEOUT_MS = 30000;

let cachedProvider = null;
let cachedProviderPath = null;

function resolveProviderPath({ isPackaged }) {
  if (isPackaged) {
    return path.join(process.resourcesPath, 'native', 'windows-providers.cjs');
  }
  return PROVIDER_RELATIVE;
}

function loadProvider({ isPackaged }) {
  const target = resolveProviderPath({ isPackaged });
  if (cachedProvider && cachedProviderPath === target) return cachedProvider;
  if (!fs.existsSync(target)) {
    const error = new Error('The read-only Windows provider module is not installed.');
    error.code = 'PROVIDER_MISSING';
    error.retryable = false;
    throw error;
  }
  // The provider is a CommonJS module that uses only Node built-ins. It is
  // loaded from the root repository in development and from extraResources in
  // the packaged application. No renderer input reaches this require.
  cachedProvider = require(target);
  cachedProviderPath = target;
  return cachedProvider;
}

function fixturesEnabled({ isPackaged, env = process.env }) {
  return !isPackaged && env && env.KNOUX_NATIVE_FIXTURES === '1';
}

function nowIso() {
  return new Date().toISOString();
}

function fixtureSystemSummary() {
  return {
    platform: 'fixture',
    osCaption: 'DEVELOPMENT FIXTURE — not a Windows reading',
    osVersion: 'fixture',
    osBuild: 'fixture',
    osArchitecture: 'fixture',
    uptimeSeconds: 0,
    uptimeSource: 'fixture',
    cpuModel: 'Fixture CPU (no native query)',
    cpuCores: null,
    cpuLogicalProcessors: null,
    cpuLoadPercent: null,
    cpuLoadSource: 'fixture',
    memoryTotalBytes: null,
    memoryFreeBytes: null,
    memoryUsedPercent: null,
    systemDrive: null,
    systemDriveFreeBytes: null,
    systemDriveTotalBytes: null,
    volumes: [],
    degraded: true,
    degradationReason: 'KNOUX_NATIVE_FIXTURES=1 — development fixture, never a measured reading.',
  };
}

function fixtureServicesSummary() {
  return {
    total: 0,
    running: 0,
    stopped: 0,
    automatic: 0,
    manual: 0,
    disabled: 0,
    protectedCount: null,
    provider: 'DEVELOPMENT FIXTURE — no Windows service query',
  };
}

function toVolume(disk) {
  return {
    deviceId: disk?.deviceId ?? null,
    label: disk?.volumeName ?? null,
    fileSystem: disk?.fileSystem ?? null,
    sizeBytes: disk?.sizeBytes ?? null,
    freeBytes: disk?.freeBytes ?? null,
  };
}

async function readSystemSummary({ isPackaged, env }) {
  if (fixturesEnabled({ isPackaged, env })) {
    return {
      status: 'available',
      source: 'dev-fixture',
      observedAt: nowIso(),
      permission: 'read-only',
      warnings: ['Development fixture — not measured on this machine.'],
      provenance: { provider: 'dev-fixture', mode: 'fixture', observedAt: nowIso(), coverage: 'unknown', warnings: ['Development fixture'] },
      data: fixtureSystemSummary(),
    };
  }

  if (process.platform !== 'win32') {
    return {
      status: 'unsupported',
      source: 'Windows providers',
      observedAt: nowIso(),
      permission: 'read-only',
      warnings: ['This platform does not expose the Windows CIM providers.'],
      error: { code: 'PLATFORM_UNSUPPORTED', message: 'Windows measurements are only available on Windows.', retryable: false },
    };
  }

  try {
    const providers = loadProvider({ isPackaged });
    const raw = await providers.collectSystemHealth({ timeout: MAX_SYSTEM_SUMMARY_TIMEOUT_MS });
    const data = {
      platform: raw.platform,
      osCaption: raw.osCaption ?? null,
      osVersion: raw.osVersion ?? null,
      osBuild: raw.osBuild ?? null,
      osArchitecture: raw.osArchitecture ?? null,
      uptimeSeconds: raw.uptimeSeconds ?? null,
      uptimeSource: raw.uptimeSource || 'unavailable',
      cpuModel: raw.cpuModel ?? null,
      cpuCores: raw.cpuCores ?? null,
      cpuLogicalProcessors: raw.cpuLogicalProcessors ?? null,
      cpuLoadPercent: raw.cpuLoadPercent ?? null,
      cpuLoadSource: raw.cpuLoadSource || 'unavailable',
      memoryTotalBytes: raw.memoryTotalBytes ?? null,
      memoryFreeBytes: raw.memoryFreeBytes ?? null,
      memoryUsedPercent: raw.memoryUsedPercent ?? null,
      systemDrive: raw.systemDrive ?? null,
      systemDriveFreeBytes: raw.systemDriveFreeBytes ?? null,
      systemDriveTotalBytes: raw.systemDriveTotalBytes ?? null,
      volumes: Array.isArray(raw.volumes) ? raw.volumes.map(toVolume) : [],
      degraded: Boolean(raw.degraded),
      ...(raw.degradationReason ? { degradationReason: raw.degradationReason } : {}),
    };
    const warnings = [];
    if (raw.degraded && raw.degradationReason) warnings.push(String(raw.degradationReason));
    return {
      status: raw.degraded ? 'partial' : 'complete',
      source: raw.provider || 'Win32 system providers',
      observedAt: nowIso(),
      permission: 'read-only',
      warnings,
      provenance: {
        provider: raw.provider || 'Win32 system providers',
        mode: 'measured',
        observedAt: nowIso(),
        coverage: raw.degraded ? 'partial' : 'full',
        permissions: ['read-only'],
        warnings,
      },
      data,
    };
  } catch (error) {
    return {
      status: error?.code === 'PROVIDER_MISSING' ? 'unavailable' : 'failed',
      source: 'Win32 system providers',
      observedAt: nowIso(),
      permission: 'read-only',
      warnings: [],
      error: {
        code: typeof error?.code === 'string' ? error.code : 'PROVIDER_FAILED',
        message:
          error?.code === 'PROVIDER_MISSING'
            ? 'The read-only Windows provider module is not installed.'
            : 'The read-only Windows system provider did not return a measurement.',
        retryable: true,
      },
    };
  }
}

async function readServicesSummary({ isPackaged, env }) {
  if (fixturesEnabled({ isPackaged, env })) {
    return {
      status: 'available',
      source: 'dev-fixture',
      observedAt: nowIso(),
      permission: 'read-only',
      warnings: ['Development fixture — no Windows service query was performed.'],
      provenance: { provider: 'dev-fixture', mode: 'fixture', observedAt: nowIso(), coverage: 'unknown', warnings: ['Development fixture'] },
      data: fixtureServicesSummary(),
    };
  }

  if (process.platform !== 'win32') {
    return {
      status: 'unsupported',
      source: 'Win32_Service',
      observedAt: nowIso(),
      permission: 'read-only',
      warnings: ['Windows services are only available on Windows.'],
      error: { code: 'PLATFORM_UNSUPPORTED', message: 'Windows service inventory is only available on Windows.', retryable: false },
    };
  }

  try {
    const providers = loadProvider({ isPackaged });
    const services = await providers.collectServices({ timeout: MAX_SERVICE_SUMMARY_TIMEOUT_MS });
    const counts = {
      total: services.length,
      running: 0,
      stopped: 0,
      automatic: 0,
      manual: 0,
      disabled: 0,
      protectedCount: null,
      provider: 'Win32_Service',
    };
    for (const service of services) {
      if (service.running) counts.running += 1;
      if (service.state === 'Stopped') counts.stopped += 1;
      if (service.startupType === 'automatic') counts.automatic += 1;
      if (service.startupType === 'manual') counts.manual += 1;
      if (service.startupType === 'disabled') counts.disabled += 1;
    }
    return {
      status: 'complete',
      source: 'Win32_Service',
      observedAt: nowIso(),
      permission: 'read-only',
      warnings: ['Service control is not exposed by the platform bridge; later section providers own mutations.'],
      provenance: {
        provider: 'Win32_Service',
        mode: 'measured',
        observedAt: nowIso(),
        coverage: 'full',
        permissions: ['read-only'],
      },
      data: counts,
    };
  } catch (error) {
    return {
      status: error?.code === 'PROVIDER_MISSING' ? 'unavailable' : 'failed',
      source: 'Win32_Service',
      observedAt: nowIso(),
      permission: 'read-only',
      warnings: [],
      error: {
        code: typeof error?.code === 'string' ? error.code : 'PROVIDER_FAILED',
        message: 'The read-only Windows service provider did not return a summary.',
        retryable: true,
      },
    };
  }
}

async function chooseFolder({ isPackaged, env, parentWindow }) {
  if (fixturesEnabled({ isPackaged, env })) {
    return {
      status: 'available',
      source: 'dev-fixture',
      observedAt: nowIso(),
      permission: 'user-initiated',
      warnings: ['Development fixture — no system folder picker was opened.'],
      provenance: { provider: 'dev-fixture', mode: 'fixture', observedAt: nowIso(), coverage: 'unknown' },
      data: { canceled: true, path: null },
    };
  }

  // dialog is only required inside Electron. Keeping it here means the folder
  // picker cannot be reached from a browser preview.
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(parentWindow, {
    title: 'Select a folder (read-only; no scan)',
    buttonLabel: 'Use folder',
    properties: ['openDirectory', 'dontAddToRecent'],
  });
  if (result.canceled || !result.filePaths?.[0]) {
    return {
      status: 'cancelled',
      source: 'Electron dialog.showOpenDialog',
      observedAt: nowIso(),
      permission: 'user-initiated',
      warnings: ['No folder was selected.'],
      data: { canceled: true, path: null },
    };
  }
  return {
    status: 'complete',
    source: 'Electron dialog.showOpenDialog',
    observedAt: nowIso(),
    permission: 'user-initiated',
    warnings: ['The platform gate does not scan or read the selected folder.'],
    provenance: {
      provider: 'Electron dialog.showOpenDialog',
      mode: 'measured',
      observedAt: nowIso(),
      coverage: 'full',
      permissions: ['user-initiated'],
    },
    data: { canceled: false, path: result.filePaths[0] },
  };
}

module.exports = {
  PROVIDER_RELATIVE,
  resolveProviderPath,
  fixturesEnabled,
  loadProvider,
  readSystemSummary,
  readServicesSummary,
  chooseFolder,
};
