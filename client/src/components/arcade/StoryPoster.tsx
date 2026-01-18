import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Image, RefreshCw, Download, Loader2, Sparkles, Palette, Wand2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PosterStatus {
  posterUrl: string | null;
  status: string;
  error?: string;
}

const PROGRESS_STAGES = [
  { icon: Sparkles, label: "Analyzing your story...", duration: 4000 },
  { icon: Palette, label: "Composing visual elements...", duration: 6000 },
  { icon: Wand2, label: "Rendering cinematic poster...", duration: 8000 },
  { icon: Image, label: "Finalizing artwork...", duration: 10000 },
];

interface StoryPosterProps {
  storyId: number;
  storyTitle: string;
  autoGenerate?: boolean;
}

const RATE_LIMIT_COOLDOWN_MS = 60000; // 1 minute cooldown

export function StoryPoster({ storyId, storyTitle, autoGenerate = true }: StoryPosterProps) {
  const [hasTriggered, setHasTriggered] = useState(false);
  const [progressStage, setProgressStage] = useState(0);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const { toast } = useToast();

  const { data: posterStatus, isLoading } = useQuery<PosterStatus>({
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
    onMutate: () => {
      setProgressStage(0);
      setGenerationStartTime(Date.now());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId, "poster"] });
    },
    onError: (error: Error) => {
      setGenerationStartTime(null);
      setProgressStage(0);
      
      if (error.message === "RATE_LIMIT") {
        setRateLimitUntil(Date.now() + RATE_LIMIT_COOLDOWN_MS);
        setCooldownRemaining(Math.ceil(RATE_LIMIT_COOLDOWN_MS / 1000));
        toast({
          title: "Slow down!",
          description: "Too many poster requests. Please wait a minute before trying again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Generation failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    },
  });
  
  // Progress stage cycling effect
  useEffect(() => {
    if (!generationStartTime || posterStatus?.status !== "generating") {
      return;
    }
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - generationStartTime;
      let newStage = 0;
      
      for (let i = 0; i < PROGRESS_STAGES.length; i++) {
        if (elapsed >= PROGRESS_STAGES[i].duration) {
          newStage = Math.min(i + 1, PROGRESS_STAGES.length - 1);
        }
      }
      
      setProgressStage(newStage);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [generationStartTime, posterStatus?.status]);
  
  // Reset progress when generation completes
  useEffect(() => {
    if (posterStatus?.status === "ready" || posterStatus?.status === "failed") {
      setGenerationStartTime(null);
      setProgressStage(0);
    }
  }, [posterStatus?.status]);
  
  // Rate limit cooldown timer
  useEffect(() => {
    if (!rateLimitUntil) {
      setCooldownRemaining(0);
      return;
    }
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      
      if (remaining <= 0) {
        setRateLimitUntil(null);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [rateLimitUntil]);
  
  const isRateLimited = cooldownRemaining > 0;

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

  return (
    <div className="relative" data-testid="story-poster-container">
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="aspect-[2/3] w-full max-w-xs mx-auto bg-muted/30 rounded-lg flex items-center justify-center"
          >
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </motion.div>
        )}

        {isGenerating && !isLoading && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="aspect-[2/3] w-full max-w-xs mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/30 flex flex-col items-center justify-center gap-4 p-6"
            data-testid="poster-generating"
          >
            <motion.div
              className="relative"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {(() => {
                const CurrentIcon = PROGRESS_STAGES[progressStage].icon;
                return <CurrentIcon className="w-12 h-12 text-primary" />;
              })()}
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full"
                animate={{ 
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.div>
            <div className="text-center">
              <p className="font-display text-sm text-foreground mb-1">GENERATING POSTER</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={progressStage}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs text-muted-foreground font-mono"
                >
                  {PROGRESS_STAGES[progressStage].label}
                </motion.p>
              </AnimatePresence>
            </div>
            
            {/* Progress indicator */}
            <div className="w-full space-y-2">
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>Stage {progressStage + 1}/{PROGRESS_STAGES.length}</span>
                <span>~15-30 sec</span>
              </div>
              <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((progressStage + 1) / PROGRESS_STAGES.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="w-full h-0.5 bg-muted/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary/50 via-cyan-400/50 to-primary/50"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {hasPoster && (
          <motion.div
            key="poster"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative group"
            data-testid="poster-ready"
          >
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
          </motion.div>
        )}

        {hasFailed && !isGenerating && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="aspect-[2/3] w-full max-w-xs mx-auto bg-muted/20 rounded-lg border border-destructive/30 flex flex-col items-center justify-center gap-4 p-6"
            data-testid="poster-failed"
          >
            <div className="relative">
              <AlertCircle className="w-12 h-12 text-destructive/70" />
            </div>
            <div className="text-center">
              <p className="font-display text-sm text-foreground mb-1">POSTER UNAVAILABLE</p>
              <p className="text-xs text-muted-foreground font-mono mb-2">AI generation encountered an issue</p>
              <p className="text-[10px] text-muted-foreground/70 font-mono">This sometimes happens with complex stories. Try again!</p>
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
                <>
                  <Loader2 className="w-4 h-4" />
                  Wait {cooldownRemaining}s
                </>
              ) : generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </>
              )}
            </Button>
          </motion.div>
        )}

        {!isLoading && !isGenerating && !hasPoster && !hasFailed && (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="aspect-[2/3] w-full max-w-xs mx-auto bg-muted/20 rounded-lg border border-muted/30 flex flex-col items-center justify-center gap-4 p-6"
            data-testid="poster-pending"
          >
            <motion.div
              className="relative"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Wand2 className="w-12 h-12 text-muted-foreground" />
            </motion.div>
            <div className="text-center">
              <p className="font-display text-sm text-foreground mb-1">CREATE YOUR POSTER</p>
              <p className="text-xs text-muted-foreground font-mono mb-1">AI-generated cinematic artwork</p>
              <p className="text-[10px] text-muted-foreground/70 font-mono">Takes about 15-30 seconds</p>
            </div>
            <Button
              size="sm"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || isRateLimited}
              className="font-mono text-xs gap-2"
              data-testid="button-generate-poster"
            >
              {isRateLimited ? (
                <>
                  <Loader2 className="w-4 h-4" />
                  Wait {cooldownRemaining}s
                </>
              ) : generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Poster
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
