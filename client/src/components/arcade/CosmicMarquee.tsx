import { useEffect, useState, useMemo } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

interface Planet {
  id: number;
  x: number;
  y: number;
  size: number;
  color1: string;
  color2: string;
  ringColor?: string;
  hasRing: boolean;
}

interface CosmicMarqueeProps {
  title?: string;
  subtitle?: string;
  variant?: 'full' | 'minimal';
}

export function CosmicMarquee({ title, subtitle, variant = 'full' }: CosmicMarqueeProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const stars: Star[] = useMemo(() => 
    [...Array(40)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      color: ['#ffffff', '#ffd700', '#00ffff', '#ff69b4', '#7c3aed'][Math.floor(Math.random() * 5)],
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 1,
    })), []
  );

  const planets: Planet[] = useMemo(() => [
    { id: 1, x: 85, y: 30, size: 24, color1: '#f97316', color2: '#dc2626', hasRing: true, ringColor: '#fbbf24' },
    { id: 2, x: 10, y: 60, size: 12, color1: '#8b5cf6', color2: '#6366f1', hasRing: false },
    { id: 3, x: 75, y: 70, size: 8, color1: '#06b6d4', color2: '#0891b2', hasRing: false },
  ], []);

  const isMinimal = variant === 'minimal';

  return (
    <div 
      className={`relative overflow-hidden rounded-t-lg ${isMinimal ? 'py-3 md:py-4' : 'py-6 md:py-8'}`}
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #581c87 50%, #831843 75%, #1e1b4b 100%)',
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.3), inset 0 -3px 15px rgba(0,0,0,0.6)',
      }}
    >
      {/* Animated star field */}
      <div className="absolute inset-0">
        {mounted && stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full animate-pulse"
            style={{
              width: star.size + 'px',
              height: star.size + 'px',
              left: star.x + '%',
              top: star.y + '%',
              background: star.color,
              animationDelay: star.delay + 's',
              animationDuration: star.duration + 's',
              boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
            }}
          />
        ))}
      </div>

      {/* Planets */}
      {!isMinimal && mounted && planets.map((planet) => (
        <div
          key={planet.id}
          className="absolute hidden md:block"
          style={{
            left: planet.x + '%',
            top: planet.y + '%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Planet body */}
          <div
            className="rounded-full relative"
            style={{
              width: planet.size + 'px',
              height: planet.size + 'px',
              background: `radial-gradient(circle at 30% 30%, ${planet.color1}, ${planet.color2})`,
              boxShadow: `0 0 ${planet.size}px ${planet.color1}40`,
            }}
          >
            {/* Shine */}
            <div 
              className="absolute rounded-full bg-white/30"
              style={{
                width: planet.size * 0.25 + 'px',
                height: planet.size * 0.25 + 'px',
                top: '15%',
                left: '20%',
              }}
            />
          </div>
          
          {/* Ring */}
          {planet.hasRing && (
            <div
              className="absolute animate-spin"
              style={{
                width: planet.size * 2 + 'px',
                height: planet.size * 0.6 + 'px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotateX(70deg)',
                border: `1px solid ${planet.ringColor}60`,
                borderRadius: '50%',
                animationDuration: '20s',
              }}
            />
          )}
        </div>
      ))}

      {/* Shooting star animation */}
      {mounted && (
        <div 
          className="absolute w-20 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 hidden md:block"
          style={{
            top: '20%',
            left: '-10%',
            animation: 'shootingStar 8s linear infinite',
            animationDelay: '2s',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {title && (
          <h1 
            className={`font-display uppercase tracking-[0.15em] text-white ${isMinimal ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl lg:text-5xl'}`}
            style={{
              textShadow: '0 0 20px rgba(255,255,255,0.6), 0 0 40px rgba(139,92,246,0.5), 3px 3px 0 rgba(0,0,0,0.5)',
            }}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p 
            className={`font-mono tracking-widest text-purple-200/80 mt-2 ${isMinimal ? 'text-[10px]' : 'text-xs md:text-sm'}`}
            style={{
              textShadow: '0 0 10px rgba(139,92,246,0.5)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom trim with gradient */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899, #8b5cf6, #06b6d4)',
        }}
      />

      {/* CSS for shooting star */}
      <style>{`
        @keyframes shootingStar {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(120vw) translateY(30vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
