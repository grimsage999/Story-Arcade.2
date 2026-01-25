import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './use-auth';
import type { Story } from '@shared/schema';

// Query keys for consistent cache management
export const storyKeys = {
  all: ['/api/stories'] as const,
  my: ['/api/stories/my'] as const,
  detail: (id: number) => ['/api/stories', id] as const,
  shared: (shareableId: string) => ['/api/stories/share', shareableId] as const,
};

interface GenerateNarrativeInput {
  trackId: string;
  trackTitle: string;
  answers: Record<string, string>;
}

interface GeneratedNarrative {
  title: string;
  logline: string;
  themes: string[];
  insight: string;
  p1: string;
  p2: string;
  p3: string;
}

interface CreateStoryInput extends GeneratedNarrative {
  trackId: string;
  trackTitle: string;
  author: string;
  neighborhood: string;
  timestamp: string;
  answers: Record<string, string>;
  posterUrl: string | null;
  posterStatus: string;
}

interface CreateStoryResponse {
  story: Story;
  progression?: {
    xpAwarded: number;
    newBadges: Array<{ id: string; name: string }>;
    leveledUp: boolean;
    newLevel: number;
    newStreak: number;
  };
}

interface UpdateStoryInput {
  title?: string;
  logline?: string;
  themes?: string[];
  insight?: string;
  p1?: string;
  p2?: string;
  p3?: string;
  answers?: Record<string, string>;
  posterUrl?: string | null;
  posterStatus?: string;
}

/**
 * Hook for all story-related API operations.
 * Centralizes query keys, cache invalidation, and error handling.
 */
export function useStories() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Fetch all public stories
  const allStoriesQuery = useQuery<Story[]>({
    queryKey: storyKeys.all,
  });

  // Fetch current user's stories (requires auth)
  const myStoriesQuery = useQuery<Story[]>({
    queryKey: storyKeys.my,
    enabled: isAuthenticated,
  });

  // Generate AI narrative from user answers
  const generateNarrative = useMutation({
    mutationFn: async (input: GenerateNarrativeInput): Promise<GeneratedNarrative> => {
      const response = await apiRequest('POST', '/api/stories/generate', input);
      const data = await response.json();

      // Validate response structure
      if (!data.title || !data.p1 || !data.p2 || !data.p3) {
        throw new Error('Invalid narrative response from server');
      }

      return data;
    },
  });

  // Create a new story
  const createStory = useMutation({
    mutationFn: async (story: CreateStoryInput): Promise<CreateStoryResponse> => {
      const response = await apiRequest('POST', '/api/stories', story);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
      queryClient.invalidateQueries({ queryKey: storyKeys.my });
    },
  });

  // Update an existing story
  const updateStory = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateStoryInput }): Promise<Story> => {
      const response = await apiRequest('PUT', `/api/stories/${id}`, updates);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
      queryClient.invalidateQueries({ queryKey: storyKeys.my });
      queryClient.invalidateQueries({ queryKey: storyKeys.detail(id) });
    },
  });

  // Delete a story
  const deleteStory = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiRequest('DELETE', `/api/stories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyKeys.all });
      queryClient.invalidateQueries({ queryKey: storyKeys.my });
    },
  });

  return {
    // Queries
    stories: allStoriesQuery.data ?? [],
    myStories: myStoriesQuery.data ?? [],
    isLoadingStories: allStoriesQuery.isLoading,
    isLoadingMyStories: myStoriesQuery.isLoading,
    refetchStories: allStoriesQuery.refetch,
    refetchMyStories: myStoriesQuery.refetch,

    // Mutations
    generateNarrative,
    createStory,
    updateStory,
    deleteStory,
  };
}

/**
 * Hook to fetch a single story by shareable ID (for public story pages)
 */
export function useStoryByShareableId(shareableId: string | undefined) {
  return useQuery<Story>({
    queryKey: storyKeys.shared(shareableId ?? ''),
    queryFn: async () => {
      const response = await fetch(`/api/stories/share/${shareableId}`);
      if (!response.ok) {
        throw new Error('Story not found');
      }
      return response.json();
    },
    enabled: !!shareableId,
  });
}

/**
 * Hook to fetch a single story by numeric ID
 */
export function useStoryById(id: number | undefined) {
  return useQuery<Story>({
    queryKey: storyKeys.detail(id ?? 0),
    queryFn: async () => {
      const response = await fetch(`/api/stories/${id}`);
      if (!response.ok) {
        throw new Error('Story not found');
      }
      return response.json();
    },
    enabled: !!id,
  });
}
