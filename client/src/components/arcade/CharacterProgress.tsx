interface CharacterProgressProps {
  charCount: number;
  suggested?: number;
}

export function CharacterProgress({ charCount, suggested = 150 }: CharacterProgressProps) {
  const percentage = Math.min((charCount / suggested) * 100, 100);
  
  let barColor = "bg-zinc-500";
  let textColor = "text-muted-foreground";
  
  if (charCount >= 50 && charCount <= 150) {
    barColor = "bg-cyan-400";
    textColor = "text-cyan-400";
  } else if (charCount > 150) {
    barColor = "bg-yellow-500";
    textColor = "text-yellow-500";
  }

  return (
    <div className="space-y-1" data-testid="component-char-progress">
      <div className="h-1 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className={`text-xs font-mono ${textColor} flex justify-between`}>
        <span data-testid="text-char-progress">
          {charCount} / {suggested} suggested characters ({Math.round(percentage)}%)
        </span>
      </div>
    </div>
  );
}
