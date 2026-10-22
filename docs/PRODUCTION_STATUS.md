# Production Status — KNOuX SmartOrganizer

| Field | Value |
|---|---|
| Product | KNOuX SmartOrganizer |
| Version | 0.4.0 |
| Repository | `https://github.com/daynightae-cmyk/Knoux-SmartOrganizer.git` |
| Final source SHA | see `docs/evidence/FINAL_ARTIFACT_MANIFEST.json` → `gitSha` |
| Target | Windows 10/11 x64 |
| Release position | **Unsigned production candidate** — the signed public release gate is blocked on an external signing identity. |

## Status table

| Feature | Implementation | Test | Packaged verification | Status | Evidence |
|---|---|---|---|---|---|
| One root Electron architecture | Electron main, preload, React/Vite renderer | TypeScript + lint | win-unpacked start smoke | PASS | `electron/main.cjs`, `electron/preload.cjs` |
| Secure renderer isolation | no Node integration, context isolation, sandbox and web security | static review | packaged start smoke | PASS | BrowserWindow webPreferences |
| Typed allowlisted IPC | Named preload APIs; strict per-tool Zod inputs; no command bridge | registry and rejection tests | packaged settings APIs invoked through preload | PASS | `electron/preload.cjs`, `electron/tool-registry.cjs`, packaged smoke evidence |
| Global tool registry | 34 handlers with risk, schemas, capability probes and lifecycle metadata | registry consistency, rejection and renderer-safety tests | 34 serialized tools verified in package | PASS | `electron/tool-registry.cjs`, `tests/tool-registry.test.ts` |
| Local settings | Complete schema v2 with a `clipboard` section, strict validation, migration, atomic writes and backups | load/save/restart/import/reset/invalid/migration/unknown-key tests | write/read/reset through packaged preload IPC | PASS | `electron/settings.cjs`, `tests/settings.test.ts` |
| Operation lifecycle/history/logs | Full phase contract, cancellation token, history, undo metadata and a redacted, rotated NDJSON log | renderer contract | packaged IPC smoke observed queued, preflight, running, progress and cancelled phases from an isolated cancellation fixture | PASS | `scripts/packaged-operations-smoke.cjs` |
| Read-only Windows tools | 18 bounded read-only handlers across system, files, applications, network and hardware | localization and registry contracts | packaged smoke exercised health, disks, hash, large files, duplicates, processes, battery, startup, applications, network, hardware, events, empty folders and downloads inventory | PASS | `docs/evidence/packaged-operations-smoke.json` |
| Smart Scan | real non-destructive local collection over three real traversals | code review | packaged smoke completed Smart Scan through the preload contract | PASS | `docs/evidence/packaged-operations-smoke.json` |
| KNOuX Clipboard Vault | opt-in local clipboard history with operating-system-backed encryption, pause/resume, private mode, search, pin, delete, clear and copy-back | 17 vault tests | the packaged application captured a **real Windows clipboard** entry, honoured pause and resume, pinned, deleted and cleared it | PASS | `docs/evidence/packaged-operations-smoke.json` → `clipboard` |
| Arabic / English / RTL | AR/EN dictionaries, full settings copy, document direction switch | parity test | packaged setting transition set Arabic `lang=ar` and `dir=rtl` | PASS | `src/locales.ts` |
| Accessibility and DPI | semantic controls, visible controls and responsive layout | packaged focus and runtime setting-transition test | packaged high-contrast theme, reduced motion, 150% font scale and keyboard focus verified | PASS | `docs/evidence/packaged-operations-smoke.json` |
| Cleanup/write actions/undo | recoverable temporary-file quarantine with preview, explicit confirmation, journal written before the first move and local undo | cleanup schema and registry tests | packaged disposable fixture proved preview of one eligible file, quarantine, restoration and no permanent deletion | PASS | `docs/evidence/packaged-operations-smoke.json` |
| File organization | preview, explicit confirm, exclusive destination reservation, cross-volume staging with size verification, and an undo that never overwrites | safe-move tests | packaged disposable fixture proved preview, apply and undo | PASS | `electron/safe-move.cjs`, `tests/safe-move.test.ts` |
| Startup manager | current-user Run value disable and restore only; strict name schema, explicit confirmation and a local undo journal | isolated manager schema, dry-run, unreadable-key and no-overwrite tests | packaged unique owned Run value disabled, restored and removed after smoke | PASS | `electron/startup-manager.cjs`, `tests/startup-manager.test.ts` |
| Repair Center / admin actions | 8 allowlisted DISM, SFC and network-repair handlers with per-operation UAC | allowlist, deep-freeze, dry-run, injection and executor tests | packaged smoke planned all eight allowlisted operations in dry-run mode; no live repair is used as test evidence by safety design | PASS | `electron/privileged-runner.cjs`, `tests/privileged-runner.test.ts` |
| Services manager | bounded inventory, protected allowlist control and startup undo journal | strict service/action schema and registry tests | packaged smoke inventoried services and planned a fixed `manual` action for a non-protected service in dry-run mode; no live service change is used as test evidence | PASS | `electron/privileged-runner.cjs` |
| Automation | durable local schedules restricted to bounded read-only tools and fixed Task Scheduler arguments | allowlist, persistence, malformed-input, pause/resume/run-history and command-line-leak tests | packaged smoke created, ran, recorded and removed a `system-health` schedule | PASS | `electron/automation.cjs`, `tests/automation.test.ts` |
| History export | JSON and CSV serialization with a proven round trip | 7 export tests including Arabic, quotes, commas, newlines, empty history and failure entries | packaged smoke exercised the same code path | PASS | `electron/history-export.cjs`, `tests/history-export.test.ts` |
| Diagnostics export | local support bundle with redacted paths and no clipboard content | static review | reachable from Settings | PASS | `electron/main.cjs` → `buildDiagnostics` |
| NSIS setup | Electron Builder NSIS configuration | installer build | install/launch/uninstall smoke recorded | PASS | `docs/evidence/installer-smoke.json` |
| CI / release closure | Ubuntu source CI plus a Windows release-closure gate on `main` | check, lint, tests, build, packaging, packaged/installer/offline smokes, Authenticode verification, artifact manifest, fresh-runner install verification | Source CI run `39831532810` and Windows release-closure run `39831532797` (including the fresh-runner job) pass on repository SHA `6329c6e`; the signed public release gate remains blocked on the external certificate | PASS (unsigned candidate) | `.github/workflows/ci.yml`, `.github/workflows/release-closure.yml` |

