import { useEffect, useRef, useId, useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink } from 'lucide-react';
import type { Story } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface StoryModalProps {
  story: Story;
  onClose: () => void;
}

export function StoryModal({ story, onClose }: StoryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const contentId = useId();
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
      toast({ title: "Link copied!" });
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

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
      onClick={onClose}
      data-testid="modal-story"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={contentId}
    >
      <div 
        ref={modalRef}
        className="bg-card border border-primary/30 rounded-md max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-close-modal"
          aria-label="Close story modal"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
        
        <div className="mb-6">
          <p className="text-primary font-mono text-xs tracking-widest mb-2">{story.trackTitle}</p>
          <h2 id={titleId} className="font-display text-2xl md:text-4xl text-foreground mb-2">
            {story.title}
          </h2>
          <p className="text-muted-foreground font-mono text-sm">
            by {story.author} • {story.neighborhood}
          </p>
        </div>
        
        <p className="text-lg text-primary font-display italic mb-6 border-l-4 border-primary pl-4">
          "{story.logline}"
        </p>
        
        <div id={contentId} className="space-y-4 text-foreground leading-relaxed">
          <p>{story.p1}</p>
          <p>{story.p2}</p>
          <p>{story.p3}</p>
        </div>
        
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-border flex-wrap" aria-label="Story themes">
          {story.themes.map((theme) => (
            <span 
              key={theme}
              className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono"
            >
              {theme}
            </span>
          ))}
        </div>
        
        {/* Share buttons */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-border flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyLink}
            className="font-mono text-xs gap-2"
            data-testid="button-modal-copy"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className="font-mono text-xs gap-2"
            data-testid="button-modal-share"
          >
            <Share2 className="w-4 h-4" /> Share
          </Button>
          {story.shareableId && (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleOpenStory}
              className="ml-auto font-mono text-xs gap-2"
              data-testid="button-modal-open"
            >
              <ExternalLink className="w-4 h-4" /> View Full Page
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
