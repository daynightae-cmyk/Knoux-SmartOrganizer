# Release Verification — KNOuX SmartOrganizer

Classification vocabulary used in this document:

| Class | Meaning |
|---|---|
| `RUNTIME_VERIFIED` | Executed against the real Windows APIs on a real machine and the observed result was inspected. |
| `PACKAGED_RUNTIME_VERIFIED` | The same, but executed by the installed/packaged application, outside the source tree. |
| `TEST_VERIFIED` | Proven by an automated test that asserts the behaviour. |
| `STATIC_VERIFIED` | Proven by reading the code; no execution. |
| `PARTIAL` | Some part of the surface is proven and the rest is not. |
| `UNTESTED` | No execution evidence. |
| `BLOCKED` | Cannot be completed here; the precise external blocker is named. |

Environment of this verification run:

| Field | Value |
|---|---|
| Machine | Windows 10 Pro 10.0.19045 x64 (`DESKTOP-VQKU9P8`) |
| Node | v24.21.0 |
| Electron | 43.8.3 |
| electron-builder | 26.15.3 |
| Build host | Developer workstation, K: volume |
| Network | Connected for build; offline behaviour proved separately with Chromium host rules |

---

## 1. The 34 Windows services

Every service below was executed by the **packaged application** (`release/win-unpacked/KNOuX SmartOrganizer.exe`) through the real preload/IPC boundary, and its result was read back from the evidence file. "Dry run" means the service was executed and its allowlisted plan was verified, but no destructive or administrator-class change was performed against the owner's machine — by design.

