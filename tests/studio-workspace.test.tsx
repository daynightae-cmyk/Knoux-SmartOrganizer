import { DOMImplementation } from '@xmldom/xmldom';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudioPage from '../src/studio/StudioPage';
import { studioCopy } from '../src/studio/copy';
import type {
  DestinationListing, FolderValidationResult, InventoryQuery, JournalOperation,
  OrganizationMode, OrganizationPlan, ScanSummary, Source, StudioBridge, UndoPreview
} from '../src/studio/types';

vi.mock('../src/state/store', () => ({ useStore: () => ({ locale: 'en' }) }));

/* Renderer regressions with MOCKED IPC, not Electron/browser acceptance tests.
 * No DOM test environment or setup file is configured in this package. Reuse the
 * installed XML DOM with a small HTML host adapter and React's event simulator.
 * Real React state/effects/context, StudioPage and panels are exercised; native
 * pickers, filesystem safety, layout, focus and real Electron UI are NOT verified.
 */
function descendants(parent: Node): HTMLElement[] {
  const result: HTMLElement[] = [];
  for (let child = parent.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 1) result.push(child as HTMLElement);
    result.push(...descendants(child));
  }
  return result;
}

function selectNodes(parent: Node, selector: string) {
  return descendants(parent).filter(node => selector.split(',').some(part => {
    const tag = part.trim().match(/^[\w-]+/)?.[0];
    const attributes = [...part.matchAll(/\[([\w-]+)="([^"]*)"\]/g)];
    return (!tag || node.tagName === tag)
      && attributes.every(([, name, value]) => node.getAttribute(name) === value)
      && (!part.includes(':not(:disabled)') || !node.hasAttribute('disabled'));
  }));
}

function makeDocument() {
  const document = new DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', 'html', null) as unknown as Document;
  const createElement = document.createElement.bind(document);
  const createElementNS = document.createElementNS.bind(document);
  const decorate = (element: Element): HTMLElement => {
    const node = element as HTMLElement;
    let value = '';
    Object.assign(node, {
      style: { setProperty() {}, removeProperty() {} },
      addEventListener() {}, removeEventListener() {}, scrollIntoView() {},
      focus() { Object.defineProperty(document, 'activeElement', { configurable: true, value: node }); },
      querySelectorAll(selector: string) { return selectNodes(node, selector); },
      querySelector(selector: string) { return node.querySelectorAll(selector)[0] ?? null; }
    });
    Object.defineProperties(node, {
      disabled: { configurable: true, get: () => node.hasAttribute('disabled') },
      options: { configurable: true, get: () => descendants(node).filter(child => child.tagName === 'option') },
      value: {
        configurable: true,
        get: () => node.tagName === 'option' ? node.getAttribute('value') ?? node.textContent ?? '' : value,
        set: (next: string) => { value = String(next); }
      }
    });
    return node;
  };
  document.createElement = ((tag: string) => decorate(createElement(tag))) as Document['createElement'];
  document.createElementNS = ((namespace: string | null, tag: string) => decorate(createElementNS(namespace, tag))) as Document['createElementNS'];
  Object.assign(document, {
    addEventListener() {}, removeEventListener() {},
    querySelectorAll(selector: string) { return selectNodes(document, selector); }
  });
  const body = document.createElement('body');
  document.documentElement.appendChild(body);
  Object.defineProperties(document, {
    body: { value: body }, activeElement: { configurable: true, value: body }
  });
  return document;
}

const t = studioCopy.en;
const categoryCards = [
  ['image', 'Images'], ['video', 'Videos'], ['audio', 'Audio'], ['document', 'Documents'],
  ['spreadsheet', 'Spreadsheets'], ['presentation', 'Presentations'], ['pdf', 'PDF files'],
  ['archive', 'Archives'], ['installer', 'Installers'], ['code', 'Code'], ['markup', 'Web files'],
  ['config', 'Config'], ['font', 'Fonts'], ['design', 'Design'], ['model', '3D models'],
  ['ebook', 'E-books'], ['discImage', 'Disc images'], ['other', 'Other']
] as const;
const now = new Date('2026-10-23T12:00:00.000Z');
const destinationId = 'mock-destination';
const destinationRoot = 'D:\\Organized';

function inventory(sourceId: string): ScanSummary {
  const categories = categoryCards.slice(0, -1).map(([key], i) => ({ key, count: key === 'font' ? 0 : i + 1, bytes: key === 'font' ? 0 : (i + 1) * 1024 }));
  return {
    inventoryId: `inventory-${sourceId}`, sourceId, operationId: `scan-${sourceId}`,
    totalFiles: categories.reduce((sum, category) => sum + category.count, 0),
    totalBytes: categories.reduce((sum, category) => sum + category.bytes, 0),
    categories, extensions: [{ ext: '.jpg', count: 1, bytes: 1024 }, { ext: '.pdf', count: 7, bytes: 7168 }],
    counts: { folders: 1, links: 0, errors: 0, depthSkipped: 0, excluded: 0 },
    partial: false, truncated: false, cancelled: false, metadataOnly: true,
    cloudAttributeInspection: true, oldestMtimeMs: now.getTime(), newestMtimeMs: now.getTime(),
    limits: { maxFiles: 10000, maxDepth: 20 }, warnings: []
  };
}

const sources: Source[] = [
  { id: 'alpha', name: 'Alpha source', folder: 'C:\\Alpha', inventory: inventory('alpha') },
  { id: 'beta', name: 'Beta source', folder: 'C:\\Beta', inventory: inventory('beta') }
];

function listing(relativePath = ''): DestinationListing {
  return {
    destinationId, name: 'Organized', root: destinationRoot, relativePath,
    path: relativePath ? `${destinationRoot}\\${relativePath.replaceAll('/', '\\')}` : destinationRoot,
    parentRelative: relativePath ? '' : null, folders: [], truncated: false
  };
}

function plan(operation: OrganizationMode = 'copy', patch: Partial<OrganizationPlan> = {}): OrganizationPlan {
  return {
    planId: 'mock-plan-exact', planHash: 'a'.repeat(64), createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 1800000).toISOString(), expiresAtMs: now.getTime() + 1800000,
    operation, structure: 'categorized', collisionPolicy: 'review', executable: true,
    destinationSummary: operation === 'virtual' ? 'In-app collection only' : 'D:\\Organized\\Reviewed snapshot',
    destinationRoots: operation === 'virtual' ? [] : [{ id: destinationId, name: 'Organized', root: destinationRoot, base: destinationRoot, baseRelative: '' }],
    folderSteps: [], categories: [{ category: 'image', files: 1, bytes: 1024 }],
    files: [{ index: 0, inventoryId: 'inventory-alpha', fileId: 7, name: 'alpha.jpg',
      sourceRelative: 'alpha.jpg', sourceRoot: 'C:\\Alpha', category: 'image', size: 1024,
      ext: '.jpg', modifiedAt: now.toISOString(), targetName: 'alpha.jpg',
      targetPath: operation === 'virtual' ? null : `${destinationRoot}\\Images\\alpha.jpg`,
      targetRelative: operation === 'virtual' ? null : 'Images/alpha.jpg', status: 'ready' }],
    skipped: [], collisions: [], warnings: [], sourceRoots: ['C:\\Alpha'],
    totals: { files: 1, bytes: 1024, categories: 1, folderSteps: 0, skipped: 0, collisions: 0 },
    ...patch
  };
}

