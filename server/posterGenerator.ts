import { GoogleGenAI } from "@google/genai";
import pRetry from "p-retry";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

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
    const prompt = buildPosterPrompt(story);

    const result = await pRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: prompt,
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (!parts || parts.length === 0) {
          throw new Error("No image generated");
        }

        for (const part of parts) {
          if (part.inlineData?.data && part.inlineData?.mimeType) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }

        throw new Error("No image data in response");
      },
      {
        retries: 3,
        minTimeout: 2000,
        maxTimeout: 10000,
        factor: 2,
      }
    );

    return result;
  } catch (error) {
    console.error("Poster generation failed:", error);
    return null;
  }
}
