# KNOuX — Gemini 11-Section UI Integration Baseline
Date: 2026-10-25

## Authoritative live baseline
- Repository: daynightae-cmyk/Knoux-SmartOrganizer
- Inspected working branch: feat/visual-finalization-20261025
- Starting SHA: ee1dc63e2d39538efedbeee353ce9fcb7e0eb271
- origin/main at inspection: 0d9caab5717ee1bf308665e2a4838488572d9ca8
- Starting tree: clean; 12 commits ahead of main; a separate historical worktree and stash still exist. Neither touched.

## Preservation, not a wholesale install
Archive mirrored verbatim at:
`K:\Knoux Projects\KNOuX SmartOrganizer\GEMINI_11_UI_SOURCE_VAULT_20261025\KNOuX_GEMINI_11_VISUAL_UI_EXPORT.zip`
SHA-256: `d74263c5f02c3e5f47bef7d1d9939a4b07c804bb3aac8d2f97c788be54b718a5`
- `ORIGINAL_SNAPSHOT/`: 180 original files
- `UI_SOURCE/`: 97 canonical source/assets/scaffold files
- `POLISHED_PATCH/`: 6 entire polished files
- `PRESERVED_VARIANTS/`: 15 non-identical variants/documents
- Hash manifest and integration map are in the export archive.
- All source/material here is candidate evidence. No build, Electron parity, production execution, or integration success is established for the Gemini code.

## Six Sonnet polish changes: integration disposition
- Cleanup, Startup, Storage, System internal Home links -> Home: retained in vault; not copied over live pages because the real application's centralized Shell/router already handles these navigations.
- Files page internal sidebar links -> sections: same; copying Gemini's sidebar would create duplicate chrome.
- Files and Studio remote demo-thumbnail `onError` hiding: retained as candidate, but blindly concealing a failed preview is not an adequate live-product fallback. Live file previews require local-source/permission-aware states.
- Sonnet changes are **not** equivalent to six screens having been integrated.
- Original Gemini page copies are not replacements for live pages. They embed nested titlebars/sidebars and UI-only mock inventories.

## Visual source comparison by module
| Source module | Live equivalent exists | Decision |
|---|---|---|
| REF-00 Home Command Center | Yes | Adapt the approved hero/deck/side insight layout without fixture KPI claims, duplicate chrome, or Tailwind injection. |
| REF-01 Organization Studio | Yes; already advanced on branch | Keep live authorized source/index/plan/undo; compare visual components only. No overwrite. |
| REF-02 Applications | Yes; visual target close but Windows acceptance failed | Keep live application inventory/dossier; fix accessibility and deck viewport gate on live. |
| REF-03 Files | Yes, native file inventory | Keep real search/basket/plan; port only justified visual components. |
| REF-04 Storage | Yes, live storage analysis | Adapt reference treemap within real measured-volume data; no fake volumes. |
| REF-05 Cleanup | Yes, real safeguarded operations | Preserve quarantine/preview/undo. Visual extraction only. |
| REF-06 Startup | Yes, native inventory and controls | Reference layout still needs focused composition pass. No register-engine replacement. |
| REF-07 System | Yes, real telemetry surface | Improve timeline/inspector without sample-metrics claims. |
| REF-08 Repair | Yes, RecoveryLab integrated on branch | Preserve live engine panel, audit/history, permissions. Do not overwrite. |
| REF-09 Services | Yes, guarded service workflows | Port dossier/dependency visualization carefully. |
| REF-10 Automation | Yes, automation engine contracts | Port flow canvas visually; UI draft != executed workflow. |

## GitHub CI at SHA ee1dc63
Run: https://github.com/daynightae-cmyk/Knoux-SmartOrganizer/actions/runs/40155827684
- Source verification: PASS (check, lint, 426/426 tests, build).
- Windows installer, packaged operations, offline smoke: PASS in Windows job.
- Windows visual acceptance Applications: FAIL. Text labels Repair, Update, Location, Details below 2:1 in several themes/viewport variants; Arabic staged-action dock off viewport at 1366x768.
- The visual gate cannot be declared green until a subsequent Windows run passes. Local CSS fixes, if any, remain unverified against Windows until then.

## Integration invariants
1. Preserve live Electron preload/IPC isolation, real providers, operational permission prompts, and undo journal.
2. Do not install Tailwind or Gemini harness App.tsx solely to render a source screen.
3. Do not inject demo totals (files, volumes, publishers, services), remote Unsplash thumbnails, or fake green badges.
4. Preserve original visuals/assets in the external vault; never discard unique work due to branch age.
5. Any candidate UI must pass screenshot comparison to approved reference at 1672x941, RTL/English and responsive 1366x768, plus source checks, Windows packaged runtime, and full CI.
6. Do not merge to origin/main while the Windows gate is red; no reset/clean/force-push/worktree deletion.

## Next action
Once Applications CI gate is green, integrate and verify visual regions one screen at a time, starting with Home's approved reference composition. Build a local data adapter to keep live telemetry honest. Use the source vault for exact CSS/component comparisons. Do not replace already integrated REF-01 and REF-08 pages.
