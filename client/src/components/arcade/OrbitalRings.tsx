import { type ReactNode } from 'react';

interface OrbitalRingsProps {
  children: ReactNode;
  variant?: 'default' | 'intense' | 'subtle';
  showCoordinates?: boolean;
  animate?: boolean;
}

export function OrbitalRings({ 
  children, 
  variant = 'default',
  showCoordinates = false,
  animate = true
}: OrbitalRingsProps) {
  const intensityMap = {
    subtle: { opacity: 0.15, ringCount: 2 },
    default: { opacity: 0.25, ringCount: 3 },
    intense: { opacity: 0.4, ringCount: 4 },
  };
  
  const { opacity, ringCount } = intensityMap[variant];

  return (
    <div className="relative">
      {/* Orbital rings container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary orbital ring */}
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${animate ? 'animate-spin' : ''}`}
          style={{
            width: '120%',
            height: '60%',
            borderColor: `rgba(236, 72, 153, ${opacity})`,
            transform: 'translate(-50%, -50%) rotateX(70deg) rotateZ(-15deg)',
            animationDuration: '25s',
          }}
        />
        
        {/* Secondary orbital ring */}
        {ringCount >= 2 && (
          <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${animate ? 'animate-spin' : ''}`}
            style={{
              width: '140%',
              height: '45%',
              borderColor: `rgba(34, 211, 238, ${opacity})`,
              transform: 'translate(-50%, -50%) rotateX(75deg) rotateZ(30deg)',
              animationDuration: '30s',
              animationDirection: 'reverse',
            }}
          />
        )}
        
        {/* Tertiary orbital ring */}
        {ringCount >= 3 && (
          <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${animate ? 'animate-spin' : ''}`}
            style={{
              width: '100%',
              height: '80%',
              borderColor: `rgba(251, 191, 36, ${opacity * 0.7})`,
              transform: 'translate(-50%, -50%) rotateX(60deg) rotateZ(-45deg)',
              animationDuration: '20s',
            }}
          />
        )}
        
        {/* Quaternary orbital ring */}
        {ringCount >= 4 && (
          <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${animate ? 'animate-spin' : ''}`}
            style={{
              width: '160%',
              height: '35%',
              borderColor: `rgba(168, 85, 247, ${opacity * 0.5})`,
              transform: 'translate(-50%, -50%) rotateX(80deg) rotateZ(60deg)',
              animationDuration: '35s',
              animationDirection: 'reverse',
            }}
          />
        )}
        
        {/* Grid lines */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          style={{ opacity: opacity * 0.4 }}
        >
          {/* Horizontal grid lines */}
          {[...Array(5)].map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={`${(i + 1) * 16.67}%`}
              x2="100%"
              y2={`${(i + 1) * 16.67}%`}
              stroke="#22d3ee"
              strokeWidth="0.5"
              strokeDasharray="4 8"
            />
          ))}
          {/* Vertical grid lines */}
          {[...Array(7)].map((_, i) => (
            <line
              key={`v-${i}`}
              x1={`${(i + 1) * 12.5}%`}
              y1="0"
              x2={`${(i + 1) * 12.5}%`}
              y2="100%"
              stroke="#22d3ee"
              strokeWidth="0.5"
              strokeDasharray="4 8"
            />
          ))}
        </svg>
        
        {/* Corner coordinates */}
        {showCoordinates && (
          <>
            <div className="absolute top-2 left-2 font-mono text-[8px] text-cyan-400/60">
              X:0.00 Y:0.00
            </div>
            <div className="absolute top-2 right-2 font-mono text-[8px] text-cyan-400/60">
              SYS:ACTIVE
            </div>
            <div className="absolute bottom-2 left-2 font-mono text-[8px] text-pink-400/60">
              TRK:LOCKED
            </div>
            <div className="absolute bottom-2 right-2 font-mono text-[8px] text-yellow-400/60">
              PWR:100%
            </div>
          </>
        )}
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
