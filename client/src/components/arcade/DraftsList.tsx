import { FileText, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Draft } from '@/lib/draftStorage';
import { formatTimeAgo, getDraftTitle } from '@/lib/draftStorage';

interface DraftsListProps {
  drafts: Draft[];
  onContinue: (draft: Draft) => void;
  onDelete: (draftId: string) => void;
}

export function DraftsList({ drafts, onContinue, onDelete }: DraftsListProps) {
  if (drafts.length === 0) return null;

  return (
    <div className="bg-card border border-card-border rounded-md p-4 mb-6" data-testid="section-drafts">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Your Drafts</h3>
      </div>
      
      <div className="space-y-3">
        {drafts.map((draft) => (
          <div 
            key={draft.id}
            className="flex items-center justify-between gap-3 p-3 bg-background/50 rounded-md border border-border"
            data-testid={`draft-item-${draft.id}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-sm font-display truncate">
                {getDraftTitle(draft)}
              </p>
              <p className="text-muted-foreground text-xs font-mono">
                Scene {draft.sceneNumber}/5 • {formatTimeAgo(draft.lastSavedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onContinue(draft)}
                size="sm"
                className="bg-primary text-primary-foreground font-mono uppercase tracking-widest text-[10px]"
                data-testid={`button-continue-draft-${draft.id}`}
              >
                <Play className="w-3 h-3 mr-1" /> Continue
              </Button>
              <Button
                onClick={() => onDelete(draft.id)}
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                data-testid={`button-delete-draft-${draft.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
