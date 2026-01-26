import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStorySchema, updateStorySchema, insertDraftSchema, updateDraftSchema } from "@shared/schema";
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
import type {
  AuthenticatedRequest,
  OptionalAuthRequest,
} from "./types";
import type { DraftOwner } from "./storage";
import { routesLogger, posterLogger, rateLimitLogger } from "./logger";

/**
 * Extract the draft owner from the request.
 * For authenticated users: returns { userId }
 * For anonymous users: returns { sessionId } from X-Session-ID header
 */
function getDraftOwner(req: Request): DraftOwner | null {
  const optionalAuthReq = req as OptionalAuthRequest;
  const userId = optionalAuthReq.user?.claims?.sub;

  if (userId) {
    // Authenticated user - use their userId
    return { userId };
  }

  // Anonymous user - use X-Session-ID header
  const sessionId = req.headers['x-session-id'] as string | undefined;
  if (sessionId && sessionId.length >= 32 && sessionId.length <= 64) {
    return { sessionId };
  }

  return null;
}

/**
 * Check if a draft is owned by the given owner.
 */
function isDraftOwnedBy(draft: { userId?: string | null; sessionId?: string | null }, owner: DraftOwner): boolean {
  if (owner.userId) {
    return draft.userId === owner.userId;
  }
  if (owner.sessionId) {
    // Anonymous draft: must match sessionId AND have no userId
    return draft.sessionId === owner.sessionId && !draft.userId;
  }
  return false;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as OptionalAuthRequest).user;
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
  
  app.get("/api/progression", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.claims.sub;
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

  app.get("/api/stories/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.claims.sub;
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

  app.post("/api/stories", async (req: Request, res: Response) => {
    try {
      const parseResult = insertStorySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid story data", details: parseResult.error.errors });
      }
      const optionalAuthReq = req as OptionalAuthRequest;
      const userId = optionalAuthReq.user?.claims?.sub;
      const story = await storage.createStory(parseResult.data, userId);

      let progression = null;
      if (userId) {
        try {
          const storyData = parseResult.data as { trackId: string };
          progression = await recordStoryCreation(userId, storyData.trackId);
        } catch (progError) {
          routesLogger.error({ err: progError, userId }, 'Failed to record progression');
        }
      }

      res.status(201).json({ story, progression });
    } catch (error) {
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  app.delete("/api/stories/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid story ID" });
      }
      const userId = authReq.user.claims.sub;
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
      routesLogger.error({ err: error }, 'Error generating story narrative');
      res.status(500).json({ error: "Failed to generate story narrative" });
    }
  });

  // Rate limiting for poster generation
  const posterGenerationTimestamps = new Map<string, number[]>();
  const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
  const MAX_REQUESTS_PER_WINDOW = 5;
  const CLEANUP_INTERVAL_MS = 60000; // Clean up every minute

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

  // Periodic cleanup to prevent memory leak from stale rate-limit entries
  function cleanupRateLimitMap(): void {
    const now = Date.now();
    let removedCount = 0;

    // Use Array.from() for compatibility with older ES targets
    const entries = Array.from(posterGenerationTimestamps.entries());
    for (const [identifier, timestamps] of entries) {
      // Filter to only recent timestamps
      const recentTimestamps = timestamps.filter((t: number) => now - t < RATE_LIMIT_WINDOW_MS);

      if (recentTimestamps.length === 0) {
        // No recent activity - remove the entry entirely
        posterGenerationTimestamps.delete(identifier);
        removedCount++;
      } else if (recentTimestamps.length < timestamps.length) {
        // Some old timestamps - update with only recent ones
        posterGenerationTimestamps.set(identifier, recentTimestamps);
      }
    }

    if (removedCount > 0) {
      rateLimitLogger.info({ removedCount, activeCount: posterGenerationTimestamps.size }, 'Cleaned up stale rate-limit entries');
    }
  }

  // Start periodic cleanup (runs every minute)
  const rateLimitCleanupInterval = setInterval(cleanupRateLimitMap, CLEANUP_INTERVAL_MS);
  // Ensure cleanup interval doesn't prevent process exit
  rateLimitCleanupInterval.unref();

  app.post("/api/stories/:id/poster", async (req: Request, res: Response) => {
    try {
      const optionalAuthReq = req as OptionalAuthRequest;
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        posterLogger.warn({ rawId: req.params.id }, 'Invalid story ID received');
        return res.status(400).json({ error: "Invalid story ID" });
      }

      posterLogger.debug({ storyId: id }, 'Received poster generation request');

      const story = await storage.getStory(id);
      if (!story) {
        posterLogger.debug({ storyId: id }, 'Story not found');
        return res.status(404).json({ error: "Story not found" });
      }

      const userId = optionalAuthReq.user?.claims?.sub;
      if (story.userId && story.userId !== userId) {
        posterLogger.warn({ storyId: id, userId }, 'Unauthorized access attempt');
        return res.status(403).json({ error: "Not authorized to generate poster for this story" });
      }

      const rateLimitKey = userId || req.ip || "anonymous";
      if (!checkRateLimit(rateLimitKey)) {
        rateLimitLogger.info({ key: rateLimitKey }, 'Rate limit exceeded');
        return res.status(429).json({ error: "Too many poster generation requests. Please try again later." });
      }

      if (story.posterUrl && story.posterStatus === "ready") {
        posterLogger.debug({ storyId: id }, 'Returning existing ready poster');
        return res.json({ posterUrl: story.posterUrl, status: "ready" });
      }

      if (story.posterStatus === "generating") {
        posterLogger.debug({ storyId: id }, 'Poster already generating');
        return res.status(202).json({ status: "generating", message: "Poster generation already in progress" });
      }

      posterLogger.info({
        storyId: id,
        title: story.title,
        trackId: story.trackId,
        geminiKeyConfigured: !!process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
      }, '[POSTER_ROUTE] Starting poster generation');
      await storage.updateStoryPoster(id, null, "generating");
      res.status(202).json({ status: "generating", message: "Poster generation started" });

      (async () => {
        const bgStartTime = Date.now();
        try {
          posterLogger.debug({
            storyId: id,
            title: story.title,
            loglineLength: story.logline?.length || 0,
            themesCount: story.themes?.length || 0,
          }, '[POSTER_ROUTE] Calling generatePosterImage');

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

          const bgDuration = Date.now() - bgStartTime;

          if (posterUrl) {
            posterLogger.info({
              storyId: id,
              durationMs: bgDuration,
              posterUrlLength: posterUrl.length,
              posterUrlPrefix: posterUrl.substring(0, 50),
            }, '[POSTER_ROUTE] Successfully generated poster, updating DB');
            await storage.updateStoryPoster(id, posterUrl, "ready");
          } else {
            posterLogger.warn({
              storyId: id,
              durationMs: bgDuration,
            }, '[POSTER_ROUTE] generatePosterImage returned null, setting status to failed');
            await storage.updateStoryPoster(id, null, "failed");
          }
        } catch (error: any) {
          const bgDuration = Date.now() - bgStartTime;
          posterLogger.error({
            err: error,
            storyId: id,
            durationMs: bgDuration,
            errorMessage: error?.message,
            errorName: error?.name,
          }, '[POSTER_ROUTE] Background poster generation error');
          await storage.updateStoryPoster(id, null, "failed");
        }
      })();
    } catch (error) {
      posterLogger.error({ err: error }, 'Poster generation error');
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

  // Update a story (for edit flow) - requires authentication and ownership
  app.put("/api/stories/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const id = parseInt(req.params.id as string);
      const userId = authReq.user.claims.sub;

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid story ID" });
      }

      const story = await storage.getStory(id);
      if (!story) {
        return res.status(404).json({ error: "Story not found" });
      }

      // Verify ownership: story must belong to authenticated user
      // Public stories (userId === null) cannot be edited
      if (!story.userId || story.userId !== userId) {
        return res.status(403).json({ error: "You can only edit your own stories" });
      }

      // Validate update payload
      const parseResult = updateStorySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid update data",
          details: parseResult.error.flatten()
        });
      }

      const updatedStory = await storage.updateStory(id, parseResult.data);
      res.json(updatedStory);
    } catch (error) {
      routesLogger.error({ err: error }, 'Error updating story');
      res.status(500).json({ error: "Failed to update story" });
    }
  });

  // ============ DRAFTS API ============
  // Ownership is determined by:
  // - Authenticated users: userId from session (via cookie)
  // - Anonymous users: sessionId from X-Session-ID header

  // Get all drafts for the current owner
  app.get("/api/drafts", async (req, res) => {
    try {
      const owner = getDraftOwner(req);
      if (!owner) {
        return res.status(400).json({ error: "Session ID required (X-Session-ID header) or authentication" });
      }

      const ownerDrafts = await storage.getDraftsByOwner(owner);
      res.json(ownerDrafts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drafts" });
    }
  });

  // Get a single draft (requires ownership verification)
  app.get("/api/drafts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid draft ID" });
      }

      const owner = getDraftOwner(req);
      if (!owner) {
        return res.status(400).json({ error: "Session ID required (X-Session-ID header) or authentication" });
      }

      const draft = await storage.getDraft(id);
      if (!draft) {
        return res.status(404).json({ error: "Draft not found" });
      }

      // Verify ownership
      if (!isDraftOwnedBy(draft, owner)) {
        return res.status(403).json({ error: "Not authorized to access this draft" });
      }

      res.json(draft);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch draft" });
    }
  });

  // Create a new draft (with Zod validation)
  app.post("/api/drafts", async (req, res) => {
    try {
      const owner = getDraftOwner(req);
      if (!owner) {
        return res.status(400).json({ error: "Session ID required (X-Session-ID header) or authentication" });
      }

      // Build draft data with owner info
      const draftInput = {
        ...req.body,
        // Set owner fields based on auth status
        userId: owner.userId || null,
        sessionId: owner.sessionId || null,
        currentQuestionIndex: req.body.currentQuestionIndex ?? 0,
      };

      const parseResult = insertDraftSchema.safeParse(draftInput);

      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid draft data",
          details: parseResult.error.flatten()
        });
      }

      const draft = await storage.createDraft(parseResult.data);
      res.status(201).json(draft);
    } catch (error) {
      routesLogger.error({ err: error }, 'Error creating draft');
      res.status(500).json({ error: "Failed to create draft" });
    }
  });

  // Update a draft (with Zod validation and ownership verification)
  app.put("/api/drafts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid draft ID" });
      }

      const owner = getDraftOwner(req);
      if (!owner) {
        return res.status(400).json({ error: "Session ID required (X-Session-ID header) or authentication" });
      }

      // Fetch draft first to verify ownership
      const existingDraft = await storage.getDraft(id);
      if (!existingDraft) {
        return res.status(404).json({ error: "Draft not found" });
      }

      // Verify ownership
      if (!isDraftOwnedBy(existingDraft, owner)) {
        return res.status(403).json({ error: "Not authorized to update this draft" });
      }

      const parseResult = updateDraftSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid update data",
          details: parseResult.error.flatten()
        });
      }

      const draft = await storage.updateDraft(id, parseResult.data);
      if (!draft) {
        return res.status(404).json({ error: "Draft not found" });
      }
      res.json(draft);
    } catch (error) {
      res.status(500).json({ error: "Failed to update draft" });
    }
  });

  // Delete a draft (with ownership verification)
  app.delete("/api/drafts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid draft ID" });
      }

      const owner = getDraftOwner(req);
      if (!owner) {
        return res.status(400).json({ error: "Session ID required (X-Session-ID header) or authentication" });
      }

      // Fetch draft first to verify ownership and distinguish 404 from 403
      const existingDraft = await storage.getDraft(id);
      if (!existingDraft) {
        return res.status(404).json({ error: "Draft not found" });
      }

      // Verify ownership
      if (!isDraftOwnedBy(existingDraft, owner)) {
        return res.status(403).json({ error: "Not authorized to delete this draft" });
      }

      const deleted = await storage.deleteDraft(id, owner);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete draft" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete draft" });
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
