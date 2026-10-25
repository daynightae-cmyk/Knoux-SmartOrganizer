/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KNOuX Google Workspace Integration Hub
 * Manages Google Sheets, Gmail, Tasks, Forms, Contacts, Calendar, Picker, Slides, Chat, and Classroom.
 *
 * PHASE BOUNDARY: every surface in this hub renders high-fidelity local fixtures.
 * No Google account is contacted, no OAuth token is held, and nothing is written
 * to a Google service. The UI states that explicitly on every panel.
 */

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Mail,
  CheckSquare,
  FileQuestion,
  Users,
  Calendar,
  FolderOpen,
  Presentation,
  MessageSquare,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Plus,
  RefreshCw,
  Lock,
  Globe,
  Info,
  X,
  Copy,
  Table2,
  ListFilter,
  History,
} from 'lucide-react';

import { KNOuXTitleBar, KNOuXSidebar } from '../shell/KNOuXShellComponents';
import { useNavigation } from '../../context/NavigationContext';

interface GoogleWorkspaceHubProps {
  locale?: 'en' | 'ar';
}

type HubServiceId =
  | 'sheets'
  | 'gmail'
  | 'tasks'
  | 'forms'
  | 'contacts'
  | 'calendar'
  | 'picker'
  | 'slides'
  | 'chat'
  | 'classroom';

type FieldTone = 'default' | 'muted' | 'emerald' | 'amber' | 'cyan' | 'rose';

interface HubField {
  label: string;
  value: string;
  tone?: FieldTone;
}

interface HubItem {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  badge: string;
  badgeTone: 'emerald' | 'amber' | 'cyan' | 'slate' | 'rose';
  fields: HubField[];
  columns: string[];
  rows: string[][];
  body?: string;
  tags?: string[];
}

interface HubServiceDef {
  id: HubServiceId;
  labelEn: string;
  labelAr: string;
  icon: React.ElementType;
  color: string;
  scope: string;
  syncEn: string;
  syncAr: string;
  actionEn: string;
  actionAr: string;
  emptyEn: string;
  emptyAr: string;
}

const HUB_SERVICES: HubServiceDef[] = [
  {
    id: 'sheets',
    labelEn: 'Google Sheets',
    labelAr: 'جداول البيانات',
    icon: FileSpreadsheet,
    color: 'text-emerald-400',
    scope: 'spreadsheets.readonly',
    syncEn: 'Fixture set — 3 spreadsheets, loaded with the app bundle',
    syncAr: 'بيانات محاكاة — 3 جداول، تم تحميلها مع حزمة التطبيق',
    actionEn: 'New Spreadsheet',
    actionAr: 'إنشاء جدول جديد',
    emptyEn: 'No spreadsheets in this fixture set.',
    emptyAr: 'لا توجد جداول في بيانات المحاكاة.',
  },
  {
    id: 'gmail',
    labelEn: 'Gmail',
    labelAr: 'البريد الإلكتروني',
    icon: Mail,
    color: 'text-rose-400',
    scope: 'gmail.readonly',
    syncEn: 'Fixture set — 4 messages, no mailbox attached',
    syncAr: 'بيانات محاكاة — 4 رسائل، بدون صندوق بريد مرتبط',
    actionEn: 'Compose Draft',
    actionAr: 'إنشاء مسودة',
    emptyEn: 'No messages in this fixture set.',
    emptyAr: 'لا توجد رسائل في بيانات المحاكاة.',
  },
  {
    id: 'tasks',
    labelEn: 'Google Tasks',
    labelAr: 'المهام',
    icon: CheckSquare,
    color: 'text-blue-400',
    scope: 'tasks.readonly',
    syncEn: 'Fixture set — 4 tasks, 1 already closed',
    syncAr: 'بيانات محاكاة — 4 مهام، منها 1 مُنجزة',
    actionEn: 'Add Task',
    actionAr: 'إضافة مهمة',
    emptyEn: 'No tasks in this fixture set.',
    emptyAr: 'لا توجد مهام في بيانات المحاكاة.',
  },
  {
    id: 'forms',
    labelEn: 'Google Forms',
    labelAr: 'النماذج',
    icon: FileQuestion,
    color: 'text-purple-400',
    scope: 'forms.readonly',
    syncEn: 'Fixture set — 3 forms, synthetic response counts',
    syncAr: 'بيانات محاكاة — 3 نماذج، أعداد إجابات اصطناعية',
    actionEn: 'New Survey Form',
    actionAr: 'نموذج استبيان جديد',
    emptyEn: 'No forms in this fixture set.',
    emptyAr: 'لا توجد نماذج في بيانات المحاكاة.',
  },
  {
    id: 'contacts',
    labelEn: 'Contacts',
    labelAr: 'جهات الاتصال',
    icon: Users,
    color: 'text-cyan-400',
    scope: 'contacts.readonly',
    syncEn: 'Fixture set — 4 directory entries',
    syncAr: 'بيانات محاكاة — 4 سجلات في الدليل',
    actionEn: 'Sync Address Book',
    actionAr: 'مزامنة دفتر العناوين',
    emptyEn: 'No contacts in this fixture set.',
    emptyAr: 'لا توجد جهات اتصال في بيانات المحاكاة.',
  },
  {
    id: 'calendar',
    labelEn: 'Google Calendar',
    labelAr: 'التقويم',
    icon: Calendar,
    color: 'text-amber-400',
    scope: 'calendar.readonly',
    syncEn: 'Fixture set — 4 agenda entries across 2 days',
    syncAr: 'بيانات محاكاة — 4 مواعيد عبر يومين',
    actionEn: 'Schedule Event',
    actionAr: 'جدولة حدث',
    emptyEn: 'No events in this fixture set.',
    emptyAr: 'لا توجد أحداث في بيانات المحاكاة.',
  },
  {
    id: 'picker',
    labelEn: 'Google Picker',
    labelAr: 'محدد الملفات',
    icon: FolderOpen,
    color: 'text-indigo-400',
    scope: 'picker.googleapis.com (JS API)',
    syncEn: 'No Drive attached — selection list is a local mock',
    syncAr: 'لا يوجد Drive مرتبط — قائمة الاختيار نموذج محلي',
    actionEn: 'Launch Drive Picker',
    actionAr: 'تشغيل محدد Drive',
    emptyEn: 'No selectable resources in this fixture set.',
    emptyAr: 'لا توجد موارد قابلة للاختيار في بيانات المحاكاة.',
  },
  {
    id: 'slides',
    labelEn: 'Google Slides',
    labelAr: 'العروض التقديمية',
    icon: Presentation,
    color: 'text-orange-400',
    scope: 'presentations.readonly',
    syncEn: 'Fixture set — 2 decks with slide outlines',
    syncAr: 'بيانات محاكاة — عرضان تقديميان مع مخططات الشرائح',
    actionEn: 'New Presentation Deck',
    actionAr: 'عرض تقديمي جديد',
    emptyEn: 'No decks in this fixture set.',
    emptyAr: 'لا توجد عروض في بيانات المحاكاة.',
  },
  {
    id: 'chat',
    labelEn: 'Google Chat',
    labelAr: 'المحادثات',
    icon: MessageSquare,
    color: 'text-teal-400',
    scope: 'chat.messages.readonly',
    syncEn: 'Fixture set — 3 spaces with sample messages',
    syncAr: 'بيانات محاكاة — 3 مساحات مع رسائل نموذجية',
    actionEn: 'Send Chat Notification',
    actionAr: 'إرسال إشعار محادثة',
    emptyEn: 'No spaces in this fixture set.',
    emptyAr: 'لا توجد مساحات في بيانات المحاكاة.',
  },
  {
    id: 'classroom',
    labelEn: 'Google Classroom',
    labelAr: 'الفصول الدراسية',
    icon: GraduationCap,
    color: 'text-sky-400',
    scope: 'classroom.courses.readonly',
    syncEn: 'Fixture set — 2 courses with assignment outlines',
    syncAr: 'بيانات محاكاة — مقرران مع مخططات الواجبات',
    actionEn: 'Sync Courses',
    actionAr: 'مزامنة المقررات',
    emptyEn: 'No courses in this fixture set.',
    emptyAr: 'لا توجد مقررات في بيانات المحاكاة.',
  },
];

