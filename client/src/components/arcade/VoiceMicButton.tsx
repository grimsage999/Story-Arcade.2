import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';

interface VoiceMicButtonProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceMicButton({ onTranscript, disabled, className }: VoiceMicButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const handleResult = useCallback((result: { transcript: string; isFinal: boolean }) => {
    onTranscript(result.transcript, result.isFinal);
  }, [onTranscript]);

  const {
    isListening,
    isSupported,
    error,
    toggle,
    stop,
  } = useSpeechRecognition({
    onResult: handleResult,
    continuous: true,
  });

  useEffect(() => {
    if (!isSupported) {
      setShowTooltip(true);
      const timer = setTimeout(() => setShowTooltip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported]);

  useEffect(() => {
    if (disabled && isListening) {
      stop();
    }
  }, [disabled, isListening, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  if (!isSupported) {
    return (
      <div className="relative">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled
          className={`text-muted-foreground cursor-not-allowed ${className}`}
          title="Speech recognition not supported in this browser"
          data-testid="button-voice-unsupported"
        >
          <MicOff className="w-5 h-5" />
        </Button>
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-card border border-border rounded-md text-xs text-muted-foreground whitespace-nowrap z-50"
            >
              Voice input not supported in this browser
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        type="button"
        size="icon"
        variant={isListening ? 'destructive' : 'ghost'}
        onClick={toggle}
        disabled={disabled}
        className={`relative ${!isListening ? 'text-primary' : ''} ${className}`}
        title={isListening ? 'Stop recording' : 'Start voice input'}
        data-testid="button-voice-input"
        aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? (
          <>
            <Square className="w-4 h-4" />
            <motion.span
              className="absolute inset-0 rounded-md border-2 border-destructive/50"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          </>
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/30 rounded-full z-50"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/75 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            <span className="text-destructive text-xs font-mono uppercase tracking-widest">
              Listening...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && !isListening && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-md text-xs text-destructive whitespace-nowrap z-50 max-w-[200px] text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
