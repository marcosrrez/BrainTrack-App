import { users, memories, userAnalytics, type User, type InsertUser, type Memory, type InsertMemory, type UserAnalytics, type InsertUserAnalytics } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;

  // Memory operations
  getMemory(id: number): Promise<Memory | undefined>;
  getMemoriesByUser(userId: number): Promise<Memory[]>;
  getMemoriesDueForReview(userId: number): Promise<Memory[]>;
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
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();

    // Create initial analytics record
    await this.createUserAnalytics({ userId: user.id });

    return user;
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async getMemory(id: number): Promise<Memory | undefined> {
    const [memory] = await db.select().from(memories).where(eq(memories.id, id));
    return memory || undefined;
  }

  async getMemoriesByUser(userId: number): Promise<Memory[]> {
    return await db
      .select()
      .from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(memories.createdAt);
  }

  async getMemoriesDueForReview(userId: number): Promise<Memory[]> {
    const now = new Date();
    const { and, lte } = await import("drizzle-orm");
    return await db
      .select()
      .from(memories)
      .where(and(
        eq(memories.userId, userId),
        lte(memories.nextReview, now)
      ))
      .orderBy(memories.nextReview);
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
