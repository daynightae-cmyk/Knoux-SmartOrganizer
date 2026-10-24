const { app, BrowserWindow, dialog, ipcMain, screen, shell, Tray, Menu, nativeImage, clipboard, safeStorage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { z } = require('zod');
const { createSettingsStore } = require('./settings.cjs');
const { createToolRegistry, serializeRegistry } = require('./tool-registry.cjs');
const { OPERATION_SPECS, createPrivilegedRunner } = require('./privileged-runner.cjs');
const { createAutomationStore } = require('./automation.cjs');
const { createStartupManager } = require('./startup-manager.cjs');
const advancedLocal = require('./advanced-local-services.cjs');
const windowsProviders = require('./windows-providers.cjs');
const windowsFs = require('./windows-fs-metadata.cjs');
const appIcons = require('./app-icons.cjs');
const verificationKit = require('./verification.cjs');
const historyExport = require('./history-export.cjs');
const safeMove = require('./safe-move.cjs');
const logRedaction = require('./log-redaction.cjs');
const { createClipboardVault } = require('./clipboard-vault.cjs');
const smokePaths = require('./smoke-paths.cjs');

const execFileAsync = promisify(execFile);
const operations = new Map();
// Upper bound on filesystem entries a single scan will examine. This is a safety
// bound on work, never a result count: tool `limit` inputs slice what is returned.
const SCAN_BUDGET = 50000;
// Distinct executables verified for Authenticode status per process-inventory run.
const SIGNATURE_BUDGET = 40;
let historyMutationQueue = Promise.resolve();
let mainWindow = null;
let tray = null;
let settingsCache = null;
let settingsStore = null;
let automationStore = null;
let startupManager = null;
let clipboardVault = null;
let studioController = null;
let appIconProvider = null;
const startedAt = new Date().toISOString();
const privilegedRunner = createPrivilegedRunner();
const toolDefinitions = createToolRegistry(engine => (context, inputs) => runTool(context, { engine }, inputs), { availabilityResolver: engine => ['serviceControl', 'serviceStartupUndo'].includes(engine) ? privilegedRunner.probeService() : privilegedRunner.probe(engine) });

/**
 * Stops every background worker before the application goes away.
 *
 * The Clipboard Vault polls the Windows clipboard on an interval. A read that
 * is still in flight when Chromium tears the message pump down is a hard
 * error inside the runtime, and the process ends with a breakpoint status
 * instead of the exit code the caller asked for. Stopping the watcher first
 * makes the exit deterministic, for the interactive application and for the
 * headless smoke runs alike.
 */
function shutdownBackgroundWorkers() {
  try { if (clipboardVault) clipboardVault.stop(); } catch { /* the watcher is already gone */ }
  // Icon extraction is bounded work with a child process attached; quitting
  // abandons whatever is still queued instead of waiting for PowerShell.
  try { if (appIconProvider) appIconProvider.dispose(); } catch { /* no extraction is running */ }
  try { if (tray) tray.destroy(); } catch { /* the tray is already gone */ }
}

// Only one interactive instance may own the settings, history and tray. The
// headless automation and smoke paths are exempt, because they are short-lived
// processes that must be able to run while an interactive instance is open.
const isAutomationProcess = process.argv.some(argument => argument.startsWith('--automation-run='));
const isSmokeProcess = process.argv.some(argument => /--knoux-[a-z-]*smoke-output=/.test(argument));
const isHeadlessProcess = isAutomationProcess || isSmokeProcess;
if (!isHeadlessProcess && !app.requestSingleInstanceLock()) app.quit();
if (!isHeadlessProcess) {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

const runRequestSchema = z.object({
  toolId: z.string().min(1).max(64),
  inputs: z.record(z.unknown()).default({}),
  silent: z.boolean().optional()
}).strict();

// The icon bridge accepts opaque identifiers only. A path can never enter this
// channel: the main process resolves icons from the inventory it recorded itself.
const appIconRequestSchema = z.object({
  ids: z.array(z.string().regex(/^app-[0-9a-f]{8,40}$/, 'Icon requests must use an opaque installed-application id')).min(1).max(48)
}).strict();

/**
 * Stable identity for one installed application, derived from the registry
 * evidence that names it. It is what the renderer sees and what the icon provider
 * is allowed to look up; the same machine and inventory always produce the same id.
 */
function installedAppId(app) {
  const tuple = [app?.name, app?.version, app?.packageIdentity, app?.evidence?.keyName, app?.installLocation]
    .map(value => String(value ?? ''))
    .join('|');
  return `app-${crypto.createHash('sha1').update(tuple).digest('hex').slice(0, 16)}`;
}

function appDataPath(name) { return path.join(app.getPath('userData'), name); }
async function ensureAppStorage() { await fsp.mkdir(app.getPath('userData'), { recursive: true }); await fsp.mkdir(appDataPath('logs'), { recursive: true }); }
async function readJson(name, fallback) { try { return JSON.parse(await fsp.readFile(appDataPath(name), 'utf8')); } catch { return fallback; } }
async function writeJson(name, data) { const target = appDataPath(name); const temp = `${target}.${process.pid}.${Date.now()}.${crypto.randomUUID()}.tmp`; await fsp.writeFile(temp, JSON.stringify(data, null, 2), 'utf8'); try { for (let attempt = 0; attempt < 6; attempt += 1) { try { await fsp.rename(temp, target); return; } catch (error) { if (!['EPERM', 'EACCES', 'EBUSY'].includes(error?.code) || attempt === 5) throw error; await new Promise(resolve => setTimeout(resolve, 25 * (attempt + 1))); } } } finally { await fsp.rm(temp, { force: true }).catch(() => {}); } }
// Operation logs are written locally only, but they are still a place where a
// secret could end up. Values are redacted by key, and the log file is rotated
// so it cannot grow without bound on a long-lived installation.
const LOG_MAX_BYTES = logRedaction.LOG_MAX_BYTES;
const LOG_MAX_ARCHIVES = logRedaction.LOG_MAX_ARCHIVES;
let logMutationQueue = Promise.resolve();
async function rotateAuditLog(target) {
  try {
    const stats = await fsp.stat(target);
    if (stats.size < LOG_MAX_BYTES) return;
  } catch { return; }
  try { await fsp.rm(`${target}.${LOG_MAX_ARCHIVES}`, { force: true }); } catch { /* best effort */ }
  for (let index = LOG_MAX_ARCHIVES - 1; index >= 1; index -= 1) {
    try { await fsp.rename(`${target}.${index}`, `${target}.${index + 1}`); } catch { /* best effort */ }
  }
  try { await fsp.rename(target, `${target}.1`); } catch { /* best effort */ }
}
function log(level, event, details = {}) {
  const task = logMutationQueue.catch(() => {}).then(async () => {
    const target = path.join(appDataPath('logs'), 'operations.ndjson');
    await rotateAuditLog(target);
    await fsp.appendFile(target, logRedaction.formatLogLine(level, event, details), 'utf8');
  });
  logMutationQueue = task;
  return task.catch(() => {});
}
async function getSettings() { const value = await settingsStore.get(); settingsCache = value; return value; }
function publishSettings(value) { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('knoux:settings-changed', value); }
async function updateSettings(patch) { const value = await settingsStore.update(patch); settingsCache = value; applyRuntimeSettings(value); publishSettings(value); return value; }
async function history() { return await readJson('history.json', []); }
/** Enforces the documented history.retentionDays / automaticCleanup settings. */
async function pruneHistory(records) {
  const { history: policy } = await getSettings();
  const capped = records.slice(0, 200);
  if (!policy.automaticCleanup) return capped;
  const cutoff = Date.now() - Math.max(1, policy.retentionDays) * 86400000;
  const kept = capped.filter(record => {
    const finished = new Date(record?.finishedAt || 0).getTime();
    return !Number.isFinite(finished) || finished >= cutoff;
  });
  return kept.length === capped.length ? kept : kept;
}
function addHistory(entry) { const task = historyMutationQueue.catch(() => {}).then(async () => { const records = await history(); records.unshift(entry); await writeJson('history.json', await pruneHistory(records)); }); historyMutationQueue = task; return task; }
function emit(event) { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('knoux:operation-event', event); }
function phase(operationId, toolId, phaseName, message, more = {}) {
  const context = operations.get(operationId); const updatedAt = new Date().toISOString();
  if (context) {
    context.phase = phaseName; context.updatedAt = updatedAt;
    if (typeof more.percent === 'number') context.progressValue = more.percent;
    // A finished operation must not keep showing the last intermediate percentage.
    if (phaseName === 'completed') context.progressValue = 100;
    if (phaseName === 'failed' || phaseName === 'cancelled') context.progressValue = null;
  }
  emit({
    operationId, toolId, startedAt: context?.startedAt || updatedAt, updatedAt,
    progress: context?.progressValue ?? null, phase: phaseName, summary: more.result?.summary || {},
    warnings: more.result?.warnings || context?.warnings || [], errors: more.result?.errors || [],
    cancelRequested: Boolean(context?.cancelRequested), undoMetadata: more.result?.undoMetadata || null,
    // A silent operation is the application measuring something for itself.
    // The renderer must not open the operation drawer for it.
    silent: Boolean(context?.silent),
    message, at: updatedAt, ...more
  });
}
function applyRuntimeSettings(settings) {
  app.setLoginItemSettings({ openAtLogin: settings.general.startWithWindows, args: settings.general.startMinimized ? ['--start-minimized'] : [] });
  // The Clipboard Vault reads its own policy from settings, so enabling or
  // pausing capture is a real runtime change, not a stored preference.
  if (clipboardVault) clipboardVault.updateSettings(settings).catch(() => {});
}
let signingInfoCache = null;
let signingInfoPromise = null;
/**
 * The Authenticode state, computed once and served from a cache.
 *
 * Reading the signature starts a PowerShell process, which can take seconds.
 * Doing that on the boot path delayed the first paint of the whole
 * application, so the value is computed in the background and the About
 * section asks for it explicitly.
 */
function resolveSigningInfo() {
  if (signingInfoPromise) return signingInfoPromise;
  signingInfoPromise = codeSigningInfo()
    .then(value => { signingInfoCache = value; return value; })
    .finally(() => { signingInfoPromise = null; });
  return signingInfoPromise;
}

/**
 * Reports the real Authenticode state of the running executable.
 *
 * The path is passed to PowerShell as an argument, never interpolated into the
 * script, and the result is reported as-is. An unsigned build is reported as
 * an unsigned production candidate; it is never described as signed.
 */
async function codeSigningInfo() {
  const unavailable = { state: 'UNAVAILABLE', status: null, publisher: null, timestampPublisher: null, signatureAlgorithm: null, timestamped: false };
  if (process.platform !== 'win32') return unavailable;
  const script = '& { param($target) $s = Get-AuthenticodeSignature -LiteralPath $target; $ts = $null; if ($s.TimeStamperCertificate) { $ts = $s.TimeStamperCertificate.Subject }; [pscustomobject]@{ State = $s.Status.ToString(); Status = $s.StatusMessage; Subject = $s.SignerCertificate.Subject; TimestampSubject = $ts; Algorithm = $s.SignerCertificate.SignatureAlgorithm.FriendlyName } | ConvertTo-Json -Compress }';
  const shells = [
    path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'PowerShell', '7', 'pwsh.exe')
  ].filter(candidate => { try { return fs.existsSync(candidate); } catch { return false; } });
  for (const shell of shells) {
    try {
      const { stdout } = await execFileAsync(shell, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script, process.execPath], { windowsHide: true, timeout: 30000, maxBuffer: 1024 * 1024 });
      const payload = JSON.parse(String(stdout || '').replace(/^\uFEFF/, '').trim());
      const status = String(payload?.State || 'Unknown');
      const signed = status === 'Valid';
      return {
        state: signed ? 'SIGNED_PRODUCTION' : 'UNSIGNED_PRODUCTION_CANDIDATE',
        status,
        statusMessage: payload?.Status ? String(payload.Status).slice(0, 300) : null,
        publisher: payload?.Subject ? String(payload.Subject).slice(0, 300) : null,
        timestampPublisher: payload?.TimestampSubject ? String(payload.TimestampSubject).slice(0, 300) : null,
        signatureAlgorithm: payload?.Algorithm ? String(payload.Algorithm).slice(0, 120) : null,
        timestamped: Boolean(payload?.TimestampSubject)
      };
    } catch { /* try the next shell */ }
  }
  return unavailable;
}
/** Removes local filesystem paths and long free text from diagnostic output. */
function sanitizeDiagnosticText(value) {
  return String(value ?? '').replace(/[A-Za-z]:\\[^\r\n"']+/g, '[local-path]').replace(/\\\\[^\r\n"']+/g, '[unc-path]').slice(0, 500);
}
/**
 * Builds a local support bundle.
 *
 * It contains no clipboard content, no user file content and no settings
 * values beyond a small non-sensitive summary. Local paths are redacted.
 */
async function buildDiagnostics() {
  const settings = await getSettings();
  const toolList = await serializeRegistry(toolDefinitions);
  const records = await history();
  const recent = records.slice(0, 25);
  return {
    generatedAt: new Date().toISOString(),
    app: {
      version: app.getVersion(), startedAt, platform: process.platform, arch: process.arch,
      isPackaged: app.isPackaged, electron: process.versions.electron, chromium: process.versions.chrome,
      node: process.versions.node, releaseChannel: 'stable', codeSigning: await codeSigningInfo()
    },
    toolCapabilities: toolList.map(tool => ({
      id: tool.id, category: tool.category, riskLevel: tool.riskLevel, requiresAdmin: tool.requiresAdmin,
      available: tool.availability.available, capability: tool.availability.capability ?? null,
      reason: tool.availability.reason ? sanitizeDiagnosticText(tool.availability.reason) : null
    })),
    recentOperations: recent.map(record => ({
      operationId: record.operationId, toolId: record.toolId, action: record.action,
      success: Boolean(record.success), partial: Boolean(record.partial),
      startedAt: record.startedAt, finishedAt: record.finishedAt, durationMs: record.durationMs ?? null,
      errors: (record.errors || []).map(sanitizeDiagnosticText)
    })),
    privacy: {
      telemetry: false, usageAnalytics: false, crashReporting: false, clipboardUpload: false,
      clipboardContentsIncluded: false, settingsIncluded: false, pathsRedacted: true
    },
    settingsSummary: {
      locale: settings.localization.locale, theme: settings.appearance.theme, accent: settings.appearance.accent,
      elevationPolicy: settings.security.elevationPolicy, automaticCleanup: settings.history.automaticCleanup,
      retentionDays: settings.history.retentionDays, diagnosticLogging: settings.advanced.diagnosticLogging
    }
  };
}
function argumentValue(name) { const prefix = `--${name}=`; const value = process.argv.find(argument => argument.startsWith(prefix)); return value ? value.slice(prefix.length) : null; }
function smokeArgument(name) { const value = argumentValue(name); return value ? path.resolve(value) : null; }
const cancelSmokeHoldMs = Math.min(Math.max(Number(argumentValue('knoux-cancel-hold-ms')) || 0, 0), 10000);
if (argumentValue('knoux-visual-smoke-output')) {
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  // Windows itself tells Chromium when the window is covered, and Chromium
  // answers by marking the page hidden and stopping frame production outright:
  // capturePage() then never settles, because the surface has been told it is
  // not worth painting. The measuring run never brings its own window forward,
  // so the occlusion source is switched off for that run only.
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
}
function automationArgument() { const prefix = '--automation-run='; const value = process.argv.find(argument => argument.startsWith(prefix)); return value ? value.slice(prefix.length) : null; }
/**
 * Runs the Windows Task Scheduler.
 *
 * `schtasks.exe` is slow on a loaded machine and its own error message embeds
 * the whole command line, which must never reach the renderer. The failure is
 * therefore reported as a stable reason plus the scheduler's own short
 * message, and a timed-out request is retried once.
 */
async function taskScheduler(args) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { stdout, stderr } = await execFileAsync('schtasks.exe', args, { windowsHide: true, timeout: 120000, maxBuffer: 1024 * 1024 });
      return { stdout, stderr };
    } catch (error) {
      const code = Number(error?.code);
      const timedOut = error?.killed === true || error?.signal === 'SIGTERM' || code === 'ETIMEDOUT';
      const detail = String(error?.stderr || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, 3).join(' ').slice(0, 200);
      if (timedOut && attempt === 0) { await new Promise(resolve => setTimeout(resolve, 750)); continue; }
      const reason = timedOut ? 'timed-out' : (Number.isFinite(code) && code > 0 ? `exit-${code}` : 'failed');
      const failure = new Error(`Windows Task Scheduler request failed (${reason})${detail ? `: ${detail}` : ''}`);
      failure.code = 'SCHEDULER_FAILED';
      throw failure;
    }
  }
  throw new Error('Windows Task Scheduler request failed.');
}
/**
 * The directories a smoke run is allowed to write to.
 *
 * A command line can ask the application to write a file, so the write is
 * confined to a temporary root. The list has to cover every root Windows
 * actually uses for temporary work: `os.tmpdir()`, the TEMP/TMP variables and
 * the CI runner's own RUNNER_TEMP. Accepting only `os.tmpdir()` made the
 * application refuse its own smoke paths on a CI runner (whose RUNNER_TEMP
 * lives on a different volume) and exit with code 1.
 */
