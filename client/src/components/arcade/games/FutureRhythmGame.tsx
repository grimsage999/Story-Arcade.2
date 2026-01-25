import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useArcadeSoundContext } from '../ArcadeSoundProvider';
import {
  GameState,
  GameConfig,
  Sprite,
  createInitialGameState,
  checkCollision,
} from './GameEngine';

const RHYTHM_CONFIG: GameConfig = {
  width: 320,
  height: 200,
  gravity: 0.3,
  playerSpeed: 4,
  jumpForce: -9,
  backgroundColor: '#0a0a1f',
  groundColor: '#1a1a3f',
  playerColor: '#00ffff',
  platformColor: '#2a2a5f',
  collectibleColor: '#ff00ff',
  accentColor: '#00ff88',
};

interface FutureRhythmGameProps {
  currentQuestion: number;
  totalQuestions: number;
  isAnswered: boolean;
  storyInputs?: Record<string, string>;
  onGameProgress?: (progress: number) => void;
}

interface RhythmNote {
  x: number;
  y: number;
  lane: number; // 0, 1, 2, 3 for four lanes
  type: 'normal' | 'special'; // normal = cyan, special = pink
  timestamp: number; // when it should be hit
  hit: boolean;
}

interface RhythmGameState extends GameState {
  notes: RhythmNote[];
  lanes: number[]; // active notes in each lane
  combo: number;
  maxCombo: number;
  hits: { perfect: number; good: number; miss: number };
}

function generateRhythmNotes(stage: number, seed: string, totalQuestions: number): RhythmNote[] {
  const notes: RhythmNote[] = [];
  const random = (min: number, max: number, offset: number = 0) => {
    const seedNum = (seed.charCodeAt(offset % seed.length) || 1) * (stage + 1);
    return min + ((seedNum * (offset + 1) * 9301 + 49297) % 233280) / 233280 * (max - min);
  };

  const noteCount = 8 + Math.floor(random(0, 5, stage));
  const lanePositions = [60, 120, 180, 240]; // x positions for each lane
  
  for (let i = 0; i < noteCount; i++) {
    const lane = Math.floor(random(0, 4, i + 100));
    const timing = i * (RHYTHM_CONFIG.width / noteCount) + random(-20, 20, i + 200);
    
    notes.push({
      x: RHYTHM_CONFIG.width + timing,
      y: lanePositions[lane],
      lane,
      type: random(0, 1, i + 300) > 0.8 ? 'special' : 'normal',
      timestamp: Date.now() + timing * 100, // approximate timing based on position
      hit: false,
    });
  }

  return notes;
}

