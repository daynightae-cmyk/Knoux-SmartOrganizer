import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ACTIVE_PHASES,
  cancelAllowed,
  canRunTool,
  filterToolsByPage,
  isActivePhase,
  paletteTargetForTool,
  phaseLabelKey,
  progressOf,
  requiresConfirmation,
  resolveTool,
  searchFilterTools,
  undoAllowed
} from '../src/lib/guards';
import { buildToolRecord, normalizeQuery, searchRecords } from '../src/lib/search';
import { direction } from '../src/locales';
import { SMART_SCAN_TOTAL, findingTitleKey, scoreReasonKey, smartScanFindings, smartScanStageFromEvent, smartScore, smartScoreReasons } from '../src/lib/smartscan';
import { isCatalogPage, pageGroups, pageIds } from '../src/lib/pages';

const require = createRequire(import.meta.url);
const { createToolRegistry, serializeRegistry } = require('../electron/tool-registry.cjs') as {
  createToolRegistry: (resolver: (engine: string) => (...args: unknown[]) => Promise<unknown>, options?: { platform?: string }) => any[];
  serializeRegistry: (registry: any[]) => Promise<any[]>;
};

const handler = async () => ({ summary: {}, items: [] });
const t = (key: string) => key;

async function registryTools() {
  return serializeRegistry(createToolRegistry(() => handler, { platform: 'win32' }));
}

