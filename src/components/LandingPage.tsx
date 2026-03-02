"use client";

import { useState } from "react";
import { Sparkles, Calendar, Mail } from "lucide-react";
import Aurora from "./Aurora";
import { DayOneLogo } from "./DayOneLogo";
import { Button } from "@/components/ui/button";
import { GOAL_SUGGESTIONS_ROW_1, GOAL_SUGGESTIONS_ROW_2, GOAL_SUGGESTIONS_ROW_3, GOAL_CATEGORY_MAP, GOAL_CATEGORY_COLORS } from "@/constants";

interface LandingPageProps {
  onGetStarted: () => void;
  onPrivacyPolicy: () => void;
  onTermsOfService: () => void;
}

export function LandingPage({ onGetStarted, onPrivacyPolicy, onTermsOfService }: LandingPageProps) {
  const [isPausedRow1, setIsPausedRow1] = useState(false);
  const [isPausedRow2, setIsPausedRow2] = useState(false);
  const [isPausedRow3, setIsPausedRow3] = useState(false);

  const getGoalColorClasses = (goal: string) => {
    const goalType = GOAL_CATEGORY_MAP[goal] || "meditation";
    return GOAL_CATEGORY_COLORS[goalType];
  };

  const renderScrollRow = (goals: string[], direction: "left" | "right", isPaused: boolean, setIsPaused: (v: boolean) => void) => (
    <div
      className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className={`flex whitespace-nowrap ${isPaused ? "" : direction === "left" ? "animate-scroll-left" : "animate-scroll-right"}`}>
        {[...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals].map((goal, index) => (
          <div
            key={index}
            className={`inline-block px-4 py-2 rounded-full text-gray-700 border-2 ${getGoalColorClasses(goal)} text-sm font-medium mx-1.5 select-none`}
          >
            {goal}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative bg-black">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0 w-full h-full">
        <Aurora colorStops={["#7cff67", "#00c7fc", "#5227FF"]} />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-[44px]">
        {/* Hero Section */}
        <section className="min-h-[200px] flex flex-col justify-center px-0 py-8">
          <div className="w-full flex flex-col h-full justify-between">
            {/* Top bar: Log In + Get Started */}
            <div className="absolute top-11 left-0 right-0 flex items-center justify-between px-4 z-50">
              <Button
                onClick={onGetStarted}
                size="sm"
                className="shadow-md hover:shadow-lg transition-smooth px-4 py-2 rounded-full"
              >
                Log In
              </Button>
              <Button
                onClick={onGetStarted}
                variant="outline"
                size="sm"
                className="bg-transparent border-2 border-teal-600 text-teal-600 hover:bg-teal-50 shadow-md px-4 py-2 rounded-full"
              >
                Get Started
              </Button>
            </div>

            {/* Logo */}
            <div className="text-center pt-2 pb-1 animate-fadeIn flex items-center justify-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-block cursor-pointer hover:scale-105 transition-transform duration-300"
                aria-label="First Day - Home"
              >
                <DayOneLogo
                  width={280}
                  height={112}
                  showTagline={true}
                  className="text-teal-600"
                />
              </button>
            </div>

            {/* Value Proposition */}
            <div className="text-center px-4 mb-6 animate-fadeIn">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3">
                Achieve any goal in 30 days
              </h1>
              <p className="text-lg md:text-xl text-teal-700 max-w-2xl mx-auto">
                AI creates your personalized daily plan. You just show up.
              </p>
            </div>

            {/* Scrolling Goal Pills */}
            <div className="bg-white/80 backdrop-blur-xl rounded-none md:rounded-2xl border-y md:border border-white/50 shadow-2xl overflow-hidden w-full md:max-w-7xl md:mx-auto">
              <div className="py-4 overflow-hidden space-y-1.5">
                <p className="text-gray-700 text-sm font-medium mb-3 text-center px-4">Popular goals our users are achieving:</p>
                {renderScrollRow(GOAL_SUGGESTIONS_ROW_1, "left", isPausedRow1, setIsPausedRow1)}
                {renderScrollRow(GOAL_SUGGESTIONS_ROW_2, "right", isPausedRow2, setIsPausedRow2)}
                {renderScrollRow(GOAL_SUGGESTIONS_ROW_3, "left", isPausedRow3, setIsPausedRow3)}

                {/* CTA */}
                <div className="text-center pt-6">
                  <Button
                    onClick={onGetStarted}
                    className="shadow-lg hover:shadow-xl transition-smooth hover:scale-105 px-8 py-6 text-lg"
                  >
                    Start Your Own Journey
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="w-full py-8 md:py-16 px-0 md:px-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-none md:rounded-2xl border-y md:border border-white/50 shadow-2xl overflow-hidden">
            <div className="px-6 md:px-10 pt-6 md:pt-10 pb-4 text-center">
              <h2 className="text-2xl md:text-4xl font-bold text-slate-800 mb-2">How It Works</h2>
              <p className="text-teal-700">Three simple steps to your best month</p>
            </div>

            <div className="divide-y divide-gray-200">
              {/* Step 1: Answer */}
              <div className="px-6 md:px-10 py-5 md:py-8">
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md text-xl font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Answer</h3>
                    <p className="text-gray-700 text-lg mb-4">
                      Tell us what you want to achieve and answer a few quick questions about your experience level. Takes less than 2 minutes.
                    </p>
                    <p className="text-gray-500 text-sm">
                      <strong className="text-gray-700">Example goals:</strong> Learn Spanish basics, Build a meditation habit, Write a short story, Run a 5K
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Get Plan */}
              <div className="px-6 md:px-10 py-5 md:py-8">
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md text-xl font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Your Plan</h3>
                    <p className="text-gray-700 text-lg mb-3">
                      AI builds a personalized 30-day plan unique to you.
                    </p>
                    <div className="flex items-start gap-2 text-gray-500 text-sm">
                      <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span>Considers your goal, motivation, experience level, and preferred learning style</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Stay Consistent */}
              <div className="px-6 md:px-10 py-5 md:py-8">
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-full bg-lime-500 text-white flex items-center justify-center shadow-md text-xl font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Stay Consistent</h3>
                    <p className="text-gray-700 text-lg mb-4">
                      Follow your daily activities and track progress on your visual calendar.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Mail className="w-4 h-4 text-lime-600 flex-shrink-0" />
                        <span>Daily email reminders at your preferred time</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Calendar className="w-4 h-4 text-lime-600 flex-shrink-0" />
                        <span>Visual 30-day calendar with progress tracking</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-100 text-gray-700 py-6 border-t border-gray-300">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-6">
              <ul className="flex flex-wrap gap-4 justify-center">
                <li>
                  <a
                    href="/privacy"
                    onClick={(e) => { e.preventDefault(); onPrivacyPolicy(); }}
                    className="text-gray-600 hover:text-teal-700 underline transition-colors text-sm"
                  >
                    Privacy &amp; Data
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    onClick={(e) => { e.preventDefault(); onTermsOfService(); }}
                    className="text-gray-600 hover:text-teal-700 underline transition-colors text-sm"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="https://straydesign.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-teal-700 underline transition-colors text-sm"
                  >
                    Portfolio
                  </a>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-300 pt-6 text-center text-gray-600 text-xs">
              <p>&copy; {new Date().getFullYear()} Day One. All rights reserved. // <a href="https://straydesign.co" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline hover:text-teal-800">https://straydesign.co</a></p>
              <p className="mt-0.5">
                Contact: <a href="mailto:support@firstday.life" className="text-teal-700 underline hover:text-teal-800">support@firstday.life</a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
