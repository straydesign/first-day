"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake, X } from "lucide-react";
import { SHARD_CLIPS, BUTTON_CLIPS, getClip } from "@/constants";
import { useMonotone } from "./MonotoneContext";

interface StreakFreezeIndicatorProps {
  count: number;
  isAtRisk?: boolean;
}

export function StreakFreezeIndicator({ count, isAtRisk = false }: StreakFreezeIndicatorProps) {
  const { monotone } = useMonotone();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (count <= 0) return null;

  const accent = monotone ? "#FFFFFF" : "#00EAFF";

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="freeze-modal-heading"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative bg-black w-full max-w-md p-8 md:p-10"
            style={{ clipPath: getClip(SHARD_CLIPS, 0) }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-6">
              <div
                className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-black border-2"
                style={{ clipPath: getClip(SHARD_CLIPS, 1), borderColor: accent }}
              >
                <Snowflake className="w-10 h-10 md:w-12 md:h-12" style={{ color: accent }} strokeWidth={1.6} />
              </div>
            </div>

            <h2
              id="freeze-modal-heading"
              className="text-center text-3xl md:text-5xl font-black uppercase text-white mb-3 leading-[0.95]"
              style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif", letterSpacing: 1 }}
            >
              Streak Freeze
            </h2>

            <p className="text-center text-base md:text-lg text-white/80 font-medium mb-2">
              You have <span className="font-black" style={{ color: accent }}>{count}</span> streak {count === 1 ? "freeze" : "freezes"}.
            </p>
            <p className="text-center text-sm md:text-base text-white/60 font-medium mb-8 max-w-sm mx-auto">
              Earn one for every 7-day streak you hit. They&apos;re your safety net — life happens, and a freeze keeps your streak alive on a missed day.
            </p>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-8 py-4 text-base font-black text-black uppercase tracking-wide hover:scale-105 transition-transform btn-shake"
                style={{
                  backgroundColor: accent,
                  clipPath: getClip(BUTTON_CLIPS, 0),
                  fontFamily: "var(--font-bebas), system-ui, sans-serif",
                  letterSpacing: 2,
                }}
              >
                Got It
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${count} streak ${count === 1 ? "freeze" : "freezes"} available — tap to learn more`}
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-bold transition-transform hover:scale-105 ${isAtRisk ? "animate-pulse" : ""}`}
        style={{
          backgroundColor: monotone ? "rgba(255,255,255,0.08)" : "rgba(0,234,255,0.15)",
          color: accent,
          border: `1px solid ${monotone ? "rgba(255,255,255,0.25)" : "rgba(0,234,255,0.40)"}`,
          clipPath: "polygon(8% 0%, 100% 4%, 96% 100%, 0% 96%)",
        }}
      >
        <Snowflake className="w-4 h-4" />
        <span>{count}</span>
      </button>

      {mounted && createPortal(modal, document.body)}
    </>
  );
}
