# Smart Organization Studio — integrated workspace (2026-10-23)

## Architecture and source provenance

The implementation adapts the submitted Studio concept to **daynightae-cmyk/Knoux-SmartOrganizer**. It does not import the unrelated KNOuX Repair project and does not install the submitted ZIP; the delivery was merged into this repository's existing Electron, React and settings architecture.

Main owns every filesystem decision. `electron/studio/register-studio-ipc.cjs` registers a typed, Zod-validated IPC surface; the sandboxed preload exposes it as a second frozen bridge, `window.knouxStudio`, next to the untouched `window.knoux`. The renderer never sends or receives an absolute path it controls: it sends inventory ids, file ids, destination-grant ids and plan hashes, and Main resolves those against grants it issued to that exact `webContents`. The delivery's proposed `window.knoux.studio.inventory` bridge was deliberately **not** introduced, because it would have created a second, unowned authority surface beside the canonical one.

### Compatibility matrix

| Existing contract | Status | Evidence |
| --- | --- | --- |
| `window.knoux` (all pre-existing tool methods) | Preserved, not renamed or wrapped | `electron/preload.cjs` keeps the original `exposeInMainWorld('knoux', …)` block untouched |
| `window.knouxStudio` | Extended in place; frozen; additive only | 19 invoke wrappers plus `onEvent`, over 20 allowlisted channel names |
| `window.knoux.studio.inventory` (delivery bridge) | **Not introduced** | grep for `studio.inventory` returns nothing in `electron/` or `src/` |
| Raw `ipcRenderer`, Node or fs reach | Never exposed; only named invoke wrappers | preload contains no `require`, no generic `invoke(...)` passthrough |
| Smart Scan, duplicates, downloads, Clipboard Vault, history, settings, automation, shell, sidebar, command palette | Unchanged in behaviour; Studio is one more page in the same AppShell | `src/App.tsx` routes `page === 'studio'` to `<StudioPage/>` only |
| State management | React Context (`src/studio/context.ts`), no Zustand | no new store dependency in `package.json` |
| Styling | Scoped `src/studio/styles/studio.css` on the project's real theme tokens | `.st-*` selectors only |

## Functional scope implemented

- **Nine surfaces** on one rail: Sources, Visual library, Collection details, Organization builder, Destination explorer, Plan review, Execution center, History & undo, Suggestions.
- Multiple sources granted through the **native Windows folder picker**; the grant belongs to the invoking renderer and is revoked when that sender is destroyed. Cancelling the picker is a real cancellation, not an error.
- Read-only recursive index (bounded), **18 visual categories** with counts and bytes, search, extension/size/date filters, sort by name/size/date/type with direction, grid and list views, cross-source selection, collection details, safe preview, Explorer reveal and rescan. Partial, truncated and cancelled scans are reported as such rather than as empty.
- Destination explorer with **backend-validated** folder creation: full-path preview, explicit confirmation, reuse existing, rename proposal, cancel. The renderer cannot create a path it did not preview.
- Virtual grouping, copy and move; category, whole-folder and individual selections; one shared destination or per-category destinations with editable folder names.
- Immutable SHA-256 plan with TTL and hash-bound approval. A stale plan is rejected; nothing is silently recalculated.
- Verified exclusive copies (`wx+`, no overwrite), per-file failure isolation, real progress, safe cancellation, durable pre-mutation journal, and verified undo for eligible moves.

## Changed-file report

Added: `electron/studio/studio-organization.cjs` (plan/execute/undo engine), `electron/studio/studio-safety.cjs` (route and entry authority), `electron/studio/windows-studio-native.cjs` (Windows metadata adapter), `electron/studio/studio-thumbnails.cjs`, `electron/studio/folder-categories.cjs`, `src/studio/context.ts`, `src/studio/copy.ts`, `src/studio/panels.tsx`, `src/studio/parts.tsx`, `tests/studio-native.test.ts`, `tests/studio-organization.test.ts`, `tests/studio-workspace.test.tsx`, `scripts/studio-workspace-smoke.cjs`.

Modified: `electron/main.cjs`, `electron/preload.cjs`, `electron/studio/folder-inventory.cjs`, `electron/studio/register-studio-ipc.cjs`, `src/studio/StudioPage.tsx`, `src/studio/styles/studio.css`, `src/studio/types.ts`, `src/vite-env.d.ts`, `tests/studio-inventory.test.ts`.

