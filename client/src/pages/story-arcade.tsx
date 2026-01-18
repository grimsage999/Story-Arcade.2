import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, ArrowRight, Download, Shuffle, Share2, Eye, RefreshCw, X } from 'lucide-react';
import type { Track, Story } from '@shared/schema';
import { TRACKS, MOTIVATIONS, SEED_STORIES } from '@/lib/tracks';
import { CRTOverlay } from '@/components/arcade/CRTOverlay';
import { Confetti } from '@/components/arcade/Confetti';
import { Toast } from '@/components/arcade/Toast';
import { Navbar } from '@/components/arcade/Navbar';
import { TrackCard } from '@/components/arcade/TrackCard';
import { StoryCard } from '@/components/arcade/StoryCard';
import { Button } from '@/components/ui/button';
import { queryClient, apiRequest } from '@/lib/queryClient';

type View = 'ATTRACT' | 'TRACK_SELECT' | 'QUESTIONS' | 'FORGING' | 'REVEAL' | 'GALLERY';

const LOADING_STEPS = [
  "INITIALIZING STORY ENGINE...",
  "ANALYZING NARRATIVE THREADS...",
  "WEAVING YOUR LEGEND...",
  "ADDING CINEMATIC POLISH...",
  "STORY COMPLETE!"
];

