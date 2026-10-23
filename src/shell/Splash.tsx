import { Cpu, LockKeyhole, ShieldCheck } from 'lucide-react';
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
        <em>{t('stage.splash.tagline')}</em>
      </div>
      <span className="splash__bar" aria-hidden="true"><i /></span>
      <p className="muted small">{t('stage.splash.working')}</p>
      <div className="splash__badges">
        <span><LockKeyhole size={13} aria-hidden="true" />{t('common.local')}</span>
        <span><ShieldCheck size={13} aria-hidden="true" />{t('stage.splash.private')}</span>
        <span><Cpu size={13} aria-hidden="true" />{t('stage.splash.powerful')}</span>
      </div>
    </div>
  );
}
