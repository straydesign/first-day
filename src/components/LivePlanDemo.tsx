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

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { ShardEngine } from "./lab/ShardEngine";
import { TOKENS } from "@/tokens";

interface LivePlanDemoProps {
  onGetStarted: () => void;
}

const QUICK_GOALS = [
  "Learn guitar",
  "Run a 5K",
  "Write a novel",
  "Code daily",
  "Meditate",
] as const;

const CANNED_PLANS: Record<string, string[]> = {
  "Learn guitar": [
    "Tune up + fret hand basics",
    "Three open chords: G, C, D",
    "Strumming patterns 4/4",
    "Switch chords cleanly",
    "Play your first song",
    "Add minor chords (Am, Em)",
    "Record yourself, review",
  ],
  "Run a 5K": [
    "Walk-jog 20 min, easy pace",
    "Form drills + 1mi run",
    "Rest + stretch + foam roll",
    "Intervals: 4×400m",
    "Easy 1.5mi conversational",
    "Long slow 2mi run",
    "Time trial — full 5K",
  ],
  "Write a novel": [
    "Premise: 1 sentence + 3 act spine",
    "Cast: 4 characters, 1 wound each",
    "Outline 12 scenes",
    "Write opening 500 words",
    "Daily 500w, no editing",
    "Push to act-2 turn",
    "Crash through to climax",
  ],
  "Code daily": [
    "Set up environment + repo",
    "Solve 1 LeetCode easy",
    "Refactor an old script",
    "Build a tiny CLI tool",
    "Write tests for something",
    "Read someone else's code",
    "Ship something publicly",
  ],
  Meditate: [
    "5 min breath, eyes closed",
    "Body scan, 10 min",
    "Noting practice — thoughts as 'thinking'",
    "Loving-kindness, 10 min",
    "Walking meditation, 15 min",
    "Open awareness, 15 min",
    "Silent sit, 20 min",
  ],
};

const FALLBACK_PLAN = [
  "Define what 'done' looks like",
  "Block 30 min on the calendar",
  "Take the smallest first step",
  "Show up — even when tired",
  "Iterate on what's working",
  "Push past the dip",
  "Reflect, celebrate, plan next",
];

type Phase = "idle" | "generating" | "revealed";

export function LivePlanDemo({ onGetStarted }: LivePlanDemoProps) {
  const [goal, setGoal] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [activePlan, setActivePlan] = useState<string[]>([]);

  const generate = (raw: string) => {
    const cleaned = raw.trim();
    if (!cleaned) return;
    setGoal(cleaned);
    setPhase("generating");
    const plan = CANNED_PLANS[cleaned] ?? FALLBACK_PLAN;
    setActivePlan(plan);
    setTimeout(() => setPhase("revealed"), 1400);
  };

  const reset = () => {
    setPhase("idle");
    setGoal("");
    setActivePlan([]);
  };

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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 bg-white/10"
                   style={{ clipPath: TOKENS.clipPaths.button[0] }}>
                <Sparkles className="w-4 h-4 text-[#FFE633]" />
                <span className="text-xs uppercase tracking-widest text-white/80">Try it — no signup</span>
              </div>
              <h2
                className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2"
                style={{ fontFamily: TOKENS.typography.fontFamily.display, letterSpacing: TOKENS.typography.letterSpacing.display }}
              >
                See your plan in 2 seconds
              </h2>
              <p className="text-white/70 md:text-lg">
                Pick a goal — watch your week assemble.
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
                  placeholder="What do you want to start?"
                  className="flex-1 bg-white/5 border border-white/10 px-5 py-4 text-white text-lg placeholder:text-white/40 focus:outline-none focus:border-white/30 transition-colors"
                  style={{ clipPath: TOKENS.clipPaths.button[1] }}
                />
                <button
                  type="submit"
                  disabled={!goal.trim()}
                  className="px-6 py-4 bg-[#FFE633] text-black font-black uppercase tracking-wider text-base disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                  style={{ clipPath: TOKENS.clipPaths.button[0] }}
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
                    className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/15 text-white/80 transition-colors"
                    style={{ clipPath: TOKENS.clipPaths.button[2] }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {(phase === "generating" || phase === "revealed") && (
            <motion.div
              key="plan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={TOKENS.motion.spring.gentle}
              className="relative"
            >
              <div className="text-center mb-6">
                <p className="text-xs uppercase tracking-widest text-white/50 mb-1">Your goal</p>
                <p
                  className="text-2xl md:text-4xl font-bold text-white"
                  style={{ fontFamily: TOKENS.typography.fontFamily.display, letterSpacing: TOKENS.typography.letterSpacing.display }}
                >
                  {goal}
                </p>
              </div>

              {/* Shard assembly stage — only visible while shards are animating */}
              {phase === "generating" && (
                <div className="relative h-[280px] md:h-[320px] mb-6">
                  <ShardEngine
                    count={28}
                    state="scattered"
                    target={{ type: "grid", rows: 4, cols: 7, gap: 3 }}
                    seed={goal.length * 7 + 13}
                    maxOpacity={0.85}
                    drift={true}
                  />
                </div>
              )}

              {/* Day cards — fade in after assembly */}
              {phase === "revealed" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3 mb-6">
                  {activePlan.map((activity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ ...TOKENS.motion.spring.gentle, delay: 0.05 * i }}
                      className="relative p-4 md:p-5 flex flex-col gap-2 min-h-[140px] md:min-h-[160px]"
                      style={{
                        backgroundColor: TOKENS.colors.bright[i % TOKENS.colors.bright.length],
                        clipPath: TOKENS.clipPaths.shard[i % TOKENS.clipPaths.shard.length],
                      }}
                    >
                      <div className="text-[10px] uppercase tracking-widest text-black/60 font-bold">Day {i + 1}</div>
                      <div className="text-xs md:text-sm font-bold text-black leading-snug">
                        {activity}
                      </div>
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
                  <button
                    onClick={onGetStarted}
                    className="px-8 py-4 bg-[#FF2D55] text-black font-black uppercase tracking-wider text-base md:text-lg hover:scale-[1.03] transition-transform"
                    style={{ clipPath: TOKENS.clipPaths.button[0] }}
                  >
                    Start your real plan →
                  </button>
                  <button
                    onClick={reset}
                    className="px-5 py-3 text-white/70 hover:text-white text-sm uppercase tracking-wider transition-colors"
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
