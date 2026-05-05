"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Zap } from "lucide-react";
import { useMonotone } from "./MonotoneContext";
import { wordReveal, scaleReveal, SPRING } from "@/lib/animations";
import { BUTTON_CLIPS, SHARD_CLIPS, VORONOI_LIGHT, getClip } from "@/constants";
import type { ProgressMap, Milestone, XPBreakdown } from "@/types";

const ShardContainer = dynamic(
  () =>
    import("@/components/3d/ShardContainer").then((m) => ({
      default: m.ShardContainer,
    })),
  { ssr: false, loading: () => <div style={{ height: 320 }} /> },
);

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
  progress?: ProgressMap;
  milestone?: Milestone | null;
  xp?: XPBreakdown | null;
}

const CONFETTI_COLORS = ["#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF", "#FF10F0"];

export function CongratsView({
  onViewCalendar,
  onDoMore,
  goalTitle,
  dayNumber,
  totalDays = 30,
  progress,
  milestone,
  xp,
}: CongratsViewProps) {
  const { monotone } = useMonotone();
  const daysRemaining = dayNumber ? totalDays - dayNumber : null;
  const milestoneIntense = milestone && milestone.intensity !== "normal";

  const xpLines = useMemo(() => {
    if (!xp) return [];
    const lines: { label: string; value: number; highlight?: boolean }[] = [];
    if (xp.base > 0) lines.push({ label: "Day complete", value: xp.base });
    if (xp.activities > 0) lines.push({ label: "Activities", value: xp.activities });
    if (xp.reflection > 0) lines.push({ label: "Reflection", value: xp.reflection });
    if (xp.streakBonus > 0) lines.push({ label: "Streak bonus", value: xp.streakBonus });
    if (xp.challengeBonus > 0) lines.push({ label: "Challenge bonus", value: xp.challengeBonus, highlight: true });
    if (xp.comebackBonus > 0) lines.push({ label: "Comeback bonus", value: xp.comebackBonus, highlight: true });
    return lines;
  }, [xp]);
  const hasMultiplier = xp && xp.multiplier > 1;

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

  return (
    <div className="min-h-screen relative overflow-hidden">

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
              scale: [0, piece.scale * 1.3, piece.scale],
            }}
            transition={{ duration: 2.5, delay: piece.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center p-6 pt-[120px] min-h-[80vh] md:min-h-screen">
        <div className="max-w-2xl w-full text-center">

          {/* Milestone banner — fires for day 1/7/14/15/21/30 + every-5 streaks */}
          {milestone && (
            <motion.div
              className="mb-6 flex justify-center"
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...SPRING.bouncy, delay: 0.1 }}
            >
              <div
                className="relative bg-black px-5 py-3 md:px-7 md:py-4 max-w-md"
                style={{ clipPath: getClip(SHARD_CLIPS, 0) }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl md:text-4xl" aria-hidden>{milestone.icon}</span>
                  <span
                    className="text-xl md:text-2xl font-black uppercase leading-none"
                    style={{
                      fontFamily: "var(--font-bebas), system-ui, sans-serif",
                      color: monotone ? "#ffffff" : (milestoneIntense ? VORONOI_LIGHT[0] : VORONOI_LIGHT[1]),
                      letterSpacing: 1.5,
                    }}
                  >
                    {milestone.title}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-white/80 font-medium leading-snug pl-[3.25rem] md:pl-[3.75rem]">
                  {milestone.message}
                </p>
              </div>
            </motion.div>
          )}

          {/* Word-by-word headline */}
          <h1 className="text-3xl md:text-5xl font-bold mb-2 text-white">
            {(dayNumber ? `Day ${dayNumber} Complete!` : "Congratulations!").split(" ").map((word, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={wordReveal}
                initial="hidden"
                animate="visible"
                className="inline-block mr-[0.3em]"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {goalTitle && (
            <motion.p
              className="text-lg md:text-2xl text-white/80 font-bold mb-6 px-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.gentle, delay: 0.5 }}
            >
              {goalTitle}
            </motion.p>
          )}

          {/* 3D Shard Container — shards drop into glass jar */}
          {dayNumber && progress && (
            <motion.div
              className="flex flex-col items-center mb-4"
              variants={scaleReveal}
              initial="hidden"
              animate="visible"
            >
              <ShardContainer dayNumber={dayNumber} progress={progress} />
            </motion.div>
          )}

          {/* XP breakdown */}
          {xp && xp.total > 0 && (
            <motion.div
              className="flex justify-center mb-6 md:mb-8 px-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.gentle, delay: 0.6 }}
            >
              <div
                className="relative bg-black/80 backdrop-blur-sm border border-white/10 px-6 py-5 md:px-8 md:py-6 w-full max-w-sm"
                style={{ clipPath: getClip(SHARD_CLIPS, 1) }}
              >
                <div className="space-y-1.5 mb-4">
                  {xpLines.map((line, i) => (
                    <motion.div
                      key={line.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...SPRING.soft, delay: 0.75 + i * 0.08 }}
                      className="flex justify-between items-baseline text-sm md:text-base"
                    >
                      <span className="text-white/70 font-medium">{line.label}</span>
                      <span
                        className="font-black"
                        style={{
                          color: monotone
                            ? "#ffffff"
                            : line.highlight
                              ? "#FFE633"
                              : "#A4F542",
                        }}
                      >
                        +{line.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  className="pt-3 border-t border-white/10 flex flex-col items-center gap-1"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...SPRING.bouncy, delay: 0.95 + xpLines.length * 0.08 }}
                >
                  {hasMultiplier && (
                    <span
                      className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em]"
                      style={{ color: monotone ? "#ffffff" : "#FFE633" }}
                    >
                      {xp.multiplier}× Multiplier Day
                    </span>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <Zap
                      className="w-6 h-6 md:w-7 md:h-7"
                      style={{ color: monotone ? "#ffffff" : "#FFE633" }}
                      fill="currentColor"
                    />
                    <span
                      className="text-3xl md:text-4xl font-black uppercase leading-none text-white"
                      style={{
                        fontFamily: "var(--font-bebas), system-ui, sans-serif",
                        letterSpacing: 1,
                      }}
                    >
                      +{xp.total} XP
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Come back message */}
          {daysRemaining !== null && daysRemaining > 0 && (
            <motion.p
              className="text-base md:text-xl text-white/70 font-medium mb-8 md:mb-12 px-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.soft, delay: 1.0 }}
            >
              Come back tomorrow for another shard.
            </motion.p>
          )}
          {daysRemaining === 0 && (
            <motion.p
              className="text-base md:text-xl text-white/70 font-medium mb-8 md:mb-12 px-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.soft, delay: 1.0 }}
            >
              You did it — all 30 days complete.
            </motion.p>
          )}
          {daysRemaining === null && <div className="mb-8 md:mb-12" />}

          {/* Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.gentle, delay: 1.2 }}
          >
            <button onClick={onViewCalendar} className="flex items-center justify-center gap-2 px-8 py-5 md:px-10 md:py-6 text-base md:text-lg font-black text-black uppercase tracking-wide hover:scale-105 transition-transform btn-shake" style={{ backgroundColor: monotone ? "#666666" : "#fb7025", clipPath: getClip(BUTTON_CLIPS, 0) }}>
              <Calendar className="w-5 h-5 flex-shrink-0" />View Calendar
            </button>
            <button onClick={onDoMore} className="flex items-center justify-center gap-2 px-8 py-5 md:px-10 md:py-6 text-base md:text-lg font-black text-black uppercase tracking-wide hover:scale-105 transition-transform btn-shake" style={{ backgroundColor: monotone ? "#444444" : "#f31b5e", clipPath: getClip(BUTTON_CLIPS, 1) }}>
              <ArrowRight className="w-5 h-5 flex-shrink-0" />Back to Goals
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
