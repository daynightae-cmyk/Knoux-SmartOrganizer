import { Cpu, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useStore } from '../state/store';

/**
 * The first frame of the product.
 *
 * It is a scene, not a spinner: a planet limb lit from the far side, an
 * atmosphere that blooms over the edge of the disc, three star layers, slow
 * aurora light and the identity floating in front of it. Everything is local
 * CSS and a single inline SVG - no screenshot, generated art or remote asset.
 * The composition is complete on the first paint; the motion is ambient so a
 * slow boot stays alive and a fast one is not a half-drawn frame.
 *
 * No invented progress: the line sweeps because the wait is indeterminate, and
 * every loop stops under reduced motion.
 */
export default function Splash() {
  const { t } = useStore();
  return (
    <div className="splash" role="status" aria-live="polite" aria-label={t('stage.splash.working')}>
      <div className="splash__scene" aria-hidden="true">
        <span className="splash__stars splash__stars--far" />
        <span className="splash__stars splash__stars--near" />
        <span className="splash__stars splash__stars--glint" />
        <span className="splash__glow splash__glow--violet" />
        <span className="splash__glow splash__glow--blue" />
        <span className="splash__shoot" />

        <svg className="splash__world" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" focusable="false">
          <defs>
            <radialGradient id="knx-splash-sun" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#c7e6ff" stopOpacity=".34" />
              <stop offset=".38" stopColor="#8d7bff" stopOpacity=".22" />
              <stop offset=".72" stopColor="#5b3bc4" stopOpacity=".08" />
              <stop offset="1" stopColor="#3a1f8c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="knx-splash-atmo" cx="50%" cy="100%" r="72%">
              <stop offset="0" stopColor="#d3f3ff" stopOpacity=".55" />
              <stop offset=".46" stopColor="#6f9cff" stopOpacity=".22" />
              <stop offset="1" stopColor="#3d55c8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="knx-splash-body" cx="50%" cy="-8%" r="88%">
              <stop offset="0" stopColor="#46618e" />
              <stop offset=".16" stopColor="#1a2b4d" />
              <stop offset=".34" stopColor="#101a33" />
              <stop offset=".56" stopColor="#080e1b" />
              <stop offset=".82" stopColor="#05070f" />
              <stop offset="1" stopColor="#03040a" />
            </radialGradient>
            <radialGradient id="knx-splash-flare" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#eaf9ff" stopOpacity=".5" />
              <stop offset=".45" stopColor="#9fd8ff" stopOpacity=".22" />
              <stop offset="1" stopColor="#6f8cff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="knx-splash-rim" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#8f78ff" stopOpacity="0" />
              <stop offset=".16" stopColor="#8db8ff" stopOpacity=".42" />
              <stop offset=".4" stopColor="#dcf5ff" stopOpacity=".92" />
              <stop offset=".5" stopColor="#ffffff" />
              <stop offset=".6" stopColor="#dcf5ff" stopOpacity=".92" />
              <stop offset=".84" stopColor="#8db8ff" stopOpacity=".42" />
              <stop offset="1" stopColor="#8f78ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle className="splash__sun" cx="706" cy="701" r="368" fill="url(#knx-splash-sun)" />
          <ellipse className="splash__flare" cx="720" cy="701" rx="320" ry="104" fill="url(#knx-splash-flare)" />
          <circle className="splash__planet" cx="720" cy="2101" r="1400" fill="url(#knx-splash-body)" />
          <ellipse className="splash__atmosphere" cx="720" cy="701" rx="720" ry="158" fill="url(#knx-splash-atmo)" />
          <circle className="splash__limb splash__limb--soft" cx="720" cy="2101" r="1398.6" fill="none" stroke="url(#knx-splash-rim)" strokeWidth="9" vectorEffect="non-scaling-stroke" />
          <circle className="splash__limb splash__limb--mid" cx="720" cy="2101" r="1399.4" fill="none" stroke="url(#knx-splash-rim)" strokeWidth="3.6" vectorEffect="non-scaling-stroke" />
          <circle className="splash__limb" cx="720" cy="2101" r="1399.8" fill="none" stroke="url(#knx-splash-rim)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>

        <span className="splash__haze" />
        <span className="splash__vignette" />
      </div>

      <div className="splash__content">
        <div className="splash__brand">
          <div className="splash__emblem" aria-hidden="true">
            <span className="splash__halo" />
            <span className="splash__orbit splash__orbit--outer"><i /></span>
            <span className="splash__orbit splash__orbit--inner"><i /></span>
            <span className="splash__mark">K</span>
          </div>
          <span className="splash__kicker">{t('stage.splash.kicker')}</span>
          <strong className="splash__word">KNOuX</strong>
          <small>SmartOrganizer</small>
          <em>{t('stage.splash.tagline')}</em>
        </div>

        <div className="splash__console">
          <span className="splash__status">
            <span className="splash__pulse" aria-hidden="true" />
            <span>{t('stage.splash.working')}</span>
            <i>{t('stage.splash.core')}</i>
          </span>
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
