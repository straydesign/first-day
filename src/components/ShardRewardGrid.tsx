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
  totalDays = 30,
  animatingDay,
}: ShardRewardGridProps) {
  // Always 5 full weeks — last week stays full, extra days beyond totalDays stay dark
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
          />
        </motion.div>
      ))}
    </div>
  );
}