const journal: JournalOperation = {
  operationId: 'mock-journal', mode: 'move', status: 'completed',
  createdAt: now.toISOString(), updatedAt: now.toISOString(), planId: 'mock-plan-exact',
  destinationSummary: destinationRoot, sourceRoots: ['C:\\Alpha'], totalFiles: 1, totalBytes: 1024,
  completedFiles: 1, failedFiles: 0, skippedFiles: 0, cancelledFiles: 0,
  undoAvailable: true, undoCompletedFiles: 0, interruptedAt: null, warnings: [], errors: [], entries: []
};

function undoPreview(patch: Partial<UndoPreview> = {}): UndoPreview {
  return {
    previewId: 'mock-preview-original', previewHash: 'b'.repeat(64), expiresAtMs: now.getTime() + 1800000,
    requiredRoots: [], journalId: journal.operationId, mode: 'move', status: 'completed',
    createdAt: now.toISOString(), total: 1, eligible: 1, conflicts: 0, bytes: 1024,
    entries: [{ index: 0, name: 'alpha.jpg', category: 'image', sourceRelative: 'alpha.jpg',
      size: 1024, state: 'completed', undoState: null, eligible: true, conflict: false,
      reason: null, restoreName: 'alpha.jpg' }], ...patch
  };
}

function mockIpc() {
  const unexpected = async () => { throw new Error('Unexpected mocked IPC call'); };
  return {
    listSources: vi.fn(async () => sources),
    listDestinations: vi.fn(async () => [{ id: destinationId, name: 'Organized', path: destinationRoot }]),
    listHistory: vi.fn(async (): Promise<JournalOperation[]> => []),
    onEvent: vi.fn(() => vi.fn()),
    // Intentionally a canned page: these tests assert renderer requests, not native filtering.
    query: vi.fn(async (request: InventoryQuery) => ({
      total: 120, bytes: 122880, offset: request.offset ?? 0, limit: request.limit ?? 48,
      rows: [{ id: 7, name: request.inventoryId === 'inventory-beta' ? 'beta.jpg' : 'alpha.jpg',
        relative: 'photos/photo.jpg', category: 'image' as const, size: 1024, ext: '.jpg',
        modifiedAt: now.toISOString(), readonly: false, hidden: false, hasThumbnail: false }]
    })),
    listDestination: vi.fn(async (request: Parameters<StudioBridge['listDestination']>[0]) => listing(request.relativePath)),
    buildPlan: vi.fn(async (request: Parameters<StudioBridge['buildPlan']>[0]) => plan(request.operation)),
    executePlan: vi.fn(async (request: Parameters<StudioBridge['executePlan']>[0]) => ({
      success: true, mode: request.operation, journalId: journal.operationId,
      summary: { id: journal.operationId, mode: request.operation, status: 'completed',
        totalFiles: 1, totalBytes: 1024, completedFiles: 1, failedFiles: 0,
        skippedFiles: 0, cancelledFiles: 0, undoAvailable: request.operation === 'move' }
    })),
    previewUndo: vi.fn(async () => undoPreview()),
    applyUndo: vi.fn(async () => ({
      success: true, partial: false, restored: 1, skipped: 0, failed: 0, journalId: journal.operationId
    })),
    pickSource: vi.fn<StudioBridge['pickSource']>(unexpected),
    pickDestination: vi.fn<StudioBridge['pickDestination']>(unexpected),
    removeSource: vi.fn<StudioBridge['removeSource']>(unexpected),
    scan: vi.fn<StudioBridge['scan']>(unexpected), cancel: vi.fn<StudioBridge['cancel']>(unexpected),
    reveal: vi.fn<StudioBridge['reveal']>(unexpected),
    validateFolder: vi.fn<StudioBridge['validateFolder']>(unexpected),
    createFolder: vi.fn<StudioBridge['createFolder']>(unexpected),
    cancelExecution: vi.fn<StudioBridge['cancelExecution']>(unexpected),
    thumbnail: vi.fn<StudioBridge['thumbnail']>(unexpected)
  } satisfies StudioBridge;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

let document: Document;
let root: Root;
let ipc: ReturnType<typeof mockIpc>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  document = makeDocument();
  ipc = mockIpc();
  const window = {
    document, knouxStudio: ipc, HTMLIFrameElement: class {},
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval,
    requestAnimationFrame: (callback: () => void) => globalThis.setTimeout(callback, 0)
  };
  Object.defineProperty(document, 'defaultView', { value: window });
  vi.stubGlobal('window', window);
  vi.stubGlobal('document', document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  container.id = 'root';
  container.setAttribute('id', 'root');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function mount() { await act(async () => root.render(<StudioPage />)); }
async function tick(milliseconds = 180) { await act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); }); }
function elements(tag: string, scope: Node = document.body) { return descendants(scope).filter(node => node.tagName === tag); }
function one(nodes: HTMLElement[], description: string) {
  expect(nodes, description).toHaveLength(1);
  return nodes[0];
}
function button(name: string, scope: Node = document.body) {
  return one(elements('button', scope).filter(node => (node.getAttribute('aria-label') || node.textContent) === name), `button: ${name}`) as HTMLButtonElement;
}
function field(label: string, scope: Node = document.body) {
  const wrapper = one(elements('label', scope).filter(node => node.firstChild?.textContent === label), `field: ${label}`);
  return one(descendants(wrapper).filter(node => ['input', 'select'].includes(node.tagName)), `control: ${label}`) as HTMLInputElement;
}
async function click(node: HTMLElement) { await act(async () => { Simulate.click(node); }); }
async function change(node: HTMLElement, value: string | boolean) {
  await act(async () => { Simulate.change(node, { target: typeof value === 'boolean' ? { checked: value } : { value } } as never); });
}
async function go(surface: string) {
  const rail = one(elements('nav'), 'workspace rail');
  await click(one(elements('button', rail).filter(node => elements('span', node)[0]?.textContent === surface), `surface: ${surface}`));
}
function dialog() { return one(descendants(document.body).filter(node => node.getAttribute('role') === 'dialog'), 'dialog'); }
function libraryRequests() { return ipc.query.mock.calls.map(([request]) => request).filter(request => request.limit === 48); }
async function openLibrary() { await mount(); await go(t.surfaceLibrary); await tick(); }
async function selectAlpha() { await openLibrary(); await click(button(`${t.selectableRow}: alpha.jpg`)); }
async function buildSelected(operation: OrganizationMode = 'copy') {
  await selectAlpha();
  await go(t.surfaceBuilder);
  if (operation !== 'copy') await change(one(elements('input').filter(node => (node as HTMLInputElement).value === operation), `mode: ${operation}`), true);
  if (operation !== 'virtual') {
    await click(button(t.chooseDestination));
    await click(button(t.useThisFolder));
  }
  await click(button(t.buildPlan));
}
function approvals() { return elements('input').filter(node => node.getAttribute('type') === 'checkbox'); }

