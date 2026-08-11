"use client";

/**
 * DayCompleteDemo — the dopamine loop in 30 seconds.
 *
 * Visitor taps the day card → it pulses, checkmark snaps in, confetti shards
 * burst from center, +50 XP floats up, streak counter ticks, fire icon punches.
 * Resettable, repeatable, addictive.
 *
 * iOS-portable: every motion below maps to a SwiftUI primitive
 *   - card pulse → withAnimation { scale: ... }
 *   - checkmark → SF Symbol + .transition(.scale.combined(with: .opacity))
 *   - confetti → Particle system or SpriteKit
 *   - counter tick → Text + .contentTransition(.numericText())
 *   - fire pulse → SF Symbol + .symbolEffect(.bounce)
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Zap } from "lucide-react";
import { ShardEngine } from "./lab/ShardEngine";
import { TOKENS } from "@/tokens";
import { Panel } from "@/components/ui/Panel";
import { FONT, GREY_VORONOI } from "@/lib/design";
import { DEFAULT_DEMO_GOAL, planFor } from "@/data/sample-plans";

const XP_PER_DAY = 50;
const STREAK_MAX = 7;

interface DayCompleteDemoProps {
  /** Goal title shown in the header. Defaults to the sample goal. */
  goal?: string;
  /** 7-item activity list. Defaults to the sample plan for the default goal. */
  plan?: string[];
  /** Whether the goal/plan came from visitor input (vs. the built-in sample). */
  isUserChosen?: boolean;
  /** Conversion CTA fired when the user hits Week Complete (peak dopamine). */
  onGetStarted?: () => void;
}

// iOS-portable audio: maps to AVAudioEngine on iOS (or AudioServicesPlaySystemSound
// for system-default). Web Audio is suspended until user gesture, so the
// AudioContext is lazy-instantiated inside the tap handler.
type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function playBlip(ctx: AudioContext, completed: number) {
  // Frequency rises slightly with each day for an ascending feel.
  const baseFreq = 380 + completed * 28;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.06);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

