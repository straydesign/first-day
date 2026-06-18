"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake, X } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { FONT } from "@/lib/design";

interface StreakFreezeIndicatorProps {
  count: number;
  isAtRisk?: boolean;
}

export function StreakFreezeIndicator({ count, isAtRisk = false }: StreakFreezeIndicatorProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (count <= 0) return null;

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent backdrop-blur-sm px-4"
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
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Panel contentClassName="p-8 md:p-10 relative">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-center mb-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 border border-white/15">
                  <Snowflake className="w-8 h-8 text-white/70" strokeWidth={1.6} />
                </div>
              </div>

              <h2
                id="freeze-modal-heading"
                className="text-center text-[32px] font-semibold tracking-[-0.02em] text-white mb-3 leading-[1.05]"
                style={{ fontFamily: FONT }}
              >
                Streak Freeze
              </h2>

              <p className="text-center text-[16px] leading-relaxed text-white/70 mb-2">
                You have <span className="font-semibold text-white">{count}</span> streak {count === 1 ? "freeze" : "freezes"}.
              </p>
              <p className="text-center text-[14px] leading-relaxed text-white/50 mb-8 max-w-sm mx-auto">
                Earn one for every 7-day streak you hit. They&apos;re your safety net — life happens, and a freeze keeps your streak alive on a missed day.
              </p>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-white text-black text-[15px] font-semibold py-3 px-8 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  style={{ fontFamily: FONT }}
                >
                  Got it
                </button>
              </div>
            </Panel>
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
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[13px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white ${isAtRisk ? "animate-pulse" : ""}`}
      >
        <Snowflake className="w-3.5 h-3.5" />
        <span>{count}</span>
      </button>

      {mounted && createPortal(modal, document.body)}
    </>
  );
}
