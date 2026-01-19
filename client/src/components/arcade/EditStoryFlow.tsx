import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, RefreshCw, Save, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { TRACKS } from '@/lib/tracks';
import type { CompletedStory } from '@/lib/draftStorage';
import type { Story } from '@shared/schema';

interface EditStoryFlowProps {
  story: CompletedStory;
  onClose: () => void;
  onSave: (updatedStory: Story) => void;
  showToast?: (message: string) => void;
}

interface NarrativeResponse {
  title: string;
  logline: string;
  themes: string[];
  insight: string;
  p1: string;
  p2: string;
  p3: string;
}

export function EditStoryFlow({ story, onClose, onSave, showToast }: EditStoryFlowProps) {
  const queryClient = useQueryClient();
  const track = TRACKS.find(t => t.id === story.trackId);
  const questions = track?.questions || [];
  
  const [answers, setAnswers] = useState<Record<string, string>>(story.userInputs || {});
  const [isSaving, setIsSaving] = useState(false);

  const handleAnswerChange = (questionId: string, value: string) => {
    if (value.length <= 300) {
      setAnswers(prev => ({ ...prev, [questionId]: value }));
    }
  };

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/stories/generate', {
        trackId: story.trackId,
        trackTitle: story.trackTitle,
        answers
      });
      return response.json() as Promise<NarrativeResponse>;
    },
    onSuccess: async (narrative) => {
      if (!story.dbId) return;
      
      setIsSaving(true);
      try {
        const updateResponse = await apiRequest('PUT', `/api/stories/${story.dbId}`, {
          title: narrative.title,
          logline: narrative.logline,
          themes: narrative.themes,
          insight: narrative.insight,
          p1: narrative.p1,
          p2: narrative.p2,
          p3: narrative.p3,
          answers,
          posterUrl: null,
          posterStatus: 'pending'
        });
        const updatedStory = await updateResponse.json() as Story;
        
        queryClient.invalidateQueries({ queryKey: ['/api/stories/my'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
        
        showToast?.('Story regenerated successfully!');
        onSave(updatedStory);
      } catch (error) {
        showToast?.('Failed to save regenerated story');
      } finally {
        setIsSaving(false);
      }
    },
    onError: () => {
      showToast?.('Failed to regenerate story');
    }
  });

  const handleRegenerate = useCallback(() => {
    regenerateMutation.mutate();
  }, [regenerateMutation]);

  const hasChanges = JSON.stringify(answers) !== JSON.stringify(story.userInputs);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
      data-testid="edit-story-flow"
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={onClose}
            className="gap-2"
            data-testid="button-close-edit"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Button>
          <h1 className="text-xl font-display text-foreground">Edit Story</h1>
          <div className="w-20" />
        </div>

        <div className="mb-6 p-4 bg-card border border-card-border rounded-md">
          <h2 className="text-lg font-display text-foreground mb-1">{story.title}</h2>
          <p className="text-muted-foreground text-sm">{story.trackTitle}</p>
        </div>

        <div className="space-y-6 mb-8">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <label className="block">
                <span className="text-sm font-mono text-primary uppercase tracking-widest">
                  Question {index + 1}
                </span>
                <p className="text-foreground font-medium mt-1 mb-2">{question.prompt}</p>
                <Textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  className="min-h-[100px] resize-none"
                  data-testid={`input-answer-${index}`}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{question.guidance}</span>
                  <span className="text-xs text-muted-foreground">
                    {(answers[question.id] || '').length}/300
                  </span>
                </div>
              </label>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="gap-2"
            data-testid="button-cancel"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          
          <Button
            onClick={handleRegenerate}
            disabled={!hasChanges || regenerateMutation.isPending || isSaving}
            className="gap-2 bg-primary text-primary-foreground"
            data-testid="button-regenerate"
          >
            {regenerateMutation.isPending || isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isSaving ? 'Saving...' : 'Regenerating...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Regenerate Story
              </>
            )}
          </Button>
        </div>

        {!hasChanges && (
          <p className="text-center text-muted-foreground text-sm mt-4">
            Make changes to your answers to regenerate the story
          </p>
        )}
      </div>
    </motion.div>
  );
}
