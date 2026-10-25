/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Network,
  Plus,
  FolderOpen,
  Save,
  Play,
  Clock,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Folder,
  FileText,
  Image,
  Archive,
  Download,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minus,
  Square,
  Map,
  CheckCircle2,
  AlertTriangle,
  User,
  Sliders,
  Settings,
  HelpCircle,
  X,
  Languages,
  Calendar,
  Bell,
  Moon,
  Battery,
  Trash2,
  Database,
  LayoutGrid,
  Zap,
  Shield,
  Layers,
  Sparkles,
  BarChart2,
  ShieldCheck,
  Check,
  ArrowRight,
  Eye,
  CheckSquare
} from 'lucide-react';

import {
  INITIAL_FLOW_NODES,
  AUTOMATION_SERVICE_CARDS,
  INITIAL_OPERATION_STAGES,
  SAVED_WORKFLOWS_CATALOG,
  TEMPLATES_CATALOG,
  WORKFLOW_CATEGORIES,
  FlowNodeItem,
  AutomationServiceCard,
  OperationPreviewStage,
  SavedWorkflowItem,
  WorkflowTemplateItem
} from '../lib/automation-inventory';
import { AutomationWorkspaces } from '../components/automation/AutomationWorkspaces';
import { DesignPreviewModal } from '../components/common/DesignPreviewModal';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import { useNavigation } from '../context/NavigationContext';
import '../automation.css';

interface AutomationPageProps {
  onNavigateSection?: (section: string) => void;
}

