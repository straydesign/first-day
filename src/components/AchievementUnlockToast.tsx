"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, X } from "lucide-react";
import { useMonotone } from "./MonotoneContext";
import { LABEL_CLIPS, SHARD_CLIPS, VORONOI_LIGHT, getClip } from "@/constants";
import { SPRING } from "@/lib/animations";
import { VoronoiMosaic } from "./VoronoiMosaic";
import type { Achievement } from "@/types";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

interface AchievementUnlockToastProps {
  achievements: Achievement[];
  onDismiss: () => void;
}

const VISIBLE_MS = 5400;

export function AchievementUnlockToast({ achievements, onDismiss }: AchievementUnlockToastProps) {
  const { monotone } = useMonotone();

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
          <div
            className="relative overflow-hidden p-5 pr-10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            style={{ clipPath: getClip(SHARD_CLIPS, 0) }}
          >
            <VoronoiMosaic seed={1873} tileCount={22} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 z-10 text-white/50 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-[#fcd02a]" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-[#fcd02a]">
                {achievements.length === 1 ? "Achievement Unlocked" : `${achievements.length} Achievements Unlocked`}
              </span>
            </div>

            <div className="relative z-10 space-y-3">
              {achievements.slice(0, 3).map((a, i) => {
                const accent = monotone ? "#FFFFFF" : VORONOI_LIGHT[i % VORONOI_LIGHT.length];
                return (
                  <motion.div
                    key={a.id}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...SPRING.gentle, delay: 0.15 + i * 0.1 }}
                  >
                    <div
                      className="flex items-center justify-center w-11 h-11 flex-shrink-0 text-2xl"
                      style={{ backgroundColor: accent, clipPath: getClip(LABEL_CLIPS, i) }}
                      aria-hidden
                    >
                      {a.icon}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm font-black text-white leading-tight">{a.name}</p>
                      <p className="text-xs text-white/65 leading-snug mt-0.5">{a.description}</p>
                    </div>
                  </motion.div>
                );
              })}
              {achievements.length > 3 && (
                <p className="text-xs text-white/50 font-medium pl-14">
                  +{achievements.length - 3} more
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
