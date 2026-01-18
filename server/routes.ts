import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySchema } from "@shared/schema";
import { registerInspireRoutes } from "./routes/inspire";
import { isAuthenticated } from "./replit_integrations/auth";
import { 
  getUserProgress, 
  getAllBadges, 
  recordStoryCreation, 
  seedBadges,
  LEVEL_THRESHOLDS 
} from "./progression";
import { generatePosterImage } from "./posterGenerator";
import { generateStoryNarrative } from "./storyGenerator";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user?.claims?.sub) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await seedBadges();
  
  registerInspireRoutes(app);
  
  app.get("/api/progression", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progression" });
    }
  });

  app.get("/api/badges", async (_req, res) => {
    try {
      const badges = await getAllBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  app.get("/api/levels", (_req, res) => {
    res.json({ thresholds: LEVEL_THRESHOLDS });
  });
  
  app.get("/api/stories", async (_req, res) => {
    try {
      const stories = await storage.getStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.get("/api/stories/my", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stories = await storage.getStoriesByUserId(userId);
      res.json(stories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.get("/api/stories/share/:shareableId", async (req, res) => {
    try {
      const { shareableId } = req.params;
      if (!shareableId || shareableId.length < 6) {
        return res.status(400).json({ error: "Invalid shareable ID" });
      }
      const story = await storage.getStoryByShareableId(shareableId);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch story" });
    }
  });

  app.get("/api/stories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid story ID" });
      }
      const story = await storage.getStory(id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch story" });
    }
  });

  app.post("/api/stories", async (req: any, res) => {
    try {
      const parseResult = insertStorySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid story data", details: parseResult.error.errors });
      }
      const userId = req.user?.claims?.sub;
      const story = await storage.createStory(parseResult.data, userId);
      
      let progression = null;
      if (userId) {
        try {
          const storyData = parseResult.data as { trackId: string };
          progression = await recordStoryCreation(userId, storyData.trackId);
        } catch (progError) {
          console.error("Failed to record progression:", progError);
        }
      }
      
      res.status(201).json({ story, progression });
    } catch (error) {
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  app.delete("/api/stories/:id", requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid story ID" });
      }
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteStory(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Story not found or not authorized" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete story" });
    }
  });

  app.post("/api/stories/generate", async (req, res) => {
    try {
      const { trackId, trackTitle, answers } = req.body;
      
      if (!trackId || !trackTitle || !answers) {
        return res.status(400).json({ error: "Missing required fields: trackId, trackTitle, answers" });
      }
      
      const narrative = await generateStoryNarrative({
        trackId,
        trackTitle,
        answers
      });
      
      res.json(narrative);
    } catch (error) {
      console.error("Error generating story narrative:", error);
      res.status(500).json({ error: "Failed to generate story narrative" });
    }
  });

  const posterGenerationTimestamps = new Map<string, number[]>();
  const RATE_LIMIT_WINDOW_MS = 60000;
  const MAX_REQUESTS_PER_WINDOW = 5;
  
  function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const timestamps = posterGenerationTimestamps.get(identifier) || [];
    const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    
    if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }
    
    recentTimestamps.push(now);
    posterGenerationTimestamps.set(identifier, recentTimestamps);
    return true;
  }

  app.post("/api/stories/:id/poster", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid story ID" });
      }
      
      const story = await storage.getStory(id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      
      const userId = req.user?.claims?.sub;
      if (story.userId && story.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to generate poster for this story" });
      }
      
      const rateLimitKey = userId || req.ip || "anonymous";
      if (!checkRateLimit(rateLimitKey)) {
        return res.status(429).json({ error: "Too many poster generation requests. Please try again later." });
      }
      
      if (story.posterUrl && story.posterStatus === "ready") {
        return res.json({ posterUrl: story.posterUrl, status: "ready" });
      }
      
      if (story.posterStatus === "generating") {
        return res.status(202).json({ status: "generating", message: "Poster generation already in progress" });
      }
      
      await storage.updateStoryPoster(id, null, "generating");
      res.status(202).json({ status: "generating", message: "Poster generation started" });
      
      (async () => {
        try {
          const posterUrl = await generatePosterImage({
            title: story.title,
            logline: story.logline,
            trackId: story.trackId,
            trackTitle: story.trackTitle,
            themes: story.themes,
            p1: story.p1,
            p2: story.p2,
            p3: story.p3,
          });
          
          if (posterUrl) {
            await storage.updateStoryPoster(id, posterUrl, "ready");
          } else {
            await storage.updateStoryPoster(id, null, "failed");
          }
        } catch (error) {
          console.error("Background poster generation error:", error);
          await storage.updateStoryPoster(id, null, "failed");
        }
      })();
    } catch (error) {
      console.error("Poster generation error:", error);
      res.status(500).json({ error: "Failed to generate poster" });
    }
  });

  app.get("/api/stories/:id/poster", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid story ID" });
      }
      
      const story = await storage.getStory(id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }
      
      res.json({ 
        posterUrl: story.posterUrl, 
        status: story.posterStatus || "pending" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch poster status" });
    }
  });

  // Open Graph metadata endpoint for story sharing
  app.get("/api/stories/:shareableId/og", async (req, res) => {
    try {
      const { shareableId } = req.params;
      const story = await storage.getStoryByShareableId(shareableId);
      
      if (!story) {
        return res.json({
          title: "Story Arcade",
          description: "Turn your story into cinematic legend.",
          image: null,
        });
      }
      
      res.json({
        title: story.title,
        description: story.logline,
        author: story.author,
        neighborhood: story.neighborhood,
        trackTitle: story.trackTitle,
        image: story.posterUrl || null,
        themes: story.themes,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch story metadata" });
    }
  });

  return httpServer;
}
