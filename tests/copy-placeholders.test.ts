import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { dictionaries } from '../src/locales';

/**
 * `fill` substitutes only the tokens a template actually contains, so a copy key
 * written as a bare noun silently drops the value its caller passed. Four keys
 * did exactly that in the Storage world: the heavy lane note rendered "files
 * examined" with no count in front of it, the duplicate lane note rendered
 * "verified sets · duplicate files" with both counts gone, and every volume bay
 * rendered "Pressure basis" with no basis after it. Nothing throws, nothing
 * logs — the sentence is just quietly missing its figure.
 *
 * This checks each `fill(t('key'), { … })` call against the dictionary the app
 * really renders from, so the worlds still to be built inherit the guard rather
 * than the bug.
 */

const SOURCE_ROOT = path.resolve(process.cwd(), 'src');

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry)) found.push(full);
  }
  return found;
}

const files = sourceFiles(SOURCE_ROOT).filter(file => !/locales\.ts$/.test(file));

/** Read the object literal that starts just after `open`, honouring strings. */
function balanced(src: string, open: number): [string, number] {
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < src.length; i += 1) {
    const c = src[i];
    if (quote) {
      if (c === '\\') i += 1;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '{' || c === '(' || c === '[') depth += 1;
    else if (c === '}' || c === ')' || c === ']') {
      depth -= 1;
      if (depth === 0) return [src.slice(open + 1, i), i];
    }
  }
  return ['', open];
}

/**
 * The value names a caller passes to `fill`, with nested call arguments removed.
 * `{ time: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(x) }`
 * supplies one value, `time` — `dateStyle` belongs to the formatter, not the
 * template, and reading it as a token would invent a defect that is not there.
 */
function valueNames(objectBody: string): string[] {
  let flat = objectBody;
  for (let pass = 0; pass < 6; pass += 1) {
    const next = flat.replace(/\(([^()]*)\)/g, '').replace(/\[[^[\]]*\]/g, '').replace(/\{([^{}]*)\}/g, '');
    if (next === flat) break;
    flat = next;
  }
  return [...flat.matchAll(/(?:^|[,{]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:(?!:)/g)].map(match => match[1]);
}

interface FillCall {
  file: string;
  key: string;
  values: string[];
}

const fillCalls: FillCall[] = [];
const literalKeys: Array<{ file: string; key: string }> = [];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const rel = path.relative(SOURCE_ROOT, file).replace(/\\/g, '/');

  for (const match of src.matchAll(/\bfill\(\s*t\(\s*'([a-zA-Z0-9_.]+)'\s*\)\s*,\s*\{/g)) {
    const open = (match.index ?? 0) + match[0].length - 1;
    const [body] = balanced(src, open);
    fillCalls.push({ file: rel, key: match[1], values: valueNames(body) });
  }
  for (const match of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'\s*\)/g)) {
    literalKeys.push({ file: rel, key: match[1] });
  }
}

describe('copy placeholders', () => {
  it('passes every value the template can show', () => {
    const dropped = fillCalls.flatMap(call => {
      const template = { ar: dictionaries.ar[call.key] ?? '', en: dictionaries.en[call.key] ?? '' };
      return call.values
        .filter(value => !template.ar.includes(`{${value}}`) || !template.en.includes(`{${value}}`))
        .map(value => `${call.file}  ${call.key}  drops {${value}}  en="${template.en}"  ar="${template.ar}"`);
    });
    expect(dropped).toEqual([]);
  });

  it('names a key that exists in both languages', () => {
    const missing = literalKeys
      .filter(entry => typeof dictionaries.ar[entry.key] !== 'string' || typeof dictionaries.en[entry.key] !== 'string')
      .map(entry => `${entry.file}  ${entry.key}`);
    expect([...new Set(missing)]).toEqual([]);
  });

  /**
   * The file classifier's group names are identifiers the engine writes, and
   * three worlds print them: a ladder rung, a ledger cell and a plan lane. Each
   * supplies its own prefix (`store.kind.`, `file.type.`) and falls back to the
   * raw identifier when a key is absent, so a group added to the classifier
   * cannot throw — it silently ships English into the Arabic interface. This
   * reads the classifier itself so the copy sets have to follow it.
   */
  it('carries a word for every kind the classifier can return', () => {
    const src = readFileSync(path.resolve(process.cwd(), 'electron/advanced-local-services.cjs'), 'utf8');
    const start = src.indexOf('TYPE_GROUPS = Object.freeze({');
    expect(start).toBeGreaterThan(-1);
    const block = src.slice(start, src.indexOf('});', start));
    const groups = [...block.matchAll(/^\s{2}([A-Za-z][A-Za-z ]*):\s*new Set\(/gm)].map(match => match[1]);
    // classifyFileType() returns these two itself rather than reading them from a set.
    const kinds = [...groups, 'Other', 'No extension'];
    expect(kinds.length).toBeGreaterThan(8);

    const prefixes = ['store.kind.', 'file.type.'];
    const gaps = kinds.flatMap(kind => prefixes
      .filter(prefix => typeof dictionaries.ar[`${prefix}${kind}`] !== 'string' || typeof dictionaries.en[`${prefix}${kind}`] !== 'string')
      .map(prefix => `${prefix}${kind}`));
    expect(gaps).toEqual([]);
  });

  /**
   * Every measured figure in the Arabic interface comes out of
   * `Intl.NumberFormat('ar')`, which resolves to Latin numerals in this runtime.
   * A static string that spells its number with Arabic-Indic digits therefore
   * lands beside a Latin one in the same sentence — "٩٠ يومًا" next to
   * "18 files" on one ladder rung — and the page reads as two products.
   */
  it('writes static numerals the way its formatters do', () => {
    const arabicIndic = /[\u0660-\u0669\u06F0-\u06F9]/;
    const offenders = Object.entries(dictionaries.ar)
      .filter(([, value]) => arabicIndic.test(String(value)))
      .map(([key]) => key);
    expect(offenders).toEqual([]);
  });
});
