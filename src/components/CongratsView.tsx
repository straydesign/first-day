"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Zap } from "lucide-react";
import Aurora from "./Aurora";
import { AURORA_COLORS } from "@/constants";
import { AchievementCard } from "./AchievementCard";
import { ShardButton } from "./ShardButton";
import type { Milestone, XPBreakdown, Achievement } from "@/types";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}

interface CongratsViewProps {
  onViewCalendar: () => void;
  onDoMore: () => void;
  goalTitle?: string;
  dayNumber?: number;
  totalDays?: number;
  milestone?: Milestone | null;
  xp?: XPBreakdown | null;
  newAchievements?: Achievement[];
}

const CONFETTI_COLORS = ["#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF", "#7C4DFF"];

export function CongratsView({
  onViewCalendar,
  onDoMore,
  goalTitle,
  dayNumber,
  totalDays = 30,
  milestone,
  xp,
  newAchievements = [],
}: CongratsViewProps) {
  const daysRemaining = dayNumber ? totalDays - dayNumber : null;

  // Milestone-aware icon and title
  const icon = milestone?.icon ?? "🎉";
  const title = milestone?.title ?? (dayNumber ? `Day ${dayNumber} Complete!` : "Congratulations!");
  const message = milestone?.message ?? "Every step forward is progress toward your goal.";
  const intensity = milestone?.intensity ?? "normal";

  // Scale animation based on intensity
  const iconSize =
    intensity === "epic"
      ? "w-20 h-20 md:w-28 md:h-28"
      : intensity === "big"
        ? "w-18 h-18 md:w-26 md:h-26"
        : "w-16 h-16 md:w-24 md:h-24";
  const iconBg =
    intensity === "epic"
      ? "bg-yellow-400"
      : intensity === "big"
        ? "bg-lime-400"
        : "bg-lime-500";

  // --- 1. Confetti burst on mount ---
  const confettiPieces: readonly ConfettiPiece[] = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 400,
        y: -(Math.random() * 300 + 100),
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.3,
      })),
    [],
  );

  // --- 3. XP count-up animation ---
  const [displayXP, setDisplayXP] = useState(0);

  useEffect(() => {
    if (!xp?.total) return;

    const target = xp.total;
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayXP(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [xp?.total]);

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <div className="fixed inset-0 z-0 w-full h-full">
        <Aurora colorStops={[...AURORA_COLORS]} />
      </div>

      {/* Confetti layer */}
      <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute w-2 h-2 clip-diamond"
            style={{ backgroundColor: piece.color, left: "50%", top: "40%" }}
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0 }}
            animate={{
              opacity: [1, 1, 0],
              x: piece.x,
              y: [piece.y, piece.y + 600],
              rotate: piece.rotation * 3,
              scale: [0, piece.scale, piece.scale],
            }}
            transition={{ duration: 2.5, delay: piece.delay, ease: "easeOut" }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center p-6 pt-12 md:pt-20 min-h-[80vh] md:min-h-screen">
        <div className="max-w-2xl w-full text-center">
          {/* Milestone Icon */}
          <motion.div
            className={`inline-flex items-center justify-center ${iconSize} clip-diamond ${iconBg} mb-4 md:mb-6 shadow-lg`}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          >
            <span className="text-4xl md:text-5xl">{icon}</span>
          </motion.div>

          {/* 2. Word-by-word headline reveal */}
          <h1 className="text-3xl md:text-5xl font-bold mb-2 text-white">
            {title.split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, filter: "blur(8px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.12, ease: "easeOut" }}
                className="inline-block mr-[0.3em]"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {goalTitle && (
            <motion.p
              className="text-lg md:text-2xl text-white/80 font-bold mb-4 px-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            >
              {goalTitle}
            </motion.p>
          )}

          <motion.p
            className="text-base md:text-xl text-white/70 font-medium mb-2 max-w-lg mx-auto px-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
          >
            {message}
          </motion.p>

          {/* 3. XP count-up */}
          {xp && xp.total > 0 && (
            <motion.div
              className="inline-flex items-center gap-2 bg-[#FF1493] backdrop-blur-sm clip-badge-a px-6 py-2 mb-4 shadow-md border border-white/15"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.85, ease: "easeOut" }}
            >
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-bold text-white">+{displayXP} XP</span>
              <span className="text-sm text-white/50">
                ({xp.base} base
                {xp.activities > 0 && ` + ${xp.activities} activities`}
                {xp.reflection > 0 && ` + ${xp.reflection} reflection`}
                {xp.streakBonus > 0 && ` + ${xp.streakBonus} streak`})
              </span>
            </motion.div>
          )}

          {/* 4. Badge unlock with glow */}
          {newAchievements.length > 0 && (
            <motion.div
              className="mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <p className="text-sm font-semibold text-yellow-400 mb-2">
                New Achievement{newAchievements.length > 1 ? "s" : ""} Unlocked!
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                {newAchievements.map((a, index) => (
                  <motion.div
                    key={a.id}
                    className="w-32 relative"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.8 + index * 0.15,
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-lime-400 to-teal-400 clip-tile-b opacity-50 blur-sm animate-pulse" />
                    <div className="relative">
                      <AchievementCard achievement={a} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {daysRemaining !== null && daysRemaining > 0 && (
            <motion.p
              className="text-sm md:text-base text-white/80 mb-6 md:mb-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.0, ease: "easeOut" }}
            >
              {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining — come back tomorrow for Day {dayNumber! + 1}.
            </motion.p>
          )}
          {daysRemaining === 0 && (
            <motion.p
              className="text-sm md:text-base text-lime-400 font-semibold mb-6 md:mb-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.0, ease: "easeOut" }}
            >
              You did it! All 30 days complete.
            </motion.p>
          )}
          {daysRemaining === null && <div className="mb-6 md:mb-12" />}

          <motion.div
            className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1, ease: "easeOut" }}
          >
            <ShardButton seed={30}
              onClick={onViewCalendar}
              size="lg"
              className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg shadow-lg hover:shadow-xl transition-smooth hover:scale-105"
            >
              <Calendar className="mr-2 w-5 h-5 flex-shrink-0" />View Calendar
            </ShardButton>
            <ShardButton seed={31}
              onClick={onDoMore}
              size="lg"
              className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg shadow-md hover:shadow-lg transition-smooth hover:scale-105"
            >
              <ArrowRight className="mr-2 w-5 h-5 flex-shrink-0" />Back to Goals
            </ShardButton>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
