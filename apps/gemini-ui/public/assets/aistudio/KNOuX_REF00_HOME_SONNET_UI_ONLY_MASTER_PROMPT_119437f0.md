# KNOuX SmartOrganizer — REF-00 HOME COMMAND CENTER
## FULL-FIDELITY UI SOURCE DELIVERY — ONE SCREEN, FIVE CODE FILES, ONE ZIP

**ROLE:** Senior React  + TypeScript UI Engineer, premium Electron desktop interface specialist, and exact visual-reference implementer.

**DO NOT PLAN. START WRITING THE FILES IMMEDIATELY.**

You are creating **ONLY the Home landing-screen UI** for the existing **KNOuX SmartOrganizer** Windows desktop application. The accompanying **`REF-00_HOME_COMMAND_CENTER_APPROVED.png` (1672×941)** is the authoritative visual reference. The user wants production-quality frontend source files for later review and integration into their real application, NOT a new application, screenshot, visual prototype, backend, research report, or operating-system integration.

Read this prompt once, inspect the small set of supplied Home source files if provided, and **produce complete code now**. Your free execution time must be spent writing the deliverables, not testing, building, browsing, generating imagery, collecting screenshots, or producing lengthy analyses.

---

## 1 — PROJECT FACTS AND EXACT INTEGRATION TARGET

The EXISTING repository is `daynightae-cmyk/Knoux-SmartOrganizer`, Windows Electron + React + TypeScript + Vite. A previously inspected source baseline was **`f7adf33`** on `feat/visual-finalization-20261025`; this is informational and can become stale. **Never presume an older snapshot is newer than the live repository.** Your output is a reviewable patch pack only.

The real architecture contains:

- `src/pages/HomePage.tsx` — **existing Home screen entry point**, currently rendered by `App.tsx` when `page === 'home'`.
- `src/App.tsx` — already routes pages; **DO NOT modify**.
- `src/shell/AppShell.tsx` — existing application shell, page-transition animation, accessible main region, sidebar/toolbar integration; **DO NOT recreate**.
- `src/shell/Sidebar.tsx` — real nav and KNOuX brand; **DO NOT recreate**, **DO NOT hide working routes**.
- `src/shell/Header.tsx` — existing command palette search trigger, activity center and locale actions; **DO NOT duplicate functionality**.
- `src/state/store.tsx` — real `useStore()`, including `page`, `setPage`, `setPaletteOpen`, `setOperationOpen`, `locale`, `t`, `health`, `history`, `tools`, `automations`, `settings`, `openTool`, and already-approved actions. Reuse these contracts; avoid assuming undocumented properties.
- `src/lib/pages.ts` — actual `PageId` IDs and page map.
- `src/lib/service-catalog.ts` — existing worlds and service catalog; do not duplicate engine behavior.
- `src/lib/format.ts` — existing formatting helpers.
- `src/main.tsx` — existing global CSS imports. Import your **new scoped stylesheet directly from `HomePage.tsx`** so `main.tsx` does not have to change.

**Confirmed route IDs:** `home`, `scan`, `studio`, `clipboard`, `applications`, `files`, `storage`, `cleanup`, `startup`, `system`, `repair`, `services`, `network`, `hardware`, `automation`, `history`, `settings`.

For card navigation use `setPage('scan')`, `setPage('studio')`, `setPage('applications')`, `setPage('storage')`, `setPage('cleanup')`, `setPage('startup')`, `setPage('system')`, `setPage('repair')`, etc. For top search use existing `setPaletteOpen(true)`; for activity use `setOperationOpen(true)` when appropriate.

**Existing real store shapes discovered:** `health` is `Record<string, unknown> | null`; previously consumed keys include `systemDriveTotalBytes`, `systemDriveFreeBytes`, `memoryUsedPercent`, `memoryFreeBytes`, `uptimeSeconds`, `cpuModel`, `cpuCores`. `history` is a list of real operation records. `automations` and `tools` are typed arrays. `settings?.appearance.workspace` already contains Home visibility and density choices. **Keep any other data accesses guarded and properly typed.** Do not invent a rich API or install dependencies to paper over missing contracts.

