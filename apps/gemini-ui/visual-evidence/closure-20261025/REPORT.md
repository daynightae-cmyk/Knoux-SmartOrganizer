# KNOuX Gemini UI — Visual Closure Dossier

**Date:** 2026-10-25  
**Branch:** `feat/gemini-ui-foundation-20261025`  
**Scope:** the standalone Gemini renderer (`apps/gemini-ui`) — 14 routes, desktop-first  
**Status:** visual phase complete; native Windows execution remains intentionally disconnected

This dossier records the fixes made in this pass, the evidence behind them, the automated
checks that now pass, and the honest limitations that remain. It is written for a director
review, not as marketing copy.

---

## 1. Outcome

The approved art direction is preserved: deep-navy surfaces, cyan/violet instrumentation,
cinematic Earth horizons, and bounded panel composition. The work below turns that direction
into a usable, reachable renderer rather than a collection of pretty but clipping screens.

Three issues were explicitly called out in the addendum. All three are fixed:

1. **Startup — telemetry overlap and the twelve boot services buried below the fold.**
   The register and the 12-domain matrix now live in a **bounded workspace with two visible tabs**.
   The footer telemetry chip is collapsed by default; when expanded it is a bounded, scrollable
   inspector in the footer flow and can never paint over the staged decision bar. The flex body
   now has `min-h-0`; the main canvas scrolls internally only when the expanded inspector needs
   the room. A 12/12 service-card assertion and a service-workspace open/close assertion pass.

2. **System — wasted whitespace and 12 diagnostics hidden below the fold.**
   The four live instruments, waterfall, register and all twelve diagnostics are visible in one
   workspace at 1366×768. At compact desktop heights the gauges compact, the timeline canvas
   keeps a usable plot, the diagnostics lose descriptions but keep their 12 buttons, and the
   ledger/diagnostics area shares a bounded row without covering the global controls.

3. **Smart Scan — five results rows visible instead of ~nine.**
   The scan workspace is now a fixed-height, internally scrolling composition. Descriptions
   collapse at compact heights, filters stay on one line, and the table row rhythm is 30px.
   At 1672×941 all **eight available fixture findings** are visible; at 1366×768 five are
   visible with the remaining rows reachable through the bounded table scroller.

The three Qoder edits were also verified:

- **CleanupPage ledger scroller:** the table retains a working horizontal scroller
  (`clientWidth 693 → scrollWidth 820`, scrolled to 127 in the runtime audit). At compact
  widths the redundant Source and Age columns are hidden so the Safety verdict and Inspect
  action remain visible without scrolling.
- **HomePage theme cleanup:** theme is no longer unmounted with the Home route. Appearance is
  global and persisted (`localStorage: knoux_theme`); it survives route changes and reloads.
- **RepairPage watermark clipping:** the decorative watermark is contained inside its hero band
  and never collides with the page title (`[1203,65,1321,107]` inside the same hero rect at 1366).

---

## 2. What changed technically

### 2.1 Requested layout fixes

- Startup: new `activePane` register/services tabs; bounded workspace; main-canvas internal
  scrolling; compact table typography at ≤820px height; hidden secondary Source column below
  1500px width; `startup-impact-value` isolated LTR for bidi safety.
- System: named panels and a compact-media-query block; `grid-template-rows: 176px minmax(0,1fr)`
  on compact desktops; all twelve diagnostics visible; diagnostics descriptions collapse at
  ≤820px height.
- Smart Scan: fixed-height workspace; scan table compact rhythm; single-line filter rail;
  assistant-safe layout; 8/8 fixture rows at 1672×941.

### 2.2 Global appearance

- `NavigationContext` now owns `theme`, `setTheme`, `toggleTheme`, persisted to
  `localStorage`, synchronized on every mount and applied through `data-theme="light"`.
- The title bar exposes a Sun/Moon control on every route, with Arabic/English titles and
  `aria-pressed`.
- `src/theme-light.css` maps the finite legacy navy palette onto a daylight palette. It does
  **not** use CSS filters or inversion; images, charts and artwork are untouched. Terminal
  consoles and saturated treemap/action tiles intentionally remain contrast islands.
- The sidebar no longer claims "System Guard Active". It reads
  **"Visual preview — engine not connected"** / **"معاينة مرئية — المحرك غير متصل"**.

### 2.3 Bilingual / RTL

- `document.documentElement.dir` and `lang` are set by NavigationContext and survive reloads.
- All 14 routes were re-checked in Arabic at 1366×768: `dir="rtl"`, zero document scrolling,
  zero horizontal page overflow, zero occluded controls.
