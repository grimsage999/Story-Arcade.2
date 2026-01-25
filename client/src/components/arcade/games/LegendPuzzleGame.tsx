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

const PUZZLE_CONFIG: GameConfig = {
  width: 320,
  height: 200,
  gravity: 0.35,
  playerSpeed: 2.8,
  jumpForce: -8.5,
  backgroundColor: '#1a0f0a',
  groundColor: '#3d2810',
  playerColor: '#ffd700',
  platformColor: '#5a4020',
  collectibleColor: '#ff6b35',
  accentColor: '#8b4513',
};

interface LegendPuzzleGameProps {
  currentQuestion: number;
  totalQuestions: number;
  isAnswered: boolean;
  storyInputs?: Record<string, string>;
  onGameProgress?: (progress: number) => void;
}

interface PuzzlePiece {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  id: number;
  connected: boolean;
  targetX: number;
  targetY: number;
}

interface PuzzleGameState extends GameState {
  pieces: PuzzlePiece[];
  connections: { from: number; to: number }[];
  selectedPiece: number | null;
  solvedPieces: number;
}

function generatePuzzle(stage: number, seed: string): PuzzlePiece[] {
  const pieces: PuzzlePiece[] = [];
  const random = (min: number, max: number, offset: number = 0) => {
    const seedNum = (seed.charCodeAt(offset % seed.length) || 1) * (stage + 1);
    return min + ((seedNum * (offset + 1) * 9301 + 49297) % 233280) / 233280 * (max - min);
  };

  const pieceCount = 4 + Math.floor(random(0, 3, stage));
  const gridSize = Math.ceil(Math.sqrt(pieceCount));
  
  // Create a simple puzzle pattern
  for (let i = 0; i < pieceCount; i++) {
    const gridX = i % gridSize;
    const gridY = Math.floor(i / gridSize);
    
    // Random starting positions (off-screen initially)
    const startX = -50 - random(0, 100, i * 10);
    const startY = 50 + random(0, 100, i * 20);
    
    // Target positions for the puzzle solution
    const targetX = 80 + gridX * 40;
    const targetY = 60 + gridY * 40;
    
    pieces.push({
      x: startX,
      y: startY,
      width: 30,
      height: 30,
      color: i % 2 === 0 ? '#ff6b35' : '#8b4513',
      id: i,
      connected: false,
      targetX,
      targetY,
    });
  }

  return pieces;
}

