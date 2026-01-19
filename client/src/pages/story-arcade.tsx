import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, ArrowRight, Shuffle, Share2, Eye, RefreshCw, Copy, Check, Link, Twitter, Facebook, MessageCircle, Sparkles, Download } from 'lucide-react';
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
import { ArcadeCabinet } from '@/components/arcade/ArcadeCabinet';
import { CosmicMarquee } from '@/components/arcade/CosmicMarquee';
import { OrbitalRings } from '@/components/arcade/OrbitalRings';
import { HUDOverlay } from '@/components/arcade/HUDOverlay';
import { TVWallGallery } from '@/components/arcade/TVWallGallery';
import { AttractScreensaver } from '@/components/arcade/AttractScreensaver';
import { StarfieldBackground, StaticStarfield } from '@/components/arcade/StarfieldBackground';
import { FeaturedStorySpotlight } from '@/components/arcade/FeaturedStorySpotlight';
import { StoryGallery } from '@/components/arcade/StoryGallery';
import { StoryGalleryCard } from '@/components/arcade/StoryGalleryCard';
import { TypeformFlow } from '@/components/arcade/TypeformFlow';
import { EditStoryFlow } from '@/components/arcade/EditStoryFlow';
import { FeatureTour } from '@/components/arcade/FeatureTour';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { checkContentSafety, getFallbackStory } from '@/lib/contentSafety';
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
  const [showScreensaver, setShowScreensaver] = useState(false);
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  const [contentBlocked, setContentBlocked] = useState(false);
  const [editingStory, setEditingStory] = useState<CompletedStory | null>(null);
  const [showTour, setShowTour] = useState(true);

  const { data: apiGallery, isLoading: isLoadingGallery, isError: isGalleryError } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    retry: 1,
  });

  // Query for poster status to enable prominent download button
  const { data: posterStatus } = useQuery<{ posterUrl: string | null; status: string }>({
    queryKey: ['/api/stories', generatedStory?.id, 'poster'],
    enabled: !!generatedStory?.id && view === 'REVEAL',
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'generating') return 3000;
      return false;
    },
  });

  // Prioritize real user stories, supplement with seeds only if no real stories exist
  const realStories = apiGallery?.filter(s => s.userId !== null) || [];
  const hasRealStories = realStories.length > 0;
  
  // If we have real stories, show those first (sorted by newest), then optionally add seeds
  // If no real stories, show seeds as examples
  const gallery = hasRealStories 
    ? [...realStories].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : SEED_STORIES;

  const { isIdle, activate: resetIdleTimer } = useIdleTimer({
    timeout: 60000,
    onIdle: () => {
      if (view === 'ATTRACT' && gallery.length > 0) {
        setShowScreensaver(true);
      }
    },
    onActive: () => {
      setShowScreensaver(false);
    }
  });

  const handleDismissScreensaver = useCallback(() => {
    setShowScreensaver(false);
    resetIdleTimer();
  }, [resetIdleTimer]);

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
    
    const safety = checkContentSafety(text);
    if (!safety.isClean) {
      setContentWarning("Please keep content family-friendly for our community.");
      setContentBlocked(true);
      setAnswers(prev => ({ ...prev, [qId]: safety.sanitizedText }));
    } else {
      setContentWarning(null);
      setContentBlocked(false);
      setAnswers(prev => ({ ...prev, [qId]: text }));
    }
    
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

    try {
      const createTimeout = () => new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 45000);
      });

      const narrativeResponse = await Promise.race([
        fetch('/api/stories/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId: activeTrack.id,
            trackTitle: activeTrack.title,
            answers
          })
        }),
        createTimeout()
      ]);
      
      if (!narrativeResponse.ok) {
        throw new Error('Failed to generate story narrative');
      }
      
      const storyContent = await narrativeResponse.json();
      
      if (!storyContent.title || !storyContent.p1 || !storyContent.p2 || !storyContent.p3) {
        throw new Error('Invalid story content received');
      }

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

      const apiPromise = (async () => {
        const response = await createStoryMutation.mutateAsync(storyData);
        return response.json();
      })();

      const apiResponse = await Promise.race([apiPromise, createTimeout()]);
      
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
      console.log('[Story Forge] Using fallback story as circuit breaker');
      
      const fallback = getFallbackStory(activeTrack.id);
      const fallbackStory: Story = {
        id: Date.now(),
        shareableId: `fb_${Date.now().toString(36)}`,
        userId: null,
        trackId: activeTrack.id,
        trackTitle: activeTrack.title,
        author: "Community Archive",
        neighborhood: "Sanctuary Mode",
        title: fallback.title,
        themes: fallback.themes,
        insight: fallback.insight || "A story from the archive.",
        logline: fallback.logline,
        p1: fallback.p1,
        p2: fallback.p2,
        p3: fallback.p3,
        timestamp: new Date().toISOString(),
        answers: answers,
        posterUrl: null,
        posterStatus: "pending"
      };
      
      setGeneratedStory(fallbackStory);
      setForgeStatus('success');
      showToast("Story created in sanctuary mode");
      
      setShowConfetti(true);
      arcadeSounds.storyComplete();
      setTimeout(() => {
        setShowConfetti(false);
        setView('REVEAL');
      }, 1500);
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
  
  const handleTwitterShare = () => {
    if (!generatedStory) return;
    const shareUrl = getStoryShareUrl();
    const shareText = `"${generatedStory.title}" - ${generatedStory.logline}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };
  
  const handleFacebookShare = () => {
    const shareUrl = getStoryShareUrl();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };
  
  const handleWhatsAppShare = () => {
    if (!generatedStory) return;
    const shareUrl = getStoryShareUrl();
    const shareText = `"${generatedStory.title}" - ${generatedStory.logline}`;
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  const handlePosterDownload = () => {
    if (!posterStatus?.posterUrl || !generatedStory) return;
    
    const link = document.createElement("a");
    link.href = posterStatus.posterUrl;
    link.download = `${generatedStory.title.replace(/[^a-z0-9]/gi, "_")}_poster.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Poster downloaded!");
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
    const storiesWithPosters = gallery.filter(s => s.posterUrl && s.posterStatus === 'ready');
    const hasFeaturedStories = storiesWithPosters.length > 0;
    
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans text-foreground relative overflow-hidden">
        <SkipLink />
        <StarfieldBackground starCount={150} />
        <StaticStarfield />
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        {showTour && (
          <FeatureTour 
            onComplete={() => setShowTour(false)} 
          />
        )}
        
        {recoveryDraft && (
          <DraftRecoveryBanner 
            draft={recoveryDraft}
            onResume={() => handleResumeDraft(recoveryDraft)}
            onDiscard={handleDiscardRecoveryDraft}
          />
        )}
        
        <main id="main-content" className="relative flex-1 flex flex-col px-6 pt-24 md:pt-32" role="main">
          <div className="z-10 max-w-5xl mx-auto space-y-8 animate-fade-in text-center mb-12">
            <button
              onClick={handleSecretDemoTrigger}
              className="inline-block px-4 py-1.5 border border-primary/20 rounded-full bg-primary/10 text-primary font-mono text-[10px] md:text-xs tracking-[0.2em] mb-4 backdrop-blur-sm hover-elevate cursor-pointer"
              data-testid="badge-version"
            >
              COME SHARE YOUR WORLD
            </button>
            <h1 className="text-[28px] md:text-7xl lg:text-8xl font-display leading-[0.95] md:leading-[0.9] tracking-tight cursor-default">
              TURN YOUR STORY INTO <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_30px_rgba(34,211,238,0.4)] animate-pulse-glow">
                AN EXPERIENCE
              </span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
              Build a living archive of your world. Answer 5 questions and watch memories come to life as stylized artifacts.
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
          </div>
          
          {hasFeaturedStories && (
            <div className="w-full max-w-6xl mx-auto mb-16">
              <FeaturedStorySpotlight 
                stories={gallery} 
                onViewStory={(story) => setGalleryModalStory(story)}
              />
            </div>
          )}
          
          <div className="w-full max-w-7xl mx-auto pb-20">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl text-foreground mb-2">Community Gallery</h2>
              <p className="text-muted-foreground font-mono text-xs tracking-widest">EXPLORE {gallery.length} STORIES FROM OUR COMMUNITY</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {gallery.slice(0, 10).map((story, index) => (
                <StoryGalleryCard 
                  key={story.id}
                  story={story}
                  index={index}
                  onView={(s) => setGalleryModalStory(s)}
                />
              ))}
            </div>
            
            {gallery.length > 10 && (
              <div className="text-center mt-8">
                <Button 
                  variant="outline"
                  onClick={() => setView('GALLERY')}
                  className="font-mono uppercase tracking-widest"
                  data-testid="link-explore-gallery"
                >
                  <Eye className="w-4 h-4 mr-2" /> View All {gallery.length} Stories
                </Button>
              </div>
            )}
          </div>
        </main>
        
        <Toast message={toast} />
        
        {galleryModalStory && (
          <StoryModal 
            story={galleryModalStory} 
            onClose={() => setGalleryModalStory(null)} 
          />
        )}
        
        <AttractScreensaver 
          stories={gallery}
          isActive={showScreensaver}
          onDismiss={handleDismissScreensaver}
        />
      </div>
    );
  }

  if (view === 'TRACK_SELECT') {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans relative">
        <SkipLink />
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        <main id="main-content" className="flex-1 p-6 md:p-12 pt-32 md:pt-36 max-w-7xl mx-auto w-full" role="main">
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
    const handleTypeformAnswerChange = (questionId: string, value: string) => {
      setAnswers(prev => ({ ...prev, [questionId]: value }));
      setHasTyped(true);
    };

    const handleTypeformComplete = () => {
      setView('FORGING');
      setForgeStatus('running');
      generateStory();
    };

    const handleTypeformBack = () => {
      setView('TRACK_SELECT');
    };

    const handleQuestionIndexChange = (index: number) => {
      setCurrentQuestionIndex(index);
    };

    const handleContentWarningChange = (warning: string | null) => {
      setContentWarning(warning);
      setContentBlocked(warning !== null);
    };

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
        
        <div className="flex-1 pt-16">
          <TypeformFlow
            track={activeTrack}
            answers={answers}
            onAnswerChange={handleTypeformAnswerChange}
            onComplete={handleTypeformComplete}
            onBack={handleTypeformBack}
            inspireUsage={inspireUsage}
            onInspireUse={handleInspireUse}
            onInspireClick={handleInspireClick}
            currentQuestionIndex={currentQuestionIndex}
            onQuestionIndexChange={handleQuestionIndexChange}
            onContentWarningChange={handleContentWarningChange}
          />
        </div>

        <div className="fixed bottom-4 right-4 z-30">
          <AutoSaveIndicator lastSavedAt={lastSavedAt} saveFailed={saveFailed} />
        </div>
        
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
          <OrbitalRings variant={forgeStatus === 'running' ? 'intense' : 'subtle'} showCoordinates={true} animate={forgeStatus === 'running'}>
            <HUDOverlay showGrid={true} variant="full" label="FORGE">
              <div className="py-12 px-4">
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
              </div>
            </HUDOverlay>
          </OrbitalRings>
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
        
        <main id="main-content" className="flex-1 p-6 md:p-12 pt-32 md:pt-36 max-w-5xl mx-auto w-full" data-testid="view-reveal" role="main">
          <ArcadeCabinet showMarquee={false} variant="compact">
            <div className="mb-8 text-center animate-fade-in">
              <CosmicMarquee title="YOUR STORY IS READY" variant="minimal" />
              <h1 className="font-display text-3xl md:text-5xl text-foreground my-4" data-testid="text-story-title">
                {generatedStory.title}
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                {generatedStory.trackTitle} • {generatedStory.neighborhood}
              </p>
            </div>
            
            <HUDOverlay showGrid={false} variant="corners" showTechReadouts={false}>
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
                    trackId={generatedStory.trackId}
                    autoGenerate={true}
                  />
                  
                  {/* Poster Footer - Download, Branding, Tags */}
                  <div className="mt-4 space-y-3 max-w-xs mx-auto">
                    {/* Prominent Download Button */}
                    <Button
                      onClick={handlePosterDownload}
                      disabled={posterStatus?.status !== 'ready' || !posterStatus?.posterUrl}
                      className="w-full font-mono text-sm gap-2"
                      data-testid="button-download-poster-prominent"
                    >
                      <Download className="w-4 h-4" />
                      {posterStatus?.status === 'generating' ? 'Creating Poster...' : 
                       posterStatus?.status === 'ready' ? 'Download Poster' : 'Poster Pending'}
                    </Button>
                    
                    {/* Track & Neighborhood Tags */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono tracking-wide border ${
                        generatedStory.trackId === 'origin' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' :
                        generatedStory.trackId === 'future' ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' :
                        'border-purple-500/50 bg-purple-500/10 text-purple-400'
                      }`}>
                        {generatedStory.trackTitle}
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {generatedStory.neighborhood}
                      </span>
                    </div>
                    
                    {/* Created with Story Arcade Badge */}
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
                      <Sparkles className="w-3 h-3" />
                      <span className="font-mono tracking-wide">Created with Story Arcade</span>
                    </div>
                  </div>
                </div>
              </div>
            </HUDOverlay>
          
            <div className="animate-fade-in space-y-4">
            {/* Social share buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <p className="w-full text-center text-muted-foreground font-mono text-xs tracking-widest mb-2">SHARE YOUR STORY</p>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="font-mono text-xs gap-2"
                data-testid="button-copy-link"
              >
                {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleTwitterShare}
                className="font-mono text-xs gap-2"
                data-testid="button-share-twitter"
              >
                <Twitter className="w-4 h-4" /> Twitter
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleFacebookShare}
                className="font-mono text-xs gap-2"
                data-testid="button-share-facebook"
              >
                <Facebook className="w-4 h-4" /> Facebook
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleWhatsAppShare}
                className="font-mono text-xs gap-2"
                data-testid="button-share-whatsapp"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
              <Button 
                size="sm"
                onClick={handleShare}
                className="font-mono text-xs gap-2"
                data-testid="button-share-story"
              >
                <Share2 className="w-4 h-4" /> Share via Device
              </Button>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col md:flex-row gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => setView('GALLERY')}
                className="font-mono uppercase tracking-widest w-full md:w-auto"
                data-testid="button-view-gallery"
              >
                <Eye className="w-4 h-4 mr-2" aria-hidden="true" /> View Gallery
              </Button>
              <Button 
                onClick={startOver}
                className="bg-primary text-primary-foreground font-display uppercase tracking-widest w-full md:w-auto"
                data-testid="button-create-another"
              >
                <Shuffle className="w-4 h-4 mr-2" aria-hidden="true" /> Create Another
              </Button>
            </div>
            </div>
          </ArcadeCabinet>
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

    const handleEditStory = (story: CompletedStory) => {
      setEditingStory(story);
    };

    const handleEditSave = (updatedStory: Story) => {
      setEditingStory(null);
      showToast('Story updated successfully!');
    };

    return (
      <div className="min-h-screen bg-background flex flex-col font-sans relative">
        <SkipLink />
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        <MyStoriesPage 
          onViewStory={handleViewCompletedStory}
          onEditStory={handleEditStory}
          onBack={() => setView('ATTRACT')}
          showToast={showToast}
        />
        
        {galleryModalStory && (
          <StoryModal story={galleryModalStory} onClose={() => setGalleryModalStory(null)} />
        )}

        {editingStory && (
          <EditStoryFlow
            story={editingStory}
            onClose={() => setEditingStory(null)}
            onSave={handleEditSave}
            showToast={showToast}
          />
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
      <div className="min-h-screen bg-background flex flex-col font-sans relative overflow-hidden">
        <SkipLink />
        <StaticStarfield />
        <CRTOverlay />
        <Navbar onViewChange={setView} currentView={view} streak={streak} />
        
        <main id="main-content" className="flex-1 p-6 md:p-12 pt-32 md:pt-36 max-w-7xl mx-auto w-full" data-testid="view-gallery" role="main">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-5xl text-foreground font-display uppercase mb-3">Community Gallery</h2>
              <p className="text-muted-foreground font-mono text-xs md:text-sm tracking-widest">{gallery.length} STORIES IN THE ARCHIVE</p>
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
            <StoryGallery 
              stories={gallery}
              title=""
              subtitle=""
              showFilters={true}
            />
          )}
        </main>

        <BackToTop />
        
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
