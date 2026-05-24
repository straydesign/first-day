"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { XPBreakdown } from "@/types";
import { Zap } from "lucide-react";
import { SPRING } from "@/lib/animations";
import { VoronoiMosaic } from "./VoronoiMosaic";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

interface XPAnimationProps {
  xp: XPBreakdown;
  show: boolean;
}

const lineVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...SPRING.gentle, delay: 0.3 + i * 0.12 },
  }),
  exit: { opacity: 0, y: -30, transition: { duration: 0.2 } },
};

const totalVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...SPRING.bouncy, delay: 0.9 },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

export function XPAnimation({ xp, show }: XPAnimationProps) {
  const lines: { label: string; value: number; highlight?: boolean }[] = [];
  if (xp.base > 0) lines.push({ label: "Day complete", value: xp.base });
  if (xp.activities > 0) lines.push({ label: "Activities", value: xp.activities });
  if (xp.reflection > 0) lines.push({ label: "Reflection", value: xp.reflection });
  if (xp.streakBonus > 0) lines.push({ label: "Streak bonus", value: xp.streakBonus });
  if (xp.challengeBonus > 0) lines.push({ label: "Challenge bonus", value: xp.challengeBonus, highlight: true });
  if (xp.comebackBonus > 0) lines.push({ label: "Comeback bonus", value: xp.comebackBonus, highlight: true });
  const hasMultiplier = xp.multiplier > 1;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="relative overflow-hidden backdrop-blur-sm clip-badge-b p-6 min-w-[240px] text-center pointer-events-auto border border-white/10">
            <VoronoiMosaic seed={3701} tileCount={42} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
            <div className="relative z-10 space-y-2 mb-4">
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
                  <span className={`font-semibold ${line.highlight ? 'text-yellow-400' : 'text-lime-400'}`}>+{line.value}</span>
                </motion.div>
              ))}
            </div>
            <motion.div
              variants={totalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 pt-3"
            >
              <div className="flex flex-col items-center gap-1">
                {hasMultiplier && (
                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                    {xp.multiplier}x Multiplier Day
                  </span>
                )}
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <span className="text-3xl font-bold text-white">+{xp.total} XP</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
