import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Share2, Trophy, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Story } from '@shared/schema';
import { OriginGame, FutureRhythmGame, LegendPuzzleGame, FutureCityGame, LegendGame } from './index';
import { ErrorBoundary, GameErrorFallback } from '../ErrorBoundary';

interface PersonalizedGameProps {
  story: Story;
  onShare?: () => void;
}

/**
 * Internal component that renders the appropriate game based on track
 */
function GameContent({ story }: { story: Story }) {
  switch (story.trackId) {
    case 'origin':
      return <OriginGame
        currentQuestion={5}
        totalQuestions={5}
        isAnswered={true}
        storyInputs={{title: story.title, logline: story.logline}}
      />;
    case 'future':
      return <FutureRhythmGame
        currentQuestion={5}
        totalQuestions={5}
        isAnswered={true}
        storyInputs={{title: story.title, logline: story.logline}}
      />;
    case 'legend':
      return <LegendPuzzleGame
        currentQuestion={5}
        totalQuestions={5}
        isAnswered={true}
        storyInputs={{title: story.title, logline: story.logline}}
      />;
    default:
      // Fallback to a generic game
      return <FutureCityGame
        currentQuestion={5}
        totalQuestions={5}
        isAnswered={true}
        storyInputs={{title: story.title, logline: story.logline}}
      />;
  }
}

export function PersonalizedGame({ story, onShare }: PersonalizedGameProps) {
  const [resetKey, setResetKey] = useState(0);

  const handleRetry = useCallback(() => {
    // Increment key to force remount of game component
    setResetKey(prev => prev + 1);
  }, []);

  const handleGoHome = useCallback(() => {
    // Navigate to home by reloading (simple approach that works without router access)
    window.location.href = '/';
  }, []);

  return (
    <ErrorBoundary
      key={resetKey}
      onReset={handleRetry}
      onGoHome={handleGoHome}
    >
      <GameContent story={story} />
    </ErrorBoundary>
  );
}