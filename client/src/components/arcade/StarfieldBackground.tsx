import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface StarfieldBackgroundProps {
  starCount?: number;
  className?: string;
}

export function StarfieldBackground({ starCount = 100, className = '' }: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      starsRef.current = [];
      for (let i = 0; i < starCount; i++) {
        const isBright = Math.random() > 0.7;
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: isBright ? Math.random() * 3 + 1.5 : Math.random() * 2 + 0.5,
          speed: Math.random() * 0.5 + 0.1,
          opacity: isBright ? Math.random() * 0.4 + 0.6 : Math.random() * 0.6 + 0.3,
          twinkleSpeed: Math.random() * 0.04 + 0.02,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    const drawStar = (star: Star, time: number) => {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
      const currentOpacity = star.opacity * twinkle;
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
      ctx.fill();
      
      if (star.size > 1.5) {
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 3
        );
        gradient.addColorStop(0, `rgba(200, 220, 255, ${currentOpacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(star.x - star.size * 3, star.y - star.size * 3, star.size * 6, star.size * 6);
      }
    };

    const animate = (time: number) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      starsRef.current.forEach((star) => {
        star.y += star.speed;
        
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
        
        drawStar(star, time);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [starCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
      aria-hidden="true"
    />
  );
}

export function StaticStarfield({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {Array.from({ length: 120 }).map((_, i) => {
        const isBright = i % 5 === 0;
        const size = isBright ? Math.random() * 3 + 2 : Math.random() * 2 + 1;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
              opacity: isBright ? Math.random() * 0.4 + 0.6 : Math.random() * 0.5 + 0.3,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${Math.random() * 2 + 1}s`,
              boxShadow: isBright ? '0 0 6px rgba(255,255,255,0.8), 0 0 12px rgba(200,220,255,0.4)' : 'none',
            }}
          />
        );
      })}
      
      <div
        className="absolute w-40 h-40 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)',
          left: '10%',
          top: '20%',
          filter: 'blur(25px)',
        }}
      />
      <div
        className="absolute w-56 h-56 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.5) 0%, transparent 70%)',
          right: '15%',
          bottom: '30%',
          filter: 'blur(35px)',
        }}
      />
      <div
        className="absolute w-36 h-36 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
          right: '25%',
          top: '15%',
          filter: 'blur(30px)',
        }}
      />
      <div
        className="absolute w-44 h-44 rounded-full opacity-12"
        style={{
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)',
          left: '20%',
          bottom: '20%',
          filter: 'blur(30px)',
        }}
      />
    </div>
  );
}
