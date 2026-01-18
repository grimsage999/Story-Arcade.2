import { type ReactNode } from 'react';
import type { Story } from '@shared/schema';

interface TVWallGalleryProps {
  children: ReactNode;
  showStripes?: boolean;
}

const CRT_GLOW_COLORS = [
  { glow: 'rgba(34, 211, 238, 0.4)', border: 'border-cyan-500/30', screen: 'from-cyan-900/20' },
  { glow: 'rgba(236, 72, 153, 0.4)', border: 'border-pink-500/30', screen: 'from-pink-900/20' },
  { glow: 'rgba(192, 38, 211, 0.4)', border: 'border-fuchsia-500/30', screen: 'from-fuchsia-900/20' },
  { glow: 'rgba(20, 184, 166, 0.4)', border: 'border-teal-500/30', screen: 'from-teal-900/20' },
  { glow: 'rgba(251, 191, 36, 0.35)', border: 'border-amber-500/30', screen: 'from-amber-900/20' },
  { glow: 'rgba(139, 92, 246, 0.4)', border: 'border-violet-500/30', screen: 'from-violet-900/20' },
];

export function TVWallGallery({ children, showStripes = true }: TVWallGalleryProps) {
  return (
    <div className="relative">
      {/* Geometric stripe background */}
      {showStripes && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
          <div 
            className="absolute inset-0"
            style={{
              background: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 20px,
                rgba(255,255,255,0.5) 20px,
                rgba(255,255,255,0.5) 40px
              )`,
            }}
          />
        </div>
      )}
      
      {/* Grid glow effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

interface CRTScreenCardProps {
  children: ReactNode;
  colorIndex?: number;
  onClick?: () => void;
  className?: string;
}

export function CRTScreenCard({ 
  children, 
  colorIndex = 0, 
  onClick,
  className = ''
}: CRTScreenCardProps) {
  const color = CRT_GLOW_COLORS[colorIndex % CRT_GLOW_COLORS.length];
  
  return (
    <div 
      className={`relative cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* CRT monitor frame */}
      <div 
        className="relative rounded-lg overflow-hidden bg-gray-900"
        style={{
          boxShadow: `
            inset 0 0 20px rgba(0,0,0,0.8),
            0 0 20px ${color.glow}
          `,
        }}
      >
        {/* Monitor bezel */}
        <div className="p-1.5 bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 rounded-lg">
          {/* Screen area */}
          <div 
            className={`relative rounded overflow-hidden border ${color.border} bg-gradient-to-br ${color.screen} to-transparent`}
            style={{
              boxShadow: `inset 0 0 30px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Scanline overlay */}
            <div 
              className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
              }}
            />
            
            {/* Screen glow */}
            <div 
              className="absolute inset-0 pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-0"
              style={{
                background: `radial-gradient(ellipse at center, ${color.glow.replace('0.4', '0.15')} 0%, transparent 70%)`,
              }}
            />
            
            {/* Content */}
            <div className="relative z-0">
              {children}
            </div>
          </div>
        </div>
        
        {/* Power LED */}
        <div className="absolute bottom-1 right-3 flex items-center gap-1">
          <div 
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{
              background: 'linear-gradient(to bottom, #4ade80, #16a34a)',
              boxShadow: '0 0 4px #4ade80',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function getGlowColorForStory(storyId: number): typeof CRT_GLOW_COLORS[0] {
  return CRT_GLOW_COLORS[storyId % CRT_GLOW_COLORS.length];
}

export { CRT_GLOW_COLORS };
