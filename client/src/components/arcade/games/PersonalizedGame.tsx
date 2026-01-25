import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Share2, Trophy, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Story } from '@shared/schema';
import { OriginGame, FutureRhythmGame, LegendPuzzleGame, FutureCityGame, LegendGame } from './index';

interface PersonalizedGameProps {
  story: Story;
  onShare?: () => void;
}

export function PersonalizedGame({ story, onShare }: PersonalizedGameProps) {
  // For the personalized game, we'll use the appropriate game based on the track
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