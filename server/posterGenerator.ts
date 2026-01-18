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
}

function buildPosterPrompt(story: StoryData): string {
  const trackThemes: Record<string, string> = {
    origin: "personal transformation, identity journey, dramatic lighting, emotional depth",
    future: "futuristic cityscape, neon lights, cyberpunk aesthetics, hopeful dystopia",
    legend: "urban mythology, neighborhood magic, street art vibes, community spirit",
  };

  const trackStyle = trackThemes[story.trackId] || trackThemes.origin;
  const themeKeywords = story.themes.slice(0, 3).join(", ");

  return `Create a cinematic movie poster image for a story.

STORY DETAILS:
Title: "${story.title}"
Tagline: "${story.logline}"
Themes: ${themeKeywords}
Opening: "${story.p1.slice(0, 150)}..."

STYLE REQUIREMENTS:
- Cinematic movie poster composition with dramatic lighting
- ${trackStyle}
- Bold, evocative imagery that captures the story's essence
- Rich color palette with high contrast
- Professional quality, suitable for sharing on social media
- No text or words in the image - purely visual
- Aspect ratio: portrait (movie poster style)
- Moody, atmospheric, and visually striking

Generate a compelling visual that would make someone want to read this story.`;
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
