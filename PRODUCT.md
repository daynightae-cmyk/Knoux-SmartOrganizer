# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

The product ships as an Electron desktop application for Windows (`electron/main.cjs`, NSIS installer, x64). The renderer is React 18 + TypeScript + Vite with a hand-authored CSS token system. "web" describes the rendering surface only — the target environment is a fixed-size Windows desktop window, minimum 860×600, not a browser tab.

## Users

Primary: a non-technical Windows owner maintaining their own PC — they want to know what is installed, what is eating space, what runs at boot, and what is safe to change, without reading a developer explanation.

Secondary: a power user or small-office technician who does want paths, registry roots, service names, startup commands and verification evidence, and who judges the product by whether the numbers are real.

Job: understand the machine's actual state, then take a reversible or at least reviewable action on it.

## Product Purpose

KNOuX SmartOrganizer is a local-first Windows utility that inspects and maintains a PC: installed software, files, storage, cleanup, startup, system load, repair, Windows services, network, hardware and scheduled automation. Nothing leaves the machine; no telemetry, no crash reporting, no cloud dependency.

Success means an ordinary user opens a section, immediately recognises what they are looking at, and can act (or deliberately decline) without guessing what a button does.

## Positioning

The mechanism a neighbouring utility cannot copy: every visible number, icon and status is produced by a verified local Windows source, and every operation that changes something passes a real preflight → preview → explicit consent → execute → post-state verification chain with a journaled undo record. Sections that cannot prove a result say so on screen. KNOuX is designed to be legible to a non-technical user while remaining auditable by a technician.

Behavioural quality references are Everything (indexed search responsiveness) and IObit Uninstaller (visual software inventory and control before action). These are quality bars, not templates; no layout, asset, mark or proprietary content of either product is copied.

## Operating Context

Windows 10/11 desktop, x64, used interactively at 860×600 up to 1920×1080 and larger. Arabic (RTL) and English (LTR) are both first-class; the app defaults to Arabic. Dark is the primary theme, with light and high-contrast themes and a reduced-motion mode. Data comes from CIM/WMI, PowerShell providers, the uninstall registry roots, live filesystem walks and `sc.exe`; each provider has its own measured timeout and partial-failure reporting. Destructive capability is deliberately limited: cleanup quarantines rather than deletes, startup writes are restricted to the current-user Run key, service control refuses a protected-services list, and repair commands run through a frozen, exact-key operation spec behind UAC consent.

## Capabilities and Constraints

Integrated today (34 registered engines, real Windows data): installed-application inventory (uninstall registry roots + `Get-AppxPackage`), logical/physical disk overview, large files, duplicates, empty folders, downloads inventory and organise preview/apply/undo, temp cleanup preview/apply/undo with quarantine, startup items + disable/restore, system health, event warnings, process inventory, battery and hardware inventory, file hash, eight repair operations (DISM/SFC/DNS/winsock/TCPIP), service inventory + controlled start/stop/restart/startup-type changes with undo journal, network diagnostics, smart scan, and eight read-only scheduled automations through `schtasks`.

Hard constraints, binding on all future work:

- **No durable file index exists.** File search is a live scan under a 50 000-entry budget, plus an in-session Studio inventory that is LRU-capped at twelve and expires when the window closes. The Files experience must report index truth honestly; "Everything-class" is a responsiveness target, not a claim to state.
- **Content search is not offered**, and filename search must never be presented as content search.
- **No uninstall execution exists** — `uninstallCapability` is recorded metadata only. There is no Recycle Bin action, no service deletion, no startup entry creation, and no per-application cache analysis.
- **Never simulate.** No fabricated app names, versions, publishers, metrics, startup-impact scores, topologies, or scan outcomes. Absent data renders as an explicit unavailable state.
- **Never execute an installed application** to collect metadata; icon retrieval must be read-only and must not accept an arbitrary path from the renderer.
- The flagship **Smart Organization Studio** keeps its own backend, plans, journal, IPC and visual library. Service worlds must not overwrite it or duplicate global app state.
- No Tailwind, no shadcn/ui, no competing CSS framework. The existing tokens (`--bg`, `--surface`, `--surface-raised`, `--text`, `--muted`, `--border`, `--primary`, `--primary-bright`, `--accent-quiet`, `--accent-border`, spacing/radius/type/status tokens) are canonical; the global theme is not overwritten. Category colour is additive and scoped.
- The ten non-catalog pages (`home`, `scan`, `studio`, `clipboard`, `automation`, `history`, `settings` and the bespoke worlds) must keep working; presentation is replaced, capability contracts are preserved.
- Development happens directly on `main` in the existing working tree: implement → check (`tsc`, `eslint`, targeted `vitest`, `vite build`) → real packaged screenshot → commit → push. No branches, worktrees or draft PRs unless requested. Full packaged Electron smoke is a milestone gate, not a per-CSS-edit gate.