describe('unified shell workspace', () => {
  it('drives every tool presentation from the real registry (34 tools, no invented entries)', async () => {
    const tools = await registryTools();
    expect(tools).toHaveLength(34);
    for (const tool of tools) {
      expect(resolveTool(tools, tool.id)).toEqual(tool);
    }
    expect(resolveTool(tools, 'planned-fake-tool')).toBeNull();
    expect(resolveTool(tools, '')).toBeNull();
  });

  it('blocks unavailable tools from running with a truthful reason', async () => {
    const tools = await registryTools();
    const disk = tools.find(tool => tool.id === 'disk-overview');
    expect(canRunTool(disk)).toBe(true);
    const blocked = { ...disk, availability: { available: false, reason: 'Windows-only capability.' } };
    expect(canRunTool(blocked)).toBe(false);
    expect(canRunTool(null)).toBe(false);
  });

  it('requires explicit confirmation for admin/write tools but not read-only ones', async () => {
    const tools = await registryTools();
    const readOnly = tools.find(tool => tool.id === 'disk-overview');
    const admin = tools.find(tool => tool.id === 'repair-dism-check-health');
    const apply = tools.find(tool => tool.id === 'organize-downloads-apply');
    expect(requiresConfirmation(readOnly)).toBe(false);
    expect(requiresConfirmation(admin)).toBe(true);
    expect(requiresConfirmation(apply)).toBe(true);
    expect(requiresConfirmation(null)).toBe(false);
  });

  it('shows undo only when the tool supports it and the result carries undo metadata', async () => {
    const tools = await registryTools();
    const apply = tools.find(tool => tool.id === 'organize-downloads-apply');
    const readOnly = tools.find(tool => tool.id === 'disk-overview');
    const withJournal = { operationId: 'x', toolId: 'organize-downloads-apply', success: true, startedAt: '', finishedAt: '', summary: {}, items: [], warnings: [], errors: [], undoMetadata: { journalId: '11111111-1111-4111-8111-111111111111' } };
    expect(undoAllowed(apply, withJournal)).toBe(true);
    expect(undoAllowed(apply, { ...withJournal, undoMetadata: null })).toBe(false);
    expect(undoAllowed(readOnly, withJournal)).toBe(false);
  });

  it('allows cancellation only for cancel-capable tools during cancellable phases', async () => {
    const tools = await registryTools();
    const cancellable = tools.find(tool => tool.id === 'smart-scan');
    expect(cancellable.supportsCancel).toBe(true);
    const running = { operationId: 'o', toolId: 'smart-scan', startedAt: '', updatedAt: '', progress: null, phase: 'progress', summary: {}, warnings: [], errors: [], cancelRequested: false, undoMetadata: null, message: '', at: '' } as never;
    const awaitingAdmin = { operationId: 'o', toolId: 'smart-scan', startedAt: '', updatedAt: '', phase: 'awaiting-admin', progress: null, summary: {}, warnings: [], errors: [], cancelRequested: false, undoMetadata: null, message: '', at: '' } as never;
    expect(cancelAllowed(cancellable, running)).toBe(true);
    expect(cancelAllowed(cancellable, awaitingAdmin)).toBe(false);
    expect(cancelAllowed(cancellable, null)).toBe(false);
  });

  it('finds tools through bilingual normalized search', async () => {
    const tools = await registryTools();
    const records = tools.map(tool => buildToolRecord(tool, t));
    expect(normalizeQuery('  Downloads  ')).toBe('downloads');
    const hits = searchRecords(records, 'downloads', 'en');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].id).toMatch(/downloads|large-files|duplicate/i);
    expect(searchRecords(records, 'zzz-no-such-tool', 'en')).toEqual([]);
  });

  it('resolves command-palette targets to real pages without executing tools', async () => {
    const tools = await registryTools();
    const scan = tools.find(tool => tool.id === 'smart-scan');
    const disk = tools.find(tool => tool.id === 'disk-overview');
    expect(paletteTargetForTool(scan)).toBe('scan');
    expect(paletteTargetForTool(disk)).toBe('storage');
    expect(pageIds.has(paletteTargetForTool(disk))).toBe(true);
  });

  it('activates Arabic RTL and English LTR', () => {
    expect(direction('ar')).toBe('rtl');
    expect(direction('en')).toBe('ltr');
  });

  it('filters the catalogue by the current category', async () => {
    const tools = await registryTools();
    const storage = filterToolsByPage(tools, 'storage');
    expect(storage.length).toBeGreaterThan(0);
    for (const tool of storage) expect(tool.category).toBe('storage');
    expect(filterToolsByPage(tools, 'scan').map(tool => tool.id)).toEqual(['smart-scan']);
    expect(searchFilterTools(tools, 'storage', 'zzz-no-match', t)).toEqual([]);
  });

  it('maps only real backend operation phases in the activity drawer', () => {
    expect(ACTIVE_PHASES).toEqual(['queued', 'preflight', 'awaiting-confirmation', 'awaiting-admin', 'running', 'progress']);
    expect(SMART_SCAN_TOTAL).toBe(7);
    expect(isActivePhase('progress')).toBe(true);
    expect(isActivePhase('completed')).toBe(false);
    expect(phaseLabelKey('awaiting-admin')).toBe('phase.awaiting-admin');
    const staged = { operationId: 'o', toolId: 'smart-scan', startedAt: '', updatedAt: '', progress: null, phase: 'progress', summary: {}, warnings: [], errors: [], cancelRequested: false, undoMetadata: null, message: '', current: 3, total: 7, percent: 43, at: '' } as never;
    expect(progressOf(staged, null)).toBe(43);
    expect(progressOf(null, null)).toBe(0);
  });

  it('never silently executes planned or nonexistent tools', async () => {
    const tools = await registryTools();
    expect(resolveTool(tools, 'tailadmin-ecommerce')).toBeNull();
    expect(canRunTool(resolveTool(tools, 'tailadmin-ecommerce'))).toBe(false);
  });

  it('introduces no generic IPC execution path in the renderer bridge', () => {
    const preload = readFileSync(new URL('../electron/preload.cjs', import.meta.url), 'utf8');
    expect(preload).toContain('contextBridge');
    expect(preload).toContain(`exposeInMainWorld('knoux'`);
    expect(preload).not.toMatch(/ipcRenderer\s*\.\s*send\s*\(/);
    expect(preload).not.toMatch(/execute\s*\(\s*command/i);
    expect(preload).not.toMatch(/powershell\s*\(/i);
    expect(preload).not.toMatch(/spawn\s*\(/);
    const main = readFileSync(new URL('../electron/main.cjs', import.meta.url), 'utf8');
    expect(main).toContain('contextIsolation: true');
    expect(main).toContain('nodeIntegration: false');
  });

  it('derives Smart Scan stages only from real backend progress events', () => {
    const staged = { operationId: 'o', toolId: 'smart-scan', startedAt: '', updatedAt: '', progress: null, phase: 'progress', summary: {}, warnings: [], errors: [], cancelRequested: false, undoMetadata: null, message: 'Built Downloads storage intelligence', current: 3, total: 7, percent: 43, at: '' } as never;
    expect(smartScanStageFromEvent(staged)).toBe(3);
    expect(smartScanStageFromEvent(null)).toBe(0);
    const result = {
      operationId: 'o', toolId: 'smart-scan', success: true, startedAt: '', finishedAt: '',
      summary: { smartScore: 82, scoreReasons: ['disk-pressure'] }, items: [{ severity: 'info', key: 'largeDownloads', value: 4 }], warnings: [], errors: []
    };
    expect(smartScore(result)).toBe(82);
    expect(smartScoreReasons(result)).toEqual(['disk-pressure']);
    expect(scoreReasonKey('disk-pressure')).toBe('smartScan.reason.disk-pressure');
    expect(smartScanFindings(result)).toHaveLength(1);
    expect(findingTitleKey({ severity: 'info', key: 'largeDownloads' })).toBe('smartScan.finding.largeDownloads');
    expect(smartScanFindings(null)).toEqual([]);
  });

  it('keeps grouped registry-driven navigation covering every catalogue page', () => {
    const ids = pageGroups.flatMap(group => group.pages.map(page => page.id));
    for (const id of ['home', 'scan', 'storage', 'files', 'applications', 'cleanup', 'startup', 'system', 'repair', 'services', 'network', 'hardware', 'automation', 'history', 'settings']) {
      expect(ids).toContain(id);
    }
    expect(isCatalogPage('storage')).toBe(true);
    expect(isCatalogPage('home')).toBe(false);
    expect(isCatalogPage('scan')).toBe(false);
  });
});
