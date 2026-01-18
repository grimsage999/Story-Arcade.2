import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogoStingerProps {
  onComplete?: () => void;
  duration?: number;
  autoPlay?: boolean;
}

export function LogoStinger({ onComplete, duration = 10000, autoPlay = true }: LogoStingerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'black' | 'starfield' | 'assemble' | 'glow' | 'title' | 'brighten' | 'fadeout'>('black');
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Draw starfield with nebula
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawStarfield(ctx, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Animation sequence
  useEffect(() => {
    if (!autoPlay) return;

    // For reduced motion, show static end state briefly then complete
    if (prefersReducedMotion) {
      setPhase('title');
      const timeout = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timeout);
    }

    const timeline = [
      { phase: 'starfield' as const, delay: 300 },
      { phase: 'assemble' as const, delay: 500 },
      { phase: 'glow' as const, delay: 5500 },
      { phase: 'title' as const, delay: 6500 },
      { phase: 'brighten' as const, delay: 8500 },
      { phase: 'fadeout' as const, delay: 9500 },
    ];

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    timeline.forEach(({ phase, delay }) => {
      timeouts.push(setTimeout(() => setPhase(phase), delay));
    });

    timeouts.push(setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration));

    return () => timeouts.forEach(clearTimeout);
  }, [autoPlay, duration, onComplete, prefersReducedMotion]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-hidden cursor-pointer"
      onClick={handleSkip}
      data-testid="logo-stinger"
    >
      {/* Black overlay for fade in/out */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 1 }}
        animate={{ 
          opacity: phase === 'black' ? 1 : phase === 'fadeout' ? 1 : 0 
        }}
        transition={{ duration: 0.8 }}
      />

      {/* Starfield Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 50%, #1a1a2e 100%)' }}
      />

      {/* Nebula overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 30% 40%, rgba(64, 156, 255, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(156, 64, 255, 0.1) 0%, transparent 50%)'
        }}
      />

      {/* Center glow before star appears */}
      <AnimatePresence>
        {(phase === 'starfield' || phase === 'assemble') && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-64 h-64 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(100, 180, 255, 0.3) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Star */}
      <div className="absolute inset-0 flex items-center justify-center">
        <FacetedStar phase={phase} />
      </div>

      {/* Title */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingTop: '280px' }}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: phase === 'title' || phase === 'brighten' ? 1 : 0,
          filter: phase === 'brighten' ? 'brightness(1.3)' : 'brightness(1)'
        }}
        transition={{ duration: 0.8 }}
      >
        <h1 
          className="text-white text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.2em] uppercase"
          style={{ 
            fontFamily: "'Montserrat', 'Gotham', sans-serif",
            textShadow: '0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(100,180,255,0.3)'
          }}
        >
          STORY ARCADE
        </h1>
      </motion.div>

      {/* Skip hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase !== 'black' && phase !== 'fadeout' ? 0.5 : 0 }}
        transition={{ delay: 1 }}
      >
        <span className="text-white/50 text-sm font-mono">Click to skip</span>
      </motion.div>
    </div>
  );
}

// Star shard positions for assembly animation
const starShards = [
  { id: 'top', path: 'M 100 0 L 115 70 L 100 55 L 85 70 Z', color: 'url(#blueGradient)', startX: 0, startY: -200, rotation: -180 },
  { id: 'topRight', path: 'M 190 38 L 130 70 L 115 70 L 100 55 Z', color: 'url(#goldGradient)', startX: 200, startY: -150, rotation: 90 },
  { id: 'bottomRight', path: 'M 162 138 L 130 70 L 100 100 L 115 70 Z', color: 'url(#magentaGradient)', startX: 200, startY: 150, rotation: 45 },
  { id: 'bottom', path: 'M 100 200 L 115 130 L 100 100 L 85 130 Z', color: 'url(#goldGradient)', startX: 0, startY: 200, rotation: 180 },
  { id: 'bottomLeft', path: 'M 38 138 L 70 70 L 100 100 L 85 130 Z', color: 'url(#cyanGradient)', startX: -200, startY: 150, rotation: -45 },
  { id: 'topLeft', path: 'M 10 38 L 70 70 L 85 70 L 100 55 Z', color: 'url(#blueGradient)', startX: -200, startY: -150, rotation: -90 },
  { id: 'centerLeft', path: 'M 85 70 L 70 70 L 100 100 Z', color: 'url(#cyanGradient)', startX: -150, startY: 0, rotation: -120 },
  { id: 'centerRight', path: 'M 115 70 L 130 70 L 100 100 Z', color: 'url(#goldGradient)', startX: 150, startY: 0, rotation: 120 },
];

function FacetedStar({ phase }: { phase: string }) {
  const isAssembling = phase === 'assemble' || phase === 'glow' || phase === 'title' || phase === 'brighten';
  const isPulsing = phase === 'glow' || phase === 'title' || phase === 'brighten';
  const isBrightening = phase === 'brighten';

  return (
    <motion.div
      className="relative"
      animate={{
        filter: isBrightening ? 'brightness(1.4) drop-shadow(0 0 40px rgba(255,255,255,0.8))' : 'brightness(1)'
      }}
      transition={{ duration: 0.5 }}
    >
      {/* Outer glow */}
      <motion.div
        className="absolute -inset-16 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(100, 180, 255, 0.4) 0%, rgba(255, 180, 100, 0.2) 30%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: isAssembling ? 1 : 0,
          scale: isPulsing ? [1, 1.1, 1] : 1,
        }}
        transition={{ 
          opacity: { duration: 0.5 },
          scale: { duration: 2, repeat: isPulsing ? Infinity : 0 }
        }}
      />

      <svg 
        width="200" 
        height="200" 
        viewBox="0 0 200 200"
        className="relative z-10"
        style={{ 
          filter: 'drop-shadow(0 0 20px rgba(100,180,255,0.5)) drop-shadow(0 0 40px rgba(255,180,100,0.3))'
        }}
      >
        <defs>
          {/* Blue gradient for left/top */}
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4dc9ff" />
            <stop offset="50%" stopColor="#2196f3" />
            <stop offset="100%" stopColor="#1565c0" />
          </linearGradient>
          
          {/* Cyan gradient */}
          <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="50%" stopColor="#00bcd4" />
            <stop offset="100%" stopColor="#0097a7" />
          </linearGradient>
          
          {/* Gold gradient for right/bottom */}
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd54f" />
            <stop offset="50%" stopColor="#ffb300" />
            <stop offset="100%" stopColor="#ff8f00" />
          </linearGradient>
          
          {/* Magenta gradient */}
          <linearGradient id="magentaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e040fb" />
            <stop offset="50%" stopColor="#aa00ff" />
            <stop offset="100%" stopColor="#7c4dff" />
          </linearGradient>
        </defs>

        {/* Star shards */}
        {starShards.map((shard, index) => (
          <motion.path
            key={shard.id}
            d={shard.path}
            fill={shard.color}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.5"
            initial={{ 
              x: shard.startX, 
              y: shard.startY, 
              scale: 0.3, 
              opacity: 0,
              rotate: shard.rotation 
            }}
            animate={isAssembling ? { 
              x: 0, 
              y: 0, 
              scale: 1, 
              opacity: 1,
              rotate: 0 
            } : {}}
            transition={{
              duration: 0.8,
              delay: 0.1 * index,
              ease: [0.34, 1.56, 0.64, 1], // Overshoot easing
            }}
          />
        ))}

        {/* Center highlight */}
        <motion.circle
          cx="100"
          cy="85"
          r="8"
          fill="url(#centerHighlight)"
          initial={{ opacity: 0, scale: 0 }}
          animate={isAssembling ? { opacity: 0.8, scale: 1 } : {}}
          transition={{ delay: 1, duration: 0.5 }}
        />
        
        <defs>
          <radialGradient id="centerHighlight">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

function drawStarfield(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw stars
  const starCount = Math.floor((width * height) / 3000);
  
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 1.5;
    const opacity = 0.3 + Math.random() * 0.7;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();
    
    // Add slight blue/purple tint to some stars
    if (Math.random() > 0.7) {
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
      const hue = 200 + Math.random() * 60; // Blue to purple range
      ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${opacity * 0.3})`;
      ctx.fill();
    }
  }

  // Add a few brighter stars with glow
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 1.5 + Math.random() * 1;
    
    // Glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 4);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.3)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Core
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
}

export default LogoStinger;
