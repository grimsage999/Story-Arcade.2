import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ArcadeSoundProvider } from "@/components/arcade/ArcadeSoundProvider";
import { LogoStinger } from "@/components/arcade/LogoStinger";
import StoryArcade from "@/pages/story-arcade";
import StoryPage from "@/pages/story";
import NotFound from "@/pages/not-found";

const INTRO_SEEN_KEY = 'story-arcade-intro-seen-v2';

function Router() {
  return (
    <Switch>
      <Route path="/" component={StoryArcade} />
      <Route path="/story/:shareableId" component={StoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [introChecked, setIntroChecked] = useState(true);

  useEffect(() => {
    try {
      // Check for URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const skipIntro = urlParams.get('intro') === 'skip';
      
      // Skip intro only if explicitly requested
      if (skipIntro) {
        console.log('[LogoStinger] Skip intro via URL');
        localStorage.setItem(INTRO_SEEN_KEY, 'true');
        window.history.replaceState({}, '', window.location.pathname);
        setShowIntro(false);
        return;
      }
      
      // Check if already seen (but always show for now to debug)
      const hasSeenIntro = localStorage.getItem(INTRO_SEEN_KEY);
      console.log('[LogoStinger] Checking intro, has seen:', hasSeenIntro);
      
      // ALWAYS show intro for now until user confirms it's working
      setShowIntro(true);
    } catch (e) {
      console.log('[LogoStinger] localStorage error:', e);
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    localStorage.setItem(INTRO_SEEN_KEY, 'true');
    setShowIntro(false);
  };

  if (!introChecked) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ArcadeSoundProvider>
          {showIntro ? (
            <LogoStinger onComplete={handleIntroComplete} duration={10000} />
          ) : (
            <>
              <Toaster />
              <Router />
            </>
          )}
        </ArcadeSoundProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
