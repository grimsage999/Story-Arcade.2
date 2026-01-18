import { Rewind, Zap, MapPin, ArrowRight } from 'lucide-react';
import type { Track } from '@shared/schema';

interface TrackCardProps {
  track: Track;
  onSelect: (track: Track) => void;
}

function getIcon(trackId: string) {
  switch (trackId) {
    case 'origin':
      return <Rewind className="w-6 h-6 text-fuchsia-400" aria-hidden="true" />;
    case 'future':
      return <Zap className="w-6 h-6 text-cyan-400" aria-hidden="true" />;
    case 'legend':
      return <MapPin className="w-6 h-6 text-amber-400" aria-hidden="true" />;
    default:
      return <Zap className="w-6 h-6 text-cyan-400" aria-hidden="true" />;
  }
}

export function TrackCard({ track, onSelect }: TrackCardProps) {
  const borderHoverClass = track.id === 'origin' 
    ? 'hover:border-fuchsia-500' 
    : track.id === 'future' 
    ? 'hover:border-cyan-400' 
    : 'hover:border-amber-400';

  return (
    <button 
      onClick={() => onSelect(track)}
      className={`group relative min-h-[220px] md:h-[360px] bg-card border border-card-border ${borderHoverClass} p-6 md:p-8 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(0,0,0,0.4)] overflow-hidden rounded-md active:scale-[0.98] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400`}
      data-testid={`card-track-${track.id}`}
      aria-label={`Select ${track.title} track: ${track.subtitle}. ${track.questions.length} questions.`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${track.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6 gap-2 flex-wrap">
          <div className="p-3 rounded-md bg-secondary border border-border shadow-inner group-hover:scale-110 transition-transform duration-300">
            {getIcon(track.id)}
          </div>
          {track.badge && (
            <span className="px-2 py-1 bg-white/5 border border-white/10 text-[10px] font-mono text-foreground rounded-sm tracking-wider">
              {track.badge}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-display text-2xl md:text-3xl text-foreground mb-2 leading-none group-hover:text-primary transition-colors">
            {track.title}
          </h3>
          <p className="font-mono text-xs text-muted-foreground mb-3 tracking-wide">
            {track.subtitle}
          </p>
          <p className="font-sans text-xs md:text-sm text-muted-foreground leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
            {track.description}
          </p>
        </div>
        <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between gap-2 text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors flex-wrap">
          <span>{track.questions.length} QUESTIONS</span>
          <span className="flex items-center">
            INSERT <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </span>
        </div>
      </div>
    </button>
  );
}
