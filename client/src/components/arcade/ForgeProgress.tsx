import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, BookOpen, Wand2, CheckCircle, PartyPopper, Clock, AlertTriangle, type LucideIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type ForgeStatus = 'running' | 'timeout' | 'error' | 'success';

interface ForgeStage {
  icon: LucideIcon;
  message: string;
}

const FORGE_STAGES: ForgeStage[] = [
  { icon: Sparkles, message: 'Synthesizing themes...' },
  { icon: BookOpen, message: 'Crafting narrative...' },
  { icon: Wand2, message: 'Enhancing story...' },
  { icon: CheckCircle, message: 'Verifying legend...' },
  { icon: PartyPopper, message: 'Publishing...' },
];

interface ForgeProgressProps {
  status: ForgeStatus;
  errorDetails?: { message: string; code?: string };
  onRetry: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;
}

export function ForgeProgress({
  status,
  errorDetails,
  onRetry,
  onCancel,
  onSaveDraft,
}: ForgeProgressProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const startTimeRef = useRef<number>(Date.now());
  const stageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status !== 'running') {
      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    setStageIndex(0);
    setProgress(0);

    stageIntervalRef.current = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setStageIndex((prev) => {
          const next = prev + 1;
          return next < FORGE_STAGES.length ? next : prev;
        });
        setFadeIn(true);
      }, 300);
    }, 10000);

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const targetProgress = Math.min((elapsed / 40000) * 100, 95);
      setProgress(targetProgress);
    }, 100);

    return () => {
      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (status === 'success') {
      setProgress(100);
    }
  }, [status]);

  const currentStage = FORGE_STAGES[stageIndex];

  if (status === 'timeout') {
    return (
      <div 
        className="flex flex-col items-center justify-center text-center space-y-6 p-8" 
        data-testid="forge-timeout"
        role="alert"
        aria-live="assertive"
      >
        <Clock className="w-16 h-16 text-yellow-500 mb-4" aria-hidden="true" />
        <h2 className="font-display text-2xl md:text-3xl text-yellow-500 uppercase tracking-widest">
          Taking longer than expected
        </h2>
        <p className="text-muted-foreground font-mono text-sm">
          Check your internet connection
        </p>
        <div className="flex gap-4 mt-6">
          <Button
            variant="default"
            onClick={onRetry}
            className="font-mono uppercase tracking-widest"
            data-testid="button-forge-retry"
          >
            Retry
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="font-mono uppercase tracking-widest"
            data-testid="button-forge-cancel"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <>
        <div 
          className="flex flex-col items-center justify-center text-center space-y-6 p-8" 
          data-testid="forge-error"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" aria-hidden="true" />
          <h2 className="font-display text-2xl md:text-3xl text-destructive uppercase tracking-widest">
            Legend forging failed
          </h2>
          <p className="text-foreground font-mono text-sm">
            Let's try again!
          </p>
          {errorDetails?.code && (
            <p className="text-muted-foreground font-mono text-xs">
              Error code: {errorDetails.code}
            </p>
          )}
          <div className="flex gap-4 mt-6 flex-wrap justify-center">
            <Button
              variant="default"
              onClick={onRetry}
              className="font-mono uppercase tracking-widest"
              data-testid="button-forge-try-again"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={onSaveDraft}
              className="font-mono uppercase tracking-widest"
              data-testid="button-forge-save-draft"
            >
              Save Draft
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowErrorDetails(true)}
              className="font-mono uppercase tracking-widest text-muted-foreground"
              data-testid="button-forge-view-error"
            >
              View Error Details
            </Button>
          </div>
        </div>

        <AlertDialog open={showErrorDetails} onOpenChange={setShowErrorDetails}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Error Details</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p className="font-mono text-sm text-destructive">
                    {errorDetails?.message || 'An unknown error occurred'}
                  </p>
                  {errorDetails?.code && (
                    <p className="font-mono text-xs text-muted-foreground">
                      Code: {errorDetails.code}
                    </p>
                  )}
                  <p className="font-mono text-xs text-muted-foreground">
                    Timestamp: {new Date().toISOString()}
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div 
      className="flex flex-col items-center justify-center text-center space-y-8 p-8 max-w-lg" 
      data-testid="forge-progress"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={`Forging your story. Stage: ${currentStage.message} Progress: ${Math.round(progress)}%`}
    >
      <h1 className="font-display text-3xl md:text-5xl text-foreground uppercase tracking-widest">
        Forging your legend...
      </h1>
      
      <p className="text-muted-foreground font-mono text-sm">
        (30-45 seconds expected)
      </p>

      <div className="w-full max-w-md space-y-2">
        <Progress 
          value={progress} 
          className="h-2" 
          data-testid="progress-forge"
          aria-label={`Story generation progress: ${Math.round(progress)}%`}
        />
        <p className="text-xs font-mono text-muted-foreground text-right" aria-hidden="true">
          {Math.round(progress)}%
        </p>
      </div>

      <div 
        className={`transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        data-testid="text-forge-stage"
        aria-live="polite"
      >
        <p className="font-mono text-lg md:text-xl text-primary flex items-center justify-center gap-2">
          <currentStage.icon className="w-5 h-5" aria-hidden="true" />
          <span>{currentStage.message}</span>
        </p>
      </div>
    </div>
  );
}