The rest of KNOuX's screens, engines, authorizations, undo journals, preload, security restrictions, menus and user settings are **outside this assignment**.

---

## 2 — ABSOLUTE PHASE BOUNDARY: FRONTEND ONLY

**IN SCOPE:** DOM/JSX composition, React interaction state, typed UI models, responsive CSS, keyboard navigation, accessible tabs, tooltips, menus, read-only info inspectors, item selection, sorting, filtering, locally staged actions, visual command previews, conditional cards, empty/loading/error design, realistic animations, EN/AR translations and RTL, dark/light themes.

**OUT OF SCOPE AND PROHIBITED:** backend, Electron Main/preload/IPC changes, native providers, disk scanning, file modification, uninstall, package installation, repair, PowerShell/CMD/terminal, OS services, privileged actions, real scheduling, browser automation, new dependencies, opening external windows, scripts to run/modify Windows, tests, compiler/build runs, screenshots, pixel-diff programs, Git commits/merges/pushes, and modification of any existing security or execution flow.

**NO EXPENSIVE NON-CODING ACTIVITY:** Do not run `npm install`, `tsc`, `vite`, Vitest, Electron, Playwright, CDP or any command to verify layout. Do not spend tokens describing a plan, arguing about the visual reference, or writing audit reports. We will test and integrate after receiving the ZIP.

Representative numbers, filenames and activity shown in the approved PNG are **visual content samples** rather than claims about the user's real Windows machine. When real state is available through existing providers, display it; when not, use a clearly isolated optional **Design Preview** fixture inside `home-ui.ts`, or elegant unavailable/empty states in the default view. Keep fixture identity explicit; **never claim fake metrics, a completed operation or simulated progress represents actual Windows activity**. Do not waste time building a data backend.

---

## 3 — PRIMARY APPROVED VISUAL LANGUAGE

The HOME screen is **KNOuX's flagship**, more impressive than any ordinary admin dashboard. Match **the attached PNG's actual regions and spatial rhythm**, not merely its colors:

- Full dark-navy/black application atmosphere with carefully restrained azure, electric blue, cyan, violet, emerald, amber, coral accents.
- Hero shows a cinematic glowing curved Earth/planet horizon with fine stars and a brilliant blue atmospheric rim; use CSS gradients, local existing assets and lightweight CSS/SVG effects. **Never use the entire screenshot as a background, never require a remote image URL.**
- Crisp premium light typography with strong hierarchy, no fuzzy text or oversaturated glows.
- Thin illuminated panel borders, inset highlights, elevated surfaces, clean 8–14px radii, subtle shadows and consistent microspacing.
- Dense, deliberate content, powerful visual hierarchy. The dashboard should visually look like a **real desktop control center**, not eight giant blank cards, not a generic SaaS landing page, not mobile UI.
- Preserve KNOuX logo, sidebar width/behavior, existing global app controls and section navigation. The supplied screenshot shows a sidebar **as context**; **do not implement a second sidebar or top-level app chrome** within Home.
- No duplicated Header title; if existing global Header prints a competing Home title, use **page-scoped Home CSS selectors** targeting the existing chrome ONLY on `html[data-page="home"]`; retain functional search/activity/locale buttons. Do not modify `Header.tsx` or `AppShell.tsx`.
- The Home content sits inside the existing scrollable `.workspace-scroll` and `.page-transition`. Avoid nested viewport-wide `100vw`, hardcoded body overflow, or layout that covers global nav.

### Desktop geometry, measured against the 1672×941 PNG

Use the image as ultimate authority; below are proportional implementation clues, not a replacement for direct visual inspection:

