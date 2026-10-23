import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FolderPlus, FolderOpen, ScanSearch, Images, Film, FileText, Music2, Archive,
  Code2, PackageOpen, Layers3, Search, LayoutGrid, List, ChevronLeft, ChevronRight,
  RefreshCcw, Ban, Eye, ShieldCheck, FolderX, Sparkles
} from 'lucide-react';
import { useStore } from '../state/store';
import { formatBytes, formatCount } from '../lib/format';
import type { Category, FileInfo, PageResult, ScanEvent, ScanSummary, Source } from './types';
import './styles/studio.css';

const meta: Array<{key:Category;Icon:typeof Images}> = [
 {key:'image',Icon:Images},{key:'video',Icon:Film},{key:'document',Icon:FileText},
 {key:'audio',Icon:Music2},{key:'archive',Icon:Archive},{key:'code',Icon:Code2},
 {key:'installer',Icon:PackageOpen},{key:'other',Icon:Layers3}
];
const texts = {
 ar:{
  title:'ملفاتك. منظمة بذكاء.',subtitle:'اختر المجلدات، شاهد المحتويات مجمّعة أمامك، وقرر بنفسك. الفهرسة لا تنقل أو تحذف أي ملف.',
  heroLabel:'KNOuX  /  SMART ORGANIZATION STUDIO',add:'إضافة مجلد',source:'مصادر التنظيم',none:'لم تختر أي مجلد بعد',choose:'ابدأ بإضافة مجلد من جهازك',
  files:'الملفات',size:'الحجم الإجمالي',folders:'المجلدات',all:'الكل',scan:'فحص المجلد',rescan:'إعادة الفحص',
  cancel:'إلغاء الفحص',scanning:'جارٍ فهرسة الملفات محليًا…',library:'مكتبة ملفاتك',
  search:'ابحث بالاسم أو المسار النسبي',name:'الاسم',biggest:'الأكبر حجمًا',newest:'الأحدث تعديلًا',
  grid:'عرض شبكي',list:'عرض قائمة',open:'إظهار في المستكشف',remove:'إزالة من المتابعة',
  empty:'لا توجد ملفات مطابقة للبحث',clear:'مسح البحث',previous:'السابق',next:'التالي',page:'صفحة',of:'من',
  virtual:'التجميع الحالي افتراضي وآمن؛ ملفاتك بقيت في أماكنها. لن يُنفَّذ أي نقل دون خطة معتمدة.',
  images:'صور',video:'فيديوهات',document:'مستندات',audio:'صوتيات',archive:'أرشيفات',code:'أكواد',installer:'برامج',other:'أخرى',
  partial:'بعض الملفات لم تُفهرس. النتيجة جزئية؛ راجع التحذيرات أدناه.',cancelled:'تم إلغاء الفحص دون تغيير الملفات.',
  removed:'المجلد أُزيل من المتابعة فقط، دون المساس بمحتوياته.',unavailable:'جسر Studio غير متاح؛ شغّل نسخة Electron المدمجة.',
  noScan:'اختر مصدرًا ثم ابدأ الفحص لرؤية فئاته الحقيقية.',scanned:'مفهرس',security:'محلي · قراءة فقط',error:'تعذر تنفيذ الطلب',
  refreshed:'يمكنك إعادة الفحص لمراجعة تغييرات الملفات على القرص.',review:'اقتراح مراجعة',hint:'الملفات المصنفة لا تُنقل تلقائيًا'
 },
 en:{
  title:'Your files. Beautifully organized.',subtitle:'Choose folders, see your files grouped instantly, and stay in control. Indexing never moves or deletes files.',
  heroLabel:'KNOuX  /  SMART ORGANIZATION STUDIO',add:'Add folder',source:'Organization sources',none:'No sources selected yet',choose:'Start by adding a folder from your PC',
  files:'Files',size:'Total size',folders:'Folders',all:'All files',scan:'Index folder',rescan:'Rescan',
  cancel:'Cancel scan',scanning:'Indexing files locally…',library:'Your file library',
  search:'Search name or relative path',name:'Name',biggest:'Largest first',newest:'Recently modified',
  grid:'Grid view',list:'List view',open:'Reveal in Explorer',remove:'Stop tracking',
  empty:'No matching files',clear:'Clear search',previous:'Previous',next:'Next',page:'Page',of:'of',
  virtual:'Grouping is currently virtual and safe. Your original files have not moved. No files are moved without a separately approved plan.',
  images:'Images',video:'Videos',document:'Documents',audio:'Audio',archive:'Archives',code:'Code',installer:'Installers',other:'Other',
  partial:'Some entries could not be indexed. This is a partial result; see warnings.',cancelled:'Scan cancelled; no files were modified.',
  removed:'The source was untracked, without changing its files.',unavailable:'Studio bridge unavailable; run the integrated Electron application.',
  noScan:'Select a source and scan it to see real file groups.',scanned:'Indexed',security:'Private · Read-only',error:'Operation failed',
  refreshed:'Rescan to reconcile files changed on disk.',review:'Review suggestion',hint:'Indexed files are not automatically moved'
 }
} as const;

