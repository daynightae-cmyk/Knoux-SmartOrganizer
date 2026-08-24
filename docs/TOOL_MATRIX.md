# Tool Completion Matrix

| ID | Category | Handler | Read / Write | Admin | Dry run | Cancel | Undo | Tests | Packaged verification |
|---|---|---|---|---:|---:|---:|---:|---|---|
| system-health | system | `systemHealth` | Read | No | N/A | N/A | N/A | Contract | Packaged IPC PASS |
| smart-scan | scan | `smartScan` | Read | No | N/A | Yes | N/A | Contract | Smoke pending final gate |
| disk-overview | storage | `diskOverview` | Read | No | N/A | N/A | N/A | Contract | Packaged IPC PASS |
| large-files | storage | `scanLargeFiles` | Read | No | N/A | Yes | N/A | Contract | Packaged fixture PASS |
| duplicate-files | storage | `scanDuplicates` | Read | No | N/A | Yes | N/A | Contract | Packaged SHA-256 fixture PASS |
| empty-folders | files | `walk` + empty check | Read | No | N/A | Yes | N/A | Contract | Smoke pending final gate |
| downloads-inventory | files | `walk` | Read | No | N/A | Yes | N/A | Contract | Smoke pending final gate |
| temp-cleanup-preview | cleanup | `walk` preview | Read | No | N/A | Yes | N/A | Contract | Smoke pending final gate |
| startup-items | startup | bounded registry reader | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |
| installed-apps | applications | bounded registry reader | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |
| network-diagnostics | network | OS network API + DNS reader | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |
| hardware-inventory | hardware | bounded CIM query | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |
| event-warnings | system | bounded event-log reader | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |
| file-hash | files | Node streaming hash | Read | No | N/A | N/A | N/A | Contract | Packaged fixture PASS |

Every row is sourced from the runtime registry. Each enabled entry now has a strict input schema, structured output schema, concrete handler, availability probe, error path and renderer-safe serialized metadata. No arbitrary shell or command capability is exposed.

Administrator repair actions are fixed allowlist entries with capability probes, explicit confirmation and dry-run inspection; no arbitrary executable, argument, command or script reaches the renderer. Destructive and service-control actions are not registered yet. The UI derives availability from the registry and disables unavailable handlers.
| organize-downloads-preview | files | `organizePreview` | Read | No | Yes | Yes | N/A | Contract | Packaged fixture PASS |
| organize-downloads-apply | files | `organizeApply` | Write | No | No | Yes | Yes | Contract | Packaged fixture PASS |
| organize-downloads-undo | files | `organizeUndo` | Write | No | No | Yes | Yes | Contract | Packaged fixture PASS |
| repair-dism-check-health | repair | allowlisted `dism.exe /Online /Cleanup-Image /CheckHealth` | System | Yes | Yes | No | No | Allowlist + capability | Packaged dry-run PASS |
| repair-dism-scan-health | repair | allowlisted DISM ScanHealth | System | Yes | Yes | No | No | Allowlist + capability | Capability pending final gate |
| repair-dism-restore-health | repair | allowlisted DISM RestoreHealth | System | Yes | Yes | No | No | Allowlist + capability | Capability pending final gate |
| repair-sfc-verify-only | repair | allowlisted `sfc.exe /VerifyOnly` | Read | Yes | Yes | No | No | Allowlist + capability | Capability pending final gate |
| repair-sfc-scan-now | repair | allowlisted `sfc.exe /ScanNow` | System | Yes | Yes | No | No | Allowlist + capability | Capability pending final gate |
| repair-dns-flush | repair | allowlisted `ipconfig.exe /flushdns` | System | Yes | Yes | No | No | Allowlist + capability | Capability pending final gate |
| repair-winsock-reset | repair | allowlisted `netsh.exe winsock reset` | System | Yes | Yes | No | No | Allowlist + capability | Capability pending final gate |
| repair-tcpip-reset | repair | allowlisted `netsh.exe int ip reset` | System | Yes | Yes | No | No | Allowlist + capability | Capability pending final gate |