export function DayCompleteDemo({
  goal,
  plan,
  isUserChosen = false,
  onGetStarted,
}: DayCompleteDemoProps = {}) {
  const effectiveGoal = goal ?? DEFAULT_DEMO_GOAL;
  const effectivePlan = plan ?? planFor(DEFAULT_DEMO_GOAL);

  const [completed, setCompleted] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const [finaleKey, setFinaleKey] = useState(0);
  const [showXpToast, setShowXpToast] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Reset progress when the visitor picks a fresh goal upstream.
  useEffect(() => {
    setCompleted(0);
    setPulseKey(0);
    setFinaleKey(0);
    setShowXpToast(false);
  }, [effectiveGoal]);

  const isMaxed = completed >= STREAK_MAX;

  const handleTap = () => {
    if (isMaxed) return;
    if (!audioCtxRef.current && typeof window !== "undefined") {
      const Ctx =
        window.AudioContext ??
        (window as WindowWithWebkitAudio).webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }
      playBlip(audioCtxRef.current, completed);
    }
    const next = completed + 1;
    setCompleted(next);
    setPulseKey((k) => k + 1);
    if (next >= STREAK_MAX) {
      setFinaleKey((k) => k + 1);
    }
    setShowXpToast(true);
    setTimeout(() => setShowXpToast(false), 900);
  };

  const reset = () => {
    setCompleted(0);
    setPulseKey(0);
    setFinaleKey(0);
    setShowXpToast(false);
  };

  const xp = completed * XP_PER_DAY;
  const streak = completed;
  const dayLabel = Math.min(completed + 1, STREAK_MAX);
  const upcomingActivity = effectivePlan[Math.min(completed, STREAK_MAX - 1)] ?? "";
  const justCompletedActivity =
    completed > 0 ? (effectivePlan[completed - 1] ?? "") : "";

  return (
    <section className="relative w-full py-12 md:py-20 px-4 md:px-10 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-white/5 border border-white/10">
            <Zap className="w-4 h-4 text-white/60" />
            <span className="text-xs uppercase tracking-[0.08em] text-white/40">
              Tap to feel it
            </span>
          </div>
          <h2
            className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-white mb-2"
            style={{ fontFamily: FONT }}
          >
            Every day you show up feels like this
          </h2>
          <p className="text-white/55 md:text-lg">
            {isUserChosen ? "Your plan: " : "Sample plan: "}
            <span className="text-white font-semibold">{effectiveGoal}</span>. Tap each day. {STREAK_MAX} days = full streak.
          </p>
        </div>

        {/* Stat bar — XP + Streak counters */}
        <div className="grid grid-cols-2 gap-3 md:gap-5 max-w-md mx-auto mb-8">
          {/* XP */}
          <Panel contentClassName="py-4 px-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Zap className="w-4 h-4 text-white/60" />
              <span className="text-[10px] uppercase tracking-[0.08em] text-white/40 font-medium">
                XP
              </span>
            </div>
            <motion.p
              key={`xp-${xp}`}
              initial={{ scale: 1.3, color: "rgba(255,255,255,0.55)" }}
              animate={{ scale: 1, color: "rgba(255,255,255,1)" }}
              transition={TOKENS.motion.spring.snappy}
              className="text-3xl md:text-4xl font-semibold text-white tabular-nums"
            >
              {xp}
            </motion.p>
          </Panel>

          {/* Streak */}
          <Panel contentClassName="py-4 px-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <motion.span
                key={`fire-${streak}`}
                animate={
                  streak > 0
                    ? { scale: [1, 1.4, 1], rotate: [0, -8, 8, 0] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.5 }}
                className="inline-flex"
              >
                <Flame className="w-4 h-4 text-white/60" />
              </motion.span>
              <span className="text-[10px] uppercase tracking-[0.08em] text-white/40 font-medium">
                Streak
              </span>
            </div>
            <motion.p
              key={`streak-${streak}`}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={TOKENS.motion.spring.snappy}
              className="text-3xl md:text-4xl font-semibold text-white tabular-nums"
            >
              {streak}
            </motion.p>
          </Panel>
        </div>

        {/* Tap stage */}
        <div className="relative max-w-md mx-auto h-[320px] md:h-[360px]">
          {/* Confetti burst — re-mounts on each tap via key */}
          {pulseKey > 0 && (
            <div key={`burst-${pulseKey}`} className="absolute inset-0 pointer-events-none">
              <ShardEngine
                count={20}
                state="exploding"
                seed={pulseKey * 31 + 7}
                sizeRange={[12, 32]}
                maxOpacity={1}
                drift={false}
                palette={GREY_VORONOI}
              />
            </div>
          )}

          {/* Finale: bigger, longer burst when streak completes */}
          {finaleKey > 0 && (
            <>
              <div
                key={`finale-a-${finaleKey}`}
                className="absolute inset-0 pointer-events-none z-10"
                style={{ transform: "scale(1.6)" }}
              >
                <ShardEngine
                  count={60}
                  state="exploding"
                  seed={finaleKey * 53 + 1}
                  sizeRange={[18, 56]}
                  maxOpacity={1}
                  drift={false}
                  palette={GREY_VORONOI}
                />
              </div>
              <div
                key={`finale-b-${finaleKey}`}
                className="absolute inset-0 pointer-events-none z-10"
                style={{ transform: "scale(2.2)" }}
              >
                <ShardEngine
                  count={40}
                  state="exploding"
                  seed={finaleKey * 71 + 19}
                  sizeRange={[10, 28]}
                  maxOpacity={0.85}
                  drift={false}
                  palette={GREY_VORONOI}
                />
              </div>
              <motion.div
                key={`flash-${finaleKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.25, 0] }}
                transition={{ duration: 0.7, ease: [0.22, 0.8, 0.3, 1] }}
                className="absolute inset-0 pointer-events-none rounded-2xl bg-white"
              />
            </>
          )}

          {/* The card — tappable */}
          <motion.button
            type="button"
            onClick={handleTap}
            disabled={isMaxed}
            whileHover={!isMaxed ? { scale: 1.03 } : {}}
            whileTap={!isMaxed ? { scale: 0.94 } : {}}
            animate={
              pulseKey > 0
                ? { scale: [1, 1.08, 1] }
                : { scale: 1 }
            }
            transition={
              pulseKey > 0
                ? { duration: 0.45, ease: [0.22, 0.8, 0.3, 1] }
                : TOKENS.motion.spring.snappy
            }
            key={`card-${pulseKey}`}
            className="absolute inset-0 m-auto w-[280px] h-[280px] md:w-[320px] md:h-[320px] disabled:cursor-default"
          >
            <Panel solid={isMaxed} contentClassName="h-full flex flex-col items-center justify-center p-5">
              <AnimatePresence mode="wait">
                {isMaxed ? (
                  <motion.div
                    key="maxed"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={TOKENS.motion.spring.bouncy}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-black text-center leading-tight"
                      style={{ fontFamily: FONT }}
                    >
                      Week<br />Complete
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`day-${completed}`}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={TOKENS.motion.spring.bouncy}
                    className="flex flex-col items-center gap-2 w-full"
                  >
                    {completed > 0 && (
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-1">
                        <Check className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
                      </div>
                    )}
                    <div className="text-[10px] uppercase tracking-[0.08em] text-white/40 font-medium">
                      {completed > 0
                        ? `Day ${completed} Done`
                        : `Day ${dayLabel} · Tap to complete`}
                    </div>
                    <div className="text-base md:text-lg font-semibold text-white text-center leading-tight px-2">
                      {completed > 0 ? justCompletedActivity : upcomingActivity}
                    </div>
                    {completed > 0 && completed < STREAK_MAX && (
                      <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-medium mt-1">
                        Next: Day {dayLabel}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          </motion.button>

          {/* Floating +50 XP toast */}
          <AnimatePresence>
            {showXpToast && (
              <motion.div
                key={`toast-${pulseKey}`}
                initial={{ opacity: 0, y: 0, scale: 0.6 }}
                animate={{ opacity: 1, y: -80, scale: 1 }}
                exit={{ opacity: 0, y: -120 }}
                transition={{ duration: 0.8, ease: [0.22, 0.8, 0.3, 1] }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none"
              >
                <div className="px-4 py-2 rounded-full bg-white text-black font-semibold text-xl tracking-[-0.01em]">
                  +{XP_PER_DAY} XP
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reset CTA — at Week Complete, show a strong sprint CTA alongside reset */}
        {completed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={TOKENS.motion.spring.gentle}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6"
          >
            {isMaxed && onGetStarted && (
              <motion.button
                onClick={onGetStarted}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="rounded-full bg-white text-black font-semibold px-7 py-4 text-base md:text-lg transition-transform"
              >
                Start your real sprint →
              </motion.button>
            )}
            <button
              onClick={reset}
              className="rounded-full border border-white/15 text-white/80 hover:bg-white/5 px-5 py-2 text-xs font-medium uppercase tracking-[0.08em] transition"
            >
              Reset
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
