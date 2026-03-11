"use client";
import { useState, useEffect } from "react";
import Aurora from "./Aurora";
import { AURORA_COLORS } from "@/constants";
import { FirstDayLogo } from "./FirstDayLogo";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Calendar, Lightbulb, Sparkles } from "lucide-react";

interface LoadingScreenProps {
  showProgress?: boolean;
  estimatedDuration?: number;
}

const PROGRESS_STEPS = [
  { message: "Analyzing your goal...", icon: Search },
  { message: "Researching best practices...", icon: BookOpen },
  { message: "Building your 30-day plan...", icon: Calendar },
  { message: "Selecting resources...", icon: Lightbulb },
  { message: "Finalizing your plan...", icon: Sparkles },
];

export function LoadingScreen({ showProgress = false, estimatedDuration = 15000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!showProgress) return;

    const startTime = Date.now();
    const stepInterval = estimatedDuration / PROGRESS_STEPS.length;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = elapsed / estimatedDuration;
      const easedProgress = 95 * (1 - Math.exp(-3 * rawProgress));
      setProgress(Math.min(easedProgress, 95));

      const stepIndex = Math.min(
        Math.floor(elapsed / stepInterval),
        PROGRESS_STEPS.length - 1
      );
      setCurrentStep(stepIndex);
    }, 50);

    return () => clearInterval(timer);
  }, [showProgress, estimatedDuration]);

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      <div className="absolute inset-0 z-[101] w-full h-full">
        <Aurora colorStops={[...AURORA_COLORS]} />
      </div>
      <div className="absolute inset-0 z-[105] flex flex-col items-center justify-center gap-8 px-6">
        <FirstDayLogo width={300} height={150} showTagline={true} layout="vertical" />

        {showProgress && (
          <div className="w-full max-w-md space-y-4 animate-fadeIn">
            <Progress
              value={progress}
              className="h-2 bg-white/10 [&>[data-slot=progress-indicator]]:bg-[#cc5533] [&>[data-slot=progress-indicator]]:shadow-[0_0_12px_rgba(204,85,51,0.5)] [&>[data-slot=progress-indicator]]:transition-all"
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-2 text-white"
              >
                {(() => {
                  const Icon = PROGRESS_STEPS[currentStep].icon;
                  return <Icon className="w-4 h-4" />;
                })()}
                <span className="text-sm font-medium">
                  {PROGRESS_STEPS[currentStep].message}
                </span>
              </motion.div>
            </AnimatePresence>
            <p className="text-center text-xs text-white/80">
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
