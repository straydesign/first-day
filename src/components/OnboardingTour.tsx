"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Flame, Award, Share2, ArrowRight, X } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { FONT } from "@/lib/design";

const STORAGE_KEY = "fd_onboarding_tour_v1";

interface TourStep {
  readonly icon: typeof Calendar;
  readonly heading: string;
  readonly body: string;
}

const STEPS: readonly TourStep[] = [
  {
    icon: Calendar,
    heading: "One Week At A Time.",
    body: "Your goal becomes a series of 7-day sprints. Each day unlocks a small set of activities — tap to start.",
  },
  {
    icon: Flame,
    heading: "Build A Streak.",
    body: "Show up daily and your streak climbs. Each streak day boosts your XP multiplier.",
  },
  {
    icon: Award,
    heading: "Unlock Achievements.",
    body: "Hit milestones — first day, week warrior, halfway hero — and we'll celebrate every win.",
  },
  {
    icon: Share2,
    heading: "Finish Strong.",
    body: "Finish every sprint and earn a shareable certificate. Your story, your proof.",
  },
];

export function OnboardingTour() {
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
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm px-4"
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
            className="w-full max-w-md"
          >
            {/* Panel solid so the card pops clearly over the dark backdrop */}
            <Panel solid contentClassName="p-8 md:p-10">
              {/* Close button */}
              <button
                type="button"
                onClick={finish}
                className="absolute top-4 right-4 text-black/40 hover:text-black transition-colors"
                aria-label="Skip tour"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-black/5 border border-black/10">
                  <Icon className="w-8 h-8 text-black/70" strokeWidth={1.6} />
                </div>
              </div>

              {/* Heading */}
              <h2
                id="tour-heading"
                className="text-center text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-black leading-tight mb-3"
                style={{ fontFamily: FONT }}
              >
                {current.heading}
              </h2>

              {/* Body */}
              <p className="text-center text-[15px] leading-relaxed text-black/60 mb-8 max-w-sm mx-auto">
                {current.body}
              </p>

              {/* Dot indicators */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className="rounded-full transition-all"
                    style={{
                      width: i === step ? 20 : 6,
                      height: 6,
                      backgroundColor: i === step ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.15)",
                    }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={finish}
                  className="px-4 py-2.5 text-[13px] font-medium text-black/40 hover:text-black/70 transition-colors"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="flex items-center gap-2 rounded-full bg-black text-white text-[15px] font-semibold py-3 px-6 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isLast ? "Let's Go" : "Next"}
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>

              {/* Step counter */}
              <div className="mt-5 flex justify-center">
                <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-black/30">
                  Step {step + 1} of {STEPS.length}
                </span>
              </div>
            </Panel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