/* ------------------------------------------------------------------ fixtures */

const BASE_ITEMS: Record<HubServiceId, HubItem[]> = {
  sheets: [
    {
      id: 'sheet-1',
      title: 'System Cleanup Audit Q3',
      subtitle: 'Cleanup ledger — reclaimable size per category',
      meta: '142 rows • 2 hours ago',
      badge: 'Editable',
      badgeTone: 'emerald',
      fields: [
        { label: 'Owner', value: 'KNOuX Guard', tone: 'default' },
        { label: 'Tabs', value: '6', tone: 'muted' },
        { label: 'Last written', value: 'Fixture snapshot', tone: 'muted' },
        { label: 'Sync state', value: 'Sandbox fixture', tone: 'amber' },
      ],
      columns: ['Row', 'Asset', 'Category', 'Owner', 'State'],
      rows: [
        ['01', 'Windows Update cache', 'System cache', 'KNOuX Guard', 'Flagged'],
        ['02', 'Temp render files', 'User temp', 'Automation', 'Flagged'],
        ['03', 'Crash dumps', 'Diagnostics', 'KNOuX Guard', 'Flagged'],
        ['04', 'Package cache', 'System cache', 'Automation', 'Reported'],
      ],
    },
    {
      id: 'sheet-2',
      title: 'Startup Apps Inventory',
      subtitle: 'Launch items with impact notes',
      meta: '58 rows • Yesterday',
      badge: 'Editable',
      badgeTone: 'emerald',
      fields: [
        { label: 'Owner', value: 'System Administrator', tone: 'default' },
        { label: 'Tabs', value: '4', tone: 'muted' },
        { label: 'Last written', value: 'Fixture snapshot', tone: 'muted' },
        { label: 'Sync state', value: 'Sandbox fixture', tone: 'amber' },
      ],
      columns: ['Row', 'Entry', 'Type', 'Impact', 'State'],
      rows: [
        ['01', 'KNOuX SmartOrganizer', 'Native app', 'Low', 'Tracked'],
        ['02', 'Chromium Updater', 'Updater', 'Medium', 'Tracked'],
        ['03', 'Audio Console Host', 'Service', 'Low', 'Reported'],
        ['04', 'Print Spooler', 'Service', 'Low', 'Reported'],
      ],
    },
    {
      id: 'sheet-3',
      title: 'Storage Allocation Matrix',
      subtitle: 'Volume usage split by consumer',
      meta: '210 rows • 3 days ago',
      badge: 'Editable',
      badgeTone: 'emerald',
      fields: [
        { label: 'Owner', value: 'KNOuX Guard', tone: 'default' },
        { label: 'Tabs', value: '5', tone: 'muted' },
        { label: 'Last written', value: 'Fixture snapshot', tone: 'muted' },
        { label: 'Sync state', value: 'Sandbox fixture', tone: 'amber' },
      ],
      columns: ['Row', 'Volume', 'Consumer', 'Share', 'State'],
      rows: [
        ['01', 'C:', 'Applications', '41%', 'Reported'],
        ['02', 'C:', 'User data', '28%', 'Reported'],
        ['03', 'D:', 'Archives', '63%', 'Reported'],
        ['04', 'D:', 'Backups', '22%', 'Flagged'],
      ],
    },
  ],
  gmail: [
    {
      id: 'mail-1',
      title: 'Automated Smart Scan Complete',
      subtitle: 'KNOuX Guard',
      meta: '10:14 AM',
      badge: 'Unread',
      badgeTone: 'cyan',
      fields: [
        { label: 'From', value: 'KNOuX Guard', tone: 'default' },
        { label: 'To', value: 'local.user@knoux.sys', tone: 'muted' },
        { label: 'Attachments', value: '1 (audit-summary.txt)', tone: 'muted' },
        { label: 'Delivery', value: 'Fixture only — no mail sent', tone: 'amber' },
      ],
      columns: ['Line', 'Section', 'Value'],
      rows: [
        ['01', 'Scope', 'Documents folder'],
        ['02', 'Items inspected', '1,284'],
        ['03', 'Candidates flagged', '37'],
        ['04', 'Applied changes', '0 (preview only)'],
      ],
      body:
        'The scheduled Smart Scan finished and produced a candidate list for review. Nothing was moved, renamed, or deleted — this message is a design fixture that describes what the native scan would report once the bridge is connected.',
      tags: ['smart-scan', 'audit', 'preview'],
    },
    {
      id: 'mail-2',
      title: 'Windows Service Patch Scheduled',
      subtitle: 'System Administrator',
      meta: 'Yesterday',
      badge: 'Read',
      badgeTone: 'slate',
      fields: [
        { label: 'From', value: 'System Administrator', tone: 'default' },
        { label: 'To', value: 'local.user@knoux.sys', tone: 'muted' },
        { label: 'Attachments', value: '0', tone: 'muted' },
        { label: 'Delivery', value: 'Fixture only — no mail sent', tone: 'amber' },
      ],
      columns: ['Line', 'Section', 'Value'],
      rows: [
        ['01', 'Window', '02:00 — 04:00'],
        ['02', 'Services affected', '3'],
        ['03', 'Reboot', 'Required'],
        ['04', 'Rollback plan', 'Restore point'],
      ],
      body:
        'A maintenance window is described for three services. This entry is a static fixture used to design the notification surface; it does not schedule or apply any patch.',
      tags: ['maintenance', 'services'],
    },
    {
      id: 'mail-3',
      title: 'Backup Verification Report',
      subtitle: 'KNOuX Guard',
      meta: '2 days ago',
      badge: 'Read',
      badgeTone: 'slate',
      fields: [
        { label: 'From', value: 'KNOuX Guard', tone: 'default' },
        { label: 'To', value: 'local.user@knoux.sys', tone: 'muted' },
        { label: 'Attachments', value: '0', tone: 'muted' },
        { label: 'Delivery', value: 'Fixture only — no mail sent', tone: 'amber' },
      ],
      columns: ['Line', 'Section', 'Value'],
      rows: [
        ['01', 'Volumes checked', '2'],
        ['02', 'Integrity', 'Nominal'],
        ['03', 'Restore point', 'Latest'],
        ['04', 'Applied changes', '0 (preview only)'],
      ],
      body:
        'A nominal backup verification summary. No volume was read and no archive was written while producing this entry.',
      tags: ['backup'],
    },
    {
      id: 'mail-4',
      title: 'Weekly Digest — Automations',
      subtitle: 'KNOuX Guard',
      meta: '3 days ago',
      badge: 'Read',
      badgeTone: 'slate',
      fields: [
        { label: 'From', value: 'KNOuX Guard', tone: 'default' },
        { label: 'To', value: 'local.user@knoux.sys', tone: 'muted' },
        { label: 'Attachments', value: '0', tone: 'muted' },
        { label: 'Delivery', value: 'Fixture only — no mail sent', tone: 'amber' },
      ],
      columns: ['Line', 'Section', 'Value'],
      rows: [
        ['01', 'Flows configured', '4'],
        ['02', 'Runs simulated', '11'],
        ['03', 'Approvals pending', '2'],
        ['04', 'Applied changes', '0 (preview only)'],
      ],
      body:
        'A weekly roll-up of the automation flows shown in Flow Studio. Every figure is a static fixture value.',
      tags: ['automation', 'digest'],
    },
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Review C: Drive Disk Cleanup',
      subtitle: 'Cleanup workspace — candidate list review',
      meta: 'Completed',
      badge: 'Completed',
      badgeTone: 'emerald',
      fields: [
        { label: 'Assigned to', value: 'local.user@knoux.sys', tone: 'muted' },
        { label: 'Priority', value: 'Normal', tone: 'default' },
        { label: 'Due', value: 'Today', tone: 'amber' },
        { label: 'State source', value: 'Local fixture', tone: 'amber' },
      ],
      columns: ['Subtask', 'Owner', 'Due', 'State'],
      rows: [
        ['Review temp candidates', 'local.user', 'Today', 'Done'],
        ['Confirm archive target', 'local.user', 'Today', 'Done'],
        ['Approve quarantine set', 'local.user', 'Tomorrow', 'Pending'],
      ],
    },
    {
      id: 'task-2',
      title: 'Verify Startup Item Delay Profiles',
      subtitle: 'Startup workspace — launch delay review',
      meta: 'Pending',
      badge: 'Pending',
      badgeTone: 'cyan',
      fields: [
        { label: 'Assigned to', value: 'local.user@knoux.sys', tone: 'muted' },
        { label: 'Priority', value: 'High', tone: 'amber' },
        { label: 'Due', value: 'Friday', tone: 'amber' },
        { label: 'State source', value: 'Local fixture', tone: 'amber' },
      ],
      columns: ['Subtask', 'Owner', 'Due', 'State'],
      rows: [
        ['Profile heavy launchers', 'local.user', 'Thursday', 'Pending'],
        ['Stage delay change', 'local.user', 'Friday', 'Pending'],
        ['Re-measure boot impact', 'local.user', 'Friday', 'Pending'],
      ],
    },
    {
      id: 'task-3',
      title: 'Export Audit Summary PDF',
      subtitle: 'Reports workspace — shareable summary',
      meta: 'Pending',
      badge: 'Pending',
      badgeTone: 'cyan',
      fields: [
        { label: 'Assigned to', value: 'local.user@knoux.sys', tone: 'muted' },
        { label: 'Priority', value: 'Normal', tone: 'default' },
        { label: 'Due', value: 'Next week', tone: 'muted' },
        { label: 'State source', value: 'Local fixture', tone: 'amber' },
      ],
      columns: ['Subtask', 'Owner', 'Due', 'State'],
      rows: [
        ['Collect session ledger', 'local.user', 'Next week', 'Pending'],
        ['Render summary', 'local.user', 'Next week', 'Pending'],
        ['Share with reviewer', 'local.user', 'Next week', 'Pending'],
      ],
    },
    {
      id: 'task-4',
      title: 'Validate Network Topology Snapshot',
      subtitle: 'System workspace — adapter inventory review',
      meta: 'Pending',
      badge: 'Pending',
      badgeTone: 'cyan',
      fields: [
        { label: 'Assigned to', value: 'local.user@knoux.sys', tone: 'muted' },
        { label: 'Priority', value: 'Low', tone: 'muted' },
        { label: 'Due', value: 'Next week', tone: 'muted' },
        { label: 'State source', value: 'Local fixture', tone: 'amber' },
      ],
      columns: ['Subtask', 'Owner', 'Due', 'State'],
      rows: [
        ['Compare adapter list', 'local.user', 'Next week', 'Pending'],
        ['Archive snapshot', 'local.user', 'Next week', 'Pending'],
      ],
    },
  ],
  forms: [
    {
      id: 'form-1',
      title: 'System Performance Feedback Form',
      subtitle: 'Periodic health questionnaire',
      meta: '24 responses',
      badge: 'Accepting',
      badgeTone: 'emerald',
      fields: [
        { label: 'Questions', value: '9', tone: 'muted' },
        { label: 'Response type', value: 'Synthetic', tone: 'amber' },
        { label: 'Owner', value: 'KNOuX Guard', tone: 'default' },
        { label: 'Sync state', value: 'Sandbox fixture', tone: 'amber' },
      ],
      columns: ['#', 'Question', 'Type', 'Answers'],
      rows: [
        ['01', 'How would you rate scan speed?', 'Rating', '24'],
        ['02', 'Which module is hardest to use?', 'Choice', '21'],
        ['03', 'Did the cleanup preview match reality?', 'Choice', '19'],
        ['04', 'Additional notes', 'Paragraph', '7'],
      ],
    },
    {
      id: 'form-2',
      title: 'Software License Audit Survey',
      subtitle: 'Per-application license inventory',
      meta: '12 responses',
      badge: 'Closed',
      badgeTone: 'slate',
      fields: [
        { label: 'Questions', value: '6', tone: 'muted' },
        { label: 'Response type', value: 'Synthetic', tone: 'amber' },
        { label: 'Owner', value: 'System Administrator', tone: 'default' },
        { label: 'Sync state', value: 'Sandbox fixture', tone: 'amber' },
      ],
      columns: ['#', 'Question', 'Type', 'Answers'],
      rows: [
        ['01', 'Application name', 'Short text', '12'],
        ['02', 'License type', 'Choice', '12'],
        ['03', 'Renewal date', 'Date', '11'],
        ['04', 'Notes', 'Paragraph', '3'],
      ],
    },
    {
      id: 'form-3',
      title: 'Automation Flow Usability Survey',
      subtitle: 'Flow Studio feedback loop',
      meta: '8 responses',
      badge: 'Draft',
      badgeTone: 'amber',
      fields: [
        { label: 'Questions', value: '5', tone: 'muted' },
        { label: 'Response type', value: 'Synthetic', tone: 'amber' },
        { label: 'Owner', value: 'KNOuX Guard', tone: 'default' },
        { label: 'Sync state', value: 'Sandbox fixture', tone: 'amber' },
      ],
      columns: ['#', 'Question', 'Type', 'Answers'],
      rows: [
        ['01', 'Which flow do you use most?', 'Choice', '8'],
        ['02', 'Is the approval gate clear?', 'Rating', '8'],
        ['03', 'Suggested templates', 'Paragraph', '2'],
      ],
    },
  ],
  contacts: [
    {
      id: 'contact-1',
      title: 'System Admin Support',
      subtitle: 'admin@knoux.sys',
      meta: 'Operations',
      badge: 'Directory',
      badgeTone: 'slate',
      fields: [
        { label: 'Email', value: 'admin@knoux.sys', tone: 'cyan' },
        { label: 'Team', value: 'Operations', tone: 'default' },
        { label: 'Source', value: 'Local fixture', tone: 'amber' },
      ],
      columns: ['Label', 'Value'],
      rows: [
        ['Role', 'Windows administration'],
        ['Timezone', 'Local machine time'],
        ['Linked list', 'Operations handbook'],
      ],
    },
    {
      id: 'contact-2',
      title: 'Security Operations',
      subtitle: 'security@knoux.sys',
      meta: 'Security',
      badge: 'Directory',
      badgeTone: 'slate',
      fields: [
        { label: 'Email', value: 'security@knoux.sys', tone: 'cyan' },
        { label: 'Team', value: 'Security', tone: 'default' },
        { label: 'Source', value: 'Local fixture', tone: 'amber' },
      ],
      columns: ['Label', 'Value'],
      rows: [
        ['Role', 'Policy and audit review'],
        ['Escalation', 'Phase Two native bridge'],
        ['Linked list', 'Security handbook'],
      ],
    },
    {
      id: 'contact-3',
      title: 'Storage Review Board',
      subtitle: 'storage-board@knoux.sys',
      meta: 'Review',
      badge: 'Directory',
      badgeTone: 'slate',
      fields: [
        { label: 'Email', value: 'storage-board@knoux.sys', tone: 'cyan' },
        { label: 'Team', value: 'Review', tone: 'default' },
        { label: 'Source', value: 'Local fixture', tone: 'amber' },
      ],
      columns: ['Label', 'Value'],
      rows: [
        ['Role', 'Allocation approvals'],
        ['Cadence', 'Weekly'],
        ['Linked list', 'Storage matrix sheet'],
      ],
    },
    {
      id: 'contact-4',
      title: 'Automation Owner',
      subtitle: 'flows-owner@knoux.sys',
      meta: 'Automation',
      badge: 'Directory',
      badgeTone: 'slate',
      fields: [
        { label: 'Email', value: 'flows-owner@knoux.sys', tone: 'cyan' },
        { label: 'Team', value: 'Automation', tone: 'default' },
        { label: 'Source', value: 'Local fixture', tone: 'amber' },
      ],
      columns: ['Label', 'Value'],
      rows: [
        ['Role', 'Flow Studio maintainer'],
        ['Approval', 'Required for staged changes'],
        ['Linked list', 'Workflow catalog'],
      ],
    },
  ],
  calendar: [
    {
      id: 'event-1',
      title: 'Weekly Deep System Maintenance',
      subtitle: 'Recurring — system workspace',
      meta: 'Tomorrow, 02:00 AM',
      badge: 'Scheduled',
      badgeTone: 'emerald',
      fields: [
        { label: 'Starts', value: '02:00 (fixture clock)', tone: 'default' },
        { label: 'Duration', value: '2 h', tone: 'muted' },
        { label: 'Attendees', value: '3 fixture guests', tone: 'muted' },
        { label: 'Action taken', value: 'None — preview only', tone: 'amber' },
      ],
      columns: ['Time', 'Event', 'Calendar', 'Guests'],
      rows: [
        ['02:00', 'Deep System Maintenance', 'Operations', '3'],
        ['02:30', 'Component store sweep', 'Operations', '2'],
        ['03:15', 'Cache verification', 'Operations', '1'],
        ['03:45', 'Log rotation', 'Operations', '1'],
      ],
    },
    {
      id: 'event-2',
      title: 'Automated Backup Verification',
      subtitle: 'Recurring — storage workspace',
      meta: 'Friday, 04:00 AM',
      badge: 'Scheduled',
      badgeTone: 'emerald',
      fields: [
        { label: 'Starts', value: '04:00 (fixture clock)', tone: 'default' },
        { label: 'Duration', value: '1 h', tone: 'muted' },
        { label: 'Attendees', value: '2 fixture guests', tone: 'muted' },
        { label: 'Action taken', value: 'None — preview only', tone: 'amber' },
      ],
      columns: ['Time', 'Event', 'Calendar', 'Guests'],
      rows: [
        ['04:00', 'Backup Verification', 'Storage', '2'],
        ['04:20', 'Restore point audit', 'Storage', '1'],
        ['04:40', 'Archive checksum pass', 'Storage', '1'],
      ],
    },
    {
      id: 'event-3',
      title: 'Storage Board Review',
      subtitle: 'One-off — storage workspace',
      meta: 'Monday, 11:00 AM',
      badge: 'Tentative',
      badgeTone: 'amber',
      fields: [
        { label: 'Starts', value: '11:00 (fixture clock)', tone: 'default' },
        { label: 'Duration', value: '45 min', tone: 'muted' },
        { label: 'Attendees', value: '4 fixture guests', tone: 'muted' },
        { label: 'Action taken', value: 'None — preview only', tone: 'amber' },
      ],
      columns: ['Time', 'Event', 'Calendar', 'Guests'],
      rows: [
        ['11:00', 'Storage Board Review', 'Review', '4'],
        ['11:30', 'Allocation proposals', 'Review', '3'],
      ],
    },
    {
      id: 'event-4',
      title: 'Automation Sync Planning',
      subtitle: 'One-off — automation workspace',
      meta: 'Tuesday, 09:30 AM',
      badge: 'Tentative',
      badgeTone: 'amber',
      fields: [
        { label: 'Starts', value: '09:30 (fixture clock)', tone: 'default' },
        { label: 'Duration', value: '30 min', tone: 'muted' },
        { label: 'Attendees', value: '2 fixture guests', tone: 'muted' },
        { label: 'Action taken', value: 'None — preview only', tone: 'amber' },
      ],
      columns: ['Time', 'Event', 'Calendar', 'Guests'],
      rows: [
        ['09:30', 'Automation Sync Planning', 'Automation', '2'],
        ['10:00', 'Template backlog', 'Automation', '1'],
      ],
    },
  ],
  picker: [
    {
      id: 'pick-1',
      title: 'Documents',
      subtitle: 'Local mock of a Drive folder selection',
      meta: 'Folder',
      badge: 'Mock',
      badgeTone: 'amber',
      fields: [
        { label: 'Resource id', value: 'fixture-folder-documents', tone: 'cyan' },
        { label: 'Mime type', value: 'application/vnd.google-apps.folder', tone: 'muted' },
        { label: 'Owner', value: 'Local fixture', tone: 'default' },
        { label: 'Drive attached', value: 'No', tone: 'rose' },
      ],
      columns: ['Name', 'Type', 'Owner', 'Modified'],
      rows: [
        ['Audit Exports', 'Folder', 'local.user', 'Today'],
        ['Flow Templates', 'Folder', 'local.user', 'Yesterday'],
        ['Screenshot Set', 'Folder', 'local.user', '3 days ago'],
      ],
    },
    {
      id: 'pick-2',
      title: 'Cleanup Reports (Q3)',
      subtitle: 'Local mock of a Drive file selection',
      meta: 'File',
      badge: 'Mock',
      badgeTone: 'amber',
      fields: [
        { label: 'Resource id', value: 'fixture-file-cleanup-q3', tone: 'cyan' },
        { label: 'Mime type', value: 'application/vnd.google-apps.spreadsheet', tone: 'muted' },
        { label: 'Owner', value: 'Local fixture', tone: 'default' },
        { label: 'Drive attached', value: 'No', tone: 'rose' },
      ],
      columns: ['Name', 'Type', 'Owner', 'Modified'],
      rows: [
        ['Cleanup Audit Q3', 'Sheet', 'local.user', 'Today'],
        ['Startup Inventory', 'Sheet', 'local.user', 'Yesterday'],
        ['Storage Matrix', 'Sheet', 'local.user', '3 days ago'],
      ],
    },
    {
      id: 'pick-3',
      title: 'Weekly Backup Manifest',
      subtitle: 'Local mock of a Drive file selection',
      meta: 'File',
      badge: 'Mock',
      badgeTone: 'amber',
      fields: [
        { label: 'Resource id', value: 'fixture-file-backup-manifest', tone: 'cyan' },
        { label: 'Mime type', value: 'text/plain', tone: 'muted' },
        { label: 'Owner', value: 'Local fixture', tone: 'default' },
        { label: 'Drive attached', value: 'No', tone: 'rose' },
      ],
      columns: ['Name', 'Type', 'Owner', 'Modified'],
      rows: [
        ['backup-manifest.txt', 'Text', 'local.user', 'Today'],
        ['restore-checkpoint.txt', 'Text', 'local.user', '2 days ago'],
      ],
    },
  ],
  slides: [
    {
      id: 'deck-1',
      title: 'Q3 KNOuX Architecture & Performance Deck',
      subtitle: '18 slides — outline fixture',
      meta: '18 slides',
      badge: 'Outline',
      badgeTone: 'emerald',
      fields: [
        { label: 'Slides', value: '18', tone: 'muted' },
        { label: 'Layout', value: 'Mixed', tone: 'default' },
        { label: 'Owner', value: 'KNOuX Guard', tone: 'default' },
        { label: 'Sync state', value: 'Sandbox fixture', tone: 'amber' },
      ],
      columns: ['#', 'Slide title', 'Layout', 'Notes'],
      rows: [
        ['01', 'Cover', 'Title', 'Fixture outline'],
        ['02', 'Module map', 'Title + body', 'Fixture outline'],
        ['03', 'Live pulse metrics', 'Two column', 'Fixture outline'],
        ['04', 'Cleanup pipeline', 'Diagram', 'Fixture outline'],
      ],
    },
    {
      id: 'deck-2',
      title: 'Smart Organization Overview',
      subtitle: '10 slides — outline fixture',
      meta: '10 slides',
      badge: 'Outline',
      badgeTone: 'emerald',
      fields: [
        { label: 'Slides', value: '10', tone: 'muted' },
        { label: 'Layout', value: 'Mixed', tone: 'default' },
        { label: 'Owner', value: 'KNOuX Guard', tone: 'default' },
        { label: 'Sync state', value: 'Sandbox fixture', tone: 'amber' },
      ],
      columns: ['#', 'Slide title', 'Layout', 'Notes'],
      rows: [
        ['01', 'Cover', 'Title', 'Fixture outline'],
        ['02', 'Smart scan flow', 'Diagram', 'Fixture outline'],
        ['03', 'Safety model', 'Two column', 'Fixture outline'],
        ['04', 'Next steps', 'Title + body', 'Fixture outline'],
      ],
    },
  ],
  chat: [
    {
      id: 'space-1',
      title: '#system-ops-alerts',
      subtitle: '3 unread fixture messages',
      meta: '3 unread',
      badge: 'Unread',
      badgeTone: 'cyan',
      fields: [
        { label: 'Members', value: '12 fixture members', tone: 'muted' },
        { label: 'Topic', value: 'System operations', tone: 'default' },
        { label: 'Delivery', value: 'Fixture only — no chat sent', tone: 'amber' },
      ],
      columns: ['Sender', 'Message', 'Time'],
      rows: [
        ['KNOuX Guard', 'Smart Scan preview finished — 37 candidates', '10:14 AM'],
        ['Automation', 'Flow draft staged for review', '09:52 AM'],
        ['System Administrator', 'Maintenance window confirmed', 'Yesterday'],
      ],
    },
    {
      id: 'space-2',
      title: '#automation-pipelines',
      subtitle: 'No unread fixture messages',
      meta: '0 unread',
      badge: 'Quiet',
      badgeTone: 'slate',
      fields: [
        { label: 'Members', value: '8 fixture members', tone: 'muted' },
        { label: 'Topic', value: 'Automation pipelines', tone: 'default' },
        { label: 'Delivery', value: 'Fixture only — no chat sent', tone: 'amber' },
      ],
      columns: ['Sender', 'Message', 'Time'],
      rows: [
        ['Automation', 'Nightly flow draft ready', '08:30 AM'],
        ['KNOuX Guard', 'Retention policy preview updated', 'Yesterday'],
      ],
    },
    {
      id: 'space-3',
      title: '#cleanup-review',
      subtitle: '1 unread fixture message',
      meta: '1 unread',
      badge: 'Unread',
      badgeTone: 'cyan',
      fields: [
        { label: 'Members', value: '6 fixture members', tone: 'muted' },
        { label: 'Topic', value: 'Cleanup approvals', tone: 'default' },
        { label: 'Delivery', value: 'Fixture only — no chat sent', tone: 'amber' },
      ],
      columns: ['Sender', 'Message', 'Time'],
      rows: [
        ['local.user', 'Approved quarantine preview set A', '11:05 AM'],
        ['KNOuX Guard', 'Candidate list refreshed', '10:20 AM'],
      ],
    },
  ],
  classroom: [
    {
      id: 'course-1',
      title: 'Advanced Windows System Administration',
      subtitle: '142 students enrolled (fixture)',
      meta: '142 students',
      badge: 'Active',
      badgeTone: 'emerald',
      fields: [
        { label: 'Assignments', value: '4', tone: 'muted' },
        { label: 'Owner', value: 'System Administrator', tone: 'default' },
        { label: 'Submissions', value: 'Synthetic counts', tone: 'amber' },
        { label: 'Sync state', value: 'Sandbox fixture', tone: 'amber' },
      ],
      columns: ['Assignment', 'Due', 'Submitted', 'Graded'],
      rows: [
        ['Component store audit', 'Week 2', '131', '118'],
        ['Service dependency map', 'Week 3', '124', '96'],
        ['Cleanup safety review', 'Week 4', '118', '64'],
        ['Backup restore drill', 'Week 5', '102', '31'],
      ],
    },
    {
      id: 'course-2',
      title: 'Automated Scripting & Diagnostics',
      subtitle: '85 students enrolled (fixture)',
      meta: '85 students',
      badge: 'Active',
      badgeTone: 'emerald',
      fields: [
        { label: 'Assignments', value: '3', tone: 'muted' },
        { label: 'Owner', value: 'KNOuX Guard', tone: 'default' },
        { label: 'Submissions', value: 'Synthetic counts', tone: 'amber' },
        { label: 'Sync state', value: 'Sandbox fixture', tone: 'amber' },
      ],
      columns: ['Assignment', 'Due', 'Submitted', 'Graded'],
      rows: [
        ['Read-only scan patterns', 'Week 1', '81', '74'],
        ['Staged-change approvals', 'Week 2', '77', '58'],
        ['Native bridge rollout', 'Week 3', '69', '40'],
      ],
    },
  ],
};

