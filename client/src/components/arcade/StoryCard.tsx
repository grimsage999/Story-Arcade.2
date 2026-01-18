import { useState } from 'react';
import { Share2, Copy, Check, Rewind, Zap, MapPin, ExternalLink } from 'lucide-react';
import type { Story } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface StoryCardProps {
  story: Story;
  onView?: (story: Story) => void;
  compact?: boolean;
}

function getIcon(trackId: string) {
  switch (trackId) {
    case 'origin':
      return <Rewind className="w-3 h-3" aria-hidden="true" />;
    case 'future':
      return <Zap className="w-3 h-3" aria-hidden="true" />;
    case 'legend':
      return <MapPin className="w-3 h-3" aria-hidden="true" />;
    default:
      return <Zap className="w-3 h-3" aria-hidden="true" />;
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
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const getShareUrl = () => {
    if (!story.shareableId) return window.location.href;
    return `${window.location.origin}/story/${story.shareableId}`;
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this story with friends." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };
  
  const handleShare = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.share({
        title: story.title,
        text: story.logline,
        url: shareUrl,
      });
    } catch {
      handleCopyLink();
    }
  };
  
  const handleOpenStory = () => {
    if (story.shareableId) {
      window.open(`/story/${story.shareableId}`, '_blank');
    }
  };

  if (compact) {
    return (
      <article 
        className="bg-card border border-card-border rounded-md p-4 hover:border-primary/30 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        onClick={() => onView?.(story)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView?.(story); }}}
        data-testid={`card-story-${story.id}`}
        tabIndex={0}
        role="button"
        aria-label={`View story: ${story.title} by ${story.author}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono flex items-center gap-1 ${accentClass}`}>
            {getIcon(story.trackId)}
            {story.trackTitle}
          </span>
        </div>
        <h4 className="font-display text-lg text-foreground mb-1">{story.title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2">{story.logline}</p>
      </article>
    );
  }

  return (
    <article 
      className="bg-card border border-card-border rounded-md p-6 hover:border-primary/30 transition-colors group"
      data-testid={`card-story-${story.id}`}
      aria-label={`Story: ${story.title} by ${story.author}`}
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
      
      <div className="flex items-center gap-2 pt-4 border-t border-border flex-wrap">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCopyLink}
          className="text-muted-foreground hover:text-foreground"
          data-testid={`button-copy-${story.id}`}
          aria-label={`Copy link for story: ${story.title}`}
        >
          {copied ? (
            <><Check className="w-4 h-4 mr-1 text-green-500" aria-hidden="true" /> Copied!</>
          ) : (
            <><Copy className="w-4 h-4 mr-1" aria-hidden="true" /> Copy Link</>
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleShare}
          className="text-muted-foreground hover:text-foreground"
          data-testid={`button-share-${story.id}`}
          aria-label={`Share story: ${story.title}`}
        >
          <Share2 className="w-4 h-4 mr-1" aria-hidden="true" /> Share
        </Button>
        {story.shareableId && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleOpenStory}
            className="text-muted-foreground hover:text-foreground"
            data-testid={`button-open-${story.id}`}
            aria-label={`Open story: ${story.title} in new tab`}
          >
            <ExternalLink className="w-4 h-4 mr-1" aria-hidden="true" /> Open
          </Button>
        )}
        {onView && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onView(story)}
            className="ml-auto text-primary"
            data-testid={`button-view-${story.id}`}
            aria-label={`Read full story: ${story.title}`}
          >
            Read Full Story
          </Button>
        )}
      </div>
    </article>
  );
}
