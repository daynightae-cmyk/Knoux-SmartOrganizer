# Smart Organization Studio — integrated library (2026-10-23)

## Architecture and source provenance

The implementation adapts the submitted Studio concept to **daynightae-cmyk/Knoux-SmartOrganizer**. It does not import the unrelated KNOuX Repair project or claim that the submitted ZIP was directly installed.

The native Electron Main registers `electron/studio/register-studio-ipc.cjs`. A separate, narrow `window.knouxStudio` bridge in the existing sandboxed preload exposes native folder selection, a read-only scan, in-memory queries, cancellation, source removal, and Explorer reveal. The pre-existing `window.knoux` tools, Smart Scan, Clipboard Vault and other pages are unchanged. The React Studio page lives inside the existing AppShell and uses its locale/theme settings.

## Functional scope implemented

- Add multiple sources through the native directory picker. Permissions belong to the invoking Electron renderer.
- Rescan an explicitly selected source, recursively index up to 200,000 files, group by filename extension and return count/size summaries.
- Skip symlinks and reparse entries reported as symlinks. Do not read file contents during indexing.
- Honor configured scanning exclusions; report partial/cancelled/truncated results truthfully.
- Filter/search/sort the in-memory library and paginate file cards (48 per page); do not return absolute file paths in query responses.
- Reveal an indexed file only after validating owner, path containment, regular-file status, and original size/modified timestamp.
- Source removal means untracking only, never deletion; library source registrations and indexes are held in memory, not persisted across app restarts.
- Arabic RTL and English LTR presentation using existing theme tokens, with sidebar, home and command palette navigation.

## Explicitly NOT implemented / not claimed

- There is **no** background filesystem watcher or durable SQLite index in this slice. Rescanning is manual.
- File classification uses extensions, not magic bytes or deep content analysis.
- Electron native thumbnail preview is not enabled. The file gallery uses category artwork/icons, deliberately avoiding unconsented cloud placeholder hydration.
- Folder root drive scanning is blocked and the scanner is bounded, but some Windows reparse/cloud metadata needs native verification on more Windows file systems.
- No new move/apply/undo controls are enabled in Studio. Existing Downloads preview/apply/undo remain available in their original tool workspace. A future generic organizer must use an immutable plan snapshot, explicit user consent, destination collision protection, operation journaling and verified undo. Do **not** relabel those existing tools as an approved general Studio plan engine.
- Source and operation data is scoped to the current Electron sender and session. It is not telemetered.

## Acceptance checks

Run on Windows using temporary test directories, without using personal files:

```
npm run check
npm run lint
npm run test
npm run build
npm run desktop:pack
```

Separately verify the packaged app: click Studio from Home and sidebar; native picker; scan of fixtures including images/videos/documents; filter/sort/search and pagination; cancel; source removal; Arabic/English themes; Explorer reveal; scan exclusions; and permissions. A command starting does not constitute a pass: record actual exit codes and evidence.

## Safety and release

Do not merge automatically until CI and a real packaged Windows UI smoke pass. Existing unsigned production-candidate/signing limitation remains a separate release blocker. The uploaded agent logs are development histories rather than runtime evidence for this new integration.