export default function StoryArcade() {
  const [view, setView] = useState<View>('ATTRACT');
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [generatedStory, setGeneratedStory] = useState<Story | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [demoCount, setDemoCount] = useState(0);
  const [galleryModalStory, setGalleryModalStory] = useState<Story | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [inputError, setInputError] = useState(false);

  const { data: apiGallery, isLoading: isLoadingGallery, isError: isGalleryError } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    retry: 1,
  });

  const gallery = apiGallery && apiGallery.length > 0 ? apiGallery : SEED_STORIES;

  const createStoryMutation = useMutation({
    mutationFn: async (story: Omit<Story, 'id'>) => {
      return apiRequest('POST', '/api/stories', story);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
  });

  useEffect(() => {
    const savedStreak = localStorage.getItem('story_arcade_streak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak));
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleTrackSelect = (track: Track) => {
    setActiveTrack(track);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setView('QUESTIONS');
  };

  const handleAnswerChange = (text: string) => {
    if (!activeTrack) return;
    const qId = activeTrack.questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [qId]: text }));
    setInputError(false);
  };

  const nextQuestion = () => {
    if (!activeTrack) return;
    const currentQ = activeTrack.questions[currentQuestionIndex];
    if ((answers[currentQ.id] || '').length < 5) {
      setInputError(true);
      return;
    }

    if ((answers[currentQ.id] || '').toLowerCase().includes("magic")) {
      showToast("Hidden power unlocked!");
    }

    if (currentQuestionIndex < activeTrack.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        generateStory();
      }, 2000);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      setView('TRACK_SELECT');
    }
  };

  const generateStory = async () => {
    if (!activeTrack) return;
    setView('FORGING');
    setLoadingStep(0);

    for (let i = 0; i < LOADING_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      setLoadingStep(i + 1);
    }
    await new Promise(r => setTimeout(r, 500));

    const storyContent = {
      title: "The Legend of " + (answers.hook ? answers.hook.slice(0, 20) : "Tomorrow"),
      themes: ["Hope", "Grit", "Transformation"],
      insight: MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)],
      logline: `A ${activeTrack.title.toLowerCase()} story begins today.`,
      p1: "It started with " + (answers.hook || "a dream") + ". " + (answers.sensory || "The air was electric with possibility."),
      p2: "The challenge was real: " + (answers.challenge || "the doubt that whispers 'not you'") + ". But in that moment of truth, a voice said: " + (answers.reflection || "'I am ready.'"),
      p3: "And so the world changed. " + (answers.resolution || "Victory was won, and a new chapter began."),
    };

    const storyData = {
      trackId: activeTrack.id,
      ...storyContent,
      author: "Protagonist",
      neighborhood: "The Block",
      timestamp: new Date().toISOString(),
      trackTitle: activeTrack.title,
      answers: answers,
    };

    try {
      const response = await createStoryMutation.mutateAsync(storyData);
      const newStory = await response.json();
      setGeneratedStory(newStory);
    } catch {
      const newStory: Story = {
        id: Date.now(),
        ...storyData,
      };
      setGeneratedStory(newStory);
    }

    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem('story_arcade_streak', newStreak.toString());

    setView('REVEAL');
  };

  const handleSecretDemoTrigger = () => {
    const newCount = demoCount + 1;
    setDemoCount(newCount);
    if (newCount === 3) {
      setActiveTrack(TRACKS[1]);
      setAnswers({
        hook: "The Williamsburg waterfront where art meets commerce",
        sensory: "The smell of cilantro and salt water",
        challenge: "No more food deserts",
        reflection: "Street vendors become small business owners",
        resolution: "The Evening Market ritual"
      });
      setTimeout(() => generateStory(), 500);
      setDemoCount(0);
    }
  };

  const startOver = () => {
    setActiveTrack(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setGeneratedStory(null);
    setView('TRACK_SELECT');
  };

  const handleShare = async () => {
    if (!generatedStory) return;
    try {
      await navigator.share({
        title: generatedStory.title,
        text: generatedStory.logline,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(`${generatedStory.title}\n\n${generatedStory.logline}\n\n${generatedStory.p1}\n\n${generatedStory.p2}\n\n${generatedStory.p3}`);
      showToast("Story copied to clipboard!");
    }
  };

  if (view === 'ATTRACT') {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans text-foreground relative">
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        <div className="relative flex-1 flex flex-col justify-center items-center px-6 text-center pt-20 md:pt-0">
          <div className="z-10 max-w-5xl space-y-8 animate-fade-in">
            <button
              onClick={handleSecretDemoTrigger}
              className="inline-block px-4 py-1.5 border border-primary/20 rounded-full bg-primary/10 text-primary font-mono text-[10px] md:text-xs tracking-[0.2em] mb-4 backdrop-blur-sm hover:bg-primary/20 transition-colors cursor-pointer"
              data-testid="badge-version"
            >
              COMMUNITY MYTHOLOGY ENGINE v1.0
            </button>
            <h1 className="text-4xl md:text-7xl lg:text-8xl font-display leading-[0.9] tracking-tight hover:scale-[1.01] transition-transform duration-500 cursor-default">
              TURN YOUR STORY INTO <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_30px_rgba(34,211,238,0.4)] animate-pulse-glow">
                CINEMATIC LEGEND
              </span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
              Build the public archive of the future. Answer 5 questions and watch your neighborhood's story come to life in a stylized artifact.
            </p>
            
            <div className="flex flex-col md:flex-row w-full md:w-auto gap-4 pt-8 justify-center">
              <Button 
                onClick={() => setView('TRACK_SELECT')} 
                size="lg"
                className="w-full md:w-auto bg-primary text-primary-foreground font-display uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all"
                data-testid="button-create-story"
              >
                Create Your Story <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => { setActiveTrack(TRACKS[0]); setAnswers({}); setCurrentQuestionIndex(0); setView('QUESTIONS'); }} 
                className="w-full md:w-auto font-mono uppercase tracking-widest"
                data-testid="button-quick-start"
              >
                Quick Start: Origin
              </Button>
            </div>
            
            <div className="pt-12">
              <button 
                onClick={() => setView('GALLERY')}
                className="text-muted-foreground hover:text-primary transition-colors font-mono text-xs tracking-widest flex items-center gap-2 mx-auto"
                data-testid="link-explore-gallery"
              >
                <Eye className="w-4 h-4" /> EXPLORE {gallery.length} COMMUNITY STORIES
              </button>
            </div>
          </div>
        </div>
        
        <Toast message={toast} />
      </div>
    );
  }

  if (view === 'TRACK_SELECT') {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans relative">
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        <div className="flex-1 p-6 md:p-12 pt-28 max-w-7xl mx-auto w-full">
          <div className="mb-10 md:mb-16">
            <h2 className="text-3xl md:text-5xl text-foreground font-display uppercase mb-3" data-testid="text-page-title">Select a Cartridge</h2>
            <p className="text-muted-foreground font-mono text-xs md:text-sm tracking-widest">CHOOSE THE THEME OF YOUR NARRATIVE</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {TRACKS.map(track => (
              <TrackCard key={track.id} track={track} onSelect={handleTrackSelect} />
            ))}
          </div>
        </div>
        
        <Toast message={toast} />
      </div>
    );
  }

  if (view === 'QUESTIONS' && activeTrack) {
    const question = activeTrack.questions[currentQuestionIndex];
    const currentInput = answers[question.id] || '';
    const charCount = currentInput.length;
    const isValid = charCount >= 5;
    const motivation = MOTIVATIONS[currentQuestionIndex % MOTIVATIONS.length];
    
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans relative overflow-hidden">
        <CRTOverlay />
        <Confetti active={showConfetti} />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        <div className="flex-1 flex flex-col pt-24 pb-32 px-6 md:p-12 md:pt-28 max-w-6xl mx-auto w-full">
          <div className="w-full flex justify-between items-center mb-8 md:mb-16 border-b border-border pb-6 gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`px-3 py-1 border ${activeTrack.border} ${activeTrack.accent} bg-opacity-10 rounded-sm text-[10px] font-mono uppercase tracking-widest`} data-testid="badge-track">
                {activeTrack.title}
              </span>
              <span className="text-muted-foreground font-mono text-xs tracking-widest hidden md:inline">
                SCENE {currentQuestionIndex + 1}/{activeTrack.questions.length}
              </span>
            </div>
            <div className="flex gap-2">
              {activeTrack.questions.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 w-8 md:w-12 rounded-full transition-all duration-500 ${i <= currentQuestionIndex ? 'bg-primary shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-secondary'}`}
                  data-testid={`progress-step-${i}`}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-5 flex flex-col justify-center">
              <p className="text-muted-foreground font-mono text-[10px] md:text-xs tracking-widest mb-4">{question.guidance.toUpperCase()}</p>
              <h2 className="font-display text-2xl md:text-4xl text-foreground leading-tight mb-6" data-testid="text-question-prompt">
                {question.prompt}
              </h2>
              <p className="text-muted-foreground font-mono text-xs italic">{motivation}</p>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className={`relative group flex-1 ${inputError ? 'animate-shake' : ''}`}>
                <textarea
                  value={currentInput}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder={question.placeholder}
                  className="w-full h-full min-h-[180px] md:min-h-[240px] bg-card border border-card-border rounded-md p-6 text-foreground text-base md:text-lg leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all resize-none"
                  data-testid="input-answer"
                />
                <div className="absolute bottom-4 right-4 text-xs font-mono text-muted-foreground" data-testid="text-char-count">
                  {charCount} chars
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 gap-4">
                <Button 
                  variant="outline" 
                  onClick={prevQuestion}
                  className="font-mono uppercase tracking-widest"
                  data-testid="button-prev"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {currentQuestionIndex === 0 ? 'Back' : 'Prev'}
                </Button>
                <Button 
                  onClick={nextQuestion}
                  disabled={!isValid}
                  className="bg-primary text-primary-foreground font-display uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.5)] disabled:opacity-50 disabled:shadow-none"
                  data-testid="button-next"
                >
                  {currentQuestionIndex === activeTrack.questions.length - 1 ? 'Forge Story' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <Toast message={toast} />
      </div>
    );
  }

  if (view === 'FORGING') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans relative">
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        <div className="text-center space-y-8 px-6 animate-fade-in" data-testid="view-forging">
          <div className="w-24 h-24 mx-auto relative">
            <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping" />
            <div className="absolute inset-2 border-4 border-primary/50 rounded-full animate-pulse" />
            <div className="absolute inset-4 border-4 border-primary rounded-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="font-display text-2xl md:text-4xl text-foreground uppercase tracking-widest">
              {LOADING_STEPS[loadingStep - 1] || LOADING_STEPS[0]}
            </h2>
            <div className="flex gap-2 justify-center">
              {LOADING_STEPS.map((_, i) => (
                <div 
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${i < loadingStep ? 'bg-primary' : 'bg-secondary'}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <Toast message={toast} />
      </div>
    );
  }

  if (view === 'REVEAL' && generatedStory) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans relative">
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        <div className="flex-1 p-6 md:p-12 pt-28 max-w-4xl mx-auto w-full" data-testid="view-reveal">
          <div className="mb-8 text-center animate-fade-in">
            <p className="text-primary font-mono text-xs tracking-widest mb-4">YOUR STORY IS READY</p>
            <h1 className="font-display text-3xl md:text-5xl text-foreground mb-4" data-testid="text-story-title">
              {generatedStory.title}
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              {generatedStory.trackTitle} • {generatedStory.neighborhood}
            </p>
          </div>
          
          <div className="bg-card border border-card-border rounded-md p-6 md:p-10 mb-8 animate-fade-in">
            <p className="text-xl md:text-2xl text-primary font-display italic mb-8 border-l-4 border-primary pl-6">
              "{generatedStory.logline}"
            </p>
            
            <div className="space-y-6 text-foreground leading-relaxed text-base md:text-lg">
              <p data-testid="text-story-p1">{generatedStory.p1}</p>
              <p data-testid="text-story-p2">{generatedStory.p2}</p>
              <p data-testid="text-story-p3">{generatedStory.p3}</p>
            </div>
            
            <div className="flex items-center gap-2 mt-8 pt-6 border-t border-border flex-wrap">
              {generatedStory.themes.map((theme) => (
                <span 
                  key={theme}
                  className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center animate-fade-in">
            <Button 
              onClick={handleShare}
              className="bg-primary text-primary-foreground font-display uppercase tracking-widest"
              data-testid="button-share-story"
            >
              <Share2 className="w-4 h-4 mr-2" /> Share Story
            </Button>
            <Button 
              variant="outline"
              onClick={() => setView('GALLERY')}
              className="font-mono uppercase tracking-widest"
              data-testid="button-view-gallery"
            >
              <Eye className="w-4 h-4 mr-2" /> View Gallery
            </Button>
            <Button 
              variant="outline"
              onClick={startOver}
              className="font-mono uppercase tracking-widest"
              data-testid="button-create-another"
            >
              <Shuffle className="w-4 h-4 mr-2" /> Create Another
            </Button>
          </div>
        </div>
        
        <Toast message={toast} />
      </div>
    );
  }

  if (view === 'GALLERY') {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans relative">
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        <div className="flex-1 p-6 md:p-12 pt-28 max-w-7xl mx-auto w-full" data-testid="view-gallery">
          <div className="mb-10 md:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-5xl text-foreground font-display uppercase mb-3">Community Archive</h2>
              <p className="text-muted-foreground font-mono text-xs md:text-sm tracking-widest">{gallery.length} STORIES IN THE VAULT</p>
            </div>
            <Button 
              onClick={() => setView('TRACK_SELECT')}
              className="bg-primary text-primary-foreground font-display uppercase tracking-widest w-full md:w-auto"
              data-testid="button-add-yours"
            >
              Add Yours <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {gallery.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-mono text-sm mb-6">No stories yet. Be the first to create one!</p>
              <Button 
                onClick={() => setView('TRACK_SELECT')}
                className="bg-primary text-primary-foreground font-display uppercase tracking-widest"
              >
                Create First Story
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              {gallery.map((story) => (
                <StoryCard 
                  key={story.id} 
                  story={story} 
                  onView={(s) => setGalleryModalStory(s)}
                />
              ))}
            </div>
          )}
        </div>

        {galleryModalStory && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
            onClick={() => setGalleryModalStory(null)}
            data-testid="modal-story"
          >
            <div 
              className="bg-card border border-primary/30 rounded-md max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-10 relative animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setGalleryModalStory(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-close-modal"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="mb-6">
                <p className="text-primary font-mono text-xs tracking-widest mb-2">{galleryModalStory.trackTitle}</p>
                <h2 className="font-display text-2xl md:text-4xl text-foreground mb-2">{galleryModalStory.title}</h2>
                <p className="text-muted-foreground font-mono text-sm">
                  by {galleryModalStory.author} • {galleryModalStory.neighborhood}
                </p>
              </div>
              
              <p className="text-lg text-primary font-display italic mb-6 border-l-4 border-primary pl-4">
                "{galleryModalStory.logline}"
              </p>
              
              <div className="space-y-4 text-foreground leading-relaxed">
                <p>{galleryModalStory.p1}</p>
                <p>{galleryModalStory.p2}</p>
                <p>{galleryModalStory.p3}</p>
              </div>
              
              <div className="flex items-center gap-2 mt-6 pt-6 border-t border-border flex-wrap">
                {galleryModalStory.themes.map((theme) => (
                  <span 
                    key={theme}
                    className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <Toast message={toast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <CRTOverlay />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}
