import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  AlertTriangle, FolderOpen, FolderSearch, HardDrive, Hash, Info,
  Layers, Repeat, Thermometer, Trash2
} from 'lucide-react';
import { ServicesRail } from '../components/world/ServicesRail';
import {
  buildAtlas, buildDuplicateScan, buildEmptyFolderScan, buildHeavyScan,
  overlapBetween, parentFolder, PRESSURE_TICKS, readAgreement, scanRoots,
  type AtlasSnapshot, type CompositionRung, type DuplicateRow, type DuplicateScan,
  type EmptyFolderScan, type HeavyRow, type HeavyScan, type PhysicalBay, type Pressure,
  type VolumeBay
} from '../lib/storage-atlas';
import { fill, formatBytes, formatCount, formatDateTime, formatPercent, formatTimeOfDay, labeledBy, shortHash } from '../lib/format';
import { canRunTool, isActivePhase, resolveTool } from '../lib/guards';
import { useStore } from '../state/store';
import type { Locale } from '../locales';

/**
 * The Storage world: the Volume Atlas.
 *
 * Applications answers "what is installed" and Files answers "what did I leave
 * in Downloads". Storage answers a third question — "how much room does this
 * machine have, which volume is running out, and what is holding the space
 * inside a folder I choose" — so it is built on rails rather than rows: a rack
 * of the real Windows volumes drawn to scale, the physical disk behind them, and
 * three independent directory walks whose numbers are deliberately never added
 * together.
 *
 * Nothing here deletes, moves or cleans. The two walks that could recover space
 * report what would be recoverable after a review this product does not perform
 * for you, and the third one says out loud that an empty folder frees no bytes.
 */

type Phase = 'idle' | 'loading' | 'ready' | 'failed' | 'unavailable';
type LaneId = 'heavy' | 'duplicates' | 'empties';
type LanePhase = 'idle' | 'running' | 'ready' | 'partial' | 'failed' | 'unavailable';
type LadderKind = 'types' | 'ages' | 'folders' | 'extensions';
type Selection =
  | { kind: 'file'; path: string }
  | { kind: 'set'; key: string }
  | { kind: 'folder'; path: string }
  | null;

type Translate = (key: string) => string;

/** Which engine feeds which lane, and which engine result belongs to which lane. */
const LANE_TOOLS: Record<LaneId, string> = {
  heavy: 'large-files',
  duplicates: 'duplicate-files',
  empties: 'empty-folders'
};
const TOOL_LANES: Record<string, LaneId> = {
  'large-files': 'heavy',
  'duplicate-files': 'duplicates',
  'empty-folders': 'empties'
};
const LANES: LaneId[] = ['heavy', 'duplicates', 'empties'];

/**
 * The engine's kind name, in the reader's language.
 *
 * `large-files` labels each file with a group from the shared classifier —
 * "Databases", "Archives" — and those words are printed in three places at
 * once: a ladder rung, a ledger cell, and the inspector's Kind row. An
 * unrecognised group falls back to the engine's own word rather than to the
 * key, because the key is the folder name the classifier would use anyway.
 */
function kindLabel(type: string, t: Translate): string {
  return labeledBy(t, `store.kind.${type}`, type);
}

/** The result cap only bounds what is shown; the engine's own scan budget bounds the work. */
const LANE_LIMITS: Record<LaneId, number> = { heavy: 400, duplicates: 120, empties: 80 };

const PRESSURE_CLASS: Record<Pressure, string> = {
  critical: 'atlas--critical',
  high: 'atlas--high',
  medium: 'atlas--medium',
  healthy: 'atlas--healthy',
  unknown: 'atlas--unknown'
};

/** A kind name is a CSS fragment once, here, the same way the Files bench does it. */
function kindClass(value: string): string {
  return `atlas--kind-${value.replace(/[^A-Za-z]/g, '') || 'Noextension'}`;
}

/** The engine's own risk label, and the only risk it can actually see. */
function riskLabel(risk: string, t: Translate): string {
  return risk === 'high' ? t('store.risk.high') : t('store.risk.normal');
}

/* ---------------------------------------------------------------- volume bay */

