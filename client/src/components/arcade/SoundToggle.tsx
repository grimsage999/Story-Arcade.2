import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSoundToggle } from "@/hooks/use-arcade-sounds";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SoundToggle() {
  const { enabled, toggle } = useSoundToggle();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="arcade-hover"
          aria-label={enabled ? "Mute sounds" : "Enable sounds"}
          data-testid="button-sound-toggle"
        >
          {enabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-mono text-xs">{enabled ? "Sound ON" : "Sound OFF"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
