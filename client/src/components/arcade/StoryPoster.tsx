import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Image, RefreshCw, Download, Loader2 } from "lucide-react";

interface PosterStatus {
  posterUrl: string | null;
  status: string;
}

interface StoryPosterProps {
  storyId: number;
  storyTitle: string;
  autoGenerate?: boolean;
}

export function StoryPoster({ storyId, storyTitle, autoGenerate = true }: StoryPosterProps) {
  const [hasTriggered, setHasTriggered] = useState(false);

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
      if (!res.ok && res.status !== 202) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate poster");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", storyId, "poster"] });
    },
    onError: (error) => {
      console.error("Poster generation error:", error);
    },
  });

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
              <Image className="w-12 h-12 text-primary" />
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
              <p className="text-xs text-muted-foreground font-mono">Creating cinematic artwork...</p>
            </div>
            <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
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
                disabled={generateMutation.isPending}
                className="bg-background/80 backdrop-blur-sm"
                data-testid="button-regenerate-poster"
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
            <Image className="w-12 h-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-display text-sm text-foreground mb-1">POSTER UNAVAILABLE</p>
              <p className="text-xs text-muted-foreground font-mono mb-4">Generation failed</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="font-mono text-xs"
              data-testid="button-retry-poster"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generateMutation.isPending ? "animate-spin" : ""}`} />
              Try Again
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
            <Image className="w-12 h-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-display text-sm text-foreground mb-1">NO POSTER YET</p>
              <p className="text-xs text-muted-foreground font-mono mb-4">Generate a cinematic poster</p>
            </div>
            <Button
              size="sm"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="font-mono text-xs"
              data-testid="button-generate-poster"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="w-4 h-4 mr-2" />
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
