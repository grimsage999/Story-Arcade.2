import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  GameState,
  GameConfig,
  Sprite,
  createInitialGameState,
  checkCollision,
} from './GameEngine';

const LEGEND_CONFIG: GameConfig = {
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

interface LegendGameProps {
  currentQuestion: number;
  totalQuestions: number;
  isAnswered: boolean;
  storyInputs?: Record<string, string>;
  onGameProgress?: (progress: number) => void;
}

function generateMythicalLevel(
  stage: number,
  seed: string
): { platforms: Sprite[]; collectibles: Sprite[]; decorations: Sprite[] } {
  const platforms: Sprite[] = [];
  const collectibles: Sprite[] = [];
  const decorations: Sprite[] = [];
  
  const stageWidth = LEGEND_CONFIG.width * 2;
  const stageOffset = stage * stageWidth;
  
  const random = (min: number, max: number, offset: number = 0) => {
    const seedNum = (seed.charCodeAt(offset % seed.length) || 1) * (stage + 1);
    return min + ((seedNum * (offset + 1) * 9301 + 49297) % 233280) / 233280 * (max - min);
  };
  
  platforms.push({
    x: stageOffset,
    y: LEGEND_CONFIG.height - 20,
    width: stageWidth,
    height: 20,
    color: LEGEND_CONFIG.groundColor,
    type: 'platform',
  });
  
  const treeCount = 3 + Math.floor(random(0, 4, stage));
  for (let i = 0; i < treeCount; i++) {
    const treeX = stageOffset + random(20, stageWidth - 40, i + 10);
    const treeHeight = 30 + random(0, 50, i + 20);
    
    decorations.push({
      x: treeX,
      y: LEGEND_CONFIG.height - 20 - treeHeight,
      width: 8,
      height: treeHeight,
      color: '#5a3d1a',
      type: 'decoration',
    });
    
    decorations.push({
      x: treeX - 15,
      y: LEGEND_CONFIG.height - 20 - treeHeight - 20,
      width: 38,
      height: 30,
      color: '#2d5016',
      type: 'decoration',
    });
  }
  
  const rockCount = 2 + Math.floor(random(0, 3, stage + 40));
  for (let i = 0; i < rockCount; i++) {
    const rockX = stageOffset + 80 + random(0, stageWidth - 160, i + 50);
    const rockSize = 12 + random(0, 20, i + 60);
    
    platforms.push({
      x: rockX,
      y: LEGEND_CONFIG.height - 20 - rockSize - random(20, 60, i + 70),
      width: rockSize * 1.5,
      height: rockSize,
      color: '#4a4a4a',
      type: 'platform',
    });
  }
  
  const treasureCount = 2 + Math.floor(random(0, 3, stage + 80));
  for (let i = 0; i < treasureCount; i++) {
    collectibles.push({
      x: stageOffset + 100 + random(0, stageWidth - 200, i + 90),
      y: LEGEND_CONFIG.height - 40 - random(0, 40, i + 100),
      width: 14,
      height: 14,
      color: LEGEND_CONFIG.collectibleColor,
      type: 'collectible',
    });
  }
  
  if (random(0, 1, stage + 110) > 0.4) {
    const gemX = stageOffset + stageWidth / 2 + random(-100, 100, stage + 120);
    collectibles.push({
      x: gemX,
      y: LEGEND_CONFIG.height - 100 - random(0, 30, stage + 130),
      width: 16,
      height: 16,
      color: '#ff00ff',
      type: 'collectible',
    });
  }
  
  return { platforms, collectibles, decorations };
}

function drawHeroCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  frame: number
) {
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(x + 6, y, 8, 10);
  
  ctx.fillStyle = '#ffd4a8';
  ctx.fillRect(x + 5, y + 4, 10, 8);
  
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(x + 6, y + 6, 2, 2);
  ctx.fillRect(x + 12, y + 6, 2, 2);
  
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 12, 16, 10);
  
  const capeWave = Math.sin(frame * 0.1) * 2;
  ctx.fillStyle = '#8b0000';
  ctx.fillRect(x + 16, y + 12 + capeWave, 6, 10 - capeWave);
  
  ctx.fillStyle = '#4a3728';
  const legOffset = Math.sin(frame * 0.25) * 3;
  ctx.fillRect(x + 4, y + 22, 5, 6 + legOffset);
  ctx.fillRect(x + 11, y + 22, 5, 6 - legOffset);
  
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(x - 4, y + 14, 8, 3);
  ctx.fillRect(x - 8, y + 12, 6, 2);
}

