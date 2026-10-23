/**
 * KNOuX service universe — eleven service worlds, twelve services each (132 total).
 *
 * Honesty rule (product safety, not style): only 34 real backend engines exist today
 * (see electron/tool-registry.cjs). A service is `operational` only when it is backed by
 * a registered engine id or a documented non-tool `native` backing. Services that are not
 * backed are `planned`; services that exist but are limited are `partial`. A service is
 * never presented as functional when its engine does not exist.
 */

export type WorldId =
  | 'applications' | 'files' | 'storage' | 'cleanup' | 'startup'
  | 'system' | 'repair' | 'services' | 'network' | 'hardware' | 'automation';

export type ServiceState = 'operational' | 'partial' | 'planned';

export type WorkspaceKind =
  | 'inventory' | 'search' | 'map' | 'review' | 'monitor'
  | 'wizard' | 'console' | 'atlas' | 'scheduler' | 'inspector' | 'report' | 'matrix';

export type ServiceAction = 'browse' | 'run' | 'review' | 'schedule' | 'none';

export interface ServiceDefinition {
  id: string;
  world: WorldId;
  state: ServiceState;
  workspace: WorkspaceKind;
  engine: string | null;
  native?: string;
  action: ServiceAction;
  requiresAdmin?: boolean;
  nameKey: string;
  summaryKey: string;
  limitKey?: string;
}

export interface WorldAccent {
  hue: string;
  quiet: string;
  border: string;
}

export interface WorldDefinition {
  id: WorldId;
  labelKey: string;
  taglineKey: string;
  navGroup: string;
  icon: string;
  accent: WorldAccent;
  signature: string;
}

/** The frozen set of real registered tool ids. Mirrors electron/tool-registry.cjs. */
export const registeredEngineIds: readonly string[] = [
  'system-health', 'smart-scan', 'disk-overview', 'large-files', 'duplicate-files',
  'empty-folders', 'downloads-inventory', 'organize-downloads-preview', 'organize-downloads-apply',
  'organize-downloads-undo', 'temp-cleanup-preview', 'temp-cleanup-apply', 'temp-cleanup-undo',
  'startup-items', 'startup-disable', 'startup-restore', 'installed-apps', 'network-diagnostics',
  'hardware-inventory', 'event-warnings', 'process-inventory', 'battery-status', 'file-hash',
  'repair-dism-check-health', 'repair-dism-scan-health', 'repair-dism-restore-health',
  'repair-sfc-verify-only', 'repair-sfc-scan-now', 'repair-dns-flush', 'repair-winsock-reset',
  'repair-tcpip-reset', 'services-inventory', 'service-control', 'service-startup-undo'
];

export const worlds: WorldDefinition[] = [
  { id: 'applications', labelKey: 'world.applications.label', taglineKey: 'world.applications.tagline', navGroup: 'organize', icon: 'AppWindow', accent: { hue: '#8b5cf6', quiet: '#241d3a', border: '#463670' }, signature: 'Every installed program, its publisher and identity, in one honest inventory.' },
  { id: 'files', labelKey: 'world.files.label', taglineKey: 'world.files.tagline', navGroup: 'organize', icon: 'FolderOpen', accent: { hue: '#a5b4fc', quiet: '#1e2440', border: '#3a4478' }, signature: 'Your Downloads folder understood — previewed, categorized, and reversible.' },
  { id: 'storage', labelKey: 'world.storage.label', taglineKey: 'world.storage.tagline', navGroup: 'organize', icon: 'HardDrive', accent: { hue: '#6366f1', quiet: '#0f2230', border: '#1f4b63' }, signature: 'An interactive map of where your space actually went.' },
  { id: 'cleanup', labelKey: 'world.cleanup.label', taglineKey: 'world.cleanup.tagline', navGroup: 'optimize', icon: 'Trash2', accent: { hue: '#f59e0b', quiet: '#2a1f10', border: '#5a421f' }, signature: 'Reclaim space by quarantining, never deleting outright.' },
  { id: 'startup', labelKey: 'world.startup.label', taglineKey: 'world.startup.tagline', navGroup: 'optimize', icon: 'Rocket', accent: { hue: '#38bdf8', quiet: '#10222e', border: '#1f4a63' }, signature: 'See and safely trim what launches with your user account.' },
  { id: 'system', labelKey: 'world.system.label', taglineKey: 'world.system.tagline', navGroup: 'optimize', icon: 'Activity', accent: { hue: '#2dd4bf', quiet: '#0f2626', border: '#1f5252' }, signature: 'A living read of health, events, and running processes.' },
  { id: 'repair', labelKey: 'world.repair.label', taglineKey: 'world.repair.tagline', navGroup: 'care', icon: 'ShieldPlus', accent: { hue: '#f87171', quiet: '#2a1618', border: '#5c2f34' }, signature: 'Component and system-file repair, always with your explicit approval.' },
  { id: 'services', labelKey: 'world.services.label', taglineKey: 'world.services.tagline', navGroup: 'care', icon: 'Server', accent: { hue: '#7c8cc4', quiet: '#161b2c', border: '#2f3a5c' }, signature: 'Windows services reviewed and changed one protected step at a time.' },
  { id: 'network', labelKey: 'world.network.label', taglineKey: 'world.network.tagline', navGroup: 'care', icon: 'Network', accent: { hue: '#22d3ee', quiet: '#0d2430', border: '#1a4b5c' }, signature: 'Interfaces and DNS read straight from Windows — no invented topology.' },
  { id: 'hardware', labelKey: 'world.hardware.label', taglineKey: 'world.hardware.tagline', navGroup: 'care', icon: 'Cpu', accent: { hue: '#fb923c', quiet: '#251710', border: '#5a3418' }, signature: 'The machine\'s true specs, and the honest limits of what Windows reports.' },
  { id: 'automation', labelKey: 'world.automation.label', taglineKey: 'world.automation.tagline', navGroup: 'automation', icon: 'CalendarClock', accent: { hue: '#c084fc', quiet: '#241430', border: '#4a2a63' }, signature: 'Safe, local schedules for read-only scans through the Windows Task Scheduler.' }
];

