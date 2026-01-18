import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge as BadgeType } from "@/hooks/use-progression";
import { arcadeSounds } from "@/lib/arcadeSounds";
import { 
  Star, Book, Scroll, Crown, Trophy,
  Flame, Zap, Award, Medal,
  Compass, Rocket, Building,
  Sparkles, Gem,
  Joystick
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  book: Book,
  scroll: Scroll,
  crown: Crown,
  trophy: Trophy,
  flame: Flame,
  zap: Zap,
  lightning: Zap,
  medal: Medal,
  compass: Compass,
  rocket: Rocket,
  building: Building,
  award: Award,
  sparkles: Sparkles,
  sparkle: Sparkles,
  gem: Gem,
  joystick: Joystick,
};

const RARITY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { 
    bg: "from-slate-600 to-slate-700", 
    border: "border-slate-400", 
    text: "text-slate-200",
    glow: "shadow-slate-400/30"
  },
  uncommon: { 
    bg: "from-green-600 to-green-700", 
    border: "border-green-400", 
    text: "text-green-200",
    glow: "shadow-green-400/50"
  },
  rare: { 
    bg: "from-blue-600 to-blue-700", 
    border: "border-blue-400", 
    text: "text-blue-200",
    glow: "shadow-blue-400/50"
  },
  epic: { 
    bg: "from-purple-600 to-purple-700", 
    border: "border-purple-400", 
    text: "text-purple-200",
    glow: "shadow-purple-400/50"
  },
  legendary: { 
    bg: "from-yellow-500 to-orange-600", 
    border: "border-yellow-300", 
    text: "text-yellow-100",
    glow: "shadow-yellow-400/70"
  },
};

interface AchievementPopupProps {
  badge: BadgeType | null;
  xpAwarded?: number;
  onClose: () => void;
}

export function AchievementPopup({ badge, xpAwarded, onClose }: AchievementPopupProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (badge) {
      setShow(true);
      arcadeSounds.achievement();
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 500);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [badge, onClose]);

  if (!badge) return null;

  const IconComponent = ICON_MAP[badge.icon] || Star;
  const colors = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-start justify-center pt-20 z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`
              relative pointer-events-auto cursor-pointer
              bg-gradient-to-br ${colors.bg} 
              border-2 ${colors.border}
              rounded-lg p-6 min-w-[300px] max-w-[400px]
              shadow-2xl ${colors.glow}
            `}
            initial={{ y: -100, scale: 0.5, rotateX: -45 }}
            animate={{ 
              y: 0, 
              scale: 1, 
              rotateX: 0,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 15
              }
            }}
            exit={{ 
              y: -50, 
              scale: 0.8, 
              opacity: 0,
              transition: { duration: 0.3 }
            }}
            onClick={() => {
              setShow(false);
              setTimeout(onClose, 300);
            }}
            data-testid="achievement-popup"
          >
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    x: "50%",
                    y: "50%",
                    opacity: 0,
                  }}
                  animate={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.05,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4">
              <motion.div
                className="text-xs font-mono uppercase tracking-widest text-white/70"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Achievement Unlocked!
              </motion.div>

              <motion.div
                className={`
                  w-20 h-20 rounded-full
                  bg-gradient-to-br from-white/20 to-transparent
                  border-2 ${colors.border}
                  flex items-center justify-center
                  shadow-lg ${colors.glow}
                `}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: 1, 
                  rotate: 0,
                  transition: {
                    type: "spring",
                    stiffness: 200,
                    delay: 0.1
                  }
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <IconComponent className={`w-10 h-10 ${colors.text}`} />
                </motion.div>
              </motion.div>

              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-xl font-bold text-white mb-1">
                  {badge.name}
                </h3>
                <p className="text-sm text-white/80">
                  {badge.description}
                </p>
              </motion.div>

              {xpAwarded && xpAwarded > 0 && (
                <motion.div
                  className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-300 font-mono font-bold">
                    +{xpAwarded} XP
                  </span>
                </motion.div>
              )}

              <motion.div
                className={`
                  text-xs font-mono uppercase tracking-wider
                  px-3 py-1 rounded-full
                  bg-black/30 ${colors.text}
                `}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {badge.rarity}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface LevelUpPopupProps {
  newLevel: number | null;
  onClose: () => void;
}

export function LevelUpPopup({ newLevel, onClose }: LevelUpPopupProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (newLevel) {
      setShow(true);
      arcadeSounds.levelUp();
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 500);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [newLevel, onClose]);

  if (!newLevel) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          <motion.div
            className="relative pointer-events-auto z-10"
            initial={{ scale: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              transition: { duration: 0.5, ease: "easeOut" }
            }}
            exit={{ scale: 0, opacity: 0 }}
            data-testid="level-up-popup"
          >
            <div className="text-center">
              <motion.div
                className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 drop-shadow-lg"
                animate={{
                  textShadow: [
                    "0 0 20px rgba(250, 204, 21, 0.5)",
                    "0 0 40px rgba(250, 204, 21, 0.8)",
                    "0 0 20px rgba(250, 204, 21, 0.5)",
                  ],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                LEVEL UP!
              </motion.div>
              
              <motion.div
                className="mt-4 flex items-center justify-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />
                <span className="text-5xl font-mono font-bold text-yellow-400">
                  {newLevel}
                </span>
                <Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />
              </motion.div>

              <motion.p
                className="mt-4 text-lg text-white/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Keep forging stories to level up!
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
