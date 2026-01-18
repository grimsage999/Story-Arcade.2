import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play } from 'lucide-react';

interface Story {
  id: number;
  title: string;
  trackTitle?: string;
  neighborhood?: string;
  logline?: string;
  themes?: string[];
}

interface AttractScreensaverProps {
  stories: Story[];
  onDismiss: () => void;
  isActive: boolean;
}

const ATTRACT_MESSAGES = [
  "INSERT STORY TO PLAY",
  "YOUR NEIGHBORHOOD AWAITS",
  "BECOME THE LEGEND",
  "PRESS START",
  "STORIES ARE WAITING",
  "JOIN THE MYTHOLOGY"
];

const CYCLE_INTERVAL = 5000;
const MESSAGE_INTERVAL = 3000;

export function AttractScreensaver({ stories, onDismiss, isActive }: AttractScreensaverProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isActive || stories.length === 0) return;

    const storyInterval = setInterval(() => {
      setCurrentStoryIndex((prev) => (prev + 1) % Math.min(stories.length, 20));
    }, CYCLE_INTERVAL);

    return () => clearInterval(storyInterval);
  }, [isActive, stories.length]);

  useEffect(() => {
    if (!isActive) return;

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % ATTRACT_MESSAGES.length);
    }, MESSAGE_INTERVAL);

    return () => clearInterval(messageInterval);
  }, [isActive]);

  const displayStories = useMemo(() => {
    return stories.slice(0, 20);
  }, [stories]);

  const currentStory = displayStories[currentStoryIndex];

  if (!mounted || !isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md cursor-pointer"
      onClick={onDismiss}
      onKeyDown={(e) => e.key === 'Escape' && onDismiss()}
      tabIndex={0}
      role="button"
      aria-label="Press to start creating your story"
      data-testid="attract-screensaver"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          className="absolute top-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-primary/60 font-mono text-[10px] tracking-[0.3em]">
            COMMUNITY MYTHOLOGY ENGINE
          </span>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentMessageIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <h1 className="text-4xl md:text-7xl font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-primary to-purple-500 animate-pulse-glow">
              {ATTRACT_MESSAGES[currentMessageIndex]}
            </h1>
          </motion.div>
        </AnimatePresence>

        {currentStory && displayStories.length > 0 && (
          <div className="w-full max-w-2xl">
            <p className="text-primary/50 font-mono text-[10px] tracking-[0.2em] mb-4">
              <Sparkles className="w-3 h-3 inline mr-2" />
              FROM THE COMMUNITY ARCHIVE
            </p>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStory.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6 }}
                className="bg-card/50 border border-card-border/50 rounded-lg p-6 backdrop-blur-sm"
              >
                <h2 className="text-2xl md:text-3xl font-display text-foreground mb-2">
                  {currentStory.title}
                </h2>
                <p className="text-muted-foreground font-mono text-xs mb-4">
                  {currentStory.trackTitle} • {currentStory.neighborhood || 'Community Story'}
                </p>
                {currentStory.logline && (
                  <p className="text-foreground/80 italic text-sm leading-relaxed line-clamp-2">
                    "{currentStory.logline}"
                  </p>
                )}
                {currentStory.themes && currentStory.themes.length > 0 && (
                  <div className="flex gap-2 mt-4 flex-wrap justify-center">
                    {currentStory.themes.slice(0, 3).map((theme) => (
                      <span
                        key={theme}
                        className="px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-mono"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-1.5 mt-6">
              {displayStories.slice(0, 10).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentStoryIndex % 10
                      ? 'bg-primary scale-125'
                      : 'bg-primary/30'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs tracking-widest">
            <Play className="w-4 h-4" />
            TAP ANYWHERE TO START
          </div>
        </motion.div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
