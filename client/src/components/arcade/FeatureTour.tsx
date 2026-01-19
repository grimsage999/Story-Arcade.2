import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Mic, Lightbulb, BookOpen, Sparkles, Image, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Story Arcade',
    description: 'Transform your personal stories into cinematic narratives. Answer 5 simple questions and let AI weave your legend.',
    icon: <Sparkles className="w-8 h-8 text-cyan-400" />,
  },
  {
    id: 'tracks',
    title: 'Choose Your Track',
    description: 'Pick from Origin (your roots), Future City (sci-fi visions), or Legend (mythic tales). Each track has themed questions.',
    icon: <BookOpen className="w-8 h-8 text-amber-400" />,
  },
  {
    id: 'voice',
    title: 'Speak Your Story',
    description: 'Tap the microphone to speak your answers. Real-time transcription captures your words as you talk.',
    icon: <Mic className="w-8 h-8 text-fuchsia-400" />,
  },
  {
    id: 'examples',
    title: 'Use Scene Examples',
    description: "Not sure what to write? Browse pre-written examples and tap to fill in your answer instantly.",
    icon: <BookOpen className="w-8 h-8 text-green-400" />,
  },
  {
    id: 'inspire',
    title: 'AI-Powered Inspiration',
    description: 'Stuck? Hit "Inspire Me" and get AI-generated suggestions tailored to your story track.',
    icon: <Lightbulb className="w-8 h-8 text-yellow-400" />,
  },
  {
    id: 'poster',
    title: 'Cinematic Posters',
    description: 'Every story gets an AI-generated movie poster. Download it, share it, make it yours.',
    icon: <Image className="w-8 h-8 text-purple-400" />,
  },
];

interface FeatureTourProps {
  onComplete: () => void;
}

export function FeatureTour({ onComplete }: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md px-4"
        data-testid="feature-tour"
      >
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-md w-full bg-[#0F0F13] border border-cyan-500/50 rounded-md shadow-[0_0_40px_rgba(0,255,255,0.15)]"
        >
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1 text-gray-500 hover:text-white transition-colors"
            data-testid="button-skip-tour"
            aria-label="Skip tour"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 flex items-center justify-center border border-cyan-500/30">
                {step.icon}
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
              {step.title}
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6">
              {step.description}
            </p>

            <div className="flex justify-center gap-1.5 mb-6">
              {TOUR_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-cyan-400' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-center gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  className="gap-2"
                  data-testid="button-tour-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="gap-2 bg-cyan-500 text-black font-bold"
                data-testid="button-tour-next"
              >
                {isLastStep ? "Let's Go!" : 'Next'}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>

            <p className="text-gray-600 text-xs font-mono mt-4">
              {currentStep + 1} of {TOUR_STEPS.length}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