const TONE_BADGE: Record<HubItem['badgeTone'], string> = {
  emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
  amber: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
  cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40',
  slate: 'bg-slate-800/70 text-slate-300 border-slate-700',
  rose: 'bg-rose-950/60 text-rose-300 border-rose-500/40',
};

const TONE_FIELD: Record<FieldTone, string> = {
  default: 'text-slate-100',
  muted: 'text-slate-400',
  emerald: 'text-emerald-300',
  amber: 'text-amber-300',
  cyan: 'text-cyan-300',
  rose: 'text-rose-300',
};

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({ locale = 'en' }) => {
  const { navigateTo, locale: navLocale, isArabic, toggleLocale } = useNavigation();
  const isAr = navLocale ? isArabic : locale === 'ar';
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeService, setActiveService] = useState<HubServiceId>('sheets');
  const [selectedItemId, setSelectedItemId] = useState<string>('sheet-1');
  const [newInput, setNewInput] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Local fixture additions — the only write this hub performs, and it never
  // leaves the browser.
  const [localAdditions, setLocalAdditions] = useState<Record<HubServiceId, HubItem[]>>({
    sheets: [],
    gmail: [],
    tasks: [],
    forms: [],
    contacts: [],
    calendar: [],
    picker: [],
    slides: [],
    chat: [],
    classroom: [],
  });

  const activeDef = useMemo(
    () => HUB_SERVICES.find((s) => s.id === activeService) ?? HUB_SERVICES[0],
    [activeService]
  );

  const allItems = useMemo(() => {
    const base = BASE_ITEMS[activeService] ?? [];
    const additions = localAdditions[activeService] ?? [];
    const query = searchQuery.trim().toLowerCase();
    const merged = [...additions, ...base];
    if (!query) return merged;
    return merged.filter((item) =>
      `${item.title} ${item.subtitle} ${item.meta}`.toLowerCase().includes(query)
    );
  }, [activeService, localAdditions, searchQuery]);

  const selectedItem = useMemo(() => {
    const items = allItems;
    if (!items.length) return null;
    return items.find((i) => i.id === selectedItemId) ?? items[0];
  }, [allItems, selectedItemId]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAction = (serviceName: string) => {
    showToast(
      isAr
        ? `[محاكاة تجريبية] تم تنفيذ إجراء "${serviceName}". يتطلب التنفيذ الحي اعتماد Google OAuth.`
        : `[Sandbox Preview] Action "${serviceName}" simulated. Live Google API execution requires OAuth token authorization.`
    );
  };

  const handleAddLocalItem = () => {
    const title = newInput.trim();
    if (!title) return;
    const id = `local-${activeService}-${Date.now().toString(36)}`;
    const created: HubItem = {
      id,
      title,
      subtitle: isAr ? 'عنصر محلي أُضيف داخل المتصفح' : 'Local item added inside the browser',
      meta: isAr ? 'الآن' : 'Just now',
      badge: isAr ? 'محلي' : 'Local',
      badgeTone: 'cyan',
      fields: [
        { label: isAr ? 'المصدر' : 'Source', value: isAr ? 'إضافة محلية' : 'Local addition', tone: 'cyan' },
        {
          label: isAr ? 'الحالة' : 'State',
          value: isAr ? 'غير مرتبط بخدمة Google' : 'Not linked to a Google service',
          tone: 'amber',
        },
      ],
      columns: ['#', isAr ? 'العنصر' : 'Item', isAr ? 'الحالة' : 'State'],
      rows: [['01', title, isAr ? 'مسودة محلية' : 'Local draft']],
    };
    setLocalAdditions((prev) => ({
      ...prev,
      [activeService]: [created, ...(prev[activeService] ?? [])],
    }));
    setSelectedItemId(id);
    setNewInput('');
    showToast(
      isAr
        ? `تمت إضافة "${title}" إلى بيانات المحاكاة المحلية فقط.`
        : `"${title}" added to the local fixture set only — nothing was sent to Google.`
    );
  };

  const handleCopyId = () => {
    if (!selectedItem) return;
    const payload = `${selectedItem.title} (${selectedItem.id})`;
    const failMessage = isAr
      ? 'الحافظة غير متاحة — انسخ المعرّف يدويًا.'
      : 'Clipboard unavailable — copy the id manually.';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(payload).then(
        () => {
          setCopiedId(true);
          setTimeout(() => setCopiedId(false), 2000);
        },
        () => showToast(failMessage)
      );
    } else {
      showToast(failMessage);
    }
  };

  const ActiveIcon = activeDef.icon;

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="w-screen h-screen flex flex-col bg-[#050a15] text-slate-100 overflow-hidden font-sans select-none relative">
      <KNOuXTitleBar
        sectionName={isAr ? "خدمات Google" : "Google Workspace"}
        sectionSubtitle={isAr ? "مركز التكامل السحابي" : "Cloud Integration Hub"}
        onNavigateHome={() => navigateTo('home')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isArabic={isAr}
        onToggleArabic={toggleLocale}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-12 right-6 z-50 px-4 py-2.5 rounded-xl bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs shadow-2xl flex items-center gap-2 animate-fade-in backdrop-blur-md">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <KNOuXSidebar
          activeSection="workspace"
          onNavigate={(sec) => navigateTo(sec)}
          isArabic={isAr}
        />

        <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#050c1b] via-[#050a15] to-[#030710] p-4 gap-4 text-slate-100 select-none">

      {/* Top Header & Connection Bar */}
      <section className="rounded-xl bg-[#071328] border border-[#1b3f70] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.7)] border border-cyan-400/40 shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">
                {isAr ? 'مركز ربط Google Workspace' : 'Google Workspace Integration Hub'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-semibold">
                {isAr ? 'بيانات محاكاة' : 'Fixture Mode'}
              </span>
            </div>
            <p className="text-xs text-cyan-400 font-mono mt-0.5">
              {isAr
                ? 'معاينة تصميمية لـ 10 خدمات Google Workspace — لا يوجد حساب Google متصل'
                : 'Design preview for 10 Google Workspace services — no Google account is connected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'وضع المعاينة التنشيطي مُفعّل (محاكاة)' : 'Sandbox preview toggled on (simulated)'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'المحرك بانتظار Google OAuth' : 'OAuth Bridge Disconnected'}</span>
              </span>
              <button
                onClick={() => setIsOAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isAr ? 'ربط حساب Google' : 'Connect Google OAuth'}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Grid Layout: Service Selector Sidebar + Service Content View */}
      <div className="flex-1 flex min-h-0 gap-4 overflow-hidden">

        {/* Left Services Nav */}
        <div className="w-64 shrink-0 bg-[#061226] border border-[#142e56] rounded-xl p-2 flex flex-col gap-1 overflow-y-auto knx-custom-scrollbar">
          {HUB_SERVICES.map((srv) => {
            const Icon = srv.icon;
            const isActive = activeService === srv.id;
            const count = (BASE_ITEMS[srv.id] ?? []).length + (localAdditions[srv.id] ?? []).length;
            return (
              <button
                key={srv.id}
                onClick={() => {
                  setActiveService(srv.id);
                  const first = (localAdditions[srv.id] ?? [])[0] ?? (BASE_ITEMS[srv.id] ?? [])[0];
                  setSelectedItemId(first ? first.id : '');
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)] border border-cyan-400/40'
                    : 'text-slate-300 hover:bg-[#0b1b36] hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : srv.color}`} />
                <span className="truncate flex-1 text-start">{isAr ? srv.labelAr : srv.labelEn}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono shrink-0 ${
                    isActive ? 'bg-white/15 text-white' : 'bg-[#0b1b36] text-slate-400 border border-slate-800'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Honest integration note inside the nav */}
          <div className="mt-auto pt-3 px-2 pb-1">
            <div className="rounded-lg bg-[#08152c] border border-[#15325e] p-2.5 text-[10px] leading-relaxed text-slate-400">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{isAr ? 'وضع المعاينة فقط' : 'Preview-only mode'}</span>
              </div>
              {isAr
                ? 'جميع العناصر أدناه بيانات محاكاة محلية. لا يتم استدعاء أي واجهة Google API ولا يتم إرسال أي بريد أو رسالة.'
                : 'Everything listed is a local fixture. No Google API is called and no mail, event, task, or message is ever sent.'}
            </div>
          </div>
        </div>

        {/* Right Active Service Panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">

          {/* Service header + list/inspector split */}
          <section className="flex-1 min-h-0 bg-[#061226]/80 border border-[#142e56] rounded-xl shadow-inner flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-[#122b52] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <ActiveIcon className={`w-5 h-5 shrink-0 ${activeDef.color}`} />
                <h2 className="text-sm font-bold text-white truncate">
                  {isAr ? activeDef.labelAr : activeDef.labelEn}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#0b1b36] border border-slate-700 text-[10px] font-mono text-slate-400 shrink-0">
                  {allItems.length} {isAr ? 'عنصر' : 'items'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleAction(activeDef.actionEn)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? activeDef.actionAr : activeDef.actionEn}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-5 overflow-hidden">
              {/* Item list */}
              <div className="xl:col-span-2 border-b xl:border-b-0 xl:border-e border-[#122b52] overflow-y-auto knx-custom-scrollbar p-3 space-y-2">
                {allItems.length === 0 ? (
                  <div className="rounded-xl bg-[#091833] border border-dashed border-[#173766] p-6 text-center text-slate-400 text-xs">
                    {isAr ? activeDef.emptyAr : activeDef.emptyEn}
                  </div>
                ) : (
                  allItems.map((item) => {
                    const isSel = item.id === selectedItem?.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItemId(item.id)}
                        className={`w-full p-3 rounded-xl border text-start transition ${
                          isSel
                            ? 'bg-[#0d2450] border-cyan-500/50 shadow-[0_0_14px_rgba(34,211,238,0.12)]'
                            : 'bg-[#091833] border-[#173766] hover:border-[#245089] hover:bg-[#0b1f3d]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate">{item.title}</div>
                            <div className="text-[10.5px] text-slate-400 truncate mt-0.5">{item.subtitle}</div>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded-full border text-[9px] font-medium shrink-0 ${TONE_BADGE[item.badgeTone]}`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1.5 truncate">{item.meta}</div>
                      </button>
                    );
                  })
                )}

                {/* Collection summary — fills the list column with honest counters */}
                {allItems.length > 0 && (
                  <div className="rounded-xl bg-[#08152c] border border-[#15325e] p-3">
                    <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-300 mb-2">
                      <ListFilter className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{isAr ? 'ملخص المجموعة' : 'Collection summary'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                      <span className="text-slate-500">{isAr ? 'عناصر معروضة' : 'Items in view'}</span>
                      <span className="font-mono text-end text-slate-200">{allItems.length}</span>
                      <span className="text-slate-500">{isAr ? 'صفوف المعاينة' : 'Preview rows'}</span>
                      <span className="font-mono text-end text-slate-200">
                        {allItems.reduce((sum, i) => sum + i.rows.length, 0)}
                      </span>
                      <span className="text-slate-500">{isAr ? 'سجلات حية' : 'Live records'}</span>
                      <span className="font-mono text-end text-amber-300">0</span>
                      <span className="text-slate-500">{isAr ? 'اتصال Google' : 'Google connection'}</span>
                      <span className="font-mono text-end text-amber-300">
                        {isAr ? 'غير متصل' : 'Not connected'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contextual inspector */}
              <div className="xl:col-span-3 overflow-y-auto knx-custom-scrollbar p-4 space-y-3">
                {selectedItem ? (
                  <>
                    <div className="rounded-xl bg-[#091833] border border-[#173766] p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-white truncate">{selectedItem.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{selectedItem.subtitle}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[9.5px] font-medium shrink-0 ${TONE_BADGE[selectedItem.badgeTone]}`}
                        >
                          {selectedItem.badge}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-[#173766]">
                        {selectedItem.fields.map((f, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-slate-500 shrink-0">{f.label}</span>
                            <span className={`font-mono truncate ${TONE_FIELD[f.tone ?? 'default']}`}>{f.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#173766] flex-wrap">
                        <button
                          onClick={() => handleAction(`${activeDef.labelEn}: ${selectedItem.title}`)}
                          className="px-2.5 py-1 rounded bg-[#102952] text-cyan-300 hover:text-white text-[11px] font-medium cursor-pointer flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{isAr ? 'فتح في الخدمة' : `Open in ${activeDef.labelEn.replace('Google ', '')}`}</span>
                        </button>
                        <button
                          onClick={handleCopyId}
                          className="px-2.5 py-1 rounded bg-[#102952] text-slate-300 hover:text-white text-[11px] font-medium cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedId ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ المعرّف' : 'Copy ID')}</span>
                        </button>
                        <span className="text-[10px] font-mono text-slate-500 truncate">{selectedItem.id}</span>
                      </div>
                    </div>

                    {/* Contextual preview: message body for mail, table for everything else */}
                    {selectedItem.body && (
                      <div className="rounded-xl bg-[#091833] border border-[#173766] p-3.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200 mb-2">
                          <Mail className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{isAr ? 'معاينة الرسالة' : 'Message preview'}</span>
                        </div>
                        <p className="text-[11.5px] text-slate-300 leading-relaxed">{selectedItem.body}</p>
                        {selectedItem.tags && selectedItem.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                            {selectedItem.tags.map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 rounded bg-[#0b1f3d] border border-[#1d3f6e] text-[9.5px] font-mono text-cyan-300"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="rounded-xl bg-[#091833] border border-[#173766] overflow-hidden">
                      <div className="flex items-center justify-between gap-2 px-3.5 py-2 border-b border-[#173766]">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
                          <Table2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{isAr ? 'جدول المعاينة' : 'Preview table'}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-[#0b1f3d] border border-[#1d3f6e] text-[9px] font-mono text-amber-300">
                          {isAr ? 'نموذج محاكاة' : 'fixture data'}
                        </span>
                      </div>
                      <div className="overflow-x-auto knx-custom-scrollbar">
                        <table className="w-full text-[10.5px] border-collapse">
                          <thead>
                            <tr className="bg-[#07162c]">
                              {selectedItem.columns.map((c, i) => (
                                <th
                                  key={i}
                                  className="text-start font-semibold text-slate-400 px-3 py-1.5 whitespace-nowrap border-b border-[#173766]"
                                >
                                  {c}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedItem.rows.map((row, ri) => (
                              <tr key={ri} className="hover:bg-[#0b1f3d]">
                                {row.map((cell, ci) => (
                                  <td
                                    key={ci}
                                    className={`px-3 py-1.5 border-b border-[#122b52] whitespace-nowrap ${
                                      ci === 0 ? 'font-mono text-slate-500' : 'text-slate-300'
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Activity trail — derived from the selected fixture, clearly local */}
                    <div className="rounded-xl bg-[#091833] border border-[#173766] p-3.5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
                          <History className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>{isAr ? 'سجل النشاط' : 'Activity trail'}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-[#0b1f3d] border border-[#1d3f6e] text-[9px] font-mono text-slate-400">
                          {isAr ? 'محلي فقط' : 'local only'}
                        </span>
                      </div>
                      <ol className="space-y-1.5">
                        <li className="flex items-start gap-2 text-[10.5px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1" />
                          <span className="text-slate-300 flex-1">
                            {isAr ? 'تم تحميل بيانات المحاكاة' : 'Fixture snapshot loaded'}
                          </span>
                          <span className="font-mono text-slate-500 shrink-0">{selectedItem.meta}</span>
                        </li>
                        <li className="flex items-start gap-2 text-[10.5px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1" />
                          <span className="text-slate-300 flex-1">
                            {isAr ? 'تم عرض المعاينة داخل المتصفح' : 'Local preview rendered in-browser'}
                          </span>
                          <span className="font-mono text-slate-500 shrink-0">
                            {selectedItem.rows.length} {isAr ? 'صف' : 'rows'}
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-[10.5px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1" />
                          <span className="text-slate-300 flex-1">
                            {isAr ? 'لم يتم تنفيذ أي عملية على Google' : 'No operation performed against Google'}
                          </span>
                          <span className="font-mono text-amber-300 shrink-0">
                            {isAr ? 'مجمّد' : 'Frozen'}
                          </span>
                        </li>
                      </ol>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl bg-[#091833] border border-dashed border-[#173766] p-8 text-center text-slate-400 text-xs">
                    {isAr ? 'اختر عنصرًا لعرض تفاصيل المعاينة.' : 'Select an item to inspect its preview.'}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Bottom: integration posture strip */}
          <section className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#071328] border border-[#1b3f70] p-3 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#0b1f3d] border border-[#1d3f6e] flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">
                  {isAr ? 'نطاق OAuth المطلوب' : 'Required OAuth scope'}
                </div>
                <div className="text-[10px] font-mono text-cyan-300 truncate mt-0.5">{activeDef.scope}</div>
                <div className="text-[9.5px] text-slate-500 mt-0.5">
                  {isAr ? 'غير مطلوب في هذه المرحلة' : 'Not requested in this phase'}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#071328] border border-[#1b3f70] p-3 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#0b1f3d] border border-[#1d3f6e] flex items-center justify-center shrink-0">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">
                  {isAr ? 'حالة المزامنة' : 'Sync state'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  {isAr ? activeDef.syncAr : activeDef.syncEn}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#071328] border border-[#1b3f70] p-3 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#0b1f3d] border border-[#1d3f6e] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-white truncate">
                  {isAr ? 'إضافة عنصر محلي' : 'Add local fixture item'}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    value={newInput}
                    onChange={(e) => setNewInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddLocalItem();
                    }}
                    placeholder={isAr ? 'عنصر جديد…' : 'New local item…'}
                    className="flex-1 min-w-0 px-2 py-1 bg-[#0b1b36] border border-[#173766] rounded text-[10.5px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleAddLocalItem}
                    disabled={!newInput.trim()}
                    className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[10.5px] font-semibold cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    {isAr ? 'إضافة' : 'Add'}
                  </button>
                </div>
                <div className="text-[9.5px] text-slate-500 mt-1">
                  {isAr ? 'يبقى داخل المتصفح' : 'Stays inside this browser only'}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>

  {/* Honest OAuth Integration Status Modal */}
  {isOAuthModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-[#040a16] border border-[#1b3f70] rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#0f2444]">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">
              {isAr ? 'ربط خدمات Google Workspace' : 'Google Workspace OAuth Setup'}
            </h2>
          </div>
          <button
            onClick={() => setIsOAuthModalOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#08152c] border border-[#15325e] text-slate-300 text-xs leading-relaxed space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'حالة التكامل: وضع المحاكاة التجريبية' : 'Integration Status: Sandbox Simulation'}</span>
          </div>
          <p className="text-[11px] text-slate-300">
            {isAr
              ? 'تتطلب خدمات Google الحية (Sheets, Gmail, Calendar, Picker) مفتاح OAuth 2.0 Client ID مصادق عليه عبر Google Cloud Console أو عبر محرك KNOuX المكتبي. البيانات المعروضة حالياً هي بيانات محاكاة تجريبية لتصميم الواجهات.'
              : 'Connecting live Google accounts requires Google Cloud OAuth 2.0 Client credentials (Client ID / Secret) or the native Windows KNOuX bridge. The current interface runs on high-fidelity fixtures for UI design validation.'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#0f2444]">
          <button
            onClick={() => {
              setIsConnected(true);
              setIsOAuthModalOpen(false);
              setToastMessage(
                isAr
                  ? 'تم تفعيل وضع المعاينة لمحاكاة حساب Google المتصل.'
                  : 'Sandbox preview activated for simulated Google account.'
              );
              setTimeout(() => setToastMessage(null), 3500);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer"
          >
            {isAr ? 'تفعيل محاكاة الاتصال التجريبي' : 'Simulate Connected State'}
          </button>
          <button
            onClick={() => setIsOAuthModalOpen(false)}
            className="px-3.5 py-1.5 rounded-lg bg-[#081329] hover:bg-[#0e2147] text-slate-300 border border-[#1b3f70] text-xs cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  );
};

export default GoogleWorkspaceHub;
