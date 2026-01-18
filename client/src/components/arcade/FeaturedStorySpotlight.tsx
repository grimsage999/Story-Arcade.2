import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Story } from '@shared/schema';
import { ChevronLeft, ChevronRight, Sparkles, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeaturedStorySpotlightProps {
  stories: Story[];
  onViewStory: (story: Story) => void;
  autoPlayInterval?: number;
}

export function FeaturedStorySpotlight({ 
  stories, 
  onViewStory, 
  autoPlayInterval = 6000 
}: FeaturedStorySpotlightProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const featuredStories = stories
    .filter(s => s.posterUrl && s.posterStatus === 'ready')
    .slice(0, 5);
  
  useEffect(() => {
    if (featuredStories.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredStories.length);
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [featuredStories.length, autoPlayInterval, isPaused]);
  
  if (featuredStories.length === 0) {
    return null;
  }
  
  const currentStory = featuredStories[currentIndex];
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredStories.length);
  };
  
  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredStories.length) % featuredStories.length);
  };

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        <span className="font-mono text-xs tracking-widest text-primary uppercase">Featured Stories</span>
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
      </div>
      
      <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {currentStory.posterUrl && (
              <img
                src={currentStory.posterUrl}
                alt={currentStory.title}
                className="w-full h-full object-cover"
              />
            )}
            
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
              }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-0 left-0 right-0 p-6 md:p-10"
            >
              <div className="max-w-xl">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary text-xs font-mono mb-3">
                  {currentStory.trackTitle}
                </span>
                
                <h2 className="font-display text-2xl md:text-4xl text-white mb-2 drop-shadow-lg">
                  {currentStory.title}
                </h2>
                
                <p className="text-sm md:text-base text-white/80 mb-4 line-clamp-2">
                  {currentStory.logline}
                </p>
                
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => onViewStory(currentStory)}
                    className="gap-2 bg-primary/90 hover:bg-primary"
                    data-testid={`button-view-featured-${currentStory.id}`}
                  >
                    <Play className="w-4 h-4" />
                    View Story
                  </Button>
                  
                  <span className="text-xs text-white/60 font-mono">
                    by {currentStory.author} • {currentStory.neighborhood}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
        
        {featuredStories.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
              aria-label="Previous story"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
              aria-label="Next story"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        
        <div className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5), 0 0 30px rgba(139, 92, 246, 0.2)',
          }}
        />
      </div>
      
      {featuredStories.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {featuredStories.map((story, idx) => (
            <button
              key={story.id}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-8 h-2 bg-primary rounded-full'
                  : 'w-2 h-2 bg-muted-foreground/40 rounded-full hover:bg-muted-foreground/60'
              }`}
              aria-label={`Go to story ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