const requireTemporaryPath = (target, label) => smokePaths.requireTemporaryPath(target, label);
async function runPackagedSmoke() {
  const settingsTarget = smokeArgument('knoux-settings-smoke-output');
  const operationTarget = smokeArgument('knoux-operation-smoke-output');
  const visualTarget = smokeArgument('knoux-visual-smoke-output');
  if (!settingsTarget && !operationTarget && !visualTarget) return;
  if (settingsTarget) {
    requireTemporaryPath(settingsTarget, 'Packaged settings smoke output');
    const evidence = await mainWindow.webContents.executeJavaScript(`(async () => {
      const before = await window.knoux.getSettings(); const tools = await window.knoux.listTools(); const marker = before.appearance.accent === 'blue' ? 'green' : 'blue';
      const written = await window.knoux.updateSettings({ appearance: { ...before.appearance, accent: marker } }); const persisted = await window.knoux.getSettings(); const reset = await window.knoux.resetSettingsSection('appearance');
      await window.knoux.updateSettings({ localization: { ...before.localization, locale: 'ar' }, appearance: { ...before.appearance, theme: 'high-contrast', fontScale: 1.5, reduceMotion: true, animations: false } }); let accessibilityApplied = false; for (let attempt = 0; attempt < 1200; attempt += 1) { await new Promise(resolve => setTimeout(resolve, 50)); if (document.documentElement.lang === 'ar' && document.documentElement.dir === 'rtl' && document.documentElement.dataset.theme === 'high-contrast' && document.documentElement.dataset.motion === 'reduced' && document.documentElement.style.getPropertyValue('--font-scale') === '1.5') { accessibilityApplied = true; break; } } let focusTarget = null; for (let attempt = 0; attempt < 240 && !focusTarget; attempt += 1) { focusTarget = [...document.querySelectorAll('button')].find(button => !button.disabled && button.getClientRects().length > 0) || null; if (!focusTarget) await new Promise(resolve => setTimeout(resolve, 50)); } focusTarget?.focus(); const accessibility = { applied: accessibilityApplied, lang: document.documentElement.lang, dir: document.documentElement.dir, theme: document.documentElement.dataset.theme, motion: document.documentElement.dataset.motion, fontScale: document.documentElement.style.getPropertyValue('--font-scale'), keyboardFocusable: document.activeElement === focusTarget }; await window.knoux.updateSettings({ localization: before.localization, appearance: before.appearance });
      return { beforeVersion: before.settingsVersion, toolCount: tools.length, handlersAvailable: tools.every(tool => tool.availability && typeof tool.availability.available === 'boolean'), marker, writeObserved: written.appearance.accent === marker && persisted.appearance.accent === marker, sectionResetObserved: reset.appearance.accent === before.appearance.accent, accessibility };
    })()`);
    await fsp.mkdir(path.dirname(settingsTarget), { recursive: true }); await fsp.writeFile(settingsTarget, JSON.stringify({ capturedAt: new Date().toISOString(), packaged: app.isPackaged, evidence }, null, 2), 'utf8');
  }
  if (operationTarget) {
    requireTemporaryPath(operationTarget, 'Packaged operation smoke output'); const fixture = requireTemporaryPath(smokeArgument('knoux-operation-smoke-fixture'), 'Packaged operation fixture'); const cleanupFixture = requireTemporaryPath(smokeArgument('knoux-temp-cleanup-smoke-fixture'), 'Packaged cleanup fixture'); const cancelFixture = requireTemporaryPath(smokeArgument('knoux-cancel-smoke-fixture'), 'Packaged cancellation fixture'); const startupSmokeValue = argumentValue('knoux-startup-smoke-value'); allowedDirectory(fixture); allowedDirectory(cleanupFixture); allowedDirectory(cancelFixture);
    const source = JSON.stringify(fixture); const cleanupSource = JSON.stringify(cleanupFixture); const cancelSource = JSON.stringify(cancelFixture); const startupSource = JSON.stringify(startupSmokeValue);
    const evidence = await mainWindow.webContents.executeJavaScript(`(async () => {
      const run = (toolId, inputs = {}) => window.knoux.runTool({ toolId, inputs }); const fixture = ${source}; const cleanupFixture = ${cleanupSource}; const cancelFixture = ${cancelSource}; const startupSmokeValue = ${startupSource};
      // The Clipboard Vault is opt-in, so the smoke enables it through the
      // ordinary settings path before the main process verifies a real
      // Windows clipboard capture.
      const settingsBeforeClipboard = await window.knoux.getSettings(); await window.knoux.updateSettings({ clipboard: { ...settingsBeforeClipboard.clipboard, enabled: true, paused: false, privateMode: false } });
      const health = await run('system-health'); const smartScan = await run('smart-scan'); const servicesInventory = await run('services-inventory', { limit: 2000 }); const serviceCandidate = servicesInventory.items.find(item => item.protected === false && /^[A-Za-z0-9_.-]{1,256}$/.test(String(item.name || ''))); const serviceDryRun = serviceCandidate ? await run('service-control', { serviceName: serviceCandidate.name, action: 'manual', confirm: true, dryRun: true }) : null; const disks = await run('disk-overview'); const processes = await run('process-inventory'); const battery = await run('battery-status'); const startupItems = await run('startup-items'); const installedApps = await run('installed-apps'); const networkDiagnostics = await run('network-diagnostics'); const hardwareInventory = await run('hardware-inventory'); const eventWarnings = await run('event-warnings'); const emptyFolders = await run('empty-folders', { folder: fixture, limit: 500 }); const downloadsInventory = await run('downloads-inventory', { limit: 500 }); const hash = await run('file-hash', { filePath: fixture + '\\\\hash-fixture.txt' });
      const large = await run('large-files', { folder: fixture, thresholdBytes: 1, limit: 500 }); const duplicates = await run('duplicate-files', { folder: fixture, minimumBytes: 1, limit: 500 });
      const preview = await run('organize-downloads-preview', { folder: fixture, limit: 500 }); const apply = await run('organize-downloads-apply', { folder: fixture, confirm: true, limit: 500 });
      const undo = apply.success && apply.summary.journalId ? await run('organize-downloads-undo', { journalId: apply.summary.journalId }) : null;
      const cleanupPreview = await run('temp-cleanup-preview', { limit: 500 }); const cleanupApply = await run('temp-cleanup-apply', { confirm: true, limit: 500 }); const cleanupUndo = cleanupApply.success && cleanupApply.summary.journalId ? await run('temp-cleanup-undo', { journalId: cleanupApply.summary.journalId }) : null;
      const startupDisable = startupSmokeValue ? await run('startup-disable', { valueName: startupSmokeValue, confirm: true }) : null; const startupRestore = startupDisable?.success && startupDisable.summary.journalId ? await run('startup-restore', { journalId: startupDisable.summary.journalId, confirm: true }) : null;
      const automation = await window.knoux.createAutomation({ toolId: 'system-health', label: 'KNOuX packaged automation smoke', trigger: { kind: 'daily', time: '23:59' } }); const automationRun = await window.knoux.runAutomation(automation.id); const automationRemoved = await window.knoux.removeAutomation(automation.id);
      const lifecyclePhases = []; const stopObserving = window.knoux.onOperationEvent(event => { if (event.toolId === 'large-files') { lifecyclePhases.push(event.phase); if (event.phase === 'progress') window.knoux.cancelOperation(event.operationId); } }); const cancellation = await run('large-files', { folder: cancelFixture, thresholdBytes: 1, limit: 10000 }); for (let attempt = 0; attempt < 60 && !lifecyclePhases.includes('cancelled'); attempt += 1) { await new Promise(resolve => setTimeout(resolve, 50)); } stopObserving();
      const repairToolIds = ['repair-dism-check-health', 'repair-dism-scan-health', 'repair-dism-restore-health', 'repair-sfc-verify-only', 'repair-sfc-scan-now', 'repair-dns-flush', 'repair-winsock-reset', 'repair-tcpip-reset']; const repairDryRuns = await Promise.all(repairToolIds.map(toolId => run(toolId, { confirm: true, dryRun: true }))); const adminDryRun = repairDryRuns[0];
      return { health, smartScan, servicesInventory, serviceCandidate: serviceCandidate ? { name: serviceCandidate.name } : null, serviceDryRun, disks, processes, battery, startupItems, installedApps, networkDiagnostics, hardwareInventory, eventWarnings, emptyFolders, downloadsInventory, hash, large, duplicates, preview, apply, undo, cleanupFixture, cleanupPreview, cleanupApply, cleanupUndo, startupDisable, startupRestore, automation, automationRun, automationRemoved, cancellation, lifecyclePhases, repairDryRuns, adminDryRun };
    })()`);
    await fsp.mkdir(path.dirname(operationTarget), { recursive: true });
    const clipboardEvidence = await verifyClipboardVault().catch(error => ({ error: String(error?.message || error) }));
    await fsp.writeFile(operationTarget, JSON.stringify({ capturedAt: new Date().toISOString(), packaged: app.isPackaged, fixture, evidence, clipboard: clipboardEvidence }, null, 2), 'utf8');
  }
  if (visualTarget) {
    requireTemporaryPath(visualTarget, 'Packaged visual smoke output');
    const scenarios = await captureVisualEvidence(path.dirname(visualTarget)).catch(error => [{ error: String(error?.message || error) }]);
    await fsp.writeFile(visualTarget, JSON.stringify({ capturedAt: new Date().toISOString(), packaged: app.isPackaged, scenarios }, null, 2), 'utf8');
  }
  await shutdownBackgroundWorkers();
  // A smoke run has no user state left to flush, so the process ends
  // deterministically instead of relying on a graceful teardown that a
  // headless Windows runner may not survive.
  app.isQuiting = true;
  app.exit(0);
}
function normalisePath(input) { const resolved = path.resolve(input); if (resolved.length > 32767) throw new Error('Path is too long.'); return resolved; }
function allowedDirectory(input) { const resolved = normalisePath(input); if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) throw new Error('Selected folder is unavailable.'); return resolved; }
function allowedFile(input) { const resolved = normalisePath(input); if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw new Error('Selected file is unavailable.'); return resolved; }
function isCancelled(context) { if (context.cancelled) { const error = new Error('Operation cancelled by the user.'); error.code = 'CANCELLED'; throw error; } }
const readReparseTagProvider = windowsFs.createReparseTagReader();
const classifyEntry = windowsFs.createEntryClassifier({ readReparseTag: targetPath => readReparseTagProvider(targetPath) });
async function reparsePointPolicy() { return (await getSettings()).scanning.reparsePointPolicy; }
/** Metadata-only projection. Inventory paths never open file content through this. */
function fileRecord(file) { return { path: file.path, size: file.size, modifiedAt: file.modifiedAt, createdAt: file.createdAt, fileIdentity: file.fileIdentity, linkCount: file.linkCount, hardlinked: file.hardlinked, entryKind: file.entryKind, reparseTag: file.reparseTag, reparseName: file.reparseName, placeholderState: file.placeholderState, placeholderStateAvailable: file.placeholderStateAvailable, hydrationRisk: file.hydrationRisk, allocatedSizeAvailable: file.allocatedSizeAvailable }; }
function traversalWarnings(context, totals) { if (totals.reparsePointsSkipped) context.warnings.push(`${totals.reparsePointsSkipped} reparse point(s) were not followed, to avoid leaving the scanned location or hydrating cloud content.`); if (totals.cloudPlaceholders) context.warnings.push(`${totals.cloudPlaceholders} cloud placeholder(s) were identified from metadata and were not read.`); if (totals.hardlinkedFiles) context.warnings.push(`${totals.hardlinkedFiles} file(s) have multiple hard links and are not counted as reclaimable duplicate storage.`); }
/**
 * States which independent Windows sources did not answer, so a partial result
 * says what succeeded and what failed instead of silently looking complete.
 */
function unavailableWarnings(unavailable, label) {
  return (unavailable || []).map(entry => `The ${label} "${entry.provider}" did not answer (${entry.reason}${entry.timeoutMs ? `, budget ${Math.round(entry.timeoutMs / 1000)}s` : ''}); its values are absent from this result.`);
}

/**
 * Windows-aware traversal. Reparse points (symlinks, junctions, mount points,
 * cloud placeholders) are never followed unless the user's reparse-point policy
 * allows it, the tag is known and non-cloud, and the target is same-volume.
 *
 * `scanBudget` bounds the *work* (entries examined) and is deliberately separate
 * from any caller-supplied result `limit`. Conflating them was a real defect:
 * asking for the top 8 large files examined 8 entries, so large-files,
 * duplicate-files and empty-folders could never return anything at low limits.
 */
/**
 * Matches a path against the user's exclusion patterns. A pattern matches the
 * exact path, anything under it, or the file name itself. Exclusions are
 * honoured by the traversal itself, so every scanner and every mutation path
 * sees the same selection.
 */
function matchesExclusion(target, patterns) {
  const list = Array.isArray(patterns) ? patterns : [];
  if (!list.length) return false;
  const resolved = path.resolve(target).toLowerCase();
  const fileName = path.basename(target).toLowerCase();
  return list.some(pattern => {
    const value = String(pattern || '').trim().toLowerCase();
    if (!value) return false;
    if (fileName === value) return true;
    const candidate = path.resolve(value).toLowerCase();
    if (resolved === candidate) return true;
    return resolved.startsWith(candidate.endsWith(path.sep) ? candidate : candidate + path.sep);
  });
}
async function walk(root, context, options = {}) {
  const files = []; const folders = []; const links = []; const queue = [root]; const scanBudget = options.scanBudget || options.limit || 50000;
  const policy = options.reparsePointPolicy || await reparsePointPolicy();
  const exclusions = options.exclusions || (await getSettings()).scanning.exclusions || [];
  let inspected = 0;
  const totals = { foldersVisited: 0, filesVisited: 0, reparsePointsSkipped: 0, reparsePointsTraversed: 0, accessDenied: 0, hardlinkedFiles: 0, cloudPlaceholders: 0, allocatedSizeAvailable: false, excluded: 0 };
  while (queue.length) {
    isCancelled(context); const folder = queue.shift(); totals.foldersVisited += 1; folders.push(folder); let entries;
    try { entries = await fsp.readdir(folder, { withFileTypes: true }); } catch (error) { totals.accessDenied += 1; context.warnings.push(`${folder}: ${error.code || 'unavailable'}`); continue; }
    for (const entry of entries) {
      isCancelled(context); if (++inspected > scanBudget) { context.warnings.push(`Scan stopped after examining ${scanBudget.toLocaleString()} filesystem items; results are partial.`); return { files, folders, links, totals, partial: true }; }

      const full = path.join(folder, entry.name); let stat;
      if (matchesExclusion(full, exclusions)) { totals.excluded += 1; continue; }
      try { stat = await fsp.lstat(full); } catch (error) { totals.accessDenied += 1; context.warnings.push(`${full}: ${error.code || 'unavailable'}`); continue; }
      // Progress is reported on a fixed cadence so a long scan stays
      // cancellable and the drawer keeps moving.
      if (inspected % 50 === 0) { context.progress(inspected, Math.max(inspected + queue.length, inspected), `Inspected ${inspected.toLocaleString()} filesystem items`); if (context.cancelHoldMs && !context.cancelHoldDone) { context.cancelHoldDone = true; await new Promise(resolve => setTimeout(resolve, context.cancelHoldMs)); isCancelled(context); } }
      let classified;
      try { classified = await classifyEntry(full, stat, { root, reparsePointPolicy: policy }); } catch (error) { totals.accessDenied += 1; context.warnings.push(`${full}: ${error.code || 'unavailable'}`); continue; }
      if (classified.entryKind === 'reparse') {
        const mayEnter = windowsFs.mayTraverseLink(classified, { reparsePolicy: policy, root });
        classified.traversed = mayEnter;
        classified.skippedReason = mayEnter ? null : (classified.skippedReason || 'reparse-not-traversed');
        links.push(classified);
        if (windowsFs.CLOUD_TAGS.has(classified.reparseName)) totals.cloudPlaceholders += 1;
        if (!mayEnter) { totals.reparsePointsSkipped += 1; continue; }
        totals.reparsePointsTraversed += 1;
        if (stat.isDirectory()) { queue.push(full); continue; }
        totals.filesVisited += 1; files.push({ ...classified, modifiedAt: new Date(stat.mtimeMs).toISOString(), createdAt: new Date(stat.birthtimeMs || stat.mtimeMs).toISOString() }); continue;
      }
      if (stat.isDirectory()) { queue.push(full); continue; }
      if (!stat.isFile()) continue;
      totals.filesVisited += 1; if (classified.hardlinked) totals.hardlinkedFiles += 1;
      files.push({ ...classified, modifiedAt: new Date(stat.mtimeMs).toISOString(), createdAt: new Date(stat.birthtimeMs || stat.mtimeMs).toISOString() });
    }
  }
  return { files, folders, links, totals, partial: false };
}
function expectedStartupType(action) { return ({ automatic: 'automatic', delayedAutomatic: 'automatic', manual: 'manual', disabled: 'disabled' })[action] ?? null; }
function expectedServiceState(action) { return ({ start: 'Running', stop: 'Stopped', restart: 'Running' })[action] ?? null; }
async function diskOverview() { return windowsProviders.collectLogicalDisks(); }
async function servicesInventory() { const list = await windowsProviders.collectServices(); return list.map(item => { const guarded = privilegedRunner.isProtectedService(item.name) || !item.controllable; return { ...item, protected: guarded, controllable: !guarded }; }); }
let systemHealthInFlight = null;
let systemHealthCached = null;
let systemHealthCachedAt = 0;
/**
 * System health is measured once and shared.
 *
 * The dashboard measures health at boot while the user may already be running
 * the tool, and two concurrent WMI queries made both of them slower on a
 * loaded machine. A short cache and a single in-flight promise keep the
 * measurement truthful and remove the contention.
 */
async function systemHealth() {
  const nowMs = Date.now();
  if (systemHealthCached && nowMs - systemHealthCachedAt < 5000) return systemHealthCached;
  if (systemHealthInFlight) return systemHealthInFlight;
  systemHealthInFlight = windowsProviders.collectSystemHealth()
    .then(value => { systemHealthCached = value; systemHealthCachedAt = Date.now(); return value; })
    .finally(() => { systemHealthInFlight = null; });
  return systemHealthInFlight;
}
async function scanLargeFiles(root, context, threshold, limit) {
  // `limit` slices the returned results; the walk gets its own scan budget.
  const data = await walk(root, context, { scanBudget: SCAN_BUDGET });
  traversalWarnings(context, data.totals);
  const intelligence = advancedLocal.buildStorageIntelligence(data.files, root);
  const largest = data.files.filter(file => file.size >= threshold).sort((a, b) => b.size - a.size).slice(0, limit).map(file => ({ ...fileRecord(file), type: advancedLocal.classifyFileType(file.path), ageBucket: advancedLocal.ageBucket(file.modifiedAt) }));
  return { items: largest, summary: { folder: root, filesScanned: data.files.length, matchingFiles: largest.length, thresholdBytes: threshold, totalMatchingBytes: largest.reduce((sum, item) => sum + item.size, 0), totalScannedBytes: intelligence.totalBytes, typeGroups: intelligence.typeGroups, ageBuckets: intelligence.ageBuckets, extensionGroups: intelligence.extensionGroups, topFolders: intelligence.topFolders, traversal: { ...data.totals, reparsePoints: data.links.slice(0, 200) } }, partial: data.partial };
}
function downloadCategory(filePath) { const ext = path.extname(filePath).toLowerCase(); if (['.jpg','.jpeg','.png','.gif','.webp','.heic','.svg'].includes(ext)) return 'Images'; if (['.mp4','.mkv','.mov','.avi','.webm'].includes(ext)) return 'Videos'; if (['.mp3','.wav','.flac','.aac','.m4a'].includes(ext)) return 'Audio'; if (['.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.txt'].includes(ext)) return 'Documents'; if (['.zip','.rar','.7z','.tar','.gz'].includes(ext)) return 'Archives'; if (['.exe','.msi','.msix','.appx'].includes(ext)) return 'Installers'; if (['.js','.ts','.tsx','.py','.java','.cs','.cpp','.json','.html','.css'].includes(ext)) return 'Development'; return 'Other'; }
/** Preflight: report destination collisions, reparse entries and cross-volume moves before anything moves. */
async function downloadOrganizationPlan(context, limit, sourceFolder) {
  const source = sourceFolder ? allowedDirectory(sourceFolder) : app.getPath('downloads');
  const data = await walk(source, context, { scanBudget: SCAN_BUDGET });
  traversalWarnings(context, data.totals);
  const rootFiles = data.files.filter(file => path.dirname(file.path) === source);
  const plans = []; const collisions = []; const skipped = [];
  for (const file of rootFiles) {
    const category = downloadCategory(file.path);
    const destination = path.join(source, category, path.basename(file.path));
    if (windowsFs.CLOUD_TAGS.has(file.reparseName)) { skipped.push({ source: file.path, reason: 'cloud-placeholder', evidence: { reparseTag: file.reparseTag, reparseName: file.reparseName } }); continue; }
    if (file.entryKind === 'reparse') { skipped.push({ source: file.path, reason: file.skippedReason || 'reparse-point', evidence: { reparseTag: file.reparseTag, reparseName: file.reparseName, linkTarget: file.linkTarget } }); continue; }
    if (!windowsFs.sameVolume(source, destination)) { skipped.push({ source: file.path, reason: 'cross-volume-move', evidence: { sourceVolume: file.volume, destinationVolume: windowsFs.volumeKey(destination) } }); continue; }
    if (fs.existsSync(destination)) { collisions.push({ source: file.path, destination }); continue; }
    plans.push({ source: file.path, category, destination, size: file.size, fileIdentity: file.fileIdentity, hardlinked: file.hardlinked });
  }
  return { source, plans, collisions, skipped, totals: data.totals, partial: data.partial };
}
async function scanDuplicates(root, context, minimumSize, limit) {
  // Duplicate detection needs the whole size grouping, so the walk is bounded by
  // the scan budget and only the reported group count honours `limit`.
  const data = await walk(root, context, { scanBudget: SCAN_BUDGET });
  traversalWarnings(context, data.totals);
  const sizeGroups = new Map();
  data.files.filter(file => file.size >= minimumSize).forEach(file => { const group = sizeGroups.get(file.size) || []; group.push(file); sizeGroups.set(file.size, group); });
  const candidates = [...sizeGroups.values()].filter(group => group.length > 1).flat();
  const hashable = candidates.filter(file => file.entryKind === 'file' && !windowsFs.CLOUD_TAGS.has(file.reparseName));
  const skippedForHydration = candidates.filter(file => windowsFs.CLOUD_TAGS.has(file.reparseName) || file.entryKind !== 'file');
  if (skippedForHydration.length) context.warnings.push(`${skippedForHydration.length} duplicate candidate(s) were not content-verified because they are cloud placeholders or links; hashing them would have hydrated remote content.`);
  const hashes = new Map();
  const changedDuringRead = [];
  for (let index = 0; index < hashable.length; index++) {
    isCancelled(context); const file = hashable[index];
    const before = windowsFs.identitySnapshot(await fsp.lstat(file.path));
    const hash = crypto.createHash('sha256');
    try {
      await new Promise((resolve, reject) => { const stream = fs.createReadStream(file.path); stream.on('error', reject); stream.on('data', chunk => hash.update(chunk)); stream.on('end', resolve); });
    } catch (error) { changedDuringRead.push({ path: file.path, reason: error.code || 'read-failed' }); continue; }
    const after = windowsFs.identitySnapshot(await fsp.lstat(file.path).catch(() => null));
    if (windowsFs.identityChanged(before, after)) { changedDuringRead.push({ path: file.path, reason: 'changed-during-read' }); continue; }
    const key = `${file.size}:${hash.digest('hex')}`;
    const group = hashes.get(key) || []; group.push(file); hashes.set(key, group);
    context.progress(index + 1, hashable.length || 1, `Verified ${index + 1} duplicate candidates with SHA-256`);
  }
  const exactGroups = [...hashes.entries()].filter(([, group]) => group.length > 1).map(([key, group]) => ({
    hash: key.split(':')[1], size: group[0].size, count: group.length,
    // Hard links share one physical file: extra names free no bytes.
    reclaimableBytes: windowsFs.reclaimableBytesForGroup(group),
    singlePhysicalFile: windowsFs.groupIsSinglePhysicalFile(group),
    physicalDuplicates: windowsFs.physicalDuplicateGroups(group).length,
    files: group.map(file => fileRecord(file))
  }));
  const enriched = advancedLocal.enrichDuplicateGroups(exactGroups);
  if (changedDuringRead.length) context.warnings.push(`${changedDuringRead.length} file(s) changed while being hashed and were excluded from duplicate results.`);
  return {
    items: enriched.items.slice(0, limit),
    summary: {
      folder: root, filesScanned: data.files.length, candidateFiles: candidates.length,
      contentVerifiedFiles: hashable.length, skippedForHydration: skippedForHydration.length, changedDuringRead: changedDuringRead.length,
      ...enriched.summary, exactHashAlgorithm: 'sha256', automaticDeletion: false,
      hardlinkPolicy: 'Files sharing a Windows file identity are one physical file and are not counted as reclaimable duplicate storage.',
      traversal: { ...data.totals, reparsePoints: data.links.slice(0, 200) }
    },
    partial: data.partial || changedDuringRead.length > 0
  };
}
async function tempCleanupCandidates(context) {
  const smokeFixture = app.isPackaged && smokeArgument('knoux-temp-cleanup-smoke-fixture');
  const temp = smokeFixture ? requireTemporaryPath(smokeFixture, 'Packaged cleanup fixture') : (process.env.TEMP || os.tmpdir());
  if (smokeFixture) allowedDirectory(temp);
  const settings = await getSettings();
  const exclusions = [...(settings.scanning.exclusions || []), ...(settings.cleanup.exclusions || [])];
  const data = await walk(temp, context, { scanBudget: Math.min(SCAN_BUDGET, 25000), exclusions });
  const oldest = Date.now() - settings.cleanup.minimumFileAgeDays * 86400000;
  const selected = data.files.filter(file => new Date(file.modifiedAt).getTime() < oldest);
  return { temp, data, selected, exclusions };
}
/**
 * Moves a file without ever silently overwriting an existing destination.
 *
 * See electron/safe-move.cjs: the destination is reserved atomically with an
 * exclusive create, cross-volume moves are staged and size-verified, and the
 * source is removed last.
 */
