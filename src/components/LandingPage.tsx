"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView, useScroll, useSpring } from "framer-motion";
import { Flame, Zap, Trophy, Target, Sparkles, Calendar, ListChecks, NotebookPen } from "lucide-react";
import { FirstDayLogo } from "./FirstDayLogo";
import { HeroMosaic } from "./HeroMosaic";
import { LivePlanDemo } from "./LivePlanDemo";
import { DayCompleteDemo } from "./DayCompleteDemo";
import { CountUp } from "./CountUp";
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

function SectionKicker({ num, label, color }: { num: string; label: string; color: string }) {
  const { monotone } = useMonotone();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...SPRING.gentle }}
      className="inline-flex items-center gap-2 mb-3"
    >
      <span
        className="inline-flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 text-xs lg:text-sm font-black text-black"
        style={{
          backgroundColor: monotone ? "#888" : color,
          clipPath: "polygon(4% 8%, 95% 0%, 100% 85%, 8% 100%)",
        }}
      >
        {num}
      </span>
      <span className="text-xs lg:text-sm uppercase tracking-[0.2em] text-white/60 font-bold">
        {label}
      </span>
    </motion.div>
  );
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
  const [pillSeed, setPillSeed] = useState<{ goal: string; nonce: number } | null>(null);
  const heroNavRef = useRef<HTMLDivElement>(null);
  const liveDemoRef = useRef<HTMLDivElement>(null);

  const handlePillClick = (goal: string) => {
    setPillSeed({ goal, nonce: Date.now() });
    liveDemoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const { scrollYProgress } = useScroll();
  const scrollProgressX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
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
    <div className="overflow-hidden select-none group">
      <div
        className="flex whitespace-nowrap group-hover:[animation-play-state:paused]"
        style={{
          animationName: `scroll-${direction === "left" ? "left" : "right"}`,
          animationDuration: SCROLL_SPEEDS[rowIndex],
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
        }}
      >
        {[...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals].map((goal, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handlePillClick(goal)}
            className={`${index % 2 === 0 ? "clip-badge-a" : "clip-badge-b"} inline-block px-5 py-2 text-black text-sm font-bold mx-1.5 select-none cursor-pointer hover:scale-110 active:scale-95 transition-transform`}
            style={{ backgroundColor: monotone ? "#333333" : getGoalBgColor(goal, index) }}
          >
            {goal}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative bg-black">
      {/* Scroll progress bar — sits above everything, brand yellow, springy */}
      <motion.div
        aria-hidden
        className="fixed top-0 left-0 right-0 h-[3px] z-[100] origin-left pointer-events-none"
        style={{
          scaleX: scrollProgressX,
          backgroundColor: monotone ? "#999999" : "#FFE633",
        }}
      />

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
              className="px-5 py-3 md:px-8 md:py-4 lg:px-10 lg:py-5 font-black text-base md:text-lg lg:text-xl tracking-wide uppercase hover:scale-105 transition-all duration-300 btn-shake"
              style={{
                backgroundColor: "#FFE633",
                color: "#000000",
                clipPath: "polygon(3% 0%, 100% 8%, 97% 100%, 0% 88%)",
              }}
            >
              Log In
            </button>
          </div>
          <div className="absolute top-[100px] md:top-6 right-4 lg:right-8 z-50 inline-block">
            <motion.span
              aria-hidden
              animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: "#FF2D55",
                clipPath: "polygon(0% 8%, 97% 0%, 100% 88%, 3% 100%)",
              }}
            />
            <motion.button
              onClick={onGetStarted}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.96 }}
              className="relative px-5 py-3 md:px-8 md:py-4 lg:px-10 lg:py-5 font-black text-base md:text-lg lg:text-xl tracking-wide uppercase btn-shake"
              style={{
                backgroundColor: "#FF2D55",
                color: "#000000",
                clipPath: "polygon(0% 8%, 97% 0%, 100% 88%, 3% 100%)",
              }}
            >
              Get Started
            </motion.button>
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

          {/* Scroll indicator — clickable shortcut to the magic-moment demo */}
          <motion.button
            type="button"
            onClick={() => liveDemoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 group cursor-pointer"
            aria-label="Scroll to live plan demo"
          >
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/50 group-hover:text-white/90 transition-colors font-bold">
              See it in 2s
            </span>
            <div className="clip-tile-c w-6 h-10 border-2 border-white/40 group-hover:border-white/80 transition-colors flex justify-center pt-2">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="clip-diamond w-1.5 h-1.5 bg-white/60 group-hover:bg-white transition-colors"
              />
            </div>
          </motion.button>
        </section>

        {/* Sticky nav — tagline bar with centered login/get-started */}
        {isNavSticky && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={SPRING.snappy}
            className="fixed top-0 left-0 right-0 z-50 bg-black px-4 pb-5"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 84px)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onLogin || onGetStarted}
                className="bg-white/10 px-4 py-2.5 md:px-6 md:py-3 text-white font-black text-sm md:text-base tracking-wide uppercase hover:scale-105 hover:bg-white/15 transition-all flex-shrink-0"
                style={{ clipPath: "polygon(3% 0%, 100% 8%, 97% 100%, 0% 88%)" }}
              >
                Log In
              </motion.button>
              <div className="flex-1 min-w-0 flex justify-center">
                <FirstDayLogo compact={true} />
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onGetStarted}
                className="bg-black px-4 py-2.5 md:px-6 md:py-3 text-white font-black text-sm tracking-wide uppercase hover:scale-105 transition-transform flex-shrink-0"
                style={{ clipPath: "polygon(0% 8%, 97% 0%, 100% 88%, 3% 100%)" }}
              >
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
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
              <div className="flex items-center justify-center gap-2 mb-4 px-4">
                <span className="h-px w-8 bg-white/30" aria-hidden />
                <span className="text-xs lg:text-sm uppercase tracking-[0.25em] text-white/70 font-bold">
                  Tap a goal to preview your week
                </span>
                <span className="h-px w-8 bg-white/30" aria-hidden />
              </div>
              {renderScrollRow(GOAL_SUGGESTIONS_ROW_1, "left", 0)}
              {renderScrollRow(GOAL_SUGGESTIONS_ROW_2, "right", 1)}
              {renderScrollRow(GOAL_SUGGESTIONS_ROW_3, "left", 2)}
            </div>
          </motion.div>
        </section>

        {/* Live magic-moment demo — try a goal, watch a plan assemble */}
        <AnimatedSection>
          <div ref={liveDemoRef}>
            <LivePlanDemo
              onGetStarted={onGetStarted}
              onPlanGenerated={(g, p) => {
                setDemoGoal(g);
                setDemoPlan(p);
              }}
              externalSeed={pillSeed}
            />
          </div>
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
          <section id="how-it-works" className="w-full py-8 md:py-16 lg:py-24 px-4 md:px-10">
            <div className="max-w-5xl lg:max-w-7xl mx-auto">
              <div className="text-center mb-6 lg:mb-10">
                <SectionKicker num="01" label="The System" color="#FFE633" />
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2">How It Works</h2>
                <p className="text-white/80 md:text-lg lg:text-xl">No vague vision boards. A real 7-day battle plan.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-10">
                {[
                  { n: 1, title: "Set Your Goal", line: "Pick what's been nagging you. One sentence.", color: "#FFE633", clip: "polygon(4% 8%, 95% 0%, 100% 85%, 8% 100%)", Icon: Target },
                  { n: 2, title: "Get Your Plan", line: "AI builds your 7-day sprint. Specific. Actionable.", color: "#FF6B2B", clip: "polygon(0% 5%, 92% 0%, 98% 92%, 3% 95%)", Icon: Sparkles },
                  { n: 3, title: "Show Up Daily", line: "Earn XP, build streaks, finish what you started.", color: "#FF2D55", clip: "polygon(6% 0%, 100% 10%, 94% 100%, 0% 88%)", Icon: Flame },
                ].map((s, i) => (
                  <motion.div
                    key={s.n}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ ...SPRING.gentle, delay: i * 0.12 }}
                    className="relative p-5 lg:p-8 text-center overflow-hidden cursor-default"
                    style={{
                      backgroundColor: monotone ? "#444" : s.color,
                      clipPath: s.clip,
                    }}
                  >
                    <div className="absolute top-1 right-3 text-7xl md:text-8xl lg:text-[9rem] font-black text-black/10 leading-none pointer-events-none select-none">
                      {s.n}
                    </div>
                    <div className="relative">
                      <div className="clip-diamond inline-flex items-center justify-center w-14 h-14 lg:w-18 lg:h-18 bg-black/20 mb-3">
                        <s.Icon className="w-7 h-7 lg:w-9 lg:h-9 text-black" />
                      </div>
                      <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-black mb-2">{s.title}</h3>
                      <p className="text-black/80 text-sm lg:text-base">{s.line}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Stay Motivated */}
        <AnimatedSection>
          <section className="w-full py-8 md:py-16 lg:py-24 px-4 md:px-10">
            <div className="max-w-5xl lg:max-w-7xl mx-auto">
              <div className="text-center mb-6 lg:mb-10">
                <SectionKicker num="02" label="The Loop" color="#FF6B2B" />
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2">Stay Motivated</h2>
                <p className="text-white/80 md:text-lg lg:text-xl">Built-in streaks, XP, and achievements keep you coming back</p>
              </div>

              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-10">
                  {/* Streaks — single shard */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={SPRING.gentle}
                    className="relative p-5 lg:p-8 text-center overflow-hidden cursor-default"
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
                      <CountUp target={12} />
                    </div>
                    <p className="text-xs text-black/70 mt-1 font-medium">12-day streak</p>
                  </motion.div>

                  {/* XP & Levels — single shard */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={SPRING.gentle}
                    className="relative p-5 lg:p-8 text-center overflow-hidden cursor-default"
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
                        <span className="text-black font-bold">
                          <CountUp target={1450} suffix=" XP" />
                        </span>
                      </div>
                      <div className="clip-progress w-full h-2.5 bg-black/20 overflow-hidden">
                        <motion.div
                          className="h-full bg-black/40"
                          initial={{ width: "0%" }}
                          whileInView={{ width: "62%" }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ duration: 1.4, ease: [0.22, 0.8, 0.3, 1], delay: 0.2 }}
                        />
                      </div>
                      <p className="text-xs text-black/60">750 XP to Unstoppable</p>
                    </div>
                  </motion.div>

                  {/* Achievements — single shard */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={SPRING.gentle}
                    className="relative p-5 lg:p-8 text-center overflow-hidden cursor-default"
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
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ ...SPRING.bouncy, delay: 0.15 + i * 0.12 }}
                          className={`clip-diamond w-10 h-10 flex items-center justify-center text-xs font-bold ${
                            i === 3
                              ? "bg-black/10 text-black/30"
                              : "bg-black/20 text-black"
                          }`}
                          title={label}
                        >
                          {i === 3 ? "?" : (i + 1)}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
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
                    <p className="text-3xl md:text-5xl lg:text-6xl font-bold text-black">
                      <CountUp target={87} suffix="%" />
                    </p>
                  </div>
                  <div
                    className="text-center py-4 lg:py-6 px-2 lg:px-4"
                    style={{ backgroundColor: monotone ? "#444444" : "#FF4500", clipPath: "polygon(0% 5%, 92% 0%, 98% 92%, 3% 95%)" }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Flame className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-black" />
                      <span className="text-xs lg:text-sm text-black/70 font-medium">Streak</span>
                    </div>
                    <p className="text-3xl md:text-5xl lg:text-6xl font-bold text-black">
                      <CountUp target={12} delay={0.1} />
                    </p>
                  </div>
                  <div
                    className="text-center py-4 lg:py-6 px-2 lg:px-4"
                    style={{ backgroundColor: monotone ? "#333333" : "#FF2D55", clipPath: "polygon(6% 0%, 100% 10%, 94% 100%, 0% 88%)" }}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Trophy className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-black" />
                      <span className="text-xs lg:text-sm text-black/70 font-medium">Badges</span>
                    </div>
                    <p className="text-3xl md:text-5xl lg:text-6xl font-bold text-black">
                      <CountUp target={5} delay={0.2} />/8
                    </p>
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
                <SectionKicker num="03" label="The Sprint" color="#FF2D55" />
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2">What Your Plan Looks Like</h2>
                <p className="text-white/80 md:text-lg lg:text-xl">Your personalized weekly sprint</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 lg:gap-8">
                {[
                  { Icon: Calendar, label: "Weekly Sprint", desc: "Seven days. Beginning to finish line.", color: "#FFE633", clip: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" },
                  { Icon: ListChecks, label: "Daily Activities", desc: "Curated tasks, videos, and resources.", color: "#FF6B2B", clip: "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)" },
                  { Icon: NotebookPen, label: "Daily Reflection", desc: "Lock in what you learned in 30 seconds.", color: "#FF2D55", clip: "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)" },
                  { Icon: Trophy, label: "Finish Strong", desc: "Badges, trophies, and the proof you did it.", color: "#00EAFF", clip: "polygon(3% 2%, 100% 0%, 97% 98%, 0% 100%)" },
                ].map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ ...SPRING.gentle, delay: i * 0.08 }}
                    whileHover={{ scale: 1.04 }}
                    className="p-5 md:p-6 lg:p-8 text-center cursor-default"
                    style={{ backgroundColor: monotone ? "#222" : card.color, clipPath: card.clip }}
                  >
                    <div className="clip-diamond inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-black/20 mb-3">
                      <card.Icon className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-black" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-base md:text-lg lg:text-xl font-bold text-black mb-1">{card.label}</h3>
                    <p className="text-xs md:text-sm lg:text-base text-black/70">{card.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center mt-8 md:mt-12 lg:mt-16">
                <motion.button
                  onClick={onGetStarted}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative inline-flex items-center gap-3 lg:gap-5 text-white font-black text-3xl md:text-5xl lg:text-7xl uppercase tracking-wide btn-shake"
                >
                  {["Create", "Your", "Plan"].map((word, i) => (
                    <motion.span
                      key={word}
                      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ ...SPRING.bouncy, delay: 0.15 + i * 0.1 }}
                      className="inline-block"
                    >
                      {word}
                    </motion.span>
                  ))}
                  <motion.span
                    aria-hidden
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ ...SPRING.bouncy, delay: 0.55 }}
                    className="inline-flex"
                  >
                    <motion.span
                      animate={{ x: [0, 8, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-block transition-colors"
                      style={{ color: "#FFE633" }}
                    >
                      →
                    </motion.span>
                  </motion.span>
                </motion.button>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="text-sm lg:text-base text-white/70 mt-3"
                >
                  Every plan is unique — personalized to your goal and experience
                </motion.p>
              </div>
              </div>
          </section>
        </AnimatedSection>

        <Footer onPrivacyClick={onPrivacyPolicy} onTermsClick={onTermsOfService} />
      </div>
    </div>
  );
}
