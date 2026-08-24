# Production Status — KNOuX SmartOrganizer

| Feature | Implementation | Test | Packaged verification | Status | Evidence |
|---|---|---|---|---|---|
| One root Electron architecture | Electron main, preload, React/Vite renderer | TypeScript + lint | win-unpacked start smoke | PASS | `electron/main.cjs`, `electron/preload.cjs` |
| Secure renderer isolation | no Node integration, context isolation, sandbox and web security | static review | packaged start smoke | PASS | BrowserWindow webPreferences |
| Typed allowlisted IPC | Named preload APIs; strict per-tool Zod inputs; no command bridge | registry and rejection tests | packaged settings APIs invoked through preload | PASS | `electron/preload.cjs`, `electron/tool-registry.cjs`, packaged smoke evidence |
| Global tool registry | 34 handlers with risk, schemas, capability probes and lifecycle metadata | registry consistency, rejection and renderer-safety tests | 34 serialized tools verified in package | PASS | `electron/tool-registry.cjs`, `tests/tool-registry.test.ts`, `docs/evidence/packaged-operations-smoke.json` |
| Local settings | Complete schema v2, strict validation, migration, atomic writes and backups | load/save/restart/import/reset/invalid/migration/unknown-key tests | write/read/reset through packaged preload IPC | PASS | `electron/settings.cjs`, `tests/settings.test.ts`, packaged smoke evidence |
| Operation lifecycle/history/logs | Full phase contract, cancellation token, history, undo metadata and NDJSON log | renderer contract | packaged IPC smoke observed queued, preflight, running, progress and cancelled phases from an isolated cancellation fixture | PASS | `scripts/packaged-operations-smoke.cjs`, `docs/evidence/packaged-operations-smoke.json` |
| Read-only Windows tools | 19 bounded read-only handlers across system, files, applications, network and hardware | localization and registry contracts | packaged smoke exercised health, disks, hash, large files, duplicates, processes, battery, startup, applications, network, hardware, events, empty folders and downloads inventory | PASS | `scripts/packaged-operations-smoke.cjs`, `docs/evidence/packaged-operations-smoke.json` |
| Smart Scan | real non-destructive local collection | code review | packaged smoke completed Smart Scan through the preload contract | PASS | `smartScan` handler, `docs/evidence/packaged-operations-smoke.json` |
| Arabic / English / RTL | AR/EN dictionaries, full settings copy, document direction switch | parity test | packaged setting transition set Arabic `lang=ar` and `dir=rtl` | PASS | `src/locales.ts`, `docs/evidence/packaged-operations-smoke.json` |
| Accessibility and DPI | semantic controls, visible controls and responsive layout | packaged focus and runtime setting-transition test | packaged high-contrast theme, reduced motion, 150% font scale and keyboard focus verified | PASS | `src/App.tsx`, `docs/evidence/packaged-operations-smoke.json` |
| Cleanup/write actions/undo | recoverable temporary-file quarantine with preview, explicit confirmation and local undo journal | cleanup schema and registry tests | packaged disposable fixture proved preview of one eligible file, quarantine, restoration and no permanent deletion | PASS | `scripts/packaged-operations-smoke.cjs`, `docs/evidence/packaged-operations-smoke.json` |
| Startup manager | current-user Run value disable and restore only; strict name schema, explicit confirmation and local undo journal | isolated manager schema, dry-run and no-overwrite tests | packaged unique owned Run value disabled, restored and removed after smoke | PASS | `electron/startup-manager.cjs`, `tests/startup-manager.test.ts`, `docs/evidence/packaged-operations-smoke.json` |
| Repair Center / admin actions | 8 allowlisted DISM, SFC and network-repair handlers with per-operation UAC | 9 allowlist, deep-freeze, dry-run, injection and executor tests | packaged smoke planned all eight allowlisted operations in dry-run mode; no live repair is used as test evidence by safety design | PASS | `electron/privileged-runner.cjs`, `tests/privileged-runner.test.ts`, `docs/evidence/packaged-operations-smoke.json` |
| Services manager | bounded inventory, protected allowlist control and startup undo journal | strict service/action schema and registry tests | packaged smoke inventoried services and planned a fixed `manual` action for a non-protected service in dry-run mode; no live service change is used as test evidence | PASS | `electron/privileged-runner.cjs`, `docs/evidence/packaged-operations-smoke.json` |
| Automation | durable local schedules restricted to bounded read-only tools and fixed Task Scheduler arguments | allowlist, persistence, malformed-input, pause/resume/run-history tests | packaged smoke created, ran, recorded and removed a `system-health` schedule | PASS | `electron/automation.cjs`, `tests/automation.test.ts`, `docs/evidence/packaged-operations-smoke.json` |
| NSIS setup | Electron Builder NSIS configuration | installer build | install/launch/uninstall smoke recorded | PASS | `release/KNOuX-SmartOrganizer-Setup-x64.exe` |
| CI / release closure | Ubuntu source CI plus a Windows release-closure gate on `main` | check, lint, tests, build, packaging, packaged/installer/offline smokes, final Authenticode/hash verification, fresh-runner install verification | Workflow definition is committed; signed-release completion still requires a real workflow result for the exact closure SHA and a trusted Authenticode identity | PENDING EXTERNAL | `.github/workflows/ci.yml`, `.github/workflows/release-closure.yml` |

