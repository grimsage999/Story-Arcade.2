import { useState } from 'react';
import { Sparkles, Menu, X, Trophy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type View = 'ATTRACT' | 'TRACK_SELECT' | 'QUESTIONS' | 'FORGING' | 'REVEAL' | 'GALLERY';

interface NavbarProps {
  onViewChange: (view: View) => void;
  currentView: View;
  streak: number;
  isCreating?: boolean;
  currentScene?: number;
  totalScenes?: number;
  onLogoClick?: () => void;
}

export function Navbar({ 
  onViewChange, 
  currentView, 
  streak, 
  isCreating = false,
  currentScene = 0,
  totalScenes = 5,
  onLogoClick 
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (targetView: View) => {
    if (!isCreating) {
      onViewChange(targetView);
    }
  };

  const handleLogoClick = () => {
    if (isCreating && onLogoClick) {
      onLogoClick();
    } else {
      onViewChange('ATTRACT');
    }
  };

  const navButtonClass = isCreating 
    ? 'opacity-50 cursor-not-allowed' 
    : 'hover:text-primary transition-colors cursor-pointer';

  return (
    <nav className="fixed top-0 left-0 w-full z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 md:px-8 py-4 flex justify-between items-center gap-4">
      <button 
        onClick={handleLogoClick} 
        className="cursor-pointer group flex items-center gap-3"
        data-testid="link-home"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-sm flex items-center justify-center shadow-lg shadow-cyan-900/50 group-hover:rotate-12 transition-transform">
          <Sparkles className="w-5 h-5 text-black fill-black" />
        </div>
        <span className="font-display text-lg md:text-xl text-foreground tracking-[0.15em] group-hover:text-primary transition-colors">STORY ARCADE</span>
      </button>
      
      <div className="hidden md:flex items-center gap-6 font-mono text-xs text-muted-foreground font-medium tracking-widest">
        {isCreating ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={navButtonClass} data-testid="nav-home">
                  HOME
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Finish your story first! (Scene {currentScene}/{totalScenes})</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={navButtonClass} data-testid="nav-explore">
                  EXPLORE
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Finish your story first! (Scene {currentScene}/{totalScenes})</p>
              </TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <button 
              onClick={() => handleNavClick('ATTRACT')} 
              className={`${currentView === 'ATTRACT' ? 'text-foreground' : ''} ${navButtonClass}`}
              data-testid="nav-home"
            >
              HOME
            </button>
            <button 
              onClick={() => handleNavClick('GALLERY')} 
              className={`${currentView === 'GALLERY' ? 'text-foreground' : ''} ${navButtonClass}`}
              data-testid="nav-explore"
            >
              EXPLORE
            </button>
          </>
        )}
        
        {isCreating && (
          <div className="flex items-center gap-1 text-cyan-400 border border-cyan-500/20 bg-cyan-900/10 px-3 py-1 rounded-full" data-testid="text-scene-progress">
            Story in Progress: Scene {currentScene}/{totalScenes}
          </div>
        )}
        
        <div className="flex items-center gap-1 text-amber-400 border border-amber-500/20 bg-amber-900/10 px-3 py-1 rounded-full" title="Stories Created" data-testid="text-streak">
           <Trophy className="w-3 h-3" /> {streak}
        </div>
      </div>

      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden text-muted-foreground p-2 hover:text-foreground"
        data-testid="button-mobile-menu"
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {mobileMenuOpen ? <X /> : <Menu />}
      </button>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-background border-b border-border p-6 flex flex-col gap-6 md:hidden shadow-2xl animate-slide-in-from-top">
          {isCreating ? (
            <>
              <span className="text-left text-muted-foreground/50 font-display text-xl tracking-widest">
                HOME (Scene {currentScene}/{totalScenes})
              </span>
              <span className="text-left text-muted-foreground/50 font-display text-xl tracking-widest">
                EXPLORE (Scene {currentScene}/{totalScenes})
              </span>
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm">
                Story in Progress: Scene {currentScene}/{totalScenes}
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => { onViewChange('ATTRACT'); setMobileMenuOpen(false); }} 
                className="text-left text-foreground font-display text-xl tracking-widest"
                data-testid="mobile-nav-home"
              >
                HOME
              </button>
              <button 
                onClick={() => { onViewChange('GALLERY'); setMobileMenuOpen(false); }} 
                className="text-left text-foreground font-display text-xl tracking-widest"
                data-testid="mobile-nav-explore"
              >
                EXPLORE
              </button>
              <button 
                onClick={() => { onViewChange('TRACK_SELECT'); setMobileMenuOpen(false); }} 
                className="text-left text-primary font-display text-xl tracking-widest"
                data-testid="mobile-nav-create"
              >
                CREATE STORY
              </button>
            </>
          )}
          <div className="flex items-center gap-2 text-amber-400 font-mono text-sm">
            <Trophy className="w-4 h-4" /> {streak} stories created
          </div>
        </div>
      )}
    </nav>
  );
}
