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
| Cleanup | Implemented | read-only temporary-file preview only; no automatic cleanup |
| Startup & applications | Implemented | safe registry inventory only |
| Network, hardware, events | Implemented | local diagnostics only |
| History and structured local logs | Implemented | stored under Electron user-data path |
| Settings | Implemented | versioned local settings for language, appearance, scan, cleanup, privacy, and performance defaults |
| Arabic / English | Implemented | Arabic is the default and switches full document direction to RTL |
| NSIS configuration | Implemented | requires `npm run desktop:dist` on Windows |

## Intentionally unavailable

This build does **not** claim file deletion, registry changes, startup toggling, service manipulation, repair actions, scheduled automations, update downloads, application usage statistics, or AI assistance. Those capabilities remain unavailable until they have their own safe handler, confirmation flow, rollback model, tests, and packaged verification.

## Privacy model

Core functions operate locally. Telemetry and crash reports are disabled by default. No remote AI model, CDN script, remote font, or backend service is required for the implemented tools.

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

The application is currently an unsigned development build unless a signing certificate is configured in the build environment.

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
