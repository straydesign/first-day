"use client";

import { cn } from "@/lib/utils";
import { VoronoiMosaic } from "./VoronoiMosaic";
import { VORONOI_LIGHT } from "@/constants";

/** Irregular clip-paths for each shard — no two alike */
const SHARD_CLIPS = [
  "polygon(4% 8%, 95% 0%, 100% 85%, 8% 100%)",
  "polygon(0% 5%, 92% 0%, 98% 92%, 3% 95%)",
  "polygon(6% 0%, 100% 10%, 94% 100%, 0% 88%)",
  "polygon(2% 12%, 97% 3%, 100% 90%, 5% 100%)",
] as const;

/** Slight positional offsets so shards overlap with depth */
const SHARD_OFFSETS = [
  { top: "-3px", left: "-2px", right: "-2px", bottom: "-3px" },
  { top: "-2px", left: "-4px", right: "1px",  bottom: "-1px" },
  { top: "1px",  left: "-1px", right: "-3px", bottom: "-4px" },
  { top: "-4px", left: "1px",  right: "-3px", bottom: "0px" },
] as const;

const SIZE_CLASSES = {
  sm: "h-10 px-6 text-sm",
  default: "h-12 px-8 text-base",
  lg: "h-14 px-10 text-lg",
} as const;

interface ShardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  shardCount?: 3 | 4;
  seed?: number;
  size?: "sm" | "default" | "lg";
}

export function ShardButton({
  children,
  className,
  shardCount = 4,
  seed = 0,
  size = "default",
  ...props
}: ShardButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center font-bold text-white transition-all group outline-none disabled:pointer-events-none disabled:opacity-50",
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {/* Each shard: VoronoiMosaic fill + irregular clip + transparency */}
      {Array.from({ length: shardCount }).map((_, i) => {
        const clipIndex = (seed + i) % SHARD_CLIPS.length;
        const offsetIndex = (seed + i) % SHARD_OFFSETS.length;
        const offset = SHARD_OFFSETS[offsetIndex];
        const palette = [VORONOI_LIGHT[(seed + i) % VORONOI_LIGHT.length]];

        return (
          <span
            key={i}
            className="absolute overflow-hidden transition-all duration-300 ease-out group-hover:scale-[1.06]"
            style={{
              top: offset.top,
              left: offset.left,
              right: offset.right,
              bottom: offset.bottom,
              clipPath: SHARD_CLIPS[clipIndex],
              opacity: 0.4 + i * 0.1,
              transform: `rotate(${(i - 1.5) * 0.7}deg)`,
            }}
          >
            <VoronoiMosaic
              seed={seed * 10 + i * 7}
              tileCount={12}
              margin={2}
              gap={1}
              palette={palette}
              className="absolute inset-0 w-full h-full"
            />
            <span
              className="absolute inset-0"
              style={{ border: `1px solid ${VORONOI_LIGHT[(seed + i) % VORONOI_LIGHT.length]}50` }}
            />
          </span>
        );
      })}

      {/* Text on top of all shards */}
      <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
        {children}
      </span>
    </button>
  );
}
