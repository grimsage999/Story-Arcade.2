import type { Track } from "@shared/schema";

export const TRACKS: Track[] = [
  {
    id: 'origin',
    title: 'Origin Story',
    subtitle: 'Share your defining moment!',
    description: "Tell us about a moment that shaped who you are. Everyone has a story worth sharing.",
    color: 'from-fuchsia-500 to-purple-900',
    accent: 'text-fuchsia-400',
    border: 'border-fuchsia-500',
    badge: "CLASSIC",
    questions: [
      { id: 'hook', prompt: "What's a fun or memorable place you've had an 'aha!' moment?", placeholder: "e.g. A coffee shop, the subway, my kitchen...", guidance: "Pick a spot!" },
      { id: 'sensory', prompt: "What song, smell, or random object reminds you of that time?", placeholder: "e.g. The smell of popcorn, a certain song...", guidance: "Get specific!" },
      { id: 'challenge', prompt: "What was the hardest part or funniest obstacle you faced?", placeholder: "e.g. I was too nervous to speak up...", guidance: "Keep it real." },
      { id: 'reflection', prompt: "What advice did you give yourself to push through?", placeholder: "e.g. 'Just go for it!'", guidance: "Your pep talk." },
      { id: 'resolution', prompt: "How do you use that experience to help others now?", placeholder: "e.g. I always encourage people to try...", guidance: "Pay it forward." }
    ]
  },
  {
    id: 'future',
    title: 'Future City',
    subtitle: 'Dream up your ideal neighborhood!',
    description: "Imagine your perfect city block in 2036. What changes would make life better?",
    color: 'from-cyan-400 to-blue-900',
    accent: 'text-cyan-400',
    border: 'border-cyan-400',
    badge: "POPULAR",
    questions: [
      { id: 'hook', prompt: "It's 2036—what's the first cool thing you notice about your neighborhood?", placeholder: "e.g. Flying food trucks, rooftop gardens...", guidance: "Dream big!" },
      { id: 'sensory', prompt: "What new sound or smell fills the air?", placeholder: "e.g. Live music everywhere, fresh bread...", guidance: "Use your senses." },
      { id: 'challenge', prompt: "What problem did the community finally solve together?", placeholder: "e.g. Traffic, noisy neighbors, boring parks...", guidance: "The win." },
      { id: 'reflection', prompt: "Why does this change matter to you personally?", placeholder: "e.g. My kids can play outside safely...", guidance: "Make it personal." },
      { id: 'resolution', prompt: "What fun new tradition does your block have?", placeholder: "e.g. Weekly block parties, morning yoga...", guidance: "Start a trend." }
    ]
  },
  {
    id: 'legend',
    title: 'Neighborhood Legend',
    subtitle: 'Create your own urban myth!',
    description: "Make up a wild story about your block. The stranger, the better!",
    color: 'from-amber-400 to-orange-900',
    accent: 'text-amber-400',
    border: 'border-amber-400',
    badge: "MYTHIC",
    questions: [
      { id: 'hook', prompt: "What's the weird or magical thing that happened on your block?",  placeholder: "e.g. A pizza rat that grants wishes...", guidance: "Go wild!" },
      { id: 'sensory', prompt: "What everyday object is at the center of the legend?", placeholder: "e.g. The old mailbox, a broken streetlight...", guidance: "Pick something ordinary." },
      { id: 'challenge', prompt: "What drama or chaos did it cause in the neighborhood?", placeholder: "e.g. Everyone argued about who saw it first...", guidance: "Stir the pot." },
      { id: 'reflection', prompt: "Who's the unlikely hero of the story and why did they step up?", placeholder: "e.g. The quiet librarian who knew the truth...", guidance: "Introduce the hero." },
      { id: 'resolution', prompt: "What's the one rule everyone follows now because of the legend?", placeholder: "e.g. Never whistle after midnight...", guidance: "The new rule." }
    ]
  }
];

