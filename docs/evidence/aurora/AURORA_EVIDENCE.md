# KNOuX AURORA — packaged visual evidence

This folder records the focused visual milestone. It complements, and does not
overwrite, the canonical 56-scenario report committed at `14867f3`.

## What is shown

| Surface | Before | After |
|---|---|---|
| Home portal — English dark, 1366×768 | `before/en-home-1366x768.png` | `after/after-en-home-1366x768.png` |
| Home portal — Arabic RTL, 1366×768 | `before/ar-home-1366x768.png` | `after/after-ar-home-1366x768.png` |
| Home portal — English light, 1366×768 | — | `after/after-en-home-light-1366x768.png` |
| Home portal — English / Arabic narrow, 860×600 | — | `after/after-en-home-860x600.png`, `after/after-ar-home-860x600.png` |
| Eleven-world portal, 1366×768 | — | `after/after-en-home-portal-1366x768.png` |
| Applications world, 1366×768 | `before/en-applications-1920x1080.png` (wide baseline) | `after/after-en-applications-1366x768.png` |
| Cleanup special stage — dark, 1366×768 | `before/en-cleanup-1366x768.png` | `after/after-en-cleanup-1366x768.png` |
| Cleanup special stage — light, 1366×768 | `before/en-cleanup-light-1366x768.png` | `after/after-en-cleanup-light-1366x768.png` |
| Twelve service cards, 1366×768 | — | `after/after-en-services-1366x768.png` |
| Native service preview dialog, 1366×768 | `before/en-repair-preview-1366x768.png` | `after/after-en-repair-preview-1366x768.png` |
| Flow Studio — English / Arabic, 1366×768 | `before/en-flow-studio-head-1366x768.png`, `before/ar-flow-studio-1920x1080.png` | `after/after-en-flow-studio-1366x768.png`, `after/after-ar-flow-studio-1366x768.png` |
| Flagship Smart Organization Studio, 1366×768 | — | `after/after-en-studio-1366x768.png` |
| Real boot Splash | `before/en-splash-startup.png` | `after/after-en-splash-startup.png` |

Before images are the packaged screenshots committed at `14867f3`. They are
copies, not re-renders. After images are rendered by the packaged build that
contains `src/aurora.css`, the new Home/Splash and shared component polish.

## Capture method and sizes

- The after set was captured from the packaged Electron build with CDP
  `Page.captureScreenshot` at the requested CSS viewport. The host screen's
  natural packaged content area is 1464×875, so 1366×768 and 860×600 were
  applied as Chromium viewport crops at the same DPR. `capture-manifest.json`
  records `naturalViewport`, `emulatedViewport` and the actual PNG dimensions
  per shot. No screenshot is rescaled or composited after capture.
- The Splash was captured from a real boot after a page reload; the renderer
  was paused at the live Splash state, CSS settled on the compositor, and the
  frame was taken before resuming the normal boot. There is no app timer,
  artificial startup delay, fake percentage or fabricated progress. The exact
  splash window and pause metadata are in `after/splash-capture.json`.
- Reference PNGs from the handoff ZIP are not present in the product and are
  not used as production UI.
- The browser chrome/window frame is outside the page capture, as in the
  canonical harness.

## Focus, modal and reduced motion

- The preview remains the native `<dialog>` delivered at `14867f3`:
  `showModal()` supplies a real inert background, Tab stays inside, Escape
  closes, and focus returns to the invoking card. The committed canonical
  report records those checks. AURORA changed only its material treatment.
- New focus styles use the existing `--focus-ring`; all new portal, toolbar,
  card, preset and dialog controls keep keyboard semantics.
- The Splash, orbit and atmosphere animations stop under
  `prefers-reduced-motion` and the product's own reduced-motion setting. The
  Splash then shows a static lit horizon rather than sweeping motion.

## Focused validation observed

- `npm run check` — passed (TypeScript).
- `npm run lint` — passed with zero warnings.
- `npm run build` — passed; 2,079 modules transformed.
- `npx vitest run` — 426 tests across 33 files passed.
- Bundle impact versus the `14867f3` source baseline, built with the same
  toolchain: CSS 225.99 kB → 283.40 kB (+57.41 kB, +25.4%; gzip 36.74 → 48.02
  kB, +11.28 kB). JS 1,102.03 kB → 1,108.92 kB (+6.89 kB; gzip +1.48 kB).
  No new runtime dependency, font, remote asset or package was added.
- The 14 post-change page captures and one real-boot Splash capture listed
  above were taken from the final packaged build. The operation drawer was
  closed before each page capture so a silent background health read is not
  mistaken for UI.

The canonical 56-scenario suite was intentionally not rerun after the visual
layer, per the owner's instruction not to repeat broad test cycles. Its last
green report is preserved from `14867f3`; it is not a post-AURORA result.
Visual screenshots are evidence of appearance, not native safety certification.
No backend engine, IPC permission, service ID or native scheduler contract was
changed by AURORA.
