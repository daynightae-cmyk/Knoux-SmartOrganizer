# Tool Completion Matrix

| ID | Category | Handler | Read / Write | Admin | Dry run | Cancel | Undo | Tests | Packaged verification |
|---|---|---|---|---:|---:|---:|---:|---|---|
| system-health | system | `systemHealth` | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |
| smart-scan | scan | `smartScan` | Read | No | N/A | Yes | N/A | Contract | Smoke pending final gate |
| disk-overview | storage | `diskOverview` | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |
| large-files | storage | `scanLargeFiles` | Read | No | N/A | Yes | N/A | Contract | Smoke pending final gate |
| duplicate-files | storage | `scanDuplicates` | Read | No | N/A | Yes | N/A | Contract | Smoke pending final gate |
| empty-folders | files | `walk` + empty check | Read | No | N/A | Yes | N/A | Contract | Smoke pending final gate |
| downloads-inventory | files | `walk` | Read | No | N/A | Yes | N/A | Contract | Smoke pending final gate |
| temp-cleanup-preview | cleanup | `walk` preview | Read | No | N/A | Yes | N/A | Contract | Smoke pending final gate |
| startup-items | startup | bounded registry reader | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |
| installed-apps | applications | bounded registry reader | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |
| network-diagnostics | network | OS network API + DNS reader | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |
| hardware-inventory | hardware | bounded CIM query | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |
| event-warnings | system | bounded event-log reader | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |
| file-hash | files | Node streaming hash | Read | No | N/A | N/A | N/A | Contract | Smoke pending final gate |

No write-capable, administrator, destructive, service-control, repair, or cleanup action is registered. The UI must not imply that unavailable actions exist.
| organize-downloads-preview | files | `organizePreview` | Read | No | Yes | Yes | N/A | Contract | Packaged verification pending final gate |
| organize-downloads-apply | files | `organizeApply` | Write | No | No | Yes | Yes | Contract | Packaged verification pending final gate |
| organize-downloads-undo | files | `organizeUndo` | Write | No | No | Yes | Yes | Contract | Packaged verification pending final gate |