1. Slim top global shell/action region (already supplied by the app).
2. Large **Home Command Center** hero occupying the leading band, with the planet horizon to the right, the name/tagline to the left, and a prominent command/search affordance tied to the existing palette.
3. Under the hero, **six equal-feeling KPI cards** in a compact uninterrupted horizontal line at full desktop width.
4. Main content uses a **large left work area (~65%)** and a **right insight/activity column (~35%)**, with a consistent 9–12px gutter.
5. Left-center: large **Today's Command Deck** with 8 colored launcher tiles, precisely 4 columns × 2 rows at reference width.
6. Right upper: **KNOuX Insight** card above **Recent Activity & Recommendations**.
7. Left lower: **System Overview** chart panel next to **Quick Access** recent-files list; beneath/alongside this is **Storage Snapshot**.
8. Right lower: **Pending Safe Actions** list with selection and preview, with a disabled/safe final action area.
9. At 1672×941 the full flagship composition should resemble the reference without massive dead zones. At 1366×768 keep the crucial hero/KPIs/command deck accessible, permit intentional vertical page scroll for secondary information.

---

## 4 — EXACT MAIN REGIONS TO CODE

### REGION A — HERO / MASTER SEARCH

- Title: **Home Command Center**.
- Subtitle: **Your complete system. Organized, optimized, in control.**
- KNOuX brand treatment visually consistent with other worlds.
- Planetary panorama, atmosphere/stars, subtle light streaks, right-side message: *Organize / Optimize / Maintain / All in one place* (can be translatable).
- Dominant in-page command search field reading **Search for files, applications, settings, or run a command...** with `Ctrl + K` hint. This is a **working visual trigger** for existing `setPaletteOpen(true)` (not a new indexing or command engine). Allow click/focus/Enter to open the palette, while keeping accessible semantics.
- Visually coordinated with the real global header search so two search fields aren't awkwardly doubled; preserve original reference hierarchy and functional existing header.

### REGION B — SIX KPI CARDS

Exactly six compact premium cards at desktop:

1. **System Health** — shield icon, current health/status label, score/availability placeholder, subtle cyan-green sparkline.
2. **Indexed Files** — document/index icon, count/read status, small electric-blue bars.
3. **Space Reclaimable** — database icon, measured bytes or unavailable, purple trend bars.
4. **Active Automations** — energy icon, available active schedules count where known, green visual bars.
5. **Apps Monitored** — four-square icon, actual available inventory count or placeholder, blue bars.
6. **Services Healthy** — settings/service icon, measured service counts if available, green status mini-bars.

Use real available store/context where possible, otherwise `—`, `Not connected`, or optional visibly marked Design Preview data. **Never derive “health score 92/100” from disk-used percentage; that is misleading.** Do not equate service availability with actual running/healthy counts. Each card should have icon, short title, primary value, semantic status, tasteful sparkline/microbars (decorative bars must be presented as decorative if not measured), hover/focus treatment, and sensible target navigation to the relevant existing world.

### REGION C — TODAY'S COMMAND DECK

High-priority signature panel with header, subtitle and working `Customize` UI (local modal/popover or local card reorder/visibility controls only; do not rewrite existing Settings). **8 large illustrated tiles, 4×2**:

- Smart Scan — magnifier — cool azure — target `scan`.
- Organize Files — folder — green/teal — target `studio`.
- Applications — luminous cube — violet — target `applications`.
- Storage — disk — amber — target `storage`.
- Cleanup — broom — warm orange — target `cleanup`.
- Startup Control — rocket — purple — target `startup`.
- System Live Pulse — waveform — cyan — target `system`.
- Repair Lab — wrench — coral/pink — target `repair`.

Each tile must be a keyboard-operable button, styled with a distinct small geometric/technical background illustration, glow, icon surface, title, subtitle, chevron and active/hover/focus states. Use **built-in Lucide icons**, CSS geometry or SVG; no huge downloaded images, remote dependencies, or fake Photoshop backgrounds. Clicking navigates to the actual route with `setPage`.

### REGION D — KNOuX INSIGHT

Right column top card:

