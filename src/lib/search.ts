import type { ToolDefinition } from '@shared/contracts';
import type { Locale } from '../locales';

/** Normalizes text for bilingual (Arabic/English) local search. */
export function normalizeQuery(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ؤو]/g, 'و')
    .trim();
}

export interface SearchRecord {
  id: string;
  kind: 'page' | 'tool';
  page: string;
  fields: string[];
}

export function buildToolRecord(tool: ToolDefinition, translate: (key: string) => string): SearchRecord {
  return {
    id: tool.id,
    kind: 'tool',
    page: tool.category === 'scan' ? 'scan' : tool.category,
    fields: [normalizeQuery(translate(tool.nameKey)), normalizeQuery(translate(tool.descriptionKey)), normalizeQuery(tool.category), normalizeQuery(tool.id)]
  };
}

export function scoreRecord(record: SearchRecord, query: string): number {
  if (!query) return 0;
  let score = 0;
  for (const [index, field] of record.fields.entries()) {
    if (!field) continue;
    const exact = field.indexOf(query);
    if (exact === 0) score += 100 - index * 5;
    else if (exact > 0) score += 60 - index * 5;
    else if (query.split(/\s+/).every(word => field.includes(word))) score += 20 - index * 5;
  }
  return score;
}

export function searchRecords(records: SearchRecord[], query: string, locale: Locale): SearchRecord[] {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];
  return records
    .map(record => ({ record, score: scoreRecord(record, normalized) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id, locale === 'ar' ? 'ar' : 'en'))
    .map(entry => entry.record);
}
