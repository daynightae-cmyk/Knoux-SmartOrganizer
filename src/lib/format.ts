import type { Locale } from '../locales';

const numberFormat = (locale: Locale, options: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', options);

/**
 * Keep a measurement in the order it was written.
 *
 * A byte figure is a number followed by a Latin unit — `2.2 GB` — and inside an
 * Arabic paragraph the bidi algorithm treats that unit as the left-to-right run
 * it is and moves it in front of the number, so the volume rack read `GB 2.2`.
 * The digits stay Latin on purpose: this runtime resolves `ar` to Latin numerals
 * (only `ar-EG` and friends switch), and a tool that changes numeral system
 * between its two languages is harder to scan than one that does not. What has
 * to survive is the order, and the Unicode answer is a left-to-right isolate
 * around the whole figure — the mechanism a `<bdi>` element gives markup, made
 * available to a function that returns text.
 *
 * The isolates are invisible and terminate themselves, so they cannot leak into
 * the next string: every one of these formatters is used only for display.
 */
const LRI = '\u2066';
const PDI = '\u2069';
const measure = (locale: Locale, text: string) => (locale === 'ar' ? `${LRI}${text}${PDI}` : text);

/**
 * Whether an engine left a figure out.
 *
 * `Number(null)` is `0`, so a size the engine never reported would otherwise
 * render as a measured zero — the one answer worse than a blank, because it is a
 * figure nobody took and it sits in the interface looking like every figure that
 * was. An explicit `0` still counts as an answer: a walk that found no empty
 * folder reported a real zero, and the reader is entitled to see it.
 */
const unanswered = (value: unknown) => value === null || value === undefined || value === '';

export function formatBytes(value: unknown, locale: Locale): string {
  if (unanswered(value)) return '—';
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let amount = n;
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index++;
  }
  return measure(locale, `${numberFormat(locale, { maximumFractionDigits: index > 1 ? 1 : 0 }).format(amount)} ${units[index]}`);
}

export function formatPercent(value: unknown, locale: Locale): string {
  if (unanswered(value)) return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return measure(locale, `${numberFormat(locale, { maximumFractionDigits: 1 }).format(n)}%`);
}

export function formatCount(value: unknown, locale: Locale): string {
  if (unanswered(value)) return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return numberFormat(locale).format(n);
}

export function formatDurationSeconds(seconds: unknown, locale: Locale): string {
  if (unanswered(seconds)) return '—';
  const n = Number(seconds);
  if (!Number.isFinite(n) || n < 0) return '—';
  const hours = Math.floor(n / 3600);
  const minutes = Math.floor((n % 3600) / 60);
  return `${numberFormat(locale).format(hours)}:${String(minutes).padStart(2, '0')}`;
}

export function formatDurationMs(ms: unknown, locale: Locale): string {
  if (unanswered(ms)) return '—';
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

/**
 * Translate a key whose suffix arrived from the machine, and keep the machine's
 * word when the copy set has none.
 *
 * Kind names, age buckets and category folders are identifiers the engines
 * write, so the set of suffixes is open: a classifier group added next month
 * has no entry anywhere yet. `translate()` answers a missing key with the key
 * itself, which is right while you are developing and wrong on a screen — a
 * ledger cell that reads `store.kind.Spreadsheets` tells the reader nothing and
 * advertises a bug. The identifier is the better fallback: it is at least the
 * real folder name the engine would use.
 */
export function labeledBy(translate: (key: string) => string, key: string, fallback: string): string {
  const label = translate(key);
  return label === key ? fallback : label;
}
