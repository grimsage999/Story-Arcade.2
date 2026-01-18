import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PosterStatus {
  posterUrl: string | null;
  status: string;
  error?: string;
}

interface StoryPosterProps {
  storyId: number;
  storyTitle: string;
  autoGenerate?: boolean;
}

const RATE_LIMIT_COOLDOWN_MS = 60000;

export function StoryPoster({ storyId, storyTitle, autoGenerate = true }: StoryPosterProps) {
  const [hasTriggered, setHasTriggered] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: posterStatus } = useQuery<PosterStatus>({
    queryKey: ["/api/stories", storyId, "poster"],
    refetchInterval: (query) => {
      const data = query.state.data as PosterStatus | undefined;
      if (data?.status === "generating") {
        return 3000;
      }
      return false;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/stories/${storyId}/poster`);
      const data = await res.json();
      
      if (!res.ok && res.status !== 202) {
        if (res.status === 429) {
          throw new Error("RATE_LIMIT");
        }
        throw new Error(data.error || "Failed to generate poster");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId, "poster"] });
    },
    onError: (error: Error) => {
      if (error.message === "RATE_LIMIT") {
        setRateLimitUntil(Date.now() + RATE_LIMIT_COOLDOWN_MS);
        setCooldownRemaining(Math.ceil(RATE_LIMIT_COOLDOWN_MS / 1000));
        toast({
          title: "Slow down!",
          description: "Too many poster requests. Please wait a minute.",
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    if (!rateLimitUntil) {
      setCooldownRemaining(0);
      return;
    }
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining <= 0) setRateLimitUntil(null);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [rateLimitUntil]);

  useEffect(() => {
    if (
      autoGenerate &&
      !hasTriggered &&
      posterStatus?.status === "pending" &&
      !generateMutation.isPending
    ) {
      setHasTriggered(true);
      generateMutation.mutate();
    }
  }, [autoGenerate, hasTriggered, posterStatus?.status, generateMutation]);

  const handleDownload = () => {
    if (!posterStatus?.posterUrl) return;
    
    const link = document.createElement("a");
    link.href = posterStatus.posterUrl;
    link.download = `${storyTitle.replace(/[^a-z0-9]/gi, "_")}_poster.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isGenerating = posterStatus?.status === "generating" || generateMutation.isPending;
  const hasPoster = posterStatus?.status === "ready" && posterStatus?.posterUrl;
  const hasFailed = posterStatus?.status === "failed";
  const isRateLimited = cooldownRemaining > 0;


  if (hasPoster) {
    return (
      <div className="relative group" data-testid="story-poster-container">
        <div className="aspect-[2/3] w-full max-w-xs mx-auto rounded-lg overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/20">
          <img
            src={posterStatus.posterUrl!}
            alt={`Poster for ${storyTitle}`}
            className="w-full h-full object-cover"
            data-testid="poster-image"
          />
        </div>
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={handleDownload}
            className="bg-background/80 backdrop-blur-sm"
            data-testid="button-download-poster"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || isRateLimited}
            className="bg-background/80 backdrop-blur-sm"
            data-testid="button-regenerate-poster"
            title={isRateLimited ? `Wait ${cooldownRemaining}s` : "Regenerate poster"}
          >
            <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div 
        className="aspect-[2/3] w-full max-w-xs mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/30 flex flex-col items-center justify-center gap-3 p-4"
        data-testid="story-poster-container"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-primary" />
        </motion.div>
        <p className="font-display text-sm text-foreground">CREATING POSTER...</p>
        <p className="text-xs text-muted-foreground font-mono">~15-30 seconds</p>
      </div>
    );
  }

  if (hasFailed) {
    return (
      <div 
        className="aspect-[2/3] w-full max-w-xs mx-auto bg-muted/20 rounded-lg border border-destructive/30 flex flex-col items-center justify-center gap-3 p-4"
        data-testid="story-poster-container"
      >
        <Sparkles className="w-8 h-8 text-destructive/70" />
        <div className="text-center">
          <p className="font-display text-sm text-foreground mb-1">POSTER FAILED</p>
          <p className="text-xs text-muted-foreground font-mono">Try again</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || isRateLimited}
          className="font-mono text-xs gap-2"
          data-testid="button-retry-poster"
        >
          {isRateLimited ? (
            <>Wait {cooldownRemaining}s</>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Retry
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="aspect-[2/3] w-full max-w-xs mx-auto bg-muted/20 rounded-lg border border-muted/30 flex flex-col items-center justify-center gap-3 p-4"
      data-testid="story-poster-container"
    >
      <Sparkles className="w-8 h-8 text-muted-foreground" />
      <div className="text-center">
        <p className="font-display text-sm text-foreground mb-1">CREATE POSTER</p>
        <p className="text-xs text-muted-foreground font-mono">AI-generated artwork</p>
      </div>
      <Button
        size="sm"
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending || isRateLimited}
        className="font-mono text-xs gap-2"
        data-testid="button-generate-poster"
      >
        {isRateLimited ? (
          <>Wait {cooldownRemaining}s</>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate
          </>
        )}
      </Button>
    </div>
  );
}
