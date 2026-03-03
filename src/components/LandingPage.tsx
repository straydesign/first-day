"use client";

import { useState } from "react";
import { Sparkles, Calendar, Mail, BookOpen, CheckSquare, CheckCircle2, Youtube, ExternalLink } from "lucide-react";
import Aurora from "./Aurora";
import { FirstDayLogo } from "./FirstDayLogo";
import { Footer } from "./Footer";
import { Button } from "@/components/ui/button";
import { GOAL_SUGGESTIONS_ROW_1, GOAL_SUGGESTIONS_ROW_2, GOAL_SUGGESTIONS_ROW_3, GOAL_CATEGORY_MAP, GOAL_CATEGORY_COLORS } from "@/constants";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
  onPrivacyPolicy: () => void;
  onTermsOfService: () => void;
}

export function LandingPage({ onGetStarted, onLogin, onPrivacyPolicy, onTermsOfService }: LandingPageProps) {
  const [isPausedRow1, setIsPausedRow1] = useState(false);
  const [isPausedRow2, setIsPausedRow2] = useState(false);
  const [isPausedRow3, setIsPausedRow3] = useState(false);

  const getGoalColorClasses = (goal: string) => {
    const goalType = GOAL_CATEGORY_MAP[goal] || "lifestyle";
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
            <div className="text-center px-4 mb-4 animate-fadeIn">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3">
                Achieve any goal in 30 days
              </h1>
              <p className="text-lg md:text-xl text-teal-700 max-w-2xl mx-auto">
                AI creates your personalized daily plan. You just show up.
              </p>
            </div>

            {/* Logo */}
            <div className="text-center pb-4 animate-fadeIn flex items-center justify-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-block cursor-pointer hover:scale-105 transition-transform duration-300"
                aria-label="First Day - Home"
              >
                <FirstDayLogo
                  width={240}
                  height={96}
                  showTagline={false}
                  className="text-teal-600"
                />
              </button>
            </div>

            {/* Scrolling Goal Pills */}
            <div className="bg-white/80 backdrop-blur-xl rounded-none md:rounded-2xl border-y md:border border-white/50 shadow-2xl overflow-hidden w-full md:max-w-7xl md:mx-auto">
              <div className="py-4 overflow-hidden space-y-1.5">
                <p className="text-gray-700 text-sm font-medium mb-3 text-center px-4">Goals you can achieve in 30 days:</p>
                {renderScrollRow(GOAL_SUGGESTIONS_ROW_1, "left", isPausedRow1, setIsPausedRow1)}
                {renderScrollRow(GOAL_SUGGESTIONS_ROW_2, "right", isPausedRow2, setIsPausedRow2)}
                {renderScrollRow(GOAL_SUGGESTIONS_ROW_3, "left", isPausedRow3, setIsPausedRow3)}

                {/* CTA */}
                <div className="text-center pt-6">
                  <Button
                    onClick={onGetStarted}
                    className="shadow-lg hover:shadow-xl transition-smooth hover:scale-105 px-6 py-5 md:px-8 md:py-6 text-base md:text-lg"
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Set Your Goal</h3>
                    <p className="text-gray-700 text-lg mb-4">
                      Pick any goal and answer a few quick questions about your experience and what motivates you. Takes less than 2 minutes.
                    </p>
                    <p className="text-gray-500 text-sm">
                      <strong className="text-gray-700">Examples:</strong> Learn Spanish basics, Build a meditation habit, Write a short story, Run a 5K
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
                      AI generates a structured 30-day plan with daily activities, curated resources, and weekly book recommendations tailored to you.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      <div className="flex items-start gap-2 text-gray-500 text-sm">
                        <CheckSquare className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Daily activities with video and article resources</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-500 text-sm">
                        <BookOpen className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>Weekly book recommendations to deepen your learning</span>
                      </div>
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Show Up Daily</h3>
                    <p className="text-gray-700 text-lg mb-4">
                      Check off activities, reflect on your progress, and watch your calendar fill up with completed days.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Calendar className="w-4 h-4 text-lime-600 flex-shrink-0" />
                        <span>Visual 30-day calendar with progress tracking</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Mail className="w-4 h-4 text-lime-600 flex-shrink-0" />
                        <span>Daily email reminders to keep you on track</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What Your Plan Looks Like */}
        <section className="w-full py-8 md:py-16 px-0 md:px-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-none md:rounded-2xl border-y md:border border-white/50 shadow-2xl overflow-hidden">
            <div className="px-6 md:px-10 pt-6 md:pt-10 pb-4 text-center">
              <h2 className="text-2xl md:text-4xl font-bold text-slate-800 mb-2">What Your Plan Looks Like</h2>
              <p className="text-teal-700">A real example from &quot;Learn to play guitar&quot;</p>
            </div>

            <div className="px-6 md:px-10 pb-6 md:pb-10">
              {/* Mini Calendar Preview */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Week 1: Getting Started</h3>
                </div>
                <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                    <div key={day} className="text-center">
                      <div className="text-xs text-gray-500 mb-1 hidden md:block">{day}</div>
                      <div className={`aspect-square rounded-lg border-2 flex items-center justify-center text-sm font-semibold ${
                        i < 4 ? "border-lime-400 bg-lime-50 text-lime-700" :
                        i === 4 ? "border-teal-400 bg-teal-50 text-teal-700" :
                        "border-gray-200 bg-gray-50 text-gray-400"
                      }`}>
                        {i < 4 && <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-lime-500" />}
                        {i === 4 && <span className="text-xs md:text-sm">Today</span>}
                        {i > 4 && <span>{i + 1}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Day Activities */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-300 flex items-center justify-center">
                    <span className="text-sm font-bold text-teal-700">5</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Day 5: Your First Song</h4>
                    <p className="text-sm text-teal-600">Today&apos;s activities</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { text: "Practice the Am, C, and G chord shapes for 10 minutes", checked: true },
                    { text: "Learn to play \"Horse With No Name\" — it only uses 2 chords!", checked: true, resource: { type: "youtube", label: "Search: Horse With No Name guitar tutorial beginner" } },
                    { text: "Record yourself playing and listen back for timing", checked: false },
                  ].map((activity, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border-2 ${activity.checked ? "border-lime-400 bg-white" : "border-gray-200 bg-white"}`}>
                      <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${activity.checked ? "border-lime-500 bg-lime-500" : "border-gray-300"}`}>
                        {activity.checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm md:text-base ${activity.checked ? "text-gray-700" : "text-gray-600"}`}>{activity.text}</p>
                        {activity.resource && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                            <Youtube className="w-3.5 h-3.5" />
                            <span>{activity.resource.label}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 italic">&quot;Managed to get through the whole song! Chord changes are still slow but getting smoother.&quot;</p>
                  <p className="text-xs text-gray-400 mt-1">Daily reflection</p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center mt-6 md:mt-8">
                <Button
                  onClick={onGetStarted}
                  className="shadow-lg hover:shadow-xl transition-smooth hover:scale-105 px-6 py-5 md:px-8 md:py-6 text-base md:text-lg"
                >
                  Create Your Plan
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  <Sparkles className="w-4 h-4 inline-block mr-1 text-purple-500" />
                  Every plan is unique — personalized to your goal and experience
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer onPrivacyClick={onPrivacyPolicy} onTermsClick={onTermsOfService} />
      </div>
    </div>
  );
}
