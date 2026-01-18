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

const INTRO_SEEN_KEY = 'story-arcade-intro-seen';

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
    const hasSeenIntro = localStorage.getItem(INTRO_SEEN_KEY);
    if (!hasSeenIntro) {
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
