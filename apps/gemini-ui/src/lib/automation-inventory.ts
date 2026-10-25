/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NodeAccentColor = 'teal' | 'pink' | 'amber' | 'purple' | 'emerald';
export type NodeStatusType = 'Active' | 'Matched' | 'Ready' | 'Pending' | 'Complete';

export interface FlowNodeItem {
  id: string;
  name: string;
  subtitle: string;
  color: NodeAccentColor;
  status: NodeStatusType;
  iconType: 'play' | 'file-check' | 'folder' | 'user' | 'certified';
  config: {
    triggerType: 'Folder Event' | 'Scheduled';
    watchFolder: string;
    folderPermission: 'Read Only' | 'Read & Process';
    fileTypes: string[];
    destination: string;
    reviewRequirement: 'Always' | 'If Uncertain' | 'Never';
    notificationMode: 'In-App' | 'Windows' | 'Email';
    errorHandling: string;
  };
}

export interface AutomationServiceCard {
  id: string;
  serviceKey: string;
  title: string;
  subtitle: string;
  iconType:
    | 'smart-scan'
    | 'schedule-mgr'
    | 'history'
    | 'templates'
    | 'schedule-plan'
    | 'cleanup-plan'
    | 'notify'
    | 'quiet-hours'
    | 'battery'
    | 'retention'
    | 'export'
    | 'backup';
  capabilityState: 'Available' | 'Active' | 'Draft' | 'Configured';
}

export interface OperationPreviewStage {
  step: number;
  id: string;
  name: string;
  description: string;
  iconType: 'folder' | 'file' | 'folder-action' | 'user' | 'gear' | 'certified';
  status: 'Ready' | 'Processing' | 'Complete';
}

export interface SavedWorkflowItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  iconType: 'document' | 'photo' | 'archive' | 'download';
  nodeCount: number;
}

export interface WorkflowTemplateItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  iconType: 'scratch' | 'folder' | 'media' | 'archive';
}

export const AUTOMATION_SERVICE_CARDS: AutomationServiceCard[] = [
  {
    id: 'auto-smart-scan',
    serviceKey: 'auto-smart-scan',
    title: 'Smart Scan Scheduler',
    subtitle: 'Scan and detect files',
    iconType: 'smart-scan',
    capabilityState: 'Available'
  },
  {
    id: 'auto-schedule-manager',
    serviceKey: 'auto-schedule-manager',
    title: 'Schedule Manager',
    subtitle: 'Manage time-based triggers',
    iconType: 'schedule-mgr',
    capabilityState: 'Active'
  },
  {
    id: 'auto-run-history',
    serviceKey: 'auto-run-history',
    title: 'Run History',
    subtitle: 'View past executions',
    iconType: 'history',
    capabilityState: 'Available'
  },
  {
    id: 'auto-templates',
    serviceKey: 'auto-templates',
    title: 'Workflow Templates',
    subtitle: 'Pre-built workflows',
    iconType: 'templates',
    capabilityState: 'Available'
  },
  {
    id: 'auto-schedule-plan',
    serviceKey: 'auto-schedule-plan',
    title: 'Schedule Planner',
    subtitle: 'Visual time planning',
    iconType: 'schedule-plan',
    capabilityState: 'Available'
  },
  {
    id: 'auto-cleanup-plan',
    serviceKey: 'auto-cleanup-plan',
    title: 'Cleanup Planner',
    subtitle: 'Automated cleanup rules',
    iconType: 'cleanup-plan',
    capabilityState: 'Configured'
  },
  {
    id: 'auto-notify',
    serviceKey: 'auto-notify',
    title: 'Notification Rules',
    subtitle: 'Alerts and delivery options',
    iconType: 'notify',
    capabilityState: 'Available'
  },
  {
    id: 'auto-quiet-hours',
    serviceKey: 'auto-quiet-hours',
    title: 'Quiet Hours',
    subtitle: 'Silence during focus time',
    iconType: 'quiet-hours',
    capabilityState: 'Available'
  },
  {
    id: 'auto-battery-policy',
    serviceKey: 'auto-battery-policy',
    title: 'Battery Policies',
    subtitle: 'Adjust behavior by power state',
    iconType: 'battery',
    capabilityState: 'Available'
  },
  {
    id: 'auto-retention',
    serviceKey: 'auto-retention',
    title: 'Retention Policies',
    subtitle: 'Keep or remove files',
    iconType: 'retention',
    capabilityState: 'Available'
  },
  {
    id: 'auto-export',
    serviceKey: 'auto-export',
    title: 'Automation Export',
    subtitle: 'Export and share workflows',
    iconType: 'export',
    capabilityState: 'Available'
  },
  {
    id: 'auto-backup-plan',
    serviceKey: 'auto-backup-plan',
    title: 'Backup Planner',
    subtitle: 'Schedule backups of important data',
    iconType: 'backup',
    capabilityState: 'Configured'
  }
];

