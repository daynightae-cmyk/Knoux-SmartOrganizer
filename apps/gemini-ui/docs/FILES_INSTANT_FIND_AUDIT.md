# KNOuX GEMINI — FILES / INSTANT FIND NATIVE HANDOFF

**Date:** 2026-10-25
**Branch:** `feat/gemini-ui-foundation-20261025`
**Section:** Mission 06 — Instant Find Files Explorer
**State:** read-only measured file discovery, metadata, SHA-256/512, empty-folder
discovery, bounded thumbnails, native open/reveal requests and measured
distributions are integrated. Organization apply/undo remain **BLOCKED**.

This report separates measured provider data from the approved design fixture.
It does not claim a persistent Everything-style watcher, full-text extraction or
a file mutation workflow.

---

## 1. Reuse matrix

| Asset | Status before Mission 06 | Mission 06 action |
|---|---|---|
| `src/pages/FilesPage.tsx` | Rich 12-service design fixture; several controls only showed fixture toasts | Wired to a new read-only Files bridge; filters, privacy labels and control handlers made real or explicitly bounded |
| `src/lib/file-inventory.ts` | Fixture ledger and service descriptors | Kept as the clearly labelled browser fixture; added native file id |
| `src/components/files/FileIcon.tsx` | Existing icon renderer | Reused |
| `src/components/files/FileWorkspaces.tsx` | Generic service modal host | Bypassed for measured service focus; route now uses domain-specific `FilesServiceFocus` |
| `electron/windows-fs-metadata.cjs` | Existing native metadata/identity/reparse engine | **Reused** directly by the Files adapter |
| `electron/studio/folder-inventory.cjs` | Existing metadata-only inventory scanner | **Reused** through the persistent Studio inventory |
| `electron/studio/studio-safety.cjs` | Existing real-directory/path/reparse safety | **Reused** before metadata, hash, open and reveal |
| `electron/studio/studio-thumbnails.cjs` | Bounded OS thumbnails | **Reused** through the Studio bridge |
| `electron/studio/studio-organization.cjs` | Read-only immutable plan builder | Reused by Organization Studio; Files links to it instead of inventing a writer |
| Root tool registry apply/undo engines | Exist but write to disk | **Not exposed.** No apply/undo channel exists |
| Persistent USN journal/watcher | Missing | **Not implemented**; index is on-demand and cached, honestly labelled |

---

## 2. Contract additions

Namespace: `knouxFilesV1`; channels are fixed strings in
`shared/native-contract.json`; TypeScript shapes are in
`shared/native-contracts.ts`.

| Capability | Channel | Permission | Behavior |
|---|---|---|---|
| `files.sources` | `knoux:files:v1:sources` | read-only | persisted authorized sources and counts |
| `files.source.choose` | `knoux:files:v1:source-choose` | user-initiated | Windows folder picker; no typed path accepted |
| `files.inventory.scan` | `knoux:files:v1:inventory-scan` | read-only | metadata-only scan, reparse/protected root refusal |
| `files.inventory.cancel` | `knoux:files:v1:inventory-cancel` | user-initiated | abort active scan |
| `files.inventory.query` | `knoux:files:v1:inventory-query` | read-only | search/category/extension/size/date/sort/pagination |
| `files.thumbnails` | `knoux:files:v1:thumbnails` | read-only | bounded data-URL thumbnails |
| `files.overview` | `knoux:files:v1:overview` | read-only | totals, extension/age distributions, recent/largest rankings |
| `files.metadata` | `knoux:files:v1:metadata` | read-only | path, size, timestamps, identity, Zone.Identifier, honest attributes gap |
| `files.hash` | `knoux:files:v1:hash` | read-only | SHA-256/SHA-512 of one indexed file, 512 MB cap |
| `files.emptyFolders` | `knoux:files:v1:empty-folders` | read-only | bounded directory-only discovery; no cleanup |
| `files.open` | `knoux:files:v1:open` | user-initiated | validated indexed file opened by Windows shell |
| `files.reveal` | `knoux:files:v1:reveal` | user-initiated | validated indexed file revealed in Explorer |

Every handler uses the same sender/frame/origin guard. Inputs are one structured
object; there is no arbitrary path parameter and no generic invoke. Scan progress
is delivered by the existing fixed Studio event channel.

### Data integrity rules

- A file is addressed by its measured index id, never by a renderer path.
- Before metadata/hash/open/reveal, the parent route is resolved under the real
  source root and reparse/cloud entries are refused.
- Size, modification time and file identity are compared with the indexed
  snapshot; a changed file returns `FILES_FILE_CHANGED`.
