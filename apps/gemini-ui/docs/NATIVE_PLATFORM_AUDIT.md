# KNOuX GEMINI — PLATFORM 00 AUDIT & HANDOFF

**Date:** 2026-10-25
**Branch:** `feat/gemini-ui-foundation-20261025`
**Renderer:** `apps/gemini-ui`
**State:** secure read-only platform gate accepted; section engines remain preview-only

This document is the Platform 00 deliverable: the reuse matrix, the versioned
contract, the security boundary, runtime evidence, and the contract map for the
fourteen section missions. It does **not** claim that 132 service descriptors are
connected.

---

## 1. Reality matrix at the start of Platform 00

| Root asset | State | What Platform 00 did |
|---|---|---|
| `electron/main.cjs` | Existing, unconnected; loads the legacy root `dist` renderer | **Not reused as the Gemini entrypoint.** Repackaging Gemini with the root renderer would have been wrong. |
| `electron/preload.cjs` | Existing, unconnected; exposes the root `knoux` + `knouxStudio` APIs | Left untouched. Gemini gets its own minimal preload. |
| `electron/windows-providers.cjs` | Existing, read-only Windows CIM providers, no Gemini import | **Reused** by the new adapter for `system.summary` and `services.summary`. |
| `electron/studio/*` (folder inventory, IPC, safety) | Existing, unconnected; broad write/plan surface | Only Electron's folder picker is exposed in Platform 00. Studio scanning/planning remains for Mission 03. |
| `electron/privileged-runner.cjs` | Existing, unconnected; elevation/mutation runner | **Not exposed.** Deferred to the sections that own privileged workflows. |
| `electron/settings.cjs` | Existing, unconnected; root settings store | Not used by Gemini. A native settings/credential store belongs to Mission 14. |
| `electron/automation.cjs` | Existing, unconnected | Not exposed; Mission 13. |
| `shared/contracts.ts` | Existing root renderer contracts | Used as reference only. Gemini has its own versioned native contract. |
| Gemini Vite renderer | Works, no native entrypoint, no typed bridge, AI keys in localStorage | New secure shell, preload boundary, typed client, status UI, session-only AI keys. |
| Packaged Gemini runtime | Missing | Built and smoke-tested as an unpacked Electron application (unsigned). |

**Unsafe/unsupported:** raw `ipcRenderer` access, generic invoke channels, renderer
Node/fs/child_process, direct provider execution from React, renderer-held PowerShell
arguments, persistent API keys in localStorage, fake native success badges.

---

## 2. Platform architecture

