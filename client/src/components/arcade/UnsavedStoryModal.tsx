import { AlertTriangle, Save, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnsavedStoryModalProps {
  scenesCompleted: number;
  onSaveDraft: () => void;
  onDiscard: () => void;
  onContinue: () => void;
}

export function UnsavedStoryModal({ scenesCompleted, onSaveDraft, onDiscard, onContinue }: UnsavedStoryModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
      data-testid="modal-unsaved-story"
    >
      <div className="bg-card border border-amber-500/30 rounded-md max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="font-display text-xl text-foreground">Unsaved Story</h2>
        </div>
        
        <p className="text-muted-foreground text-sm mb-6">
          You have an unsaved story with {scenesCompleted} scene{scenesCompleted !== 1 ? 's' : ''} completed. 
          What would you like to do?
        </p>
        
        <div className="flex flex-col gap-3">
          <Button
            onClick={onSaveDraft}
            className="w-full bg-primary text-primary-foreground font-mono uppercase tracking-widest text-xs"
            data-testid="button-save-draft"
          >
            <Save className="w-4 h-4 mr-2" /> Save Draft
          </Button>
          <Button
            onClick={onDiscard}
            variant="outline"
            className="w-full font-mono uppercase tracking-widest text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            data-testid="button-discard-story"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Discard
          </Button>
          <Button
            onClick={onContinue}
            variant="outline"
            className="w-full font-mono uppercase tracking-widest text-xs"
            data-testid="button-continue-story"
          >
            <ArrowRight className="w-4 h-4 mr-2" /> Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
