"use client";

import { motion } from "framer-motion";
import { ShardSquare } from "./ShardSquare";
import { SPRING } from "@/lib/animations";
import type { ProgressMap } from "@/types";

interface ShardRewardGridProps {
  progress: ProgressMap;
  totalDays?: number;
  animatingDay?: number;
}

export function ShardRewardGrid({
  progress,
  totalDays = 28,
  animatingDay,
}: ShardRewardGridProps) {
  // One square per week (ceil so a partial final week still gets a square).
  // The final week's extra cells beyond totalDays render dark; its trophy
  // completes on the real days only (ShardSquare clamps with totalDays).
  const weekCount = Math.ceil(totalDays / 7);

  const weeks = Array.from({ length: weekCount }, (_, i) => ({
    weekNumber: i + 1,
    startDay: i * 7 + 1,
  }));

  return (
    <div className="flex items-end gap-3 overflow-x-auto scrollbar-hide py-2 px-1">
      {weeks.map((week, i) => (
        <motion.div
          key={week.weekNumber}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.gentle, delay: i * 0.06 }}
        >
          <ShardSquare
            weekNumber={week.weekNumber}
            progress={progress}
            startDay={week.startDay}
            animatingDay={animatingDay}
            size={64}
            totalDays={totalDays}
          />
        </motion.div>
      ))}
    </div>
  );
}
