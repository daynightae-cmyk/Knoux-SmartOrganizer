import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ChevronRight, Folder, Minus, Plus } from 'lucide-react';
import type { StorageTreeNode } from '../../shared/native-contracts';
import { formatStorageBytes } from './useStorageNative';

interface StorageSpaceMapProps {
  tree: StorageTreeNode;
  isArabic: boolean;
  searchQuery: string;
  selectedId: string | null;
  onSelect: (node: StorageTreeNode) => void;
}

const COLORS = [
  ['#1d4ed8', '#3b82f6'],
  ['#7e22ce', '#a855f7'],
  ['#047857', '#10b981'],
  ['#b45309', '#f59e0b'],
  ['#be123c', '#f43f5e'],
  ['#0e7490', '#06b6d4'],
  ['#4d7c0f', '#84cc16'],
  ['#475569', '#64748b'],
];

function findNode(node: StorageTreeNode, id: string): StorageTreeNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function findPath(node: StorageTreeNode, id: string, path: StorageTreeNode[] = []): StorageTreeNode[] | null {
  const next = [...path, node];
  if (node.id === id) return next;
  for (const child of node.children) {
    const found = findPath(child, id, next);
    if (found) return found;
  }
  return null;
}

function filterNode(node: StorageTreeNode, query: string): StorageTreeNode | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return node;
  const children = node.children
    .map((child) => filterNode(child, normalized))
    .filter((child): child is StorageTreeNode => Boolean(child));
  if (node.name.toLowerCase().includes(normalized) || children.length) {
    return { ...node, children };
  }
  return null;
}

