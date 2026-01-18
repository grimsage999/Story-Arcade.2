import { db } from "./db";
import { users, badges, userBadges, Badge, User } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export const XP_REWARDS = {
  STORY_CREATED: 100,
  STREAK_DAY: 25,
  FIRST_STORY: 50,
  TRACK_COMPLETE: 75,
  MILESTONE_STORIES: 150,
} as const;

export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1850,   // Level 7
  2500,   // Level 8
  3250,   // Level 9
  4100,   // Level 10
  5050,   // Level 11
  6100,   // Level 12
  7250,   // Level 13
  8500,   // Level 14
  9850,   // Level 15
  11300,  // Level 16
  12850,  // Level 17
  14500,  // Level 18
  16250,  // Level 19
  18100,  // Level 20
];

export const BADGE_DEFINITIONS: Badge[] = [
  {
    id: "first_story",
    name: "Story Initiate",
    description: "Create your first story",
    icon: "star",
    category: "milestone",
    requirement: "Create 1 story",
    xpReward: 50,
    rarity: "common",
  },
  {
    id: "stories_5",
    name: "Rising Storyteller",
    description: "Create 5 stories",
    icon: "book",
    category: "milestone",
    requirement: "Create 5 stories",
    xpReward: 100,
    rarity: "common",
  },
  {
    id: "stories_10",
    name: "Story Weaver",
    description: "Create 10 stories",
    icon: "scroll",
    category: "milestone",
    requirement: "Create 10 stories",
    xpReward: 150,
    rarity: "uncommon",
  },
  {
    id: "stories_25",
    name: "Tale Master",
    description: "Create 25 stories",
    icon: "crown",
    category: "milestone",
    requirement: "Create 25 stories",
    xpReward: 300,
    rarity: "rare",
  },
  {
    id: "stories_50",
    name: "Legendary Narrator",
    description: "Create 50 stories",
    icon: "trophy",
    category: "milestone",
    requirement: "Create 50 stories",
    xpReward: 500,
    rarity: "epic",
  },
  {
    id: "streak_3",
    name: "On a Roll",
    description: "Maintain a 3-day story streak",
    icon: "flame",
    category: "streak",
    requirement: "3-day streak",
    xpReward: 75,
    rarity: "common",
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day story streak",
    icon: "zap",
    category: "streak",
    requirement: "7-day streak",
    xpReward: 150,
    rarity: "uncommon",
  },
  {
    id: "streak_14",
    name: "Fortnight Fighter",
    description: "Maintain a 14-day story streak",
    icon: "lightning",
    category: "streak",
    requirement: "14-day streak",
    xpReward: 250,
    rarity: "rare",
  },
  {
    id: "streak_30",
    name: "Monthly Legend",
    description: "Maintain a 30-day story streak",
    icon: "medal",
    category: "streak",
    requirement: "30-day streak",
    xpReward: 500,
    rarity: "epic",
  },
  {
    id: "track_origin",
    name: "Origin Explorer",
    description: "Complete a story in the Origin Story track",
    icon: "compass",
    category: "track",
    requirement: "Complete Origin Story track",
    xpReward: 75,
    rarity: "common",
  },
  {
    id: "track_future",
    name: "Future Visionary",
    description: "Complete a story in the Future City track",
    icon: "rocket",
    category: "track",
    requirement: "Complete Future City track",
    xpReward: 75,
    rarity: "common",
  },
  {
    id: "track_legend",
    name: "Neighborhood Chronicler",
    description: "Complete a story in the Neighborhood Legend track",
    icon: "building",
    category: "track",
    requirement: "Complete Neighborhood Legend track",
    xpReward: 75,
    rarity: "common",
  },
  {
    id: "all_tracks",
    name: "Track Master",
    description: "Complete at least one story in all three tracks",
    icon: "award",
    category: "track",
    requirement: "Complete all tracks",
    xpReward: 200,
    rarity: "rare",
  },
  {
    id: "level_5",
    name: "Apprentice Writer",
    description: "Reach level 5",
    icon: "sparkles",
    category: "level",
    requirement: "Reach level 5",
    xpReward: 100,
    rarity: "uncommon",
  },
  {
    id: "level_10",
    name: "Master Scribe",
    description: "Reach level 10",
    icon: "gem",
    category: "level",
    requirement: "Reach level 10",
    xpReward: 250,
    rarity: "rare",
  },
  {
    id: "level_15",
    name: "Grand Storyteller",
    description: "Reach level 15",
    icon: "sparkle",
    category: "level",
    requirement: "Reach level 15",
    xpReward: 400,
    rarity: "epic",
  },
  {
    id: "level_20",
    name: "Arcade Legend",
    description: "Reach level 20 - the ultimate achievement",
    icon: "joystick",
    category: "level",
    requirement: "Reach level 20",
    xpReward: 1000,
    rarity: "legendary",
  },
];

export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

export function getXpForCurrentLevel(currentLevel: number): number {
  if (currentLevel <= 1) return 0;
  return LEVEL_THRESHOLDS[currentLevel - 1];
}

export async function seedBadges(): Promise<void> {
  for (const badge of BADGE_DEFINITIONS) {
    await db
      .insert(badges)
      .values(badge)
      .onConflictDoNothing({ target: badges.id });
  }
}