- Hash opens the file handle, checks size/mtime before reading, streams in
  bounded chunks and re-checks after reading. A changed file yields
  `digestReliable: false` (or an explicit error if it changed before the read).
- Metadata does not invent Windows attributes: the current native provider
  reports `attributesAvailable: false`, surfaced in the UI.
- Zone.Identifier is read as a bounded alternative data stream, not file content.
- `open`/`reveal` return only a requested action; no success is claimed for the
  external Windows application.

**No copy, move, delete, overwrite, rename or permission change is reachable.**

---

## 3. Twelve canonical services — current reality

| # | Service | Status | Measured behavior / limit |
|---|---|---|---|
| 01 | `file-downloads-inventory` | PARTIAL | Authorized source scan with type facets, breadcrumbs, selection and metadata. It does not silently target the real Downloads folder; the user must grant a folder. |
| 02 | `file-organize-preview` | PARTIAL | Links to the immutable measured plan in Organization Studio; no plan is fabricated in the Files page. |
| 03 | `file-organize-apply` | BLOCKED | No write capability, no approval gate, no execute button. |
| 04 | `file-organize-undo` | BLOCKED | No execution journal or undo channel; preview receipts exist only in Studio. |
| 05 | `file-empty-folders` | WORKS | Bounded read-only traversal (5,000 dirs / 12 s / 500 results), skips links, returns partial honestly. Discovery only; no deletion. |
| 06 | `file-hash` | PARTIAL | Real SHA-256/512, identity re-check and 512 MB cap. MD5/BLAKE3, cancellation and progress streaming are not implemented. |
| 07 | `file-search` | PARTIAL | Instant filename/path query with category, extension, size and date filters, sort and a 200-row page. No content index, USN journal or persistent watcher. |
| 08 | `file-type-map` | WORKS | Measured extension distribution with counts/bytes and a stacked bar. |
| 09 | `file-recents` | WORKS | Measured top-20 modified-time ranking. |
| 10 | `file-largest` | WORKS | Measured top-20 size ranking. |
| 11 | `file-metadata` | WORKS (attributes gap) | Real path, bytes, created/modified time, identity, hardlink count and Zone.Identifier; attributes are explicitly unavailable. |
| 12 | `file-provenance` | WORKS | Real source root, scan timestamp, coverage, warnings and read-only permission. |

### 100K responsiveness

A synthetic 100,000-row in-memory index is benchmarked by
`scripts/files-native-test.cjs` (not a claim of a 100K real disk scan):

| Operation | Measured on this workstation |
|---|---|
| Query with search/sort/limit 200 | 73–91 ms |
| Full overview aggregation | 48–68 ms |

Real scans are limited to 10,000 files and 32 levels per source by the Studio
adapter, labelled partial when truncated. This is a deliberate safety limit, not
a claim of a 100K persistent index.

---

## 4. Safety and provenance

- Browser preview is visibly badged `Design fixture preview — not this device`;
  every number on that page is from the approved fixture.
- Electron measured mode is badged `Native measured index — read-only` and uses
  the measured source label, totals and warnings.
- Unavailable folders rows are reported as unsupported, not fabricated.
- The Files list is capped at the first 200 measured matches and says so.
- Hash is read-only; no file content is logged or stored in receipts.
- Open/reveal are the only shell actions. Neither is exposed to a web page.
- Source grants, inventory caches and receipts stay in the app user-data folder.
- Smoke/evidence paths use the gitignored dependency cache; committed receipts
  redact user-profile/temp paths.
- No AI provider, OAuth credential or cloud upload is connected to Files.

---

## 5. Verification evidence

### 5.1 Deterministic tests

```
npm run lint          # tsc --noEmit
npm run test:native   # fixed channels, security flags, no apply/undo capabilities
npm run test:files    # adapter, metadata, Zone.Identifier, SHA-256, empty dirs, 100K benchmark
npm run test:studio   # Studio regression
npm run build
```

`test:files` uses a temporary controlled fixture, writes a test-only
Zone.Identifier ADS, verifies the exact SHA-256, checks unchanged source metadata,
checks stale-file refusal, validates open/reveal against a stub shell and removes
the sandbox. It never touches a user folder.

### 5.2 Electron runtime

`npm run desktop:smoke` (Electron 43.4.1, temp profile, controlled source):

- native bridge and renderer isolation PASS;
- Files sources/query/overview/metadata/hash/empty-folders API probes PASS;
- measured Files route rendered with a real source, seven files and metadata;
- measured Studio library, plan and preview receipts remain PASS;
- measured screenshot: `visual-evidence/platform-00/files-measured-dev.png`;
- light and Arabic RTL captures of the platform panel remain PASS.

Packaged proof uses the same `--dir` build and is recorded in
`native-smoke-packaged.json` with `files-measured-packaged.png`.

