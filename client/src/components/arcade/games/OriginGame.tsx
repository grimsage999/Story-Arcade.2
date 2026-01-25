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

function generateStoryThemedLevel(
  stage: number,
  seed: string
): { platforms: Sprite[]; collectibles: Sprite[]; decorations: Sprite[]; obstacles: Sprite[] } {
  const platforms: Sprite[] = [];
  const collectibles: Sprite[] = [];
  const decorations: Sprite[] = [];
  const obstacles: Sprite[] = [];

  const stageWidth = ORIGIN_CONFIG.width * 2;
  const stageOffset = stage * stageWidth;

  const random = (min: number, max: number, offset: number = 0) => {
    const seedNum = (seed.charCodeAt(offset % seed.length) || 1) * (stage + 1);
    return min + ((seedNum * (offset + 1) * 9301 + 49297) % 233280) / 233280 * (max - min);
  };

  // Ground platform
  platforms.push({
    x: stageOffset,
    y: ORIGIN_CONFIG.height - 16,
    width: stageWidth,
    height: 16,
    color: ORIGIN_CONFIG.groundColor,
    type: 'platform',
  });

  // Story-themed decorations (books, scrolls, quills)
  const bookCount = 3 + Math.floor(random(0, 3, stage));
  for (let i = 0; i < bookCount; i++) {
    const bookX = stageOffset + 50 + random(0, stageWidth - 100, i + 10);
    const bookY = ORIGIN_CONFIG.height - 40 - random(0, 30, i + 20);

    decorations.push({
      x: bookX,
      y: bookY,
      width: 12,
      height: 16,
      color: '#8B4513', // Brown book
      type: 'decoration',
    });

    // Book spine detail
    decorations.push({
      x: bookX + 2,
      y: bookY + 2,
      width: 2,
      height: 12,
      color: '#FFD700', // Gold spine
      type: 'decoration',
    });
  }

  // Floating scrolls
  const scrollCount = 2 + Math.floor(random(0, 2, stage + 30));
  for (let i = 0; i < scrollCount; i++) {
    const scrollX = stageOffset + 100 + random(0, stageWidth - 200, i + 40);
    const scrollY = 30 + random(0, ORIGIN_CONFIG.height - 80, i + 50);

    decorations.push({
      x: scrollX,
      y: scrollY,
      width: 20,
      height: 8,
      color: '#F5DEB3', // Paper color
      type: 'decoration',
    });

    // Scroll ends
    decorations.push({
      x: scrollX - 2,
      y: scrollY,
      width: 4,
      height: 8,
      color: '#8B4513',
      type: 'decoration',
    });
    decorations.push({
      x: scrollX + 20,
      y: scrollY,
      width: 4,
      height: 8,
      color: '#8B4513',
      type: 'decoration',
    });
  }

  // Platforms for jumping
  const platformCount = 4 + Math.floor(random(0, 3, stage + 60));
  for (let i = 0; i < platformCount; i++) {
    const platX = stageOffset + 80 + random(0, stageWidth - 160, i + 70);
    const platY = ORIGIN_CONFIG.height - 50 - random(20, 80, i + 80);
    const platWidth = 30 + random(0, 40, i + 90);

    platforms.push({
      x: platX,
      y: platY,
      width: platWidth,
      height: 8,
      color: ORIGIN_CONFIG.platformColor,
      type: 'platform',
    });
  }

  // Story-themed collectibles (quills, ink pots, gems)
  const collectibleCount = 3 + Math.floor(random(0, 3, stage + 100));
  for (let i = 0; i < collectibleCount; i++) {
    const colX = stageOffset + 120 + random(0, stageWidth - 240, i + 110);
    const colY = ORIGIN_CONFIG.height - 60 - random(0, 60, i + 120);

    // Randomly choose between quill, ink pot, or gem
    const type = Math.floor(random(0, 3, i + 130));
    let width = 12, height = 12, color = ORIGIN_CONFIG.collectibleColor;

    if (type === 0) { // Quill
      width = 14;
      height = 8;
      color = '#F5F5DC'; // Off-white quill
    } else if (type === 1) { // Ink pot
      width = 10;
      height = 10;
      color = '#00008B'; // Dark blue ink
    } else { // Gem
      width = 12;
      height = 12;
      color = ORIGIN_CONFIG.collectibleColor;
    }

    collectibles.push({
      x: colX,
      y: colY,
      width,
      height,
      color,
      type: 'collectible',
    });
  }

  // Obstacles (challenges)
  const obstacleCount = 1 + Math.floor(random(0, 2, stage + 140));
  for (let i = 0; i < obstacleCount; i++) {
    obstacles.push({
      x: stageOffset + 150 + random(0, stageWidth - 200, i + 150),
      y: ORIGIN_CONFIG.height - 16 - 20,
      width: 16,
      height: 20,
      color: '#8B0000', // Dark red obstacle
      type: 'obstacle',
    });
  }

  return { platforms, collectibles, decorations, obstacles };
}

function drawStoryCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  frame: number
) {
  // Draw character with story-themed elements (hat, sash, etc.)
  ctx.fillStyle = '#8B4513'; // Brown hat
  ctx.fillRect(x + 4, y, width - 8, 6);

  ctx.fillStyle = color; // Main body color
  ctx.fillRect(x + 2, y + 6, width - 4, 10);

  // Sash across chest
  ctx.fillStyle = '#FFD700'; // Gold sash
  ctx.fillRect(x + 2, y + 10, width - 4, 4);

  ctx.fillRect(x, y + 16, width, 4);

  const legOffset = Math.sin(frame * 0.3) * 2;
  ctx.fillRect(x + 2, y + 20, 6, 6 + legOffset);
  ctx.fillRect(x + width - 8, y + 20, 6, 6 - legOffset);

  // Face details
  ctx.fillStyle = '#FFEBCD'; // Light skin tone
  ctx.fillRect(x + 6, y + 2, 3, 2);
  ctx.fillRect(x + width - 9, y + 2, 3, 2);
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
  const { playSound } = useArcadeSoundContext();

  const seed = Object.values(storyInputs).join('').slice(0, 20) || 'origin-adventure';

  useEffect(() => {
    if (isAnswered && gameState.stage < currentQuestion) {
      const newStage = currentQuestion;
      const level = generateStoryThemedLevel(newStage, seed);

      setGameState(prev => ({
        ...prev,
        platforms: [...prev.platforms, ...level.platforms],
        collectibles: [...prev.collectibles, ...level.collectibles],
        decorations: [...prev.decorations, ...level.decorations],
        obstacles: [...prev.obstacles, ...level.obstacles],
        stage: newStage,
        progress: (newStage / totalQuestions) * 100,
        isComplete: newStage >= totalQuestions,
      }));

      onGameProgress?.((newStage / totalQuestions) * 100);
    }
  }, [isAnswered, currentQuestion, gameState.stage, totalQuestions, seed, onGameProgress]);

  useEffect(() => {
    const initialLevel = generateStoryThemedLevel(0, seed);
    setGameState(prev => ({
      ...prev,
      platforms: initialLevel.platforms,
      collectibles: initialLevel.collectibles,
      decorations: initialLevel.decorations,
      obstacles: initialLevel.obstacles,
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
      player.y = ORIGIN_CONFIG.height - 50;
      player.velocityY = 0;
    }

    const remainingCollectibles: Sprite[] = [];
    for (const collectible of state.collectibles) {
      if (checkCollision(player, collectible)) {
        // Different points for different collectible types
        const isQuill = collectible.color === '#F5F5DC';
        const isInkPot = collectible.color === '#00008B';
        const points = isQuill ? 20 : isInkPot ? 15 : 10;
        newState.score += points;

        // Play sound effect when collecting
        playSound('success');
      } else {
        remainingCollectibles.push(collectible);
      }
    }
    newState.collectibles = remainingCollectibles;

    // Check for obstacle collisions
    for (const obstacle of state.obstacles) {
      if (checkCollision(player, obstacle)) {
        // Player hit an obstacle, reset position
        player.x = Math.max(50, player.x - 50);
        player.y = ORIGIN_CONFIG.height - 60;
        player.velocityY = 0;

        // Play sound effect when hitting obstacle
        playSound('error');
      }
    }

    newState.cameraX = Math.max(0, player.x - ORIGIN_CONFIG.width / 3);
    newState.player = player;

    return newState;
  }, []);

  const renderGame = useCallback((ctx: CanvasRenderingContext2D, state: GameState, frame: number) => {
    // Draw starry background
    const gradient = ctx.createLinearGradient(0, 0, 0, ORIGIN_CONFIG.height);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#24243e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ORIGIN_CONFIG.width, ORIGIN_CONFIG.height);

    // Draw twinkling stars
    for (let i = 0; i < 25; i++) {
      const x = ((i * 47 + frame * 0.03) % (ORIGIN_CONFIG.width + 50)) - 25;
      const y = (i * 29) % (ORIGIN_CONFIG.height - 30);
      const size = 1 + (i % 2);
      const twinkle = Math.sin(frame * 0.05 + i) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * twinkle})`;
      ctx.fillRect(x, y, size, size);
    }

    // Draw moon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(ORIGIN_CONFIG.width - 30, 30, 12, 0, Math.PI * 2);
    ctx.fill();

    // Draw decorations (books, scrolls)
    for (const decoration of state.decorations) {
      const screenX = decoration.x - state.cameraX * 0.7; // Parallax effect
      if (screenX > -decoration.width && screenX < ORIGIN_CONFIG.width + decoration.width) {
        ctx.fillStyle = decoration.color;

        if (decoration.width > 15) { // Scroll
          ctx.fillRect(screenX, decoration.y, decoration.width, decoration.height);
          // Scroll roll detail
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(screenX - 2, decoration.y, 4, decoration.height);
          ctx.fillRect(screenX + decoration.width, decoration.y, 4, decoration.height);
        } else { // Book
          ctx.fillRect(screenX, decoration.y, decoration.width, decoration.height);
          // Spine detail
          if (decoration.color === '#8B4513') {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(screenX + 2, decoration.y + 2, 2, decoration.height - 4);
          }
        }
      }
    }

    // Draw platforms
    for (const platform of state.platforms) {
      const screenX = platform.x - state.cameraX;
      if (screenX > -platform.width && screenX < ORIGIN_CONFIG.width + platform.width) {
        ctx.fillStyle = platform.color;
        ctx.fillRect(screenX, platform.y, platform.width, platform.height);

        // Platform top detail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(screenX, platform.y, platform.width, 2);
      }
    }

    // Draw obstacles
    for (const obstacle of state.obstacles) {
      const screenX = obstacle.x - state.cameraX;
      if (screenX > -obstacle.width && screenX < ORIGIN_CONFIG.width + obstacle.width) {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);

        // Obstacle spikes
        ctx.fillStyle = '#FF0000';
        for (let i = 0; i < obstacle.width; i += 4) {
          ctx.beginPath();
          ctx.moveTo(screenX + i, obstacle.y);
          ctx.lineTo(screenX + i + 2, obstacle.y - 4);
          ctx.lineTo(screenX + i + 4, obstacle.y);
          ctx.fill();
        }
      }
    }

    // Draw collectibles
    for (const collectible of state.collectibles) {
      const screenX = collectible.x - state.cameraX;
      if (screenX > -collectible.width && screenX < ORIGIN_CONFIG.width + collectible.width) {
        const bob = Math.sin(frame * 0.15 + collectible.x * 0.01) * 3;
        const pulse = Math.sin(frame * 0.2 + collectible.x * 0.02) * 0.3 + 0.7;

        ctx.shadowColor = collectible.color;
        ctx.shadowBlur = 8 * pulse;

        if (collectible.color === '#F5F5DC') { // Quill
          // Draw quill shape
          ctx.fillStyle = collectible.color;
          ctx.fillRect(screenX, collectible.y + bob, collectible.width, 3);
          ctx.fillRect(screenX + collectible.width/2 - 1, collectible.y + bob - 2, 2, 7);
        } else if (collectible.color === '#00008B') { // Ink pot
          // Draw ink pot shape
          ctx.fillStyle = collectible.color;
          ctx.fillRect(screenX + 2, collectible.y + bob, collectible.width - 4, collectible.height - 2);
          ctx.fillRect(screenX, collectible.y + bob + collectible.height - 2, collectible.width, 2);
        } else { // Gem
          // Draw gem shape
          ctx.fillStyle = collectible.color;
          ctx.beginPath();
          ctx.moveTo(screenX + collectible.width / 2, screenX + 2);
          ctx.lineTo(screenX + collectible.width - 2, collectible.y + collectible.height / 2 + bob);
          ctx.lineTo(screenX + collectible.width / 2, collectible.y + collectible.height - 2 + bob);
          ctx.lineTo(screenX + 2, collectible.y + collectible.height / 2 + bob);
          ctx.closePath();
          ctx.fill();
        }

        ctx.shadowBlur = 0;
      }
    }

    // Draw player character
    drawStoryCharacter(
      ctx,
      state.player.x - state.cameraX,
      state.player.y,
      state.player.width,
      state.player.height,
      ORIGIN_CONFIG.playerColor,
      frame
    );

    // UI Elements
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(8, 8, 100, 24);
    ctx.strokeStyle = ORIGIN_CONFIG.accentColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 100, 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText(`CHAPTER ${state.stage + 1}/${state.maxStages}`, 14, 22);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(ORIGIN_CONFIG.width - 78, 8, 70, 24);
    ctx.strokeStyle = ORIGIN_CONFIG.collectibleColor;
    ctx.strokeRect(ORIGIN_CONFIG.width - 78, 8, 70, 24);

    ctx.fillStyle = ORIGIN_CONFIG.collectibleColor;
    ctx.font = '10px monospace';
    ctx.fillText(`PTS: ${state.score}`, ORIGIN_CONFIG.width - 68, 22);

    const progressWidth = (state.progress / 100) * (ORIGIN_CONFIG.width - 20);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, ORIGIN_CONFIG.height - 14, ORIGIN_CONFIG.width - 20, 6);
    ctx.fillStyle = ORIGIN_CONFIG.playerColor;
    ctx.fillRect(10, ORIGIN_CONFIG.height - 14, progressWidth, 6);

    if (state.isComplete) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, ORIGIN_CONFIG.width, ORIGIN_CONFIG.height);

      ctx.shadowColor = ORIGIN_CONFIG.collectibleColor;
      ctx.shadowBlur = 20;
      ctx.fillStyle = ORIGIN_CONFIG.collectibleColor;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STORY CHAPTER COMPLETE!', ORIGIN_CONFIG.width / 2, ORIGIN_CONFIG.height / 2 - 20);

      ctx.fillStyle = ORIGIN_CONFIG.playerColor;
      ctx.font = '12px monospace';
      ctx.fillText(`Final Score: ${state.score}`, ORIGIN_CONFIG.width / 2, ORIGIN_CONFIG.height / 2 + 5);
      ctx.fillText(`Chapters: ${state.stage}`, ORIGIN_CONFIG.width / 2, ORIGIN_CONFIG.height / 2 + 20);

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
          STORY QUEST
        </span>
        <span className="text-amber-400/70">
          {Math.round(gameState.progress)}%
        </span>
      </div>
    </motion.div>
  );
}
