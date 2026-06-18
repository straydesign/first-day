"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { SHARD_SQUARE_CLIPS } from "@/constants";
import { isDayCompleted } from "@/lib/engagement";
import { ShardEngine, type ShardOverride } from "./lab/ShardEngine";
import type { ProgressMap } from "@/types";

/** Greyscale shards: filled day = bright, empty day = faint. */
const SHARD_GREY = ["#e8e8ea", "#16161a"] as const;

interface ShardSquareProps {
  weekNumber: number;
  progress: ProgressMap;
  startDay: number;
  animatingDay?: number;
  size?: number;
  /** Plan length — caps which of the 7 cells count toward the week's trophy. */
  totalDays?: number;
}

export function ShardSquare({
  weekNumber,
  progress,
  startDay,
  animatingDay,
  size = 80,
  totalDays = 28,
}: ShardSquareProps) {
  // Always 7 shards per week — days past the plan's length just stay dark.
  const days = Array.from({ length: 7 }, (_, i) => startDay + i);
  // Trophy fills when every REAL day in this week is done — a short final week
  // (e.g. days 29–30 of a 30-day goal) must not wait on cells 31–35 that don't exist.
  const realDays = days.filter((d) => d <= totalDays);
  const allFilled = realDays.length > 0 && realDays.every((d) => isDayCompleted(progress[d]));

  const shardOverrides: ShardOverride[] = days.map((dayNum) => {
    const filled = isDayCompleted(progress[dayNum]);
    return {
      color: filled ? "#e8e8ea" : "#16161a",
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
      <Trophy className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
    </motion.div>
  ) : undefined;

  return (
    <div className="flex flex-col items-center gap-1">
      <ShardEngine
        state="assembling"
        target={{ type: "tiled" }}
        clipPaths={SHARD_SQUARE_CLIPS}
        palette={SHARD_GREY as unknown as string[]}
        containerSize={size}
        shardOverrides={shardOverrides}
        overlay={overlay}
      />
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-white/40">
        W{weekNumber}
      </span>
    </div>
  );
}
