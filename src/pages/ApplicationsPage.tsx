import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  AlertTriangle, AppWindow, Ban, Check, Copy, FolderOpen,
  ListChecks, RefreshCw, Search, Users, X
} from 'lucide-react';
import AppIcon from '../components/app/AppIcon';
import { ServicesRail } from '../components/world/ServicesRail';
import {
  actionsFor, applyFacet, buildInventory, dossierFields, facetsFor, groupRecords, inventorySignature, parseDate,
  registryPath, sizeOf, sortRecords,
  type AppRecord, type CoverageMeasure, type FacetId, type InventorySnapshot, type SortDirection, type SortKey
} from '../lib/app-inventory';
import { fill, formatBytes, formatCount } from '../lib/format';
import { canRunTool, isActivePhase, progressOf } from '../lib/guards';
import { iconsBusy, iconsSupported, requestIcons, resetIconCache, subscribeToActivity } from '../lib/icon-broker';
import { useStore } from '../state/store';
import type { Locale } from '../locales';

type ViewMode = 'register' | 'chapters';
type Phase = 'idle' | 'loading' | 'ready' | 'failed' | 'unavailable';

const MAX_BATCH_OPEN = 6;

function dateText(value: string | null, locale: Locale): string {
  const date = parseDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', { dateStyle: 'medium' }).format(date);
}

function scopeValue(record: AppRecord): string | null {
  if (record.scope === 'machine') return 'machine';
  if (record.scope === 'user') return 'user';
  return null;
}

function sourceLabel(record: AppRecord, t: (key: string) => string): string {
  if (record.packaged) return t('app.source.packaged');
  if (record.registryView) return fill(t('app.source.registryView'), { view: record.registryView });
  return record.source ? t('app.source.registry') : '—';
}

/*
 * A ledger row carries one meta lane, roughly 210px wide on a 1366 laptop.
 * Five badge kinds never fit in it, and a clipped badge is a fact nobody
 * reads, so the row keeps the three that change what you may do with an
 * entry: whether Windows treats it as a component, whether it is packaged,
 * and which hive it came from. The dossier still states all five.
 */
const MAX_ROW_BADGES = 3;

