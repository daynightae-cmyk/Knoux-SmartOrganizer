import React from "react";
import { motion } from "framer-motion";

// Main Knoux SmartOrganizer Logo
export const KnouxMainLogo: React.FC<{ size?: number; animated?: boolean }> = ({
  size = 80,
  animated = true,
}) => {
  const LogoWrapper = animated ? motion.div : "div";
  const animationProps = animated
    ? {
        whileHover: { scale: 1.05, rotate: 2 },
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <LogoWrapper className="relative inline-block" {...animationProps}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-2xl"
      >
        {/* Background Circle with Gradient */}
        <defs>
          <radialGradient id="mainGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </radialGradient>
          <linearGradient
            id="brainGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#E0E7FF" />
            <stop offset="50%" stopColor="#C7D2FE" />
            <stop offset="100%" stopColor="#A5B4FC" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main Circle Background */}
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="url(#mainGradient)"
          opacity="0.9"
          filter="url(#glow)"
        />

        {/* Brain Icon in Center */}
        <g transform="translate(35, 35)">
          <path
            d="M25 5C28.866 5 32 8.134 32 12C32 15.866 28.866 19 25 19C21.134 19 18 15.866 18 12C18 8.134 21.134 5 25 5Z"
            fill="url(#brainGradient)"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <path
            d="M15 15C18.866 15 22 18.134 22 22C22 25.866 18.866 29 15 29C11.134 29 8 25.866 8 22C8 18.134 11.134 15 15 15Z"
            fill="url(#brainGradient)"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <path
            d="M35 15C38.866 15 42 18.134 42 22C42 25.866 38.866 29 35 29C31.134 29 28 25.866 28 22C28 18.134 31.134 15 35 15Z"
            fill="url(#brainGradient)"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        </g>

        {/* Orbiting File Icons */}
        <g
          className={animated ? "animate-spin-slow" : ""}
          style={{ transformOrigin: "60px 60px" }}
        >
          {/* File 1 */}
          <rect
            x="85"
            y="25"
            width="8"
            height="10"
            rx="1"
            fill="#10F54C"
            opacity="0.8"
          />
          <rect x="86" y="27" width="6" height="1" fill="#FFFFFF" />
          <rect x="86" y="29" width="4" height="1" fill="#FFFFFF" />

          {/* File 2 */}
          <rect
            x="25"
            y="85"
            width="8"
            height="10"
            rx="1"
            fill="#10F54C"
            opacity="0.8"
          />
          <rect x="26" y="87" width="6" height="1" fill="#FFFFFF" />
          <rect x="26" y="89" width="4" height="1" fill="#FFFFFF" />

          {/* File 3 */}
          <rect
            x="15"
            y="30"
            width="8"
            height="10"
            rx="1"
            fill="#10F54C"
            opacity="0.8"
          />
          <rect x="16" y="32" width="6" height="1" fill="#FFFFFF" />
          <rect x="16" y="34" width="4" height="1" fill="#FFFFFF" />
        </g>

        {/* AI Sparkles */}
        <g opacity="0.7">
          <circle
            cx="30"
            cy="30"
            r="2"
            fill="#10F54C"
            className={animated ? "animate-pulse" : ""}
          />
          <circle
            cx="90"
            cy="90"
            r="2"
            fill="#10F54C"
            className={animated ? "animate-pulse" : ""}
          />
          <circle
            cx="90"
            cy="30"
            r="1.5"
            fill="#06B6D4"
            className={animated ? "animate-pulse" : ""}
          />
          <circle
            cx="30"
            cy="90"
            r="1.5"
            fill="#06B6D4"
            className={animated ? "animate-pulse" : ""}
          />
        </g>
      </svg>
    </LogoWrapper>
  );
};

// Simple Organizer Logo
export const SimpleOrganizerLogo: React.FC<{ size?: number }> = ({
  size = 60,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <defs>
        <linearGradient id="simpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>
      </defs>

      {/* Background Circle */}
      <circle
        cx="40"
        cy="40"
        r="35"
        fill="url(#simpleGradient)"
        opacity="0.9"
      />

      {/* File Icon */}
      <rect
        x="25"
        y="20"
        width="30"
        height="35"
        rx="3"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <rect x="30" y="30" width="20" height="2" fill="#3B82F6" />
      <rect x="30" y="35" width="15" height="2" fill="#3B82F6" />
      <rect x="30" y="40" width="18" height="2" fill="#3B82F6" />

      {/* Checkmark */}
      <circle cx="50" cy="25" r="8" fill="#10B981" />
      <path
        d="M46 25L49 28L54 22"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Small AI Sparkle */}
      <circle cx="60" cy="50" r="3" fill="#10F54C" opacity="0.8" />
      <path
        d="M60 47v6M57 50h6"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};

