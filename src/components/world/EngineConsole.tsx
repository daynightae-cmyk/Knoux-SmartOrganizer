import { useState, type ReactNode } from 'react';
import { useStore } from '../../state/store';
import { resolveTool } from '../../lib/guards';
import { ToolRunner } from '../tools/ToolRunner';
import { StagePanel, StageEmpty, StageChips } from './Stage';
import { OperationEvidence, VerificationPanel, AppTables, FileTables, HardwareTables, NetworkTables, ServiceTables, StartupTables, StorageTables, SystemTables } from '../../pages/renderers';
import { ServicesRail } from './ServicesRail';
import type { WorldId } from '../../lib/service-catalog';
import type { Locale } from '../../locales';

/**
 * The console every specialist world runs its registered engines from.
 *
 * It holds no rendering logic of its own: the result is handed to the same
 * table renderers the rest of the application uses, so a specialist page can
 * never show a column the engine did not return. What it adds is the world's
 * own scope — which of its engines is in front of the person, the live phase
 * while one runs, and an honest empty state before anything has been read.
 */
export function EngineConsole({ title, hint, engines, emptyTitle, emptyNote }: {
  title: string;
  hint?: string;
  engines: string[];
  emptyTitle: string;
  emptyNote: string;
}) {
  const { tools, result, folder, file, t, locale } = useStore();
  const [picked, setPicked] = useState(engines[0]);
  const tool = resolveTool(tools, picked);
  const scoped = result && engines.includes(result.toolId) ? result : null;

  return (
    <StagePanel
      title={title}
      hint={hint}
      actions={engines.length > 1 ? (
        <div className="world-control-group" role="group" aria-label={title}>
          {engines.map(id => {
            const item = resolveTool(tools, id);
            return (
              <button key={id} type="button" aria-pressed={id === picked} onClick={() => setPicked(id)}>
                {item ? t(item.nameKey) : id}
              </button>
            );
          })}
        </div>
      ) : undefined}
    >
      {tool
        ? <ToolRunner tool={tool} folder={folder} file={file} />
        : <StageEmpty title={emptyTitle} note={emptyNote} />}
      {tool && !scoped && <StageEmpty title={emptyTitle} note={emptyNote} />}
      {scoped && (
        <div className="category-tables">
          <OperationEvidence result={scoped} />
          <VerificationPanel result={scoped} />
          <StorageTables result={scoped} />
          <FileTables result={scoped} />
          <StartupTables result={scoped} />
          <AppTables result={scoped} />
          <ServiceTables result={scoped} />
          <SystemTables result={scoped} />
          <NetworkTables result={scoped} />
          <HardwareTables result={scoped} />
        </div>
      )}
      <p className="muted small">{t('stage.consoleNote')} · {locale === 'ar' ? 'المحركات: ' : 'Engines: '}{engines.join(', ')}</p>
    </StagePanel>
  );
}

/** The twelve-card ledger, wired the same way in every world. */
export function WorldLedger({ world, invoke, t, locale }: { world: WorldId; invoke?: Record<string, (() => void) | undefined>; t: (key: string) => string; locale: Locale }) {
  return (
    <ServicesRail
      world={world}
      titleKey="svc.services.title"
      hintKey="svc.services.hint"
      liveKey="world.page.liveOf"
      invoke={invoke}
      t={t}
      locale={locale}
    />
  );
}

/** A strip of availability chips for the engines a world can actually run. */
export function EngineChips({ engines }: { engines: Array<{ id: string; label: string; available: boolean; reason?: string }> }) {
  return (
    <StageChips items={engines.map(engine => ({
      label: engine.available ? engine.label : `${engine.label} — ${engine.reason ?? ''}`.trim(),
      tone: engine.available ? 'live' as const : undefined
    }))} />
  );
}

/** Small helper so a page can show a real summary number or nothing at all. */
export function summaryNumber(result: { summary: Record<string, unknown> } | null, key: string): number | null {
  const value = Number(result?.summary?.[key]);
  return Number.isFinite(value) ? value : null;
}

/**
 * Total one numeric field across returned items, trying the names engines
 * actually use. Returns null when no item carried the field, so a page shows an
 * em dash instead of a zero it invented.
 */
export function sumField(items: readonly unknown[], keys: string[]): number | null {
  let total = 0;
  let seen = false;
  for (const raw of items) {
    const item = raw as Record<string, unknown>;
    for (const key of keys) {
      const value = Number(item?.[key]);
      if (Number.isFinite(value)) { total += value; seen = true; break; }
    }
  }
  return seen ? total : null;
}

/** The first present field, so a rail can name a real value or stay silent. */
export function field(items: readonly unknown[], index: number, keys: string[]): string | null {
  const item = items[index] as Record<string, unknown> | undefined;
  if (!item) return null;
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

export type StageChild = ReactNode;
