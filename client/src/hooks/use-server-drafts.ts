import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessionId, getDraftHeaders } from '@/lib/sessionStorage';
import { useAuth } from '@/hooks/use-auth';
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

/**
 * Hook for managing server-backed drafts.
 *
 * For authenticated users: Drafts are owned by their userId (verified via session cookie).
 * For anonymous users: Drafts are owned by sessionId (sent via X-Session-ID header).
 *
 * This avoids leaking session IDs into URLs.
 */
export function useServerDrafts() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  // The "owner identifier" for cache keys - use stable value
  // For authenticated users, we use their id; for anonymous, the sessionId
  const ownerKey = isAuthenticated ? `user:${user?.id}` : `session:${getSessionId()}`;

  const { data: drafts = [], isLoading } = useQuery<Draft[]>({
    queryKey: ['/api/drafts', ownerKey],
    queryFn: async () => {
      const response = await fetch('/api/drafts', {
        method: 'GET',
        headers: getDraftHeaders(isAuthenticated),
        credentials: 'include', // Include session cookies for authenticated users
      });
      if (!response.ok) throw new Error('Failed to fetch drafts');
      return response.json();
    },
  });

  const createDraft = useMutation({
    mutationFn: async (input: CreateDraftInput): Promise<Draft> => {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: getDraftHeaders(isAuthenticated),
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create draft' }));
        throw new Error(error.error || 'Failed to create draft');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drafts', ownerKey] });
    },
  });

  const updateDraft = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateDraftInput }): Promise<Draft> => {
      const response = await fetch(`/api/drafts/${id}`, {
        method: 'PUT',
        headers: getDraftHeaders(isAuthenticated),
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update draft' }));
        throw new Error(error.error || 'Failed to update draft');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drafts', ownerKey] });
    },
  });

  const deleteDraft = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/drafts/${id}`, {
        method: 'DELETE',
        headers: getDraftHeaders(isAuthenticated),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to delete draft' }));
        throw new Error(error.error || 'Failed to delete draft');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drafts', ownerKey] });
    },
  });

  return {
    drafts,
    isLoading,
    createDraft,
    updateDraft,
    deleteDraft,
    // Expose for debugging/testing if needed
    ownerKey,
  };
}
