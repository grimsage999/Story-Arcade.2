import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  GameState,
  GameConfig,
  Sprite,
  createInitialGameState,
  checkCollision,
} from './GameEngine';

const FUTURE_CONFIG: GameConfig = {
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

interface FutureCityGameProps {
  currentQuestion: number;
  totalQuestions: number;
  isAnswered: boolean;
  storyInputs?: Record<string, string>;
  onGameProgress?: (progress: number) => void;
}

function generateCyberLevel(
  stage: number,
  seed: string
): { platforms: Sprite[]; collectibles: Sprite[]; obstacles: Sprite[]; decorations: Sprite[] } {
  const platforms: Sprite[] = [];
  const collectibles: Sprite[] = [];
  const obstacles: Sprite[] = [];
  const decorations: Sprite[] = [];
  
  const stageWidth = FUTURE_CONFIG.width * 2;
  const stageOffset = stage * stageWidth;
  
  const random = (min: number, max: number, offset: number = 0) => {
    const seedNum = (seed.charCodeAt(offset % seed.length) || 1) * (stage + 1);
    return min + ((seedNum * (offset + 1) * 9301 + 49297) % 233280) / 233280 * (max - min);
  };
  
  platforms.push({
    x: stageOffset,
    y: FUTURE_CONFIG.height - 16,
    width: stageWidth,
    height: 16,
    color: FUTURE_CONFIG.groundColor,
    type: 'platform',
  });
  
  const buildingCount = 4 + Math.floor(random(0, 3, stage));
  for (let i = 0; i < buildingCount; i++) {
    const buildingX = stageOffset + i * (stageWidth / buildingCount);
    const buildingHeight = 40 + random(0, 80, i + 10);
    
    decorations.push({
      x: buildingX,
      y: FUTURE_CONFIG.height - 16 - buildingHeight,
      width: 30 + random(0, 40, i + 20),
      height: buildingHeight,
      color: `rgba(${30 + random(0, 30, i)}, ${30 + random(0, 30, i + 1)}, ${60 + random(0, 40, i + 2)}, 0.6)`,
      type: 'decoration',
    });
  }
  
  const platformCount = 2 + Math.floor(random(0, 2, stage + 30));
  for (let i = 0; i < platformCount; i++) {
    const platX = stageOffset + 100 + random(0, stageWidth - 200, i + 40);
    const platY = FUTURE_CONFIG.height - 50 - random(20, 60, i + 50);
    
    platforms.push({
      x: platX,
      y: platY,
      width: 50 + random(0, 40, i + 60),
      height: 8,
      color: FUTURE_CONFIG.platformColor,
      type: 'platform',
    });
  }
  
  const dataCount = 3 + Math.floor(random(0, 4, stage + 70));
  for (let i = 0; i < dataCount; i++) {
    collectibles.push({
      x: stageOffset + 80 + random(0, stageWidth - 160, i + 80),
      y: FUTURE_CONFIG.height - 40 - random(0, 50, i + 90),
      width: 12,
      height: 12,
      color: FUTURE_CONFIG.collectibleColor,
      type: 'collectible',
    });
  }
  
  const obstacleCount = 1 + Math.floor(random(0, 2, stage + 100));
  for (let i = 0; i < obstacleCount; i++) {
    obstacles.push({
      x: stageOffset + 150 + random(0, stageWidth - 200, i + 110),
      y: FUTURE_CONFIG.height - 16 - 20,
      width: 16,
      height: 20,
      color: '#ff3366',
      type: 'obstacle',
    });
  }
  
  return { platforms, collectibles, obstacles, decorations };
}

function drawCyberCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  frame: number
) {
  const glowIntensity = Math.sin(frame * 0.15) * 0.3 + 0.7;
  
  ctx.shadowColor = color;
  ctx.shadowBlur = 8 * glowIntensity;
  
  ctx.fillStyle = color;
  ctx.fillRect(x + 4, y, width - 8, 6);
  ctx.fillRect(x + 2, y + 6, width - 4, 10);
  ctx.fillRect(x, y + 16, width, 4);
  
  const legOffset = Math.sin(frame * 0.3) * 2;
  ctx.fillRect(x + 2, y + 20, 6, 6 + legOffset);
  ctx.fillRect(x + width - 8, y + 20, 6, 6 - legOffset);
  
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 6, y + 2, 3, 2);
  ctx.fillRect(x + width - 9, y + 2, 3, 2);
}

