"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { XPBreakdown } from "@/types";
import { Zap } from "lucide-react";

interface XPAnimationProps {
  xp: XPBreakdown;
  show: boolean;
}

const lineVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.15, duration: 0.4, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, y: -30, transition: { duration: 0.3 } },
};

const totalVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { delay: 1.0, duration: 0.5, type: "spring" as const, stiffness: 200 },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

export function XPAnimation({ xp, show }: XPAnimationProps) {
  const lines: { label: string; value: number }[] = [];
  if (xp.base > 0) lines.push({ label: "Day complete", value: xp.base });
  if (xp.activities > 0) lines.push({ label: "Activities", value: xp.activities });
  if (xp.reflection > 0) lines.push({ label: "Reflection", value: xp.reflection });
  if (xp.streakBonus > 0) lines.push({ label: "Streak bonus", value: xp.streakBonus });

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-black/60 backdrop-blur-sm rounded-none p-6 min-w-[240px] text-center pointer-events-auto border border-white/10">
            <div className="space-y-2 mb-4">
              {lines.map((line, i) => (
                <motion.div
                  key={line.label}
                  custom={i}
                  variants={lineVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex justify-between text-white/80 text-sm"
                >
                  <span>{line.label}</span>
                  <span className="font-semibold text-lime-400">+{line.value}</span>
                </motion.div>
              ))}
            </div>
            <motion.div
              variants={totalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="pt-3"
            >
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                <span className="text-3xl font-bold text-white">+{xp.total} XP</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
