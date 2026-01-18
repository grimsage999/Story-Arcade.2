import { type ReactNode } from 'react';

interface HUDOverlayProps {
  children: ReactNode;
  showGrid?: boolean;
  showCoordinates?: boolean;
  showTechReadouts?: boolean;
  variant?: 'full' | 'minimal' | 'corners';
  label?: string;
}

export function HUDOverlay({ 
  children, 
  showGrid = false,
  showCoordinates = true,
  showTechReadouts = true,
  variant = 'corners',
  label
}: HUDOverlayProps) {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  
  return (
    <div className="relative">
      {/* Grid background */}
      {showGrid && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      )}
      
      {/* Trajectory curves - decorative SVG */}
      {variant === 'full' && (
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Curved trajectory line 1 */}
          <path
            d="M 0 80 Q 30 60 50 50 T 100 30"
            stroke="#22d3ee"
            strokeWidth="0.3"
            fill="none"
            strokeDasharray="2 2"
          />
          {/* Curved trajectory line 2 */}
          <path
            d="M 0 30 Q 40 50 60 45 T 100 70"
            stroke="#ec4899"
            strokeWidth="0.3"
            fill="none"
            strokeDasharray="2 2"
          />
          {/* Targeting circles */}
          <circle cx="50" cy="50" r="20" stroke="#fbbf24" strokeWidth="0.2" fill="none" opacity="0.5" />
          <circle cx="50" cy="50" r="30" stroke="#fbbf24" strokeWidth="0.15" fill="none" opacity="0.3" />
        </svg>
      )}
      
      {/* Corner brackets */}
      {(variant === 'corners' || variant === 'full') && (
        <>
          {/* Top left bracket */}
          <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400/60 to-transparent" />
            <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-cyan-400/60 to-transparent" />
          </div>
          
          {/* Top right bracket */}
          <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-0.5 bg-gradient-to-l from-cyan-400/60 to-transparent" />
            <div className="absolute top-0 right-0 w-0.5 h-full bg-gradient-to-b from-cyan-400/60 to-transparent" />
          </div>
          
          {/* Bottom left bracket */}
          <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none">
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-pink-400/60 to-transparent" />
            <div className="absolute bottom-0 left-0 w-0.5 h-full bg-gradient-to-t from-pink-400/60 to-transparent" />
          </div>
          
          {/* Bottom right bracket */}
          <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none">
            <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-l from-pink-400/60 to-transparent" />
            <div className="absolute bottom-0 right-0 w-0.5 h-full bg-gradient-to-t from-pink-400/60 to-transparent" />
          </div>
        </>
      )}
      
      {/* Tech readouts */}
      {showTechReadouts && (
        <>
          {/* Top left readout */}
          <div className="absolute top-2 left-3 font-mono text-[8px] tracking-wider text-cyan-400/50 pointer-events-none">
            <div>SYS:NOMINAL</div>
            {showCoordinates && <div className="text-green-400/50">SYNC:OK</div>}
          </div>
          
          {/* Top right readout */}
          <div className="absolute top-2 right-3 font-mono text-[8px] tracking-wider text-cyan-400/50 text-right pointer-events-none">
            <div>{timestamp}</div>
            {label && <div className="text-yellow-400/50">{label}</div>}
          </div>
          
          {/* Bottom left readout */}
          <div className="absolute bottom-2 left-3 font-mono text-[8px] tracking-wider text-pink-400/40 pointer-events-none hidden md:block">
            TRK:ACTIVE
          </div>
          
          {/* Bottom right readout */}
          <div className="absolute bottom-2 right-3 font-mono text-[8px] tracking-wider text-yellow-400/40 text-right pointer-events-none hidden md:block">
            PWR:■■■■■
          </div>
        </>
      )}
      
      {/* Scanline effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

interface HUDFrameProps {
  children: ReactNode;
  title?: string;
  status?: 'active' | 'idle' | 'processing';
}

export function HUDFrame({ children, title, status = 'idle' }: HUDFrameProps) {
  const statusColors = {
    active: 'text-green-400',
    idle: 'text-cyan-400',
    processing: 'text-yellow-400 animate-pulse',
  };

  return (
    <div className="relative border border-cyan-500/20 rounded-md overflow-hidden bg-black/20">
      {/* Header bar */}
      {title && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-cyan-950/30 border-b border-cyan-500/20">
          <span className="font-mono text-[10px] tracking-widest text-cyan-400/70 uppercase">
            {title}
          </span>
          <span className={`font-mono text-[8px] tracking-wider ${statusColors[status]}`}>
            [{status.toUpperCase()}]
          </span>
        </div>
      )}
      
      {/* Content */}
      <div className="relative">
        <HUDOverlay variant="corners" showTechReadouts={false}>
          {children}
        </HUDOverlay>
      </div>
    </div>
  );
}
