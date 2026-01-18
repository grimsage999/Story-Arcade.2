import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Sparkles, ArrowLeft, Share2, Copy, Check, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SkipLink } from '@/components/arcade/SkipLink';
import { StaticStarfield } from '@/components/arcade/StarfieldBackground';
import type { Story } from '@shared/schema';

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

export default function StoryPage() {
  const { shareableId } = useParams<{ shareableId: string }>();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: story, isLoading, error } = useQuery<Story>({
    queryKey: ['/api/stories/share', shareableId],
    queryFn: async () => {
      const response = await fetch(`/api/stories/share/${shareableId}`);
      if (!response.ok) {
        throw new Error('Story not found');
      }
      return response.json();
    },
    enabled: !!shareableId,
  });

  // Update page title and Open Graph meta tags for social sharing
  useEffect(() => {
    if (!story) return;
    
    document.title = `${story.title} | Story Arcade`;
    
    // Set Open Graph meta tags for social sharing
    const metaTags = [
      { property: 'og:title', content: story.title },
      { property: 'og:description', content: story.logline },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: window.location.href },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: story.title },
      { name: 'twitter:description', content: story.logline },
    ];
    
    // Add poster image if available
    if (story.posterUrl) {
      metaTags.push(
        { property: 'og:image', content: story.posterUrl },
        { name: 'twitter:image', content: story.posterUrl }
      );
    }
    
    // Track created meta tags for cleanup
    const createdTags: HTMLMetaElement[] = [];
    
    metaTags.forEach(({ property, name, content }) => {
      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) meta.setAttribute('property', property);
        if (name) meta.setAttribute('name', name);
        document.head.appendChild(meta);
        createdTags.push(meta);
      }
      meta.setAttribute('content', content);
    });
    
    return () => {
      document.title = 'Story Arcade';
      // Clean up created meta tags
      createdTags.forEach(tag => tag.remove());
    };
  }, [story]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this story with friends and family.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the URL from your browser's address bar.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (story && navigator.share) {
      try {
        await navigator.share({
          title: story.title,
          text: story.logline,
          url: window.location.href,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };
  
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = story ? `"${story.title}" - ${story.logline}` : '';
  
  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };
  
  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };
  
  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center">
        <StaticStarfield />
        <div className="relative text-center">
          <Sparkles className="w-8 h-8 text-primary animate-pulse mx-auto mb-4" aria-hidden="true" />
          <p className="text-muted-foreground font-mono text-sm">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <StaticStarfield />
        <SkipLink />
        <main id="main-content" role="main" className="relative text-center max-w-md">
          <h1 className="font-display text-3xl text-foreground mb-4">Story Not Found</h1>
          <p className="text-muted-foreground mb-8">
            This story may have been removed or the link is incorrect.
          </p>
          <Link href="/">
            <Button data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back to Story Arcade
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const accentClass = getAccentColor(story.trackId);

  return (
    <div className="relative min-h-screen bg-background">
      <StaticStarfield />
      <SkipLink />
      
      <nav 
        className="fixed top-0 left-0 w-full z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 md:px-8 py-4 flex justify-between items-center gap-4"
        role="navigation"
        aria-label="Story page navigation"
      >
        <Link href="/">
          <a 
            className="flex items-center gap-3 group"
            data-testid="link-home"
            aria-label="Story Arcade - Return to home page"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-sm flex items-center justify-center shadow-lg shadow-cyan-900/50 group-hover:rotate-3 transition-transform">
              <Sparkles className="w-5 h-5 text-black fill-black" aria-hidden="true" />
            </div>
            <span className="font-display text-lg md:text-xl text-foreground tracking-[0.15em]">STORY ARCADE</span>
          </a>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            data-testid="button-copy-link"
            aria-label="Copy story link to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 mr-2 text-green-500" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleShare}
            data-testid="button-share-story"
            aria-label="Share this story"
          >
            <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />
            Share
          </Button>
        </div>
      </nav>

      <main id="main-content" role="main" className="pt-24 pb-16 px-4 md:px-8 max-w-3xl mx-auto">
        <article 
          className="bg-card border border-card-border rounded-md p-6 md:p-10"
          aria-labelledby="story-title"
        >
          <div className="mb-6">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono mb-4 ${accentClass}`}>
              {story.trackTitle}
            </span>
            <h1 
              id="story-title" 
              className="font-display text-3xl md:text-5xl text-foreground mb-3"
            >
              {story.title}
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              by {story.author} • {story.neighborhood}
            </p>
          </div>
          
          <blockquote className="text-lg md:text-xl text-primary font-display italic mb-8 border-l-4 border-primary pl-4">
            "{story.logline}"
          </blockquote>
          
          <div className="space-y-5 text-foreground leading-relaxed text-base md:text-lg">
            <p>{story.p1}</p>
            <p>{story.p2}</p>
            <p>{story.p3}</p>
          </div>
          
          {story.insight && (
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-muted-foreground font-mono text-xs tracking-widest mb-2">
                INSIGHT
              </p>
              <p className="text-foreground italic">{story.insight}</p>
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-8 pt-6 border-t border-border flex-wrap" aria-label="Story themes">
            {story.themes.map((theme) => (
              <span 
                key={theme}
                className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono"
              >
                {theme}
              </span>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-muted-foreground font-mono text-xs tracking-widest mb-4">SHARE THIS STORY</p>
            <div className="flex flex-wrap gap-2 mb-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyLink}
                className="font-mono text-xs gap-2"
                data-testid="button-copy-link-footer"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTwitterShare}
                className="font-mono text-xs gap-2"
                data-testid="button-share-twitter"
              >
                <Twitter className="w-4 h-4" />
                Twitter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleFacebookShare}
                className="font-mono text-xs gap-2"
                data-testid="button-share-facebook"
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleWhatsAppShare}
                className="font-mono text-xs gap-2"
                data-testid="button-share-whatsapp"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/">
                <Button className="w-full sm:w-auto" data-testid="button-create-story">
                  <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                  Create Your Own Story
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleShare}
                className="w-full sm:w-auto"
                data-testid="button-share-story-footer"
              >
                <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />
                Share via Device
              </Button>
            </div>
          </div>
        </article>

        <footer className="mt-8 text-center">
          <p className="text-muted-foreground font-mono text-xs tracking-widest">
            PRINTED BY STORY ARCADE v1.0
          </p>
        </footer>
      </main>
    </div>
  );
}
