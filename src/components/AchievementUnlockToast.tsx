"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, X } from "lucide-react";
import { SPRING } from "@/lib/animations";
import { Panel } from "@/components/ui/Panel";
import type { Achievement } from "@/types";

interface AchievementUnlockToastProps {
  achievements: Achievement[];
  onDismiss: () => void;
}

const VISIBLE_MS = 5400;

export function AchievementUnlockToast({ achievements, onDismiss }: AchievementUnlockToastProps) {
  useEffect(() => {
    if (achievements.length === 0) return;
    const t = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(t);
  }, [achievements, onDismiss]);

  return (
    <AnimatePresence>
      {achievements.length > 0 && (
        <motion.div
          key={achievements.map((a) => a.id).join("|")}
          className="fixed top-[88px] right-4 z-[60] max-w-sm pointer-events-auto"
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.95 }}
          transition={SPRING.bouncy}
          role="status"
          aria-live="polite"
        >
          <Panel contentClassName="p-5 pr-10">
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 z-10 text-white/70 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-emerald-300/80" />
              <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-white/40">
                {achievements.length === 1 ? "Achievement Unlocked" : `${achievements.length} Achievements Unlocked`}
              </span>
            </div>

            <div className="space-y-3">
              {achievements.slice(0, 3).map((a, i) => (
                <motion.div
                  key={a.id}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SPRING.gentle, delay: 0.15 + i * 0.1 }}
                >
                  <div
                    className="flex items-center justify-center w-10 h-10 flex-shrink-0 text-2xl rounded-full bg-white/10 border border-white/15"
                    aria-hidden
                  >
                    {a.icon}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[14px] font-semibold text-white leading-tight">{a.name}</p>
                    <p className="text-[12px] text-white/55 leading-snug mt-0.5">{a.description}</p>
                  </div>
                </motion.div>
              ))}
              {achievements.length > 3 && (
                <p className="text-[12px] text-white/55 font-medium pl-14">
                  +{achievements.length - 3} more
                </p>
              )}
            </div>
          </Panel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
