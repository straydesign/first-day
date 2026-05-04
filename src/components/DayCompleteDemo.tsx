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

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Zap } from "lucide-react";
import { ShardEngine } from "./lab/ShardEngine";
import { TOKENS } from "@/tokens";

const XP_PER_DAY = 50;
const STREAK_MAX = 7;

export function DayCompleteDemo() {
  const [completed, setCompleted] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const [showXpToast, setShowXpToast] = useState(false);

  const isMaxed = completed >= STREAK_MAX;

  const handleTap = () => {
    if (isMaxed) return;
    setCompleted((c) => c + 1);
    setPulseKey((k) => k + 1);
    setShowXpToast(true);
    setTimeout(() => setShowXpToast(false), 900);
  };

  const reset = () => {
    setCompleted(0);
    setPulseKey(0);
    setShowXpToast(false);
  };

  const xp = completed * XP_PER_DAY;
  const streak = completed;
  const dayLabel = Math.min(completed + 1, STREAK_MAX);

  return (
    <section className="relative w-full py-12 md:py-20 px-4 md:px-10 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 bg-white/10"
            style={{ clipPath: TOKENS.clipPaths.button[1] }}
          >
            <Zap className="w-4 h-4 text-[#FF6B2B]" />
            <span className="text-xs uppercase tracking-widest text-white/80">
              Tap to feel it
            </span>
          </div>
          <h2
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2"
            style={{
              fontFamily: TOKENS.typography.fontFamily.display,
              letterSpacing: TOKENS.typography.letterSpacing.display,
            }}
          >
            Every day you show up feels like this
          </h2>
          <p className="text-white/70 md:text-lg">
            Tap the card. Then tap it again. {STREAK_MAX} days = full streak.
          </p>
        </div>

        {/* Stat bar — XP + Streak counters */}
        <div className="grid grid-cols-2 gap-3 md:gap-5 max-w-md mx-auto mb-8">
          {/* XP */}
          <div
            className="text-center py-4 px-3"
            style={{
              backgroundColor: "#FFE633",
              clipPath: TOKENS.clipPaths.shard[0],
            }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Zap className="w-4 h-4 text-black" />
              <span className="text-[10px] uppercase tracking-widest text-black/70 font-bold">
                XP
              </span>
            </div>
            <motion.p
              key={`xp-${xp}`}
              initial={{ scale: 1.3, color: "#FF2D55" }}
              animate={{ scale: 1, color: "#000000" }}
              transition={TOKENS.motion.spring.snappy}
              className="text-3xl md:text-4xl font-black text-black tabular-nums"
            >
              {xp}
            </motion.p>
          </div>

          {/* Streak */}
          <div
            className="text-center py-4 px-3"
            style={{
              backgroundColor: "#FF4500",
              clipPath: TOKENS.clipPaths.shard[2],
            }}
          >
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
                <Flame className="w-4 h-4 text-black" />
              </motion.span>
              <span className="text-[10px] uppercase tracking-widest text-black/70 font-bold">
                Streak
              </span>
            </div>
            <motion.p
              key={`streak-${streak}`}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={TOKENS.motion.spring.snappy}
              className="text-3xl md:text-4xl font-black text-black tabular-nums"
            >
              {streak}
            </motion.p>
          </div>
        </div>

        {/* Tap stage */}
        <div className="relative max-w-md mx-auto h-[280px] md:h-[320px]">
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
              />
            </div>
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
            className="absolute inset-0 m-auto w-[240px] h-[240px] md:w-[280px] md:h-[280px] flex flex-col items-center justify-center p-6 disabled:cursor-default"
            style={{
              backgroundColor: isMaxed ? "#FFE633" : "#FF2D55",
              clipPath: TOKENS.clipPaths.shard[1],
            }}
          >
            <AnimatePresence mode="wait">
              {isMaxed ? (
                <motion.div
                  key="maxed"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={TOKENS.motion.spring.bouncy}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="text-5xl md:text-6xl">🏆</div>
                  <div
                    className="text-2xl md:text-3xl font-black text-black uppercase tracking-wider text-center leading-tight"
                    style={{
                      fontFamily: TOKENS.typography.fontFamily.display,
                      letterSpacing: TOKENS.typography.letterSpacing.display,
                    }}
                  >
                    Week<br />Complete
                  </div>
                </motion.div>
              ) : completed > 0 ? (
                <motion.div
                  key={`check-${completed}`}
                  initial={{ opacity: 0, scale: 0, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={TOKENS.motion.spring.bouncy}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="w-20 h-20 md:w-24 md:h-24 bg-black flex items-center justify-center"
                    style={{ clipPath: TOKENS.clipPaths.shard[3] }}
                  >
                    <Check className="w-12 h-12 md:w-14 md:h-14 text-[#FFE633]" strokeWidth={4} />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-black/70 font-bold">
                    Day {completed} Done
                  </div>
                  <div className="text-sm font-bold text-black">
                    Tap for Day {dayLabel}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="text-[10px] uppercase tracking-widest text-black/70 font-bold">
                    Day 1
                  </div>
                  <div
                    className="text-2xl md:text-3xl font-black text-black uppercase tracking-wider text-center leading-tight"
                    style={{
                      fontFamily: TOKENS.typography.fontFamily.display,
                      letterSpacing: TOKENS.typography.letterSpacing.display,
                    }}
                  >
                    Tap to<br />Complete
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                <div
                  className="px-4 py-2 bg-[#FFE633] text-black font-black text-xl tracking-wider"
                  style={{ clipPath: TOKENS.clipPaths.button[0] }}
                >
                  +{XP_PER_DAY} XP
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reset CTA */}
        {completed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={TOKENS.motion.spring.gentle}
            className="text-center mt-6"
          >
            <button
              onClick={reset}
              className="px-5 py-2 text-white/60 hover:text-white text-xs uppercase tracking-widest transition-colors"
            >
              Reset
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
