import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Story } from '@shared/schema';
import { StoryGalleryCard } from './StoryGalleryCard';
import { StoryModal } from './StoryModal';
import { Search, Filter, Grid3X3, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoryGalleryProps {
  stories: Story[];
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
}

type LayoutMode = 'grid' | 'masonry';
type TrackFilter = 'all' | 'origin' | 'future' | 'legend';

export function StoryGallery({ 
  stories, 
  title = "Community Stories",
  subtitle = "Explore the mythology of our community",
  showFilters = true 
}: StoryGalleryProps) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState<TrackFilter>('all');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');

  const filteredStories = stories.filter((story) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      (story.title?.toLowerCase() || '').includes(query) ||
      (story.logline?.toLowerCase() || '').includes(query) ||
      (story.author?.toLowerCase() || '').includes(query) ||
      (story.trackTitle?.toLowerCase() || '').includes(query) ||
      (story.trackId?.toLowerCase() || '').includes(query) ||
      (story.neighborhood?.toLowerCase() || '').includes(query);
    
    const matchesTrack = trackFilter === 'all' || story.trackId === trackFilter;
    
    return matchesSearch && matchesTrack;
  });

  const trackCounts = {
    all: stories.length,
    origin: stories.filter(s => s.trackId === 'origin').length,
    future: stories.filter(s => s.trackId === 'future').length,
    legend: stories.filter(s => s.trackId === 'legend').length,
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="font-display text-3xl md:text-5xl text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground font-mono text-xs md:text-sm tracking-widest">{subtitle}</p>
      </motion.div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8"
        >
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              data-testid="input-search-gallery"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg">
              <Filter className="w-4 h-4 text-muted-foreground ml-2" />
              {(['all', 'origin', 'future', 'legend'] as TrackFilter[]).map((track) => (
                <button
                  key={track}
                  onClick={() => setTrackFilter(track)}
                  className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                    trackFilter === track
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  data-testid={`filter-${track}`}
                >
                  {track === 'all' ? 'All' : track.charAt(0).toUpperCase() + track.slice(1)}
                  <span className="ml-1 opacity-60">({trackCounts[track]})</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  layoutMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Grid layout"
                data-testid="layout-toggle-grid"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('masonry')}
                className={`p-1.5 rounded-md transition-all ${
                  layoutMode === 'masonry' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Masonry layout"
                data-testid="layout-toggle-masonry"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {filteredStories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-muted-foreground font-mono text-sm">No stories found matching your criteria</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearchQuery(''); setTrackFilter('all'); }}
            className="mt-4"
          >
            Clear filters
          </Button>
        </motion.div>
      ) : (
        <motion.div
          layout
          className={`
            grid gap-4 md:gap-6
            ${layoutMode === 'grid' 
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 [&>*:nth-child(4n+1)]:row-span-2 [&>*:nth-child(4n+3)]:row-span-2'
            }
          `}
        >
          {filteredStories.map((story, index) => (
            <StoryGalleryCard
              key={story.id}
              story={story}
              index={index}
              onView={setSelectedStory}
            />
          ))}
        </motion.div>
      )}

      {selectedStory && (
        <StoryModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}
    </div>
  );
}
