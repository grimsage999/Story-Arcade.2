import { useCallback, useEffect, useState, useRef } from "react";
import { arcadeSounds, setSoundEnabled, getSoundEnabled, initSoundPreference, SoundType, setMusicEnabled, getMusicEnabled } from "@/lib/arcadeSounds";

export function useArcadeSounds() {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [musicEnabled, setMusicEnabledState] = useState(true);
  const lastHoverTime = useRef(0);
  const hoverThrottleMs = 100;

  useEffect(() => {
    initSoundPreference();
    setSoundEnabledState(getSoundEnabled());
    setMusicEnabledState(getMusicEnabled());
  }, []);

  const toggleSound = useCallback(() => {
    const newValue = !soundEnabled;
    setSoundEnabledState(newValue);
    setSoundEnabled(newValue);
    if (newValue) {
      arcadeSounds.click();
    }
  }, [soundEnabled]);

  const toggleMusic = useCallback(() => {
    const newValue = !musicEnabled;
    setMusicEnabledState(newValue);
    setMusicEnabled(newValue);
  }, [musicEnabled]);

  const play = useCallback((sound: SoundType) => {
    if (soundEnabled) {
      arcadeSounds[sound]();
    }
  }, [soundEnabled]);

  const playHover = useCallback(() => {
    const now = Date.now();
    if (now - lastHoverTime.current > hoverThrottleMs) {
      lastHoverTime.current = now;
      if (soundEnabled) {
        arcadeSounds.hover();
      }
    }
  }, [soundEnabled]);

  const playClick = useCallback(() => {
    if (soundEnabled) {
      arcadeSounds.click();
    }
  }, [soundEnabled]);

  const playSelect = useCallback(() => {
    if (soundEnabled) {
      arcadeSounds.select();
    }
  }, [soundEnabled]);

  const playSuccess = useCallback(() => {
    if (soundEnabled) {
      arcadeSounds.success();
    }
  }, [soundEnabled]);

  const playLevelUp = useCallback(() => {
    if (soundEnabled) {
      arcadeSounds.levelUp();
    }
  }, [soundEnabled]);

  const playAchievement = useCallback(() => {
    if (soundEnabled) {
      arcadeSounds.achievement();
    }
  }, [soundEnabled]);

  const getInteractionProps = useCallback((options?: {
    hoverSound?: boolean;
    clickSound?: boolean;
    hoverVariant?: "default" | "alt";
  }) => {
    const { hoverSound = true, clickSound = true, hoverVariant = "default" } = options || {};

    return {
      onMouseEnter: hoverSound ? () => {
        const now = Date.now();
        if (now - lastHoverTime.current > hoverThrottleMs && soundEnabled) {
          lastHoverTime.current = now;
          if (hoverVariant === "alt") {
            arcadeSounds.hoverAlt();
          } else {
            arcadeSounds.hover();
          }
        }
      } : undefined,
      onClick: clickSound ? () => {
        if (soundEnabled) {
          arcadeSounds.click();
        }
      } : undefined,
    };
  }, [soundEnabled]);

  return {
    soundEnabled,
    musicEnabled,
    toggleSound,
    toggleMusic,
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
  const [musicEnabled, setMusicEnabledState] = useState(true);

  useEffect(() => {
    setEnabled(getSoundEnabled());
    setMusicEnabledState(getMusicEnabled());
  }, []);

  const toggle = useCallback(() => {
    const newValue = !enabled;
    setEnabled(newValue);
    setSoundEnabled(newValue);
    if (newValue) {
      arcadeSounds.click();
    }
  }, [enabled]);

  const toggleMusic = useCallback(() => {
    const newValue = !musicEnabled;
    setMusicEnabledState(newValue);
    setMusicEnabled(newValue);
  }, [musicEnabled]);

  return {
    enabled,
    musicEnabled,
    toggle,
    toggleMusic
  };
}
