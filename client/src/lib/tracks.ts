import type { Track } from "@shared/schema";

export const TRACKS: Track[] = [
  {
    id: 'origin',
    title: 'Origin Story',
    subtitle: 'How did you become you?',
    description: "Trace the moment that defined your character arc. Every hero has a beginning.",
    color: 'from-fuchsia-500 to-purple-900',
    accent: 'text-fuchsia-400',
    border: 'border-fuchsia-500',
    badge: "CLASSIC",
    questions: [
      { id: 'hook', prompt: "Where were you when you realized your life was about to change?", placeholder: "e.g. On the roof...", guidance: "Set the scene." },
      { id: 'sensory', prompt: "Describe the scene—what specific sound, smell, or object defines that memory?", placeholder: "e.g. Rain on asphalt...", guidance: "Engage the senses." },
      { id: 'challenge', prompt: "What was the one obstacle—a person, a fear, or a situation—that stood in your way?", placeholder: "e.g. My own doubt.", guidance: "The antagonist." },
      { id: 'reflection', prompt: "In that moment of doubt, what was the one truth you told yourself?", placeholder: "e.g. 'I am ready.'", guidance: "Internal monologue." },
      { id: 'resolution', prompt: "How did overcoming that moment shape who you are today?", placeholder: "e.g. I open doors for others.", guidance: "Your power now." }
    ]
  },
  {
    id: 'future',
    title: 'Future NYC',
    subtitle: 'What does the city look like when we win?',
    description: "Step into 2036. Design the future your neighborhood deserves.",
    color: 'from-cyan-400 to-blue-900',
    accent: 'text-cyan-400',
    border: 'border-cyan-400',
    badge: "POPULAR",
    questions: [
      { id: 'hook', prompt: "The year is 2036. What is the first thing that tells you 'We won'?", placeholder: "e.g. Silence of electric streets.", guidance: "Visualize victory." },
      { id: 'sensory', prompt: "Close your eyes. What is the new smell or sound in the air?", placeholder: "e.g. Jasmine scent.", guidance: "Make it tangible." },
      { id: 'challenge', prompt: "What was the specific problem the community had to solve together?", placeholder: "e.g. The heat waves.", guidance: "The struggle." },
      { id: 'reflection', prompt: "Why was it so important for you personally to see this change?", placeholder: "e.g. For my grandmother.", guidance: "Personal stake." },
      { id: 'resolution', prompt: "What is the new daily ritual that proves this future is here to stay?", placeholder: "e.g. Block dinners.", guidance: "Anchor in habit." }
    ]
  },
  {
    id: 'legend',
    title: 'Neighborhood Legend',
    subtitle: 'What is the myth your block will tell?',
    description: "Turn a local rumor into a timeless myth. Magic realism for the streets.",
    color: 'from-amber-400 to-orange-900',
    accent: 'text-amber-400',
    border: 'border-amber-400',
    badge: "MYTHIC",
    questions: [
      { id: 'hook', prompt: "What is the strange or magical event that started the legend?", placeholder: "e.g. The talking cat.", guidance: "Inciting incident." },
      { id: 'sensory', prompt: "What was the one physical object at the center of it all?", placeholder: "e.g. The old oak tree.", guidance: "The artifact." },
      { id: 'challenge', prompt: "When the chaos started, how did the neighborhood almost fall apart?", placeholder: "e.g. Arguments over magic.", guidance: "The tension." },
      { id: 'reflection', prompt: "What was the secret reason the main character stepped up?", placeholder: "e.g. To share the magic.", guidance: "The 'Why'." },
      { id: 'resolution', prompt: "What is the one rule of reality that has changed forever?", placeholder: "e.g. No rain on weekends.", guidance: "The new world." }
    ]
  }
];

export const MOTIVATIONS = [
  "You're building history.",
  "Keep it 100%.",
  "The future is yours to write.",
  "Your voice matters here.",
  "Cinema is waiting."
];

export const SEED_STORIES = [
  {
    id: 1,
    trackId: "future",
    author: "Maria Elena",
    neighborhood: "Williamsburg",
    title: "The Evening Market Era",
    themes: ["Resilience", "Culture"],
    insight: "Vision of localized economy.",
    logline: "2036. The Williamsburg waterfront breathes again.",
    p1: "It starts with the silence of the electric streets. No more honking, just the soft hum of bikes and the chatter of neighbors.",
    p2: "The shift wasn't accidental. It took years of community organizing, block by block, until the old warehouses became greenhouses.",
    p3: "Now, a new ritual anchors the day: the Evening Market, where every vendor knows your name and the tomatoes taste like summer.",
    timestamp: new Date().toISOString(),
    trackTitle: "Future NYC",
    answers: null
  },
  {
    id: 2,
    trackId: "origin",
    author: "Marcus Thompson",
    neighborhood: "Harlem",
    title: "The Subway Decision",
    themes: ["Courage", "Identity"],
    insight: "Finding voice in silence.",
    logline: "One moment underground changed everything above.",
    p1: "It was 2AM on the A train when I realized I had been living someone else's dream for twelve years.",
    p2: "The challenge wasn't external—it was the voice in my head telling me I wasn't enough to try something new.",
    p3: "Today, I teach kids that the scariest doors lead to the brightest rooms. That subway ride was my first step through.",
    timestamp: new Date().toISOString(),
    trackTitle: "Origin Story",
    answers: null
  },
  {
    id: 3,
    trackId: "legend",
    author: "Abuela Rosa",
    neighborhood: "Washington Heights",
    title: "The Dancing Fire Escape",
    themes: ["Magic", "Community"],
    insight: "Some things can't be explained.",
    logline: "They say on summer nights, the old fire escape still moves to salsa.",
    p1: "It started the night Doña Carmen passed—her fire escape began swaying to music only the building could hear.",
    p2: "The landlord tried to tear it down three times. Each time, his tools would go missing, only to reappear arranged in dance formations.",
    p3: "Now there's only one rule on 173rd Street: if you hear the music, you dance. The building won't have it any other way.",
    timestamp: new Date().toISOString(),
    trackTitle: "Neighborhood Legend",
    answers: null
  }
];

export function getTrackIcon(trackId: string): 'rewind' | 'zap' | 'mapPin' {
  switch (trackId) {
    case 'origin': return 'rewind';
    case 'future': return 'zap';
    case 'legend': return 'mapPin';
    default: return 'zap';
  }
}

export function getTrackAccentColor(trackId: string): string {
  switch (trackId) {
    case 'origin': return 'fuchsia';
    case 'future': return 'cyan';
    case 'legend': return 'amber';
    default: return 'cyan';
  }
}
