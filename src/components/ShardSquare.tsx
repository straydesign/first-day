"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { SHARD_SQUARE_CLIPS, BRIGHT_COLORS } from "@/constants";
import { isDayCompleted } from "@/lib/engagement";
import { ShardEngine, type ShardOverride } from "./lab/ShardEngine";
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

  const shardOverrides: ShardOverride[] = days.map((dayNum) => {
    const filled = isDayCompleted(progress[dayNum]);
    return {
      color: filled
        ? BRIGHT_COLORS[dayNum % BRIGHT_COLORS.length]
        : "#1a1a2e",
      opacity: 1,
      animating: animatingDay === dayNum,
    };
  });

  const overlay = allFilled ? (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.6 }}
    >
      <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
    </motion.div>
  ) : undefined;

  return (
    <div className="flex flex-col items-center gap-1">
      <ShardEngine
        state="assembling"
        target={{ type: "tiled" }}
        clipPaths={SHARD_SQUARE_CLIPS}
        palette={BRIGHT_COLORS}
        containerSize={size}
        shardOverrides={shardOverrides}
        overlay={overlay}
      />
      <span
        className="text-[10px] font-bold text-white/50 uppercase tracking-wider"
        style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}
      >
        W{weekNumber}
      </span>
    </div>
  );
}
