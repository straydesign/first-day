"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FirstDayLogo } from "../FirstDayLogo";
import {
  GOAL_SUGGESTIONS_ROW_1,
  GOAL_SUGGESTIONS_ROW_2,
  GOAL_SUGGESTIONS_ROW_3,
  GOAL_CATEGORY_MAP,
  GOAL_CATEGORY_COLORS,
} from "@/constants";

interface HeroSectionProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

export function HeroSection({ onGetStarted, onLogin }: HeroSectionProps) {
  const [isPausedRow1, setIsPausedRow1] = useState(false);
  const [isPausedRow2, setIsPausedRow2] = useState(false);
  const [isPausedRow3, setIsPausedRow3] = useState(false);

  const getGoalColorClasses = (goal: string) => {
    const goalType = GOAL_CATEGORY_MAP[goal] || "lifestyle";
    return GOAL_CATEGORY_COLORS[goalType];
  };

  const renderScrollRow = (
    goals: string[],
    direction: "left" | "right",
    isPaused: boolean,
    setIsPaused: (v: boolean) => void,
  ) => (
    <div
      className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        className={`flex whitespace-nowrap ${isPaused ? "" : direction === "left" ? "motion-safe:animate-scroll-left" : "motion-safe:animate-scroll-right"}`}
      >
        {[...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals].map(
          (goal, index) => (
            <div
              key={index}
              className={`inline-block px-4 py-2 rounded-full text-gray-700 border-2 ${getGoalColorClasses(goal)} text-sm font-medium mx-1.5 select-none`}
            >
              {goal}
            </div>
          ),
        )}
      </div>
    </div>
  );

  return (
    <section className="min-h-[200px] flex flex-col justify-center px-0 py-8">
      <div className="w-full flex flex-col h-full justify-between">
        {/* Top bar: Log In + Get Started */}
        <div className="absolute top-11 left-0 right-0 flex items-center justify-between px-4 z-50">
          <Button
            onClick={onLogin || onGetStarted}
            variant="outline"
            size="sm"
            className="bg-transparent border-2 border-teal-600 text-teal-600 hover:bg-teal-50 shadow-md px-4 py-2 rounded-full"
          >
            Log In
          </Button>
          <Button
            onClick={onGetStarted}
            size="sm"
            className="shadow-md hover:shadow-lg transition-smooth px-4 py-2 rounded-full"
          >
            Get Started
          </Button>
        </div>

        {/* Value Proposition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center px-4 mb-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3">
            Achieve any goal in 30 days
          </h1>
          <p className="text-lg md:text-xl text-teal-700 max-w-2xl mx-auto">
            AI creates your personalized daily plan. You just show up.
          </p>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-center pb-4 flex items-center justify-center"
        >
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-block cursor-pointer hover:scale-105 transition-transform duration-300"
            aria-label="First Day - Home"
          >
            <FirstDayLogo width={240} height={96} showTagline={false} className="text-teal-600" />
          </button>
        </motion.div>

        {/* Scrolling Goal Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="overflow-hidden w-full"
        >
          <div className="py-4 overflow-hidden space-y-1.5">
            <p className="text-gray-700 text-sm font-medium mb-3 text-center px-4">Goals you can achieve in 30 days:</p>
            {renderScrollRow(GOAL_SUGGESTIONS_ROW_1, "left", isPausedRow1, setIsPausedRow1)}
            {renderScrollRow(GOAL_SUGGESTIONS_ROW_2, "right", isPausedRow2, setIsPausedRow2)}
            {renderScrollRow(GOAL_SUGGESTIONS_ROW_3, "left", isPausedRow3, setIsPausedRow3)}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="text-center pt-6"
            >
              <Button
                onClick={onGetStarted}
                className="shadow-lg hover:shadow-xl transition-smooth hover:scale-105 px-6 py-5 md:px-8 md:py-6 text-base md:text-lg"
              >
                Start Your Own Journey
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
