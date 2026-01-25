import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

interface UseSpeechRecognitionOptions {
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  language?: string;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  reset: () => void;
}

// Web Speech API types (not included in standard TypeScript DOM lib)
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultItem {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    onResult,
    onError,
    continuous = true,
    language = 'en-US',
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isStoppingRef = useRef(false);
  const shouldRestartRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Keep refs updated without triggering effect re-runs
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = Boolean(SpeechRecognitionAPI);

  useEffect(() => {
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      isStoppingRef.current = false;
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          final += transcript;
          onResultRef.current?.({ transcript, isFinal: true, confidence });
        } else {
          interim += transcript;
          onResultRef.current?.({ transcript, isFinal: false, confidence });
        }
      }

      if (interim) {
        setInterimTranscript(interim);
      }
      if (final) {
        setFinalTranscript((prev) => prev + final);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event) => {
      const errorMessage = getErrorMessage(event.error);
      // Don't show error for no-speech during continuous listening
      if (event.error === 'no-speech' && shouldRestartRef.current) {
        return;
      }
      setError(errorMessage);
      setIsListening(false);
      shouldRestartRef.current = false;
      onErrorRef.current?.(errorMessage);
    };

    recognition.onend = () => {
      // Check if we should auto-restart
      if (shouldRestartRef.current && !isStoppingRef.current && continuous) {
        // Auto-restart after a brief pause
        setTimeout(() => {
          if (shouldRestartRef.current && !isStoppingRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              setIsListening(false);
              shouldRestartRef.current = false;
            }
          } else {
            setIsListening(false);
          }
        }, 50);
      } else {
        setIsListening(false);
        shouldRestartRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRestartRef.current = false;
      isStoppingRef.current = true;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [SpeechRecognitionAPI, continuous, language]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      setError(null);
      setInterimTranscript('');
      isStoppingRef.current = false;
      shouldRestartRef.current = true;
      recognitionRef.current.start();
    } catch (err) {
      if (err instanceof Error && err.message.includes('already started')) {
        // Already running, ignore
      } else {
        setError('Failed to start speech recognition');
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    
    // Set flags BEFORE calling stop
    shouldRestartRef.current = false;
    isStoppingRef.current = true;
    setIsListening(false);
    setInterimTranscript('');
    
    try {
      recognitionRef.current.stop();
    } catch {
      // Ignore errors when stopping
    }
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  const reset = useCallback(() => {
    stop();
    setFinalTranscript('');
    setInterimTranscript('');
    setError(null);
  }, [stop]);

  return {
    isListening,
    isSupported,
    interimTranscript,
    finalTranscript,
    error,
    start,
    stop,
    toggle,
    reset,
  };
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'audio-capture':
      return 'Microphone not found. Please check your device.';
    case 'not-allowed':
      return 'Microphone access denied. Please allow microphone access.';
    case 'network':
      return 'Network error. Please check your connection.';
    case 'aborted':
      return 'Speech recognition was stopped.';
    case 'language-not-supported':
      return 'Language not supported.';
    case 'service-not-allowed':
      return 'Speech recognition service not allowed.';
    default:
      return `Speech recognition error: ${error}`;
  }
}
