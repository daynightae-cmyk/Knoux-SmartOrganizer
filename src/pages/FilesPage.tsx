import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowRight, ArrowUp, Check, Download, FolderOpen, FolderSearch,
  Hash, Search, ShieldAlert, Undo2, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ServicesRail } from '../components/world/ServicesRail';
import {
  ageInOrder, applyFacet, buildFileSnapshot, buildPlan, exposedPaths, facetsFor, fileActions,
  fileFields, matchesBucket, matchesExtension, planCategories, sortRecords, typeInOrder,
  NO_EXTENSION_BUCKET, ROOT_BUCKET,
  type FacetId, type FileRecord, type FileSnapshot, type PlanSnapshot, type SortDirection, type SortKey
} from '../lib/file-inventory';
import { fill, formatBytes, formatCount, formatDateTime, formatPercent, labeledBy } from '../lib/format';
import { canRunTool, isActivePhase } from '../lib/guards';
import { useStore } from '../state/store';
import type { Locale } from '../locales';

/**
 * The Files world.
 *
 * Applications answers "what is installed". Files answers "what did I leave in
 * Downloads, how much is it, how old is it, and what would filing it away
 * actually do". That difference drives the whole composition: a proportional
 * band of measured bytes instead of a coverage ribbon, an inspector instead of
 * a dossier, and a plan you preview, confirm, and can undo — because this is the
 * one world where the interface can change the disk.
 */

type Phase = 'idle' | 'loading' | 'ready' | 'failed' | 'unavailable';
type PlanPhase = 'idle' | 'previewing' | 'ready' | 'applying' | 'applied' | 'undoing' | 'failed';

/** Rows are drawn lazily by count: 400 dense rows is already past what a person scans. */
const MAX_ROWS = 400;

/** Each real action carries its own mark, so the inspector is not a column of ticks. */
const ACTION_ICON: Record<string, LucideIcon> = { hash: Hash, 'reveal-folder': FolderOpen };

function typeClass(type: string): string {
  return `filex--${type.replace(/[^A-Za-z]/g, '') || 'noext'}`;
}

/**
 * A plan lane is named by the folder the engine would file into — "Archives",
 * "Images" — which is an identifier the engine writes, not display text. The
 * ledger already translates the same words for its type column, so the plan
 * borrows those entries rather than duplicating them. A category the copy set
 * has never heard of keeps its own name: `translate()` answers a missing key
 * with the key itself, and "file.type.Something" on a lane head is worse than
 * the English folder name it came from.
 */
function categoryLabel(category: string, t: (key: string) => string): string {
  return labeledBy(t, `file.type.${category}`, category);
}

function dateText(value: string | null, locale: Locale): string {
  if (!value) return '—';
  const parsed = new Date(value).getTime();
  if (!Number.isFinite(parsed)) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(parsed));
}

/* ------------------------------------------------------- composition band */

interface BandProps {
  snapshot: FileSnapshot;
  activeType: string | null;
  activeAge: string | null;
  onType: (type: string | null) => void;
  onAge: (age: string | null) => void;
  t: (key: string) => string;
  locale: Locale;
}

/**
 * Two rules, both measured.
 *
 * The upper rule splits the folder's bytes by the group Windows assigns to each
 * extension; the lower splits the same bytes by modification age. Segment width
 * is the real share, so a 3% group is a 3% sliver — the labels live in the
 * legend underneath rather than being smuggled into the geometry.
 */
