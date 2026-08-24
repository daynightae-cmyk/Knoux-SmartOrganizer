const { app, BrowserWindow, dialog, ipcMain, shell, Tray, Menu, nativeImage } = require('electron');
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

const execFileAsync = promisify(execFile);
const operations = new Map();
let historyMutationQueue = Promise.resolve();
let mainWindow = null;
let tray = null;
let settingsCache = null;
let settingsStore = null;
let automationStore = null;
let startupManager = null;
const startedAt = new Date().toISOString();
const privilegedRunner = createPrivilegedRunner();
const toolDefinitions = createToolRegistry(engine => (context, inputs) => runTool(context, { engine }, inputs), { availabilityResolver: engine => ['serviceControl', 'serviceStartupUndo'].includes(engine) ? privilegedRunner.probeService() : privilegedRunner.probe(engine) });

const runRequestSchema = z.object({
  toolId: z.string().min(1).max(64),
  inputs: z.record(z.unknown()).default({})
}).strict();

function appDataPath(name) { return path.join(app.getPath('userData'), name); }
async function ensureAppStorage() { await fsp.mkdir(app.getPath('userData'), { recursive: true }); await fsp.mkdir(appDataPath('logs'), { recursive: true }); }
async function readJson(name, fallback) { try { return JSON.parse(await fsp.readFile(appDataPath(name), 'utf8')); } catch { return fallback; } }
async function writeJson(name, data) { const target = appDataPath(name); const temp = `${target}.${process.pid}.${Date.now()}.${crypto.randomUUID()}.tmp`; await fsp.writeFile(temp, JSON.stringify(data, null, 2), 'utf8'); try { for (let attempt = 0; attempt < 6; attempt += 1) { try { await fsp.rename(temp, target); return; } catch (error) { if (!['EPERM', 'EACCES', 'EBUSY'].includes(error?.code) || attempt === 5) throw error; await new Promise(resolve => setTimeout(resolve, 25 * (attempt + 1))); } } } finally { await fsp.rm(temp, { force: true }).catch(() => {}); } }
async function log(level, event, details = {}) { const line = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...details }) + '\n'; await fsp.appendFile(path.join(appDataPath('logs'), 'operations.ndjson'), line).catch(() => {}); }
async function getSettings() { const value = await settingsStore.get(); settingsCache = value; return value; }
function publishSettings(value) { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('knoux:settings-changed', value); }
async function updateSettings(patch) { const value = await settingsStore.update(patch); settingsCache = value; applyRuntimeSettings(value); publishSettings(value); return value; }
async function history() { return await readJson('history.json', []); }
function addHistory(entry) { const task = historyMutationQueue.catch(() => {}).then(async () => { const records = await history(); records.unshift(entry); await writeJson('history.json', records.slice(0, 200)); }); historyMutationQueue = task; return task; }
function emit(event) { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('knoux:operation-event', event); }
function phase(operationId, toolId, phaseName, message, more = {}) {
  const context = operations.get(operationId); const updatedAt = new Date().toISOString();
  if (context) { context.phase = phaseName; context.updatedAt = updatedAt; if (typeof more.percent === 'number') context.progressValue = more.percent; }
  emit({
    operationId, toolId, startedAt: context?.startedAt || updatedAt, updatedAt,
    progress: context?.progressValue ?? null, phase: phaseName, summary: more.result?.summary || {},
    warnings: more.result?.warnings || context?.warnings || [], errors: more.result?.errors || [],
    cancelRequested: Boolean(context?.cancelRequested), undoMetadata: more.result?.undoMetadata || null,
    message, at: updatedAt, ...more
  });
}
function applyRuntimeSettings(settings) {
  app.setLoginItemSettings({ openAtLogin: settings.general.startWithWindows, args: settings.general.startMinimized ? ['--start-minimized'] : [] });
}
function argumentValue(name) { const prefix = `--${name}=`; const value = process.argv.find(argument => argument.startsWith(prefix)); return value ? value.slice(prefix.length) : null; }
function smokeArgument(name) { const value = argumentValue(name); return value ? path.resolve(value) : null; }
function automationArgument() { const prefix = '--automation-run='; const value = process.argv.find(argument => argument.startsWith(prefix)); return value ? value.slice(prefix.length) : null; }
async function taskScheduler(args) { const { stdout, stderr } = await execFileAsync('schtasks.exe', args, { windowsHide: true, timeout: 30000, maxBuffer: 1024 * 1024 }); return { stdout, stderr }; }
function requireTemporaryPath(target, label) { const tempRoot = path.resolve(os.tmpdir()) + path.sep; if (!target || !target.startsWith(tempRoot)) throw new Error(`${label} must be inside the system temporary directory.`); return target; }
async function runPackagedSmoke() {
  const settingsTarget = smokeArgument('knoux-settings-smoke-output');
  const operationTarget = smokeArgument('knoux-operation-smoke-output');
  if (!settingsTarget && !operationTarget) return;
  if (settingsTarget) {
    requireTemporaryPath(settingsTarget, 'Packaged settings smoke output');
    const evidence = await mainWindow.webContents.executeJavaScript(`(async () => {
      const before = await window.knoux.getSettings(); const tools = await window.knoux.listTools(); const marker = before.appearance.accent === 'blue' ? 'green' : 'blue';
      const written = await window.knoux.updateSettings({ appearance: { ...before.appearance, accent: marker } }); const persisted = await window.knoux.getSettings(); const reset = await window.knoux.resetSettingsSection('appearance');
      await window.knoux.updateSettings({ localization: { ...before.localization, locale: 'ar' }, appearance: { ...before.appearance, theme: 'high-contrast', fontScale: 1.5, reduceMotion: true, animations: false } }); let accessibilityApplied = false; for (let attempt = 0; attempt < 40; attempt += 1) { await new Promise(resolve => setTimeout(resolve, 50)); if (document.documentElement.lang === 'ar' && document.documentElement.dir === 'rtl' && document.documentElement.dataset.theme === 'high-contrast' && document.documentElement.dataset.motion === 'reduced' && document.documentElement.style.getPropertyValue('--font-scale') === '1.5') { accessibilityApplied = true; break; } } const focusTarget = document.querySelector('button'); focusTarget?.focus(); const accessibility = { applied: accessibilityApplied, lang: document.documentElement.lang, dir: document.documentElement.dir, theme: document.documentElement.dataset.theme, motion: document.documentElement.dataset.motion, fontScale: document.documentElement.style.getPropertyValue('--font-scale'), keyboardFocusable: document.activeElement === focusTarget }; await window.knoux.updateSettings({ localization: before.localization, appearance: before.appearance });
      return { beforeVersion: before.settingsVersion, toolCount: tools.length, handlersAvailable: tools.every(tool => tool.availability && typeof tool.availability.available === 'boolean'), marker, writeObserved: written.appearance.accent === marker && persisted.appearance.accent === marker, sectionResetObserved: reset.appearance.accent === before.appearance.accent, accessibility };
    })()`);
    await fsp.mkdir(path.dirname(settingsTarget), { recursive: true }); await fsp.writeFile(settingsTarget, JSON.stringify({ capturedAt: new Date().toISOString(), packaged: app.isPackaged, evidence }, null, 2), 'utf8');
  }
  if (operationTarget) {
    requireTemporaryPath(operationTarget, 'Packaged operation smoke output'); const fixture = requireTemporaryPath(smokeArgument('knoux-operation-smoke-fixture'), 'Packaged operation fixture'); const cleanupFixture = requireTemporaryPath(smokeArgument('knoux-temp-cleanup-smoke-fixture'), 'Packaged cleanup fixture'); const cancelFixture = requireTemporaryPath(smokeArgument('knoux-cancel-smoke-fixture'), 'Packaged cancellation fixture'); const startupSmokeValue = argumentValue('knoux-startup-smoke-value'); allowedDirectory(fixture); allowedDirectory(cleanupFixture); allowedDirectory(cancelFixture);
    const source = JSON.stringify(fixture); const cleanupSource = JSON.stringify(cleanupFixture); const cancelSource = JSON.stringify(cancelFixture); const startupSource = JSON.stringify(startupSmokeValue);
    const evidence = await mainWindow.webContents.executeJavaScript(`(async () => {
      const run = (toolId, inputs = {}) => window.knoux.runTool({ toolId, inputs }); const fixture = ${source}; const cleanupFixture = ${cleanupSource}; const cancelFixture = ${cancelSource}; const startupSmokeValue = ${startupSource};
      const health = await run('system-health'); const smartScan = await run('smart-scan'); const servicesInventory = await run('services-inventory', { limit: 2000 }); const serviceCandidate = servicesInventory.items.find(item => item.protected === false && /^[A-Za-z0-9_.-]{1,256}$/.test(String(item.name || ''))); const serviceDryRun = serviceCandidate ? await run('service-control', { serviceName: serviceCandidate.name, action: 'manual', confirm: true, dryRun: true }) : null; const disks = await run('disk-overview'); const processes = await run('process-inventory'); const battery = await run('battery-status'); const startupItems = await run('startup-items'); const installedApps = await run('installed-apps'); const networkDiagnostics = await run('network-diagnostics'); const hardwareInventory = await run('hardware-inventory'); const eventWarnings = await run('event-warnings'); const emptyFolders = await run('empty-folders', { folder: fixture, limit: 500 }); const downloadsInventory = await run('downloads-inventory', { limit: 500 }); const hash = await run('file-hash', { filePath: fixture + '\\\\hash-fixture.txt' });
      const large = await run('large-files', { folder: fixture, thresholdBytes: 1, limit: 500 }); const duplicates = await run('duplicate-files', { folder: fixture, minimumBytes: 1, limit: 500 });
      const preview = await run('organize-downloads-preview', { folder: fixture, limit: 500 }); const apply = await run('organize-downloads-apply', { folder: fixture, confirm: true, limit: 500 });
      const undo = apply.success && apply.summary.journalId ? await run('organize-downloads-undo', { journalId: apply.summary.journalId }) : null;
      const cleanupPreview = await run('temp-cleanup-preview', { limit: 500 }); const cleanupApply = await run('temp-cleanup-apply', { confirm: true, limit: 500 }); const cleanupUndo = cleanupApply.success && cleanupApply.summary.journalId ? await run('temp-cleanup-undo', { journalId: cleanupApply.summary.journalId }) : null;
      const startupDisable = startupSmokeValue ? await run('startup-disable', { valueName: startupSmokeValue, confirm: true }) : null; const startupRestore = startupDisable?.success && startupDisable.summary.journalId ? await run('startup-restore', { journalId: startupDisable.summary.journalId, confirm: true }) : null;
      const automation = await window.knoux.createAutomation({ toolId: 'system-health', label: 'KNOuX packaged automation smoke', trigger: { kind: 'daily', time: '23:59' } }); const automationRun = await window.knoux.runAutomation(automation.id); const automationRemoved = await window.knoux.removeAutomation(automation.id);
      const lifecyclePhases = []; const stopObserving = window.knoux.onOperationEvent(event => { if (event.toolId === 'large-files') { lifecyclePhases.push(event.phase); if (event.phase === 'progress') window.knoux.cancelOperation(event.operationId); } }); const cancellation = await run('large-files', { folder: cancelFixture, thresholdBytes: 1, limit: 10000 }); stopObserving();
      const repairToolIds = ['repair-dism-check-health', 'repair-dism-scan-health', 'repair-dism-restore-health', 'repair-sfc-verify-only', 'repair-sfc-scan-now', 'repair-dns-flush', 'repair-winsock-reset', 'repair-tcpip-reset']; const repairDryRuns = await Promise.all(repairToolIds.map(toolId => run(toolId, { confirm: true, dryRun: true }))); const adminDryRun = repairDryRuns[0];
      return { health, smartScan, servicesInventory, serviceCandidate: serviceCandidate ? { name: serviceCandidate.name } : null, serviceDryRun, disks, processes, battery, startupItems, installedApps, networkDiagnostics, hardwareInventory, eventWarnings, emptyFolders, downloadsInventory, hash, large, duplicates, preview, apply, undo, cleanupFixture, cleanupPreview, cleanupApply, cleanupUndo, startupDisable, startupRestore, automation, automationRun, automationRemoved, cancellation, lifecyclePhases, repairDryRuns, adminDryRun };
    })()`);
    await fsp.mkdir(path.dirname(operationTarget), { recursive: true }); await fsp.writeFile(operationTarget, JSON.stringify({ capturedAt: new Date().toISOString(), packaged: app.isPackaged, fixture, evidence }, null, 2), 'utf8');
  }
  app.isQuiting = true; app.quit();
}
function normalisePath(input) { const resolved = path.resolve(input); if (resolved.length > 32767) throw new Error('Path is too long.'); return resolved; }
function allowedDirectory(input) { const resolved = normalisePath(input); if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) throw new Error('Selected folder is unavailable.'); return resolved; }
function allowedFile(input) { const resolved = normalisePath(input); if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw new Error('Selected file is unavailable.'); return resolved; }
function isCancelled(context) { if (context.cancelled) { const error = new Error('Operation cancelled by the user.'); error.code = 'CANCELLED'; throw error; } }
async function walk(root, context, options = {}) {
  const files = []; const folders = []; const queue = [root]; const limit = options.limit || 50000; let inspected = 0;
  while (queue.length) {
    isCancelled(context); const folder = queue.shift(); folders.push(folder); let entries;
    try { entries = await fsp.readdir(folder, { withFileTypes: true }); } catch (error) { context.warnings.push(`${folder}: ${error.code || 'unavailable'}`); continue; }
    for (const entry of entries) {
      isCancelled(context); if (++inspected > limit) { context.warnings.push(`Scan stopped at the ${limit.toLocaleString()} item safety limit.`); return { files, folders, partial: true }; }
      const full = path.join(folder, entry.name); let stat;
      try { stat = await fsp.lstat(full); } catch { continue; }
      if (stat.isSymbolicLink() || stat.isSocket() || stat.isFIFO()) continue;
      if (entry.isDirectory()) queue.push(full); else if (entry.isFile()) files.push({ path: full, size: stat.size, modifiedAt: stat.mtime.toISOString(), createdAt: stat.birthtime.toISOString() });
      if (inspected % 100 === 0) context.progress(inspected, Math.max(inspected + queue.length, inspected), `Inspected ${inspected.toLocaleString()} filesystem items`);
    }
  }
  return { files, folders, partial: false };
}
function bytes(value) { return Number.isFinite(value) ? value : 0; }
async function powershellJson(script, timeout = 30000) { const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true, timeout, maxBuffer: 10 * 1024 * 1024 }); const text = stdout.trim(); if (!text) return []; try { return JSON.parse(text); } catch { return []; } }
async function diskOverview() { const raw = await powershellJson("Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,VolumeName,FileSystem,Size,FreeSpace | ConvertTo-Json -Depth 3"); return Array.isArray(raw) ? raw : [raw]; }
async function servicesInventory() { const script = "$items=Get-CimInstance Win32_Service | ForEach-Object { $p=Get-ItemProperty -LiteralPath ('HKLM:\\SYSTEM\\CurrentControlSet\\Services\\'+$_.Name) -ErrorAction SilentlyContinue; [pscustomobject]@{name=$_.Name;displayName=$_.DisplayName;description=$_.Description;status=$_.State;startupType=$_.StartMode;delayedAuto=([bool]$p.DelayedAutoStart);binaryPath=$_.PathName;account=$_.StartName;dependencies=$_.Dependencies} }; $items | Sort-Object displayName | ConvertTo-Json -Depth 5"; const raw = await powershellJson(script, 45000); const list = (Array.isArray(raw) ? raw : [raw]).filter(Boolean); return list.map(item => { const serviceName = String(item.name || ''); const controllable = /^[A-Za-z0-9_.-]{1,256}$/.test(serviceName); return { ...item, protected: controllable ? privilegedRunner.isProtectedService(serviceName) : true, controllable }; }); }
async function systemHealth() { const memoryTotal = os.totalmem(), memoryFree = os.freemem(); const disks = await diskOverview(); const primary = disks.find(d => String(d.DeviceID).toUpperCase() === 'C:') || disks[0] || {}; const power = await powershellJson("Get-CimInstance Win32_Battery | Select-Object EstimatedChargeRemaining,BatteryStatus | ConvertTo-Json -Depth 2").catch(() => []); return { platform: process.platform, release: os.release(), hostname: os.hostname(), cpuModel: os.cpus()[0]?.model || 'Unavailable', cpuCores: os.cpus().length, memoryTotalBytes: memoryTotal, memoryFreeBytes: memoryFree, memoryUsedPercent: Math.round((1 - memoryFree / memoryTotal) * 100), uptimeSeconds: Math.round(os.uptime()), systemDrive: primary.DeviceID || null, systemDriveFreeBytes: bytes(primary.FreeSpace), systemDriveTotalBytes: bytes(primary.Size), battery: Array.isArray(power) ? null : power };
}
async function scanLargeFiles(root, context, threshold, limit) {
  const data = await walk(root, context, { limit });
  const intelligence = advancedLocal.buildStorageIntelligence(data.files, root);
  const largest = data.files.filter(file => file.size >= threshold).sort((a, b) => b.size - a.size).slice(0, 500).map(file => ({ ...file, type: advancedLocal.classifyFileType(file.path), ageBucket: advancedLocal.ageBucket(file.modifiedAt) }));
  return { items: largest, summary: { folder: root, filesScanned: data.files.length, matchingFiles: largest.length, thresholdBytes: threshold, totalMatchingBytes: largest.reduce((sum, item) => sum + item.size, 0), totalScannedBytes: intelligence.totalBytes, typeGroups: intelligence.typeGroups, ageBuckets: intelligence.ageBuckets, topFolders: intelligence.topFolders }, partial: data.partial };
}
function downloadCategory(filePath) { const ext = path.extname(filePath).toLowerCase(); if (['.jpg','.jpeg','.png','.gif','.webp','.heic','.svg'].includes(ext)) return 'Images'; if (['.mp4','.mkv','.mov','.avi','.webm'].includes(ext)) return 'Videos'; if (['.mp3','.wav','.flac','.aac','.m4a'].includes(ext)) return 'Audio'; if (['.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.txt'].includes(ext)) return 'Documents'; if (['.zip','.rar','.7z','.tar','.gz'].includes(ext)) return 'Archives'; if (['.exe','.msi','.msix','.appx'].includes(ext)) return 'Installers'; if (['.js','.ts','.tsx','.py','.java','.cs','.cpp','.json','.html','.css'].includes(ext)) return 'Development'; return 'Other'; }
async function downloadOrganizationPlan(context, limit, sourceFolder) { const source = sourceFolder ? allowedDirectory(sourceFolder) : app.getPath('downloads'); const data = await walk(source, context, { limit }); const plans = data.files.filter(file => path.dirname(file.path) === source).map(file => ({ source: file.path, category: downloadCategory(file.path), destination: path.join(source, downloadCategory(file.path), path.basename(file.path)), size: file.size })); return { source, plans, partial: data.partial }; }
async function scanDuplicates(root, context, minimumSize, limit) {
  const data = await walk(root, context, { limit }); const sizeGroups = new Map(); data.files.filter(file => file.size >= minimumSize).forEach(file => { const group = sizeGroups.get(file.size) || []; group.push(file); sizeGroups.set(file.size, group); }); const candidates = [...sizeGroups.values()].filter(group => group.length > 1).flat(); const hashes = new Map();
  for (let index = 0; index < candidates.length; index++) { isCancelled(context); const file = candidates[index]; const hash = crypto.createHash('sha256'); await new Promise((resolve, reject) => { const stream = fs.createReadStream(file.path); stream.on('error', reject); stream.on('data', chunk => hash.update(chunk)); stream.on('end', resolve); }); const key = `${file.size}:${hash.digest('hex')}`; const group = hashes.get(key) || []; group.push(file); hashes.set(key, group); context.progress(index + 1, candidates.length || 1, `Verified ${index + 1} duplicate candidates with SHA-256`); }
  const exactGroups = [...hashes.entries()].filter(([, group]) => group.length > 1).map(([key, group]) => ({ hash: key.split(':')[1], size: group[0].size, count: group.length, reclaimableBytes: group[0].size * (group.length - 1), files: group }));
  const enriched = advancedLocal.enrichDuplicateGroups(exactGroups);
  return { items: enriched.items, summary: { folder: root, filesScanned: data.files.length, candidateFiles: candidates.length, ...enriched.summary, exactHashAlgorithm: 'sha256', automaticDeletion: false }, partial: data.partial };
}
async function tempCleanupCandidates(context, limit) {
  const smokeFixture = app.isPackaged && smokeArgument('knoux-temp-cleanup-smoke-fixture');
  const temp = smokeFixture ? requireTemporaryPath(smokeFixture, 'Packaged cleanup fixture') : (process.env.TEMP || os.tmpdir());
  if (smokeFixture) allowedDirectory(temp);
  const data = await walk(temp, context, { limit: Math.min(limit, 25000) });
  const oldest = Date.now() - (await getSettings()).cleanup.minimumFileAgeDays * 86400000;
  const selected = data.files.filter(file => new Date(file.modifiedAt).getTime() < oldest);
  return { temp, data, selected };
}
async function moveWithFallback(source, destination) {
  try { await fsp.rename(source, destination); }
  catch (error) { if (error?.code !== 'EXDEV') throw error; await fsp.copyFile(source, destination, fs.constants.COPYFILE_EXCL); await fsp.unlink(source); }
}
async function runTool(context, tool, inputs) {
  const home = app.getPath('home'); const folder = allowedDirectory(inputs.folder || home); const limit = inputs.limit || 50000;
  if (OPERATION_SPECS[tool.engine]) { const output = await privilegedRunner.run(tool.engine, { dryRun: inputs.dryRun }); if (!inputs.dryRun && output.summary.exitCode !== 0) throw new Error(`Privileged operation exited with code ${output.summary.exitCode}.`); return output; }
  if (tool.engine === 'servicesInventory') { const list = await servicesInventory(); const search = String(inputs.search || '').toLocaleLowerCase(); const filtered = search ? list.filter(item => `${item.name} ${item.displayName} ${item.description || ''}`.toLocaleLowerCase().includes(search)) : list; return { items: filtered.slice(0, inputs.limit || 2000), summary: { services: filtered.length, protectedServices: filtered.filter(item => item.protected).length } }; }
  if (tool.engine === 'serviceControl') { const list = await servicesInventory(); const service = list.find(item => item.name.toLocaleLowerCase() === inputs.serviceName.toLocaleLowerCase()); if (!service) throw new Error('Windows service was not found.'); let journalId = null; const startupAction = ['automatic', 'delayedAutomatic', 'manual', 'disabled'].includes(inputs.action); if (startupAction && !inputs.dryRun) { journalId = crypto.randomUUID(); const oldAction = service.delayedAuto ? 'delayedAutomatic' : service.startupType === 'Auto' ? 'automatic' : service.startupType === 'Disabled' ? 'disabled' : 'manual'; await writeJson(`undo-service-${journalId}.json`, { journalId, serviceName: service.name, oldAction, createdAt: new Date().toISOString() }); } const output = await privilegedRunner.runService({ serviceName: inputs.serviceName, action: inputs.action, dryRun: inputs.dryRun }); return { ...output, undoMetadata: journalId ? { journalId, action: 'service-startup' } : null, summary: { ...output.summary, previousStatus: service.status, previousStartupType: service.startupType, journalId } }; }
  if (tool.engine === 'serviceStartupUndo') { const journal = await readJson(`undo-service-${inputs.journalId}.json`, null); if (!journal?.serviceName || !journal?.oldAction) throw new Error('Service startup undo journal is unavailable.'); const output = await privilegedRunner.runService({ serviceName: journal.serviceName, action: journal.oldAction, dryRun: inputs.dryRun }); return { ...output, summary: { ...output.summary, journalId: inputs.journalId, restoredStartupAction: journal.oldAction } }; }
  if (tool.engine === 'systemHealth') return { summary: await systemHealth(), items: [] };
  if (tool.engine === 'diskOverview') { const rawItems = await diskOverview(); const items = advancedLocal.diskPressure(rawItems); return { items, summary: { drives: items.length, pressuredDrives: items.filter(item => ['critical', 'high'].includes(item.pressure)).length, criticalDrives: items.filter(item => item.pressure === 'critical').length } }; }
  if (tool.engine === 'largeFiles') return await scanLargeFiles(folder, context, Number(inputs.thresholdBytes) || (await getSettings()).scanning.largeFileBytes, limit);
  if (tool.engine === 'duplicates') return await scanDuplicates(folder, context, Number(inputs.minimumBytes) || (await getSettings()).scanning.minimumDuplicateBytes, limit);
  if (tool.engine === 'emptyFolders') { const data = await walk(folder, context, { limit }); const empty = []; for (const item of data.folders) { try { if ((await fsp.readdir(item)).length === 0) empty.push({ path: item }); } catch {} } return { items: empty.slice(0, 1000), summary: { folder, foldersScanned: data.folders.length, emptyFolders: empty.length }, partial: data.partial }; }
  if (tool.engine === 'downloadsInventory') {
    const downloads = app.getPath('downloads'); const data = await walk(downloads, context, { limit }); const intelligence = advancedLocal.buildStorageIntelligence(data.files, downloads); const privacy = advancedLocal.privacyExposure(data.files);
    const items = data.files.sort((a,b) => b.size-a.size).slice(0, 200).map(file => ({ ...file, type: advancedLocal.classifyFileType(file.path), ageBucket: advancedLocal.ageBucket(file.modifiedAt) }));
    return { items, summary: { folder: downloads, files: data.files.length, totalBytes: intelligence.totalBytes, extensionGroups: intelligence.extensionGroups, typeGroups: intelligence.typeGroups, ageBuckets: intelligence.ageBuckets, topFolders: intelligence.topFolders, privacyExposureCount: privacy.summary.exposureCount, privacyExposureBytes: privacy.summary.exposureBytes, privacyMetadataOnly: true, privacyContentsInspected: false, privacyFindings: privacy.items.slice(0, 50) }, partial: data.partial };
  }
  if (tool.engine === 'organizePreview') { const plan = await downloadOrganizationPlan(context, limit, inputs.folder); return { items: plan.plans.slice(0, 1000), summary: { sourceFolder: plan.source, plannedMoves: plan.plans.length, previewOnly: true }, partial: plan.partial }; }
  if (tool.engine === 'organizeApply') { if (inputs.confirm !== true) throw new Error('Explicit confirmation is required before moving files.'); const plan = await downloadOrganizationPlan(context, limit, inputs.folder); const journal = []; for (let index = 0; index < plan.plans.length; index++) { isCancelled(context); const item = plan.plans[index]; if (fs.existsSync(item.destination)) { context.warnings.push(`Skipped name conflict: ${item.source}`); continue; } await fsp.mkdir(path.dirname(item.destination), { recursive: true }); await fsp.rename(item.source, item.destination); journal.push({ source: item.source, destination: item.destination }); context.progress(index + 1, plan.plans.length || 1, `Moved ${index + 1} files`); } const journalId = crypto.randomUUID(); await writeJson(`undo-${journalId}.json`, { journalId, createdAt: new Date().toISOString(), action: 'organize-downloads', moves: journal }); return { items: journal.slice(0, 1000), summary: { journalId, movedFiles: journal.length, skippedFiles: plan.plans.length - journal.length }, partial: plan.partial, undoMetadata: { journalId, action: 'organize-downloads' } }; }
  if (tool.engine === 'organizeUndo') { const journalId = z.string().uuid().parse(inputs.journalId); const journal = await readJson(`undo-${journalId}.json`, null); if (!journal || !Array.isArray(journal.moves)) throw new Error('Undo journal is unavailable.'); const restored = []; for (let index = journal.moves.length - 1; index >= 0; index--) { isCancelled(context); const item = journal.moves[index]; if (fs.existsSync(item.destination) && !fs.existsSync(item.source)) { await fsp.mkdir(path.dirname(item.source), { recursive: true }); await fsp.rename(item.destination, item.source); restored.push(item); } context.progress(journal.moves.length - index, journal.moves.length || 1, `Restored ${journal.moves.length - index} files`); } return { items: restored, summary: { journalId, restoredFiles: restored.length, skippedFiles: journal.moves.length - restored.length } }; }
  if (tool.engine === 'tempPreview') { const candidate = await tempCleanupCandidates(context, limit); return { items: candidate.selected.sort((a,b) => b.size-a.size).slice(0, 500), summary: { folder: candidate.temp, eligibleFiles: candidate.selected.length, eligibleBytes: candidate.selected.reduce((sum, item) => sum + item.size, 0), readOnlyPreview: true }, partial: candidate.data.partial }; }
  if (tool.engine === 'tempCleanupApply') {
    if (inputs.confirm !== true) throw new Error('Explicit confirmation is required before moving temporary files.');
    const candidate = await tempCleanupCandidates(context, limit); const journalId = crypto.randomUUID(); const quarantine = appDataPath(path.join('cleanup-quarantine', journalId)); const moves = [];
    await fsp.mkdir(quarantine, { recursive: true });
    for (let index = 0; index < candidate.selected.length; index++) {
      isCancelled(context); const item = candidate.selected[index]; const target = path.join(quarantine, `${crypto.createHash('sha256').update(item.path).digest('hex').slice(0, 16)}-${path.basename(item.path)}`);
      try { if (fs.existsSync(item.path)) { await moveWithFallback(item.path, target); moves.push({ source: item.path, quarantine: target, size: item.size }); } } catch (error) { context.warnings.push(`${item.path}: ${error.code || error.message || 'unavailable'}`); }
      context.progress(index + 1, candidate.selected.length || 1, `Quarantined ${index + 1} temporary files`);
    }
    await writeJson(`undo-temp-cleanup-${journalId}.json`, { journalId, createdAt: new Date().toISOString(), action: 'temp-cleanup', moves });
    return { items: moves.slice(0, 1000), summary: { journalId, quarantinedFiles: moves.length, quarantinedBytes: moves.reduce((sum, item) => sum + item.size, 0), recoverable: true }, partial: candidate.data.partial, undoMetadata: { journalId, action: 'temp-cleanup' } };
  }
  if (tool.engine === 'tempCleanupUndo') {
    const journalId = z.string().uuid().parse(inputs.journalId); const journal = await readJson(`undo-temp-cleanup-${journalId}.json`, null); if (!journal || !Array.isArray(journal.moves)) throw new Error('Cleanup undo journal is unavailable.'); const restored = [];
    for (let index = journal.moves.length - 1; index >= 0; index--) { isCancelled(context); const item = journal.moves[index]; try { if (fs.existsSync(item.quarantine) && !fs.existsSync(item.source)) { await fsp.mkdir(path.dirname(item.source), { recursive: true }); await moveWithFallback(item.quarantine, item.source); restored.push(item); } } catch (error) { context.warnings.push(`${item.source}: ${error.code || error.message || 'unavailable'}`); } context.progress(journal.moves.length - index, journal.moves.length || 1, `Restored ${journal.moves.length - index} temporary files`); }
    return { items: restored, summary: { journalId, restoredFiles: restored.length, skippedFiles: journal.moves.length - restored.length, recoverable: true } };
  }
  if (tool.engine === 'startupDisable') return await startupManager.disable({ valueName: inputs.valueName, dryRun: inputs.dryRun });
  if (tool.engine === 'startupRestore') return await startupManager.restore({ journalId: inputs.journalId, dryRun: inputs.dryRun });
  if (tool.engine === 'startupItems') { const script = "$run=@(); $paths=@('HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run','HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'); foreach($p in $paths){if(Test-Path $p){$x=Get-ItemProperty $p; $x.PSObject.Properties | Where-Object {$_.Name -notmatch '^PS'} | ForEach-Object {$run += [pscustomobject]@{name=$_.Name;command=[string]$_.Value;source=$p;enabled=$true}}}}; $run | ConvertTo-Json -Depth 3"; const items = await powershellJson(script); return { items: Array.isArray(items) ? items : [items], summary: { entries: Array.isArray(items) ? items.length : 1 } }; }
  if (tool.engine === 'installedApps') { const script = "$paths=@('HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'); Get-ItemProperty $paths -ErrorAction SilentlyContinue | Where-Object {$_.DisplayName} | Select-Object @{n='name';e={$_.DisplayName}},@{n='version';e={$_.DisplayVersion}},@{n='publisher';e={$_.Publisher}},@{n='installLocation';e={$_.InstallLocation}},@{n='uninstallString';e={$_.UninstallString}} | Sort-Object name -Unique | ConvertTo-Json -Depth 3"; const items = await powershellJson(script); const list = (Array.isArray(items) ? items : [items]).filter(Boolean); const hygiene = advancedLocal.analyzeInstalledApps(list); return { items: list.map(item => ({ ...item, installLocationRecorded: Boolean(String(item.installLocation || '').trim()), uninstallCommandRecorded: Boolean(String(item.uninstallString || '').trim()) })), summary: { ...hygiene, registryReadOnly: true } }; }
  if (tool.engine === 'networkDiagnostics') { const interfaces = Object.entries(os.networkInterfaces()).flatMap(([name, records]) => (records || []).filter(record => !record.internal).map(record => ({ name, address: record.address, family: record.family, mac: record.mac, netmask: record.netmask }))); const dns = await powershellJson("Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object InterfaceAlias,ServerAddresses | ConvertTo-Json -Depth 3").catch(() => []); return { items: interfaces, summary: { activeAddresses: interfaces.length, dnsConfigured: Array.isArray(dns) ? dns.length : 1 } }; }
  if (tool.engine === 'hardwareInventory') { const script = "$cpu=Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,MaxClockSpeed; $gpu=Get-CimInstance Win32_VideoController | Select-Object Name,AdapterRAM,DriverVersion; $bios=Get-CimInstance Win32_BIOS | Select-Object Manufacturer,SMBIOSBIOSVersion,ReleaseDate; [pscustomobject]@{cpu=$cpu;gpu=$gpu;bios=$bios} | ConvertTo-Json -Depth 5"; const result = await powershellJson(script); return { items: [result], summary: { cpu: result.cpu?.Name || null, gpuCount: Array.isArray(result.gpu) ? result.gpu.length : result.gpu ? 1 : 0 } }; }
  if (tool.engine === 'eventWarnings') { const script = "Get-WinEvent -FilterHashtable @{LogName='System';Level=2,3;StartTime=(Get-Date).AddDays(-7)} -MaxEvents 50 -ErrorAction SilentlyContinue | Select-Object TimeCreated,Id,ProviderName,LevelDisplayName,Message | ConvertTo-Json -Depth 3"; const entries = await powershellJson(script, 45000); const list = (Array.isArray(entries) ? entries : [entries]).filter(Boolean); const clustered = advancedLocal.clusterEventWarnings(list); return { items: clustered.items, summary: { ...clustered.summary, periodDays: 7, groupedForTriage: true } }; }
  if (tool.engine === 'processInventory') { const entries = await powershellJson("Get-Process | Select-Object ProcessName,Id,CPU,WS,Path,StartTime | Sort-Object WS -Descending | ConvertTo-Json -Depth 3", 45000); const list = (Array.isArray(entries) ? entries : [entries]).filter(Boolean); return { items: list.slice(0, 500), summary: { processes: list.length, readOnly: true } }; }
  if (tool.engine === 'batteryStatus') { const entries = await powershellJson("Get-CimInstance Win32_Battery | Select-Object Name,EstimatedChargeRemaining,BatteryStatus,DesignCapacity,FullChargeCapacity,EstimatedRunTime | ConvertTo-Json -Depth 3"); const list = (Array.isArray(entries) ? entries : [entries]).filter(Boolean); return { items: list, summary: { batteryPresent: list.length > 0, batteries: list.length, unavailable: list.length === 0 } }; }
  if (tool.engine === 'fileHash') { const file = allowedFile(String(inputs.filePath || '')); const algorithm = inputs.algorithm === 'sha512' ? 'sha512' : 'sha256'; const hash = crypto.createHash(algorithm); await new Promise((resolve, reject) => { const stream = fs.createReadStream(file); stream.on('error', reject); stream.on('data', chunk => hash.update(chunk)); stream.on('end', resolve); }); return { items: [{ path: file, algorithm, digest: hash.digest('hex') }], summary: { algorithm, file } }; }
  if (tool.engine === 'smartScan') {
    const health = await systemHealth(); context.progress(1, 7, 'Measured system health');
    const disk = await diskOverview(); context.progress(2, 7, 'Read storage volumes and pressure');
    const downloadsFolder = app.getPath('downloads'); const download = await scanLargeFiles(downloadsFolder, context, 100 * 1024 * 1024, 15000); context.progress(3, 7, 'Built Downloads storage intelligence');
    const downloadData = await walk(downloadsFolder, context, { limit: 15000 }); const privacy = advancedLocal.privacyExposure(downloadData.files); context.progress(4, 7, 'Reviewed sensitive filenames using metadata only');
    const duplicate = await scanDuplicates(downloadsFolder, context, Math.max((await getSettings()).scanning.minimumDuplicateBytes, 1024), 10000); context.progress(5, 7, 'Verified exact duplicate groups with SHA-256');
    const temp = await runTool(context, toolDefinitions.find(t => t.engine === 'tempPreview'), {}); context.progress(6, 7, 'Measured recoverable temporary-file footprint');
    const score = advancedLocal.buildSmartScore({ health, disks: disk, duplicateSummary: duplicate.summary, privacySummary: privacy.summary, tempEligibleBytes: temp.summary.eligibleBytes }); context.progress(7, 7, 'Completed local multi-signal Smart Scan');
    const findings = [];
    for (const volume of advancedLocal.diskPressure(disk).filter(item => item.pressure !== 'healthy')) findings.push({ severity: ['critical', 'high'].includes(volume.pressure) ? 'warning' : 'info', key: 'diskPressure', drive: volume.DeviceID, freePercent: volume.freePercent, pressure: volume.pressure });
    if (download.summary.matchingFiles) findings.push({ severity: 'info', key: 'largeDownloads', value: download.summary.matchingFiles, bytes: download.summary.totalMatchingBytes });
    if (duplicate.summary.duplicateGroups) findings.push({ severity: 'info', key: 'exactDuplicates', groups: duplicate.summary.duplicateGroups, reclaimableBytes: duplicate.summary.reclaimableBytes });
    if (privacy.summary.exposureCount) findings.push({ severity: 'warning', key: 'privacyMetadataReview', value: privacy.summary.exposureCount, contentsInspected: false });
    if (temp.summary.eligibleFiles) findings.push({ severity: 'info', key: 'tempReview', value: temp.summary.eligibleFiles, bytes: temp.summary.eligibleBytes });
    return { items: findings, summary: { smartScore: score.score, scoreReasons: score.reasons, health, volumes: advancedLocal.diskPressure(disk), storageIntelligence: { typeGroups: download.summary.typeGroups, ageBuckets: download.summary.ageBuckets, topFolders: download.summary.topFolders }, largeDownloads: download.summary.matchingFiles || 0, exactDuplicateGroups: duplicate.summary.duplicateGroups || 0, duplicateReclaimableBytes: duplicate.summary.reclaimableBytes || 0, privacyExposureCount: privacy.summary.exposureCount || 0, privacyMetadataOnly: true, privacyContentsInspected: false, tempEligibleBytes: temp.summary.eligibleBytes || 0 } };
  }
  throw new Error('Registered tool handler is unavailable.');
}
async function execute(request) {
  const parsed = runRequestSchema.parse(request); const tool = toolDefinitions.find(item => item.id === parsed.toolId); if (!tool) throw new Error('Unknown tool ID.');
  const availability = await tool.availabilityProbe(); if (!availability.available) throw new Error(availability.reason || 'Tool is unavailable.');
  const inputs = tool.inputSchema.parse(parsed.inputs); const operationId = crypto.randomUUID(); const startedAt = new Date().toISOString();
  const context = { cancelled: false, cancelRequested: false, warnings: [], startedAt, updatedAt: startedAt, phase: 'idle', progressValue: null, progress: (current, total, message) => phase(operationId, tool.id, 'progress', message, { current, total, percent: Math.min(100, Math.round((current / Math.max(total, 1)) * 100)) }) };
  operations.set(operationId, context); phase(operationId, tool.id, 'queued', 'Operation queued'); phase(operationId, tool.id, 'preflight', 'Validated request, schema, handler, and local availability');
  if (tool.riskLevel !== 'read-only') phase(operationId, tool.id, 'awaiting-confirmation', 'Validated the explicit confirmation supplied for this write operation');
  try {
    if (tool.requiresAdmin && !inputs.dryRun) { if ((await getSettings()).security.elevationPolicy === 'deny') throw new Error('Elevation is disabled in Security settings.'); phase(operationId, tool.id, 'awaiting-admin', 'Waiting for Windows administrator approval'); }
    phase(operationId, tool.id, 'running', 'Performing local Windows operation'); const output = tool.outputSchema.parse(await tool.handler(context, inputs));
    const result = { operationId, toolId: tool.id, success: true, startedAt, finishedAt: new Date().toISOString(), summary: output.summary, items: output.items, warnings: [...context.warnings, ...(output.warnings || [])], errors: [], partial: Boolean(output.partial), restartRequired: Boolean(output.restartRequired), undoMetadata: output.undoMetadata || null };
    phase(operationId, tool.id, 'result', 'Structured result available', { result }); phase(operationId, tool.id, 'completed', 'Operation completed', { result });
    await addHistory({ ...result, action: tool.id, durationMs: new Date(result.finishedAt).getTime() - new Date(startedAt).getTime(), undoAvailable: tool.supportsUndo }); await log('info', 'operation.completed', { operationId, toolId: tool.id }); return result;
  } catch (error) {
    const cancelled = error.code === 'CANCELLED'; const result = { operationId, toolId: tool.id, success: false, startedAt, finishedAt: new Date().toISOString(), summary: {}, items: [], warnings: context.warnings, errors: [error.message], partial: cancelled, restartRequired: false, undoMetadata: null };
    phase(operationId, tool.id, cancelled ? 'cancelled' : 'failed', error.message, { result }); await addHistory({ ...result, action: tool.id, durationMs: new Date(result.finishedAt).getTime() - new Date(startedAt).getTime(), undoAvailable: false }); await log('error', 'operation.failed', { operationId, toolId: tool.id, error: error.message }); return result;
  } finally { operations.delete(operationId); }
}
function createWindow() {
  const bounds = settingsCache?.general.rememberWindowBounds ? settingsCache.window.bounds : null;
  mainWindow = new BrowserWindow({
    width: bounds?.width || 1480, height: bounds?.height || 940, x: bounds?.x, y: bounds?.y, minWidth: 860, minHeight: 600,
    show: false, backgroundColor: '#111118', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, enableRemoteModule: false }
  });
  mainWindow.once('ready-to-show', () => { if (!settingsCache.general.startMinimized && !process.argv.includes('--start-minimized')) mainWindow.show(); });
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  mainWindow.webContents.once('did-finish-load', () => runPackagedSmoke().catch(async error => { const targets = [smokeArgument('knoux-settings-smoke-output'), smokeArgument('knoux-operation-smoke-output')].filter(Boolean); for (const target of targets) await fsp.writeFile(target, JSON.stringify({ capturedAt: new Date().toISOString(), packaged: app.isPackaged, error: error.message }, null, 2), 'utf8').catch(() => {}); app.isQuiting = true; app.exit(1); }));
  mainWindow.on('minimize', event => { if (settingsCache?.general.minimizeToTray) { event.preventDefault(); mainWindow.hide(); } });
  mainWindow.on('close', async event => {
    if (app.isQuiting) return;
    if (settingsCache?.general.closeBehavior === 'tray') { event.preventDefault(); mainWindow.hide(); return; }
    const shouldAsk = settingsCache?.general.closeBehavior === 'ask' || (settingsCache?.general.confirmExitActiveOperations && operations.size > 0);
    if (shouldAsk) {
      event.preventDefault();
      const arabic = settingsCache?.localization.locale === 'ar';
      const answer = await dialog.showMessageBox(mainWindow, { type: 'question', buttons: arabic ? ['إلغاء', 'خروج'] : ['Cancel', 'Exit'], defaultId: 0, cancelId: 0, title: 'KNOuX SmartOrganizer', message: operations.size > 0 ? (arabic ? 'لا تزال هناك عمليات نشطة. هل تريد الخروج؟' : 'Operations are still active. Exit anyway?') : (arabic ? 'هل تريد الخروج من KNOuX SmartOrganizer؟' : 'Exit KNOuX SmartOrganizer?') });
      if (answer.response === 1) { app.isQuiting = true; app.quit(); }
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
  const scheduledId = automationArgument();
  if (scheduledId) { const schedule = await automationStore.find(scheduledId); if (!schedule || !schedule.enabled) { app.exit(2); return; } const completed = await execute({ toolId: schedule.toolId, inputs: {} }); await automationStore.recordRun(schedule.id, completed); app.exit(completed.success ? 0 : 1); return; }
  createWindow(); createTray();
  ipcMain.handle('knoux:app-info', () => ({ version: app.getVersion(), startedAt, platform: process.platform, isPackaged: app.isPackaged, electron: process.versions.electron, chromium: process.versions.chrome }));
  ipcMain.handle('knoux:tools-list', () => serializeRegistry(toolDefinitions));
  ipcMain.handle('knoux:settings-get', getSettings);
  ipcMain.handle('knoux:settings-update', (_event, patch) => updateSettings(z.record(z.unknown()).parse(patch)));
  ipcMain.handle('knoux:settings-export', async () => { const result = await dialog.showSaveDialog(mainWindow, { defaultPath: 'knoux-settings.json', filters: [{ name: 'JSON', extensions: ['json'] }] }); if (result.canceled || !result.filePath) return null; await fsp.writeFile(result.filePath, JSON.stringify(await getSettings(), null, 2), 'utf8'); return result.filePath; });
  ipcMain.handle('knoux:settings-import', async () => { const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] }); if (result.canceled || !result.filePaths[0]) return null; const value = await settingsStore.importText(await fsp.readFile(result.filePaths[0], 'utf8')); settingsCache = value; applyRuntimeSettings(value); publishSettings(value); return value; });
  ipcMain.handle('knoux:settings-reset-section', async (_event, section) => { const value = await settingsStore.resetSection(z.string().min(1).max(32).parse(section)); settingsCache = value; applyRuntimeSettings(value); publishSettings(value); return value; });
  ipcMain.handle('knoux:settings-reset', async () => { const value = await settingsStore.resetAll(); settingsCache = value; applyRuntimeSettings(value); publishSettings(value); return value; });
  ipcMain.handle('knoux:history-list', history);
  ipcMain.handle('knoux:history-export', async (_event, format) => { const selectedFormat = z.enum(['json', 'csv']).parse(format); const result = await dialog.showSaveDialog(mainWindow, { defaultPath: `knoux-operation-history.${selectedFormat}`, filters: [{ name: selectedFormat.toUpperCase(), extensions: [selectedFormat] }] }); if (result.canceled || !result.filePath) return null; const records = history(); if (selectedFormat === 'json') await fsp.writeFile(result.filePath, JSON.stringify(records, null, 2), 'utf8'); else { const fields = ['operationId', 'toolId', 'action', 'success', 'startedAt', 'finishedAt', 'durationMs', 'undoAvailable']; const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`; const csv = [fields.join(','), ...records.map(record => fields.map(field => quote(record[field])).join(','))].join('\r\n'); await fsp.writeFile(result.filePath, csv, 'utf8'); } return result.filePath; });
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
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); else mainWindow.show(); });