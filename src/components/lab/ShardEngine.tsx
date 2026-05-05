"use client";

/**
 * ShardEngine — the unified shard primitive for First Day.
 *
 * Renders N animated shards and moves them between states:
 *   - `scattered`  → drifting randomly as a background layer
 *   - `exploding`  → flying outward from center, fading
 *   - `assembling` → moving into a target formation (grid, voronoi, freeform)
 *
 * `target.type === 'tiled'` is a special mode: all shards fill `inset-0`
 * and are clipped by their clipPath (no position offsets). Use this for
 * week-square mosaic rendering (ShardRewardGrid / ShardSquare).
 *
 * Every shard/tile/confetti/mosaic render in the app should eventually
 * route through this component so the visual language stays unified.
 *
 * 2D only for now — framer-motion handles all transitions.
 * r3f/3D assembly will be added under `target.type === '3d'` later.
 */

import { useMemo, type ReactNode } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { TOKENS } from "@/tokens";

export type ShardState = "scattered" | "exploding" | "assembling";

export type ShardTarget =
  | { type: "grid"; rows: number; cols: number; gap?: number }
  | { type: "voronoi" }
  | {
      type: "freeform";
      positions: Array<{
        x: number;
        y: number;
        rotation?: number;
        scale?: number;
        color?: string;
      }>;
    }
  | {
      /**
       * Tiled mode: each shard fills the container (inset-0) and is clipped
       * by its clipPath. Used for week-square mosaics where clip-paths divide
       * the container into interlocking cells.
       */
      type: "tiled";
    };

/**
 * Per-shard overrides for tiled/freeform modes.
 * Allows locked/unlocked state, animating-shard highlight, and custom colors.
 */
export interface ShardOverride {
  /** Override the shard color (e.g. locked = dark, unlocked = bright). */
  color?: string;
  /** Override opacity for this shard. */
  opacity?: number;
  /**
   * When true, shard springs in from scale:3 → scale:1.
   * Maps to ShardSquare's `animatingDay` behavior.
   */
  animating?: boolean;
}

export interface ShardEngineProps {
  /** Number of shards. Ignored if `target.type === 'freeform'` (uses positions.length). */
  count?: number;
  /** Colors to cycle through. Defaults to TOKENS.colors.bright. */
  palette?: readonly string[];
  /** Clip-path polygons to rotate through. Defaults to TOKENS.clipPaths.shard. */
  clipPaths?: readonly string[];
  /** Shard size range in px (width = height). */
  sizeRange?: [number, number];
  /** Animation state. */
  state: ShardState;
  /** Target formation for `assembling` state. */
  target?: ShardTarget;
  /** Stable seed so positions are deterministic across renders. */
  seed?: number;
  /** Apply a blur on scattered state (background mode). */
  blurPx?: number;
  /** Scattered shards drift slowly when true. */
  drift?: boolean;
  /** Max opacity (scattered background often wants 0.3–0.6). */
  maxOpacity?: number;
  /** Forward class for the container. Absolute-positioned inside. */
  className?: string;

  // ── Tiled-mode extensions ──────────────────────────────────────
  /**
   * Fixed pixel size for the container (width = height). When set, the
   * container uses `position: relative` with explicit dimensions instead
   * of `absolute inset-0`. Required for tiled mode in a flex row.
   */
  containerSize?: number;
  /**
   * Per-shard color/opacity/animation overrides. Index matches the clipPaths
   * array order. Used in tiled mode for locked/unlocked/animating states.
   */
  shardOverrides?: ShardOverride[];
  /**
   * ReactNode rendered on top of all shards (e.g. trophy badge for a
   * completed week). Requires `containerSize` or an ancestor that provides
   * positioning context.
   */
  overlay?: ReactNode;
}

// ── Seeded PRNG (mulberry32) ────────────────────────────────────
function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ShardSeed {
  id: number;
  baseX: number;      // 0–100 (percent)
  baseY: number;      // 0–100 (percent)
  size: number;       // px
  color: string;
  clip: string;
  rotation: number;   // deg
  driftOffsetX: number;
  driftOffsetY: number;
  driftDuration: number;
}

