import { users, memories, userAnalytics, type User, type InsertUser, type Memory, type InsertMemory, type UserAnalytics, type InsertUserAnalytics } from "@shared/schema";
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private memories: Map<number, Memory>;
  private userAnalytics: Map<number, UserAnalytics>;
  private currentUserId: number;
  private currentMemoryId: number;
  private currentAnalyticsId: number;

  constructor() {
    this.users = new Map();
    this.memories = new Map();
    this.userAnalytics = new Map();
    this.currentUserId = 1;
    this.currentMemoryId = 1;
    this.currentAnalyticsId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(id, user);

    // Create initial analytics record
    await this.createUserAnalytics({ userId: id });

    return user;
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async getMemory(id: number): Promise<Memory | undefined> {
    return this.memories.get(id);
  }

  async getMemoriesByUser(userId: number): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(memory => memory.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getMemoriesDueForReview(userId: number): Promise<Memory[]> {
    const now = new Date();
    return Array.from(this.memories.values())
      .filter(memory => memory.userId === userId && new Date(memory.nextReview) <= now)
      .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const id = this.currentMemoryId++;
    const now = new Date();
    const memory: Memory = {
      ...insertMemory,
      id,
      nextReview: now,
      reviewCount: 0,
      lastScore: 0,
      reviewHistory: [],
      transcribedAudio: null,
      sentimentScore: null,
      aiSuggestedTags: [],
      createdAt: now,
      updatedAt: now,
    };
    this.memories.set(id, memory);

    // Update user analytics
    await this.updateAnalyticsAfterMemoryCreation(insertMemory.userId);

    return memory;
  }

  async updateMemory(id: number, updates: Partial<Memory>): Promise<Memory | undefined> {
    const memory = this.memories.get(id);
    if (!memory) return undefined;

    const updatedMemory: Memory = {
      ...memory,
      ...updates,
      updatedAt: new Date(),
    };
    this.memories.set(id, updatedMemory);
    return updatedMemory;
  }

  async deleteMemory(id: number): Promise<boolean> {
    const memory = this.memories.get(id);
    if (!memory) return false;

    this.memories.delete(id);
    await this.updateAnalyticsAfterMemoryDeletion(memory.userId);
    return true;
  }

  async getUserAnalytics(userId: number): Promise<UserAnalytics | undefined> {
    return Array.from(this.userAnalytics.values()).find(
      analytics => analytics.userId === userId
    );
  }

  async createUserAnalytics(insertAnalytics: InsertUserAnalytics): Promise<UserAnalytics> {
    const id = this.currentAnalyticsId++;
    const analytics: UserAnalytics = {
      ...insertAnalytics,
      id,
      totalMemories: 0,
      dueForReview: 0,
      reviewStreak: 0,
      accuracyRate: 0,
      retentionRates: {},
      reviewConsistency: 0,
      avgRecallScore: 0,
      insights: [],
      updatedAt: new Date(),
    };
    this.userAnalytics.set(id, analytics);
    return analytics;
  }

  async updateUserAnalytics(userId: number, updates: Partial<UserAnalytics>): Promise<UserAnalytics | undefined> {
    let analytics = await this.getUserAnalytics(userId);
    if (!analytics) return undefined;

    const updatedAnalytics: UserAnalytics = {
      ...analytics,
      ...updates,
      updatedAt: new Date(),
    };
    this.userAnalytics.set(analytics.id, updatedAnalytics);
    return updatedAnalytics;
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

export const storage = new MemStorage();
