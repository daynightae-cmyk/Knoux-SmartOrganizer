# KNOuX GEMINI — VOLUME ATLAS STORAGE HANDOFF

**Date:** 2026-10-25
**Branch:** `feat/gemini-ui-foundation-20261025`
**Section:** Mission 07 — Volume Atlas Storage Intelligence
**State:** measured volume capacity, capacity history, folder tree/treemap, folder
ranking, largest files, extension/age distributions, scan coverage and bounded
byte-exact duplicate verification are integrated read-only. SMART, media type,
defrag/TRIM and cleanup/reclaim execution remain unavailable or blocked.

This report distinguishes measured data from the approved storage fixture. It
does not claim whole-volume scanning or storage reclamation.

---

## 1. Reuse matrix

| Asset | State before Mission 07 | Mission 07 action |
|---|---|---|
| `src/pages/StoragePage.tsx` | 12-service design fixture with hardcoded metrics, volumes, treemap and irrelevant/no-op controls | Wired to measured volumes and a read-only Storage adapter; responsive/compact layout; service focus panels; real footer actions |
| `src/lib/storage-inventory.ts` | Static volumes, treemap, largest files and service catalog | Kept as the conspicuous browser fixture; used only when no Electron bridge exists |
| `electron/native/provider-bridge.cjs` → `readSystemSummary` | Existing measured Win32 logical-disk summary | **Reused** for mounted volume capacity/free bytes |
| `electron/windows-providers.cjs` | Existing read-only CIM collector | Reused through the provider bridge; no raw command crosses to React |
| `electron/studio/folder-inventory.cjs` | Existing metadata-only inventory | **Reused** for folder aggregation and scope coverage |
| `electron/native/files-bridge.cjs` | Mission 06 measured overview and file hash | **Reused** for largest/types/ages and bounded duplicate hashing |
| `electron/studio/studio-safety.cjs` / `windows-fs-metadata.cjs` | Existing identity/reparse safety | **Reused** by Files hashing before Storage duplicate verification |
| Root tool-registry defrag/cleanup engines | Not a supported SMART/media-type provider | **Not exposed.** No cleanup, defrag or TRIM capability exists |

---

## 2. Contract v1 additions

Namespace: `knouxStorageV1`; fixed channels and typed envelopes.

| Capability | Channel | Permission | Behavior |
|---|---|---|---|
| `storage.volumes` | `knoux:storage:v1:volumes` | read-only | measured mounted volumes, capacity/free/used, low-space flag, app-data capacity snapshot |
| `storage.history` | `knoux:storage:v1:history` | read-only | persisted capacity points (up to 120), not a whole-volume scanner |
| `storage.analysis` | `knoux:storage:v1:analysis` | read-only | folder tree, top folders, largest, extensions, ages, scan coverage, size-collision candidates |
| `storage.duplicates.verify` | `knoux:storage:v1:duplicates` | read-only | bounded SHA-256 verification of same-size candidates via the Files adapter |

Every call is guarded by the same sender/frame/origin validation as the platform.
Only one structured request object is accepted; no arbitrary path, command,
generic invoke or renderer filesystem access exists.

### Scope rules

- A **volume** is measured from the Windows logical-disk provider. It is labelled
  as such, including the provider and observation time.
- **Folder intelligence** covers only an explicitly authorized folder. The UI
  states `authorized-folder` and `coversWholeVolume: false`; no result is
  presented as a whole C: scan.
- The treemap is built from the cached metadata inventory. Node depth and child
  counts are bounded; the UI reports when aggregation occurs.
- Duplicate **candidates** are same-size groups only. Content verification is a
  separate bounded action with its own file/byte budget and digest results.
- Capacity history contains snapshots captured while this app measured volumes;
  it is not Windows Performance history.
- SMART, media type and physical-disk identity are `null`/unavailable rather
  than guessed. No SSD/HDD classification is inferred from capacity.

No cleanup, delete, move, defrag, TRIM, permission change or restore channel is
exposed. The only write is the app-data capacity snapshot, never a user file.

---

## 3. Twelve canonical services — current reality

| # | Service | Status | Honest behavior |
|---|---|---|---|
| 01 | `storage-disks` | WORKS (identity gap) | Measured mounted volumes and capacity; physical disk identity/serial and SMART are explicitly unavailable. |
| 02 | `storage-large-files` | WORKS | Ranked largest files in the authorized scope. |
| 03 | `storage-duplicates` | PARTIAL | Same-size candidates plus bounded SHA-256 verification; no deletion or automatic keeper policy. |
| 04 | `storage-treemap` | WORKS | Measured folder tree, proportional tiles, drilldown, breadcrumb and bounded node/children limits. |
| 05 | `storage-top-folders` | WORKS | Measured first-level folder ranking with child aggregates. |
| 06 | `storage-filetypes` | WORKS | Extension counts/bytes from the measured inventory. |
| 07 | `storage-scan-overview` | WORKS | Scope, files/folders, last scan, partial/truncated warnings, `coversWholeVolume: false`. |
| 08 | `storage-fragmentation` | BLOCKED | No media-type, defrag or TRIM provider; no recommendation is fabricated. |
| 09 | `storage-smart` | UNAVAILABLE | No supported SMART provider is exposed; telemetry is not invented. |
| 10 | `storage-reclaim` | BLOCKED | Read-only page; redirects to Cleanup/Studio for a separately approved plan. |
| 11 | `storage-history` | PARTIAL | Real snapshots captured on volume reads; no long-term Windows history. |
| 12 | `storage-removable` | UNSUPPORTED | Current provider does not expose drive type, so removable volumes cannot be distinguished. |

