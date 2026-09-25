# SmartOrganizer Shell Architecture (Unified Workspace)

## Decision: Option B — port donor primitives into the existing CSS system

TailAdmin React 2.4.0 (MIT) is a **visual/shell donor only**. No Tailwind, no donor
dependencies, no donor pages, no framework upgrades (React 18.3, Vite 6.4,
Electron 43.4 kept). Rationale:

- Less runtime risk: existing Electron packaged-rendering path untouched.
- Fewer dependencies: zero new runtime dependencies (`lucide-react`, `react`,
  `react-dom`, `zod` unchanged).
- Smaller bundle: renderer JS **996.06 kB → 303.58 kB** (gzip 200.63 → 85.64)
  by replacing the `import * as Icon` wildcard with named imports; CSS
  13.92 kB → 24.25 kB (additive `src/shell.css` for sidebar/palette/drawer/tables).
- Simpler maintenance: one token system (`index.css` variables), no duplicate
  reset layers or conflicting utility systems.

## What was preserved (unchanged)

| Layer | State |
| --- | --- |
| Electron main (`electron/main.cjs`) | PRESERVED |
| Preload bridge (`electron/preload.cjs`, explicit `window.knoux` methods) | PRESERVED |
| IPC channels (`knoux:*`, Zod at every boundary, unknown tool IDs rejected) | PRESERVED |
| Tool registry (34 tools, 11 categories) | PRESERVED |
| Contracts (`shared/contracts.ts`, operation phases) | PRESERVED |
| Settings schema and persistence | PRESERVED |
| Localization (`src/locales.ts`, extended with shell vocabulary) | ADAPTED (additive keys only) |
| Security posture (contextIsolation, no nodeIntegration, allowlisted privileged runner) | PRESERVED |

## What was adapted (donor concepts, re-implemented)

- Sidebar provider (collapse / hover-expand / overlay below 900px) → `src/shell/Sidebar.tsx` + `shell.css`.
- AppLayout shape (fixed sidebar + sticky header + content) → `src/shell/AppShell.tsx`.
- Backdrop drawer → `AppShell.tsx` + `OperationDrawer.tsx` + CSS.
- Header Ctrl+K search → full command palette (`src/shell/CommandPalette.tsx`).
- Grouped navigation → registry-driven groups (`src/lib/pages.ts`).
- Cards/badges/tables → `src/components/tools/*`, `src/pages/renderers.tsx`.

## New structure

```text
src/
  App.tsx                  # composition root (StoreProvider + AppShell + router)
  main.tsx                 # imports index.css + shell.css
  index.css                # existing token system (untouched)
  shell.css                # additive shell layer (Option B)
  locales.ts               # extended with shell vocabulary (ar/en)
  lib/
    format.ts icons.tsx pages.ts search.ts   # presentation helpers
    guards.ts              # pure run/confirm/undo/cancel/filter guards
    smartscan.ts           # 7-stage mapping from real progress events
  state/
    store.tsx types.ts     # central store (tools/settings/history/automation/health/page/event/result)
  shell/
    AppShell.tsx Sidebar.tsx Header.tsx CommandPalette.tsx OperationDrawer.tsx
  components/
    common.tsx             # SectionTitle/EmptyState/StatCard
    tools/
      ToolBadges.tsx ToolCards.tsx ToolRunner.tsx ToolResult.tsx
  pages/
    HomePage.tsx SmartScanPage.tsx CatalogPage.tsx renderers.tsx
    AutomationPage.tsx HistoryPage.tsx SettingsPage.tsx
```

`src/App.tsx` went from a 48.5 kB monolith (whole UI in minified single-line
components) to a 32-line composition root. All tool presentation is driven by
`window.knoux.listTools()`; no static tool metadata is duplicated. The command
palette never executes tools directly — selecting an admin/destructive tool
opens its workspace where the normal confirmation path applies.

## Operation lifecycle (verified from backend)

`queued → preflight → awaiting-confirmation (non-read-only) →
awaiting-admin (admin, non-dry-run) → running → progress… → result →
completed`, terminal `cancelled | failed`. Smart Scan emits 7 real progress
events (`current/total = n/7`); the UI maps `current` directly and never
invents sub-stages. The Smart Scan score shown is the backend-computed
`smartScore` with `scoreReasons`; the Home page shows component status only
(memory, free space, uptime, CPU) and no composite health score.

## Offline / security

No Google Fonts, CDN JS/CSS, remote icons, analytics, or external images were
introduced (all assets bundled locally). Packaged verification commands use
`--publish never` so no `GH_TOKEN` is required (`desktop:pack`,
`desktop:dist`; `desktop:dist:release` retains the publish-capable path for a
signed release with trusted material).
