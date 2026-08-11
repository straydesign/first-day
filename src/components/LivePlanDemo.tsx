"use client";

/**
 * LivePlanDemo — the "magic moment" preview shown on the landing page.
 *
 * Visitor types/picks a goal → ShardEngine animates from scattered → grid,
 * each grid cell revealing a Day N with a canned activity. No signup, no
 * backend call. Pure dopamine.
 *
 * Designed to translate cleanly to SwiftUI: every animation here maps to
 * a shape transition + opacity + transform, which iOS handles natively.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Share2, Check } from "lucide-react";
import { ShardEngine } from "./lab/ShardEngine";
import { TOKENS } from "@/tokens";
import { Panel } from "@/components/ui/Panel";
import { FONT, GREY_VORONOI } from "@/lib/design";
import { QUICK_GOALS, planFor } from "@/data/sample-plans";

interface LivePlanDemoProps {
  onGetStarted: () => void;
  onPlanGenerated?: (goal: string, plan: string[]) => void;
  /** External seed — when set (e.g., from a clicked goal pill), auto-generates. */
  externalSeed?: { goal: string; nonce: number } | null;
}

type Phase = "idle" | "scattered" | "assembling" | "revealed";

// iOS-portable audio: maps to AVAudioEngine triad on iOS.
// Plays a soft major-triad chord when shards click into the grid.
type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function playAssemblyChord(ctx: AudioContext) {
  const now = ctx.currentTime;
  // C4–E4–G4 major triad — warm, satisfying "click into place".
  const freqs = [261.63, 329.63, 392.0];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.04 + i * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  });
}

const PLACEHOLDER_GOALS = [
  "Learn Spanish in 7 days?",
  "Run my first 5k?",
  "Read 5 books this month?",
  "Ship my side project?",
  "Cut sugar for a week?",
  "Wake up at 6am every day?",
];

