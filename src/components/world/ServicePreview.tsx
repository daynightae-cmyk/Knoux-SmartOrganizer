import { useEffect, useRef, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { AlertTriangle, CheckCircle2, Cpu, Lock, ShieldCheck, X } from 'lucide-react';
import type { ToolDefinition } from '@shared/contracts';
import { stateLabelKey, type ServiceDefinition, type WorldDefinition } from '../../lib/service-catalog';
import { inputsFor, pick, riskLabels, workspaceLabels, type PreviewText } from '../../lib/service-preview';
import type { Locale } from '../../locales';

/**
 * The preview every card opens.
 *
 * It answers four questions in order — why the service exists, what you would
 * configure, what it does step by step, and what you get back — then states the
 * authority it needs. A service with a real engine offers "Run in workspace",
 * which hands over to the existing runner rather than duplicating it; a service
 * without one shows the same design and disables exactly that one control.
 */
interface ServicePreviewProps {
  service: ServiceDefinition;
  preview: PreviewText | null;
  world: WorldDefinition;
  tool: ToolDefinition | null;
  locale: Locale;
  t: (key: string) => string;
  focus: 'preview' | 'details';
  onClose: () => void;
  onRun?: () => void;
}

export function ServicePreview({ service, preview, world, tool, locale, t, focus, onClose, onRun }: ServicePreviewProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // The dialog holds focus while it is open and hands it back to the card that
  // opened it. Without the return, closing a preview drops the reader at the top
  // of the document with no idea where they were.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
    if (focus === 'details') {
      const target = bodyRef.current?.querySelector('#svc-preview-details');
      target?.scrollIntoView({ block: 'start' });
    }
  }, [focus, service.id]);

  /** Tab cycles inside the panel instead of wandering into the page behind it. */
  const trapTab = (event: ReactKeyboardEvent) => {
    if (event.key !== 'Tab' || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(node => !node.hasAttribute('disabled') && node.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  };

  const inputs = preview ? inputsFor(service, preview) : [];
  const risk = preview ? riskLabels[preview.risk] : null;
  const runs = Boolean(onRun) && service.state !== 'planned';
  const unavailable = tool && tool.availability.available === false ? tool.availability.reason : null;

  return (
    <div className="svc-preview" role="presentation">
      <button type="button" className="svc-preview__scrim" onClick={onClose} aria-label={t('svc.preview.close')} />
      <section
        ref={panelRef}
        className={`svc-preview__panel svc-preview__panel--${service.state}`}
        style={{ '--svc-hue': world.accent.hue } as CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-labelledby="svc-preview-title"
        onKeyDown={trapTab}
        data-service={service.id}
      >
        <header className="svc-preview__head">
          <div>
            <p className="svc-preview__eyebrow">{t(world.labelKey)} · {pick(workspaceLabels[service.workspace], locale)}</p>
            <h2 id="svc-preview-title">{t(service.nameKey)}</h2>
          </div>
          <div className="svc-preview__head-actions">
            <span className={`svc-card__state svc-card__state--${service.state}`}>{t(stateLabelKey(service.state))}</span>
            <button ref={closeRef} type="button" className="svc-preview__close" onClick={onClose} aria-label={t('svc.preview.close')}>
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="svc-preview__body" ref={bodyRef}>
          <p className="svc-preview__lead">{t(service.summaryKey)}</p>

          {!preview && <p className="svc-preview__note">{t('svc.preview.noPreview')}</p>}

          {preview && (
            <>
              <section className="svc-preview__block">
                <h3>{t('svc.preview.purpose')}</h3>
                <p>{pick(preview.purpose, locale)}</p>
              </section>

              <section className="svc-preview__block">
                <h3>{t('svc.preview.config')}</h3>
                {inputs.length === 0 && <p className="svc-preview__muted">{t('svc.preview.noInputs')}</p>}
                {inputs.length > 0 && (
                  <div className="svc-preview__inputs">
                    {inputs.map((input, index) => (
                      <label key={index} className="svc-preview__input">
                        <span>{pick(input.label, locale)}</span>
                        {input.kind === 'select' ? (
                          <select disabled defaultValue="">
                            <option value="">{t('svc.preview.empty')}</option>
                            {input.options?.map(option => <option key={option.en}>{pick(option, locale)}</option>)}
                          </select>
                        ) : input.kind === 'toggle' ? (
                          <input type="checkbox" disabled />
                        ) : (
                          <input type={input.kind === 'number' ? 'number' : 'text'} disabled placeholder={input.hint ? pick(input.hint, locale) : '—'} />
                        )}
                        {input.hint && <small>{pick(input.hint, locale)}</small>}
                      </label>
                    ))}
                  </div>
                )}
              </section>

              <section className="svc-preview__block" id="svc-preview-details">
                <h3>{t('svc.preview.workflow')}</h3>
                <ol className="svc-preview__steps">
                  {preview.steps.map((step, index) => (
                    <li key={index}>
                      <span className="svc-preview__step-n" aria-hidden="true">{index + 1}</span>
                      <span>{pick(step, locale)}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="svc-preview__block">
                <h3>{t('svc.preview.output')}</h3>
                <p>{pick(preview.output, locale)}</p>
              </section>

              <section className="svc-preview__block svc-preview__block--authority">
                <h3>{t('svc.preview.risk')}</h3>
                <p className="svc-preview__risk">
                  {preview.risk === 'read-only' || preview.risk === 'reversible' ? <ShieldCheck size={15} /> : <AlertTriangle size={15} />}
                  {risk ? pick(risk, locale) : null}
                </p>
                {service.limitKey && (
                  <p className="svc-preview__limit">
                    <Lock size={14} />
                    <span><strong>{t('svc.preview.limit')}: </strong>{t(service.limitKey)}</span>
                  </p>
                )}
                {service.requiresAdmin && !service.limitKey && (
                  <p className="svc-preview__limit">
                    <Lock size={14} />
                    <span>{t('svc.preview.admin')}</span>
                  </p>
                )}
              </section>

              {service.engine && (
                <section className="svc-preview__engine">
                  <Cpu size={14} />
                  <span>{t('svc.preview.engine')}: <code>{service.engine}</code></span>
                  {unavailable && <span className="svc-preview__engine-note">{unavailable}</span>}
                </section>
              )}

              {service.state !== 'operational' && (
                <p className="svc-preview__design">
                  <AlertTriangle size={15} />
                  {t('svc.preview.design')}
                </p>
              )}
              {service.state === 'operational' && (
                <p className="svc-preview__design svc-preview__design--live">
                  <CheckCircle2 size={15} />
                  {t('svc.preview.live')}
                </p>
              )}
            </>
          )}
        </div>

        <footer className="svc-preview__foot">
          <button type="button" className="svc-preview__ghost" onClick={onClose}>{t('svc.preview.close')}</button>
          <button
            type="button"
            className="svc-preview__run"
            onClick={onRun}
            disabled={!runs || !onRun}
            title={!runs ? t('svc.preview.unavailable') : undefined}
          >
            {service.state === 'planned' ? t('svc.preview.unavailable') : t('svc.preview.run')}
          </button>
        </footer>
      </section>
    </div>
  );
}
