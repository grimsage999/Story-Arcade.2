export interface Draft {
  id: string;
  trackId: string;
  trackTitle: string;
  sceneNumber: number;
  userInputs: Record<string, string>;
  createdAt: string;
  lastSavedAt: string;
  customTitle?: string;
}

export interface CompletedStory {
  id: string;
  title: string;
  trackId: string;
  trackTitle: string;
  content: string[];
  themes: string[];
  createdAt: string;
  userInputs: Record<string, string>;
}

const DRAFT_PREFIX = 'storyArcade_draft_';
const COMPLETED_STORIES_KEY = 'storyArcade_completed';
const SETTINGS_KEY = 'storyArcade_settings';
const MAX_DRAFTS = 10;
const MAX_COMPLETED_STORIES = 100;
const DRAFT_EXPIRY_DAYS = 30;

export function generateDraftId(): string {
  return `${DRAFT_PREFIX}${Date.now()}`;
}

export function getAllDrafts(): Draft[] {
  const drafts: Draft[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(DRAFT_PREFIX)) {
      try {
        const draft = JSON.parse(localStorage.getItem(key) || '');
        drafts.push(draft);
      } catch {
        // Invalid draft, skip
      }
    }
  }
  return drafts.sort((a, b) => 
    new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime()
  );
}

export function getDraft(id: string): Draft | null {
  try {
    const data = localStorage.getItem(id);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft): boolean {
  try {
    // Enforce max drafts limit
    const allDrafts = getAllDrafts();
    const existingIndex = allDrafts.findIndex(d => d.id === draft.id);
    
    if (existingIndex === -1 && allDrafts.length >= MAX_DRAFTS) {
      // Delete oldest draft
      const oldest = allDrafts[allDrafts.length - 1];
      deleteDraft(oldest.id);
    }
    
    draft.lastSavedAt = new Date().toISOString();
    localStorage.setItem(draft.id, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function deleteDraft(id: string): void {
  localStorage.removeItem(id);
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function getDraftTitle(draft: Draft): string {
  if (draft.customTitle) {
    return draft.customTitle;
  }
  const firstAnswer = Object.values(draft.userInputs)[0];
  if (firstAnswer && firstAnswer.length > 0) {
    return firstAnswer.slice(0, 30) + (firstAnswer.length > 30 ? '...' : '');
  }
  return `${draft.trackTitle} Draft`;
}

export function renameDraft(id: string, newTitle: string): boolean {
  try {
    const draft = getDraft(id);
    if (draft) {
      draft.customTitle = newTitle;
      localStorage.setItem(id, JSON.stringify(draft));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function duplicateDraft(id: string): Draft | null {
  try {
    const draft = getDraft(id);
    if (draft) {
      const newDraft: Draft = {
        ...draft,
        id: generateDraftId(),
        createdAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        customTitle: draft.customTitle ? `${draft.customTitle} (Copy)` : undefined,
      };
      saveDraft(newDraft);
      return newDraft;
    }
    return null;
  } catch {
    return null;
  }
}

export function cleanupOldDrafts(): number {
  const now = new Date();
  const drafts = getAllDrafts();
  let deletedCount = 0;
  
  for (const draft of drafts) {
    const createdDate = new Date(draft.createdAt);
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > DRAFT_EXPIRY_DAYS) {
      deleteDraft(draft.id);
      deletedCount++;
    }
  }
  
  return deletedCount;
}

export function getCompletedStories(): CompletedStory[] {
  try {
    const data = localStorage.getItem(COMPLETED_STORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCompletedStory(story: CompletedStory): boolean {
  try {
    const stories = getCompletedStories();
    const existingIndex = stories.findIndex(s => s.id === story.id);
    
    if (existingIndex >= 0) {
      stories[existingIndex] = story;
    } else {
      if (stories.length >= MAX_COMPLETED_STORIES) {
        stories.pop();
      }
      stories.unshift(story);
    }
    
    localStorage.setItem(COMPLETED_STORIES_KEY, JSON.stringify(stories));
    return true;
  } catch {
    return false;
  }
}

export function deleteCompletedStory(id: string): boolean {
  try {
    const stories = getCompletedStories();
    const filtered = stories.filter(s => s.id !== id);
    localStorage.setItem(COMPLETED_STORIES_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

export function getStorageUsage(): { used: number; total: number; percentage: number } {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('storyArcade_')) {
      total += (localStorage.getItem(key) || '').length;
    }
  }
  const maxBytes = 5 * 1024 * 1024;
  return {
    used: total,
    total: maxBytes,
    percentage: (total / maxBytes) * 100
  };
}

export function exportStoryAsText(story: CompletedStory): string {
  const lines = [
    `=== ${story.title} ===`,
    `Track: ${story.trackTitle}`,
    `Created: ${new Date(story.createdAt).toLocaleDateString()}`,
    `Themes: ${story.themes.join(', ')}`,
    '',
    '--- Story ---',
    '',
    ...story.content,
    '',
    `Story ID: ${story.id}`
  ];
  return lines.join('\n');
}
