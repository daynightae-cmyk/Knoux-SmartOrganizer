/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX SmartOrganizer — Cinematic Blue Earth-Horizon Scene
 * 
 * Recreates the iconic REF-00 Home Command Center atmospheric Earth limb:
 * - Panoramic curved planetary limb with high-luminance cyan/azure atmosphere
 * - Brilliant solar corona / sunrise bloom at the orbital horizon apex
 * - Nocturnal terrestrial surface with intricate golden/amber city light constellations
 * - Deep space starfield with varying magnitudes and diffraction points
 * - High-altitude atmospheric haze and cloud filaments
 * - Full light mode and RTL (Arabic) awareness
 * 
 * Pure local CSS / SVG layers — zero external network requests or remote assets.
 */

import React, { useMemo } from 'react';

export interface EarthHorizonSceneProps {
  isAr?: boolean;
  className?: string;
}

export const EarthHorizonScene: React.FC<EarthHorizonSceneProps> = ({
  isAr = false,
  className = '',
}) => {
  // Generate random yet stable star coordinates
  const stars = useMemo(() => {
    return [
      { x: 3.5, y: 18, r: 1.1, o: 0.7, color: '#ffffff' },
      { x: 6.8, y: 34, r: 1.4, o: 0.85, color: '#bae6fd' },
      { x: 11.2, y: 12, r: 0.9, o: 0.6, color: '#ffffff' },
      { x: 15.6, y: 48, r: 1.6, o: 0.9, color: '#e0f2fe' },
      { x: 19.4, y: 22, r: 0.8, o: 0.5, color: '#ffffff' },
      { x: 24.1, y: 62, r: 1.2, o: 0.75, color: '#7dd3fc' },
      { x: 28.5, y: 16, r: 1.5, o: 0.8, color: '#ffffff' },
      { x: 33.2, y: 38, r: 1.0, o: 0.65, color: '#bae6fd' },
      { x: 38.7, y: 14, r: 1.8, o: 0.95, color: '#ffffff', spike: true },
      { x: 44.3, y: 52, r: 0.9, o: 0.55, color: '#ffffff' },
      { x: 49.1, y: 28, r: 1.3, o: 0.75, color: '#bae6fd' },
      { x: 53.8, y: 12, r: 1.1, o: 0.7, color: '#ffffff' },
      { x: 58.4, y: 42, r: 1.5, o: 0.85, color: '#e0f2fe' },
      { x: 62.9, y: 20, r: 0.8, o: 0.6, color: '#ffffff' },
      { x: 67.5, y: 32, r: 1.2, o: 0.8, color: '#7dd3fc' },
      { x: 82.1, y: 14, r: 1.4, o: 0.85, color: '#ffffff' },
      { x: 88.6, y: 38, r: 1.1, o: 0.7, color: '#bae6fd' },
      { x: 93.4, y: 18, r: 1.6, o: 0.9, color: '#e0f2fe', spike: true },
      { x: 97.2, y: 46, r: 1.0, o: 0.6, color: '#ffffff' },
    ];
  }, []);

  return (
    <div
      className={`knx-earth-horizon-container pointer-events-none select-none absolute inset-0 overflow-hidden ${
        isAr ? 'knx-earth-rtl' : ''
      } ${className}`}
      aria-hidden="true"
    >
      {/* Dynamic Procedural SVG Scene */}
      <svg
        className="knx-earth-horizon-svg w-full h-full"
        viewBox="0 0 1440 240"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Deep Space Background Gradient */}
          <linearGradient id="knx-space-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#020612" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#040b1c" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#08142b" stopOpacity="0.85" />
          </linearGradient>

          {/* Planet Earth Night-Side Terrestrial Body */}
          <linearGradient id="knx-earth-night-body" x1="20%" y1="0%" x2="60%" y2="100%">
            <stop offset="0%" stopColor="#08183a" />
            <stop offset="28%" stopColor="#05122c" />
            <stop offset="65%" stopColor="#030917" />
            <stop offset="100%" stopColor="#010308" />
          </linearGradient>

          {/* Atmospheric Curvature Multi-Stop Electric Cyan Gradient */}
          <linearGradient id="knx-atmo-edge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.05" />
            <stop offset="30%" stopColor="#0369a1" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#0284c7" stopOpacity="0.8" />
            <stop offset="68%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="74%" stopColor="#e0f2fe" stopOpacity="1" />
            <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="92%" stopColor="#0284c7" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.3" />
          </linearGradient>

          {/* Solar Apex Corona Radiant Flare */}
          <radialGradient id="knx-solar-apex" cx="74%" cy="26%" r="38%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="9%" stopColor="#e0f2fe" stopOpacity="0.95" />
            <stop offset="24%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="48%" stopColor="#0284c7" stopOpacity="0.45" />
            <stop offset="72%" stopColor="#1e3a8a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#030712" stopOpacity="0" />
          </radialGradient>

          {/* Anamorphic Blue Flare Streak */}
          <linearGradient id="knx-streak-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>

          {/* Atmospheric Glow Filters */}
          <filter id="knx-glow-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="knx-glow-wide" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Deep Space Atmosphere Base */}
        <rect width="1440" height="240" fill="url(#knx-space-sky)" />

        {/* 2. Starfield Layer with Optical Points */}
        <g className="knx-starfield" opacity="0.85">
          {stars.map((s, idx) => (
            <React.Fragment key={idx}>
              <circle
                cx={`${s.x}%`}
                cy={`${s.y}%`}
                r={s.r}
                fill={s.color}
                opacity={s.o}
              />
              {s.spike && (
                <path
                  d={`M ${s.x * 14.4 - 4},${s.y * 2.4} L ${s.x * 14.4 + 4},${s.y * 2.4} M ${s.x * 14.4},${s.y * 2.4 - 4} L ${s.x * 14.4},${s.y * 2.4 + 4}`}
                  stroke={s.color}
                  strokeWidth="0.8"
                  opacity={s.o * 0.75}
                />
              )}
            </React.Fragment>
          ))}
        </g>

        {/* 3. Outer Upper Nebula / Cosmic Diffuse Clouds */}
        <ellipse
          cx="1060"
          cy="62"
          rx="380"
          ry="120"
          fill="#0284c7"
          opacity="0.2"
          filter="url(#knx-glow-wide)"
        />
        <ellipse
          cx="1100"
          cy="60"
          rx="200"
          ry="70"
          fill="#38bdf8"
          opacity="0.32"
          filter="url(#knx-glow-soft)"
        />

        {/* 4. Planetary Curved Surface (Earth Horizon Body) */}
        {/* Curving naturally from (220, 160) up to apex (1060, 60), down to (1440, 175) */}
        <path
          d="M 200,165 Q 640,78 1060,60 T 1440,175 L 1440,240 L 200,240 Z"
          fill="url(#knx-earth-night-body)"
        />

        {/* 5. Nocturnal City Lights (Golden / Amber Terrestrial Web) */}
        <g className="knx-city-lights" opacity="0.95">
          {/* Broad metropolitan glow halos */}
          <ellipse cx="1120" cy="115" rx="50" ry="15" fill="#f59e0b" opacity="0.45" filter="url(#knx-glow-soft)" />
          <ellipse cx="1210" cy="135" rx="60" ry="18" fill="#fbbf24" opacity="0.4" filter="url(#knx-glow-soft)" />
          <ellipse cx="1320" cy="165" rx="65" ry="20" fill="#d97706" opacity="0.45" filter="url(#knx-glow-soft)" />
          <ellipse cx="980" cy="105" rx="40" ry="13" fill="#f59e0b" opacity="0.35" filter="url(#knx-glow-soft)" />
          <ellipse cx="860" cy="122" rx="35" ry="11" fill="#fbbf24" opacity="0.3" filter="url(#knx-glow-soft)" />

          {/* Interconnected transit / coastal filaments */}
          <path
            d="M 820,128 Q 880,122 940,114 T 1060,98 T 1160,118 T 1280,148 T 1390,185"
            stroke="#fde047"
            strokeWidth="1.3"
            strokeOpacity="0.7"
            strokeDasharray="2 3 5 2"
            fill="none"
          />
          <path
            d="M 960,118 Q 1040,135 1140,145 T 1260,175"
            stroke="#fbbf24"
            strokeWidth="1.1"
            strokeOpacity="0.55"
            strokeDasharray="3 4 2"
            fill="none"
          />
          <path
            d="M 1080,102 Q 1120,125 1180,132 T 1300,162"
            stroke="#f59e0b"
            strokeWidth="1.4"
            strokeOpacity="0.6"
            strokeDasharray="4 2 1"
            fill="none"
          />

          {/* Individual high-intensity city clusters */}
          <circle cx="1060" cy="98" r="1.8" fill="#ffffff" opacity="0.95" />
          <circle cx="1075" cy="104" r="1.5" fill="#fde047" opacity="0.9" />
          <circle cx="1090" cy="112" r="2.3" fill="#fef08a" opacity="1" />
          <circle cx="1115" cy="116" r="1.7" fill="#f59e0b" opacity="0.85" />
          <circle cx="1135" cy="122" r="2.1" fill="#ffffff" opacity="0.95" />
          <circle cx="1155" cy="120" r="1.6" fill="#fde047" opacity="0.8" />
          <circle cx="1180" cy="130" r="2.5" fill="#fef08a" opacity="1" />
          <circle cx="1205" cy="136" r="1.8" fill="#f59e0b" opacity="0.9" />
          <circle cx="1225" cy="144" r="2.2" fill="#ffffff" opacity="0.95" />
          <circle cx="1250" cy="150" r="1.7" fill="#fde047" opacity="0.85" />
          <circle cx="1285" cy="160" r="2.4" fill="#fef08a" opacity="1" />
          <circle cx="1310" cy="168" r="1.8" fill="#f59e0b" opacity="0.85" />
          <circle cx="1340" cy="176" r="2.0" fill="#ffffff" opacity="0.9" />
          <circle cx="1370" cy="186" r="1.6" fill="#fde047" opacity="0.8" />
          <circle cx="1400" cy="195" r="1.9" fill="#fef08a" opacity="0.85" />

          <circle cx="940" cy="110" r="1.5" fill="#fde047" opacity="0.75" />
          <circle cx="975" cy="105" r="2.0" fill="#fef08a" opacity="0.9" />
          <circle cx="1010" cy="100" r="1.7" fill="#ffffff" opacity="0.85" />
          <circle cx="880" cy="124" r="1.4" fill="#fde047" opacity="0.7" />
          <circle cx="840" cy="132" r="1.3" fill="#f59e0b" opacity="0.65" />
        </g>

        {/* 6. High-Altitude Atmospheric Cloud Ribbons */}
        <path
          d="M 680,125 Q 920,88 1120,90 T 1360,150"
          stroke="#7dd3fc"
          strokeWidth="6"
          strokeOpacity="0.14"
          fill="none"
          filter="url(#knx-glow-soft)"
        />
        <path
          d="M 850,140 Q 1060,110 1240,122 T 1420,185"
          stroke="#38bdf8"
          strokeWidth="8"
          strokeOpacity="0.1"
          fill="none"
          filter="url(#knx-glow-wide)"
        />

        {/* 7. Deep Cyan Ionosphere Corona Halo */}
        <path
          d="M 200,165 Q 640,78 1060,60 T 1440,175"
          stroke="#0284c7"
          strokeWidth="16"
          strokeOpacity="0.45"
          fill="none"
          filter="url(#knx-glow-wide)"
        />
        <path
          d="M 200,165 Q 640,78 1060,60 T 1440,175"
          stroke="#00d2ff"
          strokeWidth="6.5"
          strokeOpacity="0.65"
          fill="none"
          filter="url(#knx-glow-soft)"
        />

        {/* 8. Sharp Luminous Planetary Limb Boundary Edge */}
        <path
          d="M 200,165 Q 640,78 1060,60 T 1440,175"
          stroke="url(#knx-atmo-edge)"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* 9. Brilliant Solar Corona Flare at Apex (1060, 60) */}
        <ellipse cx="1060" cy="60" rx="100" ry="45" fill="url(#knx-solar-apex)" />
        <circle cx="1060" cy="60" r="20" fill="#ffffff" opacity="0.92" filter="url(#knx-glow-soft)" />

        {/* 10. Horizontal Anamorphic Lens Streak */}
        <ellipse cx="1060" cy="60" rx="300" ry="2.4" fill="url(#knx-streak-grad)" />
      </svg>
    </div>
  );
};
export default EarthHorizonScene;
