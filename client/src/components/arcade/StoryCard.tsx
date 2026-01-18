import { Share2, Bookmark, Rewind, Zap, MapPin } from 'lucide-react';
import type { Story } from '@shared/schema';
import { Button } from '@/components/ui/button';

interface StoryCardProps {
  story: Story;
  onView?: (story: Story) => void;
  compact?: boolean;
}

function getIcon(trackId: string) {
  switch (trackId) {
    case 'origin':
      return <Rewind className="w-3 h-3" />;
    case 'future':
      return <Zap className="w-3 h-3" />;
    case 'legend':
      return <MapPin className="w-3 h-3" />;
    default:
      return <Zap className="w-3 h-3" />;
  }
}

function getAccentColor(trackId: string) {
  switch (trackId) {
    case 'origin':
      return 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-900/10';
    case 'future':
      return 'text-cyan-400 border-cyan-500/30 bg-cyan-900/10';
    case 'legend':
      return 'text-amber-400 border-amber-500/30 bg-amber-900/10';
    default:
      return 'text-cyan-400 border-cyan-500/30 bg-cyan-900/10';
  }
}

export function StoryCard({ story, onView, compact = false }: StoryCardProps) {
  const accentClass = getAccentColor(story.trackId);
  
  const handleShare = async () => {
    try {
      await navigator.share({
        title: story.title,
        text: story.logline,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(`${story.title}\n\n${story.logline}`);
    }
  };

  if (compact) {
    return (
      <div 
        className="bg-card border border-card-border rounded-md p-4 hover:border-primary/30 transition-colors cursor-pointer"
        onClick={() => onView?.(story)}
        data-testid={`card-story-${story.id}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono flex items-center gap-1 ${accentClass}`}>
            {getIcon(story.trackId)}
            {story.trackTitle}
          </span>
        </div>
        <h4 className="font-display text-lg text-foreground mb-1">{story.title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2">{story.logline}</p>
      </div>
    );
  }

  return (
    <div 
      className="bg-card border border-card-border rounded-md p-6 hover:border-primary/30 transition-colors group"
      data-testid={`card-story-${story.id}`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono flex items-center gap-1 ${accentClass}`}>
              {getIcon(story.trackId)}
              {story.trackTitle}
            </span>
            <span className="text-muted-foreground text-[10px] font-mono">
              by {story.author}
            </span>
          </div>
          <h4 className="font-display text-xl md:text-2xl text-foreground mb-1 group-hover:text-primary transition-colors">
            {story.title}
          </h4>
          <p className="text-xs text-muted-foreground font-mono">
            {story.neighborhood}
          </p>
        </div>
      </div>
      
      <p className="text-sm md:text-base text-muted-foreground mb-4 leading-relaxed">
        {story.logline}
      </p>
      
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {story.themes.map((theme) => (
          <span 
            key={theme} 
            className="px-2 py-0.5 rounded-full border border-border text-[10px] font-mono text-muted-foreground"
          >
            {theme}
          </span>
        ))}
      </div>
      
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleShare}
          className="text-muted-foreground hover:text-foreground"
          data-testid={`button-share-${story.id}`}
        >
          <Share2 className="w-4 h-4 mr-1" /> Share
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          data-testid={`button-bookmark-${story.id}`}
        >
          <Bookmark className="w-4 h-4 mr-1" /> Save
        </Button>
        {onView && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onView(story)}
            className="ml-auto text-primary"
            data-testid={`button-view-${story.id}`}
          >
            Read Full Story
          </Button>
        )}
      </div>
    </div>
  );
}
