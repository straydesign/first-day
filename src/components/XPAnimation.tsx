"use client";
import { motion, AnimatePresence } from "framer-motion";
import type { XPBreakdown } from "@/types";
import { Zap } from "lucide-react";
import { SPRING } from "@/lib/animations";
import { Panel } from "@/components/ui/Panel";
import { FONT } from "@/lib/design";


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
          <div className="mx-4 min-w-[240px] pointer-events-auto">
            <Panel contentClassName="p-6 text-center">
              <div className="space-y-2 mb-4">
                {lines.map((line, i) => (
                  <motion.div
                    key={line.label}
                    custom={i}
                    variants={lineVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex justify-between text-[13px]"
                  >
                    <span className="text-white/55">{line.label}</span>
                    <span className={`font-semibold tabular-nums ${line.highlight ? 'text-white/80' : 'text-emerald-300/80'}`}>
                      +{line.value}
                    </span>
                  </motion.div>
                ))}
              </div>
              <motion.div
                variants={totalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="pt-3 border-t border-white/[0.08]"
              >
                <div className="flex flex-col items-center gap-1">
                  {hasMultiplier && (
                    <span
                      className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40"
                      style={{ fontFamily: FONT }}
                    >
                      {xp.multiplier}x Multiplier Day
                    </span>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5 text-white/50" />
                    <span
                      className="text-[28px] font-semibold tracking-[-0.02em] text-white tabular-nums"
                      style={{ fontFamily: FONT }}
                    >
                      +{xp.total} XP
                    </span>
                  </div>
                </div>
              </motion.div>
            </Panel>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