function AtlasBay({ volume, selected, walking, canWalk, onSelect, onWalk, t, locale }: {
  volume: VolumeBay;
  selected: boolean;
  walking: boolean;
  canWalk: boolean;
  onSelect: () => void;
  onWalk: () => void;
  t: Translate;
  locale: Locale;
}) {
  const measured = volume.sizeBytes != null && volume.usedBytes != null && volume.freeBytes != null;
  // A slice narrower than this cannot hold its own label, so that slice drops its
  // text and the bay's readout column carries the numbers. The judgement is made
  // per slice: a volume that is 98% full has a bar most of the rail wide and a
  // sliver of free space at the end, and hiding both labels because one of them
  // is tight throws away the reading the bar exists to give.
  const usedTight = measured && (volume.usedPercent ?? 0) < 14;
  const freeTight = measured && (volume.freePercent ?? 0) < 14;
  return (
    <div className={`atlas__bay ${PRESSURE_CLASS[volume.pressure]}`} data-selected={selected ? 'true' : undefined}>
      <button type="button" className="atlas__letter" onClick={onSelect} aria-pressed={selected} title={`${volume.id} — ${volume.label || t('store.bay.unnamed')}`}>
        <bdi>{volume.letter}</bdi>
      </button>

      <div className="atlas__baybody">
        <div className="atlas__bayident">
          <strong>{volume.label || t('store.bay.unnamed')}</strong>
          {volume.fileSystem && <code>{volume.fileSystem}</code>}
          {volume.serial && <span>{t('store.bay.serial')} <bdi>{volume.serial}</bdi></span>}
          {measured && (
            <span>
              {formatBytes(volume.sizeBytes, locale)} {t('store.bay.of')} {formatBytes(volume.usedBytes, locale)} {t('store.bay.used')}
            </span>
          )}
        </div>

        {measured ? (
          <div
            className="atlas__rail"
            role="img"
            aria-label={fill(t('store.bay.railLabel'), {
              id: volume.id,
              used: formatPercent(volume.usedPercent, locale),
              free: formatPercent(volume.freePercent, locale),
              size: formatBytes(volume.sizeBytes, locale)
            })}
          >
            <span className={`atlas__used${usedTight ? ' atlas__used--tight' : ''}`} style={{ flexGrow: volume.usedPercent ?? 0 }}>
              <span>{t('store.bay.used')} {formatPercent(volume.usedPercent, locale)}</span>
            </span>
            <span className={`atlas__free${freeTight ? ' atlas__free--tight' : ''}`} style={{ flexGrow: volume.freePercent ?? 0 }}>
              <span>{formatBytes(volume.freeBytes, locale)} {t('store.bay.free')}</span>
            </span>
            {PRESSURE_TICKS.map(tick => (
              // The tick sits where the *free* share reaches the engine's own
              // threshold, so the marks are the OS's numbers, not this view's.
              <span className="atlas__tick" key={tick.freePercent} style={{ insetInlineStart: `${100 - tick.freePercent}%` }}>
                <i>{tick.freePercent}%</i>
              </span>
            ))}
          </div>
        ) : (
          <p className="atlas__note">{t('store.bay.noCapacity')}</p>
        )}
      </div>

      <div className="atlas__bayread">
        <b>{measured ? formatBytes(volume.freeBytes, locale) : '—'}</b>
        <small>{t('store.bay.free')} {measured ? formatPercent(volume.freePercent, locale) : '—'}</small>
        <em>{t(`store.pressure.${volume.pressure}`)}</em>
      </div>

      <div className="atlas__bayactions">
        <button type="button" className="world-control" onClick={onWalk} disabled={walking || !canWalk}>
          <FolderSearch size={14} />
          {walking ? t('store.deck.running') : t('store.bay.walk')}
        </button>
        <span className="atlas__note">{volume.pressureBasis ? fill(t('store.bay.basis'), { basis: volume.pressureBasis }) : t('store.bay.walkHint')}</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- metal */

function PhysicalDisk({ disk, t, locale }: { disk: PhysicalBay; t: Translate; locale: Locale }) {
  return (
    <div className="atlas__disk">
      <b>{disk.friendlyName}</b>
      <div>
        {disk.mediaType && <span className="atlas__media">{disk.mediaType}</span>}
        {disk.busType && <span className="atlas__media">{disk.busType}</span>}
        {disk.sizeBytes != null && <span className="atlas__media">{formatBytes(disk.sizeBytes, locale)}</span>}
        {disk.id && <span className="atlas__media">{disk.id}</span>}
      </div>
      <div>
        <span>{t('store.metal.health')} <b>{disk.healthStatus || '—'}</b></span>
        <span>{t('store.metal.bus')} <b>{disk.busType || '—'}</b></span>
        {disk.operationalStatus && <span>{t('store.metal.media')} <b>{disk.operationalStatus}</b></span>}
        <span><Thermometer size={11} /> {t('store.metal.temperature')}: <b>{t('store.metal.temperatureAbsent')}</b></span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- ladders */

function Ladder({ title, rungs, hueFor, labelFor, activeKey, onPick, t, locale }: {
  title: string;
  rungs: CompositionRung[];
  hueFor: (rung: CompositionRung) => string | null;
  /** How a rung's key becomes a word the reader can use. The kinds ladder
      translates; the folders and extensions ladders print what Windows named,
      because a folder called ".trayer" is not a term with a translation. */
  labelFor: (key: string) => string;
  activeKey: string | null;
  onPick: (key: string) => void;
  t: Translate;
  locale: Locale;
}) {
  const shown = rungs.slice(0, 6);
  const top = shown.length ? shown[0].bytes : 0;
  if (!shown.length) return null;
  return (
    <div className="atlas__ladder">
      <h4>{title}</h4>
      <ol>
        {shown.map(rung => {
          const hue = hueFor(rung);
          return (
            <li key={rung.key}>
              <button
                type="button"
                className={`atlas__rung${hue ? ` ${hue}` : ''}`}
                aria-pressed={activeKey === rung.key}
                onClick={() => onPick(rung.key)}
                // Width is the share of the walked bytes, never of the disk.
                style={{ '--at-share': `${top ? Math.max(2, (rung.bytes / top) * 100) : 0}%` } as CSSProperties}
                title={formatPercent(rung.percent, locale)}
              >
                <i className="atlas__runfill" aria-hidden="true" />
                <span>{labelFor(rung.key)}</span>
                <small>{fill(t('store.ladder.files'), { count: formatCount(rung.files, locale) })}</small>
                <b>{formatBytes(rung.bytes, locale)}</b>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------------------------------------------------------------------- lane */

interface LaneRow { key: string; label: string; meta: string; hue?: string | null }

function Lane({ id, icon, title, note, phase, figure, figureUnit, rows, busy, onRun, t }: {
  id: LaneId;
  icon: ReactNode;
  title: string;
  note: string;
  phase: LanePhase;
  figure: string;
  figureUnit: string;
  rows: LaneRow[];
  busy: boolean;
  onRun: () => void;
  t: Translate;
}) {
  return (
    <div className="atlas__lane" data-state={phase} data-lane={id}>
      <div className="atlas__lanehead">
        {icon}
        <h4>{title}</h4>
        <span className="atlas__lanepill">{t(`store.state.${phase}`)}</span>
      </div>
      <div className="atlas__lanefigure">
        <b>{figure}</b>
        <span>{figureUnit}</span>
      </div>
      {/* The note is the walk's provenance, so a lane that has not walked has
          nothing to provenance. Rendering an empty paragraph here put a gap
          between the figure and the rows for no reason. */}
      {note && <p className="atlas__lanesub">{note}</p>}
      {rows.length > 0 && (
        <ul className="atlas__lanerows">
          {rows.map(row => (
            <li key={row.key} className={row.hue || undefined}>
              <bdi>{row.label}</bdi>
              <em>{row.meta}</em>
            </li>
          ))}
        </ul>
      )}
      <div className="atlas__lanefoot">
        <button type="button" className="world-control" onClick={onRun} disabled={busy || phase === 'unavailable'}>
          {busy ? t('store.deck.running') : phase === 'idle' || phase === 'unavailable' ? t('store.deck.run') : t('store.deck.rerun')}
        </button>
        {id === 'empties' && <span className="atlas__note">{t('store.deck.emptiesNote')}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ read board */

/** One lane's answer, reduced to what the idle inspector can honestly report. */
interface LaneRead {
  id: LaneId;
  root: string | null;
  collectedAt: string | null;
  figure: string;
  unit: string;
}

/**
 * The agreement line, in the shape its count needs.
 *
 * `readAgreement` answers a math question — how many walks, how many roots — and
 * English has three different sentences for the answers, not one with a number
 * slotted into it. A lone read is not a unanimous set of one: there is nothing
 * next to it to combine, and saying so is the honest report. Two or more reads on
 * one root may be added; reads across roots may not.
 *
 * The split belongs to copy, so it stays beside the panel that says it and out of
 * the atlas rule, which should keep counting.
 */
function agreementLine(agreement: { walked: number; roots: string[] }, t: Translate, locale: Locale): string {
  if (agreement.walked === 0) return t('store.read.none');
  if (agreement.roots.length > 1) {
    return fill(t('store.read.disagree'), {
      reads: formatCount(agreement.walked, locale),
      roots: formatCount(agreement.roots.length, locale)
    });
  }
  if (agreement.walked === 1) return t('store.read.agreeOne');
  return fill(t('store.read.agree'), { count: formatCount(agreement.walked, locale) });
}

/**
 * The inspector while nothing is selected.
 *
 * An idle column has two honest jobs: say what it is waiting for, and say what
 * the read already found. Storage carries a third that no other world does — the
 * three walks can be answered against three different folders, and a reader who
 * adds "recoverable" to "heavy" across two of them gets a number that was never
 * a measurement of anything. So the board names the root each read walked, and
 * says out loud whether those roots agree.
 */
function ReadBoard({ volume, reads, phases, tab, canWalk, walking, onTab, onWalkVolume, onReveal, t, locale }: {
  volume: VolumeBay | null;
  reads: LaneRead[];
  phases: Record<LaneId, LanePhase>;
  tab: LaneId;
  canWalk: boolean;
  walking: boolean;
  onTab: (id: LaneId) => void;
  onWalkVolume: (volume: VolumeBay) => void;
  onReveal: (path: string, isFolder: boolean) => void;
  t: Translate;
  locale: Locale;
}) {
  const agreement = readAgreement(reads);
  return (
    <div className="atlas__read">
      <p className="atlas__readlead">{t('store.inspector.empty')}</p>

      <h4>{t('store.read.standing')}</h4>
      {volume ? (
        <div className="atlas__readvol">
          <div className="atlas__subject">
            <b><bdi>{volume.id}</bdi> · {volume.label || t('store.bay.unnamed')}</b>
            <span className="atlas__rowwhere">
              {volume.fileSystem || t('store.bay.noCapacity')}
              {volume.serial ? ` · ${t('store.bay.serial')} ` : ''}
              {volume.serial && <bdi>{volume.serial}</bdi>}
            </span>
          </div>
          <dl className="atlas__attrs">
            <div>
              <dt>{t('store.bay.used')}</dt>
              <dd>{volume.usedPercent != null ? formatPercent(volume.usedPercent, locale) : '—'}</dd>
            </div>
            <div>
              <dt>{t('store.bay.free')}</dt>
              <dd>{volume.freeBytes != null ? formatBytes(volume.freeBytes, locale) : '—'}</dd>
            </div>
            <div>
              <dt>{t('store.bay.of')}</dt>
              <dd>{volume.sizeBytes != null ? formatBytes(volume.sizeBytes, locale) : '—'}</dd>
            </div>
          </dl>
          <p className="atlas__readpressure">
            <span className={`atlas__readpill ${PRESSURE_CLASS[volume.pressure]}`}>{t(`store.pressure.${volume.pressure}`)}</span>
            {volume.pressureBasis
              ? <span className="atlas__note">{fill(t('store.bay.basis'), { basis: volume.pressureBasis })}</span>
              : <span className="atlas__note">{t('store.bay.walkHint')}</span>}
          </p>
          <div className="atlas__actions">
            <button type="button" className="world-control" onClick={() => onWalkVolume(volume)} disabled={walking || !canWalk || !volume.scanRoot}>
              <FolderSearch size={14} />
              {walking ? t('store.deck.running') : t('store.bay.walk')}
            </button>
            {volume.scanRoot && (
              <button type="button" className="world-control" onClick={() => onReveal(volume.scanRoot as string, true)}>
                <FolderOpen size={14} />{t('store.action.reveal')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="atlas__note">{t('store.read.noVolume')}</p>
      )}

      <h4>{t('store.read.reads')}</h4>
      <div className="atlas__readlanes">
        {reads.map(read => {
          const phase = phases[read.id];
          return (
            <button
              key={read.id}
              type="button"
              className="atlas__readlane"
              data-state={phase}
              data-read={read.root ? 'true' : 'false'}
              aria-pressed={tab === read.id}
              onClick={() => onTab(read.id)}
              title={t('store.read.open')}
            >
              <span className="atlas__readlanehead">
                <b>{t(`store.deck.${read.id}`)}</b>
                <em className="atlas__lanepill">{t(`store.state.${phase}`)}</em>
              </span>
              <span className="atlas__readlanepath">
                {read.root ? <bdi>{read.root}</bdi> : t('store.read.notrun')}
              </span>
              <span className="atlas__readlanefig">
                {read.root ? <><b>{read.figure}</b><span>{read.unit}</span></> : <b>—</b>}
                {read.root && read.collectedAt && <small>{fill(t('store.deck.at'), { time: formatTimeOfDay(read.collectedAt, locale) })}</small>}
              </span>
            </button>
          );
        })}
      </div>

      <p className={`atlas__readfoot${agreement.roots.length > 1 ? ' atlas__readfoot--split' : ''}`}>
        {agreement.roots.length > 1 ? <AlertTriangle size={13} /> : <Info size={13} />}
        <span>{agreementLine(agreement, t, locale)}</span>
      </p>
      <p className="atlas__note">{t('store.inspector.noAction')}</p>
    </div>
  );
}

/* --------------------------------------------------------------------- page */

export default function StoragePage() {
  const { t, locale, tools, runById, result, event, setNotice, setPage } = useStore();

  const [atlas, setAtlas] = useState<AtlasSnapshot | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedVolume, setSelectedVolume] = useState<string | null>(null);
  const [root, setRoot] = useState<string | null>(null);
  const [heavy, setHeavy] = useState<HeavyScan | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateScan | null>(null);
  const [empties, setEmpties] = useState<EmptyFolderScan | null>(null);
  const [lanes, setLanes] = useState<Record<LaneId, LanePhase>>({ heavy: 'idle', duplicates: 'idle', empties: 'idle' });
  const [tab, setTab] = useState<LaneId>('heavy');
  const [ladder, setLadder] = useState<{ kind: LadderKind; key: string } | null>(null);
  const [selected, setSelected] = useState<Selection>(null);
  const [hashes, setHashes] = useState<Record<string, { digest: string; algorithm: string; reliable: boolean }>>({});
  const volumesStarted = useRef(false);

  const diskTool = useMemo(() => resolveTool(tools, 'disk-overview'), [tools]);
  const hashTool = useMemo(() => resolveTool(tools, 'file-hash'), [tools]);
  // Walking a volume from the read board starts the heavy lane, so the button is
  // gated on that engine rather than on the disk table that named the volume.
  const largeFilesTool = useMemo(() => resolveTool(tools, 'large-files'), [tools]);

  const volumesBusy = isActivePhase(event?.phase) && event?.toolId === 'disk-overview';
  const hashing = isActivePhase(event?.phase) && event?.toolId === 'file-hash';
  const laneBusy = useCallback((id: LaneId) => isActivePhase(event?.phase) && event?.toolId === LANE_TOOLS[id], [event?.phase, event?.toolId]);
  const anyLaneBusy = LANES.some(laneBusy);

  const setLane = useCallback((id: LaneId, value: LanePhase) => {
    setLanes(current => ({ ...current, [id]: value }));
  }, []);

  const loadVolumes = useCallback(async () => {
    if (!diskTool || !canRunTool(diskTool)) { setPhase('unavailable'); return; }
    setPhase('loading');
    const completed = await runById('disk-overview', {}, true);
    if (!completed) setPhase('failed');
    // The snapshot itself is absorbed by the result effect below, so a read that
    // starts anywhere — this button, the service rail, the command palette —
    // lands the same way.
  }, [diskTool, runById]);

  useEffect(() => {
    if (volumesStarted.current || !tools.length) return;
    volumesStarted.current = true;
    void loadVolumes();
  }, [tools.length, loadVolumes]);

  /**
   * One walk, started from here.
   *
   * `walk` asks the engine and tracks the lane's state; the payload is mapped by
   * the effect below, which is also the path a walk started elsewhere takes. The
   * two are separated on purpose: a result that both arrives and re-triggers a
   * walk is an endless scan.
   */
  const walk = useCallback(async (id: LaneId, folder?: string | null) => {
    const tool = resolveTool(tools, LANE_TOOLS[id]);
    if (!tool || !canRunTool(tool)) { setLane(id, 'unavailable'); return; }
    setLane(id, 'running');
    const target = folder ?? root ?? undefined;
    const inputs: Record<string, unknown> = { limit: LANE_LIMITS[id] };
    if (target) inputs.folder = target;
    const completed = await runById(LANE_TOOLS[id], inputs, true);
    if (!completed) setLane(id, 'failed');
  }, [tools, root, runById, setLane]);

  // Absorb whatever the engines answered, whoever asked for it.
  useEffect(() => {
    if (!result) return;
    if (result.toolId === 'disk-overview') {
      const built = buildAtlas(result);
      if (!built) { setPhase('failed'); return; }
      setAtlas(built);
      setPhase(result.success === false ? 'failed' : built.volumes.length ? 'ready' : 'failed');
      setSelectedVolume(current => current
        ?? built.volumes.find(volume => volume.pressure === 'critical' || volume.pressure === 'high')?.id
        ?? built.volumes[0]?.id
        ?? null);
      return;
    }
    if (result.toolId === 'file-hash') {
      const summary = (result.summary || {}) as Record<string, unknown>;
      const file = typeof summary.file === 'string' ? summary.file : '';
      const first = result.items?.[0] as Record<string, unknown> | undefined;
      const digest = first && typeof first.digest === 'string' ? first.digest : '';
      if (file && digest) {
        setHashes(current => ({ ...current, [file]: { digest, algorithm: String(summary.algorithm || 'sha256'), reliable: summary.digestReliable !== false } }));
      }
      return;
    }
    const id = TOOL_LANES[result.toolId];
    if (!id) return;
    setTab(id);
    if (id === 'heavy') {
      const built = buildHeavyScan(result);
      if (!built) { setLane('heavy', 'failed'); return; }
      setHeavy(built);
      if (built.root) setRoot(built.root);
      setLane('heavy', built.success ? (built.partial ? 'partial' : 'ready') : 'failed');
      return;
    }
    if (id === 'duplicates') {
      const built = buildDuplicateScan(result);
      if (!built) { setLane('duplicates', 'failed'); return; }
      setDuplicates(built);
      if (built.root) setRoot(built.root);
      setLane('duplicates', built.success ? (built.partial ? 'partial' : 'ready') : 'failed');
      return;
    }
    const built = buildEmptyFolderScan(result);
    if (!built) { setLane('empties', 'failed'); return; }
    setEmpties(built);
    if (built.root) setRoot(built.root);
    setLane('empties', built.success ? 'ready' : 'failed');
  }, [result, setLane]);

  const chooseFolder = useCallback(async () => {
    const folder = await window.knoux.chooseFolder();
    if (!folder) return;
    setRoot(folder);
    setNotice(fill(t('store.notice.picked'), { folder }));
  }, [setNotice, t]);

  const walkVolume = useCallback((volume: VolumeBay) => {
    setSelectedVolume(volume.id);
    // A volume whose id is not a drive letter has no root this world can walk,
    // so selecting it stays a reading of capacity and never starts a scan of a
    // path the engine did not report.
    const target = volume.scanRoot;
    if (!target) return;
    setRoot(target);
    void walk('heavy', target);
  }, [walk]);

  const hashFile = useCallback(async (filePath: string) => {
    if (!hashTool || !canRunTool(hashTool)) { setNotice(t('store.state.unavailable')); return; }
    await runById('file-hash', { filePath, algorithm: 'sha256' }, true);
  }, [hashTool, runById, setNotice, t]);

  const reveal = useCallback((target: string, isDirectory: boolean) => {
    // Explorer reveals the containing folder for a file, and opens a folder.
    const directory = isDirectory ? target : target.replace(/\//g, '\\').replace(/\\[^\\]*$/, '');
    // `shell.openPath` resolves to an empty string when it worked and to its own
    // message when it did not, so text is the failure and silence is the success.
    void window.knoux.openPath(directory).then(outcome => {
      if (!outcome) return;
      setNotice(t('store.notice.revealFailed'));
    }).catch(() => setNotice(t('store.notice.revealFailed')));
  }, [setNotice, t]);

  /* ------------------------------------------------------------- derived */
  const overlap = useMemo(() => overlapBetween(heavy, duplicates), [heavy, duplicates]);
  const roots = useMemo(() => scanRoots(atlas), [atlas]);
  const heavyRows = useMemo<HeavyRow[]>(() => {
    if (!heavy) return [];
    if (!ladder) return heavy.rows;
    if (ladder.kind === 'folders') {
      // The ladder's folders are the walk's own buckets, so the filter matches
      // the bucket rather than a substring of the path: "Downloads" must not
      // select a "Downloads" folder three levels deep inside something else.
      const folder = ladder.key.toLowerCase();
      return heavy.rows.filter(row => row.folderBucket.toLowerCase() === folder);
    }
    const field = ladder.kind === 'types' ? 'type' : ladder.kind === 'ages' ? 'ageBucket' : 'extension';
    const wanted = ladder.key.toLowerCase();
    return heavy.rows.filter(row => String(row[field]).toLowerCase() === wanted);
  }, [heavy, ladder]);
  const largestHeavy = heavyRows.length ? Math.max(1, heavyRows[0].size) : 1;
  const selectedFile = selected?.kind === 'file' ? heavy?.rows.find(row => row.path === selected.path) ?? null : null;
  const selectedSet = selected?.kind === 'set' ? duplicates?.groups.find(group => group.key === selected.key) ?? null : null;
  // A folder pick is a record only while the empties read still lists that path.
  // A walk over a different root replaces the paths, and a column that answers a
  // stale pick with blank space reads as a crash rather than as a finding moved.
  const selectedFolder = selected?.kind === 'folder' && empties?.paths.includes(selected.path)
    ? { path: selected.path }
    : null;
  // One predicate decides whether the column shows a record or the read board:
  // every kind of pick goes through the same "does the read still carry it" test
  // above, so nothing can leave the inspector holding only a heading.
  const showReadBoard = !selectedFile && !selectedSet && !selectedFolder;
  // Pulled out so the inspector's two keeper actions both see one narrowed
  // value: a path the engine did not report stays absent from the DOM rather
  // than becoming a button that would act on `null`.
  const keeperPath = selectedSet?.keeperPath ?? null;
  // The folder record names the folder above the pick, because a bare leaf name —
  // "New folder", "Temp" — is not a location. A drive root has no parent, and the
  // record then drops the line instead of rendering an empty value that reads as
  // a missing read.
  const selectedFolderParent = selectedFolder ? parentFolder(selectedFolder.path) : null;
  const maxReclaim = duplicates?.groups.length
    ? Math.max(1, ...duplicates.groups.map(group => group.reclaimableBytes))
    : 1;
  const walkWarnings = useMemo(
    () => [...(heavy?.warnings || []), ...(duplicates?.warnings || []), ...(atlas?.warnings || [])],
    [heavy, duplicates, atlas]
  );

  const heavyLaneRows: LaneRow[] = useMemo(() => (heavy ? heavy.rows.slice(0, 4).map(row => ({
    key: row.path,
    label: row.name,
    meta: formatBytes(row.size, locale),
    hue: kindClass(row.type)
  })) : []), [heavy, locale]);
  const duplicateLaneRows: LaneRow[] = useMemo(() => (duplicates ? duplicates.groups.slice(0, 4).map(group => ({
    key: group.key,
    label: `${formatCount(group.count, locale)} × ${shortHash(group.hash)}`,
    meta: formatBytes(group.reclaimableBytes, locale),
    hue: group.reclaimableBytes === 0 ? 'atlas--unknown' : group.risk === 'high' ? 'atlas--high' : 'atlas--healthy'
  })) : []), [duplicates, locale]);
  const emptyLaneRows: LaneRow[] = useMemo(() => (empties ? empties.paths.slice(0, 4).map(entry => ({
    key: entry,
    label: entry.split(/[\\/]/).pop() || entry,
    meta: formatBytes(0, locale)
  })) : []), [empties, locale]);

  const ledgerCount = tab === 'heavy' ? heavyRows.length : tab === 'duplicates' ? (duplicates?.groups.length ?? 0) : (empties?.paths.length ?? 0);

  // What the idle inspector reports instead of an empty card: the volume the
  // reader is standing on, and one line per walk that has answered — each with
  // the root it walked, because three lanes walked against three folders are
  // three separate measurements rather than one story.
  const activeVolume = useMemo(
    () => atlas?.volumes.find(volume => volume.id === selectedVolume) ?? null,
    [atlas, selectedVolume]
  );
  const laneReads = useMemo<LaneRead[]>(() => [
    {
      id: 'heavy',
      root: heavy?.root ?? null,
      collectedAt: heavy?.collectedAt ?? null,
      figure: heavy ? formatBytes(heavy.totalMatchingBytes, locale) : '—',
      unit: heavy ? fill(t('store.deck.matching'), { count: formatCount(heavy.matchingFiles, locale) }) : '—'
    },
    {
      id: 'duplicates',
      root: duplicates?.root ?? null,
      collectedAt: duplicates?.collectedAt ?? null,
      figure: duplicates ? formatBytes(duplicates.reclaimableBytes, locale) : '—',
      unit: duplicates ? fill(t('store.deck.groups'), { count: formatCount(duplicates.groups.length, locale) }) : '—'
    },
    {
      id: 'empties',
      root: empties?.root ?? null,
      collectedAt: empties?.collectedAt ?? null,
      figure: empties ? formatCount(empties.empty, locale) : '—',
      unit: empties ? fill(t('store.ledger.folderscanned'), { count: formatCount(empties.scanned, locale) }) : '—'
    }
  ], [heavy, duplicates, empties, locale, t]);

  return (
    <div className="world atlas" data-world="storage">
      {/* -- Head: what the volume table actually said ------------------------- */}
      <section className="world-head">
        <div className="world-head__row">
          <div className="world-head__identity">
            <span className="world-tile"><HardDrive size={22} /></span>
            <div>
              <h2 className="world-head__title">{t('store.head.title')}</h2>
              <p className="world-head__subtitle">{t('store.head.subtitle')}</p>
            </div>
          </div>
          <div className="world-head__readout">
            {atlas && (
              <span className="world-head__stamp">
                {fill(t('store.head.readAt'), { time: formatDateTime(atlas.collectedAt, locale) })}
                {' · '}
                {fill(t('store.head.providers'), { volume: atlas.volumeProvider || '—', physical: atlas.physicalProvider || '—' })}
              </span>
            )}
            <button type="button" className="world-control world-control--primary" onClick={() => void loadVolumes()} disabled={volumesBusy || phase === 'unavailable'}>
              {volumesBusy ? t('store.head.reading') : t('store.head.read')}
            </button>
          </div>
        </div>

        {atlas && (
          <div className="world-metrics">
            <div className="world-metric world-metric--accent">
              <b>{formatCount(atlas.totals.volumes, locale)}</b>
              <span>{t('store.metric.volumes')}</span>
              <i>{t('store.metric.volumesNote')}</i>
            </div>
            <div className="world-metric">
              <b>{formatBytes(atlas.totals.capacityBytes, locale)}</b>
              <span>{t('store.metric.capacity')}</span>
              <i>{atlas.totals.unmeasured ? fill(t('store.metric.unmeasured'), { count: formatCount(atlas.totals.unmeasured, locale) }) : t('store.metric.capacityNote')}</i>
            </div>
            <div className="world-metric">
              <b>{formatBytes(atlas.totals.freeBytes, locale)}</b>
              <span>{t('store.metric.free')}</span>
              <i>{t('store.metric.freeNote')}</i>
            </div>
            <div className={`world-metric ${atlas.totals.pressured ? 'world-metric--warn' : ''}`}>
              <b>{formatCount(atlas.totals.pressured, locale)}</b>
              <span>{t('store.metric.pressured')}</span>
              <i>{atlas.totals.unknownPressure ? fill(t('store.metric.unlabelled'), { count: formatCount(atlas.totals.unknownPressure, locale) }) : t('store.metric.pressuredNote')}</i>
            </div>
            <div className="world-metric">
              <b>{formatCount(atlas.physical.length, locale)}</b>
              <span>{t('store.metric.physical')}</span>
              <i>{atlas.physicalProvider || '—'}</i>
            </div>
          </div>
        )}

        {phase === 'unavailable' && <p className="atlas__note atlas__note--warn">{t('store.state.unavailable')}</p>}
        {phase === 'failed' && <p className="atlas__note atlas__note--warn">{t('store.state.readFailed')}</p>}

        {/* -- The rack: one rail per volume ---------------------------------- */}
        {atlas && (
          <div className="atlas__rack">
            <div className="atlas__sectionhead">
              <h3>{t('store.bay.title')}</h3>
              <p>{t('store.bay.hint')}</p>
            </div>
            {atlas.volumes.map(volume => (
              <AtlasBay
                key={volume.id}
                volume={volume}
                selected={selectedVolume === volume.id}
                walking={laneBusy('heavy')}
                canWalk={volume.scanRoot != null}
                onSelect={() => setSelectedVolume(volume.id)}
                onWalk={() => walkVolume(volume)}
                t={t}
                locale={locale}
              />
            ))}
            {!atlas.volumes.length && <p className="atlas__note">{t('store.state.noVolumes')}</p>}
            {atlas.unavailableReason && <p className="atlas__note atlas__note--warn">{atlas.unavailableReason}</p>}

            <div className="atlas__sectionhead">
              <h3>{t('store.metal.title')}</h3>
              <p>{t('store.metal.hint')}</p>
            </div>
            {atlas.physical.length > 0
              ? <div className="atlas__metal">{atlas.physical.map(disk => <PhysicalDisk key={`${disk.id}-${disk.friendlyName}`} disk={disk} t={t} locale={locale} />)}</div>
              : <p className="atlas__note">{atlas.physicalAvailable ? t('store.metal.empty') : t('store.metal.unavailable')}</p>}
          </div>
        )}
      </section>

      {/* -- The bench: three walks over one folder --------------------------- */}
      <section className="atlas__bench">
        <div className="atlas__benchhead">
          <div>
            <h3>{t('store.deck.title')}</h3>
            <p>{t('store.deck.hint')}</p>
          </div>
          <div className="atlas__benchtools">
            <span className="atlas__root">
              <FolderSearch size={13} />
              <span>{t('store.deck.root')}</span>
              <bdi title={root || undefined}>{root || t('store.state.idle')}</bdi>
            </span>
            <button type="button" className="world-control" onClick={() => void chooseFolder()}>{t('store.deck.choose')}</button>
            <button type="button" className="world-control" onClick={() => LANES.forEach(id => void walk(id))} disabled={anyLaneBusy}>
              {anyLaneBusy ? t('store.deck.running') : t('store.deck.runAll')}
            </button>
          </div>
        </div>

        {roots.length > 0 && (
          <div className="world-facets" role="group" aria-label={t('store.deck.root')}>
            {roots.map(entry => (
              <button
                key={entry.root}
                type="button"
                className="world-facet"
                aria-pressed={root === entry.root}
                onClick={() => { setRoot(entry.root); setSelectedVolume(entry.id); }}
              >
                <bdi>{entry.root}</bdi>
              </button>
            ))}
          </div>
        )}

        <div className="atlas__lanes">
          <Lane
            id="heavy"
            icon={<Layers size={16} />}
            title={t('store.deck.heavy')}
            phase={lanes.heavy}
            busy={laneBusy('heavy')}
            figure={heavy ? formatCount(heavy.matchingFiles, locale) : '—'}
            figureUnit={heavy
              ? `${formatBytes(heavy.totalMatchingBytes, locale)} · ${fill(t('store.deck.thresholdAt'), { size: formatBytes(heavy.thresholdBytes, locale) })}`
              : t('store.deck.heavyNote')}
            note={heavy
              ? fill(t('store.deck.filesScanned'), { count: formatCount(heavy.filesScanned, locale) })
              : ''}
            rows={heavyLaneRows}
            onRun={() => void walk('heavy')}
            t={t}
          />
          <Lane
            id="duplicates"
            icon={<Repeat size={16} />}
            title={t('store.deck.duplicates')}
            phase={lanes.duplicates}
            busy={laneBusy('duplicates')}
            figure={duplicates ? formatBytes(duplicates.reclaimableBytes, locale) : '—'}
            figureUnit={t('store.deck.reclaimable')}
            note={duplicates
              ? `${duplicates.algorithm.toUpperCase()} · ${fill(t('store.deck.groups'), { count: formatCount(duplicates.groups.length, locale) })} · ${fill(t('store.deck.duplicateFiles'), { count: formatCount(duplicates.duplicateFiles, locale) })}`
              : t('store.deck.duplicatesNote')}
            rows={duplicateLaneRows}
            onRun={() => void walk('duplicates')}
            t={t}
          />
          {/* The empties note is not the traversal line the other two lanes carry:
              `inaccessible` on this engine is `inaccessibleFolders` on the payload,
              so borrowing the files sentence had the lane reading "5,927 folders
              walked · 4 files" about four folders it could not open. The note now
              names only the coverage caveat, and the folders-walked count stays on
              the figure, where it belongs. */}
          <Lane
            id="empties"
            icon={<Trash2 size={16} />}
            title={t('store.deck.empties')}
            phase={lanes.empties}
            busy={laneBusy('empties')}
            figure={empties ? formatCount(empties.empty, locale) : '—'}
            figureUnit={empties ? fill(t('store.ledger.folderscanned'), { count: formatCount(empties.scanned, locale) }) : t('store.deck.emptiesUnit')}
            note={empties && empties.inaccessible > 0
              ? fill(t('store.deck.accessDenied'), { count: formatCount(empties.inaccessible, locale) })
              : ''}
            rows={emptyLaneRows}
            onRun={() => void walk('empties')}
            t={t}
          />
        </div>

        {/* The honesty band: what may not be added, stated before any figure. */}
        <div className="atlas__caveat">
          <Info size={14} />
          <span>
            {overlap.paths > 0
              ? `${fill(t('store.overlap.text'), { count: formatCount(overlap.paths, locale) })} ${fill(t('store.overlap.bytes'), { size: formatBytes(overlap.bytes, locale) })}.`
              : heavy && duplicates
                ? t('store.overlap.zero')
                : t('store.overlap.none')}
            {' '}
            {duplicates ? t('store.hardlink.policy') : ''}
            {' '}
            {t('store.inspector.noAction')}
          </span>
        </div>

        {walkWarnings.length > 0 && (
          <ul className="atlas__warnings">
            {walkWarnings.slice(0, 5).map(warning => (
              <li key={warning}><AlertTriangle size={12} /><bdi>{warning}</bdi></li>
            ))}
          </ul>
        )}

        {heavy && (
          <>
            <div className="atlas__ladders">
              <Ladder
                title={t('store.ladder.types')}
                rungs={heavy.types}
                hueFor={rung => kindClass(rung.key)}
                labelFor={key => kindLabel(key, t)}
                activeKey={ladder?.kind === 'types' ? ladder.key : null}
                onPick={key => setLadder(current => (current?.kind === 'types' && current.key === key ? null : { kind: 'types', key }))}
                t={t}
                locale={locale}
              />
              <Ladder
                title={t('store.ladder.ages')}
                rungs={heavy.ages}
                hueFor={rung => `atlas--kind-age-${rung.key.replace(/[^A-Za-z]/g, '') || 'unknown'}`}
                labelFor={key => labeledBy(t, `store.age.${key}`, key)}
                activeKey={ladder?.kind === 'ages' ? ladder.key : null}
                onPick={key => setLadder(current => (current?.kind === 'ages' && current.key === key ? null : { kind: 'ages', key }))}
                t={t}
                locale={locale}
              />
              <Ladder
                title={t('store.ladder.folders')}
                rungs={heavy.folders}
                hueFor={() => null}
                labelFor={key => key}
                activeKey={ladder?.kind === 'folders' ? ladder.key : null}
                onPick={key => setLadder(current => (current?.kind === 'folders' && current.key === key ? null : { kind: 'folders', key }))}
                t={t}
                locale={locale}
              />
              <Ladder
                title={t('store.ladder.extensions')}
                rungs={heavy.extensions}
                hueFor={() => null}
                labelFor={key => key}
                activeKey={ladder?.kind === 'extensions' ? ladder.key : null}
                onPick={key => setLadder(current => (current?.kind === 'extensions' && current.key === key ? null : { kind: 'extensions', key }))}
                t={t}
                locale={locale}
              />
            </div>
            <p className="atlas__note">
              {fill(t('store.ladder.hint'), { size: formatBytes(heavy.totalScannedBytes, locale) })}
              {heavy.partial && <span className="atlas__note--warn"> {t('store.deck.partial')}</span>}
            </p>
          </>
        )}
        {!heavy && lanes.heavy === 'idle' && <p className="atlas__note">{t('store.ladder.empty')}</p>}
      </section>

      {/* -- Ledger and inspector --------------------------------------------- */}
      <section className="atlas__split">
        <SpaceMap rows={heavyRows} locale={locale} onPick={path => setSelected({ kind: 'file', path })} />

        <div className="atlas__ledger">
          <div className="atlas__ledgerbar">
            <div className="world-facets" role="group" aria-label={t('store.ledger.title')}>
              {LANES.map(id => (
                <button key={id} type="button" className="world-facet" aria-pressed={tab === id} onClick={() => setTab(id)}>
                  {t(`store.deck.${id}`)}
                  <b>{formatCount(id === 'heavy' ? heavyRows.length : id === 'duplicates' ? (duplicates?.groups.length ?? 0) : (empties?.paths.length ?? 0), locale)}</b>
                </button>
              ))}
            </div>
            {ladder && (
              <button type="button" className="world-facet" onClick={() => setLadder(null)}>
                {t('store.filter.reset')}
                <bdi>{ladder.key}</bdi>
              </button>
            )}
          </div>

          {tab === 'heavy' && (
            <>
              <div className="atlas__ledgerhead">
                <span>{t('store.ledger.name')}</span>
                <span>{t('store.ledger.kind')}</span>
                <span>{t('store.ledger.age')}</span>
                <b>{t('store.ledger.size')}</b>
              </div>
              <div className="atlas__rows">
                {heavyRows.map(row => (
                  <button
                    key={row.path}
                    type="button"
                    className={`atlas__row ${kindClass(row.type)}`}
                    aria-pressed={selected?.kind === 'file' && selected.path === row.path}
                    onClick={() => setSelected({ kind: 'file', path: row.path })}
                  >
                    <span className="atlas__rowname">
                      <b>{row.name}</b>
                      {row.extension && <code>{row.extension}</code>}
                      {row.deferred && <span className="atlas__deferred">{t('store.action.deferred')}</span>}
                    </span>
                    <span className="atlas__rowkind">{kindLabel(row.type, t)}</span>
                    <span className="atlas__rowage">{t(`store.age.${row.ageBucket}`)}</span>
                    <span className="atlas__rowsize" style={{ '--at-share': `${Math.max(3, (row.size / largestHeavy) * 100)}%` } as CSSProperties}>
                      <b>{formatBytes(row.size, locale)}</b>
                      <i aria-hidden="true" />
                    </span>
                  </button>
                ))}
                {!heavyRows.length && (
                  <div className="atlas__empty">
                    <Layers size={22} />
                    <span>{heavy ? (ladder ? t('store.ledger.empty') : t('store.ledger.heavy.empty')) : t('store.ladder.empty')}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'duplicates' && (
            <>
              <div className="atlas__ledgerhead">
                <span>{t('store.ledger.hash')}</span>
                <span>{t('store.ledger.copies')}</span>
                <span>{t('store.ledger.risk')}</span>
                <b>{t('store.deck.reclaimable')}</b>
              </div>
              <div className="atlas__rows">
                {(duplicates?.groups || []).map((group: DuplicateRow) => (
                  <button
                    key={group.key}
                    type="button"
                    className={`atlas__row ${group.reclaimableBytes === 0 ? 'atlas--unknown' : group.risk === 'high' ? 'atlas--high' : 'atlas--healthy'}`}
                    aria-pressed={selected?.kind === 'set' && selected.key === group.key}
                    onClick={() => setSelected({ kind: 'set', key: group.key })}
                  >
                    <span className="atlas__rowname">
                      <b>{shortHash(group.hash)}</b>
                      {group.extension && <code>{group.extension}</code>}
                      {group.singlePhysicalFile && <span className="atlas__deferred">{t('store.hardlink.zero')}</span>}
                    </span>
                    <span className="atlas__rowwhere">{formatCount(group.count, locale)} × {formatBytes(group.size, locale)}</span>
                    <span className="atlas__rowage">{riskLabel(group.risk, t)}</span>
                    <span className="atlas__rowsize" style={{ '--at-share': `${Math.max(3, (group.reclaimableBytes / maxReclaim) * 100)}%` } as CSSProperties}>
                      <b>{formatBytes(group.reclaimableBytes, locale)}</b>
                      <i aria-hidden="true" />
                    </span>
                  </button>
                ))}
                {!duplicates?.groups.length && (
                  <div className="atlas__empty">
                    <Repeat size={22} />
                    <span>{duplicates ? t('store.ledger.duplicates.empty') : t('store.ladder.empty')}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'empties' && (
            <>
              {/* Two columns, not four. A folder row has no kind, no age and no
                  share of a byte total — it is empty, which is the whole fact —
                  so the two slots it would fill are taken away rather than
                  padded with an empty span and eighty identical "0 B". */}
              <div className="atlas__ledgerhead atlas__ledgerhead--folder">
                <span>{t('store.ledger.folder')}</span>
                <span>{t('store.ledger.where')}</span>
              </div>
              <div className="atlas__rows">
                {(empties?.paths || []).map(entry => (
                  <button
                    key={entry}
                    type="button"
                    className="atlas__row atlas--unknown atlas__row--folder"
                    aria-pressed={selected?.kind === 'folder' && selected.path === entry}
                    onClick={() => setSelected({ kind: 'folder', path: entry })}
                  >
                    <span className="atlas__rowname"><b>{entry.split(/[\\/]/).pop() || entry}</b></span>
                    <span className="atlas__rowwhere">{entry}</span>
                  </button>
                ))}
                {!empties?.paths.length && (
                  <div className="atlas__empty">
                    <Trash2 size={22} />
                    <span>{empties ? t('store.ledger.empties.empty') : t('store.ladder.empty')}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <p className="atlas__ledgerfoot">
            {fill(t('store.ledger.count'), { current: formatCount(ledgerCount, locale), total: formatCount(tab === 'heavy' ? (heavy?.matchingFiles ?? 0) : tab === 'duplicates' ? (duplicates?.groups.length ?? 0) : (empties?.empty ?? 0), locale) })}
            {tab === 'heavy' && heavy?.traversal
              ? ` · ${fill(t('store.deck.traversal'), { folders: formatCount(heavy.traversal.foldersVisited, locale), files: formatCount(heavy.traversal.filesVisited, locale) })}`
              : ''}
            {tab === 'duplicates' && duplicates?.traversal
              ? ` · ${fill(t('store.deck.traversal'), { folders: formatCount(duplicates.traversal.foldersVisited, locale), files: formatCount(duplicates.traversal.filesVisited, locale) })}`
              : ''}
            {(tab === 'heavy' ? heavy?.traversal : duplicates?.traversal)?.accessDenied
              ? ` · ${fill(t('store.deck.accessDenied'), { count: formatCount((tab === 'heavy' ? heavy?.traversal : duplicates?.traversal)?.accessDenied ?? 0, locale) })}`
              : ''}
            {(tab === 'heavy' ? heavy?.traversal : duplicates?.traversal)?.reparsePointsSkipped
              ? ` · ${fill(t('store.deck.skippedLinks'), { count: formatCount((tab === 'heavy' ? heavy?.traversal : duplicates?.traversal)?.reparsePointsSkipped ?? 0, locale) })}`
              : ''}
            {(tab === 'heavy' ? heavy?.traversal : duplicates?.traversal)?.cloudPlaceholders
              ? ` · ${fill(t('store.deck.placeholders'), { count: formatCount((tab === 'heavy' ? heavy?.traversal : duplicates?.traversal)?.cloudPlaceholders ?? 0, locale) })}`
              : ''}
            {(tab === 'heavy' ? heavy?.traversal : duplicates?.traversal)?.hardlinkedFiles
              ? ` · ${fill(t('store.deck.hardlinked'), { count: formatCount((tab === 'heavy' ? heavy?.traversal : duplicates?.traversal)?.hardlinkedFiles ?? 0, locale) })}`
              : ''}
          </p>
        </div>

        <aside className="atlas__aside">
          <div className="atlas__inspector" data-mode={showReadBoard ? 'read' : 'record'}>
            <h3>{t('store.inspector.title')}</h3>

            {showReadBoard && (
              <ReadBoard
                volume={activeVolume}
                reads={laneReads}
                phases={lanes}
                tab={tab}
                canWalk={canRunTool(largeFilesTool)}
                walking={laneBusy('heavy')}
                onTab={setTab}
                onWalkVolume={walkVolume}
                onReveal={reveal}
                t={t}
                locale={locale}
              />
            )}

            {selectedFile && (
              <>
                <div className="atlas__subject">
                  <b>{selectedFile.name}</b>
                  <span className="atlas__rowwhere">{selectedFile.path}</span>
                </div>
                <h4>{t('store.inspector.attributes')}</h4>
                <dl className="atlas__attrs">
                  <div><dt>{t('store.ledger.size')}</dt><dd>{formatBytes(selectedFile.size, locale)}</dd></div>
                  <div><dt>{t('store.ledger.kind')}</dt><dd>{kindLabel(selectedFile.type, t)}</dd></div>
                  <div><dt>{t('store.ledger.age')}</dt><dd>{t(`store.age.${selectedFile.ageBucket}`)}</dd></div>
                  <div><dt>{t('store.ledger.modified')}</dt><dd>{selectedFile.modifiedAt ? formatDateTime(selectedFile.modifiedAt, locale) : '—'}</dd></div>
                  {hashes[selectedFile.path] && (
                    <div>
                      <dt>{t('store.ledger.hash')}</dt>
                      <dd title={hashes[selectedFile.path].digest}><code>{shortHash(hashes[selectedFile.path].digest)}</code></dd>
                    </div>
                  )}
                </dl>
                <h4>{t('store.inspector.actions')}</h4>
                <div className="atlas__actions">
                  <button type="button" className="world-control" onClick={() => reveal(selectedFile.path, false)}>
                    <FolderOpen size={14} />{t('store.action.reveal')}
                  </button>
                  <button type="button" className="world-control" onClick={() => void hashFile(selectedFile.path)} disabled={hashing || selectedFile.deferred || !canRunTool(hashTool)}>
                    <Hash size={14} />
                    {selectedFile.deferred ? t('store.action.deferred') : hashing ? t('store.action.hashing') : hashes[selectedFile.path] ? t('store.action.hashReady') : t('store.action.hash')}
                  </button>
                </div>
                <p className="atlas__note">{selectedFile.deferred ? t('store.action.deferred') : t('store.inspector.noAction')}</p>
              </>
            )}

            {selectedSet && (
              <>
                <div className="atlas__subject">
                  <b>{formatCount(selectedSet.count, locale)} × {formatBytes(selectedSet.size, locale)}</b>
                  <span>{duplicates?.algorithm.toUpperCase()}</span>
                </div>
                <h4>{t('store.inspector.attributes')}</h4>
                <dl className="atlas__attrs">
                  <div><dt>{t('store.ledger.hash')}</dt><dd title={selectedSet.hash}><code>{shortHash(selectedSet.hash)}</code></dd></div>
                  <div><dt>{t('store.deck.reclaimable')}</dt><dd>{formatBytes(selectedSet.reclaimableBytes, locale)}</dd></div>
                  <div><dt>{t('store.ledger.risk')}</dt><dd>{riskLabel(selectedSet.risk, t)}</dd></div>
                  <div><dt>{t('store.duplicates.physicalGroups')}</dt><dd>{formatCount(selectedSet.physicalDuplicates, locale)}</dd></div>
                </dl>
                <h4>{t('store.inspector.members')}</h4>
                <ul className="atlas__members">
                  {keeperPath && (
                    <li><span className="keeper">{t('store.keeper')}</span><bdi title={keeperPath}>{keeperPath}</bdi></li>
                  )}
                  {selectedSet.reviewPaths.slice(0, 8).map(entry => (
                    <li key={entry}><span>{t('store.review')}</span><bdi title={entry}>{entry}</bdi></li>
                  ))}
                </ul>
                <h4>{t('store.inspector.actions')}</h4>
                <div className="atlas__actions">
                  {keeperPath && (
                    <>
                      <button type="button" className="world-control" onClick={() => reveal(keeperPath, false)}>
                        <FolderOpen size={14} />{t('store.action.reveal')}
                      </button>
                      <button type="button" className="world-control" onClick={() => void hashFile(keeperPath)} disabled={hashing || !canRunTool(hashTool)}>
                        <Hash size={14} />{hashes[keeperPath] ? t('store.action.hashReady') : t('store.action.hash')}
                      </button>
                    </>
                  )}
                </div>
                <p className="atlas__note">{selectedSet.singlePhysicalFile ? t('store.hardlink.policy') : t('store.inspector.noAction')}</p>
              </>
            )}

            {selectedFolder && (
              <>
                <div className="atlas__subject">
                  <b>{selectedFolder.path.split(/[\\/]/).pop() || selectedFolder.path}</b>
                  <span className="atlas__rowwhere">{selectedFolder.path}</span>
                </div>
                <h4>{t('store.inspector.attributes')}</h4>
                {/* The ledger column already shows the one fact about an empty folder:
                    it holds no bytes. Repeating "0 B" in the record would say nothing,
                    so the attributes name the read behind the finding instead — which
                    walk called it empty, from what root, across how many folders, and
                    at what time. Without those four, "empty" is a word with no evidence.
                    The `data-folder-record` mark is for the capture harness: this is the
                    only record made of reads rather than measurements, and the suite has
                    to tell it from a file or set record without comparing text. */}
                <dl className="atlas__attrs" data-folder-record="true">
                  {selectedFolderParent && (
                    <div><dt>{t('store.folder.parent')}</dt><dd><bdi>{selectedFolderParent}</bdi></dd></div>
                  )}
                  <div><dt>{t('store.folder.reportedBy')}</dt><dd>{empties ? t('store.deck.empties') : t('store.state.idle')}</dd></div>
                  {empties?.root && (
                    <div><dt>{t('store.folder.root')}</dt><dd><bdi>{empties.root}</bdi></dd></div>
                  )}
                  {empties && (
                    <div>
                      <dt>{t('store.folder.covered')}</dt>
                      {/* The row label already says what the number counts, so the
                          value is the count alone — the lane's "{n} folders walked"
                          unit belongs to a bare figure, and reusing it here made the
                          row read "Folders walked: 6,016 folders walked". */}
                      <dd>{formatCount(empties.scanned, locale)}</dd>
                    </div>
                  )}
                  {empties?.collectedAt && (
                    <div>
                      <dt>{t('store.folder.at')}</dt>
                      <dd>{formatTimeOfDay(empties.collectedAt, locale)}</dd>
                    </div>
                  )}
                </dl>
                <p className="atlas__note">{t('store.folder.note')}</p>
                <h4>{t('store.inspector.actions')}</h4>
                <div className="atlas__actions">
                  <button type="button" className="world-control" onClick={() => reveal(selectedFolder.path, true)}>
                    <FolderOpen size={14} />{t('store.action.reveal')}
                  </button>
                  {/* The walk this button starts is the heavy lane rooted at the picked
                      folder, so it reads the folder — not the volume the folder happens
                      to sit on — and is gated on that engine like every other walk. */}
                  <button
                    type="button"
                    className="world-control"
                    onClick={() => { setRoot(selectedFolder.path); void walk('heavy', selectedFolder.path); }}
                    disabled={laneBusy('heavy') || !canRunTool(largeFilesTool)}
                  >
                    <FolderSearch size={14} />
                    {laneBusy('heavy') ? t('store.deck.running') : t('store.action.walkFolder')}
                  </button>
                </div>
                <p className="atlas__note">{t('store.inspector.noAction')}</p>
              </>
            )}
          </div>

          {duplicates && duplicates.groups.length > 0 && (
            <div className="atlas__inspector">
              <h4>{t('store.metric.reclaim')}</h4>
              <div className="atlas__lanefigure">
                <b>{formatBytes(duplicates.reclaimableBytes, locale)}</b>
                <span>{t('store.metric.reclaimNote')}</span>
              </div>
              <p className="atlas__note">{t('store.inspector.noAction')}</p>
            </div>
          )}
        </aside>
      </section>

      <ServicesRail
        world="storage"
        titleKey="store.services.title"
        hintKey="store.services.hint"
        liveKey="store.services.live"
        openKey="store.services.openTool"
        invoke={{
          'storage-disks': () => { void loadVolumes(); },
          'storage-large-files': () => { setTab('heavy'); void walk('heavy'); },
          'storage-duplicates': () => { setTab('duplicates'); void walk('duplicates'); },
          'storage-empty-folders': () => { setTab('empties'); void walk('empties'); }
        }}
        t={t}
        locale={locale}
      />

      <footer className={`world-dock ${atlas ? 'world-dock--ready' : volumesBusy ? 'world-dock--busy' : 'world-dock--idle'}`} aria-label={locale === 'ar' ? 'قياسات الأطلس والخطوة التالية' : 'Atlas measurements and next step'}>
        <span className="world-dock__mark" aria-hidden="true" />
        <div className="world-dock__read">
          <b>{volumesBusy
            ? (locale === 'ar' ? 'يُقرأ جدول الأحجام في Windows…' : 'Reading the Windows volume table…')
            : atlas
              ? `${locale === 'ar' ? 'جداول الأحجام مقاسة' : 'Volume table measured'} · ${[heavy, duplicates, empties].filter(Boolean).length} / 3 ${locale === 'ar' ? 'جولات أجيب عنها' : 'walks answered'}`
              : (locale === 'ar' ? 'لم يُقرأ شيء بعد' : 'Nothing read yet')}</b>
          <small>{locale === 'ar' ? 'الأطلس يقيس فقط: لا حذف ولا نقل من هنا.' : 'The atlas measures only. Nothing is deleted or moved from here.'}</small>
        </div>
        <div className="world-dock__actions">
          <button type="button" className="world-control" disabled={volumesBusy || !diskTool} onClick={() => void runById('disk-overview', {}, true)}>
            {locale === 'ar' ? 'إعادة قراءة الأحجام' : 'Re-read volumes'}
          </button>
          <button type="button" className="world-control world-control--primary" onClick={() => setPage('files')}>
            {locale === 'ar' ? 'افتح منضدة التنزيلات' : 'Open the Downloads bench'}
          </button>
        </div>
      </footer>
    </div>
  );
}

/* -- REF-04 space map ------------------------------------------------------ */
type MapTile = { row: HeavyRow; x: number; y: number; w: number; h: number };

/**
 * Slice the box by measured share, always cutting along the longer edge. The
 * rectangles tile the area exactly, so a big file is a big rectangle and the
 * sum of the areas is the sum of the bytes Windows reported for the files in
 * view. Nothing is drawn before a walk has answered.
 */
function layoutTiles(rows: HeavyRow[], x: number, y: number, w: number, h: number, out: MapTile[] = []): MapTile[] {
  if (!rows.length || w <= 0.01 || h <= 0.01) return out;
  const sizes = rows.map(row => Math.max(1, row.size));
  const total = sizes.reduce((sum, size) => sum + size, 0);
  const share = sizes[0] / total;
  if (w >= h) {
    const width = w * share;
    out.push({ row: rows[0], x, y, w: width, h });
    return layoutTiles(rows.slice(1), x + width, y, w - width, h, out);
  }
  const height = h * share;
  out.push({ row: rows[0], x, y, w, h: height });
  return layoutTiles(rows.slice(1), x, y + height, w, h - height, out);
}

function SpaceMap({ rows, locale, onPick }: { rows: HeavyRow[]; locale: 'ar' | 'en'; onPick: (path: string) => void }) {
  const words = locale === 'ar'
    ? { title: 'خريطة المساحة', hint: 'مستطيل لكل ملف قياسي، ومساحته بنسبة البايتات التي أبلغ عنها Windows.', foot: (shown: number, all: number) => `${shown} من ${all} ملفاً مقياساً مرسومة هنا`, empty: 'لا خريطة قبل جولة', emptyNote: 'شغّل جولة الملفات الثقيلة لتُقرأ الأحجام، ثم تُرسم هنا بنسبة حقيقية.' }
    : { title: 'Space map', hint: 'One rectangle per measured file, sized by the bytes Windows reported.', foot: (shown: number, all: number) => `${shown} of ${all} measured files drawn here`, empty: 'No map before a walk', emptyNote: 'Run the heavy-files walk and its measured sizes are drawn here in true proportion.' };
  const ordered = useMemo(() => [...rows].sort((a, b) => b.size - a.size), [rows]);
  const tiles = useMemo(() => layoutTiles(ordered.slice(0, 24), 0, 0, 100, 100), [ordered]);
  const bytes = rows.reduce((sum, row) => sum + row.size, 0);
  return (
    <section className="atlas__map" data-state={tiles.length ? 'drawn' : 'empty'} aria-label={words.title}>
      <header className="atlas__maphead">
        <div>
          <h3>{words.title}</h3>
          <p>{words.hint}</p>
        </div>
        <b>{tiles.length ? formatBytes(bytes, locale) : '—'}</b>
      </header>
      {tiles.length ? (
        <>
          <div className="atlas__mapcanvas">
            {tiles.map((tile, index) => (
              <button
                type="button"
                key={tile.row.path}
                className="atlas__tile"
                style={{ left: `${tile.x}%`, top: `${tile.y}%`, width: `${tile.w}%`, height: `${tile.h}%`, '--tile-index': index } as CSSProperties}
                title={`${tile.row.name} · ${formatBytes(tile.row.size, locale)}`}
                onClick={() => onPick(tile.row.path)}
              >
                {tile.w > 11 && tile.h > 8 && <><strong>{tile.row.name}</strong><small>{formatBytes(tile.row.size, locale)}</small></>}
              </button>
            ))}
          </div>
          <p className="atlas__mapfoot">{words.foot(tiles.length, rows.length)}</p>
        </>
      ) : (
        <p className="atlas__mapempty"><strong>{words.empty}</strong><span>{words.emptyNote}</span></p>
      )}
    </section>
  );
}
