import { type Story, type InsertStory, stories } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  getStories(): Promise<Story[]>;
  getStoriesByUserId(userId: string): Promise<Story[]>;
  getStory(id: number): Promise<Story | undefined>;
  getStoryByShareableId(shareableId: string): Promise<Story | undefined>;
  createStory(story: InsertStory, userId?: string): Promise<Story>;
  deleteStory(id: number, userId: string): Promise<boolean>;
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
}

export const storage = new DatabaseStorage();
