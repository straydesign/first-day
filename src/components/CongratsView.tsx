"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { ShardSquare } from "./ShardSquare";
import { useMonotone } from "./MonotoneContext";
import { BRIGHT_COLORS } from "@/constants";
import type { ProgressMap } from "@/types";

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
}

const CONFETTI_COLORS = ["#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF", "#2979FF"];

const SHARD_CLIPS = [
  "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)",
  "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
  "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)",
  "polygon(3% 2%, 100% 0%, 97% 98%, 0% 100%)",
];

export function CongratsView({
  onViewCalendar,
  onDoMore,
  goalTitle,
  dayNumber,
  totalDays = 30,
  progress,
}: CongratsViewProps) {
  const { monotone } = useMonotone();
  const daysRemaining = dayNumber ? totalDays - dayNumber : null;
  const shardColor = dayNumber
    ? monotone ? "#ffffff" : BRIGHT_COLORS[dayNumber % BRIGHT_COLORS.length]
    : "#FFE633";

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
    <div className="min-h-screen relative bg-black overflow-hidden">

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

      <div className="relative z-10 flex items-center justify-center p-6 pt-[120px] md:pt-[120px] min-h-[80vh] md:min-h-screen">
        <div className="max-w-2xl w-full text-center">

          {/* Word-by-word headline */}
          <h1 className="text-3xl md:text-5xl font-bold mb-2 text-white">
            {(dayNumber ? `Day ${dayNumber} Complete!` : "Congratulations!").split(" ").map((word, i) => (
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
              className="text-lg md:text-2xl text-white/80 font-bold mb-6 px-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            >
              {goalTitle}
            </motion.p>
          )}

          {/* Big solo shard — the reward */}
          {dayNumber && (
            <motion.div
              className="flex flex-col items-center mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <motion.p
                className="text-sm md:text-base text-white/50 font-bold uppercase tracking-widest mb-3"
                style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                You earned a shard
              </motion.p>

              {/* The shard itself — big, colorful, animated */}
              <motion.div
                className="relative"
                style={{
                  width: 120,
                  height: 120,
                  backgroundColor: shardColor,
                  clipPath: SHARD_CLIPS[dayNumber % SHARD_CLIPS.length],
                  boxShadow: `0 0 40px ${shardColor}50, 0 0 80px ${shardColor}20`,
                }}
                initial={{ scale: 0, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.8,
                }}
              >
                <span
                  className="absolute inset-0 flex items-center justify-center text-black font-black text-4xl md:text-5xl"
                  style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}
                >
                  {dayNumber}
                </span>
              </motion.div>
            </motion.div>
          )}

          {/* Week grid — shows it building */}
          {progress && dayNumber && (
            <motion.div
              className="flex flex-col items-center mb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2, ease: "easeOut" }}
            >
              <p
                className="text-xs text-white/40 font-bold uppercase tracking-widest mb-2"
                style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}
              >
                Week {Math.ceil(dayNumber / 7)} Progress
              </p>
              <ShardSquare
                weekNumber={Math.ceil(dayNumber / 7)}
                progress={progress}
                startDay={(Math.ceil(dayNumber / 7) - 1) * 7 + 1}
                animatingDay={dayNumber}
                size={140}
              />
            </motion.div>
          )}

          {/* Come back message */}
          {daysRemaining !== null && daysRemaining > 0 && (
            <motion.p
              className="text-base md:text-xl text-white/70 font-medium mb-8 md:mb-12 px-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.4, ease: "easeOut" }}
            >
              Come back tomorrow for another shard.
            </motion.p>
          )}
          {daysRemaining === 0 && (
            <motion.p
              className="text-base md:text-xl text-white/70 font-medium mb-8 md:mb-12 px-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.4, ease: "easeOut" }}
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
            transition={{ duration: 0.5, delay: 1.6, ease: "easeOut" }}
          >
            <button onClick={onViewCalendar} className="flex items-center justify-center gap-2 px-8 py-5 md:px-10 md:py-6 text-base md:text-lg font-black text-black uppercase tracking-wide hover:scale-105 transition-transform btn-shake" style={{ backgroundColor: monotone ? "#666666" : "#fb7025", clipPath: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" }}>
              <Calendar className="w-5 h-5 flex-shrink-0" />View Calendar
            </button>
            <button onClick={onDoMore} className="flex items-center justify-center gap-2 px-8 py-5 md:px-10 md:py-6 text-base md:text-lg font-black text-black uppercase tracking-wide hover:scale-105 transition-transform btn-shake" style={{ backgroundColor: monotone ? "#444444" : "#f31b5e", clipPath: "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)" }}>
              <ArrowRight className="w-5 h-5 flex-shrink-0" />Back to Goals
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