| # | Service ID | Category | Risk | Admin | Backend | UI | Runtime (packaged) | Last test | Remaining limitation |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `system-health` | system | read-only | no | PASS | PASS | PASS | packaged smoke `health` | Under extreme load the cheap WMI classes can exceed their budget; the tool then falls back to a minimal query and labels the result `degraded`. |
| 2 | `smart-scan` | scan | read-only | no | PASS | PASS | PASS | packaged smoke `smartScan` | Performs three real traversals (Downloads, duplicate verification, temporary folder) and reports that count truthfully. |
| 3 | `disk-overview` | storage | read-only | no | PASS | PASS | PASS | packaged smoke `disks` | Physical-disk detail is absent (and the result partial) when the `MSFT_PhysicalDisk` provider does not answer. |
| 4 | `large-files` | storage | read-only | no | PASS | PASS | PASS | packaged smoke `large` | Bounded by the 50 000-entry scan budget; the truncation is reported. |
| 5 | `duplicate-files` | storage | read-only | no | PASS | PASS | PASS | packaged smoke `duplicates` | Never deletes anything. Hard-linked names are one physical file and free no bytes. |
| 6 | `empty-folders` | files | read-only | no | PASS | PASS | PASS | packaged smoke `emptyFolders` | A folder that cannot be read is reported as inaccessible, not as empty. |
| 7 | `downloads-inventory` | files | read-only | no | PASS | PASS | PASS | packaged smoke `downloadsInventory` | Metadata only; file contents are never read. |
| 8 | `organize-downloads-preview` | files | read-only | no | PASS | PASS | PASS | packaged smoke `preview` | Preview only; it never moves a file. |
| 9 | `organize-downloads-apply` | files | safe-write | no | PASS | PASS | PASS | packaged smoke `apply` | Destination is reserved exclusively, so a name taken after the preview is refused rather than overwritten. |
| 10 | `organize-downloads-undo` | files | safe-write | no | PASS | PASS | PASS | packaged smoke `undo` | Refuses to overwrite an occupied original and says so. |
| 11 | `temp-cleanup-preview` | cleanup | read-only | no | PASS | PASS | PASS | packaged smoke `cleanupPreview` | Preview only. |
| 12 | `temp-cleanup-apply` | cleanup | safe-write | no | PASS | PASS | PASS | packaged smoke `cleanupApply` | Uses a recoverable KNOuX quarantine, not the Windows Recycle Bin, and never deletes permanently. |
| 13 | `temp-cleanup-undo` | cleanup | safe-write | no | PASS | PASS | PASS | packaged smoke `cleanupUndo` | Verified by a post-restore proof, not by the absence of an error. |
| 14 | `startup-items` | startup | read-only | no | PASS | PASS | PASS | packaged smoke `startupItems` | Read scope is the current-user Run key plus the reported read-only sources. |
| 15 | `startup-disable` | startup | safe-write | no | PASS | PASS | PASS | packaged smoke `startupDisable` | Writes only the current-user Run key; every other source is read-only. |
| 16 | `startup-restore` | startup | safe-write | no | PASS | PASS | PASS | packaged smoke `startupRestore` | Refuses to replace an entry another process recreated; restores the exact value and type. |
| 17 | `installed-apps` | applications | read-only | no | PASS | PASS | PASS | packaged smoke `installedApps` | Inventories only. It does not uninstall, and it uses `Get-AppxPackage` rather than `Win32_Product`, which would trigger a repair. Reported size is the recorded estimate, not a measured size. |
| 18 | `network-diagnostics` | network | read-only | no | PASS | PASS | PASS | packaged smoke `networkDiagnostics` | Diagnosis only; it performs no repair and does not touch the active connection. |
| 19 | `hardware-inventory` | hardware | read-only | no | PASS | PASS | PASS | packaged smoke `hardwareInventory` | Temperature is reported as **unavailable**, never as zero. |
| 20 | `event-warnings` | system | read-only | no | PASS | PASS | PASS | packaged smoke `eventWarnings` | Bounded 7-day System-log query, max 200 events. An unreadable log is reported as unreadable, not as an empty log. |
| 21 | `process-inventory` | system | read-only | no | PASS | PASS | PASS | packaged smoke `processes` | Authenticode verification is **opt-in** (it costs tens of seconds). Without it, no signature verdict is claimed at all. |
| 22 | `battery-status` | hardware | read-only | no | PASS | PASS | PASS | packaged smoke `battery` | This machine is a desktop with no battery; "no battery present" is reported as a fact, not as an error. |
| 23 | `file-hash` | files | read-only | no | PASS | PASS | PASS | packaged smoke `hash` | Refuses cloud placeholders and links, and reports a digest as unreliable if the file changed while it was read. |
| 24 | `repair-dism-check-health` | repair | administrator | yes | PASS | PASS | PASS (dry run) | packaged smoke `repairDryRuns` | Windows exposes no post-condition re-query for DISM, so the result is honestly `unverified` (partial). Live execution is deliberately not performed on the owner's machine. |
| 25 | `repair-dism-scan-health` | repair | administrator | yes | PASS | PASS | PASS (dry run) | packaged smoke `repairDryRuns` | As above. |
| 26 | `repair-dism-restore-health` | repair | administrator | yes | PASS | PASS | PASS (dry run) | packaged smoke `repairDryRuns` | As above. Requires a restart to observe the final state. |
| 27 | `repair-sfc-verify-only` | repair | administrator | yes | PASS | PASS | PASS (dry run) | packaged smoke `repairDryRuns` | As above. |
| 28 | `repair-sfc-scan-now` | repair | administrator | yes | PASS | PASS | PASS (dry run) | packaged smoke `repairDryRuns` | As above. |
| 29 | `repair-dns-flush` | repair | administrator | yes | PASS | PASS | PASS (dry run) | packaged smoke `repairDryRuns` | As above. |
| 30 | `repair-winsock-reset` | repair | administrator | yes | PASS | PASS | PASS (dry run) | packaged smoke `repairDryRuns` | As above. Requires a restart. |
| 31 | `repair-tcpip-reset` | repair | administrator | yes | PASS | PASS | PASS (dry run) | packaged smoke `repairDryRuns` | As above. Requires a restart and does not touch the router. |
| 32 | `services-inventory` | services | read-only | no | PASS | PASS | PASS | packaged smoke `servicesInventory` | If the provider does not answer, the tool reports an unavailable inventory instead of an empty service list. |
| 33 | `service-control` | services | administrator | yes | PASS | PASS | PASS (dry run) | packaged smoke `serviceDryRun` | Only a fixed allowlisted action is offered, protected services are refused, and the post-change state is re-queried. Live changes need a controlled environment and elevation. |
| 34 | `service-startup-undo` | services | administrator | yes | PASS | PASS | **UNTESTED** | static + registry tests only | The journal restore path is implemented and unit-covered, but it was **not** executed in the packaged run, because proving it requires a live service startup-type change on an elevated service. |