export function LivePlanDemo({ onGetStarted, onPlanGenerated, externalSeed }: LivePlanDemoProps) {
  const [goal, setGoal] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [activePlan, setActivePlan] = useState<string[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const dayGridRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the freshly revealed plan into view so the user sees all 7 days.
  useEffect(() => {
    if (phase !== "revealed") return;
    const t = setTimeout(() => {
      dayGridRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => clearTimeout(t);
  }, [phase]);

  const sharePlan = async () => {
    const text = `7-day sprint: ${goal}\n\n${activePlan
      .map((a, i) => `Day ${i + 1} — ${a}`)
      .join("\n")}\n\nBuilt mine in 2 seconds → firstday.life`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `My ${goal} sprint`, text });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // User cancelled share sheet — silent.
    }
  };

  // Cycle the placeholder while idle so the input feels alive.
  useEffect(() => {
    if (phase !== "idle" || goal) return;
    const t = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_GOALS.length);
    }, 2400);
    return () => clearInterval(t);
  }, [phase, goal]);

  const generate = (raw: string) => {
    const cleaned = raw.trim();
    if (!cleaned) return;
    setGoal(cleaned);
    setPhase("scattered");
    const plan = planFor(cleaned);
    setActivePlan(plan);
    onPlanGenerated?.(cleaned, plan);

    // Web Audio is suspended until user gesture, so init lazily inside the click handler.
    if (!audioCtxRef.current && typeof window !== "undefined") {
      const Ctx =
        window.AudioContext ??
        (window as WindowWithWebkitAudio).webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }

    setTimeout(() => {
      setPhase("assembling");
      const ctx = audioCtxRef.current;
      if (ctx) {
        if (ctx.state === "suspended") void ctx.resume();
        playAssemblyChord(ctx);
      }
    }, 600);
    setTimeout(() => setPhase("revealed"), 1500);
  };

  const reset = () => {
    setPhase("idle");
    setGoal("");
    setActivePlan([]);
  };

  // External seeding: when a goal pill upstream is clicked, auto-run generate.
  // The nonce ensures repeated clicks of the same pill still re-trigger.
  useEffect(() => {
    if (!externalSeed?.goal) return;
    generate(externalSeed.goal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSeed?.nonce]);

  const isAnimating = phase === "scattered" || phase === "assembling";

  return (
    <section className="relative w-full py-12 md:py-20 px-4 md:px-10 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <AnimatePresence>
          {phase === "idle" && (
            <motion.div
              key="headline"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={TOKENS.motion.spring.snappy}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-white/5 border border-white/10">
                <Sparkles className="w-4 h-4 text-white/60" />
                <span className="text-xs uppercase tracking-[0.08em] text-white/40">Try it — no signup</span>
              </div>
              <h2
                className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] text-white mb-2"
                style={{ fontFamily: FONT }}
              >
                See your plan in 2 seconds
              </h2>
              <p className="text-white/55 md:text-lg">
                Pick a goal — watch your first sprint assemble.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={TOKENS.motion.spring.gentle}
              className="space-y-4"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  generate(goal);
                }}
                className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto"
              >
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={PLACEHOLDER_GOALS[placeholderIdx]}
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-5 py-4 text-white text-lg placeholder:text-white/35 focus:outline-none focus:border-white/30 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!goal.trim()}
                  className="px-6 py-4 rounded-full bg-white text-black text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:scale-[1.02] active:scale-[0.99]"
                >
                  <span className="inline-flex items-center gap-2">
                    Generate <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </form>

              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                <span className="text-xs text-white/50 self-center mr-1">or try:</span>
                {QUICK_GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => generate(g)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
                  >
                    {g}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {(isAnimating || phase === "revealed") && (
            <motion.div
              key="plan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={TOKENS.motion.spring.gentle}
              className="relative"
            >
              <div className="text-center mb-6">
                <p className="text-xs uppercase tracking-[0.08em] text-white/40 mb-1">Your goal</p>
                <p
                  className="text-2xl md:text-4xl font-semibold tracking-[-0.02em] text-white"
                  style={{ fontFamily: FONT }}
                >
                  {goal}
                </p>
              </div>

              {/* Shard assembly stage — scattered → assembled grid */}
              {isAnimating && (
                <div className="relative h-[280px] md:h-[320px] mb-6">
                  <ShardEngine
                    count={28}
                    state={phase === "assembling" ? "assembling" : "scattered"}
                    target={{ type: "grid", rows: 4, cols: 7, gap: 3 }}
                    seed={goal.length * 7 + 13}
                    maxOpacity={phase === "assembling" ? 1 : 0.7}
                    drift={phase === "scattered"}
                    palette={GREY_VORONOI}
                  />
                </div>
              )}

              {/* Day cards — fade in after assembly */}
              {phase === "revealed" && (
                <div ref={dayGridRef} className="relative grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3 mb-6">
                  {/* Celebration burst — fires once on reveal, respects reduced motion via MotionConfig */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
                    {Array.from({ length: 18 }).map((_, i) => {
                      const angle = (i / 18) * Math.PI * 2;
                      const dist = 120 + (i % 3) * 24;
                      const confettiColor = i % 3 === 0 ? "rgba(255,255,255,0.9)" : i % 3 === 1 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)";
                      return (
                        <motion.div
                          key={i}
                          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                          animate={{
                            x: Math.cos(angle) * dist,
                            y: Math.sin(angle) * dist,
                            scale: [0, 1, 0.4],
                            opacity: [1, 1, 0],
                          }}
                          transition={{ duration: 0.9, ease: "easeOut", delay: 0.05 }}
                          className="absolute w-2 h-2 rounded-sm"
                          style={{ backgroundColor: confettiColor }}
                        />
                      );
                    })}
                  </div>
                  {activePlan.map((activity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      whileHover={{ y: -4, scale: 1.04 }}
                      transition={{ ...TOKENS.motion.spring.gentle, delay: 0.05 * i }}
                      className="cursor-default"
                    >
                      <Panel contentClassName="p-4 md:p-5 flex flex-col gap-2 min-h-[140px] md:min-h-[160px]">
                        <div className="text-[10px] uppercase tracking-[0.08em] text-white/40 font-medium">Day {i + 1}</div>
                        <div className="text-xs md:text-sm font-semibold text-white leading-snug">
                          {activity}
                        </div>
                      </Panel>
                    </motion.div>
                  ))}
                </div>
              )}

              {phase === "revealed" && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...TOKENS.motion.spring.gentle, delay: 0.6 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                  <motion.button
                    onClick={onGetStarted}
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.96 }}
                    className="rounded-full bg-white text-black font-semibold px-8 py-4 text-base md:text-lg transition-transform"
                  >
                    Start your real plan →
                  </motion.button>
                  <button
                    onClick={sharePlan}
                    className="rounded-full border border-white/15 text-white/80 hover:bg-white/5 px-5 py-3 text-sm font-medium transition inline-flex items-center gap-2"
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-4 h-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" /> Share
                      </>
                    )}
                  </button>
                  <button
                    onClick={reset}
                    className="rounded-full border border-white/15 text-white/80 hover:bg-white/5 px-5 py-3 text-sm font-medium transition"
                  >
                    Try another goal
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
