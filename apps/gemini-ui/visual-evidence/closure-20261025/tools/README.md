# Closure audit tools

These scripts are the exact verification harness used for the 2026-10-25 visual closure.
They expect the Vite renderer at `http://127.0.0.1:3000` and Chrome at the path configured
at the top of each script.

- `cdp-audit.mjs` — captures a route at a given viewport, reports document/horizontal
  scrolling and currently occluded controls, and optionally clicks, evaluates JS or records
  a JSON report.
- `contrast-audit.js` — browser-side probe for dark surfaces and text contrast. Alpha-heavy
  badges are best confirmed visually; the report notes these reviewed exceptions.
- `dark-surfaces.js` — lists remaining dark surfaces on a route.
- `interaction-audit.mjs` — 22 runtime assertions covering Startup tabs/telemetry, theme and
  locale persistence, Ctrl+K, assistant Escape close, Smart Scan service workspaces, Cleanup
  scrolling and Repair watermark containment. Writes `interaction-audit.json` to the audit
  directory configured at the top of the file.

These are verification tools, not part of the application bundle.
