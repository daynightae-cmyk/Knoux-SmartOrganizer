import { Activity, AlertCircle, AppWindow, Check, ClipboardList, Copy, ExternalLink, FileText, FolderOpen, Info, Layers, PackagePlus, Play, RefreshCw, Settings2, ShieldCheck, ShieldX, Wrench } from 'lucide-react';
import type { AppRecord } from '../../lib/app-inventory';
import { actionsFor, registryPath } from '../../lib/app-inventory';
import { formatCount } from '../../lib/format';
import type { Locale } from '../../locales';

type Command = 'install' | 'open' | 'uninstall' | 'repair' | 'modify' | 'update';
interface CommandProps {
  record: AppRecord | null;
  stagedCount: number;
  locale: Locale;
  loading: boolean;
  onRefresh: () => void;
  onShowDetails: () => void;
  onInspectFolder: () => void;
  onCopySummary: () => void;
  onReviewStartup: () => void;
  onCopyBatchManifest: () => void;
}
function wording(locale: Locale) {
  return locale === 'ar' ? {
    tools: 'أوامر البرامج', hint: 'الإجراءات متصلة بإمكانيات Windows الفعلية، ولا يوجد تنفيذ وهمي.',
    install: 'تثبيت', open: 'المجلد', uninstall: 'إزالة', repair: 'إصلاح', modify: 'تعديل', update: 'تحديث',
    details: 'التفاصيل', batch: 'تقرير المحدد', refresh: 'تحديث القائمة',
    unavailable: 'محرك التنفيذ غير متصل', noFolder: 'لم يسجّل Windows مسار التثبيت',
    choose: 'حدد برنامجًا أولًا', batchHint: 'حدد البرامج لإنشاء تقرير',
    state: 'جاهزية العمليات', preview: 'معاينة فقط — بدون تنفيذ',
    previewHint: 'هذه حقائق تم التحقق منها، وليست سجلات تنفيذ.',
    inventory: 'هوية البرنامج', source: 'مصدر السجل', location: 'مسار التثبيت',
    review: 'مراجعة الإجراءات', execution: 'تنفيذ تغييرات', supported: 'متاح',
    missing: 'غير متوفر', restricted: 'محرك التنفيذ المعتمد غير متصل',
    noRecord: 'اختر برنامجًا من القائمة لمراجعة الإجراءات المتاحة.',
    safeActions: 'إجراءات آمنة متاحة', showFolder: 'فتح مجلد التثبيت',
    copy: 'نسخ التفاصيل', startup: 'مراجعة بدء التشغيل',
    protected: 'لن تتم إزالة أي برامج أو تغيير إعداداتها من هذه الواجهة.'
  } : {
    tools: 'Application Command Bar', hint: 'Only actions backed by Windows data and available engines can run.',
    install: 'Install', open: 'Location', uninstall: 'Uninstall', repair: 'Repair', modify: 'Modify', update: 'Update',
    details: 'Details', batch: 'Batch manifest', refresh: 'Refresh inventory',
    unavailable: 'No connected action engine', noFolder: 'Windows did not report an install folder',
    choose: 'Select an app first', batchHint: 'Stage apps to copy a batch manifest',
    state: 'Operation Readiness', preview: 'Read-only preview — not executed',
    previewHint: 'This shows verified facts and available actions, not invented operation logs.',
    inventory: 'Application identity', source: 'Windows record source', location: 'Install location',
    review: 'Action review', execution: 'System changes', supported: 'Available',
    missing: 'Not recorded', restricted: 'No authorized execution engine connected',
    noRecord: 'Select an app in the register to inspect its available actions.',
    safeActions: 'Available safe actions', showFolder: 'Reveal installation folder',
    copy: 'Copy dossier', startup: 'Review startup',
    protected: 'No application will be removed, updated or modified from this surface.'
  };
}
const commandIcons = { install: PackagePlus, open: FolderOpen, uninstall: ShieldX, repair: Wrench, modify: Settings2, update: RefreshCw } as const;
const commandColors: Record<Command,string> = { install:'blue',open:'green',uninstall:'red',repair:'amber',modify:'violet',update:'cyan' };
const operations: Command[] = ['install','uninstall','repair','modify','update','open'];

