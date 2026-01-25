import { GoogleGenAI } from "@google/genai";
import pRetry from "p-retry";
import { AIManager } from "./ai/aiManager";
import { posterLogger } from "./logger";

let ai: GoogleGenAI;
const aiManager = new AIManager();

// Initialize AI client with fallback for missing API key
if (process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
    httpOptions: {
      apiVersion: "",
      baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || "",
    },
  });
} else {
  posterLogger.warn("AI_INTEGRATIONS_GEMINI_API_KEY not found. Poster generation will use fallback.");
  // Create a mock AI client that will trigger fallback behavior
  ai = {} as GoogleGenAI;
}

interface StoryData {
  title: string;
  logline: string;
  trackId: string;
  trackTitle: string;
  themes: string[];
  p1: string;
  p2?: string;
  p3?: string;
}

function buildPosterPrompt(story: StoryData): string {
  const trackStyles: Record<string, { visual: string; mood: string; colors: string }> = {
    origin: {
      visual: "intimate portrait style, single figure silhouette, dramatic shadows",
      mood: "introspective, transformative, deeply personal",
      colors: "warm amber tones, deep shadows, golden hour lighting"
    },
    future: {
      visual: "futuristic cityscape, neon-lit streets, holographic elements, flying vehicles",
      mood: "hopeful, innovative, community-focused",
      colors: "cyan and magenta neon, deep blues, electric highlights"
    },
    legend: {
      visual: "urban street scene, magical elements emerging, neighborhood setting",
      mood: "mysterious, whimsical, folkloric magic",
      colors: "twilight purples, street lamp gold, ethereal glows"
    },
  };

  const style = trackStyles[story.trackId] || trackStyles.origin;
  const themeKeywords = story.themes.slice(0, 3).join(", ");

  // Use full story content for visual inspiration
  const storyContent = [story.p1, story.p2, story.p3].filter(Boolean).join(" ");
  const storyExcerpt = storyContent.slice(0, 300);

  return `Create a stunning cinematic movie poster for this story:

STORY: "${story.title}"
"${story.logline}"

NARRATIVE ESSENCE:
${storyExcerpt}

KEY THEMES: ${themeKeywords}

VISUAL DIRECTION:
- Style: ${style.visual}
- Mood: ${style.mood}
- Color palette: ${style.colors}

POSTER REQUIREMENTS:
- Cinematic movie poster composition (portrait orientation)
- Dramatic lighting that evokes the story's emotional core
- Visual elements that directly relate to the story's content
- Bold, evocative imagery - this should feel like a real movie poster
- High production value, theatrical quality
- ABSOLUTELY NO TEXT OR WORDS in the image - purely visual
- The image should make viewers curious about the story

Create an image that captures the soul of this specific story.`;
}

export async function generatePosterImage(story: StoryData): Promise<string | null> {
  try {
    // First try using the AI manager which may have a provider that supports poster generation
    const result = await aiManager.generatePoster({
      title: story.title,
      logline: story.logline,
      trackId: story.trackId,
      trackTitle: story.trackTitle,
      themes: story.themes,
      p1: story.p1,
      p2: story.p2,
      p3: story.p3
    });

    if (result && result.imageUrl) {
      posterLogger.info({ storyTitle: story.title }, "Successfully generated poster via AI manager");
      return result.imageUrl;
    }

    // If AI manager didn't provide a result, fall back to the original Gemini implementation
    if (!process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
      posterLogger.info("Skipping AI poster generation due to missing API key, using fallback");
      return generateFallbackPoster(story);
    }

    // Log the API key and base URL availability for debugging
    posterLogger.info({ storyTitle: story.title }, "Poster generation started");
    posterLogger.debug({
      apiKeyAvailable: !!process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
      baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
    }, "AI configuration");

    const prompt = buildPosterPrompt(story);
    posterLogger.debug({ promptLength: prompt.length }, "Generated poster prompt");

    const resultOriginal = await pRetry(
      async () => {
        posterLogger.debug("Attempting to call Gemini API...");
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: prompt,
        });

        posterLogger.debug("Gemini API response received, checking candidates...");
        const parts = response.candidates?.[0]?.content?.parts;
        if (!parts || parts.length === 0) {
          posterLogger.error({ response }, "No parts in Gemini response");
          throw new Error("No image generated");
        }

        for (const part of parts) {
          posterLogger.debug({ partType: typeof part, hasInlineData: !!part.inlineData }, "Processing part");
          if (part.inlineData?.data && part.inlineData?.mimeType) {
            posterLogger.info("Successfully generated image data");
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }

        posterLogger.error({ partsCount: parts.length }, "No image data found in response parts");
        throw new Error("No image data in response");
      },
      {
        retries: 3,
        minTimeout: 2000,
        maxTimeout: 10000,
        factor: 2,
      }
    );

    posterLogger.info("Poster generation completed successfully");
    return resultOriginal;
  } catch (error: any) {
    posterLogger.error({
      err: error,
      name: error?.name,
      status: error?.status,
      code: error?.code,
    }, "Poster generation failed");

    // If AI generation fails, fall back to generating a simple poster
    posterLogger.info("Using fallback poster generation due to AI failure");
    return generateFallbackPoster(story);
  }
}

// Fallback function to generate a simple SVG poster when AI generation fails
function generateFallbackPoster(story: StoryData): string {
  posterLogger.info({ storyTitle: story.title }, "Generating fallback SVG poster");

  // Determine gradient based on track
  const trackGradients: Record<string, { start: string; end: string }> = {
    origin: { start: '#FF6B35', end: '#F7931E' }, // Amber/orange
    future: { start: '#00CED1', end: '#1E90FF' }, // Cyan/blue
    legend: { start: '#9932CC', end: '#FF1493' }  // Purple/pink
  };

  const gradientDef = trackGradients[story.trackId] || trackGradients.origin;

  // Create SVG content
  const svgWidth = 600;
  const svgHeight = 900;

  // Escape text for SVG
  const escapeXml = (str: string) => {
    return str.replace(/[&<>"']/g, (s) => {
      const entityMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
      };
      return entityMap[s];
    });
  };

  // Create a simple layout with title, logline, and themes
  const svgContent = `
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${gradientDef.start}" />
          <stop offset="100%" stop-color="${gradientDef.end}" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bgGradient)" />

      <!-- Title -->
      <text x="50%" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="white" font-weight="bold">
        ${escapeXml(story.title.toUpperCase())}
      </text>

      <!-- Logline -->
      <text x="50%" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="white" font-style="italic">
        "${escapeXml(story.logline)}"
      </text>

      <!-- Themes -->
      ${story.themes.slice(0, 3).map((theme, index) =>
        `<text x="50%" y="${450 + index * 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)">
          ${escapeXml(theme.toUpperCase())}
        </text>`
      ).join('')}

      <!-- Track Badge -->
      <polygon points="${svgWidth-60},20 ${svgWidth-20},20 ${svgWidth-20},60" fill="rgba(0,0,0,0.5)" />
      <text x="${svgWidth-25}" y="45" text-anchor="end" font-family="Arial, sans-serif" font-size="14" fill="white" font-weight="bold">
        ${escapeXml(story.trackTitle.substring(0, 8))}
      </text>

      <!-- Decorative elements -->
      <circle cx="${svgWidth/2}" cy="${svgHeight/2}" r="150" fill="rgba(255,255,255,0.05)" />
      <circle cx="${svgWidth/2}" cy="${svgHeight/2}" r="200" fill="rgba(255,255,255,0.02)" />
    </svg>
  `;

  // Convert SVG to base64 data URL
  const base64 = Buffer.from(svgContent.trim()).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
