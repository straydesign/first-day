"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { Sparkles, Calendar, Mail, BookOpen, CheckSquare, Flame, Zap, Trophy, Target } from "lucide-react";
import Aurora from "./Aurora";
import { FirstDayLogo } from "./FirstDayLogo";
import { Footer } from "./Footer";
import { MosaicCard } from "./MosaicCard";
import { GeometricFrame } from "./GeometricFrame";
import { Button } from "@/components/ui/button";
import { ShardButton } from "./ShardButton";
import { VoronoiMosaic } from "./VoronoiMosaic";
import { GOAL_SUGGESTIONS_ROW_1, GOAL_SUGGESTIONS_ROW_2, GOAL_SUGGESTIONS_ROW_3, GOAL_CATEGORY_MAP, GOAL_CATEGORY_COLORS, VORONOI_DARK } from "@/constants";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
  onPrivacyPolicy: () => void;
  onTermsOfService: () => void;
}

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

  const renderScrollRow = (goals: string[], direction: "left" | "right", isPaused: boolean, setIsPaused: (v: boolean) => void, rowIndex: number) => (
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
            className={`${index % 2 === 0 ? "clip-badge-a" : "clip-badge-b"} inline-block px-5 py-2 text-white border-2 ${getGoalColorClasses(goal)} text-sm font-medium mx-1.5 select-none`}
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
        <Aurora colorStops={["#FFE633", "#FF2D55", "#7C4DFF"]} />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-[44px]">
        {/* Hero Section */}
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
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
          </div>

          {/* Top bar — buttons + tagline between them */}
          <div className="absolute top-11 left-0 right-0 flex items-center justify-between px-4 z-50">
            <ShardButton
              onClick={onLogin || onGetStarted}
              seed={0}
              shardCount={4}
            >
              Log In
            </ShardButton>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <FirstDayLogo size="hero" showTagline={true} showLetters={false} />
            </motion.div>
            <ShardButton
              onClick={onGetStarted}
              seed={3}
              shardCount={3}
            >
              Get Started
            </ShardButton>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          >
            <div className="clip-tile-c w-6 h-10 border-2 border-white/40 flex justify-center pt-2">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="clip-diamond w-1.5 h-1.5 bg-white/60"
              />
            </div>
          </motion.div>
        </section>

        {/* Scrolling Goal Pills */}
        <section className="py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="overflow-hidden w-full"
          >
            <div className="py-4 overflow-hidden space-y-1.5">
              <p className="text-white text-sm font-medium mb-3 text-center px-4">Goals you can achieve in 30 days:</p>
              {renderScrollRow(GOAL_SUGGESTIONS_ROW_1, "left", isPausedRow1, setIsPausedRow1, 0)}
              {renderScrollRow(GOAL_SUGGESTIONS_ROW_2, "right", isPausedRow2, setIsPausedRow2, 1)}
              {renderScrollRow(GOAL_SUGGESTIONS_ROW_3, "left", isPausedRow3, setIsPausedRow3, 2)}
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <AnimatedSection>
          <section id="how-it-works" className="w-full py-8 md:py-16 px-0 md:px-4">
            <div className="clip-section-both relative bg-black backdrop-blur-xl border-y md:border border-white/10 overflow-hidden">
              <VoronoiMosaic seed={200} tileCount={35} margin={10} gap={3} palette={VORONOI_DARK} className="absolute inset-0 w-full h-full" />
              {/* No scrim — full brightness */}
              <div className="relative z-10 px-6 md:px-10 pt-8 md:pt-12 pb-4 text-center">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">How It Works</h2>
                <p className="text-white/80">Three simple steps to your best month</p>
              </div>

              <div className="relative z-10 px-6 md:px-10 pb-8 md:pb-12 grid grid-cols-3 gap-3 md:gap-5">
                <MosaicCard seed={10} tileVariant="a" className="p-4 md:p-6 text-center">
                  <span className="text-3xl md:text-5xl font-bold text-white block mb-1">1</span>
                  <h3 className="text-lg md:text-2xl font-bold text-white">Set Your Goal</h3>
                </MosaicCard>
                <MosaicCard seed={20} tileVariant="b" className="p-4 md:p-6 text-center">
                  <span className="text-3xl md:text-5xl font-bold text-white block mb-1">2</span>
                  <h3 className="text-lg md:text-2xl font-bold text-white">Get Your Plan</h3>
                </MosaicCard>
                <MosaicCard seed={30} tileVariant="c" className="p-4 md:p-6 text-center">
                  <span className="text-3xl md:text-5xl font-bold text-white block mb-1">3</span>
                  <h3 className="text-lg md:text-2xl font-bold text-white">Show Up Daily</h3>
                </MosaicCard>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Stay Motivated */}
        <AnimatedSection>
          <section className="w-full py-8 md:py-16 px-0 md:px-4">
            <div className="clip-section-both relative bg-black backdrop-blur-xl border-y md:border border-white/10 overflow-hidden">
              <VoronoiMosaic seed={300} tileCount={35} margin={10} gap={3} palette={VORONOI_DARK} className="absolute inset-0 w-full h-full" />
              {/* No scrim — full brightness */}
              <div className="relative z-10 px-6 md:px-10 pt-8 md:pt-12 pb-4 text-center">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">Stay Motivated</h2>
                <p className="text-white/80">Built-in streaks, XP, and achievements keep you coming back</p>
              </div>

              <div className="relative z-10 px-6 md:px-10 pb-6 md:pb-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Streaks */}
                  <MosaicCard seed={40} tileVariant="a" className="p-5 text-center">
                    <div className="clip-diamond inline-flex items-center justify-center w-14 h-14 bg-orange-500/20 mb-3">
                      <Flame className="w-7 h-7 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Daily Streaks</h3>
                    <p className="text-white text-sm mb-4">Keep your streak alive by showing up every day. The longer you go, the more bonus XP you earn.</p>
                    <div className="clip-badge-a inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 px-5 py-1.5 font-bold text-lg">
                      <Flame className="w-5 h-5" />
                      <span>12</span>
                    </div>
                    <p className="text-xs text-orange-400 mt-1 font-medium">12-day streak</p>
                  </MosaicCard>

                  {/* XP & Levels */}
                  <MosaicCard seed={50} tileVariant="b" className="p-5 text-center">
                    <div className="clip-diamond inline-flex items-center justify-center w-14 h-14 bg-yellow-500/20 mb-3">
                      <Zap className="w-7 h-7 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Earn XP</h3>
                    <p className="text-white text-sm mb-4">Earn points for every activity you complete, every reflection you write, and every streak day.</p>
                    <div className="space-y-2 max-w-[180px] mx-auto">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-white">Dedicated</span>
                        <span className="text-yellow-400 font-bold">1,450 XP</span>
                      </div>
                      <div className="clip-progress w-full h-2.5 bg-white/10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500" style={{ width: "62%" }} />
                      </div>
                      <p className="text-xs text-white/70">750 XP to Unstoppable</p>
                    </div>
                  </MosaicCard>

                  {/* Achievements */}
                  <MosaicCard seed={60} tileVariant="c" className="p-5 text-center">
                    <div className="clip-diamond inline-flex items-center justify-center w-14 h-14 bg-purple-500/20 mb-3">
                      <Trophy className="w-7 h-7 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Unlock Badges</h3>
                    <p className="text-white text-sm mb-4">Hit milestones and earn achievements. Can you collect them all before day 30?</p>
                    <div className="flex justify-center gap-2">
                      {[
                        { icon: "🚀", label: "First Step", locked: false },
                        { icon: "🔥", label: "On Fire", locked: false },
                        { icon: "⭐", label: "Perfect Week", locked: false },
                        { icon: "🏆", label: "???", locked: true },
                      ].map((badge) => (
                        <div
                          key={badge.label}
                          className={`clip-diamond w-10 h-10 flex items-center justify-center text-lg ${
                            badge.locked
                              ? "bg-white/5 border border-dashed border-white/10 grayscale opacity-50"
                              : "bg-[#FF1493] border border-white/10"
                          }`}
                          title={badge.label}
                        >
                          {badge.icon}
                        </div>
                      ))}
                    </div>
                  </MosaicCard>
                </div>

                {/* Stat bar */}
                <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg mx-auto">
                  <div className="clip-badge-a text-center bg-[#FF1493]/80 py-3 px-2 border border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Target className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs text-white/70 font-medium">Rate</span>
                    </div>
                    <p className="text-3xl font-bold text-white">87%</p>
                  </div>
                  <div className="clip-badge-a text-center bg-[#FF1493]/80 py-3 px-2 border border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs text-white/70 font-medium">Streak</span>
                    </div>
                    <p className="text-3xl font-bold text-white">12</p>
                  </div>
                  <div className="clip-badge-a text-center bg-[#FF1493]/80 py-3 px-2 border border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Trophy className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-xs text-white/70 font-medium">Badges</span>
                    </div>
                    <p className="text-3xl font-bold text-white">5/8</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* What Your Plan Looks Like */}
        <AnimatedSection>
          <section className="w-full py-8 md:py-16 px-0 md:px-4">
            <div className="clip-section-both relative bg-black backdrop-blur-xl border-y md:border border-white/10 overflow-hidden">
              <VoronoiMosaic seed={400} tileCount={35} margin={10} gap={3} palette={VORONOI_DARK} className="absolute inset-0 w-full h-full" />
              {/* No scrim — full brightness */}
              <div className="relative z-10 px-6 md:px-10 pt-8 md:pt-12 pb-4 text-center">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">What Your Plan Looks Like</h2>
                <p className="text-white/80">Real screens from &quot;Learn to play guitar&quot;</p>
              </div>

              <div className="relative z-10 px-6 md:px-10 pb-6 md:pb-10">
                <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-2 px-2">
                  {[
                    { src: "/screenshots/calendar-view.png", label: "Your 30-Day Calendar", alt: "Calendar view showing weekly plan with day cards", tile: "a" as const, frameSeed: 500 },
                    { src: "/screenshots/day-view.png", label: "Daily Activities", alt: "Day view with checkable activities and YouTube resources", tile: "c" as const, frameSeed: 501 },
                    { src: "/screenshots/congrats-view.png", label: "Celebrate Wins", alt: "Congratulations screen with XP breakdown and achievements", tile: "b" as const, frameSeed: 502 },
                  ].map((screen) => (
                    <div key={screen.label} className="flex-shrink-0 snap-center">
                      <GeometricFrame seed={screen.frameSeed} borderWidth={8} irregularity={0.2}>
                        <div className={`clip-tile-${screen.tile} relative w-[200px] md:w-[220px] border-[4px] border-gray-800 bg-black overflow-hidden shadow-xl`}>
                          <Image
                            src={screen.src}
                            alt={screen.alt}
                            width={375}
                            height={812}
                            className="w-full h-auto"
                          />
                        </div>
                      </GeometricFrame>
                      <p className="text-center text-sm font-medium text-white mt-3">{screen.label}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-6 md:mt-8">
                  <ShardButton seed={7}
                    onClick={onGetStarted}
                    size="lg"
                    className="shadow-lg hover:shadow-xl"
                  >
                    Create Your Plan
                  </ShardButton>
                  <p className="text-sm text-white/70 mt-3">
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
