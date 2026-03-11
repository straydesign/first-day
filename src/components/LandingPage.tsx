"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { Sparkles, Flame, Zap, Trophy, Target } from "lucide-react";
import Aurora from "./Aurora";
import { FirstDayLogo } from "./FirstDayLogo";
import { Footer } from "./Footer";
import { MosaicCard } from "./MosaicCard";
import { GeometricFrame } from "./GeometricFrame";
import { GOAL_SUGGESTIONS_ROW_1, GOAL_SUGGESTIONS_ROW_2, GOAL_SUGGESTIONS_ROW_3, VORONOI_LIGHT } from "@/constants";

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
  const [isNavSticky, setIsNavSticky] = useState(false);
  const heroNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroNavRef.current) return;
      const rect = heroNavRef.current.getBoundingClientRect();
      setIsNavSticky(rect.top <= 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getGoalBgColor = (goal: string, index: number) => {
    return VORONOI_LIGHT[index % VORONOI_LIGHT.length];
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
            className={`${index % 2 === 0 ? "clip-badge-a" : "clip-badge-b"} inline-block px-5 py-2 text-black text-sm font-bold mx-1.5 select-none`}
            style={{ backgroundColor: getGoalBgColor(goal, index) }}
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
        <Aurora colorStops={["#FFE633", "#FF2D55", "#2979FF"]} />
      </div>

      {/* Content */}
      <div className="relative z-10">
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

          {/* Center nav — becomes sticky after scrolling past */}
          <div ref={heroNavRef} className="relative z-50 flex items-center justify-center gap-6 px-4">
            <button
              onClick={onLogin || onGetStarted}
              className="text-white font-black text-sm tracking-wide uppercase hover:opacity-70 transition-opacity"
            >
              Log In
            </button>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <FirstDayLogo size="hero" showTagline={true} showLetters={false} />
            </motion.div>
            <button
              onClick={onGetStarted}
              className="text-white font-black text-sm tracking-wide uppercase hover:opacity-70 transition-opacity"
            >
              Get Started
            </button>
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

        {/* Sticky nav — appears when scrolled past hero center */}
        {isNavSticky && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md py-3 px-4 flex items-center justify-center gap-6">
            <button
              onClick={onLogin || onGetStarted}
              className="text-white font-black text-sm tracking-wide uppercase hover:opacity-70 transition-opacity"
            >
              Log In
            </button>
            <FirstDayLogo showTagline={true} showLetters={false} />
            <button
              onClick={onGetStarted}
              className="text-white font-black text-sm tracking-wide uppercase hover:opacity-70 transition-opacity"
            >
              Get Started
            </button>
          </div>
        )}

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
          <section id="how-it-works" className="w-full py-8 md:py-16 px-4 md:px-10 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
              <div className="space-y-2 text-lg md:text-2xl font-bold text-white/90">
                <p><span className="text-[#FFE633]">1.</span> Set Your Goal</p>
                <p><span className="text-[#FF6B2B]">2.</span> Get Your Plan</p>
                <p><span className="text-[#FF2D55]">3.</span> Show Up Daily</p>
              </div>
          </section>
        </AnimatedSection>

        {/* Stay Motivated */}
        <AnimatedSection>
          <section className="w-full py-8 md:py-16 px-4 md:px-10">
              <div className="text-center mb-6">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">Stay Motivated</h2>
                <p className="text-white/80">Built-in streaks, XP, and achievements keep you coming back</p>
              </div>

              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Streaks */}
                  <MosaicCard seed={41} tileVariant="a" className="p-5 text-center">
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
                  <MosaicCard seed={51} tileVariant="b" className="p-5 text-center">
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
                    <div className="clip-diamond inline-flex items-center justify-center w-14 h-14 bg-blue-500/20 mb-3">
                      <Trophy className="w-7 h-7 text-blue-400" />
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
                              : "bg-black border border-white/10"
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
                  <div className="clip-badge-a text-center bg-black/80 py-3 px-2 border border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Target className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs text-white/70 font-medium">Rate</span>
                    </div>
                    <p className="text-3xl font-bold text-white">87%</p>
                  </div>
                  <div className="clip-badge-a text-center bg-black/80 py-3 px-2 border border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs text-white/70 font-medium">Streak</span>
                    </div>
                    <p className="text-3xl font-bold text-white">12</p>
                  </div>
                  <div className="clip-badge-a text-center bg-black/80 py-3 px-2 border border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Trophy className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs text-white/70 font-medium">Badges</span>
                    </div>
                    <p className="text-3xl font-bold text-white">5/8</p>
                  </div>
                </div>
              </div>
          </section>
        </AnimatedSection>

        {/* What Your Plan Looks Like */}
        <AnimatedSection>
          <section className="w-full py-8 md:py-16 px-4 md:px-10">
              <div className="text-center mb-6">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">What Your Plan Looks Like</h2>
                <p className="text-white/80">Real screens from &quot;Learn to play guitar&quot;</p>
              </div>

              <div>
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
                <div className="text-center mt-8 md:mt-12">
                  <button
                    onClick={onGetStarted}
                    className="text-white font-black text-3xl md:text-5xl uppercase tracking-wide hover:opacity-70 transition-opacity"
                  >
                    Create Your Plan
                  </button>
                  <p className="text-sm text-white/70 mt-3">
                    <Sparkles className="w-4 h-4 inline-block mr-1 text-blue-400" />
                    Every plan is unique — personalized to your goal and experience
                  </p>
                </div>
              </div>
          </section>
        </AnimatedSection>

        <Footer onPrivacyClick={onPrivacyPolicy} onTermsClick={onTermsOfService} />
      </div>
    </div>
  );
}
