import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: string;
  xpReward: number;
  rarity: string;
  earnedAt?: string;
}

export interface UserProgress {
  xp: number;
  level: number;
  storiesCreated: number;
  currentStreak: number;
  longestStreak: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  badges: Badge[];
}

export interface ProgressionReward {
  xpAwarded: number;
  newBadges: Badge[];
  leveledUp: boolean;
  newLevel: number;
  newStreak: number;
}

export function useProgression() {
  const { user } = useAuth();
  
  const progressQuery = useQuery<UserProgress>({
    queryKey: ["/api/progression"],
    enabled: !!user,
  });

  const badgesQuery = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
  });

  return {
    progress: progressQuery.data,
    isLoading: progressQuery.isLoading,
    allBadges: badgesQuery.data || [],
    isLoadingBadges: badgesQuery.isLoading,
    refetch: progressQuery.refetch,
  };
}
