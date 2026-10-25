/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SERVICE_COMMANDER_METRICS,
  SERVICE_NAVIGATION_CARDS,
  INITIAL_SERVICES_REGISTER,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_DEPENDENCY_GRAPH_NODES
} from '../../lib/services-inventory';

/**
 * Headless test harness verifying REF-09 Windows Services Commander domain integrity,
 * catalog completeness, and visual state contracts.
 */
export function runServicesVerificationSuite(): { passed: boolean; results: string[] } {
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

  // 1. Verify 12 Service Navigation cards
  assert(SERVICE_NAVIGATION_CARDS.length === 12, 'Catalog contains exactly 12 service cards');

  const requiredCardKeys = [
    'services-inventory',
    'services-control',
    'services-undo',
    'services-dependencies',
    'services-protected',
    'services-search',
    'services-startup-report',
    'services-state-history',
    'services-dependents',
    'services-diagnose',
    'services-config',
    'services-perf'
  ];

  const actualCardKeys = SERVICE_NAVIGATION_CARDS.map(c => c.serviceKey);
  const allCardsPresent = requiredCardKeys.every(k => actualCardKeys.includes(k));
  assert(allCardsPresent, 'All 12 required service workflow keys are present');

  // 2. Verify Status Ribbon metrics counts match screenshot
  assert(SERVICE_COMMANDER_METRICS.length === 6, 'Status ribbon contains exactly 6 metrics');
  const discovered = SERVICE_COMMANDER_METRICS.find(m => m.id === 'discovered');
  const running = SERVICE_COMMANDER_METRICS.find(m => m.id === 'running');
  const stopped = SERVICE_COMMANDER_METRICS.find(m => m.id === 'stopped');
  const automatic = SERVICE_COMMANDER_METRICS.find(m => m.id === 'automatic');
  const manual = SERVICE_COMMANDER_METRICS.find(m => m.id === 'manual');
  const disabled = SERVICE_COMMANDER_METRICS.find(m => m.id === 'disabled');

  assert(discovered?.count === 271, 'Services Discovered count is 271');
  assert(running?.count === 189, 'Running count is 189');
  assert(stopped?.count === 82, 'Stopped count is 82');
  assert(automatic?.count === 122, 'Automatic count is 122');
  assert(manual?.count === 98, 'Manual count is 98');
  assert(disabled?.count === 51, 'Disabled count is 51');

  // 3. Verify Initial Register & WinDefend Protection
  const winDefend = INITIAL_SERVICES_REGISTER.find(s => s.name === 'WinDefend');
  assert(!!winDefend, 'WinDefend exists in service register');
  if (winDefend) {
    assert(winDefend.isProtected === true, 'WinDefend is marked as protected service');
    assert(winDefend.status === 'Running', 'WinDefend status is Running');
    assert(winDefend.startupType === 'Automatic', 'WinDefend startupType is Automatic');
    assert(winDefend.dependencies.includes('RPCSS'), 'WinDefend depends on RPCSS');
  }

  // 4. Verify Dependency Graph definitions
  const winDefendGraph = INITIAL_DEPENDENCY_GRAPH_NODES['WinDefend'];
  assert(!!winDefendGraph && winDefendGraph.length >= 4, 'WinDefend dependency graph has nodes defined');

  // 5. Verify Recent Service Activity logs
  assert(INITIAL_ACTIVITY_LOGS.length >= 5, 'Recent Service Activity contains baseline audit logs');

  return { passed: allPassed, results };
}

// Self-executing runner for Node/tsx verification
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('ServicesPage.test')) {
  const { passed, results } = runServicesVerificationSuite();
  results.forEach(r => console.log(r));
  if (!passed) {
    process.exit(1);
  } else {
    console.log('\nAll ServicesPage verification tests passed successfully.');
  }
}
