import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { getSessionId } from '@/lib/sessionStorage';
import type { Draft } from '@shared/schema';

interface CreateDraftInput {
  trackId: string;
  trackTitle: string;
  answers: Record<string, string>;
  currentQuestionIndex: number;
}

interface UpdateDraftInput {
  answers?: Record<string, string>;
  currentQuestionIndex?: number;
}

export function useServerDrafts() {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  const { data: drafts = [], isLoading } = useQuery<Draft[]>({
    queryKey: ['/api/drafts', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/drafts?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch drafts');
      return response.json();
    },
  });

  const createDraft = useMutation({
    mutationFn: async (input: CreateDraftInput): Promise<Draft> => {
      const response = await apiRequest('POST', '/api/drafts', {
        sessionId,
        ...input,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drafts', sessionId] });
    },
  });

  const updateDraft = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateDraftInput }): Promise<Draft> => {
      const response = await apiRequest('PUT', `/api/drafts/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drafts', sessionId] });
    },
  });

  const deleteDraft = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiRequest('DELETE', `/api/drafts/${id}?sessionId=${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drafts', sessionId] });
    },
  });

  return {
    drafts,
    isLoading,
    createDraft,
    updateDraft,
    deleteDraft,
    sessionId,
  };
}