function seedShards(
  count: number,
  palette: readonly string[],
  clipPaths: readonly string[],
  sizeRange: [number, number],
  seed: number,
): ShardSeed[] {
  const rand = mulberry32(seed);
  const [minSize, maxSize] = sizeRange;
  return Array.from({ length: count }, (_, id) => ({
    id,
    baseX: rand() * 100,
    baseY: rand() * 100,
    size: minSize + rand() * (maxSize - minSize),
    color: palette[Math.floor(rand() * palette.length)],
    clip: clipPaths[Math.floor(rand() * clipPaths.length)],
    rotation: rand() * 360,
    driftOffsetX: (rand() - 0.5) * 30,
    driftOffsetY: (rand() - 0.5) * 30,
    driftDuration: 8 + rand() * 6,
  }));
}

// ── Target position resolution ──────────────────────────────────
interface TargetSlot {
  x: number;         // 0–100 (percent)
  y: number;         // 0–100 (percent)
  rotation: number;  // deg
  scale: number;
  color?: string;
}

function resolveTarget(
  target: ShardTarget | undefined,
  count: number,
): TargetSlot[] {
  if (!target) {
    return Array.from({ length: count }, () => ({
      x: 50,
      y: 50,
      rotation: 0,
      scale: 1,
    }));
  }

  if (target.type === "grid") {
    const { rows, cols, gap = 2 } = target;
    const cellW = (100 - gap * (cols - 1)) / cols;
    const cellH = (100 - gap * (rows - 1)) / rows;
    const slots: TargetSlot[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        slots.push({
          x: c * (cellW + gap) + cellW / 2,
          y: r * (cellH + gap) + cellH / 2,
          rotation: 0,
          scale: 1,
        });
      }
    }
    return slots.slice(0, count);
  }

  if (target.type === "voronoi") {
    // 7-slab voronoi — centers derived from SHARD_SQUARE_CLIPS cells
    const centers: Array<[number, number]> = [
      [15, 15], [50, 12], [85, 18],
      [22, 48], [75, 45],
      [22, 82], [75, 82],
    ];
    return centers.slice(0, count).map(([x, y]) => ({
      x,
      y,
      rotation: 0,
      scale: 1.4,
    }));
  }

  if (target.type === "tiled") {
    // Tiled mode doesn't use slot positions — shards fill inset-0.
    // Return dummy slots so indices stay in sync.
    return Array.from({ length: count }, () => ({
      x: 50,
      y: 50,
      rotation: 0,
      scale: 1,
    }));
  }

  // freeform
  return target.positions.map((p) => ({
    x: p.x,
    y: p.y,
    rotation: p.rotation ?? 0,
    scale: p.scale ?? 1,
    color: p.color,
  }));
}

// ── Per-state variants ──────────────────────────────────────────
const SPRING_GENTLE: Transition = { type: "spring", stiffness: 260, damping: 26 };

