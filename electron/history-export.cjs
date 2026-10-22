'use strict';
/**
 * Operation-history export serialization.
 *
 * This module is deliberately free of Electron and filesystem dependencies so
 * the export format can be proven by unit tests: an export that silently
 * writes `{}` because a Promise was serialized instead of the records is a
 * data-loss defect, not a cosmetic one.
 *
 * CSV follows RFC 4180: every field is quoted, embedded quotes are doubled and
 * embedded newlines/commas survive the round trip. Content is UTF-8, so Arabic
 * and other non-Latin text is written verbatim.
 */

const CSV_FIELDS = ['operationId', 'toolId', 'action', 'success', 'startedAt', 'finishedAt', 'durationMs', 'undoAvailable'];

function csvValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}

function escapeCsvField(value) {
  return `"${csvValue(value).replace(/"/g, '""')}"`;
}

function normaliseRecords(records) {
  return Array.isArray(records) ? records.filter(record => record && typeof record === 'object') : [];
}

/** Serializes history records to the requested export format. */
function serializeHistory(records, format) {
  const list = normaliseRecords(records);
  if (format === 'csv') {
    const header = CSV_FIELDS.join(',');
    if (!list.length) return header;
    const rows = list.map(record => CSV_FIELDS.map(field => escapeCsvField(record[field])).join(','));
    return [header, ...rows].join('\r\n');
  }
  return JSON.stringify(list, null, 2);
}

/** Parses a CSV document produced by serializeHistory (used by the test suite). */
function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let quoted = false;
  const source = String(text || '');
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') { field += '"'; index += 1; continue; }
        quoted = false; continue;
      }
      field += character; continue;
    }
    if (character === '"') { quoted = true; continue; }
    if (character === ',') { row.push(field); field = ''; continue; }
    if (character === '\r') continue;
    if (character === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += character;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).filter(entry => entry.length > 1 || entry[0] !== '').map(entry => {
    const record = {};
    header.forEach((name, index) => { record[name] = entry[index] ?? ''; });
    return record;
  });
}

module.exports = { serializeHistory, parseCsv, CSV_FIELDS };
