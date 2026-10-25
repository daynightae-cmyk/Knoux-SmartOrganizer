import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, ChevronUp,
  Copy, Database, Eye, Files, Folder, FolderOpen, FolderPlus, FolderTree, Gauge,
  History, LayoutGrid, List, Loader2, Lock, MoveRight, Plus, RefreshCw, Search,
  ShieldCheck, Sparkles, Trash2, Undo2, Workflow, X, type LucideIcon
} from 'lucide-react';
import { formatBytes, formatCount, formatPercent } from '../lib/format';
import { CATEGORY_LABELS, CATEGORY_ORDER, describeError, ERROR_TEXT } from './copy';
import { useStudio, type StudioSurface } from './context';
import { Badge, CategoryIcon, EmptyState, Modal, ProgressBar, SectionHeading, StudioThumb, formatWhen, formatWhenMs } from './parts';
import type { DestinationListing, FileInfo, FolderValidationResult, JournalOperation, Source, UndoPreview, UndoResult } from './types';

const SURFACES: Array<{ id: StudioSurface; icon: LucideIcon; text: 'surfaceSources' | 'surfaceLibrary' | 'surfaceDetails' | 'surfaceBuilder' | 'surfaceDestinations' | 'surfaceReview' | 'surfaceExecution' | 'surfaceHistory' | 'surfaceSuggestions' }> = [
  { id: 'sources', icon: FolderOpen, text: 'surfaceSources' },
  { id: 'library', icon: LayoutGrid, text: 'surfaceLibrary' },
  { id: 'details', icon: Eye, text: 'surfaceDetails' },
  { id: 'builder', icon: Workflow, text: 'surfaceBuilder' },
  { id: 'destinations', icon: FolderTree, text: 'surfaceDestinations' },
  { id: 'review', icon: ShieldCheck, text: 'surfaceReview' },
  { id: 'execution', icon: Gauge, text: 'surfaceExecution' },
  { id: 'history', icon: History, text: 'surfaceHistory' },
  { id: 'suggestions', icon: Sparkles, text: 'surfaceSuggestions' }
];

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return <div className="st-stat"><small>{label}</small><strong>{value}</strong></div>;
}

export function StudioHero() {
  const s = useStudio();
  return <header className="st-hero">
    <div className="st-hero__planet" aria-hidden="true"><i /><span /></div>
    <div className="st-hero__copy">
      <h1>{s.locale === 'ar' ? 'استوديو التنظيم الذكي' : 'Smart Organization Studio'}</h1>
      <p>{s.locale === 'ar' ? 'من ملفات مبعثرة إلى ترتيب ذكي.' : 'From scattered files to intelligent order.'}</p>
    </div>
    <small className="st-hero__promise">{s.locale === 'ar' ? 'غدٌ أكثر تنظيماً.' : 'A more organized tomorrow.'}</small>
  </header>;
}

export function StudioBanners() {
  const s = useStudio();
  if (!s.error && !s.notice && !s.scanRunning) return null;
  return <div className="st-banners">
    {(s.error || s.notice) && <div className={`st-banner ${s.error ? 'st-banner--danger' : 'st-banner--success'}`} role={s.error ? 'alert' : 'status'}>
      {s.error ? <AlertTriangle size={16} /> : <Check size={16} />}<span>{s.error || s.notice}</span><button className="st-icon-btn" onClick={s.dismissBanner} aria-label={s.t.close}><X size={15} /></button>
    </div>}
    {s.scanRunning && <div className="st-scan-live" role="status"><Loader2 className="st-spin" size={16} /><div><strong>{s.t.indexing}</strong><small>{formatCount(s.scanRunning.files, s.locale)} {s.t.files} · {formatCount(s.scanRunning.folders, s.locale)} {s.t.folders} · {formatBytes(s.scanRunning.bytes, s.locale)}</small></div><button className="st-btn st-btn--small" onClick={() => void s.cancelScan()}>{s.t.cancelScan}</button></div>}
  </div>;
}

export function SurfaceRail() {
  const s = useStudio();
  return <nav className="st-rail" aria-label={s.t.surfaceHint}>
    {SURFACES.map(({ id, icon: Icon, text }, i) => <button key={id} className={`st-rail__item${s.surface === id ? ' is-active' : ''}`} aria-current={s.surface === id ? 'page' : undefined} onClick={() => s.goto(id)}><Icon size={15} /><span>{s.t[text]}</span><small>{id === 'builder' && s.basketCount ? formatCount(s.basketCount, s.locale) : String(i + 1)}</small></button>)}
  </nav>;
}

export function StudioStage() {
  const { surface } = useStudio();
  switch (surface) {
    case 'sources': return <Sources />;
    case 'library': return <Library />;
    case 'details': return <Details />;
    case 'builder': return <Builder />;
    case 'destinations': return <Destinations />;
    case 'review': return <Review />;
    case 'execution': return <Execution />;
    case 'history': return <HistoryPanel />;
    case 'suggestions': return <Suggestions />;
  }
}