export const INITIAL_FLOW_NODES: FlowNodeItem[] = [
  {
    id: 'node-start',
    name: 'Start',
    subtitle: 'Folder Event or Scheduled Trigger',
    color: 'teal',
    status: 'Active',
    iconType: 'play',
    config: {
      triggerType: 'Folder Event',
      watchFolder: 'C:\\Users\\Alex\\Documents\\Input',
      folderPermission: 'Read & Process',
      fileTypes: ['PDF', 'DOCX', 'XLSX', 'PPTX'],
      destination: 'C:\\Users\\Alex\\Documents\\Organized',
      reviewRequirement: 'Always',
      notificationMode: 'In-App',
      errorHandling: 'Pause and Notify User'
    }
  },
  {
    id: 'node-condition',
    name: 'File Type Matches',
    subtitle: 'Check file type and criteria',
    color: 'pink',
    status: 'Matched',
    iconType: 'file-check',
    config: {
      triggerType: 'Folder Event',
      watchFolder: 'C:\\Users\\Alex\\Documents\\Input',
      folderPermission: 'Read & Process',
      fileTypes: ['PDF', 'DOCX', 'XLSX', 'PPTX'],
      destination: 'C:\\Users\\Alex\\Documents\\Organized',
      reviewRequirement: 'Always',
      notificationMode: 'In-App',
      errorHandling: 'Skip File and Log Warning'
    }
  },
  {
    id: 'node-action',
    name: 'Organize into Category',
    subtitle: 'Move to appropriate folder based on type',
    color: 'amber',
    status: 'Ready',
    iconType: 'folder',
    config: {
      triggerType: 'Folder Event',
      watchFolder: 'C:\\Users\\Alex\\Documents\\Input',
      folderPermission: 'Read & Process',
      fileTypes: ['PDF', 'DOCX', 'XLSX', 'PPTX'],
      destination: 'C:\\Users\\Alex\\Documents\\Organized',
      reviewRequirement: 'Always',
      notificationMode: 'In-App',
      errorHandling: 'Move to Quarantine Folder'
    }
  },
  {
    id: 'node-approval',
    name: 'Require User Approval',
    subtitle: 'Ask for review before proceeding',
    color: 'purple',
    status: 'Pending',
    iconType: 'user',
    config: {
      triggerType: 'Folder Event',
      watchFolder: 'C:\\Users\\Alex\\Documents\\Input',
      folderPermission: 'Read & Process',
      fileTypes: ['PDF', 'DOCX', 'XLSX', 'PPTX'],
      destination: 'C:\\Users\\Alex\\Documents\\Organized',
      reviewRequirement: 'Always',
      notificationMode: 'In-App',
      errorHandling: 'Pause and Notify User'
    }
  },
  {
    id: 'node-end',
    name: 'Record Verified Result',
    subtitle: 'Log action and update status',
    color: 'amber',
    status: 'Complete',
    iconType: 'certified',
    config: {
      triggerType: 'Folder Event',
      watchFolder: 'C:\\Users\\Alex\\Documents\\Input',
      folderPermission: 'Read & Process',
      fileTypes: ['PDF', 'DOCX', 'XLSX', 'PPTX'],
      destination: 'C:\\Users\\Alex\\Documents\\Organized',
      reviewRequirement: 'Always',
      notificationMode: 'In-App',
      errorHandling: 'Append to Session Journal'
    }
  }
];

export const INITIAL_OPERATION_STAGES: OperationPreviewStage[] = [
  {
    step: 1,
    id: 'trigger-eval',
    name: 'Trigger Evaluation',
    description: 'Check folder or schedule for new files',
    iconType: 'folder',
    status: 'Ready'
  },
  {
    step: 2,
    id: 'condition-check',
    name: 'Condition Check',
    description: 'Evaluate file type and matching rules',
    iconType: 'file',
    status: 'Ready'
  },
  {
    step: 3,
    id: 'action-proposal',
    name: 'Action Proposal',
    description: 'Show destination and proposed action',
    iconType: 'folder-action',
    status: 'Ready'
  },
  {
    step: 4,
    id: 'approval-gate',
    name: 'Approval Gate',
    description: 'Wait for user review and confirmation',
    iconType: 'user',
    status: 'Ready'
  },
  {
    step: 5,
    id: 'execution',
    name: 'Execution',
    description: 'Perform file operation (move/organize)',
    iconType: 'gear',
    status: 'Ready'
  },
  {
    step: 6,
    id: 'result-journal',
    name: 'Result Journal',
    description: 'Log outcome and update history',
    iconType: 'certified',
    status: 'Ready'
  }
];

export const SAVED_WORKFLOWS_CATALOG: SavedWorkflowItem[] = [
  {
    id: 'wf-1',
    title: 'Document Organizer',
    summary: 'Monitored folder • Auto sort',
    category: 'File Organization',
    iconType: 'document',
    nodeCount: 5
  },
  {
    id: 'wf-2',
    title: 'Photo Sorter',
    summary: 'Images • Date • Category',
    category: 'Productivity',
    iconType: 'photo',
    nodeCount: 4
  },
  {
    id: 'wf-3',
    title: 'Project Archive',
    summary: 'Client files • Approval',
    category: 'Backup & Retention',
    iconType: 'archive',
    nodeCount: 6
  },
  {
    id: 'wf-4',
    title: 'Downloads Cleanup',
    summary: 'Rules • Move • Notify',
    category: 'System Maintenance',
    iconType: 'download',
    nodeCount: 4
  }
];

export const TEMPLATES_CATALOG: WorkflowTemplateItem[] = [
  {
    id: 'tpl-1',
    title: 'Start from Scratch',
    summary: 'Blank workflow template',
    category: 'Templates',
    iconType: 'scratch'
  },
  {
    id: 'tpl-2',
    title: 'File Organization (Basic)',
    summary: 'Sort by type and date',
    category: 'File Organization',
    iconType: 'folder'
  },
  {
    id: 'tpl-3',
    title: 'Media Management',
    summary: 'Photos, videos, and audio',
    category: 'Productivity',
    iconType: 'media'
  },
  {
    id: 'tpl-4',
    title: 'Archive Old Files',
    summary: 'Move to archive with rules',
    category: 'Backup & Retention',
    iconType: 'archive'
  }
];

export const WORKFLOW_CATEGORIES = [
  { name: 'File Organization', count: 12 },
  { name: 'Productivity', count: 8 },
  { name: 'System Maintenance', count: 6 },
  { name: 'Backup & Retention', count: 5 },
  { name: 'Notifications', count: 4 },
  { name: 'Templates', count: 11 }
];
