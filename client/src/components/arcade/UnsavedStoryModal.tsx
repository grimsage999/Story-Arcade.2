import { useEffect, useRef } from 'react';
import { AlertTriangle, Save, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnsavedStoryModalProps {
  scenesCompleted: number;
  onSaveDraft: () => void;
  onDiscard: () => void;
  onContinue: () => void;
}

export function UnsavedStoryModal({ scenesCompleted, onSaveDraft, onDiscard, onContinue }: UnsavedStoryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    firstButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        previousFocusRef.current?.focus();
        onContinue();
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
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
  }, [onContinue]);

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
      data-testid="modal-unsaved-story"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-modal-title"
      aria-describedby="unsaved-modal-description"
    >
      <div 
        ref={modalRef}
        className="bg-card border border-amber-500/30 rounded-md max-w-md w-full p-6 animate-fade-in"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" aria-hidden="true" />
          </div>
          <h2 id="unsaved-modal-title" className="font-display text-xl text-foreground">Unsaved Story</h2>
        </div>
        
        <p id="unsaved-modal-description" className="text-muted-foreground text-sm mb-6">
          You have an unsaved story with {scenesCompleted} scene{scenesCompleted !== 1 ? 's' : ''} completed. 
          What would you like to do?
        </p>
        
        <div className="flex flex-col gap-3" role="group" aria-label="Story actions">
          <Button
            ref={firstButtonRef}
            onClick={onSaveDraft}
            className="w-full bg-primary text-primary-foreground font-mono uppercase tracking-widest text-xs"
            data-testid="button-save-draft"
            aria-label="Save your story as a draft"
          >
            <Save className="w-4 h-4 mr-2" aria-hidden="true" /> Save Draft
          </Button>
          <Button
            onClick={onDiscard}
            variant="outline"
            className="w-full font-mono uppercase tracking-widest text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            data-testid="button-discard-story"
            aria-label="Discard your story permanently"
          >
            <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" /> Discard
          </Button>
          <Button
            onClick={onContinue}
            variant="outline"
            className="w-full font-mono uppercase tracking-widest text-xs"
            data-testid="button-continue-story"
            aria-label="Continue editing your story"
          >
            <ArrowRight className="w-4 h-4 mr-2" aria-hidden="true" /> Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