- Arabic numeric/mono text is isolated LTR (`[dir=rtl] .font-mono`), and physical `text-right` /
  `text-left` utilities mirror in RTL. Home KPI values are explicitly LTR with end alignment.
- The Home hero mantra is hidden below 1400px, where it cannot be squeezed against the mirrored
  hero edge.

### 2.4 Density fixes beyond the three headline items

- **Files:** secondary Source and Parent Folder columns move to `2xl`; Name/Type/Size/Date/
  actions fit cleanly at 1366 and 1672. This removes the header/value collision visible in the
  first RTL pass.
- **Applications:** the register gets a 440px minimum workspace at <1500px; the 12-service
  strip scrolls into view instead of crushing the primary table.
- **Studio:** category grid is 4-up until 2xl (6-up at the reference width), so category names
  are no longer truncated at 1366.
- **Automation:** service palette is 4-up at 1366 and 6-up at 1672; the dark node canvas is
  converted to a daylight canvas with white node cards while connectors and accents stay vivid.
- **Cleanup:** Source/Age hidden at <1500px so Safety is always visible.
- **Smart Scan:** "Can be safely reclaimed" and "No important files" now localize in Arabic.
- **Assistant:** raised to a 7.5rem bottom reserve and a recorded 88–648px panel at 1366 so it
  no longer overlaps a footer's decision bar; Escape close and light-theme message contrast
  were verified.

---

## 3. Verification

### 3.1 Static checks

| Check | Result |
|---|---|
| `npm run lint` (`tsc --noEmit`) | **pass** |
| `npm run build` (Vite 8) | **pass** — bundle warning only (>500 kB chunk) |
| Routes | **14/14 reachable** |

### 3.2 Automated layout sweep

For each route, the audit records document scroll, horizontal scroll, and controls occluded by
another element (with ancestor clip intersection taken into account).

| State | Viewport | Routes | Document scroll | Horizontal overflow | Occluded controls |
|---|---|---:|---|---|---|
| English dark | 1672×941 | 14 | 0 | 0 | 0 |
| English light | 1672×941 | 14 | 0 | 0 | 0 |
| English dark | 1366×768 | 14 | 0 | 0 | 0 |
| Arabic dark | 1366×768 | 14 | 0 | 0 | 0 |

An additional 1920×1080 pass on Home, Startup and Smart Scan shows the layouts expanding
cleanly (Startup shows eight register rows + full dossier). Raw per-route JSON lives in the
working-tree `audit/final-qa/` directory; the curated images are in `final/`.

**Extended addendum matrix (post-review):**

- English dark 1920×1080 — all 14 routes: 0 document/horizontal scroll, 0 occluded controls.
- English light 1366×768 — all 14 routes: 0/0/0.
- Arabic light 1366×768 and 1672×941 — all 14 routes each: 0/0/0.
- Arabic dark 1672×941 — all 14 routes: 0/0/0.
- Arabic light 1920×1080 — sample on Home, Startup, System and Smart Scan: 0/0/0.

These sweeps close the viewport/theme/RTL evidence matrix. They are local audit
artifacts (`audit/gate-visual/`, intentionally not committed as a screenshot pile).

### 3.3 Interaction audit — 22/22 pass

1. Startup services tab exposes 12 cards.
2. A service card opens a closable domain workspace with the non-connected safety banner.
3. The workspace closes back to the register.
4. The register tab returns to a 14-row table.
5. Expanded telemetry starts exactly at the main-canvas bottom; action bar is never covered.
6. Theme toggle switches to light and persists in localStorage.
7. Theme survives navigation.
8. Locale toggle sets `dir=rtl`, `lang=ar`, and keeps the light theme.
9. Locale + theme survive a full reload.
10. Locale + theme return to English/dark.
11. Home Ctrl+K opens the searchable command palette with focus.
12. Escape closes it.
13. Shell section finder filters sections.
14. Enter navigates to the chosen section.
15. The AI assistant opens in a reserved overlay.
16. Escape closes the assistant.
17. Smart Scan category filter is interactive.
18. Smart Scan service opens its domain workspace.
19. That workspace closes.
20. Cleanup ledger has a working horizontal scroller.
21. Repair watermark is contained in its hero.
22. Selecting a service row updates the service dossier.

Evidence: [`final/interaction-audit.json`](final/interaction-audit.json).

### 3.4 Contrast audit

`theme-light.css` was audited across all 14 routes at 1672×941. Unintended dark surfaces and
primary-control contrast failures are cleared. Remaining automatic flags are reviewed
exceptions:

- Terminal/code previews (Repair) are intentionally dark reproductions of console output.
- Saturated treemap labels and vivid action gradients are intentionally high-chroma; white
  labels receive a soft shadow.
