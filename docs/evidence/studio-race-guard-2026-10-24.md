# Studio race test: captured failure and classification

Surface area: `tests/studio-organization.test.ts` → *loses nothing while another
writer races the original path throughout a move*.
Date: 2026-10-24. Machine: Windows 11 Pro, NTFS, repository working tree at
`d8a5a33` plus the uncommitted Files/Storage work.

## What was reproduced

The failure is intermittent and only appears at volume. A single run, and even
25 consecutive runs, pass. 400 repetitions reproduce it.

```
npx vitest run tests/studio-organization.test.ts \
  -t "loses nothing while another writer races" --repeats 400
```

Result: **24 failures out of 400 iterations (~6%)**, all with the same
assertion, and nothing else:

```
 FAIL  tests/studio-organization.test.ts > Studio real Windows transfer and undo
   > loses nothing while another writer races the original path throughout a move
AssertionError: expected 'STUDIO_PATH_UNSAFE' to be 'STUDIO_PLAN_STALE' // Object.is equality

Expected: "STUDIO_PLAN_STALE"
Received: "STUDIO_PATH_UNSAFE"

 ❯ tests/studio-organization.test.ts:265:33
    263|       // The swap landed before the copy: the operation must refuse, and its own
    264|       // partial destination must be gone rather than left as a decoy file.
    265|       expect(moved.thrown.code).toBe('STUDIO_PLAN_STALE');
       |                                 ^
    266|       expect(existsSync(destination)).toBe(false);
    267|       expect(holdsOurBytes).toBe(true);
```

The full log was kept alongside this note as
`studio-race-400-before.txt`.

## Why the code differs

The test renames the source path away and immediately writes a foreign file at
it, 60 times, while the engine transfers. Two guards on the transfer path can
be the first one to notice, and which one wins depends on where the racer is in
its own two-step at that microsecond:

1. `electron/studio/windows-studio-native.cjs:169` — `assertPlainEntry()` runs
   before anything opens the file, because opening a dehydrated cloud placeholder
   would download it. When the racer has renamed the path away and not yet
   written, the path holds nothing, so line 171 returns
   `code: 'STUDIO_PATH_UNSAFE'`, which `studio-organization.cjs:723` rethrows.
2. `electron/studio/studio-organization.cjs:733` — the identity comparison in
   `verifySourceForOperation()` runs after that, and reports the same race as
   `STUDIO_PLAN_STALE` once the racer has put its own file at the path.

Both guards sit before the first byte is copied. The test only enumerated the
second one.

## What was verified, not assumed

The distinction that matters is whether the refusal under
`STUDIO_PATH_UNSAFE` keeps the same safety properties the branch asserts. The
captured failure aborted at line 265, so lines 266-267 never ran in the failing
iterations, and the earlier loop that checks every foreign writer's file is
still on disk (lines 256-258) passed in all 24 of them.

The expectation was therefore widened to accept either refusal code, and the run
repeated at the same volume:

```
npx vitest run tests/studio-organization.test.ts \
  -t "loses nothing while another writer races" --repeats 400
→ Test Files 1 passed (1) · 400/400 · 73.7s
```

With both codes accepted, the assertions that actually carry the safety contract
held in every iteration, including the ones that take the `STUDIO_PATH_UNSAFE`
path: the partial destination does not exist, the reviewed bytes are still on
disk, and all 60 foreign files written during the storm survive.

The engine was not changed. No deletion path was reached differently; only the
test's enumeration of acceptable refusals was corrected.

## Classification

**Test synchronisation / expectation gap, not a move-safety defect.**

Recorded limitation, honestly scoped: this is an in-process race with a
single hostile writer. It does not cover a second KNOuX window, an antivirus
filter driver holding the path, or a reparse point that changes type between the
plain-entry check and the copy. Those remain open questions for the release
gate rather than things this test proves.
