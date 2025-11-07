import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Performance optimization: Indexes improve query speed for common operations
// - userId index: Speeds up queries filtering by user (most common operation)
// - nextReview index: Optimizes retrieval of memories due for review
// - createdAt index: Improves sorting and filtering by creation date
export const memories = pgTable("memories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
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
}, (table) => ({
  userIdIdx: index("memories_user_id_idx").on(table.userId),
  nextReviewIdx: index("memories_next_review_idx").on(table.nextReview),
  createdAtIdx: index("memories_created_at_idx").on(table.createdAt),
}));

// Performance optimization: userId index speeds up analytics lookups by user
export const userAnalytics = pgTable("user_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  totalMemories: integer("total_memories").default(0).notNull(),
  dueForReview: integer("due_for_review").default(0).notNull(),
  reviewStreak: integer("review_streak").default(0).notNull(),
  accuracyRate: real("accuracy_rate").default(0).notNull(),
  retentionRates: jsonb("retention_rates").default({}).notNull(),
  reviewConsistency: real("review_consistency").default(0).notNull(),
  avgRecallScore: real("avg_recall_score").default(0).notNull(),
  insights: jsonb("insights").default([]).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_analytics_user_id_idx").on(table.userId),
}));

// Session table for connect-pg-simple
// This table stores user sessions persistently in the database
// instead of in memory, which is required for production environments
// Table name must be "session" (not "sessions") for connect-pg-simple
export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => ({
  expireIdx: index("session_expire_idx").on(table.expire),
}));

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

// Memory update schema - whitelist only allowed fields
export const updateMemorySchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(200, "Title must be less than 200 characters").optional(),
  description: z.string().min(1, "Description cannot be empty").optional(),
  emotion: z.number().int().min(1, "Emotion must be between 1 and 10").max(10, "Emotion must be between 1 and 10").optional(),
  location: z.string().max(200, "Location must be less than 200 characters").optional(),
  tags: z.array(z.string().max(50, "Each tag must be less than 50 characters")).max(20, "Maximum 20 tags allowed").optional(),
  type: z.enum(['personal', 'social', 'educational'], {
    errorMap: () => ({ message: "Type must be one of: personal, social, educational" })
  }).optional(),
  videoData: z.string().optional(),
  audioData: z.string().optional(),
}).strict(); // Reject any fields not in the schema

// Review submission schema
export const reviewSchema = z.object({
  score: z.number().int().min(0, "Score must be between 0 and 3").max(3, "Score must be between 0 and 3"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateMemory = z.infer<typeof updateMemorySchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;

// Pagination types for optimized queries
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
