# KNOuX GEMINI — ORGANIZATION STUDIO NATIVE HANDOFF

**Date:** 2026-10-25
**Branch:** `feat/gemini-ui-foundation-20261025`
**Section:** Mission 03 — Smart Organization Studio
**State:** read-only measured Studio is integrated and smoke-tested. Execution,
copy/move/delete/overwrite and undo are **BLOCKED** because no write capability
or explicit user approval exists in this build.

This document separates measured native behavior from design fixtures. It does
not claim a completed file operation, a copy verification, an execution journal
or rollback. Those remain a separate, approval-gated mission.

---

## 1. Architecture

```
Studio React UI (nine existing stages, preserved)
  └─ typed client: src/studio/native.ts
       └─ window.knouxStudioV1 (contract v1, separate from knouxShell)
            └─ sandboxed preload: electron/preload.cjs
                 └─ fixed Studio IPC channels + sender/frame/origin guard
                      └─ electron/native/studio-bridge.cjs (new adapter)
                           ├─ reused electron/studio/folder-inventory.cjs
                           ├─ reused electron/studio/folder-categories.cjs
                           ├─ reused electron/studio/studio-organization.cjs
                           ├─ reused electron/studio/studio-safety.cjs
                           ├─ reused electron/studio/studio-thumbnails.cjs
                           └─ reused electron/windows-fs-metadata.cjs
```

The root engines are reused, not reimplemented. The adapter adds persistence
under the Gemini user-data folder:

- `gemini-studio/sources.json` — authorized source grants;
- `gemini-studio/inventories/<source-id>.json` — metadata-only inventory cache;
- `gemini-studio/preview-history.json` — immutable preview receipts;
- `gemini-studio/organization-journal.json` — planner journal (preview entries only).

No renderer path, filesystem module, raw `ipcRenderer`, generic invoke channel or
PowerShell argument crosses the bridge. Smoke sources live under the gitignored
Dependency cache and committed receipts redact home/temp paths.

---

## 2. Contract v1 additions

| Capability | Channel | Permission | Implementation |
|---|---|---|---|
| `studio.sources` | `knoux:studio:v1:sources` | read-only | persisted source list + cached counts |
| `studio.source.choose` | `knoux:studio:v1:source-choose` | user-initiated | Windows folder picker, read-only grant |
| `studio.source.remove` | `knoux:studio:v1:source-remove` | user-initiated | removes grant + cached inventory; no user file touched |
| `studio.inventory.scan` | `knoux:studio:v1:inventory-scan` | read-only | metadata-only scan, reparse/protected root refusal |
| `studio.inventory.cancel` | `knoux:studio:v1:inventory-cancel` | user-initiated | aborts an active scan, preserves partial index |
| `studio.inventory.query` | `knoux:studio:v1:inventory-query` | read-only | category/search/sort page over the cached index |
| `studio.thumbnails` | `knoux:studio:v1:thumbnails` | read-only | bounded OS thumbnails as data URLs |
| `studio.destination.choose` | `knoux:studio:v1:destination-choose` | user-initiated | picker + real-directory + write-access check; no probe write |
| `studio.plan.preview` | `knoux:studio:v1:plan-preview` | read-only | immutable plan, collisions, totals, preview receipt |
| `studio.preview.history` | `knoux:studio:v1:preview-history` | read-only | persisted preview receipts only |
| `studio.event` | `knoux:studio:v1:event` | receive-only | scan progress/complete/cancel/fail |

`studioEvent` is the only event subscription. The platform `knouxShell` namespace
exposes no event stream, no `send`, and no generic invoke.

### Plan safety

`previewPlan` returns:

- `previewOnly: true`;
- `execution: 'blocked_explicit_approval_required'`;
- a plan hash, source roots, totals, collisions, skipped rows and warnings;
- virtual plans with `targetPath: null` (no filesystem target);
- copy/move plans rejected with `STUDIO_DESTINATION_REQUIRED` until a native
  destination grant exists;
- a maximum of 10,000 files per plan and 500 returned rows (truncated flag).

No execute, approve, apply, copy, move, delete, overwrite or undo channel exists.

---

## 3. Native behavior verified

The adapter test (`npm run test:studio`) creates a temporary controlled source,
never a user folder:

- source grant returns a durable id and survives restart;
- read-only scan finds the fixture files and folders;
- categories include image/document/code/spreadsheet;
- query returns rows with UI category/name;
- thumbnails method answers safely without Electron (`THUMBNAILS_UNAVAILABLE`);
  in Electron, measured image PNGs return data-URL thumbnails;
- virtual plan counts measured files, has no target paths, is preview-only and
  execution-blocked;
- preview receipt matches the plan hash and survives restart;
- source file count and metadata are unchanged before/after;
- protected Windows roots are refused (`STUDIO_PROTECTED_ROOT`);
- copy plan without a destination is refused (`STUDIO_DESTINATION_REQUIRED`).

The contract test (`npm run test:native`) additionally proves:

- the fixed Studio channels are mirrored in the preload;
- only the fixed Studio event channel is subscribed;
- the platform shell exposes no event stream;
- no renderer API-key persistence exists;
- context isolation, sandbox, no Node integration and CSP remain intact.

---

## 4. Runtime evidence

### 4.1 Development Electron smoke

`npm run desktop:smoke` — real Electron 43.4.1, built `dist`, temporary profile,
controlled source at `<temp>/studio-source`:

| Check | Result |
|---|---|
| security, preload bridge, renderer isolation | PASS |
| measured system + 271-service summary | PASS |
| Studio sources / query / plan / preview history | PASS |
| Studio thumbnails (3 image data URLs; TXT provider correctly fails) | PASS |
| measured Studio banner + library screenshot | PASS |
| rendered Stage 6 plan review (`MEASURED PREVIEW`, blocked execution) | PASS |
| rendered Stage 8 persisted preview receipts (no fixture journal) | PASS |
| light + Arabic RTL native panel screenshots | PASS |
| maximize/restore window control | PASS |

Receipt: `visual-evidence/platform-00/native-smoke-dev.json`
Screenshots: `studio-measured-dev.png`, `studio-plan-dev.png`,
`studio-history-dev.png`, plus the native panel light/RTL captures.

### 4.2 Packaged Electron smoke

Built with electron-builder 26.15.3 / Electron 43.4.1 (`--dir`, unsigned) into
`%TEMP%\knoux-gemini-release` to avoid the workspace watcher lock. The packaged
app resolves Studio engines from `resources/native/studio`, loads the asar
renderer, and passed the same checks.

Receipt: `visual-evidence/platform-00/native-smoke-packaged.json`
Screenshots: `studio-measured-packaged.png`, `studio-plan-packaged.png`,
`studio-history-packaged.png`.

### 4.3 Browser runtime interactions

`visual-evidence/mission-03/studio-interaction-audit.mjs` — one headless Chrome
session against the existing Vite preview at `127.0.0.1:3000`, fixture mode:

- 9/9 stage controls rendered and navigable;
- category selection filters the gallery; non-image fixture categories show an
  explicit empty state rather than mislabeled image samples;
- Select All changes the selection summary; Deselect All clears it;
- sort control updates the library order state;
- Studio language toggle produces Arabic RTL (`dir="rtl"`);
- footer plan CTA opens Stage 6;
- Stage 6 states that execution is locked/explicit approval required.

Result: `visual-evidence/mission-03/studio-interactions.json` (9/9 PASS).
The browser is **fixture mode only**; native proof is the Electron smoke above.

### 4.4 Visual regression set

12 captures at 1366×768, 1672×941 and 1920×1080, in dark/light English and
dark/light Arabic RTL, from the live renderer:

`visual-evidence/mission-03/studio-{dark|light}-{en|ar}-{1366|1672|1920}.png`

All 12 audits report no horizontal document overflow, no escaped elements and
zero covered controls. Arabic captures use the Studio's own language toggle, not
only the document language seed. A contrast pass found zero elements below 3:1 in
light mode and one 10px date label at 2.94:1 in dark mode; it is recorded, not
silently ignored.

Comparison to the approved reference `REF-01_Smart_Organization_Studio.png`:
composition, titlebar, sidebar, telemetry row, nine-stage bar, category grid,
gallery, inspector, footer and dark navy/cyan/violet identity are preserved. The
new provenance banner is an intentional honesty addition. Native data is smaller
than the reference dataset (1 source / 7 files in the controlled smoke), so the
reference counts are never presented as measured. Browser fixtures are visibly
badged `FIXTURE`; Electron data is badged `MEASURED`.

---

## 5. Control / action audit

Status vocabulary: **Working** (real state change), **Native** (real Windows
capability), **Draft** (local state only; never written), **Fixture** (browser
design data, clearly labeled), **Blocked** (no capability by design), **Untested**
(implemented but not safely automatable).

