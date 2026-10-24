import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ChevronDown, ChevronUp, CircleDashed,
  Clock3, FileClock, FlaskConical, GitBranch, History, LayoutTemplate, ListChecks, Lock, Maximize2,
  Play, Plus, Power, Save, Search, ShieldCheck, Sparkles, Trash2, UserCheck, Workflow, X,
  ZoomIn, ZoomOut
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { fill, formatDateTime } from '../lib/format';
import { countByState } from '../lib/service-catalog';
import { useStore } from '../state/store';
import { ServicesRail } from '../components/world/ServicesRail';
import { Stage, StageHead, StageStats } from '../components/world/Stage';
import type { AutomationSchedule, AutomationTrigger } from '../state/types';

/* ------------------------------------------------------------------ model
   A studio node is design data. It is never handed to an execution engine:
   the real scheduler path stays exactly the one AutomationPage already used.
   Everything below is local component state and disappears with the window. */

type ToolId = AutomationSchedule['toolId'];
type TriggerKind = AutomationTrigger['kind'];
type DayOfWeek = Extract<AutomationTrigger, { kind: 'weekly' }>['dayOfWeek'];
type NodeKind = 'trigger' | 'condition' | 'action' | 'approval' | 'result';
type ConditionField = 'warnings' | 'candidates' | 'freeSpace' | 'always';
type ConditionOp = 'atLeast' | 'atMost' | 'equals';
type ApprovalMode = 'always' | 'warnings' | 'never';
type NotifyMode = 'inApp' | 'windows' | 'email';
type Retention = '10' | '25' | '50';
type RetryMode = 'none' | 'once' | 'twice';
type FailureMode = 'pause' | 'disable' | 'keep';
type LibraryFilter = 'all' | 'schedules' | 'templates' | 'drafts';
type FlowCategory = 'scans' | 'health' | 'files' | 'cleanup' | 'utilities';
type PreviewView = 'summary' | 'inputs' | 'permissions';

interface NodeConfig {
  triggerKind: TriggerKind;
  time: string;
  dayOfWeek: DayOfWeek;
  dayOfMonth: number;
  conditionField: ConditionField;
  conditionOp: ConditionOp;
  conditionValue: string;
  toolId: ToolId;
  approvalMode: ApprovalMode;
  notify: NotifyMode;
  retention: Retention;
  retry: RetryMode;
  failure: FailureMode;
}

interface FlowNode {
  id: string;
  kind: NodeKind;
  /** Empty means the canonical, localized node name. */
  title: string;
  config: NodeConfig;
}

interface StudioDraft {
  id: string;
  name: string;
  nodes: FlowNode[];
  updatedAt: string;
}

interface WorkingDraft {
  name: string;
  nodes: FlowNode[];
  savedId: string | null;
  dirty: boolean;
}

interface DesignIssue {
  key: string;
  tone: 'error' | 'warn';
  nodeId?: string;
}

interface TemplateDef {
  id: string;
  nameKey: string;
  descKey: string;
  category: FlowCategory;
  build: () => FlowNode[];
}

/**
 * Drafts live in renderer memory, not on disk, but they outlive a visit to
 * another page: leaving Automation and coming back must not silently discard
 * the design the reader was working on. Reloading or closing the window clears
 * this object, which is exactly what the session-only labels promise.
 */
interface StudioSessionState {
  working: WorkingDraft | null;
  drafts: StudioDraft[];
  selectedScheduleId: string | null;
  selectedNodeId: string | null;
}

const studioSession: StudioSessionState = {
  working: null,
  drafts: [],
  selectedScheduleId: null,
  selectedNodeId: null
};

const TOOL_IDS: ToolId[] = ['smart-scan', 'system-health', 'disk-overview', 'downloads-inventory', 'temp-cleanup-preview'];
const TRIGGER_KINDS: TriggerKind[] = ['daily', 'weekly', 'monthly', 'startup'];
const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const NODE_W = 360;
const NODE_H = 86;
const NODE_GAP = 16;
const WORLD_W = 440;
const WORLD_PAD = 30;

let nodeSequence = 0;
let draftSequence = 0;
const newNodeId = () => `flow-node-${++nodeSequence}`;

const kindIcons: Record<NodeKind, LucideIcon> = {
  trigger: Clock3,
  condition: GitBranch,
  action: Sparkles,
  approval: UserCheck,
  result: FileClock
};

function defaultConfig(): NodeConfig {
  return {
    triggerKind: 'daily',
    time: '09:00',
    dayOfWeek: 'MON',
    dayOfMonth: 1,
    conditionField: 'warnings',
    conditionOp: 'atLeast',
    conditionValue: '1',
    toolId: 'smart-scan',
    approvalMode: 'always',
    notify: 'inApp',
    retention: '25',
    retry: 'none',
    failure: 'pause'
  };
}

function makeNode(kind: NodeKind, config: Partial<NodeConfig> = {}): FlowNode {
  return { id: newNodeId(), kind, title: '', config: { ...defaultConfig(), ...config } };
}

interface NodeOverrides {
  trigger?: Partial<NodeConfig>;
  condition?: Partial<NodeConfig>;
  action?: Partial<NodeConfig>;
  approval?: Partial<NodeConfig>;
  result?: Partial<NodeConfig>;
}

/** The canonical Trigger → Condition → Action → Approval → Result shape. */
function baseNodes(overrides: NodeOverrides = {}): FlowNode[] {
  return [
    makeNode('trigger', overrides.trigger),
    makeNode('condition', overrides.condition),
    makeNode('action', overrides.action),
    makeNode('approval', overrides.approval),
    makeNode('result', overrides.result)
  ];
}

const TEMPLATES: TemplateDef[] = [
  {
    id: 'weekly-scan', nameKey: 'flow.template.weeklyScan.name', descKey: 'flow.template.weeklyScan.desc', category: 'scans',
    build: () => baseNodes({
      trigger: { triggerKind: 'weekly', dayOfWeek: 'MON', time: '09:00' },
      condition: { conditionField: 'candidates', conditionOp: 'atLeast', conditionValue: '1' },
      action: { toolId: 'smart-scan' },
      approval: { approvalMode: 'warnings' }
    })
  },
  {
    id: 'health-daily', nameKey: 'flow.template.healthDaily.name', descKey: 'flow.template.healthDaily.desc', category: 'health',
    build: () => baseNodes({
      trigger: { triggerKind: 'daily', time: '08:30' },
      condition: { conditionField: 'always' },
      action: { toolId: 'system-health' },
      approval: { approvalMode: 'never' }
    })
  },
  {
    id: 'downloads-monthly', nameKey: 'flow.template.downloadsMonthly.name', descKey: 'flow.template.downloadsMonthly.desc', category: 'files',
    build: () => baseNodes({
      trigger: { triggerKind: 'monthly', dayOfMonth: 1, time: '10:00' },
      condition: { conditionField: 'candidates', conditionOp: 'atLeast', conditionValue: '1' },
      action: { toolId: 'downloads-inventory' },
      approval: { approvalMode: 'warnings' }
    })
  },
  {
    id: 'temp-review', nameKey: 'flow.template.tempReview.name', descKey: 'flow.template.tempReview.desc', category: 'cleanup',
    build: () => baseNodes({
      trigger: { triggerKind: 'weekly', dayOfWeek: 'FRI', time: '18:00' },
      condition: { conditionField: 'candidates', conditionOp: 'atLeast', conditionValue: '1' },
      action: { toolId: 'temp-cleanup-preview' },
      approval: { approvalMode: 'always' }
    })
  },
  {
    id: 'disk-monthly', nameKey: 'flow.template.diskMonthly.name', descKey: 'flow.template.diskMonthly.desc', category: 'utilities',
    build: () => baseNodes({
      trigger: { triggerKind: 'monthly', dayOfMonth: 1, time: '07:00' },
      condition: { conditionField: 'freeSpace', conditionOp: 'atMost', conditionValue: '40' },
      action: { toolId: 'disk-overview' },
      approval: { approvalMode: 'warnings' }
    })
  },
  {
    id: 'blank', nameKey: 'flow.template.blank.name', descKey: 'flow.template.blank.desc', category: 'utilities',
    build: () => baseNodes()
  }
];