export function FutureCityGame({
  currentQuestion,
  totalQuestions,
  isAnswered,
  storyInputs = {},
  onGameProgress,
}: FutureCityGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<GameState>(() => 
    createInitialGameState(FUTURE_CONFIG, totalQuestions)
  );
  const [frameCount, setFrameCount] = useState(0);
  const stateRef = useRef<GameState>(gameState);

  const seed = Object.values(storyInputs).join('').slice(0, 20) || 'future-runner';

  useEffect(() => {
    if (isAnswered && gameState.stage < currentQuestion) {
      const newStage = currentQuestion;
      const level = generateCyberLevel(newStage, seed);
      
      setGameState(prev => ({
        ...prev,
        platforms: [...prev.platforms, ...level.platforms],
        collectibles: [...prev.collectibles, ...level.collectibles],
        obstacles: [...prev.obstacles, ...level.obstacles],
        decorations: [...prev.decorations, ...level.decorations],
        stage: newStage,
        progress: (newStage / totalQuestions) * 100,
        isComplete: newStage >= totalQuestions,
      }));
      
      onGameProgress?.((newStage / totalQuestions) * 100);
    }
  }, [isAnswered, currentQuestion, gameState.stage, totalQuestions, seed, onGameProgress]);

  useEffect(() => {
    const initialLevel = generateCyberLevel(0, seed);
    setGameState(prev => ({
      ...prev,
      platforms: initialLevel.platforms,
      collectibles: initialLevel.collectibles,
      obstacles: initialLevel.obstacles,
      decorations: initialLevel.decorations,
    }));
  }, [seed]);

  const updateGame = useCallback((state: GameState, _deltaTime: number): GameState => {
    const newState = { ...state };
    const player = { ...state.player };
    
    const targetX = (state.stage + 0.5) * FUTURE_CONFIG.width * 2;
    const distanceToTarget = targetX - player.x;
    
    if (Math.abs(distanceToTarget) > 5) {
      player.velocityX = Math.sign(distanceToTarget) * FUTURE_CONFIG.playerSpeed;
    } else {
      player.velocityX = 0;
    }
    
    player.velocityY = (player.velocityY || 0) + FUTURE_CONFIG.gravity;
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
    
    if (player.y > FUTURE_CONFIG.height) {
      player.y = FUTURE_CONFIG.height - 50;
      player.velocityY = 0;
    }
    
    const remainingCollectibles: Sprite[] = [];
    for (const collectible of state.collectibles) {
      if (checkCollision(player, collectible)) {
        newState.score += 15;
      } else {
        remainingCollectibles.push(collectible);
      }
    }
    newState.collectibles = remainingCollectibles;
    
    newState.cameraX = Math.max(0, player.x - FUTURE_CONFIG.width / 3);
    newState.player = player;
    
    return newState;
  }, []);

  const renderGame = useCallback((ctx: CanvasRenderingContext2D, state: GameState, frame: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, FUTURE_CONFIG.height);
    gradient.addColorStop(0, '#0a0a1f');
    gradient.addColorStop(1, '#1a1a3f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FUTURE_CONFIG.width, FUTURE_CONFIG.height);
    
    for (let i = 0; i < 20; i++) {
      const x = ((i * 47 + frame * 0.03) % (FUTURE_CONFIG.width + 50)) - 25;
      const y = (i * 29) % (FUTURE_CONFIG.height - 30);
      const size = 1 + (i % 2);
      ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + Math.sin(frame * 0.1 + i) * 0.2})`;
      ctx.fillRect(x, y, size, size);
    }
    
    for (let i = 0; i < 5; i++) {
      const lineY = 20 + i * 40;
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.05 + Math.sin(frame * 0.02 + i) * 0.02})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(FUTURE_CONFIG.width, lineY);
      ctx.stroke();
    }
    
    for (const decoration of state.decorations) {
      const screenX = decoration.x - state.cameraX * 0.5;
      if (screenX > -decoration.width && screenX < FUTURE_CONFIG.width + decoration.width) {
        ctx.fillStyle = decoration.color;
        ctx.fillRect(screenX, decoration.y, decoration.width, decoration.height);
        
        const windowRows = Math.floor(decoration.height / 12);
        const windowCols = Math.floor(decoration.width / 10);
        for (let r = 0; r < windowRows; r++) {
          for (let c = 0; c < windowCols; c++) {
            if ((r + c + frame) % 7 < 3) {
              ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + Math.sin(frame * 0.05 + r + c) * 0.2})`;
              ctx.fillRect(screenX + 4 + c * 10, decoration.y + 4 + r * 12, 4, 6);
            }
          }
        }
      }
    }
    
    for (const platform of state.platforms) {
      const screenX = platform.x - state.cameraX;
      if (screenX > -platform.width && screenX < FUTURE_CONFIG.width + platform.width) {
        ctx.fillStyle = platform.color;
        ctx.fillRect(screenX, platform.y, platform.width, platform.height);
        
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.fillRect(screenX, platform.y, platform.width, 2);
      }
    }
    
    for (const obstacle of state.obstacles) {
      const screenX = obstacle.x - state.cameraX;
      if (screenX > -obstacle.width && screenX < FUTURE_CONFIG.width + obstacle.width) {
        ctx.fillStyle = '#ff3366';
        ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
        
        ctx.fillStyle = `rgba(255, 51, 102, ${0.5 + Math.sin(frame * 0.2) * 0.3})`;
        ctx.fillRect(screenX - 2, obstacle.y - 2, obstacle.width + 4, 2);
      }
    }
    
    for (const collectible of state.collectibles) {
      const screenX = collectible.x - state.cameraX;
      if (screenX > -collectible.width && screenX < FUTURE_CONFIG.width + collectible.width) {
        const pulse = Math.sin(frame * 0.15 + collectible.x * 0.01) * 0.3 + 0.7;
        
        ctx.shadowColor = FUTURE_CONFIG.collectibleColor;
        ctx.shadowBlur = 10 * pulse;
        
        ctx.fillStyle = FUTURE_CONFIG.collectibleColor;
        ctx.beginPath();
        ctx.moveTo(screenX + collectible.width / 2, collectible.y);
        ctx.lineTo(screenX + collectible.width, collectible.y + collectible.height / 2);
        ctx.lineTo(screenX + collectible.width / 2, collectible.y + collectible.height);
        ctx.lineTo(screenX, collectible.y + collectible.height / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
      }
    }
    
    drawCyberCharacter(
      ctx,
      state.player.x - state.cameraX,
      state.player.y,
      state.player.width,
      state.player.height,
      FUTURE_CONFIG.playerColor,
      frame
    );
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(8, 8, 90, 20);
    ctx.strokeStyle = FUTURE_CONFIG.playerColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 90, 20);
    
    ctx.fillStyle = FUTURE_CONFIG.playerColor;
    ctx.font = '10px monospace';
    ctx.fillText(`SECTOR ${state.stage + 1}/${state.maxStages}`, 14, 21);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(FUTURE_CONFIG.width - 68, 8, 60, 20);
    ctx.strokeStyle = FUTURE_CONFIG.collectibleColor;
    ctx.strokeRect(FUTURE_CONFIG.width - 68, 8, 60, 20);
    
    ctx.fillStyle = FUTURE_CONFIG.collectibleColor;
    ctx.fillText(`${state.score}`, FUTURE_CONFIG.width - 58, 21);
    
    const progressWidth = (state.progress / 100) * (FUTURE_CONFIG.width - 20);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, FUTURE_CONFIG.height - 12, FUTURE_CONFIG.width - 20, 4);
    ctx.fillStyle = FUTURE_CONFIG.playerColor;
    ctx.fillRect(10, FUTURE_CONFIG.height - 12, progressWidth, 4);
    
    if (state.isComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, FUTURE_CONFIG.width, FUTURE_CONFIG.height);
      
      ctx.shadowColor = FUTURE_CONFIG.collectibleColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = FUTURE_CONFIG.collectibleColor;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SYSTEM COMPLETE', FUTURE_CONFIG.width / 2, FUTURE_CONFIG.height / 2 - 10);
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = FUTURE_CONFIG.playerColor;
      ctx.font = '11px monospace';
      ctx.fillText(`DATA: ${state.score}`, FUTURE_CONFIG.width / 2, FUTURE_CONFIG.height / 2 + 18);
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
      data-testid="future-game-container"
    >
      <canvas
        ref={canvasRef}
        width={FUTURE_CONFIG.width}
        height={FUTURE_CONFIG.height}
        className="w-full h-auto block"
        style={{
          imageRendering: 'pixelated',
        }}
        data-testid="future-game-canvas"
      />
      
      <div 
        className="absolute inset-0 pointer-events-none refined-scanlines opacity-30"
        aria-hidden="true"
      />
      
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
        <span className="text-cyan-400/70 phosphor-text">
          CYBER DASH
        </span>
        <span className="text-fuchsia-400/70">
          {Math.round(gameState.progress)}%
        </span>
      </div>
    </motion.div>
  );
}