export function LegendPuzzleGame({
  currentQuestion,
  totalQuestions,
  isAnswered,
  storyInputs = {},
  onGameProgress,
}: LegendPuzzleGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<PuzzleGameState>(() => {
    const baseState = createInitialGameState(PUZZLE_CONFIG, totalQuestions);
    return {
      ...baseState,
      pieces: [],
      connections: [],
      selectedPiece: null,
      solvedPieces: 0,
    };
  });
  const [frameCount, setFrameCount] = useState(0);
  const stateRef = useRef<PuzzleGameState>(gameState);
  const mousePos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const { playSound } = useArcadeSoundContext();

  const seed = Object.values(storyInputs).join('').slice(0, 20) || 'legend-puzzle';

  // Mouse event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mousePos.current = { x, y };

      // Check if clicked on a piece
      for (let i = 0; i < stateRef.current.pieces.length; i++) {
        const piece = stateRef.current.pieces[i];
        if (!piece.connected &&
            x >= piece.x && x <= piece.x + piece.width &&
            y >= piece.y && y <= piece.y + piece.height) {
          setGameState(prev => ({ ...prev, selectedPiece: piece.id }));
          isDragging.current = true;

          // Play sound when picking up a piece
          playSound('hover');
          break;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      mousePos.current = { x, y };
      
      if (isDragging.current && stateRef.current.selectedPiece !== null) {
        setGameState(prev => ({
          ...prev,
          pieces: prev.pieces.map(piece => 
            piece.id === prev.selectedPiece 
              ? { ...piece, x: x - piece.width / 2, y: y - piece.height / 2 } 
              : piece
          )
        }));
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      if (stateRef.current.selectedPiece !== null) {
        setGameState(prev => {
          // Check if the selected piece is close enough to its target
          const piece = prev.pieces.find(p => p.id === prev.selectedPiece);
          if (piece) {
            const distance = Math.sqrt(
              Math.pow(piece.x - piece.targetX, 2) +
              Math.pow(piece.y - piece.targetY, 2)
            );

            let newPieces = [...prev.pieces];
            let newSolvedPieces = prev.solvedPieces;
            let newScore = prev.score;

            if (distance < 20 && !piece.connected) {
              // Connect the piece to its target
              newPieces = newPieces.map(p =>
                p.id === piece.id
                  ? { ...p, x: p.targetX, y: p.targetY, connected: true }
                  : p
              );
              newSolvedPieces += 1;
              newScore += 25;

              // Play success sound when connecting a piece
              playSound('success');
            } else if (!piece.connected) {
              // Return to original position if not connected
              newPieces = newPieces.map(p =>
                p.id === piece.id
                  ? { ...p, x: -50 - Math.random() * 100, y: 50 + Math.random() * 100 }
                  : p
              );

              // Play error sound when piece doesn't connect
              playSound('error');
            }

            // Check if puzzle is complete
            const isComplete = newSolvedPieces >= prev.pieces.length;

            if (isComplete) {
              // Play level up sound when puzzle is complete
              playSound('levelUp');
            }

            return {
              ...prev,
              pieces: newPieces,
              selectedPiece: null,
              solvedPieces: newSolvedPieces,
              score: newScore,
              isComplete,
            };
          }
          return { ...prev, selectedPiece: null };
        });
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (isAnswered && gameState.stage < currentQuestion) {
      const newStage = currentQuestion;
      const pieces = generatePuzzle(newStage, seed);

      setGameState(prev => ({
        ...prev,
        pieces: [...prev.pieces, ...pieces],
        stage: newStage,
        progress: (newStage / totalQuestions) * 100,
        isComplete: newStage >= totalQuestions,
      }));

      onGameProgress?.((newStage / totalQuestions) * 100);
    }
  }, [isAnswered, currentQuestion, gameState.stage, totalQuestions, seed, onGameProgress]);

  useEffect(() => {
    const initialPuzzle = generatePuzzle(0, seed);
    setGameState(prev => ({
      ...prev,
      pieces: initialPuzzle,
    }));
  }, [seed]);

  const updateGame = useCallback((state: PuzzleGameState, deltaTime: number): PuzzleGameState => {
    // In puzzle game, we mainly handle state updates from user interactions
    // So we just return the current state with updated camera position
    return {
      ...state,
      cameraX: 0, // No scrolling in puzzle game
    };
  }, []);

  const renderGame = useCallback((ctx: CanvasRenderingContext2D, state: PuzzleGameState, frame: number) => {
    // Background with mystical theme
    const gradient = ctx.createLinearGradient(0, 0, 0, PUZZLE_CONFIG.height);
    gradient.addColorStop(0, '#2d1b0e');
    gradient.addColorStop(0.5, '#1a0f0a');
    gradient.addColorStop(1, '#0d0705');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, PUZZLE_CONFIG.width, PUZZLE_CONFIG.height);

    // Draw mystical background elements
    for (let i = 0; i < 15; i++) {
      const x = ((i * 61 + frame * 0.01) % (PUZZLE_CONFIG.width + 30)) - 15;
      const y = (i * 31) % (PUZZLE_CONFIG.height - 40);
      const twinkle = Math.sin(frame * 0.03 + i * 2) * 0.4 + 0.6;
      ctx.fillStyle = `rgba(255, 215, 100, ${twinkle * 0.4})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Draw target positions (puzzle outline)
    for (const piece of state.pieces) {
      if (!piece.connected) {
        // Draw target outline
        ctx.strokeStyle = `rgba(255, 215, 100, 0.3)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(piece.targetX, piece.targetY, piece.width, piece.height);
        ctx.setLineDash([]);
      } else {
        // Draw connection line to target
        ctx.strokeStyle = `rgba(255, 215, 100, 0.5)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(piece.x + piece.width / 2, piece.y + piece.height / 2);
        ctx.lineTo(piece.targetX + piece.width / 2, piece.targetY + piece.height / 2);
        ctx.stroke();
      }
    }

    // Draw pieces
    for (const piece of state.pieces) {
      // Highlight selected piece
      if (piece.id === state.selectedPiece) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
      }

      // Draw piece with different styles based on connection status
      if (piece.connected) {
        // Connected pieces have a golden border
        ctx.fillStyle = piece.color;
        ctx.fillRect(piece.x, piece.y, piece.width, piece.height);
        
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(piece.x, piece.y, piece.width, piece.height);
      } else {
        // Unconnected pieces
        ctx.fillStyle = piece.color;
        ctx.fillRect(piece.x, piece.y, piece.width, piece.height);
        
        // Add texture to unconnected pieces
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < piece.width; i += 5) {
          ctx.fillRect(piece.x + i, piece.y, 2, piece.height);
        }
      }

      ctx.shadowBlur = 0;
    }

    // Draw target puzzle shape (the completed form)
    if (state.solvedPieces > 0) {
      ctx.strokeStyle = `rgba(255, 215, 100, 0.2)`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      
      // Draw a simple shape representing the completed puzzle
      const centerX = PUZZLE_CONFIG.width / 2;
      const centerY = PUZZLE_CONFIG.height / 2;
      const radius = 40;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // UI Elements
    // Score display
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(8, 8, 110, 32);
    ctx.strokeStyle = PUZZLE_CONFIG.playerColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 110, 32);

    ctx.fillStyle = PUZZLE_CONFIG.playerColor;
    ctx.font = '10px monospace';
    ctx.fillText(`PIECES: ${state.solvedPieces}/${state.pieces.length}`, 14, 22);
    ctx.fillText(`SCORE: ${state.score}`, 14, 34);

    // Progress bar
    const progressWidth = (state.progress / 100) * (PUZZLE_CONFIG.width - 20);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, PUZZLE_CONFIG.height - 14, PUZZLE_CONFIG.width - 20, 6);

    const progressGradient = ctx.createLinearGradient(10, 0, 10 + progressWidth, 0);
    progressGradient.addColorStop(0, PUZZLE_CONFIG.playerColor);
    progressGradient.addColorStop(1, PUZZLE_CONFIG.collectibleColor);
    ctx.fillStyle = progressGradient;
    ctx.fillRect(10, PUZZLE_CONFIG.height - 14, progressWidth, 6);

    if (state.isComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, PUZZLE_CONFIG.width, PUZZLE_CONFIG.height);

      ctx.shadowColor = PUZZLE_CONFIG.playerColor;
      ctx.shadowBlur = 15;
      ctx.fillStyle = PUZZLE_CONFIG.playerColor;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PUZZLE SOLVED!', PUZZLE_CONFIG.width / 2, PUZZLE_CONFIG.height / 2 - 20);
      
      ctx.fillStyle = PUZZLE_CONFIG.collectibleColor;
      ctx.font = '12px monospace';
      ctx.fillText(`SCORE: ${state.score}`, PUZZLE_CONFIG.width / 2, PUZZLE_CONFIG.height / 2 + 5);
      ctx.fillText(`PIECES: ${state.solvedPieces}/${state.pieces.length}`, PUZZLE_CONFIG.width / 2, PUZZLE_CONFIG.height / 2 + 20);
      
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }
  }, []);

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
      data-testid="puzzle-game-container"
    >
      <canvas
        ref={canvasRef}
        width={PUZZLE_CONFIG.width}
        height={PUZZLE_CONFIG.height}
        className="w-full h-auto block"
        style={{
          imageRendering: 'pixelated',
        }}
        data-testid="puzzle-game-canvas"
      />

      <div
        className="absolute inset-0 pointer-events-none refined-scanlines opacity-30"
        aria-hidden="true"
      />

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
        <span className="text-amber-400/70 phosphor-text">
          LEGEND PUZZLER
        </span>
        <span className="text-orange-400/70">
          {Math.round(gameState.progress)}%
        </span>
      </div>

      <div className="absolute top-2 left-2 right-2 text-[8px] font-mono text-center text-amber-400/70">
        Click and drag pieces to solve the legend!
      </div>
    </motion.div>
  );
}