export const MOTIVATIONS = [
  "Have fun with it!",
  "There's no wrong answer.",
  "Go with your gut!",
  "The weirder, the better.",
  "Make it yours!"
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
    trackTitle: "Future City",
    answers: null,
    shareableId: "seed001a",
    userId: null,
    posterUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=600&h=900&fit=crop",
    posterStatus: "ready"
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
    answers: null,
    shareableId: "seed002b",
    userId: null,
    posterUrl: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&h=900&fit=crop",
    posterStatus: "ready"
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
    answers: null,
    shareableId: "seed003c",
    userId: null,
    posterUrl: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=600&h=900&fit=crop",
    posterStatus: "ready"
  },
  {
    id: 4,
    trackId: "future",
    author: "James Chen",
    neighborhood: "Flushing",
    title: "The Rooftop Revolution",
    themes: ["Innovation", "Unity"],
    insight: "Growth happens where you least expect it.",
    logline: "2036. Every rooftop in Queens feeds a family.",
    p1: "The first solar-powered vertical farm appeared on Main Street in 2029. By 2036, they covered every rooftop like a green constellation.",
    p2: "The elderly Chinese grandmothers taught the young engineers about companion planting. The engineers taught them about hydroponics.",
    p3: "Now the Sunday Dim Sum includes vegetables grown thirty floors above, and the wait time for a table is worth every minute.",
    timestamp: new Date().toISOString(),
    trackTitle: "Future City",
    answers: null,
    shareableId: "seed004d",
    userId: null,
    posterUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&h=900&fit=crop",
    posterStatus: "ready"
  },
  {
    id: 5,
    trackId: "origin",
    author: "Destiny Williams",
    neighborhood: "Bedford-Stuyvesant",
    title: "The Midnight Poem",
    themes: ["Art", "Healing"],
    insight: "Words can rebuild what silence breaks.",
    logline: "She found her voice in the last place she expected—a hospital room at 3 AM.",
    p1: "The night my grandmother's heart monitor went silent, I wrote my first poem on a napkin by her bedside.",
    p2: "For months, I couldn't speak above a whisper. But the poems kept coming, filling notebooks like breath returning to lungs.",
    p3: "Now I run poetry workshops for kids who've lost someone. We write together, and somehow the words make the missing hurt less.",
    timestamp: new Date().toISOString(),
    trackTitle: "Origin Story",
    answers: null,
    shareableId: "seed005e",
    userId: null,
    posterUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=900&fit=crop",
    posterStatus: "ready"
  },
  {
    id: 6,
    trackId: "legend",
    author: "Old Man Rivera",
    neighborhood: "South Bronx",
    title: "The Bodega Cat Prophecy",
    themes: ["Mystery", "Fate"],
    insight: "Some guardians choose us.",
    logline: "In the Bronx, there's a cat that knows when rain is coming—and when trouble is too.",
    p1: "Whiskers arrived at the bodega the same day the old owner passed. No one knew where he came from, but everyone knew he wasn't leaving.",
    p2: "The cat had a habit of knocking cans off shelves before earthquakes and meowing at customers who shouldn't buy lottery tickets.",
    p3: "Legend says if Whiskers purrs at you, good fortune follows. But if he hisses? Better stay home for a week.",
    timestamp: new Date().toISOString(),
    trackTitle: "Neighborhood Legend",
    answers: null,
    shareableId: "seed006f",
    userId: null,
    posterUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=900&fit=crop",
    posterStatus: "ready"
  },
  {
    id: 7,
    trackId: "future",
    author: "Kenji Nakamura",
    neighborhood: "East Village",
    title: "The Silent Streets Protocol",
    themes: ["Technology", "Peace"],
    insight: "Progress sounds like quiet.",
    logline: "2036. The city that never sleeps finally learned to rest.",
    p1: "They called it the Silent Streets Protocol—mandatory noise curfews enforced by smart sensors that actually worked.",
    p2: "At first, people protested. How could New York be New York without the chaos? But then came the unexpected: neighbors started talking.",
    p3: "Now every evening at 10 PM, the city exhales. Windows open, conversations drift, and for the first time, you can hear the Hudson.",
    timestamp: new Date().toISOString(),
    trackTitle: "Future City",
    answers: null,
    shareableId: "seed007g",
    userId: null,
    posterUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=900&fit=crop",
    posterStatus: "ready"
  },
  {
    id: 8,
    trackId: "origin",
    author: "Sofia Mendez",
    neighborhood: "Jackson Heights",
    title: "The Immigrant's Recipe",
    themes: ["Heritage", "Love"],
    insight: "Home is a flavor you carry with you.",
    logline: "A single arepa recipe connected three generations across two continents.",
    p1: "My abuela crossed the border with nothing but the clothes on her back and a recipe memorized in her heart.",
    p2: "For twenty years, I was too embarrassed to bring her food to school. I wanted pizza, burgers—anything 'American.'",
    p3: "The day I finally asked her to teach me, she cried. Now I make arepas every Sunday, and my daughter already knows the recipe by heart.",
    timestamp: new Date().toISOString(),
    trackTitle: "Origin Story",
    answers: null,
    shareableId: "seed008h",
    userId: null,
    posterUrl: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&h=900&fit=crop",
    posterStatus: "ready"
  },
  {
    id: 9,
    trackId: "legend",
    author: "The Storyteller",
    neighborhood: "Coney Island",
    title: "The Carousel Horse That Ran",
    themes: ["Wonder", "Freedom"],
    insight: "Magic never truly leaves a place.",
    logline: "On the last night of summer, one carousel horse broke free.",
    p1: "Everyone thought it was a prank at first—a single white horse, missing from the Coney Island carousel, hoofprints leading toward the ocean.",
    p2: "But the old carousel operators knew better. They'd heard the horse whispering for decades, dreaming of waves instead of circles.",
    p3: "Some say if you visit the beach at midnight on Labor Day, you can see it running along the shoreline, finally free.",
    timestamp: new Date().toISOString(),
    trackTitle: "Neighborhood Legend",
    answers: null,
    shareableId: "seed009i",
    userId: null,
    posterUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=900&fit=crop",
    posterStatus: "ready"
  },
  {
    id: 10,
    trackId: "future",
    author: "Amara Okafor",
    neighborhood: "Crown Heights",
    title: "The Community Health Collective",
    themes: ["Wellness", "Equity"],
    insight: "Healthcare grows from trust.",
    logline: "2036. The neighborhood that healed itself, one block at a time.",
    p1: "When the last hospital closed, we didn't wait for someone to save us. We became the solution ourselves.",
    p2: "Nurses taught CPR in bodegas. Therapists held sessions in barbershops. Midwives delivered babies in brownstones.",
    p3: "Now every block has a trained health worker, and the infant mortality rate is the lowest in the city's history.",
    timestamp: new Date().toISOString(),
    trackTitle: "Future City",
    answers: null,
    shareableId: "seed010j",
    userId: null,
    posterUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=900&fit=crop",
    posterStatus: "ready"
  },
  {
    id: 11,
    trackId: "origin",
    author: "Tyrell Jackson",
    neighborhood: "Brownsville",
    title: "The Basketball Court Promise",
    themes: ["Mentorship", "Hope"],
    insight: "Sometimes you have to go back to move forward.",
    logline: "A promise made on a cracked court changed the trajectory of an entire block.",
    p1: "I was 14 when Coach Williams pulled me aside and said, 'This court will still be here when you graduate college. Come back and help.'",
    p2: "It took me fifteen years, three cities, and one blown-out knee before I understood what he meant.",
    p3: "Now I run the summer league he started. Every kid who plays signs the same promise: come back and help.",
    timestamp: new Date().toISOString(),
    trackTitle: "Origin Story",
    answers: null,
    shareableId: "seed011k",
    userId: null,
    posterUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=900&fit=crop",
    posterStatus: "ready"
  },
  {
    id: 12,
    trackId: "legend",
    author: "Anonymous",
    neighborhood: "Chinatown",
    title: "The Fortune Cookie Oracle",
    themes: ["Destiny", "Wisdom"],
    insight: "Some fortunes find their way to the right person.",
    logline: "In a Mott Street restaurant, one fortune cookie has never been wrong.",
    p1: "The Golden Dragon restaurant has served millions of cookies. But one cookie, they say, is different—it finds you when you need it most.",
    p2: "A woman opened it before her wedding and read 'Wait.' She waited. A week later, she discovered the truth about her fiancé.",
    p3: "No one knows how the cookie chooses. But if your fortune is written in red ink instead of black, pay attention.",
    timestamp: new Date().toISOString(),
    trackTitle: "Neighborhood Legend",
    answers: null,
    shareableId: "seed012l",
    userId: null,
    posterUrl: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&h=900&fit=crop",
    posterStatus: "ready"
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
