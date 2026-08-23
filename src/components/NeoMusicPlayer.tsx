import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Heart,
  Shuffle,
  Repeat,
  MoreHorizontal,
  Music,
} from "lucide-react";
import {
  NeoCard,
  NeoButton,
  NeoIconButton,
  NeoProgress,
  NeoToggle,
} from "@/components/ui/neomorphism";
import { cn } from "@/lib/utils";

// Mock music data
const mockTracks = [
  {
    id: 1,
    title: "موسيقى هادئة",
    artist: "Knoux تشيل موسيك",
    duration: 245,
    cover: "/api/placeholder/300/300",
  },
  {
    id: 2,
    title: "أنغام الإنتاجية",
    artist: "فوكس ميوزيك",
    duration: 312,
  },
  {
    id: 3,
    title: "موجات الإبداع",
    artist: "كنوكس ساوندز",
    duration: 188,
  },
];

interface NeoMusicPlayerProps {
  className?: string;
  showMiniPlayer?: boolean;
}

export const NeoMusicPlayer: React.FC<NeoMusicPlayerProps> = ({
  className,
  showMiniPlayer = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isLiked, setIsLiked] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false);

  const track = mockTracks[currentTrack];

  // Simulate time progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= track.duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, track.duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentTrack((prev) => (prev + 1) % mockTracks.length);
    setCurrentTime(0);
  };

  const handlePrevious = () => {
    setCurrentTrack(
      (prev) => (prev - 1 + mockTracks.length) % mockTracks.length,
    );
    setCurrentTime(0);
  };

  const handleSeek = (value: number) => {
    setCurrentTime(value);
  };

  if (showMiniPlayer) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "fixed bottom-4 right-4 neo-card p-4 flex items-center gap-3 bg-white/90 backdrop-blur-md z-50",
          className,
        )}
      >
        <div className="w-12 h-12 neo-card rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="neo-title text-sm font-semibold truncate">
            {track.title}
          </p>
          <p className="neo-text-muted text-xs truncate">{track.artist}</p>
        </div>
        <NeoIconButton
          icon={isPlaying ? Pause : Play}
          onClick={handlePlayPause}
          variant="primary"
        />
      </motion.div>
    );
  }

  return (
    <div className={cn("neo-card p-8 max-w-md mx-auto", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <motion.h2
          className="neo-title text-xl font-bold"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          مشغل الموسيقى
        </motion.h2>
        <NeoIconButton icon={MoreHorizontal} variant="default" />
      </div>

      {/* Album Art */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="neo-card aspect-square rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center">
            <Music className="w-24 h-24 text-white/80" />
          </div>

          {/* Vinyl Effect */}
          <motion.div
            className="absolute inset-4 rounded-full border-4 border-white/20"
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={{
              duration: 3,
              repeat: isPlaying ? Infinity : 0,
              ease: "linear",
            }}
          >
            <div className="w-full h-full rounded-full border-8 border-white/10 relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/30 rounded-full" />
            </div>
          </motion.div>

          {/* Play/Pause Overlay */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/20"
              >
                <motion.div
                  className="neo-icon-button w-16 h-16 bg-white/90"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePlayPause}
                >
                  <Play className="w-8 h-8 text-indigo-600 ml-1" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Track Info */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="neo-title text-lg font-bold mb-1">{track.title}</h3>
        <p className="neo-text-muted">{track.artist}</p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <NeoProgress
          value={currentTime}
          max={track.duration}
          animated={isPlaying}
          className="mb-2"
        />
        <div className="flex justify-between text-xs neo-text-muted">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(track.duration)}</span>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        className="flex items-center justify-center gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <NeoIconButton
          icon={SkipBack}
          onClick={handlePrevious}
          variant="default"
        />

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="neo-icon-button w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600"
          onClick={handlePlayPause}
        >
          <motion.div
            key={isPlaying ? "pause" : "play"}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </motion.div>
        </motion.div>

        <NeoIconButton
          icon={SkipForward}
          onClick={handleNext}
          variant="default"
        />
      </motion.div>

      {/* Secondary Controls */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            className={cn(
              "neo-icon-button",
              isLiked && "text-red-500 bg-red-50",
            )}
            onClick={() => setIsLiked(!isLiked)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart
                className={cn(
                  "w-5 h-5",
                  isLiked && "fill-current text-red-500",
                )}
              />
            </motion.div>
          </motion.button>

          <NeoIconButton
            icon={Shuffle}
            onClick={() => setIsShuffled(!isShuffled)}
            variant={isShuffled ? "primary" : "default"}
          />

          <NeoIconButton
            icon={Repeat}
            onClick={() => setRepeatMode(!repeatMode)}
            variant={repeatMode ? "primary" : "default"}
          />
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 neo-text-muted" />
          <div className="w-20">
            <NeoProgress value={volume} max={100} />
          </div>
        </div>
      </motion.div>

      {/* Playlist Preview */}
      <motion.div
        className="mt-8 pt-6 border-t border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h4 className="neo-title text-sm font-semibold mb-4">
          القائمة التالية
        </h4>
        <div className="space-y-2">
          {mockTracks.slice(1, 3).map((nextTrack, index) => (
            <motion.div
              key={nextTrack.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ x: 4 }}
            >
              <div className="w-10 h-10 neo-card rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <Music className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="neo-text text-sm font-medium truncate">
                  {nextTrack.title}
                </p>
                <p className="neo-text-muted text-xs truncate">
                  {nextTrack.artist}
                </p>
              </div>
              <span className="neo-text-muted text-xs">
                {formatTime(nextTrack.duration)}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default NeoMusicPlayer;
