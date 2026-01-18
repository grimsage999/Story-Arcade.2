import { motion, AnimatePresence } from "framer-motion";
import { useProgression } from "@/hooks/use-progression";
import { useAuth } from "@/hooks/use-auth";
import { Zap, Star } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function XPProgressBar() {
  const { user } = useAuth();
  const { progress, isLoading } = useProgression();

  if (!user || isLoading || !progress) {
    return null;
  }

  const xpInCurrentLevel = progress.xp - progress.xpForCurrentLevel;
  const xpNeededForLevel = progress.xpForNextLevel - progress.xpForCurrentLevel;
  const progressPercent = Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className="flex items-center gap-2 cursor-pointer"
          data-testid="xp-progress-container"
        >
          <div className="flex items-center gap-1">
            <motion.div
              className="relative"
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </motion.div>
            <span 
              className="text-sm font-mono font-bold text-yellow-400"
              data-testid="text-level"
            >
              LVL {progress.level}
            </span>
          </div>

          <div className="relative w-24 h-3 bg-background/50 rounded-full border border-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-background/20 to-transparent" />
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <div 
              className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full"
              style={{ height: '50%' }}
            />
            <AnimatePresence>
              {progressPercent > 0 && (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-1.5 bg-white rounded-full shadow-lg shadow-yellow-400/50"
                  style={{ left: `calc(${progressPercent}% - 2px)` }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-0.5">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span 
              className="text-xs font-mono text-cyan-400"
              data-testid="text-xp"
            >
              {progress.xp}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-card border-primary/30">
        <div className="text-sm space-y-1">
          <p className="font-bold text-foreground">Level {progress.level}</p>
          <p className="text-muted-foreground">
            {xpInCurrentLevel} / {xpNeededForLevel} XP to next level
          </p>
          <p className="text-xs text-muted-foreground">
            Total XP: {progress.xp}
          </p>
          {progress.currentStreak > 0 && (
            <p className="text-xs text-orange-400">
              {progress.currentStreak} day streak
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