// Keep all IPC-dependent coverage explicitly labelled; none launches Electron.
describe('Studio workspace renderer — mocked IPC (not real Electron UI)', () => {
  it('renders all 18 independent category labels/counts, including zero and missing stats', async () => {
    await openLibrary();
    const grid = one(descendants(document.body).filter(node => node.getAttribute('class') === 'st-category-grid'), 'category grid');
    const cards = elements('button', grid);
    expect(cards).toHaveLength(18);
    categoryCards.forEach(([key, label], index) => {
      const card = cards[index];
      expect(elements('strong', card)[0].textContent).toBe(label);
      const stat = sources[0].inventory!.categories.find(category => category.key === key);
      expect(elements('span', card)[0].textContent).toBe(String(stat?.count ?? 0));
      expect(card.getAttribute('aria-pressed')).toBe('false');
    });
    expect(elements('span', cards[12])[0].textContent).toBe('0'); // retained empty font category
    expect(elements('span', cards[17])[0].textContent).toBe('0'); // omitted other category
    expect(ipc.executePlan).not.toHaveBeenCalled();
  });

  it('forwards debounced library filters and paging, resetting offset on filter changes', async () => {
    await openLibrary();
    const defaults = {
      inventoryId: 'inventory-alpha', category: 'all', search: '', sort: 'name', desc: false,
      offset: 0, limit: 48, extensions: [], minBytes: undefined, maxBytes: undefined, modifiedAfter: undefined
    };
    expect(libraryRequests()).toStrictEqual([defaults]);
    await click(button(t.nextPage));
    await tick();
    expect(libraryRequests().at(-1)).toStrictEqual({ ...defaults, offset: 48 });
    ipc.query.mockClear();
    await change(one(elements('input').filter(node => node.getAttribute('aria-label') === t.searchLabel), 'search'), 'report');
    await change(field(t.category), 'pdf');
    await change(field(t.extension), '.pdf');
    await change(field(t.sizeRange), 'medium');
    await change(field(t.dateRange), 'week');
    await change(field(t.sortBy), 'modified');
    await click(button(t.ascending));
    await tick(179);
    expect(libraryRequests()).toHaveLength(0);
    await tick(1);
    expect(libraryRequests()).toStrictEqual([{
      ...defaults, category: 'pdf', search: 'report', extensions: ['.pdf'], sort: 'modified', desc: true,
      minBytes: 50 * 1024 * 1024, maxBytes: 500 * 1024 * 1024, modifiedAfter: Date.now() - 7 * 86400000
    }]);
    await click(button(t.clearFilters));
    await tick();
    expect(libraryRequests().at(-1)).toStrictEqual(defaults);
  });

  it('category cards toggle the requested category and back to all', async () => {
    await openLibrary();
    const pdf = one(elements('button').filter(node => elements('strong', node)[0]?.textContent === 'PDF files'), 'PDF category');
    await click(pdf); await tick();
    expect(pdf.getAttribute('aria-pressed')).toBe('true');
    expect(libraryRequests().at(-1)?.category).toBe('pdf');
    await click(pdf); await tick();
    expect(pdf.getAttribute('aria-pressed')).toBe('false');
    expect(libraryRequests().at(-1)?.category).toBe('all');
  });

  it('preserves same-ID files across sources and resolves category/all overlap only within that source', async () => {
    await selectAlpha();
    await change(field(t.sourceFolder), 'beta'); await tick();
    expect(libraryRequests().at(-1)?.inventoryId).toBe('inventory-beta');
    expect(button(`${t.selectableRow}: beta.jpg`).getAttribute('aria-pressed')).toBe('false');
    await click(button(`${t.selectableRow}: beta.jpg`));
    await change(field(t.sourceFolder), 'alpha'); await tick();
    expect(button(`${t.selectableRow}: alpha.jpg`).getAttribute('aria-pressed')).toBe('true');
    await change(field(t.category), 'image'); await tick();
    await click(button(t.addCategoryToPlan));
    await go(t.surfaceBuilder);
    expect(elements('div').filter(node => node.getAttribute('class') === 'st-basket-list')[0].textContent).toContain('Beta source');
    expect(elements('div').filter(node => node.getAttribute('class') === 'st-basket-list')[0].textContent).not.toContain('alpha.jpg');
    await click(button(t.chooseDestination)); await click(button(t.useThisFolder));
    await click(button(t.buildPlan));
    expect(ipc.buildPlan).toHaveBeenLastCalledWith({
      selections: [{ inventoryId: 'inventory-alpha', category: 'image' }, { inventoryId: 'inventory-beta', fileIds: [7] }],
      operation: 'copy', destination: { destinationId, relativePath: '' }, structure: 'categorized',
      categoryFolderNames: {}, categoryDestinations: {}, collisionPolicy: 'review'
    });
    await go(t.surfaceLibrary); await click(button(t.clearFilters)); await tick();
    await click(button(t.addAllToPlan));
    await go(t.surfaceBuilder); await click(button(t.buildPlan));
    expect(ipc.buildPlan.mock.calls.at(-1)?.[0].selections).toStrictEqual([
      { inventoryId: 'inventory-alpha', all: true }, { inventoryId: 'inventory-beta', fileIds: [7] }
    ]);
    expect(ipc.executePlan).not.toHaveBeenCalled();
  });

  it.each(['copy', 'move', 'virtual'] as const)('requires both checks and forwards only the exact reviewed %s approval', async operation => {
    await buildSelected(operation);
    expect(ipc.buildPlan).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain('mock-plan-exact');
    expect(document.body.textContent).toContain('a'.repeat(64));
    expect(ipc.executePlan).not.toHaveBeenCalled();
    expect(button(t.approveExecute).disabled).toBe(true);
    await click(button(t.approveExecute));
    const checks = approvals();
    expect(checks).toHaveLength(2);
    await change(checks[0], true);
    expect(button(t.approveExecute).disabled).toBe(true);
    await click(button(t.approveExecute));
    await change(checks[0], false); await change(checks[1], true);
    expect(button(t.approveExecute).disabled).toBe(true);
    await click(button(t.approveExecute));
    expect(ipc.executePlan).not.toHaveBeenCalled();
    await change(checks[0], true);
    expect(button(t.approveExecute).disabled).toBe(false);
    await click(button(t.approveExecute));
    expect(ipc.executePlan.mock.calls).toStrictEqual([[{
      planId: 'mock-plan-exact', planHash: 'a'.repeat(64), approved: true, operation,
      destinationSummary: operation === 'virtual' ? 'In-app collection only' : 'D:\\Organized\\Reviewed snapshot'
    }]]);
    expect(ipc.createFolder).not.toHaveBeenCalled();
  });

  it.each([
    ['expired', { expiresAtMs: now.getTime() - 1 }],
    ['blocked', { executable: false }]
  ] as const)('never executes a %s plan even after both checks', async (_label, patch) => {
    ipc.buildPlan.mockResolvedValueOnce(plan('copy', patch));
    await buildSelected();
    for (const check of approvals()) await change(check, true);
    expect(button(t.approveExecute).disabled).toBe(true);
    await click(button(t.approveExecute));
    expect(ipc.executePlan).not.toHaveBeenCalled();
  });

  it('invalidates the reviewed snapshot on settings changes and requires fresh approval after rebuilding', async () => {
    await buildSelected();
    for (const check of approvals()) await change(check, true);
    await go(t.surfaceBuilder);
    await change(field(t.categoryFolder), 'Reviewed images');
    await go(t.surfaceReview);
    expect(document.body.textContent).toContain(t.noPlan);
    expect(elements('button').some(node => node.textContent === t.approveExecute)).toBe(false);
    await go(t.surfaceBuilder);
    ipc.buildPlan.mockResolvedValueOnce(plan('copy', { planId: 'mock-plan-rebuilt', planHash: 'c'.repeat(64) }));
    await click(button(t.buildPlan));
    expect(ipc.buildPlan.mock.calls.at(-1)?.[0].categoryFolderNames).toStrictEqual({ image: 'Reviewed images' });
    expect(approvals().every(node => !(node as HTMLInputElement).checked)).toBe(true);
    expect(button(t.approveExecute).disabled).toBe(true);
    expect(ipc.executePlan).not.toHaveBeenCalled();
  });

  it('clears approved folder validation on editing and ignores an older in-flight validation', async () => {
    const older = deferred<FolderValidationResult>();
    const latest = deferred<FolderValidationResult>();
    ipc.validateFolder.mockResolvedValueOnce({ ok: true, name: 'Initially valid' })
      .mockReturnValueOnce(older.promise).mockReturnValueOnce(latest.promise);
    ipc.createFolder.mockResolvedValueOnce({ ok: true, name: 'Final review', path: `${destinationRoot}\\Final review`, relativePath: 'Final review', parentRelative: '', longPath: false });
    await mount(); await go(t.surfaceDestinations); await click(button(t.createFolder));
    const name = field(t.folderName, dialog());
    await change(name, 'Initially valid'); await tick(200);
    expect(button(t.createAndUse, dialog()).disabled).toBe(false);
    await change(name, 'Older request');
    expect(button(t.createAndUse, dialog()).disabled).toBe(true);
    await click(button(t.createAndUse, dialog()));
    expect(ipc.createFolder).not.toHaveBeenCalled();
    await tick(200);
    await change(name, 'Final review'); await tick(200);
    await act(async () => older.resolve({ ok: false, existing: true, existingType: 'directory', existingName: 'Older request', fullPath: `${destinationRoot}\\Older request` }));
    expect(dialog().textContent).not.toContain('Older request');
    expect(dialog().textContent).not.toContain(t.useExisting);
    expect(button(t.createAndUse, dialog()).disabled).toBe(true);
    expect(ipc.createFolder).not.toHaveBeenCalled();
    await act(async () => latest.resolve({ ok: true, name: 'Final review', fullPath: `${destinationRoot}\\Final review` }));
    expect(button(t.createAndUse, dialog()).disabled).toBe(false);
    expect(ipc.validateFolder.mock.calls).toStrictEqual([
      [{ destinationId, parentRelative: '', name: 'Initially valid' }],
      [{ destinationId, parentRelative: '', name: 'Older request' }],
      [{ destinationId, parentRelative: '', name: 'Final review' }]
    ]);
    await click(button(t.createAndUse, dialog()));
    expect(ipc.createFolder.mock.calls).toStrictEqual([[{ destinationId, parentRelative: '', name: 'Final review' }]]);
    expect(ipc.listDestination).toHaveBeenCalledWith({ destinationId, relativePath: 'Final review' });
    expect(ipc.executePlan).not.toHaveBeenCalled();
  });

  it('reauthorizes undo roots, rejects a wrong picker root, and forwards the refreshed preview ID/hash', async () => {
    ipc.listHistory.mockResolvedValue([journal]);
    ipc.previewUndo.mockResolvedValueOnce(undoPreview({ eligible: 0, requiredRoots: [{ kind: 'source', root: 'C:\\Alpha' }] }))
      .mockResolvedValueOnce(undoPreview({ previewId: 'mock-preview-reauthorized', previewHash: 'c'.repeat(64) }))
      .mockResolvedValueOnce(undoPreview({ previewId: 'mock-preview-refreshed', previewHash: 'd'.repeat(64) }));
    ipc.pickSource.mockResolvedValueOnce({ id: 'wrong', name: 'Wrong', folder: 'C:\\Wrong' }).mockResolvedValueOnce(sources[0]);
    await mount(); await go(t.surfaceHistory); await click(button(t.undoCheck));
    expect(ipc.previewUndo.mock.calls).toStrictEqual([[{ journalId: 'mock-journal' }]]);
    await change(approvals()[0], true);
    expect(button(t.undoApply, dialog()).disabled).toBe(true);
    await click(button(t.undoApply, dialog()));
    expect(ipc.applyUndo).not.toHaveBeenCalled();
    await click(button(`${t.undoAuthorize} · ${t.source}`, dialog()));
    expect(dialog().textContent).toContain(t.undoWrongRoot);
    expect(ipc.previewUndo).toHaveBeenCalledTimes(1);
    await click(button(`${t.undoAuthorize} · ${t.source}`, dialog()));
    expect(ipc.previewUndo).toHaveBeenCalledTimes(2);
    expect((approvals()[0] as HTMLInputElement).checked).toBe(false);
    await change(approvals()[0], true);
    await change(field(t.undoResolution, dialog()), 'rename');
    expect(button(t.undoApply, dialog()).disabled).toBe(true);
    await change(approvals()[0], true);
    await click(button(t.undoRefresh, dialog()));
    expect(ipc.previewUndo).toHaveBeenCalledTimes(3);
    expect(button(t.undoApply, dialog()).disabled).toBe(true);
    await click(button(t.undoApply, dialog()));
    expect(ipc.applyUndo).not.toHaveBeenCalled();
    await change(approvals()[0], true);
    await click(button(t.undoApply, dialog()));
    expect(ipc.applyUndo.mock.calls).toStrictEqual([[{
      journalId: 'mock-journal', previewId: 'mock-preview-refreshed', previewHash: 'd'.repeat(64),
      resolution: 'rename', approved: true
    }]]);
    expect(dialog().textContent).toContain(t.undoResult);
    expect(ipc.executePlan).not.toHaveBeenCalled();
  });
});
