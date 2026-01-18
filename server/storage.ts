import { type Story, type InsertStory, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getStories(): Promise<Story[]>;
  getStory(id: number): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  deleteStory(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private stories: Map<number, Story>;
  private nextStoryId: number;

  constructor() {
    this.users = new Map();
    this.stories = new Map();
    this.nextStoryId = 1;
    
    const seedStories: Story[] = [
      {
        id: 1,
        trackId: "future",
        author: "Maria Elena",
        neighborhood: "Williamsburg",
        title: "The Evening Market Era",
        themes: ["Resilience", "Culture"],
        insight: "Vision of localized economy.",
        logline: "2036. The Williamsburg waterfront breathes again.",
        p1: "It starts with the silence of the electric streets. No more honking, just the soft hum of bikes and the chatter of neighbors.",
        p2: "The shift wasn't accidental. It took years of community organizing, block by block, until the old warehouses became greenhouses.",
        p3: "Now, a new ritual anchors the day: the Evening Market, where every vendor knows your name and the tomatoes taste like summer.",
        timestamp: new Date().toISOString(),
        trackTitle: "Future NYC",
        answers: null
      },
      {
        id: 2,
        trackId: "origin",
        author: "Marcus Thompson",
        neighborhood: "Harlem",
        title: "The Subway Decision",
        themes: ["Courage", "Identity"],
        insight: "Finding voice in silence.",
        logline: "One moment underground changed everything above.",
        p1: "It was 2AM on the A train when I realized I had been living someone else's dream for twelve years.",
        p2: "The challenge wasn't external—it was the voice in my head telling me I wasn't enough to try something new.",
        p3: "Today, I teach kids that the scariest doors lead to the brightest rooms. That subway ride was my first step through.",
        timestamp: new Date().toISOString(),
        trackTitle: "Origin Story",
        answers: null
      },
      {
        id: 3,
        trackId: "legend",
        author: "Abuela Rosa",
        neighborhood: "Washington Heights",
        title: "The Dancing Fire Escape",
        themes: ["Magic", "Community"],
        insight: "Some things can't be explained.",
        logline: "They say on summer nights, the old fire escape still moves to salsa.",
        p1: "It started the night Doña Carmen passed—her fire escape began swaying to music only the building could hear.",
        p2: "The landlord tried to tear it down three times. Each time, his tools would go missing, only to reappear arranged in dance formations.",
        p3: "Now there's only one rule on 173rd Street: if you hear the music, you dance. The building won't have it any other way.",
        timestamp: new Date().toISOString(),
        trackTitle: "Neighborhood Legend",
        answers: null
      }
    ];

    seedStories.forEach(story => {
      this.stories.set(story.id, story);
      if (story.id >= this.nextStoryId) {
        this.nextStoryId = story.id + 1;
      }
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getStories(): Promise<Story[]> {
    return Array.from(this.stories.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getStory(id: number): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.nextStoryId++;
    const story: Story = { ...insertStory, id } as Story;
    this.stories.set(id, story);
    return story;
  }

  async deleteStory(id: number): Promise<boolean> {
    return this.stories.delete(id);
  }
}

export const storage = new MemStorage();
