import { Cpu, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useStore } from '../state/store';

/**
 * The first frame of the product.
 *
 * It covers the shell while the preload bridge answers, prints the identity
 * rather than a bare "loading", and leaves as soon as the store is booted. The
 * horizon, stars, aurora bands and orbit geometry are original local CSS: no
 * screenshot, generated art or remote asset is involved. No invented progress:
 * the line sweeps because the wait is indeterminate, and it stops entirely
 * under reduced motion.
 */
export default function Splash() {
  const { t } = useStore();
  return (
    <div className="splash" role="status" aria-live="polite" aria-label={t('stage.splash.working')}>
      <div className="splash__sky" aria-hidden="true">
        <span className="splash__stars" />
        <span className="splash__aurora splash__aurora--violet" />
        <span className="splash__aurora splash__aurora--blue" />
        <span className="splash__planet"><i /></span>
        <span className="splash__horizon"><i /></span>
        <span className="splash__vignette" />
      </div>

      <div className="splash__content">
        <div className="splash__emblem" aria-hidden="true">
          <span className="splash__orbit splash__orbit--outer" />
          <span className="splash__orbit splash__orbit--inner" />
          <span className="splash__mark">K</span>
          <span className="splash__spark splash__spark--one" />
          <span className="splash__spark splash__spark--two" />
        </div>

        <div className="splash__lockup">
          <span className="splash__kicker">{t('stage.splash.kicker')}</span>
          <strong>KNOuX</strong>
          <small>SmartOrganizer</small>
          <em>{t('stage.splash.tagline')}</em>
        </div>

        <div className="splash__console">
          <div className="splash__status">
            <span className="splash__pulse" aria-hidden="true" />
            <span>{t('stage.splash.working')}</span>
            <i>{t('stage.splash.core')}</i>
          </div>
          <span className="splash__bar" aria-hidden="true"><i /></span>
          <div className="splash__badges">
            <span><LockKeyhole size={12} aria-hidden="true" />{t('common.local')}</span>
            <span><ShieldCheck size={12} aria-hidden="true" />{t('stage.splash.private')}</span>
            <span><Cpu size={12} aria-hidden="true" />{t('stage.splash.powerful')}</span>
          </div>
        </div>
      </div>

      <div className="splash__foot" aria-hidden="true">
        <span>KNOuX</span>
        <i />
        <span>{t('stage.splash.footer')}</span>
      </div>
    </div>
  );
}
