/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INITIAL_STORAGE_METRICS,
  INITIAL_VOLUMES,
  INITIAL_TREEMAP_DATA,
  INITIAL_LARGEST_ITEMS,
  STORAGE_SERVICES_CATALOG
} from '../../lib/storage-inventory';

export interface StorageTestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export function runStorageVerificationSuite(): StorageTestResult[] {
  const results: StorageTestResult[] = [];

  // Test 1: Verify all 5 top measurement strip metrics match reference screenshot
  try {
    const volMetric = INITIAL_STORAGE_METRICS.find(m => m.id === 'connected-volumes');
    const capMetric = INITIAL_STORAGE_METRICS.find(m => m.id === 'measured-capacity');
    const availMetric = INITIAL_STORAGE_METRICS.find(m => m.id === 'available-space');
    const lowMetric = INITIAL_STORAGE_METRICS.find(m => m.id === 'low-space-volumes');
    const physMetric = INITIAL_STORAGE_METRICS.find(m => m.id === 'physical-drives');

    const passed =
      INITIAL_STORAGE_METRICS.length === 5 &&
      volMetric?.value === '3' &&
      capMetric?.value === '3.72 TB' &&
      availMetric?.value === '1.28 TB' &&
      lowMetric?.value === '1' &&
      lowMetric?.isAlert === true &&
      physMetric?.value === '2';

    results.push({
      name: 'Storage Top Metrics Verification (Connected, Capacity, Available, Low-Space, Physical)',
      passed,
      message: passed ? 'All 5 metrics match reference screenshot exactly' : 'Metrics mismatch'
    });
  } catch (err) {
    results.push({ name: 'Storage Top Metrics Verification', passed: false, message: String(err) });
  }

  // Test 2: Verify exact reference volumes C:, D:, and E: specifications
  try {
    const driveC = INITIAL_VOLUMES.find(v => v.letter === 'C:');
    const driveD = INITIAL_VOLUMES.find(v => v.letter === 'D:');
    const driveE = INITIAL_VOLUMES.find(v => v.letter === 'E:');

    const cOk =
      driveC?.name === 'Windows' &&
      driveC?.filesystem === 'NTFS' &&
      driveC?.freeDisplay === '98.4 GB' &&
      driveC?.totalDisplay === '476 GB' &&
      driveC?.usedDisplay === '377.6 GB' &&
      driveC?.usedPercent === 79.3 &&
      driveC?.isLowSpace === true;

    const dOk =
      driveD?.name === 'Data' &&
      driveD?.filesystem === 'NTFS' &&
      driveD?.freeDisplay === '608 GB' &&
      driveD?.totalDisplay === '1.82 TB' &&
      driveD?.usedDisplay === '1.21 TB' &&
      driveD?.usedPercent === 66.4;

    const eOk =
      driveE?.name === 'Projects' &&
      driveE?.filesystem === 'exFAT' &&
      driveE?.freeDisplay === '582 GB' &&
      driveE?.totalDisplay === '931 GB' &&
      driveE?.usedDisplay === '349 GB' &&
      driveE?.usedPercent === 37.5;

    const passed = Boolean(cOk && dOk && eOk);
    results.push({
      name: 'Volume Bays Verification (C: Windows, D: Data, E: Projects)',
      passed,
      message: passed ? 'All 3 volume bays match reference screenshot' : 'Volume bays mismatch'
    });
  } catch (err) {
    results.push({ name: 'Volume Bays Verification', passed: false, message: String(err) });
  }

  // Test 3: Verify Treemap nodes contain all primary system directories
  try {
    const nodeNames = INITIAL_TREEMAP_DATA.map(n => n.name);
    const winNode = INITIAL_TREEMAP_DATA.find(n => n.name === 'Windows');
    const usersNode = INITIAL_TREEMAP_DATA.find(n => n.name === 'Users');
    const progNode = INITIAL_TREEMAP_DATA.find(n => n.name === 'Program Files');

    const hasAllNodes =
      nodeNames.includes('Windows') &&
      nodeNames.includes('Users') &&
      nodeNames.includes('Program Files') &&
      nodeNames.includes('Program Files (x86)') &&
      nodeNames.includes('ProgramData') &&
      nodeNames.includes('pagefile.sys') &&
      nodeNames.includes('hiberfil.sys') &&
      nodeNames.includes('Other');

    const passed =
      hasAllNodes &&
      winNode?.sizeDisplay === '93.6 GB' &&
      usersNode?.sizeDisplay === '76.2 GB' &&
      progNode?.sizeDisplay === '62.9 GB';

    results.push({
      name: 'Treemap Layout Verification (Windows 93.6G, Users 76.2G, Program Files 62.9G, etc.)',
      passed,
      message: passed ? 'All treemap nodes match layout' : 'Treemap layout mismatch'
    });
  } catch (err) {
    results.push({ name: 'Treemap Layout Verification', passed: false, message: String(err) });
  }

  // Test 4: Verify 10 largest items match screenshot ledger
  try {
    const requiredFiles = [
      'Windows.iso',
      'VirtualMachine.vhdx',
      'Premiere Projects',
      'Backup 2024',
      'Photos Library',
      'Archive.zip',
      'UE5',
      'Installers',
      'Camera Raw',
      'Music Library'
    ];

    const currentNames = INITIAL_LARGEST_ITEMS.map(i => i.name);
    const passed =
      INITIAL_LARGEST_ITEMS.length === 10 &&
      requiredFiles.every(name => currentNames.includes(name)) &&
      INITIAL_LARGEST_ITEMS[0].size === '24.8 GB' &&
      INITIAL_LARGEST_ITEMS[1].size === '18.4 GB';

    results.push({
      name: 'Largest Items Ledger Verification (10 items including Windows.iso and VirtualMachine.vhdx)',
      passed,
      message: passed ? 'All 10 largest items match screenshot' : 'Largest items mismatch'
    });
  } catch (err) {
    results.push({ name: 'Largest Items Ledger Verification', passed: false, message: String(err) });
  }

  // Test 5: Verify all 12 storage domain services
  try {
    const expectedKeys = [
      'storage-disks',
      'storage-large-files',
      'storage-duplicates',
      'storage-treemap',
      'storage-top-folders',
      'storage-filetypes',
      'storage-scan-overview',
      'storage-fragmentation',
      'storage-smart',
      'storage-reclaim',
      'storage-history',
      'storage-removable'
    ];

    const currentKeys = STORAGE_SERVICES_CATALOG.map(s => s.serviceKey);
    const passed =
      STORAGE_SERVICES_CATALOG.length === 12 &&
      expectedKeys.every(k => currentKeys.includes(k));

    results.push({
      name: 'Storage Domain Services Catalog Verification (12 services)',
      passed,
      message: passed ? 'All 12 domain services cataloged' : 'Missing service catalog keys'
    });
  } catch (err) {
    results.push({ name: 'Storage Domain Services Catalog Verification', passed: false, message: String(err) });
  }

  return results;
}