export default function StudioPage(){
 const {locale}=useStore(),t=texts[locale],bridge=typeof window!=='undefined'?window.knouxStudio:undefined;
 const [sources,setSources]=useState<Source[]>([]);
 const [sourceId,setSourceId]=useState<string|null>(null);
 const [saved,setSaved]=useState<Record<string,ScanSummary>>({});
 const [category,setCategory]=useState<Category|'all'>('all');
 const [search,setSearch]=useState('');
 const [sort,setSort]=useState<'name'|'size'|'modified'>('name');
 const [layout,setLayout]=useState<'grid'|'list'>('grid');
 const [offset,setOffset]=useState(0);
 const [page,setPage]=useState<PageResult|null>(null);
 const [loadingPage,setLoadingPage]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [running,setRunning]=useState<{sourceId:string;operationId:string}|null>(null);
 const [progress,setProgress]=useState<{files:number;folders:number}>({files:0,folders:0});
 const operation=useRef<{sourceId:string;operationId:string}|null>(null);
 const selectedSourceRef=useRef<string|null>(null);
 selectedSourceRef.current=sourceId;
 const generation=useRef(0);
 const inventory=saved[sourceId||'']||null;
 const source=sources.find(x=>x.id===sourceId)||null;
 const currentBusy=running?.sourceId===sourceId;

 useEffect(()=>{
  if(!bridge)return;
  let valid=true;
  bridge.listSources().then(items=>{if(valid){setSources(items);setSourceId(id=>id||items[0]?.id||null)}}).catch(e=>{if(valid)setError(String(e?.message||e))});
  const off=bridge.onEvent((event:ScanEvent)=>{
   if(!valid||!operation.current||event.operationId!==operation.current.operationId)return;
   if(event.phase==='progress')setProgress({files:event.files||0,folders:event.folders||0});
  });
  return()=>{valid=false;off()};
 },[bridge]);
 const choose=async()=>{
  if(!bridge)return;
  setError('');
  try{const picked=await bridge.pickSource();if(!picked)return;
   setSources(prev=>prev.some(s=>s.id===picked.id)?prev:[...prev,picked]);
   setSourceId(picked.id);setCategory('all');setOffset(0);setSearch('');
  }catch(e){setError(String((e as Error)?.message||e))}
 };
 const scan=useCallback(async(id:string)=>{
  if(!bridge||operation.current)return;
  const operationId=crypto.randomUUID();
  operation.current={sourceId:id,operationId};setRunning({sourceId:id,operationId});
  setError('');setNotice('');setProgress({files:0,folders:0});
  try{
   const result=await bridge.scan({sourceId:id,operationId});
   if('cancelled' in result&&result.cancelled===true){setNotice(t.cancelled);return}
   if(!('inventoryId' in result))throw Error('Invalid inventory result');
   setSaved(old=>({...old,[id]:result as ScanSummary}));
   setNotice(result.partial?t.partial:t.refreshed);
   if(selectedSourceRef.current===id){setCategory('all');setSearch('');setOffset(0)}
  }catch(e){setError(String((e as Error)?.message||e))}
  finally{if(operation.current?.operationId===operationId)operation.current=null;setRunning(null)}
 },[bridge,t.cancelled,t.partial,t.refreshed]);
 const cancel=async()=>{if(!bridge||!operation.current)return;try{await bridge.cancel(operation.current.operationId)}catch(e){setError(String((e as Error)?.message||e))}};
 const remove=async(id:string)=>{
  if(!bridge)return;try{await bridge.removeSource(id);setSources(xs=>xs.filter(x=>x.id!==id));
   setSaved(xs=>{const next={...xs};delete next[id];return next});
   if(sourceId===id){setSourceId(sources.find(x=>x.id!==id)?.id||null);setCategory('all')}
   setNotice(t.removed);
  }catch(e){setError(String((e as Error)?.message||e))}
 };
 useEffect(()=>{
  generation.current++;
  const seq=generation.current;
  if(!bridge||!inventory){setPage(null);return}
  setLoadingPage(true);setPage(null);
  bridge.query({inventoryId:inventory.inventoryId,category,search,sort,desc:sort!=='name',offset,limit:48})
   .then(data=>{if(seq===generation.current)setPage(data)})
   .catch(e=>{if(seq===generation.current)setError(String(e?.message||e))})
   .finally(()=>{if(seq===generation.current)setLoadingPage(false)});
  return()=>{generation.current++};
 },[bridge,inventory?.inventoryId,category,search,sort,offset]);
 const chooseCategory=(cat:Category|'all')=>{setCategory(cat);setOffset(0)};
 const visibleCategories=useMemo(()=>meta.map(o=>({...o,stat:inventory?.categories.find(x=>x.key===o.key)||{key:o.key,count:0,bytes:0}})),[inventory]);
 const pagination=page?Math.ceil(page.total/48):0;
 const pageIndex=Math.floor(offset/48)+1;
 const reveal=async(file:FileInfo)=>{if(!bridge||!inventory)return;
  try{const ok=await bridge.reveal({inventoryId:inventory.inventoryId,fileId:file.id});if(!ok)throw Error('File was changed or is no longer available; rescan first')}
  catch(e){setError(String((e as Error)?.message||e))}
 };
 const selectedLabel=category==='all'?t.all:t[category==='image'?'images':category];
 if(!bridge)return <div className="st-root"><div className="st-warning st-error">{t.unavailable}</div></div>;
 return <div className="st-root">
  <section className="st-hero">
   <span className="st-kicker"><Sparkles size={15}/>{t.heroLabel}</span>
   <h2 className="st-title">{t.title}</h2><p className="st-sub">{t.subtitle}</p>
   <div className="st-actions"><button className="st-btn st-btn-primary" onClick={()=>void choose()}><FolderPlus size={17}/>{t.add}</button>
    {source&&<button className="st-btn" onClick={()=>void scan(source.id)} disabled={!!running}><ScanSearch size={16}/>{inventory?t.rescan:t.scan}</button>}
    {currentBusy&&<button className="st-btn" onClick={()=>void cancel()}><Ban size={16}/>{t.cancel}</button>}
   </div>
  </section>
  {error&&<div className="st-warning st-error" role="alert">{t.error}: {error}</div>}
  {notice&&<div className="st-warning" role="status">{notice}</div>}
  <div className="st-layout">
   <aside className="st-panel"><h2><FolderOpen size={16}/>{t.source}</h2>
    {sources.length===0&&<p className="st-muted">{t.none}</p>}
    {sources.map(s=><div className="st-source-row" key={s.id}>
     <button className={'st-source'+(sourceId===s.id?' is-active':'')} onClick={()=>{setSourceId(s.id);setCategory('all');setSearch('');setOffset(0);setError('')}} aria-current={sourceId===s.id?'true':undefined}>
      <strong>{s.name}</strong><small title={s.folder}>{s.folder}</small>
      <small>{saved[s.id]?t.scanned+' · '+formatCount(saved[s.id].totalFiles,locale):t.noScan}</small></button>
     <button className="st-source-remove" onClick={()=>void remove(s.id)} title={t.remove} aria-label={t.remove+' '+s.name}><FolderX size={17}/></button>
    </div>)}
    <p className="st-muted"><ShieldCheck size={13}/> {t.security}</p>
   </aside>
   <div style={{display:'grid',gap:16,minWidth:0}}>
    {!source?<section className="st-panel st-empty"><FolderPlus size={34}/><p>{t.choose}</p><button className="st-btn st-btn-primary" onClick={()=>void choose()}>{t.add}</button></section>:
    !inventory&&!currentBusy?<section className="st-panel st-empty"><ScanSearch size={36}/><p>{t.noScan}</p><button className="st-btn st-btn-primary" onClick={()=>void scan(source.id)} disabled={!!running}>{t.scan}</button></section>:<>
     {currentBusy&&<section className="st-panel" role="status" aria-live="polite">
      <h2><RefreshCcw size={16}/>{t.scanning}</h2><div className="st-progress"/><p className="st-muted">{formatCount(progress.files,locale)} {t.files} · {formatCount(progress.folders,locale)} {t.folders}</p>
     </section>}
     {inventory&&<>
      <div className="st-summary">
       <div className="st-metric"><small>{t.files}</small><strong>{formatCount(inventory.totalFiles,locale)}</strong></div>
       <div className="st-metric"><small>{t.size}</small><strong>{formatBytes(inventory.totalBytes,locale)}</strong></div>
       <div className="st-metric"><small>{t.folders}</small><strong>{formatCount(inventory.counts.folders,locale)}</strong></div>
      </div>
      {inventory.partial&&<div role="status" className="st-warning">{t.partial} {inventory.warnings.join(' · ')}</div>}
      {!inventory.partial&&inventory.warnings.length>0&&<div className="st-warning">{inventory.warnings.join(' · ')}</div>}
      <section className="st-panel">
       <div className="st-section-title"><h2><Layers3 size={18}/>{t.library}</h2><small className="st-muted">{t.hint}</small></div>
       <div className="st-categories">
        {visibleCategories.map(({key,Icon,stat})=><button key={key} className={'st-category'+(category===key?' is-active':'')} onClick={()=>chooseCategory(key)} aria-pressed={category===key}>
         <span className="st-category-icon"><Icon size={23}/></span><strong>{t[key==='image'?'images':key]}</strong>
         <b>{formatCount(stat.count,locale)}</b><small>{formatBytes(stat.bytes,locale)}</small>
        </button>)}
       </div>
       <div className="st-toolbar">
        <button className="st-btn" aria-pressed={category==='all'} onClick={()=>chooseCategory('all')}>{t.all}</button>
        <Search size={16}/>
        <input className="st-input" value={search} aria-label={t.search} placeholder={t.search} onChange={e=>{setSearch(e.target.value);setOffset(0)}}/>
        <select className="st-select" value={sort} onChange={e=>{setSort(e.target.value as typeof sort);setOffset(0)}} aria-label={t.name}>
         <option value="name">{t.name}</option><option value="size">{t.biggest}</option><option value="modified">{t.newest}</option>
        </select>
        <button className="st-btn" aria-label={t.grid} title={t.grid} aria-pressed={layout==='grid'} onClick={()=>setLayout('grid')}><LayoutGrid size={16}/></button>
        <button className="st-btn" aria-label={t.list} title={t.list} aria-pressed={layout==='list'} onClick={()=>setLayout('list')}><List size={16}/></button>
       </div>
       <div className="st-section-title"><h2>{selectedLabel}</h2><span className="st-muted">{formatCount(page?.total||0,locale)} {t.files}</span></div>
       {loadingPage?<div className="st-muted" role="status">{t.scanning}</div>:page?.rows.length===0?<div className="st-empty">{t.empty}</div>:<div className={layout==='grid'?'st-file-grid':'st-list'}>
        {page?.rows.map(file=>{const Icon=meta.find(c=>c.key===file.category)?.Icon||FileText;return <article className="st-file" key={file.id}>
         <div className="st-file-art"><Icon size={34}/></div>
         <div><strong title={file.name}>{file.name}</strong><small title={file.relative}>{file.relative}</small></div>
         <div className="st-file-footer"><small>{formatBytes(file.size,locale)}</small><button className="st-btn" onClick={()=>void reveal(file)} aria-label={t.open+' '+file.name}><Eye size={15}/></button></div>
        </article>})}
       </div>}
       {pagination>1&&<div className="st-pager">
        <button className="st-btn" disabled={offset===0} onClick={()=>setOffset(o=>Math.max(0,o-48))}><ChevronLeft size={16}/>{t.previous}</button>
        <span className="st-muted">{t.page} {formatCount(pageIndex,locale)} {t.of} {formatCount(pagination,locale)}</span>
        <button className="st-btn" disabled={pageIndex>=pagination} onClick={()=>setOffset(o=>o+48)}>{t.next}<ChevronRight size={16}/></button>
       </div>}
      </section>
      <div className="st-warning"><ShieldCheck size={15}/> {t.virtual}</div>
     </>}
    </>}
   </div>
  </div>
 </div>;
}
