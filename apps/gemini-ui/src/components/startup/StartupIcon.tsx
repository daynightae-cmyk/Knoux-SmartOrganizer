/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface StartupIconProps {
  name: string;
  className?: string;
  category?: string;
}

export function StartupIcon({ name, className = 'w-5 h-5', category }: StartupIconProps) {
  const norm = name.toLowerCase();

  // Microsoft OneDrive
  if (norm.includes('onedrive')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#0078D4" fillOpacity="0.15" />
        <path
          d="M18 32H35C38.3137 32 41 29.3137 41 26C41 22.8876 38.6315 20.3283 35.5861 20.035C34.7212 15.4851 30.7607 12 26 12C21.7588 12 18.1569 14.8087 16.9248 18.6677C16.3204 18.4554 15.6738 18.3421 15 18.3421C11.134 18.3421 8 21.4761 8 25.3421C8 29.0191 10.8354 32 14.5 32H18Z"
          fill="#0078D4"
        />
        <path
          d="M27 32H13.5C10.4624 32 8 29.5376 8 26.5C8 23.6304 10.1983 21.2721 13.0118 21.026C14.0754 16.9744 17.7816 14 22.2 14C26.1558 14 29.5447 16.3688 30.8845 19.8821C31.5544 19.6455 32.2687 19.5196 33 19.5196C36.3137 19.5196 39 22.2059 39 25.5196C39 28.8333 36.3137 31.5196 33 31.5196"
          stroke="#38BDF8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Discord
  if (norm.includes('discord')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#5865F2" />
        <path
          d="M34.5 15C32.3 14 30.2 13.3 28 13C27.7 13.5 27.4 14.2 27.2 14.7C24.8 14.3 22.4 14.3 20 14.7C19.8 14.2 19.5 13.5 19.2 13C17 13.3 14.9 14 12.7 15C8.3 21.5 7.1 27.8 7.7 34C10.6 36.2 13.4 37.5 16.1 38.3C16.8 37.4 17.4 36.4 17.9 35.3C16.9 34.9 16 34.4 15.1 33.8C15.3 33.6 15.5 33.5 15.7 33.3C21.2 35.8 27.1 35.8 32.5 33.3C32.7 33.5 32.9 33.6 33.1 33.8C32.2 34.4 31.3 34.9 30.3 35.3C30.8 36.4 31.4 37.4 32.1 38.3C34.8 37.5 37.6 36.2 40.5 34C41.2 26.8 39.3 20.6 34.5 15ZM19 29.5C17.3 29.5 16 28 16 26C16 24 17.3 22.5 19 22.5C20.7 22.5 22 24 22 26C22 28 20.7 29.5 19 29.5ZM29 29.5C27.3 29.5 26 28 26 26C26 24 27.3 22.5 29 22.5C30.7 22.5 32 24 32 26C32 28 30.7 29.5 29 29.5Z"
          fill="white"
        />
      </svg>
    );
  }

  // Spotify
  if (norm.includes('spotify')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="23" fill="#1DB954" />
        <path
          d="M33.2 21.4C26.5 17.4 15.4 17.1 9 19C8 19.3 6.9 18.7 6.6 17.7C6.3 16.7 6.9 15.6 7.9 15.3C15.4 13 27.6 13.4 35.4 18C36.3 18.5 36.6 19.7 36.1 20.6C35.5 21.4 34.1 21.9 33.2 21.4ZM32.9 26.6C32.4 27.4 31.3 27.7 30.5 27.2C24.9 23.8 16.4 22.8 9.9 24.8C9 25.1 8 24.5 7.7 23.6C7.4 22.7 8 21.7 8.9 21.4C16.4 19.1 25.7 20.2 32.1 24.2C33.1 24.7 33.4 25.8 32.9 26.6ZM30.4 31.7C29.9 32.4 29.1 32.6 28.4 32.2C23.7 29.3 17.5 28.7 10.3 30.3C9.5 30.5 8.7 30 8.5 29.2C8.3 28.4 8.8 27.6 9.6 27.4C17.5 25.6 24.3 26.3 29.6 29.6C30.4 30 30.8 30.9 30.4 31.7Z"
          fill="#121212"
        />
      </svg>
    );
  }

  // NVIDIA
  if (norm.includes('nvidia') || norm.includes('geforce') || norm.includes('shadowplay')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#1A1A1A" />
        <path
          d="M24 10C16.268 10 10 16.268 10 24C10 31.732 16.268 38 24 38C28.2 38 31.9 36.2 34.5 33.3L31 30.2C29.2 32.3 26.8 33.5 24 33.5C18.7533 33.5 14.5 29.2467 14.5 24C14.5 18.7533 18.7533 14.5 24 14.5C28.3 14.5 31.8 17.3 33.1 21.2H24V25.5H38C38 16.9 31.7 10 24 10Z"
          fill="#76B900"
        />
      </svg>
    );
  }

  // Steam
  if (norm.includes('steam')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="23" fill="#171A21" />
        <path
          d="M24 6C14.1 6 6 14.1 6 24C6 31.5 10.7 37.9 17.4 40.5L22 30.7C20.8 30.1 20 28.9 20 27.5C20 25.6 21.6 24 23.5 24C25.4 24 27 25.6 27 27.5C27 29.4 25.4 31 23.5 31L18.4 41.3C20.2 41.8 22.1 42 24 42C33.9 42 42 33.9 42 24C42 14.1 33.9 6 24 6ZM32 22C29.8 22 28 20.2 28 18C28 15.8 29.8 14 32 14C34.2 14 36 15.8 36 18C36 20.2 34.2 22 32 22Z"
          fill="#66C0F4"
        />
      </svg>
    );
  }

  // Adobe Creative Cloud
  if (norm.includes('adobe') || norm.includes('creative cloud') || norm.includes('ccx')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#DA1F26" />
        <path
          d="M12 11H18.5L25.8 27.6L29.3 19.8H26.3L23.2 12.8H36V11L28.8 28.5L36 37H29.5L24.8 26.2L18.5 37H12L20.8 20.3L12 11Z"
          fill="white"
        />
      </svg>
    );
  }

  // Microsoft Edge
  if (norm.includes('edge')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="23" fill="#0078D7" />
        <path
          d="M24 6C14.0589 6 6 14.0589 6 24C6 26.9069 6.69084 29.6527 7.91791 32.0838C8.52042 27.6087 11.2372 23.7093 15.228 22.0191C19.7891 20.0874 24.9312 21.0315 28.531 24.4627C31.5282 27.3197 32.5539 31.7056 31.1444 35.617C30.0168 38.7461 27.2796 41.1396 23.9538 41.8797C23.9692 41.88 23.9846 41.8803 24 41.8803C33.875 41.8803 41.8803 33.875 41.8803 24C41.8803 14.0589 33.9411 6 24 6Z"
          fill="#00E5FF"
        />
      </svg>
    );
  }

  // Realtek
  if (norm.includes('realtek') || norm.includes('audio')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#0284C7" />
        <circle cx="24" cy="24" r="14" stroke="white" strokeWidth="2.5" />
        <path d="M19 24C19 21.2386 21.2386 19 24 19C26.7614 19 29 21.2386 29 24" stroke="#7DD3FC" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="24" r="2.5" fill="white" />
      </svg>
    );
  }

  // Google Update / Chrome
  if (norm.includes('google') || norm.includes('chrome')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="23" fill="#FFFFFF" />
        <circle cx="24" cy="24" r="9" fill="#1A73E8" />
        <path d="M24 15H39C36.5 10.5 32 7.5 26.5 6.5L18.5 20.3L24 15Z" fill="#EA4335" />
        <path d="M15 24C15 20.5 16.5 17.5 18.5 15.5L10 9.5C7 13.5 5.5 18.5 5.5 24C5.5 31.5 9.5 38 15.5 41.5L23.5 27.7C18.5 27.7 15 26 15 24Z" fill="#34A853" />
        <path d="M24 33C27 33 29.5 32 31.5 30.5L39.5 38.5C35.5 42 30 44 24 44C19 44 14.5 42.5 10.5 39.5L19 24.8C20.5 29.5 22 33 24 33Z" fill="#FBBC05" />
      </svg>
    );
  }

  // Docker
  if (norm.includes('docker')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#1D63ED" />
        <rect x="14" y="22" width="4" height="4" rx="0.5" fill="white" />
        <rect x="19" y="22" width="4" height="4" rx="0.5" fill="white" />
        <rect x="24" y="22" width="4" height="4" rx="0.5" fill="white" />
        <rect x="19" y="17" width="4" height="4" rx="0.5" fill="white" />
        <rect x="24" y="17" width="4" height="4" rx="0.5" fill="white" />
        <rect x="24" y="12" width="4" height="4" rx="0.5" fill="white" />
        <path
          d="M40 25C39.5 24.5 37.8 24 36.5 24.8C36 24 35 23.5 34 23.5C32.5 23.5 31.2 24.5 30.5 25.8C29 26 27.5 26 26 26H11C9.5 26 8 27.5 8 30C8 35 13 38 24 38C34 38 39.5 33 40.5 27.5C41 27 40.5 25.5 40 25Z"
          fill="white"
        />
      </svg>
    );
  }

  // Slack
  if (norm.includes('slack')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#4A154B" />
        <path d="M17 21C15.9 21 15 20.1 15 19C15 17.9 15.9 17 17 17C18.1 17 19 17.9 19 19V21H17Z" fill="#36C5F0" />
        <path d="M21 21C22.1 21 23 20.1 23 19V14C23 12.9 22.1 12 21 12C19.9 12 19 12.9 19 14V19C19 20.1 19.9 21 21 21Z" fill="#36C5F0" />
        <path d="M27 17C27 15.9 27.9 15 29 15C30.1 15 31 15.9 31 17C31 18.1 30.1 19 29 19H27V17Z" fill="#2EB67D" />
        <path d="M27 21C27 22.1 27.9 23 29 23H34C35.1 23 36 22.1 36 21C36 19.9 35.1 19 34 19H29C27.9 19 27 19.9 27 21Z" fill="#2EB67D" />
        <path d="M31 27C32.1 27 33 27.9 33 29C33 30.1 32.1 31 31 31C29.9 31 29 30.1 29 29V27H31Z" fill="#E01E5A" />
        <path d="M27 27C25.9 27 25 27.9 25 29V34C25 35.1 25.9 36 27 36C28.1 36 29 35.1 29 34V29C29 27.9 28.1 27 27 27Z" fill="#E01E5A" />
        <path d="M21 31C21 32.1 20.1 33 19 33C17.9 33 17 32.1 17 31C17 29.9 17.9 29 19 29H21V31Z" fill="#ECB22E" />
        <path d="M21 27C21 25.9 20.1 25 19 25H14C12.9 25 12 25.9 12 27C12 28.1 12.9 29 14 29H19C20.1 29 21 28.1 21 27Z" fill="#ECB22E" />
      </svg>
    );
  }

  // Windows Security / Defender
  if (norm.includes('security') || norm.includes('defender')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#0078D4" />
        <path
          d="M24 11L14 15V23C14 29.5 18.3 35.5 24 37C29.7 35.5 34 29.5 34 23V15L24 11Z"
          fill="#2563EB"
          stroke="white"
          strokeWidth="2"
        />
        <path d="M21 24L23.5 26.5L28 21" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Microsoft PowerToys
  if (norm.includes('powertoys')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#27272A" />
        <circle cx="20" cy="20" r="6" fill="#F43F5E" />
        <circle cx="30" cy="20" r="4" fill="#0EA5E9" />
        <circle cx="24" cy="30" r="5" fill="#EAB308" />
        <circle cx="16" cy="31" r="3" fill="#10B981" />
      </svg>
    );
  }

  // Epic Games
  if (norm.includes('epic')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#121212" />
        <path
          d="M24 8L12 13V31L24 40L36 31V13L24 8Z"
          fill="#333333"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        <text x="24" y="27" fill="white" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">EPIC</text>
      </svg>
    );
  }

  // Default / Category-based fallback icons
  return (
    <div className={`rounded-lg bg-gradient-to-br from-indigo-900/60 to-purple-950/80 border border-indigo-500/30 flex items-center justify-center text-xs font-mono font-bold text-indigo-300 ${className}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
