import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const stories = pgTable("stories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  trackId: text("track_id").notNull(),
  trackTitle: text("track_title").notNull(),
  author: text("author").notNull(),
  neighborhood: text("neighborhood").notNull(),
  title: text("title").notNull(),
  themes: text("themes").array().notNull(),
  insight: text("insight").notNull(),
  logline: text("logline").notNull(),
  p1: text("p1").notNull(),
  p2: text("p2").notNull(),
  p3: text("p3").notNull(),
  timestamp: text("timestamp").notNull(),
  answers: jsonb("answers"),
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
});

export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;

export const questionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  placeholder: z.string(),
  guidance: z.string(),
});

export const trackSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  color: z.string(),
  accent: z.string(),
  border: z.string(),
  badge: z.string(),
  questions: z.array(questionSchema),
});

export type Question = z.infer<typeof questionSchema>;
export type Track = z.infer<typeof trackSchema>;
