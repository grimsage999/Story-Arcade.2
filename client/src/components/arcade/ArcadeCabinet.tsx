import { type ReactNode } from 'react';

interface ArcadeCabinetProps {
  children: ReactNode;
  showMarquee?: boolean;
  marqueeTitle?: string;
  variant?: 'default' | 'compact';
}

export function ArcadeCabinet({ 
  children, 
  showMarquee = true, 
  marqueeTitle,
  variant = 'default'
}: ArcadeCabinetProps) {
  const isCompact = variant === 'compact';
  
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Outer cabinet frame */}
      <div className="relative">
        {/* Left side panel decoration */}
        <div 
          className="hidden lg:block absolute -left-8 top-0 bottom-0 w-6 bg-gradient-to-r from-purple-900/40 via-fuchsia-900/30 to-transparent rounded-l-lg"
          style={{
            boxShadow: 'inset 2px 0 8px rgba(192, 38, 211, 0.3)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-fuchsia-500/10" />
          {/* Side panel stripes */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="h-4 w-full"
                style={{
                  background: i % 2 === 0 
                    ? 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, transparent 100%)' 
                    : 'transparent'
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Right side panel decoration */}
        <div 
          className="hidden lg:block absolute -right-8 top-0 bottom-0 w-6 bg-gradient-to-l from-purple-900/40 via-fuchsia-900/30 to-transparent rounded-r-lg"
          style={{
            boxShadow: 'inset -2px 0 8px rgba(192, 38, 211, 0.3)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-fuchsia-500/10" />
          {/* Side panel stripes */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="h-4 w-full"
                style={{
                  background: i % 2 === 0 
                    ? 'linear-gradient(-90deg, rgba(0,0,0,0.3) 0%, transparent 100%)' 
                    : 'transparent'
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Marquee header */}
        {showMarquee && (
          <div className="relative mb-4 overflow-hidden rounded-t-lg">
            {/* Marquee background with cosmic gradient */}
            <div 
              className="relative py-4 md:py-6 px-6 bg-gradient-to-r from-purple-900 via-fuchsia-800 to-purple-900"
              style={{
                boxShadow: '0 0 30px rgba(192, 38, 211, 0.4), inset 0 -2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {/* Animated stars background */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full animate-pulse"
                    style={{
                      width: Math.random() * 3 + 1 + 'px',
                      height: Math.random() * 3 + 1 + 'px',
                      left: Math.random() * 100 + '%',
                      top: Math.random() * 100 + '%',
                      background: ['#fff', '#ffd700', '#00ffff', '#ff69b4'][Math.floor(Math.random() * 4)],
                      animationDelay: Math.random() * 2 + 's',
                      animationDuration: (Math.random() * 2 + 1) + 's',
                      boxShadow: '0 0 4px currentColor',
                    }}
                  />
                ))}
              </div>
              
              {/* Cosmic orb decoration */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full opacity-60 hidden md:block">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 animate-pulse" />
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500" />
                <div className="absolute -inset-2 rounded-full border border-orange-400/30 animate-spin" style={{ animationDuration: '10s' }} />
                <div className="absolute -inset-4 rounded-full border border-pink-400/20 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
              </div>
              
              {/* Title */}
              {marqueeTitle && (
                <h1 
                  className="relative text-2xl md:text-4xl font-display uppercase tracking-widest text-white text-center"
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(34,211,238,0.3), 2px 2px 0 rgba(0,0,0,0.5)',
                  }}
                >
                  {marqueeTitle}
                </h1>
              )}
            </div>
            
            {/* Marquee bottom trim */}
            <div className="h-2 bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600" />
          </div>
        )}
        
        {/* CRT Screen bezel */}
        <div 
          className={`relative rounded-lg overflow-hidden ${isCompact ? 'p-2' : 'p-2 md:p-4'}`}
          style={{
            background: 'linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 50%, #1a1a2e 100%)',
            boxShadow: `
              inset 0 0 20px rgba(0,0,0,0.8),
              inset 0 0 60px rgba(0,0,0,0.4),
              0 0 15px rgba(34,211,238,0.15),
              0 0 30px rgba(192,38,211,0.1)
            `,
          }}
        >
          {/* Inner bezel highlights */}
          <div 
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.2) 100%)',
            }}
          />
          
          {/* Corner decorations */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary/30 rounded-tl" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary/30 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary/30 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary/30 rounded-br" />
          
          {/* Screen content area */}
          <div 
            className="relative rounded-md overflow-hidden"
            style={{
              boxShadow: 'inset 0 0 30px rgba(34,211,238,0.05)',
            }}
          >
            {children}
          </div>
        </div>
        
        {/* Control panel decoration */}
        <div className="mt-4 hidden md:block">
          <div 
            className="h-8 rounded-b-lg bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center gap-8 px-8"
            style={{
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            {/* Decorative buttons */}
            <div className="flex gap-4">
              <div className="w-4 h-4 rounded-full bg-gradient-to-b from-red-400 to-red-600 shadow-lg" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.5)' }} />
              <div className="w-4 h-4 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 shadow-lg" style={{ boxShadow: '0 0 8px rgba(59,130,246,0.5)' }} />
            </div>
            
            {/* Joystick representation */}
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-600" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-b from-gray-500 to-gray-700" />
            </div>
            
            {/* More decorative buttons */}
            <div className="flex gap-4">
              <div className="w-4 h-4 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 shadow-lg" style={{ boxShadow: '0 0 8px rgba(234,179,8,0.5)' }} />
              <div className="w-4 h-4 rounded-full bg-gradient-to-b from-green-400 to-green-600 shadow-lg" style={{ boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
