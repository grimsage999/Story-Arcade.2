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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const story = parseStoryJSON(content.text);
    
    if (!validateStory(story)) {
      throw new Error("Invalid story structure from AI response");
    }
    
    // Ensure title isn't too long
    if (story.title.split(' ').length > 8) {
      story.title = story.title.split(' ').slice(0, 6).join(' ');
    }
    
    return story;
  } catch (error) {
    console.error("[Story Generator] Error generating story:", error);
    return createFallbackStory(input);
  }
}

function parseStoryJSON(text: string): GeneratedStory {
  // Clean up the text - remove markdown code blocks if present
  let cleanText = text.trim();
  
  // Remove ```json or ``` wrappers
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  
  // Try to extract JSON object
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not find JSON in response");
  }
  
  // Parse and return
  return JSON.parse(jsonMatch[0]) as GeneratedStory;
}

function validateStory(story: unknown): story is GeneratedStory {
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

function getTrackContext(trackId: string): string {
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

function createFallbackStory(input: StoryInput): GeneratedStory {
  const { trackId, trackTitle, answers } = input;
  
  // Create a proper fallback title based on track
  const trackTitles: Record<string, string[]> = {
    origin: ["The Turning Point", "A Voice Discovered", "The Moment Everything Changed"],
    future: ["Tomorrow's Promise", "The City Reborn", "When Hope Returns"],
    legend: ["The Block's Secret", "Street Magic Rising", "What the Neighbors Saw"],
  };
  
  const titles = trackTitles[trackId] || trackTitles.origin;
  const title = titles[Math.floor(Math.random() * titles.length)];
  
  // Create atmospheric fallback paragraphs
  const hook = answers.hook || "an ordinary moment";
  const sensory = answers.sensory || "the air thick with possibility";
  const challenge = answers.challenge || "the weight of uncertainty";
  const reflection = answers.reflection || "a spark of courage";
  const resolution = answers.resolution || "everything would be different";

  return {
    title,
    logline: `A ${trackTitle.toLowerCase()} tale of transformation and discovery.`,
    themes: ["Hope", "Change", "Community"],
    insight: "Every moment holds the seed of something extraordinary.",
    p1: `It began like so many stories do - with ${hook.toLowerCase()}. The world seemed to hold its breath, ${sensory.toLowerCase()}.`,
    p2: `But nothing worth having comes easy. There was ${challenge.toLowerCase()} to reckon with. And in that struggle, something unexpected emerged: ${reflection.toLowerCase()}.`,
    p3: `And when the dust settled, the truth became clear. ${resolution.charAt(0).toUpperCase() + resolution.slice(1).toLowerCase()}. This wasn't just a story - it was a new beginning.`
  };
}