function categoryForTool(toolId: ToolId): FlowCategory {
  if (toolId === 'system-health') return 'health';
  if (toolId === 'downloads-inventory') return 'files';
  if (toolId === 'temp-cleanup-preview') return 'cleanup';
  if (toolId === 'disk-overview') return 'utilities';
  return 'scans';
}

function categoryKey(category: FlowCategory | 'all'): string {
  return `flow.cat.${category}`;
}

function defaultTitleKey(kind: NodeKind): string {
  return `flow.node.${kind}.title`;
}

function triggerSummary(config: NodeConfig, t: (key: string) => string): string {
  if (config.triggerKind === 'startup') return t('flow.trigger.startupLine');
  if (config.triggerKind === 'weekly') {
    return fill(t('flow.trigger.weeklyLine'), { day: t(`automation.day.${config.dayOfWeek}`), time: config.time });
  }
  if (config.triggerKind === 'monthly') {
    return fill(t('flow.trigger.monthlyLine'), { day: String(config.dayOfMonth), time: config.time });
  }
  return fill(t('flow.trigger.dailyLine'), { time: config.time });
}

function conditionSummary(config: NodeConfig, t: (key: string) => string): string {
  if (config.conditionField === 'always') return t('flow.op.alwaysLine');
  return fill(t('flow.op.line'), {
    field: t(`flow.field.${config.conditionField}`),
    op: t(`flow.op.${config.conditionOp}`),
    value: config.conditionValue
  });
}

function approvalSummary(config: NodeConfig, t: (key: string) => string): string {
  if (config.approvalMode === 'never') return t('flow.approval.lineNever');
  if (config.approvalMode === 'warnings') return t('flow.approval.lineWarnings');
  return t('flow.approval.lineAlways');
}

function nodeSubtitle(node: FlowNode, t: (key: string) => string): string {
  switch (node.kind) {
    case 'trigger': return triggerSummary(node.config, t);
    case 'condition': return conditionSummary(node.config, t);
    case 'action': return t(`tools.${node.config.toolId}.name`);
    case 'approval': return approvalSummary(node.config, t);
    case 'result':
      return `${t(`flow.retention.${node.config.retention}`)} · ${t('flow.node.result.sub')}`;
    default: return '';
  }
}

function nodeStatus(node: FlowNode, issues: DesignIssue[], t: (key: string) => string): { label: string; tone: string } {
  if (issues.some(issue => issue.nodeId === node.id)) return { label: t('flow.node.status.review'), tone: 'warn' };
  if (node.kind === 'condition') return { label: t('flow.node.status.ready'), tone: 'ready' };
  if (node.kind === 'action') return { label: t('flow.node.status.readOnly'), tone: 'ready' };
  if (node.kind === 'approval') {
    return node.config.approvalMode === 'never'
      ? { label: t('flow.node.status.off'), tone: 'warn' }
      : { label: t('flow.node.status.required'), tone: 'ready' };
  }
  if (node.kind === 'result') return { label: t('flow.node.status.record'), tone: 'ready' };
  return { label: t('flow.node.status.ready'), tone: 'ready' };
}

function issuesFor(nodes: FlowNode[]): DesignIssue[] {
  const issues: DesignIssue[] = [];
  const triggers = nodes.filter(node => node.kind === 'trigger');
  const actions = nodes.filter(node => node.kind === 'action');
  const results = nodes.filter(node => node.kind === 'result');
  if (triggers.length === 0) issues.push({ key: 'flow.valid.triggerRequired', tone: 'error' });
  if (triggers.length > 1) {
    for (const trigger of triggers.slice(1)) issues.push({ key: 'flow.valid.triggerSingle', tone: 'warn', nodeId: trigger.id });
  }
  if (actions.length === 0) issues.push({ key: 'flow.valid.actionRequired', tone: 'error' });
  if (results.length === 0) issues.push({ key: 'flow.valid.resultMissing', tone: 'warn' });
  for (const condition of nodes.filter(node => node.kind === 'condition')) {
    if (condition.config.conditionField === 'always') continue;
    const value = Number(condition.config.conditionValue);
    if (!Number.isFinite(value) || condition.config.conditionValue.trim() === '') {
      issues.push({ key: 'flow.valid.conditionValue', tone: 'error', nodeId: condition.id });
    }
  }
  for (const approval of nodes.filter(node => node.kind === 'approval')) {
    if (approval.config.approvalMode === 'never') issues.push({ key: 'flow.valid.approvalOff', tone: 'warn', nodeId: approval.id });
  }
  return issues;
}

function nodesForSchedule(schedule: AutomationSchedule): FlowNode[] {
  const config = defaultConfig();
  config.triggerKind = schedule.trigger.kind;
  if ('time' in schedule.trigger) config.time = schedule.trigger.time;
  if ('dayOfWeek' in schedule.trigger) config.dayOfWeek = schedule.trigger.dayOfWeek;
  if ('dayOfMonth' in schedule.trigger) config.dayOfMonth = schedule.trigger.dayOfMonth;
  config.toolId = schedule.toolId;
  config.conditionField = schedule.toolId === 'smart-scan' || schedule.toolId === 'downloads-inventory' ? 'candidates' : 'always';
  config.approvalMode = 'always';
  config.notify = 'inApp';
  return (['trigger', 'condition', 'action', 'approval', 'result'] as NodeKind[]).map(kind => ({
    id: `schedule-${schedule.id}-${kind}`,
    kind,
    title: '',
    config: { ...config }
  }));
}

function cloneNodes(nodes: FlowNode[]): FlowNode[] {
  return nodes.map(node => ({ ...node, config: { ...node.config } }));
}

function worldHeightFor(count: number): number {
  return WORLD_PAD * 2 + count * NODE_H + Math.max(0, count - 1) * NODE_GAP;
}

function nodeTop(index: number): number {
  return WORLD_PAD + index * (NODE_H + NODE_GAP);
}

function fitTransform(rect: { width: number; height: number }, worldHeight: number) {
  const zoom = Math.min(1.05, Math.max(0.52, Math.min((rect.width - 32) / WORLD_W, (rect.height - 32) / worldHeight)));
  return { zoom, x: (rect.width - WORLD_W * zoom) / 2, y: (rect.height - worldHeight * zoom) / 2 };
}