- Icon (illuminated warm amber lightbulb) and discreet intelligence badge.
- A concise actionable recommendation, explanatory text, a bright **Run Smart Scan Now** CTA, and secondary **See Details** button.
- No invented AI engine. Label an AI-backed insight **only if the app actually has one**; otherwise treat as **KNOuX Insight** using known static safe recommendations or an explicitly marked Design Preview. Avoid fabricated cleanup numbers.
- Primary CTA navigates to `scan` (do not call `runById` and start a real scan automatically from Home). Details opens a Home-level read-only panel or navigates to the relevant existing page.
- Three-dot overflow menu (actions such as dismiss/why this recommendation) with real local UI behavior.

### REGION E — RECENT ACTIVITY & RECOMMENDATIONS

Right mid card with title, **View All** → `history`, five compact rows maximum and optional proper scroll:

- Icon, semantic state, operation text, short supporting detail, recorded time, chevron.
- Use actual `history` records with existing labels/time formatting if available. Render **zero state** elegantly when empty.
- Selecting a row opens read-only in-page details (or existing Operation Drawer if supported) WITHOUT inventing a result, replay or successful run.
- Sample activities in the screenshot (Smart Scan, organized files, Edge update, Startup changes, system check) are reference content for spacing/icon treatment only.

### REGION F — SYSTEM OVERVIEW

Wide left-lower card:

- Header and compact tabs: **System Health / Storage / Performance / Apps & Services**.
- At default, a large illuminated gradient ring on the left, and a beautifully framed multi-line graph panel on the right.
- Legends and axis labels, small labels/readouts, historical range selector if there is legitimate history.
- Use local state for tab switching; each tab must show context-appropriate subpanel, not the same graph with a changed tab label.
- If no sampled history exists, render an elegant empty-state graph scaffold, **not fabricated telemetry**. If you implement a clearly marked Design Preview mode, fixture charts may use realistic values but must never impersonate live system data.
- A legitimate system drive usage ring can be derived from known `systemDriveTotalBytes/systemDriveFreeBytes`; label it as **disk usage**, not generic health score.
- Keep charts lightweight via CSS/SVG and existing dependencies. Avoid new chart libraries.

### REGION G — QUICK ACCESS

Center-lower panel with tabs: **Recent Files / Recent Folders / Pinned**, small recency selector and **View All** → `files`.

- Show icon, file/folder name, secondary location, recency, per-row overflow (`…`) menu.
- Local tab switching, selection, menu toggles, local pinned state, and actual navigation must work.
- Do not request filesystem access or implement file search. If the existing store has no recent-files source, render an honest empty state; in optional **Design Preview** mode display sample rows labelled as examples, isolated from production state.
- Keep file icons/type accents similar to reference: document, spreadsheet, video, picture, archive.

### REGION H — STORAGE SNAPSHOT

Compact panoramic strip under System Overview:

- Up to 3 measured volume cards; at minimum show the currently available system disk with accurate used/free calculation.
- Windows/C:, Data/D:, Projects/E: are **visual examples** from the reference, never guaranteed drives.
- Accurate readable capacity, used/free bars, drive labels, format when available, color-coded states.
- **View in Volume Atlas** navigates `storage`.
- If only one volume exists, do not invent D/E. Fill remaining with elegant placeholders or omit gracefully while retaining the intended proportion.

### REGION I — PENDING SAFE ACTIONS

Right-lower panel with shield icon, badge count, caption, **View All**, three compact proposal rows and safe footer.

- Reference actions: review temporary cleanup, review unused apps, review browser cache.
- Each candidate has checkbox, icon, title, secondary eligibility/scope text, **Preview** button and expand chevron.
- Checkbox selection and **Preview** must work in React UI state; the preview is an in-app, read-only explanation of scope, safety, permissions, and what would happen when wired later.
- `Apply Selected Actions` must remain **disabled** in this UI-only phase unless an explicitly confirmed existing safe action capability has been provided; do **not** execute a real cleanup/uninstall or claim any action succeeded.
- No dangerous IPC or OS calls; do not synthesize successful history.
- If no verified candidates exist, use preview-proposal empty/not-connected states without removing the visual card structure.