| Area | Control | Handler effect | Status |
|---|---|---|---|
| Title bar | Studio language toggle | sets Studio + global locale, RTL/LTR | Working (runtime tested) |
| Title bar | Dev Scenarios | opens fixture scenario modal | Fixture only |
| Title bar | Reset to Ref | restores fixture/draft state, not native source | Fixture only |
| Title bar | Assistant trigger | opens existing AI panel | Working (AI itself unconnected) |
| Title bar | Minimize / Maximize / Close | fixed window-control IPC | Native (smoke tested for maximize) |
| Telemetry | Refresh | rescans active native source / refreshes fixture | Native / Fixture |
| Native banner | Add folder / Rescan | folder picker / active-source scan | Native; picker Untested in automation |
| Native banner | Cancel | aborts active scan | Native |
| Native banner | Sources | navigates to Stage 1 | Working |
| Stage bar | 9 stage buttons | changes active stage and statuses | Working (9/9 runtime tested) |
| Sources | Browse native folder | picker → grant → scan | Native; picker Untested |
| Sources | Add fixture / quick paths | local fixture source with random counts | Fixture only, badged |
| Sources | Re-scan active / refresh fixtures | native scan or fixture refresh | Native / Fixture |
| Sources | Inspect in Library | Stage 2 selection | Working |
| Sources | Revoke authorization | removes grant/cache; no source file touched | Native |
| Library | Category cards | native query or honest fixture empty state | Native / Fixture |
| Library | List / Grid | view mode | Working |
| Library | Sort select | re-sorts fixture rows / order state | Working (tested) |
| Library | Select All / Deselect | selection set | Working (tested) |
| Library | File card click | toggles selection | Working |
| Collections | Create collection | adds local draft collection; measured count is 0/Not measured | Draft |
| Collections | Rule select | attaches a draft tag | Draft |
| Collections | Open Library | Stage 2 | Working |
| Collections | Remove collection | removes local draft | Working |
| Rule Builder | Naming pattern + token chips | local draft pattern | Draft, not executed |
| Rule Builder | Duplicate strategy | maps to native `skip`/`review` collision guard | Working |
| Rule Builder | Hierarchy presets | category vs flat structure mapped to native plan | Working |
| Rule Builder | Custom date hierarchy / filename tokens | draft only; native engine has no such option | Blocked, labelled |
| Rule Builder | Proceed to Destinations | Stage 5 | Working |
| Destinations | Choose native folder | picker + real-directory/write-access validation | Native; picker Untested |
| Destinations | Fixture destination input | local fixture path | Fixture only |
| Destinations | Volume capacity cards | measured Win32_LogicalDisk or fixture cards | Native / Fixture |
| Destinations | Copy / Move / Virtual mode | changes plan mode; write still blocked | Working preview |
| Destinations | Proceed to Plan Review | Stage 6 | Working |
| Plan Review | Rebuild read-only preview | native plan preview + receipt | Native |
| Plan Review | All / Conflicts tabs | filters rendered plan rows | Working; conflicts tab native-only |
| Plan Review | Execute Approved Plan | disabled/blocked notice | Blocked (no channel) |
| Execution | Back to Plan / Preview receipts | Stage navigation | Working |
| Execution | Any execute/progress success | removed; states not executed | Blocked |
| History | Measured preview receipts | persisted hashes/totals/collisions | Native |
| History | Fixture journal rows | shown only in fixture mode | Fixture only |
| History | Undo | no execution journal, no undo channel | Blocked |
| History | View Suggestions | Stage 9 | Working |
| Suggestions | Dismiss | removes the suggestion from state | Working |
| Suggestions | Open Rule Builder | Stage 4 (renamed from “Apply” to match behavior) | Working |
| Suggestions | Measured cards | category-derived, `Rule-based` badge, no AI/space claim | Native-derived |

Known intentional limitations:

- Custom naming templates and date-based folder hierarchies are drafts; the
  native planner currently applies category/flat structure and collision guard.
- No copy verification, conflict naming execution, per-op journal or rollback
  test can run because no write operation exists.
- The native folder picker itself is not automated; grants in smoke use a
  controlled fixture path injected only in smoke mode.
- The browser preview cannot prove native IPC; measured evidence is Electron only.

---

## 6. Acceptance status

| Requirement | Status | Evidence |
|---|---|---|
| Preserve nine-stage UI and branded identity | PASS | 12 visual captures + reference comparison |
| Reuse existing native engines | PASS | adapter imports root Studio modules |
| Real source discovery, metadata-only | PASS | controlled scan + unchanged file metadata |
| Categories and query | PASS | categorized counts and query rows |
| Previews | PASS | measured thumbnails as data URLs |
| Rule planning | PARTIAL | structure + collision mapping live; custom tokens drafts |
| Safety checks | PASS | protected roots, reparse refusal, destination requirement, no execute channel |
| History / recoverability | PARTIAL | persisted preview receipts; no execution journal/undo |
| Electron dev + packaged smoke | PASS | receipts and three Studio screenshots each |
| Typecheck / build / contract / Studio tests | PASS | see section 7 |
| Arabic RTL, light/dark, 3 viewports | PASS | 12 screenshots, no overflow/occlusion |
| Destructive operations without approval | NOT PERFORMED | blocked by requirement |
| Copy verification / undo tests | BLOCKED | requires separately approved write capability |

---

## 7. Commands run

```
cd apps/gemini-ui
npm run lint          # tsc --noEmit
npm run test:native   # contract, channels, security, no AI-key persistence
npm run test:studio   # controlled read-only adapter test
npm run build         # Vite production build
npm run desktop:smoke # Electron dev smoke + Studio/plan/history evidence
npm run desktop:pack:temp
node scripts/native-smoke.cjs --packaged --packaged-dir=%TEMP%/knoux-gemini-release/win-unpacked
node visual-evidence/mission-03/studio-interaction-audit.mjs
```

No user file was moved, deleted, overwritten or permission-changed. No new
branch, no main merge, no destructive Git command.
