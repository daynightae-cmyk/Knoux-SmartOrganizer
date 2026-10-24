import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Check, Eye, FolderOpen, FolderPlus, Images,
  LayoutGrid, List, Loader2, Lock, RefreshCw, Search, ShieldCheck, Workflow
} from 'lucide-react';
import { formatBytes, formatCount } from '../lib/format';
import { CATEGORY_LABELS, CATEGORY_ORDER } from './copy';
import { useStudio } from './context';
import { CategoryIcon, StudioThumb } from './parts';
import type { FileInfo, OrganizationMode } from './types';
import './styles/command-center.css';

/**
 * The flagship command board is a composition of the existing Studio state.
 * Source grants, indexing, gallery queries, basket and plan review all use
 * the original secured preload bridge; this view performs no file mutations.
 */
export function StudioCommandCenter() {
  const s = useStudio();
  const [previewId, setPreviewId] = useState<number | null>(null);
  const index = s.inventory;
  const source = s.activeSource;
  const words = s.locale === 'ar' ? {
    heading: 'مركز التنظيم الذكي',
    caption: 'المصادر والتصنيفات والقرار في مساحة عمل واحدة.',
    authorized: 'مصادر مصرح بها',
    indexed: 'ملفات مفهرسة',
    staged: 'ملفات ضمن الخطة',
    sources: 'المجلدات المصرح بها',
    add: 'إضافة مجلد',
    unknown: 'بانتظار الفهرسة',
    visual: 'المكتبة المرئية',
    tiles: 'التصنيفات الفعلية',
    gallery: 'الملفات داخل التصنيف',
    search: 'ابحث داخل المجلد المفهرس…',
    all: 'كل الملفات',
    detail: 'معاينة وقرار التنظيم',
    choose: 'اختر ملفاً لمراجعته',
    chooseDescription: 'اختر مجلداً ثم اعرض ملفات حقيقية لتكوين خطة آمنة.',
    empty: 'ابدأ بإضافة مجلد من جهازك. لن نعرض ملفات أو أرقامًا افتراضية.',
    scan: 'فهرسة المجلد',
    partial: 'فهرس جزئي — راجع التحذيرات في شاشة المصادر',
    categories: 'استعراض المكتبة كاملة',
    addGroup: 'أضف التصنيف للخطة',
    addFile: 'إضافة الملف للخطة',
    removeFile: 'إزالة الملف من الخطة',
    plan: 'فتح مُنشئ خطة التنظيم',
    selected: 'التحديد الحالي',
    destination: 'الوجهة',
    notSet: 'لم تُحدد بعد',
    change: 'اختيار الوجهة',
    operation: 'طريقة التنظيم',
    virtual: 'تنظيم افتراضي',
    copy: 'نسخ الملفات',
    move: 'نقل الملفات',
    safe: 'المعاينة والفهرسة لا يغيران الملفات. التنفيذ يتطلب مراجعة واعتماد الخطة.',
    latest: 'الملفات المعروضة من نتائج الفهرس',
    preview: 'معاينة الملف'
  } : {
    heading: 'Smart Organization Command Center',
    caption: 'Sources, categories and decisions in one connected workspace.',
    authorized: 'Authorized sources',
    indexed: 'Indexed files',
    staged: 'Files in plan',
    sources: 'Authorized folders',
    add: 'Add folder',
    unknown: 'Not indexed yet',
    visual: 'Visual library',
    tiles: 'Measured categories',
    gallery: 'Files in selected category',
    search: 'Search indexed files in this folder…',
    all: 'All files',
    detail: 'Organization preview',
    choose: 'Select a file to inspect',
    chooseDescription: 'Authorize a folder, inspect its real files, and build a safe plan.',
    empty: 'Add a local folder to begin. No sample files or invented metrics are shown.',
    scan: 'Index folder',
    partial: 'Partial index — review warnings in Sources',
    categories: 'Explore full library',
    addGroup: 'Add category to plan',
    addFile: 'Add file to plan',
    removeFile: 'Remove file from plan',
    plan: 'Open organization builder',
    selected: 'Current selection',
    destination: 'Destination',
    notSet: 'Not selected',
    change: 'Choose destination',
    operation: 'Organization mode',
    virtual: 'Virtual organization',
    copy: 'Copy files',
    move: 'Move files',
    safe: 'Indexing and preview never modify files. Execution requires an explicit plan review and approval.',
    latest: 'Files displayed from the real inventory query',
    preview: 'File preview'
  };
  const totalFiles = s.sources.reduce((sum, item) => sum + (s.saved[item.id]?.totalFiles ?? 0), 0);
  const categoryRows = index ? CATEGORY_ORDER.map((key) => ({
    key,
    stat: index.categories.find((entry) => entry.key === key)
  })) : [];
  const preview: FileInfo | null = useMemo(
    () => s.page?.rows.find((file) => file.id === previewId) ?? s.page?.rows[0] ?? null,
    [s.page, previewId]
  );
  useEffect(() => {
    setPreviewId(null);
  }, [source?.id, index?.inventoryId]);

  return (
    <section className="st-command" aria-label={words.heading}>
      <header className="st-command__headline">
        <div className="st-command__identity">
          <span className="st-command__mark"><Workflow size={24} /></span>
          <div><h2>{words.heading}</h2><p>{words.caption}</p></div>
        </div>
        <div className="st-command__metrics">
          <div><small>{words.authorized}</small><strong>{formatCount(s.sources.length, s.locale)}</strong></div>
          <div><small>{words.indexed}</small><strong>{formatCount(totalFiles, s.locale)}</strong></div>
          <div><small>{words.staged}</small><strong>{formatCount(s.basketCount, s.locale)}</strong></div>
        </div>
      </header>

      <div className="st-command__columns">
        <aside className="st-command__pane st-command__sources" aria-label={words.sources}>
          <div className="st-command__panehead"><h3><FolderOpen size={16} />{words.sources}</h3><span>{s.sources.length}</span></div>
          {s.sources.length ? <div className="st-command__source-list">
            {s.sources.map((item) => {
              const summary = s.saved[item.id];
              return <div key={item.id} className={'st-command__source' + (item.id === s.activeSourceId ? ' is-active' : '')}>
                <button type="button" className="st-command__source-main" onClick={() => s.setActiveSourceId(item.id)} aria-pressed={item.id === s.activeSourceId}>
                  <FolderOpen size={20} /><span><strong>{item.name}</strong><small dir="ltr" title={item.folder}>{item.folder}</small><em>{summary ? formatCount(summary.totalFiles, s.locale) + ' ' + s.t.files : words.unknown}</em></span>
                </button>
                <button type="button" className="st-command__scan" disabled={!!s.scanRunning} aria-label={words.scan + ': ' + item.name} title={words.scan} onClick={() => void s.beginScan(item.id)}><RefreshCw size={13} /></button>
              </div>;
            })}
          </div> : <div className="st-command__source-empty"><FolderPlus size={33} /><p>{words.empty}</p></div>}
          <button type="button" className="st-btn st-btn--primary st-command__add" onClick={() => void s.pickSource()} disabled={!!s.scanRunning}><FolderPlus size={15} />{words.add}</button>
          {s.scanRunning && <p className="st-command__scanstatus" role="status"><Loader2 className="st-spin" size={14} />{s.t.indexing}</p>}
          <p className="st-command__footnote"><Lock size={13} />{s.t.readOnlyIndex}</p>
        </aside>

        <div className="st-command__pane st-command__library" aria-label={words.visual}>
          <div className="st-command__panehead">
            <h3><LayoutGrid size={16} />{words.visual}</h3>
            <button type="button" className="st-link" onClick={() => s.goto('library')}>{words.categories}<ArrowRight size={13} /></button>
          </div>
          {!index ? <div className="st-command__onboarding">
            <span className="st-command__onboarding-art"><Images size={46} /></span>
            <strong>{s.sources.length ? s.t.notScanned : words.choose}</strong>
            <p>{s.sources.length ? s.t.scanBeforeOrganize : words.chooseDescription}</p>
            <button type="button" className="st-btn st-btn--primary" disabled={!!s.scanRunning} onClick={() => source ? void s.beginScan(source.id) : void s.pickSource()}>
              {s.sources.length ? words.scan : words.add}
            </button>
          </div> : <>
            {index.partial && <p className="st-command__warning" role="status">{words.partial}</p>}
            <div className="st-command__sectionlabel"><strong>{words.tiles}</strong><small>{index.categories.filter(c => c.count > 0).length} / {CATEGORY_ORDER.length}</small></div>
            <div className="st-command__category-grid">
              {categoryRows.map(({ key, stat }) => <div className={'st-command__category' + (s.filters.category === key ? ' is-active' : '')} key={key}>
                <button type="button" className="st-command__category-main" onClick={() => s.updateFilters({ category: s.filters.category === key ? 'all' : key })} aria-pressed={s.filters.category === key}>
                  <CategoryIcon category={key} size={21} />
                  <strong>{CATEGORY_LABELS[key][s.locale]}</strong>
                  <span>{formatCount(stat?.count ?? 0, s.locale)}</span><small>{formatBytes(stat?.bytes ?? 0, s.locale)}</small>
                </button>
                {stat && stat.count > 0 && <button type="button" className="st-command__category-add" onClick={() => source && s.addCategory(source, key)} aria-label={words.addGroup + ': ' + CATEGORY_LABELS[key][s.locale]} title={words.addGroup}>+</button>}
              </div>)}
            </div>
            <div className="st-command__gallery-heading">
              <div className="st-command__sectionlabel"><strong>{words.gallery}</strong><small>{s.page ? formatCount(s.page.total, s.locale) : '—'}</small></div>
              <div className="st-command__gallery-tools">
                <label className="st-command__search"><Search size={15} /><input aria-label={words.search} placeholder={words.search} value={s.filters.search} onChange={e => s.updateFilters({ search: e.target.value })} /></label>
                <button type="button" className="st-command__view" aria-label={s.t.gridView} aria-pressed={s.view === 'grid'} onClick={() => s.setView('grid')}><LayoutGrid size={16} /></button>
                <button type="button" className="st-command__view" aria-label={s.t.listView} aria-pressed={s.view === 'list'} onClick={() => s.setView('list')}><List size={16} /></button>
              </div>
            </div>
            {s.pageLoading ? <p className="st-command__loading" role="status"><Loader2 className="st-spin" size={16} />{s.t.loading}</p> :
              s.page?.rows.length && source && s.bridge ? <div className={'st-command__gallery' + (s.view === 'list' ? ' is-list' : '')}>
                {s.page.rows.slice(0, 12).map((file) => {
                  const selected = s.isFileSelected(index.inventoryId, file);
                  return <article className={'st-command__file' + (preview?.id === file.id ? ' is-focused' : '')} key={file.id}>
                    <button type="button" className="st-command__file-main" onClick={() => setPreviewId(file.id)} title={file.relative}>
                      <StudioThumb bridge={s.bridge!} source={source} file={file} category={file.category} />
                      <strong>{file.name}</strong><small>{formatBytes(file.size, s.locale)}</small>
                    </button>
                    <button type="button" className={'st-command__check' + (selected ? ' is-selected' : '')} aria-label={(selected ? words.removeFile : words.addFile) + ': ' + file.name} aria-pressed={selected} onClick={() => s.toggleFile(source, file)}>{selected ? <Check size={12} /> : '+'}</button>
                  </article>;
                })}
              </div> : <p className="st-command__gallery-empty">{s.t.noMatching}</p>}
            <small className="st-command__footnote">{words.latest}</small>
          </>}
        </div>

        <aside className="st-command__pane st-command__review" aria-label={words.detail}>
          <div className="st-command__panehead"><h3><Eye size={16} />{words.detail}</h3></div>
          {preview && source && s.bridge ? <div className="st-command__inspector">
            <StudioThumb bridge={s.bridge} source={source} file={preview} category={preview.category} />
            <strong title={preview.relative}>{preview.name}</strong>
            <div className="st-command__inspector-meta"><span>{CATEGORY_LABELS[preview.category][s.locale]}</span><span>{formatBytes(preview.size, s.locale)}</span></div>
            <button type="button" className="st-btn st-btn--small" onClick={() => s.toggleFile(source, preview)}>
              {s.isFileSelected(index!.inventoryId, preview) ? words.removeFile : words.addFile}
            </button>
          </div> : <div className="st-command__no-preview"><Eye size={27} /><strong>{words.choose}</strong><small>{words.chooseDescription}</small></div>}
          <div className="st-command__review-section">
            <h4>{words.selected}</h4><strong className="st-command__selection">{formatCount(s.basketCount, s.locale)} {s.t.files}</strong>
            <h4>{words.destination}</h4>
            <bdi dir="ltr" className="st-command__destination">{s.destination?.path ?? (s.mode === 'virtual' ? s.t.virtualNeedsNoDestination : words.notSet)}</bdi>
            <button type="button" className="st-link" onClick={() => s.goto('destinations')} disabled={s.mode === 'virtual'}>{words.change}<ArrowRight size={13} /></button>
            <h4>{words.operation}</h4>
            <div className="st-command__modes">
              {([{ key: 'virtual', label: words.virtual }, { key: 'copy', label: words.copy }, { key: 'move', label: words.move }] as Array<{key: OrganizationMode; label: string}>).map(item => <label key={item.key} className={s.mode === item.key ? 'is-active' : ''}>
                <input type="radio" name="command-mode" checked={s.mode === item.key} onChange={() => s.setMode(item.key)} /><span>{item.label}</span>
              </label>)}
            </div>
          </div>
          <p className="st-command__safety"><ShieldCheck size={16} />{words.safe}</p>
          <button type="button" className="st-btn st-btn--primary st-command__plan" disabled={!s.basketCount} onClick={() => s.goto('builder')}><Workflow size={16} />{words.plan}<ArrowRight size={15} /></button>
        </aside>
      </div>
    </section>
  );
}
