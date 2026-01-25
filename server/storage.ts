import { type Story, type InsertStory, stories, type Draft, type InsertDraft, drafts } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";

/** Owner context for draft operations */
export interface DraftOwner {
  userId?: string;      // For authenticated users
  sessionId?: string;   // For anonymous users
}

export interface IStorage {
  // Stories
  getStories(): Promise<Story[]>;
  getStoriesByUserId(userId: string): Promise<Story[]>;
  getStory(id: number): Promise<Story | undefined>;
  getStoryByShareableId(shareableId: string): Promise<Story | undefined>;
  createStory(story: InsertStory, userId?: string): Promise<Story>;
  updateStory(id: number, updates: Partial<InsertStory>): Promise<Story | undefined>;
  deleteStory(id: number, userId: string): Promise<boolean>;
  updateStoryPoster(id: number, posterUrl: string | null, status: string): Promise<Story | undefined>;

  // Drafts - updated to use DraftOwner for ownership
  getDraftsByOwner(owner: DraftOwner): Promise<Draft[]>;
  getDraft(id: number): Promise<Draft | undefined>;
  createDraft(draft: InsertDraft): Promise<Draft>;
  updateDraft(id: number, updates: Partial<InsertDraft>): Promise<Draft | undefined>;
  deleteDraft(id: number, owner: DraftOwner): Promise<boolean>;

  // Legacy method for backward compatibility (deprecated)
  getDraftsBySession(sessionId: string): Promise<Draft[]>;
}

function generateShareableId(): string {
  return randomBytes(6).toString('base64url').slice(0, 8);
}

export class DatabaseStorage implements IStorage {
  async getStories(): Promise<Story[]> {
    return db.select().from(stories).orderBy(desc(stories.timestamp));
  }

  async getStoriesByUserId(userId: string): Promise<Story[]> {
    return db.select().from(stories).where(eq(stories.userId, userId)).orderBy(desc(stories.timestamp));
  }

  async getStory(id: number): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story || undefined;
  }

  async getStoryByShareableId(shareableId: string): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.shareableId, shareableId));
    return story || undefined;
  }

  async createStory(insertStory: InsertStory, userId?: string): Promise<Story> {
    const shareableId = generateShareableId();
    const [story] = await db.insert(stories).values({ 
      ...insertStory, 
      shareableId, 
      userId: userId ?? null 
    }).returning();
    return story;
  }

  async deleteStory(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(stories).where(and(eq(stories.id, id), eq(stories.userId, userId))).returning();
    return result.length > 0;
  }

  async updateStoryPoster(id: number, posterUrl: string | null, status: string): Promise<Story | undefined> {
    const [story] = await db.update(stories)
      .set({ posterUrl, posterStatus: status })
      .where(eq(stories.id, id))
      .returning();
    return story || undefined;
  }

  async updateStory(id: number, updates: Partial<InsertStory>): Promise<Story | undefined> {
    const [story] = await db.update(stories)
      .set(updates)
      .where(eq(stories.id, id))
      .returning();
    return story || undefined;
  }

  // Draft methods

  /**
   * Get drafts by owner. For authenticated users, matches by userId.
   * For anonymous users, matches by sessionId (with null userId).
   */
  async getDraftsByOwner(owner: DraftOwner): Promise<Draft[]> {
    if (owner.userId) {
      // Authenticated user: match by userId
      return db.select().from(drafts).where(eq(drafts.userId, owner.userId)).orderBy(desc(drafts.updatedAt));
    } else if (owner.sessionId) {
      // Anonymous user: match by sessionId where userId is null
      return db.select().from(drafts).where(
        and(
          eq(drafts.sessionId, owner.sessionId),
          isNull(drafts.userId)
        )
      ).orderBy(desc(drafts.updatedAt));
    }
    return [];
  }

  /**
   * @deprecated Use getDraftsByOwner instead
   */
  async getDraftsBySession(sessionId: string): Promise<Draft[]> {
    return this.getDraftsByOwner({ sessionId });
  }

  async getDraft(id: number): Promise<Draft | undefined> {
    const [draft] = await db.select().from(drafts).where(eq(drafts.id, id));
    return draft || undefined;
  }

  async createDraft(draft: InsertDraft): Promise<Draft> {
    const [newDraft] = await db.insert(drafts).values(draft).returning();
    return newDraft;
  }

  async updateDraft(id: number, updates: Partial<InsertDraft>): Promise<Draft | undefined> {
    const [draft] = await db.update(drafts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(drafts.id, id))
      .returning();
    return draft || undefined;
  }

  /**
   * Delete a draft. Verifies ownership before deletion.
   */
  async deleteDraft(id: number, owner: DraftOwner): Promise<boolean> {
    if (owner.userId) {
      // Authenticated user: verify by userId
      const result = await db.delete(drafts).where(
        and(eq(drafts.id, id), eq(drafts.userId, owner.userId))
      ).returning();
      return result.length > 0;
    } else if (owner.sessionId) {
      // Anonymous user: verify by sessionId and null userId
      const result = await db.delete(drafts).where(
        and(
          eq(drafts.id, id),
          eq(drafts.sessionId, owner.sessionId),
          isNull(drafts.userId)
        )
      ).returning();
      return result.length > 0;
    }
    return false;
  }
}

export const storage = new DatabaseStorage();
