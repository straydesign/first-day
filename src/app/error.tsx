"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { VORONOI_LIGHT, SHARD_CLIPS } from "@/constants";

const SHARD_COUNT = 12;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[First Day] Runtime error:", error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex items-center justify-center">
      {/* Decorative background shards */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => {
          const color = VORONOI_LIGHT[i % VORONOI_LIGHT.length];
          return (
            <motion.div
              key={i}
              className="absolute"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.06 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              style={{
                width: `${120 + i * 40}px`,
                height: `${80 + i * 30}px`,
                backgroundColor: color,
                clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length],
                top: `${15 + i * 12}%`,
                left: `${10 + ((i * 17) % 60)}%`,
              }}
            />
          );
        })}
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Error icon — shard mosaic */}
        <div className="flex gap-[3px] h-16 w-48">
          {Array.from({ length: SHARD_COUNT }, (_, i) => {
            const color = VORONOI_LIGHT[i % VORONOI_LIGHT.length];
            return (
              <motion.div
                key={i}
                className="flex-1"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{
                  delay: 0.3 + i * 0.04,
                  duration: 0.4,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                style={{
                  backgroundColor: i % 3 === 0 ? color : "rgba(255,255,255,0.08)",
                  clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length],
                  transformOrigin: "bottom",
                }}
              />
            );
          })}
        </div>

        {/* Heading */}
        <h1
          className="text-4xl sm:text-5xl text-white text-center uppercase tracking-wider"
          style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}
        >
          Something broke
        </h1>

        {/* Message */}
        <p className="text-white/50 text-center text-base leading-relaxed">
          An unexpected error occurred. Your progress is safe — try again or head back to start fresh.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={reset}
            className="flex-1 relative py-4 px-8 text-black font-bold uppercase tracking-wider text-base transition-all duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-[0.97] focus-visible:outline-none"
            style={{
              backgroundColor: "#cc5533",
              clipPath: SHARD_CLIPS[0],
            }}
          >
            Try again
          </button>

          <a
            href="/"
            className="flex-1 relative py-4 px-8 text-white font-bold uppercase tracking-wider text-base text-center border border-white/10 transition-all duration-200 hover:scale-[1.03] hover:border-white/30 active:scale-[0.97] focus-visible:outline-none"
            style={{
              clipPath: SHARD_CLIPS[1],
            }}
          >
            Go home
          </a>
        </div>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="text-white/20 text-xs text-center font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}
