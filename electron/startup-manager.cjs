const crypto = require('node:crypto');
const { execFile: defaultExecFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(defaultExecFile);
const CURRENT_USER_RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const ALLOWED_VALUE_TYPES = new Set(['REG_SZ', 'REG_EXPAND_SZ']);

function validValueName(value) {
  return typeof value === 'string' && value.length >= 1 && value.length <= 255 && !value.includes('\\') && !value.includes('\0');
}

function parseRegistryValue(stdout, valueName) {
  const line = String(stdout || '').split(/\r?\n/).find(candidate => candidate.trim().startsWith(valueName));
  if (!line) return null;
  const match = line.trim().match(/^(.+?)\s+(REG_(?:SZ|EXPAND_SZ))\s+(.*)$/);
  if (!match || match[1].trim() !== valueName || !ALLOWED_VALUE_TYPES.has(match[2])) return null;
  return { valueName, valueType: match[2], valueData: match[3] };
}

function createStartupManager({ execFile = execFileAsync, readJournal, writeJournal } = {}) {
  if (typeof readJournal !== 'function' || typeof writeJournal !== 'function') throw new Error('Startup manager requires journal storage functions.');

  async function query(valueName) {
    if (!validValueName(valueName)) throw new Error('Startup entry name is invalid.');
    try {
      const { stdout } = await execFile('reg.exe', ['query', CURRENT_USER_RUN_KEY, '/v', valueName], { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024 });
      return parseRegistryValue(stdout, valueName);
    } catch (error) {
      if (Number(error?.code) === 1) return null;
      throw new Error('Unable to inspect the selected startup entry.');
    }
  }

  async function disable({ valueName, dryRun = false }) {
    const entry = await query(valueName);
    if (!entry) throw new Error('Startup entry was not found in the current user profile.');
    const journalId = crypto.randomUUID();
    if (!dryRun) {
      await writeJournal(`undo-startup-${journalId}.json`, { journalId, action: 'startup-disable', source: CURRENT_USER_RUN_KEY, ...entry, createdAt: new Date().toISOString() });
      await execFile('reg.exe', ['delete', CURRENT_USER_RUN_KEY, '/v', valueName, '/f'], { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024 });
    }
    return { items: [{ valueName, state: dryRun ? 'would-disable' : 'disabled' }], summary: { valueName, changed: !dryRun, dryRun: Boolean(dryRun), journalId: dryRun ? null : journalId, recoverable: true }, undoMetadata: dryRun ? null : { journalId, action: 'startup-disable' } };
  }

  async function restore({ journalId, dryRun = false }) {
    const journal = await readJournal(`undo-startup-${journalId}.json`);
    if (!journal || journal.action !== 'startup-disable' || journal.source !== CURRENT_USER_RUN_KEY || !validValueName(journal.valueName) || !ALLOWED_VALUE_TYPES.has(journal.valueType) || typeof journal.valueData !== 'string') throw new Error('Startup undo journal is unavailable or invalid.');
    const existing = await query(journal.valueName);
    if (existing) throw new Error('Startup entry already exists; restore was not applied.');
    if (!dryRun) await execFile('reg.exe', ['add', CURRENT_USER_RUN_KEY, '/v', journal.valueName, '/t', journal.valueType, '/d', journal.valueData, '/f'], { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024 });
    return { items: [{ valueName: journal.valueName, state: dryRun ? 'would-restore' : 'restored' }], summary: { valueName: journal.valueName, changed: !dryRun, dryRun: Boolean(dryRun), journalId, recoverable: true }, undoMetadata: null };
  }

  return Object.freeze({ disable, restore, query, parseRegistryValue, currentUserRunKey: CURRENT_USER_RUN_KEY });
}

module.exports = { createStartupManager, CURRENT_USER_RUN_KEY, parseRegistryValue };