export function AutomationPage({ onNavigateSection }: AutomationPageProps) {
  const { navigateTo, isActive, isArabic, toggleLocale } = useNavigation();
  // Active workflow tab
  const [activeTab, setActiveTab] = useState<string>('Document Verification Flow');

  // Zoom percentage
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Selected flow node (defaults to node-approval: Require User Approval)
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-approval');

  // Flow nodes list state
  const [flowNodes, setFlowNodes] = useState<FlowNodeItem[]>(INITIAL_FLOW_NODES);

  // Library search and tab
  const [librarySearch, setLibrarySearch] = useState<string>('');
  const [libraryFilter, setLibraryFilter] = useState<'All' | 'Workflows' | 'Templates'>('All');

  // Node Configuration active tab
  const [configTab, setConfigTab] = useState<'General' | 'Conditions' | 'Notifications' | 'Advanced'>('General');

  // Node configuration editable values for currently selected node
  const currentNode = useMemo(() => {
    return flowNodes.find(n => n.id === selectedNodeId) || flowNodes[3];
  }, [flowNodes, selectedNodeId]);

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'step-through' | 'inspect-inputs' | 'review-permissions' | 'new-workflow' | null
  >(null);

  // Specialized service workspace (ServiceWorkspaceHost) — opened from the palette cards / History
  const [activeServiceWorkspace, setActiveServiceWorkspace] = useState<string | null>(null);

  // Draft name for the "New Workflow" picker
  const [workflowDraftName, setWorkflowDraftName] = useState<string>('');

  // Draft template selection for the "New Workflow" picker
  const [workflowDraftTemplate, setWorkflowDraftTemplate] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update node config field
  const handleUpdateConfig = (field: string, value: any) => {
    setFlowNodes(prev =>
      prev.map(node =>
        node.id === currentNode.id
          ? {
              ...node,
              config: {
                ...node.config,
                [field]: value
              }
            }
          : node
      )
    );
  };

  const handleAddFileType = () => {
    const ext = prompt('Enter file extension to add (e.g. TXT, CSV, JPG):');
    if (ext && ext.trim()) {
      const clean = ext.trim().toUpperCase().replace(/^\./, '');
      if (!currentNode.config.fileTypes.includes(clean)) {
        handleUpdateConfig('fileTypes', [...currentNode.config.fileTypes, clean]);
      }
    }
  };

  const handleRemoveFileType = (typeToRemove: string) => {
    handleUpdateConfig(
      'fileTypes',
      currentNode.config.fileTypes.filter(t => t !== typeToRemove)
    );
  };

  const handleCreateNewWorkflow = (name: string) => {
    setActiveTab(name);
    setToastMessage(`Created workflow draft: "${name}"`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className={`automation-viewport ${isArabic ? 'rtl' : 'ltr'} h-screen overflow-hidden`} dir={isArabic ? 'rtl' : 'ltr'}>
      
      {/* =========================================================================
         TOP CHROME TITLEBAR
         ========================================================================= */}
      <KNOuXTitleBar
        sectionName={isArabic ? "أتمتة العمليات" : "Automation"}
        sectionSubtitle={isArabic ? "استوديو التدفق البصري" : "Flow Studio"}
        onNavigateHome={() => (onNavigateSection ? onNavigateSection("home") : navigateTo("home"))}
        searchPlaceholder={isArabic ? "البحث في سير العمل والقوالب... (Ctrl+K)" : "Search workflows, triggers, templates... (Ctrl+K)"}
        isArabic={isArabic}
        onToggleArabic={toggleLocale}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 right-6 z-50 px-3.5 py-1.5 rounded-lg bg-purple-950/90 border border-purple-400/40 text-purple-200 text-xs shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* =========================================================================
         MAIN APPLICATION LAYOUT (SIDEBAR + CONTENT)
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <KNOuXSidebar
          activeSection="automation"
          onNavigate={(sec) => (onNavigateSection ? onNavigateSection(sec) : navigateTo(sec))}
          isArabic={isArabic}
        />

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* =========================================================================
             HERO HEADER BAR WITH ACTION BUTTONS
             ========================================================================= */}
          <div className="px-5 py-3 border-b border-slate-800/80 bg-[#081024]/70 flex items-center justify-between shrink-0">
            {/* Title & Subtitle */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600/40 via-indigo-600/40 to-cyan-500/30 border border-purple-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Flow Studio</h1>
                <p className="text-[11px] text-slate-400">
                  {isArabic
                    ? 'تصميم مسارات عمل ذكية محلية مع رؤية وتحكم كامل.'
                    : 'Design smart local workflows with full visibility and control.'}
                </p>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveModal('new-workflow')}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/40 border border-purple-400/30 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Workflow</span>
              </button>

              <button
                onClick={() => {
                  setToastMessage('Templates library opened');
                  setTimeout(() => setToastMessage(null), 2000);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Template</span>
              </button>

              <button
                onClick={() => {
                  setToastMessage('Draft saved locally');
                  setTimeout(() => setToastMessage(null), 2000);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>

              <button
                onClick={() => setActiveModal('step-through')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-cyan-300" />
                <span>Preview Flow</span>
              </button>

              <button
                onClick={() => setActiveServiceWorkspace('auto-run-history')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>History</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
             THREE-ZONE WORKSPACE (LIBRARY + FLOW CANVAS + INSPECTOR)
             ========================================================================= */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* -----------------------------------------------------------------------
               ZONE 1: WORKFLOW LIBRARY (LEFT ACCORDION)
               ----------------------------------------------------------------------- */}
            <div className="w-64 bg-[#070e1c] border-r border-slate-800/80 flex flex-col shrink-0 overflow-y-auto automation-custom-scrollbar p-3 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Workflow Library</span>
                <button className="text-slate-500 hover:text-slate-300">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              </div>

              {/* Search bar & filter */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search workflows, templates..."
                    value={librarySearch}
                    onChange={e => setLibrarySearch(e.target.value)}
                    className="w-full bg-[#0b1429] border border-slate-800 rounded-lg pl-7 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <button className="p-1.5 rounded bg-[#0b1429] border border-slate-800 text-slate-400 hover:text-slate-200">
                  <Filter className="w-3 h-3" />
                </button>
              </div>

              {/* Segmented Filter Pills */}
              <div className="grid grid-cols-3 gap-1 bg-[#050b18] p-1 rounded-lg border border-slate-800 text-[10.5px]">
                {(['All', 'Workflows', 'Templates'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setLibraryFilter(tab)}
                    className={`py-1 rounded font-medium text-center transition-colors ${
                      libraryFilter === tab
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Categories */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1 px-1">
                  <span className="flex items-center gap-1">
                    <ChevronDown className="w-3 h-3" />
                    Categories
                  </span>
                </div>
                <div className="space-y-0.5 text-xs">
                  {WORKFLOW_CATEGORIES.map(cat => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800/40 text-slate-300 cursor-pointer"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Folder className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate text-[11px]">{cat.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saved Workflows */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1 px-1">
                  <span className="flex items-center gap-1">
                    <ChevronDown className="w-3 h-3" />
                    Saved Workflows
                  </span>
                </div>
                <div className="space-y-1">
                  {SAVED_WORKFLOWS_CATALOG.map(wf => (
                    <div
                      key={wf.id}
                      onClick={() => setActiveTab(wf.title)}
                      className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        activeTab === wf.title
                          ? 'bg-purple-950/40 border-purple-500/40 text-white'
                          : 'bg-[#091224]/80 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded bg-black/40 border border-slate-800 text-cyan-400">
                          {wf.iconType === 'document' && <FileText className="w-3 h-3 text-emerald-400" />}
                          {wf.iconType === 'photo' && <Image className="w-3 h-3 text-pink-400" />}
                          {wf.iconType === 'archive' && <Archive className="w-3 h-3 text-amber-400" />}
                          {wf.iconType === 'download' && <Download className="w-3 h-3 text-cyan-400" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold truncate">{wf.title}</div>
                          <div className="text-[9.5px] text-slate-400 truncate">{wf.summary}</div>
                        </div>
                      </div>
                      <MoreHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Templates */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1 px-1">
                  <span className="flex items-center gap-1">
                    <ChevronDown className="w-3 h-3" />
                    Templates
                  </span>
                </div>
                <div className="space-y-1">
                  {TEMPLATES_CATALOG.map(tpl => (
                    <div
                      key={tpl.id}
                      onClick={() => setActiveTab(tpl.title)}
                      className="p-2 rounded-lg bg-[#091224]/80 border border-slate-800 hover:border-slate-700 text-slate-300 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded bg-black/40 border border-slate-800 text-indigo-400">
                          {tpl.iconType === 'scratch' && <Plus className="w-3 h-3 text-indigo-400" />}
                          {tpl.iconType === 'folder' && <Folder className="w-3 h-3 text-amber-400" />}
                          {tpl.iconType === 'media' && <Play className="w-3 h-3 text-rose-400" />}
                          {tpl.iconType === 'archive' && <Archive className="w-3 h-3 text-cyan-400" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold truncate">{tpl.title}</div>
                          <div className="text-[9.5px] text-slate-400 truncate">{tpl.summary}</div>
                        </div>
                      </div>
                      <MoreHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* -----------------------------------------------------------------------
               ZONE 2: VISUAL FLOW CANVAS (CENTER) + PALETTE + OPERATION PREVIEW
               ----------------------------------------------------------------------- */}
            <div className="flex-1 min-w-0 flex flex-col overflow-y-auto automation-custom-scrollbar">
              
              {/* Canvas Header Bar with Tabs & Zoom Controls */}
              <div className="h-9 bg-[#081024] border-b border-slate-800/80 px-3 flex items-center justify-between shrink-0 select-none">
                {/* Workflow Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  <div className="px-3 py-1 rounded-t-lg bg-[#0d172c] border-t border-x border-purple-500/40 text-xs font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    <span>{activeTab}</span>
                    <X className="w-3 h-3 text-slate-400 hover:text-white cursor-pointer" />
                  </div>
                  <button
                    onClick={() => setActiveModal('new-workflow')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Canvas Canvas Controls */}
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <button className="p-1 rounded hover:bg-slate-800 hover:text-white" title="Undo">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 rounded hover:bg-slate-800 hover:text-white" title="Redo">
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 rounded hover:bg-slate-800 hover:text-white" title="Fit to Screen">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center border border-slate-800 rounded px-1.5 py-0.5 bg-black/40 text-[11px] font-mono">
                    <button
                      onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                      className="px-1 hover:text-white"
                    >
                      −
                    </button>
                    <span className="px-1">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
                      className="px-1 hover:text-white"
                    >
                      +
                    </button>
                  </div>
                  <button className="p-1 rounded hover:bg-slate-800 hover:text-white" title="Minimap">
                    <Map className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Visual Node Graph Canvas Area */}
              <div className="flow-canvas-grid min-h-[340px] p-6 relative overflow-x-auto flex items-center">
                
                {/* 5 Nodes Horizontal Layout — fixed 132px cards + 38px gaps so the
                    connector geometry below always lands exactly on the ports. */}
                <div className="flex items-center gap-[38px] relative z-10 mx-auto shrink-0">
                  <svg className="flow-connector-svg" viewBox="0 0 812 340" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="flowLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="35%" stopColor="#ec4899" />
                        <stop offset="65%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                    {/* Visual connecting bezier lines between nodes (port to port) */}
                    <path
                      d="M 132 170 C 150 170, 152 170, 170 170"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      fill="none"
                      strokeDasharray="4 2"
                    />
                    <path
                      d="M 302 170 C 320 170, 322 170, 340 170"
                      stroke="#818cf8"
                      strokeWidth="2.5"
                      fill="none"
                    />
                    <path
                      d="M 472 170 C 490 170, 492 170, 510 170"
                      stroke="#38bdf8"
                      strokeWidth="3"
                      fill="none"
                    />
                    <path
                      d="M 642 170 C 660 170, 662 170, 680 170"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      fill="none"
                    />
                  </svg>

                  {flowNodes.map(node => {
                    const isSelected = node.id === selectedNodeId;
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`flow-node-card w-[132px] p-3 cursor-pointer flex flex-col justify-between text-center select-none relative z-10 ${
                          isSelected
                            ? 'flow-node-selected'
                            : node.color === 'teal'
                            ? 'flow-node-teal'
                            : node.color === 'pink'
                            ? 'flow-node-pink'
                            : 'flow-node-amber'
                        }`}
                      >
                        {/* Ports */}
                        {node.id !== 'node-start' && <div className="flow-port flow-port-left" />}
                        {node.id !== 'node-end' && <div className="flow-port flow-port-right" />}

                        {/* Top options icon */}
                        <div className="flex justify-end text-slate-500 mb-1">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </div>

                        {/* Node Icon */}
                        <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2 shadow-inner">
                          {node.iconType === 'play' && (
                            <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300">
                              <Play className="w-4 h-4 fill-cyan-400" />
                            </div>
                          )}
                          {node.iconType === 'file-check' && (
                            <div className="w-9 h-9 rounded-lg bg-pink-950 border border-pink-400 flex items-center justify-center text-pink-300">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          {node.iconType === 'folder' && (
                            <div className="w-9 h-9 rounded-lg bg-amber-950 border border-amber-400 flex items-center justify-center text-amber-300">
                              <Folder className="w-4 h-4" />
                            </div>
                          )}
                          {node.iconType === 'user' && (
                            <div className="w-9 h-9 rounded-full bg-purple-950 border border-purple-400 flex items-center justify-center text-purple-300">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                          {node.iconType === 'certified' && (
                            <div className="w-9 h-9 rounded-lg bg-amber-950 border border-amber-400 flex items-center justify-center text-amber-300">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Title & Subtitle */}
                        <div className="font-semibold text-slate-100 text-[11px] leading-tight line-clamp-2">{node.name}</div>
                        <div className="text-[9.5px] text-slate-400 line-clamp-2 mt-0.5 leading-tight min-h-[24px]">
                          {node.subtitle}
                        </div>

                        {/* Status Chip */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex justify-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-medium flex items-center gap-1 ${
                            node.status === 'Active'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/40'
                              : node.status === 'Matched'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/40'
                              : node.status === 'Ready'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-600/40'
                              : node.status === 'Pending'
                              ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40'
                              : 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/40'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {node.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Service Palette (12) */}
              <div className="p-3.5 bg-[#070e1c] border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                    <Settings className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Service Palette (12)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {AUTOMATION_SERVICE_CARDS.map(card => (
                    <button
                      key={card.id}
                      onClick={() => setActiveServiceWorkspace(card.serviceKey)}
                      className="p-2 rounded-lg bg-[#091326]/80 border border-slate-800 hover:border-slate-700 hover:bg-[#0b1730] text-left transition-all flex items-start gap-2 group"
                    >
                      <div className="p-1 rounded bg-black/40 border border-slate-800 text-cyan-400 shrink-0 mt-0.5">
                        {card.iconType === 'smart-scan' && <Sparkles className="w-3 h-3 text-emerald-400" />}
                        {card.iconType === 'schedule-mgr' && <Clock className="w-3 h-3 text-cyan-400" />}
                        {card.iconType === 'history' && <RotateCcw className="w-3 h-3 text-amber-400" />}
                        {card.iconType === 'templates' && <LayoutGrid className="w-3 h-3 text-indigo-400" />}
                        {card.iconType === 'schedule-plan' && <Calendar className="w-3 h-3 text-pink-400" />}
                        {card.iconType === 'cleanup-plan' && <Trash2 className="w-3 h-3 text-emerald-400" />}
                        {card.iconType === 'notify' && <Bell className="w-3 h-3 text-cyan-400" />}
                        {card.iconType === 'quiet-hours' && <Moon className="w-3 h-3 text-purple-400" />}
                        {card.iconType === 'battery' && <Battery className="w-3 h-3 text-emerald-400" />}
                        {card.iconType === 'retention' && <Archive className="w-3 h-3 text-amber-400" />}
                        {card.iconType === 'export' && <Download className="w-3 h-3 text-cyan-400" />}
                        {card.iconType === 'backup' && <Database className="w-3 h-3 text-blue-400" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-200 line-clamp-2 leading-tight group-hover:text-cyan-300">
                          {card.title}
                        </div>
                        <div className="text-[9.5px] text-slate-400 line-clamp-2 leading-tight">{card.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom: Operation Preview Timeline Strip */}
              <div className="p-3.5 bg-[#060b17] border-t border-slate-800/90 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80 mb-2.5 flex-wrap">
                  <div className="flex items-center gap-2 shrink-0">
                    <Eye className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-xs text-white whitespace-nowrap">Operation Preview</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[9px] font-semibold whitespace-nowrap">
                      DESIGN PREVIEW — NOT EXECUTED
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
                    <button
                      onClick={() => setActiveModal('step-through')}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-[11px] font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                      <Play className="w-3 h-3 text-cyan-300" />
                      <span>Step Through</span>
                    </button>

                    <button
                      onClick={() => setActiveModal('inspect-inputs')}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-[11px] font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                      <Database className="w-3 h-3" />
                      <span>Inspect Inputs</span>
                    </button>

                    <button
                      onClick={() => setActiveModal('review-permissions')}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-[11px] font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Review Permissions</span>
                    </button>

                    <button
                      onClick={() => {
                        setToastMessage('Workflow draft saved');
                        setTimeout(() => setToastMessage(null), 2000);
                      }}
                      className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save Draft</span>
                    </button>

                    <button
                      onClick={() => {
                        setToastMessage('Preview closed');
                        setTimeout(() => setToastMessage(null), 1500);
                      }}
                      className="px-2.5 py-1 rounded border border-slate-700 hover:bg-slate-800 text-slate-400 text-[11px] whitespace-nowrap"
                    >
                      ✕ Close Preview
                    </button>
                  </div>
                </div>

                {/* 6 Sequential Stages Timeline with Connectors */}
                <div className="grid grid-cols-6 gap-2">
                  {INITIAL_OPERATION_STAGES.map((stage, idx) => (
                    <div
                      key={stage.id}
                      className="p-2 rounded-lg bg-[#091224] border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200">
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                            {stage.step}
                          </span>
                          <span className="truncate">{stage.name}</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 line-clamp-2 mt-1 leading-tight">
                          {stage.description}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[9.5px] text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>{stage.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* -----------------------------------------------------------------------
               ZONE 3: NODE CONFIGURATION INSPECTOR (RIGHT)
               ----------------------------------------------------------------------- */}
            <div className="w-80 bg-[#070e1c] border-l border-slate-800/80 flex flex-col shrink-0 overflow-y-auto automation-custom-scrollbar p-3.5 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="text-xs font-semibold text-slate-200">Node Configuration</div>
                <div className="flex items-center gap-2 text-slate-400">
                  <HelpCircle className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                  <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
                </div>
              </div>

              {/* Node Title Card */}
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-900/60 border border-purple-400 flex items-center justify-center text-purple-200">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{currentNode.name}</div>
                    <div className="text-[10px] text-slate-400">Pause workflow and request user review.</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Enabled
                </span>
              </div>

              {/* Config Tabs */}
              <div className="grid grid-cols-4 gap-1 bg-[#050b18] p-1 rounded-lg border border-slate-800 text-[10.5px]">
                {(['General', 'Conditions', 'Notifications', 'Advanced'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setConfigTab(tab)}
                    className={`py-1 rounded font-medium text-center transition-colors ${
                      configTab === tab
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Form Controls */}
              <div className="space-y-3 text-xs">
                
                {/* Trigger Type */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                    <span>Trigger Type</span>
                    <HelpCircle className="w-3 h-3 text-slate-500" />
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleUpdateConfig('triggerType', 'Folder Event')}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 ${
                        currentNode.config.triggerType === 'Folder Event'
                          ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                          : 'bg-[#091224] border-slate-800 text-slate-400'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5" />
                      <span>Folder Event</span>
                    </button>

                    <button
                      onClick={() => handleUpdateConfig('triggerType', 'Scheduled')}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 ${
                        currentNode.config.triggerType === 'Scheduled'
                          ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                          : 'bg-[#091224] border-slate-800 text-slate-400'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Scheduled</span>
                    </button>
                  </div>
                </div>

                {/* Watch Folder */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1">
                    <span>Watch Folder</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={currentNode.config.watchFolder}
                      onChange={e => handleUpdateConfig('watchFolder', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-[#091224] border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-400"
                    />
                    <button
                      onClick={() => {
                        const path = prompt('Enter folder path to watch:', currentNode.config.watchFolder);
                        if (path) handleUpdateConfig('watchFolder', path);
                      }}
                      className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white"
                    >
                      <Folder className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Folder Permission */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                    <span>Folder Permission</span>
                    <HelpCircle className="w-3 h-3 text-slate-500" />
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleUpdateConfig('folderPermission', 'Read Only')}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-medium ${
                        currentNode.config.folderPermission === 'Read Only'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-[#091224] border-slate-800 text-slate-400'
                      }`}
                    >
                      Read Only
                    </button>
                    <button
                      onClick={() => handleUpdateConfig('folderPermission', 'Read & Process')}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 ${
                        currentNode.config.folderPermission === 'Read & Process'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-[#091224] border-slate-800 text-slate-400'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>Read & Process</span>
                    </button>
                  </div>
                </div>

                {/* File Type Condition */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1">
                      <span>File Type Condition</span>
                      <HelpCircle className="w-3 h-3 text-slate-500" />
                    </span>
                    <button
                      onClick={handleAddFileType}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300"
                    >
                      + Add Type
                    </button>
                  </label>
                  <div className="p-2 rounded-lg bg-[#091224] border border-slate-800 space-y-2">
                    <select className="w-full bg-black/40 border border-slate-800 rounded p-1 text-[11px] text-slate-300 focus:outline-none">
                      <option>Matches any of</option>
                      <option>Matches all of</option>
                      <option>Does not match</option>
                    </select>

                    <div className="flex flex-wrap gap-1">
                      {currentNode.config.fileTypes.map(t => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1"
                        >
                          <span>{t}</span>
                          <X
                            onClick={() => handleRemoveFileType(t)}
                            className="w-2.5 h-2.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1">
                    <span>Destination (Organize into Category)</span>
                    <HelpCircle className="w-3 h-3 text-slate-500" />
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={currentNode.config.destination}
                      onChange={e => handleUpdateConfig('destination', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-[#091224] border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-400"
                    />
                    <button
                      onClick={() => {
                        const path = prompt('Enter target destination:', currentNode.config.destination);
                        if (path) handleUpdateConfig('destination', path);
                      }}
                      className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white"
                    >
                      <Folder className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Review Requirement */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                    <span>Review Requirement</span>
                    <HelpCircle className="w-3 h-3 text-slate-500" />
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['Always', 'If Uncertain', 'Never'] as const).map(req => (
                      <button
                        key={req}
                        onClick={() => handleUpdateConfig('reviewRequirement', req)}
                        className={`py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                          currentNode.config.reviewRequirement === req
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-[#091224] border-slate-800 text-slate-400'
                        }`}
                      >
                        {req}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification Mode */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1.5">
                    <span>Notification Mode</span>
                    <HelpCircle className="w-3 h-3 text-slate-500" />
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['In-App', 'Windows', 'Email'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => handleUpdateConfig('notificationMode', mode)}
                        className={`py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                          currentNode.config.notificationMode === mode
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-[#091224] border-slate-800 text-slate-400'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Handling */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1">
                    <Sliders className="w-3 h-3 text-cyan-400" />
                    <span>Error Handling</span>
                  </label>
                  <select
                    value={currentNode.config.errorHandling}
                    onChange={e => handleUpdateConfig('errorHandling', e.target.value)}
                    className="w-full bg-[#091224] border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-400"
                  >
                    <option value="Pause and Notify User">Pause and Notify User</option>
                    <option value="Skip File and Log Warning">Skip File and Log Warning</option>
                    <option value="Move to Quarantine Folder">Move to Quarantine Folder</option>
                    <option value="Retry in 5 Minutes">Retry in 5 Minutes</option>
                  </select>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>

      {/* =========================================================================
         MODAL LAYER — design previews and specialized service workspaces
         ========================================================================= */}

      {/* New Workflow — draft creation (template picker) */}
      <DesignPreviewModal
        open={activeModal === 'new-workflow'}
        title={isArabic ? 'سير عمل جديد' : 'New Workflow'}
        subtitle={isArabic ? 'أنشئ مسودة من قالب محفوظ' : 'Create a local draft from a saved template'}
        worldLabel="Automation / Flow Studio"
        icon={<div className="w-8 h-8 rounded-lg bg-purple-900/60 border border-purple-400 flex items-center justify-center text-purple-200 shrink-0"><Plus className="w-4 h-4" /></div>}
        isArabic={isArabic}
        cancelLabel={isArabic ? 'إلغاء' : 'Cancel'}
        confirmLabel={isArabic ? 'إنشاء المسودة' : 'Create Draft'}
        confirmDisabled={!workflowDraftName.trim() || !workflowDraftTemplate}
        onConfirm={() => {
          handleCreateNewWorkflow(workflowDraftName.trim());
          setWorkflowDraftName('');
          setWorkflowDraftTemplate(null);
          setActiveModal(null);
        }}
        onClose={() => {
          setActiveModal(null);
          setWorkflowDraftName('');
          setWorkflowDraftTemplate(null);
        }}
        notice={
          isArabic
            ? 'ينشئ هذا الإجراء مسودة تصميم محلية فقط. لا يتم تشغيل أي أتمتة على ويندوز في هذه المرحلة.'
            : 'This creates a local design draft only. No automation is executed against Windows in this phase.'
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
              {isArabic ? 'اسم المسودة' : 'Draft Name'}
            </label>
            <input
              type="text"
              value={workflowDraftName}
              onChange={e => setWorkflowDraftName(e.target.value)}
              placeholder={isArabic ? 'مثال: تنظيم مستندات المكتب' : 'e.g. Desktop Document Organizer'}
              className="w-full px-2.5 py-1.5 bg-[#091224] border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
              {isArabic ? 'القالب' : 'Template'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES_CATALOG.map(tpl => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setWorkflowDraftTemplate(tpl.id)}
                  className={`p-2 rounded-lg border text-start transition-colors ${
                    workflowDraftTemplate === tpl.id
                      ? 'bg-purple-950/60 border-purple-400 text-white'
                      : 'bg-[#091224] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-semibold truncate">{tpl.title}</div>
                  <div className="text-[9.5px] text-slate-400 line-clamp-2 leading-tight mt-0.5">{tpl.summary}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DesignPreviewModal>

      {/* Step Through — ordered preview built from the real flow nodes */}
      <DesignPreviewModal
        open={activeModal === 'step-through'}
        title={isArabic ? 'معاينة خطوة بخطوة' : 'Step-Through Preview'}
        subtitle={isArabic ? 'مسار المسودة المحدد — لم يتم التنفيذ' : 'Selected draft path — not executed'}
        worldLabel="Automation / Flow Studio"
        icon={<div className="w-8 h-8 rounded-lg bg-cyan-900/50 border border-cyan-500/50 flex items-center justify-center text-cyan-200 shrink-0"><Play className="w-4 h-4" /></div>}
        isArabic={isArabic}
        cancelLabel={isArabic ? 'إغلاق' : 'Close'}
        onClose={() => setActiveModal(null)}
        notice={
          isArabic
            ? 'معاينة تصميم فقط. قد لا يطابق الترتيب المسار الفعلي بعد توصيل المحرك الأصلي في المرحلة الثانية.'
            : 'Design preview only. The ordering may differ from the real execution path once the native engine lands in Phase Two.'
        }
      >
        <ol className="space-y-1.5">
          {flowNodes.map((node, idx) => (
            <li
              key={node.id}
              className={`flex items-start gap-2.5 p-2 rounded-lg border ${
                node.id === currentNode.id
                  ? 'bg-purple-950/40 border-purple-500/50'
                  : 'bg-[#050e1f] border-slate-800/80'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9.5px] font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-semibold text-slate-100 truncate">{node.name}</div>
                <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight mt-0.5">{node.subtitle}</div>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[9px] text-slate-300 shrink-0 mt-0.5">
                {node.status}
              </span>
            </li>
          ))}
        </ol>
      </DesignPreviewModal>

      {/* Inspect Inputs — the selected node's real configuration */}
      <DesignPreviewModal
        open={activeModal === 'inspect-inputs'}
        title={isArabic ? 'فحص المدخلات' : 'Inspect Inputs'}
        subtitle={currentNode.name}
        worldLabel="Automation / Flow Studio"
        icon={<div className="w-8 h-8 rounded-lg bg-blue-900/50 border border-blue-500/50 flex items-center justify-center text-blue-200 shrink-0"><Database className="w-4 h-4" /></div>}
        isArabic={isArabic}
        cancelLabel={isArabic ? 'إغلاق' : 'Close'}
        onClose={() => setActiveModal(null)}
        fields={[
          { label: isArabic ? 'نوع المشغّل' : 'Trigger Type', value: currentNode.config.triggerType, tone: 'cyan' },
          { label: isArabic ? 'المجلد المراقب' : 'Watch Folder', value: currentNode.config.watchFolder || '—', tone: 'muted' },
          { label: isArabic ? 'امتدادات الملفات' : 'File Types', value: currentNode.config.fileTypes.join(', ') || '—', tone: 'muted' },
          { label: isArabic ? 'الوجهة' : 'Destination', value: currentNode.config.destination || '—', tone: 'muted' },
          { label: isArabic ? 'معالجة الأخطاء' : 'Error Handling', value: currentNode.config.errorHandling, tone: 'amber' },
        ]}
        notice={
          isArabic
            ? 'القيم أعلاه مقروءة من إعدادات المسودة الحالية داخل المتصفح فقط.'
            : 'The values above are read from the current in-browser draft configuration only.'
        }
      />

      {/* Review Permissions — the node's permission + review posture */}
      <DesignPreviewModal
        open={activeModal === 'review-permissions'}
        title={isArabic ? 'مراجعة الأذونات' : 'Review Permissions'}
        subtitle={currentNode.name}
        worldLabel="Automation / Flow Studio"
        icon={<div className="w-8 h-8 rounded-lg bg-emerald-900/50 border border-emerald-500/50 flex items-center justify-center text-emerald-200 shrink-0"><ShieldCheck className="w-4 h-4" /></div>}
        isArabic={isArabic}
        cancelLabel={isArabic ? 'إغلاق' : 'Close'}
        onClose={() => setActiveModal(null)}
        fields={[
          { label: isArabic ? 'أذون المجلد' : 'Folder Permission', value: currentNode.config.folderPermission, tone: 'emerald' },
          { label: isArabic ? 'متطلب المراجعة' : 'Review Requirement', value: currentNode.config.reviewRequirement, tone: 'emerald' },
          { label: isArabic ? 'وضع الإشعار' : 'Notification Mode', value: currentNode.config.notificationMode, tone: 'cyan' },
          {
            label: isArabic ? 'تنفيذ أصلي' : 'Native Execution',
            value: isArabic ? 'معطّل' : 'Disabled',
            tone: 'rose',
          },
        ]}
        notice={
          isArabic
            ? 'تُعرض الأذونات كما هي في المسودة. لا يتم طلب أذونات ويندوز فعلية في هذه المرحلة، ولا يتم تطبيق أي تغيير.'
            : 'Permissions are shown as drafted. No real Windows permissions are requested in this phase and nothing is applied.'
        }
      />

      {/* Specialized service workspace (palette cards + History) */}
      {activeServiceWorkspace && (
        <AutomationWorkspaces
          serviceKey={activeServiceWorkspace}
          onClose={() => setActiveServiceWorkspace(null)}
          isArabic={isArabic}
        />
      )}

    </div>
  );
}
