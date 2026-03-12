"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { SHARD_SQUARE_CLIPS, BRIGHT_COLORS } from "@/constants";
import { isDayCompleted } from "@/lib/engagement";
import type { ProgressMap } from "@/types";

interface ShardSquareProps {
  weekNumber: number;
  progress: ProgressMap;
  startDay: number;
  animatingDay?: number;
  size?: number;
}

export function ShardSquare({
  weekNumber,
  progress,
  startDay,
  animatingDay,
  size = 80,
}: ShardSquareProps) {
  // Always 7 shards per week — days beyond 30 just stay dark
  const days = Array.from({ length: 7 }, (_, i) => startDay + i);
  const allFilled = days.every((d) => isDayCompleted(progress[d]));

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {days.map((dayNum, i) => {
          const filled = isDayCompleted(progress[dayNum]);
          const isAnimating = animatingDay === dayNum;
          const color = filled
            ? BRIGHT_COLORS[dayNum % BRIGHT_COLORS.length]
            : "#1a1a2e";

          return (
            <motion.div
              key={dayNum}
              className="absolute inset-0"
              style={{
                clipPath: SHARD_SQUARE_CLIPS[i],
                backgroundColor: color,
                color: filled ? color : "transparent",
                ...(isAnimating ? { animation: "shardGlow 1.2s ease-in-out 0.5s 2" } : {}),
              }}
              initial={isAnimating ? { scale: 3, opacity: 0 } : false}
              animate={
                isAnimating
                  ? { scale: 1, opacity: 1 }
                  : undefined
              }
              transition={
                isAnimating
                  ? { type: "spring", stiffness: 300, damping: 20, delay: 0.3 }
                  : undefined
              }
            />
          );
        })}

        {/* Trophy overlay when all 7 shards filled */}
        {allFilled && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.6 }}
          >
            <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          </motion.div>
        )}
      </div>
      <span
        className="text-[10px] font-bold text-white/50 uppercase tracking-wider"
        style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}
      >
        W{weekNumber}
      </span>
    </div>
  );
}
