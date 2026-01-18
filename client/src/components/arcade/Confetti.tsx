import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sparkles } from 'lucide-react';

interface ConfettiProps {
  active: boolean;
}

export function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  useEffect(() => {
    if (!active) return;
    
    if (prefersReducedMotion) {
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
    }[] = [];
    
    const colors = ['#22D3EE', '#E879F9', '#FBBF24', '#FFFFFF'];
    
    const particleCount = isMobile ? 20 : 100;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * (isMobile ? 15 : 20),
        vy: (Math.random() - 0.5) * (isMobile ? 15 : 20),
        size: Math.random() * (isMobile ? 4 : 5) + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: isMobile ? 60 : 100
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeParticles = false;
      
      particles.forEach(p => {
        if (p.life > 0) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.5;
          p.life--;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
          activeParticles = true;
        }
      });
      
      if (activeParticles) requestAnimationFrame(animate);
    };
    
    animate();
  }, [active, isMobile, prefersReducedMotion]);

  if (!active) return null;
  
  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
        <Sparkles className="w-16 h-16 text-cyan-400" />
      </div>
    );
  }
  
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100]" />;
}