Product facts still open: whether a durable filename index is built (and via NTFS change journal or a documented Everything-compatible provider), whether a real uninstall wizard ships, and whether per-application cache/leftover analysis gets a native engine.

## Brand Commitments

Name **KNOuX SmartOrganizer**, maker **Knoux Technologies**, tagline **"Precision. Intelligence. Control."** Brand personality: sophisticated, confident, sharp, modern, calm, technically advanced, friendly to non-technical users, trustworthy during system operations.

Identity core is fixed: midnight/graphite backgrounds, elevated charcoal panels, KNOuX violet with luminous lavender, restrained indigo highlights, delicate structural borders, fine directional lighting, readable typography, smooth short micro-interactions, strong hierarchy. Violet remains the recognisable brand colour across the whole application; each of the eleven worlds may carry a secondary semantic colour (Applications violet/teal, Files lavender/blue, Storage indigo/cyan, Cleanup warm amber, Startup sky blue, System teal, Repair muted coral/red, Windows Services steel indigo, Network electric cyan, Hardware copper/amber, Automation violet/magenta) and that colour must never displace the identity or be decorative — it must carry functional meaning.

The eleven service worlds are a committed product shape: eleven distinct information architectures, twelve services each (132), sharing one design language. Eleven recoloured copies of the same catalog grid are explicitly rejected, as are 132 generic Run buttons.

## Evidence on Hand

Real code and data paths, not marketing assets: `electron/windows-providers.cjs` (uninstall roots, AppX, CIM collectors, network, hardware), `electron/main.cjs` (operation gate, journals, verification), `electron/verification.cjs`, `electron/privileged-runner.cjs` (frozen repair specs, protected services), `electron/tool-registry.cjs` (the 34 engine specs), `shared/contracts.ts`, `src/index.css` + `src/shell.css` (the token system and shell), `src/studio/**` (flagship Studio), `docs/TOOL_MATRIX.md`, `docs/WINDOWS_SUPPORT_MATRIX.md`, `docs/SECURITY.md`, `docs/PRIVACY.md`, `docs/UNINSTALL_DATA_POLICY.md`, and the committed visual-acceptance harness in `scripts/visual-acceptance-smoke.cjs` + `captureVisualEvidence()` which produces genuine `capturePage()` screenshots in `docs/evidence/visual-acceptance/`.

Known absences future work must not invent: no user base, no testimonials, no benchmark numbers, no press, no pricing, no third-party audit claims, no competitor comparison data. Packaged native folder-picker smoke remains blocked, so destructive Studio flows must not be described as production-ready.

## Product Principles

1. **Instant comprehension** — every screen answers where I am, what this is, what the best action is, what will happen, and whether I can undo it, without a developer-oriented explanation.
2. **Real visual information** — software looks like software, files look like files, drives look like storage hierarchies, services look like services with state, startup mode and dependencies. Representation over decoration.
3. **A spatial language per world** — the shared design system governs consistency; the layout itself is category-specific.
4. **Speed is a product feature** — responsiveness comes from index, cache, incremental work and efficient rendering, and truthfully reports when an index is absent.
5. **Freedom with operational safety** — read-only inspection is effortless; anything that removes, moves, uninstalls, disables or modifies requires a context-specific review flow, and unverified results are never reported as success.

## Accessibility & Inclusion

Arabic RTL and English LTR are required at every surface, including mirrored icons, logical CSS properties, and isolated Latin runs for brand and path text. Dark, light and high-contrast themes must all remain legible; visible focus rings, minimum 24px targets, keyboard-first navigation, and full `prefers-reduced-motion` plus the in-app reduced-motion setting are required. Dense data views must stay readable for non-technical users: plain-language labels, explicit unavailable states, and no meaning carried by colour alone. Text scales with the in-app font-scale setting.
