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
import { BadgesPage } from "@/pages/badges";
import { MyStoriesPage } from "@/pages/my-stories";
import ExplorePage from "@/pages/explore";
import NotFound from "@/pages/not-found";


function Router() {
  return (
    <Switch>
      <Route path="/" component={StoryArcade} />
      <Route path="/story/:shareableId" component={StoryPage} />
      <Route path="/badges">{() => <BadgesPage />}</Route>
      <Route path="/my-stories">{() => <MyStoriesPage />}</Route>
      <Route path="/explore">{() => <ExplorePage />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [introChecked, setIntroChecked] = useState(true);

  useEffect(() => {
    // Check if skip parameter is set
    const urlParams = new URLSearchParams(window.location.search);
    const skipIntro = urlParams.get('intro') === 'skip';
    
    if (skipIntro) {
      window.history.replaceState({}, '', window.location.pathname);
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
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
