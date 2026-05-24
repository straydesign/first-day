"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { VORONOI_LIGHT, SHARD_CLIPS } from "@/constants";
import { VoronoiMosaic } from "./VoronoiMosaic";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

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
      className="fixed inset-0 z-[200] overflow-hidden flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <VoronoiMosaic seed={2707} tileCount={64} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
      {/* Top shard bar */}
      <div className="absolute top-[45%] left-4 right-4 -translate-y-16">
        <div className="flex gap-[2px] h-2 w-full">
          {Array.from({ length: SHARD_COUNT }, (_, i) => {
            const isFilled = i < filledShards;
            const color = VORONOI_LIGHT[i % VORONOI_LIGHT.length];
            return (
              <div
                key={`top-${i}`}
                className="flex-1"
                style={{
                  backgroundColor: isFilled ? color : "rgba(255,255,255,0.06)",
                  clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length],
                  boxShadow: isFilled ? `0 0 12px ${color}80` : "none",
                  transition: "background-color 40ms, box-shadow 40ms",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* BEAST MODE text */}
      <motion.h1
        className="text-center font-black uppercase tracking-[0.2em]"
        style={{
          fontFamily: "var(--font-bebas), system-ui, sans-serif",
          fontSize: "clamp(4rem, 18vw, 12rem)",
          lineHeight: 0.9,
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
      >
        {"BEAST".split("").map((char, i) => (
          <span key={`b-${i}`} style={{ color: VORONOI_LIGHT[i % VORONOI_LIGHT.length] }}>{char}</span>
        ))}
        <br />
        {"MODE".split("").map((char, i) => (
          <span key={`m-${i}`} style={{ color: VORONOI_LIGHT[(i + 2) % VORONOI_LIGHT.length] }}>{char}</span>
        ))}
      </motion.h1>

      {/* Bottom shard bar */}
      <div className="absolute top-[55%] left-4 right-4 translate-y-12">
        <div className="flex gap-[2px] h-2 w-full">
          {Array.from({ length: SHARD_COUNT }, (_, i) => {
            // Bottom bar fills in reverse for a wraparound effect
            const reverseIndex = SHARD_COUNT - 1 - i;
            const isFilled = reverseIndex < filledShards;
            const color = VORONOI_LIGHT[i % VORONOI_LIGHT.length];
            return (
              <div
                key={`bot-${i}`}
                className="flex-1"
                style={{
                  backgroundColor: isFilled ? color : "rgba(255,255,255,0.06)",
                  clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length],
                  boxShadow: isFilled ? `0 0 12px ${color}80` : "none",
                  transition: "background-color 40ms, box-shadow 40ms",
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
            className="w-3 h-3"
            style={{
              backgroundColor: i < loop ? VORONOI_LIGHT[i % VORONOI_LIGHT.length] : "rgba(255,255,255,0.15)",
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              boxShadow: i < loop ? `0 0 8px ${VORONOI_LIGHT[i % VORONOI_LIGHT.length]}60` : "none",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
