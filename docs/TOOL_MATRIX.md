# Tool Completion Matrix

| ID | Category | Handler | Capability | Admin | Dry run | Cancel | Undo | Validation | Packaged proof |
|---|---|---|---|---:|---:|---:|---:|---|---|
| `system-health` | system | `systemHealth` | Read | No | No | No | No | Registry + localization | Packaged IPC pass |
| `smart-scan` | scan | `smartScan` | Read | No | No | Yes | No | Registry + localization | Packaged core smoke |
| `disk-overview` | storage | `diskOverview` | Read | No | No | No | No | Registry + localization | Packaged IPC pass |
| `large-files` | storage | `scanLargeFiles` | Read | No | No | Yes | No | Strict folder/schema | Packaged fixture pass |
| `duplicate-files` | storage | `scanDuplicates` | Read | No | No | Yes | No | SHA-256 verification | Packaged fixture pass |
| `empty-folders` | files | `walk` + empty check | Read | No | No | Yes | No | Registry + localization | Packaged disposable fixture pass |
| `downloads-inventory` | files | `walk` | Read | No | No | Yes | No | Registry + localization | Packaged smoke pass |
| `organize-downloads-preview` | files | `organizePreview` | Read | No | Yes | Yes | No | Strict folder/schema | Packaged fixture pass |
| `organize-downloads-apply` | files | `organizeApply` | Safe write | No | No | Yes | Yes | Explicit confirmation | Packaged apply/undo pass |
| `organize-downloads-undo` | files | `organizeUndo` | Safe write | No | No | Yes | Yes | UUID journal | Packaged apply/undo pass |
| `temp-cleanup-preview` | cleanup | `tempCleanupCandidates` | Read | No | Yes | Yes | No | Strict limit/schema | Packaged disposable-fixture pass |
| `temp-cleanup-apply` | cleanup | local quarantine | Safe write | No | Yes | Yes | Yes | Explicit confirmation; no permanent delete | Packaged quarantine pass |
| `temp-cleanup-undo` | cleanup | local quarantine restore | Safe write | No | No | Yes | Yes | UUID journal | Packaged restoration pass |
| `startup-items` | startup | bounded registry reader | Read | No | No | No | No | Registry + localization | Packaged smoke pass |
| `startup-disable` | startup | exact HKCU Run value removal | Safe write | No | Yes | No | Yes | Strict value name, confirmation, local undo journal | Packaged isolated disable/restore pass |
| `startup-restore` | startup | exact local journal restore | Safe write | No | Yes | No | Yes | Strict UUID journal; refuses overwrite | Packaged isolated restore pass |
| `installed-apps` | applications | bounded registry reader | Read | No | No | No | No | Registry + localization | Packaged smoke pass |
| `network-diagnostics` | network | OS network API + DNS reader | Read | No | No | No | No | Registry + localization | Packaged smoke pass |
| `hardware-inventory` | hardware | bounded CIM query | Read | No | No | No | No | Registry + localization | Packaged smoke pass |
| `event-warnings` | system | bounded event-log reader | Read | No | No | No | No | Registry + localization | Packaged smoke pass |
| `process-inventory` | system | bounded process reader | Read | No | No | No | No | Registry + localization | Packaged smoke pass |
| `battery-status` | hardware | bounded battery CIM reader | Read | No | No | No | No | Registry + localization | Packaged smoke pass |
| `file-hash` | files | streaming SHA-256/SHA-512 | Read | No | No | No | No | Strict file/schema | Packaged fixture pass |
| `repair-*` (8) | repair | privileged allowlist | System change | Yes | Yes | No | No | Frozen specs + injection tests | Packaged dry-run pass |
| `services-inventory` | services | bounded CIM + registry reader | Read | No | No | No | No | Registry + localization | Packaged inventory pass |
| `service-control` | services | `sc.exe` fixed actions | Administrator | Yes | Yes | No | Startup only | Strict service/action schema; protected denylist | Packaged non-protected `manual` dry-run pass; no live service change by safety design |
| `service-startup-undo` | services | fixed prior startup action | Administrator | Yes | Yes | No | Yes | UUID journal | Contract and strict journal coverage; no live service change by safety design |

## Automation surface

The automation module is **not** a command runner. It accepts only five read-only tool IDs, validates daily, weekly, monthly, or startup triggers, and creates, pauses, resumes, deletes, and records named Windows Task Scheduler jobs. It never schedules cleanup apply/undo, repair, service control, or arbitrary commands. Its persistence and action allowlist are covered by `tests/automation.test.ts`.

## Security invariants

Every registered tool has a concrete handler, strict input schema, structured output schema, capability probe, and renderer-safe serialized metadata. Administrator actions are supplied only by fixed operation IDs; the renderer never receives executable paths, argument arrays, commands, or scripts. The registry and privileged runner are exercised by rejection, immutability, non-Windows, missing-component, dry-run, injection, and non-zero-exit tests.
