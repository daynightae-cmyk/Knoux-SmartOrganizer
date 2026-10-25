# REF-01 — Electron rendering evidence (2026-10-25)

Five screenshots captured from the real unpackaged Electron renderer, at an emulated CSS viewport (DPR 1), with original preload/IPC untouched.

- English dark: 1366x768 and 1672x941
- English light: 1366x768
- Arabic RTL dark/light: 1366x768
- All five screenshot steps completed; reported document horizontal overflow: false.
- The index/gallery is intentionally unpopulated: no authorized test folder was selected in this capture-only scenario.
- Screenshots are not proof of native indexing, real file previews or execution.
- Visual partial. Native picker not verified. This is NOT final REF-01 acceptance.
- npm run check, npm run lint, npm run build passed on the final changes.
- All 426 Vitest tests passed.
- Populated gallery, Move/Copy/Undo and packaged Windows tests remain outside this capture.
- The 1672x941 screenshot uses an emulated renderer viewport, not physical display/DPI certification.
