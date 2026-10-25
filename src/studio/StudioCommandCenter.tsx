import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowRight, Check, Clock, Database, Eye, FolderCheck, FolderOpen,
  FolderPlus, Images, Layers3, LayoutGrid, List, Loader2, Pencil, RefreshCw,
  Search, Settings2, ShieldCheck, Trash2
} from 'lucide-react';
import { formatBytes, formatCount } from '../lib/format';
import { CATEGORY_LABELS, CATEGORY_ORDER } from './copy';
import { useStudio } from './context';
import { CategoryIcon, StudioThumb } from './parts';
import type { FileInfo, OrganizationMode } from './types';
import './styles/command-center.css';

/**
 * REF-01 status rail. Every value is derived from authorized source state; the
 * timestamp is explicitly the moment this renderer read the current index.
 */
export function StudioStatusStrip() {
  const s = useStudio();
  const source = s.activeSource;
  const index = s.inventory;
  const [readAt, setReadAt] = useState<Date | null>(null);
  const totalFiles = s.sources.reduce((sum, item) => sum + (s.saved[item.id]?.totalFiles ?? 0), 0);
  const totalBytes = s.sources.reduce((sum, item) => sum + (s.saved[item.id]?.totalBytes ?? 0), 0);
  useEffect(() => { setReadAt(index ? new Date() : null); }, [source?.id, index?.inventoryId]);
  const copy = s.locale === 'ar' ? {
    auth: 'تصريح المصادر', folders: 'مجلدات مصرح بها', none: 'لا يوجد مجلد مصرح به',
    scan: 'حالة الفهرسة', scanning: 'الفهرسة جارية', complete: 'اكتملت الفهرسة', partial: 'فهرسة جزئية', waiting: 'بانتظار الفهرسة',
    files: 'ملفات مفهرسة', refreshed: 'آخر قراءة', unread: 'لم تُقرأ بيانات بعد', refresh: 'تحديث'
  } : {
    auth: 'Source Authorization', folders: 'folders authorized', none: 'No folder authorized',
    scan: 'Scan State', scanning: 'Indexing now', complete: 'Index complete', partial: 'Partial index', waiting: 'Awaiting first index',
    files: 'Files Analyzed', refreshed: 'Last Refreshed', unread: 'Nothing read yet', refresh: 'Refresh'
  };
  return <section className="st-command__strip" aria-label={copy.auth}>
    <div className="st-command__strip-cell"><span className="st-command__strip-icon" data-state={s.sources.length ? 'ok' : 'wait'}><ShieldCheck size={19} /></span><div><small>{copy.auth}</small><strong>{s.sources.length ? `${formatCount(s.sources.length, s.locale)} ${copy.folders}` : copy.none}</strong></div></div>
    <div className="st-command__strip-cell"><span className="st-command__strip-icon" data-state={s.scanRunning ? 'busy' : index ? 'ok' : 'wait'}>{s.scanRunning ? <Loader2 className="st-spin" size={19} /> : index ? <Check size={19} /> : <Clock size={19} />}</span><div><small>{copy.scan}</small><strong>{s.scanRunning ? copy.scanning : index ? (index.partial ? copy.partial : copy.complete) : copy.waiting}</strong></div></div>
    <div className="st-command__strip-cell"><span className="st-command__strip-icon" data-state={totalFiles ? 'ok' : 'wait'}><Database size={19} /></span><div><small>{copy.files}</small><strong>{totalFiles ? `${formatCount(totalFiles, s.locale)} · ${formatBytes(totalBytes, s.locale)}` : '—'}</strong></div></div>
    <div className="st-command__strip-cell"><span className="st-command__strip-icon" data-state={readAt ? 'ok' : 'wait'}><Clock size={19} /></span><div><small>{copy.refreshed}</small><strong>{readAt ? new Intl.DateTimeFormat(s.locale === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(readAt) : copy.unread}</strong></div></div>
    <button type="button" className="st-btn st-btn--small st-command__refresh" disabled={!source || !!s.scanRunning} onClick={() => source ? void s.beginScan(source.id) : void s.pickSource()}><RefreshCw size={14} />{copy.refresh}</button>
  </section>;
}

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
    preview: 'معاينة الملف',
    stripAuth: 'تصريح المصادر',
    stripAuthNone: 'لا يوجد مجلد مصرح به',
    stripFolders: 'مجلدات مصرح بها',
    stripScan: 'حالة الفهرسة',
    stripScanning: 'الفهرسة جارية الآن',
    stripComplete: 'اكتملت الفهرسة',
    stripPartial: 'فهرسة جزئية',
    stripAwaiting: 'بانتظار أول فهرسة',
    stripFiles: 'ملفات مفهرسة',
    stripRead: 'قُرئ الفهرس',
    stripReadPending: 'لم تُقرأ بيانات بعد',
    refresh: 'إعادة فهرسة المجلد',
    footerCategories: 'تصنيفات مقاسة',
    footerPlanned: 'ضمن الخطة',
    footerEdit: 'تحرير التصنيفات',
    footerDestination: 'تغيير الوجهة',
    footerClear: 'إلغاء التحديد',
    footerReview: 'مراجعة خطة التنظيم'
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
    preview: 'File preview',
    stripAuth: 'Source authorization',
    stripAuthNone: 'No folder authorized',
    stripFolders: 'folders authorized',
    stripScan: 'Scan state',
    stripScanning: 'Indexing now',
    stripComplete: 'Index complete',
    stripPartial: 'Partial index',
    stripAwaiting: 'Awaiting first index',
    stripFiles: 'Files indexed',
    stripRead: 'Index read',
    stripReadPending: 'Nothing read yet',
    refresh: 'Re-index folder',
    footerCategories: 'categories measured',
    footerPlanned: 'in plan',
    footerEdit: 'Edit categories',
    footerDestination: 'Change destination',
    footerClear: 'Clear selection',
    footerReview: 'Review Organization Plan'
  };
  const measuredCategories = index ? index.categories.filter(entry => entry.count > 0).length : 0;
  const plannedBytes = s.basket.reduce((sum, item) => sum + ('bytes' in item ? item.bytes : item.file.size), 0);
  useEffect(() => {
    setPreviewId(null);
  }, [source?.id, index?.inventoryId]);
  const preview: FileInfo | null = useMemo(
    () => s.page?.rows.find((file) => file.id === previewId) ?? s.page?.rows[0] ?? null,
    [s.page, previewId]
  );
  const categoryRows = CATEGORY_ORDER.map((key) => ({
    key,
    stat: index?.categories.find((entry) => entry.key === key)
  }));
  const selectedCategory = s.filters.category !== 'all'
    ? s.filters.category
    : preview?.category ?? categoryRows.find(({ stat }) => (stat?.count ?? 0) > 0)?.key ?? null;
  const selectedStat = selectedCategory ? index?.categories.find((entry) => entry.key === selectedCategory) : null;
  const conflictCount = s.plan?.collisions.length ?? 0;

  return (
    <section className="st-command" aria-label={words.heading}>
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
          <button type="button" className="st-btn st-btn--small st-command__source-refresh" disabled={!source || !!s.scanRunning} onClick={() => source && void s.beginScan(source.id)}><RefreshCw size={14} />{words.refresh}</button>
          {s.scanRunning && <p className="st-command__scanstatus" role="status"><Loader2 className="st-spin" size={14} />{s.t.indexing}</p>}
          <div className="st-command__inventory">
            <h4><Database size={15} />{s.locale === 'ar' ? 'ملخص الفهرس' : 'Inventory Summary'}</h4>
            <dl>
              <div><dt>{s.t.files}</dt><dd>{index ? formatCount(index.totalFiles, s.locale) : '—'}</dd></div>
              <div><dt>{s.t.bytes}</dt><dd>{index ? formatBytes(index.totalBytes, s.locale) : '—'}</dd></div>
              <div><dt>{s.t.folders}</dt><dd>{index ? formatCount(index.counts.folders, s.locale) : '—'}</dd></div>
              <div><dt>{s.locale === 'ar' ? 'أنواع الملفات' : 'File types'}</dt><dd>{index ? formatCount(index.extensions.length, s.locale) : '—'}</dd></div>
            </dl>
          </div>
        </aside>

        <div className="st-command__pane st-command__library" aria-label={words.visual}>
          <div className="st-command__panehead">
            <h3><LayoutGrid size={16} />{s.locale === 'ar' ? 'تصنيفات الملفات (18)' : 'File Categories (18)'}</h3>
            <button type="button" className="st-link" onClick={() => s.goto('library')}>{words.categories}<ArrowRight size={13} /></button>
          </div>
          {index?.partial && <p className="st-command__warning" role="status">{words.partial}</p>}
          <div className="st-command__sectionlabel"><strong>{words.tiles}</strong><small>{index ? measuredCategories : '—'} / {CATEGORY_ORDER.length}</small></div>
          <div className="st-command__category-grid">
            {categoryRows.map(({ key, stat }) => <div className={'st-command__category' + (s.filters.category === key ? ' is-active' : '') + (!index ? ' is-unindexed' : '')} key={key}>
              <button type="button" className="st-command__category-main" disabled={!index} onClick={() => s.updateFilters({ category: s.filters.category === key ? 'all' : key })} aria-pressed={s.filters.category === key}>
                <CategoryIcon category={key} size={21} />
                <strong>{CATEGORY_LABELS[key][s.locale]}</strong>
                <span>{index ? formatCount(stat?.count ?? 0, s.locale) : '—'}</span><small>{index ? formatBytes(stat?.bytes ?? 0, s.locale) : '—'}</small>
              </button>
              {stat && stat.count > 0 && <button type="button" className="st-command__category-add" onClick={() => source && s.addCategory(source, key)} aria-label={words.addGroup + ': ' + CATEGORY_LABELS[key][s.locale]} title={words.addGroup}>+</button>}
            </div>)}
          </div>
          {!index ? <div className="st-command__onboarding">
            <span className="st-command__onboarding-art"><Images size={46} /></span>
            <strong>{s.sources.length ? s.t.notScanned : words.choose}</strong>
            <p>{s.sources.length ? s.t.scanBeforeOrganize : words.chooseDescription}</p>
            <button type="button" className="st-btn st-btn--primary" disabled={!!s.scanRunning} onClick={() => source ? void s.beginScan(source.id) : void s.pickSource()}>
              {s.sources.length ? words.scan : words.add}
            </button>
          </div> : <>
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
          <div className="st-command__selected-category">
            <span>{selectedCategory ? <CategoryIcon category={selectedCategory} size={26} /> : <Images size={26} />}</span>
            <div><small>{s.locale === 'ar' ? 'التصنيف المحدد' : 'Selected Category'}</small><strong>{selectedCategory ? CATEGORY_LABELS[selectedCategory][s.locale] : words.all}</strong><em>{selectedStat ? `${formatCount(selectedStat.count, s.locale)} ${s.t.files} · ${formatBytes(selectedStat.bytes, s.locale)}` : '—'}</em></div>
          </div>
          <div className="st-command__review-section">
            <div className="st-command__review-row"><FolderOpen size={16} /><span><small>{s.locale === 'ar' ? 'اقتراح الوجهة' : 'Destination Proposal'}</small><bdi dir="ltr">{s.destination?.path ?? (s.mode === 'virtual' ? s.t.virtualNeedsNoDestination : words.notSet)}</bdi></span><button type="button" onClick={() => s.goto('destinations')} disabled={s.mode === 'virtual'}>{words.change}</button></div>
            <div className="st-command__review-row"><Pencil size={16} /><span><small>{s.locale === 'ar' ? 'قواعد التسمية' : 'Naming Rules'}</small><strong>{s.collisionPolicy === 'rename' ? s.t.policyRename : s.collisionPolicy === 'skip' ? s.t.policySkip : s.t.policyReview}</strong></span><button type="button" onClick={() => s.goto('builder')}>{s.locale === 'ar' ? 'تحرير…' : 'Edit…'}</button></div>
            <div className="st-command__review-row"><Layers3 size={16} /><span><small>{s.locale === 'ar' ? 'خيارات التجميع' : 'Grouping Options'}</small><strong>{s.structure === 'categorized' ? s.t.structureCategorized : s.t.structureFlat}</strong></span><button type="button" onClick={() => s.goto('builder')}>{s.locale === 'ar' ? 'تحرير…' : 'Edit…'}</button></div>
            <h4><Settings2 size={15} />{words.operation}</h4>
            <div className="st-command__modes">
              {([{ key: 'virtual', label: words.virtual }, { key: 'copy', label: words.copy }, { key: 'move', label: words.move }] as Array<{key: OrganizationMode; label: string}>).map(item => <label key={item.key} className={s.mode === item.key ? 'is-active' : ''}>
                <input type="radio" name="command-mode" checked={s.mode === item.key} onChange={() => s.setMode(item.key)} /><span>{item.label}</span>
              </label>)}
            </div>
            <div className={`st-command__review-row${conflictCount ? ' is-warning' : ''}`}><AlertTriangle size={16} /><span><small>{s.locale === 'ar' ? 'التعارضات المحتملة' : 'Potential Conflicts'}</small><strong>{s.plan ? `${formatCount(conflictCount, s.locale)} ${s.locale === 'ar' ? 'تعارض' : 'conflicts'}` : (s.locale === 'ar' ? 'تُحسب أثناء مراجعة الخطة' : 'Calculated during plan review')}</strong></span><button type="button" onClick={() => s.goto('review')}>{s.locale === 'ar' ? 'تفاصيل…' : 'Details…'}</button></div>
            <div className="st-command__review-row"><FolderCheck size={16} /><span><small>{s.locale === 'ar' ? 'الأذونات' : 'Permissions'}</small><strong>{s.destination || s.mode === 'virtual' ? (s.locale === 'ar' ? 'التصريح متوفر' : 'Authorization available') : (s.locale === 'ar' ? 'اختر وجهة للتحقق' : 'Choose a destination to verify')}</strong></span></div>
            <div className="st-command__review-row"><ShieldCheck size={16} /><span><small>{s.locale === 'ar' ? 'معلومات الأمان' : 'Safety Information'}</small><strong>{s.locale === 'ar' ? 'لا تغيير دون اعتماد الخطة' : 'No changes without plan approval'}</strong></span></div>
          </div>
          <p className="st-command__preview-only"><Clock size={15} />{s.locale === 'ar' ? 'معاينة فقط — لم تتغير أي ملفات' : 'Preview only — no files changed'}</p>
        </aside>
      </div>

      <footer className="st-command__footer">
        <div className="st-command__footsum">
          <span><Images size={15} /><b>{formatCount(measuredCategories, s.locale)} / {CATEGORY_ORDER.length}</b>{words.footerCategories}</span>
          <span><Check size={15} /><b>{formatCount(s.basketCount, s.locale)}</b>{words.footerPlanned}</span>
          <span><Database size={15} /><b>{formatBytes(plannedBytes, s.locale)}</b></span>
        </div>
        <div className="st-command__footactions">
          <button type="button" className="st-btn st-btn--small" disabled={!index} onClick={() => s.goto('library')}>{words.footerEdit}</button>
          <button type="button" className="st-btn st-btn--small" onClick={() => s.goto('destinations')} disabled={s.mode === 'virtual'}><FolderOpen size={14} />{words.footerDestination}</button>
          <button type="button" className="st-btn st-btn--small" disabled={!s.basket.length} onClick={s.clearBasket}><Trash2 size={14} />{words.footerClear}</button>
          <button type="button" className="st-btn st-btn--primary" disabled={!s.basketCount} onClick={() => s.goto('builder')}>{words.footerReview}<ArrowRight size={15} /></button>
        </div>
      </footer>
    </section>
  );
}
