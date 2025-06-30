import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertMemorySchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'memory-boost-secret',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    }),
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name 
        } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(credentials.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValid = await storage.verifyPassword(credentials.password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name 
        } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      } 
    });
  });

  // Memory routes
  app.get("/api/memories", requireAuth, async (req, res) => {
    try {
      const memories = await storage.getMemoriesByUser(req.session.userId);
      res.json(memories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });

  app.get("/api/memories/due", requireAuth, async (req, res) => {
    try {
      const memories = await storage.getMemoriesDueForReview(req.session.userId);
      res.json(memories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch due memories" });
    }
  });

  app.get("/api/memories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const memory = await storage.getMemory(id);
      
      if (!memory || memory.userId !== req.session.userId) {
        return res.status(404).json({ message: "Memory not found" });
      }

      res.json(memory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch memory" });
    }
  });

  app.post("/api/memories", requireAuth, async (req, res) => {
    try {
      const memoryData = insertMemorySchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const memory = await storage.createMemory(memoryData);
      res.json(memory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create memory" });
    }
  });

  app.put("/api/memories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const memory = await storage.getMemory(id);
      
      if (!memory || memory.userId !== req.session.userId) {
        return res.status(404).json({ message: "Memory not found" });
      }

      const updates = req.body;
      const updatedMemory = await storage.updateMemory(id, updates);
      res.json(updatedMemory);
    } catch (error) {
      res.status(500).json({ message: "Failed to update memory" });
    }
  });

  app.delete("/api/memories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const memory = await storage.getMemory(id);
      
      if (!memory || memory.userId !== req.session.userId) {
        return res.status(404).json({ message: "Memory not found" });
      }

      const success = await storage.deleteMemory(id);
      if (success) {
        res.json({ message: "Memory deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete memory" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete memory" });
    }
  });

  // Review routes
  app.post("/api/memories/:id/review", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { score, notes } = req.body;
      
      const memory = await storage.getMemory(id);
      if (!memory || memory.userId !== req.session.userId) {
        return res.status(404).json({ message: "Memory not found" });
      }

      // Calculate next review date using spaced repetition
      const now = new Date();
      const reviewCount = memory.reviewCount + 1;
      let intervalDays = 1;

      // Simple spaced repetition algorithm
      switch (score) {
        case 0: // Again
          intervalDays = 1;
          break;
        case 1: // Hard
          intervalDays = Math.max(1, Math.floor(reviewCount * 0.5));
          break;
        case 2: // Good
          intervalDays = Math.max(1, reviewCount * 2);
          break;
        case 3: // Easy
          intervalDays = Math.max(1, reviewCount * 4);
          break;
      }

      const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

      // Update review history
      const reviewHistory = Array.isArray(memory.reviewHistory) ? memory.reviewHistory : [];
      reviewHistory.push({
        timestamp: now.toISOString(),
        score,
        interval: intervalDays,
        notes: notes || null,
      });

      const updatedMemory = await storage.updateMemory(id, {
        nextReview,
        reviewCount,
        lastScore: score,
        reviewHistory,
      });

      // Update user analytics
      await updateUserAnalyticsAfterReview(req.session.userId);

      res.json(updatedMemory);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const analytics = await storage.getUserAnalytics(req.session.userId);
      if (!analytics) {
        return res.status(404).json({ message: "Analytics not found" });
      }
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Helper function to update analytics after review
  async function updateUserAnalyticsAfterReview(userId: number) {
    const memories = await storage.getMemoriesByUser(userId);
    const dueMemories = await storage.getMemoriesDueForReview(userId);
    
    // Calculate accuracy rate
    const reviewedMemories = memories.filter(m => m.reviewCount > 0);
    const totalReviews = reviewedMemories.reduce((sum, m) => sum + m.reviewCount, 0);
    const goodReviews = reviewedMemories.reduce((sum, m) => {
      const history = Array.isArray(m.reviewHistory) ? m.reviewHistory : [];
      return sum + history.filter((r: any) => r.score >= 2).length;
    }, 0);
    
    const accuracyRate = totalReviews > 0 ? (goodReviews / totalReviews) * 100 : 0;
    
    // Calculate average recall score
    const avgRecallScore = totalReviews > 0 ? 
      reviewedMemories.reduce((sum, m) => sum + (m.lastScore || 0), 0) / reviewedMemories.length : 0;

    await storage.updateUserAnalytics(userId, {
      totalMemories: memories.length,
      dueForReview: dueMemories.length,
      accuracyRate,
      avgRecallScore,
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
