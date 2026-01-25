import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// Server-backed drafts table for cross-device sync
// Ownership: For authenticated users, use userId. For anonymous users, use sessionId.
export const drafts = pgTable("drafts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar("session_id", { length: 64 }), // For anonymous users (nullable for authenticated)
  userId: varchar("user_id"), // For authenticated users (nullable for anonymous)
  trackId: text("track_id").notNull(),
  trackTitle: text("track_title").notNull(),
  answers: jsonb("answers").notNull(),
  currentQuestionIndex: integer("current_question_index").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDraftSchema = createInsertSchema(drafts, {
  answers: z.record(z.string(), z.string()),
  currentQuestionIndex: z.number().optional().default(0),
  sessionId: z.string().max(64).optional(),
  userId: z.string().optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => data.sessionId || data.userId,
  { message: "Either sessionId or userId must be provided" }
);

export const updateDraftSchema = z.object({
  answers: z.record(z.string(), z.string()).optional(),
  currentQuestionIndex: z.number().optional(),
});

export type Draft = typeof drafts.$inferSelect;
export type InsertDraft = z.infer<typeof insertDraftSchema>;
export type UpdateDraft = z.infer<typeof updateDraftSchema>;

export const stories = pgTable("stories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  shareableId: varchar("shareable_id", { length: 12 }).notNull().unique(),
  userId: varchar("user_id"),
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
  posterUrl: text("poster_url"),
  posterStatus: text("poster_status").default("pending"),
});

const baseInsertStorySchema = createInsertSchema(stories, {
  themes: z.array(z.string()),
});

export const insertStorySchema = baseInsertStorySchema.omit({
  shareableId: true,
});

export const updateStorySchema = z.object({
  title: z.string().optional(),
  logline: z.string().optional(),
  themes: z.array(z.string()).optional(),
  insight: z.string().optional(),
  p1: z.string().optional(),
  p2: z.string().optional(),
  p3: z.string().optional(),
  answers: z.record(z.string(), z.string()).optional(),
  posterUrl: z.string().nullable().optional(),
  posterStatus: z.string().optional(),
});

export type InsertStory = z.infer<typeof insertStorySchema>;
export type UpdateStory = z.infer<typeof updateStorySchema>;
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
