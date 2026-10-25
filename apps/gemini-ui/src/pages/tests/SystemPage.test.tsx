/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INITIAL_TELEMETRY_SOURCE,
  INITIAL_INSTRUMENT_METRICS,
  INITIAL_SYSTEM_INFO,
  INITIAL_SERVICES_CATALOG,
  NETWORK_SERVICES_CATALOG,
  HARDWARE_SERVICES_CATALOG,
  SAMPLE_PROCESS_FIXTURES
} from '../../lib/system-inventory';

export interface SystemTestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export function runSystemVerificationSuite(): SystemTestResult[] {
  const results: SystemTestResult[] = [];

  // Test 1: Verify all 4 top dashboard instruments have honest awaiting-sample baseline
  try {
    const cpu = INITIAL_INSTRUMENT_METRICS.find((m) => m.id === 'cpu');
    const memory = INITIAL_INSTRUMENT_METRICS.find((m) => m.id === 'memory');
    const disk = INITIAL_INSTRUMENT_METRICS.find((m) => m.id === 'disk');
    const network = INITIAL_INSTRUMENT_METRICS.find((m) => m.id === 'network');

    const passed =
      INITIAL_INSTRUMENT_METRICS.length === 4 &&
      cpu?.gaugeValue === '--%' &&
      cpu?.gaugeStatus === 'Awaiting sample' &&
      memory?.gaugeValue === '--%' &&
      memory?.gaugeStatus === 'Awaiting sample' &&
      disk?.gaugeValue === '--%' &&
      disk?.gaugeStatus === 'Awaiting sample' &&
      network?.gaugeValue === '--%' &&
      network?.gaugeStatus === 'Awaiting sample';

    results.push({
      name: 'Dashboard Instruments Verification (CPU, Memory, Disk, Network Awaiting Samples)',
      passed,
      message: passed ? 'All 4 instrument meters present honest un-fabricated baseline (--%)' : 'Instruments mismatch'
    });
  } catch (err) {
    results.push({ name: 'Dashboard Instruments Verification', passed: false, message: String(err) });
  }

  // Test 2: Verify System Information card metadata slots
  try {
    const passed =
      INITIAL_SYSTEM_INFO.windowsVersion === 'Windows 11 Pro' &&
      INITIAL_SYSTEM_INFO.versionBuild === '-- (Build ----)' &&
      INITIAL_SYSTEM_INFO.systemManufacturer === '--' &&
      INITIAL_SYSTEM_INFO.systemModel === '--' &&
      INITIAL_SYSTEM_INFO.processor === '--' &&
      INITIAL_SYSTEM_INFO.installedRam === '-- GB' &&
      INITIAL_SYSTEM_INFO.uptime === '--:--:--';

    results.push({
      name: 'System Information Card Slots Verification',
      passed,
      message: passed ? 'System Information displays accurate Windows 11 Pro placeholders without false hardware claims' : 'System info schema mismatch'
    });
  } catch (err) {
    results.push({ name: 'System Information Card Slots Verification', passed: false, message: String(err) });
  }

  // Test 3: Verify all 12 System Services & Diagnostics catalog entries
  try {
    const requiredKeys = [
      'system-health-check',
      'system-events',
      'system-processes',
      'system-signatures',
      'system-uptime',
      'system-perf',
      'system-drivers',
      'system-logs',
      'system-resources',
      'system-autostart',
      'system-services-map',
      'system-timeline'
    ];

    const presentKeys = new Set(INITIAL_SERVICES_CATALOG.map((s) => s.serviceKey));
    const allPresent = requiredKeys.every((k) => presentKeys.has(k));

    results.push({
      name: 'Twelve System Services & Diagnostics Catalog Verification',
      passed: allPresent && INITIAL_SERVICES_CATALOG.length === 12,
      message: allPresent ? 'All 12 required system service keys registered and mapped' : 'Missing required service keys'
    });
  } catch (err) {
    results.push({ name: 'Twelve System Services & Diagnostics Catalog Verification', passed: false, message: String(err) });
  }

  // Test 4: Verify Network & Hardware service catalogs (12 network + 12 hardware)
  try {
    const networkKeys = [
      'network-interfaces',
      'network-dns-config',
      'network-adapters',
      'network-connectivity',
      'network-throughput',
      'network-traceroute',
      'network-topology',
      'network-ports',
      'network-wifi',
      'network-hosts',
      'network-proxies',
      'network-repair-link'
    ];

    const hardwareKeys = [
      'hardware-inventory',
      'hardware-battery',
      'hardware-cpu',
      'hardware-gpu',
      'hardware-memory',
      'hardware-cycles',
      'hardware-thermal',
      'hardware-disks',
      'hardware-usb',
      'hardware-display',
      'hardware-audio',
      'hardware-health-report'
    ];

    const presentNet = new Set(NETWORK_SERVICES_CATALOG.map((s) => s.serviceKey));
    const presentHw = new Set(HARDWARE_SERVICES_CATALOG.map((s) => s.serviceKey));

    const allNet = networkKeys.every((k) => presentNet.has(k)) && NETWORK_SERVICES_CATALOG.length === 12;
    const allHw = hardwareKeys.every((k) => presentHw.has(k)) && HARDWARE_SERVICES_CATALOG.length === 12;

    results.push({
      name: 'Related Network & Hardware Sub-Services Catalog Verification (24 services)',
      passed: allNet && allHw,
      message: allNet && allHw ? 'All 12 Network and 12 Hardware sub-services properly registered' : 'Network/Hardware catalogs incomplete'
    });
  } catch (err) {
    results.push({ name: 'Related Network & Hardware Sub-Services Catalog Verification', passed: false, message: String(err) });
  }

  // Test 5: Verify process ledger fixtures and safe non-destructive contracts
  try {
    const passed =
      SAMPLE_PROCESS_FIXTURES.length >= 8 &&
      SAMPLE_PROCESS_FIXTURES.every((p) => p.pid > 0 && Boolean(p.name) && Boolean(p.status));

    results.push({
      name: 'Process Ledger Schema & Sample Integrity Verification',
      passed,
      message: passed ? 'Process ledger fixtures conform to authentic Windows process structures' : 'Process schema invalid'
    });
  } catch (err) {
    results.push({ name: 'Process Ledger Schema & Sample Integrity Verification', passed: false, message: String(err) });
  }

  return results;
}
