import { useMemo, useState } from 'react';
import type { ToolResult } from '@shared/contracts';
import { formatBytes, formatCount, formatDateTime } from '../lib/format';
import { useStore } from '../state/store';

/** Dense operational tables for read-heavy workspaces. All values come from real result items. */

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

export function StorageTables({ result }: { result: ToolResult }) {
  const { t, locale } = useStore();
  const { filter, setFilter, filtered } = useFilter(result.items as Array<Record<string, unknown>>, item => `${item.DeviceID ?? ''} ${item.VolumeName ?? ''}`);
  if (result.toolId !== 'disk-overview' && result.toolId !== 'system-health') return null;
  if (result.toolId === 'system-health') return null;
  return (
    <div className="data-table-wrap">
      <label className="table-filter"><input value={filter} onChange={e => setFilter(e.target.value)} placeholder={t('common.filter')} aria-label={t('common.filter')} /></label>
      <table className="data-table">
        <thead><tr><th>{t('storage.drives')}</th><th>{t('common.used')}</th><th>{t('common.free')}</th><th>{t('common.total')}</th><th>{t('services.status')}</th></tr></thead>
        <tbody>
          {filtered.map((row, i) => (
            <tr key={i}>
              <td dir="ltr"><code>{String(row.DeviceID ?? row.mount ?? '—')}</code><br /><small className="muted">{String(row.VolumeName ?? row.filesystem ?? '')}</small></td>
              <td dir="ltr">{pressureBar(row, locale)}</td>
              <td dir="ltr">{formatBytes(row.freeBytes ?? row.FreeSpace, locale)}</td>
              <td dir="ltr">{formatBytes(row.totalBytes ?? row.Size, locale)}</td>
              <td><span className={`pill pressure-${String(row.pressure ?? 'unknown')}`}>{t(`storage.pressure.${String(row.pressure ?? 'unknown')}`)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="muted">{t('common.noResults')}</p>}
    </div>
  );
}

function pressureBar(row: Record<string, unknown>, locale: 'ar' | 'en') {
  const free = Number(row.freeBytes ?? row.FreeSpace);
  const total = Number(row.totalBytes ?? row.Size);
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
  const { filter, setFilter, filtered } = useFilter(items, item => `${item.path ?? ''} ${item.type ?? ''}`);
  if (!['large-files', 'duplicate-files', 'empty-folders', 'downloads-inventory', 'temp-cleanup-preview', 'organize-downloads-preview'].includes(result.toolId)) return null;
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
      {result.toolId === 'duplicate-files' && <p className="muted small">{t('files.noDeletion')}</p>}
      <label className="table-filter"><input value={filter} onChange={e => setFilter(e.target.value)} placeholder={t('common.filter')} aria-label={t('common.filter')} /></label>
      {groups ? (
        <div className="dup-groups">
          {groups.map(([key, list], gi) => (
            <details key={key} className="dup-group" open={gi < 3}>
              <summary>{t('files.group')} {gi + 1} · {formatCount(list.length, locale)} · {formatBytes(list[0]?.size, locale)} · <code dir="ltr">{String(list[0]?.hash ?? '').slice(0, 16)}…</code></summary>
              <table className="data-table">
                <thead><tr><th>{t('files.path')}</th><th>{t('files.size')}</th><th>{t('files.modified')}</th></tr></thead>
                <tbody>
                  {list.map((row, i) => (
                    <tr key={i}>
                      <td><code dir="ltr" title={String(row.path ?? '')}>{truncate(String(row.path ?? ''), 90)}</code></td>
                      <td dir="ltr">{formatBytes(row.size, locale)}</td>
                      <td dir="ltr">{row.modified ? formatDateTime(row.modified, locale) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          ))}
        </div>
      ) : (
        <table className="data-table">
          <thead><tr><th>{t('files.path')}</th><th>{t('files.size')}</th><th>{t('files.type')}</th><th>{t('files.modified')}</th></tr></thead>
          <tbody>
            {filtered.slice(0, 200).map((row, i) => (
              <tr key={i}>
                <td><code dir="ltr" title={String(row.path ?? row.source ?? '')}>{truncate(String(row.path ?? row.source ?? ''), 80)}</code></td>
                <td dir="ltr">{formatBytes(row.size ?? row.bytes, locale)}</td>
                <td>{String(row.type ?? row.category ?? '—')}</td>
                <td dir="ltr">{row.modified ? formatDateTime(row.modified, locale) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {filtered.length === 0 && <p className="muted">{t('common.noResults')}</p>}
    </div>
  );
}

function truncate(value: string, max: number): string {
  return value.length > max ? `…${value.slice(-(max - 1))}` : value;
}

export function StartupTables({ result }: { result: ToolResult }) {
  const { t } = useStore();
  const items = result.items as Array<Record<string, unknown>>;
  const { filter, setFilter, filtered } = useFilter(items, item => `${item.name ?? ''} ${item.command ?? ''}`);
  if (result.toolId !== 'startup-items') return null;
  return (
    <div className="data-table-wrap">
      <label className="table-filter"><input value={filter} onChange={e => setFilter(e.target.value)} placeholder={t('common.filter')} aria-label={t('common.filter')} /></label>
      <table className="data-table">
        <thead><tr><th>{t('startup.name')}</th><th>{t('startup.command')}</th><th>{t('startup.source')}</th></tr></thead>
        <tbody>
          {filtered.slice(0, 200).map((row, i) => (
            <tr key={i}>
              <td><strong dir="ltr">{String(row.name ?? '—')}</strong></td>
              <td><code dir="ltr" title={String(row.command ?? '')}>{truncate(String(row.command ?? ''), 90)}</code></td>
              <td><code dir="ltr">{String(row.source ?? '')}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AppTables({ result }: { result: ToolResult }) {
  const { t } = useStore();
  const items = result.items as Array<Record<string, unknown>>;
  const { filter, setFilter, filtered } = useFilter(items, item => `${item.Name ?? item.name ?? ''} ${item.Publisher ?? ''}`);
  if (result.toolId !== 'installed-apps') return null;
  return (
    <div className="data-table-wrap">
      <label className="table-filter"><input value={filter} onChange={e => setFilter(e.target.value)} placeholder={t('common.filter')} aria-label={t('common.filter')} /></label>
      <table className="data-table">
        <thead><tr><th>Name</th><th>{t('apps.publisher')}</th><th>{t('apps.version')}</th><th>{t('apps.location')}</th></tr></thead>
        <tbody>
          {filtered.slice(0, 300).map((row, i) => (
            <tr key={i}>
              <td><strong>{String(row.Name ?? row.name ?? '—')}</strong></td>
              <td>{String(row.Publisher ?? '—')}</td>
              <td dir="ltr">{String(row.Version ?? row.version ?? '—')}</td>
              <td>{row.InstallLocation ? <code dir="ltr" title={String(row.InstallLocation)}>{truncate(String(row.InstallLocation), 60)}</code> : <span className="muted">{t('apps.locationMissing')}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ServiceTables({ result }: { result: ToolResult }) {
  const { t } = useStore();
  const items = result.items as Array<Record<string, unknown>>;
  const { filter, setFilter, filtered } = useFilter(items, item => `${item.name ?? ''} ${item.displayName ?? ''}`);
  if (result.toolId !== 'services-inventory') return null;
  return (
    <div className="data-table-wrap">
      <p className="muted small">{t('services.protectedNote')}</p>
      <label className="table-filter"><input value={filter} onChange={e => setFilter(e.target.value)} placeholder={t('services.searchPlaceholder')} aria-label={t('services.searchPlaceholder')} /></label>
      <table className="data-table">
        <thead><tr><th>{t('services.status')}</th><th>Name</th><th>{t('services.startupType')}</th><th>{t('services.protected')}</th></tr></thead>
        <tbody>
          {filtered.slice(0, 500).map((row, i) => (
            <tr key={i}>
              <td><span className="pill">{String(row.status ?? row.state ?? '—')}</span></td>
              <td><strong dir="ltr">{String(row.name ?? '')}</strong><br /><small className="muted">{String(row.displayName ?? '')}</small></td>
              <td>{String(row.startType ?? row.startupType ?? '—')}</td>
              <td>{row.protected ? t('services.protected') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SystemTables({ result }: { result: ToolResult }) {
  const { t, locale } = useStore();
  if (result.toolId === 'event-warnings') {
    const items = result.items as Array<Record<string, unknown>>;
    return (
      <table className="data-table">
        <thead><tr><th>{t('system.provider')}</th><th>{t('system.eventId')}</th><th>{t('system.count')}</th><th>{t('system.latest')}</th></tr></thead>
        <tbody>
          {items.slice(0, 100).map((row, i) => (
            <tr key={i}>
              <td>{String(row.provider ?? row.ProviderName ?? '—')}</td>
              <td dir="ltr">{String(row.eventId ?? row.Id ?? '—')}</td>
              <td dir="ltr">{formatCount(row.count, locale)}</td>
              <td dir="ltr">{row.latest ? formatDateTime(row.latest, locale) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (result.toolId === 'process-inventory') {
    const items = result.items as Array<Record<string, unknown>>;
    return (
      <table className="data-table">
        <thead><tr><th>{t('system.processes')}</th><th>{t('system.workingSet')}</th><th>{t('system.cpuTime')}</th></tr></thead>
        <tbody>
          {items.slice(0, 200).map((row, i) => (
            <tr key={i}>
              <td><strong dir="ltr">{String(row.ProcessName ?? row.name ?? '—')}</strong> <small className="muted" dir="ltr">#{String(row.Id ?? '')}</small></td>
              <td dir="ltr">{formatBytes(row.WS ?? row.workingSet, locale)}</td>
              <td dir="ltr">{String(row.CPU ?? '—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return null;
}

export function NetworkTables({ result }: { result: ToolResult }) {
  const { t } = useStore();
  if (result.toolId !== 'network-diagnostics') return null;
  const items = result.items as Array<Record<string, unknown>>;
  return (
    <table className="data-table">
      <thead><tr><th>{t('network.interface')}</th><th>{t('network.address')}</th><th>{t('network.family')}</th><th>{t('network.mac')}</th></tr></thead>
      <tbody>
        {items.slice(0, 200).map((row, i) => (
          <tr key={i}>
            <td dir="ltr">{String(row.name ?? '—')}</td>
            <td dir="ltr"><code>{String(row.address ?? '')}</code></td>
            <td dir="ltr">{String(row.family ?? '')}</td>
            <td dir="ltr"><code>{String(row.mac ?? '')}</code></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HardwareTables({ result }: { result: ToolResult }) {
  const { t, locale } = useStore();
  if (result.toolId === 'battery-status') {
    const items = result.items as Array<Record<string, unknown>>;
    if (items.length === 0) return <p className="muted">{t('hardware.noBattery')}</p>;
    const row = items[0];
    return (
      <dl className="kv-grid">
        <div><dt>{t('hardware.chargeRemaining')}</dt><dd dir="ltr">{formatCount(row.EstimatedChargeRemaining, locale)}%</dd></div>
        <div><dt>{t('hardware.batteryStatus')}</dt><dd dir="ltr">{String(row.BatteryStatus ?? '—')}</dd></div>
        <div><dt>{t('hardware.designCapacity')}</dt><dd dir="ltr">{formatCount(row.DesignCapacity, locale)}</dd></div>
        <div><dt>{t('hardware.fullChargeCapacity')}</dt><dd dir="ltr">{formatCount(row.FullChargeCapacity, locale)}</dd></div>
      </dl>
    );
  }
  if (result.toolId === 'hardware-inventory') {
    const item = (result.items[0] ?? {}) as Record<string, unknown>;
    const cpu = (item.cpu ?? {}) as Record<string, unknown>;
    return (
      <dl className="kv-grid">
        <div><dt>{t('hardware.cpu')}</dt><dd>{String(cpu.Name ?? result.summary.cpu ?? '—')}</dd></div>
        <div><dt>{t('hardware.gpu')}</dt><dd dir="ltr">{formatCount(result.summary.gpuCount, locale)}</dd></div>
        <div><dt>{t('hardware.bios')}</dt><dd>{String(((item.bios ?? {}) as Record<string, unknown>).Manufacturer ?? '—')}</dd></div>
      </dl>
    );
  }
  return null;
}