**Service acceptance summary:** 33 of 34 services were executed by the packaged application. The single `UNTESTED` row is stated above rather than rounded up to a pass.

---

## 2. KNOuX Clipboard Vault — independent end-to-end evidence

Executed by the packaged application against the **real Windows clipboard**, in `docs/evidence/packaged-operations-smoke.json` → `clipboard`:

| Step | Evidence field | Observed |
|---|---|---|
| Capture is opt-in | `enabledBefore` | `true` only after the ordinary settings path enabled it |
| Real clipboard capture | `captured`, `capturedType` | `true`, `text` |
| Captured content | `capturedPreview` | `KNOuX clipboard smoke 1792638858493` |
| Pause honoured | `capturedDuringPause` | `false` — nothing captured while paused |
| Resume honoured | `capturedAfterResume` | `true` |
| Pin | `pinned` | `true` |
| Delete one | `deleted` | `true` |
| Clear history | `clearedItems`, `itemsAfterClear` | `2`, `0` |
| Storage at rest | `storageMode` | `encrypted` (Electron `safeStorage`, operating-system backed) |
| OS key present | `encryptionAvailable` | `true` |

Unit coverage in `tests/clipboard-vault.test.ts` (18 cases) additionally proves: nothing is captured before opt-in, no plaintext is ever written to disk, the memory-only fallback writes nothing at all, entries survive a restart, undecryptable entries are reported instead of silently emptying the vault, item and payload limits are enforced, a password-like item is skipped, and a copied-back item is not re-captured.

**Not claimed:** the vault does not attempt to read password fields, does not scrape windows, and does not pretend Windows can distinguish every private application. Its own page states this.

---

## 3. Required gates on the final source

| Gate | Command | Result |
|---|---|---|
| TypeScript | `npm run check` | PASS |
| ESLint | `npm run lint` | PASS |
| Unit and contract tests | `npm test` | PASS — 225 tests, 18 files |
| Production build | `npm run build` | PASS |
| NSIS distribution | `npm run desktop:dist` | PASS |
| Packaged operation smoke | `npm run smoke:packaged-operations` | PASS |
| Installer lifecycle smoke | `npm run smoke:installer` | PASS |
| Offline packaged smoke | `npm run smoke:offline` | PASS |
| Visual acceptance | `npm run smoke:visual` | PASS — 10 captured scenarios at the claimed sizes, no horizontal overflow |
| Reinstall / user-data preservation | `npm run smoke:reinstall` | PASS — install, run, uninstall, reinstall and run, with the user stores intact |
| Release evidence gate | `node scripts/verify-release.cjs` | PASS |
| Dependency audit | `npm audit --json` | PASS — 0 vulnerabilities across 470 dependencies after the vitest 5.0.5 and Electron 43.8.3 upgrades; raw report in `docs/evidence/dependency-audit.json` |
| Authenticode truth | `npm run signing:verify` | `UNSIGNED_PRODUCTION_CANDIDATE` — see §5 |
| Artifact manifest | `npm run artifact:manifest` | PASS |
| Source CI | `.github/workflows/ci.yml` | PASS on the pushed source - run `39888924705` |
| Windows release gate | `.github/workflows/release-closure.yml` | PASS on the pushed source - run `39888924716`, baseline and final packaged, installer, offline and visual gates |
| Fresh-runner product verification | `clean-machine-verification` | PASS - run `39888924716` (job `clean-machine-verification`): silent install, packaged launch, core operations, uninstall and reinstall on `windows-latest` without a checkout or `node_modules`; unsigned state recorded explicitly |