export function FutureRhythmGame({
  currentQuestion,
  totalQuestions,
  isAnswered,
  storyInputs = {},
  onGameProgress,
}: FutureRhythmGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<RhythmGameState>(() => {
    const baseState = createInitialGameState(RHYTHM_CONFIG, totalQuestions);
    return {
      ...baseState,
      notes: [],
      lanes: [0, 0, 0, 0], // active notes in each lane
      combo: 0,
      maxCombo: 0,
      hits: { perfect: 0, good: 0, miss: 0 },
    };
  });
  const [frameCount, setFrameCount] = useState(0);
  const stateRef = useRef<RhythmGameState>(gameState);
  const keysPressed = useRef({ a: false, s: false, d: false, f: false });
  const { playSound } = useArcadeSoundContext();

  const seed = Object.values(storyInputs).join('').slice(0, 20) || 'future-rhythm';

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') keysPressed.current.a = true;
      if (e.key === 's' || e.key === 'S') keysPressed.current.s = true;
      if (e.key === 'd' || e.key === 'D') keysPressed.current.d = true;
      if (e.key === 'f' || e.key === 'F') keysPressed.current.f = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') keysPressed.current.a = false;
      if (e.key === 's' || e.key === 'S') keysPressed.current.s = false;
      if (e.key === 'd' || e.key === 'D') keysPressed.current.d = false;
      if (e.key === 'f' || e.key === 'F') keysPressed.current.f = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (isAnswered && gameState.stage < currentQuestion) {
      const newStage = currentQuestion;
      const notes = generateRhythmNotes(newStage, seed, totalQuestions);

      setGameState(prev => ({
        ...prev,
        notes: [...prev.notes, ...notes],
        stage: newStage,
        progress: (newStage / totalQuestions) * 100,
        isComplete: newStage >= totalQuestions,
      }));

      onGameProgress?.((newStage / totalQuestions) * 100);
    }
  }, [isAnswered, currentQuestion, gameState.stage, totalQuestions, seed, onGameProgress]);

  useEffect(() => {
    const initialNotes = generateRhythmNotes(0, seed, totalQuestions);
    setGameState(prev => ({
      ...prev,
      notes: initialNotes,
    }));
  }, [seed, totalQuestions]);

  const updateGame = useCallback((state: RhythmGameState, deltaTime: number): RhythmGameState => {
    const newState = { ...state };
    const lanePositions = [60, 120, 180, 240]; // y positions for each lane
    const targetX = 80; // target hit zone
    
    // Move notes toward target
    const updatedNotes = state.notes.map(note => ({
      ...note,
      x: note.x - 2, // move left at constant speed
    })).filter(note => note.x > -20); // remove notes that have passed

    // Check for hits
    const lanes = [0, 0, 0, 0]; // count active notes in each lane
    const newNotes = [...updatedNotes];
    
    // Check for key presses and hits
    const keys = [keysPressed.current.a, keysPressed.current.s, keysPressed.current.d, keysPressed.current.f];
    const keyNames = ['a', 's', 'd', 'f'];
    
    for (let lane = 0; lane < 4; lane++) {
      if (keys[lane]) {
        // Find the closest note in this lane
        const laneNotes = newNotes.filter(note => 
          note.lane === lane && 
          !note.hit && 
          note.x > targetX - 30 && 
          note.x < targetX + 30
        );
        
        if (laneNotes.length > 0) {
          // Find the note closest to the target
          const closestNote = laneNotes.reduce((closest, note) =>
            Math.abs(note.x - targetX) < Math.abs(closest.x - targetX) ? note : closest
          );

          // Mark as hit and update score
          const noteIndex = newNotes.findIndex(n => n === closestNote);
          if (noteIndex !== -1) {
            newNotes[noteIndex] = { ...closestNote, hit: true };

            // Calculate hit accuracy
            const distance = Math.abs(closestNote.x - targetX);
            if (distance < 10) {
              // Perfect hit
              newState.score += closestNote.type === 'special' ? 50 : 20;
              newState.combo += 1;
              newState.hits.perfect += 1;

              // Play perfect hit sound
              playSound('success');
            } else if (distance < 20) {
              // Good hit
              newState.score += closestNote.type === 'special' ? 30 : 15;
              newState.combo += 1;
              newState.hits.good += 1;

              // Play good hit sound
              playSound('select');
            } else {
              // Miss
              newState.combo = 0;
              newState.hits.miss += 1;

              // Play miss sound
              playSound('error');
            }

            // Update max combo
            if (newState.combo > newState.maxCombo) {
              newState.maxCombo = newState.combo;
            }
          }
        }
      }
    }

    // Count active notes in each lane for display
    for (const note of newNotes) {
      if (!note.hit) {
        lanes[note.lane] += 1;
      }
    }

    return {
      ...newState,
      notes: newNotes,
      lanes,
      cameraX: 0, // No scrolling in rhythm game
    };
  }, []);

  const renderGame = useCallback((ctx: CanvasRenderingContext2D, state: RhythmGameState, frame: number) => {
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, RHYTHM_CONFIG.height);
    gradient.addColorStop(0, '#0a0a1f');
    gradient.addColorStop(1, '#1a1a3f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, RHYTHM_CONFIG.width, RHYTHM_CONFIG.height);

    // Draw grid lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + Math.sin(frame * 0.05 + i) * 0.05})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, i * 60);
      ctx.lineTo(RHYTHM_CONFIG.width, i * 60);
      ctx.stroke();
    }

    // Draw lanes
    const lanePositions = [60, 120, 180, 240];
    for (let i = 0; i < 4; i++) {
      // Lane background
      ctx.fillStyle = `rgba(0, 255, 255, 0.05)`;
      ctx.fillRect(0, lanePositions[i] - 20, RHYTHM_CONFIG.width, 40);
      
      // Lane dividers
      ctx.strokeStyle = `rgba(0, 255, 255, 0.3)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, lanePositions[i] - 20);
      ctx.lineTo(RHYTHM_CONFIG.width, lanePositions[i] - 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, lanePositions[i] + 20);
      ctx.lineTo(RHYTHM_CONFIG.width, lanePositions[i] + 20);
      ctx.stroke();
    }

    // Draw target zone
    ctx.fillStyle = `rgba(0, 255, 255, 0.2)`;
    ctx.fillRect(70, 0, 20, RHYTHM_CONFIG.height);
    
    // Draw target indicator
    const pulse = Math.sin(frame * 0.2) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(0, 255, 255, ${0.5 * pulse})`;
    ctx.fillRect(75, 0, 10, RHYTHM_CONFIG.height);

    // Draw notes
    for (const note of state.notes) {
      if (note.hit) continue; // Don't draw hit notes
      
      const noteColor = note.type === 'special' ? '#ff00ff' : '#00ffff';
      const alpha = Math.min(1, (note.x - 50) / RHYTHM_CONFIG.width); // Fade in as they approach
      
      ctx.fillStyle = noteColor;
      ctx.globalAlpha = alpha;
      
      if (note.type === 'special') {
        // Special notes are hexagons
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI / 3) + frame * 0.05;
          const x = note.x + 10 * Math.cos(angle);
          const y = note.y + 10 * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Regular notes are circles
        ctx.beginPath();
        ctx.arc(note.x, note.y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
    }

    // Draw hit feedback
    if (frameCount % 10 < 5) { // Flash briefly on hit
      ctx.fillStyle = `rgba(0, 255, 255, 0.3)`;
      ctx.fillRect(70, 0, 20, RHYTHM_CONFIG.height);
    }

    // UI Elements
    // Score display
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(8, 8, 100, 32);
    ctx.strokeStyle = RHYTHM_CONFIG.playerColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 100, 32);

    ctx.fillStyle = RHYTHM_CONFIG.playerColor;
    ctx.font = '10px monospace';
    ctx.fillText(`SCORE: ${state.score}`, 14, 22);
    ctx.fillText(`COMBO: ${state.combo}`, 14, 34);

    // Progress bar
    const progressWidth = (state.progress / 100) * (RHYTHM_CONFIG.width - 20);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, RHYTHM_CONFIG.height - 12, RHYTHM_CONFIG.width - 20, 4);
    ctx.fillStyle = RHYTHM_CONFIG.playerColor;
    ctx.fillRect(10, RHYTHM_CONFIG.height - 12, progressWidth, 4);

    // Lane indicators
    const keyLabels = ['A', 'S', 'D', 'F'];
    for (let i = 0; i < 4; i++) {
      const yPos = lanePositions[i];
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, yPos - 10, 20, 20);
      ctx.strokeStyle = RHYTHM_CONFIG.playerColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(10, yPos - 10, 20, 20);
      
      ctx.fillStyle = RHYTHM_CONFIG.playerColor;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(keyLabels[i], 20, yPos + 3);
      ctx.textAlign = 'left';
    }

    if (state.isComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, RHYTHM_CONFIG.width, RHYTHM_CONFIG.height);

      ctx.shadowColor = RHYTHM_CONFIG.collectibleColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = RHYTHM_CONFIG.collectibleColor;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SONG COMPLETE!', RHYTHM_CONFIG.width / 2, RHYTHM_CONFIG.height / 2 - 20);
      
      ctx.fillStyle = RHYTHM_CONFIG.playerColor;
      ctx.font = '12px monospace';
      ctx.fillText(`SCORE: ${state.score}`, RHYTHM_CONFIG.width / 2, RHYTHM_CONFIG.height / 2 + 5);
      ctx.fillText(`MAX COMBO: ${state.maxCombo}`, RHYTHM_CONFIG.width / 2, RHYTHM_CONFIG.height / 2 + 20);
      
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }
  }, [frameCount]);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    let lastTime = 0;

    const loop = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!stateRef.current.isComplete) {
        const newState = updateGame(stateRef.current, deltaTime);
        stateRef.current = newState;
        setGameState(newState);
      }

      setFrameCount(f => f + 1);
      renderGame(ctx, stateRef.current, frameCount);

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateGame, renderGame, frameCount]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-md overflow-hidden cabinet-card-frame"
      data-testid="rhythm-game-container"
    >
      <canvas
        ref={canvasRef}
        width={RHYTHM_CONFIG.width}
        height={RHYTHM_CONFIG.height}
        className="w-full h-auto block"
        style={{
          imageRendering: 'pixelated',
        }}
        data-testid="rhythm-game-canvas"
      />

      <div
        className="absolute inset-0 pointer-events-none refined-scanlines opacity-30"
        aria-hidden="true"
      />

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
        <span className="text-cyan-400/70 phosphor-text">
          RHYTHM BLASTER
        </span>
        <span className="text-fuchsia-400/70">
          {Math.round(gameState.progress)}%
        </span>
      </div>

      <div className="absolute top-2 left-2 right-2 text-[8px] font-mono text-center text-cyan-400/70">
        Press A-S-D-F to hit the beats!
      </div>
    </motion.div>
  );
}