export async function getUserProgress(userId: string): Promise<{
  xp: number;
  level: number;
  storiesCreated: number;
  currentStreak: number;
  longestStreak: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  badges: (Badge & { earnedAt: Date })[];
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    return {
      xp: 0,
      level: 1,
      storiesCreated: 0,
      currentStreak: 0,
      longestStreak: 0,
      xpForCurrentLevel: 0,
      xpForNextLevel: 100,
      badges: [],
    };
  }

  const earnedBadges = await db
    .select({
      id: badges.id,
      name: badges.name,
      description: badges.description,
      icon: badges.icon,
      category: badges.category,
      requirement: badges.requirement,
      xpReward: badges.xpReward,
      rarity: badges.rarity,
      earnedAt: userBadges.earnedAt,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId));

  return {
    xp: user.xp,
    level: user.level,
    storiesCreated: user.storiesCreated,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    xpForCurrentLevel: getXpForCurrentLevel(user.level),
    xpForNextLevel: getXpForNextLevel(user.level),
    badges: earnedBadges,
  };
}

export async function getAllBadges(): Promise<Badge[]> {
  return db.select().from(badges);
}

export async function awardBadge(
  userId: string,
  badgeId: string
): Promise<{ badge: Badge; xpAwarded: number } | null> {
  const [existingBadge] = await db
    .select()
    .from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));

  if (existingBadge) {
    return null;
  }

  const [badge] = await db.select().from(badges).where(eq(badges.id, badgeId));
  if (!badge) {
    return null;
  }

  await db.insert(userBadges).values({ userId, badgeId });

  await db
    .update(users)
    .set({
      xp: sql`${users.xp} + ${badge.xpReward}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));
  if (updatedUser) {
    const newLevel = calculateLevel(updatedUser.xp);
    if (newLevel !== updatedUser.level) {
      await db
        .update(users)
        .set({ level: newLevel })
        .where(eq(users.id, userId));
    }
  }

  return { badge, xpAwarded: badge.xpReward };
}

export async function addXp(
  userId: string,
  amount: number
): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return { newXp: 0, newLevel: 1, leveledUp: false };
  }

  const newXp = user.xp + amount;
  const newLevel = calculateLevel(newXp);
  const leveledUp = newLevel > user.level;

  await db
    .update(users)
    .set({
      xp: newXp,
      level: newLevel,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { newXp, newLevel, leveledUp };
}

export async function recordStoryCreation(
  userId: string,
  trackId: string
): Promise<{
  xpAwarded: number;
  newBadges: Badge[];
  leveledUp: boolean;
  newLevel: number;
  newStreak: number;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return { xpAwarded: 0, newBadges: [], leveledUp: false, newLevel: 1, newStreak: 0 };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let newStreak = user.currentStreak;
  let longestStreak = user.longestStreak;
  
  if (user.lastStoryDate) {
    const lastDate = new Date(user.lastStoryDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const daysDiff = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      newStreak = user.currentStreak + 1;
    } else if (daysDiff > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  longestStreak = Math.max(longestStreak, newStreak);
  const newStoriesCount = user.storiesCreated + 1;

  let totalXp = XP_REWARDS.STORY_CREATED;
  if (newStreak > user.currentStreak && newStreak > 1) {
    totalXp += XP_REWARDS.STREAK_DAY * (newStreak - 1);
  }

  const newXp = user.xp + totalXp;
  const newLevel = calculateLevel(newXp);
  const leveledUp = newLevel > user.level;

  await db
    .update(users)
    .set({
      xp: newXp,
      level: newLevel,
      storiesCreated: newStoriesCount,
      currentStreak: newStreak,
      longestStreak: longestStreak,
      lastStoryDate: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  const newBadges: Badge[] = [];

  const badgesToCheck = [
    { condition: newStoriesCount === 1, badgeId: "first_story" },
    { condition: newStoriesCount === 5, badgeId: "stories_5" },
    { condition: newStoriesCount === 10, badgeId: "stories_10" },
    { condition: newStoriesCount === 25, badgeId: "stories_25" },
    { condition: newStoriesCount === 50, badgeId: "stories_50" },
    { condition: newStreak >= 3, badgeId: "streak_3" },
    { condition: newStreak >= 7, badgeId: "streak_7" },
    { condition: newStreak >= 14, badgeId: "streak_14" },
    { condition: newStreak >= 30, badgeId: "streak_30" },
    { condition: trackId === "origin-story", badgeId: "track_origin" },
    { condition: trackId === "future-nyc", badgeId: "track_future" },
    { condition: trackId === "neighborhood-legend", badgeId: "track_legend" },
    { condition: newLevel >= 5, badgeId: "level_5" },
    { condition: newLevel >= 10, badgeId: "level_10" },
    { condition: newLevel >= 15, badgeId: "level_15" },
    { condition: newLevel >= 20, badgeId: "level_20" },
  ];

  for (const check of badgesToCheck) {
    if (check.condition) {
      const result = await awardBadge(userId, check.badgeId);
      if (result) {
        newBadges.push(result.badge);
        totalXp += result.xpAwarded;
      }
    }
  }

  return {
    xpAwarded: totalXp,
    newBadges,
    leveledUp,
    newLevel,
    newStreak,
  };
}
