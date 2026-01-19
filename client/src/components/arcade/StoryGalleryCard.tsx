import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Story } from '@shared/schema';
import { Rewind, Zap, MapPin, Eye } from 'lucide-react';

interface StoryGalleryCardProps {
  story: Story;
  index: number;
  onView: (story: Story) => void;
}

const GLOW_COLORS = [
  { gradient: 'from-cyan-500/20 to-blue-600/20', glow: 'rgba(34, 211, 238, 0.4)', accent: 'text-cyan-400' },
  { gradient: 'from-pink-500/20 to-rose-600/20', glow: 'rgba(236, 72, 153, 0.4)', accent: 'text-pink-400' },
  { gradient: 'from-fuchsia-500/20 to-purple-600/20', glow: 'rgba(192, 38, 211, 0.4)', accent: 'text-fuchsia-400' },
  { gradient: 'from-teal-500/20 to-emerald-600/20', glow: 'rgba(20, 184, 166, 0.4)', accent: 'text-teal-400' },
  { gradient: 'from-amber-500/20 to-orange-600/20', glow: 'rgba(251, 191, 36, 0.4)', accent: 'text-amber-400' },
  { gradient: 'from-violet-500/20 to-indigo-600/20', glow: 'rgba(139, 92, 246, 0.4)', accent: 'text-violet-400' },
];

function getTrackIcon(trackId: string) {
  switch (trackId) {
    case 'origin': return <Rewind className="w-3 h-3" />;
    case 'future': return <Zap className="w-3 h-3" />;
    case 'legend': return <MapPin className="w-3 h-3" />;
    default: return <Zap className="w-3 h-3" />;
  }
}

function getPlaceholderGradient(trackId: string) {
  switch (trackId) {
    case 'origin': return 'from-fuchsia-900 via-purple-900 to-indigo-900';
    case 'future': return 'from-cyan-900 via-blue-900 to-indigo-900';
    case 'legend': return 'from-amber-900 via-orange-900 to-red-900';
    default: return 'from-gray-900 via-slate-900 to-zinc-900';
  }
}

export function StoryGalleryCard({ story, index, onView }: StoryGalleryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colorScheme = GLOW_COLORS[index % GLOW_COLORS.length];
  const hasPoster = story.posterUrl && story.posterStatus === 'ready';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onView(story)}
      data-testid={`gallery-card-${story.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(story); }}}
      aria-label={`View story: ${story.title}`}
    >
      <motion.div
        className="relative aspect-[3/4] rounded-md overflow-hidden cabinet-card-frame"
        animate={{
          scale: isHovered ? 1.03 : 1,
          boxShadow: isHovered 
            ? `0 0 40px ${colorScheme.glow}, 0 20px 40px rgba(0,0,0,0.4)`
            : `0 0 15px ${colorScheme.glow.replace('0.4', '0.2')}, 0 10px 20px rgba(0,0,0,0.3)`,
        }}
        transition={{ duration: 0.3 }}
      >
        {hasPoster ? (
          <img
            src={story.posterUrl!}
            alt={`Poster for ${story.title}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getPlaceholderGradient(story.trackId)} flex flex-col items-center justify-center p-4`}>
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorScheme.gradient} flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10`}>
              <span className={`text-2xl ${colorScheme.accent}`}>
                {getTrackIcon(story.trackId)}
              </span>
            </div>
            <div className="text-center">
              <p className="font-display text-sm text-white/80 mb-1">{story.trackTitle}</p>
              <p className="text-xs text-white/50 font-mono">Poster generating...</p>
            </div>
          </div>
        )}
        
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
          }}
        />
        
        <motion.div
          className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent`}
          animate={{ opacity: isHovered ? 1 : 0.7 }}
          transition={{ duration: 0.3 }}
        />
        
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4"
          animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-[10px] font-mono flex items-center gap-1 ${colorScheme.accent}`}>
              {getTrackIcon(story.trackId)}
              {story.trackTitle}
            </span>
          </div>
          
          <h3 className="font-display text-lg text-white leading-tight mb-1 drop-shadow-lg">
            {story.title}
          </h3>
          
          <motion.div
            animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? 'auto' : 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-white/70 line-clamp-2 mb-2">
              {story.logline}
            </p>
            <div className="flex items-center gap-2 text-white/60">
              <span className="text-[10px] font-mono">by {story.author}</span>
              <span className="text-[10px]">•</span>
              <span className="text-[10px] font-mono">{story.neighborhood}</span>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div
          className="absolute top-3 right-3"
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <div className={`w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center ${colorScheme.accent}`}>
            <Eye className="w-4 h-4" />
          </div>
        </motion.div>
      </motion.div>
      
      <motion.div
        className="flex gap-1 mt-2 flex-wrap"
        animate={{ opacity: isHovered ? 1 : 0.6 }}
        transition={{ duration: 0.2 }}
      >
        {story.themes.slice(0, 2).map((theme) => (
          <span
            key={theme}
            className="px-2 py-0.5 rounded-full bg-muted/30 border border-border/50 text-[9px] font-mono text-muted-foreground"
          >
            {theme}
          </span>
        ))}
      </motion.div>
    </motion.article>
  );
}
