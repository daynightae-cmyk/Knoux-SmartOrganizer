# KNOuX AURORA — UI Source & Adaptation Record

**Date:** 2026-10-24
**Scope:** Premium visual interface only. No native engines, IPC authority, service identities or Studio filesystem behaviour changed.
**Runtime:** React 18.3.1, Electron 43, TypeScript, Vite 6, Lucide, Motion, existing CSS tokens. No new UI runtime or framework was installed.

## Decision

KNOuX keeps its own React primitives and scoped CSS. The audited component libraries were used as **interaction and composition references**, not as a new global design system. This avoids a second provider, competing resets, a React upgrade, a CSS-order fight and an unnecessary bundle increase.

The audit's Mantine-9 / React-19 trap was respected: no Mantine 9, Next.js, Tailwind, Bootstrap, Chakra or Fluent provider was added. The application remains React 18 and offline-first.

## Sources reviewed and how they influenced AURORA

| Upstream source | Version inspected | License | Use in KNOuX | Copied code? | Dependency effect |
|---|---|---|---|---|---|
| [Mantine UI — Navbars](https://ui.mantine.dev/category/navbars/) / [source](https://github.com/mantinedev/ui.mantine.dev) | Upstream showcase at audit date | MIT | Collapsed rail hierarchy, grouped links, active accent, brand lockup | No — original CSS/TSX | None |
| [Mantine UI — Headers](https://ui.mantine.dev/category/headers/) | Upstream showcase at audit date | MIT | Command/search cluster, compact action hierarchy, keyboard hint | No | None |
| [Mantine UI — Buttons](https://ui.mantine.dev/category/buttons/) | Upstream showcase at audit date | MIT | Primary/secondary/quiet/icon family, pressed and disabled depth | No | None |
| [Mantine UI — Application cards](https://ui.mantine.dev/category/app-cards/) | Upstream showcase at audit date | MIT | Service-card material, status placement, action hierarchy | No | None |
| [Mantine UI — Hero](https://ui.mantine.dev/category/hero/) / [Stats](https://ui.mantine.dev/category/stats/) | Upstream showcase at audit date | MIT | Home portal composition, real-data instrument rail | No | None |
| [Mantine UI — Inputs](https://ui.mantine.dev/category/inputs/) | Upstream showcase at audit date | MIT | Search and filter focus treatment | No | None |
| [Mantine Core 8.3.18](https://v8.mantine.dev/) | 8.3.18 (React 18 compatible) | MIT | Evaluated only; not installed because existing primitives cover the visual need | No | None |
| [Microsoft Fluent UI React v9](https://storybooks.fluentui.dev/react/) / [Fluent 2](https://fluent2.microsoft.design/) | Current v9 docs | MIT / asset terms separate | Windows keyboard, focus, modal and dense-desktop behaviour benchmark | No | None |
| [React Flow](https://reactflow.dev/) / [xyflow](https://github.com/xyflow/xyflow) | Current docs | MIT | Evaluated; **not adopted**. The shipped Flow Studio canvas already selects, adds, removes, zooms, pans and previews without another dependency. | No | None |
| [Tabler](https://tabler.io/) | Current | MIT core | Reference only; Bootstrap migration rejected | No | None |
| [React Bits](https://reactbits.dev/) / [license](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md) | Current | MIT + Commons Clause | Inspiration only; no source copied because the additional clause is unnecessary for this product | No | None |
| Figma UI Kit for AI Agent Chat Apps | Community kit linked by the owner | Reference only | Atmosphere, layered light and material quality. No chat architecture, artwork, fonts or assets copied. | No | None |

## Original KNOuX AURORA assets

- Splash planetary horizon, aurora beams, orbit rings and star field: original CSS gradients and geometry.
- Logo and brand lockup: existing KNOuX identity; no external logo download.
- Fonts: the installed Windows Segoe UI Variable / Segoe UI stack only. No remote font.
- Icons: existing Lucide dependency.
- Motion: existing `motion/react` plus CSS. No shader, particle engine or continuous heavyweight render loop.

## New visual layer

`src/aurora.css` is imported last and owns the new token bridge, Shell refinement, Home portal, Splash scene, service-card/preview polish and world-chrome harmonisation. Existing component APIs, page routes, service IDs and the native `<dialog>` lifecycle are preserved.

## Evidence

- Matched baseline captures: `docs/evidence/aurora/before/`.
- Post-implementation captures: `docs/evidence/aurora/after/` (produced with the packaged Electron app).
- The fixed-size capture harness and splash capture tool remain the evidence source. Reference images are never shipped as UI.
