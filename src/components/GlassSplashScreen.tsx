import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassSplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

// Floating particles for the logo assembly animation
const LogoParticles: React.FC<{ isAssembling: boolean }> = ({
  isAssembling,
}) => {
  const particles = [
    { id: 1, delay: 0, x: -100, y: -50, targetX: 0, targetY: -15 },
    { id: 2, delay: 0.2, x: 100, y: -30, targetX: 0, targetY: -5 },
    { id: 3, delay: 0.4, x: -80, y: 40, targetX: 0, targetY: 5 },
    { id: 4, delay: 0.6, x: 120, y: 60, targetX: 0, targetY: 15 },
    { id: 5, delay: 0.8, x: -60, y: -80, targetX: 0, targetY: -10 },
    { id: 6, delay: 1.0, x: 90, y: -70, targetX: 0, targetY: 0 },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-3 h-3 bg-white/40 rounded-full backdrop-blur-sm"
          initial={{
            x: particle.x,
            y: particle.y,
            scale: 0,
            opacity: 0,
          }}
          animate={
            isAssembling
              ? {
                  x: particle.targetX,
                  y: particle.targetY,
                  scale: 1,
                  opacity: 1,
                }
              : {
                  x: particle.x,
                  y: particle.y,
                  scale: 0,
                  opacity: 0,
                }
          }
          transition={{
            delay: particle.delay,
            duration: 1.5,
            type: "spring",
            stiffness: 100,
            damping: 15,
          }}
        />
      ))}
    </div>
  );
};

// Main logo component with advanced animations
const AnimatedLogo: React.FC<{ stage: number }> = ({ stage }) => {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-purple-400/30 via-blue-400/30 to-cyan-400/30 rounded-full filter blur-xl"
        animate={{
          scale: stage >= 2 ? [1, 1.2, 1] : 0,
          opacity: stage >= 2 ? [0.5, 0.8, 0.6] : 0,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main logo container */}
      <motion.div
        className="relative glass-card w-20 h-20 flex items-center justify-center border-white/30"
        initial={{ scale: 0, rotate: -180 }}
        animate={{
          scale: stage >= 1 ? 1 : 0,
          rotate: stage >= 1 ? 0 : -180,
        }}
        transition={{
          delay: 1.5,
          duration: 1.2,
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
      >
        {/* Logo particles */}
        <LogoParticles isAssembling={stage >= 1} />

        {/* Main logo icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: stage >= 2 ? 1 : 0,
            scale: stage >= 2 ? 1 : 0,
          }}
          transition={{
            delay: 2.5,
            duration: 0.8,
            type: "spring",
            stiffness: 300,
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white"
          >
            <motion.path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: stage >= 2 ? 1 : 0 }}
              transition={{ delay: 3, duration: 1.5 }}
            />
            <motion.path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: stage >= 2 ? 1 : 0 }}
              transition={{ delay: 3.2, duration: 1.5 }}
            />
            <motion.path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: stage >= 2 ? 1 : 0 }}
              transition={{ delay: 3.4, duration: 1.5 }}
            />
          </svg>
        </motion.div>

        {/* Rotating ring */}
        <motion.div
          className="absolute inset-0 border-2 border-white/20 rounded-full"
          animate={{
            rotate: stage >= 2 ? 360 : 0,
          }}
          transition={{
            delay: 2.8,
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>
    </div>
  );
};

export const GlassSplashScreen: React.FC<GlassSplashScreenProps> = ({
  onComplete,
  duration = 6000,
}) => {
  const [stage, setStage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeouts = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 2000),
      setTimeout(() => setStage(3), 4000),
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 800);
      }, duration),
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete, duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 glass-background flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/10 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  x: [-10, 10, -10],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 text-center">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <AnimatedLogo stage={stage} />
            </div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{
                opacity: stage >= 2 ? 1 : 0,
                y: stage >= 2 ? 0 : 30,
              }}
              transition={{ delay: 3.5, duration: 1 }}
            >
              <h1 className="glass-title text-4xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                Knoux SmartOrganizer
              </h1>
              <p className="glass-subtitle text-lg mb-8">
                المنظم الذكي للملفات
              </p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: stage >= 3 ? 1 : 0,
              }}
              transition={{ delay: 4.5, duration: 0.8 }}
              className="flex flex-col items-center"
            >
              {/* Progress bar */}
              <div className="w-64 h-1 glass-card mb-4 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 4.5, duration: 1.5 }}
                />
              </div>

              <motion.p
                className="glass-text-muted text-sm"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                جاري تحضير تجربة استثنائية...
              </motion.p>
            </motion.div>

            {/* Floating elements */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/20 rounded-full"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + i * 10}%`,
                  }}
                  animate={{
                    y: [-15, 15, -15],
                    opacity: [0.2, 0.8, 0.2],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Corner decorations */}
          <motion.div
            className="absolute top-8 left-8 w-16 h-16 border border-white/10 rounded-lg glass-blur-md"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute bottom-8 right-8 w-12 h-12 border border-white/10 rounded-full glass-blur-md"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlassSplashScreen;
