export interface AIStoryInput {
  trackId: string;
  trackTitle: string;
  answers: Record<string, string>;
}

export interface AIStoryOutput {
  title: string;
  logline: string;
  themes: string[];
  insight: string;
  p1: string;
  p2: string;
  p3: string;
}

export interface AIPosterInput {
  title: string;
  logline: string;
  trackId: string;
  trackTitle: string;
  themes: string[];
  p1: string;
  p2?: string;
  p3?: string;
}

export interface AIPosterOutput {
  imageUrl: string;
}

export interface AIProvider {
  generateStory(input: AIStoryInput): Promise<AIStoryOutput>;
  generatePoster(input: AIPosterInput): Promise<AIPosterOutput | null>;
  isHealthy(): Promise<boolean>;
  getName(): string;
}