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

const execFileAsync = promisify(execFile);
const operations = new Map();
let mainWindow = null;
let tray = null;
let settingsCache = null;
let settingsStore = null;
const startedAt = new Date().toISOString();
const privilegedRunner = createPrivilegedRunner();
const toolDefinitions = createToolRegistry(engine => (context, inputs) => runTool(context, { engine }, inputs), { availabilityResolver: engine => privilegedRunner.probe(engine) });

const runRequestSchema = z.object({
  toolId: z.string().min(1).max(64),
  inputs: z.record(z.unknown()).default({}),
  dryRun: z.boolean().optional().default(false)
}).strict();

function appDataPath(name) { return path.join(app.getPath('userData'), name); }
async function ensureAppStorage() { await fsp.mkdir(app.getPath('userData'), { recursive: true }); await fsp.mkdir(appDataPath('logs'), { recursive: true }); }
async function readJson(name, fallback) { try { return JSON.parse(await fsp.readFile(appDataPath(name), 'utf8')); } catch { return fallback; } }
async function writeJson(name, data) { const target = appDataPath(name); const temp = `${target}.${process.pid}.${Date.now()}.tmp`; await fsp.writeFile(temp, JSON.stringify(data, null, 2), 'utf8'); await fsp.rename(temp, target); }
async function log(level, event, details = {}) { const line = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...details }) + '\n'; await fsp.appendFile(path.join(appDataPath('logs'), 'operations.ndjson'), line).catch(() => {}); }
async function getSettings() { const value = await settingsStore.get(); settingsCache = value; return value; }
async function updateSettings(patch) { const value = await settingsStore.update(patch); settingsCache = value; applyRuntimeSettings(value); return value; }
async function history() { return await readJson('history.json', []); }
async function addHistory(entry) { const records = await history(); records.unshift(entry); await writeJson('history.json', records.slice(0, 200)); }
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
function smokeArgument(name) { const prefix = `--${name}=`; const value = process.argv.find(argument => argument.startsWith(prefix)); return value ? path.resolve(value.slice(prefix.length)) : null; }
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
      return { beforeVersion: before.settingsVersion, toolCount: tools.length, handlersAvailable: tools.every(tool => tool.availability && typeof tool.availability.available === 'boolean'), marker, writeObserved: written.appearance.accent === marker && persisted.appearance.accent === marker, sectionResetObserved: reset.appearance.accent === before.appearance.accent };
    })()`);
    await fsp.mkdir(path.dirname(settingsTarget), { recursive: true }); await fsp.writeFile(settingsTarget, JSON.stringify({ capturedAt: new Date().toISOString(), packaged: app.isPackaged, evidence }, null, 2), 'utf8');
  }
  if (operationTarget) {
    requireTemporaryPath(operationTarget, 'Packaged operation smoke output'); const fixture = requireTemporaryPath(smokeArgument('knoux-operation-smoke-fixture'), 'Packaged operation fixture'); allowedDirectory(fixture);
    const source = JSON.stringify(fixture);
    const evidence = await mainWindow.webContents.executeJavaScript(`(async () => {
      const run = (toolId, inputs = {}) => window.knoux.runTool({ toolId, inputs }); const fixture = ${source};
      const health = await run('system-health'); const disks = await run('disk-overview'); const hash = await run('file-hash', { filePath: fixture + '\\\\hash-fixture.txt' });
      const large = await run('large-files', { folder: fixture, thresholdBytes: 1, limit: 500 }); const duplicates = await run('duplicate-files', { folder: fixture, minimumBytes: 1, limit: 500 });
      const preview = await run('organize-downloads-preview', { folder: fixture, limit: 500 }); const apply = await run('organize-downloads-apply', { folder: fixture, confirm: true, limit: 500 });
      const undo = apply.success && apply.summary.journalId ? await run('organize-downloads-undo', { journalId: apply.summary.journalId }) : null;
      const adminDryRun = await run('repair-dism-check-health', { confirm: true, dryRun: true });
      return { health, disks, hash, large, duplicates, preview, apply, undo, adminDryRun };
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
async function systemHealth() { const memoryTotal = os.totalmem(), memoryFree = os.freemem(); const disks = await diskOverview(); const primary = disks.find(d => String(d.DeviceID).toUpperCase() === 'C:') || disks[0] || {}; const power = await powershellJson("Get-CimInstance Win32_Battery | Select-Object EstimatedChargeRemaining,BatteryStatus | ConvertTo-Json -Depth 2").catch(() => []); return { platform: process.platform, release: os.release(), hostname: os.hostname(), cpuModel: os.cpus()[0]?.model || 'Unavailable', cpuCores: os.cpus().length, memoryTotalBytes: memoryTotal, memoryFreeBytes: memoryFree, memoryUsedPercent: Math.round((1 - memoryFree / memoryTotal) * 100), uptimeSeconds: Math.round(os.uptime()), systemDrive: primary.DeviceID || null, systemDriveFreeBytes: bytes(primary.FreeSpace), systemDriveTotalBytes: bytes(primary.Size), battery: Array.isArray(power) ? null : power };
}
async function scanLargeFiles(root, context, threshold, limit) { const data = await walk(root, context, { limit }); const largest = data.files.filter(file => file.size >= threshold).sort((a, b) => b.size - a.size).slice(0, 500); return { items: largest, summary: { folder: root, filesScanned: data.files.length, matchingFiles: largest.length, thresholdBytes: threshold, totalMatchingBytes: largest.reduce((sum, item) => sum + item.size, 0) }, partial: data.partial }; }
function downloadCategory(filePath) { const ext = path.extname(filePath).toLowerCase(); if (['.jpg','.jpeg','.png','.gif','.webp','.heic','.svg'].includes(ext)) return 'Images'; if (['.mp4','.mkv','.mov','.avi','.webm'].includes(ext)) return 'Videos'; if (['.mp3','.wav','.flac','.aac','.m4a'].includes(ext)) return 'Audio'; if (['.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx','.txt'].includes(ext)) return 'Documents'; if (['.zip','.rar','.7z','.tar','.gz'].includes(ext)) return 'Archives'; if (['.exe','.msi','.msix','.appx'].includes(ext)) return 'Installers'; if (['.js','.ts','.tsx','.py','.java','.cs','.cpp','.json','.html','.css'].includes(ext)) return 'Development'; return 'Other'; }
async function downloadOrganizationPlan(context, limit, sourceFolder) { const source = sourceFolder ? allowedDirectory(sourceFolder) : app.getPath('downloads'); const data = await walk(source, context, { limit }); const plans = data.files.filter(file => path.dirname(file.path) === source).map(file => ({ source: file.path, category: downloadCategory(file.path), destination: path.join(source, downloadCategory(file.path), path.basename(file.path)), size: file.size })); return { source, plans, partial: data.partial }; }
async function scanDuplicates(root, context, minimumSize, limit) { const data = await walk(root, context, { limit }); const sizeGroups = new Map(); data.files.filter(file => file.size >= minimumSize).forEach(file => { const group = sizeGroups.get(file.size) || []; group.push(file); sizeGroups.set(file.size, group); }); const candidates = [...sizeGroups.values()].filter(group => group.length > 1).flat(); const hashes = new Map(); for (let index = 0; index < candidates.length; index++) { isCancelled(context); const file = candidates[index]; const hash = crypto.createHash('sha256'); await new Promise((resolve, reject) => { const stream = fs.createReadStream(file.path); stream.on('error', reject); stream.on('data', chunk => hash.update(chunk)); stream.on('end', resolve); }); const key = `${file.size}:${hash.digest('hex')}`; const group = hashes.get(key) || []; group.push(file); hashes.set(key, group); context.progress(index + 1, candidates.length || 1, `Verified ${index + 1} duplicate candidates with SHA-256`); }
  const groups = [...hashes.entries()].filter(([, group]) => group.length > 1).map(([key, group]) => ({ hash: key.split(':')[1], size: group[0].size, count: group.length, reclaimableBytes: group[0].size * (group.length - 1), files: group }));
  return { items: groups, summary: { folder: root, filesScanned: data.files.length, candidateFiles: candidates.length, duplicateGroups: groups.length, reclaimableBytes: groups.reduce((sum, group) => sum + group.reclaimableBytes, 0) }, partial: data.partial };
}
async function runTool(context, tool, inputs) {
  const home = app.getPath('home'); const folder = allowedDirectory(inputs.folder || home); const limit = inputs.limit || 50000;
  if (OPERATION_SPECS[tool.engine]) { const output = await privilegedRunner.run(tool.engine, { dryRun: inputs.dryRun }); if (!inputs.dryRun && output.summary.exitCode !== 0) throw new Error(`Privileged operation exited with code ${output.summary.exitCode}.`); return output; }
  if (tool.engine === 'systemHealth') return { summary: await systemHealth(), items: [] };
  if (tool.engine === 'diskOverview') { const items = await diskOverview(); return { items, summary: { drives: items.length } }; }
  if (tool.engine === 'largeFiles') return await scanLargeFiles(folder, context, Number(inputs.thresholdBytes) || (await getSettings()).scanning.largeFileBytes, limit);
  if (tool.engine === 'duplicates') return await scanDuplicates(folder, context, Number(inputs.minimumBytes) || (await getSettings()).scanning.minimumDuplicateBytes, limit);
  if (tool.engine === 'emptyFolders') { const data = await walk(folder, context, { limit }); const empty = []; for (const item of data.folders) { try { if ((await fsp.readdir(item)).length === 0) empty.push({ path: item }); } catch {} } return { items: empty.slice(0, 1000), summary: { folder, foldersScanned: data.folders.length, emptyFolders: empty.length }, partial: data.partial }; }
  if (tool.engine === 'downloadsInventory') { const downloads = app.getPath('downloads'); const data = await walk(downloads, context, { limit }); const groups = {}; for (const file of data.files) { const extension = path.extname(file.path).toLowerCase() || 'none'; groups[extension] = (groups[extension] || 0) + file.size; } return { items: data.files.sort((a,b) => b.size-a.size).slice(0, 200), summary: { folder: downloads, files: data.files.length, totalBytes: data.files.reduce((sum, item) => sum + item.size, 0), extensionGroups: Object.keys(groups).length }, partial: data.partial }; }
  if (tool.engine === 'organizePreview') { const plan = await downloadOrganizationPlan(context, limit, inputs.folder); return { items: plan.plans.slice(0, 1000), summary: { sourceFolder: plan.source, plannedMoves: plan.plans.length, previewOnly: true }, partial: plan.partial }; }
  if (tool.engine === 'organizeApply') { if (inputs.confirm !== true) throw new Error('Explicit confirmation is required before moving files.'); const plan = await downloadOrganizationPlan(context, limit, inputs.folder); const journal = []; for (let index = 0; index < plan.plans.length; index++) { isCancelled(context); const item = plan.plans[index]; if (fs.existsSync(item.destination)) { context.warnings.push(`Skipped name conflict: ${item.source}`); continue; } await fsp.mkdir(path.dirname(item.destination), { recursive: true }); await fsp.rename(item.source, item.destination); journal.push({ source: item.source, destination: item.destination }); context.progress(index + 1, plan.plans.length || 1, `Moved ${index + 1} files`); } const journalId = crypto.randomUUID(); await writeJson(`undo-${journalId}.json`, { journalId, createdAt: new Date().toISOString(), action: 'organize-downloads', moves: journal }); return { items: journal.slice(0, 1000), summary: { journalId, movedFiles: journal.length, skippedFiles: plan.plans.length - journal.length }, partial: plan.partial, undoMetadata: { journalId, action: 'organize-downloads' } }; }
  if (tool.engine === 'organizeUndo') { const journalId = z.string().uuid().parse(inputs.journalId); const journal = await readJson(`undo-${journalId}.json`, null); if (!journal || !Array.isArray(journal.moves)) throw new Error('Undo journal is unavailable.'); const restored = []; for (let index = journal.moves.length - 1; index >= 0; index--) { isCancelled(context); const item = journal.moves[index]; if (fs.existsSync(item.destination) && !fs.existsSync(item.source)) { await fsp.mkdir(path.dirname(item.source), { recursive: true }); await fsp.rename(item.destination, item.source); restored.push(item); } context.progress(journal.moves.length - index, journal.moves.length || 1, `Restored ${journal.moves.length - index} files`); } return { items: restored, summary: { journalId, restoredFiles: restored.length, skippedFiles: journal.moves.length - restored.length } }; }
  if (tool.engine === 'tempPreview') { const temp = process.env.TEMP || os.tmpdir(); const data = await walk(temp, context, { limit: Math.min(limit, 25000) }); const oldest = Date.now() - (await getSettings()).cleanup.minimumFileAgeDays * 86400000; const selected = data.files.filter(file => new Date(file.modifiedAt).getTime() < oldest); return { items: selected.sort((a,b) => b.size-a.size).slice(0, 500), summary: { folder: temp, eligibleFiles: selected.length, eligibleBytes: selected.reduce((sum, item) => sum + item.size, 0), readOnlyPreview: true }, partial: data.partial }; }
  if (tool.engine === 'startupItems') { const script = "$run=@(); $paths=@('HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run','HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'); foreach($p in $paths){if(Test-Path $p){$x=Get-ItemProperty $p; $x.PSObject.Properties | Where-Object {$_.Name -notmatch '^PS'} | ForEach-Object {$run += [pscustomobject]@{name=$_.Name;command=[string]$_.Value;source=$p;enabled=$true}}}}; $run | ConvertTo-Json -Depth 3"; const items = await powershellJson(script); return { items: Array.isArray(items) ? items : [items], summary: { entries: Array.isArray(items) ? items.length : 1 } }; }
  if (tool.engine === 'installedApps') { const script = "$paths=@('HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'); Get-ItemProperty $paths -ErrorAction SilentlyContinue | Where-Object {$_.DisplayName} | Select-Object @{n='name';e={$_.DisplayName}},@{n='version';e={$_.DisplayVersion}},@{n='publisher';e={$_.Publisher}},@{n='installLocation';e={$_.InstallLocation}},@{n='uninstallString';e={$_.UninstallString}} | Sort-Object name -Unique | ConvertTo-Json -Depth 3"; const items = await powershellJson(script); const list = Array.isArray(items) ? items : [items]; return { items: list, summary: { applications: list.filter(Boolean).length } }; }
  if (tool.engine === 'networkDiagnostics') { const interfaces = Object.entries(os.networkInterfaces()).flatMap(([name, records]) => (records || []).filter(record => !record.internal).map(record => ({ name, address: record.address, family: record.family, mac: record.mac, netmask: record.netmask }))); const dns = await powershellJson("Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object InterfaceAlias,ServerAddresses | ConvertTo-Json -Depth 3").catch(() => []); return { items: interfaces, summary: { activeAddresses: interfaces.length, dnsConfigured: Array.isArray(dns) ? dns.length : 1 } }; }
  if (tool.engine === 'hardwareInventory') { const script = "$cpu=Get-CimInstance Win32_Processor | Select-Object Name,NumberOfCores,MaxClockSpeed; $gpu=Get-CimInstance Win32_VideoController | Select-Object Name,AdapterRAM,DriverVersion; $bios=Get-CimInstance Win32_BIOS | Select-Object Manufacturer,SMBIOSBIOSVersion,ReleaseDate; [pscustomobject]@{cpu=$cpu;gpu=$gpu;bios=$bios} | ConvertTo-Json -Depth 5"; const result = await powershellJson(script); return { items: [result], summary: { cpu: result.cpu?.Name || null, gpuCount: Array.isArray(result.gpu) ? result.gpu.length : result.gpu ? 1 : 0 } }; }
  if (tool.engine === 'eventWarnings') { const script = "Get-WinEvent -FilterHashtable @{LogName='System';Level=2,3;StartTime=(Get-Date).AddDays(-7)} -MaxEvents 50 -ErrorAction SilentlyContinue | Select-Object TimeCreated,Id,ProviderName,LevelDisplayName,Message | ConvertTo-Json -Depth 3"; const entries = await powershellJson(script, 45000); const list = Array.isArray(entries) ? entries : [entries]; return { items: list.filter(Boolean), summary: { warningsAndErrors: list.filter(Boolean).length, periodDays: 7 } }; }
  if (tool.engine === 'fileHash') { const file = allowedFile(String(inputs.filePath || '')); const algorithm = inputs.algorithm === 'sha512' ? 'sha512' : 'sha256'; const hash = crypto.createHash(algorithm); await new Promise((resolve, reject) => { const stream = fs.createReadStream(file); stream.on('error', reject); stream.on('data', chunk => hash.update(chunk)); stream.on('end', resolve); }); return { items: [{ path: file, algorithm, digest: hash.digest('hex') }], summary: { algorithm, file } }; }
  if (tool.engine === 'smartScan') { const health = await systemHealth(); context.progress(1, 5, 'Measured system health'); const disk = await diskOverview(); context.progress(2, 5, 'Read storage volumes'); const download = await scanLargeFiles(app.getPath('downloads'), context, 100 * 1024 * 1024, 15000); context.progress(4, 5, 'Scanned large files in Downloads'); const temp = await runTool(context, toolDefinitions.find(t => t.engine === 'tempPreview'), {}); context.progress(5, 5, 'Completed local non-destructive scan'); const findings = []; if (health.systemDriveTotalBytes && health.systemDriveFreeBytes / health.systemDriveTotalBytes < 0.1) findings.push({ severity: 'warning', key: 'diskPressure', value: health.systemDriveFreeBytes }); if (download.summary.matchingFiles) findings.push({ severity: 'info', key: 'largeDownloads', value: download.summary.matchingFiles }); if (temp.summary.eligibleFiles) findings.push({ severity: 'info', key: 'tempReview', value: temp.summary.eligibleFiles }); return { items: findings, summary: { health, volumes: disk.length, largeDownloads: download.summary.matchingFiles || 0, tempEligibleBytes: temp.summary.eligibleBytes || 0 } }; }
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
  await ensureAppStorage(); settingsStore = createSettingsStore({ userDataPath: app.getPath('userData') }); settingsCache = await settingsStore.load(); applyRuntimeSettings(settingsCache); createWindow(); createTray();
  ipcMain.handle('knoux:app-info', () => ({ version: app.getVersion(), startedAt, platform: process.platform, isPackaged: app.isPackaged, electron: process.versions.electron, chromium: process.versions.chrome }));
  ipcMain.handle('knoux:tools-list', () => serializeRegistry(toolDefinitions));
  ipcMain.handle('knoux:settings-get', getSettings);
  ipcMain.handle('knoux:settings-update', (_event, patch) => updateSettings(z.record(z.unknown()).parse(patch)));
  ipcMain.handle('knoux:settings-export', async () => { const result = await dialog.showSaveDialog(mainWindow, { defaultPath: 'knoux-settings.json', filters: [{ name: 'JSON', extensions: ['json'] }] }); if (result.canceled || !result.filePath) return null; await fsp.writeFile(result.filePath, JSON.stringify(await getSettings(), null, 2), 'utf8'); return result.filePath; });
  ipcMain.handle('knoux:settings-import', async () => { const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] }); if (result.canceled || !result.filePaths[0]) return null; const value = await settingsStore.importText(await fsp.readFile(result.filePaths[0], 'utf8')); settingsCache = value; applyRuntimeSettings(value); return value; });
  ipcMain.handle('knoux:settings-reset-section', async (_event, section) => { const value = await settingsStore.resetSection(z.string().min(1).max(32).parse(section)); settingsCache = value; applyRuntimeSettings(value); return value; });
  ipcMain.handle('knoux:settings-reset', async () => { const value = await settingsStore.resetAll(); settingsCache = value; applyRuntimeSettings(value); return value; });
  ipcMain.handle('knoux:history-list', history);
  ipcMain.handle('knoux:folder-choose', async () => { const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] }); return result.canceled ? null : result.filePaths[0]; });
  ipcMain.handle('knoux:file-choose', async () => { const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'] }); return result.canceled ? null : result.filePaths[0]; });
  ipcMain.handle('knoux:tool-run', (_event, request) => execute(request));
  ipcMain.handle('knoux:operation-cancel', (_event, operationId) => { const operation = operations.get(z.string().uuid().parse(operationId)); if (operation) { operation.cancelRequested = true; operation.cancelled = true; } return Boolean(operation); });
  ipcMain.handle('knoux:open-path', async (_event, target) => shell.openPath(allowedDirectory(z.string().min(1).max(32767).parse(target))));
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); else mainWindow.show(); });
