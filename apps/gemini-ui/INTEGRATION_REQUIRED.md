# KNOuX Smart Scan — Integration Required & Boundary Declaration

## 1. Simulation Fixture Boundary
All measurements, file counts, and reclaimable space metrics displayed in the Smart Scan frontend are derived from structured fixture data (`smartScan.fixtures.ts`).
- **Data Distinguishability**: Every service renderer explicitly indicates "Simulation Fixture" or "Preview Only".
- **Non-Destructive Guarantee**: Clicking "Run Smart Cleanup" opens the staging preview modal and does NOT delete any files from disk.

## 2. Backend Engine Integration Requirements
To connect Smart Scan to live Windows OS execution in the Electron / Windows C++ / PowerShell layer, the following IPC bridge endpoints are required:
1. `ipcRenderer.invoke('knoux:scan:start', { serviceId, scope })` — Initiates real sector/file system scanning.
2. `ipcRenderer.invoke('knoux:scan:getResults')` — Returns real device findings and file paths.
3. `ipcRenderer.invoke('knoux:cleanup:execute', { selectedPathIds })` — Performs privileged Windows file deletion or staging.
4. `ipcRenderer.invoke('knoux:telemetry:getPulse')` — Fetches live hardware sensors (CPU, RAM, Disk throughput).
