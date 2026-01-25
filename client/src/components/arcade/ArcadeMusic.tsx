import { useEffect, useRef } from 'react';

interface ArcadeMusicProps {
  enabled: boolean;
  volume?: number;
}

// Simple procedural music generator using Web Audio API
export function ArcadeMusic({ enabled, volume = 0.3 }: ArcadeMusicProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicNodesRef = useRef<Array<{osc: OscillatorNode, gain: GainNode}>>([]);
  const isPlayingRef = useRef(false);
  const loopTimeoutRef = useRef<number | null>(null);
  const sequenceCounterRef = useRef(0);

  // Clean up all audio nodes
  const cleanupAudio = () => {
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    
    musicNodesRef.current.forEach(node => {
      try {
        node.osc.stop();
      } catch (e) {
        // Oscillator already stopped
      }
    });
    musicNodesRef.current = [];
  };

  // Function to create a soothing, varied arcade-style melody
  const playMelody = (ctx: AudioContext) => {
    if (!enabled || !ctx) return;

    // Different sequences to alternate between for variety
    const sequences = [
      // Sequence 1 - Gentle arpeggio
      [
        { note: 523.25, duration: 0.3 }, // C5
        { note: 659.25, duration: 0.3 }, // E5
        { note: 783.99, duration: 0.3 }, // G5
        { note: 1046.50, duration: 0.6 }, // C6
        { note: 783.99, duration: 0.3 }, // G5
        { note: 659.25, duration: 0.3 }, // E5
      ],
      // Sequence 2 - Descending melody
      [
        { note: 1046.50, duration: 0.4 }, // C6
        { note: 932.33, duration: 0.3 }, // A#5/Bb5
        { note: 783.99, duration: 0.3 }, // G5
        { note: 659.25, duration: 0.4 }, // E5
        { note: 587.33, duration: 0.3 }, // D5
        { note: 523.25, duration: 0.5 }, // C5
      ],
      // Sequence 3 - Peaceful progression
      [
        { note: 523.25, duration: 0.4 }, // C5
        { note: 587.33, duration: 0.3 }, // D5
        { note: 659.25, duration: 0.3 }, // E5
        { note: 783.99, duration: 0.5 }, // G5
        { note: 880.00, duration: 0.3 }, // A5
        { note: 1046.50, duration: 0.4 }, // C6
      ],
      // Sequence 4 - Gentle resolution
      [
        { note: 783.99, duration: 0.5 }, // G5
        { note: 659.25, duration: 0.3 }, // E5
        { note: 587.33, duration: 0.3 }, // D5
        { note: 523.25, duration: 0.6 }, // C5
        { note: 659.25, duration: 0.3 }, // E5
        { note: 783.99, duration: 0.4 }, // G5
      ]
    ];

    // Select a sequence based on counter to create variation
    const currentSequence = sequences[sequenceCounterRef.current % sequences.length];
    sequenceCounterRef.current += 1;

    // Create a gentle bass note that plays continuously
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    
    // Vary the bass note slightly based on the sequence
    const bassNotes = [110, 123.47, 146.83, 164.81]; // A2, A#2/Bb2, D3, E3
    const bassNote = bassNotes[sequenceCounterRef.current % bassNotes.length];
    
    bassOsc.type = 'sine';
    bassOsc.frequency.value = bassNote;
    bassGain.gain.value = 0.03 * volume; // Very soft bass
    
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    
    bassOsc.start();
    musicNodesRef.current.push({osc: bassOsc, gain: bassGain});

    // Play the melody sequence
    let startTime = ctx.currentTime + 0.1;
    for (const { note, duration } of currentSequence) {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      
      // Use a warmer sound type
      osc.type = 'sine'; // Softer than triangle
      osc.frequency.value = note;
      // Create a gentle fade-in/out for smooth transitions
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(0.04 * volume, startTime + 0.05);
      noteGain.gain.linearRampToValueAtTime(0.02 * volume, startTime + duration - 0.05);
      noteGain.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc.connect(noteGain);
      noteGain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
      
      musicNodesRef.current.push({osc, gain: noteGain});
      startTime += duration + 0.05; // Small gap between notes
    }

    // Schedule the next sequence after a pause
    if (isPlayingRef.current && enabled) {
      const pauseTime = 1500; // 1.5 second pause for more relaxed feel
      loopTimeoutRef.current = window.setTimeout(() => {
        if (enabled && isPlayingRef.current) {
          // Keep only the bass note and remove other notes
          const bassNode = musicNodesRef.current[0]; // Keep bass
          cleanupAudio();
          if (bassNode) {
            musicNodesRef.current.push(bassNode); // Re-add bass
          }
          playMelody(ctx);
        }
      }, pauseTime);
    }
  };

  // Handle changes to enabled state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (enabled && !isPlayingRef.current) {
      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      isPlayingRef.current = true;
      playMelody(ctx);
    } else if (!enabled && isPlayingRef.current) {
      // Stop the music
      isPlayingRef.current = false;
      cleanupAudio();
    }
  }, [enabled]); // Listen to enabled changes

  // Handle volume changes
  useEffect(() => {
    // Update volume for all active nodes
    musicNodesRef.current.forEach(node => {
      // Update gain based on current volume
      if (node.osc.type === 'sine') {
        if (node.osc.frequency.value < 200) {
          // This is the bass note
          node.gain.gain.value = 0.03 * volume;
        } else {
          // This is a melody note
          node.gain.gain.value = 0.04 * volume;
        }
      }
    });
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      cleanupAudio();
    };
  }, []);

  return null; // This component doesn't render anything visual
}