export function ShardEngine({
  count = 40,
  palette = TOKENS.colors.bright,
  clipPaths = TOKENS.clipPaths.shard,
  sizeRange = [24, 72],
  state,
  target,
  seed = 42,
  blurPx = 0,
  drift = true,
  maxOpacity = 1,
  className = "",
  containerSize,
  shardOverrides,
  overlay,
}: ShardEngineProps) {
  const isTiled = target?.type === "tiled";

  // For freeform targets, count comes from positions length.
  // For tiled, count comes from clipPaths length (one shard per clip cell).
  const effectiveCount = isTiled
    ? clipPaths.length
    : target?.type === "freeform"
    ? target.positions.length
    : count;

  const shards = useMemo(
    () => seedShards(effectiveCount, palette, clipPaths, sizeRange, seed),
    [effectiveCount, palette, clipPaths, sizeRange, seed],
  );

  const slots = useMemo(
    () => resolveTarget(target, effectiveCount),
    [target, effectiveCount],
  );

  // Container style — fixed size vs absolute fill
  const containerStyle: React.CSSProperties = containerSize
    ? {
        position: "relative",
        width: containerSize,
        height: containerSize,
        overflow: "hidden",
        filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
      }
    : {
        filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
      };

  const containerClass = containerSize
    ? className
    : `absolute inset-0 overflow-hidden pointer-events-none ${className}`;

  return (
    <div className={containerClass} style={containerStyle}>
      <AnimatePresence>
        {shards.map((shard, i) => {
          const slot = slots[i] ?? slots[slots.length - 1];
          const override = shardOverrides?.[i];
          const resolvedColor = override?.color ?? slot.color ?? shard.color;
          const resolvedOpacity = override?.opacity ?? maxOpacity;
          const isAnimating = override?.animating ?? false;

          if (isTiled) {
            // Tiled mode: each shard fills the container, clipped by its clip-path.
            // The clip-path index matches `i` directly (not from seedShards random).
            const clipPath = clipPaths[i] ?? shard.clip;
            return (
              <motion.div
                key={shard.id}
                className="absolute inset-0"
                style={{
                  clipPath,
                  WebkitClipPath: clipPath,
                  backgroundColor: resolvedColor,
                  willChange: isAnimating ? "transform, opacity" : undefined,
                }}
                initial={isAnimating ? { scale: 3, opacity: 0 } : false}
                animate={
                  isAnimating
                    ? { scale: 1, opacity: resolvedOpacity }
                    : { opacity: resolvedOpacity }
                }
                transition={
                  isAnimating
                    ? { type: "spring", stiffness: 300, damping: 20, delay: 0.3 }
                    : undefined
                }
              />
            );
          }

          const animateProps = computeAnimate(state, shard, slot, resolvedOpacity, drift);
          const transition = computeTransition(state, i);
          return (
            <motion.div
              key={shard.id}
              initial={false}
              animate={animateProps}
              exit={{ opacity: 0, scale: 0 }}
              transition={transition}
              style={{
                position: "absolute",
                width: shard.size,
                height: shard.size,
                marginLeft: -shard.size / 2,
                marginTop: -shard.size / 2,
                backgroundColor: resolvedColor,
                clipPath: shard.clip,
                WebkitClipPath: shard.clip,
                willChange: "transform, opacity",
              }}
            />
          );
        })}
      </AnimatePresence>
      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {overlay}
        </div>
      )}
    </div>
  );
}

function computeAnimate(
  state: ShardState,
  shard: ShardSeed,
  slot: TargetSlot,
  maxOpacity: number,
  drift: boolean,
) {
  if (state === "exploding") {
    const angle = Math.atan2(shard.baseY - 50, shard.baseX - 50);
    const distance = 80; // percent units of parent
    return {
      left: `${shard.baseX + Math.cos(angle) * distance}%`,
      top: `${shard.baseY + Math.sin(angle) * distance}%`,
      rotate: shard.rotation + 360,
      scale: 0.4,
      opacity: 0,
    };
  }

  if (state === "assembling") {
    return {
      left: `${slot.x}%`,
      top: `${slot.y}%`,
      rotate: slot.rotation,
      scale: slot.scale,
      opacity: maxOpacity,
    };
  }

  // scattered (default)
  return {
    left: drift
      ? [
          `${shard.baseX}%`,
          `${shard.baseX + shard.driftOffsetX}%`,
          `${shard.baseX}%`,
        ]
      : `${shard.baseX}%`,
    top: drift
      ? [
          `${shard.baseY}%`,
          `${shard.baseY + shard.driftOffsetY}%`,
          `${shard.baseY}%`,
        ]
      : `${shard.baseY}%`,
    rotate: shard.rotation,
    scale: 1,
    opacity: maxOpacity,
  };
}

function computeTransition(state: ShardState, index: number): Transition {
  if (state === "exploding") {
    return {
      duration: 0.9,
      ease: [0.22, 0.8, 0.3, 1],
      delay: index * 0.008,
    };
  }
  if (state === "assembling") {
    return {
      ...SPRING_GENTLE,
      delay: 0.3 + index * 0.04,
    };
  }
  // scattered — slow continuous drift (tween, not spring — needs 3 keyframes)
  return {
    duration: 12,
    ease: "easeInOut",
    repeat: Infinity,
    repeatType: "loop" as const,
  };
}
