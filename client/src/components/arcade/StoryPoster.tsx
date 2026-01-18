import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PosterStatus {
  posterUrl: string | null;
  status: string;
  error?: string;
}

interface StoryPosterProps {
  storyId: number;
  storyTitle: string;
  trackId?: string;
  autoGenerate?: boolean;
}

const TRACK_GRADIENTS: Record<string, { from: string; via: string; to: string }> = {
  origin: { from: "from-amber-900/80", via: "via-orange-800/60", to: "to-yellow-900/40" },
  future: { from: "from-cyan-900/80", via: "via-blue-800/60", to: "to-indigo-900/40" },
  legend: { from: "from-purple-900/80", via: "via-fuchsia-800/60", to: "to-violet-900/40" },
};

const RATE_LIMIT_COOLDOWN_MS = 60000;

export function StoryPoster({ storyId, storyTitle, trackId = "origin", autoGenerate = true }: StoryPosterProps) {
  const gradient = TRACK_GRADIENTS[trackId] || TRACK_GRADIENTS.origin;
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
      <AnimatePresence mode="wait">
        <motion.div 
          className="relative group" 
          data-testid="story-poster-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div 
            className="aspect-[2/3] w-full max-w-xs mx-auto rounded-lg overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/20"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.img
              src={posterStatus.posterUrl!}
              alt={`Poster for ${storyTitle}`}
              className="w-full h-full object-cover"
              data-testid="poster-image"
              initial={{ filter: "blur(10px)" }}
              animate={{ filter: "blur(0px)" }}
              transition={{ duration: 0.4, delay: 0.2 }}
            />
          </motion.div>
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
        </motion.div>
      </AnimatePresence>
    );
  }

  if (isGenerating) {
    return (
      <div 
        className={`aspect-[2/3] w-full max-w-xs mx-auto rounded-lg border-2 border-primary/30 overflow-hidden relative`}
        data-testid="story-poster-container"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient.from} ${gradient.via} ${gradient.to}`} />
        
        <motion.div 
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 40%)"
          }}
          animate={{ 
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
          <motion.div
            className="relative"
            animate={{ 
              y: [0, -8, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 blur-xl"
            >
              <Wand2 className="w-12 h-12 text-white/40" />
            </motion.div>
            <Wand2 className="w-12 h-12 text-white relative z-10" />
          </motion.div>
          
          <div className="text-center">
            <motion.p 
              className="font-display text-lg text-white tracking-wider"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              CREATING MAGIC
            </motion.p>
            <p className="text-xs text-white/60 font-mono mt-1">Your poster is being crafted...</p>
          </div>
          
          <div className="w-full max-w-[120px] h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white/60 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 20, ease: "linear" }}
            />
          </div>
        </div>
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
