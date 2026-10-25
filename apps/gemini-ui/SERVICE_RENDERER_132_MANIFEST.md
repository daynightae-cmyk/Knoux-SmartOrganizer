# KNOuX SmartOrganizer — 132 Service Visual Workspace Manifest & Audit Report
**Date:** 2026-10-24  
**Project:** KNOuX SmartOrganizer — Visual Workspace Implementation  
**Status:** UI-ONLY VISUAL RENDERERS INTEGRATED (Phase Two Native Data Detached)

---

## 1. Executive Summary & Boundaries
All 132 canonical service IDs across 11 visual worlds (Applications, Files, Storage, Cleanup, Startup, System, Repair, Services, Network, Hardware, Automation — 12 services per world) are mapped, typed, and rendered using 18 domain-specific visual renderer families inside `ServiceWorkspaceHost.tsx`.

- **Safety & Boundary Contract:** `nativeExecutionEnabled: false` is strictly enforced across all 132 descriptors.
- **Visual Banners:** All workspaces feature the mandatory notice:  
  `DESIGN PREVIEW • NOT CONNECTED • NO WINDOWS CHANGES`
- **Host Page Preservation:** Approved screenshot compositions (REF-00…REF-10) and page structures are 100% preserved. Service cards open contextual workspace overlays that host domain visualizations without destroying parent world chrome.

---

## 2. 132 Canonical Service Renderer Matrix

