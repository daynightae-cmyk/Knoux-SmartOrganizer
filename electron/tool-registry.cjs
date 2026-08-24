const { z } = require('zod');

const emptyInput = z.object({}).strict();
const scanInput = z.object({
  folder: z.string().min(1).max(32767).optional(),
  limit: z.number().int().min(1).max(200000).optional()
}).strict();
const largeFilesInput = scanInput.extend({ thresholdBytes: z.number().int().min(1).optional() }).strict();
const duplicatesInput = scanInput.extend({ minimumBytes: z.number().int().min(1).optional() }).strict();
const organizePreviewInput = z.object({ folder: z.string().min(1).max(32767).optional(), limit: z.number().int().min(1).max(200000).optional() }).strict();
const organizeApplyInput = z.object({ folder: z.string().min(1).max(32767).optional(), confirm: z.literal(true), limit: z.number().int().min(1).max(200000).optional() }).strict();
const organizeUndoInput = z.object({ journalId: z.string().uuid() }).strict();
const fileHashInput = z.object({ filePath: z.string().min(1).max(32767), algorithm: z.enum(['sha256', 'sha512']).optional() }).strict();
const administratorInput = z.object({ confirm: z.literal(true), dryRun: z.boolean().optional().default(false) }).strict();
const serviceInventoryInput = z.object({ search: z.string().max(200).optional(), limit: z.number().int().min(1).max(5000).optional() }).strict();
const serviceControlInput = z.object({ serviceName: z.string().regex(/^[A-Za-z0-9_.-]{1,256}$/), action: z.enum(['start', 'stop', 'restart', 'automatic', 'delayedAutomatic', 'manual', 'disabled']), confirm: z.literal(true), dryRun: z.boolean().optional().default(false) }).strict();
const serviceUndoInput = z.object({ journalId: z.string().uuid(), confirm: z.literal(true), dryRun: z.boolean().optional().default(false) }).strict();
const tempCleanupApplyInput = z.object({ confirm: z.literal(true), limit: z.number().int().min(1).max(25000).optional() }).strict();
const tempCleanupUndoInput = z.object({ journalId: z.string().uuid() }).strict();
const startupDisableInput = z.object({ valueName: z.string().min(1).max(255).refine(value => !value.includes('\\') && !value.includes('\0'), 'Startup value name is invalid.'), confirm: z.literal(true), dryRun: z.boolean().optional().default(false) }).strict();
const startupRestoreInput = z.object({ journalId: z.string().uuid(), confirm: z.literal(true), dryRun: z.boolean().optional().default(false) }).strict();
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
  ['organize-downloads-preview', 'organizePreview', 'files', 'FolderCog', 'read-only', false, true, true, true, true, 'medium', organizePreviewInput],
  ['organize-downloads-apply', 'organizeApply', 'files', 'FolderInput', 'safe-write', false, false, true, true, true, 'medium', organizeApplyInput],
  ['organize-downloads-undo', 'organizeUndo', 'files', 'Undo2', 'safe-write', false, false, true, true, true, 'medium', organizeUndoInput],
  ['temp-cleanup-preview', 'tempPreview', 'cleanup', 'Trash2', 'read-only', false, true, true, true, true, 'medium', z.object({ limit: z.number().int().min(1).max(25000).optional() }).strict()],
  ['temp-cleanup-apply', 'tempCleanupApply', 'cleanup', 'Trash', 'safe-write', false, true, true, true, true, 'medium', tempCleanupApplyInput],
  ['temp-cleanup-undo', 'tempCleanupUndo', 'cleanup', 'Undo2', 'safe-write', false, false, true, true, true, 'medium', tempCleanupUndoInput],
  ['startup-items', 'startupItems', 'startup', 'Rocket', 'read-only', false, false, false, false, true, 'low', emptyInput],
  ['startup-disable', 'startupDisable', 'startup', 'CircleOff', 'safe-write', false, true, false, false, true, 'medium', startupDisableInput],
  ['startup-restore', 'startupRestore', 'startup', 'Undo2', 'safe-write', false, true, false, false, true, 'medium', startupRestoreInput],
  ['installed-apps', 'installedApps', 'applications', 'AppWindow', 'read-only', false, false, false, false, true, 'low', emptyInput],
  ['network-diagnostics', 'networkDiagnostics', 'network', 'Network', 'read-only', false, false, false, false, true, 'low', emptyInput],
  ['hardware-inventory', 'hardwareInventory', 'hardware', 'Cpu', 'read-only', false, false, false, false, true, 'low', emptyInput],
  ['event-warnings', 'eventWarnings', 'system', 'TriangleAlert', 'read-only', false, false, false, false, true, 'medium', emptyInput],
  ['process-inventory', 'processInventory', 'system', 'ListTree', 'read-only', false, false, false, false, true, 'medium', emptyInput],
  ['battery-status', 'batteryStatus', 'hardware', 'BatteryCharging', 'read-only', false, false, false, false, true, 'low', emptyInput],
  ['file-hash', 'fileHash', 'files', 'Fingerprint', 'read-only', false, false, true, true, true, 'medium', fileHashInput],
  ['repair-dism-check-health', 'dismCheckHealth', 'repair', 'ShieldCheck', 'administrator', true, true, false, false, true, 'medium', administratorInput],
  ['repair-dism-scan-health', 'dismScanHealth', 'repair', 'ShieldSearch', 'administrator', true, true, false, false, true, 'high', administratorInput],
  ['repair-dism-restore-health', 'dismRestoreHealth', 'repair', 'ShieldPlus', 'administrator', true, true, false, false, true, 'high', administratorInput],
  ['repair-sfc-verify-only', 'sfcVerifyOnly', 'repair', 'FileCheck2', 'administrator', true, true, false, false, true, 'high', administratorInput],
  ['repair-sfc-scan-now', 'sfcScanNow', 'repair', 'FileCog', 'administrator', true, true, false, false, true, 'high', administratorInput],
  ['repair-dns-flush', 'flushDns', 'repair', 'Network', 'administrator', true, true, false, false, true, 'low', administratorInput],
  ['repair-winsock-reset', 'winsockReset', 'repair', 'Router', 'administrator', true, true, false, false, true, 'medium', administratorInput],
  ['repair-tcpip-reset', 'tcpIpReset', 'repair', 'Cable', 'administrator', true, true, false, false, true, 'medium', administratorInput],
  ['services-inventory', 'servicesInventory', 'services', 'ListTree', 'read-only', false, false, false, false, true, 'medium', serviceInventoryInput],
  ['service-control', 'serviceControl', 'services', 'SlidersHorizontal', 'administrator', true, true, false, false, true, 'medium', serviceControlInput],
  ['service-startup-undo', 'serviceStartupUndo', 'services', 'Undo2', 'administrator', true, true, false, false, true, 'medium', serviceUndoInput]
];

