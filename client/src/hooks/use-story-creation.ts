import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Track, Story } from '@shared/schema';
import {
  type Draft,
  getAllDrafts,
  getDraft,
  saveDraft,
  deleteDraft,
  generateDraftId,
  cleanupOldDrafts
} from '@/lib/draftStorage';
import { TRACKS } from '@/lib/tracks';

export type View = 'ATTRACT' | 'TRACK_SELECT' | 'QUESTIONS' | 'FORGING' | 'CELEBRATION' | 'REVEAL' | 'GALLERY' | 'DRAFTS' | 'MY_STORIES' | 'BADGES';

const AUTO_SAVE_INTERVAL = 10000;

interface UseStoryCreationReturn {
  // Core state
  view: View;
  setView: (view: View) => void;
  activeTrack: Track | null;
  setActiveTrack: (track: Track | null) => void;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  generatedStory: Story | null;
  setGeneratedStory: (story: Story | null) => void;

  // Draft state
  currentDraftId: string | null;
  lastSavedAt: string | null;
  saveFailed: boolean;
  drafts: Draft[];
  recoveryDraft: Draft | null;

  // Computed values
  isCreating: boolean;
  currentScene: number;
  totalScenes: number;

  // Actions
  handleTrackSelect: (track: Track) => void;
  handleAnswerChange: (questionId: string, text: string) => void;
  nextQuestion: () => { canProceed: boolean; shouldGenerate: boolean };
  prevQuestion: () => void;
  performAutoSave: () => void;
  startOver: () => void;

  // Draft actions
  handleResumeDraft: (draft: Draft) => void;
  handleDiscardRecoveryDraft: () => void;
  handleDeleteDraft: (draftId: string) => void;
  handleSaveDraftAndLeave: () => void;
  handleDiscardAndLeave: () => void;
  clearCurrentDraft: () => void;
}

export function useStoryCreation(): UseStoryCreationReturn {
  // Core state
  const [view, setView] = useState<View>('ATTRACT');
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [generatedStory, setGeneratedStory] = useState<Story | null>(null);

  // Draft state
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [recoveryDraft, setRecoveryDraft] = useState<Draft | null>(null);

  // Refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentDraftIdRef = useRef<string | null>(null);

  // Computed values
  const isCreating = view === 'QUESTIONS' || view === 'FORGING';
  const currentScene = currentQuestionIndex + 1;
  const totalScenes = activeTrack?.questions.length || 5;

  // Load drafts on mount
  useEffect(() => {
    const allDrafts = getAllDrafts();
    setDrafts(allDrafts);

    if (allDrafts.length > 0) {
      setRecoveryDraft(allDrafts[0]);
    }

    cleanupOldDrafts();
  }, []);

  // Auto-save effect
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

  const handleTrackSelect = useCallback((track: Track) => {
    setActiveTrack(track);
    setAnswers({});
    setCurrentQuestionIndex(0);
    currentDraftIdRef.current = null;
    setCurrentDraftId(null);
    setLastSavedAt(null);
    setSaveFailed(false);
    setView('QUESTIONS');
  }, []);

  const handleAnswerChange = useCallback((questionId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  }, []);

  const nextQuestion = useCallback((): { canProceed: boolean; shouldGenerate: boolean } => {
    if (!activeTrack) return { canProceed: false, shouldGenerate: false };

    const currentQ = activeTrack.questions[currentQuestionIndex];
    if ((answers[currentQ.id] || '').length < 5) {
      return { canProceed: false, shouldGenerate: false };
    }

    if (currentQuestionIndex < activeTrack.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return { canProceed: true, shouldGenerate: false };
    } else {
      return { canProceed: true, shouldGenerate: true };
    }
  }, [activeTrack, currentQuestionIndex, answers]);

  const prevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      setView('TRACK_SELECT');
    }
  }, [currentQuestionIndex]);

  const startOver = useCallback(() => {
    setActiveTrack(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setGeneratedStory(null);
    currentDraftIdRef.current = null;
    setCurrentDraftId(null);
    setLastSavedAt(null);
    setSaveFailed(false);
    setView('TRACK_SELECT');
  }, []);

  const handleResumeDraft = useCallback((draft: Draft) => {
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
  }, []);

  const handleDiscardRecoveryDraft = useCallback(() => {
    if (recoveryDraft) {
      deleteDraft(recoveryDraft.id);
      setDrafts(getAllDrafts());
    }
    setRecoveryDraft(null);
  }, [recoveryDraft]);

  const handleDeleteDraft = useCallback((draftId: string) => {
    deleteDraft(draftId);
    setDrafts(getAllDrafts());
  }, []);

  const handleSaveDraftAndLeave = useCallback(() => {
    performAutoSave();
    setActiveTrack(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    currentDraftIdRef.current = null;
    setCurrentDraftId(null);
    setLastSavedAt(null);
    setSaveFailed(false);
    setView('ATTRACT');
  }, [performAutoSave]);

  const handleDiscardAndLeave = useCallback(() => {
    if (currentDraftIdRef.current) {
      deleteDraft(currentDraftIdRef.current);
      setDrafts(getAllDrafts());
    }
    setActiveTrack(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    currentDraftIdRef.current = null;
    setCurrentDraftId(null);
    setLastSavedAt(null);
    setSaveFailed(false);
    setView('ATTRACT');
  }, []);

  const clearCurrentDraft = useCallback(() => {
    if (currentDraftIdRef.current) {
      deleteDraft(currentDraftIdRef.current);
      currentDraftIdRef.current = null;
      setCurrentDraftId(null);
      setDrafts(getAllDrafts());
    }
  }, []);

  return {
    // Core state
    view,
    setView,
    activeTrack,
    setActiveTrack,
    answers,
    setAnswers,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    generatedStory,
    setGeneratedStory,

    // Draft state
    currentDraftId,
    lastSavedAt,
    saveFailed,
    drafts,
    recoveryDraft,

    // Computed values
    isCreating,
    currentScene,
    totalScenes,

    // Actions
    handleTrackSelect,
    handleAnswerChange,
    nextQuestion,
    prevQuestion,
    performAutoSave,
    startOver,

    // Draft actions
    handleResumeDraft,
    handleDiscardRecoveryDraft,
    handleDeleteDraft,
    handleSaveDraftAndLeave,
    handleDiscardAndLeave,
    clearCurrentDraft,
  };
}
