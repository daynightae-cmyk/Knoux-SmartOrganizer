'use strict';
/**
 * Local operation-log redaction and rotation.
 *
 * The operation log is written to the user's own machine, but it is still the
 * place where a password or a token can end up if a caller passes one. Values
 * are redacted by key name, long strings are truncated, and the log file is
 * rotated so it cannot grow without bound.
 */

const LOG_MAX_BYTES = 1024 * 1024;
const LOG_MAX_ARCHIVES = 3;
const SECRET_KEY_PATTERN = /password|passwd|token|secret|authorization|cookie|credential|apikey|api_key/i;

function redactLogValue(value, key = '', depth = 0) {
  if (depth > 6) return '[truncated]';
  if (SECRET_KEY_PATTERN.test(key)) return '[redacted]';
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === 'string') return value.length > 2000 ? `${value.slice(0, 2000)}…[truncated]` : value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 100).map(entry => redactLogValue(entry, key, depth + 1));
  if (typeof value === 'object') {
    const output = {};
    for (const [entryKey, entryValue] of Object.entries(value).slice(0, 100)) output[entryKey] = redactLogValue(entryValue, entryKey, depth + 1);
    return output;
  }
  return String(value);
}

/** Serializes one log line with secrets removed. */
function formatLogLine(level, event, details = {}) {
  const payload = { timestamp: new Date().toISOString(), level, event };
  for (const [key, value] of Object.entries(details || {})) payload[key] = redactLogValue(value, key);
  return `${JSON.stringify(payload)}\n`;
}

module.exports = { redactLogValue, formatLogLine, LOG_MAX_BYTES, LOG_MAX_ARCHIVES, SECRET_KEY_PATTERN };