| # | World | Canonical Service ID | Renderer Family | Risk Class | File Location / Path | Testable UI State |
|---|---|---|---|---|---|---|
| 1 | Applications | `app-inventory` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Filterable app table + dossier inspector |
| 2 | Applications | `app-identity` | Identity Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Certificate CA chain & thumbprint view |
| 3 | Applications | `app-search` | Search Console | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Multi-parameter search & fuzzy toggle |
| 4 | Applications | `app-publisher` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Publisher trust rating & app counts |
| 5 | Applications | `app-recent` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Recent changes timeline ledger |
| 6 | Applications | `app-uninstall-queue` | Staging + Impact Review | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Bulk uninstall tray & restore check |
| 7 | Applications | `app-leftovers` | Candidate Safety Ledger | Staged Change | `/src/components/renderers/FamilyRenderersTwo.tsx` | Orphan registry/AppData trace view |
| 8 | Applications | `app-updates` | Ledger+Dossier | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Pending app updates ribbon & inspect |
| 9 | Applications | `app-size` | Zoomable Treemap | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Software footprint size treemap |
| 10 | Applications | `app-store-packages` | Ledger+Dossier | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Package catalog & WinGet discover |
| 11 | Applications | `app-associations` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | File handler association matrix |
| 12 | Applications | `app-startup-impact` | Boot Register | Staged Change | `/src/components/renderers/FamilyRenderersTwo.tsx` | App boot impact rating & toggle draft |
| 13 | Files | `file-downloads-inventory` | File Ledger+Preview | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Downloads file ledger & document preview |
| 14 | Files | `file-organize-preview` | Visual Rule Builder | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Source -> Category -> Destination lanes |
| 15 | Files | `file-organize-apply` | Staging + Impact Review | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Before/after path diff & conflict check |
| 16 | Files | `file-organize-undo` | Repair Journal | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Reversible file transaction timeline |
| 17 | Files | `file-empty-folders` | Ledger+Dossier | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Empty folder skeleton tree |
| 18 | Files | `file-hash` | Identity Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | SHA-256 & SHA-512 digest verification |
| 19 | Files | `file-search` | Search Console | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Everything-style fast file search |
| 20 | Files | `file-type-map` | Zoomable Treemap | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Extension byte distribution donut |
| 21 | Files | `file-recents` | File Ledger+Preview | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Modification time histogram & list |
| 22 | Files | `file-largest` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Size-ranked large file bars |
| 23 | Files | `file-metadata` | Identity Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | NTFS attributes & EXIF inspector |
| 24 | Files | `file-provenance` | Identity Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Zone Identifier (MotW) origin proof |
| 25 | Storage | `storage-disks` | Volume Bays | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | C/D/E 3D volume bays & capacity |
| 26 | Storage | `storage-large-files` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Heavy file storage usage list |
| 27 | Storage | `storage-duplicates` | Candidate Safety Ledger | Staged Change | `/src/components/renderers/FamilyRenderersTwo.tsx` | Duplicate SHA-256 hash groups |
| 28 | Storage | `storage-treemap` | Zoomable Treemap | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Interactive proportional folder blocks |
| 29 | Storage | `storage-top-folders` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Top folders waterfall ranking |
| 30 | Storage | `storage-filetypes` | Zoomable Treemap | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Storage distribution by category |
| 31 | Storage | `storage-scan-overview` | Live Pulse Charts | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Drive scan coverage percentage rings |
| 32 | Storage | `storage-fragmentation` | Safe Diagnostics Console | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Drive TRIM & defrag guidance |
| 33 | Storage | `storage-smart` | Device Atlas | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Disk S.M.A.R.T. health & sensors |
| 34 | Storage | `storage-reclaim` | Staging + Impact Review | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Reclaimable space calculator & basket |
| 35 | Storage | `storage-history` | Live Pulse Charts | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Volume capacity trend timeline |
| 36 | Storage | `storage-removable` | Volume Bays | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Removable USB volume cards |
| 37 | Cleanup | `cleanup-temp-preview` | Candidate Safety Ledger | Staged Change | `/src/components/renderers/FamilyRenderersTwo.tsx` | Temporary files risk classifier |
| 38 | Cleanup | `cleanup-temp-quarantine` | Staging + Impact Review | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Safety quarantine review wizard |
| 39 | Cleanup | `cleanup-temp-undo` | Repair Journal | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Cleanup recovery & restoration console |
| 40 | Cleanup | `cleanup-quarantine-list` | Ledger+Dossier | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Vault file metadata inspector |
| 41 | Cleanup | `cleanup-estimate` | Candidate Safety Ledger | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Space savings breakdown calculator |
| 42 | Cleanup | `cleanup-recycle` | File Ledger+Preview | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Multi-volume Recycle Bin inspector |
| 43 | Cleanup | `cleanup-unused` | Candidate Safety Ledger | Staged Change | `/src/components/renderers/FamilyRenderersTwo.tsx` | Dormancy & age-band file explorer |
| 44 | Cleanup | `cleanup-update-cache` | Safe Diagnostics Console | Administrative | `/src/components/renderers/FamilyRenderersThree.tsx` | WinSxS & SoftwareDistribution gateway |
| 45 | Cleanup | `cleanup-browser-cache` | Candidate Safety Ledger | Staged Change | `/src/components/renderers/FamilyRenderersTwo.tsx` | Browser profile cache inspector |
| 46 | Cleanup | `cleanup-logs` | Ledger+Dossier | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Crash dump (.dmp) & log explorer |
| 47 | Cleanup | `cleanup-schedule` | Schedule Node Flow | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Automated cleanup schedule composer |
| 48 | Cleanup | `cleanup-reports` | Repair Journal | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Before/after cleanup evidence report |
| 49 | Startup | `startup-overview` | Boot Register | Staged Change | `/src/components/renderers/FamilyRenderersTwo.tsx` | Windows boot autorun register |
| 50 | Startup | `startup-disable` | Staging + Impact Review | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Autorun toggle impact preview |
| 51 | Startup | `startup-restore` | Repair Journal | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Startup rollback & restoration |
| 52 | Startup | `startup-sources` | Boot Register | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | HKCU/HKLM/Folders swimlanes |
| 53 | Startup | `startup-journal` | Repair Journal | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Startup change audit journal |
| 54 | Startup | `startup-filter` | Search Console | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Keyboard-first autorun query console |
| 55 | Startup | `startup-impact` | Boot Register | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Boot sequence impact timeline |
| 56 | Startup | `startup-services` | Service Commander Ledger | Staged Change | `/src/components/renderers/FamilyRenderersTwo.tsx` | Service boot policy matrix |
| 57 | Startup | `startup-tasks` | Boot Register | Staged Change | `/src/components/renderers/FamilyRenderersTwo.tsx` | Logon scheduled tasks timeline |
| 58 | Startup | `startup-delay` | Schedule Node Flow | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Delayed launch planner & offset |
| 59 | Startup | `startup-batch` | Staging + Impact Review | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Autorun batch staging tray |
| 60 | Startup | `startup-undo-all` | Repair Journal | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Mass rollback & recovery workspace |
| 61 | System | `system-health-check` | Live Pulse Charts | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | System pulse overview console |
| 62 | System | `system-events` | Search Console | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Event log severity ledger |
| 63 | System | `system-processes` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Active process PID register |
| 64 | System | `system-signatures` | Identity Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | System binary CA certificate inspector |
| 65 | System | `system-uptime` | Live Pulse Charts | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | System boot clock & session timeline |
| 66 | System | `system-perf` | Live Pulse Charts | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | CPU/RAM/Disk/Network pulse charts |
| 67 | System | `system-drivers` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Device driver WHQL inventory |
| 68 | System | `system-logs` | Search Console | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Event Log channel explorer |
| 69 | System | `system-resources` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Top resource consuming processes |
| 70 | System | `system-autostart` | Service Dependency Graph | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | App-to-process cross links |
| 71 | System | `system-services-map` | Service Dependency Graph | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | System service dependency network |
| 72 | System | `system-timeline` | Live Pulse Charts | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Unified system event timeline |
| 73 | Repair | `repair-component-check` | Safe Diagnostics Console | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | DISM CheckHealth checklist & console |
| 74 | Repair | `repair-component-scan` | Safe Diagnostics Console | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | DISM ScanHealth 7-stage console |
| 75 | Repair | `repair-component-restore` | Safe Diagnostics Console | Administrative | `/src/components/renderers/FamilyRenderersThree.tsx` | DISM RestoreHealth repair wizard |
| 76 | Repair | `repair-files-verify` | Safe Diagnostics Console | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | SFC VerifyOnly file shield |
| 77 | Repair | `repair-files-repair` | Safe Diagnostics Console | Administrative | `/src/components/renderers/FamilyRenderersThree.tsx` | SFC ScanNow file repair wizard |
| 78 | Repair | `repair-dns-flush` | Safe Diagnostics Console | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | DNS cache flush preview |
| 79 | Repair | `repair-winsock-reset` | Staging + Impact Review | Administrative | `/src/components/renderers/FamilyRenderersOne.tsx` | Winsock catalog risk review |
| 80 | Repair | `repair-tcpip-reset` | Staging + Impact Review | Administrative | `/src/components/renderers/FamilyRenderersOne.tsx` | TCP/IP stack reset config diff |
| 81 | Repair | `repair-history` | Repair Journal | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | System repair audit journal |
| 82 | Repair | `repair-troubleshooters` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Windows Troubleshooter gateway |
| 83 | Repair | `repair-restore-point` | Repair Journal | Administrative | `/src/components/renderers/FamilyRenderersThree.tsx` | System Restore Point inspector |
| 84 | Repair | `repair-update-reset` | Safe Diagnostics Console | Administrative | `/src/components/renderers/FamilyRenderersThree.tsx` | Windows Update servicing reset |
| 85 | Services | `services-inventory` | Service Commander Ledger | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Windows SCM service register |
| 86 | Services | `services-control` | Staging + Impact Review | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Service state change review & guard |
| 87 | Services | `services-undo` | Repair Journal | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Service startup policy undo journal |
| 88 | Services | `services-dependencies` | Service Dependency Graph | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Service dependency network |
| 89 | Services | `services-protected` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Protected Windows core services atlas |
| 90 | Services | `services-search` | Search Console | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | SCM query console |
| 91 | Services | `services-startup-report` | Zoomable Treemap | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Startup policy distribution analytics |
| 92 | Services | `services-state-history` | Live Pulse Charts | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Service state transition history |
| 93 | Services | `services-dependents` | Service Dependency Graph | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Cascade service dependency impact tree |
| 94 | Services | `services-diagnose` | Safe Diagnostics Console | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | SCM fault investigation console |
| 95 | Services | `services-config` | Staging + Impact Review | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Startup policy config diff |
| 96 | Services | `services-perf` | Live Pulse Charts | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Shared-process svchost.exe monitor |
| 97 | Network | `network-interfaces` | Network Topology | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Network interfaces NIC console |
| 98 | Network | `network-dns-config` | Identity Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | DNS resolver config dossier |
| 99 | Network | `network-adapters` | Device Atlas | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Network hardware atlas & rack |
| 100 | Network | `network-connectivity` | Safe Diagnostics Console | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Connectivity diagnostic step sequence |
| 101 | Network | `network-throughput` | Live Pulse Charts | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Real-time traffic throughput chart |
| 102 | Network | `network-traceroute` | Network Topology | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Hop route & latency visualizer |
| 103 | Network | `network-topology` | Network Topology | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | LAN topology & node map |
| 104 | Network | `network-ports` | Ledger+Dossier | Read-Only | `/src/components/renderers/FamilyRenderersOne.tsx` | Active socket & port explorer |
| 105 | Network | `network-wifi` | Device Atlas | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Wi-Fi status & signal instrument |
| 106 | Network | `network-hosts` | Identity Dossier | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Local hosts file inspector |
| 107 | Network | `network-proxies` | Network Topology | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Proxy & WinHTTP config graph |
| 108 | Network | `network-repair-link` | Staging + Impact Review | Administrative | `/src/components/renderers/FamilyRenderersOne.tsx` | Network recovery & reset gateway |
| 109 | Hardware | `hardware-inventory` | Device Atlas | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Device hardware atlas & components |
| 110 | Hardware | `hardware-battery` | Device Atlas | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Battery charge & health instrument |
| 111 | Hardware | `hardware-cpu` | Device Atlas | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | CPU architecture & core die |
| 112 | Hardware | `hardware-gpu` | Device Atlas | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | GPU graphics adapter bay & VRAM |
| 113 | Hardware | `hardware-memory` | Device Atlas | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | DIMM RAM slots & memory layout |
| 114 | Hardware | `hardware-cycles` | Live Pulse Charts | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Battery wear & cycle count ledger |
| 115 | Hardware | `hardware-thermal` | Device Atlas | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Thermal sensors & temperature board |
| 116 | Hardware | `hardware-disks` | Volume Bays | Read-Only | `/src/components/renderers/FamilyRenderersTwo.tsx` | Physical disk drives & bus interface |
| 117 | Hardware | `hardware-usb` | Device Atlas | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | USB controller & device topology |
| 118 | Hardware | `hardware-display` | Device Atlas | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Monitor topology & resolution canvas |
| 119 | Hardware | `hardware-audio` | Device Atlas | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Audio endpoint mixer & devices |
| 120 | Hardware | `hardware-health-report` | Repair Journal | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Hardware evidence & diagnostic report |
| 121 | Automation | `auto-smart-scan` | Schedule Node Flow | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Smart Scan automated node flow |
| 122 | Automation | `auto-schedule-manager` | Schedule Node Flow | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Weekly automation calendar |
| 123 | Automation | `auto-run-history` | Repair Journal | Read-Only | `/src/components/renderers/FamilyRenderersThree.tsx` | Automation run history timeline |
| 124 | Automation | `auto-templates` | Visual Rule Builder | Staged Change | `/src/components/renderers/FamilyRenderersOne.tsx` | Workflow template gallery |
| 125 | Automation | `auto-schedule-plan` | Schedule Node Flow | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Recurrence composer & cron preview |
| 126 | Automation | `auto-cleanup-plan` | Schedule Node Flow | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Safe automated cleanup pipeline |
| 127 | Automation | `auto-notify` | Schedule Node Flow | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Notification channel routing board |
| 128 | Automation | `auto-quiet-hours` | Schedule Node Flow | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Quiet hours 24-hour dial |
| 129 | Automation | `auto-battery-policy` | Schedule Node Flow | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Power-aware scheduler & battery gating |
| 130 | Automation | `auto-retention` | Schedule Node Flow | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Artifact retention policy timeline |
| 131 | Automation | `auto-export` | Schedule Node Flow | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Workflow export & schema transfer |
| 132 | Automation | `auto-backup-plan` | Schedule Node Flow | Staged Change | `/src/components/renderers/FamilyRenderersThree.tsx` | Backup flow & verification designer |

---

## 3. Core Verification & Code Quality Metrics
1. **Compilation Check (`compile_applet`):** Build succeeded cleanly with Vite production bundler.
2. **TypeScript Check (`lint_applet`):** `tsc --noEmit` returned 0 errors.
3. **Execution Guarding:** Every single service workspace is wired with `nativeExecutionEnabled: false`, preventing any unauthorized native OS mutation during UI preview.
