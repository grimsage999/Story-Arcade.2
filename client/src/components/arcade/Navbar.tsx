import { useState } from 'react';
import { Sparkles, Menu, Trophy, Home, Compass, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

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

  const handleMobileNavClick = (targetView: View) => {
    if (!isCreating) {
      onViewChange(targetView);
      setMobileMenuOpen(false);
    }
  };

  const navButtonClass = isCreating 
    ? 'opacity-50 cursor-not-allowed' 
    : 'hover-elevate cursor-pointer';

  return (
    <nav className="fixed top-0 left-0 w-full z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 md:px-8 py-4 flex justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              data-testid="button-mobile-menu"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[70vw] max-w-[320px] bg-background border-r border-border p-0">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-sm flex items-center justify-center shadow-lg shadow-cyan-900/50">
                    <Sparkles className="w-5 h-5 text-black fill-black" />
                  </div>
                  <span className="font-display text-lg text-foreground tracking-[0.15em]">STORY ARCADE</span>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-2">
                <Button 
                  variant="ghost"
                  onClick={() => handleMobileNavClick('ATTRACT')} 
                  className={`w-full justify-start gap-3 font-display text-lg tracking-widest ${
                    isCreating ? 'text-muted-foreground/50 cursor-not-allowed' : ''
                  }`}
                  disabled={isCreating}
                  data-testid="mobile-nav-home"
                >
                  <Home className="w-5 h-5" />
                  HOME
                  {isCreating && <span className="text-xs text-muted-foreground ml-auto">({currentScene}/{totalScenes})</span>}
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={() => handleMobileNavClick('GALLERY')} 
                  className={`w-full justify-start gap-3 font-display text-lg tracking-widest ${
                    isCreating ? 'text-muted-foreground/50 cursor-not-allowed' : ''
                  }`}
                  disabled={isCreating}
                  data-testid="mobile-nav-explore"
                >
                  <Compass className="w-5 h-5" />
                  EXPLORE
                  {isCreating && <span className="text-xs text-muted-foreground ml-auto">({currentScene}/{totalScenes})</span>}
                </Button>

                {!isCreating && (
                  <Button 
                    variant="default"
                    onClick={() => handleMobileNavClick('TRACK_SELECT')} 
                    className="w-full justify-start gap-3 font-display text-lg tracking-widest"
                    data-testid="mobile-nav-create"
                  >
                    <Sparkles className="w-5 h-5" />
                    CREATE STORY
                  </Button>
                )}
              </div>

              <div className="p-4 border-t border-border space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-md bg-amber-900/10 border border-amber-500/20">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 font-mono text-sm">{streak} stories created</span>
                </div>
                
                {isCreating && (
                  <div className="flex items-center gap-3 p-4 rounded-md bg-cyan-900/10 border border-cyan-500/20">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <span className="text-cyan-400 font-mono text-sm">Scene {currentScene}/{totalScenes}</span>
                  </div>
                )}

                <Button 
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground font-mono text-sm tracking-widest"
                  data-testid="mobile-nav-settings"
                >
                  <Settings className="w-5 h-5" />
                  SETTINGS
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <button 
          onClick={handleLogoClick} 
          className="cursor-pointer group flex items-center gap-3"
          data-testid="link-home"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-sm flex items-center justify-center shadow-lg shadow-cyan-900/50 group-hover:rotate-3 transition-transform hidden md:flex">
            <Sparkles className="w-5 h-5 text-black fill-black" />
          </div>
          <span className="font-display text-lg md:text-xl text-foreground tracking-[0.15em]">STORY ARCADE</span>
        </button>
      </div>
      
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

      <div className="md:hidden flex items-center gap-2">
        {isCreating && (
          <div className="flex items-center gap-1 text-cyan-400 text-xs font-mono" data-testid="mobile-scene-progress">
            {currentScene}/{totalScenes}
          </div>
        )}
        <div className="flex items-center gap-1 text-amber-400 text-xs" data-testid="mobile-streak">
          <Trophy className="w-3 h-3" /> {streak}
        </div>
      </div>
    </nav>
  );
}