## Release position

This is an **unsigned production candidate**, and it is labelled that way everywhere it matters: in the About section, in the exported diagnostics bundle, in `docs/evidence/code-signing.json`, in the artifact manifest and in this document.

The release-closure workflow fails closed **when signing credentials are supplied** (`WINDOWS_SIGNING_PFX_BASE64` and `WINDOWS_SIGNING_PFX_PASSWORD`). With no credentials available it produces an explicitly unsigned candidate and says so, instead of pretending the gate passed. No certificate, password or key is stored in this repository, and the release gate scans for committed key material.

The status must not change to a signed production release until the exact final workflow artifact is signed by a trusted external identity and the corresponding Windows jobs complete successfully.

## Verification evidence

| Gate | Result | Evidence |
|---|---|---|
| TypeScript | PASS | `npm run check` |
| Lint | PASS | `npm run lint` |
| Unit and contract tests | PASS | 225 tests across 18 files |
| Production build | PASS | `npm run build` |
| Packaged operation smoke | PASS | `docs/evidence/packaged-operations-smoke.json` — 34 operations, including the real Windows Clipboard Vault round trip |
| Installer smoke | PASS | `docs/evidence/installer-smoke.json` — silent install, installed-app launch and uninstall all exit 0; install directory removed |
| Packaged settings and accessibility smoke | PASS | `docs/evidence/packaged-settings-smoke.json` — settings write/read/reset plus the RTL, high-contrast, reduced-motion, font-scale and keyboard-focus transition |
| Offline core | PASS | `docs/evidence/offline-smoke.json` — the same operation sequence with Chromium host mapping `MAP * 0.0.0.0` |
| Reinstall / user-data preservation | PASS | `docs/evidence/reinstall-smoke.json` — install, run, uninstall, reinstall and run again; `settings.json`, `history.json` and `automations.json` survived the uninstall with matching SHA-256 |
| Visual acceptance | PASS | `docs/evidence/visual-acceptance.json` — 10 real packaged-application captures (AR/EN, 860×600 to 1920×1080) with the measured window size matching each claim and no horizontal overflow |
| Source CI | PASS | GitHub Actions run `39831532810` on repository SHA `6329c6e` |
| Windows release gate | PASS | GitHub Actions run `39831532797` on repository SHA `6329c6e` — baseline and final packaged, installer, offline and visual gates |
| Release evidence gate | PASS | `node scripts/verify-release.cjs` |
| Artifact manifest | PASS | `npm run artifact:manifest`; SHA-256 independently re-hashed from the delivered files |
| Trusted Authenticode | BLOCKED EXTERNAL | Requires a trusted certificate outside the repository. No self-signed substitute is accepted. `docs/evidence/code-signing.json` records `UNSIGNED_PRODUCTION_CANDIDATE`. |
| Signed-artifact Windows closure | BLOCKED EXTERNAL | The unsigned candidate passes the Windows release gate and the fresh-runner product verification. A trusted timestamped Authenticode signature is still required for a signed public release; no substitute is accepted. |
| Fresh Windows runner | PASS (product) | `clean-machine-verification` installed, launched, exercised, uninstalled and reinstalled the candidate on `windows-latest` with no checkout and no `node_modules`; the job records the unsigned Authenticode state explicitly. |

## Delivered artifacts

| Artifact | Path | SHA-256 |
|---|---|---|
| NSIS setup | `K:\Knoux Projects\KNOuX SmartOrganizer\Release\KNOuX-SmartOrganizer-Setup-x64.exe` | see `docs/evidence/FINAL_ARTIFACT_MANIFEST.json` |
| Unpacked executable | `K:\Knoux Projects\KNOuX SmartOrganizer\Release\KNOuX SmartOrganizer.exe` | see `docs/evidence/FINAL_ARTIFACT_MANIFEST.json` |
| Evidence bundle | `K:\Knoux Projects\KNOuX SmartOrganizer\Release\evidence\` | — |

The manifest is regenerated from the files on disk by `npm run artifact:manifest`, so the hashes cannot drift away from the delivered binaries.
