import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Story } from '@shared/schema';
import { Rewind, Zap, MapPin, Eye, Share2, Download, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumStoryCardProps {
  story: Story;
  index: number;
  onView: (story: Story) => void;
  onShare?: (story: Story) => void;
  size?: 'small' | 'medium' | 'large';
}

const FILM_BORDER_COLORS = {
  origin: { primary: '#c026d3', secondary: '#7c3aed', glow: 'rgba(192, 38, 211, 0.5)' },
  future: { primary: '#06b6d4', secondary: '#3b82f6', glow: 'rgba(6, 182, 212, 0.5)' },
  legend: { primary: '#f59e0b', secondary: '#ef4444', glow: 'rgba(245, 158, 11, 0.5)' },
};

function getTrackColors(trackId: string) {
  return FILM_BORDER_COLORS[trackId as keyof typeof FILM_BORDER_COLORS] || FILM_BORDER_COLORS.future;
}

function getTrackIcon(trackId: string) {
  switch (trackId) {
    case 'origin': return <Rewind className="w-3 h-3" />;
    case 'future': return <Zap className="w-3 h-3" />;
    case 'legend': return <MapPin className="w-3 h-3" />;
    default: return <Zap className="w-3 h-3" />;
  }
}

function FilmSprocketHoles({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`absolute top-0 bottom-0 ${side === 'left' ? 'left-0' : 'right-0'} w-4 flex flex-col justify-around py-2`}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-3 mx-auto rounded-sm bg-black/80 border border-white/10"
        />
      ))}
    </div>
  );
}

export function PremiumStoryCard({ story, index, onView, onShare, size = 'medium' }: PremiumStoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = getTrackColors(story.trackId);
  const hasPoster = story.posterUrl && story.posterStatus === 'ready';

  const sizeClasses = {
    small: 'aspect-[2/3]',
    medium: 'aspect-[3/4]',
    large: 'aspect-[2/3] min-h-[400px]',
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="relative group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView(story)}
      data-testid={`premium-card-${story.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(story); }}}
      aria-label={`View story: ${story.title}`}
    >
      <motion.div
        className={`relative ${sizeClasses[size]} rounded-sm overflow-hidden`}
        animate={{
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          boxShadow: isHovered 
            ? `0 0 60px ${colors.glow}, 0 25px 50px rgba(0,0,0,0.5), inset 0 0 80px rgba(0,0,0,0.3)`
            : `0 0 25px ${colors.glow.replace('0.5', '0.25')}, 0 15px 35px rgba(0,0,0,0.4)`,
        }}
      >
        <div 
          className="absolute inset-0 z-10 pointer-events-none rounded-sm"
          style={{
            background: `linear-gradient(90deg, ${colors.primary} 0%, transparent 3%, transparent 97%, ${colors.secondary} 100%)`,
          }}
        />
        
        <div 
          className="absolute top-0 left-0 right-0 h-6 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, ${colors.primary}40 0%, transparent 100%)`,
          }}
        />
        <div 
          className="absolute bottom-0 left-0 right-0 h-6 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(0deg, ${colors.secondary}40 0%, transparent 100%)`,
          }}
        />

        <FilmSprocketHoles side="left" />
        <FilmSprocketHoles side="right" />

        <div className="absolute inset-0 mx-4">
          {hasPoster ? (
            <img
              src={story.posterUrl!}
              alt={`Cinematic poster for ${story.title}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 flex flex-col items-center justify-center">
              <motion.div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}30, ${colors.secondary}30)`,
                  border: `2px solid ${colors.primary}50`,
                }}
                animate={{ 
                  boxShadow: isHovered 
                    ? `0 0 30px ${colors.glow}` 
                    : `0 0 15px ${colors.glow.replace('0.5', '0.2')}` 
                }}
              >
                <span className="text-white text-3xl">
                  {getTrackIcon(story.trackId)}
                </span>
              </motion.div>
              <p className="font-display text-sm text-white/80 mb-1">{story.trackTitle}</p>
              <p className="text-xs text-white/50 font-mono tracking-wider">GENERATING POSTER</p>
            </div>
          )}
        </div>

        <div 
          className="absolute inset-0 pointer-events-none z-20 opacity-[0.08]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.4) 1px, rgba(0,0,0,0.4) 2px),
              repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)
            `,
          }}
        />
        
        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            opacity: 0.03,
            mixBlendMode: 'overlay',
          }}
        />

        <motion.div
          className="absolute inset-x-4 bottom-0 z-30"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
          }}
          animate={{ height: isHovered ? '60%' : '45%' }}
          transition={{ duration: 0.4 }}
        />

        <motion.div
          className="absolute bottom-0 left-4 right-4 p-4 z-40"
          animate={{ y: isHovered ? 0 : 8 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span 
              className="px-2 py-0.5 rounded-sm text-[10px] font-mono flex items-center gap-1 text-white uppercase tracking-wider"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}80, ${colors.secondary}80)`,
                border: `1px solid ${colors.primary}60`,
              }}
            >
              {getTrackIcon(story.trackId)}
              {story.trackTitle}
            </span>
            {story.themes.length > 0 && (
              <span className="flex items-center gap-0.5 text-amber-400 text-[10px]">
                <Star className="w-2.5 h-2.5 fill-current" />
              </span>
            )}
          </div>

          <h3 
            className="font-display text-xl text-white leading-tight mb-1 tracking-wide"
            style={{
              textShadow: `0 2px 10px rgba(0,0,0,0.8), 0 0 30px ${colors.glow.replace('0.5', '0.3')}`,
            }}
            data-testid={`text-title-${story.id}`}
          >
            {story.title}
          </h3>

          <motion.div
            animate={{ opacity: isHovered ? 1 : 0.7, height: isHovered ? 'auto' : '0' }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p 
              className="text-xs text-white/80 line-clamp-2 mb-3 italic"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
              data-testid={`text-logline-${story.id}`}
            >
              "{story.logline}"
            </p>
            
            <div className="flex items-center justify-between text-white/60 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider">By {story.author}</span>
              </div>
              <span className="text-[10px] font-mono">{story.neighborhood}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] text-white/90"
                onClick={(e) => { e.stopPropagation(); onView(story); }}
                data-testid={`button-view-${story.id}`}
              >
                <Eye className="w-3 h-3 mr-1" /> VIEW
              </Button>
              {onShare && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] text-white/90"
                  onClick={(e) => { e.stopPropagation(); onShare(story); }}
                  data-testid={`button-share-${story.id}`}
                >
                  <Share2 className="w-3 h-3 mr-1" /> SHARE
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute top-2 right-6 z-40"
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}60, ${colors.secondary}60)`,
              border: `1px solid ${colors.primary}80`,
            }}
          >
            <Eye className="w-4 h-4 text-white" />
          </div>
        </motion.div>

        <div className="absolute top-2 left-6 z-40 flex items-center gap-1 text-[8px] font-mono text-white/40 uppercase tracking-widest">
          <span>Story Arcade</span>
          <span className="mx-1">|</span>
          <span>#{story.id}</span>
        </div>
      </motion.div>

      <motion.div
        className="flex gap-1 mt-3 flex-wrap justify-center"
        animate={{ opacity: isHovered ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
      >
        {story.themes.slice(0, 3).map((theme) => (
          <span
            key={theme}
            className="px-2 py-0.5 rounded-sm text-[9px] font-mono text-muted-foreground uppercase tracking-wider"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15)`,
              border: `1px solid ${colors.primary}30`,
            }}
          >
            {theme}
          </span>
        ))}
      </motion.div>
    </motion.article>
  );
}
