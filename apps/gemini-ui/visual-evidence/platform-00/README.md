# PLATFORM 00 — Electron bridge evidence

Curated evidence for the secure, read-only Gemini native platform. Nothing here
claims a section engine is connected.

| File | Proof |
|---|---|
| `native-smoke-dev.json` | Real Electron 43.4.1 renderer -> sandboxed preload -> fixed IPC -> reused `windows-providers.cjs`; complete measured system summary and 271-service summary; CSP meta; no Node globals; window-control toggle. |
| `native-bridge-dev.png` / `-light.png` / `-ar-light.png` | Visible native panel in dark, light and Arabic-light with measured OS/CPU/memory/volumes and provenance. |
| `native-smoke-packaged.json` | Same checks from `KNOuX Gemini Preview.exe` loading `resources/app.asar/dist`; packaged=true, unsigned; CSP and provider resolved from `extraResources`. |
| `native-bridge-packaged.png` / `-light.png` / `-ar-light.png` | Packaged runtime panel in dark, light and Arabic-light. |
| `native-smoke-summary-dev.json` / `native-smoke-summary-packaged.json` | Exact command, exit code, bounds and checks. |
| `browser-preview-home-1366.png` / `browser-preview-system-light-1366.png` | Browser preview retains the honest "engine not connected" footer and route layout. |

Run:

```bash
cd apps/gemini-ui
npm run lint
npm run build
npm run test:native
npm run desktop:smoke
npm run desktop:pack:temp
node scripts/native-smoke.cjs --packaged --packaged-dir="%TEMP%\knoux-gemini-release\win-unpacked"
```

The folder picker is implemented but its OS dialog is not automated by the smoke.
No destructive or elevated operation exists in this platform bridge. The workspace
file watcher locks `release/win-unpacked.tmp` on this machine, so package to the
temp output with `desktop:pack:temp`; the same config succeeds there without any
app-code change.
