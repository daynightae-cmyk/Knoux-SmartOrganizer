/**
 * KNOuX SmartOrganizer — High-Fidelity Desktop Application Icons
 * Matches Windows desktop iconography in REF-02
 */

import React from 'react';

interface AppIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function AppIcon({ name, className = 'w-5 h-5', size }: AppIconProps) {
  const norm = name.toLowerCase();

  // Microsoft Edge Swirl
  if (norm.includes('edge')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="23" fill="#0078D7" />
        <path
          d="M24 6C14.0589 6 6 14.0589 6 24C6 26.9069 6.69084 29.6527 7.91791 32.0838C8.52042 27.6087 11.2372 23.7093 15.228 22.0191C19.7891 20.0874 24.9312 21.0315 28.531 24.4627C31.5282 27.3197 32.5539 31.7056 31.1444 35.617C30.0168 38.7461 27.2796 41.1396 23.9538 41.8797C23.9692 41.88 23.9846 41.8803 24 41.8803C33.875 41.8803 41.8803 33.875 41.8803 24C41.8803 14.0589 33.9411 6 24 6Z"
          fill="url(#edge-grad)"
        />
        <defs>
          <linearGradient id="edge-grad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5FF" />
            <stop offset="0.5" stopColor="#0078D7" />
            <stop offset="1" stopColor="#004C87" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // Microsoft Office 365
  if (norm.includes('office') || norm.includes('365')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#D83B01" />
        <path
          d="M28 10L14 15V33L28 38V10Z"
          fill="#FF8C00"
          fillOpacity="0.9"
        />
        <path
          d="M28 10L36 13V35L28 38V10Z"
          fill="#F7630C"
        />
        <rect x="8" y="14" width="20" height="20" rx="3" fill="#EA3810" />
        <text x="18" y="29" fill="white" fontSize="15" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">O</text>
      </svg>
    );
  }