### REGION J — SECONDARY LINKS / MICRODETAILS

Where appropriate, support short links to `network`, `hardware`, `services`, `automation`, `clipboard`, and `settings` without overcrowding the main eight action tiles. The Home is a **command center for the whole app**, but should not copy every other page onto Home. Reuse the existing sidebar for full navigation.

---

## 5 — DESIGN QUALITY / VISUAL FIDELITY

Match the screenshot **section by section**:

1. Sidebar-to-content boundary and correct use of existing app chrome.
2. Cosmic hero with Earth rim, large title and primary search visual weight.
3. Six KPI cards in one neat horizontal row at the reference resolution.
4. Eight illustrated action tiles with distinct accent colors.
5. Dense but legible left-center and right-column panels.
6. Ring gauge + fine multi-line visual in overview.
7. Realistic rows, tags, icons, action affordances and selection indicators.
8. Subtle glass materials, precision borders, fine gradients, restrained bloom, professional hover states.
9. Right-aligned insight/activity/action column and aligned lower cards.
10. Correct spacing, active states, rounded surfaces, and hierarchy. Preserve the brand's existing approved logo.

**Do not** give me a very different layout and label it “inspired by”. **Do not** use the screenshot itself as one giant HTML background image. Render every visual region in native, selectable and interactive JSX/CSS. The reference is **1672×941**; optimize relative proportions for that view first, then 1920×1080, 1366×768, RTL and narrower desktop widths.

Theme: Dark is primary. Reuse existing `html[data-theme="light"]` to produce a readable true light skin (not just invert filters). Locale: EN LTR and AR RTL using the existing document direction; create compact UI-only translations scoped to Home if existing dictionary keys are missing. Support font scaling/reduced motion/high contrast. Use logical CSS properties where appropriate. Avoid huge images and decorative animation CPU drain.

---

## 6 — REQUIRED WORKING UI INTERACTIONS (FRONTEND ONLY)

All of these must function inside React without touching Windows:

- Search field opens existing Command Palette.
- Eight deck cards navigate to real routes.
- KPI cards navigate to their detailed worlds where appropriate.
- Customize modal/popover opens, changes visible deck tiles or local ordering and can close/cancel/reset.
- Insight dismiss/details affordances act locally; Scan CTA navigates (does not execute).
- Activity row can select/view known details with an empty fallback.
- System Overview tabs change visible content, date-range control changes displayed UI state if source supports it.
- Quick Access tabs and pinned state work locally; View All navigates Files.
- Storage tile/View Atlas navigates Storage.
- Safe Action checkboxes/expanded preview work; final execute stays disabled with explanation.
- Buttons, Esc, Enter/Space, tab focus, semantic labels, menu close/outside behavior, visible focus rings, disabled states all handled.

**No dead fake buttons.** If there is no safe useful action, make the control explicitly unavailable and explain why. Do not make any direct `runById` call from the Home UI unless specifically authorized in an existing safety workflow: navigation to its section is preferred.

---

## 7 — EXACT FIVE DELIVERABLE SOURCE FILES

Create **ONLY these five full files** under `OUTPUT/` (plus ZIP):

```text
OUTPUT/
└── src/
    ├── pages/
    │   └── HomePage.tsx
    ├── components/
    │   └── home/
    │       ├── HomeCommandCenter.tsx
    │       └── HomeDashboardPanels.tsx
    ├── lib/
    │   └── home-ui.ts
    └── home-command-center.css
```

### File 1 — `src/pages/HomePage.tsx`

Small integrated page entry: imports stylesheet from `../home-command-center.css`, reads the existing `useStore()`, derives guarded presentation props, and composes the main components. Preserve existing Home behavior where possible. Avoid modifying global router/shell/Sidebar/Header or store state.

### File 2 — `src/components/home/HomeCommandCenter.tsx`

Hero, main search trigger, six KPIs, 8 illustrated Command Deck tiles, local deck customization. Use typed props and real navigations via callbacks passed down from HomePage.

