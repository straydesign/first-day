"use client";
import { useState, useEffect } from "react";
import { FirstDayLogo } from "./FirstDayLogo";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Calendar, Lightbulb, Sparkles } from "lucide-react";
import { VORONOI_LIGHT } from "@/constants";

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

const SHARD_COUNT = 20;

const SHARD_CLIPS = [
  "polygon(2% 0%, 100% 4%, 97% 100%, 0% 96%)",
  "polygon(0% 3%, 98% 0%, 100% 97%, 3% 100%)",
  "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)",
  "polygon(3% 2%, 100% 0%, 97% 98%, 0% 100%)",
];

const MESSAGE_SHARD_CLIP = "polygon(2% 0%, 98% 3%, 100% 97%, 0% 100%)";

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

  const filledShards = Math.floor((progress / 100) * SHARD_COUNT);

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      <div className="absolute inset-0 z-[105] flex flex-col items-center justify-center gap-8 px-6">
        <FirstDayLogo size="hero" showTagline={true} showLetters={false} className="w-full" />

        {showProgress && (
          <div className="w-full max-w-md space-y-6 animate-fadeIn">
            {/* Shard progress bar */}
            <div className="flex gap-[2px] h-3 w-full">
              {Array.from({ length: SHARD_COUNT }, (_, i) => {
                const isFilled = i <= filledShards;
                const color = VORONOI_LIGHT[i % VORONOI_LIGHT.length];
                return (
                  <div
                    key={i}
                    className="flex-1 transition-all duration-200"
                    style={{
                      backgroundColor: isFilled ? color : "rgba(255,255,255,0.08)",
                      clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length],
                      boxShadow: isFilled ? `0 0 8px ${color}60` : "none",
                    }}
                  />
                );
              })}
            </div>

            {/* Step message + percentage on a shard */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center"
              >
                <div
                  className="inline-flex items-center gap-3 px-6 py-3"
                  style={{
                    backgroundColor: VORONOI_LIGHT[currentStep % VORONOI_LIGHT.length],
                    clipPath: MESSAGE_SHARD_CLIP,
                  }}
                >
                  {(() => {
                    const Icon = PROGRESS_STEPS[currentStep].icon;
                    return <Icon className="w-5 h-5 text-black" />;
                  })()}
                  <span className="text-base font-black text-black uppercase tracking-wide">
                    {PROGRESS_STEPS[currentStep].message}
                  </span>
                  <span className="text-base font-black text-black">
                    {Math.round(progress)}%
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
