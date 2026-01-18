import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, ArrowRight, Shuffle, Share2, Eye, RefreshCw, Copy, Check, Link } from 'lucide-react';
import type { Track, Story } from '@shared/schema';
import { TRACKS, MOTIVATIONS, SEED_STORIES } from '@/lib/tracks';
import { CRTOverlay } from '@/components/arcade/CRTOverlay';
import { Confetti } from '@/components/arcade/Confetti';
import { Toast } from '@/components/arcade/Toast';
import { Navbar } from '@/components/arcade/Navbar';
import { TrackCard } from '@/components/arcade/TrackCard';
import { StoryCard } from '@/components/arcade/StoryCard';
import { DraftRecoveryBanner } from '@/components/arcade/DraftRecoveryBanner';
import { UnsavedStoryModal } from '@/components/arcade/UnsavedStoryModal';
import { DraftsList } from '@/components/arcade/DraftsList';
import { AutoSaveIndicator } from '@/components/arcade/AutoSaveIndicator';
import { SceneExamples } from '@/components/arcade/SceneExamples';
import { CharacterProgress } from '@/components/arcade/CharacterProgress';
import { InspireMe } from '@/components/arcade/InspireMe';
import { TextareaTooltip } from '@/components/arcade/TextareaTooltip';
import { ForgeProgress, type ForgeStatus } from '@/components/arcade/ForgeProgress';
import { BackToTop } from '@/components/arcade/BackToTop';
import { SkipLink } from '@/components/arcade/SkipLink';
import { StoryModal } from '@/components/arcade/StoryModal';
import { AchievementPopup, LevelUpPopup } from '@/components/arcade/AchievementPopup';
import { StoryPoster } from '@/components/arcade/StoryPoster';
import { arcadeSounds } from '@/lib/arcadeSounds';
import { Button } from '@/components/ui/button';
import type { Badge, ProgressionReward } from '@/hooks/use-progression';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  type Draft, 
  type CompletedStory,
  getAllDrafts, 
  getDraft, 
  saveDraft, 
  deleteDraft, 
  generateDraftId,
  saveCompletedStory,
  getCompletedStories,
  cleanupOldDrafts
} from '@/lib/draftStorage';
import { DraftsPage } from '@/pages/drafts';
import { MyStoriesPage } from '@/pages/my-stories';
import { BadgesPage } from '@/pages/badges';

export type View = 'ATTRACT' | 'TRACK_SELECT' | 'QUESTIONS' | 'FORGING' | 'REVEAL' | 'GALLERY' | 'DRAFTS' | 'MY_STORIES' | 'BADGES';

const LOADING_STEPS = [
  "INITIALIZING STORY ENGINE...",
  "ANALYZING NARRATIVE THREADS...",
  "WEAVING YOUR LEGEND...",
  "ADDING CINEMATIC POLISH...",
  "STORY COMPLETE!"
];