The current green runs above were produced from repository SHA
`adbc8ebb24db510e1834c9c333ec1f07669aa454`; the packaged application code is
the exact audit-clean build of the commit
`0bf5b6b1ca209e9dc0cdbccc9c545647a4f769a7` (Electron 43.8.3, vitest 5.0.5,
npm audit 0/470), and the delivered artifacts' hashes in
`docs/evidence/FINAL_ARTIFACT_MANIFEST.json` match that build. An earlier release-closure attempt on `1a65c23` hit a
one-off Electron `PostQueuedCompletionStatus` crash in the baseline packaged
smoke; that same smoke passed in the `1a65c23` source-CI run and in both jobs
of the final run, so it is recorded as a non-reproducible runner crash rather
than a product failure. The audit-pinned Electron upgrade changed the shipped
runtime, so all packaged, installer, offline, reinstall and visual evidence
was regenerated against the current build instead of being carried over.

---

## 4. Evidence files

| File | Content |
|---|---|
| `docs/evidence/packaged-operations-smoke.json` | Every exercised operation with its real result, plus the Clipboard Vault evidence. |
| `docs/evidence/packaged-settings-smoke.json` | Settings write/read/reset and the accessibility (RTL, high-contrast, reduced motion, 150% font scale, keyboard focus) transition. |
| `docs/evidence/installer-smoke.json` | Silent NSIS install exit code, installed application smoke exit code, uninstaller exit code and removal of the install directory. |
| `docs/evidence/offline-smoke.json` | The same operation sequence executed with Chromium host rules mapping every host to `0.0.0.0`. |
| `docs/evidence/visual-acceptance.json` and `docs/evidence/visual-acceptance/*.png` | Ten real packaged-application captures (Arabic and English; 860×600, 1024×768, 1366×768 and 1920×1080) with the captured window size and overflow measurements recorded per scenario. |
| `docs/evidence/reinstall-smoke.json` | Install → run → uninstall → reinstall → run, with the surviving `settings.json`, `history.json` and `automations.json` hashes. |
| `docs/evidence/code-signing.json` | The real Authenticode status of both artifacts. |
| `docs/evidence/FINAL_ARTIFACT_MANIFEST.json` | SHA-256, size, source SHA and toolchain versions of the delivered files. |

---

## 5. Remaining blockers, stated exactly

1. **Trusted Authenticode signing — `BLOCKED EXTERNAL`.** No signing certificate or password exists in this repository or on this machine, and none may be fabricated. Both artifacts report an Authenticode status of `UnknownError` (electron-builder applies a placeholder signature block that Windows cannot verify). The release workflow fails closed *when* signing credentials are supplied; with none supplied it produces an explicitly unsigned candidate. The signed public release gate cannot be closed from here.
2. **Fresh-Windows-runner verification — `PASS (product)`.** The CI job `clean-machine-verification` downloaded the exact candidate, installed it silently, launched it, exercised the core operations and accessibility transition, uninstalled it, and reinstalled it on a GitHub-hosted `windows-latest` runner with no checkout and no `node_modules`. It records the unsigned Authenticode state explicitly; the only unmet condition is the trusted signature described in blocker 1.
3. **`service-startup-undo` live execution — `UNTESTED`.** See the matrix row 34.
4. **Administrator-class repair execution — `PARTIAL`.** All eight repair services were executed in dry-run mode and their allowlisted plans verified. Performing the real repairs against the owner's live Windows installation was not authorized and is not claimed.
5. **Multi-DPI visual acceptance — `PARTIAL`.** Ten real packaged-application captures now cover Arabic and English at 860×600, 1024×768, 1366×768 and 1920×1080, with the measured window size asserted against the claim. Windows display-scaling behaviour across a DPI matrix is still not verified, and the evidence file states that scope.
