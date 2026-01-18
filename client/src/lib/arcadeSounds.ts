let audioContext: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported");
      return null;
    }
  }
  
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  
  return audioContext;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (typeof window !== "undefined") {
    localStorage.setItem("arcade-sound-enabled", JSON.stringify(enabled));
  }
}

export function getSoundEnabled(): boolean {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("arcade-sound-enabled");
    if (stored !== null) {
      return JSON.parse(stored);
    }
  }
  return true;
}

export function initSoundPreference(): void {
  soundEnabled = getSoundEnabled();
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "square",
  volume: number = 0.1,
  attack: number = 0.01,
  decay: number = 0.1
): void {
  if (!soundEnabled) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
  gainNode.gain.linearRampToValueAtTime(volume * 0.7, ctx.currentTime + attack + decay);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume: number = 0.05): void {
  if (!soundEnabled) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  filter.type = "highpass";
  filter.frequency.setValueAtTime(3000, ctx.currentTime);
  
  source.buffer = buffer;
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  source.start(ctx.currentTime);
}

export const arcadeSounds = {
  hover: () => {
    playTone(880, 0.06, "square", 0.04, 0.005, 0.02);
  },
  
  hoverAlt: () => {
    playTone(1047, 0.05, "square", 0.03, 0.005, 0.02);
  },
  
  click: () => {
    playTone(440, 0.08, "square", 0.08, 0.01, 0.03);
    setTimeout(() => playTone(880, 0.06, "square", 0.06, 0.01, 0.02), 30);
  },
  
  select: () => {
    playTone(523, 0.1, "square", 0.1, 0.01, 0.04);
    setTimeout(() => playTone(659, 0.08, "square", 0.08, 0.01, 0.03), 50);
    setTimeout(() => playTone(784, 0.12, "square", 0.1, 0.01, 0.05), 100);
  },
  
  success: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, "square", 0.1, 0.01, 0.05), i * 80);
    });
  },
  
  levelUp: () => {
    const melody = [
      { freq: 523, delay: 0 },
      { freq: 659, delay: 100 },
      { freq: 784, delay: 200 },
      { freq: 1047, delay: 300 },
      { freq: 1319, delay: 450 },
    ];
    melody.forEach(({ freq, delay }) => {
      setTimeout(() => playTone(freq, 0.2, "square", 0.12, 0.01, 0.08), delay);
    });
  },
  
  achievement: () => {
    const fanfare = [
      { freq: 784, delay: 0, duration: 0.15 },
      { freq: 784, delay: 120, duration: 0.1 },
      { freq: 784, delay: 200, duration: 0.1 },
      { freq: 1047, delay: 350, duration: 0.3 },
    ];
    fanfare.forEach(({ freq, delay, duration }) => {
      setTimeout(() => playTone(freq, duration, "square", 0.12, 0.01, 0.05), delay);
    });
  },
  
  error: () => {
    playTone(200, 0.2, "sawtooth", 0.08, 0.01, 0.1);
    setTimeout(() => playTone(150, 0.25, "sawtooth", 0.06, 0.01, 0.15), 100);
  },
  
  coinInsert: () => {
    playNoise(0.03, 0.1);
    setTimeout(() => playTone(1200, 0.08, "square", 0.15, 0.005, 0.02), 30);
    setTimeout(() => playTone(1400, 0.1, "square", 0.12, 0.005, 0.04), 80);
  },
  
  typewriter: () => {
    playTone(600 + Math.random() * 200, 0.03, "square", 0.03, 0.002, 0.01);
  },
  
  menuMove: () => {
    playTone(660, 0.04, "triangle", 0.05, 0.005, 0.015);
  },
  
  forge: () => {
    const ctx = getAudioContext();
    if (!ctx || !soundEnabled) return;
    
    let i = 0;
    const interval = setInterval(() => {
      playTone(200 + i * 50, 0.1, "sawtooth", 0.06, 0.02, 0.05);
      i++;
      if (i > 8) {
        clearInterval(interval);
        setTimeout(() => arcadeSounds.success(), 200);
      }
    }, 150);
    
    return () => clearInterval(interval);
  },
  
  storyComplete: () => {
    const melody = [
      { freq: 523, delay: 0, type: "square" as OscillatorType },
      { freq: 587, delay: 150, type: "square" as OscillatorType },
      { freq: 659, delay: 300, type: "square" as OscillatorType },
      { freq: 784, delay: 450, type: "square" as OscillatorType },
      { freq: 880, delay: 600, type: "triangle" as OscillatorType },
      { freq: 1047, delay: 800, type: "triangle" as OscillatorType },
    ];
    melody.forEach(({ freq, delay, type }) => {
      setTimeout(() => playTone(freq, 0.25, type, 0.1, 0.02, 0.1), delay);
    });
  },
};

export type SoundType = keyof typeof arcadeSounds;
