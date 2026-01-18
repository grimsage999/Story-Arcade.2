import { Cloud, CloudOff, Check } from 'lucide-react';
import { formatTimeAgo } from '@/lib/draftStorage';

interface AutoSaveIndicatorProps {
  lastSavedAt: string | null;
  saveFailed: boolean;
}

export function AutoSaveIndicator({ lastSavedAt, saveFailed }: AutoSaveIndicatorProps) {
  if (saveFailed) {
    return (
      <div 
        className="flex items-center gap-2 text-amber-400 text-xs font-mono"
        data-testid="indicator-save-failed"
      >
        <CloudOff className="w-3 h-3" />
        <span>Draft saving failed - check connection</span>
      </div>
    );
  }

  if (!lastSavedAt) {
    return (
      <div 
        className="flex items-center gap-2 text-muted-foreground text-xs font-mono"
        data-testid="indicator-not-saved"
      >
        <Cloud className="w-3 h-3" />
        <span>Not saved yet</span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-2 text-muted-foreground text-xs font-mono"
      data-testid="indicator-auto-saved"
    >
      <Check className="w-3 h-3 text-green-500" />
      <span>Auto-saved {formatTimeAgo(lastSavedAt)}</span>
    </div>
  );
}
