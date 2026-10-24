# KNOuX SmartOrganizer — Visual Finalization Ledger

Mission: Phase A visual finalization of the ten approved reference screens
(`KNOuX_CODEX_AURORA_COMPLETE_HANDOFF/references/REF-01 … REF-10`).
Scope boundary: layout, styling, visual state, responsiveness, theme, RTL and
screenshot verification only. Windows service engines, uninstall engines,
repair execution, indexing backends and new telemetry providers are Phase B and
are recorded in section F rather than built here.

This document is a working ledger. A row is only filled when the screenshot
named in it exists on disk and was produced by the running application.

## A. Baseline

| Item | Value |
|---|---|
| Repository | https://github.com/daynightae-cmyk/Knoux-SmartOrganizer |
| Local root | `K:\Knoux Projects\KNOuX SmartOrganizer\Base` |
| Starting `main` / `origin/main` | `0d9caab5717ee1bf308665e2a4838488572d9ca8` (identical) |
| Working tree at start | 15 modified tracked paths, 4 untracked files |
| Untracked unique work | `src/studio/StudioCommandCenter.tsx`, `src/studio/styles/command-center.css`, `src/components/app/ApplicationCommandSurface.tsx`, `src/applications-ref02.css` |
| Other worktrees | `Studio-Closure-20261023` @ `0f014cb` (dirty `scripts/studio-workspace-smoke.cjs`) |
| Stash | `stash@{0}` visual-evidence snapshot, left untouched |
| Prior audit | `K:\Knoux Projects\KNOuX SmartOrganizer\CLOSURE_SAFETY_20261025-004045\CLOSURE_AUDIT.md` |
| Mission branch | `feat/visual-finalization-20261025` (pushed) |

Preservation actions taken before writing any new UI:

1. The truncated `docs/evidence/visual-acceptance.json` left in the tree by an
   interrupted 19:21 capture (3.4 KB, one scenario) was copied to
   `CLOSURE_SAFETY_20261025-004045/visual-acceptance-partial-1941.json` and the
   tracked 56-scenario ledger was restored from `HEAD`. Nothing was deleted.
2. The uncommitted REF-01/REF-02 work was committed as a checkpoint
   (`b1b80fb`) and pushed before any further edit, so it cannot be lost or
   overwritten by another agent's pass.
3. No branch, worktree, stash or remote ref was deleted, reset or force-pushed.

## B. Visual completion matrix

Scores are read off a real screenshot of the running application against the
matching reference, filed in `docs/evidence/visual-finalization-20261025/`.
They are an evaluator's judgement of fidelity, not a pixel-diff percentage.
`NOT VERIFIED` is used wherever the comparison has not actually been made.

| Screen | Before | After | Verified screenshot | UI interaction | Integration | Status |
|---|---:|---:|---|---|---|---|
| REF-01 Organization Studio | ~55% | ~78% | `studio…`, `settled-studio…` | stage rail navigates, source select, category filter, mode radios, plan gate | `e84ca29` pushed | PARTIAL — populated library not photographed |
| REF-02 Applications | ~70% | ~88% | `settled-applications…` (149 real programs) | command bar, row opens dossier, checkbox staging | `b1b80fb` pushed | CLOSE TO TARGET |
| REF-03 Files | not scored | ~90% | `docked-files-1920x1080-en.png` | search, type/age band filters, ledger, inspector, dock | `ef51d89` | CLOSE TO TARGET — no thumbnails (the read is metadata-only) |
| REF-04 Storage | not scored | ~78% | `spacemap-storage-1920x1080-en.png` | walk lanes, ledger, inspector, space map, dock | pending | PARTIAL — map tiles need a walk, which needs the native picker |
| REF-05 Cleanup | not scored | ~78% | `cleanup-1920x1080-en.png` | preview run, dry-run gate, quarantine tabs, dock | `b96c27c`+ | PARTIAL — candidate table waits on a 25 s scan |
| REF-06 Startup | not scored | ~76% | `startup-1920x1080-en.png` | tool tabs, register read, six-step rail, dock | `b96c27c`+ | PARTIAL — no staging deck yet |
| REF-07 System | not scored | ~72% | `system-1920x1080-en.png` | sample run, ledger, dock | `b96c27c`+ | PARTIAL — no ring gauges or timeline chart |
| REF-08 Repair | not scored | ~72% | `repair…` | command tabs, preview, privilege notice | `b1b80fb` | PARTIAL |
| REF-09 Services | not scored | ~68% | `services-1920x1080-en.png` | inventory read, protected badges, dock | `b96c27c`+ | PARTIAL — no register or dependency graph |
| REF-10 Automation | not scored | ~65% | `automation…` | draft select, step preview, service cards | `b1b80fb` | PARTIAL |

What the seven world screens (REF-03 to REF-09) already share, and why they
score where they do: each opens with a section-specific cinematic hero, a row of
four measured cards, a supervised engine console with its own tabs, a right-hand
column of guarantees and limits, a twelve-card service grid and a workflow rail.
The recurring gaps against the references are the same three things: a populated
register where the capture caught a read still in flight, the reference's own
right-hand inspector content (dossier, dependency graph, staging deck), and the
bottom command bar every reference carries and no KNOuX world currently draws.

