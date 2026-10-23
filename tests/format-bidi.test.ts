import { describe, expect, it } from 'vitest';
import { formatBytes, formatCount, formatPercent } from '../src/lib/format';

/**
 * A measurement has to survive the bidi algorithm.
 *
 * `2.2 GB` inside an Arabic paragraph is a Latin unit sitting next to a number,
 * and Unicode puts the LTR run first: the volume rack rendered `GB 2.2` and every
 * byte figure in the Arabic interface read unit-then-amount. The formatter cannot
 * see the paragraph it will be dropped into, so it wraps the figure in a
 * left-to-right isolate instead — the text equivalent of a `<bdi>`.
 *
 * These tests pin both halves of the rule: the Arabic figure carries the isolates
 * and keeps `2.2 GB` in that order, and the English figure carries no invisible
 * characters at all, because a control code in an LTR string is noise that would
 * travel into anything that copies the text.
 */

// Written as escapes rather than as the characters themselves: an invisible
// control code in a source file is unreadable, and this test is the place where
// its identity has to be unmistakable.
const LRI = '\u2066';
const PDI = '\u2069';
const ISOLATES = /[\u2066\u2069]/;

describe('formatBytes', () => {
  it('isolates an Arabic figure without disturbing its order', () => {
    const arabic = formatBytes(2.2 * 1024 ** 3, 'ar');
    expect(arabic.startsWith(LRI)).toBe(true);
    expect(arabic.endsWith(PDI)).toBe(true);
    expect(arabic.slice(1, -1)).toBe('2.2 GB');
  });

  it('leaves an English figure free of control characters', () => {
    const english = formatBytes(2.2 * 1024 ** 3, 'en');
    expect(english).toBe('2.2 GB');
    expect(ISOLATES.test(english)).toBe(false);
  });

  // The dash is the answer to "the engine never named a size", and it is a
  // neutral character: isolating it would be noise in every string that embeds it.
  // `Number(null)` is `0`, so without this guard an unreported size would render
  // as a measured zero — a figure nobody took, shown among the figures that were.
  it('names a missing figure instead of inventing a zero', () => {
    expect(formatBytes(null, 'ar')).toBe('—');
    expect(formatBytes(undefined, 'ar')).toBe('—');
    expect(formatPercent(null, 'en')).toBe('—');
    expect(formatCount(null, 'en')).toBe('—');
  });

  // A zero the engine did report stays a zero: the guard answers silence, not
  // emptiness. A walk that found no empty folder measured a real nothing, and the
  // reader is entitled to see the difference between the two.
  it('still prints the zero an engine actually reported', () => {
    expect(formatBytes(0, 'ar')).toBe(`${LRI}0 B${PDI}`);
    expect(formatCount(0, 'ar')).toBe('0');
  });
});

describe('formatPercent', () => {
  it('keeps the percent sign on the side of its number', () => {
    expect(formatPercent(98.34, 'ar').slice(1, -1)).toBe('98.3%');
    expect(formatPercent(98.34, 'en')).toBe('98.3%');
  });
});

// A bare count has no Latin unit to trade places with, so it must stay plain: it
// is written into Arabic sentences ("5 ملفات"), and isolating the number would pin
// it to the wrong edge of the phrase.
describe('formatCount', () => {
  it('leaves a lone number to the paragraph around it', () => {
    expect(formatCount(5, 'ar')).toBe('5');
    expect(ISOLATES.test(formatCount(5, 'ar'))).toBe(false);
  });
});
