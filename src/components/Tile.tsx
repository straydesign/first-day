"use client";
import { forwardRef } from "react";
import { SHARD_CLIPS } from "@/constants";

/**
 * Named tile variant sets — each maps to a specific shard clip-path style.
 * Variants rotate through SHARD_CLIPS by index for visual variety.
 */
const TILE_VARIANTS = {
  card: SHARD_CLIPS,
  label: [
    "polygon(0% 0%, 97% 5%, 100% 95%, 3% 100%)",
    "polygon(2% 0%, 98% 3%, 100% 97%, 0% 100%)",
    "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
    "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)",
  ],
  button: [
    "polygon(2% 0%, 100% 4%, 98% 100%, 0% 96%)",
    "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
    "polygon(1% 0%, 100% 3%, 99% 97%, 0% 100%)",
    "polygon(4% 8%, 95% 0%, 100% 85%, 8% 100%)",
  ],
  input: [
    "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)",
    "polygon(0% 2%, 99% 0%, 100% 98%, 1% 100%)",
    "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)",
    "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
  ],
  modal: SHARD_CLIPS,
  menu: [
    "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)",
    "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
    "polygon(1% 0%, 98% 3%, 100% 97%, 2% 100%)",
    "polygon(3% 0%, 100% 4%, 97% 100%, 0% 96%)",
  ],
} as const;

type TileVariant = keyof typeof TILE_VARIANTS;

interface TileProps {
  variant?: TileVariant;
  index?: number;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Tile — unified shard-style container.
 * Applies consistent clip-paths from a named variant set,
 * rotating deterministically by index.
 */
export const Tile = forwardRef<HTMLDivElement, TileProps>(
  function Tile({ variant = "card", index = 0, className = "", children, style }, ref) {
    const clips = TILE_VARIANTS[variant];
    const clipPath = clips[index % clips.length];

    return (
      <div
        ref={ref}
        className={className}
        style={{ clipPath, ...style }}
      >
        {children}
      </div>
    );
  }
);