## C. Screenshot evidence

Two capture paths exist and they are not interchangeable:

* **Official gate** — `npm run smoke:visual` launches the packaged application,
  which photographs its own window and writes `docs/evidence/visual-acceptance.json`
  plus one PNG per scenario. This is the only path that counts as acceptance
  evidence. It is green in CI for source verification and was still running for
  visual acceptance at the time of writing.
* **Working loop** — a local CDP driver (`knox-visual-lab/capture.mjs`, outside
  the repository) launches the same application binary, navigates with the real
  sidebar buttons, resets scroll and writes PNGs for comparison while iterating.
  These are real screenshots of the real product, filed under
  `docs/evidence/visual-finalization-20261025/` with `CAPTURE-MANIFEST.txt`, but
  they are not the acceptance gate.

Machine notes that affect every picture above:

* This display's work area yields a maximum window of 1464 × 875, so a request
  for 1920 × 1080 is captured clamped. The official harness records that as
  `clampedToWorkArea` rather than failing the size gate.
* Reads are real and slow. A capture taken 8-11 s after entering a world shows
  the honest in-flight state ("Awaiting a reading", "—"); the settled passes wait
  26 s and show measured figures instead. Both are filed.
* During the settled pass the Cleanup world blocked the renderer's evaluation
  channel for several minutes while the temporary-file scan ran, so that pass
  produced four screens rather than ten. It is a measurement of how long a real
  scan takes, not a hang in the product: the same scan reported "Inspected 4,700
  filesystem items" and completed.
* One pass-1 frame showed the Applications surface empty while its toolbar was
  present in the document. It has not reproduced in three later runs and is
  recorded as an unreproduced observation rather than a fixed defect.

| Screen | Resolution | Theme | Locale | State | Remaining differences |
|---|---|---|---|---|---|
| REF-01 | 1464×875 | dark | en | no folder authorized | populated 18-tile library and gallery; reference artwork is a fuller planetary band |
| REF-02 | 1464×875 | dark | en | 149 programs, dossier open | no recent-history block, no event-log preview, service tiles below the fold |
| REF-03 | 1464×875 | dark | en | 138 files read | no file-type/age distribution bars, no bottom selection bar |
| REF-04 | 1464×875 | dark | en | volumes awaiting | no treemap, volume rack not above the fold |
| REF-05 | 1464×875 | dark | en | scan in flight | no candidate table with composition bar, no 8-stage timeline, no bottom bar |
| REF-06 | 1464×875 | dark | en | register not yet read | no populated register, no staging deck, no bottom bar |
| REF-08 | 1464×875 | dark | en | 8 commands, preview open | no expected-output console, no repair history |
| REF-09 | 1464×875 | dark | en | inventory in flight | four cards instead of six, no register, no dependency graph |
| REF-10 | 1464×875 | dark | en | draft open | canvas photographed below the fold, node rail not compared |


## D. Code evidence

Changed so far:

* `src/studio/StudioCommandCenter.tsx` — authorization strip (four measured
  facts plus a re-index control) and a decision bar carrying the measured
  category count, plan count and plan bytes.
* `src/studio/styles/command-center.css` — strip and footer surfaces, states and
  responsive collapse.
* `src/studio/StudioPage.tsx` + `src/studio/styles/studio.css` + `src/aurora.css`
  — the nine workspace stages became a horizontal numbered rail above the board
  instead of a 188 px vertical column, which is what the reference composes and
  what returns that width to the register and inspector.
* `scripts/visual-acceptance-smoke.cjs` — see section E.
* `src/pages/{Cleanup,Hardware,Network,Services,Startup,System}Page.tsx` — six
  stale `eslint-disable-next-line react-hooks/exhaustive-deps` directives were
  replaced by the comment they were guarding. The project has no react-hooks
  ESLint plugin, so the directives referenced a rule that does not exist and
  `eslint .` failed with six "definition for rule not found" errors.

* `src/studio/copy.ts` — the Studio header now leads with the workspace name the
  reference puts largest on the page, with the tagline moved into the subtitle,
  in both languages.
* `docs/evidence/visual-finalization-20261025/` — fourteen working-loop frames
  with `CAPTURE-MANIFEST.txt`, including the first Arabic RTL frame of the
  Studio at 1366 × 768: rail, strip, board and hero all mirror without overflow.

Components reused rather than duplicated: `Stage`, `StageHead`, `StageStats`,
`StageSplit`, `StagePanel`, `StageFlow`, `EngineConsole`, `WorldLedger`,
`StudioThumb`, `CategoryIcon`, the `knx-btn` system and the existing design
tokens. No new dependency was added.

## E. Git evidence