export default function AutomationPage() {
  const { automations, refreshAutomations, setNotice, setPage, t, locale } = useStore();
  const [toolId, setToolId] = useState<ToolId>('smart-scan');
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<TriggerKind>('daily');
  const [time, setTime] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MON');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [composing, setComposing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [category, setCategory] = useState<FlowCategory | 'all'>('all');

  const [working, setWorking] = useState<WorkingDraft | null>(() => {
    if (studioSession.working) return studioSession.working;
    if (studioSession.selectedScheduleId) return null;
    const starter: WorkingDraft = {
      name: t('flow.draft.untitled'),
      nodes: baseNodes(),
      savedId: null,
      dirty: false
    };
    studioSession.working = starter;
    return starter;
  });
  const [savedDrafts, setSavedDrafts] = useState<StudioDraft[]>(() => studioSession.drafts);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(() => studioSession.selectedScheduleId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => studioSession.selectedNodeId);

  const [addKind, setAddKind] = useState<NodeKind>('condition');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [previewView, setPreviewView] = useState<PreviewView>('summary');
  const [previewStep, setPreviewStep] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(true);

  // Mirror the ephemeral editor into this module's memory so a page change
  // keeps the draft, while a window reload starts clean.
  useEffect(() => {
    studioSession.working = working;
    studioSession.drafts = savedDrafts;
  }, [working, savedDrafts]);
  useEffect(() => {
    studioSession.selectedScheduleId = selectedScheduleId;
    studioSession.selectedNodeId = selectedNodeId;
  }, [selectedScheduleId, selectedNodeId]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; panX: number; panY: number } | null>(null);

  const schedule = useMemo(
    () => (working ? null : selectedScheduleId ? automations.find(item => item.id === selectedScheduleId) ?? null : null),
    [working, selectedScheduleId, automations]
  );
  const scheduleNodes = useMemo(() => (schedule ? nodesForSchedule(schedule) : []), [schedule]);
  const nodes = working?.nodes ?? scheduleNodes;
  const readOnly = !working;
  const issues = useMemo(() => issuesFor(nodes), [nodes]);
  const selectedNode = nodes.find(node => node.id === selectedNodeId) ?? null;
  const worldHeight = worldHeightFor(nodes.length);
  const templateCount = TEMPLATES.length;
  const stateCounts = useMemo(() => countByState('automation'), []);

  useEffect(() => {
    if (!nodes.length) {
      setSelectedNodeId(null);
      return;
    }
    if (!nodes.some(node => node.id === selectedNodeId)) {
      setSelectedNodeId(nodes[0]?.id ?? null);
      setPreviewStep(0);
    }
  }, [nodes, selectedNodeId]);

  useEffect(() => {
    if (selectedScheduleId && !automations.some(item => item.id === selectedScheduleId)) setSelectedScheduleId(null);
  }, [automations, selectedScheduleId]);

  useEffect(() => {
    if (previewStep >= nodes.length) setPreviewStep(0);
  }, [nodes.length, previewStep]);

  const applyFit = useCallback(() => {
    const viewport = canvasRef.current;
    if (!viewport) return;
    const box = viewport.getBoundingClientRect();
    const next = fitTransform(box, worldHeight);
    setZoom(next.zoom);
    setPan({ x: next.x, y: next.y });
  }, [worldHeight]);

  useEffect(() => {
    applyFit();
    const viewport = canvasRef.current;
    if (!viewport || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(applyFit);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [applyFit, nodes.length]);

  const create = async () => {
    try {
      const trigger = kind === 'startup' ? { kind } as const
        : kind === 'weekly' ? { kind, time, dayOfWeek } as const
        : kind === 'monthly' ? { kind, time, dayOfMonth } as const
        : { kind: 'daily', time } as const;
      const created = await window.knoux.createAutomation({ toolId, label: label.trim() || t(`tools.${toolId}.name`), trigger });
      await refreshAutomations();
      setLabel('');
      setComposing(false);
      setWorking(null);
      setSelectedScheduleId(created.id);
      setNotice(t('automation.created'));
    } catch (error) { setNotice(String((error as Error).message || error)); }
  };

  const toggle = async (item: AutomationSchedule) => {
    try {
      await window.knoux.setAutomationEnabled({ id: item.id, enabled: !item.enabled });
      await refreshAutomations();
    } catch (error) { setNotice(String((error as Error).message || error)); }
  };

  const remove = async (id: string) => {
    try {
      await window.knoux.removeAutomation(id);
      if (selectedScheduleId === id) setSelectedScheduleId(null);
      await refreshAutomations();
    } catch (error) { setNotice(String((error as Error).message || error)); }
  };

  const runNow = async (id: string) => {
    try {
      await window.knoux.runAutomation(id);
      await refreshAutomations();
      setNotice(t('automation.ran'));
    } catch (error) { setNotice(String((error as Error).message || error)); }
  };

  const selectSchedule = (item: AutomationSchedule) => {
    setWorking(null);
    setSelectedScheduleId(item.id);
    setSelectedNodeId(`schedule-${item.id}-trigger`);
    setPreviewStep(0);
    setPreviewView('summary');
  };

  const loadDraft = (draft: StudioDraft) => {
    setSelectedScheduleId(null);
    const copy = cloneNodes(draft.nodes);
    setWorking({ name: draft.name, nodes: copy, savedId: draft.id, dirty: false });
    setSelectedNodeId(copy[0]?.id ?? null);
    setPreviewStep(0);
    setPreviewView('summary');
  };

  const loadTemplate = (template: TemplateDef) => {
    setSelectedScheduleId(null);
    const loaded = template.build();
    setWorking({ name: t(template.nameKey), nodes: loaded, savedId: null, dirty: true });
    setSelectedNodeId(loaded[0]?.id ?? null);
    setPreviewStep(0);
    setPreviewView('summary');
    setNotice(t('flow.notice.draftCreated'));
  };

  const newDraft = () => {
    setSelectedScheduleId(null);
    const loaded = baseNodes();
    setWorking({ name: t('flow.draft.untitled'), nodes: loaded, savedId: null, dirty: false });
    setSelectedNodeId(loaded[0]?.id ?? null);
    setPreviewStep(0);
    setPreviewView('summary');
    setNotice(t('flow.notice.draftReset'));
  };

  const selectNode = (node: FlowNode, index: number) => {
    setSelectedNodeId(node.id);
    setPreviewStep(index);
  };

  const patchNode = (patch: { title?: string; config?: Partial<NodeConfig> }) => {
    if (!working || !selectedNode) return;
    setWorking({
      ...working,
      dirty: true,
      nodes: working.nodes.map(node => node.id === selectedNode.id
        ? { ...node, title: patch.title ?? node.title, config: { ...node.config, ...patch.config } }
        : node)
    });
  };

  const addNode = () => {
    if (!working) return;
    const node = makeNode(addKind);
    const index = working.nodes.findIndex(item => item.id === selectedNodeId);
    const at = index >= 0 ? index + 1 : working.nodes.length;
    const next = [...working.nodes.slice(0, at), node, ...working.nodes.slice(at)];
    setWorking({ ...working, nodes: next, dirty: true });
    setSelectedNodeId(node.id);
    setPreviewStep(at);
    setNotice(t('flow.notice.nodeAdded'));
  };

  const removeNode = (id: string) => {
    if (!working) return;
    const index = working.nodes.findIndex(node => node.id === id);
    const next = working.nodes.filter(node => node.id !== id);
    setWorking({ ...working, nodes: next, dirty: true });
    const neighbour = next[Math.max(0, Math.min(index, next.length - 1))];
    setSelectedNodeId(neighbour?.id ?? null);
    setPreviewStep(Math.max(0, Math.min(index, next.length - 1)));
    setNotice(t('flow.notice.nodeRemoved'));
  };

  const saveDraft = () => {
    if (!working) return;
    const name = working.name.trim() || t('flow.draft.untitled');
    const id = working.savedId ?? `session-draft-${Date.now()}-${++draftSequence}`;
    const record: StudioDraft = { id, name, nodes: cloneNodes(working.nodes), updatedAt: new Date().toISOString() };
    setSavedDrafts(list => list.some(item => item.id === id) ? list.map(item => item.id === id ? record : item) : [...list, record]);
    setWorking({ ...working, name, savedId: id, dirty: false });
    setNotice(t('flow.preview.saved'));
  };

  const jumpToPreview = () => {
    setPreviewOpen(true);
    setPreviewStep(0);
    window.requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const onCanvasPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('.flow-node, .flow-canvas__bar, .flow-canvas__foot')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, panX: pan.x, panY: pan.y };
    setPanning(true);
  };
  const onCanvasPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setPan({ x: drag.panX + event.clientX - drag.startX, y: drag.panY + event.clientY - drag.startY });
  };
  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setPanning(false);
  };

  const adjustZoom = (delta: number) => {
    setZoom(value => Math.max(0.5, Math.min(1.4, Number((value + delta).toFixed(2)))));
  };

  const needle = query.trim().toLowerCase();
  const matches = (...parts: Array<string | number>) => parts.join(' ').toLowerCase().includes(needle);
  const visibleSchedules = automations.filter(item => {
    if (filter === 'templates' || filter === 'drafts') return false;
    if (category !== 'all' && categoryForTool(item.toolId) !== category) return false;
    return matches(item.label, t(`tools.${item.toolId}.name`), triggerSummary({ ...defaultConfig(), ...configFromTrigger(item.trigger) }, t));
  });
  const visibleTemplates = TEMPLATES.filter(template => {
    if (filter === 'schedules' || filter === 'drafts') return false;
    if (category !== 'all' && template.category !== category) return false;
    return matches(t(template.nameKey), t(template.descKey));
  });
  const draftPool = working
    ? [...savedDrafts.filter(draft => draft.id !== working.savedId)]
    : savedDrafts;
  const visibleDrafts = (working
    ? [{ id: '__working__', name: working.name, nodes: working.nodes, updatedAt: '' }, ...draftPool]
    : draftPool
  ).filter(draft => {
    if (filter === 'schedules' || filter === 'templates') return false;
    const actionTool = draft.nodes.find(node => node.kind === 'action')?.config.toolId ?? 'smart-scan';
    if (category !== 'all' && categoryForTool(actionTool) !== category) return false;
    return matches(draft.name, t(`tools.${actionTool}.name`));
  });
  const anyVisible = visibleSchedules.length + visibleTemplates.length + visibleDrafts.length > 0;
  const enabledCount = automations.filter(item => item.enabled).length;
  const filters: Array<{ id: LibraryFilter; label: string; count: number }> = [
    { id: 'all', label: t('flow.library.all'), count: automations.length + TEMPLATES.length + (working ? 1 : 0) + savedDrafts.length },
    { id: 'schedules', label: t('flow.library.schedules'), count: automations.length },
    { id: 'templates', label: t('flow.library.templates'), count: TEMPLATES.length },
    { id: 'drafts', label: t('flow.library.drafts'), count: savedDrafts.length + (working ? 1 : 0) }
  ];
  const categoryOptions: Array<{ id: FlowCategory | 'all'; count: number }> = [
    { id: 'all', count: automations.length + TEMPLATES.length + (working ? 1 : 0) + savedDrafts.length },
    { id: 'scans', count: countCategory('scans', automations, working, savedDrafts) },
    { id: 'health', count: countCategory('health', automations, working, savedDrafts) },
    { id: 'files', count: countCategory('files', automations, working, savedDrafts) },
    { id: 'cleanup', count: countCategory('cleanup', automations, working, savedDrafts) },
    { id: 'utilities', count: countCategory('utilities', automations, working, savedDrafts) }
  ];
  const errors = issues.filter(issue => issue.tone === 'error');
  const warnings = issues.filter(issue => issue.tone === 'warn');
  const previewNode = nodes[previewStep] ?? nodes[0] ?? null;
  const activeSchedule = schedule;
  const canSave = Boolean(working) && Boolean(working && (working.dirty || !working.savedId));
  const modeLabel = working
    ? working.savedId && !working.dirty ? t('flow.canvas.sessionSaved') : t('flow.canvas.designDraft')
    : t('flow.canvas.realView');

  return (
    <Stage world="automation">
      <StageHead
        icon={Workflow}
        title={t('flow.title')}
        lead={t('flow.lead')}
        readout={(
          <div className="flow-actions">
            <button type="button" className="world-control world-control--primary" onClick={() => setComposing(value => !value)}>
              <CalendarClock size={16} />{t('flow.newSchedule')}
            </button>
            <button type="button" className="world-control" onClick={newDraft}><Sparkles size={16} />{t('flow.newDraft')}</button>
            <button type="button" className="world-control" onClick={jumpToPreview}><FlaskConical size={16} />{t('flow.previewJump')}</button>
            {working && (
              <button type="button" className="world-control" onClick={saveDraft} disabled={!canSave}>
                <Save size={16} />{t('flow.preview.saveDraft')}
              </button>
            )}
            <button type="button" className="world-control" onClick={() => setPage('history')}><History size={16} />{t('flow.history')}</button>
          </div>
        )}
      />

      <StageStats items={[
        { icon: CalendarClock, label: t('flow.stat.schedules'), value: automations.length, detail: t('flow.stat.schedulesDetail') },
        { icon: Power, label: t('flow.stat.enabled'), value: enabledCount, detail: t('flow.stat.enabledDetail'), tone: enabledCount ? 'good' : undefined },
        { icon: LayoutTemplate, label: t('flow.stat.templates'), value: templateCount, detail: t('flow.stat.templatesDetail') },
        {
          icon: ShieldCheck,
          label: t('flow.stat.services'),
          value: stateCounts.operational + stateCounts.partial + stateCounts.planned,
          detail: `${stateCounts.operational + stateCounts.partial} / 12 · ${t('flow.stat.servicesDetail')}`
        }
      ]} />

      <div className="flowstudio">
        <div className="flowstudio__grid">
          <aside className="flow-lib" aria-label={t('flow.library.title')}>
            <header className="flow-lib__head">
              <div>
                <h3>{t('flow.library.title')}</h3>
                <p>{t('flow.library.hint')}</p>
              </div>
              <span className="flow-lib__count">{automations.length + TEMPLATES.length + savedDrafts.length + (working ? 1 : 0)}</span>
            </header>

            <label className="flow-lib__search">
              <Search size={14} aria-hidden="true" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder={t('flow.library.search')} aria-label={t('flow.library.search')} />
              {query && <button type="button" onClick={() => setQuery('')} aria-label={t('flow.library.filter')}><X size={13} /></button>}
            </label>

            <div className="flow-lib__filters" role="group" aria-label={t('flow.library.filter')}>
              {filters.map(option => (
                <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
                  {option.label}<b>{option.count}</b>
                </button>
              ))}
            </div>

            <div className="flow-lib__categories" role="group" aria-label={t('flow.library.categories')}>
              {categoryOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`flow-cat${category === option.id ? ' flow-cat--on' : ''}`}
                  aria-pressed={category === option.id}
                  onClick={() => setCategory(option.id)}
                >
                  {t(categoryKey(option.id))}<span>{option.count}</span>
                </button>
              ))}
            </div>

            <div className="flow-lib__scroll">
              {composing && (
                <form className="flow-composer" onSubmit={event => { event.preventDefault(); void create(); }}>
                  <div className="flow-composer__head">
                    <div>
                      <strong>{t('flow.composer.title')}</strong>
                      <p>{t('flow.composer.hint')}</p>
                    </div>
                    <button type="button" className="flow-icon" onClick={() => setComposing(false)} aria-label={t('flow.composer.cancel')}><X size={14} /></button>
                  </div>
                  <label className="flow-field"><span>{t('automation.name')}</span><input value={label} onChange={event => setLabel(event.target.value)} placeholder={t('automation.name')} /></label>
                  <label className="flow-field"><span>{t('automation.tool')}</span>
                    <select value={toolId} onChange={event => setToolId(event.target.value as ToolId)}>
                      {TOOL_IDS.map(id => <option key={id} value={id}>{t(`tools.${id}.name`)}</option>)}
                    </select>
                  </label>
                  <label className="flow-field"><span>{t('flow.config.triggerKind')}</span>
                    <select value={kind} onChange={event => setKind(event.target.value as TriggerKind)}>
                      {TRIGGER_KINDS.map(value => <option key={value} value={value}>{t(`flow.trigger.${value}`)}</option>)}
                    </select>
                  </label>
                  {kind !== 'startup' && (
                    <label className="flow-field"><span>{t('automation.time')}</span><input type="time" value={time} onChange={event => setTime(event.target.value)} /></label>
                  )}
                  {kind === 'weekly' && (
                    <label className="flow-field"><span>{t('automation.day')}</span>
                      <select value={dayOfWeek} onChange={event => setDayOfWeek(event.target.value as DayOfWeek)}>
                        {DAYS.map(day => <option key={day} value={day}>{t(`automation.day.${day}`)}</option>)}
                      </select>
                    </label>
                  )}
                  {kind === 'monthly' && (
                    <label className="flow-field"><span>{t('automation.day')}</span>
                      <input type="number" min={1} max={28} value={dayOfMonth} onChange={event => setDayOfMonth(Math.max(1, Math.min(28, Number(event.target.value) || 1)))} />
                    </label>
                  )}
                  <div className="flow-composer__actions">
                    <button type="button" className="world-control" onClick={() => setComposing(false)}>{t('flow.composer.cancel')}</button>
                    <button type="submit" className="world-control world-control--primary"><CalendarClock size={15} />{t('automation.create')}</button>
                  </div>
                  <p className="flow-composer__foot">{t('flow.composer.foot')}</p>
                </form>
              )}

              {visibleSchedules.length > 0 && (
                <section className="flow-lib__section">
                  <header><span>{t('flow.library.saved')}</span><small>{t('flow.library.savedHint')}</small></header>
                  {visibleSchedules.map(item => {
                    const active = !working && selectedScheduleId === item.id;
                    return (
                      <div key={item.id} className={`flow-item${active ? ' flow-item--active' : ''}`} data-active={active}>
                        <button type="button" className="flow-item__main" onClick={() => selectSchedule(item)}>
                          <span className="flow-item__icon"><CalendarClock size={15} /></span>
                          <span className="flow-item__copy">
                            <strong>{item.label}</strong>
                            <small>{triggerSummary({ ...defaultConfig(), ...configFromTrigger(item.trigger) }, t)} · {item.enabled ? t('automation.enabled') : t('automation.paused')}</small>
                          </span>
                          <span className="flow-item__badge flow-item__badge--real">{t('flow.library.real')}</span>
                        </button>
                        <div className="flow-item__actions">
                          <button type="button" onClick={() => void toggle(item)} aria-label={t('automation.toggle')} title={t('automation.toggle')}><Power size={13} /></button>
                          <button type="button" onClick={() => void runNow(item.id)} aria-label={t('automation.runNow')} title={t('automation.runNow')}><Play size={13} /></button>
                          <button type="button" className="danger" onClick={() => void remove(item.id)} aria-label={t('automation.remove')} title={t('automation.remove')}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}

              {visibleTemplates.length > 0 && (
                <section className="flow-lib__section">
                  <header><span>{t('flow.library.templateSection')}</span><small>{t('flow.library.templateHint')}</small></header>
                  {visibleTemplates.map(template => (
                    <div key={template.id} className="flow-item flow-item--template">
                      <button type="button" className="flow-item__main" onClick={() => loadTemplate(template)}>
                        <span className="flow-item__icon"><LayoutTemplate size={15} /></span>
                        <span className="flow-item__copy">
                          <strong>{t(template.nameKey)}</strong>
                          <small>{t(template.descKey)}</small>
                        </span>
                        <span className="flow-item__badge">{t('flow.library.templateBadge')}</span>
                      </button>
                      <div className="flow-item__actions">
                        <button type="button" onClick={() => loadTemplate(template)} aria-label={t('flow.template.use')} title={t('flow.template.use')}><Plus size={13} /></button>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {visibleDrafts.length > 0 && (
                <section className="flow-lib__section">
                  <header><span>{t('flow.library.draftSection')}</span><small>{t('flow.library.draftHint')}</small></header>
                  {visibleDrafts.map(draft => {
                    const isWorking = draft.id === '__working__';
                    const active = Boolean(working) && (isWorking || working?.savedId === draft.id);
                    return (
                      <div key={draft.id} className={`flow-item flow-item--draft${active ? ' flow-item--active' : ''}`} data-active={active}>
                        <button type="button" className="flow-item__main" onClick={() => { if (!isWorking) loadDraft(draft); }}>
                          <span className="flow-item__icon"><FileClock size={15} /></span>
                          <span className="flow-item__copy">
                            <strong>{draft.name}</strong>
                            <small>
                              {isWorking
                                ? `${t('flow.library.working')} · ${working?.savedId && !working.dirty ? t('flow.library.savedInSession') : t('flow.library.unsaved')}`
                                : `${t('flow.draft.sessionOnly')} · ${draft.nodes.length} ${t('flow.canvas.nodeCount')}`}
                            </small>
                          </span>
                          <span className="flow-item__badge">{t('flow.library.draftBadge')}</span>
                        </button>
                        {isWorking && (
                          <div className="flow-item__actions">
                            <button type="button" onClick={saveDraft} aria-label={t('flow.preview.saveDraft')} title={t('flow.preview.saveDraft')}><Save size={13} /></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              )}

              {!anyVisible && !composing && (
                <p className="flow-lib__empty">{query || category !== 'all' ? t('flow.library.empty') : t('flow.library.noSchedules')}</p>
              )}
            </div>

            <footer className="flow-lib__foot">
              <ShieldCheck size={14} aria-hidden="true" />
              <div><strong>{t('flow.library.private')}</strong><small>{t('flow.library.privateNote')}</small></div>
            </footer>
          </aside>

          <section className="flow-canvas" aria-label={t('flow.canvas.title')}>
            <header className="flow-canvas__bar">
              <div className="flow-canvas__name">
                {working ? (
                  <input
                    className="flow-canvas__rename"
                    value={working.name}
                    onChange={event => setWorking({ ...working, name: event.target.value, dirty: true })}
                    aria-label={t('flow.draft.name')}
                  />
                ) : (
                  <strong>{activeSchedule?.label ?? t('flow.canvas.title')}</strong>
                )}
                <span className={`flow-canvas__mode${readOnly ? ' flow-canvas__mode--real' : ''}`}>{modeLabel}</span>
              </div>
              <div className="flow-canvas__tools">
                {!readOnly && (
                  <div className="flow-add">
                    <select value={addKind} onChange={event => setAddKind(event.target.value as NodeKind)} aria-label={t('flow.canvas.addType')}>
                      {(['trigger', 'condition', 'action', 'approval', 'result'] as NodeKind[]).map(value => (
                        <option key={value} value={value}>{t(`flow.kind.${value}`)}</option>
                      ))}
                    </select>
                    <button type="button" className="world-control" onClick={addNode}><Plus size={14} />{t('flow.canvas.add')}</button>
                  </div>
                )}
                <div className="flow-zoom" role="group" aria-label={t('flow.canvas.zoom')}>
                  <button type="button" onClick={() => adjustZoom(-0.1)} aria-label={t('flow.canvas.zoomOut')}><ZoomOut size={14} /></button>
                  <span>{Math.round(zoom * 100)}%</span>
                  <button type="button" onClick={() => adjustZoom(0.1)} aria-label={t('flow.canvas.zoomIn')}><ZoomIn size={14} /></button>
                  <button type="button" onClick={applyFit} aria-label={t('flow.canvas.fit')} title={t('flow.canvas.fit')}><Maximize2 size={14} /></button>
                </div>
              </div>
            </header>

            <div
              ref={canvasRef}
              className={`flow-canvas__viewport${panning ? ' is-panning' : ''}`}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={endPan}
              onPointerCancel={endPan}
              onWheel={event => {
                if (!event.ctrlKey) return;
                event.preventDefault();
                adjustZoom(event.deltaY > 0 ? -0.08 : 0.08);
              }}
            >
              {nodes.length > 0 ? (
                <div
                  className="flow-canvas__world"
                  dir="ltr"
                  style={{ width: WORLD_W, height: worldHeight, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                >
                  <svg className="flow-wires" width={WORLD_W} height={worldHeight} aria-hidden="true">
                    <defs>
                      <linearGradient id="flow-wire-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--flow-node-trigger)" stopOpacity=".64" />
                        <stop offset="100%" stopColor="var(--flow-node-approval)" stopOpacity=".7" />
                      </linearGradient>
                    </defs>
                    {nodes.slice(0, -1).map((node, index) => {
                      const top = nodeTop(index) + NODE_H;
                      const bottom = nodeTop(index + 1);
                      const mid = top + (bottom - top) / 2;
                      return (
                        <g key={`wire-${node.id}`} className="flow-wire">
                          <path d={`M ${WORLD_W / 2} ${top} L ${WORLD_W / 2} ${bottom}`} />
                          <circle cx={WORLD_W / 2} cy={mid} r="3.5" />
                          <circle cx={WORLD_W / 2} cy={mid} r="8" className="flow-wire__halo" />
                        </g>
                      );
                    })}
                  </svg>
                  {nodes.map((node, index) => {
                    const Icon = kindIcons[node.kind];
                    const status = nodeStatus(node, issues, t);
                    const selected = selectedNodeId === node.id;
                    return (
                      <div
                        key={node.id}
                        className={`flow-node flow-node--${node.kind}${selected ? ' is-selected' : ''}${previewStep === index ? ' is-preview' : ''}`}
                        style={{ top: nodeTop(index), left: (WORLD_W - NODE_W) / 2, width: NODE_W, height: NODE_H }}
                        data-kind={node.kind}
                      >
                        <button
                          type="button"
                          className="flow-node__hit"
                          aria-pressed={selected}
                          aria-label={`${node.title.trim() || t(defaultTitleKey(node.kind))} — ${t(`flow.kind.${node.kind}`)}`}
                          onClick={() => selectNode(node, index)}
                        />
                        <span className="flow-node__glyph" aria-hidden="true"><Icon size={17} /></span>
                        <div className="flow-node__copy">
                          <div className="flow-node__kicker">
                            <span className="flow-node__step" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                            <span className="flow-node__kind">{t(`flow.kind.${node.kind}`)}</span>
                          </div>
                          <strong className="flow-node__title" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                            {node.title.trim() || t(defaultTitleKey(node.kind))}
                          </strong>
                          <small className="flow-node__sub" dir={locale === 'ar' ? 'rtl' : 'ltr'}>{nodeSubtitle(node, t)}</small>
                          <span className={`flow-node__status flow-node__status--${status.tone}`}>{status.label}</span>
                        </div>
                        {!readOnly && (
                          <button
                            type="button"
                            className="flow-node__remove"
                            onClick={() => removeNode(node.id)}
                            onPointerDown={event => event.stopPropagation()}
                            aria-label={t('flow.canvas.removeNode')}
                            title={t('flow.canvas.removeNode')}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flow-canvas__empty">
                  <CircleDashed size={28} aria-hidden="true" />
                  <strong>{t('flow.canvas.selectPrompt')}</strong>
                </div>
              )}
              <div className="flow-canvas__hud" aria-hidden="true">
                <span>{nodes.length} {t('flow.canvas.nodeCount')}</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
            </div>

            <footer className="flow-canvas__foot">
              <p><Lock size={13} aria-hidden="true" />{readOnly ? t('flow.canvas.realEditNote') : t('flow.canvas.draftEditNote')}</p>
              <span className={errors.length ? 'is-bad' : 'is-good'}>
                {errors.length
                  ? <><AlertTriangle size={13} aria-hidden="true" />{errors.length} {t('flow.valid.errors')}</>
                  : <><CheckCircle2 size={13} aria-hidden="true" />{issues.length ? `${warnings.length} ${t('flow.valid.warnings')}` : t('flow.valid.checksPass')}</>}
              </span>
            </footer>
          </section>

          <aside className="flow-config" aria-label={t('flow.config.title')}>
            <header className="flow-config__head">
              <div><h3>{t('flow.config.title')}</h3><p>{t('flow.canvas.hint')}</p></div>
              {readOnly && <span className="flow-config__ro"><Lock size={11} />{t('flow.config.readOnly')}</span>}
            </header>

            {!selectedNode ? (
              <div className="flow-config__empty"><CircleDashed size={24} /><p>{t('flow.config.none')}</p></div>
            ) : (
              <div className="flow-config__scroll">
                <div className={`flow-config__identity flow-config__identity--${selectedNode.kind}`}>
                  <span className="flow-node__glyph" aria-hidden="true">{(() => { const Icon = kindIcons[selectedNode.kind]; return <Icon size={17} />; })()}</span>
                  <div>
                    <strong>{selectedNode.title.trim() || t(defaultTitleKey(selectedNode.kind))}</strong>
                    <small>{t(`flow.kind.${selectedNode.kind}`)}</small>
                  </div>
                  <span className={`flow-node__status flow-node__status--${nodeStatus(selectedNode, issues, t).tone}`}>{nodeStatus(selectedNode, issues, t).label}</span>
                </div>

                {activeSchedule && (
                  <section className="flow-config__section flow-config__section--schedule">
                    <h4>{t('flow.config.scheduleControls')}</h4>
                    <div className="flow-schedule-controls">
                      <button type="button" className="world-control" onClick={() => void toggle(activeSchedule)}>
                        <Power size={14} />{activeSchedule.enabled ? t('automation.pause') : t('automation.resume')}
                      </button>
                      <button type="button" className="world-control" onClick={() => void runNow(activeSchedule.id)}>
                        <Play size={14} />{t('automation.runNow')}
                      </button>
                      <button type="button" className="world-control world-control--danger" onClick={() => void remove(activeSchedule.id)}>
                        <Trash2 size={14} />{t('automation.delete')}
                      </button>
                    </div>
                    <p className="flow-config__last">
                      {activeSchedule.lastRun ? (
                        <>
                          <span>{t('flow.config.lastRun')}</span>
                          <b>{formatDateTime(activeSchedule.lastRun.finishedAt, locale)}</b>
                          <em className={activeSchedule.lastRun.success ? 'good' : 'bad'}>
                            {activeSchedule.lastRun.success ? t('flow.preview.eventSuccess') : t('flow.preview.eventFailure')}
                          </em>
                        </>
                      ) : <span>{t('flow.config.neverRun')}</span>}
                    </p>
                  </section>
                )}

                <section className="flow-config__section">
                  <h4>{t('flow.config.general')}</h4>
                  <label className="flow-field">
                    <span>{t('flow.config.nodeTitle')}</span>
                    <input
                      value={selectedNode.title}
                      placeholder={t(defaultTitleKey(selectedNode.kind))}
                      onChange={event => patchNode({ title: event.target.value })}
                      disabled={readOnly}
                    />
                    <small>{t('flow.config.nodeTitleHint')}</small>
                  </label>
                </section>

                {selectedNode.kind === 'trigger' && (
                  <section className="flow-config__section">
                    <h4>{t('flow.config.trigger')}</h4>
                    <div className="flow-config__grid">
                      <label className="flow-field">
                        <span>{t('flow.config.triggerKind')}</span>
                        <select value={selectedNode.config.triggerKind} onChange={event => patchNode({ config: { triggerKind: event.target.value as TriggerKind } })} disabled={readOnly}>
                          {TRIGGER_KINDS.map(value => <option key={value} value={value}>{t(`flow.trigger.${value}`)}</option>)}
                        </select>
                      </label>
                      {selectedNode.config.triggerKind !== 'startup' && (
                        <label className="flow-field">
                          <span>{t('automation.time')}</span>
                          <input type="time" value={selectedNode.config.time} onChange={event => patchNode({ config: { time: event.target.value } })} disabled={readOnly} />
                        </label>
                      )}
                      {selectedNode.config.triggerKind === 'weekly' && (
                        <label className="flow-field">
                          <span>{t('automation.day')}</span>
                          <select value={selectedNode.config.dayOfWeek} onChange={event => patchNode({ config: { dayOfWeek: event.target.value as DayOfWeek } })} disabled={readOnly}>
                            {DAYS.map(day => <option key={day} value={day}>{t(`automation.day.${day}`)}</option>)}
                          </select>
                        </label>
                      )}
                      {selectedNode.config.triggerKind === 'monthly' && (
                        <label className="flow-field">
                          <span>{t('automation.day')}</span>
                          <input
                            type="number" min={1} max={28} value={selectedNode.config.dayOfMonth} disabled={readOnly}
                            onChange={event => patchNode({ config: { dayOfMonth: Math.max(1, Math.min(28, Number(event.target.value) || 1)) } })}
                          />
                        </label>
                      )}
                    </div>
                    <p className="flow-config__note"><Clock3 size={13} />{triggerSummary(selectedNode.config, t)}</p>
                  </section>
                )}

                {selectedNode.kind === 'condition' && (
                  <section className="flow-config__section">
                    <h4>{t('flow.config.condition')}</h4>
                    <div className="flow-config__grid">
                      <label className="flow-field">
                        <span>{t('flow.config.conditionField')}</span>
                        <select value={selectedNode.config.conditionField} onChange={event => patchNode({ config: { conditionField: event.target.value as ConditionField } })} disabled={readOnly}>
                          <option value="warnings">{t('flow.field.warnings')}</option>
                          <option value="candidates">{t('flow.field.candidates')}</option>
                          <option value="freeSpace">{t('flow.field.freeSpace')}</option>
                          <option value="always">{t('flow.field.always')}</option>
                        </select>
                      </label>
                      <label className="flow-field">
                        <span>{t('flow.config.conditionOp')}</span>
                        <select
                          value={selectedNode.config.conditionOp}
                          disabled={readOnly || selectedNode.config.conditionField === 'always'}
                          onChange={event => patchNode({ config: { conditionOp: event.target.value as ConditionOp } })}
                        >
                          <option value="atLeast">{t('flow.op.atLeast')}</option>
                          <option value="atMost">{t('flow.op.atMost')}</option>
                          <option value="equals">{t('flow.op.equals')}</option>
                        </select>
                      </label>
                      <label className="flow-field flow-field--wide">
                        <span>{t('flow.config.conditionValue')}</span>
                        <input
                          type="number" min={0} value={selectedNode.config.conditionValue}
                          disabled={readOnly || selectedNode.config.conditionField === 'always'}
                          onChange={event => patchNode({ config: { conditionValue: event.target.value } })}
                        />
                      </label>
                    </div>
                    <p className="flow-config__note"><GitBranch size={13} />{conditionSummary(selectedNode.config, t)}</p>
                    {issues.filter(issue => issue.nodeId === selectedNode.id).map(issue => (
                      <p key={issue.key} className="flow-config__issue"><AlertTriangle size={13} />{t(issue.key)}</p>
                    ))}
                    <p className="flow-config__hintText">{t('flow.config.conditionHint')}</p>
                  </section>
                )}

                {selectedNode.kind === 'action' && (
                  <section className="flow-config__section">
                    <h4>{t('flow.config.action')}</h4>
                    <label className="flow-field">
                      <span>{t('flow.config.tool')}</span>
                      <select value={selectedNode.config.toolId} onChange={event => patchNode({ config: { toolId: event.target.value as ToolId } })} disabled={readOnly}>
                        {TOOL_IDS.map(id => <option key={id} value={id}>{t(`tools.${id}.name`)}</option>)}
                      </select>
                    </label>
                    <p className="flow-config__hintText">{t('flow.config.actionHint')}</p>
                  </section>
                )}

                {selectedNode.kind === 'approval' && (
                  <section className="flow-config__section">
                    <h4>{t('flow.config.approval')}</h4>
                    <div className="flow-config__grid">
                      <label className="flow-field">
                        <span>{t('flow.config.approvalMode')}</span>
                        <select value={selectedNode.config.approvalMode} onChange={event => patchNode({ config: { approvalMode: event.target.value as ApprovalMode } })} disabled={readOnly}>
                          <option value="always">{t('flow.approval.always')}</option>
                          <option value="warnings">{t('flow.approval.warnings')}</option>
                          <option value="never">{t('flow.approval.never')}</option>
                        </select>
                      </label>
                      <label className="flow-field">
                        <span>{t('flow.config.notify')}</span>
                        <select value={selectedNode.config.notify} onChange={event => patchNode({ config: { notify: event.target.value as NotifyMode } })} disabled={readOnly}>
                          <option value="inApp">{t('flow.notify.inApp')}</option>
                          <option value="windows" disabled>{t('flow.notify.windows')} — {t('flow.notify.unavailable')}</option>
                          <option value="email" disabled>{t('flow.notify.email')} — {t('flow.notify.unavailable')}</option>
                        </select>
                      </label>
                    </div>
                    <p className="flow-config__note"><UserCheck size={13} />{approvalSummary(selectedNode.config, t)}</p>
                    <p className="flow-config__hintText">{t('flow.config.notifyHint')}</p>
                  </section>
                )}

                {selectedNode.kind === 'result' && (
                  <section className="flow-config__section">
                    <h4>{t('flow.config.result')}</h4>
                    <label className="flow-field">
                      <span>{t('flow.config.retention')}</span>
                      <select value={selectedNode.config.retention} onChange={event => patchNode({ config: { retention: event.target.value as Retention } })} disabled={readOnly}>
                        <option value="10">{t('flow.retention.10')}</option>
                        <option value="25">{t('flow.retention.25')}</option>
                        <option value="50">{t('flow.retention.50')}</option>
                      </select>
                    </label>
                    <p className="flow-config__hintText">{t('flow.config.retentionHint')}</p>
                  </section>
                )}

                <section className="flow-config__section">
                  <h4>{t('flow.config.errorHandling')}</h4>
                  <div className="flow-config__grid">
                    <label className="flow-field">
                      <span>{t('flow.config.retry')}</span>
                      <select value={selectedNode.config.retry} onChange={event => patchNode({ config: { retry: event.target.value as RetryMode } })} disabled={readOnly}>
                        <option value="none">{t('flow.retry.none')}</option>
                        <option value="once">{t('flow.retry.once')}</option>
                        <option value="twice">{t('flow.retry.twice')}</option>
                      </select>
                    </label>
                    <label className="flow-field">
                      <span>{t('flow.config.onFailure')}</span>
                      <select value={selectedNode.config.failure} onChange={event => patchNode({ config: { failure: event.target.value as FailureMode } })} disabled={readOnly}>
                        <option value="pause">{t('flow.failure.pause')}</option>
                        <option value="disable">{t('flow.failure.disable')}</option>
                        <option value="keep">{t('flow.failure.keep')}</option>
                      </select>
                    </label>
                  </div>
                </section>

                <section className="flow-config__section flow-config__section--safety">
                  <h4>{t('flow.config.safety')}</h4>
                  <p className="flow-config__safety"><ShieldCheck size={14} />{t('flow.config.permissions')}</p>
                  <p className="flow-config__hintText">{readOnly ? t('flow.canvas.realEditNote') : t('flow.config.draftNote')}</p>
                </section>

                {!readOnly && (
                  <section className="flow-config__section">
                    <h4>{t('flow.config.validation')}</h4>
                    {issues.length === 0
                      ? <p className="flow-config__safety flow-config__safety--good"><CheckCircle2 size={14} />{t('flow.config.validationOk')}</p>
                      : (
                        <ul className="flow-config__issues">
                          {issues.map((issue, index) => (
                            <li key={`${issue.key}-${index}`} className={issue.tone}>
                              {issue.tone === 'error' ? <AlertTriangle size={13} /> : <CircleDashed size={13} />}
                              {t(issue.key)}
                            </li>
                          ))}
                        </ul>
                      )}
                    <button type="button" className="flow-remove" onClick={() => removeNode(selectedNode.id)}>
                      <Trash2 size={14} />{t('flow.config.remove')}
                    </button>
                  </section>
                )}
              </div>
            )}
          </aside>
        </div>

        <section className={`flow-preview${previewOpen ? '' : ' flow-preview--collapsed'}`} ref={previewRef} aria-label={t('flow.preview.title')}>
          <header className="flow-preview__head">
            <div className="flow-preview__title">
              <span className="flow-preview__icon"><FlaskConical size={17} /></span>
              <div>
                <h3>{t('flow.preview.title')}</h3>
                <p>{readOnly ? t('flow.canvas.realView') : t('flow.canvas.designDraft')}</p>
              </div>
              <span className={`flow-preview__chip${readOnly ? ' flow-preview__chip--real' : ''}`}>
                {readOnly ? <CalendarClock size={12} /> : <FlaskConical size={12} />}
                {readOnly ? t('flow.preview.real') : t('flow.preview.design')}
              </span>
            </div>
            <div className="flow-preview__tools">
              <button type="button" className="world-control" onClick={() => {
                if (!nodes.length) return;
                const next = (previewStep + 1) % nodes.length;
                setPreviewStep(next);
                setSelectedNodeId(nodes[next].id);
              }} disabled={!nodes.length}>
                <Play size={13} />{t('flow.preview.stepThrough')}
              </button>
              <button type="button" className="world-control" aria-pressed={previewView === 'inputs'} onClick={() => setPreviewView(previewView === 'inputs' ? 'summary' : 'inputs')}>
                <ListChecks size={13} />{t('flow.preview.inspect')}
              </button>
              <button type="button" className="world-control" aria-pressed={previewView === 'permissions'} onClick={() => setPreviewView(previewView === 'permissions' ? 'summary' : 'permissions')}>
                <ShieldCheck size={13} />{t('flow.preview.reviewPerm')}
              </button>
              {working && (
                <button type="button" className="world-control world-control--primary" onClick={saveDraft} disabled={!canSave}>
                  <Save size={13} />{t('flow.preview.saveDraft')}
                </button>
              )}
              <button type="button" className="flow-icon" onClick={() => setPreviewOpen(value => !value)} aria-label={previewOpen ? t('flow.preview.hide') : t('flow.preview.show')} title={previewOpen ? t('flow.preview.hide') : t('flow.preview.show')}>
                {previewOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>
          </header>

          {previewOpen && (
            <div className="flow-preview__body">
              <div className="flow-preview__statusrow">
                <div className="flow-preview__chips">
                  <span className={`flow-preview__pill${errors.length ? ' is-bad' : ' is-good'}`}>
                    {errors.length ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                    {errors.length
                      ? `${errors.length} ${t('flow.valid.errors')}`
                      : warnings.length
                        ? `${warnings.length} ${t('flow.valid.warnings')}`
                        : t('flow.valid.checksPass')}
                  </span>
                  <span className="flow-preview__pill"><Lock size={12} />{t('flow.preview.readOnlyGate')}</span>
                  <span className="flow-preview__pill"><GitBranch size={12} />{t('flow.preview.noEngine')}</span>
                </div>
                <span className="flow-preview__stepnow">
                  {previewNode ? `${String(previewStep + 1).padStart(2, '0')} / ${String(nodes.length).padStart(2, '0')} · ${previewNode.title.trim() || t(defaultTitleKey(previewNode.kind))}` : null}
                </span>
              </div>

              <div className="flow-preview__layout">
                <div className="flow-preview__steps">
                  <h4>{t('flow.preview.steps')}</h4>
                  <ol>
                    {nodes.map((node, index) => (
                      <li key={node.id}>
                        <button
                          type="button"
                          className={previewStep === index ? 'is-current' : ''}
                          onClick={() => { setPreviewStep(index); setSelectedNodeId(node.id); }}
                        >
                          <b aria-hidden="true">{index + 1}</b>
                          <span>
                            <strong>{node.title.trim() || t(defaultTitleKey(node.kind))}</strong>
                            <small>{t(`flow.kind.${node.kind}`)}</small>
                          </span>
                          <em>{nodeSubtitle(node, t)}</em>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flow-preview__detail">
                  {previewView === 'summary' && (
                    <>
                      <div className="flow-preview__cards">
                        <article>
                          <h4><ArrowRight size={12} />{t('flow.preview.inputs')}</h4>
                          <dl>
                            <div><dt>{t('flow.kind.trigger')}</dt><dd>{triggerSummary(nodes.find(node => node.kind === 'trigger')?.config ?? defaultConfig(), t)}</dd></div>
                            <div><dt>{t('flow.kind.condition')}</dt><dd>{conditionSummary(nodes.find(node => node.kind === 'condition')?.config ?? defaultConfig(), t)}</dd></div>
                            <div><dt>{t('flow.kind.action')}</dt><dd>{t(`tools.${nodes.find(node => node.kind === 'action')?.config.toolId ?? 'smart-scan'}.name`)}</dd></div>
                            <div><dt>{t('flow.kind.approval')}</dt><dd>{approvalSummary(nodes.find(node => node.kind === 'approval')?.config ?? defaultConfig(), t)}</dd></div>
                          </dl>
                          <p>{t('flow.preview.inputsNote')}</p>
                        </article>
                        <article>
                          <h4><FileClock size={12} />{t('flow.preview.output')}</h4>
                          <p>{t('flow.preview.outputDefault')}</p>
                          <span className="flow-preview__schema" dir="ltr">{"{ success, summary, items[], warnings[] }"}</span>
                        </article>
                      </div>
                      <article className="flow-preview__events">
                        <h4><History size={12} />{t('flow.preview.events')}</h4>
                        {readOnly && activeSchedule?.lastRun ? (
                          <div className="flow-preview__event">
                            <span className={activeSchedule.lastRun.success ? 'dot good' : 'dot bad'} aria-hidden="true" />
                            <div>
                              <strong>{t('flow.preview.eventHead')}</strong>
                              <small>{formatDateTime(activeSchedule.lastRun.finishedAt, locale)} · {activeSchedule.lastRun.success ? t('flow.preview.eventSuccess') : t('flow.preview.eventFailure')}</small>
                            </div>
                          </div>
                        ) : (
                          <p className="flow-preview__muted">{readOnly ? t('flow.preview.eventPending') : t('flow.preview.noEvents')}</p>
                        )}
                      </article>
                    </>
                  )}

                  {previewView === 'inputs' && (
                    <article className="flow-preview__inspect">
                      <h4><ListChecks size={13} />{t('flow.preview.inputs')}</h4>
                      <dl>
                        {nodes.map(node => (
                          <div key={node.id}>
                            <dt>{node.title.trim() || t(defaultTitleKey(node.kind))}</dt>
                            <dd>{nodeSubtitle(node, t)}</dd>
                          </div>
                        ))}
                      </dl>
                      <p>{t('flow.preview.inputsNote')}</p>
                      <h4><FileClock size={13} />{t('flow.preview.output')}</h4>
                      <p>{t('flow.preview.outputDefault')}</p>
                    </article>
                  )}

                  {previewView === 'permissions' && (
                    <article className="flow-preview__inspect">
                      <h4><ShieldCheck size={13} />{t('flow.preview.permissions')}</h4>
                      <ul className="flow-preview__perms">
                        <li><ShieldCheck size={13} /><div><strong>{t('flow.preview.perm.task')}</strong><small>{readOnly ? t('flow.preview.perm.taskReal') : t('flow.preview.perm.taskDraft')}</small></div><em>{readOnly ? t('flow.preview.perm.task') : t('flow.preview.permissionDraft')}</em></li>
                        <li><ShieldCheck size={13} /><div><strong>{t('flow.preview.readOnlyGate')}</strong><small>{t('flow.preview.perm.readOnly')}</small></div><em>{t('flow.preview.permissionAllowed')}</em></li>
                        <li><ShieldCheck size={13} /><div><strong>{t('svc.preview.admin')}</strong><small>{t('flow.preview.perm.admin')}</small></div><em>{t('flow.preview.permissionAllowed')}</em></li>
                        <li><ShieldCheck size={13} /><div><strong>{t('flow.preview.perm.files')}</strong><small>{t('flow.config.permissions')}</small></div><em>{t('flow.preview.permissionAllowed')}</em></li>
                        <li><GitBranch size={13} /><div><strong>{t('flow.preview.noEngine')}</strong><small>{t('flow.preview.perm.engine')}</small></div><em>{t('flow.preview.permissionDraft')}</em></li>
                      </ul>
                    </article>
                  )}
                </div>
              </div>

              <footer className="flow-preview__foot">
                <p className="flow-preview__gate">
                  <Lock size={13} />
                  {readOnly ? t('flow.canvas.realEditNote') : t('flow.preview.executionDisabled')}
                </p>
                <div className="flow-preview__footactions">
                  {readOnly && activeSchedule ? (
                    <button type="button" className="flow-run" onClick={() => void runNow(activeSchedule.id)}>
                      <Play size={14} />{t('flow.preview.runSchedule')}
                    </button>
                  ) : (
                    <button type="button" className="flow-run" disabled title={t('flow.preview.executionDisabled')}>
                      <Play size={14} />{t('automation.runNow')}
                    </button>
                  )}
                  <span className="flow-preview__note">{readOnly ? t('flow.stat.enabledDetail') : t('flow.template.designOnly')}</span>
                </div>
              </footer>
            </div>
          )}
        </section>
      </div>

      <ServicesRail
        world="automation"
        titleKey="svc.services.title"
        hintKey="svc.services.hint"
        liveKey="world.page.liveOf"
        t={t}
        locale={locale}
      />
    </Stage>
  );
}

/**
 * The trigger data a real schedule carries, shaped like a node config's trigger
 * fields. The other fields are irrelevant and come from defaultConfig().
 */
function configFromTrigger(trigger: AutomationTrigger): Partial<NodeConfig> {
  const base: Partial<NodeConfig> = { triggerKind: trigger.kind };
  if ('time' in trigger) base.time = trigger.time;
  if ('dayOfWeek' in trigger) base.dayOfWeek = trigger.dayOfWeek;
  if ('dayOfMonth' in trigger) base.dayOfMonth = trigger.dayOfMonth;
  return base;
}

function countCategory(
  category: FlowCategory,
  automations: AutomationSchedule[],
  working: WorkingDraft | null,
  savedDrafts: StudioDraft[]
): number {
  const real = automations.filter(item => categoryForTool(item.toolId) === category).length;
  const template = TEMPLATES.filter(item => item.category === category).length;
  const drafts = [...savedDrafts, ...(working ? [{ id: '__working__', name: working.name, nodes: working.nodes, updatedAt: '' }] : [])]
    .filter(draft => {
      const actionTool = draft.nodes.find(node => node.kind === 'action')?.config.toolId;
      return actionTool ? categoryForTool(actionTool) === category : category === 'scans';
    }).length;
  return real + template + drafts;
}
