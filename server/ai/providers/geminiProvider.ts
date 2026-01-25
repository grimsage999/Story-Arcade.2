import { GoogleGenAI } from "@google/genai";
import type { AIProvider, AIStoryInput, AIStoryOutput, AIPosterInput, AIPosterOutput } from "./aiProvider.interface";
import { storyLogger, posterLogger } from "../../logger";

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private readonly name = "gemini";

  constructor() {
    const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
    
    if (!apiKey) {
      throw new Error("Gemini API key is required but not provided");
    }
    
    this.ai = new GoogleGenAI({
      apiKey,
      httpOptions: baseUrl ? {
        baseUrl,
      } : undefined,
    });
  }

  async generateStory(input: AIStoryInput): Promise<AIStoryOutput> {
    const { trackId, trackTitle, answers } = input;

    const trackContext = this.getTrackContext(trackId);

    const prompt = `You are a master storyteller for Story Arcade, transforming casual answers into captivating cinematic micro-narratives. Your job is NOT to repeat the user's words - it's to create an entirely NEW story inspired by their answers.

TRACK: ${trackTitle}
NARRATIVE STYLE: ${trackContext}

USER'S RAW ANSWERS (use as inspiration, NOT to copy):
- Setting/Hook: ${answers.hook || "Not provided"}
- Sensory Detail: ${answers.sensory || "Not provided"}
- Challenge/Drama: ${answers.challenge || "Not provided"}
- Hero/Reflection: ${answers.reflection || "Not provided"}
- Resolution/New Reality: ${answers.resolution || "Not provided"}

CRITICAL RULES - You MUST follow these:
1. DO NOT copy or quote the user's exact words. Transform their ideas into vivid new prose.
2. Write in third person narrative voice (like a movie narrator)
3. Create actual scenes with characters, settings, and dramatic tension
4. Each paragraph should flow into the next like a movie trailer
5. Use evocative, cinematic language - metaphors, vivid imagery, emotional beats
6. The story should feel complete with a beginning, middle, and end

TITLE REQUIREMENTS:
- Must be 3-6 words (no more than 6 words)
- Creative and evocative (like a movie title)
- Capitalized properly (Title Case)
- Examples of good titles: "The Last Coffee Shop", "Neon Dreams at Midnight", "Where Heroes Find Home"

STRUCTURE YOUR STORY:
- Paragraph 1 (p1): Set the scene with vivid atmosphere. Introduce the setting and hint at what's to come.
- Paragraph 2 (p2): The heart of the story - the challenge, the struggle, the moment of truth.
- Paragraph 3 (p3): The transformation - how everything changed, the new reality that emerged.

Each paragraph should be 2-3 sentences of rich, cinematic prose.

Respond with ONLY valid JSON in this exact format (no other text):
{
  "title": "A Creative Movie-Style Title",
  "logline": "A compelling one-sentence hook that captures the story's essence.",
  "themes": ["Theme1", "Theme2", "Theme3"],
  "insight": "A brief reflection on what makes this story meaningful.",
  "p1": "The atmospheric opening paragraph that sets the scene.",
  "p2": "The dramatic middle paragraph with tension and struggle.",
  "p3": "The transformative closing paragraph showing change and hope."
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = response.text || "";
      const story = this.parseStoryJSON(text);

      if (!this.validateStory(story)) {
        throw new Error("Invalid story structure from AI response");
      }

      if (story.title.split(' ').length > 8) {
        story.title = story.title.split(' ').slice(0, 6).join(' ');
      }

      storyLogger.info({ provider: this.name }, "Successfully generated story with Gemini");
      return story;
    } catch (error) {
      storyLogger.error({ err: error }, "Error generating story with Gemini provider");
      throw error;
    }
  }

  async generatePoster(input: AIPosterInput): Promise<AIPosterOutput | null> {
    try {
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

      const style = trackStyles[input.trackId] || trackStyles.origin;
      const themeKeywords = input.themes.slice(0, 3).join(", ");
      const storyContent = [input.p1, input.p2, input.p3].filter(Boolean).join(" ");
      const storyExcerpt = storyContent.slice(0, 300);

      const prompt = `Create a stunning cinematic movie poster for this story:

STORY: "${input.title}"
"${input.logline}"

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

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts || parts.length === 0) {
        posterLogger.warn({ provider: this.name }, "No parts in Gemini response");
        return null;
      }

      for (const part of parts) {
        if (part.inlineData?.data && part.inlineData?.mimeType) {
          posterLogger.info({ provider: this.name }, "Successfully generated poster with Gemini");
          return {
            imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
          };
        }
      }

      return null;
    } catch (error) {
      posterLogger.error({ err: error }, "Error generating poster with Gemini provider");
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: "Say 'health check'" }] }],
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  getName(): string {
    return this.name;
  }

  private parseStoryJSON(text: string): AIStoryOutput {
    let cleanText = text.trim();

    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find JSON in response");
    }

    return JSON.parse(jsonMatch[0]) as AIStoryOutput;
  }

  private validateStory(story: unknown): story is AIStoryOutput {
    if (!story || typeof story !== 'object') return false;
    const s = story as Record<string, unknown>;

    return (
      typeof s.title === 'string' && s.title.length > 0 &&
      typeof s.logline === 'string' && s.logline.length > 0 &&
      typeof s.insight === 'string' &&
      typeof s.p1 === 'string' && s.p1.length > 0 &&
      typeof s.p2 === 'string' && s.p2.length > 0 &&
      typeof s.p3 === 'string' && s.p3.length > 0 &&
      Array.isArray(s.themes) &&
      s.themes.every((t: unknown) => typeof t === 'string')
    );
  }

  private getTrackContext(trackId: string): string {
    switch (trackId) {
      case "origin":
        return "Origin Story - A personal tale of transformation. Write about a defining moment that shaped someone's identity. Focus on growth, courage, and finding one's authentic voice. Think coming-of-age drama.";
      case "future":
        return "Future City (2036) - An optimistic vision of tomorrow. Write about a neighborhood transformed by hope and innovation. Focus on community triumph, technological wonder, and positive change. Think hopeful sci-fi.";
      case "legend":
        return "Neighborhood Legend - Urban mythology and street magic. Write about something strange and wonderful happening on the block. Focus on mystery, wonder, and the magic hidden in everyday places. Think magical realism.";
      default:
        return "A story of community and personal transformation with cinematic flair.";
    }
  }
}