  // Visual Studio Code
  if (norm.includes('code') || norm.includes('studio code') || norm.includes('vs code')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#1E1E1E" />
        <path
          d="M34.8 6.5L25.3 15.5L18.1 9.9L14.7 11.5L21.4 19.2L14.7 26.9L18.1 28.5L25.3 22.9L34.8 31.9C36.1 33.1 38 32.2 38 30.5V7.9C38 6.2 36.1 5.3 34.8 6.5Z"
          fill="#007ACC"
        />
        <path
          d="M38 7.9L24.5 18.7L18.1 13.6L14.7 15.2V23.2L18.1 24.8L24.5 19.7L38 30.5V7.9Z"
          fill="#1F8AD2"
        />
      </svg>
    );
  }

  // Google Chrome
  if (norm.includes('chrome')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#ECEFF1" />
        <path d="M24 6C16.8 6 10.6 10.4 8 16.7L17.2 22C18.4 18.5 21 16 24 16H39.8C36.2 10 29.5 6 24 6Z" fill="#EA4335" />
        <path d="M39.8 16C41.8 19.2 43 23 43 27C43 36.4 35.4 44 26 44L35.2 28.1C36.4 26 36.5 23.3 35.5 21L39.8 16Z" fill="#4285F4" />
        <path d="M26 44C17.2 44 9.8 38 7.4 30L16.6 24.7C17.4 28 20.4 30.5 24 30.5C26.5 30.5 28.8 29.3 30.2 27.5L34.5 35C32.2 40.5 27.5 44 26 44Z" fill="#FBBC05" />
        <circle cx="24" cy="24" r="7" fill="#4285F4" />
        <circle cx="24" cy="24" r="9" stroke="white" strokeWidth="2.5" />
      </svg>
    );
  }

  // Notion
  if (norm.includes('notion')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#000000" />
        <path
          d="M13 13.5L31.5 11L35 14.5V34.5L16.5 37L13 33.5V13.5Z"
          fill="white"
        />
        <path
          d="M19 19.5V30.5L25 21.5V32.5"
          stroke="#000000"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
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
          d="M34.5 15C32.3 14 30 13.3 27.6 13C27.3 13.5 27 14.2 26.7 14.8C24.1 14.4 21.6 14.4 19.1 14.8C18.8 14.1 18.5 13.5 18.2 13C15.8 13.3 13.5 14 11.3 15C6.9 21.5 5.7 27.9 6.3 34.1C9.2 36.3 12 37.6 14.8 38.5C15.5 37.5 16.1 36.5 16.7 35.4C15.7 35 14.8 34.5 13.9 33.9C14.1 33.7 14.4 33.5 14.6 33.3C20.1 35.8 26.1 35.8 31.5 33.3C31.7 33.5 32 33.7 32.2 33.9C31.3 34.5 30.4 35 29.4 35.4C30 36.5 30.6 37.5 31.3 38.5C34.1 37.6 36.9 36.3 39.8 34.1C40.5 26.9 38.6 20.6 34.5 15ZM17.3 29.8C15.6 29.8 14.2 28.2 14.2 26.3C14.2 24.4 15.5 22.8 17.3 22.8C19 22.8 20.4 24.4 20.3 26.3C20.3 28.2 19 29.8 17.3 29.8ZM28.8 29.8C27.1 29.8 25.7 28.2 25.7 26.3C25.7 24.4 27 22.8 28.8 22.8C30.5 22.8 31.9 24.4 31.8 26.3C31.8 28.2 30.5 29.8 28.8 29.8Z"
          fill="white"
        />
      </svg>
    );
  }

  // Spotify
  if (norm.includes('spotify')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="23" fill="#1ED760" />
        <path
          d="M33.8 33.2C33.4 33.8 32.6 34 32 33.6C26.5 30.2 19.6 29.5 11.5 31.3C10.8 31.5 10.1 31 10 30.3C9.8 29.6 10.3 28.9 11 28.8C19.9 26.7 27.6 27.6 33.8 31.4C34.3 31.7 34.5 32.5 34.2 33.2H33.8ZM36.7 26.9C36.1 27.7 35.1 28 34.3 27.5C28.1 23.7 18.5 22.6 11.1 24.8C10.2 25.1 9.2 24.6 8.9 23.7C8.6 22.8 9.1 21.8 10 21.5C18.5 18.9 29.1 20.1 36.1 24.4C37 25 37.2 26.1 36.7 26.9ZM37.1 20.4C29.6 16 17.2 15.6 10 17.8C8.8 18.1 7.6 17.5 7.3 16.3C7 15.1 7.6 13.9 8.8 13.6C17.1 11.1 30.7 11.6 39.3 16.7C40.4 17.3 40.7 18.8 40.1 19.9C39.4 20.9 38 21.3 37.1 20.4Z"
          fill="#121212"
        />
      </svg>
    );
  }

  // 7-Zip
  if (norm.includes('7-zip') || norm.includes('7zip')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="8" fill="#1C1C1C" stroke="#444" strokeWidth="1.5" />
        <path d="M12 14H36L22 34H12V14Z" fill="#F59E0B" />
        <text x="31" y="32" fill="white" fontSize="16" fontWeight="900" fontFamily="sans-serif">Z</text>
      </svg>
    );
  }

  // VLC media player
  if (norm.includes('vlc')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#201408" />
        <path d="M10 38H38L35 34H13L10 38Z" fill="#F97316" />
        <path d="M15 32H33L31 26H17L15 32Z" fill="#E2E8F0" />
        <path d="M18 24H30L28 17H20L18 24Z" fill="#F97316" />
        <path d="M21 15H27L25 9H23L21 15Z" fill="#E2E8F0" />
        <circle cx="24" cy="7" r="2" fill="#F97316" />
      </svg>
    );
  }

  // ShareX
  if (norm.includes('sharex')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#0F172A" />
        <path d="M14 14L24 24L14 34L24 24L34 34L24 24L34 14" stroke="#10B981" strokeWidth="5" strokeLinecap="round" />
        <circle cx="24" cy="24" r="5" fill="#06B6D4" />
      </svg>
    );
  }

  // Adobe Acrobat Reader DC
  if (norm.includes('adobe') || norm.includes('acrobat')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#EC1C24" />
        <path
          d="M13 36C18 36 21.5 28 24 22C26.5 28 30 36 35 36C31 36 28 29 25 21C27 15 26 12 24 12C22 12 21 15 23 21C20 29 17 36 13 36Z"
          fill="white"
        />
      </svg>
    );
  }

  // PowerToys
  if (norm.includes('powertoys')) {
    return (
      <svg className={className} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#0D1A30" />
        <rect x="11" y="11" width="11" height="11" rx="2" fill="#0078D7" />
        <rect x="26" y="11" width="11" height="11" rx="2" fill="#00CC6A" />
        <rect x="11" y="26" width="11" height="11" rx="2" fill="#FFB900" />
        <rect x="26" y="26" width="11" height="11" rx="2" fill="#D83B01" />
      </svg>
    );
  }

  // Default clean Windows application tile
  return (
    <div className={`${className} rounded-lg bg-gradient-to-tr from-[#1b3a6b] to-[#2563eb] flex items-center justify-center text-white font-bold text-[11px] shadow-sm`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
