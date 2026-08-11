"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Calendar, Lightbulb, Sparkles, Loader2 } from "lucide-react";
import { FONT } from "@/lib/design";
import { COPY } from "@/content/copy";

interface LoadingScreenProps {
  showProgress?: boolean;
  estimatedDuration?: number;
}

const PROGRESS_ICONS = [Search, BookOpen, Calendar, Lightbulb, Sparkles] as const;

export function LoadingScreen({ showProgress = false, estimatedDuration = 15000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Detailed progress for plan generation
  useEffect(() => {
    if (!showProgress) return;

    const startTime = Date.now();
    const stepInterval = estimatedDuration / COPY.loading.steps.length;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = elapsed / estimatedDuration;
      const easedProgress = 95 * (1 - Math.exp(-3 * rawProgress));
      setProgress(Math.min(easedProgress, 95));

      const stepIndex = Math.min(
        Math.floor(elapsed / stepInterval),
        COPY.loading.steps.length - 1
      );
      setCurrentStep(stepIndex);
    }, 50);

    return () => clearInterval(timer);
  }, [showProgress, estimatedDuration]);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none backdrop-blur-[2px]">
      <div className="absolute inset-0 z-[105] flex flex-col items-center justify-center gap-8 px-6">
        {/* Sleek wordmark — replaces multicolor FirstDayLogo */}
        <div className="flex flex-col items-center gap-3">
          <span
            className="text-[42px] font-semibold tracking-[-0.03em] text-white leading-none"
            style={{ fontFamily: FONT }}
          >
            {COPY.loading.wordmark}
          </span>
          {/* Subtle spinner */}
          <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Sleek progress bar — track + fill, no bright shards */}
          {showProgress && (
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/85 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Step messages only for detailed progress */}
          {showProgress && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                  {(() => {
                    const Icon = PROGRESS_ICONS[currentStep];
                    return <Icon className="w-4 h-4 text-white/50 shrink-0" />;
                  })()}
                  <span className="text-[13px] font-medium text-white/60">
                    {COPY.loading.steps[currentStep]}
                  </span>
                  <span className="text-[13px] font-medium text-white/40 tabular-nums">
                    {Math.round(progress)}%
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