function CompositionBand({ snapshot, activeType, activeAge, onType, onAge, t, locale }: BandProps) {
  const types = useMemo(() => typeInOrder(snapshot), [snapshot]);
  const ages = useMemo(() => ageInOrder(snapshot), [snapshot]);
  const total = snapshot.totalBytes;

  return (
    <section className="filex__bands" aria-label={t('file.band.types')}>
      <div className="filex__band">
        <div className="filex__bandhead">
          <h3>{t('file.band.types')}</h3>
          <p>{t('file.band.typesHint')}</p>
          {(activeType || activeAge) && (
            <button type="button" className="filex__bandclear" onClick={() => { onType(null); onAge(null); }}>
              <X size={13} />{t('file.band.clear')}
            </button>
          )}
        </div>
        <div className="filex__rule" role="group" aria-label={t('file.band.types')}>
          {types.map(group => {
            const share = total ? group.bytes / total : 0;
            const on = activeType === group.type;
            return (
              <button
                key={group.type}
                type="button"
                className={`filex__seg ${typeClass(group.type)}${on ? ' filex__seg--on' : ''}`}
                style={{ flexGrow: Math.max(share * 10000, 0.4) } as CSSProperties}
                aria-pressed={on}
                onClick={() => onType(on ? null : group.type)}
                title={`${t(`file.type.${group.type}`)} · ${formatBytes(group.bytes, locale)} · ${formatCount(group.files, locale)}`}
              >
                <span className="filex__segfill" />
              </button>
            );
          })}
        </div>
        <div className="filex__legend">
          {types.map(group => {
            const share = total ? Math.round((group.bytes / total) * 1000) / 10 : 0;
            const on = activeType === group.type;
            return (
              <button key={group.type} type="button" className={`filex__chip ${typeClass(group.type)}${on ? ' filex__chip--on' : ''}`} aria-pressed={on} onClick={() => onType(on ? null : group.type)}>
                <i aria-hidden="true" />
                <span>{t(`file.type.${group.type}`)}</span>
                <b>{formatBytes(group.bytes, locale)}</b>
                <em>{share}%</em>
              </button>
            );
          })}
        </div>
      </div>

      <div className="filex__band filex__band--age">
        <div className="filex__rule filex__rule--age" role="group" aria-label={t('file.band.age')}>
          {ages.map(bucket => {
            const on = activeAge === bucket.age;
            return (
              <button
                key={bucket.age}
                type="button"
                className={`filex__seg filex--age-${bucket.age}${on ? ' filex__seg--on' : ''}`}
                style={{ flexGrow: Math.max(bucket.percentBytes * 100, 0.4) } as CSSProperties}
                aria-pressed={on}
                onClick={() => onAge(on ? null : bucket.age)}
                title={`${t(`file.age.${bucket.age}`)} · ${formatBytes(bucket.bytes, locale)} · ${formatCount(bucket.files, locale)}`}
              >
                <span className="filex__segfill" />
              </button>
            );
          })}
        </div>
        <div className="filex__legend filex__legend--age">
          {ages.map(bucket => (
            <button key={bucket.age} type="button" className={`filex__chip filex--age-${bucket.age}${activeAge === bucket.age ? ' filex__chip--on' : ''}`} aria-pressed={activeAge === bucket.age} onClick={() => onAge(activeAge === bucket.age ? null : bucket.age)}>
              <i aria-hidden="true" />
              <span>{t(`file.age.${bucket.age}`)}</span>
              <b>{formatCount(bucket.files, locale)}</b>
            </button>
          ))}
          {/* The measure the age rule is drawn from travels with the chips it
              describes, so the line is read once instead of costing the band a
              row of its own. */}
          <p className="filex__bandnote">{t('file.band.ageHint')}</p>
        </div>
      </div>

      {/*
       * The honesty line of this world. Every proportion above is built from
       * the four attributes below, so the band states how many of the returned
       * rows really carry each one instead of implying a complete record.
       */}
      <div className="filex__coverage">
        <span className="filex__coveragelabel">{t('file.band.coverage')}</span>
        {snapshot.coverage.map(measure => {
          const share = measure.total ? Math.round((measure.known / measure.total) * 1000) / 10 : 0;
          return (
            <span key={measure.key} className={`filex__coverageitem${measure.supported ? '' : ' filex__coverageitem--off'}`} title={`${t(`file.coverage.${measure.key}`)} · ${formatCount(measure.known, locale)} / ${formatCount(measure.total, locale)}`}>
              <span className="filex__coveragetrack" aria-hidden="true"><i style={{ '--fill': `${share}%` } as CSSProperties} /></span>
              <b>{t(`file.coverage.${measure.key}`)}</b>
              <em>{formatPercent(share, locale)}</em>
            </span>
          );
        })}
      </div>

      {/* Proportional geometry is only honest if the read was whole. When the
          engine cut the list at its limit, the rules describe what came back,
          so the band says so instead of implying a complete folder. */}
      {snapshot.truncated && (
        <p className="filex__warn">
          <AlertTriangle size={15} />
          <span>{t('file.state.truncated')}</span>
        </p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------- rows */

interface RowProps {
  record: FileRecord;
  largest: number;
  active: boolean;
  exposed: boolean;
  t: (key: string) => string;
  locale: Locale;
  onOpen: (record: FileRecord) => void;
}

function FileRow({ record, largest, active, exposed, t, locale, onOpen }: RowProps) {
  const share = largest > 0 ? Math.max((record.size / largest) * 100, 0.6) : 0;
  const flags = [
    record.hydrationRisk === 'avoid' ? { key: 'cloud', text: t('file.row.cloud'), cls: 'filex__badge--link' } : null,
    record.hydrationRisk !== 'avoid' && record.isLink ? { key: 'link', text: t('file.row.link'), cls: 'filex__badge--link' } : null,
    record.hardlinked ? { key: 'hard', text: t('file.row.hardlink'), cls: 'filex__badge--hardlink' } : null,
    exposed ? { key: 'exposed', text: t('file.exposure.badge'), cls: 'filex__badge--exposed' } : null
  ].filter((flag): flag is { key: string; text: string; cls: string } => Boolean(flag));

  return (
    <div
      className={`filex__row ${typeClass(record.type)}`}
      data-active={active}
      onClick={() => onOpen(record)}
    >
      <span className="filex__cell filex__cell--name">
        <button
          type="button"
          className="filex__opener"
          aria-expanded={active}
          aria-label={fill(t('file.col.select'), { name: record.name })}
          onClick={click => { click.stopPropagation(); onOpen(record); }}
        >
          <span className="filex__fname">
            <span className="filex__stem">{record.stem}</span>
            <span className={`filex__ext${record.extension ? '' : ' filex__ext--none'}`}>{record.extension || t('file.row.noExtension')}</span>
          </span>
        </button>
        {flags.length > 0 && (
          <span className="filex__rowflags">
            {flags.map(flag => <em key={flag.key} className={`filex__badge ${flag.cls}`}>{flag.text}</em>)}
          </span>
        )}
      </span>
      <span className="filex__cell filex__cell--folder" title={record.path}>{record.folder || t('file.row.root')}</span>
      <span className="filex__cell filex__cell--type"><em className={`filex__badge ${typeClass(record.type)}`}>{t(`file.type.${record.type}`)}</em></span>
      <span className="filex__cell filex__cell--age">{t(`file.age.${record.ageBucket}`)}</span>
      <span className="filex__cell filex__cell--size">
        <span className="filex__sizetrack" aria-hidden="true"><i style={{ '--fill': `${share}%` } as CSSProperties} /></span>
        <b>{formatBytes(record.size, locale)}</b>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------- inspector */

interface GlanceProps {
  snapshot: FileSnapshot;
  bucket: string | null;
  extension: string | null;
  onBucket: (bucket: string | null) => void;
  onExtension: (extension: string | null) => void;
  t: (key: string) => string;
  locale: Locale;
}

/**
 * The inspector with nothing selected.
 *
 * An idle column has two honest jobs: say what it is waiting for, and say what
 * the read found. The two lists are the walk's own groupings — first-level
 * folders and raw extensions — which appear nowhere else on the bench, because
 * the band above sorts by Windows' type groups instead. Every row is also a
 * real filter, so the panel is a way into the listing rather than a placeholder
 * while you look elsewhere. Nothing is invented: a folder the walk could not
 * open is not listed, and the honesty foot reports it instead.
 */
function AtAGlance({ snapshot, bucket, extension, onBucket, onExtension, t, locale }: GlanceProps) {
  const folders = snapshot.topFolders.slice(0, 6);
  const extensions = snapshot.extensionGroups.slice(0, 8);
  const folderTop = folders[0]?.bytes ?? 0;
  const extensionTop = extensions[0]?.bytes ?? 0;
  const walk = snapshot.traversal;
  const honesty = [
    walk.accessDenied ? fill(t('file.glance.denied'), { count: formatCount(walk.accessDenied, locale) }) : null,
    walk.reparsePointsSkipped ? fill(t('file.glance.reparse'), { count: formatCount(walk.reparsePointsSkipped, locale) }) : null,
    walk.cloudPlaceholders ? fill(t('file.glance.cloud'), { count: formatCount(walk.cloudPlaceholders, locale) }) : null,
    walk.hardlinkedFiles ? fill(t('file.glance.hardlink'), { count: formatCount(walk.hardlinkedFiles, locale) }) : null,
    walk.excluded ? fill(t('file.glance.excluded'), { count: formatCount(walk.excluded, locale) }) : null
  ].filter((line): line is string => Boolean(line));

  return (
    <aside className="filex__inspector filex__inspector--glance" aria-label={t('file.glance.label')}>
      <div className="filex__glancehead">
        <h3>{t('file.inspector.empty')}</h3>
        <p>{t('file.inspector.emptyHint')}</p>
      </div>

      {folders.length > 0 && (
        <section className="filex__glancegroup">
          <h4>{t('file.glance.folders')}</h4>
          <p>{t('file.glance.foldersHint')}</p>
          <ol className="filex__glancelist">
            {folders.map(group => {
              const on = bucket === group.folder;
              const share = folderTop > 0 ? Math.max((group.bytes / folderTop) * 100, 3) : 0;
              return (
                <li key={group.folder}>
                  <button
                    type="button"
                    className="filex__glancerow"
                    aria-pressed={on}
                    title={t('file.glance.pick')}
                    style={{ '--share': `${share}%` } as CSSProperties}
                    onClick={() => onBucket(on ? null : group.folder)}
                  >
                    <bdi>{group.folder === ROOT_BUCKET ? t('file.glance.root') : group.folder}</bdi>
                    <em>{fill(t('file.glance.fileCount'), { count: formatCount(group.files, locale) })}</em>
                    <b>{formatBytes(group.bytes, locale)}</b>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {extensions.length > 0 && (
        <section className="filex__glancegroup">
          <h4>{t('file.glance.extensions')}</h4>
          <p>{t('file.glance.extensionsHint')}</p>
          <div className="filex__glancetiles">
            {extensions.map(group => {
              const on = extension === group.extension;
              const share = extensionTop > 0 ? Math.max((group.bytes / extensionTop) * 100, 4) : 0;
              return (
                <button
                  key={group.extension}
                  type="button"
                  className={`filex__glancetile${on ? ' filex__glancetile--on' : ''}`}
                  aria-pressed={on}
                  title={t('file.glance.pickExtension')}
                  style={{ '--share': `${share}%` } as CSSProperties}
                  onClick={() => onExtension(on ? null : group.extension)}
                >
                  <code>{group.extension === NO_EXTENSION_BUCKET ? t('file.row.noExtension') : group.extension}</code>
                  <b>{formatBytes(group.bytes, locale)}</b>
                  <span>{fill(t('file.glance.fileCount'), { count: formatCount(group.files, locale) })}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="filex__glancefoot">
        <p>{fill(t('file.glance.walk'), { folders: formatCount(walk.foldersVisited, locale), files: formatCount(walk.filesVisited, locale) })}</p>
        {honesty.length > 0 && (
          <ul>
            {honesty.map(line => <li key={line}>{line}</li>)}
          </ul>
        )}
        {snapshot.truncated && <p className="filex__glancecap">{t('file.state.truncated')}</p>}
        <p className="filex__glancenote">{t('file.glance.selectNote')}</p>
      </div>
    </aside>
  );
}

interface InspectorProps {
  record: FileRecord | null;
  snapshot: FileSnapshot | null;
  hash: { digest: string; algorithm: string; reliable: boolean } | null;
  hashing: boolean;
  busy: boolean;
  bucket: string | null;
  extension: string | null;
  onBucket: (bucket: string | null) => void;
  onExtension: (extension: string | null) => void;
  t: (key: string) => string;
  locale: Locale;
  onAction: (id: string) => void;
  onClose: () => void;
}

function Inspector({ record, snapshot, hash, hashing, busy, bucket, extension, onBucket, onExtension, t, locale, onAction, onClose }: InspectorProps) {
  if (!record) {
    if (!snapshot) {
      return (
        <aside className="filex__inspector filex__inspector--empty">
          <h3>{t('file.inspector.empty')}</h3>
          <p>{t('file.inspector.emptyHint')}</p>
        </aside>
      );
    }
    return <AtAGlance snapshot={snapshot} bucket={bucket} extension={extension} onBucket={onBucket} onExtension={onExtension} t={t} locale={locale} />;
  }
  // A record only ever comes out of a snapshot, so the selected branch below
  // never has to re-check it.
  const actions = fileActions(record);
  return (
    <aside className="filex__inspector filex__inspector--record" aria-label={record.name}>
      <div className="filex__inspectorhead">
        <span className={`filex__extmark ${typeClass(record.type)}`} aria-hidden="true">{record.extension ? record.extension.slice(1, 4).toUpperCase() : '—'}</span>
        <div className="filex__inspectortitle">
          <h3>{record.name}</h3>
          <p>{record.folder || t('file.row.root')}</p>
        </div>
        <button type="button" className="filex__close" onClick={onClose} aria-label={t('common.close')}><X size={15} /></button>
      </div>
      <h4 className="filex__fieldsgroup">{t('file.inspector.attributes')}</h4>
      <dl className="filex__fields">
        {fileFields(record).map(field => {
          const raw = field.key === 'file.field.size'
            ? formatBytes(record.size, locale)
            : field.key === 'file.field.type'
              ? t(`file.type.${record.type}`)
              : field.key === 'file.field.modified' || field.key === 'file.field.created'
                ? dateText(field.value, locale)
                // A file sitting directly in Downloads has no subfolder, and the
                // ledger calls that place "Root". An em dash in the inspector
                // would read as a value Windows did not record, which is a
                // different claim about the same file.
                : field.key === 'file.field.folder' && !field.value
                  ? t('file.row.root')
                  : field.value || '—';
          // A Windows path keeps its own order even inside an Arabic layout.
          const isPath = field.key === 'file.field.path' || field.key === 'file.field.folder';
          const recorded = Boolean(field.value) || (field.key === 'file.field.folder' && !field.value);
          return (
            <div key={field.key}>
              <dt>{t(field.key)}</dt>
              <dd className={recorded ? '' : 'filex__void'}>{isPath && field.value ? <bdi>{raw}</bdi> : raw}</dd>
            </div>
          );
        })}
      </dl>
      {hash && (
        <div className="filex__digest" role="status">
          <span>{hash.algorithm.toUpperCase()}</span>
          <code>{hash.digest}</code>
          {!hash.reliable && <em>{t('file.hash.unreliable')}</em>}
        </div>
      )}
      <div className="filex__inspectoractions">
        <h4>{t('file.inspector.actions')}</h4>
        <div className="filex__actions">
          {actions.map(action => {
            const Icon = action.available ? ACTION_ICON[action.id] ?? Check : ShieldAlert;
            return (
              <button
                key={action.id}
                type="button"
                className={`filex__action${action.available ? '' : ' filex__action--off'}`}
                onClick={action.available ? () => onAction(action.id) : undefined}
                aria-disabled={!action.available}
                title={!action.available && action.reasonKey ? t(action.reasonKey) : undefined}
                disabled={action.id === 'hash' && busy}
              >
                <Icon size={15} />
                <span className="filex__actionlabel">{t(`file.action.${action.id}`)}</span>
                <span className={`filex__actionstate${action.available ? ' filex__actionstate--live' : ''}`}>
                  {action.id === 'hash' && hashing ? t('file.plan.running') : action.available ? t('file.action.ready') : t('file.action.notBuilt')}
                </span>
                {!action.available && action.reasonKey && <span className="filex__actionnote">{t(action.reasonKey)}</span>}
              </button>
            );
          })}
        </div>
        <p className="filex__hint">{t('file.action.startupNote')}</p>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------- page */

export default function FilesPage() {
  const { t, locale, tools, runById, result, event, setNotice, setPage } = useStore();

  const [snapshot, setSnapshot] = useState<FileSnapshot | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [query, setQuery] = useState('');
  const [facet, setFacet] = useState<FacetId>('all');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [ageFilter, setAgeFilter] = useState<string | null>(null);
  const [bucketFilter, setBucketFilter] = useState<string | null>(null);
  const [extensionFilter, setExtensionFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('size');
  const [sortDir, setSortDir] = useState<SortDirection>('descending');
  const [activePath, setActivePath] = useState<string | null>(null);
  const [hashes, setHashes] = useState<Record<string, { digest: string; algorithm: string; reliable: boolean }>>({});

  const [plan, setPlan] = useState<PlanSnapshot | null>(null);
  const [planPhase, setPlanPhase] = useState<PlanPhase>('idle');
  const [journalId, setJournalId] = useState<string | null>(null);
  const [applyOutcome, setApplyOutcome] = useState<{ moved: number; failed: number; verification: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const [emptyFolders, setEmptyFolders] = useState<{ empty: number; scanned: number; inaccessible: number; paths: string[] } | null>(null);
  const [foldersBusy, setFoldersBusy] = useState(false);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const rowsRef = useRef<HTMLDivElement | null>(null);
  const autoLoaded = useRef(false);

  const inventoryTool = useMemo(() => tools.find(tool => tool.id === 'downloads-inventory') ?? null, [tools]);
  const organizeTool = useMemo(() => tools.find(tool => tool.id === 'organize-downloads-preview') ?? null, [tools]);
  const applyTool = useMemo(() => tools.find(tool => tool.id === 'organize-downloads-apply') ?? null, [tools]);
  const undoTool = useMemo(() => tools.find(tool => tool.id === 'organize-downloads-undo') ?? null, [tools]);
  const hashTool = useMemo(() => tools.find(tool => tool.id === 'file-hash') ?? null, [tools]);
  const foldersTool = useMemo(() => tools.find(tool => tool.id === 'empty-folders') ?? null, [tools]);

  const reading = isActivePhase(event?.phase) && event?.toolId === 'downloads-inventory';
  const hashing = isActivePhase(event?.phase) && event?.toolId === 'file-hash';
  const planning = isActivePhase(event?.phase) && event?.toolId === 'organize-downloads-preview';
  const applying = isActivePhase(event?.phase) && event?.toolId === 'organize-downloads-apply';
  const undoing = isActivePhase(event?.phase) && event?.toolId === 'organize-downloads-undo';

  const load = useCallback(async () => {
    if (!inventoryTool) { setPhase('unavailable'); return; }
    if (!canRunTool(inventoryTool)) { setPhase('unavailable'); return; }
    setPhase('loading');
    const completed = await runById('downloads-inventory', {}, true);
    if (!completed) { setPhase('failed'); return; }
    const built = buildFileSnapshot(completed);
    if (!built) { setPhase('failed'); return; }
    setSnapshot(built);
    setPhase('ready');
  }, [inventoryTool, runById]);

  useEffect(() => {
    if (autoLoaded.current || !tools.length) return;
    autoLoaded.current = true;
    void load();
  }, [tools.length, load]);

  // A read started elsewhere still lands here, so the bench never shows a
  // listing the store has already replaced.
  useEffect(() => {
    if (!result) return;
    if (result.toolId === 'downloads-inventory') {
      const built = buildFileSnapshot(result);
      if (built) { setSnapshot(built); setPhase(result.success ? 'ready' : 'failed'); }
      return;
    }
    if (result.toolId === 'organize-downloads-preview') {
      const built = buildPlan(result);
      if (built) { setPlan(built); setPlanPhase('ready'); setConfirmed(false); setApplyOutcome(null); }
      return;
    }
    if (result.toolId === 'organize-downloads-apply') {
      const summary = (result.summary || {}) as Record<string, unknown>;
      const moved = Number(summary.movedFiles) || 0;
      const failed = Number(summary.failedFiles) || 0;
      const verification = String((summary.verification as { status?: string } | undefined)?.status || 'unverified');
      const journal = (result.undoMetadata as { journalId?: string } | null | undefined)?.journalId || null;
      setApplyOutcome({ moved, failed, verification });
      setPlanPhase(result.success ? 'applied' : 'failed');
      if (journal) setJournalId(journal);
      return;
    }
    if (result.toolId === 'organize-downloads-undo') {
      const summary = (result.summary || {}) as Record<string, unknown>;
      setNotice(fill(t('file.plan.restored'), { count: formatCount(Number(summary.restoredFiles) || 0, locale) }));
      setPlanPhase('idle');
      setPlan(null);
      setJournalId(null);
      setApplyOutcome(null);
      void load();
      return;
    }
    if (result.toolId === 'empty-folders') {
      const summary = (result.summary || {}) as Record<string, unknown>;
      setEmptyFolders({
        empty: Number(summary.emptyFolders) || 0,
        scanned: Number(summary.foldersScanned) || 0,
        inaccessible: Number(summary.inaccessibleFolders) || 0,
        paths: (result.items || []).map(item => String((item as Record<string, unknown>).path || '')).filter(Boolean).slice(0, 60)
      });
      setFoldersBusy(false);
      return;
    }
    if (result.toolId === 'file-hash') {
      const summary = (result.summary || {}) as Record<string, unknown>;
      const file = String(summary.file || '');
      const digest = String(result.items?.[0]?.digest || '');
      if (file && digest) {
        setHashes(current => ({ ...current, [file]: { digest, algorithm: String(summary.algorithm || 'sha256'), reliable: summary.digestReliable !== false } }));
      }
    }
  }, [result, load, setNotice, t, locale]);

  const exposed = useMemo(() => (snapshot ? exposedPaths(snapshot) : new Set<string>()), [snapshot]);
  const facets = useMemo(() => (snapshot ? facetsFor(snapshot) : []), [snapshot]);
  const filtered = useMemo(() => {
    if (!snapshot) return [];
    const base = applyFacet(snapshot.records, facet, exposed, query);
    return base.filter(record => (
      (!typeFilter || record.type === typeFilter)
      && (!ageFilter || record.ageBucket === ageFilter)
      && (!bucketFilter || matchesBucket(record, bucketFilter))
      && (!extensionFilter || matchesExtension(record, extensionFilter))
    ));
  }, [snapshot, facet, exposed, query, typeFilter, ageFilter, bucketFilter, extensionFilter]);
  const rows = useMemo(() => sortRecords(filtered, sortKey, sortDir, locale), [filtered, sortKey, sortDir, locale]);
  const drawn = useMemo(() => rows.slice(0, MAX_ROWS), [rows]);
  const activeRecord = useMemo(() => snapshot?.records.find(record => record.path === activePath) ?? null, [snapshot, activePath]);
  const categories = useMemo(() => (plan ? planCategories(plan) : []), [plan]);
  const withheld = useMemo(() => (plan ? plan.moves.filter(move => move.withheld) : []), [plan]);

  const preview = useCallback(async () => {
    if (!organizeTool || !canRunTool(organizeTool)) { setNotice(t('file.state.unavailable')); return; }
    setPlanPhase('previewing');
    const completed = await runById('organize-downloads-preview', {}, true);
    if (!completed || !completed.success) setPlanPhase('failed');
  }, [organizeTool, runById, setNotice, t]);

  /**
   * The dock's next step: ask the existing preview engine for a plan and bring
   * the plan section into view, so the button never looks like it did nothing
   * when the answer lands below the fold.
   */
  const reviewPlan = useCallback(() => {
    void preview();
    window.requestAnimationFrame(() => {
      document.querySelector('.filex__plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [preview]);

  const apply = useCallback(async () => {
    if (!confirmed || !applyTool || !canRunTool(applyTool) || !plan) return;
    setPlanPhase('applying');
    // The engine refuses this call without an explicit `confirm: true`, and the
    // checkbox that sets `confirmed` is the only thing that can supply it.
    const completed = await runById('organize-downloads-apply', { confirm: true }, false);
    if (!completed) setPlanPhase('failed');
  }, [applyTool, confirmed, plan, runById]);

  const undo = useCallback(async () => {
    if (!journalId || !undoTool || !canRunTool(undoTool)) return;
    setPlanPhase('undoing');
    const completed = await runById('organize-downloads-undo', { journalId }, false);
    if (!completed) setPlanPhase('ready');
  }, [journalId, undoTool, runById]);

  const inspectFolderEmpties = useCallback(async () => {
    if (!foldersTool || !canRunTool(foldersTool)) { setNotice(t('file.state.unavailable')); return; }
    setFoldersBusy(true);
    const completed = await runById('empty-folders', {}, true);
    if (!completed) setFoldersBusy(false);
  }, [foldersTool, runById, setNotice, t]);

  const onInspectorAction = useCallback((id: string) => {
    if (!activeRecord) return;
    if (id === 'hash') {
      if (!hashTool || !canRunTool(hashTool)) { setNotice(t('file.state.unavailable')); return; }
      void runById('file-hash', { filePath: activeRecord.path, algorithm: 'sha256' }, false);
      return;
    }
    if (id === 'reveal-folder') {
      const directory = activeRecord.path.replace(/\//g, '\\').replace(/\\[^\\]*$/, '');
      // `shell.openPath` resolves to an empty string when Explorer opened the
      // folder and to its own error message when it did not, so the absence of
      // text is the success case — not a failure to be reported.
      void window.knoux.openPath(directory).then(outcome => {
        if (!outcome) return;
        setNotice(t('file.state.unavailable'));
      }).catch(() => setNotice(t('file.state.unavailable')));
    }
  }, [activeRecord, hashTool, runById, setNotice, t]);

  const focusRow = (index: number) => {
    const target = drawn[index];
    if (target) setActivePath(target.path);
  };

  /**
   * The one way a row becomes the selected entry.
   *
   * The ledger, the arrow keys and the plan lanes all open the inspector; going
   * through here keeps a second click from leaving a file selected that the
   * reader just dismissed.
   */
  const pickRecord = useCallback((record: FileRecord) => {
    setActivePath(current => (current === record.path ? null : record.path));
  }, []);

  const onRootKeyDown = (event_: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event_.key === '/' && document.activeElement !== searchRef.current) {
      event_.preventDefault();
      searchRef.current?.focus();
      return;
    }
    if (event_.key !== 'ArrowDown' && event_.key !== 'ArrowUp') return;
    if (!drawn.length) return;
    event_.preventDefault();
    const current = drawn.findIndex(record => record.path === activePath);
    const next = event_.key === 'ArrowDown' ? Math.min(current + 1, drawn.length - 1) : Math.max(current - 1, 0);
    focusRow(current < 0 ? 0 : next);
    const node = rowsRef.current?.querySelectorAll<HTMLElement>('.filex__opener')[current < 0 ? 0 : next];
    node?.focus();
  };

  const resetFilters = () => { setFacet('all'); setTypeFilter(null); setAgeFilter(null); setBucketFilter(null); setExtensionFilter(null); setQuery(''); };
  const filtersOn = facet !== 'all' || Boolean(query) || Boolean(typeFilter) || Boolean(ageFilter) || Boolean(bucketFilter) || Boolean(extensionFilter);
  // The idle inspector's two lists narrow the ledger on the walk's own groupings,
  // so the chip that undoes them names the same grouping it was picked from.
  const narrowed = bucketFilter
    ? { label: bucketFilter === ROOT_BUCKET ? t('file.glance.root') : bucketFilter, clear: () => setBucketFilter(null) }
    : extensionFilter
      ? { label: extensionFilter === NO_EXTENSION_BUCKET ? t('file.row.noExtension') : extensionFilter, clear: () => setExtensionFilter(null) }
      : null;

  return (
    <div className="world filex" data-world="files" onKeyDown={onRootKeyDown}>
      <section className="world-head">
        <div className="world-head__row">
          <div className="world-head__identity">
            <span className="world-tile"><Download size={22} /></span>
            <div>
              <h2 className="world-head__title">{t('file.head.title')}</h2>
              <p className="world-head__subtitle">{t('file.head.subtitle')}</p>
            </div>
          </div>
          <div className="world-head__readout">
            {snapshot && (
              <span className="filex__path" title={snapshot.root}>
                <span>{t('file.head.folder')}</span>
                <bdi>{snapshot.root}</bdi>
              </span>
            )}
            {snapshot && (
              <span className="world-head__stamp">{fill(t('file.head.readAt'), { time: formatDateTime(snapshot.collectedAt, locale) })}</span>
            )}
            <button type="button" className="world-control world-control--primary" onClick={() => void load()} disabled={reading}>
              {reading ? t('file.head.refreshing') : t('file.head.refresh')}
            </button>
          </div>
        </div>

        {snapshot && (
          <div className="world-metrics">
            <div className="world-metric world-metric--accent">
              <b>{formatCount(snapshot.filesFound, locale)}</b>
              <span>{t('file.stat.files')}</span>
            </div>
            <div className="world-metric">
              <b>{formatBytes(snapshot.totalBytes, locale)}</b>
              <span>{t('file.stat.bytes')}</span>
              <i>{t('file.stat.bytesNote')}</i>
            </div>
            <div className="world-metric">
              <b>{formatCount(snapshot.records.filter(record => record.inRoot).length, locale)}</b>
              <span>{t('file.stat.root')}</span>
              <i>{t('file.stat.rootNote')}</i>
            </div>
            <div className="world-metric">
              <b>{formatBytes(snapshot.largestBytes, locale)}</b>
              <span>{t('file.stat.largest')}</span>
            </div>
            <div className="world-metric">
              <b>{formatCount(snapshot.records.filter(record => record.ageBucket === 'year' || record.ageBucket === 'older').length, locale)}</b>
              <span>{t('file.stat.stale')}</span>
              <i>{t('file.stat.staleNote')}</i>
            </div>
          </div>
        )}
        {snapshot && <CompositionBand snapshot={snapshot} activeType={typeFilter} activeAge={ageFilter} onType={setTypeFilter} onAge={setAgeFilter} t={t} locale={locale} />}
      </section>

      <section className="filex__controls">
        <div className="filex__bar">
          <label className="filex__search">
            <Search size={15} />
            <input ref={searchRef} value={query} onChange={change => setQuery(change.target.value)} placeholder={t('file.search.placeholder')} aria-label={t('file.search.placeholder')} />
            {query && <button type="button" className="filex__search-clear" onClick={() => setQuery('')} aria-label={t('file.search.clear')}><X size={14} /></button>}
          </label>
          <span className="filex__label">{t('file.sort.label')}</span>
          <select className="world-select" value={sortKey} onChange={change => setSortKey(change.target.value as SortKey)} aria-label={t('file.sort.label')}>
            {(['name', 'size', 'date', 'type'] as SortKey[]).map(key => <option key={key} value={key}>{t(`file.sort.${key}`)}</option>)}
          </select>
          <button
            type="button"
            className="world-control"
            onClick={() => setSortDir(current => (current === 'ascending' ? 'descending' : 'ascending'))}
            aria-label={t(sortDir === 'ascending' ? 'file.sort.ascending' : 'file.sort.descending')}
            title={t(sortDir === 'ascending' ? 'file.sort.ascending' : 'file.sort.descending')}
          >
            {sortDir === 'ascending' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
          </button>
        </div>
        {facets.length > 0 && (
          <div className="world-facets" role="group" aria-label={t('file.facets.label')}>
            {facets.map(entry => (
              <button key={entry.id} type="button" className="world-facet" aria-pressed={facet === entry.id} onClick={() => setFacet(entry.id)}>
                {t(`file.facet.${entry.id}`)}
                <b>{formatCount(entry.count, locale)}</b>
              </button>
            ))}
            {narrowed && (
              <button type="button" className="world-facet world-facet--narrowed" onClick={narrowed.clear} aria-label={fill(t('file.glance.clear'), { label: narrowed.label })}>
                <X size={12} />
                <span>{t('file.glance.narrowedTo')} <bdi>{narrowed.label}</bdi></span>
              </button>
            )}
            {filtersOn && <button type="button" className="world-facet" onClick={resetFilters}>{t('file.facet.reset')}</button>}
            <span className="filex__count">{fill(t('file.results.shown'), { current: formatCount(rows.length, locale), total: formatCount(snapshot?.records.length ?? 0, locale) })}</span>
          </div>
        )}
        <p className="filex__kbd">{t('file.head.keyboard')}</p>
      </section>

      <div className="filex__body">
        <div className="filex__column">
          {/* `warnings.length` alone would render a literal 0 when the tree is
              complete, because React prints the number it finds after `||`. */}
          {phase === 'ready' && snapshot && (snapshot.partial || snapshot.warnings.length > 0) && (
            <p className="filex__warn">
              <AlertTriangle size={15} />
              <span>{fill(t('file.state.warnings'), { warnings: snapshot?.warnings.join(' · ') || t('file.state.partial') })}</span>
            </p>
          )}

          {phase === 'unavailable' && (
            <div className="filex__states">
              <h3>{t('file.state.unavailable')}</h3>
              <p>{inventoryTool?.availability.reason ?? t('file.state.unavailable')}</p>
            </div>
          )}

          {phase === 'failed' && (
            <div className="filex__states">
              <h3>{t('file.state.failed')}</h3>
              <p>{t('file.state.emptyHint')}</p>
              <button type="button" className="world-control" onClick={() => void load()}>{t('file.head.refresh')}</button>
            </div>
          )}

          {(phase === 'loading' || phase === 'idle') && !snapshot && (
            <div className="filex__states" aria-busy="true">
              <h3>{t('file.state.loading')}</h3>
              <p>{t('file.state.loadingHint')}</p>
            </div>
          )}

          {snapshot && phase === 'ready' && (
            <section className="filex__ledger" aria-label={t('file.ledger.label')}>
              <div className="filex__ledger-head">
                <span>{t('file.col.name')}</span>
                <span className="filex__col filex__col--folder">{t('file.col.folder')}</span>
                <span className="filex__col filex__col--type">{t('file.col.type')}</span>
                <span className="filex__col filex__col--age">{t('file.col.age')}</span>
                <span className="is-num">{t('file.col.size')}</span>
              </div>
              <div className="filex__rows" ref={rowsRef}>
                {drawn.map(record => (
                  <FileRow
                    key={record.uid}
                    record={record}
                    largest={snapshot.largestBytes}
                    active={record.path === activePath}
                    exposed={exposed.has(record.path)}
                    t={t}
                    locale={locale}
                    onOpen={pickRecord}
                  />
                ))}
                {!drawn.length && (
                  <p className="filex__noresult">{t('file.state.noResults')}</p>
                )}
              </div>
              {rows.length > drawn.length && <p className="filex__cap">{fill(t('file.results.capped'), { shown: formatCount(drawn.length, locale) })}</p>}
            </section>
          )}

          {snapshot && phase === 'ready' && !snapshot.records.length && (
            <div className="filex__states">
              <h3>{t('file.state.empty')}</h3>
              <p>{t('file.state.emptyHint')}</p>
            </div>
          )}
        </div>

        <Inspector
          record={activeRecord}
          snapshot={snapshot}
          hash={activeRecord ? hashes[activeRecord.path] ?? null : null}
          hashing={hashing}
          busy={hashing}
          bucket={bucketFilter}
          extension={extensionFilter}
          onBucket={value => { setBucketFilter(value); if (value) setExtensionFilter(null); }}
          onExtension={value => { setExtensionFilter(value); if (value) setBucketFilter(null); }}
          t={t}
          locale={locale}
          onAction={onInspectorAction}
          onClose={() => setActivePath(null)}
        />
      </div>

      <section className="filex__plan" aria-label={t('file.plan.title')}>
        <div className="filex__planhead">
          <div>
            <h3>{t('file.plan.title')}</h3>
            <p>{t('file.plan.hint')}</p>
          </div>
          <div className="filex__planactions">
            <button type="button" className="world-control filex__plan-preview" onClick={() => void preview()} disabled={planning || !organizeTool}>
              {planning ? t('file.plan.running') : t('file.plan.run')}
            </button>
            <button type="button" className="world-control" onClick={() => void inspectFolderEmpties()} disabled={foldersBusy || !foldersTool}>
              <FolderSearch size={14} />{foldersBusy ? t('file.folders.running') : t('file.folders.run')}
            </button>
          </div>
        </div>

        {planPhase === 'previewing' && !plan && (
          <div className="filex__states" aria-busy="true">
            <h3>{t('file.plan.running')}</h3>
            <p>{t('file.plan.hint')}</p>
          </div>
        )}

        {(planPhase === 'failed' || planPhase === 'idle') && !plan && (
          <p className="filex__planempty">{planPhase === 'failed' ? t('file.state.failed') : t('file.plan.idle')}</p>
        )}

        {plan && planPhase !== 'idle' && (
          <div className="filex__planbody">
            {plan.moves.length === 0 ? (
              <p className="filex__planempty">{t('file.plan.none')}</p>
            ) : (
              <>
                <div className="filex__plancounts">
                  <span className="filex__plancount filex__plancount--live">
                    <b>{formatCount(plan.planned, locale)}</b>
                    <span>{t('file.plan.planned')}</span>
                  </span>
                  <span className="filex__plancount">
                    <b>{formatBytes(plan.plannedBytes, locale)}</b>
                    <span>{t('file.plan.bytesLabel')}</span>
                  </span>
                  {plan.collisions > 0 && (
                    <span className="filex__plancount filex__plancount--warn">
                      <b>{formatCount(plan.collisions, locale)}</b>
                      <span>{t('file.plan.collisions')}</span>
                    </span>
                  )}
                  {plan.skipped > 0 && (
                    <span className="filex__plancount filex__plancount--warn">
                      <b>{formatCount(plan.skipped, locale)}</b>
                      <span>{t('file.plan.skipped')}</span>
                    </span>
                  )}
                  <span className="filex__planonly">{t('file.plan.previewOnly')}</span>
                </div>

                <h4 className="filex__flowhead">{t('file.plan.categories')}</h4>
                <div className="filex__flow">
                  {categories.map(group => {
                    const lane = categoryLabel(group.category, t);
                    return (
                    <div className="filex__lane" key={group.category}>
                      <div className="filex__lanehead">
                        <span className={`filex__lanedot ${typeClass(group.category)}`} aria-hidden="true" />
                        <h4>{lane}</h4>
                        <b>{formatCount(group.moves.length, locale)}</b>
                        <em>{formatBytes(group.bytes, locale)}</em>
                      </div>
                      <ul className="filex__lanemoves">
                        {group.moves.slice(0, 6).map(move => (
                          <li key={move.uid}>
                            <bdi className="filex__movename">{move.name}</bdi>
                            <span className="filex__moveto">{t('file.plan.to')} {lane}</span>
                          </li>
                        ))}
                        {group.moves.length > 6 && <li className="filex__more">{fill(t('file.plan.more'), { count: formatCount(group.moves.length - 6, locale) })}</li>}
                      </ul>
                    </div>
                    );
                  })}
                </div>

                {withheld.length > 0 && (
                  <div className="filex__withheld">
                    <h4>{t('file.plan.withheld')}</h4>
                    <ul>
                      {withheld.slice(0, 8).map(move => (
                        <li key={move.uid}>
                          <bdi>{move.name}</bdi>
                          <span>{t(`file.plan.reason.${move.withheld === 'destination-exists' ? 'destination-exists' : move.reason || 'not-planned'}`)}</span>
                        </li>
                      ))}
                      {withheld.length > 8 && <li className="filex__more">{fill(t('file.plan.more'), { count: formatCount(withheld.length - 8, locale) })}</li>}
                    </ul>
                  </div>
                )}

                <div className="filex__apply">
                  {!applyOutcome ? (
                    <>
                      <label className="filex__confirm">
                        <input type="checkbox" checked={confirmed} onChange={change => setConfirmed(change.target.checked)} />
                        <span>{fill(t('file.plan.confirm'), { count: formatCount(plan.planned, locale) })}</span>
                      </label>
                      <p className="filex__confirmhint">{t('file.plan.confirmHint')}</p>
                      <button type="button" className="world-control world-control--primary" onClick={() => void apply()} disabled={!confirmed || applying || !applyTool}>
                        {applying ? t('file.plan.applying') : t('file.plan.apply')}
                      </button>
                    </>
                  ) : (
                    <div className="filex__outcome" role="status">
                      <b>{fill(t('file.plan.applied'), { moved: formatCount(applyOutcome.moved, locale) })}</b>
                      {applyOutcome.failed > 0 && <em className="filex__fail">{fill(t('file.plan.failed'), { count: formatCount(applyOutcome.failed, locale) })}</em>}
                      <span>{fill(t('file.plan.verification'), { status: applyOutcome.verification })}</span>
                      {journalId && <span className="filex__journal">{fill(t('file.plan.journal'), { id: journalId.slice(0, 8) })}</span>}
                      {journalId && (
                        <button type="button" className="world-control" onClick={() => void undo()} disabled={undoing}>
                          <Undo2 size={14} />{undoing ? t('file.plan.undoRunning') : t('file.plan.undo')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {emptyFolders && (
          <div className="filex__folders">
            <h4>{t('file.folders.title')}</h4>
            <p>{fill(t('file.folders.result'), { empty: formatCount(emptyFolders.empty, locale), scanned: formatCount(emptyFolders.scanned, locale) })}</p>
            {emptyFolders.inaccessible > 0 && <p className="filex__warnline">{fill(t('file.folders.inaccessible'), { count: formatCount(emptyFolders.inaccessible, locale) })}</p>}
            {emptyFolders.paths.length > 0 ? (
              <ul className="filex__folderlist">
                {emptyFolders.paths.map(path => <li key={path}><FolderOpen size={13} /><bdi>{path}</bdi></li>)}
              </ul>
            ) : (
              <p className="filex__planempty">{t('file.folders.none')}</p>
            )}
            <p className="filex__hint">{t('file.folders.note')}</p>
          </div>
        )}
      </section>

      {snapshot && snapshot.exposure.count > 0 && (
        <section className="filex__exposure">
          <div className="filex__exposurehead">
            <ShieldAlert size={16} />
            <h3>{t('file.exposure.title')}</h3>
            <p>{t('file.exposure.hint')}</p>
            <b>{fill(t('file.exposure.count'), { count: formatCount(snapshot.exposure.count, locale), bytes: formatBytes(snapshot.exposure.bytes, locale) })}</b>
          </div>
          <ul>
            {snapshot.exposure.findings.slice(0, 8).map(finding => (
              <li key={finding.path}>
                <bdi>{finding.name}</bdi>
                <span>{t(`file.exposure.category.${finding.category}`)}</span>
                <em>{formatBytes(finding.size, locale)}</em>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ServicesRail
        world="files"
        titleKey="file.services.title"
        hintKey="file.services.hint"
        liveKey="file.services.live"
        openKey="file.services.openTool"
        invoke={{
          'file-downloads-inventory': () => { void load(); },
          'file-organize-preview': () => { void preview(); },
          'file-empty-folders': () => { void inspectFolderEmpties(); }
        }}
        t={t}
        locale={locale}
      />

      <footer className="filex__dock" aria-label={locale === 'ar' ? 'حالة التحديد والخطوة التالية' : 'Selection and next step'}>
        <div className="filex__dockpick">
          <span className={activeRecord ? 'filex__dockmark is-on' : 'filex__dockmark'} aria-hidden="true">{activeRecord ? <Check size={13} /> : null}</span>
          <div className="filex__dockwho">
            <bdi>{activeRecord ? activeRecord.name : (locale === 'ar' ? 'لم يُفتح ملف بعد' : 'No entry open yet')}</bdi>
            <small>
              {activeRecord
                ? [activeRecord.type, activeRecord.sizeKnown ? formatBytes(activeRecord.size, locale) : (locale === 'ar' ? 'بحجم غير مقاس' : 'size unmeasured'), activeRecord.folder || (locale === 'ar' ? 'الجذر' : 'root')].join(' · ')
                : (locale === 'ar' ? 'اختر صفاً من السجل ليفحصه المراقب' : 'Pick a row in the register to open it in the inspector')}
            </small>
          </div>
        </div>
        <p className="filex__dockline">
          {snapshot
            ? fill(locale === 'ar' ? '{count} عنصر مقاس في هذا المجلد · {plan}' : '{count} measured entries in this folder · {plan}', {
              count: formatCount(snapshot.records.length, locale),
              plan: planPhase === 'previewing' ? (locale === 'ar' ? 'تُبنى الخطة الآن' : 'plan is being built')
                : plan ? (locale === 'ar' ? 'خطة جاهزة للمراجعة' : 'plan ready to review')
                  : (locale === 'ar' ? 'لا خطة بعد' : 'no plan yet')
            })
            : (locale === 'ar' ? 'لم تُقرأ قائمة التنزيلات بعد' : 'The Downloads listing has not been read yet')}
        </p>
        <div className="filex__dockactions">
          <button type="button" className="world-control" onClick={() => setPage('studio')}>
            {locale === 'ar' ? 'استوديو التنظيم' : 'Organization Studio'}
          </button>
          <button type="button" className="world-control world-control--primary filex__dockreview" onClick={reviewPlan} disabled={planning || !organizeTool}>
            {planning ? (locale === 'ar' ? 'تُبنى الخطة…' : 'Building plan…') : (locale === 'ar' ? 'مراجعة خطة التنظيم' : 'Review organization plan')}
            <ArrowRight size={15} />
          </button>
        </div>
      </footer>
    </div>
  );
}