function rowBadges(record: AppRecord, scope: string | null, t: (key: string) => string) {
  const badges: { key: string; className: string; label: string }[] = [];
  if (record.systemComponent === true) badges.push({ key: 'system', className: 'appx__badge--system', label: t('app.row.systemComponent') });
  if (record.packaged) badges.push({ key: 'package', className: 'appx__badge--package', label: t('app.row.packaged') });
  if (scope) badges.push({ key: 'scope', className: '', label: scope === 'machine' ? t('app.row.machine') : t('app.row.user') });
  if (record.isFramework === true) badges.push({ key: 'runtime', className: 'appx__badge--runtime', label: t('app.row.framework') });
  if (record.architecture) badges.push({ key: 'arch', className: '', label: record.architecture.toUpperCase() });
  return badges;
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function manifestLine(record: AppRecord, locale: Locale): string {
  const size = sizeOf(record);
  return [
    record.name,
    record.publisher || '—',
    record.version || '—',
    size.bytes != null ? `${formatBytes(size.bytes, locale)}${size.kind === 'advertised' ? ' (declared)' : ''}` : '—',
    dateText(record.installDate, locale),
    record.installLocation || '—'
  ].join('\t');
}

/* ------------------------------------------------------------------ ribbon */

function CoverageRibbon({ coverage, t }: { coverage: CoverageMeasure[]; t: (key: string) => string }) {
  return (
    <div className="world-ribbon">
      <div className="world-ribbon__label">
        {t('app.coverage.title')}
        <small>{t('app.coverage.hint')}</small>
      </div>
      <div className="world-ribbon__grid">
        {coverage.map(measure => {
          const share = measure.total ? Math.round((measure.known / measure.total) * 100) : 0;
          const off = !measure.supported;
          return (
            <div key={measure.key} className={`world-measure${off ? ' world-measure--off' : ''}`}>
              <span className="world-measure__name">{t(`app.coverage.${measure.key}`)}</span>
              <span
                className="world-measure__track"
                role="progressbar"
                aria-label={t(`app.coverage.${measure.key}`)}
                aria-valuenow={off ? undefined : share}
                aria-valuemin={off ? undefined : 0}
                aria-valuemax={off ? undefined : 100}
              >
                <i style={{ '--fill': `${share}%` } as CSSProperties} />
              </span>
              <b title={off ? t('app.coverage.unsupported') : `${measure.known} / ${measure.total}`}>
                {off ? t('app.coverage.unsupported') : `${share}%`}
              </b>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- rows */

interface RowProps {
  record: AppRecord;
  active: boolean;
  staged: boolean;
  t: (key: string) => string;
  locale: Locale;
  onOpen: (record: AppRecord) => void;
  onToggle: (uid: string) => void;
}

function LedgerRow({ record, active, staged, t, locale, onOpen, onToggle }: RowProps) {
  const size = sizeOf(record);
  const scope = scopeValue(record);
  const installed = dateText(record.installDate, locale);
  const badges = rowBadges(record, scope, t);
  return (
    <div className="appx__row" data-active={active} data-staged={staged}>
      <span className="appx__tick">
        <input
          type="checkbox"
          checked={staged}
          aria-label={fill(t('app.row.select'), { name: record.name })}
          onChange={() => onToggle(record.uid)}
        />
      </span>
      <button type="button" className="appx__opener" onClick={() => onOpen(record)} aria-current={active ? 'true' : undefined}>
        <AppIcon record={record} />
        <span className="appx__rowtext">
          <span className={`appx__rowname${staged ? ' appx__rowname--staged' : ''}`}>{record.name}</span>
          <span className="appx__rowmeta" title={badges.map(badge => badge.label).join(' · ') || undefined}>
            {badges.slice(0, MAX_ROW_BADGES).map(badge => (
              <em key={badge.key} className={`appx__badge${badge.className ? ` ${badge.className}` : ''}`}>{badge.label}</em>
            ))}
            {badges.length > MAX_ROW_BADGES && (
              <em className="appx__badge appx__badge--more">+{badges.length - MAX_ROW_BADGES}</em>
            )}
          </span>
        </span>
      </button>
      <span className={`appx__publisher${record.publisher ? '' : ' appx__publisher--none'}`} title={record.publisher ?? undefined}>
        {record.publisher || '—'}
      </span>
      <span className={`appx__version${record.version ? '' : ' appx__version--none'}`} title={record.version ?? undefined}>{record.version || '—'}</span>
      <span className="appx__size">
        {size.bytes != null ? (
          <>
            <b>{formatBytes(size.bytes, locale)}</b>
            <i>{size.kind === 'measured' ? t('app.row.measuredShort') : t('app.row.declaredShort')}</i>
          </>
        ) : <i className="appx__empty">—</i>}
      </span>
      <span className={`appx__cell appx__cell--faint appx__cell--date${installed === '—' ? ' appx__empty' : ''}`}>{installed}</span>
    </div>
  );
}

function Tile({ record, active, staged, t, onOpen, onToggle }: Omit<RowProps, 'locale'>) {
  return (
    <div className="appx__tile" data-active={active} data-staged={staged}>
      <span className="appx__tick">
        <input
          type="checkbox"
          checked={staged}
          aria-label={fill(t('app.row.select'), { name: record.name })}
          onChange={() => onToggle(record.uid)}
        />
      </span>
      <button type="button" className="appx__opener appx__tileopen" onClick={() => onOpen(record)} aria-current={active ? 'true' : undefined}>
        <AppIcon record={record} variant="tile" />
        <span>
          <span className="appx__rowname appx__tilename">{record.name}</span>
          <small>{record.version || record.installLocation || '—'}</small>
        </span>
      </button>
    </div>
  );
}

/* ----------------------------------------------------------------- dossier */

interface DossierProps {
  record: AppRecord | null;
  t: (key: string) => string;
  locale: Locale;
  onClose: () => void;
  onAction: (action: string, record: AppRecord) => void;
}

function Dossier({ record, t, locale, onClose, onAction }: DossierProps) {
  if (!record) {
    return (
      <aside className="appx__dossier appx__dossier--empty" aria-label={t('app.dossier.label')}>
        <h3>{t('app.dossier.empty')}</h3>
        <p>{t('app.dossier.emptyHint')}</p>
        <ul>
          <li>{t('app.stat.declaredNote')}</li>
          <li>{t('app.action.reason.noUninstallEngine')}</li>
          <li>{t('app.head.keyboard')}</li>
        </ul>
      </aside>
    );
  }

  const size = sizeOf(record);
  const path = registryPath(record);
  const scope = scopeValue(record);
  const fields = dossierFields(record).filter(field => !['app.field.scope', 'app.field.source', 'app.field.date'].includes(field.key));

  return (
    <aside className="appx__dossier" aria-label={t('app.dossier.label')}>
      <div className="appx__dhead">
        <AppIcon record={record} variant="dossier" />
        <div className="appx__dtitle">
          <h3>{record.name}</h3>
          <p>{record.publisher || t('app.row.notRecorded')}</p>
          <div className="appx__dchips">
            {scope && <em className="appx__badge">{scope === 'machine' ? t('app.row.machine') : t('app.row.user')}</em>}
            {record.architecture && <em className="appx__badge">{record.architecture.toUpperCase()}</em>}
            {record.packaged && <em className="appx__badge appx__badge--package">{t('app.row.packaged')}</em>}
            {record.systemComponent === true && <em className="appx__badge appx__badge--system">{t('app.row.systemComponent')}</em>}
            {record.isFramework === true && <em className="appx__badge appx__badge--runtime">{t('app.row.framework')}</em>}
          </div>
        </div>
        <button type="button" className="icon-button appx__dclose" onClick={onClose} aria-label={t('app.dossier.close')} title={t('app.dossier.close')}>
          <X size={15} />
        </button>
      </div>

      <div className="appx__dsection">
        <h4>{t('app.dossier.identity')}</h4>
        <dl className="appx__dfields">
          <div className="appx__dfield">
            <dt>{t('app.field.scope')}</dt>
            <dd>{scope ? t(`app.scope.${scope}`) : '—'}</dd>
          </div>
          <div className="appx__dfield">
            <dt>{t('app.field.date')}</dt>
            <dd>{dateText(record.installDate, locale)}</dd>
          </div>
          {fields.map(field => (
            <div className="appx__dfield" key={field.key}>
              <dt>{t(field.key)}</dt>
              <dd title={field.value ?? undefined}>{field.value}</dd>
            </div>
          ))}
          <div className="appx__dfield">
            <dt>{size.kind === 'measured' ? t('app.field.sizeMeasured') : t('app.field.sizeDeclared')}</dt>
            <dd>
              {size.bytes != null ? formatBytes(size.bytes, locale) : t('app.size.unknown')}
              {size.kind === 'advertised' && <em> · {t('app.stat.declaredNote')}</em>}
            </dd>
          </div>
        </dl>
      </div>

      <div className="appx__dsection">
        <h4>{t('app.dossier.evidence')}</h4>
        <dl className="appx__dfields">
          <div className="appx__dfield">
            <dt>{t('app.field.source')}</dt>
            <dd>{sourceLabel(record, t)}</dd>
          </div>
          {path && (
            <div className="appx__dfield">
              <dt>{t('app.field.registryKey')}</dt>
              <dd className="appx__mono" title={path}>{path}</dd>
            </div>
          )}
          {!path && record.evidence.root && (
            <div className="appx__dfield">
              <dt>{t('app.field.registryKey')}</dt>
              <dd className="appx__mono">{record.evidence.root}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="appx__dsection">
        <h4>{t('app.dossier.actions')}</h4>
        <div className="appx__actions">
          {actionsFor(record).map(action => {
            const live = action.availability === 'available';
            return (
              <button
                key={action.id}
                type="button"
                className={`appx__action${live ? '' : ' appx__action--off'}`}
                onClick={live ? () => onAction(action.id, record) : undefined}
                aria-disabled={!live}
                title={!live ? (action.reasonKey ? t(action.reasonKey) : undefined) : undefined}
              >
                {live ? <Check size={15} /> : <Ban size={15} />}
                <span className="appx__actionlabel">{t(`app.action.${action.id}`)}</span>
                <span className={`appx__action__state${live ? ' appx__action__state--live' : ''}`}>
                  {live ? t('common.on') : t('app.action.notBuilt')}
                </span>
                {!live && action.reasonKey && <span className="appx__action__note">{t(action.reasonKey)}</span>}
              </button>
            );
          })}
        </div>
        <p className="appx__hint">{t('app.action.startupNote')}</p>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------- services */

/* -------------------------------------------------------------------- page */

export default function ApplicationsPage() {
  const { t, locale, tools, runById, result, event, setPage, setNotice } = useStore();

  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [query, setQuery] = useState('');
  const [facet, setFacet] = useState<FacetId>('all');
  const [publisher, setPublisher] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('ascending');
  const [view, setView] = useState<ViewMode>('register');
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [staged, setStaged] = useState<ReadonlySet<string>>(() => new Set());
  const [, setIconTick] = useState(0);

  const rowsRef = useRef<HTMLDivElement | null>(null);
  const headCheckRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const autoLoaded = useRef(false);

  const inventoryTool = useMemo(() => tools.find(tool => tool.id === 'installed-apps') ?? null, [tools]);
  const busy = isActivePhase(event?.phase) && event?.toolId === 'installed-apps';

  const signatureRef = useRef<string | null>(null);

  const publish = useCallback((completed: ReturnType<typeof buildInventory>, ok: boolean) => {
    if (!completed) { setPhase('failed'); return; }
    const signature = inventorySignature(completed.records);
    // A re-read of the same collection is not a reason to lose work. Only a
    // collection that actually changed resets the open dossier and the queue;
    // otherwise a background refresh would close what the user just opened.
    const unchanged = signatureRef.current === signature;
    signatureRef.current = signature;
    setSnapshot(completed);
    if (!unchanged) {
      setActiveUid(null);
      setStaged(new Set());
    }
    setPhase(ok ? 'ready' : 'failed');
  }, []);

  const load = useCallback(async () => {
    if (!inventoryTool) return;
    if (!canRunTool(inventoryTool)) { setPhase('unavailable'); return; }
    setPhase('loading');
    const completed = await runById('installed-apps', {}, true);
    if (!completed) { setPhase('failed'); return; }
    publish(buildInventory(completed), completed.success);
  }, [inventoryTool, publish, runById]);

  useEffect(() => {
    if (autoLoaded.current || !tools.length) return;
    autoLoaded.current = true;
    void load();
  }, [tools.length, load]);

  // A read started from the command palette or the operation centre lands here
  // too, so the register never shows data the store has already replaced.
  useEffect(() => {
    if (!result || result.toolId !== 'installed-apps') return;
    publish(buildInventory(result), result.success);
  }, [result, publish]);

  useEffect(() => subscribeToActivity(() => setIconTick(value => value + 1)), []);

  const facets = useMemo(() => (snapshot ? facetsFor(snapshot) : []), [snapshot]);
  const filtered = useMemo(
    () => (snapshot ? applyFacet(snapshot.records, facet, publisher, query) : []),
    [snapshot, facet, publisher, query]
  );
  const rows = useMemo(() => sortRecords(filtered, sortKey, sortDir, locale), [filtered, sortKey, sortDir, locale]);
  const chapters = useMemo(() => {
    if (view !== 'chapters') return [];
    return groupRecords(sortRecords(filtered, 'publisher', 'ascending', locale), 'publisher', locale);
  }, [view, filtered, locale]);

  const activeRecord = useMemo(() => snapshot?.records.find(record => record.uid === activeUid) ?? null, [snapshot, activeUid]);
  const stagedRecords = useMemo(() => (snapshot ? snapshot.records.filter(record => staged.has(record.uid)) : []), [snapshot, staged]);
  const stagedWithFolder = stagedRecords.filter(record => record.installLocation).length;

  // The provider ids currently on screen are the only ids worth asking about.
  const visibleIds = useMemo(() => rows.map(record => record.id).filter(Boolean), [rows]);
  useEffect(() => {
    if (visibleIds.length) requestIcons(visibleIds.slice(0, 96));
  }, [visibleIds]);

  useEffect(() => {
    if (!headCheckRef.current) return;
    headCheckRef.current.indeterminate = staged.size > 0 && staged.size < rows.length;
  }, [staged.size, rows.length]);

  const toggleStaged = useCallback((uid: string) => {
    setStaged(current => {
      const next = new Set(current);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const openRecord = useCallback((record: AppRecord) => {
    setActiveUid(record.uid);
    if (iconsSupported() && record.id) requestIcons([record.id]);
  }, []);

  const resetFilters = useCallback(() => {
    setQuery(''); setFacet('all'); setPublisher(null);
  }, []);

  const runAction = useCallback(async (action: string, record: AppRecord) => {
    if (action === 'inspect-folder' && record.installLocation) {
      try {
        // `shell.openPath` answers with an empty string when Explorer opened the
        // folder and with its own message when it did not — a missing install
        // folder is a rejection-free answer, so the text is what decides.
        const outcome = await window.knoux.openPath(record.installLocation);
        if (outcome) setNotice(t('app.action.openFailed'));
      } catch {
        setNotice(t('app.action.openFailed'));
      }
      return;
    }
    if (action === 'copy-registry-path') {
      const path = registryPath(record);
      if (path) setNotice(await writeClipboard(path) ? t('app.action.copied') : t('app.action.copyFailed'));
      return;
    }
    if (action === 'copy-summary') {
      const body = [
        record.name,
        ...dossierFields(record).map(field => `${t(field.key)}: ${field.value}`),
        `${t('app.field.scope')}: ${scopeValue(record) ? t(`app.scope.${scopeValue(record)}`) : '—'}`
      ].join('\n');
      setNotice(await writeClipboard(body) ? t('app.action.copied') : t('app.action.copyFailed'));
      return;
    }
    if (action === 'review-startup') setPage('startup');
  }, [setNotice, setPage, t]);

  const openStagedFolders = useCallback(async () => {
    const targets = stagedRecords.filter(record => record.installLocation).slice(0, MAX_BATCH_OPEN);
    if (!targets.length) return;
    let opened = 0;
    for (const record of targets) {
      try {
        const outcome = await window.knoux.openPath(record.installLocation as string);
        // Counted only when Explorer said nothing, which is its success answer.
        if (!outcome) opened += 1;
      } catch {
        // A folder Windows no longer has on disk is skipped, not reported as a success.
      }
    }
    setNotice(fill(t('app.deck.opened'), { count: formatCount(opened, locale) }));
  }, [locale, stagedRecords, setNotice, t]);

  const copyManifest = useCallback(async () => {
    const body = ['name\tpublisher\tversion\tsize\tinstalled\tfolder', ...stagedRecords.map(record => manifestLine(record, locale))].join('\n');
    setNotice(await writeClipboard(body) ? fill(t('app.deck.manifestCopied'), { count: formatCount(stagedRecords.length, locale) }) : t('app.action.copyFailed'));
  }, [locale, stagedRecords, setNotice, t]);

  const onRowsKeyDown = useCallback((event_: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event_.key !== 'ArrowDown' && event_.key !== 'ArrowUp') return;
    const openers = Array.from(rowsRef.current?.querySelectorAll<HTMLButtonElement>('.appx__opener') ?? []);
    if (!openers.length) return;
    event_.preventDefault();
    const current = openers.findIndex(element => element === document.activeElement || element.contains(document.activeElement as Node | null));
    const step = event_.key === 'ArrowDown' ? 1 : -1;
    const next = current === -1 ? (step === 1 ? 0 : openers.length - 1) : Math.min(openers.length - 1, Math.max(0, current + step));
    openers[next]?.focus();
  }, []);

  const onRootKeyDown = useCallback((event_: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event_.key === 'Escape') {
      if (staged.size) { setStaged(new Set()); return; }
      if (activeUid) { setActiveUid(null); return; }
    }
    if ((event_.ctrlKey || event_.metaKey) && event_.key.toLowerCase() === 'a') {
      const target = event_.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      event_.preventDefault();
      setStaged(new Set(rows.map(record => record.uid)));
    }
  }, [activeUid, rows, staged.size]);

  const percent = progressOf(event ?? null, null);
  const refreshLabel = busy || phase === 'loading'
    ? `${t('app.head.refreshing')}${percent ? ` ${percent}%` : ''}`
    : t('app.head.refresh');

  return (
    <div className="world appx" data-world="applications" onKeyDown={onRootKeyDown}>
      <section className="world-head">
        <div className="world-head__row">
          <div className="world-head__identity">
            <span className="world-tile"><AppWindow size={22} /></span>
            <div>
              <h2 className="world-head__title">{t('app.head.title')}</h2>
              <p className="world-head__subtitle">{t('app.head.subtitle')}</p>
            </div>
          </div>
          <div className="world-head__readout">
            {snapshot?.collectedAt && phase === 'ready' && (
              <span className="world-head__stamp">{fill(t('app.head.collected'), { time: new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(snapshot.collectedAt)) })}</span>
            )}
            {iconsBusy() && <em className="appx__badge">{t('app.head.iconsWorking')}</em>}
            <button type="button" className="world-control world-control--primary" onClick={load} disabled={busy || !inventoryTool?.availability.available}>
              <RefreshCw size={15} />
              {refreshLabel}
            </button>
          </div>
        </div>

        {snapshot && phase !== 'loading' && (
          <>
            <div className="world-metrics">
              <div className="world-metric world-metric--accent">
                <b>{formatCount(snapshot.totals.all, locale)}</b>
                <span>{t('app.head.programs')}</span>
              </div>
              <div className="world-metric">
                <b>{formatCount(snapshot.totals.machineWide, locale)} · {formatCount(snapshot.totals.userOnly, locale)}</b>
                <span>{t('app.stat.machine')} / {t('app.stat.user')}</span>
              </div>
              <div className="world-metric">
                <b>{formatCount(snapshot.totals.distinctPublishers, locale)}</b>
                <span>{t('app.stat.publishers')}</span>
              </div>
              <div className="world-metric">
                <b>{snapshot.totals.withAdvertisedSize ? formatBytes(snapshot.totals.totalAdvertisedBytes, locale) : '—'}</b>
                <span>{t('app.stat.declared')}</span>
                <i>{t('app.stat.declaredNote')}</i>
              </div>
              <div className="world-metric">
                <b>{formatCount(snapshot.totals.uninstallSupported, locale)}</b>
                <span>{t('app.stat.uninstallable')}</span>
                <i>{t('app.stat.uninstallableNote')}</i>
              </div>
            </div>
            <CoverageRibbon coverage={snapshot.coverage} t={t} />
          </>
        )}
      </section>

      <section className="appx__bar">
        <div className="appx__barrow">
          <label className="appx__search">
            <Search size={15} />
            <input
              ref={searchRef}
              value={query}
              onChange={change => setQuery(change.target.value)}
              placeholder={t('app.search.placeholder')}
              aria-label={t('app.search.label')}
              type="search"
            />
            {query && (
              <button type="button" className="appx__search-clear" onClick={() => setQuery('')} aria-label={t('app.search.clear')}>
                <X size={14} />
              </button>
            )}
          </label>
          {snapshot && snapshot.publishers.length > 1 && (
            <select className="world-select" value={publisher ?? ''} onChange={change => setPublisher(change.target.value || null)} aria-label={t('app.col.publisher')}>
              <option value="">{`${t('app.col.publisher')} — ${t('app.facet.all')}`}</option>
              {snapshot.publishers.map(entry => (
                <option key={entry.name} value={entry.name}>{`${entry.name} (${formatCount(entry.count, locale)})`}</option>
              ))}
            </select>
          )}
          <span className="appx__barlabel">{t('app.sort.label')}</span>
          <select className="world-select" value={sortKey} onChange={change => setSortKey(change.target.value as SortKey)} aria-label={t('app.sort.label')}>
            {(['name', 'publisher', 'size', 'date'] as SortKey[]).map(key => <option key={key} value={key}>{t(`app.sort.${key}`)}</option>)}
          </select>
          <button
            type="button"
            className="world-control"
            onClick={() => setSortDir(current => (current === 'ascending' ? 'descending' : 'ascending'))}
            aria-label={t(sortDir === 'ascending' ? 'app.sort.ascending' : 'app.sort.descending')}
            title={t(sortDir === 'ascending' ? 'app.sort.ascending' : 'app.sort.descending')}
          >
            {sortDir === 'ascending' ? <ArrowUpGlyph /> : <ArrowDownGlyph />}
          </button>
          <div className="world-control-group" role="group" aria-label={t('app.view.label')}>
            <button type="button" aria-pressed={view === 'register'} onClick={() => setView('register')}>
              <ListChecks size={14} />{t('app.view.register')}
            </button>
            <button type="button" aria-pressed={view === 'chapters'} onClick={() => setView('chapters')}>
              <Users size={14} />{t('app.view.chapters')}
            </button>
          </div>
        </div>
        {facets.length > 0 && (
          <div className="world-facets" role="group" aria-label={t('app.facet.label')}>
            {facets.map(entry => (
              <button
                key={entry.id}
                type="button"
                className="world-facet"
                aria-pressed={facet === entry.id}
                onClick={() => setFacet(entry.id)}
              >
                {t(`app.facet.${entry.id}`)}
                <b>{formatCount(entry.count, locale)}</b>
              </button>
            ))}
            {(facet !== 'all' || publisher || query) && (
              <button type="button" className="world-facet" onClick={resetFilters}>{t('app.filters.reset')}</button>
            )}
            <span className="appx__count">{fill(t('app.results.shown'), { current: formatCount(rows.length, locale), total: formatCount(snapshot?.totals.all ?? 0, locale) })}</span>
          </div>
        )}
      </section>

      <div className="appx__body">
        <div className="appx__column">
          {(snapshot?.partial || (snapshot?.warnings.length ?? 0) > 0) && phase === 'ready' && (
            <p className="appx__warn">
              <AlertTriangle size={15} />
              <span>{fill(t('app.state.warnings'), { warnings: (snapshot?.warnings ?? []).join(' · ') || t('app.state.partial') })}</span>
            </p>
          )}

          {phase === 'unavailable' && (
            <div className="appx__states">
              <h3>{t('app.state.unavailable')}</h3>
              <p>{inventoryTool?.availability.reason ?? t('app.state.unavailable')}</p>
            </div>
          )}

          {phase === 'failed' && (
            <div className="appx__states">
              <h3>{t('app.state.failed')}</h3>
              <p>{t('app.state.emptyHint')}</p>
              <span className="world-control-group">
                <button type="button" onClick={load}>{t('app.head.refresh')}</button>
                <button type="button" onClick={() => setPage('history')}>{t('app.state.openHistory')}</button>
              </span>
            </div>
          )}

          {(phase === 'loading' || phase === 'idle') && !snapshot && (
            <div className="appx__ledger" aria-busy="true">
              <div className="appx__states">
                <h3>{t('app.state.loading')}</h3>
                <p>{t('app.state.loadingHint')}</p>
              </div>
              <div className="appx__skel">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div className="appx__skelrow" key={index}>
                    <span className="appx__skeldot" />
                    <span className="appx__skelbar" />
                    <span className="appx__skelbar" />
                    <span className="appx__skelbar" />
                    <span className="appx__skelbar" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {snapshot && phase === 'ready' && rows.length === 0 && (
            <div className="appx__states">
              <h3>{query || facet !== 'all' || publisher ? t('app.state.noResults') : t('app.state.empty')}</h3>
              <p>{query || facet !== 'all' || publisher ? t('app.state.noResultsHint') : t('app.state.emptyHint')}</p>
              {query || facet !== 'all' || publisher ? (
                <button type="button" className="world-control" onClick={resetFilters}>{t('app.filters.reset')}</button>
              ) : (
                <button type="button" className="world-control" onClick={load}>{t('app.head.refresh')}</button>
              )}
            </div>
          )}

          {snapshot && phase === 'ready' && rows.length > 0 && (
            <section className="appx__ledger" aria-label={t('app.head.title')}>
              <div className="appx__ledger-head">
                <span />
                <span className="is-name appx__colhead">
                  <input
                    ref={headCheckRef}
                    type="checkbox"
                    aria-label={t('app.deck.selectAll')}
                    checked={staged.size > 0 && staged.size === rows.length}
                    onChange={() => setStaged(current => (current.size === rows.length ? new Set<string>() : new Set(rows.map(record => record.uid))))}
                  />
                  {t('app.col.app')}
                </span>
                <span className="appx__col--publisher">{t('app.col.publisher')}</span>
                <span className="appx__col--version">{t('app.col.version')}</span>
                <span className="is-num">{t('app.col.size')}</span>
                <span className="appx__col--date">{t('app.col.installed')}</span>
              </div>
              {view === 'register' ? (
                <div className="appx__rows" ref={rowsRef} onKeyDown={onRowsKeyDown}>
                  {rows.map(record => (
                    <LedgerRow
                      key={record.uid}
                      record={record}
                      active={record.uid === activeUid}
                      staged={staged.has(record.uid)}
                      t={t}
                      locale={locale}
                      onOpen={openRecord}
                      onToggle={toggleStaged}
                    />
                  ))}
                </div>
              ) : (
                <div className="appx__chapters" ref={rowsRef} onKeyDown={onRowsKeyDown}>
                  {chapters.map(chapter => (
                    <div className="appx__chapter" key={chapter.label || 'unattributed'}>
                      <div className="appx__chapterhead">
                        <h4>{chapter.label || t('app.chapter.unattributed')}</h4>
                        <span>{fill(t('app.chapter.count'), { count: formatCount(chapter.records.length, locale) })}</span>
                        <span className="rule" />
                      </div>
                      <div className="appx__tiles">
                        {chapter.records.map(record => (
                          <Tile
                            key={record.uid}
                            record={record}
                            active={record.uid === activeUid}
                            staged={staged.has(record.uid)}
                            t={t}
                            onOpen={openRecord}
                            onToggle={toggleStaged}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/*
           * The staging deck rides the register column, not the window.
           *
           * A page-level entrance animation puts the whole document inside a
           * transformed element, and a transformed ancestor becomes the
           * containing block for `position: fixed` descendants: the tray is then
           * measured against the bottom of the page rather than the bottom of
           * the screen, and a queue you can only reach by scrolling is not a
           * queue. Sticky inside the column keeps the deck on screen for as long
           * as the register is in view and lets it settle into the flow at the
           * end of the page.
           */}
          {stagedRecords.length > 0 && (
            <div className="appx__deck" role="region" aria-label={t('app.deck.label')}>
              <div className="appx__deckinner">
                <span className="appx__deckcount">
                  <b>{formatCount(stagedRecords.length, locale)}</b>
                  <span>{t('app.deck.selected')}</span>
                </span>
                <span className="appx__decknote">
                  {t('app.deck.consequence')}
                  {' '}
                  {fill(t('app.deck.readyCount'), { count: formatCount(stagedWithFolder, locale) })}
                </span>
                <span className="appx__deckactions">
                  {staged.size < rows.length && (
                    <button type="button" className="world-control" onClick={() => setStaged(new Set(rows.map(record => record.uid)))}>
                      <ListChecks size={14} />{t('app.deck.selectAll')}
                    </button>
                  )}
                  <button type="button" className="world-control" onClick={openStagedFolders} disabled={stagedWithFolder === 0}>
                    <FolderOpen size={14} />{fill(t('app.deck.openFolders'), { count: formatCount(Math.min(stagedWithFolder, MAX_BATCH_OPEN), locale) })}
                  </button>
                  <button type="button" className="world-control" onClick={copyManifest}>
                    <Copy size={14} />{t('app.deck.copyManifest')}
                  </button>
                  <button type="button" className="world-control" onClick={() => setStaged(new Set())}>
                    <X size={14} />{t('app.deck.clear')}
                  </button>
                </span>
              </div>
            </div>
          )}
        </div>

        <Dossier record={activeRecord} t={t} locale={locale} onClose={() => setActiveUid(null)} onAction={(action, record) => { void runAction(action, record); }} />
      </div>

      <ServicesRail
        world="applications"
        titleKey="app.services.title"
        hintKey="app.services.hint"
        liveKey="app.services.live"
        openKey="app.services.openTool"
        invoke={{
          'app-inventory': () => { void load(); },
          'app-identity': () => {
            if (!iconsSupported()) { setNotice(t('app.dossier.iconPending')); return; }
            resetIconCache();
            requestIcons(visibleIds.slice(0, 96));
          }
        }}
        t={t}
        locale={locale}
      />
    </div>
  );
}

function ArrowUpGlyph() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>;
}

function ArrowDownGlyph() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>;
}
