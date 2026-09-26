import { useMemo, useState } from 'react';
import type { ToolResult } from '@shared/contracts';
import { formatBytes, formatCount, formatDateTime, formatDurationMs } from '../lib/format';
import { useStore } from '../state/store';

/** Dense operational tables for read-heavy workspaces. Every value comes from a real result item. */

function useFilter<T>(items: T[], toText: (item: T) => string) {
  const { t } = useStore();
  const [filter, setFilter] = useState('');
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => toText(item).toLowerCase().includes(q));
  }, [items, filter, toText]);
  return { filter, setFilter, filtered, t };
}

function FilterInput({ value, onChange, label }: { value: string; onChange: (next: string) => void; label: string }) {
  return (
    <label className="table-filter">
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={label} aria-label={label} />
    </label>
  );
}

function NoResults() {
  const { t } = useStore();
  return <p className="muted">{t('common.noResults')}</p>;
}

/** Post-mutation verification evidence. Never claims success without proof. */
export function VerificationPanel({ result }: { result: ToolResult }) {
  const { t, locale } = useStore();
  const summary = result.summary as Record<string, unknown>;
  const verification = summary.verification as Record<string, unknown> | undefined;
  const checks = Array.isArray(verification?.checks) ? (verification!.checks as Array<Record<string, unknown>>) : [];
  if (!verification || typeof verification.status !== 'string') return null;
  const status = verification.status;
  const tone = status === 'verified' ? 'ok' : status === 'failed' ? 'danger' : 'muted';
  return (
    <div className={`result result-${tone} verification`} role="status">
      <h3>{t('operation.verification')}: <span className={`pill pill-${tone}`}>{t(`verification.${status}`)}</span></h3>
      <p className="muted small">{String(verification.method ?? '')}</p>
      {typeof verification.limitation === 'string' && <p className="muted small">{verification.limitation}</p>}
      {checks.length > 0 && (
        <table className="data-table">
          <thead><tr><th>{t('verification.check')}</th><th>{t('verification.expected')}</th><th>{t('verification.observed')}</th><th>{t('verification.result')}</th></tr></thead>
          <tbody>
            {checks.map((check, index) => (
              <tr key={index}>
                <td>{String(check.name ?? '—')}</td>
                <td dir="auto"><code>{String(check.expected ?? '—')}</code></td>
                <td dir="auto"><code>{String(check.observed ?? '—')}</code></td>
                <td><span className={`pill pill-${check.ok ? 'ok' : 'danger'}`}>{check.ok ? t('verification.pass') : t('verification.fail')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {typeof verification.verifiedAt === 'string' && <p className="muted small" dir="ltr">{formatDateTime(verification.verifiedAt, locale)}</p>}
    </div>
  );
}

/** Mutation timing and final-state evidence for admin/elevated operations. */
export function OperationEvidence({ result }: { result: ToolResult }) {
  const { t, locale } = useStore();
  const summary = result.summary as Record<string, unknown>;
  const fields: Array<[string, unknown]> = [
    ['operation.startedAt', summary.startedAt],
    ['operation.duration', typeof summary.durationMs === 'number' ? formatDurationMs(summary.durationMs, locale) : null],
    ['operation.finalState', summary.finalState],
    ['operation.finalStateSource', summary.finalStateSource],
    ['operation.restartState', summary.restartState],
    ['operation.adminState', summary.adminState]
  ];
  const logLocations = Array.isArray(summary.logLocations) ? (summary.logLocations as string[]) : [];
  const stdout = summary.stdoutSummary as { head?: string; lineCount?: number } | null | undefined;
  const present = fields.some(([, value]) => value != null) || logLocations.length > 0 || stdout != null;
  if (!present) return null;
  return (
    <div className="kv-grid">
      {fields.filter(([, value]) => value != null).map(([key, value]) => (
        <div key={key}>
          <dt>{t(key)}</dt>
          <dd dir={typeof value === 'string' && /[A-Za-z]/.test(value) ? 'auto' : undefined}>{String(value)}</dd>
        </div>
      ))}
      {logLocations.length > 0 && <div><dt>{t('operation.logLocations')}</dt><dd dir="ltr">{logLocations.map((item, index) => <code key={index} style={{ display: 'block' }}>{item}</code>)}</dd></div>}
      {stdout?.head && <div><dt>{t('operation.outputSummary')}</dt><dd><pre className="result-log" dir="ltr">{String(stdout.head)}</pre></dd></div>}
    </div>
  );
}

export function StorageTables({ result }: { result: ToolResult }) {
  const { t, locale } = useStore();
  const { filter, setFilter, filtered } = useFilter(result.items as Array<Record<string, unknown>>, item => `${item.deviceId ?? ''} ${item.volumeName ?? ''}`);
  if (result.toolId !== 'disk-overview') return null;
  const summary = result.summary as Record<string, unknown>;
  const physical = Array.isArray(summary.physicalDisks) ? (summary.physicalDisks as Array<Record<string, unknown>>) : [];
  return (
    <div className="data-table-wrap">
      <FilterInput value={filter} onChange={setFilter} label={t('common.filter')} />
      <table className="data-table">
        <thead><tr><th>{t('storage.drives')}</th><th>{t('common.used')}</th><th>{t('common.free')}</th><th>{t('common.total')}</th><th>{t('services.status')}</th></tr></thead>
        <tbody>
          {filtered.map((row, i) => (
            <tr key={i}>
              <td dir="ltr"><code>{String(row.deviceId ?? row.DeviceID ?? '—')}</code><br /><small className="muted">{String(row.volumeName ?? row.VolumeName ?? '')}</small></td>
              <td dir="ltr">{pressureBar(row, locale)}</td>
              <td dir="ltr">{formatBytes(row.freeBytes ?? row.FreeSpace, locale)}</td>
              <td dir="ltr">{formatBytes(row.sizeBytes ?? row.Size, locale)}</td>
              <td><span className={`pill pressure-${String(row.pressure ?? 'unknown')}`}>{t(`storage.pressure.${String(row.pressure ?? 'unknown')}`)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <NoResults />}
      {physical.length > 0 && (
        <table className="data-table">
          <thead><tr><th>{t('hardware.physicalDisk')}</th><th>{t('hardware.mediaType')}</th><th>{t('common.total')}</th><th>{t('hardware.health')}</th><th>{t('hardware.temperature')}</th></tr></thead>
          <tbody>
            {physical.map((disk, i) => (
              <tr key={i}>
                <td>{String(disk.friendlyName ?? '—')}</td>
                <td>{String(disk.mediaType ?? '—')}</td>
                <td dir="ltr">{formatBytes(disk.sizeBytes, locale)}</td>
                <td>{String(disk.healthStatus ?? '—')}</td>
                {/* Temperature is never fabricated. */}
                <td><span className="pill pill-muted">{t('common.unavailable')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function pressureBar(row: Record<string, unknown>, locale: 'ar' | 'en') {
  const free = Number(row.freeBytes ?? row.FreeSpace);
  const total = Number(row.sizeBytes ?? row.Size);
  if (!Number.isFinite(free) || !Number.isFinite(total) || total <= 0) return '—';
  const pct = Math.round(((total - free) / total) * 100);
  return (
    <span className="pressure-cell">
      <span className="pressure-track"><i style={{ width: `${pct}%` }} /></span>
      <span>{new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en').format(pct)}%</span>
    </span>
  );
}

export function FileTables({ result }: { result: ToolResult }) {
  const { t, locale } = useStore();
  const items = result.items as Array<Record<string, unknown>>;
  const { filter, setFilter, filtered } = useFilter(items, item => `${item.path ?? ''} ${item.type ?? ''} ${item.placeholderState ?? ''}`);
  if (!['large-files', 'duplicate-files', 'empty-folders', 'downloads-inventory', 'temp-cleanup-preview', 'organize-downloads-preview'].includes(result.toolId)) return null;
  const summary = result.summary as Record<string, unknown>;
  const traversal = summary.traversal as Record<string, unknown> | undefined;
  const groups = useMemo(() => {
    if (result.toolId !== 'duplicate-files') return null;
    const map = new Map<string, Array<Record<string, unknown>>>();
    for (const item of filtered) {
      const key = String(item.hash ?? item.size ?? 'group');
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()].slice(0, 30);
  }, [filtered, result.toolId]);
  return (
    <div className="data-table-wrap">
      {result.toolId === 'duplicate-files' && (
        <>
          <p className="muted small">{t('files.noDeletion')}</p>
          {typeof summary.hardlinkPolicy === 'string' && <p className="muted small">{summary.hardlinkPolicy}</p>}
        </>
      )}
      {traversal && <TraversalSummary traversal={traversal} />}
      <FilterInput value={filter} onChange={setFilter} label={t('common.filter')} />
      {groups ? (
        <div className="dup-groups">
          {groups.map(([key, list], gi) => {
            const singlePhysical = list[0]?.singlePhysicalFile === true;
            return (
              <details key={key} className="dup-group" open={gi < 3}>
                <summary>
                  {t('files.group')} {gi + 1} · {formatCount(list.length, locale)} · {formatBytes(list[0]?.size, locale)} · <code dir="ltr">{String(list[0]?.hash ?? '').slice(0, 16)}…</code>
                  {/* Hard links are one physical file: reclaimable bytes differ from file count. */}
                  {singlePhysical && <span className="pill pill-muted">{t('files.singlePhysicalFile')}</span>}
                </summary>
                <table className="data-table">
                  <thead><tr><th>{t('files.path')}</th><th>{t('files.size')}</th><th>{t('files.modified')}</th><th>{t('files.identity')}</th></tr></thead>
                  <tbody>
                    {list.map((row, i) => (
                      <tr key={i}>
                        <td><code dir="ltr" title={String(row.path ?? '')}>{truncate(String(row.path ?? ''), 90)}</code></td>
                        <td dir="ltr">{formatBytes(row.size, locale)}</td>
                        <td dir="ltr">{row.modifiedAt ? formatDateTime(row.modifiedAt, locale) : '—'}</td>
                        <td dir="ltr"><code title={String(row.fileIdentity ?? '')}>{row.hardlinked ? t('files.hardlinked') : (row.fileIdentity ? String(row.fileIdentity).split(':').pop() : '—')}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            );
          })}
        </div>
      ) : (
        <table className="data-table">
          <thead><tr><th>{t('files.path')}</th><th>{t('files.size')}</th><th>{t('files.type')}</th><th>{t('files.modified')}</th><th>{t('files.placeholder')}</th></tr></thead>
          <tbody>
            {filtered.slice(0, 200).map((row, i) => (
              <tr key={i}>
                <td><code dir="ltr" title={String(row.path ?? row.source ?? '')}>{truncate(String(row.path ?? row.source ?? ''), 80)}</code></td>
                <td dir="ltr">{formatBytes(row.size ?? row.bytes, locale)}</td>
                <td>{String(row.type ?? row.category ?? '—')}</td>
                <td dir="ltr">{row.modifiedAt || row.modified ? formatDateTime(row.modifiedAt ?? row.modified, locale) : '—'}</td>
                <td>{placeholderCell(row, t)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {filtered.length === 0 && <NoResults />}
    </div>
  );
}

function placeholderCell(row: Record<string, unknown>, t: (key: string) => string) {
  const state = String(row.placeholderState ?? '');
  if (state === 'cloud-placeholder') return <span className="pill pill-muted">{t('files.cloudPlaceholder')}</span>;
  if (state && state !== 'not-indicated') return <span className="pill pill-muted">{state}</span>;
  return <span className="muted">—</span>;
}

function TraversalSummary({ traversal }: { traversal: Record<string, unknown> }) {
  const { t, locale } = useStore();
  const skipped = Number(traversal.reparsePointsSkipped) || 0;
  const cloud = Number(traversal.cloudPlaceholders) || 0;
  const hard = Number(traversal.hardlinkedFiles) || 0;
  const denied = Number(traversal.accessDenied) || 0;
  if (!skipped && !cloud && !hard && !denied) return null;
  return (
    <div className="traversal-summary">
      {skipped > 0 && <span className="pill pill-muted">{formatCount(skipped, locale)} {t('files.reparseSkipped')}</span>}
      {cloud > 0 && <span className="pill pill-muted">{formatCount(cloud, locale)} {t('files.cloudPlaceholder')}</span>}
      {hard > 0 && <span className="pill pill-muted">{formatCount(hard, locale)} {t('files.hardlinked')}</span>}
      {denied > 0 && <span className="pill pill-muted">{formatCount(denied, locale)} {t('files.accessDenied')}</span>}
    </div>
  );
}

function truncate(value: string, max: number): string {
  return value.length > max ? `…${value.slice(-(max - 1))}` : value;
}

export function StartupTables({ result }: { result: ToolResult }) {
  const { t } = useStore();
  const items = result.items as Array<Record<string, unknown>>;
  const { filter, setFilter, filtered } = useFilter(items, item => `${item.name ?? ''} ${item.command ?? ''} ${item.source ?? ''}`);
  if (result.toolId !== 'startup-items') return null;
  const summary = result.summary as Record<string, unknown>;
  return (
    <div className="data-table-wrap">
      <p className="muted small">{t('startup.writeScope')}: <code dir="ltr">{String(summary.writeScope ?? '')}</code></p>
      <FilterInput value={filter} onChange={setFilter} label={t('common.filter')} />
      <table className="data-table">
        <thead><tr><th>{t('startup.name')}</th><th>{t('startup.command')}</th><th>{t('startup.source')}</th><th>{t('startup.managed')}</th></tr></thead>
        <tbody>
          {filtered.slice(0, 200).map((row, i) => (
            <tr key={i}>
              <td><strong dir="auto">{String(row.name ?? '—')}</strong></td>
              <td><code dir="ltr" title={String(row.command ?? '')}>{truncate(String(row.command ?? ''), 90)}</code></td>
              <td><code dir="ltr">{String(row.source ?? '')}</code></td>
              <td>{row.managedBySmartOrganizer ? <span className="pill pill-ok">{t('common.yes')}</span> : <span className="pill pill-muted">{t('common.readOnly')}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <NoResults />}
    </div>
  );
}

export function AppTables({ result }: { result: ToolResult }) {
  const { t } = useStore();
  const items = result.items as Array<Record<string, unknown>>;
  const { filter, setFilter, filtered } = useFilter(items, item => `${item.name ?? ''} ${item.publisher ?? ''} ${item.source ?? ''}`);
  if (result.toolId !== 'installed-apps') return null;
  const summary = result.summary as Record<string, unknown>;
  return (
    <div className="data-table-wrap">
      <p className="muted small">
        {t('apps.providers')}: <code dir="ltr">{Array.isArray(summary.providers) ? (summary.providers as string[]).join(', ') : '—'}</code>
        {' · '}{t('apps.counts')}: {String(summary.uninstallRegistryEntries ?? '—')} / {String(summary.packageEntries ?? '—')}
      </p>
      <FilterInput value={filter} onChange={setFilter} label={t('common.filter')} />
      <table className="data-table">
        <thead><tr><th>Name</th><th>{t('apps.publisher')}</th><th>{t('apps.version')}</th><th>{t('apps.architecture')}</th><th>{t('apps.source')}</th><th>{t('apps.location')}</th></tr></thead>
        <tbody>
          {filtered.slice(0, 300).map((row, i) => (
            <tr key={i}>
              <td><strong>{String(row.name ?? '—')}</strong></td>
              <td>{String(row.publisher ?? '—')}</td>
              <td dir="ltr">{String(row.version ?? '—')}</td>
              <td dir="ltr">{String(row.architecture ?? '—')}</td>
              <td><span className="pill pill-muted">{String(row.source ?? '—')}</span></td>
              <td>{row.installLocation ? <code dir="ltr" title={String(row.installLocation)}>{truncate(String(row.installLocation), 60)}</code> : <span className="muted">{t('apps.locationMissing')}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <NoResults />}
    </div>
  );
}

export function ServiceTables({ result }: { result: ToolResult }) {
  const { t } = useStore();
  const items = result.items as Array<Record<string, unknown>>;
  const { filter, setFilter, filtered } = useFilter(items, item => `${item.name ?? ''} ${item.displayName ?? ''} ${item.account ?? ''}`);
  if (result.toolId !== 'services-inventory') return null;
  return (
    <div className="data-table-wrap">
      <p className="muted small">{t('services.protectedNote')}</p>
      <FilterInput value={filter} onChange={setFilter} label={t('services.searchPlaceholder')} />
      <table className="data-table">
        <thead><tr><th>{t('services.status')}</th><th>Name</th><th>{t('services.startupType')}</th><th>{t('services.delayedAuto')}</th><th>PID</th><th>{t('services.account')}</th><th>{t('services.protected')}</th></tr></thead>
        <tbody>
          {filtered.slice(0, 500).map((row, i) => (
            <tr key={i}>
              <td><span className={`pill pill-${row.running ? 'ok' : 'muted'}`}>{String(row.state ?? row.status ?? '—')}</span></td>
              <td><strong dir="ltr">{String(row.name ?? '')}</strong><br /><small className="muted">{String(row.displayName ?? '')}</small></td>
              <td>{String(row.startupType ?? row.startType ?? '—')}</td>
              <td>{row.delayedAuto == null ? <span className="muted">{t('common.unavailable')}</span> : (row.delayedAuto ? <span className="pill pill-muted">{t('common.yes')}</span> : <span className="muted">{t('common.no')}</span>)}</td>
              <td dir="ltr">{row.processId ? String(row.processId) : '—'}</td>
              <td><code dir="ltr" title={String(row.account ?? '')}>{truncate(String(row.account ?? '—'), 28)}</code></td>
              <td>{row.protected ? <span className="pill pill-danger">{t('services.protected')}</span> : <span className="muted">{t('common.no')}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <NoResults />}
    </div>
  );
}

export function SystemTables({ result }: { result: ToolResult }) {
  const { t, locale } = useStore();
  if (result.toolId === 'event-warnings') {
    const items = result.items as Array<Record<string, unknown>>;
    const summary = result.summary as Record<string, unknown>;
    return (
      <div className="data-table-wrap">
        <p className="muted small">
          {t('system.boundedQuery')} · {t('common.period')}: {String(summary.periodDays ?? '—')} {t('common.days')} · {t('system.maxEvents')}: {String(summary.maxEvents ?? '—')}
        </p>
        <table className="data-table">
          <thead><tr><th>{t('system.provider')}</th><th>{t('system.eventId')}</th><th>{t('system.count')}</th><th>{t('system.latest')}</th><th>{t('system.level')}</th></tr></thead>
          <tbody>
            {items.slice(0, 100).map((row, i) => (
              <tr key={i}>
                <td>{String(row.provider ?? row.ProviderName ?? '—')}</td>
                <td dir="ltr">{String(row.eventId ?? row.Id ?? '—')}</td>
                <td dir="ltr">{formatCount(row.frequency ?? row.count, locale)}</td>
                <td dir="ltr">{row.latestOccurrence || row.latest ? formatDateTime(row.latestOccurrence ?? row.latest, locale) : '—'}</td>
                <td>{String(row.level ?? '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <NoResults />}
      </div>
    );
  }
  if (result.toolId === 'process-inventory') {
    const items = result.items as Array<Record<string, unknown>>;
    const summary = result.summary as Record<string, unknown>;
    return (
      <div className="data-table-wrap">
        <p className="muted small">
          {t('system.signatureChecked')}: {formatCount(summary.signatureChecked, locale)} / {formatCount(summary.processes, locale)}
          {summary.signatureBudgetExhausted ? ` · ${t('system.signatureBudget')}` : ''}
        </p>
        <table className="data-table">
          <thead><tr><th>{t('system.processes')}</th><th>PPID</th><th>{t('system.workingSet')}</th><th>{t('system.cpuTime')}</th><th>{t('system.signature')}</th></tr></thead>
          <tbody>
            {items.slice(0, 200).map((row, i) => (
              <tr key={i}>
                <td>
                  <strong dir="ltr">{String(row.name ?? row.ProcessName ?? '—')}</strong>{' '}
                  <small className="muted" dir="ltr">#{String(row.processId ?? row.Id ?? '')}</small>
                  {row.executablePath ? <><br /><code dir="ltr" className="muted small">{truncate(String(row.executablePath), 70)}</code></> : null}
                </td>
                <td dir="ltr">{row.parentProcessId == null ? '—' : String(row.parentProcessId)}</td>
                <td dir="ltr">{formatBytes(row.workingSetBytes ?? row.WS, locale)}</td>
                <td dir="ltr">{row.cpuSeconds == null ? String(row.CPU ?? '—') : `${String(row.cpuSeconds)} s`}</td>
                <td>{row.signatureAvailable ? <span className={`pill pill-${row.signatureStatus === 'Valid' ? 'ok' : 'muted'}`}>{String(row.signatureStatus)}</span> : <span className="muted">{t('common.notChecked')}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

export function NetworkTables({ result }: { result: ToolResult }) {
  const { t } = useStore();
  if (result.toolId !== 'network-diagnostics') return null;
  const items = result.items as Array<Record<string, unknown>>;
  const summary = result.summary as Record<string, unknown>;
  return (
    <div className="data-table-wrap">
      <p className="muted small">{t('network.diagnosticsOnly')} · <code dir="ltr">{String(summary.provider ?? '')}</code></p>
      <table className="data-table">
        <thead><tr><th>{t('network.adapter')}</th><th>{t('services.status')}</th><th>IPv4</th><th>IPv6</th><th>{t('network.gateway')}</th><th>DNS</th><th>{t('network.dhcp')}</th><th>{t('network.linkSpeed')}</th></tr></thead>
        <tbody>
          {items.map((row, i) => {
            const ipv4 = Array.isArray(row.ipv4) ? (row.ipv4 as Array<Record<string, unknown>>) : [];
            const ipv6 = Array.isArray(row.ipv6) ? (row.ipv6 as Array<Record<string, unknown>>) : [];
            const dns = Array.isArray(row.dnsServers) ? (row.dnsServers as string[]) : [];
            return (
              <tr key={i}>
                <td><strong dir="ltr">{String(row.name ?? '—')}</strong><br /><small className="muted">{String(row.description ?? '')}</small></td>
                <td><span className={`pill pill-${/Up$/i.test(String(row.status ?? '')) ? 'ok' : 'muted'}`}>{String(row.status ?? '—')}</span></td>
                <td dir="ltr"><code>{ipv4.map(a => String(a.address ?? '')).join(', ') || '—'}</code></td>
                <td dir="ltr"><code>{ipv6.map(a => String(a.address ?? '')).join(', ') || '—'}</code></td>
                <td dir="ltr"><code>{String(row.defaultGateway ?? '—')}</code></td>
                <td dir="ltr"><code>{dns.join(', ') || '—'}</code></td>
                <td>{String(row.dhcp ?? '—')}</td>
                <td dir="ltr">{String(row.linkSpeed ?? '—')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 && <NoResults />}
    </div>
  );
}

export function HardwareTables({ result }: { result: ToolResult }) {
  const { t, locale } = useStore();
  if (result.toolId === 'battery-status') {
    const items = result.items as Array<Record<string, unknown>>;
    const summary = result.summary as Record<string, unknown>;
    if (items.length === 0) return <p className="muted">{t('hardware.noBattery')}</p>;
    return (
      <div className="data-table-wrap">
        {items.map((row, index) => (
          <dl className="kv-grid" key={index}>
            <div><dt>{t('hardware.chargeRemaining')}</dt><dd dir="ltr">{row.chargePercent == null ? t('common.unavailable') : `${formatCount(row.chargePercent, locale)}%`}</dd></div>
            <div><dt>{t('hardware.batteryStatus')}</dt><dd dir="ltr">{String(row.batteryStatus ?? '—')}</dd></div>
            <div><dt>{t('hardware.powerOnline')}</dt><dd dir="ltr">{row.powerOnline == null ? t('common.unavailable') : (row.powerOnline ? t('common.yes') : t('common.no'))}</dd></div>
            <div><dt>{t('hardware.designCapacity')}</dt><dd dir="ltr">{row.designCapacityMilliWatts == null ? t('common.unavailable') : formatCount(row.designCapacityMilliWatts, locale)}</dd></div>
            <div><dt>{t('hardware.cycleCount')}</dt><dd dir="ltr"><span className="pill pill-muted">{t('common.unavailable')}</span></dd></div>
            <div><dt>{t('hardware.temperature')}</dt><dd dir="ltr"><span className="pill pill-muted">{t('common.unavailable')}</span></dd></div>
          </dl>
        ))}
        <p className="muted small">{String(summary.unavailableReason ?? '')}</p>
      </div>
    );
  }
  if (result.toolId === 'hardware-inventory') {
    const item = (result.items[0] ?? {}) as Record<string, unknown>;
    const cpu = (Array.isArray(item.cpu) ? (item.cpu as Array<Record<string, unknown>>)[0] : {}) ?? {};
    const gpu = Array.isArray(item.gpu) ? (item.gpu as Array<Record<string, unknown>>) : [];
    const bios = Array.isArray(item.bios) ? (item.bios as Array<Record<string, unknown>>)[0] : {};
    const memory = Array.isArray(item.memoryModules) ? (item.memoryModules as Array<Record<string, unknown>>) : [];
    const problems = Array.isArray(item.problemDevices) ? (item.problemDevices as Array<Record<string, unknown>>) : [];
    return (
      <div className="data-table-wrap">
        <dl className="kv-grid">
          <div><dt>{t('hardware.cpu')}</dt><dd dir="auto">{String(cpu.name ?? '—')}</dd></div>
          <div><dt>{t('hardware.cores')}</dt><dd dir="ltr">{cpu.cores == null ? t('common.unavailable') : `${String(cpu.cores)} / ${String(cpu.logicalProcessors ?? '—')}`}</dd></div>
          <div><dt>{t('hardware.bios')}</dt><dd dir="auto">{[bios.manufacturer, bios.version].filter(Boolean).join(' ') || '—'}</dd></div>
          <div><dt>{t('hardware.memoryModules')}</dt><dd dir="ltr">{memory.length ? formatBytes(memory.reduce((sum, m) => sum + (Number(m.capacityBytes) || 0), 0), locale) : t('common.unavailable')}</dd></div>
          <div><dt>{t('hardware.gpu')}</dt><dd>{gpu.length ? gpu.map(g => String(g.name ?? '')).join(', ') : t('common.unavailable')}</dd></div>
          <div><dt>{t('hardware.temperature')}</dt><dd><span className="pill pill-muted">{t('common.unavailable')}</span></dd></div>
        </dl>
        {problems.length > 0 && (
          <table className="data-table">
            <thead><tr><th>{t('hardware.problemDevices')}</th><th>{t('hardware.problemCode')}</th><th>PNP</th></tr></thead>
            <tbody>
              {problems.slice(0, 50).map((device, i) => (
                <tr key={i}>
                  <td>{String(device.name ?? '—')}</td>
                  <td dir="ltr"><span className="pill pill-danger">{String(device.problemCode ?? '—')}</span></td>
                  <td><code dir="ltr" title={String(device.pnpDeviceId ?? '')}>{truncate(String(device.pnpDeviceId ?? '—'), 60)}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted small">{t('hardware.temperatureReason')}: {String((item.temperatures as { reason?: string } | undefined)?.reason ?? '')}</p>
      </div>
    );
  }
  return null;
}
