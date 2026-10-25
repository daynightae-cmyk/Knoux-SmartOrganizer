/**
 * KNOuX SmartOrganizer — Applications Page Component Tests
 * Section 02: Applications / Software Command Center
 */

import React from 'react';
import { INSTALLED_APPLICATIONS_FIXTURE, INITIAL_METRICS, DOMAIN_SERVICES_META } from '../../lib/app-inventory';

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export function runApplicationsVerificationSuite(): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Verify exact reference metrics
  try {
    const passed =
      INITIAL_METRICS.installedAppsCount === 358 &&
      INITIAL_METRICS.publishersCount === 142 &&
      INITIAL_METRICS.availableMaintenanceCount === 12 &&
      INITIAL_METRICS.pendingUpdatesCount === 7 &&
      INITIAL_METRICS.softwareStorageFormatted === '48.6 GB';

    results.push({
      name: 'Verify Coverage Ribbon 5 Metrics (358 apps, 142 publishers, 12 actions, 7 updates, 48.6 GB)',
      passed,
      message: `Verified: ${INITIAL_METRICS.installedAppsCount} apps, ${INITIAL_METRICS.publishersCount} publishers, ${INITIAL_METRICS.softwareStorageFormatted}`,
    });
  } catch (err: any) {
    results.push({ name: 'Verify Coverage Ribbon Metrics', passed: false, message: err.message });
  }

  // Test 2: Verify exact 12 application fixture rows from screenshot
  try {
    const requiredApps = [
      'Microsoft Edge',
      'Microsoft Office 365',
      'Visual Studio Code',
      'Google Chrome',
      'Notion',
      'Discord',
      'Spotify',
      '7-Zip',
      'VLC media player',
      'ShareX',
      'Adobe Acrobat Reader DC',
      'PowerToys (Preview)',
    ];

    const foundAll = requiredApps.every((name) =>
      INSTALLED_APPLICATIONS_FIXTURE.some((a) => a.name === name)
    );

    results.push({
      name: 'Verify 12 Reference Application Rows in Table Register',
      passed: foundAll && INSTALLED_APPLICATIONS_FIXTURE.length === 12,
      message: `Found ${INSTALLED_APPLICATIONS_FIXTURE.length} apps including all 12 screenshot rows`,
    });
  } catch (err: any) {
    results.push({ name: 'Verify 12 Reference Application Rows', passed: false, message: err.message });
  }

  // Test 3: Verify 12 Domain Service Cards metadata
  try {
    const has12Services = DOMAIN_SERVICES_META.length === 12;
    const hasRequiredServices = [
      'app-inventory',
      'app-identity',
      'app-search',
      'app-publisher',
      'app-recent',
      'app-uninstall-queue',
      'app-leftovers',
      'app-updates',
      'app-size',
      'app-store-packages',
      'app-associations',
      'app-startup-impact',
    ].every((key) => DOMAIN_SERVICES_META.some((s) => s.key === key));

    results.push({
      name: 'Verify 12 Complete Domain Service Workspaces',
      passed: has12Services && hasRequiredServices,
      message: `All 12 domain service workflows configured with icons and metadata`,
    });
  } catch (err: any) {
    results.push({ name: 'Verify 12 Domain Service Cards', passed: false, message: err.message });
  }

  // Test 4: Verify default selected app has authentic dossier specs
  try {
    const edge = INSTALLED_APPLICATIONS_FIXTURE.find((a) => a.name === 'Microsoft Edge');
    const validDossier =
      edge?.version === '123.0.2420.65' &&
      edge?.installLocation === 'C:\\Program Files (x86)\\Microsoft\\Edge' &&
      edge?.digitalSignature.verified === true;

    results.push({
      name: 'Verify Microsoft Edge Dossier & Cryptographic Signature Specs',
      passed: !!validDossier,
      message: `Edge version: ${edge?.version}, location: ${edge?.installLocation}`,
    });
  } catch (err: any) {
    results.push({ name: 'Verify Microsoft Edge Dossier', passed: false, message: err.message });
  }

  return results;
}

export default function ApplicationsTestSuite() {
  const testResults = runApplicationsVerificationSuite();

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs space-y-2">
      <div className="font-bold text-cyan-400">KNOuX Applications Page Test Suite:</div>
      {testResults.map((t, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className={t.passed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
            {t.passed ? '✓ PASS' : '✗ FAIL'}
          </span>
          <span className="text-slate-200">{t.name}:</span>
          <span className="text-slate-400">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
