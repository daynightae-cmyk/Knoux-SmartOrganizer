import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  Archive, BookOpen, Box, Code2, Disc3, FileText, Film, Globe, Images, Layers3,
  Music2, PackageOpen, PenTool, Presentation, SlidersHorizontal, Table2, Type,
  FileType, X, type LucideIcon
} from 'lucide-react';
import type { FileInfo, Source, StudioBridge, StudioCategoryKey, ThumbnailResult } from './types';

export const CATEGORY_ICONS: Record<StudioCategoryKey, LucideIcon> = {
  image: Images,
  video: Film,
  audio: Music2,
  document: FileText,
  spreadsheet: Table2,
  presentation: Presentation,
  pdf: FileType,
  archive: Archive,
  installer: PackageOpen,
  code: Code2,
  markup: Globe,
  config: SlidersHorizontal,
  font: Type,
  design: PenTool,
  model: Box,
  ebook: BookOpen,
  discImage: Disc3,
  other: Layers3
};

export function CategoryIcon({ category, size = 18 }: { category: StudioCategoryKey; size?: number }) {
  const Icon = CATEGORY_ICONS[category] || FileText;
  return <Icon size={size} aria-hidden="true" />;
}

const thumbCache = new Map<string, string | null>();
const thumbPending = new Map<string, Promise<ThumbnailResult>>();
const THUMB_CACHE_LIMIT = 64;

function cacheThumb(key: string, value: string | null) {
  thumbCache.set(key, value);
  while (thumbCache.size > THUMB_CACHE_LIMIT) {
    const oldest = thumbCache.keys().next().value;
    if (oldest === undefined) break;
    thumbCache.delete(oldest);
  }
}

function requestThumb(bridge: StudioBridge, inventoryId: string, fileId: number): Promise<ThumbnailResult> {
  const key = `${inventoryId}:${fileId}`;
  const pending = thumbPending.get(key);
  if (pending) return pending;
  const task = bridge.thumbnail({ inventoryId, fileId }).catch(() => ({ thumbnail: null, reason: 'BRIDGE_FAILED' }));
  thumbPending.set(key, task);
  task.finally(() => thumbPending.delete(key));
  return task;
}

export function StudioThumb({
  bridge,
  source,
  file,
  category,
  compact = false
}: {
  bridge: StudioBridge;
  source: Source;
  file: FileInfo;
  category: StudioCategoryKey;
  compact?: boolean;
}) {
  const holder = useRef<HTMLSpanElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'none'>('idle');
  const key = source.inventory ? `${source.inventory.inventoryId}:${file.id}` : '';

  useEffect(() => {
    setSrc(null);
    setState('idle');
    if (!key || !file.hasThumbnail) { setState('none'); return; }
    if (thumbCache.has(key)) {
      const cached = thumbCache.get(key) ?? null;
      setSrc(cached);
      setState(cached ? 'idle' : 'none');
      return;
    }
    const element = holder.current;
    if (!element) return;
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    const load = () => {
      setState('loading');
      requestThumb(bridge, source.inventory!.inventoryId, file.id)
        .then((result) => {
          if (cancelled) return;
          cacheThumb(key, result.thumbnail);
          setSrc(result.thumbnail);
          setState(result.thumbnail ? 'idle' : 'none');
        })
        .catch(() => { if (!cancelled) setState('none'); });
    };
    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer?.disconnect();
          observer = null;
          load();
        }
      }, { rootMargin: '140px' });
      observer.observe(element);
    } else {
      load();
    }
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [bridge, key, file.id, file.hasThumbnail, source.inventory]);

  return (
    <span
      ref={holder}
      className={`st-thumb${compact ? ' st-thumb--compact' : ''}${state === 'loading' ? ' is-loading' : ''}`}
      aria-hidden={src ? undefined : 'true'}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          draggable={false}
          onError={() => { setSrc(null); setState('none'); }}
        />
      ) : (
        <CategoryIcon category={category} size={compact ? 18 : 30} />
      )}
      {state === 'loading' && <i className="st-thumb__shimmer" />}
    </span>
  );
}

export function Text({ children, muted = false, size }: { children: ReactNode; muted?: boolean; size?: 'sm' | 'xs' }) {
  const className = [muted ? 'st-muted' : '', size === 'xs' ? 'st-xs' : size === 'sm' ? 'st-sm' : ''].filter(Boolean).join(' ');
  return <span className={className || undefined}>{children}</span>;
}

export function Badge({
  children,
  tone = 'neutral',
  icon: Icon
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  icon?: LucideIcon;
}) {
  return (
    <span className={`st-badge st-badge--${tone}`}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  max,
  label,
  indeterminate = false
}: {
  value: number;
  max: number;
  label: string;
  indeterminate?: boolean;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div
      className={`st-progress${indeterminate ? ' is-indeterminate' : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max || 100}
      aria-valuenow={indeterminate ? undefined : Math.min(value, max || 0)}
    >
      <i style={indeterminate ? undefined : { inlineSize: `${ratio * 100}%` }} />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  compact = false
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`st-empty${compact ? ' st-empty--compact' : ''}`}>
      <span className="st-empty__icon"><Icon size={compact ? 22 : 30} aria-hidden="true" /></span>
      <strong>{title}</strong>
      {body && <p>{body}</p>}
      {action && <div className="st-empty__action">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  icon: Icon,
  title,
  description,
  actions
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="st-section-head">
      <div className="st-section-head__copy">
        <span className="st-section-head__icon"><Icon size={19} aria-hidden="true" /></span>
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {actions && <div className="st-section-head__actions">{actions}</div>}
    </header>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
  closeLabel
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  closeLabel: string;
}) {
  const panel = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const app = document.getElementById('root');
    const wasInert = app?.inert ?? false;
    if (app) app.inert = true;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const targets = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []);
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handler);
    panel.current?.querySelector<HTMLElement>('input:not(:disabled), button:not(:disabled)')?.focus();
    return () => {
      document.removeEventListener('keydown', handler);
      if (app) app.inert = wasInert;
      previous?.focus();
    };
  }, []);
  const content = (
    <div className="st-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panel} className={`st-modal${wide ? ' st-modal--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="st-modal__head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="st-icon-btn" onClick={onClose} aria-label={closeLabel}>
            <X size={17} />
          </button>
        </header>
        <div className="st-modal__body">{children}</div>
        {footer && <footer className="st-modal__foot">{footer}</footer>}
      </div>
    </div>
  );
  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}

export function formatWhen(iso: string | null | undefined, locale: 'ar' | 'en') {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatWhenMs(ms: number | null | undefined, locale: 'ar' | 'en') {
  if (!Number.isFinite(Number(ms)) || Number(ms) <= 0) return '—';
  return formatWhen(new Date(Number(ms)).toISOString(), locale);
}