## Release position

This remains an **unsigned production candidate**. The release-closure workflow was added to `main` in commit `8819314330b8512488102afb696913ef3c9e62e5`. It fails closed if the final installer and application executable are not both reported by Windows as `Valid` Authenticode signatures with timestamps, and it verifies the downloaded installer again on a fresh GitHub-hosted Windows runner without a repository checkout or `node_modules` in that verification job.

The status must not be changed to `SIGNED_PRODUCTION_RELEASE` until the exact final workflow artifact is signed by a trusted external identity and the corresponding Windows jobs complete successfully. The workflow expects signing material through protected GitHub secrets named `WINDOWS_SIGNING_PFX_BASE64` and `WINDOWS_SIGNING_PFX_PASSWORD`; no certificate or password is stored in this repository.

## Verification evidence

| Gate | Result | Evidence |
|---|---|---|
| TypeScript | PASS | `npm run check` completed successfully |
| Lint | PASS | `npm run lint` completed successfully |
| Unit / contract tests | PASS | Vitest: 37 tests passed across contracts, settings storage, registry security, privileged allowlisting, automation, startup recovery and localization parity |
| Production build | PASS | `npm run build` completed successfully |
| Packaged app smoke | PASS | Isolated packaged preload IPC proved tool enumeration and settings v2 write/read/reset; `docs/evidence/packaged-settings-smoke.json` |
| Installer smoke | PASS | silent install exit 0; installed app started; uninstaller exit 0; temporary install directory removed |
| Offline core | PASS | Packaged application ran with Chromium host mapping `MAP * 0.0.0.0`; local health, disk, hash, duplicate, organizer, and settings flows completed. See `docs/evidence/OFFLINE_TEST.md` and `offline-smoke.json`. |
| Trusted Authenticode | BLOCKED EXTERNAL | Requires a trusted certificate/signing identity outside the repository. No self-signed substitute is accepted. |
| Signed-artifact Windows closure | PENDING EXTERNAL | `.github/workflows/release-closure.yml`; must pass for the exact final source SHA and uploaded artifact before release status changes. |

## Final local artifacts

| Artifact | Path | SHA-256 |
|---|---|---|
| NSIS setup | `release/KNOuX-SmartOrganizer-Setup-x64.exe` | `AF33BBEFCEB5DD9588625CCF987D9AC21995E9D44792A9628905A1384B019E1F` |
| Unpacked executable | `release/win-unpacked/KNOuX SmartOrganizer.exe` | `A28F8F2F45D3FB7C5FA48165E65E399909BD9BF55521026D639BA35DAA740D93` |
| File organizer | User-selected source, preview, explicit-confirm conflict-safe moves and local undo journal | check/lint/test/build | packaged disposable fixture preview/apply/undo PASS | PASS | `docs/evidence/packaged-operations-smoke.json` |
| Settings import / export / reset | Local JSON dialogs through named IPC; strict complete-document import; section/all reset | 11 storage tests cover valid import, persisted import after restart, malformed/unknown input rejection and resets | packaged write/read/section reset PASS; named dialog-backed export/import handlers are constrained to JSON selection | PASS | `electron/main.cjs`, `electron/settings.cjs`, `tests/settings.test.ts` |

## Latest artifact rebuild

| Artifact | SHA-256 |
|---|---|
| NSIS setup after settings update | `D762E732187F49AAF9C3085CF7FAF1BE8771B03051BFD3422B16652462ABBF01` |
| Unpacked executable after settings update | `6454CEC9B4991CC320EE84727805B07ECE64A1167B3F68842C1AF7418E98584C` |