### File 3 — `src/components/home/HomeDashboardPanels.tsx`

KNOuX Insight, Recent Activity, System Overview (tabs/ring/graph), Quick Access, Storage Snapshot and Pending Safe Actions. Meaningful UI interactions and read-only inspector/preview states.

### File 4 — `src/lib/home-ui.ts`

Compact typed view models, immutable 8-tile route registry, category/tone definitions, EN/AR labels as needed, safe presentation helpers and **optional clearly isolated design-preview data**. Never introduce a second app store or depend on undisclosed backend contracts.

### File 5 — `src/home-command-center.css`

Complete **Home-scoped** visual implementation with fine-grained class names (`.knx-home-*` or equivalent), responsive grid and safe `html[data-page="home"]` shell adjustments. No uncontrolled global `button`, `aside`, `main`, `h1`, etc. selectors. No modification to shared CSS files. Ensure correct dark/light, RTL, reduced-motion, font-scale and overflow behavior.

**No additional production source files; no unrelated screen edits.** You may define small helper subcomponents inside the two designated component files instead of making dozens of separate files. Import only libraries already present (React, TypeScript, lucide-react, motion/react if useful). No new package/dependency install.

Any optional README must be at most ten factual lines, not a plan or report; prioritize the five code files. Do NOT create tests or a test plan because verification is our responsibility.

---

## 8 — CODE QUALITY WITHOUT RUNNING ANYTHING

This assignment is meant for fast source delivery in a limited free model session:

- Write all five files **in full** with actual valid TSX/CSS; no ellipses, no `TODO`, no pseudocode, no “implement later” where a UI interaction is required.
- Use imports that correspond to source files already supplied or created in the five-file output. Guard unknown runtime values.
- Keep domain types narrow; do not cast everything to `any` or assume nonexistent store properties.
- Honor `React.StrictMode`, stable keys, event cleanup, keyboard/focus, accessible semantics.
- Do not break underlying Home functions, locale/theme selection, or real history rendering.
- Allow placeholder/design-preview presentation for unsupported data without presenting it as live execution.
- Make lightweight visuals with CSS/SVG; avoid external artwork URLs.
- Avoid rewriting the app shell, recreating router, moving core APIs, or producing a standalone Vite starter.
- The user will perform integration and testing on the actual workstation later.

**NO TEST / NO BUILD / NO SCREENSHOT / NO REVIEW LOOP**. Don't state PASS or visual-perfect as these cannot be established by writing files alone.

---

## 9 — OUTPUT ZIP CONTRACT — EXPORT BEFORE FREE LIMIT

**OUTPUT FIRST, EXPLANATION LAST.**

1. Create the five listed physical files in their exact `OUTPUT/src/...` paths.
2. **Immediately compress `OUTPUT/` into `KNOuX_REF00_HOME_UI_ONLY_COMPLETE.zip`.**
3. Give the user a working clickable download link to the real ZIP.
4. Final text must be very short: included 5 file paths, any source compatibility caveat, and `NOT TESTED (by design)`.
5. If interrupted before all five files exist, **ZIP and return every completed file immediately** as `KNOuX_REF00_HOME_UI_PARTIAL_RECOVERY.zip`, listing the missing ones. **Never lose completed code because you have not polished the response.**
6. Do not start another task after exporting the full ZIP.

**THIS IS A CODE-EXPORT MISSION, NOT A RESEARCH, DESIGN-GENERATION OR EXECUTION MISSION.**

### FINAL EXECUTION COMMAND

Write the COMPLETE Home Command Center frontend from the attached approved screenshot and the real KNOuX source contracts. Match the hero, six KPI cards, eight launch tiles, Insight, Recent Activity, System Overview, Quick Access, Storage Snapshot and Pending Safe Actions, plus all safe UI interactions. Preserve the existing shell/navigation/real data wherever available. Deliver **exactly five complete files and one downloadable ZIP**. **No backend, no builds, no tests, no screenshots, no terminal, no plans, no claims of verification. BEGIN CODING NOW.**
