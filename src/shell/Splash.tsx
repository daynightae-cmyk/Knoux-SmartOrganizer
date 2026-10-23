import { useStore } from '../state/store';

/**
 * The first frame of the product.
 *
 * It covers the shell while the preload bridge answers, prints the identity
 * rather than a bare "loading", and leaves as soon as the store is booted. No
 * invented progress: the bar sweeps because the wait is indeterminate, and it
 * stops sweeping entirely under reduced-motion.
 */
export default function Splash() {
  const { t } = useStore();
  return (
    <div className="splash" role="status" aria-live="polite">
      <span className="splash__mark" aria-hidden="true">K</span>
      <div className="splash__lockup">
        <strong>KNOuX</strong>
        <small>SmartOrganizer</small>
      </div>
      <span className="splash__bar" aria-hidden="true"><i /></span>
      <p className="muted small">{t('common.loading')}</p>
    </div>
  );
}