| Item | Value |
|---|---|
| `b1b80fb` | checkpoint of the preserved REF-01/REF-02 working tree |
| `e84ca29` | Studio stage rail, status strip, decision bar + harness repairs |
| Remote branch | `origin/feat/visual-finalization-20261025` |
| Local gates at `e84ca29` | `npm run check` PASS · `npm run lint` PASS · `npm test` 426/426 PASS · `tests/studio-workspace.test.tsx` 12/12 PASS · `npm run build` PASS |
| CI at `b1b80fb` | Source verification SUCCESS (check, lint, tests, build). Windows packaged runtime verification FAILED at the visual acceptance step: `EBUSY: resource busy or locked, unlink '...\knoux-visual-*\user-data\DIPS'` |
| CI at `e84ca29` | Source verification SUCCESS. Visual acceptance: the EBUSY is gone, and the step then hit its own ceiling — `smoke timed out after 1800 seconds`. 56 real captures each boot the packaged app and wait for a genuine Windows read, which does not fit one 30-minute step. |
| `33b51f1` | The matrix is split into two bounded slices in `ci.yml` (data-driven worlds, then workspaces and shells), each with its own ceiling. Same scenarios, same assertions, nothing skipped. Outcome pending at the time of writing. |

Harness repairs in `scripts/visual-acceptance-smoke.cjs`, all aimed at the
recorded CI failures and none of them a weakened assertion:

1. **The ledger no longer destroys itself.** A `KNOUX_SMOKE_ONLY` pass wrote its
   one or two scenarios over a 56-scenario evidence file. Narrowed runs now merge
   by scenario name, keep the untouched records, and mark the file `partial` with
   the vintage of the records that were not retaken.
2. **The EBUSY that failed the release job is bounded.** Temporary profile removal
   retries with a delay and, if Windows still holds the handle, the run reports
   the retained path instead of exiting non-zero after an otherwise passing
   capture set.
3. **An Electron tree is taken down with its children.** The timeout path used
   `child.kill()`, which leaves the GPU, network and renderer children holding the
   profile — the same orphan that produces the next run's EBUSY. On Windows the
   launcher is spawned in its own group and stopped with `taskkill /T /F` by root
   pid; elsewhere by negative pid. Only processes this harness started are
   affected.
4. **Failures keep their diagnosis.** `visual-progress.log` and `application.log`
   are copied to `docs/evidence/visual-acceptance-diagnostics/` before the work
   directory is removed, so a red run names where it stopped.

Known local packaging blocker, recorded rather than worked around:
`electron-builder --dir` cannot complete on this machine. It extracts the
Electron runtime with 7zip and then unlinks `resources/default_app.asar`, which
fails with `EBUSY`/`EPERM` in a fresh output directory as well as a reused one,
and the failure leaves `release/win-unpacked` removed. CI packages the same app
on a Windows runner without this symptom, so it is treated as a local file-lock
condition, not a product defect. Local screenshots for the working loop are
therefore taken from the same application assembled from the already-unpacked
runtime in `node_modules/electron/dist`.

## F. Phase B backlog

Recorded only; nothing here was implemented during Phase A.

| Screen | Missing real capability | Existing related engine | Required future integration | Safety |
|---|---|---|---|---|
| REF-01 Studio | populated visual library without a hand-picked folder | `knouxStudio` index + gallery query | a scripted, permission-bounded way to authorize a source for evidence capture | must stay opt-in and never widen the authorization gate |
| REF-02 Applications | uninstall / repair / modify / update execution | inventory providers only | engine wiring behind the existing confirmation path | destructive; journal and restore point first |
| REF-03 Files | index-wide search across all locations | Downloads-tree read | an indexing backend with a stated budget | no silent full-disk walk |
| REF-04 Storage | treemap of a walked volume | volume table + folder walk | walk-budget policy for large trees | read-only |
| REF-05 Cleanup | browser cache, system logs, recycle bin categories | `temp-cleanup-preview`, quarantine, undo | remaining category engines | never simulate a delete as successful |
| REF-06 Startup | per-entry impact ranking | startup item register | measured impact provider | no invented number |
| REF-07 System | historical telemetry lines | single `system-health` sample | sampling store with retention | no fabricated readings |
| REF-08 Repair | executed DISM/SFC output | command preview | privileged runner already gated; keep preview labels | never run privileged repair as a visual test |
| REF-09 Services | live dependency graph data | service inventory | dependency provider | protected services stay protected |
| REF-10 Automation | production execution of drafted flows | design preview | scheduler integration behind approval | draft must stay non-executing |

## G. Verdict so far

`VISUAL PARTIAL` — Phase A in progress, nothing closed.

Done and integrated to the mission branch: the preserved REF-01/REF-02 working
tree is committed and pushed rather than left in a dirty directory; the Studio
board now carries the reference's stage rail, authorization strip and decision
bar; six stale ESLint directives that were failing `eslint .` are gone; the
visual acceptance harness no longer overwrites its own evidence, no longer
orphans its Electron tree, and no longer fails a passing capture on a locked
temporary profile.

Not done: REF-03 to REF-10 have had one comparison pass and no implementation
pass; REF-01's populated library has never been photographed; the Arabic RTL,
light-theme and 1366 × 768 matrix required by the mission has not been captured
for any screen in this session. No screen is claimed at target fidelity without
a current screenshot, and no Phase B capability has been built or implied.

