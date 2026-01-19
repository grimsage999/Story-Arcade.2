import { useRef, useEffect, useCallback } from 'react';

export interface Sprite {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  velocityX?: number;
  velocityY?: number;
  grounded?: boolean;
  type?: 'player' | 'platform' | 'collectible' | 'obstacle' | 'decoration';
}

export interface GameState {
  player: Sprite;
  platforms: Sprite[];
  collectibles: Sprite[];
  obstacles: Sprite[];
  decorations: Sprite[];
  score: number;
  progress: number;
  stage: number;
  maxStages: number;
  isComplete: boolean;
  cameraX: number;
}

export interface GameConfig {
  width: number;
  height: number;
  gravity: number;
  playerSpeed: number;
  jumpForce: number;
  backgroundColor: string;
  groundColor: string;
  playerColor: string;
  platformColor: string;
  collectibleColor: string;
  accentColor: string;
}

export const DEFAULT_CONFIG: GameConfig = {
  width: 400,
  height: 300,
  gravity: 0.5,
  playerSpeed: 3,
  jumpForce: -10,
  backgroundColor: '#0a0a1a',
  groundColor: '#1a1a2e',
  playerColor: '#00ffff',
  platformColor: '#2a2a4e',
  collectibleColor: '#ffd700',
  accentColor: '#ff00ff',
};

export function createInitialGameState(config: GameConfig, maxStages: number = 5): GameState {
  return {
    player: {
      x: 50,
      y: config.height - 60,
      width: 20,
      height: 24,
      color: config.playerColor,
      velocityX: 0,
      velocityY: 0,
      grounded: true,
      type: 'player',
    },
    platforms: [],
    collectibles: [],
    obstacles: [],
    decorations: [],
    score: 0,
    progress: 0,
    stage: 0,
    maxStages,
    isComplete: false,
    cameraX: 0,
  };
}

export function drawPixelCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  frame: number = 0
) {
  const pixelSize = 4;
  const cols = Math.floor(width / pixelSize);
  const rows = Math.floor(height / pixelSize);
  
  const pattern = [
    [0, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1],
    [0, 1, 2, 1, 2, 1],
    [0, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [0, 1, 0, 0, 1, 0],
  ];

  const walkFrame = frame % 2;
  
  for (let row = 0; row < Math.min(rows, pattern.length); row++) {
    for (let col = 0; col < Math.min(cols, pattern[row].length); col++) {
      const pixel = pattern[row][col];
      if (pixel > 0) {
        if (pixel === 2) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = color;
        }
        
        let offsetY = 0;
        if (row >= 6 && walkFrame === 1) {
          offsetY = col < 3 ? -2 : 2;
        }
        
        ctx.fillRect(
          x + col * pixelSize,
          y + row * pixelSize + offsetY,
          pixelSize - 1,
          pixelSize - 1
        );
      }
    }
  }
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  cameraX: number = 0
) {
  const screenX = sprite.x - cameraX;
  
  if (screenX < -sprite.width || screenX > ctx.canvas.width + sprite.width) {
    return;
  }
  
  ctx.fillStyle = sprite.color;
  
  if (sprite.type === 'collectible') {
    ctx.beginPath();
    ctx.arc(
      screenX + sprite.width / 2,
      sprite.y + sprite.height / 2,
      sprite.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(
      screenX + sprite.width / 2 - 2,
      sprite.y + sprite.height / 2 - 2,
      sprite.width / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  } else if (sprite.type === 'platform') {
    ctx.fillRect(screenX, sprite.y, sprite.width, sprite.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(screenX, sprite.y, sprite.width, 2);
  } else if (sprite.type === 'decoration') {
    ctx.globalAlpha = 0.3;
    ctx.fillRect(screenX, sprite.y, sprite.width, sprite.height);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillRect(screenX, sprite.y, sprite.width, sprite.height);
  }
}

export function checkCollision(a: Sprite, b: Sprite): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function useGameLoop(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  gameState: GameState,
  config: GameConfig,
  updateGame: (state: GameState, deltaTime: number) => GameState,
  renderGame: (ctx: CanvasRenderingContext2D, state: GameState, config: GameConfig) => void
) {
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const stateRef = useRef<GameState>(gameState);
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  const gameLoop = useCallback((timestamp: number) => {
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;
    frameCountRef.current++;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!stateRef.current.isComplete) {
      stateRef.current = updateGame(stateRef.current, deltaTime);
    }

    ctx.clearRect(0, 0, config.width, config.height);
    renderGame(ctx, stateRef.current, config);

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [canvasRef, config, updateGame, renderGame]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  return { frameCount: frameCountRef.current, currentState: stateRef.current };
}

export function generatePlatformLevel(
  config: GameConfig,
  stage: number,
  seed: string = ''
): { platforms: Sprite[]; collectibles: Sprite[]; decorations: Sprite[] } {
  const platforms: Sprite[] = [];
  const collectibles: Sprite[] = [];
  const decorations: Sprite[] = [];
  
  const stageWidth = config.width * 2;
  const stageOffset = stage * stageWidth;
  
  const random = (min: number, max: number, offset: number = 0) => {
    const seedNum = (seed.charCodeAt(offset % seed.length) || 1) * (stage + 1);
    return min + ((seedNum * (offset + 1) * 9301 + 49297) % 233280) / 233280 * (max - min);
  };
  
  platforms.push({
    x: stageOffset,
    y: config.height - 20,
    width: stageWidth,
    height: 20,
    color: config.groundColor,
    type: 'platform',
  });
  
  const platformCount = 3 + Math.floor(random(0, 3, stage));
  for (let i = 0; i < platformCount; i++) {
    const platX = stageOffset + 100 + random(0, stageWidth - 200, i);
    const platY = config.height - 60 - random(20, 100, i + 10);
    const platWidth = 60 + random(0, 80, i + 20);
    
    platforms.push({
      x: platX,
      y: platY,
      width: platWidth,
      height: 12,
      color: config.platformColor,
      type: 'platform',
    });
    
    if (random(0, 1, i + 30) > 0.5) {
      collectibles.push({
        x: platX + platWidth / 2 - 8,
        y: platY - 24,
        width: 16,
        height: 16,
        color: config.collectibleColor,
        type: 'collectible',
      });
    }
  }
  
  const collectibleCount = 2 + Math.floor(random(0, 3, stage + 50));
  for (let i = 0; i < collectibleCount; i++) {
    collectibles.push({
      x: stageOffset + 150 + random(0, stageWidth - 200, i + 60),
      y: config.height - 50 - random(0, 30, i + 70),
      width: 16,
      height: 16,
      color: config.collectibleColor,
      type: 'collectible',
    });
  }
  
  const decorCount = 5 + Math.floor(random(0, 5, stage + 100));
  for (let i = 0; i < decorCount; i++) {
    decorations.push({
      x: stageOffset + random(0, stageWidth, i + 110),
      y: config.height - 20 - random(10, 60, i + 120),
      width: 8 + random(0, 20, i + 130),
      height: 10 + random(0, 50, i + 140),
      color: config.accentColor,
      type: 'decoration',
    });
  }
  
  return { platforms, collectibles, decorations };
}
