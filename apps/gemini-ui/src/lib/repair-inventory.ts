/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RiskLevel = 'None (Read-Only)' | 'Low Risk' | 'Medium Risk' | 'High Risk';
export type ToolStatus = 'Ready' | 'Ready to run' | 'View Only' | 'Running' | 'Requires Reboot' | 'Elevated';
export type RepairCategory = 'Component Store' | 'System Files' | 'Network Stack' | 'System Recovery';

export interface RepairToolMeta {
  id: string;
  serviceKey: string;
  name: string;
  title: string;
  command: string;
  category: RepairCategory;
  shortDescription: string;
  fullDescription: string;
  status: ToolStatus;
  statusBadgeText: string;
  iconType:
    | 'dism-check'
    | 'dism-scan'
    | 'dism-restore'
    | 'sfc-verify'
    | 'sfc-scan'
    | 'dns-flush'
    | 'winsock-reset'
    | 'tcpip-reset'
    | 'repair-history'
    | 'troubleshooters'
    | 'restore-point'
    | 'update-repair';
  whatItDoes: string[];
  prerequisites: Array<{
    text: string;
    satisfied: boolean;
  }>;
  privilegeRequirement: {
    level: 'Administrator access required' | 'Standard User' | 'System Kernel';
    description: string;
    elevationRequired: boolean;
  };
  riskAssessment: {
    level: RiskLevel;
    description: string;
    isDestructive: boolean;
  };
  expectedOutputPreview: string;
  executionStages: string[];
  durationEstimate: string;
  documentationUrl?: string;
}

export interface RepairDiagnosticStripItem {
  id: string;
  title: string;
  icon: 'cpu' | 'file-check' | 'network' | 'journal';
  statsOrSummary: string;
  statusText: string;
  statusType: 'normal' | 'verified' | 'nominal' | 'audit';
  lastCheckText?: string;
}

export interface RepairHistoryItem {
  id: string;
  timestamp: string;
  toolId: string;
  toolName: string;
  result: 'Success' | 'No Corruption' | 'Repaired' | 'Failed' | 'Aborted' | 'Clean' | 'Simulated';
  details: string;
  elevated: boolean;
  durationMs?: number;
}

export interface GuidedRepairStep {
  number: number;
  id: string;
  title: string;
  subtitle: string;
  status: 'completed' | 'active' | 'pending';
  highlightColor?: 'blue' | 'gold' | 'default';
}

/**
 * Maps a repair tool's operational key onto the canonical service workspace id
 * registered in the shared renderer registry (service-ui-renderers.ts).
 * Without this map the workspace host would silently fall back to the generic
 * "Ledger+Dossier" placeholder instead of the intended repair console.
 */
export const REPAIR_TOOL_WORKSPACE_MAP: Record<string, string> = {
  'dism-checkhealth': 'repair-component-check',
  'dism-scanhealth': 'repair-component-scan',
  'dism-restorehealth': 'repair-component-restore',
  'sfc-verifyonly': 'repair-files-verify',
  'sfc-scannow': 'repair-files-repair',
  'flush-dns': 'repair-dns-flush',
  'reset-winsock': 'repair-winsock-reset',
  'reset-tcpip': 'repair-tcpip-reset',
  'repair-history': 'repair-history',
  'windows-troubleshooters': 'repair-troubleshooters',
  'restore-point-review': 'repair-restore-point',
  'windows-update-repair': 'repair-update-repair',
};

/** Resolve the canonical workspace service id for a repair tool. */
export function resolveRepairWorkspaceId(tool: RepairToolMeta | string | null | undefined): string {
  if (!tool) return 'repair-component-check';
  const key = typeof tool === 'string' ? tool : tool.serviceKey || tool.id;
  return REPAIR_TOOL_WORKSPACE_MAP[key] || key;
}

