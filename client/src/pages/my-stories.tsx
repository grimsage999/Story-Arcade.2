import { useState } from 'react';
import { useLocation } from 'wouter';
import { BookOpen, Search, Trash2, Eye, Download, Copy, Link, Filter, ArrowUpDown, SortDesc, SortAsc, Calendar, Loader2, Globe, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import type { Story } from '@shared/schema';
import { StaticStarfield } from '@/components/arcade/StarfieldBackground';
import { 
  exportStoryAsText,
  formatTimeAgo,
  type CompletedStory 
} from '@/lib/draftStorage';

interface MyStoriesPageProps {
  onViewStory?: (story: CompletedStory) => void;
  onEditStory?: (story: CompletedStory) => void;
  onBack?: () => void;
  showToast?: (message: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'alphabetical';

function storyToCompletedStory(story: Story): CompletedStory {
  return {
    id: `db_${story.id}`,
    dbId: story.id,
    shareableId: story.shareableId,
    title: story.title,
    trackId: story.trackId,
    trackTitle: story.trackTitle,
    content: [story.p1, story.p2, story.p3],
    themes: story.themes,
    createdAt: story.timestamp,
    userInputs: (story.answers as Record<string, string>) || {},
    insight: story.insight,
    logline: story.logline,
    author: story.author,
    neighborhood: story.neighborhood,
  };
}

export function MyStoriesPage({ onViewStory, onEditStory, onBack, showToast }: MyStoriesPageProps) {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleViewStory = (story: CompletedStory) => {
    if (onViewStory) {
      onViewStory(story);
    } else if (story.shareableId) {
      navigate(`/story/${story.shareableId}`);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  const { data: dbStories = [], isLoading: storiesLoading } = useQuery<Story[]>({
    queryKey: ['/api/stories/my'],
    enabled: isAuthenticated,
  });

  const { data: communityStories = [], isLoading: communityLoading } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
    enabled: !isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/stories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories/my'] });
      showToast?.('Story deleted');
    },
  });

  const stories: CompletedStory[] = dbStories.map(storyToCompletedStory);

  const filteredStories = stories
    .filter(story => {
      const matchesSearch = searchQuery === '' || 
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.content.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTheme = themeFilter === 'all' || story.themes.includes(themeFilter);
      return matchesSearch && matchesTheme;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredStories.length / itemsPerPage);
  const paginatedStories = filteredStories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (story: CompletedStory) => {
    if (story.dbId) {
      deleteMutation.mutate(story.dbId);
    }
  };

  const handleCopyText = (story: CompletedStory) => {
    const text = exportStoryAsText(story);
    navigator.clipboard.writeText(text);
    showToast?.('Story copied to clipboard');
  };

  const handleCopyLink = (story: CompletedStory) => {
    if (story.shareableId) {
      const url = `${window.location.origin}/story/${story.shareableId}`;
      navigator.clipboard.writeText(url);
      showToast?.('Shareable link copied!');
    } else {
      showToast?.('This story does not have a shareable link');
    }
  };

  const handleDownloadPdf = (story: CompletedStory) => {
    const text = exportStoryAsText(story);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast?.('Story downloaded');
  };

  const uniqueThemes = Array.from(new Set(stories.flatMap(s => s.themes)));
  const publicStories: CompletedStory[] = communityStories.map(storyToCompletedStory);

  if (authLoading || (isAuthenticated && storiesLoading) || (!isAuthenticated && communityLoading)) {
    return (
      <div className="relative min-h-screen">
        <StaticStarfield />
        <main 
          id="main-content" 
          className="relative max-w-4xl mx-auto p-6 pt-24 flex flex-col items-center justify-center min-h-[60vh]" 
          data-testid="page-my-stories-loading"
        >
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Loading your stories...</p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    const filteredPublicStories = publicStories
      .filter(story => {
        const matchesSearch = searchQuery === '' || 
          story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.content.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
      <div className="relative min-h-screen">
        <StaticStarfield />
        <main 
          id="main-content" 
          className="relative max-w-4xl mx-auto p-6 pt-24" 
          data-testid="page-my-stories-community"
          aria-label="Community Stories"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-5xl font-display text-foreground mb-2" data-testid="text-page-title">
                Community Stories
              </h1>
              <p className="text-muted-foreground font-mono text-xs tracking-widest">
                {publicStories.length} STOR{publicStories.length !== 1 ? 'IES' : 'Y'} FROM THE COMMUNITY
              </p>
            </div>
          </div>


          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search community stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          {communityLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground font-mono text-sm">Loading community stories...</p>
            </div>
          ) : filteredPublicStories.length === 0 ? (
            <div className="text-center py-16 bg-card border border-card-border rounded-md">
              <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-mono text-sm mb-4">
                {searchQuery ? 'No stories match your search' : 'No community stories yet'}
              </p>
              <Button onClick={handleBack} variant="outline" data-testid="button-create-story">
                Be the First to Create
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPublicStories.slice(0, 10).map((story) => (
                <div
                  key={story.id}
                  className="bg-card border border-card-border rounded-md p-4"
                  data-testid={`story-item-${story.id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-foreground font-display text-lg mb-1 truncate">
                        {story.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-muted-foreground text-xs font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTimeAgo(story.createdAt)}
                        </span>
                        <span className="text-primary/70 text-xs font-mono">{story.trackTitle}</span>
                        {story.author && (
                          <span className="text-muted-foreground/70 text-xs font-mono">
                            by {story.author}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {story.themes.map(theme => (
                          <Badge key={theme} variant="secondary" className="text-[10px]">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                        {story.content[0]}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleViewStory(story)}
                        size="sm"
                        variant="outline"
                        className="font-mono uppercase tracking-widest text-[10px]"
                        data-testid={`button-view-${story.id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Button variant="outline" onClick={handleBack} data-testid="button-back" aria-label="Return to home page">
              Back to Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <StaticStarfield />
      <main 
        id="main-content" 
        className="relative max-w-4xl mx-auto p-6 pt-24" 
        data-testid="page-my-stories"
        aria-label="Your Stories page"
      >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-display text-foreground mb-2" data-testid="text-page-title">
            My Stories
          </h1>
          <p className="text-muted-foreground font-mono text-xs tracking-widest">
            {stories.length} STOR{stories.length !== 1 ? 'IES' : 'Y'} SAVED TO CLOUD
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search your stories..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <Select 
          value={themeFilter} 
          onValueChange={(v) => { 
            setThemeFilter(v); 
            setCurrentPage(1); 
          }}
        >
          <SelectTrigger className="w-full md:w-[150px]" data-testid="select-theme-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Themes</SelectItem>
            {uniqueThemes.map(theme => (
              <SelectItem key={theme} value={theme}>{theme}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full md:w-[150px]" data-testid="select-sort">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">
              <span className="flex items-center gap-2">
                <SortDesc className="w-3 h-3" /> Newest
              </span>
            </SelectItem>
            <SelectItem value="oldest">
              <span className="flex items-center gap-2">
                <SortAsc className="w-3 h-3" /> Oldest
              </span>
            </SelectItem>
            <SelectItem value="alphabetical">
              <span className="flex items-center gap-2">
                <SortAsc className="w-3 h-3" /> A-Z
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-16 bg-card border border-card-border rounded-md">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm mb-4">No stories created yet</p>
          <Button onClick={handleBack} variant="outline" data-testid="button-create-story">
            Create Your First Story
          </Button>
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="text-center py-16 bg-card border border-card-border rounded-md">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-mono text-sm">No stories match your search</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedStories.map((story) => (
              <div
                key={story.id}
                className="bg-card border border-card-border rounded-md p-4"
                data-testid={`story-item-${story.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-foreground font-display text-lg mb-1 truncate">
                      {story.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-muted-foreground text-xs font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTimeAgo(story.createdAt)}
                      </span>
                      <span className="text-primary/70 text-xs font-mono">{story.trackTitle}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {story.themes.map(theme => (
                        <Badge key={theme} variant="secondary" className="text-[10px]">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                      {story.content[0]}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleViewStory(story)}
                      size="sm"
                      variant="outline"
                      className="font-mono uppercase tracking-widest text-[10px]"
                      data-testid={`button-view-${story.id}`}
                    >
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>

                    <Button
                      onClick={() => onEditStory?.(story)}
                      size="sm"
                      variant="outline"
                      className="font-mono uppercase tracking-widest text-[10px]"
                      data-testid={`button-edit-${story.id}`}
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-mono uppercase tracking-widest text-[10px]"
                          data-testid={`button-export-${story.id}`}
                        >
                          <Download className="w-3 h-3 mr-1" /> Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownloadPdf(story)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download as Text
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyText(story)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy to Clipboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyLink(story)}>
                          <Link className="w-4 h-4 mr-2" />
                          Copy Story Link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      onClick={() => handleDelete(story)}
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete"
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${story.id}`}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
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
        <Button variant="outline" onClick={handleBack} data-testid="button-back" aria-label="Return to home page">
          Back to Home
        </Button>
      </div>
      </main>
    </div>
  );
}
