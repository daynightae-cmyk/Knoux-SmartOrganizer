import type { Locale } from '../locales';

const numberFormat = (locale: Locale, options: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', options);

export function formatBytes(value: unknown, locale: Locale): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let amount = n;
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index++;
  }
  return `${numberFormat(locale, { maximumFractionDigits: index > 1 ? 1 : 0 }).format(amount)} ${units[index]}`;
}

export function formatPercent(value: unknown, locale: Locale): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${numberFormat(locale, { maximumFractionDigits: 1 }).format(n)}%`;
}

export function formatCount(value: unknown, locale: Locale): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return numberFormat(locale).format(n);
}

export function formatDurationSeconds(seconds: unknown, locale: Locale): string {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n < 0) return '—';
  const hours = Math.floor(n / 3600);
  const minutes = Math.floor((n % 3600) / 60);
  return `${numberFormat(locale).format(hours)}:${String(minutes).padStart(2, '0')}`;
}

export function formatDurationMs(ms: unknown, locale: Locale): string {
  const n = Number(ms);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1000) return locale === 'ar' ? `${numberFormat(locale).format(Math.round(n))} م.ث` : `${Math.round(n)} ms`;
  const seconds = n / 1000;
  if (seconds < 60) return locale === 'ar' ? `${numberFormat(locale, { maximumFractionDigits: 1 }).format(seconds)} ث` : `${numberFormat(locale, { maximumFractionDigits: 1 }).format(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return locale === 'ar'
    ? `${numberFormat(locale).format(minutes)} د ${numberFormat(locale).format(rest)} ث`
    : `${minutes}m ${rest}s`;
}

export function formatDateTime(iso: unknown, locale: Locale, dateStyle: 'short' | 'medium' | 'long' = 'medium', timeStyle: 'short' | 'medium' = 'short'): string {
  const date = new Date(String(iso ?? ''));
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', { dateStyle, timeStyle }).format(date);
}

export function formatTimeOfDay(iso: unknown, locale: Locale): string {
  const date = new Date(String(iso ?? ''));
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', { timeStyle: 'short' }).format(date);
}

export function currentOf(current: unknown, total: unknown, locale: Locale): string {
  return numberFormat(locale).format(Number(current) || 0) + (locale === 'ar' ? ' من ' : ' / ') + numberFormat(locale).format(Number(total) || 0);
}

export function shortHash(value: unknown): string {
  const text = String(value ?? '');
  return text.length > 14 ? `${text.slice(0, 12)}…` : text;
}

export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
