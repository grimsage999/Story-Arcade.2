import { useState, useEffect } from 'react';
import { FileText, Play, Trash2, Copy, Pencil, Check, X, ArrowUpDown, Clock, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StaticStarfield } from '@/components/arcade/StarfieldBackground';
import { 
  getAllDrafts, 
  deleteDraft, 
  renameDraft, 
  duplicateDraft, 
  getDraftTitle, 
  formatTimeAgo,
  type Draft 
} from '@/lib/draftStorage';

interface DraftsPageProps {
  onResumeDraft: (draft: Draft) => void;
  onBack: () => void;
}

type SortOption = 'recent' | 'oldest' | 'alphabetical';

export function DraftsPage({ onResumeDraft, onBack }: DraftsPageProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    setDrafts(getAllDrafts());
  };

  const sortedDrafts = [...drafts].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime();
      case 'oldest':
        return new Date(a.lastSavedAt).getTime() - new Date(b.lastSavedAt).getTime();
      case 'alphabetical':
        return getDraftTitle(a).localeCompare(getDraftTitle(b));
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedDrafts.length / itemsPerPage);
  const paginatedDrafts = sortedDrafts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (id: string) => {
    deleteDraft(id);
    loadDrafts();
  };

  const handleDuplicate = (id: string) => {
    duplicateDraft(id);
    loadDrafts();
  };

  const startEditing = (draft: Draft) => {
    setEditingId(draft.id);
    setEditTitle(getDraftTitle(draft));
  };

  const saveTitle = (id: string) => {
    if (editTitle.trim()) {
      renameDraft(id, editTitle.trim());
      loadDrafts();
    }
    setEditingId(null);
    setEditTitle('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div className="relative min-h-screen">
      <StaticStarfield />
      <main 
        id="main-content" 
        className="relative max-w-4xl mx-auto p-6 pt-24" 
        data-testid="page-drafts"
        aria-label="Your Drafts page"
      >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-display text-foreground mb-2" data-testid="text-page-title">
            Your Drafts
          </h1>
          <p className="text-muted-foreground font-mono text-xs tracking-widest" role="status" aria-live="polite">
            {drafts.length} DRAFT{drafts.length !== 1 ? 'S' : ''} SAVED
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px]" data-testid="select-sort" aria-label="Sort drafts by">
              <ArrowUpDown className="w-4 h-4 mr-2" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                <span className="flex items-center gap-2">
                  <SortDesc className="w-3 h-3" /> Most Recent
                </span>
              </SelectItem>
              <SelectItem value="oldest">
                <span className="flex items-center gap-2">
                  <SortAsc className="w-3 h-3" /> Oldest First
                </span>
              </SelectItem>
              <SelectItem value="alphabetical">
                <span className="flex items-center gap-2">
                  <SortAsc className="w-3 h-3" /> Alphabetical
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-16 bg-card border border-card-border rounded-md">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm mb-4">No drafts saved yet</p>
          <Button onClick={onBack} variant="outline" data-testid="button-start-story">
            Start a New Story
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedDrafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-card border border-card-border rounded-md p-4"
                data-testid={`draft-item-${draft.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    {editingId === draft.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="max-w-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTitle(draft.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          data-testid={`input-rename-${draft.id}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => saveTitle(draft.id)}
                          className="text-green-500"
                          data-testid={`button-save-rename-${draft.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelEditing}
                          data-testid={`button-cancel-rename-${draft.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(draft)}
                        className="text-left group flex items-center gap-2 hover-elevate"
                        data-testid={`button-edit-title-${draft.id}`}
                      >
                        <h3 className="text-foreground font-display text-lg truncate">
                          {getDraftTitle(draft)}
                        </h3>
                        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-muted-foreground text-xs font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(draft.lastSavedAt)}
                      </span>
                      <span>Scene {draft.sceneNumber}/5</span>
                      <span className="text-primary/70">{draft.trackTitle}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => onResumeDraft(draft)}
                      size="sm"
                      className="bg-primary text-primary-foreground font-mono uppercase tracking-widest text-[10px]"
                      data-testid={`button-continue-${draft.id}`}
                    >
                      <Play className="w-3 h-3 mr-1" /> Continue
                    </Button>
                    <Button
                      onClick={() => handleDuplicate(draft.id)}
                      size="icon"
                      variant="ghost"
                      title="Duplicate"
                      data-testid={`button-duplicate-${draft.id}`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(draft.id)}
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete"
                      data-testid={`button-delete-${draft.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <span className="text-muted-foreground font-mono text-sm px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <div className="mt-8 text-center">
        <Button variant="outline" onClick={onBack} data-testid="button-back" aria-label="Return to home page">
          Back to Home
        </Button>
      </div>
      </main>
    </div>
  );
}
