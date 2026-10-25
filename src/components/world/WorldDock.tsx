import { ArrowRight, RefreshCw } from 'lucide-react';
import { useStore } from '../../state/store';
import { formatBytes, formatCount } from '../../lib/format';
import type { PageId } from '../../lib/pages';

/**
 * The bottom decision bar every approved workspace carries.
 *
 * It says what this world measured, in the world's own words, and offers the
 * two actions that actually exist: re-run the read-only engine the page already
 * runs when it opens, and move to the next workspace. It never implies that a
 * change was made, and it keeps the same shape whether or not the engine has
 * answered.
 */
const dockCopy = {
  cleanup: {
    en: { idle: 'Nothing measured yet', busy: 'Reading temporary files…', ready: (v: { n: string; b?: string }) => `${v.n} candidate files · ${v.b}`, detail: 'Quarantine stays behind its own confirmation. Nothing here deletes.', reread: 'Read again', next: 'Open the volume atlas', page: 'storage' as PageId },
    ar: { idle: 'لم يُقَس شيء بعد', busy: 'تُقرأ الملفات المؤقتة…', ready: (v: { n: string; b?: string }) => `${v.n} ملف مرشح · ${v.b}`, detail: 'الحجر يبقى خلف تأكيده الخاص. لا شيء هنا يحذف.', reread: 'إعادة القراءة', next: 'افتح أطلس الأحجام', page: 'storage' as PageId }
  },
  startup: {
    en: { idle: 'The register has not been read', busy: 'Reading startup sources…', ready: (v: { n: string; b?: string }) => `${v.n} startup entries read`, detail: 'Disabling is reversible and stays inside your own key.', reread: 'Read again', next: 'Open service commander', page: 'services' as PageId },
    ar: { idle: 'لم يُقرأ السجل بعد', busy: 'تُقرأ مصادر بدء التشغيل…', ready: (v: { n: string; b?: string }) => `${v.n} عنصر بدء تشغيل`, detail: 'التعطيل قابل للعكس ويبقى داخل مفتاحك.', reread: 'إعادة القراءة', next: 'افتح آمر الخدمات', page: 'services' as PageId }
  },
  system: {
    en: { idle: 'Awaiting the first sample', busy: 'Taking a Windows sample…', ready: (v: { n: string; b?: string }) => `${v.n} processes observed`, detail: 'One genuine reading is shown as one. History needs more than one point.', reread: 'Sample again', next: 'Open hardware', page: 'hardware' as PageId },
    ar: { idle: 'بانتظار أول عيّنة', busy: 'تُؤخذ عيّنة من Windows…', ready: (v: { n: string; b?: string }) => `${v.n} عملية مرصودة`, detail: 'قراءة واحدة حقيقية تُعرض كواحدة.', reread: 'عيّنة جديدة', next: 'افتح العتاد', page: 'hardware' as PageId }
  },
  services: {
    en: { idle: 'The service register has not been read', busy: 'Reading Windows services…', ready: (v: { n: string; b?: string }) => `${v.n} services discovered`, detail: 'Protected services refuse every change from here.', reread: 'Read again', next: 'Open boot control', page: 'startup' as PageId },
    ar: { idle: 'لم يُقرأ سجل الخدمات', busy: 'تُقرأ خدمات Windows…', ready: (v: { n: string; b?: string }) => `${v.n} خدمة مكتشفة`, detail: 'الخدمات المحمية ترفض كل تغيير من هنا.', reread: 'إعادة القراءة', next: 'افتح تحكم الإقلاع', page: 'startup' as PageId }
  }
} as const;

const engines: Record<keyof typeof dockCopy, { id: string; args: Record<string, unknown> }> = {
  cleanup: { id: 'temp-cleanup-preview', args: { limit: 500 } },
  startup: { id: 'startup-items', args: {} },
  system: { id: 'system-health', args: {} },
  services: { id: 'services-inventory', args: { limit: 2000 } }
};

export function WorldDock({ world, count, bytes, tone }: {
  world: keyof typeof dockCopy;
  /** Measured item count, or null while nothing has answered. */
  count: number | null;
  /** Measured bytes where the world reports them. */
  bytes?: number | null;
  tone: 'idle' | 'busy' | 'ready';
}) {
  const { locale, runById, setPage } = useStore();
  const copy = dockCopy[world][locale];
  const engine = engines[world];
  const status = tone === 'ready' && count != null
    ? (bytes != null ? copy.ready({ n: formatCount(count, locale), b: formatBytes(bytes, locale) }) : copy.ready({ n: formatCount(count, locale) }))
    : tone === 'busy' ? copy.busy : copy.idle;
  return (
    <footer className={`world-dock world-dock--${tone}`} aria-label={copy.next}>
      <span className="world-dock__mark" aria-hidden="true" />
      <div className="world-dock__read">
        <b>{status}</b>
        <small>{copy.detail}</small>
      </div>
      <div className="world-dock__actions">
        <button type="button" className="world-control" disabled={tone === 'busy'} onClick={() => void runById(engine.id, engine.args, true)}>
          <RefreshCw size={14} />{copy.reread}
        </button>
        <button type="button" className="world-control world-control--primary" onClick={() => setPage(copy.page)}>
          {copy.next}<ArrowRight size={15} />
        </button>
      </div>
    </footer>
  );
}
