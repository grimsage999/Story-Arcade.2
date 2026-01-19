import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import type { Story } from '@shared/schema';
import { StarfieldBackground } from '@/components/arcade/StarfieldBackground';
import { FeaturedStorySpotlight } from '@/components/arcade/FeaturedStorySpotlight';
import { StoryGallery } from '@/components/arcade/StoryGallery';
import { StoryModal } from '@/components/arcade/StoryModal';
import { CRTOverlay } from '@/components/arcade/CRTOverlay';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Users, Zap, Monitor } from 'lucide-react';

export default function ExplorePage() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
  });

  const storiesWithPosters = stories.filter(
    (s) => s.posterUrl && s.posterStatus === 'ready'
  );

  const handleViewStory = (story: Story) => {
    setSelectedStory(story);
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden arcade-floor-ambient">
      <StarfieldBackground starCount={150} className="fixed inset-0" />
      <CRTOverlay />
      
      <div className="relative z-10">
        <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    data-testid="button-back-home"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <div>
                  <h1 
                    className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                    data-testid="text-page-title"
                  >
                    Story Gallery
                  </h1>
                  <p 
                    className="text-sm text-muted-foreground"
                    data-testid="text-page-subtitle"
                  >
                    Explore the mythology of our community
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link href="/gallery-mode">
                  <Button 
                    variant="outline"
                    data-testid="button-gallery-mode"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Gallery Mode
                  </Button>
                </Link>
                <Link href="/">
                  <Button 
                    data-testid="button-create-story"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Create Your Story
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8" data-testid="view-explore">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[60vh]" data-testid="loading-spinner">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full"
              />
            </div>
          ) : (
            <>
              {storiesWithPosters.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-12"
                  data-testid="section-featured-stories"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                    <h2 
                      className="text-xl md:text-2xl font-bold text-foreground"
                      data-testid="text-featured-title"
                    >
                      Featured Stories
                    </h2>
                  </div>
                  <FeaturedStorySpotlight
                    stories={storiesWithPosters}
                    onViewStory={handleViewStory}
                    autoPlayInterval={8000}
                  />
                </motion.section>
              )}

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                data-testid="section-community-stories"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-6 h-6 text-purple-400" />
                  <h2 
                    className="text-xl md:text-2xl font-bold text-foreground"
                    data-testid="text-community-title"
                  >
                    Community Stories
                  </h2>
                  <span 
                    className="text-sm text-muted-foreground ml-2"
                    data-testid="text-story-count"
                  >
                    ({stories.length} {stories.length === 1 ? 'story' : 'stories'})
                  </span>
                </div>
                
                {stories.length > 0 ? (
                  <StoryGallery 
                    stories={stories} 
                    title=""
                    subtitle=""
                    showFilters={true}
                  />
                ) : (
                  <div className="text-center py-16" data-testid="empty-state">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                      <Sparkles className="w-10 h-10 text-primary" />
                    </div>
                    <h3 
                      className="text-xl font-semibold text-foreground mb-2"
                      data-testid="text-empty-title"
                    >
                      No Stories Yet
                    </h3>
                    <p 
                      className="text-muted-foreground mb-6 max-w-md mx-auto"
                      data-testid="text-empty-message"
                    >
                      Be the first to forge your legend and share your story with the community.
                    </p>
                    <Link href="/">
                      <Button data-testid="button-create-first-story">
                        <Zap className="w-4 h-4 mr-2" />
                        Create the First Story
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.section>
            </>
          )}
        </main>

        <footer className="border-t border-border mt-16 py-8 bg-background/40 backdrop-blur-sm">
          <div className="container mx-auto px-4 text-center">
            <p 
              className="text-muted-foreground text-sm"
              data-testid="text-footer"
            >
              Story Arcade - Where legends are forged
            </p>
          </div>
        </footer>
      </div>

      {selectedStory && (
        <StoryModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}
    </div>
  );
}
