# KNOuX SmartOrganizer

KNOuX SmartOrganizer is a **local-first Windows desktop utility**. It uses a single Electron main process, a narrowly scoped preload bridge, and a React/Vite renderer. The renderer cannot run commands or access Node.js directly.

## Implemented in this build

| Capability | Status | Notes |
|---|---:|---|
| Secure Electron shell | Implemented | `contextIsolation`, `sandbox`, `webSecurity`, `nodeIntegration: false` |
| Tool execution lifecycle | Implemented | queued, preflight, running, progress, result, completed, cancelled, failed |
| System health | Implemented | CPU, RAM, system drive, uptime, battery when Windows exposes it |
| Smart Scan | Implemented | read-only disk, Downloads large-file, and temp-file review findings |
| Storage & file tools | Implemented | disks, large files, SHA-256 duplicates, empty folders, Downloads inventory, file hashes |
| Downloads organizer | Implemented | preview, explicit confirmation, safe move, journal-backed undo |
| Temp cleanup | Implemented | preview, explicit confirmation, quarantine-first intake, journal-backed restore; never a permanent delete |
| Startup management | Implemented | HKCU Run inventory; value disable with a journalled restore that refuses to overwrite existing values |
| Services | Implemented | bounded inventory with a protected-service denylist; fixed `sc.exe` actions with per-operation elevation; journalled startup-type change; live service change stays outside automated testing by safety design |
| Repair center | Implemented | eight frozen allowlisted operations (DISM/SFC/DNS/Winsock/TCP-IP); dry-run packaged-proven; every real run requests its own elevation |
| Automation | Implemented | Windows Task Scheduler jobs for five read-only allowlisted tools only |
| Network, hardware, events, processes | Implemented | bounded read-only diagnostics |
| Clipboard Vault | Implemented | local capture, pause/resume, pin, delete, clear; uses the operating-system-encrypted store when Windows provides it |
| Advanced local intelligence | Implemented | on-device analysis behind the packaged tools; no network calls |
| History and structured local logs | Implemented | stored under the Electron user-data path; exports JSON/CSV; diagnostics export is locally redacted |
| Settings | Implemented | versioned v1→v2 local settings, section reset, validated import/export |
| Arabic / English and accessibility | Implemented | Arabic is the default with full RTL; high contrast, reduced motion, 150% font scale and keyboard focus |
| NSIS installer | Implemented | per-user install, editable path, `deleteAppDataOnUninstall: false`; requires `npm run desktop:dist` on Windows |

## Intentionally unavailable

This build does **not** claim permanent file deletion beyond its explicit quarantine-and-undo flow, automatic update downloads or installs, online usage statistics, AI assistance, arbitrary renderer-initiated shell commands, or SmartScreen reputation. Those capabilities remain unavailable until they have their own safe handler, confirmation flow, rollback model, tests, and packaged verification.

## Privacy model

Core functions operate locally. Telemetry and crash reports are disabled by default. No remote AI model, CDN script, remote font, or backend service is required for the implemented tools.

## Documentation

| Document | Contents |
|---|---|
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | Day-to-day operation: scans, organizer, cleanup, clipboard vault, automation, services and repair |
| [`docs/INSTALLATION.md`](docs/INSTALLATION.md) | Installing, silent install, uninstall and data retention |
| [`docs/AUTOMATION.md`](docs/AUTOMATION.md) | The allowlisted automation surface and its Task Scheduler jobs |
| [`docs/REPAIR_CENTER.md`](docs/REPAIR_CENTER.md) | The eight frozen repair operations and their safety rules |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Startup, SmartScreen, settings and log diagnosis |
| [`docs/WINDOWS_SUPPORT_MATRIX.md`](docs/WINDOWS_SUPPORT_MATRIX.md) | Windows environments verified versus claimed |
| [`docs/UNINSTALL_DATA_POLICY.md`](docs/UNINSTALL_DATA_POLICY.md) | What uninstall keeps and what it removes |
| [`docs/PRIVACY.md`](docs/PRIVACY.md) and [`docs/SECURITY.md`](docs/SECURITY.md) | Privacy model and security invariants |
| [`docs/CODE_SIGNING.md`](docs/CODE_SIGNING.md) | Signing policy, `UNSIGNED_PRODUCTION_CANDIDATE`, credential rules |
| [`docs/THIRD_PARTY_LICENSES.md`](docs/THIRD_PARTY_LICENSES.md) | Dependency licences |
| [`docs/TOOL_MATRIX.md`](docs/TOOL_MATRIX.md) | Tool-by-tool completion classification and packaged proof |
| [`docs/PRODUCTION_STATUS.md`](docs/PRODUCTION_STATUS.md) and [`docs/RELEASE_VERIFICATION.md`](docs/RELEASE_VERIFICATION.md) | Live production state and the verified gate table |
| [`docs/SMARTORGANIZER-SHELL-ARCHITECTURE.md`](docs/SMARTORGANIZER-SHELL-ARCHITECTURE.md) | Workspace shell architecture |

## Development

```powershell
npm install
npm run check
npm run lint
npm test
npm run build
npm run desktop:dev
```

## Windows artifacts

```powershell
npm run desktop:pack  # creates release/win-unpacked
npm run desktop:dist  # creates release/KNOuX-SmartOrganizer-Setup-x64.exe
npm run verify:release
```

The delivered Windows release is recorded as an **unsigned production candidate** (`UNSIGNED_PRODUCTION_CANDIDATE`): fully built, packaged and validated on Windows, while the trusted Authenticode identity remains an external blocker that must not be substituted. See [docs/CODE_SIGNING.md](docs/CODE_SIGNING.md) and [docs/PRODUCTION_STATUS.md](docs/PRODUCTION_STATUS.md).

## Architecture

```text
Electron main process
  ├─ Windows data collectors and filesystem engines
  ├─ input validation, operation lifecycle, history, settings and logs
  └─ named IPC handlers only
       ↓
preload bridge
       ↓
React + TypeScript renderer
```

Detailed baseline findings are recorded in [`docs/FORENSIC_BASELINE_AUDIT.md`](docs/FORENSIC_BASELINE_AUDIT.md).
