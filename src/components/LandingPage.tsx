"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { Sparkles, Calendar, Mail, BookOpen, CheckSquare, Flame, Zap, Trophy, Target } from "lucide-react";
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

// Reusable scroll-triggered section wrapper
function AnimatedSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
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
      <div className={`flex whitespace-nowrap ${isPaused ? "" : direction === "left" ? "motion-safe:animate-scroll-left" : "motion-safe:animate-scroll-right"}`}>
        {[...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals].map((goal, index) => (
          <div
            key={index}
            className={`inline-block px-4 py-2 rounded-full text-white/80 border-2 ${getGoalColorClasses(goal)} text-sm font-medium mx-1.5 select-none`}
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
        {/* Hero Section — full screen mountain scene */}
        <section className="relative min-h-screen flex flex-col justify-center items-center px-0">
          {/* Full-bleed hero image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/logo-mark.png"
              alt="Sunrise between mountains over a lake"
              fill
              className="object-cover"
              priority
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
          </div>

          {/* Top bar: Log In + Get Started */}
          <div className="absolute top-11 left-0 right-0 flex items-center justify-between px-4 z-50">
            <Button
              onClick={onLogin || onGetStarted}
              variant="outline"
              size="sm"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/50 text-white hover:bg-white/20 shadow-md px-4 py-2 rounded-full"
            >
              Log In
            </Button>
            <Button
              onClick={onGetStarted}
              size="sm"
              className="bg-white/90 text-[#1a1a3e] hover:bg-white shadow-md hover:shadow-lg transition-smooth px-4 py-2 rounded-full"
            >
              Get Started
            </Button>
          </div>

          {/* Hero content — overlaid on image */}
          <div className="relative z-10 flex flex-col items-center text-center px-4 pt-16">
            {/* Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <FirstDayLogo size="hero" showTagline={true} />
            </motion.div>

            {/* Subtitle on geometric dark cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              className="mt-8 flex flex-col items-center gap-3"
            >
              <div
                className="px-6 py-3 backdrop-blur-sm shadow-lg"
                style={{
                  background: "rgba(29, 15, 102, 0.75)",
                  clipPath: "polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)",
                }}
              >
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  Achieve any goal in 30 days
                </h1>
              </div>
              <div
                className="px-6 py-2.5 backdrop-blur-sm shadow-lg"
                style={{
                  background: "rgba(45, 21, 144, 0.7)",
                  clipPath: "polygon(0% 0%, 97% 0%, 100% 100%, 3% 100%)",
                }}
              >
                <p className="text-sm md:text-base text-white/90">
                  AI creates your personalized daily plan. You just show up.
                </p>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="mt-8"
            >
              <Button
                onClick={onGetStarted}
                className="shadow-lg hover:shadow-xl transition-smooth hover:scale-105 px-8 py-6 text-lg"
                style={{
                  clipPath: "polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)",
                }}
              >
                Start Your Own Journey
              </Button>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/40 flex justify-center pt-2">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-white/60"
              />
            </div>
          </motion.div>
        </section>

        {/* Scrolling Goal Pills — below hero */}
        <section className="py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="overflow-hidden w-full"
          >
            <div className="py-4 overflow-hidden space-y-1.5">
              <p className="text-white/80 text-sm font-medium mb-3 text-center px-4">Goals you can achieve in 30 days:</p>
              {renderScrollRow(GOAL_SUGGESTIONS_ROW_1, "left", isPausedRow1, setIsPausedRow1)}
              {renderScrollRow(GOAL_SUGGESTIONS_ROW_2, "right", isPausedRow2, setIsPausedRow2)}
              {renderScrollRow(GOAL_SUGGESTIONS_ROW_3, "left", isPausedRow3, setIsPausedRow3)}
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <AnimatedSection>
          <section id="how-it-works" className="w-full py-8 md:py-16 px-0 md:px-4">
            <div className="bg-[#1a1a3e] backdrop-blur-xl rounded-none md:rounded-none border-y md:border border-white/10 overflow-hidden">
              <div className="px-6 md:px-10 pt-6 md:pt-10 pb-4 text-center">
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">How It Works</h2>
                <p className="text-teal-700">Three simple steps to your best month</p>
              </div>

              <div className="divide-y divide-white/10">
                {/* Step 1 */}
                <div className="px-6 md:px-10 py-5 md:py-8">
                  <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md text-xl font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">Set Your Goal</h3>
                      <p className="text-white/80 text-lg mb-4">
                        Pick any goal and answer a few quick questions about your experience and what motivates you. Takes less than 2 minutes.
                      </p>
                      <p className="text-white/50 text-sm">
                        <strong className="text-white/80">Examples:</strong> Learn Spanish basics, Build a meditation habit, Write a short story, Run a 5K
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="px-6 md:px-10 py-5 md:py-8">
                  <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md text-xl font-bold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">Get Your Plan</h3>
                      <p className="text-white/80 text-lg mb-3">
                        AI generates a structured 30-day plan with daily activities, curated resources, and weekly book recommendations tailored to you.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                        <div className="flex items-start gap-2 text-white/50 text-sm">
                          <CheckSquare className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                          <span>Daily activities with video and article resources</span>
                        </div>
                        <div className="flex items-start gap-2 text-white/50 text-sm">
                          <BookOpen className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                          <span>Weekly book recommendations to deepen your learning</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="px-6 md:px-10 py-5 md:py-8">
                  <div className="flex gap-5 items-start">
                    <div className="w-12 h-12 rounded-full bg-lime-500 text-white flex items-center justify-center shadow-md text-xl font-bold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">Show Up Daily</h3>
                      <p className="text-white/80 text-lg mb-4">
                        Check off activities, reflect on your progress, and watch your calendar fill up with completed days.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-white/50 text-sm">
                          <Calendar className="w-4 h-4 text-lime-600 flex-shrink-0" />
                          <span>Visual 30-day calendar with progress tracking</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/50 text-sm">
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
        </AnimatedSection>

        {/* Stay Motivated — Gamification Preview */}
        <AnimatedSection>
          <section className="w-full py-8 md:py-16 px-0 md:px-4">
            <div className="bg-[#1a1a3e] backdrop-blur-xl rounded-none md:rounded-none border-y md:border border-white/10 overflow-hidden">
              <div className="px-6 md:px-10 pt-6 md:pt-10 pb-4 text-center">
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">Stay Motivated</h2>
                <p className="text-teal-700">Built-in streaks, XP, and achievements keep you coming back</p>
              </div>

              <div className="px-6 md:px-10 pb-6 md:pb-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Streaks */}
                  <div className="bg-gradient-to-br from-[#12122e] to-[#1a1a3e] rounded-none border border-white/10 p-5 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-500/20 mb-3">
                      <Flame className="w-7 h-7 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Daily Streaks</h3>
                    <p className="text-white/80 text-sm mb-4">Keep your streak alive by showing up every day. The longer you go, the more bonus XP you earn.</p>
                    <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-700 rounded-full px-4 py-1.5 font-bold text-lg">
                      <Flame className="w-5 h-5" />
                      <span>12</span>
                    </div>
                    <p className="text-xs text-orange-600 mt-1 font-medium">12-day streak</p>
                  </div>

                  {/* XP & Levels */}
                  <div className="bg-gradient-to-br from-[#12122e] to-[#1a1a3e] rounded-none border border-white/10 p-5 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-500/20 mb-3">
                      <Zap className="w-7 h-7 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Earn XP</h3>
                    <p className="text-white/80 text-sm mb-4">Earn points for every activity you complete, every reflection you write, and every streak day.</p>
                    <div className="space-y-2 max-w-[180px] mx-auto">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-white/80">Dedicated</span>
                        <span className="text-yellow-600 font-bold">1,450 XP</span>
                      </div>
                      <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{ width: "62%" }} />
                      </div>
                      <p className="text-xs text-white/50">750 XP to Unstoppable</p>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="bg-gradient-to-br from-[#12122e] to-[#1a1a3e] rounded-none border border-white/10 p-5 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-500/20 mb-3">
                      <Trophy className="w-7 h-7 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Unlock Badges</h3>
                    <p className="text-white/80 text-sm mb-4">Hit milestones and earn achievements. Can you collect them all before day 30?</p>
                    <div className="flex justify-center gap-2">
                      {[
                        { icon: "🚀", label: "First Step" },
                        { icon: "🔥", label: "On Fire" },
                        { icon: "⭐", label: "Perfect Week" },
                        { icon: "🏆", label: "???" },
                      ].map((badge) => (
                        <div
                          key={badge.label}
                          className={`w-10 h-10 rounded-none flex items-center justify-center text-lg ${
                            badge.label === "???"
                              ? "bg-white/5 border border-dashed border-white/10 grayscale opacity-50"
                              : "bg-[#242450] border border-white/10"
                          }`}
                          title={badge.label}
                        >
                          {badge.icon}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stat bar */}
                <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg mx-auto">
                  <div className="text-center bg-white/5 rounded-none py-3 px-2 border border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Target className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-xs text-white/50 font-medium">Rate</span>
                    </div>
                    <p className="text-xl font-bold text-white">87%</p>
                  </div>
                  <div className="text-center bg-white/5 rounded-none py-3 px-2 border border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs text-white/50 font-medium">Streak</span>
                    </div>
                    <p className="text-xl font-bold text-white">12</p>
                  </div>
                  <div className="text-center bg-white/5 rounded-none py-3 px-2 border border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Trophy className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-xs text-white/50 font-medium">Badges</span>
                    </div>
                    <p className="text-xl font-bold text-white">5/8</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* What Your Plan Looks Like — Real Screenshots */}
        <AnimatedSection>
          <section className="w-full py-8 md:py-16 px-0 md:px-4">
            <div className="bg-[#1a1a3e] backdrop-blur-xl rounded-none md:rounded-none border-y md:border border-white/10 overflow-hidden">
              <div className="px-6 md:px-10 pt-6 md:pt-10 pb-4 text-center">
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">What Your Plan Looks Like</h2>
                <p className="text-teal-700">Real screens from &quot;Learn to play guitar&quot;</p>
              </div>

              <div className="px-6 md:px-10 pb-6 md:pb-10">
                {/* Screenshot carousel */}
                <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-2 px-2">
                  {[
                    { src: "/screenshots/calendar-view.png", label: "Your 30-Day Calendar", alt: "Calendar view showing weekly plan with day cards" },
                    { src: "/screenshots/day-view.png", label: "Daily Activities", alt: "Day view with checkable activities and YouTube resources" },
                    { src: "/screenshots/congrats-view.png", label: "Celebrate Wins", alt: "Congratulations screen with XP breakdown and achievements" },
                  ].map((screen) => (
                    <div key={screen.label} className="flex-shrink-0 snap-center">
                      <div className="relative w-[200px] md:w-[220px] rounded-[1.5rem] border-[4px] border-gray-800 bg-black overflow-hidden shadow-xl">
                        <Image
                          src={screen.src}
                          alt={screen.alt}
                          width={375}
                          height={812}
                          className="w-full h-auto"
                        />
                      </div>
                      <p className="text-center text-sm font-medium text-white/80 mt-3">{screen.label}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-6 md:mt-8">
                  <Button
                    onClick={onGetStarted}
                    className="shadow-lg hover:shadow-xl transition-smooth hover:scale-105 px-6 py-5 md:px-8 md:py-6 text-base md:text-lg"
                  >
                    Create Your Plan
                  </Button>
                  <p className="text-sm text-white/50 mt-3">
                    <Sparkles className="w-4 h-4 inline-block mr-1 text-purple-500" />
                    Every plan is unique — personalized to your goal and experience
                  </p>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        <Footer onPrivacyClick={onPrivacyPolicy} onTermsClick={onTermsOfService} />
      </div>
    </div>
  );
}
