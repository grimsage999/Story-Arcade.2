import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  GameState,
  GameConfig,
  Sprite,
  createInitialGameState,
  drawPixelCharacter,
  drawSprite,
  checkCollision,
  generatePlatformLevel,
} from './GameEngine';

const ORIGIN_CONFIG: GameConfig = {
  width: 320,
  height: 200,
  gravity: 0.4,
  playerSpeed: 2.5,
  jumpForce: -8,
  backgroundColor: '#1a0a2e',
  groundColor: '#3d2066',
  playerColor: '#00ffcc',
  platformColor: '#5a3d7a',
  collectibleColor: '#ffd700',
  accentColor: '#ff6b9d',
};

interface OriginGameProps {
  currentQuestion: number;
  totalQuestions: number;
  isAnswered: boolean;
  storyInputs?: Record<string, string>;
  onGameProgress?: (progress: number) => void;
}

export function OriginGame({
  currentQuestion,
  totalQuestions,
  isAnswered,
  storyInputs = {},
  onGameProgress,
}: OriginGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<GameState>(() => 
    createInitialGameState(ORIGIN_CONFIG, totalQuestions)
  );
  const [frameCount, setFrameCount] = useState(0);
  const stateRef = useRef<GameState>(gameState);
  const targetStageRef = useRef(0);

  const seed = Object.values(storyInputs).join('').slice(0, 20) || 'origin-adventure';

  useEffect(() => {
    targetStageRef.current = currentQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    if (isAnswered && gameState.stage < currentQuestion) {
      const newStage = currentQuestion;
      const level = generatePlatformLevel(ORIGIN_CONFIG, newStage, seed);
      
      setGameState(prev => ({
        ...prev,
        platforms: [...prev.platforms, ...level.platforms],
        collectibles: [...prev.collectibles, ...level.collectibles],
        decorations: [...prev.decorations, ...level.decorations],
        stage: newStage,
        progress: (newStage / totalQuestions) * 100,
        isComplete: newStage >= totalQuestions,
      }));
      
      onGameProgress?.((newStage / totalQuestions) * 100);
    }
  }, [isAnswered, currentQuestion, gameState.stage, totalQuestions, seed, onGameProgress]);

  useEffect(() => {
    const initialLevel = generatePlatformLevel(ORIGIN_CONFIG, 0, seed);
    setGameState(prev => ({
      ...prev,
      platforms: initialLevel.platforms,
      collectibles: initialLevel.collectibles,
      decorations: initialLevel.decorations,
    }));
  }, [seed]);

  const updateGame = useCallback((state: GameState, _deltaTime: number): GameState => {
    const newState = { ...state };
    const player = { ...state.player };
    
    const targetX = (state.stage + 0.5) * ORIGIN_CONFIG.width * 2;
    const distanceToTarget = targetX - player.x;
    
    if (Math.abs(distanceToTarget) > 5) {
      player.velocityX = Math.sign(distanceToTarget) * ORIGIN_CONFIG.playerSpeed;
    } else {
      player.velocityX = 0;
    }
    
    player.velocityY = (player.velocityY || 0) + ORIGIN_CONFIG.gravity;
    
    player.x += player.velocityX || 0;
    player.y += player.velocityY || 0;
    
    player.grounded = false;
    for (const platform of state.platforms) {
      if (
        player.velocityY! >= 0 &&
        player.x + player.width > platform.x &&
        player.x < platform.x + platform.width &&
        player.y + player.height >= platform.y &&
        player.y + player.height <= platform.y + platform.height + 10
      ) {
        player.y = platform.y - player.height;
        player.velocityY = 0;
        player.grounded = true;
        break;
      }
    }
    
    if (player.y > ORIGIN_CONFIG.height) {
      player.y = ORIGIN_CONFIG.height - 60;
      player.velocityY = 0;
      player.grounded = true;
    }
    
    const remainingCollectibles: Sprite[] = [];
    for (const collectible of state.collectibles) {
      if (checkCollision(player, collectible)) {
        newState.score += 10;
      } else {
        remainingCollectibles.push(collectible);
      }
    }
    newState.collectibles = remainingCollectibles;
    
    newState.cameraX = Math.max(0, player.x - ORIGIN_CONFIG.width / 3);
    newState.player = player;
    
    return newState;
  }, []);

  const renderGame = useCallback((ctx: CanvasRenderingContext2D, state: GameState, frame: number) => {
    ctx.fillStyle = ORIGIN_CONFIG.backgroundColor;
    ctx.fillRect(0, 0, ORIGIN_CONFIG.width, ORIGIN_CONFIG.height);
    
    const starCount = 30;
    for (let i = 0; i < starCount; i++) {
      const starX = ((i * 73 + frame * 0.02) % (ORIGIN_CONFIG.width + 100)) - 50;
      const starY = (i * 37) % (ORIGIN_CONFIG.height - 40);
      const twinkle = Math.sin(frame * 0.05 + i) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.6})`;
      ctx.fillRect(starX, starY, 2, 2);
    }
    
    for (const decoration of state.decorations) {
      drawSprite(ctx, decoration, state.cameraX);
    }
    
    for (const platform of state.platforms) {
      drawSprite(ctx, platform, state.cameraX);
    }
    
    for (const collectible of state.collectibles) {
      const bobY = Math.sin(frame * 0.1 + collectible.x * 0.01) * 3;
      const bobbingCollectible = { ...collectible, y: collectible.y + bobY };
      drawSprite(ctx, bobbingCollectible, state.cameraX);
    }
    
    const walkFrame = Math.abs(state.player.velocityX || 0) > 0.1 ? Math.floor(frame / 8) : 0;
    drawPixelCharacter(
      ctx,
      state.player.x - state.cameraX,
      state.player.y,
      state.player.width,
      state.player.height,
      state.player.color,
      walkFrame
    );
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(8, 8, 100, 24);
    ctx.strokeStyle = ORIGIN_CONFIG.accentColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 100, 24);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText(`STAGE ${state.stage + 1}/${state.maxStages}`, 14, 22);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(ORIGIN_CONFIG.width - 78, 8, 70, 24);
    ctx.strokeStyle = ORIGIN_CONFIG.collectibleColor;
    ctx.strokeRect(ORIGIN_CONFIG.width - 78, 8, 70, 24);
    
    ctx.fillStyle = ORIGIN_CONFIG.collectibleColor;
    ctx.beginPath();
    ctx.arc(ORIGIN_CONFIG.width - 66, 20, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${state.score}`, ORIGIN_CONFIG.width - 54, 24);
    
    const progressWidth = (state.progress / 100) * (ORIGIN_CONFIG.width - 20);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, ORIGIN_CONFIG.height - 14, ORIGIN_CONFIG.width - 20, 6);
    ctx.fillStyle = `linear-gradient(90deg, ${ORIGIN_CONFIG.playerColor}, ${ORIGIN_CONFIG.accentColor})`;
    ctx.fillStyle = ORIGIN_CONFIG.playerColor;
    ctx.fillRect(10, ORIGIN_CONFIG.height - 14, progressWidth, 6);
    
    if (state.isComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, ORIGIN_CONFIG.width, ORIGIN_CONFIG.height);
      
      ctx.fillStyle = ORIGIN_CONFIG.collectibleColor;
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('QUEST COMPLETE!', ORIGIN_CONFIG.width / 2, ORIGIN_CONFIG.height / 2 - 10);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.fillText(`Score: ${state.score}`, ORIGIN_CONFIG.width / 2, ORIGIN_CONFIG.height / 2 + 20);
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
      data-testid="origin-game-container"
    >
      <canvas
        ref={canvasRef}
        width={ORIGIN_CONFIG.width}
        height={ORIGIN_CONFIG.height}
        className="w-full h-auto block"
        style={{
          imageRendering: 'pixelated',
        }}
        data-testid="origin-game-canvas"
      />
      
      <div 
        className="absolute inset-0 pointer-events-none refined-scanlines opacity-30"
        aria-hidden="true"
      />
      
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
        <span className="text-cyan-400/70 phosphor-text">
          ORIGIN QUEST
        </span>
        <span className="text-amber-400/70">
          {Math.round(gameState.progress)}%
        </span>
      </div>
    </motion.div>
  );
}
