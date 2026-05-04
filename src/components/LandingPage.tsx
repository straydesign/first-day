"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Flame, Zap, Trophy, Target } from "lucide-react";
import { FirstDayLogo } from "./FirstDayLogo";
import { HeroMosaic } from "./HeroMosaic";
import { LivePlanDemo } from "./LivePlanDemo";
import { DayCompleteDemo } from "./DayCompleteDemo";
import { Footer } from "./Footer";
import { GOAL_SUGGESTIONS_ROW_1, GOAL_SUGGESTIONS_ROW_2, GOAL_SUGGESTIONS_ROW_3, BRIGHT_COLORS, SCROLL_SPEEDS } from "@/constants";
import { useMonotone } from "./MonotoneContext";
import { SPRING } from "@/lib/animations";

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
      transition={{ ...SPRING.gentle, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LandingPage({ onGetStarted, onLogin, onPrivacyPolicy, onTermsOfService }: LandingPageProps) {
  const { monotone } = useMonotone();
  const [isNavSticky, setIsNavSticky] = useState(false);
  const [demoGoal, setDemoGoal] = useState<string | null>(null);
  const [demoPlan, setDemoPlan] = useState<string[] | null>(null);
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

  const getGoalBgColor = (_goal: string, index: number) => {
    // Scattered step avoids adjacent same-hue colors, feels infinite
    return BRIGHT_COLORS[(index * 7 + 3) % BRIGHT_COLORS.length];
  };

  const renderScrollRow = (goals: string[], direction: "left" | "right", rowIndex: number) => (
    <div className="overflow-hidden select-none">
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: `scroll-${direction === "left" ? "left" : "right"} ${SCROLL_SPEEDS[rowIndex]} linear infinite`,
        }}
      >
        {[...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals].map((goal, index) => (
          <div
            key={index}
            className={`${index % 2 === 0 ? "clip-badge-a" : "clip-badge-b"} inline-block px-5 py-2 text-black text-sm font-bold mx-1.5 select-none`}
            style={{ backgroundColor: monotone ? "#333333" : getGoalBgColor(goal, index) }}
          >
            {goal}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative bg-black">
      {/* Full-page animated Voronoi mosaic background */}
      <HeroMosaic />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section
          className="relative min-h-[800px] md:min-h-screen flex flex-col justify-center items-center px-0 pt-[180px]"
        >

          {/* Top corners — Log In shard / Get Started — always colored */}
          <div className="absolute top-[100px] md:top-6 left-4 lg:left-8 z-50">
            <button
              onClick={onLogin || onGetStarted}
              className="px-8 py-4 lg:px-10 lg:py-5 font-black text-lg lg:text-xl tracking-wide uppercase hover:scale-105 transition-all duration-300 btn-shake"
              style={{
                backgroundColor: "#FFE633",
                color: "#000000",
                clipPath: "polygon(3% 0%, 100% 8%, 97% 100%, 0% 88%)",
              }}
            >
              Log In
            </button>
          </div>
          <div className="absolute top-[100px] md:top-6 right-4 lg:right-8 z-50">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 lg:px-10 lg:py-5 font-black text-lg lg:text-xl tracking-wide uppercase hover:scale-105 transition-all duration-300 btn-shake"
              style={{
                backgroundColor: "#FF2D55",
                color: "#000000",
                clipPath: "polygon(0% 8%, 97% 0%, 100% 88%, 3% 100%)",
              }}
            >
              Get Started
            </button>
          </div>

          {/* Tagline — shard word chips floating over hero */}
          <div ref={heroNavRef} className="relative z-50 w-full max-w-3xl lg:max-w-5xl mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING.bouncy}
            >
              {/* Mobile: default size, Desktop: hero size — both interactive */}
              <div className="block md:hidden">
                <FirstDayLogo showTagline={true} showLetters={false} interactive={true} />
              </div>
              <div className="hidden md:block">
                <FirstDayLogo size="hero" showTagline={true} showLetters={false} interactive={true} />
              </div>
            </motion.div>
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

        {/* Sticky nav — tagline bar with centered login/get-started */}
        {isNavSticky && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={SPRING.snappy}
            className="fixed top-0 left-0 right-0 z-50 bg-black px-4 pt-[84px] pb-5"
          >
            <div className="flex items-center justify-between">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onLogin || onGetStarted}
                className="bg-white/10 px-6 py-3 text-white font-black text-base tracking-wide uppercase hover:scale-105 hover:bg-white/15 transition-all flex-shrink-0"
                style={{ clipPath: "polygon(3% 0%, 100% 8%, 97% 100%, 0% 88%)" }}
              >
                Log In
              </motion.button>
              <FirstDayLogo compact={true} />
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onGetStarted}
                className="bg-black px-6 py-3 text-white font-black text-sm tracking-wide uppercase hover:scale-105 transition-transform flex-shrink-0"
                style={{ clipPath: "polygon(0% 8%, 97% 0%, 100% 88%, 3% 100%)" }}
              >
                Get Started
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Scrolling Goal Pills */}
        <section className="py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...SPRING.soft, delay: 0.4 }}
            className="overflow-hidden w-full"
          >
            <div className="py-4 overflow-hidden space-y-1.5">
              <p className="text-white text-sm font-medium mb-3 text-center px-4">Goals you can start this week:</p>
              {renderScrollRow(GOAL_SUGGESTIONS_ROW_1, "left", 0)}
              {renderScrollRow(GOAL_SUGGESTIONS_ROW_2, "right", 1)}
              {renderScrollRow(GOAL_SUGGESTIONS_ROW_3, "left", 2)}
            </div>
          </motion.div>
        </section>

        {/* Live magic-moment demo — try a goal, watch a plan assemble */}
        <AnimatedSection>
          <LivePlanDemo
            onGetStarted={onGetStarted}
            onPlanGenerated={(g, p) => {
              setDemoGoal(g);
              setDemoPlan(p);
            }}
          />
        </AnimatedSection>

        {/* Dopamine loop — tap-to-feel day completion (auto-fills with the
            visitor's plan from LivePlanDemo when they pick a goal) */}
        <AnimatedSection>
          <DayCompleteDemo
            goal={demoGoal ?? undefined}
            plan={demoPlan ?? undefined}
            isUserChosen={demoGoal !== null}
          />
        </AnimatedSection>

        {/* How It Works */}
        <AnimatedSection>
          <section id="how-it-works" className="w-full py-8 md:py-16 lg:py-24 px-4 md:px-10 text-center">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 lg:mb-8">How It Works</h2>
              <div className="space-y-2 lg:space-y-4 text-lg md:text-2xl lg:text-3xl font-bold text-white/90">
                <p><span className="text-[#FFE633]">1.</span> Set Your Goal</p>
                <p><span className="text-[#FF6B2B]">2.</span> Get Your Plan</p>
                <p><span className="text-[#FF2D55]">3.</span> Show Up Daily</p>
              </div>
          </section>
        </AnimatedSection>

        {/* Stay Motivated */}
        <AnimatedSection>
          <section className="w-full py-8 md:py-16 lg:py-24 px-4 md:px-10">
            <div className="max-w-5xl lg:max-w-7xl mx-auto">
              <div className="text-center mb-6 lg:mb-10">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2">Stay Motivated</h2>
                <p className="text-white/80 md:text-lg lg:text-xl">Built-in streaks, XP, and achievements keep you coming back</p>
              </div>

              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-10">
                  {/* Streaks — single shard */}
                  <div
                    className="relative p-5 lg:p-8 text-center overflow-hidden"
                    style={{
                      backgroundColor: monotone ? "#555555" : "#FFE633",
                      clipPath: "polygon(4% 8%, 95% 0%, 100% 85%, 8% 100%)",
                    }}
                  >
                    <div className="clip-diamond inline-flex items-center justify-center w-14 h-14 lg:w-18 lg:h-18 bg-black/20 mb-3">
                      <Flame className="w-7 h-7 lg:w-9 lg:h-9 text-black" />
                    </div>
                    <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-black mb-1">Daily Streaks</h3>
                    <p className="text-black/80 text-sm lg:text-base mb-4">Keep your streak alive by showing up every day. The longer you go, the more bonus XP you earn.</p>
                    <div className="clip-badge-a inline-flex items-center gap-1.5 bg-black/20 text-black px-5 py-1.5 font-bold text-lg">
                      <Flame className="w-5 h-5" />
                      <span>12</span>
                    </div>
                    <p className="text-xs text-black/70 mt-1 font-medium">12-day streak</p>
                  </div>

                  {/* XP & Levels — single shard */}
                  <div
                    className="relative p-5 lg:p-8 text-center overflow-hidden"
                    style={{
                      backgroundColor: monotone ? "#444444" : "#FF6B2B",
                      clipPath: "polygon(0% 5%, 92% 0%, 98% 92%, 3% 95%)",
                    }}
                  >
                    <div className="clip-diamond inline-flex items-center justify-center w-14 h-14 lg:w-18 lg:h-18 bg-black/20 mb-3">
                      <Zap className="w-7 h-7 lg:w-9 lg:h-9 text-black" />
                    </div>
                    <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-black mb-1">Earn XP</h3>
                    <p className="text-black/80 text-sm lg:text-base mb-4">Earn points for every activity you complete, every reflection you write, and every streak day.</p>
                    <div className="space-y-2 max-w-[180px] mx-auto">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-black">Dedicated</span>
                        <span className="text-black font-bold">1,450 XP</span>
                      </div>
                      <div className="clip-progress w-full h-2.5 bg-black/20 overflow-hidden">
                        <div className="h-full bg-black/40" style={{ width: "62%" }} />
                      </div>
                      <p className="text-xs text-black/60">750 XP to Unstoppable</p>
                    </div>
                  </div>

                  {/* Achievements — single shard */}
                  <div
                    className="relative p-5 lg:p-8 text-center overflow-hidden"
                    style={{
                      backgroundColor: monotone ? "#333333" : "#FF10F0",
                      clipPath: "polygon(6% 0%, 100% 10%, 94% 100%, 0% 88%)",
                    }}
                  >
                    <div className="clip-diamond inline-flex items-center justify-center w-14 h-14 lg:w-18 lg:h-18 bg-black/20 mb-3">
                      <Trophy className="w-7 h-7 lg:w-9 lg:h-9 text-black" />
                    </div>
                    <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-black mb-1">Unlock Badges</h3>
                    <p className="text-black/80 text-sm lg:text-base mb-4">Hit milestones and earn achievements. Can you collect them all?</p>
                    <div className="flex justify-center gap-2">
                      {["First Step", "On Fire", "Perfect Week", "???"].map((label, i) => (
                        <div
                          key={label}
                          className={`clip-diamond w-10 h-10 flex items-center justify-center text-xs font-bold ${
                            i === 3
                              ? "bg-black/10 text-black/30"
                              : "bg-black/20 text-black"
                          }`}
                          title={label}
                        >
                          {i === 3 ? "?" : (i + 1)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stat bar — single-color shards */}
                <div className="mt-6 lg:mt-10 grid grid-cols-3 gap-3 lg:gap-6 max-w-lg lg:max-w-3xl mx-auto">
                  <div
                    className="text-center py-4 lg:py-6 px-2 lg:px-4"
                    style={{ backgroundColor: monotone ? "#555555" : "#00EAFF", clipPath: "polygon(4% 8%, 95% 0%, 100% 85%, 8% 100%)" }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Target className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-black" />
                      <span className="text-xs lg:text-sm text-black/70 font-medium">Rate</span>
                    </div>
                    <p className="text-3xl md:text-5xl lg:text-6xl font-bold text-black">87%</p>
                  </div>
                  <div
                    className="text-center py-4 lg:py-6 px-2 lg:px-4"
                    style={{ backgroundColor: monotone ? "#444444" : "#FF4500", clipPath: "polygon(0% 5%, 92% 0%, 98% 92%, 3% 95%)" }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Flame className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-black" />
                      <span className="text-xs lg:text-sm text-black/70 font-medium">Streak</span>
                    </div>
                    <p className="text-3xl md:text-5xl lg:text-6xl font-bold text-black">12</p>
                  </div>
                  <div
                    className="text-center py-4 lg:py-6 px-2 lg:px-4"
                    style={{ backgroundColor: monotone ? "#333333" : "#FF2D55", clipPath: "polygon(6% 0%, 100% 10%, 94% 100%, 0% 88%)" }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Trophy className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-black" />
                      <span className="text-xs lg:text-sm text-black/70 font-medium">Badges</span>
                    </div>
                    <p className="text-3xl md:text-5xl lg:text-6xl font-bold text-black">5/8</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* What Your Plan Looks Like */}
        <AnimatedSection>
          <section className="w-full py-8 md:py-16 lg:py-24 px-4 md:px-10">
              <div className="max-w-5xl lg:max-w-7xl mx-auto">
              <div className="text-center mb-6 lg:mb-10">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2">What Your Plan Looks Like</h2>
                <p className="text-white/80 md:text-lg lg:text-xl">Your personalized weekly sprint</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 lg:gap-8">
                {[
                  { icon: "📅", label: "Your Weekly Sprint", desc: "A personalized plan broken into 7-day sprints", color: "#FFE633", clip: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" },
                  { icon: "✅", label: "Daily Activities", desc: "Curated tasks, videos, and resources for each day", color: "#FF6B2B", clip: "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)" },
                  { icon: "⚡", label: "Earn XP & Level Up", desc: "Points for every activity, reflection, and streak day", color: "#FF2D55", clip: "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)" },
                  { icon: "🏆", label: "Complete Your Goal", desc: "You did it. Badges, trophies, and proof", color: "#00EAFF", clip: "polygon(3% 2%, 100% 0%, 97% 98%, 0% 100%)" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="p-5 md:p-6 lg:p-8 text-center"
                    style={{ backgroundColor: monotone ? "#222" : card.color, clipPath: card.clip }}
                  >
                    <span className="text-3xl md:text-4xl lg:text-5xl block mb-2">{card.icon}</span>
                    <h3 className="text-base md:text-lg lg:text-xl font-bold text-black mb-1">{card.label}</h3>
                    <p className="text-xs md:text-sm lg:text-base text-black/70">{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center mt-8 md:mt-12 lg:mt-16">
                <button
                  onClick={onGetStarted}
                  className="text-white font-black text-3xl md:text-5xl lg:text-7xl uppercase tracking-wide hover:opacity-70 transition-opacity btn-shake"
                >
                  Create Your Plan
                </button>
                <p className="text-sm lg:text-base text-white/70 mt-3">
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