export function LegendGame({
  currentQuestion,
  totalQuestions,
  isAnswered,
  storyInputs = {},
  onGameProgress,
}: LegendGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<GameState>(() => 
    createInitialGameState(LEGEND_CONFIG, totalQuestions)
  );
  const [frameCount, setFrameCount] = useState(0);
  const stateRef = useRef<GameState>(gameState);

  const seed = Object.values(storyInputs).join('').slice(0, 20) || 'legendary-quest';

  useEffect(() => {
    if (isAnswered && gameState.stage < currentQuestion) {
      const newStage = currentQuestion;
      const level = generateMythicalLevel(newStage, seed);
      
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
    const initialLevel = generateMythicalLevel(0, seed);
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
    
    const targetX = (state.stage + 0.5) * LEGEND_CONFIG.width * 2;
    const distanceToTarget = targetX - player.x;
    
    if (Math.abs(distanceToTarget) > 5) {
      player.velocityX = Math.sign(distanceToTarget) * LEGEND_CONFIG.playerSpeed;
    } else {
      player.velocityX = 0;
    }
    
    player.velocityY = (player.velocityY || 0) + LEGEND_CONFIG.gravity;
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
    
    if (player.y > LEGEND_CONFIG.height) {
      player.y = LEGEND_CONFIG.height - 50;
      player.velocityY = 0;
    }
    
    const remainingCollectibles: Sprite[] = [];
    for (const collectible of state.collectibles) {
      if (checkCollision(player, collectible)) {
        const value = collectible.color === '#ff00ff' ? 50 : 20;
        newState.score += value;
      } else {
        remainingCollectibles.push(collectible);
      }
    }
    newState.collectibles = remainingCollectibles;
    
    newState.cameraX = Math.max(0, player.x - LEGEND_CONFIG.width / 3);
    newState.player = player;
    
    return newState;
  }, []);

  const renderGame = useCallback((ctx: CanvasRenderingContext2D, state: GameState, frame: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, LEGEND_CONFIG.height);
    gradient.addColorStop(0, '#2d1b0e');
    gradient.addColorStop(0.5, '#1a0f0a');
    gradient.addColorStop(1, '#0d0705');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, LEGEND_CONFIG.width, LEGEND_CONFIG.height);
    
    for (let i = 0; i < 15; i++) {
      const x = ((i * 61 + frame * 0.01) % (LEGEND_CONFIG.width + 30)) - 15;
      const y = (i * 31) % (LEGEND_CONFIG.height - 40);
      const twinkle = Math.sin(frame * 0.03 + i * 2) * 0.4 + 0.6;
      ctx.fillStyle = `rgba(255, 215, 100, ${twinkle * 0.4})`;
      ctx.fillRect(x, y, 2, 2);
    }
    
    for (const decoration of state.decorations) {
      const screenX = decoration.x - state.cameraX * 0.6;
      if (screenX > -decoration.width - 20 && screenX < LEGEND_CONFIG.width + decoration.width + 20) {
        ctx.fillStyle = decoration.color;
        
        if (decoration.width > 20) {
          ctx.beginPath();
          ctx.moveTo(screenX + decoration.width / 2, decoration.y);
          ctx.lineTo(screenX + decoration.width, decoration.y + decoration.height);
          ctx.lineTo(screenX, decoration.y + decoration.height);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(screenX, decoration.y, decoration.width, decoration.height);
        }
      }
    }
    
    for (const platform of state.platforms) {
      const screenX = platform.x - state.cameraX;
      if (screenX > -platform.width && screenX < LEGEND_CONFIG.width + platform.width) {
        ctx.fillStyle = platform.color;
        ctx.fillRect(screenX, platform.y, platform.width, platform.height);
        
        if (platform.height < 20) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(screenX, platform.y, platform.width, 2);
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.fillRect(screenX, platform.y + platform.height - 2, platform.width, 2);
        } else {
          for (let i = 0; i < platform.width; i += 20) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(screenX + i, platform.y, 10, 4);
          }
        }
      }
    }
    
    for (const collectible of state.collectibles) {
      const screenX = collectible.x - state.cameraX;
      if (screenX > -collectible.width && screenX < LEGEND_CONFIG.width + collectible.width) {
        const bob = Math.sin(frame * 0.08 + collectible.x * 0.02) * 3;
        const glow = Math.sin(frame * 0.1 + collectible.x * 0.01) * 0.3 + 0.7;
        
        ctx.shadowColor = collectible.color;
        ctx.shadowBlur = 8 * glow;
        
        if (collectible.color === '#ff00ff') {
          ctx.fillStyle = collectible.color;
          ctx.beginPath();
          ctx.moveTo(screenX + collectible.width / 2, collectible.y + bob);
          ctx.lineTo(screenX + collectible.width, collectible.y + collectible.height / 2 + bob);
          ctx.lineTo(screenX + collectible.width / 2, collectible.y + collectible.height + bob);
          ctx.lineTo(screenX, collectible.y + collectible.height / 2 + bob);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = collectible.color;
          ctx.beginPath();
          ctx.arc(
            screenX + collectible.width / 2,
            collectible.y + collectible.height / 2 + bob,
            collectible.width / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        
        ctx.shadowBlur = 0;
      }
    }
    
    drawHeroCharacter(
      ctx,
      state.player.x - state.cameraX,
      state.player.y,
      state.player.width,
      state.player.height,
      LEGEND_CONFIG.playerColor,
      frame
    );
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(8, 8, 95, 22);
    ctx.strokeStyle = LEGEND_CONFIG.playerColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 95, 22);
    
    ctx.fillStyle = LEGEND_CONFIG.playerColor;
    ctx.font = '10px monospace';
    ctx.fillText(`CHAPTER ${state.stage + 1}/${state.maxStages}`, 14, 22);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(LEGEND_CONFIG.width - 78, 8, 70, 22);
    ctx.strokeStyle = LEGEND_CONFIG.collectibleColor;
    ctx.strokeRect(LEGEND_CONFIG.width - 78, 8, 70, 22);
    
    ctx.fillStyle = LEGEND_CONFIG.collectibleColor;
    ctx.font = '10px monospace';
    ctx.fillText(`${state.score} G`, LEGEND_CONFIG.width - 68, 22);
    
    const progressWidth = (state.progress / 100) * (LEGEND_CONFIG.width - 20);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, LEGEND_CONFIG.height - 14, LEGEND_CONFIG.width - 20, 6);
    
    const progressGradient = ctx.createLinearGradient(10, 0, 10 + progressWidth, 0);
    progressGradient.addColorStop(0, LEGEND_CONFIG.playerColor);
    progressGradient.addColorStop(1, LEGEND_CONFIG.collectibleColor);
    ctx.fillStyle = progressGradient;
    ctx.fillRect(10, LEGEND_CONFIG.height - 14, progressWidth, 6);
    
    if (state.isComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, LEGEND_CONFIG.width, LEGEND_CONFIG.height);
      
      ctx.shadowColor = LEGEND_CONFIG.playerColor;
      ctx.shadowBlur = 15;
      ctx.fillStyle = LEGEND_CONFIG.playerColor;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LEGEND FORGED!', LEGEND_CONFIG.width / 2, LEGEND_CONFIG.height / 2 - 10);
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = LEGEND_CONFIG.collectibleColor;
      ctx.font = '11px monospace';
      ctx.fillText(`Gold: ${state.score}`, LEGEND_CONFIG.width / 2, LEGEND_CONFIG.height / 2 + 18);
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
      data-testid="legend-game-container"
    >
      <canvas
        ref={canvasRef}
        width={LEGEND_CONFIG.width}
        height={LEGEND_CONFIG.height}
        className="w-full h-auto block"
        style={{
          imageRendering: 'pixelated',
        }}
        data-testid="legend-game-canvas"
      />
      
      <div 
        className="absolute inset-0 pointer-events-none refined-scanlines opacity-30"
        aria-hidden="true"
      />
      
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
        <span className="text-amber-400/70 phosphor-text">
          HERO'S QUEST
        </span>
        <span className="text-orange-400/70">
          {Math.round(gameState.progress)}%
        </span>
      </div>
    </motion.div>
  );
}
