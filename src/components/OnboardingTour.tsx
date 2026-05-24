"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Flame, Award, Share2, ArrowRight, X } from "lucide-react";
import { BUTTON_CLIPS, LABEL_CLIPS, SHARD_CLIPS, VORONOI_LIGHT, getClip } from "@/constants";
import { useMonotone } from "./MonotoneContext";
import { VoronoiMosaic } from "./VoronoiMosaic";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

const STORAGE_KEY = "fd_onboarding_tour_v1";

interface TourStep {
  readonly icon: typeof Calendar;
  readonly accent: string;
  readonly heading: string;
  readonly body: string;
}

const STEPS: readonly TourStep[] = [
  {
    icon: Calendar,
    accent: "#fcd02a",
    heading: "30 Days. One Goal.",
    body: "Each day unlocks a small set of activities. Tap a day to see today's mission.",
  },
  {
    icon: Flame,
    accent: "#fb7025",
    heading: "Build A Streak.",
    body: "Show up daily and your streak climbs. Each streak day boosts your XP multiplier.",
  },
  {
    icon: Award,
    accent: "#f31b5e",
    heading: "Unlock Achievements.",
    body: "Hit milestones — first day, week warrior, halfway hero — and we'll celebrate every win.",
  },
  {
    icon: Share2,
    accent: "#3075e1",
    heading: "Finish Strong.",
    body: "Crush all 30 days and earn a shareable certificate. Your story, your proof.",
  },
];

export function OnboardingTour() {
  const { monotone } = useMonotone();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // Private mode / disabled storage — just skip the tour
    }
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
    setOpen(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const accent = monotone ? "#FFFFFF" : current.accent;
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-heading"
        >
          <motion.div
            key={step}
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: -12 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative overflow-hidden w-full max-w-md p-8 md:p-10"
            style={{ clipPath: getClip(SHARD_CLIPS, step) }}
          >
            <VoronoiMosaic seed={2107 + step * 17} tileCount={32} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
            <button
              type="button"
              onClick={finish}
              className="absolute top-4 right-4 z-10 text-white/40 hover:text-white/80 transition-colors"
              aria-label="Skip tour"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex justify-center mb-6">
              <div
                className="relative overflow-hidden flex items-center justify-center w-20 h-20 md:w-24 md:h-24 border-2"
                style={{ clipPath: getClip(SHARD_CLIPS, step + 1), borderColor: accent }}
              >
                <VoronoiMosaic seed={2131 + step * 13} tileCount={10} margin={3} gap={1.5} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
                <Icon className="relative z-10 w-10 h-10 md:w-12 md:h-12" style={{ color: accent }} strokeWidth={1.6} />
              </div>
            </div>

            <h2
              id="tour-heading"
              className="relative z-10 text-center text-3xl md:text-5xl font-black uppercase text-white mb-3 leading-[0.95]"
              style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif", letterSpacing: 1 }}
            >
              {current.heading}
            </h2>

            <p className="relative z-10 text-center text-base md:text-lg text-white/75 font-medium mb-8 max-w-sm mx-auto">
              {current.body}
            </p>

            <div className="relative z-10 flex items-center justify-center gap-2 mb-6">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className="transition-all"
                  style={{
                    width: i === step ? 28 : 8,
                    height: 8,
                    backgroundColor: i === step ? accent : "rgba(255,255,255,0.2)",
                    clipPath: "polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)",
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={finish}
                className="px-5 py-3 text-sm font-bold text-white/60 hover:text-white uppercase tracking-wide transition-colors"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={next}
                className="flex items-center justify-center gap-2 px-6 py-4 text-base font-black text-black uppercase tracking-wide hover:scale-105 transition-transform btn-shake"
                style={{
                  backgroundColor: monotone ? "#666666" : VORONOI_LIGHT[0],
                  clipPath: getClip(BUTTON_CLIPS, step),
                  fontFamily: "var(--font-bebas), system-ui, sans-serif",
                  letterSpacing: 2,
                }}
              >
                {isLast ? "Let's Go" : "Next"}
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>

            <div className="relative z-10 mt-6 flex justify-center">
              <div
                className="px-3 py-1 bg-white/5"
                style={{ clipPath: getClip(LABEL_CLIPS, step) }}
              >
                <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white/50">
                  Step {step + 1} of {STEPS.length}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