// Smart Organizer Logo
export const SmartOrganizerLogo: React.FC<{ size?: number }> = ({
  size = 60,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <defs>
        <linearGradient id="smartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#C0C0C0" />
        </linearGradient>
      </defs>

      {/* Background Circle */}
      <circle cx="40" cy="40" r="35" fill="url(#smartGradient)" opacity="0.9" />

      {/* Brain Icon */}
      <path
        d="M30 25C33 22 37 22 40 25C43 22 47 22 50 25C52 27 52 31 50 33C47 36 43 36 40 33C37 36 33 36 30 33C28 31 28 27 30 25Z"
        fill="#FFFFFF"
        opacity="0.9"
      />

      {/* Folders being sorted */}
      <g opacity="0.8">
        {/* Folder 1 */}
        <rect x="20" y="45" width="12" height="8" rx="1" fill="#10F54C" />
        <rect x="20" y="45" width="5" height="2" rx="1" fill="#10F54C" />

        {/* Folder 2 */}
        <rect x="35" y="50" width="12" height="8" rx="1" fill="#06B6D4" />
        <rect x="35" y="50" width="5" height="2" rx="1" fill="#06B6D4" />

        {/* Folder 3 */}
        <rect x="50" y="55" width="12" height="8" rx="1" fill="#8B5CF6" />
        <rect x="50" y="55" width="5" height="2" rx="1" fill="#8B5CF6" />
      </g>

      {/* Sorting Arrows */}
      <path
        d="M32 48L38 52M47 53L53 57"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

// Ultimate Edition Logo
export const UltimateEditionLogo: React.FC<{ size?: number }> = ({
  size = 60,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <defs>
        <radialGradient id="ultimateGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1F2937" />
          <stop offset="50%" stopColor="#374151" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <linearGradient id="crownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5E7EB" />
          <stop offset="50%" stopColor="#D1D5DB" />
          <stop offset="100%" stopColor="#10F54C" />
        </linearGradient>
      </defs>

      {/* Background Circle */}
      <circle
        cx="40"
        cy="40"
        r="35"
        fill="url(#ultimateGradient)"
        opacity="0.95"
      />

      {/* Crown */}
      <path
        d="M25 35L30 25L35 30L40 20L45 30L50 25L55 35L52 45H28L25 35Z"
        fill="url(#crownGradient)"
        stroke="#10F54C"
        strokeWidth="1"
      />

      {/* Gems on Crown */}
      <circle cx="30" cy="32" r="2" fill="#10F54C" />
      <circle cx="40" cy="28" r="2" fill="#10F54C" />
      <circle cx="50" cy="32" r="2" fill="#10F54C" />

      {/* Stacked Files */}
      <g opacity="0.8">
        <rect x="30" y="50" width="20" height="3" rx="1" fill="#E5E7EB" />
        <rect x="32" y="54" width="16" height="3" rx="1" fill="#D1D5DB" />
        <rect x="34" y="58" width="12" height="3" rx="1" fill="#9CA3AF" />
      </g>

      {/* AI Cube */}
      <g opacity="0.7">
        <rect
          x="60"
          y="25"
          width="8"
          height="8"
          rx="1"
          fill="#10F54C"
          opacity="0.3"
        />
        <rect x="62" y="27" width="4" height="4" rx="0.5" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

// RemoveDuplicate Logo
export const RemoveDuplicateLogo: React.FC<{ size?: number }> = ({
  size = 60,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <defs>
        <linearGradient id="removeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>
      </defs>

      {/* Background Circle */}
      <circle
        cx="40"
        cy="40"
        r="35"
        fill="url(#removeGradient)"
        opacity="0.9"
      />

      {/* Duplicate Files */}
      <rect
        x="25"
        y="25"
        width="15"
        height="20"
        rx="2"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <rect x="28" y="28" width="9" height="1" fill="#1E40AF" />
      <rect x="28" y="31" width="7" height="1" fill="#1E40AF" />
      <rect x="28" y="34" width="8" height="1" fill="#1E40AF" />

      {/* Second file (duplicate) */}
      <rect
        x="30"
        y="30"
        width="15"
        height="20"
        rx="2"
        fill="#FFFFFF"
        opacity="0.7"
      />
      <rect x="33" y="33" width="9" height="1" fill="#1E40AF" />
      <rect x="33" y="36" width="7" height="1" fill="#1E40AF" />
      <rect x="33" y="39" width="8" height="1" fill="#1E40AF" />

      {/* Trash Icon */}
      <rect
        x="50"
        y="35"
        width="12"
        height="15"
        rx="1"
        fill="#EF4444"
        opacity="0.8"
      />
      <rect x="48" y="33" width="16" height="2" rx="1" fill="#EF4444" />
      <rect x="54" y="30" width="4" height="3" rx="1" fill="#EF4444" />

      {/* Lines in trash */}
      <line x1="53" y1="38" x2="53" y2="46" stroke="#FFFFFF" strokeWidth="1" />
      <line x1="56" y1="38" x2="56" y2="46" stroke="#FFFFFF" strokeWidth="1" />
      <line x1="59" y1="38" x2="59" y2="46" stroke="#FFFFFF" strokeWidth="1" />

      {/* AI Lightning */}
      <path
        d="M65 20L62 28H66L63 36"
        stroke="#10F54C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// RemoveDuplicate PRO Logo
export const RemoveDuplicateProLogo: React.FC<{ size?: number }> = ({
  size = 60,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <defs>
        <radialGradient id="proGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="50%" stopColor="#1F2937" />
          <stop offset="100%" stopColor="#10F54C" />
        </radialGradient>
      </defs>

      {/* Background Circle */}
      <circle cx="40" cy="40" r="35" fill="url(#proGradient)" opacity="0.95" />

      {/* AI Chip */}
      <rect
        x="28"
        y="25"
        width="24"
        height="16"
        rx="3"
        fill="#10F54C"
        opacity="0.8"
      />
      <rect x="30" y="27" width="20" height="12" rx="2" fill="#000000" />

      {/* Chip Details */}
      <rect x="32" y="29" width="4" height="1" fill="#10F54C" />
      <rect x="32" y="31" width="6" height="1" fill="#10F54C" />
      <rect x="32" y="33" width="5" height="1" fill="#10F54C" />
      <rect x="32" y="35" width="7" height="1" fill="#10F54C" />

      {/* Scanning Files */}
      <g opacity="0.7">
        <rect x="20" y="45" width="8" height="10" rx="1" fill="#FFFFFF" />
        <rect x="30" y="48" width="8" height="10" rx="1" fill="#FFFFFF" />
        <rect x="40" y="45" width="8" height="10" rx="1" fill="#FFFFFF" />
        <rect x="50" y="48" width="8" height="10" rx="1" fill="#FFFFFF" />
      </g>

      {/* Green Scanning Pulse */}
      <circle
        cx="40"
        cy="50"
        r="25"
        fill="none"
        stroke="#10F54C"
        strokeWidth="2"
        opacity="0.3"
        className="animate-pulse"
      />
      <circle
        cx="40"
        cy="50"
        r="20"
        fill="none"
        stroke="#10F54C"
        strokeWidth="1"
        opacity="0.5"
        className="animate-pulse"
      />

      {/* AI Aura Effect */}
      <g opacity="0.6">
        <circle
          cx="15"
          cy="20"
          r="2"
          fill="#10F54C"
          className="animate-pulse"
        />
        <circle
          cx="65"
          cy="25"
          r="1.5"
          fill="#10F54C"
          className="animate-pulse"
        />
        <circle
          cx="70"
          cy="60"
          r="2"
          fill="#10F54C"
          className="animate-pulse"
        />
        <circle
          cx="10"
          cy="65"
          r="1.5"
          fill="#10F54C"
          className="animate-pulse"
        />
      </g>
    </svg>
  );
};

// Master Branding Banner Component
export const MasterBrandingBanner: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        width="100%"
        height="200"
        viewBox="0 0 800 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
      >
        <defs>
          <radialGradient id="masterGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="30%" stopColor="#8B5CF6" />
            <stop offset="60%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10F54C" />
          </radialGradient>
          <filter id="masterGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect
          width="800"
          height="200"
          fill="url(#masterGradient)"
          opacity="0.1"
        />

        {/* Central AI Orb */}
        <circle
          cx="400"
          cy="100"
          r="40"
          fill="url(#masterGradient)"
          opacity="0.8"
          filter="url(#masterGlow)"
        />

        {/* Brain in center */}
        <g transform="translate(380, 80)">
          <path
            d="M20 10C25 5 30 5 35 10C40 5 45 5 50 10C55 15 55 25 50 30C45 35 35 35 30 30C25 35 15 35 10 30C5 25 5 15 10 10Z"
            fill="#FFFFFF"
            opacity="0.9"
          />
        </g>

        {/* Orbiting App Icons */}
        <g
          className="animate-spin-slow"
          style={{ transformOrigin: "400px 100px" }}
        >
          {/* Simple Organizer - Top */}
          <circle cx="400" cy="40" r="15" fill="#3B82F6" opacity="0.8" />
          <rect x="395" y="35" width="10" height="10" rx="1" fill="#FFFFFF" />

          {/* Smart Organizer - Top Right */}
          <circle cx="480" cy="60" r="15" fill="#8B5CF6" opacity="0.8" />
          <path
            d="M475 55C477 53 480 53 482 55C485 53 488 53 490 55"
            stroke="#FFFFFF"
            strokeWidth="2"
          />

          {/* Ultimate Edition - Bottom Right */}
          <circle cx="480" cy="140" r="15" fill="#1F2937" opacity="0.8" />
          <path
            d="M472 135L477 130L480 135L485 130L488 135L485 140H475L472 135Z"
            fill="#10F54C"
          />

          {/* RemoveDuplicate - Bottom */}
          <circle cx="400" cy="160" r="15" fill="#1E40AF" opacity="0.8" />
          <rect x="395" y="155" width="5" height="8" rx="1" fill="#FFFFFF" />
          <rect
            x="400"
            y="157"
            width="5"
            height="8"
            rx="1"
            fill="#FFFFFF"
            opacity="0.7"
          />

          {/* RemoveDuplicate PRO - Bottom Left */}
          <circle cx="320" cy="140" r="15" fill="#000000" opacity="0.8" />
          <rect x="315" y="135" width="10" height="6" rx="1" fill="#10F54C" />

          {/* Connection lines */}
          <path
            d="M400 60L400 140M360 100L440 100"
            stroke="#FFFFFF"
            strokeWidth="1"
            opacity="0.3"
          />
        </g>

        {/* Main Title */}
        <text
          x="400"
          y="30"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="24"
          fontWeight="bold"
          className="font-sans"
        >
          Knoux SmartOrganizer
        </text>

        {/* Arabic Title */}
        <text
          x="400"
          y="185"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="16"
          opacity="0.8"
          className="font-sans"
        >
          نوكس المنظم الذكي
        </text>
      </svg>

      {/* Tagline */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-white/60 text-sm max-w-3xl mx-auto px-4">
          منصة شاملة لتنظيم الملفات بالذكاء الاصطناعي - اختر التطبيق المناسب
          لاحتياجاتك
        </p>
      </div>
    </div>
  );
};

// Logo Text Components
export const LogoText: React.FC<{
  title: string;
  subtitle: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ title, subtitle, size = "md", className = "" }) => {
  const sizes = {
    sm: { title: "text-lg", subtitle: "text-sm" },
    md: { title: "text-2xl", subtitle: "text-lg" },
    lg: { title: "text-4xl", subtitle: "text-2xl" },
  };

  return (
    <div className={`text-center ${className}`}>
      <h1
        className={`font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent ${sizes[size].title}`}
      >
        {title}
      </h1>
      <h2 className={`text-cyan-400 font-semibold ${sizes[size].subtitle}`}>
        {subtitle}
      </h2>
    </div>
  );
};

export default {
  KnouxMainLogo,
  SimpleOrganizerLogo,
  SmartOrganizerLogo,
  UltimateEditionLogo,
  RemoveDuplicateLogo,
  RemoveDuplicateProLogo,
  MasterBrandingBanner,
  LogoText,
};
