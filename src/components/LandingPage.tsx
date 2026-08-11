"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useInView, useScroll, useSpring } from "framer-motion";
import { Flame, Zap, Trophy, Target, Sparkles, Calendar, ListChecks, NotebookPen } from "lucide-react";
import { FirstDayLogo } from "./FirstDayLogo";
import { LivePlanDemo } from "./LivePlanDemo";
import { DayCompleteDemo } from "./DayCompleteDemo";
import { GOAL_SUGGESTIONS_ROW_1, GOAL_SUGGESTIONS_ROW_2, GOAL_SUGGESTIONS_ROW_3, SCROLL_SPEEDS } from "@/constants";
import { SPRING } from "@/lib/animations";
import { FONT } from "@/lib/design";
import { Panel } from "./ui/Panel";
import { setActionIntent } from "./3d-shell/actionIntent";
import { HeroAutoTour } from "./HeroAutoTour";
import { COPY } from "@/content/copy";


interface LandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
  onPrivacyPolicy: () => void;
  onTermsOfService: () => void;
}

function SectionKicker({ num, label }: { num: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...SPRING.gentle }}
      className="inline-flex items-center gap-2 mb-3"
    >
      <span className="text-[13px] font-semibold tabular-nums text-white/35">{num}</span>
      <span className="text-[12px] uppercase tracking-[0.12em] text-white/40">{label}</span>
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
            className="inline-block rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 mx-1.5 select-none cursor-pointer hover:bg-white/10 hover:text-white active:scale-95 transition"
          >
            {goal}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative" style={{ fontFamily: FONT }}>
      <HeroAutoTour enabled={false} />
      {/* Scroll progress bar — sits above everything, sleek white, springy */}
      <motion.div
        aria-hidden
        className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left pointer-events-none bg-white/85"
        style={{ scaleX: scrollProgressX }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section
          className="relative min-h-[800px] md:min-h-screen flex flex-col justify-center items-center px-4 pt-[180px]"
        >

          {/* Top corners — Log In (ghost) / Get Started (white) */}
          <div className="absolute top-[100px] md:top-6 left-4 lg:left-8 z-50">
            <button
              onClick={onLogin || onGetStarted}
              className="rounded-full border border-white/15 text-white/80 text-[15px] font-semibold py-2.5 px-6 hover:bg-white/5 transition"
            >
              {COPY.landing.nav.logIn}
            </button>
          </div>
          <div className="absolute top-[100px] md:top-6 right-4 lg:right-8 z-50">
            <motion.button
              onClick={onGetStarted}
              onMouseEnter={() => setActionIntent(1)}
              onMouseLeave={() => setActionIntent(0)}
              onFocus={() => setActionIntent(1)}
              onBlur={() => setActionIntent(0)}
              onPointerDown={() => setActionIntent(1)}
              onPointerUp={() => setActionIntent(0)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full bg-white text-black text-[15px] font-semibold py-2.5 px-6 transition-transform"
            >
              {COPY.landing.nav.getStarted}
            </motion.button>
          </div>

          {/* Hero headline — sleek Apple-style wordmark + tagline */}
          <div ref={heroNavRef} className="relative z-50 w-full max-w-3xl lg:max-w-5xl mx-auto px-4 md:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING.gentle}
            >
              <h1 className="font-semibold tracking-[-0.03em] leading-[1.02] text-white text-[clamp(2.5rem,7vw,5rem)]">
                {COPY.landing.hero.title}
              </h1>
              <p className="mt-4 mx-auto max-w-xl text-[clamp(1rem,2.2vw,1.4rem)] leading-relaxed text-white/55">
                {COPY.landing.hero.tagline}
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <motion.button
                  onClick={onGetStarted}
                  onMouseEnter={() => setActionIntent(1)}
                  onMouseLeave={() => setActionIntent(0)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="rounded-full bg-white text-black text-[15px] font-semibold py-3 px-7 transition-transform"
                >
                  {COPY.landing.hero.getStarted}
                </motion.button>
                <button
                  onClick={onLogin || onGetStarted}
                  className="rounded-full border border-white/15 text-white/80 text-[15px] font-semibold py-3 px-7 hover:bg-white/5 transition"
                >
                  {COPY.landing.hero.logIn}
                </button>
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
            <span className="text-[11px] uppercase tracking-[0.12em] text-white/40 group-hover:text-white/70 transition-colors">
              {COPY.landing.hero.scrollHint}
            </span>
            <div className="w-6 h-10 rounded-full border border-white/20 group-hover:border-white/50 transition-colors flex justify-center pt-2">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-white/60 group-hover:bg-white transition-colors"
              />
            </div>
          </motion.button>
        </section>

        {/* Sticky nav — thin blurred bar with login/get-started */}
        {isNavSticky && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={SPRING.snappy}
            className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#08080a]/70 backdrop-blur-xl"
          >
            <div className="mx-auto max-w-3xl flex h-14 items-center justify-between gap-2 px-6">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onLogin || onGetStarted}
                className="rounded-full border border-white/15 text-white/80 text-sm font-semibold py-2 px-4 hover:bg-white/5 transition flex-shrink-0"
              >
                {COPY.landing.nav.logIn}
              </motion.button>
              <div className="flex-1 min-w-0 flex justify-center">
                <FirstDayLogo compact={true} />
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onGetStarted}
                onMouseEnter={() => setActionIntent(1)}
                onMouseLeave={() => setActionIntent(0)}
                onFocus={() => setActionIntent(1)}
                onBlur={() => setActionIntent(0)}
                onPointerDown={() => setActionIntent(1)}
                onPointerUp={() => setActionIntent(0)}
                className="rounded-full bg-white text-black text-sm font-semibold py-2 px-4 hover:scale-[1.02] transition-transform flex-shrink-0"
              >
                <span className="hidden sm:inline">{COPY.landing.nav.getStarted}</span>
                <span className="sm:hidden">{COPY.landing.nav.getStartedShort}</span>
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
                <span className="h-px w-8 bg-white/15" aria-hidden />
                <span className="text-[12px] uppercase tracking-[0.12em] text-white/40">
                  {COPY.landing.pills.prompt}
                </span>
                <span className="h-px w-8 bg-white/15" aria-hidden />
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
            onGetStarted={onGetStarted}
          />
        </AnimatedSection>

        {/* How It Works */}
        <AnimatedSection>
          <section id="how-it-works" className="w-full py-8 md:py-16 lg:py-24 px-4 md:px-10">
            <div className="max-w-5xl lg:max-w-6xl mx-auto">
              <div className="text-center mb-6 lg:mb-10">
                <SectionKicker num="01" label={COPY.landing.howItWorks.kicker} />
                <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] text-white mb-2">{COPY.landing.howItWorks.title}</h2>
                <p className="text-white/55 md:text-lg">{COPY.landing.howItWorks.subtitle}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {[
                  { n: 1, title: COPY.landing.howItWorks.steps[0].title, line: COPY.landing.howItWorks.steps[0].line, Icon: Target },
                  { n: 2, title: COPY.landing.howItWorks.steps[1].title, line: COPY.landing.howItWorks.steps[1].line, Icon: Sparkles },
                  { n: 3, title: COPY.landing.howItWorks.steps[2].title, line: COPY.landing.howItWorks.steps[2].line, Icon: Flame },
                ].map((s, i) => (
                  <motion.div
                    key={s.n}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ ...SPRING.gentle, delay: i * 0.12 }}
                  >
                    <Panel contentClassName="p-6 lg:p-8 text-center">
                      <div className="relative">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-4">
                          <s.Icon className="w-6 h-6 text-white/70" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold tracking-[-0.01em] text-white mb-2">{s.title}</h3>
                        <p className="text-white/55 text-sm lg:text-base leading-relaxed">{s.line}</p>
                      </div>
                    </Panel>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Stay Motivated */}
        <AnimatedSection>
          <section className="w-full py-8 md:py-16 lg:py-24 px-4 md:px-10">
            <div className="max-w-5xl lg:max-w-6xl mx-auto">
              <div className="text-center mb-6 lg:mb-10">
                <SectionKicker num="02" label={COPY.landing.stayMotivated.kicker} />
                <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] text-white mb-2">{COPY.landing.stayMotivated.title}</h2>
                <p className="text-white/55 md:text-lg">{COPY.landing.stayMotivated.subtitle}</p>
              </div>

              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Streaks */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={SPRING.gentle}
                  >
                    <Panel contentClassName="p-6 lg:p-8 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-4">
                        <Flame className="w-6 h-6 text-white/70" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-semibold tracking-[-0.01em] text-white mb-1">{COPY.landing.stayMotivated.streaks.title}</h3>
                      <p className="text-white/55 text-sm lg:text-base mb-4 leading-relaxed">{COPY.landing.stayMotivated.streaks.body}</p>
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 text-white px-5 py-1.5 font-semibold text-lg">
                        <Flame className="w-5 h-5 text-white/70" />
                        <span className="tabular-nums">12</span>
                      </div>
                      <p className="text-xs text-white/40 mt-2 font-medium">{COPY.landing.stayMotivated.streaks.caption}</p>
                    </Panel>
                  </motion.div>

                  {/* XP & Levels */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={SPRING.gentle}
                  >
                    <Panel contentClassName="p-6 lg:p-8 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-4">
                        <Zap className="w-6 h-6 text-white/70" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-semibold tracking-[-0.01em] text-white mb-1">{COPY.landing.stayMotivated.xp.title}</h3>
                      <p className="text-white/55 text-sm lg:text-base mb-4 leading-relaxed">{COPY.landing.stayMotivated.xp.body}</p>
                      <div className="space-y-2 max-w-[180px] mx-auto">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-white">{COPY.landing.stayMotivated.xp.tierLabel}</span>
                          {/* Static, not a counting animation — this is a picture of the
                              app's own XP row, not a stat to impress anyone with. */}
                          <span className="text-white/70 font-semibold tabular-nums">1,450 XP</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-white/85"
                            initial={{ width: "0%" }}
                            whileInView={{ width: "62%" }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 1.4, ease: [0.22, 0.8, 0.3, 1], delay: 0.2 }}
                          />
                        </div>
                        <p className="text-xs text-white/40">{COPY.landing.stayMotivated.xp.progressNote}</p>
                      </div>
                    </Panel>
                  </motion.div>

                  {/* Achievements */}
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={SPRING.gentle}
                  >
                    <Panel contentClassName="p-6 lg:p-8 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-4">
                        <Trophy className="w-6 h-6 text-white/70" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-semibold tracking-[-0.01em] text-white mb-1">{COPY.landing.stayMotivated.achievements.title}</h3>
                      <p className="text-white/55 text-sm lg:text-base mb-4 leading-relaxed">{COPY.landing.stayMotivated.achievements.body}</p>
                      <div className="flex justify-center gap-2">
                        {["First Step", "On Fire", "Perfect Week", "???"].map((label, i) => (
                          <motion.div
                            key={label}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ ...SPRING.bouncy, delay: 0.15 + i * 0.12 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold border ${
                              i === 3
                                ? "bg-white/[0.03] border-white/5 text-white/25"
                                : "bg-white/5 border-white/10 text-white/70"
                            }`}
                            title={label}
                          >
                            {i === 3 ? "?" : (i + 1)}
                          </motion.div>
                        ))}
                      </div>
                    </Panel>
                  </motion.div>
                </div>

                {/* The three-column counting stat bar that used to sit here is gone.
                    "Rate 87%" was a number with no source behind it — First Day has no
                    completion-rate data to quote — and an animated counter strip is the
                    single most recognisable AI-generated landing-page tell (design
                    standard §5). The three feature cards above already show what the
                    loop does, using the app's own UI. */}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* What Your Plan Looks Like */}
        <AnimatedSection>
          <section className="w-full py-8 md:py-16 lg:py-24 px-4 md:px-10">
              <div className="max-w-5xl lg:max-w-6xl mx-auto">
              <div className="text-center mb-6 lg:mb-10">
                <SectionKicker num="03" label={COPY.landing.plan.kicker} />
                <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] text-white mb-2">{COPY.landing.plan.title}</h2>
                <p className="text-white/55 md:text-lg">{COPY.landing.plan.subtitle}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 lg:gap-6">
                {[
                  { Icon: Calendar, label: COPY.landing.plan.cards[0].label, desc: COPY.landing.plan.cards[0].desc },
                  { Icon: ListChecks, label: COPY.landing.plan.cards[1].label, desc: COPY.landing.plan.cards[1].desc },
                  { Icon: NotebookPen, label: COPY.landing.plan.cards[2].label, desc: COPY.landing.plan.cards[2].desc },
                  { Icon: Trophy, label: COPY.landing.plan.cards[3].label, desc: COPY.landing.plan.cards[3].desc },
                ].map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ ...SPRING.gentle, delay: i * 0.08 }}
                    whileHover={{ y: -4 }}
                  >
                    <Panel contentClassName="p-5 md:p-6 lg:p-7 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-3">
                        <card.Icon className="w-6 h-6 text-white/70" strokeWidth={2} />
                      </div>
                      <h3 className="text-base md:text-lg font-semibold tracking-[-0.01em] text-white mb-1">{card.label}</h3>
                      <p className="text-xs md:text-sm text-white/50 leading-relaxed">{card.desc}</p>
                    </Panel>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center mt-8 md:mt-12 lg:mt-16">
                <motion.button
                  onClick={onGetStarted}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="group inline-flex items-center gap-2 rounded-full bg-white text-black text-[16px] md:text-[17px] font-semibold py-3.5 px-8 transition-transform"
                >
                  <span>{COPY.landing.plan.ctaButton}</span>
                  <motion.span
                    aria-hidden
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block"
                  >
                    →
                  </motion.span>
                </motion.button>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="text-sm lg:text-base text-white/50 mt-4"
                >
                  {COPY.landing.plan.ctaNote}
                </motion.p>
              </div>
              </div>
          </section>
        </AnimatedSection>

      </div>

      <StickyCTA onGetStarted={onGetStarted} onLogin={onLogin} />
    </div>
  );
}

function StickyCTA({ onGetStarted, onLogin }: { onGetStarted: () => void; onLogin?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(y > window.innerHeight * 0.8 && y < max - 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!mounted) return null;

  // Portal to document.body: <main> in this app applies a transform
  // (3D shell breath / camera-driven motion), which creates a containing
  // block and breaks `position: fixed` for any in-tree descendant.
  return createPortal(
    <motion.div
      aria-hidden={!visible}
      initial={false}
      animate={{ y: visible ? 0 : 96, opacity: visible ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="fixed bottom-0 inset-x-0 z-[80] pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl px-3 md:px-4 pb-3 md:pb-4">
        <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-2xl border border-white/10 bg-[#08080a]/82 backdrop-blur-xl">
          <button
            onClick={onGetStarted}
            className="flex-1 rounded-full bg-white text-black text-base md:text-lg font-semibold py-3 md:py-3.5 hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            {COPY.landing.stickyCta.createPlan}
          </button>
          {onLogin && (
            <button
              onClick={onLogin}
              className="rounded-full border border-white/15 px-4 md:px-5 py-3 md:py-3.5 text-sm md:text-base font-semibold text-white/80 hover:bg-white/5 transition"
            >
              {COPY.landing.stickyCta.logIn}
            </button>
          )}
        </div>
      </div>
    </motion.div>,
    document.body
  );
}