function Sources() {
  const s = useStudio();
  const [removing, setRemoving] = useState<Source | null>(null);
  return <section className="st-surface">
    <SectionHeading icon={FolderOpen} title={s.t.sourcesTitle} description={s.t.sourcesBlurb} actions={<button className="st-btn" onClick={() => void s.pickSource()} disabled={!!s.scanRunning}><Plus size={15} />{s.t.chooseAlongside}</button>} />
    {s.sourcesLoading ? <p role="status">{s.t.loadingSources}</p> : !s.sources.length ? <EmptyState icon={FolderPlus} title={s.t.noSources} body={s.t.noSourcesHint} action={<button className="st-btn st-btn--primary" onClick={() => void s.pickSource()}>{s.t.addSource}</button>} /> : <div className="st-source-grid">{s.sources.map(source => {
      const index = s.saved[source.id];
      return <article key={source.id} className={`st-source-card${s.activeSourceId === source.id ? ' is-active' : ''}`}>
        <div className="st-inline st-between"><span className="st-card-icon"><FolderOpen size={23} /></span><Badge tone={index?.partial ? 'warning' : index ? 'success' : 'neutral'}>{index?.partial ? s.t.partialResult : index ? s.t.indexedAt : s.t.notIndexed}</Badge></div>
        <h3>{source.name}</h3><bdi className="st-path" dir="ltr">{source.folder}</bdi>
        <div className="st-stats st-stats--two"><Stat label={s.t.files} value={index ? formatCount(index.totalFiles, s.locale) : '—'} /><Stat label={s.t.bytes} value={index ? formatBytes(index.totalBytes, s.locale) : '—'} /></div>
        {index && <div className="st-inline st-xs st-muted"><span>{s.t.skippedLinks}: {formatCount(index.counts.links, s.locale)}</span><span>{s.t.unreadable}: {formatCount(index.counts.errors, s.locale)}</span></div>}
        {index?.warnings.length ? <details className="st-warning-details"><summary>{s.t.scanWarnings}</summary><ul>{index.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></details> : null}
        <div className="st-inline"><button className="st-btn st-btn--small" onClick={() => { s.setActiveSourceId(source.id); s.goto('library'); }}>{s.t.browse}</button><button className="st-icon-btn" disabled={!!s.scanRunning} onClick={() => { s.setActiveSourceId(source.id); void s.beginScan(source.id); }} aria-label={`${index ? s.t.rescan : s.t.scanNow} ${source.name}`} title={index ? s.t.rescan : s.t.scanNow}><RefreshCw size={15} /></button><button className="st-icon-btn" onClick={() => setRemoving(source)} aria-label={`${s.t.removeSource} ${source.name}`} title={s.t.removeSource}><Trash2 size={15} /></button></div>
      </article>;
    })}</div>}
    <p className="st-note"><Database size={15} />{s.t.multipleSources} {s.t.indexReadOnly}</p>
    {removing && <Modal title={s.t.removeSource} subtitle={s.t.removeSourceHint} closeLabel={s.t.close} onClose={() => setRemoving(null)} footer={<><button className="st-btn" onClick={() => setRemoving(null)}>{s.t.cancel}</button><button className="st-btn" onClick={() => { void s.removeSource(removing.id); setRemoving(null); }}>{s.t.removeSource}</button></>}><bdi dir="ltr" className="st-path">{removing.folder}</bdi></Modal>}
  </section>;
}

function SourcePicker() {
  const s = useStudio();
  return <label className="st-field st-source-picker"><span>{s.t.sourceFolder}</span><select value={s.activeSourceId ?? ''} onChange={event => s.setActiveSourceId(event.target.value)}>{s.sources.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}</select></label>;
}

function Library() {
  const s = useStudio();
  const index = s.inventory;
  return <section className="st-surface">
    <SectionHeading icon={LayoutGrid} title={s.t.libraryTitle} description={s.t.libraryBlurb} actions={s.activeSource && <button className="st-btn st-btn--small" disabled={!!s.scanRunning} onClick={() => void s.beginScan(s.activeSource!.id)}><RefreshCw size={14} />{s.t.rescan}</button>} />
    {s.sources.length > 0 && <SourcePicker />}
    {!index ? <EmptyState icon={Database} title={s.t.notScanned} body={s.t.scanBeforeOrganize} action={<button className="st-btn" disabled={!!s.scanRunning} onClick={() => s.activeSource ? void s.beginScan(s.activeSource.id) : void s.pickSource()}>{s.activeSource ? s.t.scanNow : s.t.addSource}</button>} /> : <>
      <div className="st-stats"><Stat label={s.t.files} value={formatCount(index.totalFiles, s.locale)} /><Stat label={s.t.bytes} value={formatBytes(index.totalBytes, s.locale)} /><Stat label={s.t.categories} value={formatCount(index.categories.filter(c => c.count > 0).length, s.locale)} /></div>
      {index.partial && <div className="st-banner st-banner--warning" role="status"><AlertTriangle size={16} /><span>{s.t.scanPartialNotice} · {s.t.unreadable}: {index.counts.errors} · {s.t.depthSkipped}: {index.counts.depthSkipped}</span></div>}
      <div className="st-category-grid">{CATEGORY_ORDER.map(category => {
        const stat = index.categories.find(c => c.key === category);
        return <button key={category} className={`st-category${s.filters.category === category ? ' is-active' : ''}`} aria-pressed={s.filters.category === category} onClick={() => s.updateFilters({ category: s.filters.category === category ? 'all' : category })}><CategoryIcon category={category} /><strong>{CATEGORY_LABELS[category][s.locale]}</strong><span>{formatCount(stat?.count ?? 0, s.locale)}</span><small>{formatBytes(stat?.bytes ?? 0, s.locale)}</small></button>;
      })}</div>
      <div className="st-library-tools"><label className="st-search"><Search size={16} /><input aria-label={s.t.searchLabel} placeholder={s.t.searchPlaceholder} value={s.filters.search} onChange={e => s.updateFilters({ search: e.target.value })} /></label><div className="st-segment" aria-label={s.t.preview}><button className={s.view === 'grid' ? 'is-active' : ''} aria-label={s.t.gridView} aria-pressed={s.view === 'grid'} onClick={() => s.setView('grid')}><LayoutGrid size={16} /></button><button className={s.view === 'list' ? 'is-active' : ''} aria-label={s.t.listView} aria-pressed={s.view === 'list'} onClick={() => s.setView('list')}><List size={16} /></button></div></div>
      <div className="st-filter-grid">
        <label className="st-field"><span>{s.t.category}</span><select value={s.filters.category} onChange={e => s.updateFilters({ category: e.target.value as typeof s.filters.category })}><option value="all">{s.t.allFiles}</option>{CATEGORY_ORDER.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c][s.locale]}</option>)}</select></label>
        <label className="st-field"><span>{s.t.extension}</span><select value={s.filters.ext} onChange={e => s.updateFilters({ ext: e.target.value })}><option value="">{s.t.allExtensions}</option>{index.extensions.map(ext => <option key={ext.ext} value={ext.ext}>{ext.ext || s.t.none} ({formatCount(ext.count, s.locale)})</option>)}</select></label>
        <label className="st-field"><span>{s.t.sizeRange}</span><select value={s.filters.size} onChange={e => s.updateFilters({ size: e.target.value as typeof s.filters.size })}>{[['any', s.t.anySize], ['tiny', s.t.sizeTiny], ['small', s.t.sizeSmall], ['medium', s.t.sizeMedium], ['large', s.t.sizeLarge], ['from50', '≥ 50 MB']].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="st-field"><span>{s.t.dateRange}</span><select value={s.filters.date} onChange={e => s.updateFilters({ date: e.target.value as typeof s.filters.date })}>{[['any', s.t.anyDate], ['week', s.t.lastWeek], ['month', s.t.lastMonth], ['year', s.t.lastYear]].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="st-field"><span>{s.t.sortBy}</span><select value={s.filters.sort} onChange={e => s.updateFilters({ sort: e.target.value as typeof s.filters.sort })}>{[['name', s.t.sortName], ['size', s.t.sortSize], ['modified', s.t.sortModified], ['type', s.t.sortType]].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <button className="st-icon-btn st-sort-direction" onClick={() => s.updateFilters({ desc: !s.filters.desc })} aria-label={s.filters.desc ? s.t.descending : s.t.ascending}>{s.filters.desc ? <ArrowDown size={16} /> : <ArrowUp size={16} />}</button>
      </div>
      <div className="st-inline st-between st-results"><span className="st-muted">{s.page ? `${formatCount(s.page.total, s.locale)} ${s.t.files} · ${formatBytes(s.page.bytes, s.locale)}` : s.t.loadingPage}</span><div className="st-inline"><button className="st-link" onClick={s.resetFilters}>{s.t.clearFilters}</button><button className="st-link" disabled={!s.activeSource || !index.totalFiles} onClick={() => s.filters.category === 'all' ? s.addAll(s.activeSource!) : s.addCategory(s.activeSource!, s.filters.category)}>{s.filters.category === 'all' ? s.t.addAllToPlan : s.t.addCategoryToPlan}</button></div></div>
      <div aria-busy={s.pageLoading} className={s.view === 'grid' ? 'st-file-grid' : 'st-file-list'}>{s.page?.rows.map(file => <LibraryFile key={`${index.inventoryId}:${file.id}`} file={file} source={s.activeSource!} />)}</div>
      {!s.pageLoading && s.page?.total === 0 && <EmptyState icon={Search} title={index.totalFiles ? s.t.noMatching : s.t.noFiles} compact />}
      {s.pageLoading && <p className="st-muted" role="status">{s.t.loadingPage}</p>}
      {s.page && s.page.total > s.filters.limit && <div className="st-pager"><button className="st-icon-btn" disabled={!s.filters.offset} onClick={() => s.updateFilters({ offset: Math.max(0, s.filters.offset - s.filters.limit) })} aria-label={s.t.previous}><ChevronLeft size={18} /></button><span>{s.t.pageRange} {formatCount(s.filters.offset + 1, s.locale)} – {formatCount(Math.min(s.page.total, s.filters.offset + s.filters.limit), s.locale)} {s.t.of} {formatCount(s.page.total, s.locale)}</span><button className="st-icon-btn" disabled={s.filters.offset + s.filters.limit >= s.page.total} onClick={() => s.updateFilters({ offset: s.filters.offset + s.filters.limit })} aria-label={s.t.nextPage}><ChevronRight size={18} /></button></div>}
      <div className="st-selection-bar"><Files size={17} /><strong>{formatCount(s.basketCount, s.locale)} {s.t.selectedCount}</strong><button className="st-link" disabled={!s.basketCount} onClick={s.clearBasket}>{s.t.clearSelection}</button><button className="st-btn st-btn--primary" disabled={!s.basketCount} onClick={() => s.goto('builder')}>{s.t.openPlan}<ChevronRight size={15} /></button></div>
      <p className="st-note"><ShieldCheck size={14} />{s.t.thumbNote}</p>
    </>}
  </section>;
}

function LibraryFile({ file, source }: { file: FileInfo; source: Source }) {
  const s = useStudio();
  const selected = s.isFileSelected(s.saved[source.id]?.inventoryId ?? '', file);
  return <article className={`st-file${selected ? ' is-selected' : ''}`}>
    <button className="st-file__select" aria-pressed={selected} aria-label={`${s.t.selectableRow}: ${file.name}`} onClick={() => s.toggleFile(source, file)}><span className="st-file__check">{selected && <Check size={13} />}</span>{s.bridge && <StudioThumb bridge={s.bridge} source={source} file={file} category={file.category} compact={s.view === 'list'} />}<span className="st-file__name"><strong>{file.name}</strong><small dir="ltr">{file.relative}</small></span></button>
    <div className="st-file__meta"><span>{formatBytes(file.size, s.locale)}</span><small>{formatWhen(file.modifiedAt, s.locale)}</small></div><button className="st-icon-btn" onClick={() => s.focusFile(source, file)} aria-label={`${s.t.focusFile}: ${file.name}`}><Eye size={15} /></button>
  </article>;
}

function Details() {
  const s = useStudio();
  const file = s.focused?.file;
  const source = s.focused?.source;
  const index = s.inventory;
  const selected = file && source ? s.isFileSelected(source.inventory?.inventoryId ?? '', file) : false;
  return <section className="st-surface"><SectionHeading icon={Eye} title={s.t.detailsTitle} description={s.t.detailsBlurb} actions={<button className="st-btn" onClick={() => s.goto('library')}>{s.t.surfaceLibrary}</button>} />
    <div className="st-two-column"><div className="st-panel"><h3>{s.filters.category === 'all' ? s.t.allCollection : CATEGORY_LABELS[s.filters.category][s.locale]}</h3><div className="st-stats st-stats--two"><Stat label={s.t.files} value={formatCount(s.page?.total ?? 0, s.locale)} /><Stat label={s.t.bytes} value={formatBytes(s.page?.bytes ?? 0, s.locale)} /></div><p className="st-muted">{s.t.collectionShare}: {formatPercent(index?.totalBytes ? (s.page?.bytes ?? 0) / index.totalBytes * 100 : 0, s.locale)}</p>
      <h4>{s.t.sourceSummary} · {s.t.extensionMix}</h4><div className="st-extension-list">{index?.extensions.slice(0, 12).map(ext => <div key={ext.ext}><bdi dir="ltr">{ext.ext || '—'}</bdi><ProgressBar label={ext.ext || s.t.none} value={ext.bytes} max={index.totalBytes} /><span>{formatCount(ext.count, s.locale)}</span></div>)}</div><h4>{s.t.indexedRange}</h4><p className="st-muted">{formatWhenMs(index?.oldestMtimeMs, s.locale)} — {formatWhenMs(index?.newestMtimeMs, s.locale)}</p>
    </div><div className="st-panel st-inspector"><h3>{s.t.inspector}</h3>{file && source && s.bridge ? <><StudioThumb bridge={s.bridge} source={source} file={file} category={file.category} /><h3>{file.name}</h3><div className="st-inline"><Badge>{CATEGORY_LABELS[file.category][s.locale]}</Badge>{file.readonly && <Badge tone="warning">{s.t.readOnlyFile}</Badge>}{file.hidden && <Badge>{s.t.hiddenFile}</Badge>}</div><dl className="st-definition"><div><dt>{s.t.bytes}</dt><dd>{formatBytes(file.size, s.locale)}</dd></div><div><dt>{s.t.modified}</dt><dd>{formatWhen(file.modifiedAt, s.locale)}</dd></div><div><dt>{s.t.relativePath}</dt><dd dir="ltr">{file.relative}</dd></div><div><dt>{s.t.sourceFolder}</dt><dd dir="ltr">{source.folder}</dd></div></dl><div className="st-inline"><button className="st-btn" onClick={() => s.toggleFile(source, file)}>{selected ? s.t.removeFromPlan : s.t.addToPlan}</button><button className="st-btn" onClick={() => { void s.bridge!.reveal({ inventoryId: source.inventory!.inventoryId, fileId: file.id }).then(ok => { if (!ok) s.notify(s.t.revealFailed); }).catch(cause => s.notify(describeError(cause, s.locale).message)); }}><FolderOpen size={15} />{s.t.reveal}</button></div><p className="st-note">{s.t.thumbNote}</p></> : <EmptyState icon={Eye} title={s.t.noSelection} compact />}</div></div>
  </section>;
}

function Builder() {
  const s = useStudio();
  const bytes = s.basketCategories.reduce((sum, c) => sum + c.bytes, 0);
  return <section className="st-surface"><SectionHeading icon={Workflow} title={s.t.builderTitle} description={s.t.builderBlurb} />
    <div className="st-two-column st-builder-grid"><div className="st-panel"><div className="st-inline st-between"><h3>{s.t.basket}</h3><button className="st-link" disabled={!s.basket.length} onClick={s.clearBasket}>{s.t.clearSelection}</button></div>
      {!s.basket.length ? <EmptyState icon={Files} title={s.t.basketEmpty} body={s.t.basketEmptyHint} compact action={<button className="st-btn" onClick={() => s.goto('library')}>{s.t.surfaceLibrary}</button>} /> : <><div className="st-stats st-stats--two"><Stat label={s.t.basketFiles} value={formatCount(s.basketCount, s.locale)} /><Stat label={s.t.bytes} value={formatBytes(bytes, s.locale)} /></div><div className="st-basket-list">{s.basket.map(item => <div key={item.key}><span className="st-card-icon">{item.kind === 'file' ? <CategoryIcon category={item.file.category} /> : item.kind === 'category' ? <CategoryIcon category={item.category} /> : <Folder size={18} />}</span><span><strong>{item.kind === 'file' ? item.file.name : item.kind === 'category' ? CATEGORY_LABELS[item.category][s.locale] : s.t.groupAll}</strong><small>{item.sourceName} · {formatCount(item.kind === 'file' ? 1 : item.count, s.locale)} {s.t.files}</small></span><button className="st-icon-btn" aria-label={`${s.t.remove}: ${item.kind === 'file' ? item.file.name : item.sourceName}`} onClick={() => s.removeBasketItem(item.key)}><X size={14} /></button></div>)}</div></>}
      <p className="st-note">{s.t.basketNote}</p></div>
      <div className="st-panel"><h3>{s.t.mode}</h3><div className="st-mode-list">{([{ key: 'virtual', title: s.t.modeVirtual, hint: s.t.modeVirtualHint, icon: Database }, { key: 'copy', title: s.t.modeCopy, hint: s.t.modeCopyHint, icon: Copy }, { key: 'move', title: s.t.modeMove, hint: s.t.modeMoveHint, icon: MoveRight }] as const).map(({ key, title, hint, icon: Icon }) => <label key={key} className={`st-option${s.mode === key ? ' is-active' : ''}`}><input type="radio" name="studio-mode" value={key} checked={s.mode === key} onChange={() => s.setMode(key)} /><Icon size={18} /><span><strong>{title}</strong><small>{hint}</small></span></label>)}</div>
        <h4>{s.t.structure}</h4><label className="st-field"><select aria-label={s.t.structure} value={s.structure} onChange={e => s.setStructure(e.target.value as typeof s.structure)}><option value="categorized">{s.t.structureCategorized}</option><option value="flat">{s.t.structureFlat}</option></select></label><h4>{s.t.collisions}</h4><label className="st-field"><select aria-label={s.t.collisions} value={s.collisionPolicy} onChange={e => s.setCollisionPolicy(e.target.value as typeof s.collisionPolicy)}><option value="review">{s.t.policyReview}</option><option value="skip">{s.t.policySkip}</option><option value="rename">{s.t.policyRename}</option></select></label><p className="st-muted st-sm">{s.collisionPolicy === 'review' ? s.t.policyReviewHint : s.collisionPolicy === 'skip' ? s.t.policySkipHint : s.t.policyRenameHint}</p>
      </div></div>
    <div className="st-panel"><div className="st-inline st-between"><h3>{s.t.destination}</h3>{s.mode !== 'virtual' && <button className="st-btn" onClick={() => s.goto('destinations')}><FolderTree size={16} />{s.t.chooseDestination}</button>}</div>{s.mode === 'virtual' ? <p className="st-muted">{s.t.virtualNeedsNoDestination}</p> : s.destination ? <bdi dir="ltr" className="st-path st-destination-path">{s.destination.path}</bdi> : <p className="st-muted">{s.t.noDestinationHint}</p>}</div>
    {s.basketCategories.length > 0 && <div className="st-panel"><h3>{s.t.categoriesInPlan}</h3><p className="st-muted st-sm">{s.t.folderNamesHint}</p><div className="st-category-settings">{s.basketCategories.map(c => <div key={c.category}><span className="st-inline"><CategoryIcon category={c.category} /><strong>{CATEGORY_LABELS[c.category][s.locale]}</strong><small>{formatCount(c.count, s.locale)} · {formatBytes(c.bytes, s.locale)}</small></span>{(s.structure === 'categorized' || s.mode === 'virtual') && <label className="st-field"><span>{s.t.categoryFolder}</span><input value={s.folderNames[c.category] ?? ''} placeholder={CATEGORY_LABELS[c.category][s.locale]} onChange={e => s.setFolderName(c.category, e.target.value)} /></label>}{s.mode !== 'virtual' && <><label className="st-field"><span>{s.t.perCategoryDestination}</span><select value={s.categoryDestinations[c.category]?.destinationId ?? ''} onChange={e => s.setCategoryDestination(c.category, e.target.value ? { destinationId: e.target.value, relativePath: '' } : null)}><option value="">{s.t.useSharedDestination}</option>{s.destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>{s.categoryDestinations[c.category] && <label className="st-field"><span>{s.t.relativePath}</span><input dir="ltr" placeholder={s.t.root} value={s.categoryDestinations[c.category]!.relativePath} onChange={e => s.setCategoryDestination(c.category, { ...s.categoryDestinations[c.category]!, relativePath: e.target.value })} /></label>}</>}</div>)}</div></div>}
    <div className="st-inline st-between st-build-footer"><span className="st-muted">{formatCount(s.basketCount, s.locale)} {s.t.files} · {formatBytes(bytes, s.locale)}</span><button className="st-btn st-btn--primary" disabled={!s.basketCount || s.planBuilding || s.executing || (s.mode !== 'virtual' && !s.destination)} onClick={() => void s.buildPlan()}>{s.planBuilding ? <Loader2 className="st-spin" size={16} /> : <ShieldCheck size={16} />}{s.planBuilding ? s.t.buildingPlan : s.t.buildPlan}</button></div>
  </section>;
}

function Destinations() {
  const s = useStudio();
  const [rootId, setRootId] = useState(s.destination?.destinationId ?? s.destinations[0]?.id ?? '');
  const [relative, setRelative] = useState(s.destination?.relativePath ?? '');
  const [listing, setListing] = useState<DestinationListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [create, setCreate] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!rootId || !s.bridge) return;
    let alive = true;
    setLoading(true); setError(''); setListing(null);
    s.bridge.listDestination({ destinationId: rootId, relativePath: relative }).then(result => { if (alive) setListing(result); }).catch(cause => { if (alive) setError(describeError(cause, s.locale).message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [rootId, relative, refresh, s.bridge, s.locale]);
  const choose = (result: DestinationListing) => {
    s.setDestination({ destinationId: result.destinationId, rootName: result.name, rootPath: result.root, relativePath: result.relativePath, path: result.path });
  };
  return <section className="st-surface"><SectionHeading icon={FolderTree} title={s.t.destinationsTitle} description={s.t.destinationsBlurb} actions={<button className="st-btn" onClick={() => { void s.addDestinationRoot().then(root => { if (root) { setRootId(root.id); setRelative(''); } }); }}><FolderPlus size={16} />{s.t.addDestination}</button>} />
    {!s.destinations.length ? <EmptyState icon={FolderTree} title={s.t.noDestinations} body={s.t.noDestinationsHint} /> : <>
      <div className="st-root-choices">{s.destinations.map(d => <button key={d.id} className={`st-root-choice${rootId === d.id ? ' is-active' : ''}`} onClick={() => { setRootId(d.id); setRelative(''); }}><FolderOpen size={18} /><strong>{d.name}</strong><bdi dir="ltr">{d.path}</bdi></button>)}</div>
      {error && <p className="st-banner st-banner--danger" role="alert">{error}</p>}
      {loading && <p role="status">{s.t.loading}</p>}
      {listing && <div className="st-panel"><div className="st-inline st-between"><div className="st-inline"><button className="st-icon-btn" disabled={listing.parentRelative === null} aria-label={s.t.upOne} onClick={() => setRelative(listing.parentRelative ?? '')}><ChevronUp size={17} /></button><bdi dir="ltr" className="st-path">{listing.path}</bdi></div><button className="st-btn st-btn--small" onClick={() => setCreate(true)}><FolderPlus size={16} />{s.t.createFolder}</button></div>
        <div className="st-folder-grid">{listing.folders.map(folder => <button key={folder.relativePath} className="st-folder" onClick={() => setRelative(folder.relativePath)}><Folder size={23} /><span>{folder.name}</span><ChevronRight size={15} /></button>)}</div>
        {!listing.folders.length && <EmptyState icon={Folder} title={s.t.emptyFolder} compact />}{listing.truncated && <p className="st-banner st-banner--warning">{s.t.partialResult}</p>}
        <div className="st-inline st-between"><button className="st-btn" onClick={() => setRefresh(v => v + 1)}><RefreshCw size={15} />{s.t.refresh}</button><button className="st-btn st-btn--primary" onClick={() => { choose(listing); s.goto('builder'); }}><Check size={16} />{s.t.useThisFolder}</button></div>
      </div>}
    </>}
    {s.destination && <p className="st-note">{s.t.currentDestination}: <bdi dir="ltr">{s.destination.path}</bdi></p>}
    <p className="st-note"><ShieldCheck size={15} />{s.t.folderCreationOnly}</p>
    {create && listing && <CreateFolder listing={listing} onClose={() => setCreate(false)} onChosen={result => { choose(result); setRelative(result.relativePath); setRefresh(v => v + 1); setCreate(false); }} />}
  </section>;
}

function CreateFolder({ listing, onClose, onChosen }: { listing: DestinationListing; onClose: () => void; onChosen: (listing: DestinationListing) => void }) {
  const s = useStudio();
  const [name, setName] = useState('');
  const [validation, setValidation] = useState<FolderValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [proposal, setProposal] = useState(2);
  useEffect(() => {
    let alive = true;
    if (!name || !s.bridge) { setValidation(null); setValidating(false); return; }
    setValidating(true);
    const timer = window.setTimeout(() => { void s.bridge!.validateFolder({ destinationId: listing.destinationId, parentRelative: listing.relativePath, name }).then(result => { if (alive) setValidation(result); }).catch(cause => { if (alive) setError(describeError(cause, s.locale).message); }).finally(() => { if (alive) setValidating(false); }); }, 200);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [name, listing, s.bridge, s.locale]);
  const updateName = (value: string) => { setName(value); setValidation(null); setError(''); };
  const useFolder = async (existing: boolean) => {
    if (!s.bridge) return;
    setBusy(true); setError('');
    try {
      let child = [listing.relativePath, validation?.existingName ?? name].filter(Boolean).join('/');
      if (!existing) {
        const result = await s.bridge.createFolder({ destinationId: listing.destinationId, parentRelative: listing.relativePath, name });
        child = result.relativePath;
      }
      const result = await s.bridge.listDestination({ destinationId: listing.destinationId, relativePath: child });
      onChosen(result);
      s.notify(existing ? s.t.destinationSelected : s.t.folderCreated);
    } catch (cause) { setError(describeError(cause, s.locale).message); }
    finally { setBusy(false); }
  };
  const close = useCallback(() => { if (!busy) onClose(); }, [busy, onClose]);
  const fullPath = validation?.fullPath ?? `${listing.path}${listing.path.endsWith('\\') ? '' : '\\'}${name}`;
  return <Modal title={s.t.createFolderTitle} subtitle={s.t.createFolderBlurb} closeLabel={s.t.close} onClose={close} footer={<><button className="st-btn" disabled={busy} onClick={close}>{s.t.cancel}</button><button className="st-btn st-btn--primary" disabled={busy || validating || !validation?.ok} onClick={() => void useFolder(false)}>{busy ? s.t.creating : s.t.createAndUse}</button></>}>
    <label className="st-field"><span>{s.t.folderName}</span><input autoFocus placeholder={s.t.folderNamePlaceholder} value={name} disabled={busy} onChange={e => updateName(e.target.value)} /></label><div className="st-path-preview"><small>{s.t.pathPreview}</small><bdi dir="ltr">{fullPath}</bdi></div>
    {validating ? <p role="status">{s.t.validating}</p> : validation && <p className={`st-banner st-banner--${validation.ok ? 'success' : 'warning'}`} role="status">{validation.ok ? s.t.validName : ERROR_TEXT[validation.code ?? '']?.[s.locale] ?? validation.message ?? s.t.invalidName}</p>}
    {validation?.existing && <div className="st-conflict"><h4>{s.t.conflictChooser}</h4><p>{validation.existingType === 'directory' ? s.t.existingIsFolder : s.t.existingIsFile}</p><div className="st-inline">{validation.existingType === 'directory' && <button className="st-btn" disabled={busy} onClick={() => void useFolder(true)}>{s.t.useExisting}</button>}<button className="st-btn" disabled={busy} onClick={() => { updateName(`${name.replace(/ \(\d+\)$/, '')} (${proposal})`); setProposal(v => v + 1); }}>{s.t.renameProposal}</button></div></div>}
    {validation?.longPath && <p className="st-banner st-banner--warning">{s.t.longPath}</p>}{error && <p className="st-banner st-banner--danger" role="alert">{error}</p>}
  </Modal>;
}

function Review() {
  const s = useStudio();
  const plan = s.plan;
  const [approved, setApproved] = useState(false);
  const [modeApproved, setModeApproved] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { setApproved(false); setModeApproved(false); }, [plan?.planHash]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const expired = !!plan && now >= plan.expiresAtMs;
  return <section className="st-surface"><SectionHeading icon={ShieldCheck} title={s.t.reviewTitle} description={s.t.reviewBlurb} actions={<button className="st-btn" onClick={() => { s.discardPlan(); s.goto('builder'); }}>{s.t.rebuild}</button>} />
    {!plan ? <EmptyState icon={ShieldCheck} title={s.t.noPlan} body={s.t.noPlanHint} action={<button className="st-btn" onClick={() => s.goto('builder')}>{s.t.openPlan}</button>} /> : <>
      <div className="st-inline st-between"><Badge tone={expired || !plan.executable ? 'warning' : 'success'}>{expired ? s.t.expired : plan.executable ? s.t.executable : s.t.planNotExecutable}</Badge><Badge icon={Lock}>{s.t.immutablePlan}</Badge></div>
      <dl className="st-definition st-plan-identity"><div><dt>{s.t.planId}</dt><dd dir="ltr">{plan.planId}</dd></div><div><dt>{s.t.planHash}</dt><dd dir="ltr">{plan.planHash}</dd></div><div><dt>{s.t.operation}</dt><dd>{plan.operation === 'copy' ? s.t.modeCopy : plan.operation === 'move' ? s.t.modeMove : s.t.modeVirtual}</dd></div><div><dt>{s.t.expires}</dt><dd>{formatWhen(plan.expiresAt, s.locale)}</dd></div><div><dt>{s.t.destinationSummary}</dt><dd dir="ltr">{plan.destinationSummary}</dd></div><div><dt>{s.t.sourceRoots}</dt><dd>{plan.sourceRoots.map(root => <bdi key={root} dir="ltr" className="st-path">{root}</bdi>)}</dd></div></dl>
      <div className="st-stats"><Stat label={s.t.plannedFiles} value={formatCount(plan.totals.files, s.locale)} /><Stat label={s.t.plannedBytes} value={formatBytes(plan.totals.bytes, s.locale)} /><Stat label={s.t.folderSteps} value={formatCount(plan.folderSteps.filter(f => !f.exists).length, s.locale)} /></div>
      <div className="st-panel"><h3>{s.t.categoriesIncluded}</h3><div className="st-inline">{plan.categories.map(c => <Badge key={c.category} icon={undefined}>{CATEGORY_LABELS[c.category][s.locale]} · {formatCount(c.files, s.locale)} · {formatBytes(c.bytes, s.locale)}</Badge>)}</div><h4>{s.t.folderSteps}</h4>{plan.folderSteps.length ? <ul className="st-plan-folders">{plan.folderSteps.map((f, i) => <li key={i}><Folder size={14} /><bdi dir="ltr">{f.path}</bdi><Badge>{f.exists ? s.t.existsStep : s.t.createStep}</Badge></li>)}</ul> : <p className="st-muted">{s.t.noFolderSteps}</p>}</div>
      {plan.operation === 'virtual' && <p className="st-banner">{s.t.virtualReviewNote}</p>}
      {plan.collisions.length > 0 && <div className="st-banner st-banner--warning"><div><strong>{s.t.collisionList} ({plan.collisions.length})</strong><p>{s.t.planBlocked}</p><ul>{plan.collisions.slice(0, 100).map((c, i) => <li key={i}><bdi dir="ltr">{c.targetPath}</bdi></li>)}</ul></div></div>}
      {plan.skipped.length > 0 && <details className="st-warning-details"><summary>{s.t.skippedList} ({plan.skipped.length})</summary><ul>{plan.skipped.map((file, i) => <li key={i}>{file.sourceRelative} · {file.reason}</li>)}</ul></details>}
      {plan.warnings.length > 0 && <div className="st-banner st-banner--warning"><ul>{plan.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></div>}
      <h3>{s.t.previewFiles}</h3><div className="st-table-wrap"><table className="st-table"><thead><tr><th>{s.t.sourceColumn}</th><th>{s.t.targetColumn}</th><th>{s.t.bytes}</th><th>{s.t.status}</th></tr></thead><tbody>{plan.files.slice(0, 250).map(file => <tr key={file.index}><td><strong>{file.name}</strong><bdi dir="ltr">{file.sourceRoot} / {file.sourceRelative}</bdi></td><td><bdi dir="ltr">{file.targetPath ?? file.targetRelative ?? file.category}</bdi></td><td>{formatBytes(file.size, s.locale)}</td><td><Badge tone={file.status === 'ready' ? 'success' : 'warning'}>{file.status === 'ready' ? s.t.ready : s.t.collision}</Badge></td></tr>)}</tbody></table></div>{plan.files.length > 250 && <p className="st-muted">{s.t.previewLimited}</p>}
      <div className="st-approval"><h3>{s.t.approval}</h3><p>{s.t.approvalIntro}</p><label><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} />{s.t.approvalCheck}</label><label><input type="checkbox" checked={modeApproved} onChange={e => setModeApproved(e.target.checked)} />{plan.operation === 'move' ? s.t.approvalMove : plan.operation === 'copy' ? s.t.approvalCopy : s.t.approvalVirtual}</label><p className="st-muted st-sm">{s.t.planExpiryNote}</p><button className="st-btn st-btn--primary" disabled={!approved || !modeApproved || expired || !plan.executable || s.executing} onClick={() => { s.goto('execution'); void s.executePlan(plan); }}><ShieldCheck size={16} />{s.executing ? s.t.executing : s.t.approveExecute}</button></div>
    </>}
  </section>;
}

function Execution() {
  const s = useStudio();
  const live = s.executionLive;
  const result = live?.summary ?? (!s.executing ? s.lastExecution?.summary : undefined);
  const phases: Record<string, string> = { started: s.t.phaseStarted, 'creating-folders': s.t.phaseFolders, progress: s.t.phaseCopying, completed: s.t.phaseCompleted, partial: s.t.phasePartial, cancelled: s.t.phaseCancelled, failed: s.t.phaseFailed };
  return <section className="st-surface"><SectionHeading icon={Gauge} title={s.t.executionTitle} description={s.t.executionBlurb} />
    {!live ? <EmptyState icon={Gauge} title={s.executing ? s.t.phaseStarted : s.t.noExecution} body={s.t.noExecutionHint} /> : <div className="st-panel st-execution"><div className="st-inline st-between"><Badge tone={live.phase === 'completed' ? 'success' : ['failed', 'partial', 'cancelled'].includes(live.phase) ? 'warning' : 'accent'}>{phases[live.phase] ?? live.phase}</Badge><Badge icon={Database}>{s.t.realProgress}</Badge></div><h3>{live.currentName ?? (s.executing ? s.t.processing : s.t.executionDone)}</h3><ProgressBar value={live.processed} max={live.total} label={s.t.processing} indeterminate={s.executing && !live.total} /><p>{formatCount(live.processed, s.locale)} / {formatCount(live.total, s.locale)} {s.t.files}</p><ProgressBar value={live.bytes} max={live.totalBytes} label={s.t.bytesVerified} /><p className="st-muted">{formatBytes(live.bytes, s.locale)} / {formatBytes(live.totalBytes, s.locale)} · {s.t.bytesUnit}</p><div className="st-stats"><Stat label={s.t.completedFiles} value={formatCount(live.summary?.completedFiles ?? live.completed, s.locale)} /><Stat label={s.t.failedFiles} value={formatCount(live.summary?.failedFiles ?? live.failed, s.locale)} /><Stat label={s.t.cancelledFiles} value={formatCount(live.summary?.cancelledFiles ?? live.cancelled, s.locale)} /></div>{live.message && <p className="st-banner st-banner--danger">{live.message}</p>}{s.executing && <button className="st-btn" onClick={() => void s.cancelExecution()}>{s.t.cancelExecution}</button>}</div>}
    {result && <div className="st-panel"><h3>{s.t.executionResult}</h3><div className="st-inline"><Badge tone={result.undoAvailable ? 'success' : 'neutral'}>{result.undoAvailable ? s.t.undoAvailable : s.t.undoUnavailable}</Badge><span>{s.t.skippedFiles}: {formatCount(result.skippedFiles, s.locale)}</span></div><p className="st-path" dir="ltr">{result.id}</p><button className="st-btn" onClick={() => s.goto('history')}><History size={15} />{s.t.viewHistory}</button></div>}
    <p className="st-note"><ShieldCheck size={16} />{s.t.executionNote}</p>
  </section>;
}

function HistoryPanel() {
  const s = useStudio();
  const [undo, setUndo] = useState<string | null>(null);
  return <section className="st-surface"><SectionHeading icon={History} title={s.t.historyTitle} description={s.t.historyBlurb} actions={<button className="st-btn" disabled={s.historyLoading} onClick={() => void s.loadHistory()}><RefreshCw size={15} />{s.t.reloadHistory}</button>} />
    {s.historyLoading && <p role="status">{s.t.loadingHistory}</p>}{!s.history.length && !s.historyLoading && <EmptyState icon={History} title={s.t.noHistory} body={s.t.noHistoryHint} />}
    <div className="st-history-list">{s.history.map(operation => <JournalCard key={operation.operationId} operation={operation} onUndo={() => setUndo(operation.operationId)} />)}</div>
    <p className="st-note"><Undo2 size={15} />{s.t.undoWarning}</p>{undo && <UndoDialog journalId={undo} onClose={() => setUndo(null)} />}
  </section>;
}

function JournalCard({ operation: op, onUndo }: { operation: JournalOperation; onUndo: () => void }) {
  const s = useStudio();
  const statuses: Record<string, string> = { running: s.t.statusRunning, interrupted: s.t.statusInterrupted, completed: s.t.statusCompleted, partial: s.t.statusPartial, failed: s.t.statusFailed, cancelled: s.t.statusCancelled };
  return <article className="st-panel st-journal"><div className="st-inline st-between"><div className="st-inline"><span className="st-card-icon">{op.mode === 'move' ? <MoveRight size={20} /> : op.mode === 'copy' ? <Copy size={20} /> : <Database size={20} />}</span><h3>{op.mode === 'move' ? s.t.moveOperation : op.mode === 'copy' ? s.t.copyOperation : s.t.virtualCollection}</h3><Badge tone={op.status === 'completed' ? 'success' : 'warning'}>{statuses[op.status] ?? op.status}</Badge></div><small className="st-muted">{formatWhen(op.createdAt, s.locale)}</small></div>
    <bdi dir="ltr" className="st-path">{op.destinationSummary ?? '—'}</bdi><div className="st-inline st-journal-counts"><span>{s.t.completedFiles}: {formatCount(op.completedFiles, s.locale)} / {formatCount(op.totalFiles, s.locale)}</span><span>{s.t.failedFiles}: {formatCount(op.failedFiles, s.locale)}</span><span>{s.t.skippedFiles}: {formatCount(op.skippedFiles, s.locale)}</span><span>{formatBytes(op.totalBytes, s.locale)}</span>{op.undoCompletedFiles > 0 && <Badge>{s.t.restored}: {formatCount(op.undoCompletedFiles, s.locale)}</Badge>}</div>
    {op.errors.length > 0 && <div className="st-banner st-banner--danger"><ul>{op.errors.map((error, i) => <li key={i}>{error}</li>)}</ul></div>}{op.warnings.length > 0 && <div className="st-banner st-banner--warning"><ul>{op.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></div>}
    <details className="st-journal-entries"><summary>{s.t.openEntries} · {formatCount(op.entries.length, s.locale)}</summary><p dir="ltr" className="st-path">{op.operationId}</p><div className="st-table-wrap"><table className="st-table"><thead><tr><th>{s.t.name}</th><th>{s.t.source}</th><th>{s.t.destination}</th><th>{s.t.entryState}</th><th>{s.t.verification}</th><th>{s.t.undoState}</th></tr></thead><tbody>{op.entries.map(entry => <tr key={entry.index}><td>{entry.name}</td><td><bdi dir="ltr">{entry.sourceRelative}</bdi></td><td><bdi dir="ltr">{entry.targetRelative}</bdi></td><td>{entry.state}{entry.error && <small>{entry.error}</small>}</td><td>{entry.verification ?? '—'}</td><td>{entry.undo?.state ?? '—'}{entry.undo?.error && <small>{entry.undo.error}</small>}</td></tr>)}</tbody></table></div></details>
    {op.undoAvailable && <button className="st-btn" disabled={s.executing} onClick={onUndo}><Undo2 size={16} />{s.t.undoCheck}</button>}
  </article>;
}

function UndoDialog({ journalId, onClose }: { journalId: string; onClose: () => void }) {
  const s = useStudio();
  const [preview, setPreview] = useState<UndoPreview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resolution, setResolution] = useState<'skip' | 'rename'>('skip');
  const [approved, setApproved] = useState(false);
  const [result, setResult] = useState<UndoResult | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [undoLive, setUndoLive] = useState<{ operationId: string; processed: number; total: number } | null>(null);
  useEffect(() => {
    let alive = true;
    setPreview(null); setApproved(false); setError('');
    void s.bridge?.previewUndo({ journalId }).then(value => { if (alive) setPreview(value); }).catch(cause => { if (alive) setError(describeError(cause, s.locale).message); });
    return () => { alive = false; };
  }, [journalId, refresh, s.bridge, s.locale]);
  useEffect(() => s.bridge?.onEvent(event => {
    if (event.type !== 'undo' || event.journalId !== journalId) return;
    setUndoLive(previous => ({ operationId: event.operationId, processed: event.processed ?? previous?.processed ?? 0, total: event.total ?? event.totalFiles ?? previous?.total ?? 0 }));
  }), [s.bridge, journalId]);
  const authorize = async (kind: 'source' | 'destination', root: string) => {
    if (!s.bridge) return;
    setBusy(true); setApproved(false); setError('');
    try {
      const chosen = kind === 'source' ? await s.bridge.pickSource() : await s.addDestinationRoot();
      const selectedPath = chosen && ('folder' in chosen ? chosen.folder : chosen.path);
      if (selectedPath && selectedPath.toLowerCase() !== root.toLowerCase()) setError(s.t.undoWrongRoot);
      else if (chosen) setRefresh(value => value + 1);
    } catch (cause) { setError(describeError(cause, s.locale).message); }
    finally { setBusy(false); }
  };
  const close = useCallback(() => { if (!busy) onClose(); }, [busy, onClose]);
  const apply = async () => {
    if (!approved || !s.bridge || !preview) return;
    setBusy(true); setError('');
    try { const value = await s.bridge.applyUndo({ journalId, previewId: preview.previewId, previewHash: preview.previewHash, resolution, approved: true }); setResult(value); setApproved(false); await s.loadHistory(); }
    catch (cause) { setError(describeError(cause, s.locale).message); }
    finally { setBusy(false); }
  };
  return <Modal title={s.t.undoTitle} subtitle={s.t.undoIntro} closeLabel={s.t.closeUndo} onClose={close} wide footer={<><button className="st-btn" disabled={busy} onClick={close}>{s.t.close}</button>{!result && <button className="st-btn st-btn--primary" disabled={busy || !approved || !preview?.eligible} onClick={() => void apply()}><Undo2 size={16} />{busy ? s.t.undoApplying : s.t.undoApply}</button>}</>}>
    {!preview && !error && <p role="status">{s.t.undoPreviewing}</p>}{error && <p className="st-banner st-banner--danger" role="alert">{error}</p>}
    {!busy && !result && <button className="st-btn" onClick={() => setRefresh(value => value + 1)}><RefreshCw size={15} />{s.t.undoRefresh}</button>}
    {preview?.requiredRoots.length ? <div className="st-panel"><p>{s.t.undoAuthorizeHint}</p>{preview.requiredRoots.map(({ kind, root }) => <div className="st-inline" key={`${kind}:${root}`}><bdi className="st-path" dir="ltr">{root}</bdi><button className="st-btn" disabled={busy} onClick={() => void authorize(kind, root)}>{s.t.undoAuthorize} · {kind === 'source' ? s.t.source : s.t.destination}</button></div>)}</div> : null}
    {busy && undoLive && <div role="status"><ProgressBar label={s.t.undoApplying} value={undoLive.processed} max={undoLive.total} /><button className="st-btn" onClick={() => void s.bridge?.cancelExecution({ operationId: undoLive.operationId }).catch(cause => setError(describeError(cause, s.locale).message))}>{s.t.cancelExecution}</button></div>}
    {result ? <div role="status"><h3>{s.t.undoResult}</h3><div className="st-stats"><Stat label={s.t.restored} value={formatCount(result.restored, s.locale)} /><Stat label={s.t.skipped} value={formatCount(result.skipped, s.locale)} /><Stat label={s.t.failedFiles} value={formatCount(result.failed, s.locale)} /></div><p>{s.t.undoCompletedNotice}</p><p className="st-muted">{s.t.viewHistory}</p></div> : preview && <><div className="st-stats"><Stat label={s.t.undoEligible} value={formatCount(preview.eligible, s.locale)} /><Stat label={s.t.undoConflict} value={formatCount(preview.conflicts, s.locale)} /><Stat label={s.t.bytes} value={formatBytes(preview.bytes, s.locale)} /></div><label className="st-field"><span>{s.t.undoResolution}</span><select value={resolution} disabled={busy} onChange={e => { setResolution(e.target.value as typeof resolution); setApproved(false); }}><option value="skip">{s.t.undoSkip}</option><option value="rename">{s.t.undoRename}</option></select></label><p className="st-note">{s.t.undoConflictNote}</p><div className="st-table-wrap"><table className="st-table"><thead><tr><th>{s.t.name}</th><th>{s.t.status}</th><th>{s.t.undoRestoreAs}</th><th>{s.t.undoReason}</th></tr></thead><tbody>{preview.entries.map(entry => <tr key={entry.index}><td>{entry.name}</td><td>{entry.eligible ? entry.conflict ? s.t.undoConflict : s.t.undoEligible : s.t.undoIneligible}</td><td>{entry.conflict && resolution === 'skip' ? s.t.skipped : entry.restoreName}</td><td>{entry.reason ?? '—'}</td></tr>)}</tbody></table></div><label className="st-check"><input type="checkbox" checked={approved} disabled={busy} onChange={e => setApproved(e.target.checked)} />{s.t.undoWarning}</label></>}
  </Modal>;
}

function Suggestions() {
  const s = useStudio();
  const index = s.inventory;
  const top = index?.categories.slice().sort((a, b) => b.count - a.count)[0];
  const view = (category: typeof s.filters.category, large = false) => { s.updateFilters({ category, size: large ? 'medium' : 'any', sort: 'size', desc: true }); s.goto('library'); };
  return <section className="st-surface"><SectionHeading icon={Sparkles} title={s.t.suggestionsTitle} description={s.t.suggestionsBlurb} /><Badge icon={Database}>{s.t.rulesOnly}</Badge>
    {!index || !s.activeSource ? <EmptyState icon={Sparkles} title={s.t.noSuggestions} /> : <div className="st-suggestion-grid">
      {top && top.count > 0 && <article className="st-panel"><CategoryIcon category={top.key} size={27} /><h3>{s.t.suggestionTopCategory}</h3><p className="st-muted">{s.t.suggestionTopCategoryHint}</p><strong>{CATEGORY_LABELS[top.key][s.locale]} · {formatCount(top.count, s.locale)} {s.t.files}</strong><div className="st-inline"><button className="st-btn" onClick={() => view(top.key)}>{s.t.viewCollection}</button><button className="st-btn" onClick={() => { s.addCategory(s.activeSource!, top.key); s.goto('builder'); }}>{s.t.openSuggestion}</button></div></article>}
      <article className="st-panel"><Files size={27} /><h3>{s.t.suggestionLarge}</h3><p className="st-muted">{s.t.suggestionLargeHint}</p><strong>{s.insight.loading ? s.t.loading : `${formatCount(s.insight.largeCount, s.locale)} ${s.t.files} · ${formatBytes(s.insight.largeBytes, s.locale)}`}</strong><small className="st-muted">≥ 50 MB · {s.insight.largestName ?? '—'}</small><button className="st-btn" onClick={() => { s.updateFilters({ category: 'all', size: 'from50', sort: 'size', desc: true }); s.goto('library'); }}>{s.t.viewCollection}</button></article>
      {(['installer', 'archive', 'other'] as const).map(category => { const stat = index.categories.find(c => c.key === category); return !stat?.count ? null : <article key={category} className="st-panel"><CategoryIcon category={category} size={27} /><h3>{category === 'installer' ? s.t.suggestionInstallers : category === 'archive' ? s.t.suggestionArchives : s.t.suggestionOther}</h3><p className="st-muted">{category === 'installer' ? s.t.suggestionInstallersHint : category === 'archive' ? s.t.suggestionArchivesHint : s.t.suggestionOtherHint}</p><strong>{formatCount(stat.count, s.locale)} {s.t.files} · {formatBytes(stat.bytes, s.locale)}</strong><button className="st-btn" onClick={() => view(category)}>{s.t.viewCollection}</button></article>; })}
      {index.partial && <article className="st-panel"><AlertTriangle size={27} /><h3>{s.t.suggestionPartial}</h3><p className="st-muted">{s.t.suggestionPartialHint}</p><button className="st-btn" disabled={!!s.scanRunning} onClick={() => void s.beginScan(s.activeSource!.id)}>{s.t.rescan}</button></article>}
    </div>}
    <p className="st-note">{s.t.noActionTaken}</p>
  </section>;
}
