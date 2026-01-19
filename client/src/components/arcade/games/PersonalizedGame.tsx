import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Share2, Trophy, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Story } from '@shared/schema';

interface PersonalizedGameProps {
  story: Story;
  onShare?: () => void;
}

interface GameSprite {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  velocityX?: number;
  velocityY?: number;
  type: 'player' | 'platform' | 'collectible' | 'goal' | 'decoration';
}

interface PersonalizedLevel {
  platforms: GameSprite[];
  collectibles: GameSprite[];
  decorations: GameSprite[];
  goal: GameSprite;
  playerStart: { x: number; y: number };
  backgroundColor: string;
  groundColor: string;
  playerColor: string;
  accentColor: string;
  levelWidth: number;
  levelHeight: number;
  title: string;
}

function generateHashFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number, offset: number = 0): number {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

function getTrackPalette(trackId: string): {
  bg: string;
  ground: string;
  player: string;
  accent: string;
  collectible: string;
  platform: string;
} {
  switch (trackId) {
    case 'origin':
      return {
        bg: '#1a0a2e',
        ground: '#3d2066',
        player: '#00ffcc',
        accent: '#ff6b9d',
        collectible: '#ffd700',
        platform: '#5a3d7a',
      };
    case 'future':
      return {
        bg: '#0a0a1f',
        ground: '#1a1a3f',
        player: '#00ffff',
        accent: '#00ff88',
        collectible: '#ff00ff',
        platform: '#2a2a5f',
      };
    case 'legend':
      return {
        bg: '#1a0f0a',
        ground: '#3d2810',
        player: '#ffd700',
        accent: '#8b4513',
        collectible: '#ff6b35',
        platform: '#5a4020',
      };
    default:
      return {
        bg: '#1a1a2e',
        ground: '#2a2a4e',
        player: '#00ffff',
        accent: '#ff00ff',
        collectible: '#ffd700',
        platform: '#3a3a5e',
      };
  }
}

function generatePersonalizedLevel(story: Story): PersonalizedLevel {
  const palette = getTrackPalette(story.trackId);
  const storyContent = [story.p1, story.p2, story.p3].join('');
  const contentHash = generateHashFromString(
    story.title + storyContent + (story.neighborhood || '')
  );
  
  const levelWidth = 1600;
  const levelHeight = 300;
  
  const platforms: GameSprite[] = [];
  const collectibles: GameSprite[] = [];
  const decorations: GameSprite[] = [];
  
  platforms.push({
    x: 0,
    y: levelHeight - 20,
    width: levelWidth,
    height: 20,
    color: palette.ground,
    type: 'platform',
  });
  
  const numPlatforms = 8 + Math.floor(seededRandom(contentHash, 1) * 6);
  for (let i = 0; i < numPlatforms; i++) {
    const platX = 100 + seededRandom(contentHash, i * 10) * (levelWidth - 200);
    const platY = levelHeight - 60 - seededRandom(contentHash, i * 10 + 1) * 100;
    const platWidth = 60 + seededRandom(contentHash, i * 10 + 2) * 80;
    
    platforms.push({
      x: platX,
      y: platY,
      width: platWidth,
      height: 12,
      color: palette.platform,
      type: 'platform',
    });
    
    if (seededRandom(contentHash, i * 10 + 3) > 0.4) {
      collectibles.push({
        x: platX + platWidth / 2 - 8,
        y: platY - 24,
        width: 16,
        height: 16,
        color: palette.collectible,
        type: 'collectible',
      });
    }
  }
  
  const themeCount = story.themes?.length || 0;
  const groundCollectibles = 5 + themeCount;
  for (let i = 0; i < groundCollectibles; i++) {
    collectibles.push({
      x: 100 + seededRandom(contentHash, i * 5 + 100) * (levelWidth - 300),
      y: levelHeight - 40 - seededRandom(contentHash, i * 5 + 101) * 20,
      width: 16,
      height: 16,
      color: palette.collectible,
      type: 'collectible',
    });
  }
  
  const decorCount = 15 + Math.floor(seededRandom(contentHash, 200) * 10);
  for (let i = 0; i < decorCount; i++) {
    const height = 20 + seededRandom(contentHash, i * 3 + 300) * 60;
    decorations.push({
      x: seededRandom(contentHash, i * 3 + 301) * levelWidth,
      y: levelHeight - 20 - height,
      width: 10 + seededRandom(contentHash, i * 3 + 302) * 30,
      height: height,
      color: palette.accent,
      type: 'decoration',
    });
  }
  
  const goal: GameSprite = {
    x: levelWidth - 100,
    y: levelHeight - 60,
    width: 40,
    height: 40,
    color: '#ffd700',
    type: 'goal',
  };
  
  return {
    platforms,
    collectibles,
    decorations,
    goal,
    playerStart: { x: 50, y: levelHeight - 60 },
    backgroundColor: palette.bg,
    groundColor: palette.ground,
    playerColor: palette.player,
    accentColor: palette.accent,
    levelWidth,
    levelHeight,
    title: story.title,
  };
}

export function PersonalizedGame({ story, onShare }: PersonalizedGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'complete'>('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState<PersonalizedLevel | null>(null);
  
  const playerRef = useRef({
    x: 50,
    y: 240,
    width: 20,
    height: 24,
    velocityX: 0,
    velocityY: 0,
    grounded: false,
  });
  
  const keysRef = useRef({
    left: false,
    right: false,
    jump: false,
  });
  
  const collectiblesRef = useRef<GameSprite[]>([]);
  const cameraRef = useRef(0);
  const frameRef = useRef(0);
  const scoreRef = useRef(0);

  useEffect(() => {
    const generatedLevel = generatePersonalizedLevel(story);
    setLevel(generatedLevel);
    collectiblesRef.current = [...generatedLevel.collectibles];
  }, [story]);

  const resetGame = useCallback(() => {
    if (!level) return;
    
    playerRef.current = {
      x: level.playerStart.x,
      y: level.playerStart.y,
      width: 20,
      height: 24,
      velocityX: 0,
      velocityY: 0,
      grounded: false,
    };
    collectiblesRef.current = [...level.collectibles];
    cameraRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setGameState('idle');
  }, [level]);

  const startGame = useCallback(() => {
    resetGame();
    setGameState('playing');
  }, [resetGame]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
        e.preventDefault();
        keysRef.current.jump = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keysRef.current.jump = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing' || !level) return;

    const GRAVITY = 0.5;
    const PLAYER_SPEED = 4;
    const JUMP_FORCE = -10;
    const CANVAS_WIDTH = 400;
    const CANVAS_HEIGHT = 300;

    const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      frameRef.current++;
      const player = playerRef.current;
      const keys = keysRef.current;

      if (keys.left) player.velocityX = -PLAYER_SPEED;
      else if (keys.right) player.velocityX = PLAYER_SPEED;
      else player.velocityX *= 0.8;

      if (keys.jump && player.grounded) {
        player.velocityY = JUMP_FORCE;
        player.grounded = false;
      }

      player.velocityY += GRAVITY;
      player.x += player.velocityX;
      player.y += player.velocityY;

      player.x = Math.max(0, Math.min(level.levelWidth - player.width, player.x));

      player.grounded = false;
      for (const platform of level.platforms) {
        if (
          player.velocityY >= 0 &&
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

      if (player.y > level.levelHeight) {
        player.y = level.playerStart.y;
        player.x = level.playerStart.x;
        player.velocityY = 0;
      }

      collectiblesRef.current = collectiblesRef.current.filter(c => {
        const hit = (
          player.x < c.x + c.width &&
          player.x + player.width > c.x &&
          player.y < c.y + c.height &&
          player.y + player.height > c.y
        );
        if (hit) {
          scoreRef.current += 10;
          setScore(scoreRef.current);
        }
        return !hit;
      });

      const goal = level.goal;
      if (
        player.x < goal.x + goal.width &&
        player.x + player.width > goal.x &&
        player.y < goal.y + goal.height &&
        player.y + player.height > goal.y
      ) {
        scoreRef.current += 100;
        setScore(scoreRef.current);
        setGameState('complete');
        return;
      }

      cameraRef.current = Math.max(0, Math.min(
        level.levelWidth - CANVAS_WIDTH,
        player.x - CANVAS_WIDTH / 3
      ));

      ctx.fillStyle = level.backgroundColor;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (let i = 0; i < 30; i++) {
        const starX = ((i * 73 + frameRef.current * 0.02) % (CANVAS_WIDTH + 100)) - 50;
        const starY = (i * 37) % (CANVAS_HEIGHT - 40);
        const twinkle = Math.sin(frameRef.current * 0.05 + i) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.5})`;
        ctx.fillRect(starX, starY, 2, 2);
      }

      for (const decoration of level.decorations) {
        const screenX = decoration.x - cameraRef.current * 0.5;
        if (screenX > -decoration.width - 20 && screenX < CANVAS_WIDTH + 20) {
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = decoration.color;
          ctx.fillRect(screenX, decoration.y * (CANVAS_HEIGHT / level.levelHeight), 
            decoration.width, decoration.height * (CANVAS_HEIGHT / level.levelHeight));
          ctx.globalAlpha = 1;
        }
      }

      const scaleY = CANVAS_HEIGHT / level.levelHeight;

      for (const platform of level.platforms) {
        const screenX = platform.x - cameraRef.current;
        if (screenX > -platform.width && screenX < CANVAS_WIDTH + platform.width) {
          ctx.fillStyle = platform.color;
          ctx.fillRect(screenX, platform.y * scaleY, platform.width, platform.height * scaleY);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(screenX, platform.y * scaleY, platform.width, 2);
        }
      }

      for (const collectible of collectiblesRef.current) {
        const screenX = collectible.x - cameraRef.current;
        if (screenX > -collectible.width && screenX < CANVAS_WIDTH + collectible.width) {
          const bob = Math.sin(frameRef.current * 0.1 + collectible.x * 0.01) * 3;
          ctx.shadowColor = collectible.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = collectible.color;
          ctx.beginPath();
          ctx.arc(
            screenX + collectible.width / 2,
            (collectible.y + bob) * scaleY + collectible.height / 2,
            collectible.width / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      const goalScreenX = goal.x - cameraRef.current;
      if (goalScreenX > -goal.width && goalScreenX < CANVAS_WIDTH + goal.width) {
        const pulse = Math.sin(frameRef.current * 0.1) * 0.3 + 0.7;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20 * pulse;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(goalScreenX, goal.y * scaleY, goal.width, goal.height * scaleY);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('★', goalScreenX + goal.width / 2, goal.y * scaleY + goal.height / 2 + 4);
        ctx.textAlign = 'left';
      }

      const playerScreenX = player.x - cameraRef.current;
      const walkFrame = Math.abs(player.velocityX) > 0.5 ? Math.floor(frameRef.current / 8) % 2 : 0;
      
      ctx.fillStyle = level.playerColor;
      ctx.shadowColor = level.playerColor;
      ctx.shadowBlur = 5;
      
      const pHeight = player.height * scaleY;
      const pWidth = player.width;
      const pY = player.y * scaleY;
      
      ctx.fillRect(playerScreenX + 4, pY, pWidth - 8, pHeight * 0.25);
      ctx.fillRect(playerScreenX + 2, pY + pHeight * 0.25, pWidth - 4, pHeight * 0.4);
      
      const legOffset = walkFrame === 1 ? 2 : 0;
      ctx.fillRect(playerScreenX + 2, pY + pHeight * 0.65, 6, pHeight * 0.35 + legOffset);
      ctx.fillRect(playerScreenX + pWidth - 8, pY + pHeight * 0.65, 6, pHeight * 0.35 - legOffset);
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(playerScreenX + 6, pY + pHeight * 0.1, 3, 2);
      ctx.fillRect(playerScreenX + pWidth - 9, pY + pHeight * 0.1, 3, 2);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(8, 8, 80, 22);
      ctx.strokeStyle = level.playerColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, 80, 22);
      ctx.fillStyle = '#ffd700';
      ctx.font = '11px monospace';
      ctx.fillText(`★ ${scoreRef.current}`, 16, 22);

      const progressWidth = Math.min(1, player.x / (level.levelWidth - 100)) * (CANVAS_WIDTH - 20);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(10, CANVAS_HEIGHT - 12, CANVAS_WIDTH - 20, 4);
      ctx.fillStyle = level.playerColor;
      ctx.fillRect(10, CANVAS_HEIGHT - 12, progressWidth, 4);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, level]);

  if (!level) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-md overflow-hidden cabinet-card-frame"
      data-testid="personalized-game-container"
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full h-auto block"
          style={{ imageRendering: 'pixelated' }}
          data-testid="personalized-game-canvas"
        />
        
        <div 
          className="absolute inset-0 pointer-events-none refined-scanlines opacity-20"
          aria-hidden="true"
        />

        {gameState === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4"
          >
            <div className="text-center space-y-2">
              <Gamepad2 className="w-10 h-10 text-primary mx-auto mb-2" />
              <h3 className="font-display text-lg text-white phosphor-text">
                Your Story World
              </h3>
              <p className="font-mono text-xs text-muted-foreground max-w-[280px]">
                A unique level generated from "{level.title}"
              </p>
            </div>
            
            <Button
              onClick={startGame}
              className="font-mono gap-2 neon-breathe"
              data-testid="button-play-game"
            >
              <Play className="w-4 h-4" />
              PLAY GAME
            </Button>
            
            <p className="font-mono text-[10px] text-muted-foreground/60">
              Arrow keys or WASD to move, Space to jump
            </p>
          </motion.div>
        )}

        {gameState === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4"
          >
            <Trophy className="w-12 h-12 text-amber-400 victory-shimmer" />
            <div className="text-center space-y-1">
              <h3 className="font-display text-xl text-amber-400 phosphor-text">
                QUEST COMPLETE!
              </h3>
              <p className="font-mono text-lg text-white">
                Score: {score}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={resetGame}
                className="font-mono text-sm gap-2"
                data-testid="button-play-again"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
              
              {onShare && (
                <Button
                  onClick={onShare}
                  className="font-mono text-sm gap-2"
                  data-testid="button-share-game"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
        <span className="text-primary/70 phosphor-text">
          YOUR STORY WORLD
        </span>
        <span className="text-amber-400/70">
          ★ {score}
        </span>
      </div>
    </motion.div>
  );
}
