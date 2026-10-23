/**
 * The content every service card opens into.
 *
 * The catalogue (`service-catalog.ts`) says what a service *is* and whether it
 * runs today. This module says what opening it shows: why the service exists,
 * the steps it performs, the shape of what it returns, and how much authority
 * it needs. Every string is authored per service in both languages — there is
 * no generated filler, because a preview that recites the card again is not a
 * preview.
 *
 * Honesty rule: a planned service still gets a complete, explorable design
 * preview. What it never gets is an enabled Run control. That distinction is
 * carried by the catalogue state, not by the copy, so the copy can describe the
 * intended behaviour without ever implying it happens today.
 */

import type { Locale } from '../locales';
import type { ServiceDefinition, WorkspaceKind } from './service-catalog';
import { cleanupPreviews } from './previews/cleanup';
import { startupPreviews } from './previews/startup';
import { systemPreviews } from './previews/system';
import { repairPreviews } from './previews/repair';
import { servicesPreviews } from './previews/services';
import { networkPreviews } from './previews/network';
import { hardwarePreviews } from './previews/hardware';
import { applicationPreviews } from './previews/applications';
import { filePreviews } from './previews/files';
import { storagePreviews } from './previews/storage';
import { automationPreviews } from './previews/automation';

export type Text = { ar: string; en: string };

/**
 * How much the service can change, in the only four categories the product
 * actually distinguishes. `read-only` never writes; `reversible` writes inside
 * an undoable journal; `changes-system` alters Windows itself; `needs-admin`
 * additionally requires elevation before any of that can start.
 */
export type ServiceRisk = 'read-only' | 'reversible' | 'changes-system' | 'needs-admin';

export interface PreviewText {
  /** One sentence: what problem this service solves for the person using it. */
  purpose: Text;
  /** The ordered steps the service performs. Three to five, imperative. */
  steps: Text[];
  /** What the result actually contains — a ledger, a verdict, a plan. */
  output: Text;
  risk: ServiceRisk;
  /**
   * Configuration controls the preview presents. Omitted for services whose
   * only input is the world's current selection.
   */
  inputs?: PreviewInput[];
}

export interface PreviewInput {
  kind: 'folder' | 'number' | 'toggle' | 'select' | 'text';
  label: Text;
  /** Sample option labels for a select, or a unit hint for a number. */
  options?: Text[];
  hint?: Text;
}

export const riskLabels: Record<ServiceRisk, Text> = {
  'read-only': { ar: 'قراءة فقط — لا يكتب شيئًا', en: 'Read-only — writes nothing' },
  reversible: { ar: 'قابل للتراجع من السجل', en: 'Reversible from the journal' },
  'changes-system': { ar: 'يغيّر إعدادات Windows', en: 'Changes Windows settings' },
  'needs-admin': { ar: 'يتطلب صلاحيات مسؤول', en: 'Requires administrator rights' }
};

/** What kind of surface a service opens, in the words the card shows. */
export const workspaceLabels: Record<WorkspaceKind, Text> = {
  inventory: { ar: 'جرد', en: 'Inventory' },
  search: { ar: 'بحث', en: 'Search' },
  map: { ar: 'خريطة', en: 'Map' },
  review: { ar: 'مراجعة', en: 'Review' },
  monitor: { ar: 'مراقبة', en: 'Monitor' },
  wizard: { ar: 'معالج', en: 'Wizard' },
  console: { ar: 'وحدة أوامر', en: 'Console' },
  atlas: { ar: 'أطلس', en: 'Atlas' },
  scheduler: { ar: 'جدولة', en: 'Schedule' },
  inspector: { ar: 'فاحص', en: 'Inspector' },
  report: { ar: 'تقرير', en: 'Report' },
  matrix: { ar: 'مصفوفة', en: 'Matrix' }
};


/**
 * The control layout a workspace kind presents when a service does not declare
 * its own. These are presentation shapes, not fabricated values: every control
 * starts empty, and the preview says so.
 */
export const workspaceInputs: Record<WorkspaceKind, PreviewInput[]> = {
  inventory: [],
  search: [{ kind: 'text', label: { ar: 'نمط البحث', en: 'Search pattern' }, hint: { ar: 'اسم أو امتداد', en: 'Name or extension' } }],
  map: [{ kind: 'folder', label: { ar: 'المجلد الجذر', en: 'Root folder' } }],
  review: [],
  monitor: [{ kind: 'select', label: { ar: 'الفاصل الزمني', en: 'Interval' }, options: [{ ar: '١٠ ثوانٍ', en: '10 seconds' }, { ar: '٦٠ ثانية', en: '60 seconds' }] }],
  wizard: [{ kind: 'folder', label: { ar: 'النطاق', en: 'Scope' } }],
  console: [],
  atlas: [],
  scheduler: [{ kind: 'select', label: { ar: 'التكرار', en: 'Repeat' }, options: [{ ar: 'يوميًا', en: 'Daily' }, { ar: 'أسبوعيًا', en: 'Weekly' }] }],
  inspector: [],
  report: [],
  matrix: []
};

const allPreviews: Record<string, PreviewText> = {
  ...cleanupPreviews,
  ...startupPreviews,
  ...systemPreviews,
  ...repairPreviews,
  ...servicesPreviews,
  ...networkPreviews,
  ...hardwarePreviews,
  ...applicationPreviews,
  ...filePreviews,
  ...storagePreviews,
  ...automationPreviews
};

export function previewFor(service: ServiceDefinition): PreviewText | null {
  return allPreviews[service.id] ?? null;
}

export function inputsFor(service: ServiceDefinition, preview: PreviewText): PreviewInput[] {
  return preview.inputs ?? workspaceInputs[service.workspace] ?? [];
}

export function pick(text: Text, locale: Locale): string {
  return locale === 'ar' ? text.ar : text.en;
}

/** Every authored preview id, for the integrity test. */
export const previewIds: readonly string[] = Object.keys(allPreviews);
