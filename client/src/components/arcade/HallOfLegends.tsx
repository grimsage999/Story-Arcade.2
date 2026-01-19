import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Story } from '@shared/schema';

interface HallOfLegendsProps {
  stories: Story[];
  autoPlay?: boolean;
  cycleDuration?: number;
  onClose?: () => void;
}

const trackGradients = {
  origin: 'from-fuchsia-900 via-violet-950 to-black',
  future: 'from-cyan-900 via-blue-950 to-black',
  legend: 'from-amber-900 via-red-950 to-black',
};

const trackAccents = {
  origin: 'text-fuchsia-400',
  future: 'text-cyan-400',
  legend: 'text-amber-400',
};

const trackBorderColors = {
  origin: 'border-fuchsia-500/30',
  future: 'border-cyan-500/30',
  legend: 'border-amber-500/30',
};

export function HallOfLegends({ 
  stories, 
  autoPlay = true, 
  cycleDuration = 8000,
  onClose 
}: HallOfLegendsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [mouseTimeout, setMouseTimeout] = useState<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];
  const track = (currentStory?.trackId || 'origin') as keyof typeof trackGradients;

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  }, [stories.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  }, [stories.length]);

  useEffect(() => {
    if (!isPlaying || stories.length <= 1) return;
    const interval = setInterval(goNext, cycleDuration);
    return () => clearInterval(interval);
  }, [isPlaying, cycleDuration, goNext, stories.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(!isPlaying); }
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, isPlaying, onClose]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (mouseTimeout) clearTimeout(mouseTimeout);
    const timeout = setTimeout(() => setShowControls(false), 3000);
    setMouseTimeout(timeout);
  };

  if (!currentStory || stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white/60">No Stories Available</h2>
          <p className="text-white/40">Create some stories to view in the Hall of Legends</p>
          {onClose && (
            <Button variant="outline" onClick={onClose} data-testid="button-close-empty">
              Exit Gallery
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden cursor-none"
      onMouseMove={handleMouseMove}
      data-testid="hall-of-legends"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className={`absolute inset-0 bg-gradient-to-b ${trackGradients[track]}`}
        >
          <div className="absolute inset-0 bg-black/40" />
          
          {currentStory.posterUrl && currentStory.posterUrl.startsWith('data:') && (
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.3 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <img 
                src={currentStory.posterUrl} 
                alt="" 
                className="w-full h-full object-cover blur-sm"
                aria-hidden="true"
              />
            </motion.div>
          )}

          <div className="absolute inset-0 flex items-center justify-center p-8 md:p-16">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-5xl w-full flex flex-col md:flex-row gap-8 md:gap-16 items-center"
            >
              {currentStory.posterUrl && currentStory.posterUrl.startsWith('data:') ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className={`relative w-72 md:w-96 aspect-[2/3] rounded-lg overflow-hidden border-2 ${trackBorderColors[track]} shadow-2xl`}
                >
                  <img 
                    src={currentStory.posterUrl} 
                    alt={currentStory.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </motion.div>
              ) : (
                <div className={`relative w-72 md:w-96 aspect-[2/3] rounded-lg overflow-hidden border-2 ${trackBorderColors[track]} bg-gradient-to-br ${trackGradients[track]} flex items-center justify-center`}>
                  <span className="text-6xl font-serif text-white/20">{currentStory.title[0]}</span>
                </div>
              )}

              <div className="flex-1 text-center md:text-left space-y-6">
                <motion.div
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <span className={`text-sm uppercase tracking-[0.3em] font-mono ${trackAccents[track]}`}>
                    {currentStory.trackTitle || currentStory.trackId} Track
                  </span>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mt-2 leading-tight">
                    {currentStory.title}
                  </h1>
                </motion.div>

                {currentStory.logline && (
                  <motion.p
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="text-xl md:text-2xl text-white/70 leading-relaxed font-serif italic"
                  >
                    "{currentStory.logline}"
                  </motion.p>
                )}

                {currentStory.themes && currentStory.themes.length > 0 && (
                  <motion.div
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="flex flex-wrap gap-2 justify-center md:justify-start"
                  >
                    {currentStory.themes.slice(0, 4).map((theme, i) => (
                      <span 
                        key={i}
                        className={`px-3 py-1 text-sm rounded-full border ${trackBorderColors[track]} text-white/60 bg-white/5`}
                      >
                        {theme}
                      </span>
                    ))}
                  </motion.div>
                )}

                <motion.div
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className="text-white/40 text-sm font-mono"
                >
                  {currentStory.neighborhood && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {currentStory.neighborhood}
                    </span>
                  )}
                  {currentStory.author && (
                    <span className="ml-4">by {currentStory.author}</span>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {stories.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover-elevate ${
                  i === currentIndex 
                    ? 'w-8 bg-white' 
                    : 'bg-white/30'
                }`}
                aria-label={`Go to story ${i + 1}`}
                data-testid={`dot-${i}`}
              />
            ))}
          </div>

          <div className="absolute bottom-8 left-8 font-mono text-white/20 text-xs">
            {currentIndex + 1} / {stories.length}
          </div>

          <div className="absolute top-4 right-4 text-xs font-mono text-white/30">
            STORY ARCADE • HALL OF LEGENDS
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"
        style={{ cursor: 'auto' }}
      >
        <div className="flex items-center justify-center gap-4 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            className="text-white/60"
            data-testid="button-prev"
            aria-label="Previous story"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white/60"
            data-testid="button-play-pause"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            className="text-white/60"
            data-testid="button-next"
            aria-label="Next story"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          <div className="w-px h-6 bg-white/20 mx-2" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="text-white/60"
            data-testid="button-mute"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          {onClose && (
            <>
              <div className="w-px h-6 bg-white/20 mx-2" />
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white/60"
                data-testid="button-close"
                aria-label="Exit gallery mode"
              >
                <X className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute top-0 inset-x-0 p-8 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-start pointer-events-none"
      >
        <div className="pointer-events-auto">
          <h2 className="text-white font-bold text-xl tracking-wide">HALL OF LEGENDS</h2>
          <p className="text-white/50 text-sm mt-1">Community Story Showcase</p>
        </div>
      </motion.div>

      {isPlaying && (
        <motion.div
          key={currentIndex}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: cycleDuration / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 h-1 origin-left ${
            track === 'origin' ? 'bg-fuchsia-500' : 
            track === 'future' ? 'bg-cyan-500' : 
            'bg-amber-500'
          }`}
          style={{ width: '100%' }}
        />
      )}

      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