export function ApplicationCommandBar({record,stagedCount,locale,loading,onRefresh,onShowDetails,onInspectFolder,onCopyBatchManifest}:CommandProps) {
  const t=wording(locale);
  return <section className="appref__toolbar" aria-label={t.tools}>
    <div className="appref__toolbarhead">
      <div><h3><Layers size={16}/>{t.tools}</h3><p>{t.hint}</p></div>
      <button className="appref__refresh" onClick={onRefresh} disabled={loading} type="button"><RefreshCw size={14}/>{t.refresh}</button>
    </div>
    <div className="appref__toolgrid">
      {operations.map(action=>{
        const Icon=commandIcons[action];
        const live=action==='open' && !!record?.installLocation;
        const reason=action!=='open'?t.unavailable:!record?t.choose:t.noFolder;
        return <button key={action} className={'appref__tool appref__tool--'+commandColors[action]+(live?' is-live':'')}
          type="button" disabled={!live} title={!live?reason:t.open} onClick={live?onInspectFolder:undefined}>
          <Icon size={17}/><span>{t[action]}</span>{!live && <span className="appref__lock" aria-hidden="true">•</span>}
        </button>;
      })}
      <button className="appref__tool appref__tool--silver" type="button" disabled={!record} onClick={onShowDetails}><Info size={17}/><span>{t.details}</span></button>
      <button className="appref__tool appref__tool--purple" type="button" disabled={!stagedCount} onClick={onCopyBatchManifest} title={!stagedCount?t.batchHint:undefined}><ClipboardList size={17}/><span>{t.batch}{stagedCount?' ('+formatCount(stagedCount,locale)+')':''}</span></button>
    </div>
  </section>;
}

export function ApplicationOperationPreview({record,locale,onInspectFolder,onCopySummary,onReviewStartup}:Pick<CommandProps,'record'|'locale'|'onInspectFolder'|'onCopySummary'|'onReviewStartup'>) {
  const t=wording(locale);
  const canFolder=!!record?.installLocation;
  const canRegistry=!!record && !!registryPath(record);
  const canCopy=!!record && actionsFor(record).some(action=>action.id==='copy-summary'&&action.availability==='available');
  const facts=[
    {icon:AppWindow,title:t.inventory,ok:!!record,detail:record?.name??t.missing},
    {icon:FileText,title:t.source,ok:!!record?.source||!!record?.evidence.root||!!record?.packaged,detail:record?.source??record?.evidence.root??t.missing},
    {icon:FolderOpen,title:t.location,ok:canFolder,detail:record?.installLocation??t.missing},
    {icon:ShieldCheck,title:t.review,ok:canRegistry||canCopy,detail:canRegistry||canCopy?t.supported:t.missing},
    {icon:ShieldX,title:t.execution,ok:false,detail:t.restricted}
  ];
  return <section className="appref__readiness" aria-label={t.state}>
    <header className="appref__readiness-title"><h3><Activity size={17}/>{t.state}</h3><span className="appref__readiness-state"><AlertCircle size={12}/>{t.preview}</span></header>
    {!record?<p className="appref__empty">{t.noRecord}</p>:<>
      <div className="appref__preview-id"><span className="appref__preview-symbol"><AppWindow size={23}/></span><span><strong>{record.name}</strong><small>{record.publisher??t.missing}</small></span></div>
      <ol className="appref__stages">
        {facts.map(({icon:Icon,title,ok,detail},i)=><li key={title} className={ok?'is-ok':'is-waiting'}>
          <span className="appref__stage-index">{ok?<Check size={12}/>:<span>{i+1}</span>}</span>
          <span className="appref__stage-name"><Icon size={15}/><strong>{title}</strong><small title={detail}>{detail}</small></span>
        </li>)}
      </ol>
      <div className="appref__quick-title">{t.safeActions}</div>
      <div className="appref__quick-actions">
        <button type="button" onClick={onInspectFolder} disabled={!canFolder}><ExternalLink size={14}/>{t.showFolder}</button>
        <button type="button" onClick={onCopySummary} disabled={!canCopy}><Copy size={14}/>{t.copy}</button>
        <button type="button" onClick={onReviewStartup}><Play size={14}/>{t.startup}</button>
      </div>
    </>}
    <p className="appref__safety"><ShieldCheck size={15}/>{t.protected}</p>
    <small className="appref__disclaimer">{t.previewHint}</small>
  </section>;
}
