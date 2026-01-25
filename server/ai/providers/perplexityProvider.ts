import type { AIProvider, AIStoryInput, AIStoryOutput, AIPosterInput, AIPosterOutput } from "./aiProvider.interface";
import { storyLogger, posterLogger } from "../../logger";

export class PerplexityProvider implements AIProvider {
  private readonly name = "perplexity";
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = process.env.PERPLEXITY_API_KEY || process.env.perplex;
    
    if (!apiKey) {
      throw new Error("Perplexity API key is required but not provided");
    }
    
    this.apiKey = apiKey;
    this.baseUrl = "https://api.perplexity.ai";
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
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      const story = this.parseStoryJSON(text);

      if (!this.validateStory(story)) {
        throw new Error("Invalid story structure from AI response");
      }

      if (story.title.split(' ').length > 8) {
        story.title = story.title.split(' ').slice(0, 6).join(' ');
      }

      storyLogger.info({ provider: this.name }, "Successfully generated story with Perplexity");
      return story;
    } catch (error) {
      storyLogger.error({ err: error }, "Error generating story with Perplexity provider");
      throw error;
    }
  }

  async generatePoster(input: AIPosterInput): Promise<AIPosterOutput | null> {
    posterLogger.info({ provider: this.name }, "Perplexity does not support image generation");
    return null;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "user",
              content: "Say 'health check'"
            }
          ],
          max_tokens: 10,
        }),
      });

      return response.ok;
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
