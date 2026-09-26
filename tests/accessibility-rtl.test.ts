import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { nextFocusIndex } from '../src/lib/a11y';
import { direction, dictionaries } from '../src/locales';

const statesCss = readFileSync(new URL('../src/states.css', import.meta.url), 'utf8');
const indexCss = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const shellCss = readFileSync(new URL('../src/shell.css', import.meta.url), 'utf8');
const appShell = readFileSync(new URL('../src/shell/AppShell.tsx', import.meta.url), 'utf8');
const palette = readFileSync(new URL('../src/shell/CommandPalette.tsx', import.meta.url), 'utf8');
const drawer = readFileSync(new URL('../src/shell/OperationDrawer.tsx', import.meta.url), 'utf8');

describe('dialog keyboard contract', () => {
  it('wraps Tab forward from the last focusable back to the first', () => {
    expect(nextFocusIndex(3, 2, false)).toBe(0);
    expect(nextFocusIndex(3, 0, false)).toBe(1);
    expect(nextFocusIndex(3, 1, false)).toBe(2);
  });

  it('wraps Shift+Tab backward from the first focusable to the last', () => {
    expect(nextFocusIndex(3, 0, true)).toBe(2);
    expect(nextFocusIndex(3, 2, true)).toBe(1);
    expect(nextFocusIndex(3, 1, true)).toBe(0);
  });

  it('reports no target when there is nothing focusable', () => {
    expect(nextFocusIndex(0, 0, false)).toBeNull();
    expect(nextFocusIndex(0, 0, true)).toBeNull();
  });

  it('keeps focus on the only focusable element', () => {
    expect(nextFocusIndex(1, 0, false)).toBe(0);
    expect(nextFocusIndex(1, 0, true)).toBe(0);
  });
});

