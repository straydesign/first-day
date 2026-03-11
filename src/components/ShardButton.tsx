"use client";

import { cn } from "@/lib/utils";
import { VORONOI_LIGHT } from "@/constants";

/** Irregular clip-paths for each shard fragment */
const SHARD_CLIPS = [
  "polygon(4% 8%, 95% 0%, 100% 85%, 8% 100%)",
  "polygon(0% 5%, 92% 0%, 98% 92%, 3% 95%)",
  "polygon(6% 0%, 100% 10%, 94% 100%, 0% 88%)",
  "polygon(2% 12%, 97% 3%, 100% 90%, 5% 100%)",
] as const;

/** Slight positional offsets to give overlap depth */
const SHARD_OFFSETS = [
  { top: "-2px", left: "-1px", right: "-1px", bottom: "-2px" },
  { top: "-1px", left: "-3px", right: "0px", bottom: "-1px" },
  { top: "0px", left: "-1px", right: "-2px", bottom: "-3px" },
  { top: "-3px", left: "0px", right: "-2px", bottom: "0px" },
] as const;

interface ShardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  shardCount?: 3 | 4;
  seed?: number;
}

export function ShardButton({
  children,
  className,
  shardCount = 4,
  seed = 0,
  ...props
}: ShardButtonProps) {
  const colors = VORONOI_LIGHT;

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center px-7 py-2.5 font-bold text-white transition-all group outline-none disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {/* Shard layers */}
      {Array.from({ length: shardCount }).map((_, i) => {
        const colorIndex = (seed + i) % colors.length;
        const clipIndex = (seed + i) % SHARD_CLIPS.length;
        const offsetIndex = (seed + i) % SHARD_OFFSETS.length;
        const offset = SHARD_OFFSETS[offsetIndex];

        return (
          <span
            key={i}
            className="absolute transition-all duration-300 ease-out group-hover:scale-[1.04]"
            style={{
              top: offset.top,
              left: offset.left,
              right: offset.right,
              bottom: offset.bottom,
              clipPath: SHARD_CLIPS[clipIndex],
              backgroundColor: colors[colorIndex],
              opacity: 0.35 + i * 0.08,
              transform: `rotate(${(i - 1.5) * 0.8}deg)`,
              border: `1px solid ${colors[colorIndex]}60`,
            }}
          />
        );
      })}

      {/* Text on top */}
      <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
        {children}
      </span>
    </button>
  );
}
