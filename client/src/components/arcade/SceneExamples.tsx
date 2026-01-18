import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

type TrackExamples = Record<number, string[]>;

const TRACK_EXAMPLES: Record<string, TrackExamples> = {
  origin: {
    1: [
      "Sitting on my grandmother's porch when she told me the family secret",
      "In the hospital waiting room at 3am, holding my father's jacket",
      "Standing in line at the unemployment office, clutching my last $20",
      "On the subway platform when a stranger's words changed everything"
    ],
    2: [
      "The smell of burnt coffee from the diner where we always met",
      "My mother's gold bracelet clicking against the kitchen table",
      "The creak of the third step on grandma's staircase",
      "Rain drumming on a tin awning while we waited in silence"
    ],
    3: [
      "My own voice telling me I wasn't good enough",
      "A parent who didn't believe in my dreams",
      "The fear of leaving everything I knew behind",
      "A choice between security and following my heart"
    ],
    4: [
      "'This is exactly where I'm supposed to be'",
      "'The only person who needs to believe in me is me'",
      "'I'd rather fail trying than succeed at the wrong thing'",
      "'Every closed door led me to this open window'"
    ],
    5: [
      "I now mentor others facing the same crossroads",
      "I carry my grandmother's strength in everything I do",
      "I built the life my younger self dreamed of",
      "I learned that every ending is just another beginning"
    ]
  },
  future: {
    1: [
      "Children playing safely in streets that used to be dangerous",
      "The old factory is now a community garden feeding the block",
      "Solar panels on every rooftop catching the morning sun",
      "The corner store where three languages flow freely together"
    ],
    2: [
      "Fresh bread baking from the neighborhood bakery co-op",
      "The hum of electric bikes replacing car engines",
      "Laughter echoing from rooftop dinners every Friday",
      "Wind chimes made from recycled materials singing together"
    ],
    3: [
      "The landlords who tried to push everyone out",
      "The flooding that threatened to destroy the neighborhood",
      "The divide between old-timers and newcomers",
      "The pollution that made our kids sick for years"
    ],
    4: [
      "My abuela deserved to see her street beautiful again",
      "My kids needed a place they could be proud to call home",
      "The elders who built this neighborhood needed to be honored",
      "I wanted to prove we could build something together"
    ],
    5: [
      "Every Sunday, neighbors share meals on the community terrace",
      "Morning tai chi in the park that replaced the parking lot",
      "The weekly repair café where we fix instead of throw away",
      "Children learn their family histories under the old oak tree"
    ]
  },
  legend: {
    1: [
      "The day the bodega cat started predicting winning lottery numbers",
      "When the mural on 145th Street began changing overnight",
      "The summer the fire hydrant on our block started speaking",
      "The morning we found flowers growing from the cracks in impossible colors"
    ],
    2: [
      "An ancient key that opened doors that didn't exist",
      "Doña Rosa's cooking pot that never seemed to empty",
      "The payphone on the corner that only rang at midnight",
      "A stoop where anyone who sat gained unexpected wisdom"
    ],
    3: [
      "Neighbors fought over who should control the magic",
      "Outsiders came trying to exploit what we had",
      "Some said we should destroy it before it destroyed us",
      "The jealousy between families nearly tore us apart"
    ],
    4: [
      "To prove that our block was worth believing in",
      "To honor the grandmother who first showed me the magic",
      "Because someone had to bridge the old ways and the new",
      "To protect the children who would inherit this mystery"
    ],
    5: [
      "On this block, doors always open for those who truly need them",
      "The cats here understand every language spoken",
      "Flowers bloom year-round on the corner where the hero stood",
      "No one on this street ever goes hungry or forgotten"
    ]
  }
};

const DEFAULT_EXAMPLES: TrackExamples = {
  1: ["The moment that started it all", "An unexpected discovery", "When everything changed"],
  2: ["A significant object or sensation", "The detail that made it real", "What you remember most"],
  3: ["The obstacle you faced", "What stood in your way", "The challenge ahead"],
  4: ["The truth you told yourself", "What gave you strength", "Your internal compass"],
  5: ["How it changed you forever", "The new reality", "What you carry forward"]
};

interface SceneExamplesProps {
  sceneNumber: number;
  trackId?: string;
  onExampleClick?: (example: string) => void;
}

export function SceneExamples({ sceneNumber, trackId, onExampleClick }: SceneExamplesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const trackExamples = trackId && TRACK_EXAMPLES[trackId] 
    ? TRACK_EXAMPLES[trackId] 
    : DEFAULT_EXAMPLES;
  
  const examples = trackExamples[sceneNumber] || trackExamples[1] || DEFAULT_EXAMPLES[1];

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-xs font-mono group"
        data-testid="button-toggle-examples"
      >
        <Lightbulb className="w-3.5 h-3.5 group-hover:text-primary" />
        <span>Scene Examples</span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 animate-fade-in" data-testid="panel-examples">
          <p className="text-[10px] text-muted-foreground font-mono mb-2 tracking-wide">
            CLICK TO USE • TAP FOR INSPIRATION
          </p>
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => onExampleClick?.(example)}
              className="block w-full text-left px-3 py-2.5 bg-secondary/50 hover:bg-secondary rounded-md text-sm text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-primary/30 hover:shadow-[0_0_10px_rgba(34,211,238,0.1)]"
              data-testid={`button-example-${index}`}
            >
              <span className="opacity-60">"</span>
              {example}
              <span className="opacity-60">"</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