export const INITIAL_DIAGNOSTIC_STRIP: RepairDiagnosticStripItem[] = [  {
    id: 'system-components',
    title: 'System Components',
    icon: 'cpu',
    statsOrSummary: 'CPU 12% | RAM 38% | Disk 62%',
    statusText: 'Core systems operating normally',
    statusType: 'normal'
  },
  {
    id: 'windows-file-integrity',
    title: 'Windows File Integrity',
    icon: 'file-check',
    statsOrSummary: 'No integrity violations detected',
    statusText: 'No integrity violations detected',
    statusType: 'verified',
    lastCheckText: 'Last checked: Today 10:24 PM'
  },
  {
    id: 'network-config',
    title: 'Network Configuration',
    icon: 'network',
    statsOrSummary: 'Configuration looks good',
    statusText: 'DNS, Winsock and TCP/IP nominal',
    statusType: 'nominal'
  },
  {
    id: 'repair-journal',
    title: 'Repair Journal',
    icon: 'journal',
    statsOrSummary: '0 repairs this session',
    statusText: 'Keep a record of all repair operations',
    statusType: 'audit'
  }
];

export const GUIDED_REPAIR_STEPS: GuidedRepairStep[] = [
  {
    number: 1,
    id: 'diagnose',
    title: 'Diagnose',
    subtitle: 'Identify the problem.',
    status: 'completed',
    highlightColor: 'blue'
  },
  {
    number: 2,
    id: 'inspect-evidence',
    title: 'Inspect Evidence',
    subtitle: 'Review details and logs.',
    status: 'completed',
    highlightColor: 'default'
  },
  {
    number: 3,
    id: 'choose-repair',
    title: 'Choose Repair',
    subtitle: 'Select the best tool.',
    status: 'completed',
    highlightColor: 'default'
  },
  {
    number: 4,
    id: 'review-impact',
    title: 'Review Impact',
    subtitle: 'Understand what will change.',
    status: 'completed',
    highlightColor: 'default'
  },
  {
    number: 5,
    id: 'confirm-permission',
    title: 'Confirm Permission',
    subtitle: 'Authorize with elevation.',
    status: 'active',
    highlightColor: 'gold'
  },
  {
    number: 6,
    id: 'execute',
    title: 'Execute',
    subtitle: 'Run the repair safely.',
    status: 'pending',
    highlightColor: 'default'
  },
  {
    number: 7,
    id: 'verify-result',
    title: 'Verify Result',
    subtitle: 'Check and confirm success.',
    status: 'pending',
    highlightColor: 'default'
  }
];