const AUTO_SAVE_INTERVAL = 10000;

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

  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [recoveryDraft, setRecoveryDraft] = useState<Draft | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentDraftIdRef = useRef<string | null>(null);
  
  const [inspireUsage, setInspireUsage] = useState<Record<number, number>>({});
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  
  const [forgeStatus, setForgeStatus] = useState<ForgeStatus>('running');
  const [forgeError, setForgeError] = useState<{ message: string; code?: string } | undefined>();
  const forgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  
  const [pendingBadges, setPendingBadges] = useState<Badge[]>([]);
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);

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

  const isCreating = view === 'QUESTIONS' || view === 'FORGING';
  const currentScene = currentQuestionIndex + 1;
  const totalScenes = activeTrack?.questions.length || 5;

  useEffect(() => {
    const savedStreak = localStorage.getItem('story_arcade_streak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak));
    }

    const allDrafts = getAllDrafts();
    setDrafts(allDrafts);

    if (allDrafts.length > 0) {
      setRecoveryDraft(allDrafts[0]);
    }

    cleanupOldDrafts();
  }, []);

  useEffect(() => {
    if (isCreating && activeTrack && Object.keys(answers).length > 0) {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setInterval(() => {
        performAutoSave();
      }, AUTO_SAVE_INTERVAL);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [isCreating, activeTrack, answers, currentQuestionIndex]);

  const performAutoSave = useCallback(() => {
    if (!activeTrack) return;

    const draftId = currentDraftIdRef.current || generateDraftId();
    const existingDraft = getDraft(draftId);
    const draft: Draft = {
      id: draftId,
      trackId: activeTrack.id,
      trackTitle: activeTrack.title,
      sceneNumber: currentQuestionIndex + 1,
      userInputs: answers,
      createdAt: existingDraft?.createdAt || new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
    };

    const success = saveDraft(draft);
    if (success) {
      currentDraftIdRef.current = draftId;
      setCurrentDraftId(draftId);
      setLastSavedAt(draft.lastSavedAt);
      setSaveFailed(false);
      setDrafts(getAllDrafts());
    } else {
      setSaveFailed(true);
    }
  }, [activeTrack, currentQuestionIndex, answers]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (pendingBadges.length > 0 && !currentBadge && !levelUpLevel) {
      const [nextBadge, ...remaining] = pendingBadges;
      setCurrentBadge(nextBadge);
      setPendingBadges(remaining);
    }
  }, [pendingBadges, currentBadge, levelUpLevel]);

  const handleBadgePopupClose = () => {
    setCurrentBadge(null);
  };

  const handleLevelUpClose = () => {
    setLevelUpLevel(null);
  };

  const handleTrackSelect = (track: Track) => {
    setActiveTrack(track);
    setAnswers({});
    setCurrentQuestionIndex(0);
    currentDraftIdRef.current = null;
    setCurrentDraftId(null);
    setLastSavedAt(null);
    setSaveFailed(false);
    setInspireUsage({});
    setHasTyped(false);
    setShowTooltip(false);
    setView('QUESTIONS');
  };

  const handleAnswerChange = (text: string) => {
    if (!activeTrack) return;
    const qId = activeTrack.questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [qId]: text }));
    setInputError(false);
    if (!hasTyped) {
      setHasTyped(true);
      setShowTooltip(false);
    }
  };
  
  const handleTextareaFocus = () => {
    if (!hasTyped) {
      setShowTooltip(true);
    }
  };
  
  const handleExampleClick = (example: string) => {
    if (!activeTrack) return;
    const qId = activeTrack.questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [qId]: example }));
    setInputError(false);
    setHasTyped(true);
  };
  
  const handleInspireClick = (suggestion: string) => {
    if (!activeTrack) return;
    const qId = activeTrack.questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [qId]: suggestion }));
    setInputError(false);
    setHasTyped(true);
  };
  
  const handleInspireUse = () => {
    const sceneNum = currentQuestionIndex + 1;
    setInspireUsage(prev => ({
      ...prev,
      [sceneNum]: (prev[sceneNum] || 0) + 1
    }));
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
      setHasTyped(false);
      setShowTooltip(false);
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
    
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    setView('FORGING');
    setForgeStatus('running');
    setForgeError(undefined);

    if (forgeTimeoutRef.current) {
      clearTimeout(forgeTimeoutRef.current);
    }

    forgeTimeoutRef.current = setTimeout(() => {
      setForgeStatus('timeout');
      console.error('[Story Forge] Timeout after 60 seconds', new Date().toISOString());
    }, 60000);

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
      shareableId: "",
      userId: null,
      posterUrl: null,
      posterStatus: "pending",
    };

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 65000);
      });

      const minDelayPromise = new Promise<void>(resolve => setTimeout(resolve, 8000));

      const apiPromise = (async () => {
        const response = await createStoryMutation.mutateAsync(storyData);
        return response.json();
      })();

      const [apiResponse] = await Promise.all([
        Promise.race([apiPromise, timeoutPromise]),
        minDelayPromise
      ]);
      
      if (forgeTimeoutRef.current) {
        clearTimeout(forgeTimeoutRef.current);
      }

      const newStory = apiResponse.story || apiResponse;
      const progression: ProgressionReward | null = apiResponse.progression || null;
      
      setGeneratedStory(newStory);
      setForgeStatus('success');
      
      if (progression) {
        queryClient.invalidateQueries({ queryKey: ['/api/progression'] });
        
        if (progression.leveledUp && progression.newLevel) {
          setLevelUpLevel(progression.newLevel);
        }
        
        if (progression.newBadges && progression.newBadges.length > 0) {
          setPendingBadges(progression.newBadges);
        }
      }

      const completedStory: CompletedStory = {
        id: `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: newStory.title,
        trackId: activeTrack.id,
        trackTitle: activeTrack.title,
        content: [newStory.p1, newStory.p2, newStory.p3],
        themes: newStory.themes || storyContent.themes,
        createdAt: new Date().toISOString(),
        userInputs: answers,
        insight: newStory.insight || storyContent.insight,
        logline: newStory.logline || storyContent.logline,
        author: newStory.author || 'You',
        neighborhood: newStory.neighborhood || 'Your Collection',
        shareableId: newStory.shareableId,
      };
      saveCompletedStory(completedStory);
      
      if (currentDraftIdRef.current) {
        deleteDraft(currentDraftIdRef.current);
        currentDraftIdRef.current = null;
        setCurrentDraftId(null);
        setDrafts(getAllDrafts());
      }

      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem('story_arcade_streak', newStreak.toString());

      setShowConfetti(true);
      arcadeSounds.storyComplete();
      setTimeout(() => {
        setShowConfetti(false);
        setView('REVEAL');
      }, 1500);
    } catch (error) {
      if (forgeTimeoutRef.current) {
        clearTimeout(forgeTimeoutRef.current);
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorCode = error instanceof Error && error.message === 'TIMEOUT' ? 'ERR_TIMEOUT' : 'ERR_API_FAILURE';
      
      console.error('[Story Forge] Error:', errorMessage, new Date().toISOString());
      
      if (errorMessage === 'TIMEOUT') {
        setForgeStatus('timeout');
      } else {
        setForgeError({ message: errorMessage, code: errorCode });
        setForgeStatus('error');
      }
    }
  };

  const handleForgeRetry = () => {
    generateStory();
  };

  const handleForgeCancel = () => {
    if (forgeTimeoutRef.current) {
      clearTimeout(forgeTimeoutRef.current);
    }
    setCurrentQuestionIndex(activeTrack ? activeTrack.questions.length - 1 : 4);
    setView('QUESTIONS');
  };

  const handleForgeSaveDraft = () => {
    performAutoSave();
    showToast('Draft saved successfully!');
    if (forgeTimeoutRef.current) {
      clearTimeout(forgeTimeoutRef.current);
    }
    setActiveTrack(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    currentDraftIdRef.current = null;
    setCurrentDraftId(null);
    setLastSavedAt(null);
    setSaveFailed(false);
    setDrafts(getAllDrafts());
    setView('TRACK_SELECT');
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
    currentDraftIdRef.current = null;
    setCurrentDraftId(null);
    setLastSavedAt(null);
    setSaveFailed(false);
    setView('TRACK_SELECT');
  };

  const getStoryShareUrl = () => {
    if (!generatedStory?.shareableId) return window.location.href;
    return `${window.location.origin}/story/${generatedStory.shareableId}`;
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = getStoryShareUrl();
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      showToast("Link copied to clipboard!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      showToast("Could not copy link");
    }
  };

  const handleShare = async () => {
    if (!generatedStory) return;
    const shareUrl = getStoryShareUrl();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: generatedStory.title,
          text: generatedStory.logline,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to copy link if share fails
      }
    }
    
    // Fallback: copy the shareable link
    handleCopyLink();
  };

  const handleLogoClickDuringCreation = () => {
    setShowUnsavedModal(true);
  };

  const handleSaveDraftAndLeave = () => {
    performAutoSave();
    setShowUnsavedModal(false);
    setActiveTrack(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    currentDraftIdRef.current = null;
    setCurrentDraftId(null);
    setLastSavedAt(null);
    setSaveFailed(false);
    setView('ATTRACT');
    showToast("Draft saved!");
  };

  const handleDiscardAndLeave = () => {
    if (currentDraftIdRef.current) {
      deleteDraft(currentDraftIdRef.current);
      setDrafts(getAllDrafts());
    }
    setShowUnsavedModal(false);
    setActiveTrack(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    currentDraftIdRef.current = null;
    setCurrentDraftId(null);
    setLastSavedAt(null);
    setSaveFailed(false);
    setView('ATTRACT');
  };

  const handleContinueCreating = () => {
    setShowUnsavedModal(false);
  };

  const handleResumeDraft = (draft: Draft) => {
    const track = TRACKS.find(t => t.id === draft.trackId);
    if (track) {
      setActiveTrack(track);
      setAnswers(draft.userInputs);
      setCurrentQuestionIndex(draft.sceneNumber - 1);
      currentDraftIdRef.current = draft.id;
      setCurrentDraftId(draft.id);
      setLastSavedAt(draft.lastSavedAt);
      setSaveFailed(false);
      setRecoveryDraft(null);
      setView('QUESTIONS');
    }
  };

  const handleDiscardRecoveryDraft = () => {
    if (recoveryDraft) {
      deleteDraft(recoveryDraft.id);
      setDrafts(getAllDrafts());
    }
    setRecoveryDraft(null);
  };

  const handleDeleteDraft = (draftId: string) => {
    deleteDraft(draftId);
    setDrafts(getAllDrafts());
    showToast("Draft deleted");
  };

  if (view === 'ATTRACT') {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans text-foreground relative">
        <SkipLink />
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        {recoveryDraft && (
          <DraftRecoveryBanner 
            draft={recoveryDraft}
            onResume={() => handleResumeDraft(recoveryDraft)}
            onDiscard={handleDiscardRecoveryDraft}
          />
        )}
        
        <main id="main-content" className="relative flex-1 flex flex-col justify-center items-center px-6 text-center pt-20 md:pt-0" role="main">
          <div className="z-10 max-w-5xl space-y-8 animate-fade-in">
            <button
              onClick={handleSecretDemoTrigger}
              className="inline-block px-4 py-1.5 border border-primary/20 rounded-full bg-primary/10 text-primary font-mono text-[10px] md:text-xs tracking-[0.2em] mb-4 backdrop-blur-sm hover-elevate cursor-pointer"
              data-testid="badge-version"
            >
              COMMUNITY MYTHOLOGY ENGINE v1.0
            </button>
            <h1 className="text-[28px] md:text-7xl lg:text-8xl font-display leading-[0.95] md:leading-[0.9] tracking-tight cursor-default">
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
                className="w-full md:w-auto bg-primary text-primary-foreground font-display uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                data-testid="button-create-story"
                aria-label="Start creating a new story"
              >
                Create Your Story <ChevronRight className="ml-2 w-5 h-5" aria-hidden="true" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => { setActiveTrack(TRACKS[0]); setAnswers({}); setCurrentQuestionIndex(0); setView('QUESTIONS'); }} 
                className="w-full md:w-auto font-mono uppercase tracking-widest"
                data-testid="button-quick-start"
                aria-label="Quick start with Origin Story track"
              >
                Quick Start: Origin
              </Button>
            </div>
            
            <div className="pt-12">
              <button 
                onClick={() => setView('GALLERY')}
                className="text-muted-foreground hover-elevate font-mono text-xs tracking-widest flex items-center gap-2 mx-auto"
                data-testid="link-explore-gallery"
              >
                <Eye className="w-4 h-4" /> EXPLORE {gallery.length} COMMUNITY STORIES
              </button>
            </div>
          </div>
        </main>
        
        <Toast message={toast} />
      </div>
    );
  }

  if (view === 'TRACK_SELECT') {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans relative">
        <SkipLink />
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        <main id="main-content" className="flex-1 p-6 md:p-12 pt-28 max-w-7xl mx-auto w-full" role="main">
          <div className="mb-10 md:mb-16">
            <h2 className="text-3xl md:text-5xl text-foreground font-display uppercase mb-3" data-testid="text-page-title">Select a Cartridge</h2>
            <p className="text-muted-foreground font-mono text-xs md:text-sm tracking-widest">CHOOSE THE THEME OF YOUR NARRATIVE</p>
          </div>

          {drafts.length > 0 && (
            <DraftsList 
              drafts={drafts}
              onContinue={handleResumeDraft}
              onDelete={handleDeleteDraft}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {TRACKS.map(track => (
              <TrackCard key={track.id} track={track} onSelect={handleTrackSelect} />
            ))}
          </div>
        </main>
        
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
        <SkipLink />
        <CRTOverlay />
        <Confetti active={showConfetti} />
        <Navbar 
          onViewChange={setView} 
          currentView={view} 
          streak={streak}
          isCreating={true}
          currentScene={currentScene}
          totalScenes={totalScenes}
          onLogoClick={handleLogoClickDuringCreation}
        />
        
        {showUnsavedModal && (
          <UnsavedStoryModal
            scenesCompleted={currentQuestionIndex + 1}
            onSaveDraft={handleSaveDraftAndLeave}
            onDiscard={handleDiscardAndLeave}
            onContinue={handleContinueCreating}
          />
        )}
        
        <main id="main-content" className="flex-1 flex flex-col pt-24 pb-32 px-6 md:p-12 md:pt-28 max-w-6xl mx-auto w-full" role="main">
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
              <h2 className="font-display text-xl md:text-4xl text-foreground leading-tight mb-4 md:mb-6" data-testid="text-question-prompt">
                {question.prompt}
              </h2>
              <p className="text-muted-foreground font-mono text-xs italic">{motivation}</p>
              
              <SceneExamples 
                sceneNumber={currentQuestionIndex + 1} 
                onExampleClick={handleExampleClick}
              />
            </div>

            <div className="lg:col-span-7 flex flex-col justify-center">
              <fieldset className="border-0 p-0 m-0">
                <legend className="sr-only">Scene {currentQuestionIndex + 1} of {activeTrack.questions.length}: {question.prompt}</legend>
                <div className={`relative group flex-1 ${inputError ? 'animate-shake' : ''}`}>
                  <TextareaTooltip 
                    isVisible={showTooltip} 
                    onDismiss={() => setShowTooltip(false)} 
                  />
                  <label htmlFor="scene-input" className="sr-only">
                    {question.prompt} (minimum 5 characters, maximum 300 characters, currently {charCount} characters)
                  </label>
                  <textarea
                    id="scene-input"
                    value={currentInput}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    onFocus={handleTextareaFocus}
                    placeholder={question.placeholder}
                    className="w-full h-full min-h-[120px] md:min-h-[240px] bg-card border border-card-border rounded-md p-4 md:p-6 text-[16px] md:text-lg leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all resize-none"
                    data-testid="input-answer"
                    aria-required="true"
                    aria-describedby="scene-helper"
                    aria-invalid={inputError}
                  />
                  <div id="scene-helper" className="sr-only" aria-live="polite">
                    {charCount} of 300 characters entered. Minimum 5 characters required.
                  </div>
                </div>
              </fieldset>
              
              <div className="mt-3">
                <CharacterProgress charCount={charCount} />
              </div>
              
              <InspireMe
                sceneNumber={currentQuestionIndex + 1}
                trackTitle={activeTrack.title}
                prompt={question.prompt}
                currentInput={currentInput}
                onSuggestionClick={handleInspireClick}
                usageCount={inspireUsage[currentQuestionIndex + 1] || 0}
                onUse={handleInspireUse}
              />

              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mt-6 gap-3 md:gap-4">
                <Button 
                  variant="outline" 
                  onClick={prevQuestion}
                  className="font-mono uppercase tracking-widest w-full md:w-auto order-2 md:order-1"
                  data-testid="button-prev"
                  aria-label={currentQuestionIndex === 0 ? 'Return to track selection' : `Return to scene ${currentQuestionIndex}`}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                  {currentQuestionIndex === 0 ? 'Back' : 'Prev'}
                </Button>
                <Button 
                  onClick={nextQuestion}
                  disabled={!isValid}
                  className="bg-primary text-primary-foreground font-display uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.5)] disabled:opacity-50 w-full md:w-auto order-1 md:order-2"
                  data-testid="button-next"
                  aria-label={currentQuestionIndex === activeTrack.questions.length - 1 
                    ? 'Complete story and generate narrative' 
                    : `Proceed to scene ${currentQuestionIndex + 2} (currently scene ${currentQuestionIndex + 1} of ${activeTrack.questions.length})`}
                  aria-disabled={!isValid}
                >
                  {currentQuestionIndex === activeTrack.questions.length - 1 ? 'Forge Story' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </Button>
              </div>

              <div className="mt-4 flex justify-end">
                <AutoSaveIndicator lastSavedAt={lastSavedAt} saveFailed={saveFailed} />
              </div>
            </div>
          </div>
        </main>
        
        <Toast message={toast} />
      </div>
    );
  }

  if (view === 'FORGING') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans relative">
        <SkipLink />
        <CRTOverlay />
        {showConfetti && <Confetti active={showConfetti} />}
        <Navbar 
          onViewChange={setView} 
          currentView={view} 
          streak={streak}
          isCreating={true}
          currentScene={totalScenes}
          totalScenes={totalScenes}
        />
        
        <main id="main-content" className="text-center px-6 animate-fade-in relative" data-testid="view-forging" role="main">
          {forgeStatus === 'running' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-32 h-32 relative">
                <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping" />
                <div className="absolute inset-2 border-4 border-primary/50 rounded-full animate-pulse" />
                <div className="absolute inset-4 border-4 border-primary rounded-full flex items-center justify-center">
                  <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                </div>
              </div>
            </div>
          )}
          
          <ForgeProgress
            status={forgeStatus}
            errorDetails={forgeError}
            onRetry={handleForgeRetry}
            onCancel={handleForgeCancel}
            onSaveDraft={handleForgeSaveDraft}
          />
        </main>
        
        <Toast message={toast} />
      </div>
    );
  }

  if (view === 'REVEAL' && generatedStory) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans relative">
        <SkipLink />
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        <main id="main-content" className="flex-1 p-6 md:p-12 pt-28 max-w-4xl mx-auto w-full" data-testid="view-reveal" role="main">
          <div className="mb-8 text-center animate-fade-in">
            <p className="text-primary font-mono text-xs tracking-widest mb-4">YOUR STORY IS READY</p>
            <h1 className="font-display text-3xl md:text-5xl text-foreground mb-4" data-testid="text-story-title">
              {generatedStory.title}
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              {generatedStory.trackTitle} • {generatedStory.neighborhood}
            </p>
          </div>
          
          <div className="grid md:grid-cols-[1fr_auto] gap-6 md:gap-8 mb-8">
            <div className="bg-card border border-card-border rounded-md p-6 md:p-10 animate-fade-in">
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
            
            <div className="animate-fade-in md:sticky md:top-24 self-start">
              <div className="text-center mb-4">
                <p className="text-xs font-mono text-muted-foreground tracking-widest">CINEMATIC POSTER</p>
              </div>
              <StoryPoster 
                storyId={generatedStory.id} 
                storyTitle={generatedStory.title}
                autoGenerate={true}
              />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center animate-fade-in flex-wrap">
            <Button 
              onClick={handleShare}
              className="bg-primary text-primary-foreground font-display uppercase tracking-widest w-full md:w-auto"
              data-testid="button-share-story"
            >
              <Share2 className="w-4 h-4 mr-2" aria-hidden="true" /> Share Story
            </Button>
            <Button 
              variant="outline"
              onClick={handleCopyLink}
              className="font-mono uppercase tracking-widest w-full md:w-auto"
              data-testid="button-copy-link"
            >
              {linkCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-500" aria-hidden="true" /> Copied!
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" aria-hidden="true" /> Copy Link
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setView('GALLERY')}
              className="font-mono uppercase tracking-widest w-full md:w-auto"
              data-testid="button-view-gallery"
            >
              <Eye className="w-4 h-4 mr-2" aria-hidden="true" /> View Gallery
            </Button>
            <Button 
              variant="outline"
              onClick={startOver}
              className="font-mono uppercase tracking-widest w-full md:w-auto"
              data-testid="button-create-another"
            >
              <Shuffle className="w-4 h-4 mr-2" aria-hidden="true" /> Create Another
            </Button>
          </div>
        </main>
        
        <Toast message={toast} />
        <LevelUpPopup newLevel={levelUpLevel} onClose={handleLevelUpClose} />
        <AchievementPopup 
          badge={currentBadge} 
          xpAwarded={currentBadge?.xpReward} 
          onClose={handleBadgePopupClose} 
        />
      </div>
    );
  }

  if (view === 'DRAFTS') {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans relative">
        <SkipLink />
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        <DraftsPage 
          onResumeDraft={handleResumeDraft}
          onBack={() => setView('ATTRACT')}
        />
        <Toast message={toast} />
      </div>
    );
  }

  if (view === 'MY_STORIES') {
    const handleViewCompletedStory = (story: CompletedStory) => {
      const storyForView: Story = {
        id: parseInt(story.id.replace(/\D/g, '').slice(-9)) || 0,
        title: story.title,
        trackId: story.trackId,
        trackTitle: story.trackTitle,
        author: story.author || 'You',
        neighborhood: story.neighborhood || 'Your Collection',
        insight: story.insight || '',
        logline: story.logline || story.content[0]?.slice(0, 100) + '...',
        p1: story.content[0] || '',
        p2: story.content[1] || '',
        p3: story.content[2] || '',
        themes: story.themes,
        timestamp: story.createdAt,
        answers: story.userInputs,
        shareableId: story.shareableId || '',
        userId: null,
        posterUrl: null,
        posterStatus: 'pending',
      };
      setGalleryModalStory(storyForView);
    };

    return (
      <div className="min-h-screen bg-background flex flex-col font-sans relative">
        <SkipLink />
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        <MyStoriesPage 
          onViewStory={handleViewCompletedStory}
          onBack={() => setView('ATTRACT')}
          showToast={showToast}
        />
        
        {galleryModalStory && (
          <StoryModal story={galleryModalStory} onClose={() => setGalleryModalStory(null)} />
        )}
        
        <Toast message={toast} />
      </div>
    );
  }

  if (view === 'BADGES') {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans relative">
        <SkipLink />
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        <BadgesPage onBack={() => setView('ATTRACT')} />
        <Toast message={toast} />
      </div>
    );
  }

  if (view === 'GALLERY') {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans relative">
        <SkipLink />
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        <main id="main-content" className="flex-1 p-6 md:p-12 pt-32 md:pt-36 max-w-7xl mx-auto w-full" data-testid="view-gallery" role="main">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
              {gallery.map((story) => (
                <StoryCard 
                  key={story.id} 
                  story={story} 
                  onView={(s) => setGalleryModalStory(s)}
                />
              ))}
            </div>
          )}
        </main>

        <BackToTop />

        {galleryModalStory && (
          <StoryModal story={galleryModalStory} onClose={() => setGalleryModalStory(null)} />
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
