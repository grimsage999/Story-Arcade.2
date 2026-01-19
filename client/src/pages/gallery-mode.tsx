import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { HallOfLegends } from '@/components/arcade/HallOfLegends';
import { Story } from '@shared/schema';

export default function GalleryModePage() {
  const [, navigate] = useLocation();
  
  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
  });

  const validStories = stories.filter(story => 
    story.title && 
    (story.p1 || story.p2 || story.p3)
  );

  const handleClose = () => {
    navigate('/explore');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
          <p className="text-white/60 font-mono text-sm">LOADING HALL OF LEGENDS...</p>
        </div>
      </div>
    );
  }

  return (
    <HallOfLegends 
      stories={validStories}
      autoPlay={true}
      cycleDuration={8000}
      onClose={handleClose}
    />
  );
}
