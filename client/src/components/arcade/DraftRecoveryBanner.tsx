import { Clock, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Draft } from '@/lib/draftStorage';
import { formatTimeAgo, getDraftTitle } from '@/lib/draftStorage';

interface DraftRecoveryBannerProps {
  draft: Draft;
  onResume: () => void;
  onDiscard: () => void;
}

export function DraftRecoveryBanner({ draft, onResume, onDiscard }: DraftRecoveryBannerProps) {
  return (
    <div 
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-card border border-primary/30 rounded-md p-4 shadow-lg shadow-primary/10 animate-slide-in-from-top max-w-lg w-[90%]"
      data-testid="banner-draft-recovery"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-display text-sm mb-1">
            Found 1 unsaved draft from {formatTimeAgo(draft.lastSavedAt)}
          </p>
          <p className="text-muted-foreground text-xs font-mono truncate">
            {getDraftTitle(draft)} - Scene {draft.sceneNumber}/5
          </p>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <Button
          onClick={onResume}
          size="sm"
          className="flex-1 bg-primary text-primary-foreground font-mono uppercase tracking-widest text-xs"
          data-testid="button-resume-draft"
        >
          <Play className="w-3 h-3 mr-2" /> Resume
        </Button>
        <Button
          onClick={onDiscard}
          variant="outline"
          size="sm"
          className="flex-1 font-mono uppercase tracking-widest text-xs"
          data-testid="button-discard-draft"
        >
          <Trash2 className="w-3 h-3 mr-2" /> Discard
        </Button>
      </div>
    </div>
  );
}
