# KNOuX Smart Scan — Service Workspace Map

Each of the 10 Scan Services maps to a dedicated configuration/preview renderer in `src/smart-scan/service-renderers/`:

| Service Code | Service Name | Dedicated Renderer Component | Primary Features & Target Cross-Link |
|---|---|---|---|
| SCAN-01 | Quick Scan | `QuickScanRenderer.tsx` | Essential areas checklist, progress stages, timeline |
| SCAN-02 | Deep Scan | `DeepScanRenderer.tsx` | Scan depth selector (Thorough, Extreme, Exhaustive), target drives |
| SCAN-03 | Duplicate Finder | `DuplicateFinderRenderer.tsx` | SHA-256 hash matching, cluster comparison → Cross-links to `storage` |
| SCAN-04 | Large Files Review | `LargeFilesRenderer.tsx` | Files > 500 MB ranking & size distribution → Cross-links to `storage` |
| SCAN-05 | Junk Cleaner | `JunkCleanerRenderer.tsx` | Non-destructive temp hive & cache purging → Cross-links to `cleanup` |
| SCAN-06 | Privacy Trace Check | `PrivacyTraceRenderer.tsx` | Browser tracking cookies & MRU recent files audit |
| SCAN-07 | Startup Impact Check | `StartupImpactRenderer.tsx` | Autostart delay overhead & Registry Run keys → Cross-links to `startup` |
| SCAN-08 | App Health Review | `AppHealthRenderer.tsx` | 358 installed software audit & unused candidates → Cross-links to `applications` |
| SCAN-09 | System Health Pulse | `SystemHealthPulseRenderer.tsx` | Live CPU, Memory, Disk throughput & hardware sensors → Cross-links to `system` |
| SCAN-10 | Smart Recommendations | `SmartRecommendationsRenderer.tsx` | AI-powered prioritized optimization workbench |
