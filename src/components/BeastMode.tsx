"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FONT } from "@/lib/design";
import { COPY } from "@/content/copy";


interface BeastModeProps {
  onComplete: () => void;
}

const SHARD_COUNT = 24;


export function BeastMode({ onComplete }: BeastModeProps) {
  const [loop, setLoop] = useState(0);
  const [filledShards, setFilledShards] = useState(0);

  useEffect(() => {
    // Each loop fills all shards fast, then resets
    const speed = 60; // ms per shard — fast
    const totalLoops = 3;

    const timer = setInterval(() => {
      setFilledShards(prev => {
        const next = prev + 1;
        if (next > SHARD_COUNT) {
          // Completed one loop
          setLoop(currentLoop => {
            const nextLoop = currentLoop + 1;
            if (nextLoop >= totalLoops) {
              clearInterval(timer);
              // Small delay then transition out
              setTimeout(onComplete, 300);
              return nextLoop;
            }
            return nextLoop;
          });
          return 0;
        }
        return next;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden flex flex-col items-center justify-center bg-[#08080a]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top progress bar */}
      <div className="absolute top-[45%] left-4 right-4 -translate-y-16">
        <div className="flex gap-[2px] h-1.5 w-full rounded-full overflow-hidden bg-white/10">
          {Array.from({ length: SHARD_COUNT }, (_, i) => {
            const isFilled = i < filledShards;
            return (
              <div
                key={`top-${i}`}
                className="flex-1 transition-colors duration-[40ms]"
                style={{
                  backgroundColor: isFilled ? "rgba(255,255,255,0.85)" : "transparent",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* BEAST MODE text — greyscale, Inter, no Bebas */}
      <motion.h1
        className="text-center font-semibold tracking-[-0.03em] text-white"
        style={{
          fontFamily: FONT,
          fontSize: "clamp(4rem, 18vw, 10rem)",
          lineHeight: 0.9,
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
      >
        {COPY.beastMode.label.split(" ")[0]}
        <br />
        <span className="text-white/55">{COPY.beastMode.label.split(" ")[1]}</span>
      </motion.h1>

      {/* Bottom progress bar */}
      <div className="absolute top-[55%] left-4 right-4 translate-y-12">
        <div className="flex gap-[2px] h-1.5 w-full rounded-full overflow-hidden bg-white/10">
          {Array.from({ length: SHARD_COUNT }, (_, i) => {
            // Bottom bar fills in reverse for a wraparound effect
            const reverseIndex = SHARD_COUNT - 1 - i;
            const isFilled = reverseIndex < filledShards;
            return (
              <div
                key={`bot-${i}`}
                className="flex-1 transition-colors duration-[40ms]"
                style={{
                  backgroundColor: isFilled ? "rgba(255,255,255,0.85)" : "transparent",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Loop counter dots */}
      <div className="absolute bottom-[30%] flex gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-colors duration-150"
            style={{
              backgroundColor: i < loop ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
