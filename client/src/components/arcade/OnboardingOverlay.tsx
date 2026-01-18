import { motion } from 'framer-motion';
import { Sparkles, Clock, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingOverlayProps {
  trackTitle: string;
  onBegin: () => void;
}

export function OnboardingOverlay({ trackTitle, onBegin }: OnboardingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4"
      data-testid="onboarding-overlay"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-lg w-full bg-[#0F0F13] border border-cyan-500/50 rounded-md p-8 md:p-10 shadow-[0_0_40px_rgba(0,255,255,0.15)]"
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-black text-xs font-mono uppercase tracking-widest rounded">
          {trackTitle}
        </div>

        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 flex items-center justify-center border border-cyan-500/30">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
              Welcome, Storyteller
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              You're about to answer a few simple questions. Your answers will be transformed into a unique cinematic story.
            </p>
          </div>

          <div className="space-y-4 py-4">
            <div className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Take Your Time</h3>
                <p className="text-gray-500 text-xs mt-1">
                  There's no rush. Let your mind wander and enjoy the process.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 flex items-center justify-center flex-shrink-0 border border-fuchsia-500/30">
                <Heart className="w-5 h-5 text-fuchsia-400" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Be Authentic</h3>
                <p className="text-gray-500 text-xs mt-1">
                  The more genuine your answers, the more meaningful your story becomes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Let AI Do The Magic</h3>
                <p className="text-gray-500 text-xs mt-1">
                  Your casual responses will be woven into a cinematic narrative just for you.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={onBegin}
            size="lg"
            className="w-full bg-cyan-500 text-black font-bold uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            data-testid="button-begin-story"
          >
            Begin Your Story
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-gray-600 text-xs font-mono">
            Press Enter or click to continue
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
