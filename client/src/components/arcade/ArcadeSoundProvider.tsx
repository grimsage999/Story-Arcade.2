import { useEffect, useCallback, createContext, useContext, useState } from "react";
import { arcadeSounds, getSoundEnabled, setSoundEnabled, initSoundPreference } from "@/lib/arcadeSounds";

interface ArcadeSoundContextType {
  enabled: boolean;
  toggle: () => void;
  playSound: (sound: keyof typeof arcadeSounds) => void;
}

const ArcadeSoundContext = createContext<ArcadeSoundContextType | null>(null);

export function useArcadeSoundContext() {
  const context = useContext(ArcadeSoundContext);
  if (!context) {
    return { enabled: true, toggle: () => {}, playSound: () => {} };
  }
  return context;
}

const INTERACTIVE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  '[role="button"]:not([disabled])',
  '[role="menuitem"]:not([disabled])',
  '[role="tab"]:not([disabled])',
  'input[type="submit"]:not([disabled])',
  '.arcade-interactive',
].join(', ');

const HOVER_EXCLUDED = [
  '[data-no-sound]',
  '.no-arcade-sound',
];

export function ArcadeSoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const lastHoverTime = { current: 0 };
  const hoverThrottleMs = 80;

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

  const playSound = useCallback((sound: keyof typeof arcadeSounds) => {
    if (enabled) {
      const fn = arcadeSounds[sound];
      if (typeof fn === 'function') {
        fn();
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const isExcluded = (el: Element): boolean => {
      return HOVER_EXCLUDED.some(selector => el.matches(selector) || el.closest(selector));
    };

    const handleMouseEnter = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (!target.matches(INTERACTIVE_SELECTORS)) return;
      if (isExcluded(target)) return;
      
      const now = Date.now();
      if (now - lastHoverTime.current > hoverThrottleMs) {
        lastHoverTime.current = now;
        arcadeSounds.hover();
      }
    };

    const handleClick = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const interactiveEl = target.closest(INTERACTIVE_SELECTORS);
      if (!interactiveEl) return;
      if (isExcluded(interactiveEl)) return;
      
      arcadeSounds.click();
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('click', handleClick, true);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const style = document.createElement('style');
    style.id = 'arcade-sound-styles';
    style.textContent = `
      button:not([disabled]):hover,
      a[href]:hover,
      [role="button"]:not([disabled]):hover,
      [role="menuitem"]:not([disabled]):hover {
        /* Trigger will-change for smoother animations */
        will-change: transform;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('arcade-sound-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [enabled]);

  return (
    <ArcadeSoundContext.Provider value={{ enabled, toggle, playSound }}>
      {children}
    </ArcadeSoundContext.Provider>
  );
}
