import { useState } from 'react';
import { Sparkles, Menu, X, Trophy } from 'lucide-react';

type View = 'ATTRACT' | 'TRACK_SELECT' | 'QUESTIONS' | 'FORGING' | 'REVEAL' | 'GALLERY';

interface NavbarProps {
  onViewChange: (view: View) => void;
  currentView: View;
  streak: number;
}

export function Navbar({ onViewChange, currentView, streak }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-40 bg-background/90 backdrop-blur-xl border-b border-border px-4 md:px-8 py-4 flex justify-between items-center gap-4">
      <button 
        onClick={() => onViewChange('ATTRACT')} 
        className="cursor-pointer group flex items-center gap-3"
        data-testid="link-home"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-sm flex items-center justify-center shadow-lg shadow-cyan-900/50 group-hover:rotate-12 transition-transform">
          <Sparkles className="w-5 h-5 text-black fill-black" />
        </div>
        <span className="font-display text-lg md:text-xl text-foreground tracking-[0.15em] group-hover:text-primary transition-colors">STORY ARCADE</span>
      </button>
      
      <div className="hidden md:flex items-center gap-10 font-mono text-xs text-muted-foreground font-medium tracking-widest">
        <button 
          onClick={() => onViewChange('ATTRACT')} 
          className={`hover:text-primary transition-colors ${currentView === 'ATTRACT' ? 'text-foreground' : ''}`}
          data-testid="nav-home"
        >
          HOME
        </button>
        <button 
          onClick={() => onViewChange('GALLERY')} 
          className={`hover:text-primary transition-colors ${currentView === 'GALLERY' ? 'text-foreground' : ''}`}
          data-testid="nav-explore"
        >
          EXPLORE
        </button>
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
          <div className="flex items-center gap-2 text-amber-400 font-mono text-sm">
            <Trophy className="w-4 h-4" /> {streak} stories created
          </div>
        </div>
      )}
    </nav>
  );
}