type ServiceInput = Omit<ServiceDefinition, 'nameKey' | 'summaryKey' | 'limitKey'>;

/** Builds a definition, deriving translation keys from the id and enforcing the limit rule. */
const svc = (input: ServiceInput): ServiceDefinition => ({
  ...input,
  nameKey: `svc.${input.id}.name`,
  summaryKey: `svc.${input.id}.summary`,
  ...(input.state === 'operational' ? {} : { limitKey: `svc.${input.id}.limit` })
});

export const serviceCatalog: ServiceDefinition[] = [
  // Applications — 1 engine (installed-apps) + one native icon view; the rest partial/planned.
  svc({ id: 'app-inventory', world: 'applications', state: 'operational', workspace: 'inventory', engine: 'installed-apps', action: 'browse' }),
  svc({ id: 'app-identity', world: 'applications', state: 'operational', workspace: 'matrix', engine: null, native: 'app-icons', action: 'browse' }),
  svc({ id: 'app-search', world: 'applications', state: 'partial', workspace: 'search', engine: null, action: 'browse' }),
  svc({ id: 'app-publisher', world: 'applications', state: 'partial', workspace: 'report', engine: null, action: 'review' }),
  svc({ id: 'app-recent', world: 'applications', state: 'partial', workspace: 'monitor', engine: null, action: 'review' }),
  svc({ id: 'app-uninstall-queue', world: 'applications', state: 'planned', workspace: 'wizard', engine: null, action: 'run' }),
  svc({ id: 'app-leftovers', world: 'applications', state: 'planned', workspace: 'review', engine: null, action: 'review' }),
  svc({ id: 'app-updates', world: 'applications', state: 'planned', workspace: 'console', engine: null, action: 'review' }),
  svc({ id: 'app-size', world: 'applications', state: 'planned', workspace: 'map', engine: null, action: 'review' }),
  svc({ id: 'app-store-packages', world: 'applications', state: 'planned', workspace: 'atlas', engine: null, action: 'browse' }),
  svc({ id: 'app-associations', world: 'applications', state: 'planned', workspace: 'inspector', engine: null, action: 'review' }),
  svc({ id: 'app-startup-impact', world: 'applications', state: 'planned', workspace: 'report', engine: null, action: 'review' }),

  // Files — 6 engines.
  svc({ id: 'file-downloads-inventory', world: 'files', state: 'operational', workspace: 'inventory', engine: 'downloads-inventory', action: 'browse' }),
  svc({ id: 'file-organize-preview', world: 'files', state: 'operational', workspace: 'review', engine: 'organize-downloads-preview', action: 'review' }),
  svc({ id: 'file-organize-apply', world: 'files', state: 'operational', workspace: 'wizard', engine: 'organize-downloads-apply', action: 'run' }),
  svc({ id: 'file-organize-undo', world: 'files', state: 'operational', workspace: 'console', engine: 'organize-downloads-undo', action: 'run' }),
  svc({ id: 'file-empty-folders', world: 'files', state: 'operational', workspace: 'search', engine: 'empty-folders', action: 'review' }),
  svc({ id: 'file-hash', world: 'files', state: 'operational', workspace: 'inspector', engine: 'file-hash', action: 'run' }),
  svc({ id: 'file-search', world: 'files', state: 'partial', workspace: 'search', engine: null, action: 'browse' }),
  svc({ id: 'file-type-map', world: 'files', state: 'partial', workspace: 'map', engine: null, action: 'browse' }),
  svc({ id: 'file-recents', world: 'files', state: 'partial', workspace: 'monitor', engine: null, action: 'review' }),
  svc({ id: 'file-largest', world: 'files', state: 'partial', workspace: 'report', engine: null, action: 'review' }),
  svc({ id: 'file-metadata', world: 'files', state: 'planned', workspace: 'atlas', engine: null, action: 'browse' }),
  svc({ id: 'file-provenance', world: 'files', state: 'planned', workspace: 'inspector', engine: null, action: 'review' }),

  // Storage — 3 engines.
  svc({ id: 'storage-disks', world: 'storage', state: 'operational', workspace: 'atlas', engine: 'disk-overview', action: 'browse' }),
  svc({ id: 'storage-large-files', world: 'storage', state: 'operational', workspace: 'report', engine: 'large-files', action: 'review' }),
  svc({ id: 'storage-duplicates', world: 'storage', state: 'operational', workspace: 'review', engine: 'duplicate-files', action: 'review' }),
  svc({ id: 'storage-treemap', world: 'storage', state: 'planned', workspace: 'map', engine: null, action: 'browse' }),
  svc({ id: 'storage-top-folders', world: 'storage', state: 'partial', workspace: 'report', engine: null, action: 'review' }),
  svc({ id: 'storage-filetypes', world: 'storage', state: 'partial', workspace: 'matrix', engine: null, action: 'browse' }),
  svc({ id: 'storage-scan-overview', world: 'storage', state: 'partial', workspace: 'monitor', engine: null, action: 'browse' }),
  svc({ id: 'storage-fragmentation', world: 'storage', state: 'planned', workspace: 'inspector', engine: null, action: 'none' }),
  svc({ id: 'storage-smart', world: 'storage', state: 'planned', workspace: 'monitor', engine: null, action: 'review' }),
  svc({ id: 'storage-reclaim', world: 'storage', state: 'planned', workspace: 'wizard', engine: null, action: 'run' }),
  svc({ id: 'storage-history', world: 'storage', state: 'planned', workspace: 'atlas', engine: null, action: 'review' }),
  svc({ id: 'storage-removable', world: 'storage', state: 'planned', workspace: 'inventory', engine: null, action: 'browse' }),

  // Cleanup — 3 engines. Quarantines rather than deletes.
  svc({ id: 'cleanup-temp-preview', world: 'cleanup', state: 'operational', workspace: 'review', engine: 'temp-cleanup-preview', action: 'review' }),
  svc({ id: 'cleanup-temp-quarantine', world: 'cleanup', state: 'operational', workspace: 'wizard', engine: 'temp-cleanup-apply', action: 'run' }),
  svc({ id: 'cleanup-temp-undo', world: 'cleanup', state: 'operational', workspace: 'console', engine: 'temp-cleanup-undo', action: 'run' }),
  svc({ id: 'cleanup-quarantine-list', world: 'cleanup', state: 'partial', workspace: 'inventory', engine: null, action: 'review' }),
  svc({ id: 'cleanup-estimate', world: 'cleanup', state: 'partial', workspace: 'report', engine: null, action: 'review' }),
  svc({ id: 'cleanup-recycle', world: 'cleanup', state: 'planned', workspace: 'report', engine: null, action: 'run' }),
  svc({ id: 'cleanup-unused', world: 'cleanup', state: 'planned', workspace: 'matrix', engine: null, action: 'review' }),
  svc({ id: 'cleanup-update-cache', world: 'cleanup', state: 'planned', workspace: 'inspector', engine: null, action: 'review' }),
  svc({ id: 'cleanup-browser-cache', world: 'cleanup', state: 'planned', workspace: 'inventory', engine: null, action: 'review' }),
  svc({ id: 'cleanup-logs', world: 'cleanup', state: 'planned', workspace: 'console', engine: null, action: 'review' }),
  svc({ id: 'cleanup-schedule', world: 'cleanup', state: 'planned', workspace: 'scheduler', engine: null, action: 'schedule' }),
  svc({ id: 'cleanup-reports', world: 'cleanup', state: 'planned', workspace: 'atlas', engine: null, action: 'review' }),

  // Startup — 3 engines. Current-user Run key only; no startup-impact scores exist.
  svc({ id: 'startup-overview', world: 'startup', state: 'operational', workspace: 'inventory', engine: 'startup-items', action: 'browse' }),
  svc({ id: 'startup-disable', world: 'startup', state: 'operational', workspace: 'review', engine: 'startup-disable', action: 'run' }),
  svc({ id: 'startup-restore', world: 'startup', state: 'operational', workspace: 'console', engine: 'startup-restore', action: 'run' }),
  svc({ id: 'startup-sources', world: 'startup', state: 'partial', workspace: 'matrix', engine: null, action: 'review' }),
  svc({ id: 'startup-journal', world: 'startup', state: 'partial', workspace: 'monitor', engine: null, action: 'review' }),
  svc({ id: 'startup-filter', world: 'startup', state: 'partial', workspace: 'search', engine: null, action: 'browse' }),
  svc({ id: 'startup-impact', world: 'startup', state: 'planned', workspace: 'report', engine: null, action: 'review' }),
  svc({ id: 'startup-services', world: 'startup', state: 'planned', workspace: 'inspector', engine: null, action: 'review' }),
  svc({ id: 'startup-tasks', world: 'startup', state: 'planned', workspace: 'scheduler', engine: null, action: 'review' }),
  svc({ id: 'startup-delay', world: 'startup', state: 'planned', workspace: 'wizard', engine: null, action: 'run' }),
  svc({ id: 'startup-batch', world: 'startup', state: 'planned', workspace: 'atlas', engine: null, action: 'run' }),
  svc({ id: 'startup-undo-all', world: 'startup', state: 'planned', workspace: 'review', engine: null, action: 'none' }),

  // System — 3 engines.
  svc({ id: 'system-health-check', world: 'system', state: 'operational', workspace: 'monitor', engine: 'system-health', action: 'browse' }),
  svc({ id: 'system-events', world: 'system', state: 'operational', workspace: 'report', engine: 'event-warnings', action: 'review' }),
  svc({ id: 'system-processes', world: 'system', state: 'operational', workspace: 'inventory', engine: 'process-inventory', action: 'browse' }),
  svc({ id: 'system-signatures', world: 'system', state: 'partial', workspace: 'inspector', engine: null, action: 'review' }),
  svc({ id: 'system-uptime', world: 'system', state: 'partial', workspace: 'matrix', engine: null, action: 'browse' }),
  svc({ id: 'system-perf', world: 'system', state: 'planned', workspace: 'console', engine: null, action: 'browse' }),
  svc({ id: 'system-drivers', world: 'system', state: 'planned', workspace: 'inventory', engine: null, action: 'browse' }),
  svc({ id: 'system-logs', world: 'system', state: 'planned', workspace: 'console', engine: null, action: 'review' }),
  svc({ id: 'system-resources', world: 'system', state: 'planned', workspace: 'monitor', engine: null, action: 'review' }),
  svc({ id: 'system-autostart', world: 'system', state: 'planned', workspace: 'search', engine: null, action: 'browse' }),
  svc({ id: 'system-services-map', world: 'system', state: 'planned', workspace: 'atlas', engine: null, action: 'review' }),
  svc({ id: 'system-timeline', world: 'system', state: 'planned', workspace: 'map', engine: null, action: 'review' }),

  // Repair — 8 engines, all requiring administrator.
  svc({ id: 'repair-component-check', world: 'repair', state: 'operational', workspace: 'console', engine: 'repair-dism-check-health', action: 'run', requiresAdmin: true }),
  svc({ id: 'repair-component-scan', world: 'repair', state: 'operational', workspace: 'console', engine: 'repair-dism-scan-health', action: 'run', requiresAdmin: true }),
  svc({ id: 'repair-component-restore', world: 'repair', state: 'operational', workspace: 'wizard', engine: 'repair-dism-restore-health', action: 'run', requiresAdmin: true }),
  svc({ id: 'repair-files-verify', world: 'repair', state: 'operational', workspace: 'console', engine: 'repair-sfc-verify-only', action: 'run', requiresAdmin: true }),
  svc({ id: 'repair-files-repair', world: 'repair', state: 'operational', workspace: 'wizard', engine: 'repair-sfc-scan-now', action: 'run', requiresAdmin: true }),
  svc({ id: 'repair-dns-flush', world: 'repair', state: 'operational', workspace: 'console', engine: 'repair-dns-flush', action: 'run', requiresAdmin: true }),
  svc({ id: 'repair-winsock-reset', world: 'repair', state: 'operational', workspace: 'wizard', engine: 'repair-winsock-reset', action: 'run', requiresAdmin: true }),
  svc({ id: 'repair-tcpip-reset', world: 'repair', state: 'operational', workspace: 'wizard', engine: 'repair-tcpip-reset', action: 'run', requiresAdmin: true }),
  svc({ id: 'repair-history', world: 'repair', state: 'partial', workspace: 'report', engine: null, action: 'review' }),
  svc({ id: 'repair-troubleshooters', world: 'repair', state: 'planned', workspace: 'matrix', engine: null, action: 'review' }),
  svc({ id: 'repair-restore-point', world: 'repair', state: 'planned', workspace: 'wizard', engine: null, action: 'run' }),
  svc({ id: 'repair-update-reset', world: 'repair', state: 'planned', workspace: 'inspector', engine: null, action: 'run' }),

  // Services — 3 engines. No deletion; protected services refuse.
  svc({ id: 'services-inventory', world: 'services', state: 'operational', workspace: 'inventory', engine: 'services-inventory', action: 'browse' }),
  svc({ id: 'services-control', world: 'services', state: 'operational', workspace: 'console', engine: 'service-control', action: 'run', requiresAdmin: true }),
  svc({ id: 'services-undo', world: 'services', state: 'operational', workspace: 'review', engine: 'service-startup-undo', action: 'run', requiresAdmin: true }),
  svc({ id: 'services-dependencies', world: 'services', state: 'partial', workspace: 'matrix', engine: null, action: 'review' }),
  svc({ id: 'services-protected', world: 'services', state: 'partial', workspace: 'inspector', engine: null, action: 'review' }),
  svc({ id: 'services-search', world: 'services', state: 'partial', workspace: 'search', engine: null, action: 'browse' }),
  svc({ id: 'services-startup-report', world: 'services', state: 'planned', workspace: 'report', engine: null, action: 'review' }),
  svc({ id: 'services-state-history', world: 'services', state: 'planned', workspace: 'monitor', engine: null, action: 'review' }),
  svc({ id: 'services-dependents', world: 'services', state: 'planned', workspace: 'atlas', engine: null, action: 'review' }),
  svc({ id: 'services-diagnose', world: 'services', state: 'planned', workspace: 'wizard', engine: null, action: 'run' }),
  svc({ id: 'services-config', world: 'services', state: 'planned', workspace: 'console', engine: null, action: 'run' }),
  svc({ id: 'services-perf', world: 'services', state: 'planned', workspace: 'matrix', engine: null, action: 'review' }),

  // Network — 1 engine (read-only). No topology, no ping/traceroute.
  svc({ id: 'network-interfaces', world: 'network', state: 'operational', workspace: 'atlas', engine: 'network-diagnostics', action: 'browse' }),
  svc({ id: 'network-dns-config', world: 'network', state: 'partial', workspace: 'inspector', engine: null, action: 'review' }),
  svc({ id: 'network-adapters', world: 'network', state: 'partial', workspace: 'report', engine: null, action: 'browse' }),
  svc({ id: 'network-connectivity', world: 'network', state: 'planned', workspace: 'monitor', engine: null, action: 'run' }),
  svc({ id: 'network-throughput', world: 'network', state: 'planned', workspace: 'monitor', engine: null, action: 'review' }),
  svc({ id: 'network-traceroute', world: 'network', state: 'planned', workspace: 'map', engine: null, action: 'run' }),
  svc({ id: 'network-topology', world: 'network', state: 'planned', workspace: 'map', engine: null, action: 'review' }),
  svc({ id: 'network-ports', world: 'network', state: 'planned', workspace: 'console', engine: null, action: 'review' }),
  svc({ id: 'network-wifi', world: 'network', state: 'planned', workspace: 'inventory', engine: null, action: 'browse' }),
  svc({ id: 'network-hosts', world: 'network', state: 'planned', workspace: 'review', engine: null, action: 'review' }),
  svc({ id: 'network-proxies', world: 'network', state: 'planned', workspace: 'inspector', engine: null, action: 'review' }),
  svc({ id: 'network-repair-link', world: 'network', state: 'planned', workspace: 'wizard', engine: null, action: 'run' }),

  // Hardware — 2 engines. Temperatures are not available.
  svc({ id: 'hardware-inventory', world: 'hardware', state: 'operational', workspace: 'inventory', engine: 'hardware-inventory', action: 'browse' }),
  svc({ id: 'hardware-battery', world: 'hardware', state: 'operational', workspace: 'monitor', engine: 'battery-status', action: 'browse' }),
  svc({ id: 'hardware-cpu', world: 'hardware', state: 'partial', workspace: 'report', engine: null, action: 'browse' }),
  svc({ id: 'hardware-gpu', world: 'hardware', state: 'partial', workspace: 'matrix', engine: null, action: 'browse' }),
  svc({ id: 'hardware-memory', world: 'hardware', state: 'partial', workspace: 'map', engine: null, action: 'browse' }),
  svc({ id: 'hardware-cycles', world: 'hardware', state: 'partial', workspace: 'review', engine: null, action: 'review' }),
  svc({ id: 'hardware-thermal', world: 'hardware', state: 'planned', workspace: 'monitor', engine: null, action: 'review' }),
  svc({ id: 'hardware-disks', world: 'hardware', state: 'planned', workspace: 'inspector', engine: null, action: 'browse' }),
  svc({ id: 'hardware-usb', world: 'hardware', state: 'planned', workspace: 'inventory', engine: null, action: 'browse' }),
  svc({ id: 'hardware-display', world: 'hardware', state: 'planned', workspace: 'atlas', engine: null, action: 'browse' }),
  svc({ id: 'hardware-audio', world: 'hardware', state: 'planned', workspace: 'matrix', engine: null, action: 'browse' }),
  svc({ id: 'hardware-health-report', world: 'hardware', state: 'planned', workspace: 'report', engine: null, action: 'review' }),

  // Automation — no engines of its own; schedules an allowlist of read-only tools via schtasks.
  svc({ id: 'auto-smart-scan', world: 'automation', state: 'operational', workspace: 'scheduler', engine: 'smart-scan', action: 'schedule' }),
  svc({ id: 'auto-schedule-manager', world: 'automation', state: 'operational', workspace: 'console', engine: null, native: 'schtasks', action: 'review' }),
  svc({ id: 'auto-run-history', world: 'automation', state: 'partial', workspace: 'report', engine: null, action: 'review' }),
  svc({ id: 'auto-templates', world: 'automation', state: 'partial', workspace: 'wizard', engine: null, action: 'run' }),
  svc({ id: 'auto-schedule-plan', world: 'automation', state: 'partial', workspace: 'atlas', engine: null, action: 'review' }),
  svc({ id: 'auto-cleanup-plan', world: 'automation', state: 'planned', workspace: 'scheduler', engine: null, action: 'schedule' }),
  svc({ id: 'auto-notify', world: 'automation', state: 'planned', workspace: 'monitor', engine: null, action: 'review' }),
  svc({ id: 'auto-quiet-hours', world: 'automation', state: 'planned', workspace: 'inspector', engine: null, action: 'review' }),
  svc({ id: 'auto-battery-policy', world: 'automation', state: 'planned', workspace: 'matrix', engine: null, action: 'review' }),
  svc({ id: 'auto-retention', world: 'automation', state: 'planned', workspace: 'console', engine: null, action: 'run' }),
  svc({ id: 'auto-export', world: 'automation', state: 'planned', workspace: 'report', engine: null, action: 'run' }),
  svc({ id: 'auto-backup-plan', world: 'automation', state: 'planned', workspace: 'wizard', engine: null, action: 'run' })
];

const byWorld = new Map<WorldId, ServiceDefinition[]>();
for (const service of serviceCatalog) {
  const bucket = byWorld.get(service.world);
  if (bucket) bucket.push(service);
  else byWorld.set(service.world, [service]);
}

const index = new Map<string, ServiceDefinition>(serviceCatalog.map(service => [service.id, service]));

export function servicesForWorld(world: WorldId): ServiceDefinition[] {
  return byWorld.get(world) ?? [];
}

export function serviceById(id: string): ServiceDefinition | undefined {
  return index.get(id);
}

export function stateLabelKey(state: ServiceState): string {
  return `svc.state.${state}`;
}

export function countByState(world: WorldId): Record<ServiceState, number> {
  const counts: Record<ServiceState, number> = { operational: 0, partial: 0, planned: 0 };
  for (const service of servicesForWorld(world)) counts[service.state] += 1;
  return counts;
}
