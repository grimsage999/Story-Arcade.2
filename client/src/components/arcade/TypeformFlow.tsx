import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Track } from '@shared/schema';
import { MOTIVATIONS } from '@/lib/tracks';
import { checkContentSafety } from '@/lib/contentSafety';

interface TypeformFlowProps {
  track: Track;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, value: string) => void;
  onComplete: () => void;
  onBack: () => void;
  inspireUsage: Record<number, number>;
  onInspireUse: (sceneNumber: number) => void;
  onInspireClick: (suggestion: string) => void;
  currentQuestionIndex: number;
  onQuestionIndexChange: (index: number) => void;
  onContentWarningChange?: (warning: string | null) => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    y: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: (direction: number) => ({
    y: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const progressVariants = {
  initial: { width: 0 },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: { duration: 0.5, ease: 'easeOut' },
  }),
};

export function TypeformFlow({
  track,
  answers,
  onAnswerChange,
  onComplete,
  onBack,
  currentQuestionIndex,
  onQuestionIndexChange,
  onContentWarningChange,
}: TypeformFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(currentQuestionIndex);
  const [direction, setDirection] = useState(0);
  const [inputError, setInputError] = useState(false);
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const questions = track.questions;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id] || '';
  const charCount = currentAnswer.length;
  const isValid = charCount >= 5;
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex + (isValid ? 1 : 0)) / questions.length) * 100;
  const motivation = MOTIVATIONS[currentIndex % MOTIVATIONS.length];

  useEffect(() => {
    if (textareaRef.current && !isTransitioning) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [currentIndex, isTransitioning]);

  const updateIndex = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
    onQuestionIndexChange(newIndex);
  }, [onQuestionIndexChange]);

  const handleNext = useCallback(() => {
    if (!isValid) {
      setInputError(true);
      setTimeout(() => setInputError(false), 600);
      return;
    }

    if (isLastQuestion) {
      onComplete();
    } else {
      setIsTransitioning(true);
      setDirection(1);
      const newIndex = currentIndex + 1;
      updateIndex(newIndex);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }, [isValid, isLastQuestion, onComplete, currentIndex, updateIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex === 0) {
      onBack();
    } else {
      setIsTransitioning(true);
      setDirection(-1);
      const newIndex = currentIndex - 1;
      updateIndex(newIndex);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }, [currentIndex, onBack, updateIndex]);

  const handleAnswerInput = (value: string) => {
    if (value.length > 300) return;
    
    const safety = checkContentSafety(value);
    if (!safety.isClean) {
      const warning = "Please keep content family-friendly for our community.";
      setContentWarning(warning);
      onContentWarningChange?.(warning);
    } else {
      setContentWarning(null);
      onContentWarningChange?.(null);
    }
    
    onAnswerChange(currentQuestion.id, value);
    setInputError(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' && e.metaKey) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isTransitioning]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-4 left-6 right-6 flex justify-between items-center z-40">
        <div className="w-full bg-secondary h-1 rounded-full overflow-hidden mr-4">
          <motion.div
            className="h-full bg-primary shadow-[0_0_20px_rgba(34,211,238,0.6)]"
            initial="initial"
            animate="animate"
            custom={progress}
            variants={progressVariants}
          />
        </div>
      </div>

      <div className="absolute top-12 left-6 right-6 flex justify-between items-center z-40">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 border ${track.border} ${track.accent} bg-opacity-10 rounded-sm text-[10px] font-mono uppercase tracking-widest`}>
            {track.title}
          </span>
          <span className="text-muted-foreground font-mono text-xs tracking-widest hidden md:block">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i < currentIndex || (i <= currentIndex && isValid)) {
                  setDirection(i > currentIndex ? 1 : -1);
                  setIsTransitioning(true);
                  updateIndex(i);
                  setTimeout(() => setIsTransitioning(false), 400);
                }
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === currentIndex 
                  ? 'bg-primary scale-125 shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                  : i < currentIndex || (answers[questions[i].id]?.length ?? 0) >= 5
                    ? 'bg-primary/60'
                    : 'bg-secondary'
              }`}
              aria-label={`Go to question ${i + 1}`}
              disabled={i > currentIndex && !isValid}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full max-w-3xl mx-auto"
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-primary text-sm">
                    {String(currentIndex + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
                    {currentQuestion.guidance}
                  </span>
                </div>
                
                <h2 className="font-display text-2xl md:text-4xl lg:text-5xl text-foreground leading-tight">
                  {currentQuestion.prompt}
                </h2>
                
                <p className="text-muted-foreground font-mono text-sm italic flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {motivation}
                </p>
              </div>

              <div className={`relative ${inputError ? 'animate-shake' : ''}`}>
                <textarea
                  ref={textareaRef}
                  value={currentAnswer}
                  onChange={(e) => handleAnswerInput(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  className="w-full min-h-[180px] md:min-h-[220px] bg-transparent border-0 border-b-2 border-border focus:border-primary text-lg md:text-xl leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none resize-none transition-colors py-4"
                  data-testid="input-typeform-answer"
                  aria-label={currentQuestion.prompt}
                />
                
                <div className="absolute bottom-2 right-0 flex items-center gap-4">
                  <span className={`font-mono text-xs transition-colors ${
                    charCount < 5 ? 'text-muted-foreground' : 'text-primary'
                  }`}>
                    {charCount}/300
                  </span>
                </div>
              </div>
              
              {contentWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md"
                >
                  <p className="text-amber-400 text-xs font-mono flex items-center gap-2">
                    <span className="text-amber-500">!</span>
                    {contentWarning}
                  </p>
                </motion.div>
              )}

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  className="font-mono text-sm gap-2"
                  data-testid="button-typeform-prev"
                >
                  <ChevronUp className="w-4 h-4" />
                  {currentIndex === 0 ? 'Back to Tracks' : 'Previous'}
                </Button>
                
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-mono text-xs hidden md:block">
                    Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to continue
                  </span>
                  
                  <Button
                    onClick={handleNext}
                    disabled={!isValid}
                    className="font-mono text-sm gap-2 min-w-[140px]"
                    data-testid="button-typeform-next"
                  >
                    {isLastQuestion ? (
                      <>
                        <Check className="w-4 h-4" />
                        Forge Story
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="text-center pt-8">
                <p className="text-muted-foreground/60 font-mono text-[10px] tracking-widest">
                  <span className="hidden md:inline">
                    <kbd className="px-1 py-0.5 bg-muted/50 rounded text-[9px]">Cmd</kbd> + <kbd className="px-1 py-0.5 bg-muted/50 rounded text-[9px]">↑</kbd> to go back
                  </span>
                  <span className="md:hidden">Swipe or tap arrows to navigate</span>
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-6 right-6 flex gap-2 z-40">
        <Button
          size="icon"
          variant="outline"
          onClick={handlePrev}
          aria-label="Previous question"
          data-testid="button-nav-up"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          onClick={handleNext}
          disabled={!isValid}
          aria-label="Next question"
          data-testid="button-nav-down"
        >
          <ChevronDown className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
