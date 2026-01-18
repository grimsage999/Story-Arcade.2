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
      const urlParams = new URLSearchParams(window.location.search);
      const skipIntro = urlParams.get('intro') === 'skip';
      const forceIntro = urlParams.get('intro') === 'force';
      const replayIntro = urlParams.get('replay') === 'intro';
      
      // Skip intro if explicitly requested
      if (skipIntro) {
        localStorage.setItem(INTRO_SEEN_KEY, 'true');
        window.history.replaceState({}, '', window.location.pathname);
        setShowIntro(false);
        setIntroChecked(true);
        return;
      }
      
      // Force or replay intro
      if (forceIntro || replayIntro) {
        if (replayIntro) localStorage.removeItem(INTRO_SEEN_KEY);
        window.history.replaceState({}, '', window.location.pathname);
        setShowIntro(true);
        setIntroChecked(true);
        return;
      }
      
      // Normal flow: show intro only if not seen before
      const hasSeenIntro = localStorage.getItem(INTRO_SEEN_KEY);
      setShowIntro(!hasSeenIntro);
      setIntroChecked(true);
    } catch (e) {
      // If localStorage is blocked, show intro
      setShowIntro(true);
      setIntroChecked(true);
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
            <LogoStinger onComplete={handleIntroComplete} />
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
