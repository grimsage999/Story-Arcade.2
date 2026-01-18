import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface InspireMeProps {
  sceneNumber: number;
  trackTitle: string;
  prompt: string;
  currentInput: string;
  onSuggestionClick: (suggestion: string) => void;
  usageCount: number;
  onUse: () => void;
}

export function InspireMe({ 
  sceneNumber, 
  trackTitle, 
  prompt, 
  currentInput, 
  onSuggestionClick,
  usageCount,
  onUse 
}: InspireMeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const maxUsesPerScene = 3;
  const usesRemaining = maxUsesPerScene - usageCount;
  const isDisabled = usageCount >= maxUsesPerScene;

  const generateSuggestions = async () => {
    if (isDisabled) return;
    
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const response = await apiRequest('POST', '/api/inspire', {
        sceneNumber,
        trackTitle,
        prompt,
        currentInput
      });
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      onUse();
    } catch (err) {
      setError("Couldn't generate suggestions. Try again!");
      setSuggestions([
        "An unexpected discovery that changed everything",
        "The moment I realized my true strength",
        "A memory that refuses to fade"
      ]);
      onUse();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionClick(suggestion);
    setSuggestions([]);
  };

  return (
    <div className="mt-4" data-testid="component-inspire-me">
      <Button
        variant="outline"
        size="sm"
        onClick={generateSuggestions}
        disabled={isDisabled || isLoading}
        className="font-mono text-xs gap-2"
        data-testid="button-inspire-me"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Generating suggestions...
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3" />
            Inspire me
            {!isDisabled && (
              <span className="text-muted-foreground">({usesRemaining} left)</span>
            )}
          </>
        )}
      </Button>

      {error && (
        <p className="text-xs text-yellow-500 mt-2">{error}</p>
      )}

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 animate-fade-in" data-testid="panel-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary rounded-full text-xs text-foreground transition-colors"
              data-testid={`chip-suggestion-${index}`}
            >
              {suggestion.length > 60 ? suggestion.substring(0, 60) + "..." : suggestion}
            </button>
          ))}
        </div>
      )}

      {isDisabled && (
        <p className="text-xs text-muted-foreground mt-2">
          You've used all {maxUsesPerScene} inspirations for this scene
        </p>
      )}
    </div>
  );
}
