import { type Story, type InsertStory, type User, type InsertUser, users, stories } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getStories(): Promise<Story[]>;
  getStory(id: number): Promise<Story | undefined>;
  getStoryByShareableId(shareableId: string): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  deleteStory(id: number): Promise<boolean>;
}

function generateShareableId(): string {
  return randomBytes(6).toString('base64url').slice(0, 8);
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getStories(): Promise<Story[]> {
    return db.select().from(stories).orderBy(desc(stories.timestamp));
  }

  async getStory(id: number): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story || undefined;
  }

  async getStoryByShareableId(shareableId: string): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.shareableId, shareableId));
    return story || undefined;
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const shareableId = generateShareableId();
    const [story] = await db.insert(stories).values({ ...insertStory, shareableId }).returning();
    return story;
  }

  async deleteStory(id: number): Promise<boolean> {
    const result = await db.delete(stories).where(eq(stories.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
