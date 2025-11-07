import { users, memories, userAnalytics, type User, type InsertUser, type Memory, type InsertMemory, type UserAnalytics, type InsertUserAnalytics, type PaginationParams, type PaginatedResponse } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;

  // Memory operations
  getMemory(id: number): Promise<Memory | undefined>;
  getMemoriesByUser(userId: number, params?: PaginationParams): Promise<Memory[] | PaginatedResponse<Memory>>;
  getMemoriesDueForReview(userId: number, limit?: number): Promise<Memory[]>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(id: number, updates: Partial<Memory>): Promise<Memory | undefined>;
  deleteMemory(id: number): Promise<boolean>;

  // Analytics operations
  getUserAnalytics(userId: number): Promise<UserAnalytics | undefined>;
  createUserAnalytics(analytics: InsertUserAnalytics): Promise<UserAnalytics>;
  updateUserAnalytics(userId: number, updates: Partial<UserAnalytics>): Promise<UserAnalytics | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(insertUser.password, 10);
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      throw hashError;
    }

    let user;
    try {
      [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          password: hashedPassword,
        })
        .returning();
    } catch (dbError) {
      console.error('Error inserting user into database:', dbError);
      throw dbError;
    }

    // Create initial analytics record
    await this.createUserAnalytics({ userId: user.id });

    return user;
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error in verifyPassword:', error);
      throw error;
    }
  }

  async getMemory(id: number): Promise<Memory | undefined> {
    const [memory] = await db.select().from(memories).where(eq(memories.id, id));
    return memory || undefined;
  }

  async getMemoriesByUser(userId: number, params?: PaginationParams): Promise<Memory[] | PaginatedResponse<Memory>> {
    // If no pagination params provided, return all memories (backward compatibility)
    if (!params) {
      return await db
        .select()
        .from(memories)
        .where(eq(memories.userId, userId))
        .orderBy(memories.createdAt);
    }

    // Apply pagination with limits
    const limit = Math.min(params.limit || 50, 100); // Default 50, max 100
    const offset = params.offset || 0;

    // Get total count for pagination metadata (uses userId index)
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(memories)
      .where(eq(memories.userId, userId));

    // Get paginated results (uses userId and createdAt indexes)
    const data = await db
      .select()
      .from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(memories.createdAt)
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count,
      },
    };
  }

  async getMemoriesDueForReview(userId: number, limit?: number): Promise<Memory[]> {
    const now = new Date();
    const { and, lte } = await import("drizzle-orm");

    // Query uses composite index on (userId, nextReview) for optimal performance
    const query = db
      .select()
      .from(memories)
      .where(and(
        eq(memories.userId, userId),
        lte(memories.nextReview, now)
      ))
      .orderBy(memories.nextReview);

    // Apply limit if specified to prevent loading excessive data
    if (limit) {
      return await query.limit(limit);
    }

    return await query;
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const now = new Date();
    const [memory] = await db
      .insert(memories)
      .values({
        ...insertMemory,
        location: insertMemory.location || null,
        nextReview: now,
        reviewCount: 0,
        lastScore: 0,
        reviewHistory: [],
        transcribedAudio: null,
        sentimentScore: null,
        aiSuggestedTags: [],
      })
      .returning();

    // Update user analytics
    await this.updateAnalyticsAfterMemoryCreation(insertMemory.userId);

    return memory;
  }

  async updateMemory(id: number, updates: Partial<Memory>): Promise<Memory | undefined> {
    const [memory] = await db
      .update(memories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(memories.id, id))
      .returning();
    
    return memory || undefined;
  }

  async deleteMemory(id: number): Promise<boolean> {
    const memory = await this.getMemory(id);
    if (!memory) return false;

    await db.delete(memories).where(eq(memories.id, id));
    await this.updateAnalyticsAfterMemoryDeletion(memory.userId);
    return true;
  }

  async getUserAnalytics(userId: number): Promise<UserAnalytics | undefined> {
    const [analytics] = await db
      .select()
      .from(userAnalytics)
      .where(eq(userAnalytics.userId, userId));
    return analytics || undefined;
  }

  async createUserAnalytics(insertAnalytics: InsertUserAnalytics): Promise<UserAnalytics> {
    const [analytics] = await db
      .insert(userAnalytics)
      .values({
        ...insertAnalytics,
        totalMemories: 0,
        dueForReview: 0,
        reviewStreak: 0,
        accuracyRate: 0,
        retentionRates: {},
        reviewConsistency: 0,
        avgRecallScore: 0,
        insights: [],
      })
      .returning();
    
    return analytics;
  }

  async updateUserAnalytics(userId: number, updates: Partial<UserAnalytics>): Promise<UserAnalytics | undefined> {
    const [analytics] = await db
      .update(userAnalytics)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(userAnalytics.userId, userId))
      .returning();
    
    return analytics || undefined;
  }

  private async updateAnalyticsAfterMemoryCreation(userId: number): Promise<void> {
    const userMemories = await this.getMemoriesByUser(userId);
    const dueMemories = await this.getMemoriesDueForReview(userId);
    
    await this.updateUserAnalytics(userId, {
      totalMemories: userMemories.length,
      dueForReview: dueMemories.length,
    });
  }

  private async updateAnalyticsAfterMemoryDeletion(userId: number): Promise<void> {
    const userMemories = await this.getMemoriesByUser(userId);
    const dueMemories = await this.getMemoriesDueForReview(userId);
    
    await this.updateUserAnalytics(userId, {
      totalMemories: userMemories.length,
      dueForReview: dueMemories.length,
    });
  }
}

export const storage = new DatabaseStorage();
