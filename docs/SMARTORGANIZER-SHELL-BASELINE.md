# SmartOrganizer Shell Migration Baseline

Recorded before any shell-migration change. Facts below were computed from the real
repository at the recorded commit, not assumed from the mission brief.

## Authority

| Item | Value |
| --- | --- |
| Remote | https://github.com/daynightae-cmyk/Knoux-SmartOrganizer.git |
| Canonical branch | `main` |
| Baseline origin/main SHA | `558aea316a7b2ae562c39acfec8d1a97461e9524` |
| Implementation branch | `feat/smartorganizer-tailadmin-unified-shell-20260925` |
| Implementation worktree | dedicated Traycer worktree (branch cut from origin/main) |
| Local copy `D:\...\01_Ready\Knoux-SmartOrganizer` | not a git checkout; byte-identical to origin/main `558aea3` except `.git` pointer (no unique local work to preserve) |
| Sibling repo `D:\...\Knoux_SmartOrganizer` | unrelated checkout on `feat/final-windows-production-distribution` — left untouched |
| Donor ZIP | `D:\Knoux Projects\Knoux_Project_Center\01_Ready\free-react-tailwind-admin-dashboard-main.zip` (TailAdmin React 2.4.0, MIT) |

## Source baseline (at `558aea3`)

| Gate | Result |
| --- | --- |
| `npm run check` (tsc) | PASS (exit 0) |
| `npm run lint` (eslint --max-warnings=0) | PASS (exit 0) |
| `npm test` (vitest) | PASS — 8 files, 44 tests |
| `npm run build` (vite) | PASS — JS 996.06 kB (gzip 200.63), CSS 13.92 kB (gzip 3.82) |
| Node | 26.9.0 local / node 22 in CI |
| npm | 12.0.2 local |

Bundle note: `src/App.tsx` imports `import * as Icon from 'lucide-react'`, which defeats
tree-shaking and dominates the 996 kB renderer bundle. The migration replaces this with
named imports; the expected reduction is recorded after implementation.

## Registry truth (computed from `electron/tool-registry.cjs` via `serializeRegistry`)

- Registered tools: **34**
- Categories (11): applications 1, cleanup 3, files 6, hardware 2, network 1, repair 8, scan 1, services 3, startup 3, storage 3, system 3
- `requiresAdmin`: **10** (8 repair tools, service-control, service-startup-undo)
- `supportsUndo`: **7** (organize-downloads-apply/-undo, temp-cleanup-apply/-undo, startup-disable/-restore, service-control)
- `supportsProgress`: **12**
- `supportsCancel`: **12**
- `supportsDryRun`: **15**
- `supportsExport`: **34**
- Risk levels: read-only 18, safe-write 6, administrator 10
- Availability on win32: 34/34 available (probe: `windows-local` / `windows-elevation`)

## Operation lifecycle (from `shared/contracts.ts` + `electron/main.cjs`)

Phases actually emitted by the backend:
`queued → preflight → (awaiting-confirmation for non read-only) → (awaiting-admin for admin non-dry-run) → running → progress… → result → completed` and terminal `cancelled | failed`.
Cancellation is honored by the engines (`walk`, duplicate hashing, organize/cleanup loops).
Undo journals are written for organize-downloads-apply, temp-cleanup-apply, startup-disable
and service-control (startup-mode changes) and consumed by the matching undo tools.

## Smart Scan engine truth (`electron/main.cjs` smartScan)

Seven real stages, each emitting a real progress event with message text:
1. Measured system health
2. Read storage volumes and pressure
3. Built Downloads storage intelligence (files ≥ 100 MB in Downloads)
4. Reviewed sensitive filenames using metadata only
5. Verified exact duplicate groups with SHA-256
6. Measured recoverable temporary-file footprint
7. Completed local multi-signal Smart Scan

The result summary contains a backend-computed `smartScore` with `scoreReasons`
(`advancedLocal.buildSmartScore`) plus volumes, storage intelligence, duplicate,
privacy (metadata-only) and temp footprints. The UI must render this data; it must not
invent its own composite score.

## Electron security architecture (preserved)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, `enableRemoteModule: false`
- preload exposes only explicit `window.knoux` methods (no generic invoke passthrough)
- all IPC channels are explicit `knoux:*` handlers; unknown tool IDs rejected; Zod validation at every boundary
- privileged runner allowlists DISM/SFC/ipconfig/netsh/service operations; protected services list enforced
- renderer never touches `child_process`

## Known baseline debt / observations

- `src/App.tsx` (48.5 kB) contains effectively the whole UI in minified single-line components.
- Renderer bundle 996 kB caused by the wildcard lucide import (bundle debt, not a failure).
- `vitest` 3.x, React 18.3, Vite 6.4, Electron 43.4 — all kept; no framework upgrades.
- npm 12 blocks postinstall scripts unless approved; `esbuild` and `@swc/core` are now
  explicitly approved via the `allowScripts` field in `package.json` (supply-chain intent
  recorded in-repo; harmless under npm 10 in CI).

## UI donor decision (record)

TailAdmin React 2.4.0 (MIT) is used strictly as a layout/interaction donor: sidebar
provider with collapse + hover-expand, header with Ctrl+K search focus, backdrop drawer
below the desktop breakpoint, grouped navigation pattern. No Tailwind, no donor
dependencies, no donor pages are introduced. See `docs/THIRD_PARTY_UI_SOURCES.md`.