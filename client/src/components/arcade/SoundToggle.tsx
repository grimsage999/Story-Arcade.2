import { Volume2, VolumeX, Music, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSoundToggle } from "@/hooks/use-arcade-sounds";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SoundToggle() {
  const { enabled, musicEnabled, toggle, toggleMusic } = useSoundToggle();

  return (
    <div className="flex gap-1">
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

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMusic}
            className="arcade-hover"
            aria-label={musicEnabled ? "Mute music" : "Enable music"}
            data-testid="button-music-toggle"
          >
            {musicEnabled ? (
              <Music className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">{musicEnabled ? "Music ON" : "Music OFF"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