### 5.3 Browser interaction audit

`visual-evidence/mission-06/files-interaction-audit.mjs` — 12/12 PASS:

search, category filter, extension filter, size filter, date empty state, size
sort, list/grid switch, select all/footer totals, plan CTA to Studio, Arabic RTL
toggle, and service dock focus. Fixture mode only; native is proven separately.

### 5.4 Visual regression

Twelve captures at 1366×768, 1672×941 and 1920×1080 in dark/light English and
dark/light Arabic RTL:

`visual-evidence/mission-06/files-{dark|light}-{en|ar}-{1366|1672|1920}.png`

All audits report no document-level horizontal scroll, no escaped elements and
zero covered controls. Comparison to `REF-03_Files_Instant_Find.png` preserves
the title bar, sidebar, hero, search, category pills, filters, two distribution
bands, ledger, contextual inspector, service dock and sticky footer. At 1366 the
parent/source columns collapse to keep the inspector visible; the parent column
returns at 1672 and the redundant source column at 1920. Fixture labels remain
visible wherever data is not measured.

---

## 6. Control audit

| Control | Real handler / state | Status |
|---|---|---|
| Global search | filters fixture rows; measured mode schedules native query | Working |
| Category pills | fixture filter or measured backend query | Working; folders unsupported |
| Extension filter | native extension query + fixture filter | Working |
| Size filter | native byte bounds + fixture filter | Working |
| Date filter | native modified-time bound + fixture filter | Working |
| Location filter | fixture source filter; locked to one authorized source in measured mode | Working / bounded |
| Sort | date/name/size sort in both modes | Working |
| List / Grid | renders table or grid cards | Working |
| Row select / select all | real selection set and footer totals | Working |
| Select-all checkbox | real toggle; guarded for zero rows | Working |
| Open | measured validated shell open; fixture does nothing and says so | Native / honest fixture |
| Reveal | measured validated Explorer request | Native / honest fixture |
| Copy Path | real clipboard write; fixture label | Working |
| Calculate SHA-256 | measured hash; fixture notice | Native / honest fixture |
| Inspector previous / next | cycles the visible selection; disabled when empty | Working |
| Inspector expand preview | toggles a larger preview without changing the file | Working |
| Row `•••` | loads measured metadata / explains fixture | Working |
| Plan in Organization Studio | navigates to Studio; no fake “added” claim | Working |
| Live Service Preview | measured source label and honest suggestion gap | Working |
| 12 service dock | domain focus panels with measured/blocked states | Working |
| Empty folders action | bounded read-only native discovery | Working |
| Hash action in focus | calls the same measured hash endpoint | Working |
| Add folder / Rescan / Cancel | native grant/scan/abort | Native; picker not automated |
| Language toggle | Arabic RTL across Files, table headers and filters | Working |
| Apply / Undo | no capability | Blocked |

Known unsupported items are shown in the UI as fixture/blocked/unsupported, not
as green success.

---

## 7. Honest remaining gaps

1. Persistent incremental index/watcher and optional USN journal are not
   implemented; each source is scanned on demand and cached.
2. Full-text content search is not implemented; only names, paths and metadata
   are queried.
3. Cross-volume aggregation and a network-drive fallback are not implemented;
   one authorized source is active at a time.
4. Folder rows are not part of the inventory; empty folders are discovered by a
   separate bounded traversal.
5. Hash is limited to 512 MB and SHA-256/512, with no cancellation/progress UI.
6. Windows file attributes are unavailable from the current native metadata
   provider and are shown as unavailable.
7. Organization apply/undo, copy verification, move/delete and execution journal
   remain blocked. No user file was changed by this mission.
8. Native open/reveal and the OS folder picker are implemented but not automated;
   smoke tests validate their inputs with a stub shell.
9. The 100K benchmark is synthetic/in-memory; disk scan limits remain 10,000
   files per source.

---

## 8. Commands and evidence paths

```
cd apps/gemini-ui
npm run lint
npm run test:native
npm run test:files
npm run test:studio
npm run build
npm run desktop:smoke
npm run desktop:pack:temp
node scripts/native-smoke.cjs --packaged --packaged-dir=%TEMP%/knoux-gemini-release/win-unpacked
node visual-evidence/mission-06/files-interaction-audit.mjs
```

Receipts: `visual-evidence/platform-00/native-smoke-{dev,packaged}.json`
Measured shots: `files-measured-{dev,packaged}.png`
Browser evidence: `visual-evidence/mission-06/`
Interaction result: `visual-evidence/mission-06/files-interactions.json`

No new branch, no main merge, no destructive Git operation, no user-file
mutation.
