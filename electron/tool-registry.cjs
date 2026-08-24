const { z } = require('zod');

const emptyInput = z.object({}).strict();
const scanInput = z.object({
  folder: z.string().min(1).max(32767).optional(),
  limit: z.number().int().min(1).max(200000).optional()
}).strict();
const largeFilesInput = scanInput.extend({ thresholdBytes: z.number().int().min(1).optional() }).strict();
const duplicatesInput = scanInput.extend({ minimumBytes: z.number().int().min(1).optional() }).strict();
const organizeApplyInput = z.object({ confirm: z.literal(true), limit: z.number().int().min(1).max(200000).optional() }).strict();
const organizeUndoInput = z.object({ journalId: z.string().uuid() }).strict();
const fileHashInput = z.object({ filePath: z.string().min(1).max(32767), algorithm: z.enum(['sha256', 'sha512']).optional() }).strict();
const outputSchema = z.object({
  summary: z.record(z.unknown()),
  items: z.array(z.record(z.unknown())),
  warnings: z.array(z.string()).optional(),
  partial: z.boolean().optional(),
  restartRequired: z.boolean().optional(),
  undoMetadata: z.record(z.unknown()).nullable().optional()
}).strict();

const SPECS = [
  ['system-health', 'systemHealth', 'system', 'Activity', 'read-only', false, false, false, false, true, 'low', emptyInput],
  ['smart-scan', 'smartScan', 'scan', 'ScanSearch', 'read-only', false, false, true, true, true, 'medium', emptyInput],
  ['disk-overview', 'diskOverview', 'storage', 'HardDrive', 'read-only', false, false, false, false, true, 'low', emptyInput],
  ['large-files', 'largeFiles', 'storage', 'FileStack', 'read-only', false, false, true, true, true, 'high', largeFilesInput],
  ['duplicate-files', 'duplicates', 'storage', 'Copy', 'read-only', false, false, true, true, true, 'high', duplicatesInput],
  ['empty-folders', 'emptyFolders', 'files', 'FolderSearch2', 'read-only', false, false, true, true, true, 'medium', scanInput],
  ['downloads-inventory', 'downloadsInventory', 'files', 'Download', 'read-only', false, false, true, true, true, 'medium', z.object({ limit: z.number().int().min(1).max(200000).optional() }).strict()],
  ['organize-downloads-preview', 'organizePreview', 'files', 'FolderCog', 'read-only', false, true, true, true, true, 'medium', z.object({ limit: z.number().int().min(1).max(200000).optional() }).strict()],
  ['organize-downloads-apply', 'organizeApply', 'files', 'FolderInput', 'safe-write', false, false, true, true, true, 'medium', organizeApplyInput],
  ['organize-downloads-undo', 'organizeUndo', 'files', 'Undo2', 'safe-write', false, false, true, true, true, 'medium', organizeUndoInput],
  ['temp-cleanup-preview', 'tempPreview', 'cleanup', 'Trash2', 'read-only', false, true, true, true, true, 'medium', z.object({ limit: z.number().int().min(1).max(25000).optional() }).strict()],
  ['startup-items', 'startupItems', 'startup', 'Rocket', 'read-only', false, false, false, false, true, 'low', emptyInput],
  ['installed-apps', 'installedApps', 'applications', 'AppWindow', 'read-only', false, false, false, false, true, 'low', emptyInput],
  ['network-diagnostics', 'networkDiagnostics', 'network', 'Network', 'read-only', false, false, false, false, true, 'low', emptyInput],
  ['hardware-inventory', 'hardwareInventory', 'hardware', 'Cpu', 'read-only', false, false, false, false, true, 'low', emptyInput],
  ['event-warnings', 'eventWarnings', 'system', 'TriangleAlert', 'read-only', false, false, false, false, true, 'medium', emptyInput],
  ['file-hash', 'fileHash', 'files', 'Fingerprint', 'read-only', false, false, true, true, true, 'medium', fileHashInput]
];

function createToolRegistry(handlerResolver, { platform = process.platform } = {}) {
  const registry = SPECS.map(([id, engine, category, icon, riskLevel, requiresAdmin, supportsDryRun, supportsProgress, supportsCancel, supportsExport, estimatedCost, inputSchema]) => {
    const handler = handlerResolver(engine);
    if (typeof handler !== 'function') throw new Error(`Missing handler for enabled tool: ${id}`);
    return Object.freeze({
      id, engine, nameKey: `tools.${id}.name`, descriptionKey: `tools.${id}.description`, category, icon, riskLevel,
      requiresAdmin, supportsDryRun, supportsProgress, supportsCancel,
      supportsUndo: engine === 'organizeApply' || engine === 'organizeUndo', supportsExport, estimatedCost,
      inputSchema, outputSchema, handler,
      availabilityProbe: async () => platform === 'win32'
        ? { available: true, capability: requiresAdmin ? 'windows-elevation' : 'windows-local' }
        : { available: false, reason: 'This tool requires Windows.', capability: 'windows-local' }
    });
  });
  const ids = new Set(registry.map(tool => tool.id));
  if (ids.size !== registry.length) throw new Error('Tool registry contains duplicate IDs.');
  return Object.freeze(registry);
}

async function serializeTool(tool) {
  const availability = await tool.availabilityProbe();
  return {
    id: tool.id, nameKey: tool.nameKey, descriptionKey: tool.descriptionKey, category: tool.category, icon: tool.icon,
    riskLevel: tool.riskLevel, requiresAdmin: tool.requiresAdmin, supportsDryRun: tool.supportsDryRun,
    supportsProgress: tool.supportsProgress, supportsCancel: tool.supportsCancel, supportsUndo: tool.supportsUndo,
    supportsExport: tool.supportsExport, estimatedCost: tool.estimatedCost,
    inputSchema: { id: `${tool.id}.input`, version: 1 }, outputSchema: { id: `${tool.id}.output`, version: 1 },
    availability
  };
}

async function serializeRegistry(registry) { return Promise.all(registry.map(serializeTool)); }

module.exports = { createToolRegistry, serializeRegistry, outputSchema };