describe('focus visibility', () => {
  it('never removes the focus outline and always offsets it', () => {
    expect(statesCss).toMatch(/:focus-visible\{outline:2px solid var\(--focus-ring\)/);
    expect(statesCss).toMatch(/outline-offset:var\(--focus-ring-offset\)/);
    expect(statesCss).not.toMatch(/outline:\s*(none|0)\b/);
  });

  it('defines a focus ring token for every theme', () => {
    expect(indexCss).toMatch(/--focus-ring:var\(--primary\)/);
    expect(indexCss).toMatch(/--control-disabled-opacity:\.5/);
    expect(indexCss).toMatch(/--target-min:24px/);
  });
});

describe('skip navigation and landmarks', () => {
  it('renders a skip link targeting the main region', () => {
    expect(appShell).toMatch(/SkipLink/);
    expect(appShell).toMatch(/href="#main"/);
    expect(appShell).toMatch(/<main className="main" id="main" tabIndex=\{-1\}/);
  });

  it('positions the skip link off-screen until focused', () => {
    expect(statesCss).toMatch(/\.skip-link\{[^}]*transform:translateY\(-200%\)/);
    expect(statesCss).toMatch(/\.skip-link:focus-visible\{transform:translateY\(0\)\}/);
  });
});

describe('modal dialog semantics', () => {
  it('marks the command palette as a real modal dialog with an accessible name', () => {
    expect(palette).toMatch(/useFocusTrap/);
    expect(palette).toMatch(/\.\.\.dialogProps/);
    expect(palette).toMatch(/id="palette-title"/);
  });

  it('marks the operation drawer as a real modal dialog with an accessible name', () => {
    expect(drawer).toMatch(/useFocusTrap/);
    expect(drawer).toMatch(/id="operation-drawer-title"/);
    // The drawer previously declared aria-modal="false" while blocking the page.
    expect(drawer).not.toMatch(/aria-modal="false"/);
  });

  it('exposes the results listbox with a combobox input wired to it', () => {
    expect(palette).toMatch(/role="combobox"/);
    expect(palette).toMatch(/aria-controls="palette-results"/);
    expect(palette).toMatch(/id="palette-results"/);
    expect(palette).toMatch(/role="listbox"/);
    expect(palette).toMatch(/role="option"/);
  });

  it('never surfaces an internal page id in the command palette', () => {
    // The raw id used to be rendered as the label.
    expect(palette).not.toMatch(/<strong>\{label\}<\/strong>\s*<\/span>\s*<span className="palette-hint">\{t\('palette\.openHint'\)\}/);
    expect(palette).toMatch(/t\(pageDef\.nameKey\)/);
  });
});

describe('live regions and status semantics', () => {
  it('announces operation state politely', () => {
    expect(drawer).toMatch(/LiveRegion/);
    expect(statesCss).toMatch(/\.live-region\{/);
  });

  it('keeps a minimum interactive target', () => {
    expect(statesCss).toMatch(/\.search-trigger\{min-height:36px/);
    expect(statesCss).toMatch(/\.nav-group-head\{min-height:var\(--target-min\)/);
  });
});

describe('status is never colour-only', () => {
  it('pairs every status colour token with a text colour and a surface', () => {
    for (const tone of ['success', 'warning', 'danger']) {
      expect(indexCss).toContain(`--status-${tone}-text`);
      expect(indexCss).toContain(`--status-${tone}-surface`);
      expect(indexCss).toContain(`--status-${tone}-border`);
    }
  });

  it('defines light-theme status text that is readable on light surfaces', () => {
    const light = indexCss.slice(indexCss.indexOf('html[data-theme="light"]'));
    expect(light).toMatch(/--status-success-text:#0f5132/);
    expect(light).toMatch(/--status-warning-text:#6b4708/);
    expect(light).toMatch(/--status-danger-text:#8a1030/);
  });

  it('does not leave a status badge inheriting the dark-theme foreground', () => {
    expect(statesCss).toMatch(/\.pill-ok\{color:var\(--status-success-text\)/);
    expect(statesCss).toMatch(/\.status\.success\{color:var\(--status-success-text\)/);
    expect(statesCss).toMatch(/\.local-badge\{color:var\(--status-success-text\)/);
  });
});

describe('typography and spacing discipline', () => {
  it('raises the smallest type token to a readable size', () => {
    expect(indexCss).toMatch(/--text-xs:10px/);
    expect(indexCss).toMatch(/--text-sm:11px/);
    // Nothing in the state layer may reintroduce a sub-11px font.
    const sub11 = [...statesCss.matchAll(/font-size:(\d+)px/g)].map(m => Number(m[1])).filter(n => n < 11);
    expect(sub11).toEqual([]);
  });

  it('defines a spacing scale and uses it', () => {
    expect(indexCss).toMatch(/--space-1:4px/);
    expect(statesCss).toMatch(/--space-3\)/);
  });

  it('stacks a card title and description instead of colliding them', () => {
    expect(statesCss).toMatch(/\.quick-card span\{display:grid/);
    expect(statesCss).toMatch(/\.quick-card strong,\.quick-card small\{display:block/);
  });
});

describe('RTL and LTR correctness', () => {
  it('maps locale to document direction', () => {
    expect(direction('ar')).toBe('rtl');
    expect(direction('en')).toBe('ltr');
  });

  it('mirrors directional affordances and the selected indicator', () => {
    expect(statesCss).toMatch(/html\[dir="rtl"\] \.collapse-button svg\{transform:scaleX\(-1\)\}/);
    expect(statesCss).toMatch(/html\[dir="rtl"\] \.nav-item\.active\{box-shadow:inset -2px 0 0/);
    expect(statesCss).toMatch(/html\[dir="rtl"\] \.caret/);
  });

  it('keeps technical values logically LTR inside Arabic UI', () => {
    expect(statesCss).toMatch(/code,kbd[^}]*\{direction:ltr;unicode-bidi:isolate\}/);
    expect(statesCss).toMatch(/\[dir="ltr"\] \.data-table td/);
  });

  it('keeps the search trigger and Activity button reachable while scrolling', () => {
    expect(statesCss).toMatch(/\.topbar\{position:sticky/);
  });

  it('uses a single sidebar scroll container instead of a nested scroll trap', () => {
    expect(statesCss).toMatch(/\.sidebar\{overflow:hidden\}/);
    expect(statesCss).toMatch(/\.sidebar-nav\{[^}]*overflow-y:auto/);
  });
});

describe('reduced motion and transparency', () => {
  it('honours reduced motion for the new running indicator', () => {
    expect(statesCss).toMatch(/html\[data-motion="reduced"\] \[data-running="true"\]::after\{animation:none/);
    expect(indexCss).toMatch(/html\[data-motion="reduced"\]/);
  });

  it('honours the transparency setting for the new sticky header', () => {
    expect(statesCss).toMatch(/html\[data-transparency="off"\] \.topbar\{background:var\(--bg\)/);
  });
});

describe('no Vue or Chakra runtime leaked into the application', () => {
  it('adds no Vue/Nuxt/Chakra dependency', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const names = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
    expect(names.filter(name => /^(vue|nuxt)$|^@vue\/|^@nuxt\/|^@chakra-ui\/vue/i.test(name))).toEqual([]);
  });

  it('translates the reference into React and CSS only', () => {
    expect(statesCss).toMatch(/Semantic component states/);
    expect(shellCss).toMatch(/no Tailwind/);
  });
});

describe('localization coverage for the new truth surfaces', () => {
  const required = [
    'operation.verification', 'verification.verified', 'verification.unverified', 'verification.failed',
    'verification.check', 'verification.expected', 'verification.observed', 'verification.result',
    'verification.pass', 'verification.fail', 'operation.finalState', 'operation.logLocations',
    'files.identity', 'files.hardlinked', 'files.cloudPlaceholder', 'files.reparseSkipped',
    'apps.architecture', 'apps.source', 'startup.writeScope', 'startup.managed',
    'services.delayedAuto', 'network.adapter', 'network.gateway', 'network.dhcp', 'network.linkSpeed',
    'network.diagnosticsOnly', 'hardware.temperature', 'hardware.temperatureReason', 'hardware.problemCode',
    'hardware.powerOnline', 'hardware.cycleCount', 'system.boundedQuery', 'system.maxEvents',
    'system.signatureChecked', 'system.signatureBudget', 'system.signature', 'shell.skipToContent',
    'common.partial', 'common.notChecked', 'common.days', 'common.period'
  ];
  it('translates every new key in both locales', () => {
    const missingAr = required.filter(key => !dictionaries.ar[key]);
    const missingEn = required.filter(key => !dictionaries.en[key]);
    expect({ missingAr, missingEn }).toEqual({ missingAr: [], missingEn: [] });
  });

  it('never leaves an English-only value inside the Arabic dictionary', () => {
    for (const key of required) expect(dictionaries.ar[key]).not.toBe(key);
  });
});