const moveWithFallback = safeMove.moveWithFallback;
async function runTool(context, tool, inputs) {
  const home = app.getPath('home'); const folder = allowedDirectory(inputs.folder || home); const limit = inputs.limit || 50000;
  if (OPERATION_SPECS[tool.engine]) { const output = await privilegedRunner.run(tool.engine, { dryRun: inputs.dryRun }); if (!inputs.dryRun && output.summary.exitCode !== 0) throw new Error(`Privileged operation exited with code ${output.summary.exitCode}.`); if (!inputs.dryRun) context.warnings.push(...(output.summary.verification?.limitation ? [output.summary.verification.limitation] : [])); return output; }
  if (tool.engine === 'servicesInventory') {
    let list = []; let providerError = null;
    try { list = await servicesInventory(); } catch (error) { providerError = error; }
    // A service inventory that did not answer is reported as an unavailable
    // source, not as an empty list of services.
    if (providerError) {
      const warning = `The Windows service inventory did not answer (${providerError.message}). No service list is reported for this run.`;
      context.warnings.push(warning);
      return { items: [], summary: { services: 0, protectedServices: 0, delayedAutomatic: 0, running: 0, inventoryAvailable: false, unavailableReason: providerError.message, provider: 'Win32_Service' }, warnings: [warning], partial: true };
    }
    const search = String(inputs.search || '').toLocaleLowerCase();
    const filtered = search ? list.filter(item => `${item.name} ${item.displayName} ${item.description || ''}`.toLocaleLowerCase().includes(search)) : list;
    return { items: filtered.slice(0, inputs.limit || 2000), summary: { services: filtered.length, protectedServices: filtered.filter(item => item.protected).length, delayedAutomatic: filtered.filter(item => item.delayedAuto).length, running: filtered.filter(item => item.running).length, inventoryAvailable: true, provider: 'Win32_Service' } };
  }
  if (tool.engine === 'serviceControl') {
    const list = await servicesInventory(); const service = list.find(item => item.name.toLocaleLowerCase() === inputs.serviceName.toLocaleLowerCase()); if (!service) throw new Error('Windows service was not found.');
    if (service.protected) throw new Error('This Windows service is protected and cannot be changed by SmartOrganizer.');
    if (service.dependencies?.length && ['stop', 'restart', 'disabled'].includes(inputs.action)) context.warnings.push(`Service depends on: ${service.dependencies.join(', ')}. Stopping or disabling it may affect those components.`);
    const startupAction = ['automatic', 'delayedAutomatic', 'manual', 'disabled'].includes(inputs.action);
    const startedAt = new Date().toISOString();
    let journalId = null;
    if (startupAction && !inputs.dryRun) { journalId = crypto.randomUUID(); const oldAction = service.delayedAuto ? 'delayedAutomatic' : service.startupType === 'automatic' ? 'automatic' : service.startupType === 'disabled' ? 'disabled' : 'manual'; await writeJson(`undo-service-${journalId}.json`, { journalId, serviceName: service.name, oldAction, previousStatus: service.state, createdAt: startedAt }); }
    const output = await privilegedRunner.runService({ serviceName: inputs.serviceName, action: inputs.action, dryRun: inputs.dryRun });
    const finishedAt = new Date().toISOString();
    let proof = null;
    if (!inputs.dryRun) {
      // REQUERY the Service Control Manager and compare against the request.
      const observed = (await servicesInventory().catch(() => null))?.find(item => item.name.toLowerCase() === service.name.toLowerCase()) || null;
      proof = verificationKit.verification([
        verificationKit.check('service-present', true, Boolean(observed), Boolean(observed)),
        verificationKit.check('startup-type', expectedStartupType(inputs.action), observed?.startupType ?? null, startupAction ? observed?.startupType === expectedStartupType(inputs.action) : true),
        verificationKit.check('service-state', expectedServiceState(inputs.action), observed?.state ?? null, ['start', 'stop', 'restart'].includes(inputs.action) ? observed?.state === expectedServiceState(inputs.action) : true)
      ], { requerySource: 'Win32_Service' });
      if (proof.status !== 'verified') context.warnings.push(`Post-change re-query reported "${proof.status}". The requested service state could not be proven from Windows.`);
    }
    return { ...output, undoMetadata: journalId ? { journalId, action: 'service-startup' } : null, summary: { ...output.summary, previousStatus: service.state, previousStartupType: service.startupType, journalId, startedAt, finishedAt, verification: proof ?? { status: 'unverified', method: 'dry-run: no state was changed' } }, partial: Boolean(proof && proof.status !== 'verified') };
  }
  if (tool.engine === 'serviceStartupUndo') {
    const journal = await readJson(`undo-service-${inputs.journalId}.json`, null); if (!journal?.serviceName || !journal?.oldAction) throw new Error('Service startup undo journal is unavailable.');
    const startedAt = new Date().toISOString();
    const output = await privilegedRunner.runService({ serviceName: journal.serviceName, action: journal.oldAction, dryRun: inputs.dryRun });
    const finishedAt = new Date().toISOString();
    let proof = null;
    if (!inputs.dryRun) {
      const observed = (await servicesInventory().catch(() => null))?.find(item => item.name.toLowerCase() === journal.serviceName.toLowerCase()) || null;
      proof = verificationKit.verification([
        verificationKit.check('service-present', true, Boolean(observed), Boolean(observed)),
        verificationKit.check('startup-type-restored', expectedStartupType(journal.oldAction), observed?.startupType ?? null, observed?.startupType === expectedStartupType(journal.oldAction))
      ], { requerySource: 'Win32_Service' });
      if (proof.status !== 'verified') context.warnings.push(`Post-undo re-query reported "${proof.status}". The journaled startup type could not be proven.`);
    }
    return { ...output, summary: { ...output.summary, journalId: inputs.journalId, restoredStartupAction: journal.oldAction, startedAt, finishedAt, verification: proof ?? { status: 'unverified', method: 'dry-run: no state was changed' } }, partial: Boolean(proof && proof.status !== 'verified') };
  }
  if (tool.engine === 'systemHealth') return { summary: await systemHealth(), items: [] };
  if (tool.engine === 'diskOverview') {
    let rawItems = []; let providerError = null;
    try { rawItems = await diskOverview(); } catch (error) { providerError = error; }
    // A volume inventory that did not answer is reported as an unavailable
    // source. Reporting "zero drives" would be a lie about the machine.
    if (providerError) {
      const warning = `The Windows volume inventory did not answer (${providerError.message}). No volume data is reported for this run.`;
      context.warnings.push(warning);
      return { items: [], summary: { drives: 0, pressuredDrives: 0, criticalDrives: 0, unknownPressureDrives: 0, physicalDisks: [], physicalDiskCount: 0, physicalDisksAvailable: false, inventoryAvailable: false, unavailableReason: providerError.message, volumeProvider: 'Win32_LogicalDisk' }, warnings: [warning], partial: true };
    }
    const items = advancedLocal.diskPressure(rawItems);
    const physical = await windowsProviders.collectPhysicalDisks({ timeout: 45000 }).then(value => ({ value, error: null })).catch(error => ({ value: [], error }));
    const warnings = []; if (physical.error) warnings.push('The physical disk provider did not answer, so physical disk details are absent from this result.');
    return { items, summary: { drives: items.length, pressuredDrives: items.filter(item => ['critical', 'high'].includes(item.pressure)).length, criticalDrives: items.filter(item => item.pressure === 'critical').length, unknownPressureDrives: items.filter(item => item.pressure === 'unknown').length, physicalDisks: physical.value, physicalDiskCount: physical.value.length, physicalDisksAvailable: !physical.error, inventoryAvailable: true, volumeProvider: 'Win32_LogicalDisk', physicalProvider: 'MSFT_PhysicalDisk' }, warnings, partial: Boolean(physical.error) };
  }
  if (tool.engine === 'largeFiles') return await scanLargeFiles(folder, context, Number(inputs.thresholdBytes) || (await getSettings()).scanning.largeFileBytes, limit);
  if (tool.engine === 'duplicates') return await scanDuplicates(folder, context, Number(inputs.minimumBytes) || (await getSettings()).scanning.minimumDuplicateBytes, limit);
  if (tool.engine === 'emptyFolders') {
    const data = await walk(folder, context, { scanBudget: SCAN_BUDGET }); traversalWarnings(context, data.totals);
    const empty = []; let inaccessible = 0;
    for (let index = 0; index < data.folders.length; index++) {
      isCancelled(context); const item = data.folders[index];
      try { if ((await fsp.readdir(item)).length === 0) empty.push({ path: item }); }
      catch (error) { inaccessible += 1; if (inaccessible <= 20) context.warnings.push(`${item}: ${error.code || 'unavailable'}`); }
      if (index % 50 === 0) context.progress(index + 1, data.folders.length || 1, `Checked ${index + 1} of ${data.folders.length} folders`);
    }
    if (inaccessible > 20) context.warnings.push(`${inaccessible} folder(s) could not be read; they are reported as neither empty nor non-empty.`);
    return { items: empty.slice(0, limit), summary: { folder, foldersScanned: data.folders.length, emptyFolders: empty.length, inaccessibleFolders: inaccessible, traversal: data.totals }, partial: data.partial || inaccessible > 0 };
  }
  if (tool.engine === 'downloadsInventory') {
    const downloads = app.getPath('downloads'); const data = await walk(downloads, context, { scanBudget: SCAN_BUDGET }); traversalWarnings(context, data.totals); const intelligence = advancedLocal.buildStorageIntelligence(data.files, downloads); const privacy = advancedLocal.privacyExposure(data.files);
    const shown = [...data.files].sort((a, b) => b.size - a.size).slice(0, Math.max(0, Number(inputs.limit) > 0 ? Number(inputs.limit) : data.files.length));
    const items = shown.map(file => ({ ...fileRecord(file), type: advancedLocal.classifyFileType(file.path), ageBucket: advancedLocal.ageBucket(file.modifiedAt) }));
    return { items, summary: { folder: downloads, files: data.files.length, shownFiles: items.length, truncated: items.length < data.files.length, limitApplied: Number(inputs.limit) > 0 ? Number(inputs.limit) : null, totalBytes: intelligence.totalBytes, extensionGroups: intelligence.extensionGroups, typeGroups: intelligence.typeGroups, ageBuckets: intelligence.ageBuckets, topFolders: intelligence.topFolders, privacyExposureCount: privacy.summary.exposureCount, privacyExposureBytes: privacy.summary.exposureBytes, privacyMetadataOnly: true, privacyContentsInspected: false, privacyFindings: privacy.items.slice(0, 50), metadataOnly: true, contentsInspected: false, traversal: { ...data.totals, reparsePoints: data.links.slice(0, 200) } }, partial: data.partial };
  }
  if (tool.engine === 'organizePreview') {
    const plan = await downloadOrganizationPlan(context, limit, inputs.folder);
    if (plan.collisions.length) context.warnings.push(`${plan.collisions.length} planned move(s) were withheld because the destination name already exists.`);
    if (plan.skipped.length) context.warnings.push(`${plan.skipped.length} file(s) were skipped by the safety policy (${[...new Set(plan.skipped.map(item => item.reason))].join(', ')}).`);
    const combined = [...plan.plans, ...plan.collisions.map(item => ({ ...item, blocked: 'destination-exists' })), ...plan.skipped];
    const shown = combined.slice(0, Math.max(0, Number(inputs.limit) > 0 ? Number(inputs.limit) : combined.length));
    return { items: shown, summary: { sourceFolder: plan.source, plannedMoves: plan.plans.length, blockedByCollision: plan.collisions.length, skipped: plan.skipped.length, skippedReasons: [...new Set(plan.skipped.map(item => item.reason))], shownItems: shown.length, limitApplied: Number(inputs.limit) > 0 ? Number(inputs.limit) : null, previewOnly: true, traversal: plan.totals }, partial: plan.partial };
  }
  if (tool.engine === 'organizeApply') {
    if (inputs.confirm !== true) throw new Error('Explicit confirmation is required before moving files.');
    const plan = await downloadOrganizationPlan(context, limit, inputs.folder);
    // The journal is written BEFORE the first mutation. If the process dies
    // mid-run the intent journal is still on disk, so every file that moved
    // remains recoverable instead of being orphaned.
    const journalId = crypto.randomUUID();
    const journalFile = `undo-${journalId}.json`;
    const planned = plan.plans.slice(0, Math.max(0, Number(inputs.limit) > 0 ? Number(inputs.limit) : plan.plans.length));
    await writeJson(journalFile, { journalId, createdAt: new Date().toISOString(), action: 'organize-downloads', status: 'in-progress', plannedMoves: planned.length, moves: planned.map(item => ({ source: item.source, destination: item.destination, size: item.size, fileIdentity: item.fileIdentity, status: 'planned' })) });
    const journal = []; const verifications = [];
    for (let index = 0; index < planned.length; index++) {
      isCancelled(context); const item = planned[index];
      try {
        await moveWithFallback(item.source, item.destination);
        journal.push({ source: item.source, destination: item.destination, size: item.size, fileIdentity: item.fileIdentity, status: 'moved' });
        verifications.push(await verificationKit.verifyMove({ source: item.source, destination: item.destination, expectedIdentity: item.fileIdentity }));
      } catch (error) {
        const reason = String(error.code || error.message || 'unavailable');
        context.warnings.push(`${item.source}: ${reason}`);
        journal.push({ source: item.source, destination: item.destination, size: item.size, fileIdentity: item.fileIdentity, status: 'failed', reason });
        verifications.push(verificationKit.verification([verificationKit.check('move-completed', true, false, false)], { error: reason }));
      }
      context.progress(index + 1, planned.length || 1, `Moved ${index + 1} of ${planned.length} files`);
    }
    await writeJson(journalFile, { journalId, createdAt: new Date().toISOString(), action: 'organize-downloads', status: 'completed', plannedMoves: planned.length, moves: journal });
    const aggregate = verificationKit.aggregateVerifications(verifications);
    if (aggregate.status !== 'verified') context.warnings.push(`Post-move verification reported "${aggregate.status}". The requested state could not be proven for every file.`);
    const moved = journal.filter(entry => entry.status === 'moved').length;
    return { items: journal.slice(0, 1000), summary: { journalId, movedFiles: moved, failedFiles: journal.length - moved, skippedFiles: plan.plans.length - planned.length, limitApplied: Number(inputs.limit) > 0 ? Number(inputs.limit) : null, plannedMoves: plan.plans.length, verification: aggregate }, partial: plan.partial || aggregate.status !== 'verified' || journal.length !== moved, undoMetadata: { journalId, action: 'organize-downloads' }, restartRequired: false };
  }
  if (tool.engine === 'organizeUndo') {
    const journalId = z.string().uuid().parse(inputs.journalId); const journal = await readJson(`undo-${journalId}.json`, null); if (!journal || !Array.isArray(journal.moves)) throw new Error('Undo journal is unavailable.');
    const restored = []; const conflicts = []; const verifications = []; const untouched = [];
    for (let index = journal.moves.length - 1; index >= 0; index--) {
      isCancelled(context); const item = journal.moves[index];
      const sourcePresent = fs.existsSync(item.source); const destinationPresent = fs.existsSync(item.destination);
      // Never overwrite: a restored file that already exists is a conflict, and
      // a move that never happened is not a failure.
      if (!destinationPresent) { untouched.push({ path: item.source, reason: 'organized-file-missing' }); continue; }
      if (sourcePresent) { conflicts.push({ path: item.source, reason: 'original-already-exists' }); verifications.push(verificationKit.verification([verificationKit.check('original-absent', true, false, false)], { conflict: 'original-already-exists' })); context.progress(journal.moves.length - index, journal.moves.length || 1, `Restored ${journal.moves.length - index} files`); continue; }
      try { await moveWithFallback(item.destination, item.source); restored.push(item); verifications.push(await verificationKit.verifyRestore({ original: item.source, relocated: item.destination, expectedSize: item.size ?? null })); }
      catch (error) { const reason = String(error.code || error.message || 'unavailable'); conflicts.push({ path: item.source, reason }); verifications.push(verificationKit.verification([verificationKit.check('restore-completed', true, false, false)], { error: reason })); }
      context.progress(journal.moves.length - index, journal.moves.length || 1, `Restored ${journal.moves.length - index} files`);
    }
    const aggregate = verificationKit.aggregateVerifications(verifications);
    if (conflicts.length) context.warnings.push(`${conflicts.length} file(s) were not restored because the original location was already occupied. Nothing was overwritten.`);
    if (untouched.length) context.warnings.push(`${untouched.length} journalled file(s) were not at the organised location and were left alone.`);
    if (aggregate.status !== 'verified') context.warnings.push(`Post-restore verification reported "${aggregate.status}".`);
    return { items: restored, summary: { journalId, restoredFiles: restored.length, skippedFiles: journal.moves.length - restored.length, conflicts: conflicts.slice(0, 100), notRestoredBecauseMissing: untouched.length, verification: aggregate }, partial: aggregate.status !== 'verified' || conflicts.length > 0, restartRequired: false };
  }
  if (tool.engine === 'tempPreview') { const candidate = await tempCleanupCandidates(context); traversalWarnings(context, candidate.data.totals); const selected = candidate.selected.sort((a, b) => b.size - a.size); const capped = selected.slice(0, Math.max(0, Number(inputs.limit) > 0 ? Number(inputs.limit) : selected.length)); return { items: capped, summary: { folder: candidate.temp, eligibleFiles: selected.length, eligibleBytes: selected.reduce((sum, item) => sum + item.size, 0), shownFiles: capped.length, limitApplied: Number(inputs.limit) > 0 ? Number(inputs.limit) : null, minimumFileAgeDays: (await getSettings()).cleanup.minimumFileAgeDays, exclusions: (await getSettings()).cleanup.exclusions, readOnlyPreview: true }, partial: candidate.data.partial }; }
  if (tool.engine === 'tempCleanupApply') {
    if (inputs.confirm !== true) throw new Error('Explicit confirmation is required before moving temporary files.');
    const candidate = await tempCleanupCandidates(context); traversalWarnings(context, candidate.data.totals);
    const ordered = candidate.selected.sort((a, b) => b.size - a.size);
    const applyLimit = Number(inputs.limit) > 0 ? Number(inputs.limit) : ordered.length;
    const selected = ordered.slice(0, applyLimit);
    if (inputs.dryRun) return { items: selected.slice(0, 1000), summary: { dryRun: true, eligibleFiles: ordered.length, wouldQuarantineFiles: selected.length, wouldQuarantineBytes: selected.reduce((sum, item) => sum + item.size, 0), limitApplied: Number(inputs.limit) > 0 ? Number(inputs.limit) : null, recoverable: true, changed: false }, partial: candidate.data.partial };
    const journalId = crypto.randomUUID();
    const journalFile = `undo-temp-cleanup-${journalId}.json`;
    const quarantine = appDataPath(path.join('cleanup-quarantine', journalId));
    // The journal is written before the first move so a crash still leaves a
    // complete recovery record for everything that was quarantined.
    await writeJson(journalFile, { journalId, createdAt: new Date().toISOString(), action: 'temp-cleanup', status: 'in-progress', quarantineDirectory: quarantine, plannedMoves: selected.length, moves: selected.map(item => ({ source: item.path, quarantine: path.join(quarantine, `${crypto.createHash('sha256').update(item.path).digest('hex').slice(0, 16)}-${path.basename(item.path)}`), size: item.size, status: 'planned' })) });
    await fsp.mkdir(quarantine, { recursive: true });
    const moves = [];
    for (let index = 0; index < selected.length; index++) {
      isCancelled(context); const item = selected[index]; const target = path.join(quarantine, `${crypto.createHash('sha256').update(item.path).digest('hex').slice(0, 16)}-${path.basename(item.path)}`);
      try { if (fs.existsSync(item.path)) { await moveWithFallback(item.path, target); moves.push({ source: item.path, quarantine: target, size: item.size, status: 'quarantined' }); } else { moves.push({ source: item.path, quarantine: target, size: item.size, status: 'missing', reason: 'source-vanished' }); } }
      catch (error) { const reason = String(error.code || error.message || 'unavailable'); context.warnings.push(`${item.path}: ${reason}`); moves.push({ source: item.path, quarantine: target, size: item.size, status: 'failed', reason }); }
      context.progress(index + 1, selected.length || 1, `Quarantined ${index + 1} of ${selected.length} temporary files`);
    }
    await writeJson(journalFile, { journalId, createdAt: new Date().toISOString(), action: 'temp-cleanup', status: 'completed', quarantineDirectory: quarantine, plannedMoves: selected.length, moves });
    const quarantined = moves.filter(entry => entry.status === 'quarantined');
    const settings = await getSettings();
    if (settings.cleanup.recycleBinByDefault) context.warnings.push('Temporary files were moved to a recoverable KNOuX quarantine instead of the Windows Recycle Bin, so the cleanup stays reversible inside SmartOrganizer.');
    return { items: moves.slice(0, 1000), summary: { journalId, quarantinedFiles: quarantined.length, failedFiles: moves.filter(entry => entry.status === 'failed').length, missingFiles: moves.filter(entry => entry.status === 'missing').length, eligibleFiles: ordered.length, quarantinedBytes: quarantined.reduce((sum, item) => sum + item.size, 0), limitApplied: Number(inputs.limit) > 0 ? Number(inputs.limit) : null, quarantineDirectory: quarantine, recycleBinUsed: false, recoverable: true, permanentDeletion: false }, partial: candidate.data.partial || quarantined.length !== selected.length, undoMetadata: { journalId, action: 'temp-cleanup' } };
  }
  if (tool.engine === 'tempCleanupUndo') {
    const journalId = z.string().uuid().parse(inputs.journalId); const journal = await readJson(`undo-temp-cleanup-${journalId}.json`, null); if (!journal || !Array.isArray(journal.moves)) throw new Error('Cleanup undo journal is unavailable.'); const restored = []; const conflicts = []; const verifications = [];
    for (let index = journal.moves.length - 1; index >= 0; index--) {
      isCancelled(context); const item = journal.moves[index];
      if (!fs.existsSync(item.quarantine)) { conflicts.push({ path: item.source, reason: 'quarantined-file-missing' }); verifications.push(verificationKit.verification([verificationKit.check('quarantined-file-present', true, false, false)], { conflict: 'quarantined-file-missing' })); continue; }
      if (fs.existsSync(item.source)) { conflicts.push({ path: item.source, reason: 'original-already-exists' }); verifications.push(verificationKit.verification([verificationKit.check('original-absent', true, false, false)], { conflict: 'original-already-exists' })); continue; }
      try { await moveWithFallback(item.quarantine, item.source); restored.push(item); verifications.push(await verificationKit.verifyRestore({ original: item.source, relocated: item.quarantine, expectedSize: item.size ?? null })); }
      catch (error) { const reason = String(error.code || error.message || 'unavailable'); conflicts.push({ path: item.source, reason }); verifications.push(verificationKit.verification([verificationKit.check('restore-completed', true, false, false)], { error: reason })); }
      context.progress(journal.moves.length - index, journal.moves.length || 1, `Restored ${journal.moves.length - index} temporary files`);
    }
    const aggregate = verificationKit.aggregateVerifications(verifications);
    if (conflicts.length) context.warnings.push(`${conflicts.length} temporary file(s) were not restored because the original location was already occupied or the quarantined copy was missing. Nothing was overwritten.`);
    if (aggregate.status !== 'verified') context.warnings.push(`Post-restore verification reported "${aggregate.status}".`);
    return { items: restored, summary: { journalId, restoredFiles: restored.length, skippedFiles: journal.moves.length - restored.length, conflicts: conflicts.slice(0, 100), verification: aggregate, recoverable: true }, partial: aggregate.status !== 'verified' || conflicts.length > 0 };
  }
  if (tool.engine === 'startupDisable') { const result = await startupManager.disable({ valueName: inputs.valueName, dryRun: inputs.dryRun }); if (!inputs.dryRun) { const observed = await startupManager.query(inputs.valueName); const proof = verificationKit.verifyRegistryValue(false, observed); result.summary.verification = proof; result.partial = proof.status !== 'verified'; if (proof.status !== 'verified') context.warnings.push('The startup entry was still present after the change; the requested state could not be proven.'); } return result; }
  if (tool.engine === 'startupRestore') { const journal = await readJson(`undo-startup-${inputs.journalId}.json`, null); const result = await startupManager.restore({ journalId: inputs.journalId, dryRun: inputs.dryRun }); if (!inputs.dryRun) { const observed = journal?.valueName ? await startupManager.query(journal.valueName) : null; const proof = verificationKit.verifyRegistryEntry(journal ? { valueName: journal.valueName, valueType: journal.valueType, valueData: journal.valueData } : null, observed); result.summary.verification = proof; result.partial = proof.status !== 'verified'; if (proof.status !== 'verified') context.warnings.push('The startup entry was not restored to the journaled value and type; the requested state could not be proven.'); } return result; }
  if (tool.engine === 'startupItems') { const items = await windowsProviders.collectStartupItems(); return { items, summary: { entries: items.length, managedSources: items.filter(item => item.managedBySmartOrganizer).length, readOnlySources: items.filter(item => !item.managedBySmartOrganizer).length, sources: [...new Set(items.map(item => item.source))], writeScope: 'current-user Run key only', provider: 'Win32_StartupCommand' } }; }
  if (tool.engine === 'installedApps') {
    const [registryPayload, appxResult] = await Promise.all([
      windowsProviders.collectUninstallApps(),
      windowsProviders.collectAppxApps().then(value => ({ value, error: null })).catch(error => ({ value: [], error }))
    ]);
    const rawItems = registryPayload?.items ?? [];
    const list = windowsProviders.normalizeUninstallApp(rawItems);
    const sourceFailures = Number(registryPayload?.sourceFailures) || 0;
    const entryFailures = Number(registryPayload?.entryFailures) || 0;
    const appx = appxResult.value;
    const packages = Array.isArray(appx) ? appx : windowsProviders.asArray(appx);
    const seen = new Set();
    const merged = [];
    for (const app of [...list, ...packages]) {
      const key = `${String(app.name || '').toLowerCase()}\u0000${String(app.version || '').toLowerCase()}\u0000${app.packageIdentity || app.evidence?.keyName || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const id = installedAppId(app);
      merged.push({ ...app, id, installLocationRecorded: Boolean(app.installLocation), uninstallCommandRecorded: Boolean(app.uninstallCapability) });
    }
    merged.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    // The icon provider is registered from here, never from the renderer: it gets
    // the same ids the UI receives and the inventory data behind them.
    try { appIconProvider?.registerInventory(merged); } catch { /* icons fall back to typography */ }
    const hygiene = advancedLocal.analyzeInstalledApps(merged);
    const unavailable = sourceFailures + entryFailures;
    const warnings = [];
    if (unavailable) warnings.push('Some installed-application registry entries were unavailable; the inventory is partial.');
    if (appxResult.error) warnings.push('The MSIX/AppX package provider did not answer, so packaged applications are absent from this inventory.');
    return {
      items: merged,
      summary: {
        ...hygiene,
        registryReadOnly: true, registrySourcesAttempted: windowsProviders.UNINSTALL_ROOTS.length, registrySourceFailures: sourceFailures, registryEntryFailures: entryFailures,
        uninstallRegistryEntries: list.length, packageEntries: packages.length, packageProviderAvailable: !appxResult.error,
        architectureKnown: merged.filter(app => app.architecture).length,
        installDateKnown: merged.filter(app => app.installDate).length,
        estimatedSizeKnown: merged.filter(app => app.estimatedSizeBytes != null).length,
        measuredSizeKnown: merged.filter(app => app.measuredSizeBytes != null).length,
        providers: ['UninstallRegistry', 'Get-AppxPackage'],
        winGetUsed: false,
        win32ProductUsed: false
      },
      warnings,
      partial: unavailable > 0 || Boolean(appxResult.error)
    };
  }
  if (tool.engine === 'networkDiagnostics') {
    // Each Net* source keeps its own measured budget; one slow source must not
    // discard the adapters, addresses, DNS or routes that did answer.
    const network = await windowsProviders.collectNetwork();
    const nodeInterfaces = Object.entries(os.networkInterfaces()).flatMap(([name, records]) => (records || []).filter(record => !record.internal).map(record => ({ name, address: record.address, family: record.family, mac: record.mac, netmask: record.netmask })));
    return {
      items: network.items,
      summary: {
        adapters: network.items.length, activeAddresses: nodeInterfaces.length,
        adaptersUp: network.items.filter(item => /Up$/.test(String(item.status || ''))).length,
        adaptersWithGateway: network.items.filter(item => item.defaultGateway).length,
        ipv4Addresses: network.items.reduce((sum, item) => sum + item.ipv4.length, 0),
        ipv6Addresses: network.items.reduce((sum, item) => sum + item.ipv6.length, 0),
        dnsConfigured: network.items.reduce((sum, item) => sum + item.dnsServers.length, 0),
        defaultRoutes: network.items.reduce((sum, item) => sum + item.defaultRoutes.length, 0),
        nodeInterfaces, provider: 'Get-NetAdapter + Get-NetIPAddress + Get-NetIPInterface + Get-DnsClientServerAddress + Get-NetRoute',
        diagnosticsOnly: true, repairPerformed: false,
        unavailableSources: network.unavailable
      },
      warnings: unavailableWarnings(network.unavailable, 'network source'),
      partial: network.partial
    };
  }
  if (tool.engine === 'hardwareInventory') {
    const hardware = await windowsProviders.collectHardware();
    return {
      items: [hardware],
      summary: {
        cpu: hardware.cpu[0]?.name ?? null, cpuCores: hardware.cpu[0]?.cores ?? null, cpuLogicalProcessors: hardware.cpu[0]?.logicalProcessors ?? null,
        gpuCount: hardware.gpu.length, memoryModuleCount: hardware.memoryModules.length, memoryCapacityBytes: hardware.memoryModules.reduce((sum, item) => sum + (item.capacityBytes || 0), 0) || null,
        bios: hardware.bios[0] ? { manufacturer: hardware.bios[0].manufacturer, version: hardware.bios[0].version, releaseDate: hardware.bios[0].releaseDate } : null,
        physicalDisks: hardware.physicalDisks, monitors: hardware.monitors, audioDevices: hardware.audio, usbControllers: hardware.usbControllers,
        problemDevices: hardware.problemDevices, problemDeviceCount: hardware.problemDevices.length,
        temperatures: hardware.temperatures,
        driverInstallationPerformed: false,
        unavailableSources: hardware.unavailable,
        providers: ['Win32_Processor', 'Win32_VideoController', 'Win32_BIOS', 'Win32_PhysicalMemory', 'MSFT_PhysicalDisk', 'Win32_DesktopMonitor', 'Win32_SoundDevice', 'Win32_USBController', 'Win32_PnPEntity']
      },
      warnings: unavailableWarnings(hardware.unavailable, 'hardware source'),
      partial: hardware.partial
    };
  }
  if (tool.engine === 'eventWarnings') {
    let events = null; let providerError = null;
    try { events = await windowsProviders.collectEvents(); } catch (error) { providerError = error; }
    const baseSummary = { periodDays: 7, groupedForTriage: true, levelFilter: [1, 2, 3], maxEvents: 200, boundedQuery: true, provider: 'Get-WinEvent (System log)', nativeEventLogApi: false, nativeEventLogApiNote: 'EvtQuery/EvtSubscribe would require a native addon; the bounded documented PowerShell query is used instead.' };
    // An unreadable event log is not an empty event log. The two are reported apart.
    if (!events) {
      const reason = String(providerError?.message || providerError?.code || 'unavailable');
      const warning = 'The Windows System event log could not be read; this is not an empty log.';
      context.warnings.push(warning);
      return { items: [], summary: { ...baseSummary, logAccessible: false, eventsRead: 0, unreadableReason: reason }, warnings: [warning], partial: true };
    }
    const clustered = advancedLocal.clusterEventWarnings(events.map(event => ({ ...event, ProviderName: event.provider, Id: event.eventId, LevelDisplayName: event.levelName, TimeCreated: event.timeCreated, Message: event.message })));
    return {
      items: clustered.items.map(item => ({
        provider: item.provider,
        eventId: item.id,
        id: item.id,
        level: item.level,
        levelName: item.levelName ?? item.level,
        frequency: item.count,
        count: item.count,
        latestOccurrence: item.latestAt,
        latestAt: item.latestAt,
        clusterKey: `${item.provider}/${item.id}/${item.level}`,
        evidence: { source: 'Windows System event log', boundedQuery: true, periodDays: 7, levelFilter: [1, 2, 3], maxEvents: 200, sample: item.sample ?? null }
      })),
      summary: { ...clustered.summary, ...baseSummary, logAccessible: true, eventsRead: events.length }
    };
  }
  if (tool.engine === 'processInventory') {
    const processes = await windowsProviders.collectProcesses();
    const ordered = [...processes].sort((a, b) => (b.workingSetBytes || 0) - (a.workingSetBytes || 0));
    // Authenticode verification is expensive (tens of seconds for a full pass),
    // so it is opt-in. Without it no signature verdict is claimed at all.
    const verifySignatures = inputs.verifySignatures === true;
    const candidates = [];
    const seenPaths = new Set();
    if (verifySignatures) {
      for (const item of ordered) {
        const key = String(item.executablePath || '').toLowerCase();
        if (!key || seenPaths.has(key)) continue;
        seenPaths.add(key); candidates.push(item);
        if (candidates.length >= SIGNATURE_BUDGET) break;
      }
    }
    const signatureBudget = candidates.length;
    const signatures = verifySignatures ? await windowsProviders.collectProcessSignatures(candidates.map(item => item.executablePath), { limit: SIGNATURE_BUDGET }) : [];
    const byPath = new Map(signatures.map(entry => [String(entry.path || '').toLowerCase(), entry]));
    const notChecked = signatures.filter(entry => !entry.signatureAvailable).length;
    if (verifySignatures && notChecked) context.warnings.push(`${notChecked} of ${signatureBudget} executable signature check(s) did not complete; those processes are reported without a signature verdict.`);
    if (!verifySignatures) context.warnings.push('Authenticode verification was not requested, so no signature verdict is reported for any process.');
    const shown = ordered.slice(0, 500);
    const items = shown.map(entry => {
      const signature = byPath.get(String(entry.executablePath || '').toLowerCase());
      return { ...entry, signatureStatus: signature?.signatureStatus ?? null, signatureAvailable: signature?.signatureAvailable ?? false, signatureSubject: signature?.signatureSubject ?? null, signatureMessage: signature?.signatureMessage ?? null };
    });
    return { items, partial: notChecked > 0 || shown.length < ordered.length, summary: { processes: ordered.length, shownProcesses: shown.length, truncated: shown.length < ordered.length, readOnly: true, signatureVerificationRequested: verifySignatures, signatureChecked: items.filter(item => item.signatureAvailable).length, signatureBudget, distinctExecutables: seenPaths.size, signatureBudgetExhausted: verifySignatures && seenPaths.size > SIGNATURE_BUDGET, signatureChecksFailed: notChecked, terminationPerformed: false, provider: verifySignatures ? 'Win32_Process + Get-AuthenticodeSignature (on request)' : 'Win32_Process' } };
  }
  if (tool.engine === 'batteryStatus') {
    const batteries = await windowsProviders.collectBatteries();
    return { items: batteries, summary: { batteryPresent: batteries.length > 0, batteries: batteries.length, unavailable: batteries.length === 0, temperatureAvailable: false, cycleCountAvailable: false, unavailableReason: batteries.length === 0 ? 'Windows reported no battery device.' : null, provider: 'Win32_Battery + root/WMI BatteryStatus' } };
  }
  if (tool.engine === 'fileHash') {
    const file = allowedFile(String(inputs.filePath || ''));
    const algorithm = inputs.algorithm === 'sha512' ? 'sha512' : 'sha256';
    const stats = await fsp.lstat(file);
    const classified = await classifyEntry(file, stats, { root: path.dirname(file), reparsePointPolicy: 'skip' });
    // Hashing a cloud placeholder would silently download remote content, and
    // hashing a link would read outside the file the user chose.
    if (classified.entryKind === 'reparse') throw new Error('This entry is a link or cloud placeholder; hashing it would read content the user did not select.');
    const before = windowsFs.identitySnapshot(stats);
    const totalBytes = Math.max(0, Number(before.size) || 0);
    const hash = crypto.createHash(algorithm);
    let bytesRead = 0; let lastReported = 0;
    await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(file);
      const cancel = () => { const error = new Error('Operation cancelled by the user.'); error.code = 'CANCELLED'; stream.destroy(error); };
      stream.on('error', error => reject(error));
      stream.on('data', chunk => {
        if (context.cancelRequested || context.cancelled) { cancel(); return; }
        bytesRead += chunk.length; hash.update(chunk);
        if (totalBytes > 0 && bytesRead - lastReported >= 4 * 1024 * 1024) { lastReported = bytesRead; context.progress(bytesRead, totalBytes, `Hashed ${Math.round((bytesRead / totalBytes) * 100)}% of the file`); }
      });
      stream.on('end', resolve);
    });
    context.progress(totalBytes || 1, totalBytes || 1, 'Finished reading the file');
    const after = windowsFs.identitySnapshot(await fsp.lstat(file).catch(() => null));
    const changedDuringRead = windowsFs.identityChanged(before, after);
    if (changedDuringRead) context.warnings.push('The file changed while it was being hashed; the digest may not describe a single consistent version.');
    return { items: [{ path: file, algorithm, digest: hash.digest('hex'), fileIdentity: before.fileIdentity, sizeAtRead: before.size, modifiedAtRead: new Date(before.modifiedMs).toISOString(), changedDuringRead }], summary: { algorithm, file, changedDuringRead, fileIdentity: before.fileIdentity, bytesRead, sizeAtRead: before.size, digestReliable: !changedDuringRead }, partial: changedDuringRead };
  }
  if (tool.engine === 'smartScan') {
    const health = await systemHealth(); context.progress(1, 7, 'Measured system health');
    // A volume source that does not answer degrades the scan; it must not
    // discard the storage, privacy and duplicate findings that did answer.
    let disk = []; let diskUnavailable = null;
    try { disk = await diskOverview(); } catch (error) { diskUnavailable = error; }
    if (diskUnavailable) context.warnings.push(`The volume source did not answer during the scan (${diskUnavailable.message}), so disk-pressure findings are absent.`);
    context.progress(2, 7, 'Read storage volumes and pressure');
    // One traversal of Downloads feeds large-file, privacy and duplicate analysis.
    const downloadsFolder = app.getPath('downloads');
    const downloadsData = await walk(downloadsFolder, context, { scanBudget: 15000 });
    const downloadIntelligence = advancedLocal.buildStorageIntelligence(downloadsData.files, downloadsFolder);
    const largeDownloads = [...downloadsData.files].filter(file => file.size >= 100 * 1024 * 1024).sort((a, b) => b.size - a.size);
    context.progress(3, 7, 'Built Downloads storage intelligence from one traversal');
    const privacy = advancedLocal.privacyExposure(downloadsData.files); context.progress(4, 7, 'Reviewed sensitive filenames using metadata only');
    const duplicate = await scanDuplicates(downloadsFolder, context, Math.max((await getSettings()).scanning.minimumDuplicateBytes, 1024), 10000);
    context.progress(5, 7, 'Verified exact duplicate groups with SHA-256');
    const temp = await runTool(context, toolDefinitions.find(t => t.engine === 'tempPreview'), {}); context.progress(6, 7, 'Measured recoverable temporary-file footprint');
    const score = advancedLocal.buildSmartScore({ health, disks: disk, duplicateSummary: duplicate.summary, privacySummary: privacy.summary, tempEligibleBytes: temp.summary.eligibleBytes }); context.progress(7, 7, 'Completed local multi-signal Smart Scan');    const findings = [];
    for (const volume of advancedLocal.diskPressure(disk || []).filter(item => item.pressure !== 'healthy')) findings.push({ severity: ['critical', 'high'].includes(volume.pressure) ? 'warning' : 'info', key: 'diskPressure', drive: volume.deviceId, freePercent: volume.freePercent, pressure: volume.pressure, source: 'Win32_LogicalDisk', evidence: `Volume ${volume.deviceId} has ${volume.freePercent}% free`, confidence: volume.freePercent == null ? 'low' : 'high' });
    if (largeDownloads.length) findings.push({ severity: 'info', key: 'largeDownloads', value: largeDownloads.length, bytes: largeDownloads.reduce((sum, file) => sum + file.size, 0), source: 'Downloads traversal', evidence: `${largeDownloads.length} file(s) at or above 100 MB`, confidence: 'high' });
    if (duplicate.summary.duplicateGroups) findings.push({ severity: 'info', key: 'exactDuplicates', groups: duplicate.summary.duplicateGroups, reclaimableBytes: duplicate.summary.reclaimableBytes, source: 'SHA-256 content verification', evidence: duplicate.summary.hardlinkPolicy, confidence: 'high' });
    if (privacy.summary.exposureCount) findings.push({ severity: 'warning', key: 'privacyMetadataReview', value: privacy.summary.exposureCount, contentsInspected: false, source: 'Filename metadata only', evidence: 'File contents were not read', confidence: 'medium' });
    if (temp.summary.eligibleFiles) findings.push({ severity: 'info', key: 'tempReview', value: temp.summary.eligibleFiles, bytes: temp.summary.eligibleBytes, source: 'Temporary directory traversal', evidence: `${temp.summary.eligibleFiles} file(s) older than the configured minimum age`, confidence: 'high' });
    if (downloadsData.totals.cloudPlaceholders) findings.push({ severity: 'info', key: 'cloudPlaceholders', value: downloadsData.totals.cloudPlaceholders, source: 'Reparse-point metadata', evidence: 'Cloud placeholders were identified and not hydrated', confidence: 'high' });
    if (downloadsData.totals.hardlinkedFiles) findings.push({ severity: 'info', key: 'hardlinkedFiles', value: downloadsData.totals.hardlinkedFiles, source: 'Windows file identity', evidence: 'Multiple names for one physical file are not reclaimable duplicates', confidence: 'high' });
    return {
      items: findings,
      // A source that did not answer leaves the result incomplete, so it has
      // to be reported as partial and not merely as a warning.
      partial: Boolean(downloadsData.partial || duplicate.partial || temp.partial || diskUnavailable),
      summary: {
        smartScore: score.score, scoreReasons: score.reasons, scoreMethod: 'backend local multi-signal calculation; the renderer only displays it', health,
        volumes: advancedLocal.diskPressure(disk),
        storageIntelligence: { typeGroups: downloadIntelligence.typeGroups, ageBuckets: downloadIntelligence.ageBuckets, topFolders: downloadIntelligence.topFolders },
        largeDownloads: largeDownloads.length || 0,
        exactDuplicateGroups: duplicate.summary.duplicateGroups || 0,
        duplicateReclaimableBytes: duplicate.summary.reclaimableBytes || 0,
        hardlinkPolicy: duplicate.summary.hardlinkPolicy,
        privacyExposureCount: privacy.summary.exposureCount || 0,
        privacyMetadataOnly: true, privacyContentsInspected: false,
        tempEligibleBytes: temp.summary.eligibleBytes || 0,
        // The scan performs three real folder traversals: Downloads, the
        // duplicate verification pass over Downloads, and the temporary folder.
        traversal: { ...downloadsData.totals, traversals: 3, traversalBreakdown: ['downloads-inventory', 'duplicate-files', 'temp-cleanup-preview'], partialStages: { downloads: Boolean(downloadsData.partial), duplicates: Boolean(duplicate.partial), temporary: Boolean(temp.partial) } }
      }
    };
  }
  throw new Error('Registered tool handler is unavailable.');
}
/**
 * Builds a truthful failed result. A request that never reached a handler must
 * still be visible in history and in the operation drawer: silently throwing
 * away an invalid request is how an operation disappears without explanation.
 */
function failedResult(operationId, toolId, startedAt, message, warnings = []) {
  return { operationId, toolId: toolId || 'unknown', success: false, startedAt, finishedAt: new Date().toISOString(), summary: {}, items: [], warnings, errors: [message], partial: false, restartRequired: false, undoMetadata: null };
}
async function recordFailure(operationId, toolId, startedAt, message, warnings = []) {
  const result = failedResult(operationId, toolId, startedAt, message, warnings);
  phase(operationId, result.toolId, 'failed', message, { result });
  await addHistory({ ...result, action: result.toolId, durationMs: new Date(result.finishedAt).getTime() - new Date(startedAt).getTime(), undoAvailable: false });
  await log('error', 'operation.failed', { operationId, toolId: result.toolId, error: message });
  return result;
}
function zodIssues(error) {
  const issues = Array.isArray(error?.issues) ? error.issues : [];
  return issues.map(issue => `${issue.path.join('.') || 'input'}: ${issue.message}`).join('; ') || 'The request was rejected.';
}
async function execute(request) {
  const startedAt = new Date().toISOString(); const operationId = crypto.randomUUID();
  const parsed = runRequestSchema.safeParse(request);
  if (!parsed.success) return recordFailure(operationId, null, startedAt, zodIssues(parsed.error));
  const tool = toolDefinitions.find(item => item.id === parsed.data.toolId);
  if (!tool) return recordFailure(operationId, parsed.data.toolId, startedAt, 'Unknown tool ID.');
  const availability = await tool.availabilityProbe().catch(error => ({ available: false, reason: error?.message || 'Tool availability could not be determined.' }));
  if (!availability.available) return recordFailure(operationId, tool.id, startedAt, availability.reason || 'Tool is unavailable.');
  const inputs = tool.inputSchema.safeParse(parsed.data.inputs);
  if (!inputs.success) return recordFailure(operationId, tool.id, startedAt, zodIssues(inputs.error));
  const context = { cancelled: false, cancelRequested: false, cancelHoldMs: tool.engine === 'largeFiles' ? cancelSmokeHoldMs : 0, cancelHoldDone: false, silent: parsed.data.silent === true, warnings: [], startedAt, updatedAt: startedAt, phase: 'idle', progressValue: null, progress: (current, total, message) => phase(operationId, tool.id, 'progress', message, { current, total, percent: Math.min(100, Math.round((current / Math.max(total, 1)) * 100)) }) };
  operations.set(operationId, context); phase(operationId, tool.id, 'queued', 'Operation queued'); phase(operationId, tool.id, 'preflight', 'Validated request, schema, handler, and local availability');
  if (tool.riskLevel !== 'read-only') phase(operationId, tool.id, 'awaiting-confirmation', 'Validated the explicit confirmation supplied for this write operation');
  // A silent operation is one the application started for itself, such as the
  // dashboard's background health measurement. It must not take over the
  // operation drawer the user was looking at.
  try {
    if (tool.requiresAdmin && !inputs.data.dryRun) { if ((await getSettings()).security.elevationPolicy === 'deny') throw new Error('Elevation is disabled in Security settings.'); phase(operationId, tool.id, 'awaiting-admin', 'Waiting for Windows administrator approval'); }
    phase(operationId, tool.id, 'running', 'Performing local Windows operation'); const output = tool.outputSchema.parse(await tool.handler(context, inputs.data));
    // A mutation that could not be proven is never reported as a clean success.
    const verificationStatus = typeof output.summary?.verification?.status === 'string' ? output.summary.verification.status : null;
    const partial = Boolean(output.partial) || verificationStatus === 'unverified';
    const success = verificationStatus !== 'failed';
    const errors = success ? [] : ['Post-change verification proved the requested state was not reached.'];
    const result = { operationId, toolId: tool.id, success, startedAt, finishedAt: new Date().toISOString(), summary: output.summary, items: output.items, warnings: [...context.warnings, ...(output.warnings || [])], errors, partial, restartRequired: Boolean(output.restartRequired), undoMetadata: output.undoMetadata || null };
    phase(operationId, tool.id, success ? 'result' : 'failed', success ? 'Structured result available' : (errors[0]), { result }); phase(operationId, tool.id, success ? 'completed' : 'failed', success ? 'Operation completed' : errors[0], { result });
    await addHistory({ ...result, action: tool.id, durationMs: new Date(result.finishedAt).getTime() - new Date(startedAt).getTime(), undoAvailable: tool.supportsUndo && Boolean(result.undoMetadata) }); await log('info', 'operation.completed', { operationId, toolId: tool.id, partial }); return result;
  } catch (error) {
    const cancelled = error.code === 'CANCELLED'; const result = { operationId, toolId: tool.id, success: false, startedAt, finishedAt: new Date().toISOString(), summary: {}, items: [], warnings: context.warnings, errors: [error.message], partial: false, restartRequired: false, undoMetadata: null };
    phase(operationId, tool.id, cancelled ? 'cancelled' : 'failed', error.message, { result }); await addHistory({ ...result, action: tool.id, durationMs: new Date(result.finishedAt).getTime() - new Date(startedAt).getTime(), undoAvailable: false }); await log('error', 'operation.failed', { operationId, toolId: tool.id, error: error.message }); return result;
  } finally { operations.delete(operationId); }
}
/**
 * Proves the Clipboard Vault against the REAL Windows clipboard inside the
 * packaged application.
 *
 * The text is written to the operating system clipboard, the vault observes
 * it through the same poll any other application would trigger, and the item
 * is then pinned, deleted and cleared. Capture is enabled first through the
 * ordinary settings path, because capture is opt-in.
 */
async function verifyClipboardVault() {
  if (!clipboardVault) return { skipped: 'vault-unavailable' };
  const marker = `KNOuX clipboard smoke ${Date.now()}`;
  const settle = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const before = clipboardVault.status();
  clipboard.writeText(marker);
  await settle(2600);
  const captured = clipboardVault.list({ query: marker })[0] || null;

  await updateSettings({ clipboard: { ...(await getSettings()).clipboard, paused: true } });
  clipboard.writeText(`${marker} paused`);
  await settle(2200);
  const duringPause = clipboardVault.list({ query: 'paused' }).length;

  await updateSettings({ clipboard: { ...(await getSettings()).clipboard, paused: false } });
  clipboard.writeText(`${marker} resumed`);
  await settle(2200);
  const afterResume = clipboardVault.list({ query: 'resumed' }).length;

  let pinned = false;
  let deleted = false;
  if (captured) {
    const result = await clipboardVault.setPinned(captured.id, true);
    pinned = Boolean(result?.pinned);
    deleted = await clipboardVault.remove(captured.id);
  }
  const cleared = await clipboardVault.clear();
  const after = clipboardVault.status();
  return {
    enabledBefore: before.enabled,
    marker,
    captured: Boolean(captured),
    capturedPreview: captured?.preview ?? null,
    capturedType: captured?.type ?? null,
    capturedDuringPause: duringPause > 0,
    capturedAfterResume: afterResume > 0,
    pinned,
    deleted,
    clearedItems: cleared,
    storageMode: after.storageMode,
    persistenceAvailable: after.persistenceAvailable,
    encryptionAvailable: after.encryptionAvailable,
    itemsAfterClear: after.items
  };
}

/**
 * Captures visual acceptance evidence FROM THE RUNNING APPLICATION.
 *
 * Nothing here is drawn or simulated: each PNG is a real `capturePage()` of the
 * packaged window, and each measurement is read from the live document.
 */
/**
 * What a populated Applications capture has to wait for.
 *
 * The ledger rows appear when the inventory read lands; the icons arrive later,
 * in bounded batches, because the renderer asks for what is visible instead of
 * blocking the first paint on 150 shell lookups. A screenshot taken between those
 * two moments shows a fallback grid and would be filed as evidence of the
 * interface it is meant to prove.
 */
const INVENTORY_WAITS = [
  { selector: '.appx__row', min: 5, ms: 90000 },
  { selector: '.appx-icon--img', min: 3, ms: 25000 }
];

/**
 * What a populated Files capture has to wait for.
 *
 * The bench reads the Downloads directory table on mount, so the first rows are
 * the signal that a real folder was read. The organisation plan is not a read:
 * it is computed only when the preview button is pressed, so it is waited for
 * separately, after the prepare script has clicked.
 */
const FILES_WAITS = [
  { selector: '.filex__row', min: 5, ms: 90000 },
  { selector: '.filex__seg', min: 2, ms: 20000 }
];

const FILES_PLAN_WAITS = [
  { selector: '.filex__planbody', min: 1, ms: 60000 }
];

/**
 * What a populated Storage capture has to wait for.
 *
 * The volume table is a real WMI round trip: `disk-overview` answers when
 * Win32_LogicalDisk and MSFT_PhysicalDisk have both replied, so the first rails
 * are the evidence that the machine was actually read rather than laid out from a
 * template. A walk is a different animal — it enumerates a tree under a scan
 * budget, so the ledger and the ladders are waited for only after the button that
 * starts the walk has been clicked.
 */
// The rack is a cold Windows round trip: the first Win32_LogicalDisk query of a
// freshly started process took longer than a minute and a half on the machine
// this suite runs on (measured — the second read of the same class returned in
// under four seconds), so the first wait is generous and every wait after it is
// a check that the page drew what the engine already gave it.
const ATLAS_WAITS = [
  { selector: '.atlas__bay', min: 1, ms: 180000 },
  { selector: '.atlas__rail', min: 1, ms: 30000 }
];

const WALK_WAITS = [
  { selector: '.atlas__row', min: 5, ms: 240000 },
  { selector: '.atlas__rung', min: 6, ms: 30000 }
];

// The empties walk is a folder-only traversal: it never hashes a byte, so it
// answers well inside the heavy walk's budget. One row is enough to open a
// folder record, which is all this wait is asked to prove.
const EMPTIES_WAITS = [
  { selector: '.atlas__row', min: 1, ms: 240000 }
];

/**
 * What a service-world capture has to wait for.
 *
 * The hero and the twelve cards are rendered from the catalogue, so their
 * presence proves the world itself drew. The card is the unit every category
 * now shares: if a world shows fewer than twelve of them, its ledger is short
 * and the capture is evidence of that, not of a world that is simply loading.
 */
const WORLD_WAITS = [
  { selector: '.stage__head', min: 1, ms: 90000 },
  { selector: '.svc-card', min: 12, ms: 45000 }
];

/** The preview panel, after a card has been opened by the prepare script. */
const PREVIEW_WAITS = [
  { selector: '.svc-preview__panel', min: 1, ms: 20000 },
  { selector: '.svc-preview__steps li', min: 3, ms: 10000 }
];

/**
 * Automation is the Flow Studio now: the library, the node canvas, the node
 * rail and the execution preview all draw from local state, and the twelve
 * canonical cards sit beneath them. A capture that found cards but no canvas
 * would be a picture of the old page filed under the new name.
 */
const AUTOMATION_WAITS = [
  { selector: '.flowstudio', min: 1, ms: 60000 },
  { selector: '.flow-node', min: 5, ms: 30000 },
  { selector: '.flow-preview', min: 1, ms: 30000 },
  { selector: '.svc-card', min: 12, ms: 60000 }
];

/** The home portal shows every world, so eleven tiles are the signal it drew. */
const PORTAL_WAITS = [
  { selector: '.portal-tile', min: 11, ms: 60000 }
];

async function captureVisualEvidence(outputDirectory) {
  const fsPromises = fsp;
  await fsPromises.mkdir(outputDirectory, { recursive: true });
  const originalBounds = mainWindow.getBounds();
  const originalAlwaysOnTop = mainWindow.isAlwaysOnTop();
  const originalSettings = await getSettings();
  // The window is sized and placed inside the work area, not at whatever
  // position the user happened to leave it in. A requested size that hangs off
  // the edge of the display is a window Windows re-clamps mid-run: the capture
  // then shows a width nobody asked for, and the compositor can stop producing
  // frames altogether. Anchoring to the work area's top-left keeps every
  // capture honest, and the clamp records the largest size this display can
  // actually show instead of pretending a bigger one was measured.
  //
  // The anchor is inset rather than flush. A frame that touches both the top
  // and the side of the work area is a window the shell reads as a snap or
  // maximise candidate, and once the shell owns the geometry it can take the
  // size away between two of this harness's own measurements.
  const display = screen.getPrimaryDisplay();
  const workArea = display.workArea;
  const PLACEMENT_INSET = 24;
  const placementOrigin = () => ({ x: workArea.x + PLACEMENT_INSET, y: workArea.y + PLACEMENT_INSET });
  const targetSize = scenario => ({
    width: Math.min(scenario.width, workArea.width - PLACEMENT_INSET * 2),
    height: Math.min(scenario.height, workArea.height - PLACEMENT_INSET * 2)
  });
  const scenarios = [
    { name: 'en-home-1366x768', locale: 'en', page: 'home', width: 1366, height: 768 },
    { name: 'ar-home-1366x768', locale: 'ar', page: 'home', width: 1366, height: 768 },
    { name: 'en-clipboard-1366x768', locale: 'en', page: 'clipboard', width: 1366, height: 768 },
    { name: 'ar-clipboard-1366x768', locale: 'ar', page: 'clipboard', width: 1366, height: 768 },
    { name: 'en-clipboard-860x600', locale: 'en', page: 'clipboard', width: 860, height: 600 },
    { name: 'ar-home-860x600', locale: 'ar', page: 'home', width: 860, height: 600 },
    { name: 'en-home-1024x768', locale: 'en', page: 'home', width: 1024, height: 768 },
    { name: 'ar-home-1024x768', locale: 'ar', page: 'home', width: 1024, height: 768 },
    { name: 'en-clipboard-1920x1080', locale: 'en', page: 'clipboard', width: 1920, height: 1080 },
    { name: 'ar-clipboard-1920x1080', locale: 'ar', page: 'clipboard', width: 1920, height: 1080 },
    // The Applications world reads the real installed-program inventory, so these
    // scenarios wait for live rows and for the native icon batches rather than for
    // a fixed delay. The prepare scripts drive the actual interface: clicking a row
    // opens the dossier, clicking row checkboxes raises the staging deck.
    { name: 'en-applications-1920x1080', locale: 'en', page: 'applications', width: 1920, height: 1080, waits: INVENTORY_WAITS },
    { name: 'ar-applications-1920x1080', locale: 'ar', page: 'applications', width: 1920, height: 1080, waits: INVENTORY_WAITS },
    { name: 'en-applications-dossier-1366x768', locale: 'en', page: 'applications', width: 1366, height: 768, waits: INVENTORY_WAITS, requiresDossier: true, prepare: 'var o=document.querySelector(".appx__opener"); if(o) o.click();' },
    { name: 'ar-applications-deck-1366x768', locale: 'ar', page: 'applications', width: 1366, height: 768, waits: INVENTORY_WAITS, requiresDeck: true, prepare: 'Array.from(document.querySelectorAll(".appx__row input[type=checkbox]")).slice(0,4).forEach(function(c){ c.click(); });' },
    { name: 'en-applications-light-1366x768', locale: 'en', page: 'applications', theme: 'light', width: 1366, height: 768, waits: INVENTORY_WAITS },
    { name: 'ar-applications-860x600', locale: 'ar', page: 'applications', width: 860, height: 600, waits: INVENTORY_WAITS, requiresDossier: true, prepare: 'var o=document.querySelector(".appx__opener"); if(o) o.click();' },
    // The Files bench reads the Downloads tree, so the same rule applies: wait for
    // real rows. The inspector opens on a row click; the plan band appears only
    // after the preview button has been pressed and the engine has answered.
    { name: 'en-files-1920x1080', locale: 'en', page: 'files', width: 1920, height: 1080, waits: FILES_WAITS },
    { name: 'ar-files-1920x1080', locale: 'ar', page: 'files', width: 1920, height: 1080, waits: FILES_WAITS },
    { name: 'en-files-inspector-1366x768', locale: 'en', page: 'files', width: 1366, height: 768, waits: FILES_WAITS, requiresInspector: true, prepare: 'var o=document.querySelector(".filex__opener"); if(o) o.click();', scrollTo: '.filex__inspector' },
    { name: 'en-files-plan-1366x768', locale: 'en', page: 'files', width: 1366, height: 768, waits: FILES_WAITS, requiresPlan: true, prepare: 'var b=document.querySelector(".filex__plan-preview"); if(b) b.click();', waitsAfterPrepare: FILES_PLAN_WAITS, scrollTo: '.filex__planbody' },
    { name: 'ar-files-plan-860x600', locale: 'ar', page: 'files', width: 860, height: 600, waits: FILES_WAITS, requiresPlan: true, prepare: 'var b=document.querySelector(".filex__plan-preview"); if(b) b.click(); var o=document.querySelector(".filex__opener"); if(o) o.click();', waitsAfterPrepare: FILES_PLAN_WAITS, scrollTo: '.filex__planbody' },
    { name: 'en-files-light-1366x768', locale: 'en', page: 'files', theme: 'light', width: 1366, height: 768, waits: FILES_WAITS },
    // The Volume Atlas reads the Windows volume table on mount, so the rack is
    // waited for. A walk is started by the prepare script — the atlas never walks
    // a folder the reader did not choose — and its ledger and ladders are then
    // waited for separately. The inspector scenario needs a second act, because
    // the row it opens only exists once that walk has answered.
    { name: 'en-storage-1920x1080', locale: 'en', page: 'storage', width: 1920, height: 1080, waits: ATLAS_WAITS },
    { name: 'ar-storage-1920x1080', locale: 'ar', page: 'storage', width: 1920, height: 1080, waits: ATLAS_WAITS },
    { name: 'en-storage-walked-1366x768', locale: 'en', page: 'storage', width: 1366, height: 768, waits: ATLAS_WAITS, requiresLedger: true, prepare: 'var b=document.querySelector(".atlas__lane[data-lane=heavy] .atlas__lanefoot .world-control"); if(b) b.click();', waitsAfterPrepare: WALK_WAITS, scrollTo: '.atlas__ladders' },
    { name: 'en-storage-inspector-1366x768', locale: 'en', page: 'storage', width: 1366, height: 768, waits: ATLAS_WAITS, requiresInspector: true, prepare: 'var b=document.querySelector(".atlas__lane[data-lane=heavy] .atlas__lanefoot .world-control"); if(b) b.click();', waitsAfterPrepare: WALK_WAITS, interact: 'var r=document.querySelector(".atlas__row"); if(r) r.click();', scrollTo: '.atlas__inspector' },
    // The read board is what the inspector shows while nothing is picked, so it
    // needs its own capture with a walk answered but no row opened: that is the
    // only state where the three roots and their agreement line are on screen.
    { name: 'en-storage-readboard-1366x768', locale: 'en', page: 'storage', width: 1366, height: 768, waits: ATLAS_WAITS, prepare: 'var b=document.querySelector(".atlas__lane[data-lane=heavy] .atlas__lanefoot .world-control"); if(b) b.click();', waitsAfterPrepare: WALK_WAITS, scrollTo: '.atlas__inspector' },
    // And its resting twin: no walk has run, in Arabic, at the narrow size — the
    // state every reader lands in first, and the one where an idle column is
    // most tempting to leave empty.
    { name: 'ar-storage-readboard-860x600', locale: 'ar', page: 'storage', width: 860, height: 600, waits: ATLAS_WAITS, scrollTo: '.atlas__inspector' },
    { name: 'ar-storage-walked-860x600', locale: 'ar', page: 'storage', width: 860, height: 600, waits: ATLAS_WAITS, requiresLedger: true, prepare: 'var b=document.querySelector(".atlas__lane[data-lane=heavy] .atlas__lanefoot .world-control"); if(b) b.click();', waitsAfterPrepare: WALK_WAITS },
    // The empty-folder record is the fourth thing the inspector can be asked to
    // show, and the only one made of a read rather than a measurement. The ledger
    // follows the walk that answered, so clicking the empties lane and then its
    // first row is enough to land the column on a folder. Captured twice: the
    // narrow Arabic pass is where a long parent path and a drive letter in the
    // same line are most likely to break the row.
    { name: 'en-storage-folder-1366x768', locale: 'en', page: 'storage', width: 1366, height: 768, waits: ATLAS_WAITS, requiresFolder: true, prepare: 'var b=document.querySelector(".atlas__lane[data-lane=empties] .atlas__lanefoot .world-control"); if(b) b.click();', waitsAfterPrepare: EMPTIES_WAITS, interact: 'var r=document.querySelector(".atlas__row"); if(r) r.click();', scrollTo: '.atlas__inspector' },
    { name: 'ar-storage-folder-860x600', locale: 'ar', page: 'storage', width: 860, height: 600, waits: ATLAS_WAITS, requiresFolder: true, prepare: 'var b=document.querySelector(".atlas__lane[data-lane=empties] .atlas__lanefoot .world-control"); if(b) b.click();', waitsAfterPrepare: EMPTIES_WAITS, interact: 'var r=document.querySelector(".atlas__row"); if(r) r.click();', scrollTo: '.atlas__inspector' },
    { name: 'en-storage-light-1366x768', locale: 'en', page: 'storage', theme: 'light', width: 1366, height: 768, waits: ATLAS_WAITS },
    // The seven worlds that used to share one generic catalogue page, plus
    // Automation with its ledger attached. Every one of them now carries the
    // same twelve-card unit, so a single capture per world proves the breadth,
    // and the Arabic, narrow and open-preview passes cover the parts that break
    // first when a card grid meets a real locale and a small window.
    { name: 'en-cleanup-1366x768', locale: 'en', page: 'cleanup', width: 1366, height: 768, waits: WORLD_WAITS },
    { name: 'ar-cleanup-1366x768', locale: 'ar', page: 'cleanup', width: 1366, height: 768, waits: WORLD_WAITS },
    { name: 'en-cleanup-860x600', locale: 'en', page: 'cleanup', width: 860, height: 600, waits: WORLD_WAITS },
    { name: 'en-startup-1366x768', locale: 'en', page: 'startup', width: 1366, height: 768, waits: WORLD_WAITS },
    { name: 'en-system-1366x768', locale: 'en', page: 'system', width: 1366, height: 768, waits: WORLD_WAITS },
    { name: 'en-repair-1366x768', locale: 'en', page: 'repair', width: 1366, height: 768, waits: WORLD_WAITS },
    { name: 'en-services-1366x768', locale: 'en', page: 'services', width: 1366, height: 768, waits: WORLD_WAITS },
    { name: 'en-network-1366x768', locale: 'en', page: 'network', width: 1366, height: 768, waits: WORLD_WAITS },
    { name: 'en-hardware-1366x768', locale: 'en', page: 'hardware', width: 1366, height: 768, waits: WORLD_WAITS },
    { name: 'ar-startup-1366x768', locale: 'ar', page: 'startup', width: 1366, height: 768, waits: WORLD_WAITS },
    { name: 'en-repair-860x600', locale: 'en', page: 'repair', width: 860, height: 600, waits: WORLD_WAITS, scrollTo: '.stage__flow' },
    { name: 'en-automation-1366x768', locale: 'en', page: 'automation', width: 1366, height: 768, waits: AUTOMATION_WAITS, scrollTo: '.flowstudio' },
    // Flow Studio evidence: the editor at desktop density, the same editor in
    // Arabic, a light-theme pass, the narrow window and the execution preview.
    { name: 'en-flow-studio-1920x1080', locale: 'en', page: 'automation', width: 1920, height: 1080, waits: AUTOMATION_WAITS, scrollTo: '.flowstudio' },
    { name: 'ar-flow-studio-1920x1080', locale: 'ar', page: 'automation', width: 1920, height: 1080, waits: AUTOMATION_WAITS, scrollTo: '.flowstudio' },
    { name: 'en-flow-studio-light-1366x768', locale: 'en', theme: 'light', page: 'automation', width: 1366, height: 768, waits: AUTOMATION_WAITS, scrollTo: '.flow-canvas' },
    { name: 'en-flow-studio-860x600', locale: 'en', page: 'automation', width: 860, height: 600, waits: AUTOMATION_WAITS, scrollTo: '.flow-canvas' },
    { name: 'en-flow-studio-head-1366x768', locale: 'en', page: 'automation', width: 1366, height: 768, waits: AUTOMATION_WAITS },
    // The canvas must be interactive, not an illustration: load a template,
    // then add a node through the real control and wait for the sixth card.
    { name: 'en-flow-studio-edited-1366x768', locale: 'en', page: 'automation', width: 1366, height: 768, waits: AUTOMATION_WAITS, prepare: 'var tpl=document.querySelector(".flow-item--template .flow-item__main"); if(tpl) tpl.click(); setTimeout(function(){ var add=document.querySelector(".flow-add .world-control"); if(add) add.click(); }, 420);', waitsAfterPrepare: [{ selector: '.flow-node', min: 6, ms: 12000 }], requiresEditedFlow: true, scrollTo: '.flowstudio' },
    { name: 'en-cleanup-light-1366x768', locale: 'en', theme: 'light', page: 'cleanup', width: 1366, height: 768, waits: WORLD_WAITS },
    { name: 'en-flow-preview-1366x768', locale: 'en', page: 'automation', width: 1366, height: 768, waits: AUTOMATION_WAITS, scrollTo: '.flow-preview' },
    // The native dialog pass proves modal semantics from the live document and
    // then exercises Tab and Escape with real input events after the frame is
    // taken, so the keyboard evidence does not need a second screenshot.
    { name: 'en-automation-preview-1366x768', locale: 'en', page: 'automation', width: 1366, height: 768, waits: AUTOMATION_WAITS, prepare: 'var c=document.querySelector("[data-service=auto-smart-scan] .svc-card__primary"); if(c){ c.focus(); c.click(); }', waitsAfterPrepare: PREVIEW_WAITS, requiresDialog: true },
    { name: 'en-home-portal-1366x768', locale: 'en', page: 'home', width: 1366, height: 768, waits: PORTAL_WAITS, scrollTo: '.portal-grid' },
    { name: 'en-repair-preview-1366x768', locale: 'en', page: 'repair', width: 1366, height: 768, waits: WORLD_WAITS, prepare: 'var c=document.querySelector("[data-service=repair-component-scan] .svc-card__primary"); if(c) c.click();', waitsAfterPrepare: PREVIEW_WAITS },
    { name: 'ar-cleanup-preview-860x600', locale: 'ar', page: 'cleanup', width: 860, height: 600, waits: WORLD_WAITS, prepare: 'var c=document.querySelector("[data-service=cleanup-temp-quarantine] .svc-card__primary"); if(c) c.click();', waitsAfterPrepare: PREVIEW_WAITS }
  ];
  // One or more named scenarios (or page names), comma separated, so one layout
  // question gets one answer in about twenty seconds instead of a full pass over
  // every world — and so a defect that only shows up when one world follows
  // another, like a Files capture handing its page to the Storage run, can be
  // reproduced without the whole suite. An unrecognised name is reported as an
  // empty run by the harness, which fails loudly.
  const only = argumentValue('knoux-visual-smoke-only');
  const wanted = only ? only.split(',').map(token => token.trim()).filter(Boolean) : [];
  const selected = wanted.length ? scenarios.filter(scenario => wanted.some(token => scenario.name === token || scenario.page === token)) : scenarios;
  const results = [];
  const settle = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Move a region into the frame the capture will take.
   *
   * In the DOM is not on the screen: a short viewport can hold a control far
   * below the fold, and a screenshot of the top of that page is not evidence of
   * the control. A scenario that claims one asks for the page to be scrolled to
   * it, which is what a person reviewing the picture would do, and the offset is
   * reported so the capture says where it was taken from.
   *
   * An explicit scroll rather than scrollIntoView: the header is sticky, several
   * ancestors clip, and the capture has to show the region it names rather than
   * the tail of it.
   *
   * This runs twice per scenario — once after the page settles, and once in the
   * instant before the frame. The second call is not decoration: a record that
   * replaces a taller panel shortens the document, and a window manager that
   * re-places the frame in between leaves the browser clamping the scroll back
   * down to whatever height the page has by then. A picture is only evidence of
   * the region it names if that region is inside it when the pixels are taken.
   */
  const scrollToRegion = async (selector, label) => {
    // Framing is a loop, not a command. The page keeps changing under the
    // capture: a walk that finishes replaces its progress lane with a shorter
    // note, the document shrinks by a screenful, and a region that was at the
    // clearance line when the scroll was issued sits above the header by the
    // time the frame is taken. Measured on the atlas, where the composition
    // ladders were photographed from their third row down.
    //
    // So the scroll is asked for, measured, and asked again while the region is
    // still coming into place, and gives up the moment it stops improving — a
    // region below the last scrollable pixel is reported, not chased.
    const clearance = 88;
    let scroll = { reached: false };
    let lastDrift = Infinity;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      scroll = await mainWindow.webContents.executeJavaScript(`(() => {
        const node = document.querySelector(${JSON.stringify(selector)});
        if (!node) return { reached: false };
        const drifted = Math.abs(node.getBoundingClientRect().top - ${clearance}) > 3;
        if (drifted) window.scrollTo({ top: Math.max(0, Math.round(window.scrollY + node.getBoundingClientRect().top - ${clearance})), behavior: 'instant' });
        const box = node.getBoundingClientRect();
        return { reached: true, drifted, offset: Math.round(box.top), height: Math.round(box.height), viewport: Math.round(window.innerHeight), scrollY: Math.round(window.scrollY) };
      })()`).catch(() => ({ reached: false }));
      if (!scroll.reached) break;
      const drift = Math.abs(Number(scroll.offset) - clearance);
      if (drift <= 3 || drift >= lastDrift) break;
      lastDrift = drift;
      await settle(140);
    }
    const offset = Number.isFinite(scroll.offset) ? scroll.offset : null;
    if (label) {
      await progress(`scrolled ${label} ${selector}=${scroll.reached} top=${offset === null ? 'n/a' : offset} h=${scroll.height ?? 'n/a'} of ${scroll.viewport ?? 'n/a'}px`);
    }
    // The one claim that decides whether the picture is evidence of the region
    // it names: the region has to start inside the frame. A top edge above the
    // viewport means the capture shows the tail of the panel and nothing more.
    return { selector, found: scroll.reached === true, offset, scrollY: Number.isFinite(scroll.scrollY) ? scroll.scrollY : -1, height: Number.isFinite(scroll.height) ? scroll.height : null, viewport: Number.isFinite(scroll.viewport) ? scroll.viewport : null, topInView: offset !== null && offset >= -2 };
  };

  /**
   * Window placement the harness can trust.
   *
   * Windows maximises and snaps this window on its own — the shell does it
   * while the harness is waiting for a page to settle, and a maximised window
   * ignores setBounds() completely, so every later scenario would silently be
   * captured at the maximised size. Two defences run together: the window is
   * made non-resizable and non-maximisable for the duration of the run, which
   * removes the snap affordances the shell was using, and the 'maximize'
   * event puts the scenario's geometry back if the shell forces it anyway.
   * The recovery is capped per scenario: a harness that keeps unmaximising a
   * window the shell keeps maximising is a fight over the window procedure,
   * and it ends with the compositor producing no frames at all. Every
   * recovery is counted and reported, because a screenshot is only ever filed
   * under a size the window actually had.
   */
  let placement = null;
  let maximizeRecoveries = 0;
  let recoveriesThisScenario = 0;
  let restoringPlacement = false;
  const placeWindow = (target) => {
    placement = target;
    const origin = placementOrigin();
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    if (mainWindow.isFullScreen()) mainWindow.setFullScreen(false);
    mainWindow.setBounds({ ...origin, width: target.width, height: target.height });
  };
  const reclaimPlacement = () => {
    if (!placement || !mainWindow || restoringPlacement) return;
    if (recoveriesThisScenario >= 2) {
      void progress(`maximise-guard stood down for ${placement.width}x${placement.height} after ${recoveriesThisScenario} recoveries`);
      return;
    }
    restoringPlacement = true;
    maximizeRecoveries += 1;
    recoveriesThisScenario += 1;
    void progress(`window-maximised-by-shell -> re-placed ${placement.width}x${placement.height} (recovery ${maximizeRecoveries})`);
    // Unmaximising inside the maximize event itself re-enters the window
    // procedure, so the correction is handed to the next tick.
    setImmediate(() => {
      try {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        mainWindow.setBounds({ ...placementOrigin(), width: placement.width, height: placement.height });
      } finally { restoringPlacement = false; }
    });
  };
  mainWindow.on('maximize', reclaimPlacement);
  // The root cause of every "no frame" this run has produced, found by
  // measurement rather than guesswork: the product's own window policy. With
  // "minimise to tray" switched on — and it is switched on in this user's
  // settings — `minimize` is preventDefault()ed and replaced by `hide()`. A
  // hidden window has no desktop surface at all, so capturePage() never settles,
  // while the page keeps reporting itself visible because the run switched off
  // occlusion calculation. The harness then restores a window that is not
  // minimised and not hidden, asks again, and loses. For the duration of the
  // measuring run the product's handler is therefore detached and replaced by
  // one that puts the window back on screen; the finally block hands the policy
  // to the app again, because a product that refuses to be minimised is a bug.
  const appMinimiseHandlers = mainWindow.listeners('minimize');
  mainWindow.removeAllListeners('minimize');
  let minimizeRecoveries = 0;
  let minimisesThisPass = 0;
  const reclaimMinimisedWindow = () => {
    if (!mainWindow || !placement) return;
    if (minimisesThisPass >= 6) {
      if (minimisesThisPass === 6) {
        minimisesThisPass += 1;
        void progress(`minimise-guard stood down for ${placement.width}x${placement.height}`);
      }
      return;
    }
    minimisesThisPass += 1;
    minimizeRecoveries += 1;
    void progress(`window-minimised-by-shell -> restored (recovery ${minimizeRecoveries})`);
    setImmediate(() => {
      try {
        if (mainWindow.isMinimized()) mainWindow.restore();
        if (!mainWindow.isVisible()) mainWindow.show();
        mainWindow.moveTop();
      } catch { /* the shell won this round; the capture loop asks again */ }
    });
  };
  mainWindow.on('minimize', reclaimMinimisedWindow);
  const geometry = () => {
    const b = mainWindow.getBounds();
    return `${b.width}x${b.height}@${b.x},${b.y} vis=${mainWindow.isVisible()} min=${mainWindow.isMinimized()} max=${mainWindow.isMaximized()} focus=${mainWindow.isFocused()}`;
  };
  // The single fact that separates "the page is not painting" from "the frame
  // was not asked for in time" is the page's own visibility state, so a failed
  // capture records it rather than leaving the next reader to guess.
  const pageVisibility = async () => await mainWindow.webContents
    .executeJavaScript('document.visibilityState').catch(() => 'unknown');
  /**
   * Captures the real window.
   *
   * The compositor refuses to produce a frame before the window has been
   * painted, and it reports that refusal as an opaque viz error. A capture
   * that is retried until the window is ready is the difference between a
   * real screenshot and a failed run. When three polite requests go
   * unanswered the surface itself is woken: a window that has been moved and
   * resized is a window the compositor has to repaint, which is the cure for
   * a surface that has decided it is not visible. If even that is answered
   * with a refused frame, `surfaceLost` is set and the run stops — a
   * compositor that will not paint is not going to change its mind eighteen
   * more times, and a run that knows it has died says so in a minute instead
   * of timing out half an hour later.
   */
  let surfaceLost = false;
  let consecutiveSurfaceFailures = 0;
  const captureWindow = async (label, target, beforeFrame) => {
    let lastError = null;
    let reasserts = 0;
    let nudges = 0;
    let unplaceableStreak = 0;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        // The window has to be on screen for the compositor to produce a
        // frame for it, and it needs a beat after coming back before a frame
        // exists: restore() and show() return as soon as the window procedure
        // is told, not as soon as the surface is.
        let woke = false;
        if (mainWindow.isMinimized()) { mainWindow.restore(); woke = true; }
        if (!mainWindow.isVisible()) { mainWindow.show(); woke = true; }
        // Raising is not a courtesy here: a window another window covers is a
        // window the compositor has stopped feeding, and every attempt below
        // asks for a frame from whichever surface is currently live.
        mainWindow.moveTop();
        if (woke) await settle(200);
        if (attempt === 0 || attempt === 3 || attempt === 6) { // attempt 0 jogs as well: after a minimise/restore the compositor can hand back the last frame it committed rather than a new one, and a stale frame filed under a fresh DOM is worse evidence than no frame at all
          nudges += 1;
          await progress(`surface-nudge ${label} attempt ${attempt + 1}: ${geometry()}`);
          mainWindow.moveTop();
          mainWindow.focus();
          mainWindow.setBounds({ x: workArea.x + 72, y: workArea.y + 72, width: target.width, height: target.height });
          await settle(150);
          placeWindow(target);
          await settle(200);
        }
        // Windows re-clamps a window that fills the work area, and an RTL
        // document can make it reposition the frame, so the whole placement —
        // position as well as size — is re-asserted in the instant before the
        // frame is asked for. A window manager on the machine (a snap tool, a
        // stale multi-monitor layout) also moves frames from under a run: a
        // window with eight hundred pixels of its width off the primary
        // display has no surface for the compositor to hand back, and the run
        // then reads that as "no frame in time" and blames the page. The
        // capture is either the size and place the scenario claims, or the
        // attempt is retried — never a screenshot filed under a geometry it
        // does not have.
        const before = mainWindow.getBounds();
        const origin = placementOrigin();
        const drifted = before.x !== origin.x || before.y !== origin.y
          || before.width !== target.width || before.height !== target.height
          || mainWindow.isMaximized();
        if (drifted) {
          reasserts += 1;
          await progress(`bounds-reassert ${label} ${before.width}x${before.height}@${before.x},${before.y} max=${mainWindow.isMaximized()} -> ${target.width}x${target.height}@${origin.x},${origin.y}`);
          placeWindow(target);
          await settle(250);
        }
        // The page is placed in the same instant the window is: a scenario that
        // named a region had it scrolled into frame a moment ago, and anything
        // that changed the document's height since then — a record replacing a
        // taller panel, a re-asserted bounds nudging a reflow — can have clamped
        // that scroll back and carried the region out of the picture. The frame
        // is asked for with the region where the scenario says it is. Whatever
        // that placement measured is returned, so the evidence reports the scroll
        // the picture was taken at rather than the one the page held a moment
        // earlier — those two are the same only when nothing moved in between.
        let scrolledAtFrame = null;
        if (beforeFrame) scrolledAtFrame = await beforeFrame().catch(() => null);
        // The size is read in the same instant the frame is asked for, together
        // with the content area the page is actually laid out in. The outer
        // bounds include the invisible resize border Windows draws, so the
        // painted frame is smaller than the window, and the acceptance record
        // has to say both numbers.
        const boundsBeforeFrame = mainWindow.getBounds();
        const contentBeforeFrame = mainWindow.getContentBounds();
        // The capture is bounded. A frame request that the compositor never
        // satisfies does not reject, it simply never settles, and a harness
        // that waits for it waits forever.
        //
        // The budget is not tight: after the shell has snapped, maximised and
        // restored this window a few times in a second, the compositor needs a
        // moment before it produces a frame again, and a five-second race
        // against that moment reads as a dead surface. Two tries at eight
        // seconds, then twelve — still under a minute for all eight attempts.
        const image = await Promise.race([
          mainWindow.capturePage(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('the capture produced no frame in time')), attempt < 2 ? 8000 : 12000))
        ]);
        if (image && !image.isEmpty()) return { image, boundsBeforeFrame, contentBeforeFrame, reasserts, nudges, scrolledAtFrame };
        lastError = new Error('the captured frame was empty');
      } catch (error) { lastError = error; }
      const visibility = await pageVisibility();
      const message = `${String(lastError?.message || lastError)} | ${geometry()} | page ${visibility}`;
      await progress(`capture-retry ${label} ${attempt + 1}: ${message}`);
      // A window that is hidden, minimised, or wholly off the display has no
      // surface to capture however the page describes itself. But something on
      // this machine minimises and snaps the window mid-run — the log says so —
      // and the next attempt already knows how to wake it, so judging the
      // streak on the instant after the failure would abort a run that was going
      // to recover one attempt later. Wake first, then count: only a window that
      // is still gone after we have asked it back, twice, is a lost surface.
      const box = mainWindow.getBounds();
      const unplaceable = !mainWindow.isVisible() || mainWindow.isMinimized()
        || box.x + box.width <= workArea.x || box.y + box.height <= workArea.y;
      let stillGone = unplaceable;
      if (unplaceable) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        if (!mainWindow.isVisible()) mainWindow.show();
        mainWindow.moveTop();
        placeWindow(target);
        await settle(250);
        const back = mainWindow.getBounds();
        stillGone = !mainWindow.isVisible() || mainWindow.isMinimized()
          || back.x + back.width <= workArea.x || back.y + back.height <= workArea.y;
        await progress(`surface-wake ${label} attempt ${attempt + 1}: ${geometry()}${stillGone ? ' STILL UNPLACEABLE' : ' recovered'}`);
      }
      unplaceableStreak = stillGone ? unplaceableStreak + 1 : 0;
      // A page that still calls itself hidden after the window came back is the
      // compositor refusing to paint, which is the same dead end as no window.
      const stillHidden = stillGone && visibility === 'hidden';
      if (/display surface not available/i.test(message) || stillHidden || unplaceableStreak >= 2) surfaceLost = true;
      if (surfaceLost && attempt >= 3) break;
      await settle(400);
    }
    throw new Error(`The window could not be captured for ${label}: ${String(lastError?.message || lastError)}${surfaceLost ? ' (the display surface for this window is gone; the run stopped rather than repeating a capture that cannot succeed)' : ''}`);
  };
  const progressPath = path.join(outputDirectory, 'visual-progress.log');
  const progress = async (message) => { await fsp.appendFile(progressPath, `${new Date().toISOString()} ${message}\n`, 'utf8').catch(() => {}); };
  await progress('capture-started');
  const waitForLoad = async () => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      if (!mainWindow.webContents.isLoading()) return true;
      await settle(100);
    }
    return false;
  };
  /**
   * Waits, with a deadline, for the live document to show enough of something.
   *
   * Returns false when the count never arrived. The scenario is still captured
   * and reported either way: an empty or a loading bench is a real state of the
   * interface, and the gate in the harness decides whether it is acceptable.
   */
  const runWaits = async (scenario, waits) => {
    let satisfied = true;
    for (const wait of waits) {
      const budget = wait.ms || 30000;
      const deadline = Date.now() + budget;
      let seen = 0;
      let jogs = 0;
      while (Date.now() < deadline) {
        seen = await mainWindow.webContents.executeJavaScript(`document.querySelectorAll(${JSON.stringify(wait.selector)}).length`).catch(() => 0);
        if (seen >= wait.min) break;
        // A window Chromium has decided is occluded stops being handed frames, and
        // a background renderer can defer the message that would populate it.
        // Measured: two Files scenarios sat out their whole 90 s on `.filex__row`
        // at focus=false while every other scenario in the same run answered in
        // four seconds, and the capture filed under them showed a page the DOM was
        // no longer on. Re-raising the window costs nothing and unfreezes both.
        const elapsed = budget - (deadline - Date.now());
        if (jogs < 3 && elapsed > (jogs + 1) * 8000) {
          jogs += 1;
          try { mainWindow.show(); mainWindow.moveTop(); mainWindow.focus(); } catch {}
          await progress(`wait-jog ${scenario.name} ${wait.selector} after ${Math.round(elapsed / 1000)}s focus=${mainWindow.isFocused()} visible=${mainWindow.isVisible()}`);
        }
        await settle(500);
      }
      const met = seen >= wait.min;
      satisfied = satisfied && met;
      if (!met) {
        // The report says *why* the bench stayed empty: a hidden document and a
        // document with nothing to show are different failures, and only one of
        // them is a design problem.
        const health = await mainWindow.webContents.executeJavaScript(`({ visibility: document.visibilityState, focus: document.hasFocus(), page: document.documentElement.dataset.page })`).catch(() => null);
        await progress(`wait-timeout ${scenario.name} ${wait.selector}=${seen} wanted=${wait.min} ${JSON.stringify(health)}`);
      }
      await progress(`waited ${scenario.name} ${wait.selector}=${seen}`);
    }
    return satisfied;
  };
  try {
    // The run owns the window: it is raised and kept painting even while the
    // terminal owns the foreground. It is *not* made non-resizable to stop the
    // shell snapping it — measured, and a non-resizable window ignores
    // setBounds() entirely, which would freeze every scenario at one size.
    // Dragging is switched off instead, because a measured window that gets
    // pulled off its anchor by anything on the desktop — a snap helper, a stale
    // multi-monitor layout, a hand — loses the surface the capture needs.
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setMovable(false);
    mainWindow.show();
    mainWindow.moveTop();
    mainWindow.focus();
    // Chromium stops producing frames for a window it considers occluded, and
    // this run must keep painting while the terminal owns the foreground. The
    // setting is restored below.
    try { mainWindow.webContents.setBackgroundThrottling(false); } catch {}
    //
    // A cold process reads the volume table through WMI, and that first query
    // has been measured past three minutes on a busy machine. Warming it once
    // before the loop means scenario 1 is not graded on a different clock from
    // the rest of the run — and the warm read is the engine's own cache, so the
    // page still reports the real numbers rather than a staged result.
    if (selected.some(scenario => scenario.page === 'storage' || scenario.page === 'home')) {
      await progress('volume-warm start');
      await diskOverview().then(() => progress('volume-warm done')).catch(error => progress(`volume-warm failed: ${String(error?.message || error)}`));
    }
    for (const scenario of selected) {
      let completed = false;
      let lastError = null;
      // Two scenarios in a row that could not be painted is not bad luck. Once
      // the window has lost its display surface, every later capture in the run
      // is the same failure repeated, so the remainder of the suite is recorded
      // as skipped with the reason instead of spending the whole timeout on it.
      if (consecutiveSurfaceFailures >= 2) {
        await progress(`scenario-skipped ${scenario.name}: the display surface is gone`);
        results.push({ ...scenario, captured: false, skipped: 'surface-lost', error: 'Skipped: the previous two captures had no display surface to paint, so a screenshot taken now would show nothing.' });
        continue;
      }
      surfaceLost = false;
      // A frame request that goes unanswered three times is answered with a
      // geometry change the compositor cannot ignore (see captureWindow), so a
      // surface that has decided it is not visible is given a reason to change
      // its mind; pass 2 reloads the page on top of that, so one stale surface
      // cannot discard the other captures.
      for (let pass = 1; pass <= 2 && !completed; pass += 1) {
        await progress(`scenario-start ${scenario.name} pass=${pass}`);
        recoveriesThisScenario = 0;
        minimisesThisPass = 0;
        try {
          const target = targetSize(scenario);
          const clamped = target.width !== scenario.width || target.height !== scenario.height;
          placeWindow(target);
          await progress(`bounds-set ${scenario.name} ${target.width}x${target.height}${clamped ? ` (requested ${scenario.width}x${scenario.height} exceeds the ${workArea.width}x${workArea.height} work area)` : ''}`);
          // The window resizes on the next layout pass, so the new size is only
          // real once the window reports it. Reading the bounds too early is how a
          // capture ends up filed under a size it does not have.
          for (let attempt = 0; attempt < 40; attempt += 1) {
            const bounds = mainWindow.getBounds();
            if (!mainWindow.isMaximized() && bounds.width === target.width && bounds.height === target.height) break;
            if (mainWindow.isMaximized()) placeWindow(target);
            await settle(100);
          }
          const scenarioBounds = mainWindow.getBounds();
          await progress(`bounds-confirmed ${scenario.name} ${scenarioBounds.width}x${scenarioBounds.height} at ${scenarioBounds.x},${scenarioBounds.y} maximized=${mainWindow.isMaximized()} full=${mainWindow.isFullScreen()}`);
          // A scenario owns its own preconditions, so the harness does not ask once
          // and then photograph whatever arrives. The settings are written, the window
          // is reloaded, and the document is read back; if the language, the theme or
          // the world the scenario asked for is not the one on screen, the write is
          // repeated. Measured: a cold boot can answer the first write with its own
          // defaults, and a capture filed under a page it never showed is worse than
          // no capture at all — the numbers describe one document and the pixels
          // another.
          const expectedDirection = scenario.locale === 'ar' ? 'rtl' : 'ltr';
          let scenarioState = null;
          let lastSeen = null;
          for (let round = 1; round <= 3 && !scenarioState; round += 1) {
            await updateSettings({
              // The world a scenario asks for is delivered as the page the window
              // restores, and the product only honours that when the user has
              // switched "restore the previous section" on. A capture suite whose
              // navigation depends on a preference someone can toggle in the
              // Settings world is a suite that changes behaviour with the product;
              // the run therefore states the preference it needs, and hands the
              // user's own back in the finally block below.
              general: { ...originalSettings.general, restorePreviousPage: true },
              localization: { ...originalSettings.localization, locale: scenario.locale },
              appearance: scenario.theme ? { ...originalSettings.appearance, theme: scenario.theme } : originalSettings.appearance,
              window: { ...originalSettings.window, bounds: scenarioBounds, lastPage: scenario.page }
            });
            await progress(`settings-updated ${scenario.name} round=${round}`);
            mainWindow.reload();
            await settle(400);
            await waitForLoad();
            // The document metadata is applied by the renderer once its settings have
            // loaded, so the capture waits for the expected language and direction
            // instead of a fixed delay.
            for (let attempt = 0; attempt < 45 && !scenarioState; attempt += 1) {
              const state = await mainWindow.webContents.executeJavaScript(`({ lang: document.documentElement.lang, dir: document.documentElement.dir, theme: document.documentElement.dataset.theme, page: document.documentElement.dataset.page })`).catch(() => null);
              if (!state || !state.lang || !state.theme) { await settle(200); continue; }
              lastSeen = state;
              if (state.lang !== scenario.locale || state.dir !== expectedDirection) { await settle(200); continue; }
              // A scenario that pins a theme is only valid once that theme is the one
              // painted; a light capture taken while the dark theme is still applied
              // would be evidence of nothing.
              if (scenario.theme && state.theme !== scenario.theme) { await settle(200); continue; }
              // The world is part of the ask, and the app only honours a stored page
              // when it restores the previous section — so a page that never arrived
              // is caught here, in nine seconds, rather than by a 180-second wait.
              // An empty data-page is still the renderer's boot state, not the
              // requested world. Accepting it here lets the harness begin a
              // multi-minute data wait against whichever page finishes restoring
              // later, and can file Startup pixels under a Storage scenario.
              // Require the renderer to name the exact world before grading it.
              if (scenario.page && state.page !== scenario.page) { await settle(200); continue; }
              scenarioState = state;
            }
            if (!scenarioState) {
              const seen = lastSeen || await mainWindow.webContents.executeJavaScript(`({ lang: document.documentElement.lang, page: document.documentElement.dataset.page })`).catch(() => null);
              await progress(`settings-not-applied ${scenario.name} round=${round}: asked for ${scenario.locale}/${scenario.page}, the document reports ${JSON.stringify(seen)}`);
            }
          }
          await settle(700);
          // The compositor has to have painted the window before it can produce a
          // frame, so the capture waits for the first paint after the reload. The
          // listener is removed when the timeout wins: a run that reloads the
          // window eighteen times would otherwise stack eighteen dead handlers.
          await new Promise(resolve => {
            const onPaint = () => { clearTimeout(timer); mainWindow.webContents.off('paint', onPaint); resolve(); };
            const timer = setTimeout(onPaint, 3000);
            mainWindow.webContents.on('paint', onPaint);
          });
          await progress(`loaded ${scenario.name}`);
          // A world that reads the system has to finish reading before it can be
          // judged. The wait is bounded, and a scenario that times out is still
          // captured and reported, because the empty or loading state is itself
          // part of the interface under review.
          if (scenario.waits?.length) {
            const satisfied = await runWaits(scenario, scenario.waits);
            // A bench that never populated is not a capture worth grading: the
            // pixels would show a loading state, the numbers would call the world
            // empty, and the two would be filed under one scenario name. Pass 2
            // re-runs the whole setup — settings, reload, waits — and only a second
            // failure is reported as the state the world actually showed.
            if (!satisfied && pass < 2) {
              await progress(`waits-unsatisfied ${scenario.name}: the bench stayed empty, retrying in pass 2`);
              continue;
            }
            if (satisfied && scenario.prepare) {
              await mainWindow.webContents.executeJavaScript(`(() => { ${scenario.prepare} })()`)
                .catch(error => progress(`prepare-error ${scenario.name}: ${String(error?.message || error)}`));
              // Selection states and the staging deck animate in; the capture waits
              // for the transition to land so it shows the settled interface.
              await settle(600);
              // A control that answers by running an engine needs its own wait:
              // the click is not the result.
              if (scenario.waitsAfterPrepare?.length) await runWaits(scenario, scenario.waitsAfterPrepare);
              // A second act, taken only once the first one has answered. The
              // atlas needs it: its ledger rows exist after a walk, so the click
              // that opens the inspector cannot be part of the setup that starts
              // that same walk.
              if (scenario.interact) {
                await mainWindow.webContents.executeJavaScript(`(() => { ${scenario.interact} })()`)
                  .catch(error => progress(`interact-error ${scenario.name}: ${String(error?.message || error)}`));
                await settle(600);
                if (scenario.interactWaits?.length) await runWaits(scenario, scenario.interactWaits);
              }
            }
          }
          let scrolledTo = null;
          if (scenario.scrollTo) {
            scrolledTo = await scrollToRegion(scenario.scrollTo, scenario.name);
            await settle(500);
          }
          const metrics = await mainWindow.webContents.executeJavaScript(`(() => ({
            lang: document.documentElement.lang,
            dir: document.documentElement.dir,
            theme: document.documentElement.dataset.theme,
            page: document.documentElement.dataset.page,
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
            horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            // Inventory evidence: how many real rows rendered, how many of them
            // carry a Windows-extracted icon, and which surfaces are open. A
            // screenshot of the Applications world with no rows is not a populated
            // capture, and the report has to say so.
            rows: document.querySelectorAll('.appx__row').length,
            nativeIcons: document.querySelectorAll('.appx-icon--img').length,
            dossierOpen: !!document.querySelector('.appx__dossier:not(.appx__dossier--empty)'),
            deckPresent: !!document.querySelector('.appx__deck'),
            // When the deck is missing, this says whether the ticks never landed
            // or landed and were dropped: checked rows versus a queued selection.
            stagedTicks: document.querySelectorAll('.appx__row input[type=checkbox]:checked').length,
            // In the DOM is not on the screen. The staging deck is a floating
            // tray: its whole job is to be reachable while the register scrolls,
            // so a deck that renders below the fold — or that an animated
            // ancestor turns into a positioned-descendant of a taller containing
            // block — is a broken control even though the query finds it.
            deckOnScreen: (() => {
              const node = document.querySelector('.appx__deckinner');
              if (!node) return false;
              const box = node.getBoundingClientRect();
              return box.height > 20 && box.top >= -1 && box.bottom <= window.innerHeight + 1;
            })(),
            deckBox: (() => {
              const node = document.querySelector('.appx__deckinner');
              if (!node) return null;
              const box = node.getBoundingClientRect();
              return { top: Math.round(box.top), bottom: Math.round(box.bottom), height: Math.round(box.height), viewport: window.innerHeight };
            })(),
            // The Files bench: rows read from the directory table, the number of
            // proportional segments the composition band drew, whether an
            // inspector is open, and whether the organisation plan has landed.
            fileRows: document.querySelectorAll('.filex__row').length,
            fileSegments: document.querySelectorAll('.filex__seg').length,
            fileInspectorOpen: !!document.querySelector('.filex__inspector--record'),
            // The idle inspector is a panel of the walk's own groupings, so its
            // row count is evidence that the column carries data rather than an
            // apology while nothing is selected.
            fileGlanceRows: document.querySelectorAll('.filex__glancerow').length,
            fileGlanceTiles: document.querySelectorAll('.filex__glancetile').length,
            filePlanPresent: !!document.querySelector('.filex__planbody'),
            filePlanLanes: document.querySelectorAll('.filex__lane').length,
            filePlanApplied: !!document.querySelector('.filex__outcome'),
            // A plan band that offers Apply before the confirmation is ticked would
            // be the destructive bug this product cannot afford, so the state of
            // the gate is measured, not assumed: the gate has three parts — the
            // checkbox exists, it is unticked, and the button is nonetheless live.
            fileConfirmPresent: !!document.querySelector('.filex__confirm input[type=checkbox]'),
            fileConfirmChecked: !!document.querySelector('.filex__confirm input[type=checkbox]:checked'),
            fileApplyEnabled: (() => {
              const button = document.querySelector('.filex__apply .world-control--primary');
              return !!button && !button.disabled;
            })(),
            // The Volume Atlas: how many real volumes the Windows table returned,
            // how many of them drew a rail to scale, how many physical disks came
            // back from MSFT_PhysicalDisk, and whether the three walks are wired
            // to anything yet. A rack with no rails is a machine that did not
            // answer, and the report has to be able to tell that apart from a
            // world that failed to draw what it was given.
            atlasBays: document.querySelectorAll('.atlas__bay').length,
            atlasRails: document.querySelectorAll('.atlas__rail').length,
            atlasTicks: document.querySelectorAll('.atlas__tick').length,
            atlasDisks: document.querySelectorAll('.atlas__disk').length,
            atlasLanes: document.querySelectorAll('.atlas__lane').length,
            atlasRows: document.querySelectorAll('.atlas__row').length,
            atlasRungs: document.querySelectorAll('.atlas__rung').length,
            atlasMetrics: document.querySelectorAll('.atlas .world-metric').length,
            // The inspector has two modes and the difference matters to the gate:
            // a read board also carries a subject line, so probing for one would
            // call an unselected column "open on a ledger row".
            atlasInspectorOpen: !!document.querySelector('.atlas__inspector[data-mode="record"]'),
            atlasReadLanes: document.querySelectorAll('.atlas__readlane').length,
            atlasReadVolume: !!document.querySelector('.atlas__readvol'),
            // The empty-folder record is drawn from a read, not a measurement, so
            // the suite needs its own mark: a folder row that opens nothing but a
            // heading is the defect this metric exists to catch.
            atlasFolderRecord: !!document.querySelector('.atlas__inspector[data-mode="record"] [data-folder-record]'),
            // The three walks are never summed, so the page must say so out loud
            // and must never put a delete control in the ledger. Both are measured
            // because both are claims the screenshots alone cannot prove.
            atlasCaveat: !!document.querySelector('.atlas__caveat'),
            atlasDestructive: document.querySelectorAll('.atlas button').length
              && Array.from(document.querySelectorAll('.atlas button')).some(button => /delete|remove|clean|حذف|تنظيف/i.test(button.textContent || '')),
            // Legibility evidence. A theme switch that repaints the surfaces and
            // leaves the inherited text colour white is invisible, not merely
            // ugly, and every other measurement in this report can pass while it
            // happens. Each visible text leaf is compared with the most forgiving
            // background it could be sitting on — its own painted gradient, the
            // nearest solid colour above it, or the page — and only a ratio below
            // two is called invisible. Below 3.2 it is reported, not failed.
            lowContrast: (() => {
              const parse = value => {
                const m = /rgba?[(]([^)]+)[)]/.exec(String(value));
                if (!m) return null;
                const parts = m[1].split(/[^0-9.]+/).filter(Boolean).map(Number);
                if (parts.length < 3) return null;
                return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
              };
              // Any CSS colour the page can name, read back as rgb components. A
              // detached element is the only resolver that understands what the page
              // actually painted: var() is substituted, color-mix() is evaluated, and
              // the computed value is plain rgb().
              const swatch = document.createElement('span');
              swatch.style.display = 'none';
              // The swatch is moved into each element in turn rather than parked on
              // <body>, because a hue token declared on a world container only has a
              // value inside that container: on <body>, color-mix(in srgb, var(--at-hue)
              // 74%, #ffffff) resolves to nothing and the label is graded against the
              // dark track underneath its own bar.
              const resolve = raw => {
                swatch.style.color = '';
                swatch.style.color = String(raw);
                if (!swatch.style.color) return null;
                return parse(getComputedStyle(swatch).color);
              };
              const stopsOf = value => {
                // A computed style keeps the colour the page asked for: color-mix()
                // survives into getComputedStyle rather than collapsing to rgb(), so
                // an rgb-only reader sees no stop at all and grades a label against
                // whatever solid track sits behind it — 1.21:1 for text that is
                // actually riding on a light bar. Every colour token is therefore put
                // through the browser's own resolver and read back as rgb.
                const list = [];
                const re = /(?:color-mix|color|rgba?|hsla?|lab|lch|oklab|oklch)[(](?:[^()]|[(][^()]*[)])*[)]|#[0-9a-fA-F]{3,8}\b/g;
                let match;
                while ((match = re.exec(String(value))) && list.length < 8) {
                  const colour = resolve(match[0]);
                  if (colour) list.push(colour);
                }
                return list;
              };
              const luminance = c => {
                const channel = v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
                return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
              };
              const against = (ink, back) => {
                const hi = Math.max(luminance(ink), luminance(back));
                const lo = Math.min(luminance(ink), luminance(back));
                return (hi + 0.05) / (lo + 0.05);
              };
              const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
              const average = list => ({ r: list.reduce((s, c) => s + c.r, 0) / list.length, g: list.reduce((s, c) => s + c.g, 0) / list.length, b: list.reduce((s, c) => s + c.b, 0) / list.length, a: 1 });
              const page = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
              const found = [];
              const leaves = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, span, b, strong, em, li, button, label, small')).slice(0, 1200);
              for (const node of leaves) {
                if (node.childElementCount) continue;
                const text = (node.textContent || '').trim();
                if (text.length < 2) continue;
                const style = getComputedStyle(node);
                if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.2) continue;
                if (!node.offsetParent && style.position !== 'fixed') continue;
                const box = node.getBoundingClientRect();
                if (box.width < 4 || box.height < 4) continue;
                const ink = parse(style.color);
                if (!ink) continue;
                const candidates = [page];
                node.appendChild(swatch);
                for (let up = node; up; up = up.parentElement) {
                  const upStyle = getComputedStyle(up);
                  const stops = stopsOf(upStyle.backgroundImage);
                  const solid = parse(upStyle.backgroundColor);
                  if (stops.length) candidates.push(average(stops));
                  if (solid && solid.a > 0.6) { candidates.push(over(solid, candidates[candidates.length - 1])); break; }
                }
                swatch.remove();
                const colour = over(ink, page);
                let best = 1;
                for (const back of candidates) best = Math.max(best, against(colour, over(back, page)));
                const size = parseFloat(style.fontSize) || 13;
                const level = best < 2 ? 'invisible' : best < 3.2 && size >= 12 ? 'weak' : null;
                if (!level) continue;
                found.push({ level, tag: node.tagName.toLowerCase(), className: String(node.className || '').slice(0, 54), text: text.slice(0, 26), ratio: Math.round(best * 100) / 100 });
                if (found.length >= 10) break;
              }
              swatch.remove();
              return found;
            })(),
            // The in-flow elements whose content actually escapes their parent.
            // A bare overflow flag names the symptom; this names the cause. Text
            // that is deliberately clipped, and decorative layers that are
            // deliberately oversized, are not defects and are not reported.
            overflowingElements: Array.from(document.querySelectorAll('*')).filter(node => {
              const style = getComputedStyle(node);
              if (style.overflowX === 'hidden' || style.overflowX === 'clip') return false;
              if (style.position === 'absolute' || style.position === 'fixed') return false;
              if (style.display === 'none' || style.visibility === 'hidden') return false;
              if (!node.offsetParent && style.position !== 'fixed') return false;
              const parent = node.parentElement;
              if (!parent) return false;
              const rect = node.getBoundingClientRect();
              const parentRect = parent.getBoundingClientRect();
              if (!rect.width || !parentRect.width) return false;
              return rect.right > parentRect.right + 4 || rect.left < parentRect.left - 4;
            }).slice(0, 6).map(node => ({ tag: node.tagName.toLowerCase(), className: String(node.className || '').slice(0, 90), width: Math.round(node.getBoundingClientRect().width), parentWidth: Math.round(node.parentElement.getBoundingClientRect().width) })),
            // Flow Studio evidence: the canvas nodes, the three panels that
            // make it an editor, and the state of a native modal when one is
            // open. :modal is the browser's own answer that the dialog has been
            // lifted out of the page, which is what makes the background inert.
            flowNodes: document.querySelectorAll('.flow-node').length,
            flowLibrary: !!document.querySelector('.flow-lib'),
            flowCanvas: !!document.querySelector('.flow-canvas'),
            flowConfig: !!document.querySelector('.flow-config'),
            flowPreview: !!document.querySelector('.flow-preview'),
            flowMode: document.querySelector('.flow-canvas__mode')?.textContent?.trim() || null,
            dialogOpen: (() => { const dialog = document.querySelector('dialog.svc-preview'); return !!dialog && dialog.open; })(),
            dialogModal: (() => { const dialog = document.querySelector('dialog.svc-preview'); return !!dialog && dialog.matches(':modal'); })(),
            dialogFocusInside: (() => { const dialog = document.querySelector('dialog.svc-preview'); return !!dialog && dialog.contains(document.activeElement); })(),
            focusable: document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
            headings: Array.from(document.querySelectorAll('h1, h2')).slice(0, 6).map(node => (node.textContent || '').trim()).filter(Boolean)
          }))()`);
          const recoveriesBefore = maximizeRecoveries;
          const minimisesBefore = minimizeRecoveries;
          const capture = await captureWindow(scenario.name, target,
            scenario.scrollTo ? () => scrollToRegion(scenario.scrollTo) : null);
          const image = capture.image;
          await progress(`captured ${scenario.name}`);
          const file = path.join(outputDirectory, `${scenario.name}.png`);
          await fsPromises.writeFile(file, image.toPNG());
          // A dialog that is visually open is not necessarily modal. After the
          // frame is written, press Tab and Escape as real input events and
          // read the document back: focus must stay inside while open, and it
          // must return to the card that opened the preview after Escape.
          let dialogKeyboard = null;
          if (scenario.requiresDialog && metrics.dialogOpen) {
            mainWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Tab' });
            mainWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Tab' });
            await settle(180);
            const afterTab = await mainWindow.webContents.executeJavaScript(`(() => {
              const dialog = document.querySelector('dialog.svc-preview');
              return {
                open: !!dialog && dialog.open,
                modal: !!dialog && dialog.matches(':modal'),
                focusInside: !!dialog && dialog.contains(document.activeElement),
                activeClass: String(document.activeElement && document.activeElement.className || '')
              };
            })()`).catch(() => ({}));
            mainWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
            mainWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
            await settle(320);
            const afterEscape = await mainWindow.webContents.executeJavaScript(`(() => ({
              previewOpen: !!document.querySelector('dialog.svc-preview[open]'),
              restoredService: (document.activeElement && document.activeElement.closest('[data-service]') && document.activeElement.closest('[data-service]').getAttribute('data-service')) || null,
              activeClass: String(document.activeElement && document.activeElement.className || '')
            }))()`).catch(() => ({}));
            dialogKeyboard = {
              modalAtOpen: metrics.dialogModal,
              focusInsideAtOpen: metrics.dialogFocusInside,
              tabStayedInside: afterTab.focusInside === true,
              modalAfterTab: afterTab.modal === true,
              closedOnEscape: afterEscape.previewOpen === false,
              focusRestoredToCard: afterEscape.restoredService === 'auto-smart-scan',
              restoredService: afterEscape.restoredService || null,
              activeClassAfterEscape: afterEscape.activeClass || ''
            };
            await progress(`dialog-keyboard ${scenario.name} ${JSON.stringify(dialogKeyboard)}`);
          }
          const capturedBounds = mainWindow.getBounds();
          const frame = image.getSize();
          const scale = display.scaleFactor || 1;
          // The size claim is measured, not assumed. Two facts have to hold: the
          // window was the requested size when the frame was taken, and the PNG
          // is the device-pixel size of the content area the page was laid out
          // in. The second fact is what makes the screenshot evidence of the
          // first — a window that claims 1920 and paints 860 is caught here.
          const frameMatches = Math.abs(frame.width - Math.round(capture.contentBeforeFrame.width * scale)) <= 2
            && Math.abs(frame.height - Math.round(capture.contentBeforeFrame.height * scale)) <= 2;
          const sizeMatches = capture.boundsBeforeFrame.width === target.width
            && capture.boundsBeforeFrame.height === target.height && frameMatches;
          if (!sizeMatches) await progress(`size-drift ${scenario.name} target=${target.width}x${target.height} before=${capture.boundsBeforeFrame.width}x${capture.boundsBeforeFrame.height} content=${capture.contentBeforeFrame.width}x${capture.contentBeforeFrame.height} frame=${frame.width}x${frame.height} after=${capturedBounds.width}x${capturedBounds.height}`);
          results.push({ ...scenario, ...metrics, expectedTheme: scenario.theme || null, page: scenario.page, documentPage: metrics.page || null, pageReached: metrics.page === scenario.page, requestedWidth: scenario.width, requestedHeight: scenario.height, targetWidth: target.width, targetHeight: target.height, clampedToWorkArea: clamped, workArea, displayScale: scale, capturedWidth: capture.boundsBeforeFrame.width, capturedHeight: capture.boundsBeforeFrame.height, viewportWidth: capture.contentBeforeFrame.width, viewportHeight: capture.contentBeforeFrame.height, boundsAfterCaptureWidth: capturedBounds.width, boundsAfterCaptureHeight: capturedBounds.height, frameWidth: frame.width, frameHeight: frame.height, frameMatches, boundsReasserts: capture.reasserts, surfaceNudges: capture.nudges, maximizeRecoveries: maximizeRecoveries - recoveriesBefore, minimizeRecoveries: minimizeRecoveries - minimisesBefore, scrolledTo: capture.scrolledAtFrame || scrolledTo, captureSizeMatches: sizeMatches, dialogKeyboard, file: path.basename(file), captured: true });
          completed = true;
        } catch (error) {
          lastError = error;
          await progress(`scenario-error ${scenario.name} pass=${pass}: ${String(error?.message || error)}`);
        }
      }
      if (completed) consecutiveSurfaceFailures = 0;
      else if (surfaceLost) consecutiveSurfaceFailures += 1;
      if (!completed) results.push({ ...scenario, captured: false, surfaceLost, error: String(lastError?.message || lastError) });
    }
  } finally {
    mainWindow.removeListener('maximize', reclaimPlacement);
    // Both guards are for the measuring run only. A window that restores itself
    // every time the user minimises it is not a product, it is a harness.
    mainWindow.removeListener('minimize', reclaimMinimisedWindow);
    // The window's own policy — minimise into the tray — comes back before
    // anything else is handed over: a product that refuses to be minimised is
    // a bug, and this guard exists only for the run that is measuring it.
    for (const handler of appMinimiseHandlers) mainWindow.on('minimize', handler);
    placement = null;
    try { mainWindow.webContents.setBackgroundThrottling(true); } catch {}
    await progress('capture-finished');
    // The window belongs to the user again before its bounds are handed back.
    mainWindow.setMovable(true);
    mainWindow.setAlwaysOnTop(originalAlwaysOnTop);
    // The original bounds cannot be restored onto a maximised window: setBounds
    // is ignored while the shell owns the geometry.
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    mainWindow.setBounds(originalBounds);
    await updateSettings({ general: originalSettings.general, localization: originalSettings.localization, window: originalSettings.window });
  }
  return results;
}

function createWindow() {
  const bounds = settingsCache?.general.rememberWindowBounds ? settingsCache.window.bounds : null;
  mainWindow = new BrowserWindow({
    width: bounds?.width || 1480, height: bounds?.height || 940, x: bounds?.x, y: bounds?.y, minWidth: 860, minHeight: 600,
    show: false, backgroundColor: '#111118', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, enableRemoteModule: false }
  });
  mainWindow.once('ready-to-show', () => { if (!settingsCache.general.startMinimized && !process.argv.includes('--start-minimized')) mainWindow.show(); });
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  mainWindow.webContents.once('did-finish-load', () => runPackagedSmoke().catch(async error => { const targets = [smokeArgument('knoux-settings-smoke-output'), smokeArgument('knoux-operation-smoke-output')].filter(Boolean); for (const target of targets) await fsp.writeFile(target, JSON.stringify({ capturedAt: new Date().toISOString(), packaged: app.isPackaged, error: error.message }, null, 2), 'utf8').catch(() => {}); shutdownBackgroundWorkers(); app.isQuiting = true; app.exit(1); }));
  mainWindow.on('minimize', event => { if (settingsCache?.general.minimizeToTray) { event.preventDefault(); mainWindow.hide(); } });
  mainWindow.on('close', async event => {
    if (app.isQuiting) return;
    if (settingsCache?.general.closeBehavior === 'tray') { event.preventDefault(); mainWindow.hide(); return; }
    const hasActiveOperations = operations.size > 0 || studioController?.isBusy();
    const shouldAsk = settingsCache?.general.closeBehavior === 'ask' || (settingsCache?.general.confirmExitActiveOperations && hasActiveOperations);
    if (shouldAsk) {
      event.preventDefault();
      const arabic = settingsCache?.localization.locale === 'ar';
      const answer = await dialog.showMessageBox(mainWindow, { type: 'question', buttons: arabic ? ['إلغاء', 'خروج'] : ['Cancel', 'Exit'], defaultId: 0, cancelId: 0, title: 'KNOuX SmartOrganizer', message: hasActiveOperations ? (arabic ? 'لا تزال هناك عمليات نشطة. هل تريد الخروج؟' : 'Operations are still active. Exit anyway?') : (arabic ? 'هل تريد الخروج من KNOuX SmartOrganizer؟' : 'Exit KNOuX SmartOrganizer?') });
      if (answer.response === 1) { app.isQuiting = true; shutdownBackgroundWorkers(); app.quit(); }
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  let boundsTimer = null;
  const saveBounds = () => { if (!settingsCache?.general.rememberWindowBounds || !mainWindow || mainWindow.isMinimized() || mainWindow.isMaximized()) return; clearTimeout(boundsTimer); boundsTimer = setTimeout(() => updateSettings({ window: { ...settingsCache.window, bounds: mainWindow.getBounds() } }).catch(() => {}), 300); };
  mainWindow.on('resize', saveBounds); mainWindow.on('move', saveBounds);
}
function createTray() { const icon = nativeImage.createEmpty(); tray = new Tray(icon); tray.setToolTip('KNOuX SmartOrganizer'); tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Open', click: () => { mainWindow.show(); } }, { label: 'Smart Scan', click: () => execute({ toolId: 'smart-scan', inputs: {} }) }, { type: 'separator' }, { label: 'Exit', click: () => { app.isQuiting = true; app.quit(); } }])); tray.on('click', () => mainWindow.show()); }
app.whenReady().then(async () => {
  await ensureAppStorage(); settingsStore = createSettingsStore({ userDataPath: app.getPath('userData') }); settingsCache = await settingsStore.load(); applyRuntimeSettings(settingsCache); startupManager = createStartupManager({ readJournal: name => readJson(name, null), writeJournal: writeJson }); automationStore = createAutomationStore({ userDataPath: app.getPath('userData'), executablePath: process.execPath, runTask: taskScheduler });
  clipboardVault = createClipboardVault({
    safeStorage, clipboard,
    storagePath: appDataPath('clipboard-vault.json'),
    readSettings: async () => settingsCache,
    onChange: () => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('knoux:clipboard-changed', clipboardVault.status()); }
  });
  await clipboardVault.init();
  clipboardVault.start();
  // Windows-native application icons. The provider is the only place that turns a
  // recorded inventory entry into an icon path, and it writes inside its own
  // cache directory alone. On another platform it answers 'not-windows' so the
  // Applications workspace still renders during development.
  appIconProvider = appIcons.createAppIconProvider({ cacheDirectory: appDataPath('app-icons'), platform: process.platform, nativeImage });
  // Warm the Authenticode state in the background; it must never delay the
  // first paint of the application.
  void resolveSigningInfo().catch(() => {});
  const scheduledId = automationArgument();
  if (scheduledId) { const schedule = await automationStore.find(scheduledId); if (!schedule || !schedule.enabled) { app.exit(2); return; } const completed = await execute({ toolId: schedule.toolId, inputs: {} }); await automationStore.recordRun(schedule.id, completed); app.exit(completed.success ? 0 : 1); return; }
  createWindow(); createTray();
  // Smart Organization Studio: native-granted library and destination registry,
  // verified plan execution, durable journal and bounded thumbnails.
  studioController = require('./studio/register-studio-ipc.cjs').registerStudioIpc({
    ipcMain,
    dialog,
    shell,
    windowProvider: () => mainWindow,
    settingsProvider: getSettings,
    nativeImage,
    userDataPath: app.getPath('userData')
  });
  ipcMain.handle('knoux:app-info', async () => ({ version: app.getVersion(), startedAt, platform: process.platform, arch: process.arch, isPackaged: app.isPackaged, electron: process.versions.electron, chromium: process.versions.chrome, node: process.versions.node, releaseChannel: 'stable', codeSigning: signingInfoCache }));
  ipcMain.handle('knoux:tools-list', () => serializeRegistry(toolDefinitions));
  ipcMain.handle('knoux:settings-get', getSettings);
  ipcMain.handle('knoux:settings-update', (_event, patch) => updateSettings(z.record(z.unknown()).parse(patch)));
  ipcMain.handle('knoux:settings-export', async () => { const result = await dialog.showSaveDialog(mainWindow, { defaultPath: 'knoux-settings.json', filters: [{ name: 'JSON', extensions: ['json'] }] }); if (result.canceled || !result.filePath) return null; await fsp.writeFile(result.filePath, JSON.stringify(await getSettings(), null, 2), 'utf8'); return result.filePath; });
  ipcMain.handle('knoux:settings-import', async () => { const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] }); if (result.canceled || !result.filePaths[0]) return null; const value = await settingsStore.importText(await fsp.readFile(result.filePaths[0], 'utf8')); settingsCache = value; applyRuntimeSettings(value); publishSettings(value); return value; });
  ipcMain.handle('knoux:settings-reset-section', async (_event, section) => { const value = await settingsStore.resetSection(z.string().min(1).max(32).parse(section)); settingsCache = value; applyRuntimeSettings(value); publishSettings(value); return value; });
  ipcMain.handle('knoux:settings-reset', async () => { const value = await settingsStore.resetAll(); settingsCache = value; applyRuntimeSettings(value); publishSettings(value); return value; });
  ipcMain.handle('knoux:history-list', history);
  ipcMain.handle('knoux:history-export', async (_event, format) => { const selectedFormat = z.enum(['json', 'csv']).parse(format); const result = await dialog.showSaveDialog(mainWindow, { defaultPath: `knoux-operation-history.${selectedFormat}`, filters: [{ name: selectedFormat.toUpperCase(), extensions: [selectedFormat] }] }); if (result.canceled || !result.filePath) return null; const records = await history(); const payload = historyExport.serializeHistory(records, selectedFormat); await fsp.writeFile(result.filePath, payload, 'utf8'); return result.filePath; });
  ipcMain.handle('knoux:automation-list', () => automationStore.list());
  ipcMain.handle('knoux:automation-create', (_event, input) => automationStore.create(input));
  ipcMain.handle('knoux:automation-remove', (_event, id) => automationStore.remove(z.string().uuid().parse(id)));
  ipcMain.handle('knoux:automation-set-enabled', (_event, request) => { const parsed = z.object({ id: z.string().uuid(), enabled: z.boolean() }).strict().parse(request); return automationStore.setEnabled(parsed.id, parsed.enabled); });
  ipcMain.handle('knoux:automation-run', async (_event, id) => { const schedule = await automationStore.find(z.string().uuid().parse(id)); if (!schedule || !schedule.enabled) throw new Error('Automation schedule is unavailable.'); const completed = await execute({ toolId: schedule.toolId, inputs: {} }); await automationStore.recordRun(schedule.id, completed); return completed; });
  ipcMain.handle('knoux:folder-choose', async () => { const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] }); return result.canceled ? null : result.filePaths[0]; });
  ipcMain.handle('knoux:file-choose', async () => { const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'] }); return result.canceled ? null : result.filePaths[0]; });
  ipcMain.handle('knoux:tool-run', (_event, request) => execute(request));
  ipcMain.handle('knoux:operation-cancel', (_event, operationId) => { const operation = operations.get(z.string().uuid().parse(operationId)); if (operation) { operation.cancelRequested = true; operation.cancelled = true; } return Boolean(operation); });
  ipcMain.handle('knoux:open-path', async (_event, target) => shell.openPath(allowedDirectory(z.string().min(1).max(32767).parse(target))));
  ipcMain.handle('knoux:diagnostics-export', async () => { const result = await dialog.showSaveDialog(mainWindow, { defaultPath: 'knoux-diagnostics.json', filters: [{ name: 'JSON', extensions: ['json'] }] }); if (result.canceled || !result.filePath) return null; const diagnostics = await buildDiagnostics(); await fsp.writeFile(result.filePath, JSON.stringify(diagnostics, null, 2), 'utf8'); return result.filePath; });
  // KNOuX Clipboard Vault. Capture stays off until the user enables it in the
  // vault page or in Settings.
  ipcMain.handle('knoux:code-signing', () => resolveSigningInfo());
  // Native application icons for the Applications workspace. Opaque ids in,
  // PNG data URLs or an honest reason out; never a path in either direction.
  ipcMain.handle('knoux:app-icons', async (_event, request) => {
    const parsed = appIconRequestSchema.parse(request);
    const ids = [...new Set(parsed.ids)];
    if (!appIconProvider) return ids.map(id => ({ id, status: 'unavailable', source: 'none', reason: appIcons.REASONS.DISPOSED }));
    return await appIconProvider.getIcons(ids);
  });
  ipcMain.handle('knoux:clipboard-status', () => clipboardVault.status());
  ipcMain.handle('knoux:clipboard-list', (_event, request) => {
    const parsed = z.object({ query: z.string().max(500).optional(), type: z.enum(['all', 'text', 'image', 'files']).optional(), pinnedOnly: z.boolean().optional() }).strict().parse(request || {});
    return clipboardVault.list({ query: parsed.query || '', type: parsed.type || 'all', pinnedOnly: Boolean(parsed.pinnedOnly) });
  });
  ipcMain.handle('knoux:clipboard-get', (_event, id) => clipboardVault.get(z.string().uuid().parse(id)));
  ipcMain.handle('knoux:clipboard-pin', async (_event, request) => { const parsed = z.object({ id: z.string().uuid(), pinned: z.boolean() }).strict().parse(request); return clipboardVault.setPinned(parsed.id, parsed.pinned); });
  ipcMain.handle('knoux:clipboard-delete', async (_event, id) => clipboardVault.remove(z.string().uuid().parse(id)));
  ipcMain.handle('knoux:clipboard-clear', async () => clipboardVault.clear());
  ipcMain.handle('knoux:clipboard-copy-back', (_event, id) => clipboardVault.copyBack(z.string().uuid().parse(id)));
  ipcMain.handle('knoux:clipboard-open-source', async (_event, id) => {
    const files = clipboardVault.sourceFiles(z.string().uuid().parse(id));
    if (!files.length) throw new Error('This clipboard entry has no source file.');
    // Only a path the user actually copied may be opened.
    const target = normalisePath(files[0]);
    if (!fs.existsSync(target)) throw new Error('The source file is no longer available.');
    return shell.openPath(target);
  });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); else mainWindow.show(); });
// Every exit path stops the background workers first, so no watcher is still
// polling the operating system while the runtime is being torn down.
app.on('before-quit', () => { app.isQuiting = true; try { if (studioController) studioController.dispose(); } catch { /* Studio already closed */ } shutdownBackgroundWorkers(); });
// A crash is recorded rather than left as an unexplained exit. The runtime
// reports the reason and the status code, so a failure names its own cause.
app.on('render-process-gone', (_event, _webContents, details) => { log('error', 'renderer-gone', { reason: details?.reason || 'unknown', exitCode: details?.exitCode ?? null }); });
app.on('child-process-gone', (_event, details) => { log('error', 'child-process-gone', { type: details?.type || 'unknown', reason: details?.reason || 'unknown', exitCode: details?.exitCode ?? null }); });