export function StorageSpaceMap({ tree, isArabic, searchQuery, selectedId, onSelect }: StorageSpaceMapProps) {
  const rootId = tree.id;
  const [currentId, setCurrentId] = useState(rootId);
  const [history, setHistory] = useState<string[]>([rootId]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    setCurrentId(rootId);
    setHistory([rootId]);
    setHistoryIndex(0);
  }, [rootId, tree.sizeBytes]);

  const current = findNode(tree, currentId) || tree;
  const path = findPath(tree, current.id) || [tree];
  const parent = path.length > 1 ? path[path.length - 2] : null;
  const filtered = useMemo(() => filterNode(current, searchQuery) || { ...current, children: [] }, [current, searchQuery]);
  const children = [...filtered.children].sort((a, b) => b.sizeBytes - a.sizeBytes);
  const total = children.reduce((sum, child) => sum + child.sizeBytes, 0) || Math.max(1, current.sizeBytes);

  const navigate = (id: string) => {
    if (!findNode(tree, id)) return;
    const nextHistory = [...history.slice(0, historyIndex + 1), id];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setCurrentId(id);
  };

  const goBack = () => {
    if (historyIndex <= 0) return;
    const next = historyIndex - 1;
    setHistoryIndex(next);
    setCurrentId(history[next]);
  };

  const goForward = () => {
    if (historyIndex >= history.length - 1) return;
    const next = historyIndex + 1;
    setHistoryIndex(next);
    setCurrentId(history[next]);
  };

  const zoomChild = () => {
    const selectedChild = children.find((child) => child.id === selectedId);
    const target = selectedChild?.children.length ? selectedChild : children.find((child) => child.children.length);
    if (target) navigate(target.id);
  };

  return (
    <div className="storage-treemap flex flex-col gap-1.5 bg-[#030a16] p-2 rounded-xl border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 min-w-0 text-[10px] text-slate-400">
          {path.map((node, index) => (
            <React.Fragment key={node.id}>
              {index > 0 && <ChevronRight className="w-3 h-3 text-slate-600 rtl:rotate-180" />}
              <button
                onClick={() => navigate(node.id)}
                className={`px-1.5 py-0.5 rounded hover:bg-slate-800 ${index === path.length - 1 ? 'text-cyan-300 font-semibold' : 'text-slate-300'} cursor-pointer truncate max-w-[150px]`}
                title={node.relative || node.name}
              >
                {node.relative || node.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={zoomChild} disabled={!children.some((child) => child.children.length)} title={isArabic ? 'تكبير' : 'Zoom in'} aria-label={isArabic ? 'تكبير' : 'Zoom in'} className="p-1 rounded hover:bg-slate-800 disabled:opacity-35"><Plus className="w-3.5 h-3.5" /></button>
          <button onClick={() => parent && navigate(parent.id)} disabled={!parent} title={isArabic ? 'تصغير' : 'Zoom out'} aria-label={isArabic ? 'تصغير' : 'Zoom out'} className="p-1 rounded hover:bg-slate-800 disabled:opacity-35"><Minus className="w-3.5 h-3.5" /></button>
          <button onClick={goBack} disabled={historyIndex <= 0} title={isArabic ? 'رجوع' : 'Back'} aria-label={isArabic ? 'رجوع' : 'Back'} className="p-1 rounded hover:bg-slate-800 disabled:opacity-35"><ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /></button>
          <button onClick={goForward} disabled={historyIndex >= history.length - 1} title={isArabic ? 'تقدم' : 'Forward'} aria-label={isArabic ? 'تقدم' : 'Forward'} className="p-1 rounded hover:bg-slate-800 disabled:opacity-35"><ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" /></button>
          <button onClick={() => parent && navigate(parent.id)} disabled={!parent} title={isArabic ? 'المجلد الأصل' : 'Parent folder'} aria-label={isArabic ? 'المجلد الأصل' : 'Parent folder'} className="p-1 rounded hover:bg-slate-800 disabled:opacity-35"><ArrowUp className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {children.length ? (
        <div className="flex-1 flex flex-wrap gap-1.5 min-h-[150px] content-stretch">
          {children.map((child, index) => {
            const color = COLORS[index % COLORS.length];
            const weight = Math.max(12, Math.round((child.sizeBytes / total) * 100));
            const selected = child.id === selectedId;
            return (
              <div
                key={child.id}
                role="button"
                tabIndex={0}
                data-testid="storage-tree-node"
                onClick={() => onSelect(child)}
                onDoubleClick={() => child.children.length && navigate(child.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(child);
                  }
                }}
                className={`rounded-lg p-2 flex flex-col justify-between cursor-pointer border transition outline-none focus-visible:ring-1 focus-visible:ring-cyan-300 ${selected ? 'ring-2 ring-cyan-300' : ''}`}
                style={{
                  flexGrow: weight,
                  flexBasis: `${Math.max(120, weight * 3)}px`,
                  backgroundColor: color[0],
                  borderColor: color[1],
                }}
                title={`${child.relative || child.name} · ${formatStorageBytes(child.sizeBytes)}`}
              >
                <div>
                  <div className="font-extrabold text-xs text-white truncate">{child.name}</div>
                  <div className="text-[10px] font-mono text-white/75">{formatStorageBytes(child.sizeBytes)}</div>
                </div>
                {child.children.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 opacity-80">
                    {child.children.slice(0, 3).map((grandchild) => (
                      <span key={grandchild.id} className="px-1 py-0.5 rounded bg-black/20 text-[9px] font-mono text-white/85 truncate max-w-[110px]">
                        {grandchild.name} {formatStorageBytes(grandchild.sizeBytes)}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-[9px] font-mono text-white/60 flex items-center justify-between">
                  <span>{child.files.toLocaleString()} {isArabic ? 'ملف' : 'files'}</span>
                  {child.children.length > 0 && <span>{isArabic ? 'انقر مرتين للتكبير' : 'double-click to zoom'}</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 min-h-[150px] flex flex-col items-center justify-center gap-2 border border-dashed border-slate-700 rounded-lg text-center">
          <Folder className="w-7 h-7 text-slate-600" />
          <div className="text-xs text-slate-300">
            {searchQuery.trim()
              ? (isArabic ? 'لا توجد مجلدات مطابقة في هذا المستوى.' : 'No folders match at this level.')
              : (isArabic ? 'لا توجد مجلدات فرعية في هذا النطاق.' : 'No subfolders exist in this scope.')}
          </div>
        </div>
      )}

      <div style={{ color: '#64748b' }} className="storage-treemap-footer text-[10px] font-mono flex items-center justify-between px-1">
        <span>
          {isArabic ? 'العقدة النشطة:' : 'Active node:'}{' '}
          <strong className="text-cyan-300 font-semibold">{current.relative || current.name}</strong>
        </span>
        <span>{formatStorageBytes(current.sizeBytes)} · {current.files.toLocaleString()} {isArabic ? 'ملف' : 'files'}</span>
      </div>
    </div>
  );
}