## Transfer and undo safety model

Every destructive step is gated on an identity the engine can prove, never on a pathname it merely hopes is unchanged.

Measured on this machine against the pinned runtime (these are observations, not assumptions):

- `fs.lstat(path, {bigint:true})` returns real NTFS `dev`/`ino`; the index survives a rename, and a hard link shares the index with `nlink = 2`.
- Junctions **and** file symlinks both report `isSymbolicLink() === true`, and Node 24 `DirEntry` has no `isJunction()`, so the reparse tag is read with `fsutil reparsepoint query` under a bounded, cached budget.
- An open `fs.open(path,'r')` handle does **not** block a `rename` of that path (libuv grants `FILE_SHARE_DELETE`), but `FileHandle.stat()` keeps describing the original object after the path is renamed. This is what makes handle-bound verification meaningful and path-based locking impossible.
- `writeFile(flag:'wx')` is `CREATE_NEW`: the second call fails `EEXIST` and the first content survives. `mkdir` refuses `EEXIST`, including case-variant collisions.
- `stats.blocks` is unreliable on Windows, so it is never used as a placeholder test; unavailable metadata is reported as `null` with `*Available: false`.

Consequences in code:

1. **No hydration.** A source is probed and confirmed a plain, non-reparse entry *before* it is opened. Cloud placeholders and unprovable reparse points are refused with `STUDIO_REPARSE_REFUSED` / `STUDIO_REPARSE_BUDGET`.
2. **No hardlink moves.** A source with `nlink > 1` is refused, because deleting one name would not free the bytes the journal claims.
3. **Handle-bound verification.** The copy reads the destination back through the handle it created, hashing from position 0, so a path swap mid-copy cannot make the engine verify somebody else's file. Timestamps are set through the same handle and the identity is re-statted afterwards.
4. **Fail-closed cleanup.** A failed destination is unlinked only when its current identity provably equals the identity of the file this operation created. An unavailable identity is treated as *not ours* and the file is left in place, with the path reported to the user.
5. **Quarantine, never path-delete.** The original is first renamed to a private `.knoux-delete-<uuid>` name, re-inspected under that name, and only then unlinked if it is still provably ours. If it is not, the engine renames it back and reports `STUDIO_SOURCE_REPLACED`; if it cannot restore it, the file survives under the review name as `STUDIO_SOURCE_QUARANTINED`.

## Explicitly NOT implemented / not claimed

- **There is no atomic path lock.** Pure Node cannot lock a pathname on Windows. The quarantine rename narrows the race to a single `rename` and makes every outcome non-destructive, but it does not make check-then-delete atomic. A concurrent writer can still win the race; when it does, the engine aborts that file and preserves bytes, it does not silently succeed.
- **Automatic rollback is not guaranteed.** Recovery after an interruption is reported per operation from the journal; `partial` and `copy-verified-source-remains` are honest terminal states, not successes.
- Undo is offered only for eligible moves, never overwrites a file it did not create, and refuses when the original path is occupied.
- Non-NTFS and network targets where the file index is unavailable are refused for destructive operations rather than guessed.
- Classification is by extension, not magic bytes. There is no background watcher and no durable SQLite index; rescans are explicit.
- Library grants and indexes are in-memory and do not survive a restart; history and undo journals are durable, and re-authorising a root after restart is a real picker round-trip.
- Drive-root scanning is blocked and the scanner is bounded, but reparse and cloud metadata behaviour on file systems other than NTFS is not certified.

## Acceptance checks

```
npm run check
npm run lint
npm test
npm run build
npm run desktop:pack
node scripts/studio-workspace-smoke.cjs   # real packaged Electron
```

A command starting is not a pass: record actual exit codes and evidence. The smoke harness writes its report, screenshots and disposable fixtures to one unique temporary `knoux-studio-smoke-*` directory and never writes into `docs/evidence/`.

## Safety and release

Do not merge automatically until CI and a real packaged Windows UI smoke pass. The existing unsigned production-candidate/signing limitation remains a separate release blocker. Development logs and agent transcripts are not runtime evidence for this integration.
