import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useProgression, Badge } from "@/hooks/use-progression";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { StaticStarfield } from "@/components/arcade/StarfieldBackground";
import { 
  Star, Book, Scroll, Crown, Trophy,
  Flame, Zap, Award, Medal,
  Compass, Rocket, Building,
  Sparkles, Gem,
  Joystick,
  Lock,
  ArrowLeft
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  book: Book,
  scroll: Scroll,
  crown: Crown,
  trophy: Trophy,
  flame: Flame,
  zap: Zap,
  lightning: Zap,
  medal: Medal,
  compass: Compass,
  rocket: Rocket,
  building: Building,
  award: Award,
  sparkles: Sparkles,
  sparkle: Sparkles,
  gem: Gem,
  joystick: Joystick,
};

const RARITY_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { 
    bg: "bg-slate-800/50", 
    border: "border-slate-600", 
    text: "text-slate-300",
    glow: ""
  },
  uncommon: { 
    bg: "bg-green-900/30", 
    border: "border-green-600", 
    text: "text-green-400",
    glow: "shadow-green-500/20"
  },
  rare: { 
    bg: "bg-blue-900/30", 
    border: "border-blue-600", 
    text: "text-blue-400",
    glow: "shadow-blue-500/20"
  },
  epic: { 
    bg: "bg-purple-900/30", 
    border: "border-purple-600", 
    text: "text-purple-400",
    glow: "shadow-purple-500/30"
  },
  legendary: { 
    bg: "bg-gradient-to-br from-yellow-900/40 to-orange-900/40", 
    border: "border-yellow-500", 
    text: "text-yellow-400",
    glow: "shadow-yellow-500/40"
  },
};

interface BadgesPageProps {
  onBack?: () => void;
}

function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  const IconComponent = ICON_MAP[badge.icon] || Star;
  const styles = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;

  return (
    <motion.div
      className={`
        relative p-4 rounded-lg border
        ${earned ? styles.bg : 'bg-muted/20'}
        ${earned ? styles.border : 'border-muted/30'}
        ${earned ? `shadow-lg ${styles.glow}` : ''}
        transition-all duration-300
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={earned ? { scale: 1.02 } : {}}
      data-testid={`badge-card-${badge.id}`}
    >
      {!earned && (
        <div className="absolute inset-0 bg-background/60 rounded-lg flex items-center justify-center z-10">
          <Lock className="w-8 h-8 text-muted-foreground/50" />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div 
          className={`
            w-14 h-14 rounded-full flex items-center justify-center shrink-0
            ${earned ? 'bg-gradient-to-br from-white/10 to-transparent' : 'bg-muted/30'}
            border ${earned ? styles.border : 'border-muted/30'}
          `}
        >
          <IconComponent 
            className={`w-7 h-7 ${earned ? styles.text : 'text-muted-foreground/40'}`} 
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={`font-bold truncate ${earned ? 'text-foreground' : 'text-muted-foreground/60'}`}>
              {badge.name}
            </h3>
            <span 
              className={`
                text-[10px] font-mono uppercase px-2 py-0.5 rounded-full shrink-0
                ${earned ? styles.bg : 'bg-muted/30'} 
                ${earned ? styles.text : 'text-muted-foreground/40'}
              `}
            >
              {badge.rarity}
            </span>
          </div>
          
          <p className={`text-sm mb-2 ${earned ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
            {badge.description}
          </p>
          
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className={earned ? 'text-cyan-400' : 'text-muted-foreground/40'}>
              +{badge.xpReward} XP
            </span>
            {earned && badge.earnedAt && (
              <span className="text-muted-foreground">
                Earned {new Date(badge.earnedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function BadgesPage({ onBack }: BadgesPageProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { progress, allBadges, isLoading, isLoadingBadges } = useProgression();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  const earnedBadgeIds = new Set(progress?.badges.map(b => b.id) || []);
  
  const categories = [
    { id: "milestone", name: "Story Milestones", icon: Trophy },
    { id: "streak", name: "Streak Achievements", icon: Flame },
    { id: "track", name: "Track Completion", icon: Compass },
    { id: "level", name: "Level Rewards", icon: Star },
  ];


  if (isLoading || isLoadingBadges || allBadges.length === 0) {
    return (
      <div className="relative min-h-screen">
        <StaticStarfield />
        <main 
          id="main-content" 
          className="relative flex-1 p-6 md:p-12 pt-32 md:pt-36 max-w-4xl mx-auto w-full" 
          data-testid="view-badges"
        >
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-28 bg-muted/30 rounded-lg" />
              ))}
            </div>
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
        className="relative flex-1 p-6 md:p-12 pt-32 md:pt-36 max-w-5xl mx-auto w-full" 
        data-testid="view-badges"
      >
      <Button
        variant="ghost"
        onClick={handleBack}
        className="mb-6 font-mono text-xs tracking-widest"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-display text-foreground mb-4">
          ACHIEVEMENTS
        </h1>
        
        <p className="text-muted-foreground font-mono text-sm">
          Unlock badges by creating stories and building streaks
        </p>
      </div>

      <div className="space-y-10">
        {categories.map(category => {
          const categoryBadges = allBadges.filter(b => b.category === category.id);
          if (categoryBadges.length === 0) return null;

          const earnedInCategory = categoryBadges.filter(b => earnedBadgeIds.has(b.id)).length;
          const CategoryIcon = category.icon;

          return (
            <section key={category.id}>
              <div className="flex items-center gap-3 mb-4">
                <CategoryIcon className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display text-foreground">
                  {category.name}
                </h2>
                <span className="text-sm font-mono text-muted-foreground">
                  {categoryBadges.length} badges
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {categoryBadges.map((badge, i) => {
                  const earnedBadge = progress?.badges.find(b => b.id === badge.id);
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <BadgeCard 
                        badge={earnedBadge || badge} 
                        earned={earnedBadgeIds.has(badge.id)} 
                      />
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      </main>
    </div>
  );
}
