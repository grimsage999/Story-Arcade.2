import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Clock, Users, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface KioskConfig {
  eventName?: string;
  welcomeMessage?: string;
  primaryColor?: string;
  accentColor?: string;
  idleTimeout?: number;
  showQueue?: boolean;
  queueCount?: number;
  estimatedWait?: number;
}

interface KioskModeProps {
  config?: KioskConfig;
}

const defaultConfig: KioskConfig = {
  eventName: 'Story Arcade',
  welcomeMessage: 'Create Your Cinematic Story',
  primaryColor: 'cyan',
  accentColor: 'fuchsia',
  idleTimeout: 60000,
  showQueue: false,
  queueCount: 0,
  estimatedWait: 0,
};

const colorMap = {
  cyan: {
    primary: 'from-cyan-500 to-cyan-400',
    accent: 'text-cyan-400',
    glow: 'shadow-cyan-500/50',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
  },
  fuchsia: {
    primary: 'from-fuchsia-500 to-fuchsia-400',
    accent: 'text-fuchsia-400',
    glow: 'shadow-fuchsia-500/50',
    border: 'border-fuchsia-500/30',
    bg: 'bg-fuchsia-500/10',
  },
  amber: {
    primary: 'from-amber-500 to-amber-400',
    accent: 'text-amber-400',
    glow: 'shadow-amber-500/50',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  violet: {
    primary: 'from-violet-500 to-violet-400',
    accent: 'text-violet-400',
    glow: 'shadow-violet-500/50',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
  },
};

export function KioskMode({ config = {} }: KioskModeProps) {
  const settings = { ...defaultConfig, ...config };
  const [isIdle, setIsIdle] = useState(true);
  const [mouseTimer, setMouseTimer] = useState<NodeJS.Timeout | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  const colors = colorMap[settings.primaryColor as keyof typeof colorMap] || colorMap.cyan;
  const accentColors = colorMap[settings.accentColor as keyof typeof colorMap] || colorMap.fuchsia;

  const resetIdle = useCallback(() => {
    setIsIdle(false);
    if (mouseTimer) clearTimeout(mouseTimer);
    const timer = setTimeout(() => setIsIdle(true), settings.idleTimeout);
    setMouseTimer(timer);
  }, [mouseTimer, settings.idleTimeout]);

  useEffect(() => {
    const handleInteraction = () => resetIdle();
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      if (mouseTimer) clearTimeout(mouseTimer);
    };
  }, [resetIdle, mouseTimer]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black overflow-hidden"
      data-testid="kiosk-mode"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900" />
      
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, ${settings.primaryColor === 'cyan' ? 'rgba(6,182,212,0.15)' : 'rgba(192,38,211,0.15)'} 0%, transparent 50%)`,
        }}
      />

      <AnimatePresence>
        {isIdle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-8 right-8 flex items-center gap-2 text-white/30 text-sm font-mono"
          >
            <Clock className="w-4 h-4" />
            <span>Tap anywhere to begin</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4 mb-12"
        >
          {settings.eventName && settings.eventName !== 'Story Arcade' && (
            <motion.div 
              className="text-white/40 text-sm tracking-[0.3em] uppercase font-mono"
              data-testid="text-event-name"
            >
              {settings.eventName} presents
            </motion.div>
          )}
          
          <h1 
            className={`text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r ${colors.primary} bg-clip-text text-transparent`}
            data-testid="text-main-title"
          >
            STORY ARCADE
          </h1>
          
          <motion.p 
            className={`text-xl md:text-2xl ${accentColors.accent} font-mono`}
            data-testid="text-welcome-message"
          >
            {settings.welcomeMessage}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative"
        >
          <motion.div
            animate={{
              boxShadow: [
                `0 0 40px rgba(6,182,212,${0.3 + Math.sin(pulsePhase * 0.05) * 0.2})`,
                `0 0 60px rgba(6,182,212,${0.2 + Math.sin(pulsePhase * 0.05) * 0.2})`,
              ],
            }}
            className="absolute inset-0 rounded-full blur-xl"
          />
          
          <Button
              asChild
              size="lg"
              className={`relative text-2xl md:text-3xl font-bold text-white rounded-full bg-gradient-to-r ${colors.primary} border-0`}
              data-testid="button-start-story"
            >
              <Link href="/?intro=skip">
                <Zap className="w-6 h-6 mr-2" />
                START YOUR STORY
                <ChevronRight className="w-6 h-6 ml-2" />
              </Link>
            </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-8 text-center max-w-3xl"
        >
          {[
            { icon: Sparkles, label: 'Choose Your Track', desc: 'Origin, Future, or Legend' },
            { icon: Play, label: 'Answer Questions', desc: 'Build your narrative' },
            { icon: RotateCcw, label: 'Get Your Story', desc: 'AI-generated cinema' },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="space-y-2"
            >
              <div className={`w-12 h-12 mx-auto rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                <step.icon className={`w-6 h-6 ${colors.accent}`} />
              </div>
              <h3 className="text-white font-semibold">{step.label}</h3>
              <p className="text-white/50 text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {settings.showQueue && settings.queueCount && settings.queueCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className={`mt-12 px-6 py-3 rounded-full ${colors.bg} ${colors.border} border flex items-center gap-4`}
            data-testid="queue-indicator"
          >
            <Users className={`w-5 h-5 ${colors.accent}`} />
            <span className="text-white/80 font-mono">
              {settings.queueCount} in queue
            </span>
            {settings.estimatedWait && settings.estimatedWait > 0 && (
              <>
                <div className="w-px h-4 bg-white/20" />
                <span className="text-white/60 text-sm">
                  ~{settings.estimatedWait} min wait
                </span>
              </>
            )}
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 text-xs font-mono">
        STORY ARCADE • POWERED BY AI
      </div>

      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
        }}
        aria-hidden="true"
      />

      <motion.div
        animate={{
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${settings.primaryColor === 'cyan' ? 'rgba(6,182,212,0.1)' : 'rgba(192,38,211,0.1)'} 0%, transparent 60%)`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
