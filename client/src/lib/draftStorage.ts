export interface Draft {
  id: string;
  trackId: string;
  trackTitle: string;
  sceneNumber: number;
  userInputs: Record<string, string>;
  createdAt: string;
  lastSavedAt: string;
}

const DRAFT_PREFIX = 'storyArcade_draft_';
const MAX_DRAFTS = 5;

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
  const firstAnswer = Object.values(draft.userInputs)[0];
  if (firstAnswer && firstAnswer.length > 0) {
    return firstAnswer.slice(0, 30) + (firstAnswer.length > 30 ? '...' : '');
  }
  return `${draft.trackTitle} Draft`;
}
