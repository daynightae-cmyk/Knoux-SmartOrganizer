# KNOuX Smart Organization Studio — Qoder Recovery Audit (2026-10-23)

## Decision

The uncommitted Qoder Studio implementation was preserved and recovered into an isolated worktree and branch. This is a **draft integration candidate**, not a release-accepted or fully verified file-moving product.

- Worktree branch: `feat/studio-qoder-recovery-20261023`
- Base: `4f1bc53d2581997067e91fea949eaa8572ebb9b9` (the existing read-only Studio implementation)
- Sources imported selectively: Qoder's outstanding changes to Electron Main/preload, Studio backend, Studio UI, TypeScript contracts, and Studio test suite.
- Excluded deliberately: Qoder diagnostic scripts located outside the repository, `src.rar`, private usage screenshots, older non-Studio visual-acceptance PNG/JSON alterations, and temporary output artifacts.
- Original worktree and branch remain unchanged. The handoff was backed up locally before creating this branch.

## Implemented functionality in this candidate

- Canonical `window.knouxStudio` preload API; original `window.knoux` preserved.
- Native-picker-granted source and destination registries; typed Main-process validation and renderer ownership checks.
- 18 file categories; visual library; multi-source indexing, search/filter/sort and bounded result paging.
- Preview/gallery infrastructure with controlled thumbnail access and fallbacks.
- Destination selection, validated create-folder UI, immutable organization plan, explicit approvals.
- Distinct virtual/copy/move operations; exclusive destination writes, SHA-256 verification, durable journals and restricted undo preview/apply.
- Windows-specific safety guards: reparse/cloud-placeholder checks, identity validation, hardlink refusal for moves, fail-closed cleanup and quarantine-first source deletion.
- Clear limitations still apply: the current file-system approach cannot promise an atomic pathname lock or guaranteed rollback if an external actor modifies entries concurrently. See `docs/SMART_ORGANIZATION_STUDIO.md`.

## Evidence personally rerun in an isolated Windows worktree

| Gate | Outcome |
| --- | --- |
| `node --check` for Studio engine/IPC/smoke harness | PASS |
| `npm run check` | PASS (exit 0) |
| `npm run lint` | PASS (exit 0) |
| `npm test` | PASS (261 tests, 22 test files, exit 0) |
| `npm run build` | PASS (exit 0; JavaScript chunk >500 kB warning) |
| `npm run desktop:pack` | PASS (exit 0, unpacked win32/x64); dependency-resolution advisory appeared under the isolated junction-linked node_modules setup; runtime must be verified independently |

Saved local logs are in the recovery backup directory. They are not public CI evidence.

## Not yet passed — hard release blocker

Qoder's last saved real packaged Electron smoke report has `status=blocked`. The Studio route rendered successfully in the packaged Electron app, and AR/EN dark/light screenshots were captured **before indexing**. The flow halted on the native source-picker automation:

> No PID-owned KNOuX native folder dialog; interactive desktop may be unavailable.

This message does not prove an application defect nor a harness-only defect. The automation uses a Windows foreground-sensitive UI Automation / SendKeys driver. Further testing must reproduce and measure the real click → preload → IPC → OS dialog lifecycle, verify the exact disposable fixture path before selecting it, then exercise file indexing, folder creation, immutable plan approval, copy, move, SHA-256 verification, interruption and undo after restart.

**Never substitute a mocked folder grant, arbitrary renderer-supplied path, or default folder selection to claim the real native picker smoke passed.**

Do not run the keyboard/mouse-controlling interactive smoke without confirming that the device desktop is free. It is not a headless test.

## Release and scope controls

- DO NOT merge this branch to main solely because typecheck, lint, unit tests, build and packaging pass.
- DO NOT perform exploratory move/undo against a user's personal directories.
- DO NOT treat package creation as a signed release; Authenticode signing and final installer acceptance are separate gates.
- DO NOT overwrite or delete Qoder's source worktree and historical backups.
- Preserve the existing read-only Smart Scan, Downloads preview/apply/undo, Clipboard Vault, History and other KNOuX tools.
- Confirm the full native Windows smoke and UI/screenshots; then review the exact PR diff and all CI checks before the integration is accepted.
