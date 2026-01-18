import { useState } from 'react';
import { Sparkles, Menu, Trophy, Home, Compass, FileText, BookOpen, Settings, Award } from 'lucide-react';
import { SoundToggle } from './SoundToggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { XPProgressBar } from './XPProgressBar';
import type { View } from '@/pages/story-arcade';

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
    <nav 
      className="fixed top-0 left-0 w-full z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 md:px-8 py-4 flex justify-between items-center gap-4"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-3">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              data-testid="button-mobile-menu"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-[70vw] max-w-[320px] bg-background border-r border-border p-0"
            id="mobile-menu"
            aria-label="Navigation menu"
          >
            <div className="flex flex-col h-full" role="menu">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-sm flex items-center justify-center shadow-lg shadow-cyan-900/50">
                    <Sparkles className="w-5 h-5 text-black fill-black" aria-hidden="true" />
                  </div>
                  <span className="font-display text-lg text-foreground tracking-[0.15em]">STORY ARCADE</span>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-2" role="menubar" aria-label="Navigation links">
                <Button 
                  variant="ghost"
                  onClick={() => handleMobileNavClick('ATTRACT')} 
                  className={`w-full justify-start gap-3 font-display text-lg tracking-widest ${
                    isCreating ? 'text-muted-foreground/50 cursor-not-allowed' : ''
                  }`}
                  disabled={isCreating}
                  data-testid="mobile-nav-home"
                  role="menuitem"
                  aria-label="Navigate to home page"
                  aria-disabled={isCreating}
                >
                  <Home className="w-5 h-5" aria-hidden="true" />
                  HOME
                  {isCreating && <span className="text-xs text-muted-foreground ml-auto" aria-label={`Story in progress: scene ${currentScene} of ${totalScenes}`}>({currentScene}/{totalScenes})</span>}
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={() => handleMobileNavClick('GALLERY')} 
                  className={`w-full justify-start gap-3 font-display text-lg tracking-widest ${
                    isCreating ? 'text-muted-foreground/50 cursor-not-allowed' : ''
                  }`}
                  disabled={isCreating}
                  data-testid="mobile-nav-explore"
                  role="menuitem"
                  aria-label="Browse community stories"
                  aria-disabled={isCreating}
                >
                  <Compass className="w-5 h-5" aria-hidden="true" />
                  EXPLORE
                  {isCreating && <span className="text-xs text-muted-foreground ml-auto" aria-hidden="true">({currentScene}/{totalScenes})</span>}
                </Button>

                <Button 
                  variant="ghost"
                  onClick={() => handleMobileNavClick('DRAFTS')} 
                  className={`w-full justify-start gap-3 font-display text-lg tracking-widest ${
                    isCreating ? 'text-muted-foreground/50 cursor-not-allowed' : ''
                  }`}
                  disabled={isCreating}
                  data-testid="mobile-nav-drafts"
                  role="menuitem"
                  aria-label="View your saved drafts"
                  aria-disabled={isCreating}
                >
                  <FileText className="w-5 h-5" aria-hidden="true" />
                  DRAFTS
                </Button>

                <Button 
                  variant="ghost"
                  onClick={() => handleMobileNavClick('MY_STORIES')} 
                  className={`w-full justify-start gap-3 font-display text-lg tracking-widest ${
                    isCreating ? 'text-muted-foreground/50 cursor-not-allowed' : ''
                  }`}
                  disabled={isCreating}
                  data-testid="mobile-nav-my-stories"
                  role="menuitem"
                  aria-label="View your completed stories"
                  aria-disabled={isCreating}
                >
                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                  MY STORIES
                </Button>

                <Button 
                  variant="ghost"
                  onClick={() => handleMobileNavClick('BADGES')} 
                  className={`w-full justify-start gap-3 font-display text-lg tracking-widest ${
                    isCreating ? 'text-muted-foreground/50 cursor-not-allowed' : ''
                  }`}
                  disabled={isCreating}
                  data-testid="mobile-nav-badges"
                  role="menuitem"
                  aria-label="View achievements and badges"
                  aria-disabled={isCreating}
                >
                  <Award className="w-5 h-5" aria-hidden="true" />
                  BADGES
                </Button>

                {!isCreating && (
                  <Button 
                    variant="default"
                    onClick={() => handleMobileNavClick('TRACK_SELECT')} 
                    className="w-full justify-start gap-3 font-display text-lg tracking-widest"
                    data-testid="mobile-nav-create"
                    role="menuitem"
                    aria-label="Start creating a new story"
                  >
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                    CREATE STORY
                  </Button>
                )}
              </div>

              <div className="p-4 border-t border-border space-y-4">
                <div 
                  className="flex items-center gap-3 p-4 rounded-md bg-amber-900/10 border border-amber-500/20"
                  role="status"
                  aria-label={`Points earned: ${streak} stories created`}
                >
                  <Trophy className="w-5 h-5 text-amber-400" aria-hidden="true" />
                  <span className="text-amber-400 font-mono text-sm">{streak} stories created</span>
                </div>
                
                {isCreating && (
                  <div 
                    className="flex items-center gap-3 p-4 rounded-md bg-cyan-900/10 border border-cyan-500/20"
                    role="status"
                    aria-label={`Currently on scene ${currentScene} of ${totalScenes}`}
                  >
                    <Sparkles className="w-5 h-5 text-cyan-400" aria-hidden="true" />
                    <span className="text-cyan-400 font-mono text-sm">Scene {currentScene}/{totalScenes}</span>
                  </div>
                )}

                <Button 
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground font-mono text-sm tracking-widest"
                  data-testid="mobile-nav-settings"
                  role="menuitem"
                  aria-label="Open settings"
                >
                  <Settings className="w-5 h-5" aria-hidden="true" />
                  SETTINGS
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <button 
          onClick={handleLogoClick} 
          className="cursor-pointer group flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 rounded-sm"
          data-testid="link-home"
          aria-label="Story Arcade - Return to home page"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-sm flex items-center justify-center shadow-lg shadow-cyan-900/50 group-hover:rotate-3 transition-transform hidden md:flex">
            <Sparkles className="w-5 h-5 text-black fill-black" aria-hidden="true" />
          </div>
          <span className="font-display text-lg md:text-xl text-foreground tracking-[0.15em]">STORY ARCADE</span>
        </button>
      </div>
      
      <div className="hidden md:flex items-center gap-6 font-mono text-xs text-muted-foreground font-medium tracking-widest" role="menubar">
        {isCreating ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={navButtonClass}
                  disabled
                  data-testid="nav-home"
                  role="menuitem"
                  aria-disabled="true"
                  aria-label="Home - disabled during story creation"
                >
                  HOME
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Finish your story first! (Scene {currentScene}/{totalScenes})</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={navButtonClass}
                  disabled
                  data-testid="nav-explore"
                  role="menuitem"
                  aria-disabled="true"
                  aria-label="Explore - disabled during story creation"
                >
                  EXPLORE
                </button>
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
              className={`${currentView === 'ATTRACT' ? 'text-foreground' : ''} ${navButtonClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 rounded-sm`}
              data-testid="nav-home"
              role="menuitem"
              aria-label="Navigate to home page"
              aria-current={currentView === 'ATTRACT' ? 'page' : undefined}
            >
              HOME
            </button>
            <button 
              onClick={() => handleNavClick('GALLERY')} 
              className={`${currentView === 'GALLERY' ? 'text-foreground' : ''} ${navButtonClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 rounded-sm`}
              data-testid="nav-explore"
              role="menuitem"
              aria-label="Browse community stories"
              aria-current={currentView === 'GALLERY' ? 'page' : undefined}
            >
              EXPLORE
            </button>
            <button 
              onClick={() => handleNavClick('DRAFTS')} 
              className={`${currentView === 'DRAFTS' ? 'text-foreground' : ''} ${navButtonClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 rounded-sm`}
              data-testid="nav-drafts"
              role="menuitem"
              aria-label="View your saved drafts"
              aria-current={currentView === 'DRAFTS' ? 'page' : undefined}
            >
              DRAFTS
            </button>
            <button 
              onClick={() => handleNavClick('MY_STORIES')} 
              className={`${currentView === 'MY_STORIES' ? 'text-foreground' : ''} ${navButtonClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 rounded-sm`}
              data-testid="nav-my-stories"
              role="menuitem"
              aria-label="View your completed stories"
              aria-current={currentView === 'MY_STORIES' ? 'page' : undefined}
            >
              MY STORIES
            </button>
          </>
        )}
        
        {isCreating && (
          <div 
            className="flex items-center gap-1 text-cyan-400 border border-cyan-500/20 bg-cyan-900/10 px-3 py-1 rounded-full" 
            data-testid="text-scene-progress"
            role="status"
            aria-label={`Story in progress: scene ${currentScene} of ${totalScenes}`}
          >
            Story in Progress: Scene {currentScene}/{totalScenes}
          </div>
        )}
        
        <div 
          className="flex items-center gap-1 text-amber-400 border border-amber-500/20 bg-amber-900/10 px-3 py-1 rounded-full" 
          title="Stories Created" 
          data-testid="text-streak"
          role="status"
          aria-label={`Points earned: ${streak} stories created`}
        >
           <Trophy className="w-3 h-3" aria-hidden="true" /> {streak}
        </div>

        <XPProgressBar />

        <SoundToggle />

        <button 
          onClick={() => handleNavClick('BADGES')} 
          className={`${currentView === 'BADGES' ? 'text-foreground' : ''} ${navButtonClass} flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 rounded-sm`}
          data-testid="nav-badges"
          role="menuitem"
          aria-label="View achievements and badges"
          aria-current={currentView === 'BADGES' ? 'page' : undefined}
        >
          <Award className="w-3 h-3" aria-hidden="true" />
          BADGES
        </button>

      </div>

      <div className="md:hidden flex items-center gap-2">
        <SoundToggle />
        {isCreating && (
          <div 
            className="flex items-center gap-1 text-cyan-400 text-xs font-mono" 
            data-testid="mobile-scene-progress"
            role="status"
            aria-label={`Scene ${currentScene} of ${totalScenes}`}
          >
            {currentScene}/{totalScenes}
          </div>
        )}
        <div 
          className="flex items-center gap-1 text-amber-400 text-xs" 
          data-testid="mobile-streak"
          role="status"
          aria-label={`${streak} stories created`}
        >
          <Trophy className="w-3 h-3" aria-hidden="true" /> {streak}
        </div>

      </div>
    </nav>
  );
}