- A handful of alpha-composited badges are flagged by the probe because it evaluates the
  unpremultiplied stop; their rendered colours are dark ink on pale cyan/purple fields.
- Disabled controls (e.g. muted Start while a service runs) are visually muted by design.

No primary navigation, decision, safety or destructive control is hidden or unreadable.

### 3.5 Per-reference matrix (Gate V5)

Approved references are at 1672×941. Each composite shows the approved REF on the
left and the current renderer on the right, both at reference viewport. The full
JPEG set is in [`final/reference-matrix/`](final/reference-matrix/).

| Approved REF | Route | Side-by-side |
|---|---|---|
| REF-01 | Organization Studio | [view](final/reference-matrix/REF-01-vs-current.jpg) |
| REF-02 | Applications | [view](final/reference-matrix/REF-02-vs-current.jpg) |
| REF-03 | Files | [view](final/reference-matrix/REF-03-vs-current.jpg) |
| REF-04 | Storage | [view](final/reference-matrix/REF-04-vs-current.jpg) |
| REF-05 | Cleanup | [view](final/reference-matrix/REF-05-vs-current.jpg) |
| REF-06 | Startup | [view](final/reference-matrix/REF-06-vs-current.jpg) |
| REF-07 | System | [view](final/reference-matrix/REF-07-vs-current.jpg) |
| REF-08 | Repair | [view](final/reference-matrix/REF-08-vs-current.jpg) |
| REF-09 | Services | [view](final/reference-matrix/REF-09-vs-current.jpg) |
| REF-10 | Automation | [view](final/reference-matrix/REF-10-vs-current.jpg) |

**NO VERIFIED STANDALONE REFERENCE:** Home, Smart Scan, Google Workspace. The
provided REF-01 is Studio, not Home; the in-repo Smart Scan artwork is a source
candidate, not proof of approved parity. These screens are functional and
accessible, but no pixel-parity claim is made. See the matrix README.

---

## 4. Screen status matrix

Legend: d = English dark, l = English light, ar = Arabic dark RTL. All links below are curated
JPEG evidence in this folder.

| Route | d 1672 | d 1366 | l 1672 | ar 1366 | Notes |
|---|---|---|---|---|---|
| Home | [view](final/en-dark-1672-home.jpg) | [view](final/en-dark-1366-home.jpg) | [view](final/en-light-1672-home.jpg) | [view](final/ar-dark-1366-home.jpg) | Hero, 6 KPIs, deck, insight, quick access, pending actions; AR KPI order fixed. |
| Startup | [view](final/en-dark-1672-startup.jpg) | [view](final/en-dark-1366-startup.jpg) | [view](final/en-light-1672-startup.jpg) | [view](final/ar-dark-1366-startup.jpg) | Register + 12-service tab; footer telemetry bounded; light/AR verified. |
| Startup — 12 services | [view](final/en-dark-1672-startup-services.jpg) | [view](final/interaction-startup-services-1366.jpg) | — | — | All 12 cards + workspace launcher. |
| System | [view](final/en-dark-1672-system.jpg) | [view](final/en-light-1366-system.jpg) | [view](final/en-light-1672-system.jpg) | [view](final/ar-dark-1366-system.jpg) | 4 instruments, timeline, info, ledger, 12 diagnostics visible. |
| Smart Scan | [view](final/en-dark-1672-smart_scan.jpg) | [view](final/en-dark-1366-smart_scan.jpg) | [view](final/en-light-1672-smart_scan.jpg) | [view](final/ar-dark-1366-smart_scan.jpg) | 8/8 fixture rows at 1672; 5 + scroller at 1366. |
| Studio | [view](final/en-dark-1672-studio.jpg) | [view](final/en-dark-1366-studio.jpg) | [view](final/en-light-1672-studio.jpg) | [view](final/ar-dark-1366-studio.jpg) | Sources, 18 categories, gallery, preview; AR 4-up category grid. |
| Workspace | [view](final/en-dark-1672-workspace.jpg) | — | [view](final/en-light-1672-workspace.jpg) | — | Google Workspace hub; preview table header fixed in light mode. |
| Applications | [view](final/en-dark-1672-applications.jpg) | [view](final/en-dark-1366-applications.jpg) | [view](final/en-light-1672-applications.jpg) | [view](final/ar-dark-1366-applications.jpg) | Register + dossier + batch bar + 12 services; compact height protected. |
| Files | [view](final/en-dark-1672-files.jpg) | [view](final/en-dark-1366-files.jpg) | [view](final/en-light-1672-files.jpg) | [view](final/ar-dark-1366-files.jpg) | Responsive columns; no header/value collisions in AR. |
| Storage | [view](final/en-dark-1672-storage.jpg) | — | [view](final/en-light-1672-storage.jpg) | — | Volume bays, treemap, inspector; strip is reachable via internal scroll at 1366. |
| Cleanup | [view](final/en-dark-1672-cleanup.jpg) | [view](final/en-dark-1366-cleanup.jpg) | [view](final/en-light-1672-cleanup.jpg) | [view](final/ar-dark-1366-cleanup.jpg) | Safety column stays visible; ledger scroller verified. |
| Repair | [view](final/en-dark-1672-repair.jpg) | [view](final/en-dark-1366-repair.jpg) | [view](final/en-light-1672-repair.jpg) | [view](final/ar-dark-1366-repair.jpg) | 12 tools, guided sequence, command preview, actions; watermark contained. |
| Services | [view](final/en-dark-1672-services.jpg) | [view](final/en-dark-1366-services.jpg) | [view](final/en-light-1672-services.jpg) | — | Register + dossier + dependency graph + operation preview. |
| Automation | [view](final/en-dark-1672-automation.jpg) | [view](final/en-dark-1366-automation.jpg) | [view](final/en-light-1672-automation.jpg) | — | Node canvas, library, inspector, 12-service palette (4-up at 1366). |
| Settings | [view](final/en-dark-1672-settings.jpg) | — | [view](final/en-light-1672-settings.jpg) | — | Engine profiles, RAM slider, CPU allocation, global save. |
| 1920 samples | [Startup](final/en-dark-1920-startup.jpg) · [Smart Scan](final/en-dark-1920-smart_scan.jpg) | — | [Home](final/en-light-1920-home.jpg) | — | Headroom pass. |
| Assistant | [open](final/interaction-assistant-open-1366.jpg) | — | [light](final/light-1366-assistant-v2.jpg) | — | Reserved bottom space; Escape close verified. |