The browser fixture still shows the approved storage art; every fixture-only
panel is visibly labelled and no measured Electron state falls back to it.

---

## 4. Safety

- No cleanup from the treemap or inspector.
- No defrag/TRIM recommendation; media type is unknown.
- Duplicate verification is read-only, bounded to 48 files / 256 MB, and reports
  partial results and hash errors.
- Hash reuses the Files identity/reparse checks; a changed file is excluded.
- Capacity snapshot writes only under the app user-data folder, atomically.
- Volume/analysis errors surface as explicit states; fixtures are not substituted
  inside the Electron client.
- Smoke evidence paths stay under the gitignored dependency cache and receipts
  redact user-profile/temp paths.

---

## 5. Verification evidence

### 5.1 Deterministic tests

```
npm run lint
npm run test:native
npm run test:files
npm run test:studio
npm run test:storage
npm run build
```

`test:storage` uses two 2 MB identical files, one 2 MB different file and a small
text file in a temp folder, with a stub measured volume provider:

- volume capacity/free/low-space mapping and unavailable identity/SMART flags;
- folder tree sums equal the measured file bytes;
- folder ranking and extension distribution;
- duplicate candidate count/reclaimable bytes;
- byte-exact verification identifies only the identical pair;
- source file metadata unchanged;
- two capacity snapshots and restart persistence;
- a failed volume provider is surfaced, not replaced by fixtures.

### 5.2 Electron runtime

`npm run desktop:smoke`:

- Storage volumes/history/analysis/duplicates probes PASS;
- measured Storage route renders real volumes, scope, treemap and large files;
- Studio and Files regression probes remain PASS;
- screenshot: `visual-evidence/platform-00/storage-measured-dev.png`.

Packaged proof uses the same `--dir` build and is recorded in
`native-smoke-packaged.json` with `storage-measured-packaged.png`.

### 5.3 Browser interactions and visual set

`visual-evidence/mission-07/storage-interaction-audit.mjs` covers search,
volume selection, fixture honesty, tabs, treemap selection, service focus,
duplicate focus and Arabic RTL: 10/10 PASS.

Twelve captures:
`visual-evidence/mission-07/storage-{dark|light}-{en|ar}-{1366|1672|1920}.png`

All audits report no document-level horizontal scroll, no escaped elements and
zero covered controls. The sticky footer stays visible at 1672 and 1366; the
main content uses its own bounded scroller, and the lower service row is reached
by scrolling that region rather than by a clipped document. The volume
inspector has its own scroll so long metadata never overlaps the footer.
Contrast audits report zero elements below 3:1 in both light and dark mode after
scoping the light treemap ink rule away from the breadcrumb footer.

---

## 6. Control audit

| Control | Behavior | Status |
|---|---|---|
| Volume bay select | updates the inspector and selected state | Working |
| Walk This Volume | opens treemap if the scope is on that volume; otherwise explains the missing grant | Working / honest |
| Explore Folder | opens the Folders tab | Working |
| Volume options | opens the Volume Bays service focus | Working |
| Volume refresh | re-reads the measured provider and appends a capacity snapshot | Native |
| Analysis folder / Rescan / Cancel | Files/Studio source grant, scan, abort | Native |
| Space Map / Large / Types / Age / Folders tabs | measured panels; fixture notice when no scope | Working |
| Treemap tile select / double-click / breadcrumbs / zoom/back/forward/up | real tree navigation | Working |
| Largest items rows | select treemap item / measured file | Working |
| Inspector scroll | bounded internal scroller | Working |
| Service dock (12) | domain focus cells with measured/blocked states | Working |
| Duplicate verify | bounded SHA-256 verification | Native |
| Reclaim / Cleanup / Studio links | navigation only; no mutation | Blocked by design |
| Copy Space Report | writes measured JSON to clipboard; fixture explains | Working |
| Search | filters volumes, largest files, tree and tab rows | Working |
| Language / theme | Arabic RTL and light/dark shell states | Working |

Unsupported capabilities are labelled as unavailable/blocked, never green.

---

## 7. Remaining gaps

1. No physical-disk, volume-serial, SMART or media-type provider; SMART and
   fragmentation panels are intentionally unavailable.
2. No whole-volume scan; folder analysis requires an explicit folder grant and
   is not a substitute for a full C: inventory.
3. No cleanup/delete/defrag/TRIM or reclaim execution; plans must be reviewed in
   Cleanup/Studio.
4. Duplicate hashing is bounded (48 files / 256 MB) with no cancellation/progress
   stream; content verification is opt-in.
5. Capacity history is app-snapshot history only, not a long-term Windows trend.
6. Treemap depth/children/node counts are bounded and may aggregate deeper paths.
7. Removable/external classification cannot be distinguished by the current
   provider.
8. Physical-drive count is displayed as N/A rather than inferred from letters.

---

## 8. Commands and evidence

```
cd apps/gemini-ui
npm run lint
npm run test:native
npm run test:storage
npm run test:files
npm run test:studio
npm run build
npm run desktop:smoke
npm run desktop:pack:temp
node scripts/native-smoke.cjs --packaged --packaged-dir=%TEMP%/knoux-gemini-release/win-unpacked
node visual-evidence/mission-07/storage-interaction-audit.mjs
```

Receipts: `visual-evidence/platform-00/native-smoke-{dev,packaged}.json`
Measured shot: `storage-measured-{dev,packaged}.png`
Visual evidence: `visual-evidence/mission-07/`
Interaction result: `visual-evidence/mission-07/storage-interactions.json`

No user file was moved, deleted, overwritten or permission-changed. No new
branch, no main merge and no destructive Git operation.
