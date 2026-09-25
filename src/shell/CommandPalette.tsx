import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ShieldAlert, Wrench } from 'lucide-react';
import { buildToolRecord, normalizeQuery, scoreRecord, type SearchRecord } from '../lib/search';
import { pageGroups } from '../lib/pages';
import { paletteTargetForTool } from '../lib/guards';
import { toolIcon } from '../lib/icons';
import { useStore } from '../state/store';

export default function CommandPalette() {
  const { paletteOpen, setPaletteOpen, tools, t, locale, setPage, openTool, setSelectedId } = useStore();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (paletteOpen) {
      setQuery('');
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [paletteOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      } else if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, setPaletteOpen]);

  const entries = useMemo(() => {
    const pageRecords: SearchRecord[] = pageGroups.flatMap(group => group.pages.map(item => ({
      id: `page:${item.id}`, kind: 'page' as const, page: item.id,
      fields: [normalizeQuery(t(item.nameKey)), normalizeQuery(t(group.nameKey)), normalizeQuery(item.id)]
    })));
    const toolRecords = tools.map(tool => buildToolRecord(tool, t));
    const all = [...pageRecords, ...toolRecords];
    const normalized = normalizeQuery(query);
    if (!normalized) {
      return [
        ...pageRecords.slice(0, 6).map(record => ({ record, score: 1 })),
        ...toolRecords.slice(0, 6).map(record => ({ record, score: 1 }))
      ];
    }
    return all
      .map(record => ({ record, score: scoreRecord(record, normalized) }))
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id, locale === 'ar' ? 'ar' : 'en'))
      .slice(0, 20);
  }, [query, tools, t, locale]);

  useEffect(() => setCursor(0), [query]);

  if (!paletteOpen) return null;

  const choose = (record: SearchRecord) => {
    if (record.kind === 'page') {
      const id = record.id.replace('page:', '');
      setPage(id as Parameters<typeof setPage>[0]);
    } else {
      const tool = tools.find(item => item.id === record.id);
      if (tool) {
        // Safety: palette never runs destructive/admin tools directly — it opens the workspace.
        setPage(paletteTargetForTool(tool));
        openTool(tool);
        setSelectedId(tool.id);
      }
    }
    setPaletteOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, entries.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter' && entries[cursor]) { e.preventDefault(); choose(entries[cursor].record); }
  };

  return (
    <div className="palette-backdrop" onClick={() => setPaletteOpen(false)}>
      <div className="palette" role="dialog" aria-modal="true" aria-label={t('palette.title')} onClick={e => e.stopPropagation()}>
        <div className="palette-input">
          <Search size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('palette.placeholder')}
            aria-label={t('palette.placeholder')}
          />
          <kbd>esc</kbd>
        </div>
        <div className="palette-results" role="listbox">
          {entries.length === 0 && <p className="palette-empty">{t('palette.empty')}</p>}
          {entries.map(({ record }, index) => {
            if (record.kind === 'page') {
              const label = record.id.replace('page:', '');
              return (
                <button key={record.id} role="option" aria-selected={index === cursor}
                  className={index === cursor ? 'palette-item active' : 'palette-item'}
                  onClick={() => choose(record)} onMouseEnter={() => setCursor(index)}>
                  <span className="palette-kind">{t('palette.pages')}</span>
                  <strong>{label}</strong>
                  <span className="palette-hint">{t('palette.openHint')}</span>
                </button>
              );
            }
            const tool = tools.find(item => item.id === record.id);
            if (!tool) return null;
            const Icon = toolIcon(tool.icon);
            return (
              <button key={record.id} role="option" aria-selected={index === cursor}
                className={index === cursor ? 'palette-item active' : 'palette-item'}
                onClick={() => choose(record)} onMouseEnter={() => setCursor(index)}>
                <Icon size={16} />
                <span className="palette-main"><strong>{t(tool.nameKey)}</strong><small>{t(tool.descriptionKey)}</small></span>
                <span className="palette-meta">
                  <span className="pill">{tool.category}</span>
                  {tool.requiresAdmin && <span className="pill danger"><ShieldAlert size={11} /> {t('common.adminRequired')}</span>}
                  {!tool.availability.available && <span className="pill muted">{t('common.unavailable')}</span>}
                </span>
                <span className="palette-hint">{t('palette.runHint')}</span>
              </button>
            );
          })}
          {entries.length > 0 && (
            <p className="palette-foot"><Wrench size={12} /> {t('palette.tools')} · {entries.length}</p>
          )}
        </div>
      </div>
    </div>
  );
}
