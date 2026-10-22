const crypto = require('node:crypto');
const { execFile: defaultExecFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(defaultExecFile);
const CURRENT_USER_RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const ALLOWED_VALUE_TYPES = new Set(['REG_SZ', 'REG_EXPAND_SZ']);
// A local registry read answers in milliseconds. The old 10-second budget was
// tight enough that a loaded machine could report the Run key as unreadable.
const REGISTRY_TIMEOUT_MS = 30000;

function validValueName(value) {
  return typeof value === 'string' && value.length >= 1 && value.length <= 255 && !value.includes('\\') && !value.includes('\0');
}

/**
 * Parses one value out of `reg query` output.
 *
 * The value type is reported as Windows reported it. A value that exists with
 * a type KNOuX cannot restore (for example REG_DWORD) must never be reported
 * as "not found": that turned a failed removal into a verified removal.
 */
function parseRegistryValue(stdout, valueName) {
  const lines = String(stdout || '').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(.+?)\s+(REG_[A-Z_]+)\s+(.*)$/);
    if (!match) continue;
    if (match[1].trim() !== valueName) continue;
    return { valueName, valueType: match[2], valueData: match[3] };
  }
  return null;
}

function isRestorableValueType(valueType) {
  return ALLOWED_VALUE_TYPES.has(valueType);
}

function createStartupManager({ execFile = execFileAsync, readJournal, writeJournal } = {}) {
  if (typeof readJournal !== 'function' || typeof writeJournal !== 'function') throw new Error('Startup manager requires journal storage functions.');

  /**
   * Reads the whole current-user Run key.
   *
   * Querying the key (instead of a single `/v` value) is what makes presence
   * unambiguous: `reg query /v` exits with code 1 both when the value is
   * absent and when the key cannot be read, so a failed read used to be
   * reported as a proven removal.
   */
  async function readRunKey() {
    try {
      const { stdout } = await execFile('reg.exe', ['query', CURRENT_USER_RUN_KEY], { windowsHide: true, timeout: REGISTRY_TIMEOUT_MS, maxBuffer: 1024 * 1024 });
      return String(stdout || '');
    } catch (error) {
      // The exit code is reported, never the command line or the registry dump.
      const code = Number(error?.code);
      const reason = error?.code === 'ENOENT' ? 'reg-exe-not-found' : (Number.isFinite(code) && code > 0 ? `registry-query-exit-${code}` : 'registry-query-failed');
      throw new Error(`Unable to inspect the selected startup entry (${reason}).`);
    }
  }

  async function query(valueName) {
    if (!validValueName(valueName)) throw new Error('Startup entry name is invalid.');
    const stdout = await readRunKey();
    return parseRegistryValue(stdout, valueName);
  }

  async function disable({ valueName, dryRun = false }) {
    const entry = await query(valueName);
    if (!entry) throw new Error('Startup entry was not found in the current user profile.');
    if (!isRestorableValueType(entry.valueType)) throw new Error(`Startup entry "${valueName}" has an unsupported registry type (${entry.valueType}) and cannot be restored safely, so it was left untouched.`);
    const journalId = crypto.randomUUID();
    if (!dryRun) {
      // The journal is written before the delete, so a failed delete still
      // leaves a restore record and the value is never lost.
      await writeJournal(`undo-startup-${journalId}.json`, { journalId, action: 'startup-disable', source: CURRENT_USER_RUN_KEY, ...entry, createdAt: new Date().toISOString() });
      await execFile('reg.exe', ['delete', CURRENT_USER_RUN_KEY, '/v', valueName, '/f'], { windowsHide: true, timeout: REGISTRY_TIMEOUT_MS, maxBuffer: 1024 * 1024 });
    }
    return { items: [{ valueName, state: dryRun ? 'would-disable' : 'disabled' }], summary: { valueName, changed: !dryRun, dryRun: Boolean(dryRun), journalId: dryRun ? null : journalId, recoverable: true, previousValueType: entry.valueType }, undoMetadata: dryRun ? null : { journalId, action: 'startup-disable' } };
  }

  async function restore({ journalId, dryRun = false }) {
    const journal = await readJournal(`undo-startup-${journalId}.json`);
    if (!journal || journal.action !== 'startup-disable' || journal.source !== CURRENT_USER_RUN_KEY || !validValueName(journal.valueName) || !isRestorableValueType(journal.valueType) || typeof journal.valueData !== 'string') throw new Error('Startup undo journal is unavailable or invalid.');
    const existing = await query(journal.valueName);
    // Never replace an entry that another process recreated in the meantime.
    if (existing) throw new Error('Startup entry already exists; restore was not applied.');
    if (!dryRun) await execFile('reg.exe', ['add', CURRENT_USER_RUN_KEY, '/v', journal.valueName, '/t', journal.valueType, '/d', journal.valueData, '/f'], { windowsHide: true, timeout: REGISTRY_TIMEOUT_MS, maxBuffer: 1024 * 1024 });
    return { items: [{ valueName: journal.valueName, state: dryRun ? 'would-restore' : 'restored' }], summary: { valueName: journal.valueName, changed: !dryRun, dryRun: Boolean(dryRun), journalId, restoredValueType: journal.valueType, recoverable: true }, undoMetadata: null };
  }

  return Object.freeze({ disable, restore, query, parseRegistryValue, readRunKey, currentUserRunKey: CURRENT_USER_RUN_KEY });
}

module.exports = { createStartupManager, CURRENT_USER_RUN_KEY, parseRegistryValue, isRestorableValueType, ALLOWED_VALUE_TYPES };
