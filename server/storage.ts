import { type Story, type InsertStory, stories, type Draft, type InsertDraft, drafts } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";

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
  
  // Drafts
  getDraftsBySession(sessionId: string): Promise<Draft[]>;
  getDraft(id: number): Promise<Draft | undefined>;
  createDraft(draft: Omit<InsertDraft, 'id'>): Promise<Draft>;
  updateDraft(id: number, updates: Partial<InsertDraft>): Promise<Draft | undefined>;
  deleteDraft(id: number, sessionId: string): Promise<boolean>;
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
  async getDraftsBySession(sessionId: string): Promise<Draft[]> {
    return db.select().from(drafts).where(eq(drafts.sessionId, sessionId)).orderBy(desc(drafts.updatedAt));
  }

  async getDraft(id: number): Promise<Draft | undefined> {
    const [draft] = await db.select().from(drafts).where(eq(drafts.id, id));
    return draft || undefined;
  }

  async createDraft(draft: Omit<InsertDraft, 'id'>): Promise<Draft> {
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

  async deleteDraft(id: number, sessionId: string): Promise<boolean> {
    const result = await db.delete(drafts).where(and(eq(drafts.id, id), eq(drafts.sessionId, sessionId))).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
