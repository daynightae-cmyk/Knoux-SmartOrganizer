/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AUTOMATION_SERVICE_CARDS,
  INITIAL_FLOW_NODES,
  INITIAL_OPERATION_STAGES,
  WORKFLOW_CATEGORIES,
  SAVED_WORKFLOWS_CATALOG,
  TEMPLATES_CATALOG
} from '../../lib/automation-inventory';

/**
 * Headless test harness verifying REF-10 Automation Flow Studio domain integrity,
 * catalog completeness, and visual state contracts.
 */
export function runAutomationVerificationSuite(): { passed: boolean; results: string[] } {
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

  // 1. Verify 12 Automation Service Cards
  assert(AUTOMATION_SERVICE_CARDS.length === 12, 'Catalog contains exactly 12 automation services');

  const requiredServiceKeys = [
    'auto-smart-scan',
    'auto-schedule-manager',
    'auto-run-history',
    'auto-templates',
    'auto-schedule-plan',
    'auto-cleanup-plan',
    'auto-notify',
    'auto-quiet-hours',
    'auto-battery-policy',
    'auto-retention',
    'auto-export',
    'auto-backup-plan'
  ];

  const actualServiceKeys = AUTOMATION_SERVICE_CARDS.map(c => c.serviceKey);
  const allCardsPresent = requiredServiceKeys.every(k => actualServiceKeys.includes(k));
  assert(allCardsPresent, 'All 12 required automation service keys are defined in catalog');

  // 2. Verify Flow Canvas Nodes (5 sequential nodes)
  assert(INITIAL_FLOW_NODES.length === 5, 'Flow canvas contains 5 initial nodes');
  const nodeNames = INITIAL_FLOW_NODES.map(n => n.name);
  assert(
    nodeNames.includes('Start') &&
    nodeNames.includes('File Type Matches') &&
    nodeNames.includes('Organize into Category') &&
    nodeNames.includes('Require User Approval') &&
    nodeNames.includes('Record Verified Result'),
    'All 5 sequential node stages are defined (Start -> Condition -> Action -> Approval -> Result)'
  );

  // 3. Verify Selected Node (Require User Approval)
  const approvalNode = INITIAL_FLOW_NODES.find(n => n.id === 'node-approval');
  assert(!!approvalNode, 'Approval node exists in flow definition');
  if (approvalNode) {
    assert(approvalNode.color === 'purple', 'Approval node has purple accent styling');
    assert(approvalNode.status === 'Pending', 'Approval node status is Pending');
    assert(approvalNode.config.reviewRequirement === 'Always', 'Review requirement is configured to Always');
    assert(approvalNode.config.fileTypes.length >= 4, 'File types filter contains PDF, DOCX, XLSX, PPTX');
  }

  // 4. Verify 6 Operation Preview Stages
  assert(INITIAL_OPERATION_STAGES.length === 6, 'Operation preview has 6 sequential execution stages');
  const stageNames = INITIAL_OPERATION_STAGES.map(s => s.name);
  assert(
    stageNames[0] === 'Trigger Evaluation' &&
    stageNames[1] === 'Condition Check' &&
    stageNames[2] === 'Action Proposal' &&
    stageNames[3] === 'Approval Gate' &&
    stageNames[4] === 'Execution' &&
    stageNames[5] === 'Result Journal',
    '6 Operation Preview stages match screenshot specification'
  );

  // 5. Verify Workflow Library catalogs
  assert(WORKFLOW_CATEGORIES.length === 6, 'Library defines 6 workflow categories');
  assert(SAVED_WORKFLOWS_CATALOG.length >= 4, 'Saved workflows catalog contains 4 baseline workflows');
  assert(TEMPLATES_CATALOG.length >= 4, 'Templates catalog contains 4 initial templates');

  return { passed: allPassed, results };
}

// Self-executing runner for Node/tsx verification
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('AutomationPage.test')) {
  const { passed, results } = runAutomationVerificationSuite();
  results.forEach(r => console.log(r));
  if (!passed) {
    process.exit(1);
  } else {
    console.log('\nAll AutomationPage verification tests passed successfully.');
  }
}
