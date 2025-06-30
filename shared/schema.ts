import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memories = pgTable("memories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  emotion: integer("emotion").notNull(), // 1-10 scale
  location: text("location"),
  tags: text("tags").array(),
  type: text("type").notNull(), // 'personal', 'social', 'educational'
  videoData: text("video_data"), // base64 encoded video data
  audioData: text("audio_data"), // base64 encoded audio data
  transcribedAudio: text("transcribed_audio"),
  sentimentScore: real("sentiment_score"),
  aiSuggestedTags: text("ai_suggested_tags").array(),
  nextReview: timestamp("next_review").defaultNow().notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  lastScore: integer("last_score").default(0).notNull(),
  reviewHistory: jsonb("review_history").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userAnalytics = pgTable("user_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  totalMemories: integer("total_memories").default(0).notNull(),
  dueForReview: integer("due_for_review").default(0).notNull(),
  reviewStreak: integer("review_streak").default(0).notNull(),
  accuracyRate: real("accuracy_rate").default(0).notNull(),
  retentionRates: jsonb("retention_rates").default({}).notNull(),
  reviewConsistency: real("review_consistency").default(0).notNull(),
  avgRecallScore: real("avg_recall_score").default(0).notNull(),
  insights: jsonb("insights").default([]).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMemorySchema = createInsertSchema(memories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  nextReview: true,
  reviewCount: true,
  lastScore: true,
  reviewHistory: true,
  transcribedAudio: true,
  sentimentScore: true,
  aiSuggestedTags: true,
});

export const insertUserAnalyticsSchema = createInsertSchema(userAnalytics).omit({
  id: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Memory = typeof memories.$inferSelect;
export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type UserAnalytics = typeof userAnalytics.$inferSelect;
export type InsertUserAnalytics = z.infer<typeof insertUserAnalyticsSchema>;

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
