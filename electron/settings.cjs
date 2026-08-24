const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { z } = require('zod');
const defaults = require('../shared/settings-defaults.json');

const clockSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const boundsSchema = z.object({
  x: z.number().int().optional(),
  y: z.number().int().optional(),
  width: z.number().int().min(800).max(10000),
  height: z.number().int().min(600).max(10000)
}).strict();
const settingsSchema = z.object({
  settingsVersion: z.literal(2),
  general: z.object({
    startWithWindows: z.boolean(), startMinimized: z.boolean(), minimizeToTray: z.boolean(),
    closeBehavior: z.enum(['tray', 'exit', 'ask']), rememberWindowBounds: z.boolean(),
    restorePreviousPage: z.boolean(), confirmExitActiveOperations: z.boolean()
  }).strict(),
  appearance: z.object({
    theme: z.enum(['dark', 'light', 'system', 'high-contrast']), accent: z.enum(['violet', 'blue', 'green', 'amber']),
    density: z.enum(['comfortable', 'compact']), fontScale: z.number().min(0.8).max(1.5),
    reduceMotion: z.boolean(), transparency: z.boolean(), animations: z.boolean()
  }).strict(),
  localization: z.object({
    locale: z.enum(['ar', 'en']), region: z.string().regex(/^[A-Z]{2}$/), numberFormat: z.literal('locale'),
    dateFormat: z.enum(['short', 'medium', 'long']), timeFormat: z.enum(['short', 'medium']), byteUnits: z.enum(['binary', 'decimal'])
  }).strict(),
  scanning: z.object({
    includeHidden: z.boolean(), includeSystem: z.boolean(), includeRemovable: z.boolean(), includeNetworkLocations: z.boolean(),
    exclusions: z.array(z.string().min(1).max(32767)).max(500), minimumDuplicateBytes: z.number().int().min(1),
    largeFileBytes: z.number().int().min(1), scanWorkers: z.number().int().min(1).max(32), hashWorkers: z.number().int().min(1).max(16),
    reparsePointPolicy: z.enum(['skip', 'same-volume'])
  }).strict(),
  cleanup: z.object({
    recycleBinByDefault: z.boolean(), confirmDestructive: z.boolean(), minimumFileAgeDays: z.number().int().min(0).max(3650),
    exclusions: z.array(z.string().min(1).max(32767)).max(500), rememberSelection: z.boolean(), safetyBackup: z.boolean()
  }).strict(),
  performance: z.object({
    mode: z.enum(['eco', 'balanced', 'performance']), workerCount: z.number().int().min(1).max(32),
    ioThrottle: z.enum(['low', 'balanced', 'unlimited']), batteryBehavior: z.enum(['pause', 'reduce', 'continue']),
    backgroundBehavior: z.enum(['continue', 'pause-intensive', 'pause-all'])
  }).strict(),
  privacy: z.object({ telemetry: z.literal(false), crashReporting: z.literal(false), diagnostics: z.boolean(), usageAnalytics: z.literal(false), aiPrivacy: z.literal('local-only') }).strict(),
  notifications: z.object({ operationSuccess: z.boolean(), operationFailure: z.boolean(), diskWarning: z.boolean(), scheduledScan: z.boolean(), update: z.boolean(), restartRequired: z.boolean() }).strict(),
  automation: z.object({ enabled: z.boolean(), quietHoursStart: clockSchema, quietHoursEnd: clockSchema, onBatteryPolicy: z.enum(['skip', 'skip-intensive', 'run']), missedSchedulePolicy: z.enum(['skip', 'run-next-start']) }).strict(),
  history: z.object({ retentionDays: z.number().int().min(1).max(3650), automaticCleanup: z.boolean(), exportFormat: z.enum(['json', 'csv']) }).strict(),
  security: z.object({ elevationPolicy: z.enum(['ask-each-time', 'deny']), confirmDestructive: z.boolean(), confirmExternalLinks: z.boolean(), secureCredentials: z.boolean() }).strict(),
  updates: z.object({ automaticChecks: z.boolean(), channel: z.literal('stable') }).strict(),
  advanced: z.object({ diagnosticLogging: z.boolean(), logLevel: z.enum(['error', 'warn', 'info', 'debug']), developerTools: z.boolean() }).strict(),
  window: z.object({ bounds: boundsSchema.nullable(), lastPage: z.string().min(1).max(64) }).strict()
}).strict();

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function merge(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  const result = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    result[key] = value && typeof value === 'object' && !Array.isArray(value) && base?.[key] && typeof base[key] === 'object'
      ? merge(base[key], value)
      : value;
  }
  return result;
}
function migrate(input) {
  if (input?.settingsVersion === 2) return input;
  if (input?.settingsVersion === 1) {
    return merge(clone(defaults), {
      general: {
        startMinimized: Boolean(input.general?.startMinimized),
        closeBehavior: input.general?.closeToTray === false ? 'exit' : 'tray',
        minimizeToTray: input.general?.closeToTray !== false,
        restorePreviousPage: input.general?.rememberLastSection !== false
      },
      appearance: {
        theme: input.appearance?.theme || defaults.appearance.theme,
        density: input.appearance?.density || defaults.appearance.density,
        reduceMotion: Boolean(input.appearance?.reducedMotion),
        fontScale: input.appearance?.fontScale || defaults.appearance.fontScale
      },
      localization: { locale: input.localization?.locale || defaults.localization.locale, byteUnits: input.localization?.byteUnits || defaults.localization.byteUnits },
      scanning: {
        includeHidden: Boolean(input.scan?.includeHidden),
        minimumDuplicateBytes: input.scan?.minimumDuplicateBytes || defaults.scanning.minimumDuplicateBytes,
        largeFileBytes: input.scan?.largeFileBytes || defaults.scanning.largeFileBytes,
        reparsePointPolicy: input.scan?.followReparsePoints ? 'same-volume' : 'skip'
      },
      cleanup: {
        recycleBinByDefault: input.cleanup?.recycleBinByDefault !== false,
        minimumFileAgeDays: input.cleanup?.minimumFileAgeDays ?? defaults.cleanup.minimumFileAgeDays,
        confirmDestructive: input.cleanup?.confirmDestructive !== false
      },
      performance: { mode: input.performance?.mode || defaults.performance.mode },
      privacy: { telemetry: false, crashReporting: false },
      notifications: {
        operationSuccess: input.notifications?.taskCompleted !== false,
        operationFailure: input.notifications?.taskFailed !== false,
        diskWarning: input.notifications?.lowDiskSpace !== false
      }
    });
  }
  return clone(defaults);
}

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function renameWithRetry(temp, target, rename = fsp.rename) {
  let lastError;
  for (let attempt = 0; attempt < 6; attempt++) {
    try { await rename(temp, target); return; }
    catch (error) { lastError = error; if (!['EPERM', 'EACCES', 'EBUSY'].includes(error.code) || attempt === 5) throw error; await wait(40 * (attempt + 1)); }
  }
  throw lastError;
}
function createSettingsStore({ userDataPath, now = () => new Date(), rename = fsp.rename }) {
  const target = path.join(userDataPath, 'settings.json');
  const backup = path.join(userDataPath, 'settings.backup.json');
  let cache = null;
  async function ensure() { await fsp.mkdir(userDataPath, { recursive: true }); }
  async function atomicWrite(value) {
    await ensure();
    if (fs.existsSync(target)) await fsp.copyFile(target, backup);
    const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
    await fsp.writeFile(temp, JSON.stringify(value, null, 2), 'utf8');
    try { await renameWithRetry(temp, target, rename); } finally { await fsp.unlink(temp).catch(() => {}); }
  }
  async function load() {
    await ensure();
    let raw;
    try { raw = JSON.parse(await fsp.readFile(target, 'utf8')); }
    catch (error) {
      if (error.code !== 'ENOENT' && fs.existsSync(target)) await fsp.copyFile(target, `${target}.invalid-${now().toISOString().replace(/[:.]/g, '-')}.bak`);
      cache = clone(defaults);
      await atomicWrite(cache);
      return clone(cache);
    }
    const migrated = migrate(raw);
const parsed = settingsSchema.parse(migrated);
    const disabledUnsupportedUpdateChecks = parsed.updates.automaticChecks;
    parsed.updates.automaticChecks = false;
    cache = parsed;
    if (raw.settingsVersion !== 2 || disabledUnsupportedUpdateChecks) await atomicWrite(parsed);
    return clone(cache);
  }
  async function get() { return clone(cache || await load()); }
  async function replace(value) { const parsed = settingsSchema.parse(value); parsed.updates.automaticChecks = false; await atomicWrite(parsed); cache = parsed; return clone(parsed); }
  async function update(patch) { const next = merge(await get(), patch); return replace(next); }
  async function resetSection(section) {
    if (!Object.prototype.hasOwnProperty.call(defaults, section) || ['settingsVersion'].includes(section)) throw new Error('Unknown settings section.');
    return update({ [section]: clone(defaults[section]) });
  }
  async function resetAll() { return replace(clone(defaults)); }
  async function importText(text) { return replace(JSON.parse(text)); }
  return { target, backup, load, get, update, replace, resetSection, resetAll, importText };
}

module.exports = { settingsSchema, defaults, migrate, merge, createSettingsStore };
