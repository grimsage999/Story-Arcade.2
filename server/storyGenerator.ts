import { AIManager } from "./ai/aiManager";
import { storyLogger } from "./logger";

const aiManager = new AIManager();

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
  try {
    const story = await aiManager.generateStory(input);
    return story;
  } catch (error) {
    storyLogger.error({ err: error }, "Error generating story with AI manager");
    return createFallbackStory(input);
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
