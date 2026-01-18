import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

const SCENE_EXAMPLES: Record<number, string[]> = {
  1: [
    "A comet fell from the sky, carrying an ancient intelligence with it",
    "The statue in the plaza started glowing at midnight",
    "A strange fog settled over the neighborhood and never lifted"
  ],
  2: [
    "A crystalline stone that hummed with otherworldly energy",
    "An old journal written in an unknown language",
    "A mirror that showed alternate versions of reality"
  ],
  3: [
    "A shadowy figure that appeared only in reflections",
    "The growing whispers of doubt from those I trusted",
    "A choice between power and integrity"
  ],
  4: [
    "I remembered the words my grandmother once told me",
    "The answer was hidden in a childhood memory all along",
    "A stranger showed me what I had been blind to"
  ],
  5: [
    "The neighborhood celebrated together for the first time in years",
    "I became the person I was always meant to be",
    "The story passed from generation to generation"
  ]
};

interface SceneExamplesProps {
  sceneNumber: number;
  onExampleClick?: (example: string) => void;
}

export function SceneExamples({ sceneNumber, onExampleClick }: SceneExamplesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const examples = SCENE_EXAMPLES[sceneNumber] || SCENE_EXAMPLES[1];

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-xs font-mono"
        data-testid="button-toggle-examples"
      >
        <Lightbulb className="w-3 h-3" />
        <span>Examples</span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 animate-fade-in" data-testid="panel-examples">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => onExampleClick?.(example)}
              className="block w-full text-left px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-primary/30"
              data-testid={`button-example-${index}`}
            >
              "{example}"
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
