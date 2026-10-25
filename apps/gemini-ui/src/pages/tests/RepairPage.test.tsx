/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  REPAIR_TOOLS_CATALOG,
  INITIAL_DIAGNOSTIC_STRIP,
  GUIDED_REPAIR_STEPS,
  RepairToolMeta
} from '../../lib/repair-inventory';

/**
 * Headless test harness verifying REF-08 Repair Recovery Lab domain integrity,
 * catalog completeness, and visual state contracts.
 */
export function runRepairVerificationSuite(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      results.push(`✔ PASS: ${testName}`);
    } else {
      results.push(`✘ FAIL: ${testName}`);
      allPassed = false;
    }
  }

  // 1. Verify all 12 repair services are registered with valid metadata
  assert(REPAIR_TOOLS_CATALOG.length === 12, 'Catalog contains exactly 12 repair tools');

  const requiredServiceKeys = [
    'dism-checkhealth',
    'dism-scanhealth',
    'dism-restorehealth',
    'sfc-verifyonly',
    'sfc-scannow',
    'flush-dns',
    'reset-winsock',
    'reset-tcpip',
    'repair-history',
    'windows-troubleshooters',
    'restore-point-review',
    'windows-update-repair'
  ];

  const catalogKeys = REPAIR_TOOLS_CATALOG.map(t => t.serviceKey);
  const allServicesPresent = requiredServiceKeys.every(k => catalogKeys.includes(k));
  assert(allServicesPresent, 'All 12 required service keys are defined in catalog');

  // 2. Verify DISM ScanHealth configuration matches the reference screenshot
  const dismScan = REPAIR_TOOLS_CATALOG.find(t => t.serviceKey === 'dism-scanhealth');
  assert(!!dismScan, 'DISM ScanHealth exists in catalog');
  if (dismScan) {
    assert(
      dismScan.command === 'DISM /Online /Cleanup-Image /ScanHealth',
      'DISM ScanHealth command matches "DISM /Online /Cleanup-Image /ScanHealth"'
    );
    assert(
      dismScan.privilegeRequirement.level === 'Administrator access required',
      'DISM ScanHealth requires elevated administrator privileges'
    );
    assert(
      dismScan.riskAssessment.level === 'Low Risk',
      'DISM ScanHealth risk tier is calibrated to Low Risk'
    );
    assert(
      dismScan.executionStages.length >= 4,
      'DISM ScanHealth defines the 4 visual execution stages'
    );
  }

  // 3. Verify top diagnostic strip has 4 items with honest non-fabricated baselines
  assert(INITIAL_DIAGNOSTIC_STRIP.length === 4, 'Diagnostic strip has exactly 4 status panels');
  const stripIds = INITIAL_DIAGNOSTIC_STRIP.map(s => s.id);
  assert(
    stripIds.includes('system-components') &&
    stripIds.includes('windows-file-integrity') &&
    stripIds.includes('network-config') &&
    stripIds.includes('repair-journal'),
    'All 4 diagnostic categories present (System Components, File Integrity, Network, Journal)'
  );

  // 4. Verify Guided Repair Sequence has 7 steps with step 5 highlighted
  assert(GUIDED_REPAIR_STEPS.length === 7, 'Guided Repair Sequence has 7 sequential steps');
  const step5 = GUIDED_REPAIR_STEPS.find(s => s.number === 5);
  assert(
    step5?.id === 'confirm-permission' && step5?.highlightColor === 'gold',
    'Step 5 is Confirm Permission with gold authorization highlight'
  );

  // 5. Verify privilege and elevation safety contracts
  const elevatedTools = REPAIR_TOOLS_CATALOG.filter(t => t.privilegeRequirement.elevationRequired);
  assert(
    elevatedTools.length >= 8,
    'High-impact servicing tools require explicit UAC administrator elevation'
  );

  return { passed: allPassed, results };
}

// Self-executing runner for Node/tsx verification
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('RepairPage.test')) {
  const { passed, results } = runRepairVerificationSuite();
  results.forEach(r => console.log(r));
  if (!passed) {
    process.exit(1);
  } else {
    console.log('\nAll RepairPage verification tests passed successfully.');
  }
}
