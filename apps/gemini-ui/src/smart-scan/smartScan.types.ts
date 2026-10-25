/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Smart Scan Types Specification
 */

export type ScanCategory = 'junk' | 'duplicates' | 'large' | 'system' | 'privacy' | 'other';

export interface KpiMetric {
  id: string;
  labelEn: string;
  labelAr: string;
  value: string;
  subtextEn: string;
  subtextAr: string;
  accentColor: 'cyan' | 'blue' | 'red' | 'purple' | 'teal' | 'green';
  indicatorType: 'ring' | 'stack' | 'alert' | 'disk' | 'shield' | 'sparkline';
}

export interface ScanServiceMeta {
  id: string;
  titleEn: string;
  titleAr: string;
  subtextEn: string;
  subtextAr: string;
  iconName: string;
  accentGradient: string;
  badge?: string;
  targetWorkspace?: string;
}

export interface PathPreviewItem {
  id: string;
  path: string;
  sizeDisplay: string;
  selected: boolean;
}

export interface ScanResultItem {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: ScanCategory;
  categoryLabelEn: string;
  categoryLabelAr: string;
  itemCount: number;
  sizeGB: number;
  impactLevel: 'high' | 'medium' | 'low';
  status: 'safe' | 'review' | 'attention';
  statusLabelEn: string;
  statusLabelAr: string;
  selected: boolean;
  pathsPreview: PathPreviewItem[];
  detailedDescriptionEn: string;
  detailedDescriptionAr: string;
  estimatedImpactDisplay: string;
  safetyLevelDisplay: string;
}

export interface BreakdownCategory {
  id: ScanCategory;
  labelEn: string;
  labelAr: string;
  sizeGB: number;
  percentage: number;
  colorHex: string;
}

export interface RecentScanRecord {
  id: string;
  titleEn: string;
  titleAr: string;
  itemCount: number;
  sizeGB: number;
  timeDisplayEn: string;
  timeDisplayAr: string;
  status: 'completed' | 'in_progress' | 'failed';
}

export interface ActiveScanServiceState {
  serviceId: string;
  serviceTitleEn: string;
  serviceTitleAr: string;
  progressPercent: number;
  isScanning: boolean;
  activePhase: string;
}