```
React renderer
  └─ typed client: src/native/client.ts
       └─ window.knouxShell (contract v1)
            └─ sandboxed preload: electron/preload.cjs
                 └─ fixed IPC channels only
                      └─ main guard: sender/frame/origin + argument checks
                           └─ read-only adapter: electron/native/provider-bridge.cjs
                                └─ root electron/windows-providers.cjs (reused)
                                     └─ Win32 CIM via bounded PowerShell (shell:false)
```

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`,
  `webviewTag: false`, `webSecurity: true`.
- The renderer receives no Node, no `ipcRenderer`, no filesystem, no path, no
  environment, no generic execution endpoint.
- The browser preview keeps the original honest footer and never invents a bridge.

---

## 3. Versioned capabilities (contract v1)

Source of truth: `shared/native-contract.json`; renderer types:
`shared/native-contracts.ts`; preload mirror is checked by
`scripts/native-contract-test.cjs`.

| Capability | Channel | Permission | Platform 00 status |
|---|---|---|---|
| `bridge.status` | `knoux:native:v1:status` | read-only | available |
| `system.summary` | `knoux:native:v1:system-summary` | read-only | available on Windows |
| `services.summary` | `knoux:native:v1:services-summary` | read-only | available on Windows |
| `folder.choose` | `knoux:native:v1:choose-folder` | user-initiated | implemented; interactive dialog not automated |
| `window.control` | `knoux:window:v1:control` | user-initiated | minimize / maximize-restore / close |

Every envelope is `{contractVersion, capability, requestId, status, source,
observedAt, permission, warnings, data?|error?, provenance?}`. Status vocabulary:
`available`, `unavailable`, `unsupported`, `permission_denied`, `partial`,
`cancelled`, `failed`, `complete`.

The shared type module also defines the forward shapes for `ProviderCapability`,
`NativeRequest`, `OperationProgress`, `PermissionGate`, `OperationPlan`,
`OperationJournal`, `SourceProvenance` and `Recoverability` so section missions
do not invent incompatible envelopes.

### Provenance rules

- Measured system/service results carry the real provider name, an observation
  timestamp and a coverage value.
- `hostname` is deliberately removed before crossing the bridge; evidence does
  not include it.
- `services.summary` is a count summary, not a raw service list.
- A development fixture is opt-in only (`KNOUX_NATIVE_FIXTURES=1`, never packaged)
  and returns `source: "dev-fixture"` plus a visible warning. The packaged build
  ignores the flag and records that it was ignored.

---

## 4. Security boundary

1. Every IPC handler calls `assertTrustedSender`: the sender must be the one Gemini
   `BrowserWindow`, the top-level main frame, and either the exact dev origin or a
   file path inside the packaged `dist` directory.
2. Every no-payload capability rejects arguments. Window actions are a fixed enum.
3. Handlers never throw raw errors to the renderer; errors are fixed/redacted and
   never include PowerShell command lines or stacks.
4. A build-only CSP meta tag is injected by Vite; packaged Electron also adds a
   CSP response header. `connect-src 'self'` intentionally blocks the old direct
   renderer AI requests.
5. Navigation to unknown origins, new windows, webviews and downloads are denied.
   Permission requests are denied except sanitized clipboard writes.
6. Root native modules remain untouched. The packaged provider is copied as an
   `extraResource` and resolved from `process.resourcesPath/native/`.
7. AI API keys are **session-only** now. No API key, provider, or skip flag is
   written to localStorage. Native secure storage and AI execution belong to
   Mission 14; the UI labels this honestly.

---

## 5. Verification evidence

### 5.1 Static / build

- `npm run lint` (tsc --noEmit): PASS.
- `npm run build` (Vite 8): PASS, CSP meta present, assets file-protocol friendly.
- `npm run test:native`: PASS — contract mirror, fixed channels, no raw IPC,
  security flags, fixture isolation, no AI-key persistence.
- Bundle remains a single ~1.19 MB chunk (non-blocking warning).

### 5.2 Live Electron renderer smoke

`npm run desktop:smoke` — real Electron 43.4.1, built `dist`, temporary profile:

- security: contextIsolation true, sandbox true, nodeIntegration false,
  webSecurity true, webviewTag false, preload bridge present;
- renderer: `window.require` and `window.process` undefined;
- bridge status: available, provider mode measured;
- machine summary: **complete**, real `Win32_OperatingSystem + Win32_Processor +
  Win32_Battery + Win32_PerfFormattedData_PerfOS_Processor + Win32_LogicalDisk`;
- service summary: **complete**, 271 services (summary only);
- CSP meta present;
- maximize + restore window-control toggle PASS;
- screenshot written (273 KB), plus a **light** native-panel capture and an **Arabic RTL light** capture.

Receipt: `visual-evidence/platform-00/native-smoke-dev.json`
Screenshots: `visual-evidence/platform-00/native-bridge-dev.png`, `native-bridge-dev-light.png`, `native-bridge-dev-ar-light.png`

### 5.3 Packaged application smoke

Built with electron-builder 26.15.3 and Electron 43.4.1 (`--dir`, unsigned,
`signAndEditExecutable:false`). The packaged app loaded
`resources/app.asar/dist/index.html`, resolved the provider from
`resources/native/windows-providers.cjs`, and passed the same security/provider
checks:

- packaged: true; CSP meta true; 271 services; real machine summary;
- window controls PASS;
- `KNOUX_NATIVE_FIXTURES` not accepted in the packaged build.

Receipt: `visual-evidence/platform-00/native-smoke-packaged.json`
Screenshots: `native-bridge-packaged.png`, `native-bridge-packaged-light.png`, `native-bridge-packaged-ar-light.png`

**CI:** `.github/workflows/gemini-platform.yml` runs the nested renderer's `npm ci`, TypeScript, production build and native contract/provenance gate on Windows, and uploads the contract result. The interactive Electron/provider smoke requires a real Windows desktop injection and remains a local gate (evidence below); CI does not claim native runtime proof.

**Environment note:** packaging into the D: workspace produced an `EPERM/EBUSY`
rename while a local file watcher held newly extracted Electron files. The same
config built and ran successfully from `%TEMP%\knoux-gemini-release`. Use
`npm run desktop:pack:temp` in this environment; `npm run desktop:pack` writes to
`release-gemini/` on a machine without that watcher lock. No app code is affected.

### 5.4 Visual regression

The platform additions do not alter route layouts. The browser preview still shows
the honest "Visual preview — engine not connected" footer; only the Electron
client can show "Native bridge v1 · read-only". The native panel is read-only and
bounded. The full 14-route visual evidence remains under
`visual-evidence/closure-20261025/`.

**Interactive folder picker:** the capability is implemented with a native folder
dialog, but an OS-level picker cannot be truthfully automated in the smoke without
selecting a real folder. It is intentionally **NOT TESTED in automation**; no
scan or read occurs in Platform 00.

---

## 6. Section-by-section integration contract map

Platform 00 exposes only the first row. Every later mutation must add a fixed,
versioned capability, validation, a permission gate and a plan/journal where
applicable. This table is a routing map, not a claim of implementation.

| Section | Future capabilities (minimum) | Existing source candidate | Risk / gate |
|---|---|---|---|
| Home | aggregation reads only | section providers | read-only fan-in; no direct mutation |
| Smart Scan | scan.start, scan.cancel, scan.results, cleanup.plan | `advanced-local-services.cjs`, tool registry | read-only scan; cleanup is staged + approved |
| Organization Studio | source.pick, source.scan, plan.build, plan.approve, plan.execute, undo | `electron/studio/*` | write; protected paths, symlinks, preview+approval |
| Google Workspace | auth.begin, auth.status, auth.revoke; no fixture connected state | none connected | OAuth consent, least scopes, credential vault |
| Applications | inventory.list, maintenance.plan, update.plan | `windows-providers.cjs` uninstall/appx collectors | staged maintenance; no silent uninstall |
| Files | inventory.scan, query, preview.thumbnail, selection | `folder-inventory.cjs`, fs metadata | read-only; scope + symlink protection |
| Storage | volumes.read, analysis.read | `windows-providers.cjs` disks | read-only |
| Cleanup | scan, plan, approve, execute, restore | cleanup modules/tool registry | destructive; recycle/backup, explicit approval |
| Startup | inventory.read, change.stage, change.apply, rollback | `collectStartupItems`, `startup-manager.cjs` | registry/system change; elevation gate |
| System | system.summary (live), network.read, hardware.read | `windows-providers.cjs` | read-only |
| Repair | diagnostics.run, plan, execute, verify, journal | `verification.cjs`, `privileged-runner.cjs` | privileged; per-tool capability, rollback limits |
| Services | list, inspect, dependency.graph, control | `windows-providers.cjs`, `privileged-runner.cjs` | protected services; explicit confirmation |
| Automation | workflow.list/save/enable/run, event.stream | `automation.cjs` | persistent write; quiet hours, permissions |
| Settings/Assistant | settings.get/update, credential.store, ai.chat, provider.test | `settings.cjs`, new safeStorage bridge | secrets never in renderer/logs; scopes/quotas |

The shared envelope and forward operation types are ready for these additions; the
platform bridge must not be expanded with a generic `execute(channel,args)`.

---

## 7. Remaining external dependencies

1. **Code signing/installer:** Platform 00 proves an unpacked packaged app. It does
   not claim a signed installer or production release.
2. **Interactive folder selection:** implemented but not automated (see above).
3. **Real section data:** all section page fixtures remain design fixtures until
   their missions replace them. The bridge only reads system/service summaries now.
4. **AI, Google OAuth, destructive operations:** deliberately not connected.
5. **Root legacy Electron app:** untouched; no main-branch merge, no K: edits.

---

## 8. Reproduction commands

```bash
cd apps/gemini-ui
npm install
npm run lint
npm run build
npm run test:native
npm run desktop:smoke

# Unsigned unpacked packaged proof
npm run desktop:pack:temp
node scripts/native-smoke.cjs --packaged --packaged-dir="%TEMP%\knoux-gemini-release\win-unpacked"
```

The existing Vite preview remains at `http://127.0.0.1:3000`. The Electron client
is a separate runtime and must not be confused with the browser preview.
