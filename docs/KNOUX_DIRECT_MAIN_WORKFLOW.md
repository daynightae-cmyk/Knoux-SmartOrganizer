# KNOuX — Direct Main Development & Visual Product Delivery

Status: Adopted by owner on 2026-10-23.

## Absolute working directory

`K:\Knoux Projects\KNOuX SmartOrganizer\Base`

GitHub repository: `daynightae-cmyk/Knoux-SmartOrganizer`.

**Work locally in this EXISTING directory on `main`.** No separate agent task directory, new branch, extra worktree, standing draft PR, or ZIP handoff unless the owner explicitly requests it.

## Short execution loop (default for all future KNOuX work)

1. Open the existing project. Inspect `git status -sb`, `git rev-parse HEAD`, and `git remote -v` before editing. Do not switch branches or fetch-and-reset away dirty work.
2. If the tree has user edits, preserve them. Read the affected files; checkpoint intended changes with a regular commit or verified local snapshot before touching overlapping work. Never silently discard unrelated changes. Only stage known project files.
3. Read the actual design system, app shell, contracts, tool registry, runtime availability and integration points. Implement the requested feature **directly in the real local project**.
4. Deliver functional interfaces, real data where supported, and truthful disabled states where a native engine does not exist. Avoid generic Run Tool panels, fake metrics, unapproved destructive operations or fabricated evidence.
5. Run the fastest honest gates appropriate for the files changed: `npm run check` and `npm run lint`; run targeted tests and `npm run build` for UI work; run full tests for shared/native changes. Full packaged Electron smoke is a release or high-risk integration gate, not a prerequisite to every CSS revision.
6. Fix failures, review `git diff --check` and changed files, then make a descriptive **commit directly on local `main`**. Run `git push origin main`, confirm remote SHA equals local SHA, and report results.
7. If another agent changed `origin/main`, fetch, inspect divergence and integrate non-destructively; never `reset --hard`, force-push, rewrite history or delete user files to resolve it. Stop and explain an irreconcilable conflict rather than inventing success.
8. Never stage private untracked usage screenshots, temp archives, secrets, personal file contents, diagnostic profiles, or generated installers without a deliberate publishing review.

**No intermediate merge is required when development already happens on `main`: commit, then push.** Existing historical worktrees and refs must not be deleted automatically.

## Visual product mandate

The owner wants an unmistakable, premium **KNOuX** Windows application:
- Everything-class indexing and search responsiveness **without copying Everything's minimal UI**.
- IObit-class installed application visibility, real icons, details and operations **without copying IObit's protected assets or layout**.
- Eleven distinctive service areas, each with twelve meaningful service concepts (132 total). They must share KNOuX typography, components and interaction language but NOT eleven identical catalog grids.
- The flagship Smart Organization Studio is separate. Preserve its core library, source/destination authorization, preview/plan, copy/move and journal-driven undo implementation.
- Existing React 18 + Electron + Vite + custom CSS tokens, AppShell, Arabic RTL/English LTR, reduced motion, light/dark/high contrast are canonical. No competing CSS framework, fake UI screenshots or duplicate global app state.
- Primary visual reference sections: **Applications** (real app icons, inventory, detail inspector), **Files** (fast indexed search with detailed results), **Storage** (interactive measured treemap). Complete their visual quality before spreading generic templates to the remaining categories.
- Other sections: Cleanup, Startup, System, Repair, Windows Services, Network, Hardware, Automation.
- Service catalog cards must be backed by typed capability metadata. A planned service can open a polished informative workspace, but its Run action stays disabled until its backend actually works.
- At each UI milestone, capture real AR/EN and dark/light screenshots of populated states, review spacing, density, information hierarchy, empty/error states and navigation. The UI must be understandable to nontechnical users.

## Operational safety and honest release gates

Ordinary visual iteration is **not blocked** by an unrelated full Electron native-dialog smoke. Continue delivering and pushing good UI increments.

Native operations that can move, delete, uninstall, disable or overwrite user resources still require scoped authorization, stable previews, explicit consent, real Windows tests and journal-based recovery where appropriate. Do not mark such a feature safe or ready for production until its relevant native test gate passes.

Current integrated Studio work reached main as `2bf34e755d4307e91b7dbe67e45218bb89b0fad0`, but the foreground-sensitive packaged Electron native-folder-picker smoke remains **blocked**, not passed. Do not claim otherwise or test destructive operations on personal files.

## Response after each increment

State what files changed, what works, what remains not implemented, exact check outcomes, commit SHA and confirmed pushed remote SHA. No pseudo-success, no waiting for another model, and no unrequested PR/worktree detours.
