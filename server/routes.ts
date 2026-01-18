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
          progression = await recordStoryCreation(userId, parseResult.data.trackId);
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

  return httpServer;
}
