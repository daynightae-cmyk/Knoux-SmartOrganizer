import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { searchFilterTools } from '../lib/guards';
import { useStore } from '../state/store';
import { ToolCard } from '../components/tools/ToolCards';
import { ToolRunner } from '../components/tools/ToolRunner';
import { VerificationPanel, AppTables, FileTables, HardwareTables, NetworkTables, OperationEvidence, ServiceTables, StartupTables, StorageTables, SystemTables } from './renderers';

export default function CatalogPage({ page }: { page: string }) {
  const { tools, selectedId, setSelectedId, result, folder, file, t } = useStore();
  const [q, setQ] = useState('');
  const scoped = useMemo(() => searchFilterTools(tools, page, q, t), [tools, page, q, t]);
  const selected = useMemo(
    () => tools.find(item => item.id === selectedId && (page === 'home' || item.category === page)) ?? scoped[0] ?? null,
    [tools, selectedId, page, scoped]
  );
  const activeResult = result && selected && result.toolId === selected.id ? result : null;

  return (
    <div className="workspace catalog-layout">
      <section className="catalog panel" aria-label={t('tools.title')}>
        <label className="search catalog-search">
          <Search size={15} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('tools.search')} aria-label={t('tools.search')} />
        </label>
        <div className="tool-list" role="listbox" aria-label={t('tools.title')}>
          {scoped.map(tool => (
            <ToolCard key={tool.id} tool={tool} t={t} selected={selected?.id === tool.id} onSelect={item => setSelectedId(item.id)} />
          ))}
          {scoped.length === 0 && <p className="muted">{t('common.noResults')}</p>}
        </div>
      </section>
      <section className="runner panel" aria-live="polite">
        {!selected && <p className="muted">{t('tools.noSelection')}</p>}
        {selected && (
          <>
            {activeResult && (
              <div className="category-tables">
                <OperationEvidence result={activeResult} />
                <VerificationPanel result={activeResult} />
                <StorageTables result={activeResult} />
                <FileTables result={activeResult} />
                <StartupTables result={activeResult} />
                <AppTables result={activeResult} />
                <ServiceTables result={activeResult} />
                <SystemTables result={activeResult} />
                <NetworkTables result={activeResult} />
                <HardwareTables result={activeResult} />
              </div>
            )}
            <ToolRunner tool={selected} folder={folder} file={file} />
          </>
        )}
      </section>
    </div>
  );
}
