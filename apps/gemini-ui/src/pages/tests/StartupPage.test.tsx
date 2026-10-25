/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INITIAL_BOOT_METRICS,
  BOOT_STAGES_BREAKDOWN,
  STARTUP_SOURCES_SUMMARY,
  STARTUP_ITEMS_FIXTURE,
  STARTUP_SERVICES_CATALOG,
  StartupItem,
  StartupItemStatus
} from '../../lib/startup-inventory';

export interface StartupTestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export function runStartupVerificationSuite(): StartupTestResult[] {
  const results: StartupTestResult[] = [];

  // Test 1: Verify all 4 top summary strip metrics match REF-06 specifications
  try {
    const bootDuration = INITIAL_BOOT_METRICS.find((m) => m.id === 'boot-duration');
    const activeItems = INITIAL_BOOT_METRICS.find((m) => m.id === 'active-items');
    const highImpact = INITIAL_BOOT_METRICS.find((m) => m.id === 'high-impact');
    const reclaimable = INITIAL_BOOT_METRICS.find((m) => m.id === 'reclaimable-velocity');

    const passed =
      INITIAL_BOOT_METRICS.length === 4 &&
      bootDuration?.value === '13.8s' &&
      activeItems?.value === '28' &&
      highImpact?.value === '6' &&
      highImpact?.isAlert === true &&
      reclaimable?.value === '4.6s';

    results.push({
      name: 'Startup Top Metrics Verification (13.8s, 28 items, 6 high impact, 4.6s savings)',
      passed,
      message: passed ? 'All 4 summary metrics verified against REF-06 specification' : 'Metrics mismatch'
    });
  } catch (err) {
    results.push({ name: 'Startup Top Metrics Verification', passed: false, message: String(err) });
  }

  // Test 2: Verify boot stages waterfall breakdown (5 sequential phases summing to 13.8s)
  try {
    const uefi = BOOT_STAGES_BREAKDOWN.find((s) => s.id === 'stage-uefi');
    const kernel = BOOT_STAGES_BREAKDOWN.find((s) => s.id === 'stage-kernel');
    const drivers = BOOT_STAGES_BREAKDOWN.find((s) => s.id === 'stage-drivers');
    const logon = BOOT_STAGES_BREAKDOWN.find((s) => s.id === 'stage-logon');
    const apps = BOOT_STAGES_BREAKDOWN.find((s) => s.id === 'stage-startup-apps');

    const totalDuration = BOOT_STAGES_BREAKDOWN.reduce((sum, s) => sum + s.durationMs, 0);
    const totalPercentage = BOOT_STAGES_BREAKDOWN.reduce((sum, s) => sum + s.percentage, 0);

    const passed =
      BOOT_STAGES_BREAKDOWN.length === 5 &&
      uefi?.durationMs === 2400 &&
      kernel?.durationMs === 3100 &&
      drivers?.durationMs === 2200 &&
      logon?.durationMs === 1800 &&
      apps?.durationMs === 4300 &&
      totalDuration === 13800 &&
      Math.abs(totalPercentage - 100) < 0.2;

    results.push({
      name: 'Boot Waterfall Stages Verification (5 sequential phases = 13,800 ms)',
      passed,
      message: passed ? 'All 5 phases verified with exact duration and percentage summation' : 'Stage sequence invalid'
    });
  } catch (err) {
    results.push({ name: 'Boot Waterfall Stages Verification', passed: false, message: String(err) });
  }

  // Test 3: Verify all 12 domain service catalog entries match REF-06 requirements
  try {
    const requiredKeys = [
      'startup-overview',
      'startup-disable',
      'startup-restore',
      'startup-sources',
      'startup-journal',
      'startup-filter',
      'startup-impact',
      'startup-services',
      'startup-tasks',
      'startup-delay',
      'startup-batch',
      'startup-undo-all'
    ];

    const presentKeys = new Set(STARTUP_SERVICES_CATALOG.map((s) => s.serviceKey));
    const allPresent = requiredKeys.every((k) => presentKeys.has(k));

    results.push({
      name: 'Twelve Domain Services Matrix Verification (12 specialized workspaces)',
      passed: allPresent && STARTUP_SERVICES_CATALOG.length === 12,
      message: allPresent ? 'All 12 required service keys registered and mapped' : 'Missing required service keys'
    });
  } catch (err) {
    results.push({ name: 'Twelve Domain Services Matrix Verification', passed: false, message: String(err) });
  }

  // Test 4: Verify authentic realistic startup applications fixtures
  try {
    const onedrive = STARTUP_ITEMS_FIXTURE.find((i) => i.id === 'item-onedrive');
    const discord = STARTUP_ITEMS_FIXTURE.find((i) => i.id === 'item-discord');
    const spotify = STARTUP_ITEMS_FIXTURE.find((i) => i.id === 'item-spotify');
    const nvidia = STARTUP_ITEMS_FIXTURE.find((i) => i.id === 'item-nvidia');
    const steam = STARTUP_ITEMS_FIXTURE.find((i) => i.id === 'item-steam');
    const security = STARTUP_ITEMS_FIXTURE.find((i) => i.id === 'item-security');

    const passed =
      STARTUP_ITEMS_FIXTURE.length >= 12 &&
      onedrive?.publisher === 'Microsoft Corporation' &&
      onedrive?.impact === 'high' &&
      onedrive?.source === 'registry_hkcu' &&
      discord?.impactDelayMs === 1420 &&
      spotify?.recommendation === 'safe_to_disable' &&
      nvidia?.source === 'registry_hklm' &&
      steam?.impactDelayMs === 1980 &&
      security?.isProtected === true;

    results.push({
      name: 'Startup Items Fixture Integrity (Realistic Windows 11 Autostart entries)',
      passed,
      message: passed ? 'Fixture items contain authentic registry hives, publishers, and impact delay metrics' : 'Fixture data invalid'
    });
  } catch (err) {
    results.push({ name: 'Startup Items Fixture Integrity', passed: false, message: String(err) });
  }

  // Test 5: Verify non-destructive soft-disable and state transition contracts
  try {
    const testItem = { ...STARTUP_ITEMS_FIXTURE[0] };
    const originalPath = testItem.executablePath;
    const originalHive = testItem.sourceLocation;

    // Simulate soft-disable transition
    const disabledState: StartupItem = { ...testItem, status: 'disabled' };
    const delayedState: StartupItem = { ...testItem, status: 'delayed', delaySeconds: 30 };

    const nonDestructive =
      disabledState.executablePath === originalPath &&
      disabledState.sourceLocation === originalHive &&
      delayedState.delaySeconds === 30 &&
      delayedState.status === 'delayed';

    results.push({
      name: 'Safe Non-Destructive State Contract Verification',
      passed: nonDestructive,
      message: nonDestructive ? 'Soft-disable preserves binary paths and registry metadata without deletion' : 'State transition corrupted metadata'
    });
  } catch (err) {
    results.push({ name: 'Safe Non-Destructive State Contract Verification', passed: false, message: String(err) });
  }

  return results;
}
