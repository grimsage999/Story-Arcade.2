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
  const [showIntro, setShowIntro] = useState(false);
  const [introChecked, setIntroChecked] = useState(false);

  useEffect(() => {
    try {
      // Check for URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const shouldReplay = urlParams.get('replay') === 'intro';
      const forceIntro = urlParams.get('intro') === 'force';
      const skipIntro = urlParams.get('intro') === 'skip';
      
      // Skip intro if explicitly requested
      if (skipIntro) {
        console.log('[LogoStinger] Skip intro via URL');
        localStorage.setItem(INTRO_SEEN_KEY, 'true');
        window.history.replaceState({}, '', window.location.pathname);
        setShowIntro(false);
        setIntroChecked(true);
        return;
      }
      
      // Force intro bypasses all checks
      if (forceIntro) {
        console.log('[LogoStinger] Force intro triggered via URL');
        window.history.replaceState({}, '', window.location.pathname);
        setShowIntro(true);
        setIntroChecked(true);
        return;
      }
      
      if (shouldReplay) {
        // Clear the flag and remove the URL parameter
        console.log('[LogoStinger] Replay intro triggered');
        localStorage.removeItem(INTRO_SEEN_KEY);
        window.history.replaceState({}, '', window.location.pathname);
        setShowIntro(true);
      } else {
        const hasSeenIntro = localStorage.getItem(INTRO_SEEN_KEY);
        console.log('[LogoStinger] Has seen intro:', hasSeenIntro);
        if (!hasSeenIntro) {
          setShowIntro(true);
        }
      }
    } catch (e) {
      // If localStorage is blocked, show intro
      console.log('[LogoStinger] localStorage error, showing intro:', e);
      setShowIntro(true);
    }
    setIntroChecked(true);
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
