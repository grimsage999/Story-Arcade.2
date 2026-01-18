const PROFANITY_PATTERNS = [
  /\b(fuck|shit|damn|ass|bitch|bastard|crap|hell)\b/gi,
  /\b(dick|cock|pussy|cunt|tit|boob)\b/gi,
  /\b(n[i1]gg[ae]r?|f[a4]gg?[o0]t|r[e3]t[a4]rd)\b/gi,
  /\b(kill|murder|rape|torture|abuse|harm)\b/gi,
  /\b(drug|cocaine|heroin|meth|weed|marijuana)\b/gi,
  /\b(suicide|self-harm|cutting)\b/gi,
  /\b(hate|racist|nazi|terrorism)\b/gi,
];

const MILD_WARNINGS = [
  /\b(stupid|idiot|dumb|loser|ugly)\b/gi,
  /\b(drunk|alcohol|beer|wine|vodka)\b/gi,
  /\b(fight|punch|hit|attack)\b/gi,
];

export interface SafetyCheckResult {
  isClean: boolean;
  hasMildContent: boolean;
  flaggedPatterns: string[];
  sanitizedText: string;
}

export function checkContentSafety(text: string): SafetyCheckResult {
  const flaggedPatterns: string[] = [];
  let sanitizedText = text;
  let isClean = true;
  let hasMildContent = false;

  for (const pattern of PROFANITY_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      isClean = false;
      flaggedPatterns.push(...matches.map(m => m.toLowerCase()));
      sanitizedText = sanitizedText.replace(pattern, (match) => '*'.repeat(match.length));
    }
  }

  for (const pattern of MILD_WARNINGS) {
    const matches = text.match(pattern);
    if (matches) {
      hasMildContent = true;
    }
  }

  return {
    isClean,
    hasMildContent,
    flaggedPatterns: Array.from(new Set(flaggedPatterns)),
    sanitizedText
  };
}

export function sanitizeUserInput(text: string): string {
  const result = checkContentSafety(text);
  return result.sanitizedText;
}

export function isContentAppropriate(text: string): boolean {
  const result = checkContentSafety(text);
  return result.isClean;
}

export const FALLBACK_STORIES = {
  'origin-story': {
    title: "The Quiet Hero's Beginning",
    logline: "In every neighborhood, there's someone whose small acts of kindness ripple outward.",
    p1: "Before the recognition, before anyone knew their name, there was simply a person who cared. They noticed things others missed—the elderly neighbor struggling with groceries, the child who always walked home alone, the dog that had wandered too far from home.",
    p2: "Word spread quietly, the way good news does in tight-knit communities. Someone always seemed to be there when you needed help. The local café knew their coffee order. The crossing guard waved every morning. Small connections that built something larger.",
    p3: "Years later, when asked about their impact, they would shrug. 'I just did what anyone would do,' they'd say. But everyone knew that wasn't quite true. Some people see the world as it could be, and then work quietly to make it so.",
    themes: ["Community", "Kindness", "Legacy"]
  },
  'future-nyc': {
    title: "Neon Dreams and Silver Streets",
    logline: "In the city of tomorrow, the old neighborhoods remember.",
    p1: "The elevated trains still ran on time, but now they hummed with magnetic levitation instead of grinding steel. The bodega on the corner had upgraded its awning to solar-collection film, but still sold the same egg sandwiches that three generations had loved.",
    p2: "Above the ancient brownstones, vertical farms climbed toward the clouds, their bioluminescent crops casting soft green light onto the streets below. Old timers sat on stoops made of self-healing concrete, telling stories to children who would one day tell the same tales.",
    p3: "The city had changed in a thousand ways, but its heart remained the same—a place where strangers became neighbors, where every block had its own mythology, where the future and the past held hands on every corner.",
    themes: ["Progress", "Heritage", "Hope"]
  },
  'neighborhood-legend': {
    title: "The Story That Never Dies",
    logline: "Some stories are too important to forget, even when no one remembers who started them.",
    p1: "Every neighborhood has them—the tales passed down from old-timers to newcomers, changing slightly with each telling but never losing their essential truth. This one was about the time the whole block came together, though the reasons varied depending on who was doing the remembering.",
    p2: "Some said it started with a fire, others with a flood. A few insisted it was simpler than that—just a family in need and a community that refused to look away. The details mattered less than the feeling the story evoked: that sense of belonging to something larger than yourself.",
    p3: "Now, decades later, the story had become a kind of compass. Whenever things got difficult, whenever the community faced a new challenge, someone would say 'Remember when...' and suddenly, everyone knew what to do. The legend had become a living thing.",
    themes: ["Memory", "Unity", "Resilience"]
  }
};

export type FallbackStoryTrack = keyof typeof FALLBACK_STORIES;

export function getFallbackStory(trackId: string): typeof FALLBACK_STORIES['origin-story'] {
  const normalizedTrackId = trackId.toLowerCase().replace(/\s+/g, '-') as FallbackStoryTrack;
  return FALLBACK_STORIES[normalizedTrackId] || FALLBACK_STORIES['origin-story'];
}
