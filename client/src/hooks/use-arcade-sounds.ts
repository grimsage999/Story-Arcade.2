import { useCallback, useEffect, useState, useRef } from "react";
import { arcadeSounds, setSoundEnabled, getSoundEnabled, initSoundPreference, SoundType } from "@/lib/arcadeSounds";

export function useArcadeSounds() {
  const [enabled, setEnabled] = useState(true);
  const lastHoverTime = useRef(0);
  const hoverThrottleMs = 100;

  useEffect(() => {
    initSoundPreference();
    setEnabled(getSoundEnabled());
  }, []);

  const toggle = useCallback(() => {
    const newValue = !enabled;
    setEnabled(newValue);
    setSoundEnabled(newValue);
    if (newValue) {
      arcadeSounds.click();
    }
  }, [enabled]);

  const play = useCallback((sound: SoundType) => {
    if (enabled) {
      arcadeSounds[sound]();
    }
  }, [enabled]);

  const playHover = useCallback(() => {
    const now = Date.now();
    if (now - lastHoverTime.current > hoverThrottleMs) {
      lastHoverTime.current = now;
      if (enabled) {
        arcadeSounds.hover();
      }
    }
  }, [enabled]);

  const playClick = useCallback(() => {
    if (enabled) {
      arcadeSounds.click();
    }
  }, [enabled]);

  const playSelect = useCallback(() => {
    if (enabled) {
      arcadeSounds.select();
    }
  }, [enabled]);

  const playSuccess = useCallback(() => {
    if (enabled) {
      arcadeSounds.success();
    }
  }, [enabled]);

  const playLevelUp = useCallback(() => {
    if (enabled) {
      arcadeSounds.levelUp();
    }
  }, [enabled]);

  const playAchievement = useCallback(() => {
    if (enabled) {
      arcadeSounds.achievement();
    }
  }, [enabled]);

  const getInteractionProps = useCallback((options?: { 
    hoverSound?: boolean; 
    clickSound?: boolean;
    hoverVariant?: "default" | "alt";
  }) => {
    const { hoverSound = true, clickSound = true, hoverVariant = "default" } = options || {};
    
    return {
      onMouseEnter: hoverSound ? () => {
        const now = Date.now();
        if (now - lastHoverTime.current > hoverThrottleMs && enabled) {
          lastHoverTime.current = now;
          if (hoverVariant === "alt") {
            arcadeSounds.hoverAlt();
          } else {
            arcadeSounds.hover();
          }
        }
      } : undefined,
      onClick: clickSound ? () => {
        if (enabled) {
          arcadeSounds.click();
        }
      } : undefined,
    };
  }, [enabled]);

  return {
    enabled,
    toggle,
    play,
    playHover,
    playClick,
    playSelect,
    playSuccess,
    playLevelUp,
    playAchievement,
    getInteractionProps,
  };
}

export function useSoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(getSoundEnabled());
  }, []);

  const toggle = useCallback(() => {
    const newValue = !enabled;
    setEnabled(newValue);
    setSoundEnabled(newValue);
    if (newValue) {
      arcadeSounds.click();
    }
  }, [enabled]);

  return { enabled, toggle };
}