function createToolRegistry(handlerResolver, { platform = process.platform, availabilityResolver = null } = {}) {
  const registry = SPECS.map(([id, engine, category, icon, riskLevel, requiresAdmin, supportsDryRun, supportsProgress, supportsCancel, supportsExport, estimatedCost, inputSchema]) => {
    const handler = handlerResolver(engine);
    if (typeof handler !== 'function') throw new Error(`Missing handler for enabled tool: ${id}`);
    return Object.freeze({
      id, engine, nameKey: `tools.${id}.name`, descriptionKey: `tools.${id}.description`, category, icon, riskLevel,
      requiresAdmin, supportsDryRun, supportsProgress, supportsCancel,
      supportsUndo: ['organizeApply', 'organizeUndo', 'serviceControl', 'tempCleanupApply', 'tempCleanupUndo', 'startupDisable', 'startupRestore'].includes(engine), supportsExport, estimatedCost,
      advisory: requiresAdmin ? { effectKey: `tools.${id}.effect`, doesNotKey: `tools.${id}.doesNot`, durationKey: `tools.${id}.duration`, restartMayBeRequired: ['dismRestoreHealth', 'sfcScanNow', 'winsockReset', 'tcpIpReset'].includes(engine) } : undefined,
      inputSchema, outputSchema, handler,
      availabilityProbe: async () => requiresAdmin && availabilityResolver ? availabilityResolver(engine) : platform === 'win32'
        ? { available: true, capability: requiresAdmin ? 'windows-elevation' : 'windows-local' }
        : { available: false, reason: 'This tool requires Windows.', capability: 'windows-local' }
    });
  });
  const ids = new Set(registry.map(tool => tool.id));
  if (ids.size !== registry.length) throw new Error('Tool registry contains duplicate IDs.');
  return Object.freeze(registry);
}

async function serializeTool(tool) {
  const probedAvailability = await tool.availabilityProbe();
  const availability = {
    available: probedAvailability?.available === true,
    capability: typeof probedAvailability?.capability === 'string' ? probedAvailability.capability : 'windows-local',
    ...(probedAvailability?.available === true || typeof probedAvailability?.reason !== 'string' ? {} : { reason: probedAvailability.reason })
  };
  return {

    id: tool.id, nameKey: tool.nameKey, descriptionKey: tool.descriptionKey, category: tool.category, icon: tool.icon,
    riskLevel: tool.riskLevel, requiresAdmin: tool.requiresAdmin, supportsDryRun: tool.supportsDryRun,
    supportsProgress: tool.supportsProgress, supportsCancel: tool.supportsCancel, supportsUndo: tool.supportsUndo,
    supportsExport: tool.supportsExport, estimatedCost: tool.estimatedCost,
    inputSchema: { id: `${tool.id}.input`, version: 1 }, outputSchema: { id: `${tool.id}.output`, version: 1 },
    availability, advisory: tool.advisory
  };
}

async function serializeRegistry(registry) { return Promise.all(registry.map(serializeTool)); }

module.exports = { createToolRegistry, serializeRegistry, outputSchema };