export const REPAIR_TOOLS_CATALOG: RepairToolMeta[] = [
  {
    id: 'repair-component-check',
    serviceKey: 'dism-checkhealth',
    name: 'DISM CheckHealth',
    title: 'DISM CheckHealth',
    command: 'DISM /Online /Cleanup-Image /CheckHealth',
    category: 'Component Store',
    shortDescription: 'Check if component store is healthy.',
    fullDescription:
      'Performs a fast check on the Windows component store to determine whether any corruption has previously been flagged by Windows Servicing. It queries the servicing database without deep sector scanning.',
    status: 'Ready',
    statusBadgeText: 'Ready to run',
    iconType: 'dism-check',
    whatItDoes: [
      'Checks the health flag of the component store',
      'Queries servicing event tags and CBS records',
      'Does not modify any files or registry settings'
    ],
    prerequisites: [
      { text: 'Windows must be running normally', satisfied: true },
      { text: 'Component store accessible (C:\\Windows\\WinSxS)', satisfied: true },
      { text: 'Fast verification (< 15 seconds)', satisfied: true }
    ],
    privilegeRequirement: {
      level: 'Administrator access required',
      description: 'This tool must be run with elevated privileges.',
      elevationRequired: true
    },
    riskAssessment: {
      level: 'None (Read-Only)',
      description: 'Read-only query. No changes or file rewrites are performed.',
      isDestructive: false
    },
    expectedOutputPreview: `Deployment Image Servicing and Management tool
Version: 10.0.22621.1

Image Version: 10.0.22621.3155

No component store corruption detected.
The operation completed successfully.`,
    executionStages: [
      'Initializing DISM service context',
      'Querying WinSxS servicing flags',
      'Parsing CBS state register',
      'Finalizing report'
    ],
    durationEstimate: '5 - 15 seconds'
  },
  {
    id: 'repair-component-scan',
    serviceKey: 'dism-scanhealth',
    name: 'DISM ScanHealth',
    title: 'DISM ScanHealth',
    command: 'DISM /Online /Cleanup-Image /ScanHealth',
    category: 'Component Store',
    shortDescription: 'Scan for component store corruption.',
    fullDescription:
      'Scans the Windows component store for corruption. This operation analyzes the component store and detects issues without making any changes to your system.',
    status: 'Ready',
    statusBadgeText: 'Ready to run',
    iconType: 'dism-scan',
    whatItDoes: [
      'Checks the health of the component store',
      'Detects corruption and inconsistencies',
      'Does not modify any files'
    ],
    prerequisites: [
      { text: 'Windows must be running normally', satisfied: true },
      { text: 'Sufficient disk space (at least 1 GB)', satisfied: true },
      { text: 'Be patient (scan may take several minutes)', satisfied: true }
    ],
    privilegeRequirement: {
      level: 'Administrator access required',
      description: 'This tool must be run with elevated privileges.',
      elevationRequired: true
    },
    riskAssessment: {
      level: 'Low Risk',
      description: 'Read-only operation. No changes are made to your system.',
      isDestructive: false
    },
    expectedOutputPreview: `Deployment Image Servicing and Management tool
Version: 10.0.22621.1

Image Version: 10.0.22621.3155

[==========================               ] 0.0%
Scanning component store...`,
    executionStages: [
      'Initializing DISM',
      'Scanning component store',
      'Analyzing results',
      'Finalizing'
    ],
    durationEstimate: '3 - 8 minutes'
  },
  {
    id: 'repair-component-restore',
    serviceKey: 'dism-restorehealth',
    name: 'DISM RestoreHealth',
    title: 'DISM RestoreHealth',
    command: 'DISM /Online /Cleanup-Image /RestoreHealth',
    category: 'Component Store',
    shortDescription: 'Repair component store corruption.',
    fullDescription:
      'Scans the component store for corruption and automatically downloads and replaces damaged or missing system payloads using Windows Update or specified WIM sources.',
    status: 'Ready',
    statusBadgeText: 'Ready to run',
    iconType: 'dism-restore',
    whatItDoes: [
      'Scans and repairs corrupted component store packages',
      'Downloads valid payload binaries via Windows Update service',
      'Updates CBS servicing transactions safely'
    ],
    prerequisites: [
      { text: 'Active Internet connection for Windows Update payload retrieval', satisfied: true },
      { text: 'At least 3 GB free disk space on Windows drive', satisfied: true },
      { text: 'Windows Update service running or reachable', satisfied: true }
    ],
    privilegeRequirement: {
      level: 'Administrator access required',
      description: 'This tool must be run with elevated privileges.',
      elevationRequired: true
    },
    riskAssessment: {
      level: 'Medium Risk',
      description: 'Modifies system component files. Creates backup rollback points.',
      isDestructive: false
    },
    expectedOutputPreview: `Deployment Image Servicing and Management tool
Version: 10.0.22621.1

Image Version: 10.0.22621.3155

[==========================               ] 12.3%
The restore operation completed successfully.
The component store corruption was repaired.`,
    executionStages: [
      'Initializing DISM servicing engine',
      'Auditing component manifests',
      'Downloading repair manifests from Windows Update',
      'Replacing compromised store binaries',
      'Verifying payload signatures'
    ],
    durationEstimate: '8 - 20 minutes'
  },
  {
    id: 'repair-files-verify',
    serviceKey: 'sfc-verifyonly',
    name: 'SFC VerifyOnly',
    title: 'SFC VerifyOnly',
    command: 'sfc /verifyonly',
    category: 'System Files',
    shortDescription: 'Verify system files without repairing.',
    fullDescription:
      'Runs System File Checker in audit mode. Scans the integrity of all protected system files without replacing or overwriting any files on disk.',
    status: 'Ready',
    statusBadgeText: 'Ready to run',
    iconType: 'sfc-verify',
    whatItDoes: [
      'Scans digital signatures of all core Windows system DLLs and EXEs',
      'Compares disk binaries against the trusted WinSxS baseline cache',
      'Logs discrepancies to %windir%\\Logs\\CBS\\CBS.log without alteration'
    ],
    prerequisites: [
      { text: 'Windows TrustedInstaller service operational', satisfied: true },
      { text: 'No concurrent Windows Update installation in progress', satisfied: true },
      { text: 'System drive accessible for read traversal', satisfied: true }
    ],
    privilegeRequirement: {
      level: 'Administrator access required',
      description: 'This tool must be run with elevated privileges.',
      elevationRequired: true
    },
    riskAssessment: {
      level: 'None (Read-Only)',
      description: 'Pure verification pass. Zero file modifications.',
      isDestructive: false
    },
    expectedOutputPreview: `Beginning system scan. This process will take some time.

Beginning verification phase of system scan.
Verification 0% complete.
Windows Resource Protection did not find any integrity violations.`,
    executionStages: [
      'Enumerating protected system file manifests',
      'Hashing system binaries (System32 & SysWOW64)',
      'Comparing hashes against signed component catalogs',
      'Generating audit ledger in CBS log'
    ],
    durationEstimate: '4 - 10 minutes'
  },
  {
    id: 'repair-files-repair',
    serviceKey: 'sfc-scannow',
    name: 'SFC ScanNow',
    title: 'SFC ScanNow',
    command: 'sfc /scannow',
    category: 'System Files',
    shortDescription: 'Scan and repair system files.',
    fullDescription:
      'Performs a comprehensive scan of protected operating system files and replaces damaged, modified, or missing binaries with verified versions from the local WinSxS store.',
    status: 'Ready',
    statusBadgeText: 'Ready to run',
    iconType: 'sfc-scan',
    whatItDoes: [
      'Verifies and repairs corrupted Windows system files',
      'Restores authentic Microsoft signed binaries',
      'Creates comprehensive CBS servicing transaction records'
    ],
    prerequisites: [
      { text: 'WinSxS component store is healthy (recommended DISM scan first)', satisfied: true },
      { text: 'At least 1.5 GB free disk space', satisfied: true },
      { text: 'System power connected (do not interrupt scan)', satisfied: true }
    ],
    privilegeRequirement: {
      level: 'Administrator access required',
      description: 'This tool must be run with elevated privileges.',
      elevationRequired: true
    },
    riskAssessment: {
      level: 'Low Risk',
      description: 'Replaces damaged files from trusted local store.',
      isDestructive: false
    },
    expectedOutputPreview: `Beginning system scan. This process will take some time.

Beginning verification phase of system scan.
Verification 100% complete.

Windows Resource Protection found corrupt files and successfully repaired them.
Details are included in the CBS.Log windir\\Logs\\CBS\\CBS.log.`,
    executionStages: [
      'Acquiring TrustedInstaller lock',
      'Scanning system catalogs',
      'Staging replacement binaries from WinSxS',
      'Applying atomic file replacements',
      'Committing CBS journal'
    ],
    durationEstimate: '5 - 12 minutes'
  },
  {
    id: 'repair-dns-flush',
    serviceKey: 'flush-dns',
    name: 'Flush DNS',
    title: 'Flush DNS',
    command: 'ipconfig /flushdns',
    category: 'Network Stack',
    shortDescription: 'Clear DNS resolver cache.',
    fullDescription:
      'Purges and resets the contents of the DNS client resolver cache. Essential for resolving stale hostnames, domain resolution errors, or redirected IP entries.',
    status: 'Ready',
    statusBadgeText: 'Ready to run',
    iconType: 'dns-flush',
    whatItDoes: [
      'Flushes all cached DNS host-to-IP resolution records',
      'Forces fresh DNS name server lookups on next query',
      'Resolves domain caching conflicts without disconnecting active sockets'
    ],
    prerequisites: [
      { text: 'DNS Client service (Dnscache) running', satisfied: true },
      { text: 'Network interface online or active', satisfied: true }
    ],
    privilegeRequirement: {
      level: 'Standard User',
      description: 'Can be executed under standard user or elevated permissions.',
      elevationRequired: false
    },
    riskAssessment: {
      level: 'None (Read-Only)',
      description: 'Safe operation. Stale resolver cache will re-populate automatically.',
      isDestructive: false
    },
    expectedOutputPreview: `Windows IP Configuration

Successfully flushed the DNS Resolver Cache.`,
    executionStages: [
      'Sending flush control code to Dnscache service',
      'Clearing memory cache entries',
      'Broadcasting cache invalidation event'
    ],
    durationEstimate: '< 2 seconds'
  },
  {
    id: 'repair-winsock-reset',
    serviceKey: 'reset-winsock',
    name: 'Reset Winsock',
    title: 'Reset Winsock',
    command: 'netsh winsock reset',
    category: 'Network Stack',
    shortDescription: 'Reset Winsock catalog to default.',
    fullDescription:
      'Resets the Windows Sockets (Winsock) API catalog back to default configuration. Restores clean network stack functionality when corrupted by third-party LSP filters or malware.',
    status: 'Ready',
    statusBadgeText: 'Ready to run',
    iconType: 'winsock-reset',
    whatItDoes: [
      'Resets the Winsock protocol catalog to default Windows state',
      'Removes orphaned Layered Service Providers (LSP)',
      'Restores basic network socket connectivity'
    ],
    prerequisites: [
      { text: 'System reboot will be required to complete catalog initialization', satisfied: true },
      { text: 'Save open browser and network application work', satisfied: true }
    ],
    privilegeRequirement: {
      level: 'Administrator access required',
      description: 'This tool must be run with elevated privileges.',
      elevationRequired: true
    },
    riskAssessment: {
      level: 'Low Risk',
      description: 'Resets network catalog. Custom proxy/VPN filters may need re-enabling.',
      isDestructive: false
    },
    expectedOutputPreview: `Successfully reset the Winsock Catalog.
You must restart the computer in order to complete the reset.`,
    executionStages: [
      'Backing up current Winsock registry keys',
      'Purging custom namespace providers',
      'Writing default Microsoft protocol catalog',
      'Flagging reboot requirement token'
    ],
    durationEstimate: '< 5 seconds'
  },
  {
    id: 'repair-tcpip-reset',
    serviceKey: 'reset-tcpip',
    name: 'Reset TCP/IP',
    title: 'Reset TCP/IP',
    command: 'netsh int ip reset',
    category: 'Network Stack',
    shortDescription: 'Reset TCP/IP stack to default.',
    fullDescription:
      'Rewrites registry keys used by the Internet Protocol (TCP/IP) stack back to factory defaults. Resolves persistent IP assignment, gateway, and routing configuration failures.',
    status: 'Ready',
    statusBadgeText: 'Ready to run',
    iconType: 'tcpip-reset',
    whatItDoes: [
      'Restores default TCP/IP stack registry parameters',
      'Resets unicast/multicast interface route tables',
      'Creates diagnostic log at %TEMP%\\resettcpip.txt'
    ],
    prerequisites: [
      { text: 'Requires machine restart to rebuild network stack driver bounds', satisfied: true },
      { text: 'Static IP configurations will revert to DHCP (record settings if custom)', satisfied: true }
    ],
    privilegeRequirement: {
      level: 'Administrator access required',
      description: 'This tool must be run with elevated privileges.',
      elevationRequired: true
    },
    riskAssessment: {
      level: 'Medium Risk',
      description: 'Reverts custom static IP/routing tables to DHCP defaults.',
      isDestructive: false
    },
    expectedOutputPreview: `Resetting Compartment Forwarding, OK!
Resetting Compartment, OK!
Resetting Control Protocol, OK!
Resetting Echo Sequence Response, OK!
Resetting Global, OK!
Resetting Interface, OK!
Restart the computer to complete this action.`,
    executionStages: [
      'Exporting current IP configuration dump',
      'Resetting TCP/IP protocol driver registry nodes',
      'Re-initializing loopback and primary adapter interfaces',
      'Generating audit report in temporary directory'
    ],
    durationEstimate: '< 8 seconds'
  },
  {
    id: 'repair-history',
    serviceKey: 'repair-history',
    name: 'Repair History',
    title: 'Repair History',
    command: 'Get-WinEvent -FilterHashtable @{LogName="Application"; ProviderName="Microsoft-Windows-Defrag","Microsoft-Windows-Servicing"}',
    category: 'System Recovery',
    shortDescription: 'View past repair operations.',
    fullDescription:
      'Provides a chronological audit of past repair operations, CBS servicing logs, SFC integrity events, and Windows Recovery transactions recorded on this machine.',
    status: 'View Only',
    statusBadgeText: 'View Only',
    iconType: 'repair-history',
    whatItDoes: [
      'Surfaces historical maintenance and repair journals',
      'Displays timestamp, executing binary, exit codes, and status',
      'Does not execute any repair actions or alter logs'
    ],
    prerequisites: [
      { text: 'Windows Event Log service (EventLog) running', satisfied: true },
      { text: 'Read access to %windir%\\System32\\winevt\\Logs', satisfied: true }
    ],
    privilegeRequirement: {
      level: 'Standard User',
      description: 'Read-only access to local audit journals.',
      elevationRequired: false
    },
    riskAssessment: {
      level: 'None (Read-Only)',
      description: 'Informational workspace only. Zero risk.',
      isDestructive: false
    },
    expectedOutputPreview: `Querying Windows Event Subsystem...
Audit entries verified: 0 repair sessions in current application lifetime.
Local CBS log available at C:\\Windows\\Logs\\CBS\\CBS.log`,
    executionStages: [
      'Connecting to Windows Event Log provider',
      'Querying Event ID 14 (SFC) and DISM events',
      'Parsing local KNOuX recovery session database',
      'Formatting chronological ledger'
    ],
    durationEstimate: '1 - 3 seconds'
  },
  {
    id: 'repair-troubleshooters',
    serviceKey: 'windows-troubleshooters',
    name: 'Windows Troubleshooters',
    title: 'Windows Troubleshooters',
    command: 'msdt.exe /id NetworkDiagnosticsWeb',
    category: 'System Recovery',
    shortDescription: 'Run built-in Windows troubleshooters.',
    fullDescription:
      'Launches genuine native Microsoft Diagnostics and Troubleshooting tools (MSDT) for audio, network adapter, Windows Update, Bluetooth, printer, and power subsystems.',
    status: 'Ready',
    statusBadgeText: 'Ready to run',
    iconType: 'troubleshooters',
    whatItDoes: [
      'Provides direct access to native Windows automated diagnostic wizards',
      'Tests network connectivity, audio endpoints, printer queues, and power plans',
      'Prompts user with interactive fixes before applying changes'
    ],
    prerequisites: [
      { text: 'Windows Diagnostic Policy Service (DPS) running', satisfied: true },
      { text: 'Interactive desktop session available', satisfied: true }
    ],
    privilegeRequirement: {
      level: 'Standard User',
      description: 'Troubleshooters request elevation automatically if system changes are needed.',
      elevationRequired: false
    },
    riskAssessment: {
      level: 'Low Risk',
      description: 'Interactive wizard walks through all suggested changes.',
      isDestructive: false
    },
    expectedOutputPreview: `Launching Microsoft Diagnostic and Troubleshooting Wizard...
Package ID: NetworkDiagnosticsWeb
Publisher: Microsoft Corporation
Running automated diagnostic verification...`,
    executionStages: [
      'Selecting subsystem diagnostic pack',
      'Verifying DPS daemon status',
      'Invoking native Windows MSDT wizard',
      'Listening for troubleshooting completion code'
    ],
    durationEstimate: 'Varies by wizard'
  },
  {
    id: 'repair-restore-point',
    serviceKey: 'restore-point-review',
    name: 'Restore Point Review',
    title: 'Restore Point Review',
    command: 'vssadmin list shadows /for=C:',
    category: 'System Recovery',
    shortDescription: 'Review available restore points.',
    fullDescription:
      'Enumerates Volume Shadow Copies and System Restore snapshots created by Windows and third-party installers. Allows reviewing snapshot creation dates, providers, and space usage.',
    status: 'Ready',
    statusBadgeText: 'Ready to run',
    iconType: 'restore-point',
    whatItDoes: [
      'Queries Volume Shadow Copy service (VSS) for shadow storage',
      'Lists snapshot dates, IDs, and restore point descriptions',
      'Allows verifying recovery capabilities before initiating high-impact operations'
    ],
    prerequisites: [
      { text: 'Volume Shadow Copy service (VSS) active', satisfied: true },
      { text: 'System Protection enabled on OS drive', satisfied: true }
    ],
    privilegeRequirement: {
      level: 'Administrator access required',
      description: 'This tool must be run with elevated privileges.',
      elevationRequired: true
    },
    riskAssessment: {
      level: 'None (Read-Only)',
      description: 'Audit of available snapshot storage. No rollback performed.',
      isDestructive: false
    },
    expectedOutputPreview: `vssadmin 1.1 - Volume Shadow Copy Service administrative command-line tool
(C) Copyright 2001-2013 Microsoft Corp.

Contents of shadow copy set ID: {7c2e6420-53cb-4f36-9a29-b684cb03e481}
   Contained 1 shadow copies at creation time: 10/24/2026 8:15:32 PM
      Shadow Copy ID: {b8a09f87-19de-4bb5-90ae-2f95c479366e}
      Original Volume: (C:)\\\\?\\Volume{6c1e5491-0000-0000-0000-602240000000}\\
      Shadow Copy Volume: \\\\?\\GLOBALROOT\\Device\\HarddiskVolumeShadowCopy1
      Provider: 'Microsoft Software Shadow Copy provider 1.0'
      Type: ClientAccessibleWriters
      Attributes: Persistent, Client-accessible, No auto release, Differential, Auto recovered`,
    executionStages: [
      'Pinging VSS provider daemon',
      'Enumerating shadow copy storage allocation',
      'Parsing snapshot timestamps and providers',
      'Verifying restore point integrity status'
    ],
    durationEstimate: '2 - 6 seconds'
  },
  {
    id: 'repair-update-reset',
    serviceKey: 'windows-update-repair',
    name: 'Windows Update Repair',
    title: 'Windows Update Repair',
    command: 'net stop wuauserv ; net stop bits ; Remove-Item -Recurse C:\\Windows\\SoftwareDistribution\\Download\\* ; net start wuauserv',
    category: 'System Recovery',
    shortDescription: 'Fix common Windows Update issues.',
    fullDescription:
      'Safely clears corrupted Windows Update staging downloads and caches. Stops the Windows Update service (wuauserv) and BITS, purges stuck partial downloads, and restarts servicing daemons.',
    status: 'Ready',
    statusBadgeText: 'Ready to run',
    iconType: 'update-repair',
    whatItDoes: [
      'Stops wuauserv, cryptSvc, and bits services',
      'Cleans corrupted files in %windir%\\SoftwareDistribution\\Download',
      'Re-registers update components and restarts services'
    ],
    prerequisites: [
      { text: 'No Windows Update installation currently applying', satisfied: true },
      { text: 'Administrator elevation confirmed', satisfied: true },
      { text: 'Free disk space available on Windows drive', satisfied: true }
    ],
    privilegeRequirement: {
      level: 'Administrator access required',
      description: 'This tool must be run with elevated privileges.',
      elevationRequired: true
    },
    riskAssessment: {
      level: 'Medium Risk',
      description: 'Purges temporary update staging cache. Preserves installed updates.',
      isDestructive: false
    },
    expectedOutputPreview: `The Windows Update service is stopping.
The Windows Update service was stopped successfully.
The Background Intelligent Transfer Service is stopping.
The Background Intelligent Transfer Service was stopped successfully.
Purging stale download staging directory...
The Windows Update service is starting.
The Windows Update service was started successfully.`,
    executionStages: [
      'Stopping Windows Update & BITS daemons',
      'Clearing SoftwareDistribution download staging',
      'Resetting Catroot2 catalog transaction logs',
      'Restarting update subsystem daemons',
      'Verifying service operational status'
    ],
    durationEstimate: '15 - 45 seconds'
  }
];
