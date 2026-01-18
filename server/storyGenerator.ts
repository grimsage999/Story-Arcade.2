import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

interface StoryInput {
  trackId: string;
  trackTitle: string;
  answers: {
    hook?: string;
    sensory?: string;
    challenge?: string;
    reflection?: string;
    resolution?: string;
  };
}

interface GeneratedStory {
  title: string;
  logline: string;
  themes: string[];
  insight: string;
  p1: string;
  p2: string;
  p3: string;
}

export async function generateStoryNarrative(input: StoryInput): Promise<GeneratedStory> {
  const { trackId, trackTitle, answers } = input;
  
  const trackContext = getTrackContext(trackId);
  
  const prompt = `You are a creative storyteller crafting cinematic micro-narratives. Based on the user's casual, fun answers to ice breaker questions, transform their responses into an engaging 3-paragraph story.

TRACK: ${trackTitle}
CONTEXT: ${trackContext}

USER'S ANSWERS:
- Setting/Hook: ${answers.hook || "Not provided"}
- Sensory Detail: ${answers.sensory || "Not provided"}  
- Challenge/Drama: ${answers.challenge || "Not provided"}
- Hero/Reflection: ${answers.reflection || "Not provided"}
- Resolution/New Reality: ${answers.resolution || "Not provided"}

Create a short, engaging story based on these answers. The story should:
1. Feel cinematic and vivid, like a movie trailer
2. Be warm, uplifting, and fun (matching the casual ice breaker tone)
3. Transform their simple answers into something more poetic and narrative
4. Be exactly 3 paragraphs (labeled p1, p2, p3)
5. Each paragraph should be 2-3 sentences max

Also generate:
- A catchy title (5-8 words, creative and memorable)
- A logline (one sentence that hooks readers)
- 2-3 themes (single words like "Hope", "Community", "Magic")
- An insight (one short sentence about what makes this story special)

Respond in this exact JSON format:
{
  "title": "Your Creative Title Here",
  "logline": "A one-sentence hook that makes people want to read more.",
  "themes": ["Theme1", "Theme2", "Theme3"],
  "insight": "What makes this story resonate.",
  "p1": "First paragraph of the story.",
  "p2": "Second paragraph of the story.", 
  "p3": "Third paragraph of the story."
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from response");
    }

    const story = JSON.parse(jsonMatch[0]) as GeneratedStory;
    
    if (
      typeof story.title !== 'string' ||
      typeof story.p1 !== 'string' ||
      typeof story.p2 !== 'string' ||
      typeof story.p3 !== 'string' ||
      typeof story.logline !== 'string' ||
      typeof story.insight !== 'string' ||
      !Array.isArray(story.themes) ||
      !story.themes.every((t: unknown) => typeof t === 'string')
    ) {
      throw new Error("Invalid story structure from AI response");
    }
    
    return story;
  } catch (error) {
    console.error("[Story Generator] Error generating story:", error);
    return createFallbackStory(input);
  }
}

function getTrackContext(trackId: string): string {
  switch (trackId) {
    case "origin":
      return "This is an Origin Story - a personal tale about a defining moment that shaped who someone is. Focus on transformation, growth, and finding one's voice.";
    case "future":
      return "This is a Future City story - an optimistic vision of what the neighborhood could become in 2036. Focus on community wins, positive change, and hopeful innovation.";
    case "legend":
      return "This is a Neighborhood Legend - a magical realism urban myth about something strange happening on the block. Focus on mystery, magic, and community folklore.";
    default:
      return "A story about community and personal transformation.";
  }
}

function createFallbackStory(input: StoryInput): GeneratedStory {
  const { trackTitle, answers } = input;
  
  return {
    title: "The Story of " + (answers.hook?.slice(0, 20) || "Tomorrow"),
    logline: `A ${trackTitle.toLowerCase()} story unfolds.`,
    themes: ["Hope", "Community", "Change"],
    insight: "Every story has the power to inspire.",
    p1: `It started with ${answers.hook || "a moment of clarity"}. ${answers.sensory || "The air was electric with possibility."}`,
    p2: `The challenge was real: ${answers.challenge || "doubt that whispers 'not yet'"}. But then came a turning point: ${answers.reflection || "courage found its voice."}`,
    p3: `And so everything changed. ${answers.resolution || "A new chapter began, written by those who dared to dream."}`
  };
}