---

## 5. Known limitations (not pretend-fixed)

1. **Native execution is not connected.** The renderer is still a visual phase. Service
   workspaces, clean, repair and startup actions preview safely and keep the honest
   "DESIGN PREVIEW • NOT CONNECTED • NO WINDOWS CHANGES" contract. No fake success states were
   introduced.

2. **Arabic localization is partial on secondary panels.** Navigation, hero copy, primary
   tabs, KPI labels, scan results headers, cleanup/startup safety copy and the shell state are
   Arabic. Several secondary labels remain English: System panel headings and buttons, Repair
   tool names, Automation panel labels, Studio's dev-scenario chrome, and some Storage inspector
   rows. The RTL layout is correct everywhere; completing the content translation is a separate
   localization sweep, not a layout bug.

3. **Some tertiary tools sit below an internal scroll at 1366×768.** Storage's 12-service strip,
   Applications' service strip (at 1366), and the lower Repair/Automation panels are reachable by
   scrolling the main/canvas region. No document page scroll or fixed-footer overlay returns;
   primary actions remain on screen. At 1672×941 the full compositions are above the fold.

4. **Light mode is a curated palette bridge, not a semantic-token migration.** The legacy
   renderer uses hundreds of fixed navy utilities. `theme-light.css` maps them deliberately and
   is verified on every route, but Phase B should replace these with semantic
   background/surface/text tokens to remove the bridge and its maintenance surface.

5. **The Vite bundle is still a single ~1.18 MB JS chunk** (warning only). Code-splitting is a
   Phase B performance task; it does not block this visual closure.

6. **Some automatic contrast flags are probe artifacts.** The probe evaluates translucent
   badges and disabled controls unfavourably; reviewed screenshots remain the source of truth
   for those exceptions. No known primary control is unreadable.

---

## 6. Reproduce

```bash
cd apps/gemini-ui
npm install
npm run dev        # Vite at http://127.0.0.1:3000
npm run lint
npm run build
```

The capture/audit tools are copied under [`tools/`](tools/) for reproducibility. They assume
the Vite server at `127.0.0.1:3000` and the local Chrome path used during this pass. The
working-tree `audit/` directory holds raw captures/logs and is intentionally not part of the
curated dossier.

## 7. Evidence index

- `final/` — 64 curated route/interaction screenshots (JPEG, 84% quality) covering English
  dark 1672, compact English dark 1366, English light 1672/1366, Arabic dark 1366 (AR 1672
  raw captures remain in the local audit folder), 1920 samples, and the interaction proof
  shots; plus 10 reference-vs-current composites under `final/reference-matrix/`.
- `final/interaction-audit.json` — 22/22 interaction assertions with details.
- `tools/` — CDP audit, contrast probe, dark-surface probe, and interaction runner.

The visual phase is ready for review. The remaining work is runtime integration, a semantic
theme-token migration, and the Arabic content-completion sweep.
