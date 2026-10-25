/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INITIAL_CLEANUP_METRICS,
  CATEGORY_BREAKDOWN_BAR,
  CLEANUP_CANDIDATES_FIXTURE,
  CLEANUP_SERVICES_CATALOG
} from '../../lib/cleanup-inventory';

export interface CleanupTestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export function runCleanupVerificationSuite(): CleanupTestResult[] {
  const results: CleanupTestResult[] = [];

  // Test 1: Verify all 4 top summary strip metrics match reference screenshot
  try {
    const coverageMetric = INITIAL_CLEANUP_METRICS.find(m => m.id === 'scan-coverage');
    const candidatesMetric = INITIAL_CLEANUP_METRICS.find(m => m.id === 'candidate-files');
    const recoveryMetric = INITIAL_CLEANUP_METRICS.find(m => m.id === 'potential-recovery');
    const reviewMetric = INITIAL_CLEANUP_METRICS.find(m => m.id === 'items-review');

    const passed =
      INITIAL_CLEANUP_METRICS.length === 4 &&
      coverageMetric?.value === '92%' &&
      candidatesMetric?.value === '24,893' &&
      recoveryMetric?.value === '8.46 GB' &&
      reviewMetric?.value === '317' &&
      reviewMetric?.isAlert === true;

    results.push({
      name: 'Clean Room Top Metrics Verification (92%, 24,893, 8.46 GB, 317 Review)',
      passed,
      message: passed ? 'All 4 summary cards match reference screenshot' : 'Metrics mismatch'
    });
  } catch (err) {
    results.push({ name: 'Clean Room Top Metrics Verification', passed: false, message: String(err) });
  }

  // Test 2: Verify category breakdown bar percentages & sizes
  try {
    const tempSeg = CATEGORY_BREAKDOWN_BAR.find(s => s.id === 'seg-temp');
    const resSeg = CATEGORY_BREAKDOWN_BAR.find(s => s.id === 'seg-residues');
    const logSeg = CATEGORY_BREAKDOWN_BAR.find(s => s.id === 'seg-logs');
    const browserSeg = CATEGORY_BREAKDOWN_BAR.find(s => s.id === 'seg-browser');
    const downSeg = CATEGORY_BREAKDOWN_BAR.find(s => s.id === 'seg-downloads');
    const recSeg = CATEGORY_BREAKDOWN_BAR.find(s => s.id === 'seg-recycle');

    const passed =
      CATEGORY_BREAKDOWN_BAR.length === 6 &&
      tempSeg?.percentage === 33.8 &&
      tempSeg?.sizeDisplay === '8.42 GB' &&
      resSeg?.percentage === 18.7 &&
      resSeg?.sizeDisplay === '4.65 GB' &&
      logSeg?.percentage === 12.4 &&
      logSeg?.sizeDisplay === '2.06 GB' &&
      browserSeg?.percentage === 20.1 &&
      browserSeg?.sizeDisplay === '3.76 GB' &&
      downSeg?.percentage === 9.8 &&
      downSeg?.sizeDisplay === '1.63 GB' &&
      recSeg?.percentage === 5.2 &&
      recSeg?.sizeDisplay === '1.10 GB';

    results.push({
      name: 'Category Breakdown Bar Verification (6 colored segments matching exact percentages)',
      passed,
      message: passed ? 'All breakdown percentages match' : 'Breakdown segments mismatch'
    });
  } catch (err) {
    results.push({ name: 'Category Breakdown Bar Verification', passed: false, message: String(err) });
  }

  // Test 3: Verify Candidate files from reference screenshot
  try {
    const requiredCandidates = [
      'Chrome Cache Files',
      'Windows Update Download Cache',
      'Microsoft Teams - Cache',
      'Adobe Installer Logs',
      'Old Downloads',
      'Recycle Bin Contents'
    ];

    const currentNames = CLEANUP_CANDIDATES_FIXTURE.map(c => c.name);
    const hasAll = requiredCandidates.every(name => currentNames.includes(name));

    const chromeCand = CLEANUP_CANDIDATES_FIXTURE.find(c => c.name === 'Chrome Cache Files');
    const adobeCand = CLEANUP_CANDIDATES_FIXTURE.find(c => c.name === 'Adobe Installer Logs');
    const downCand = CLEANUP_CANDIDATES_FIXTURE.find(c => c.name === 'Old Downloads');

    const passed =
      hasAll &&
      chromeCand?.sizeDisplay === '1.24 GB' &&
      chromeCand?.safety === 'safe' &&
      adobeCand?.sizeDisplay === '221 MB' &&
      adobeCand?.safety === 'review-recommended' &&
      downCand?.sizeDisplay === '1.13 GB' &&
      downCand?.safety === 'review-required';

    results.push({
      name: 'Cleanup Candidates Ledger Verification (6 reference items with exact safety badges)',
      passed,
      message: passed ? 'All candidate rows and safety badges match' : 'Candidate rows mismatch'
    });
  } catch (err) {
    results.push({ name: 'Cleanup Candidates Ledger Verification', passed: false, message: String(err) });
  }

  // Test 4: Verify all 12 Cleanup domain services
  try {
    const expectedKeys = [
      'cleanup-temp-preview',
      'cleanup-temp-quarantine',
      'cleanup-temp-undo',
      'cleanup-quarantine-list',
      'cleanup-estimate',
      'cleanup-recycle',
      'cleanup-unused',
      'cleanup-update-cache',
      'cleanup-browser-cache',
      'cleanup-logs',
      'cleanup-schedule',
      'cleanup-reports'
    ];

    const currentKeys = CLEANUP_SERVICES_CATALOG.map(s => s.serviceKey);
    const passed =
      CLEANUP_SERVICES_CATALOG.length === 12 &&
      expectedKeys.every(k => currentKeys.includes(k));

    results.push({
      name: 'Cleanup Domain Services Catalog Verification (12 services)',
      passed,
      message: passed ? 'All 12 cleanup services cataloged' : 'Missing service catalog keys'
    });
  } catch (err) {
    results.push({ name: 'Cleanup Domain Services Catalog Verification', passed: false, message: String(err) });
  }

  return results;
}
