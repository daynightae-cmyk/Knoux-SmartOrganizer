/**
 * KNOuX SmartOrganizer — Studio Types & Schema
 * Section 01: Smart Organization Studio
 */

export type StudioStageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface StudioStage {
  id: StudioStageId;
  nameEn: string;
  nameAr: string;
  status: 'active' | 'completed' | 'available' | 'locked' | 'disabled';
}

export type CategoryKey =
  | 'image'
  | 'video'
  | 'document'
  | 'audio'
  | 'archive'
  | 'application'
  | 'design'
  | 'code'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'font'
  | 'database'
  | 'ebook'
  | 'system'
  | 'web'
  | 'folder'
  | 'other';

export interface CategoryInfo {
  key: CategoryKey;
  labelEn: string;
  labelAr: string;
  fileCount: number;
  sizeGb: number;
  iconName: string;
  colorAccent: string; // Tailwind/hex glow
  borderColor: string;
  descriptionEn: string;
  descriptionAr: string;
  defaultExtensions: string[];
}

export interface AuthorizedFolder {
  id: string;
  path: string;
  fileCount: number;
  sizeGb: number;
  isWritable: boolean;
  status: 'authorized' | 'scanning' | 'permission_required' | 'offline';
  lastScanned?: string;
}

export interface InventoryStats {
  totalFiles: number;
  totalSizeGb: number;
  totalFolders: number;
  fileTypesCount: number;
  scanState: 'Scan complete' | 'Scanning...' | 'Partial scan' | 'Idle' | 'Error';
  lastRefreshed: string;
  sourceCount: number;
}

export interface StudioFileItem {
  id: string;
  name: string;
  category: CategoryKey;
  sizeBytes: number;
  sizeFormatted: string;
  extension: string;
  dateModified: string;
  captureDate?: string;
  sourcePath: string;
  thumbnailUrl?: string;
  resolution?: string;
  duration?: string;
  tags?: string[];
  isDuplicateCandidate?: boolean;
  duplicateGroup?: string;
  hash?: string;
  nativeFileId?: number;
  status?: 'pending' | 'organized' | 'conflict' | 'ignored';
}

export type OperationMode = 'copy' | 'move' | 'virtual';

export interface NamingRule {
  id: string;
  name: string;
  strategy: 'original' | 'date_prefix' | 'kebab_case' | 'custom_pattern';
  customPattern?: string; // e.g. {YYYY}-{MM}-{DD}_{original}
  duplicateHandling: 'add_date' | 'add_increment' | 'overwrite_prompt' | 'skip';
  descriptionEn: string;
  descriptionAr: string;
}

export interface GroupingRule {
  id: string;
  groupBy: 'capture_date' | 'category' | 'extension' | 'size' | 'project';
  structure: string; // e.g. "YYYY \\ MM \\ DD"
  customTemplate?: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface PotentialConflict {
  id: string;
  type: 'duplicate_name' | 'folder_exists' | 'read_only' | 'path_too_long';
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  affectedCount: number;
  resolutionStrategy: 'auto_rename' | 'merge_folder' | 'skip' | 'overwrite';
}

export interface StudioCollection {
  id: string;
  name: string;
  fileCount: number;
  totalSizeFormatted: string;
  color: string;
  ruleTag: string;
  createdDate: string;
}

export interface OrganizationPlanItem {
  id: string;
  sourceFile: StudioFileItem;
  destinationPath: string;
  suggestedName: string;
  operation: OperationMode;
  hasConflict: boolean;
  conflictType?: string;
}

export interface HistoryJournalEntry {
  id: string;
  timestamp: string;
  filesProcessed: number;
  totalSizeFormatted: string;
  destinationPath: string;
  mode: OperationMode;
  status: 'completed' | 'partially_reverted' | 'reverted' | 'failed' | 'preview';
  canUndo: boolean;
  previewOnly?: boolean;
  summaryEn: string;
  summaryAr: string;
}

export interface StudioSuggestion {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  impactFilesCount: number;
  savedSpaceFormatted?: string;
  actionType: 'group_raw_photos' | 'archive_downloads' | 'deduplicate' | 'extract_code_assets';
  confidenceScore: number;
}
