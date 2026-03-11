"use client";
import { memo, useMemo } from "react";

const BRIGHT_COLORS = [
  "#7cff67", "#00c7fc", "#5227FF", "#cc5533",
  "#b5a6ff", "#ff6b6b", "#c8ffbe", "#a3e2fd",
];

const DARK_COLORS = [
  "#0a0a1e", "#12122e", "#1a1a3e", "#1e1e45", "#242450",
];

/** Legacy palette for backwards compatibility when no mode/safeZone set. */
const ACCENT_COLORS = [
  "#cc5533", "#c8ffbe", "#a3e2fd", "#b5a6ff", "#ff6b6b",
];

export interface SafeZone {
  yStart: number;
  yEnd: number;
  bleedProbability?: number;
}

interface MosaicBackgroundProps {
  density?: number;
  opacity?: number;
  className?: string;
  seed?: number;
  colorSubset?: string[];
  safeZone?: SafeZone | null;
  mode?: "dual-zone" | "bright-only" | "dark-only";
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function MosaicBackgroundInner({
  density = 8,
  opacity = 0.85,
  className = "",
  seed = 0,
  colorSubset,
  safeZone,
  mode,
}: MosaicBackgroundProps) {
  const triangles = useMemo(() => {
    const result: Array<{
      points: string;
      fill: string;
      opacity: number;
    }> = [];

    const cellW = 100 / density;
    const cellH = 100 / density;

    // Determine coloring strategy
    const useDualZone = mode === "dual-zone" || (safeZone != null && mode == null);
    const useBrightOnly = mode === "bright-only";
    const useDarkOnly = mode === "dark-only";

    // Pick palette
    let palette: string[];
    if (colorSubset) {
      palette = colorSubset;
    } else if (useBrightOnly) {
      palette = BRIGHT_COLORS;
    } else if (useDarkOnly) {
      palette = DARK_COLORS;
    } else if (!useDualZone) {
      palette = ACCENT_COLORS;
    } else {
      palette = BRIGHT_COLORS; // won't be used directly in dual-zone
    }

    const zone = useDualZone
      ? (safeZone ?? { yStart: 0.2, yEnd: 0.8, bleedProbability: 0.15 })
      : null;

    for (let row = 0; row < density; row++) {
      for (let col = 0; col < density; col++) {
        const x = col * cellW;
        const y = row * cellH;
        const cellSeed = seed + row * density + col;

        const jitter = (s: number) => seededRandom(s) * cellW * 0.3;

        const tl = `${x + jitter(cellSeed)},${y + jitter(cellSeed + 1)}`;
        const tr = `${x + cellW + jitter(cellSeed + 2)},${y + jitter(cellSeed + 3)}`;
        const bl = `${x + jitter(cellSeed + 4)},${y + cellH + jitter(cellSeed + 5)}`;
        const br = `${x + cellW + jitter(cellSeed + 6)},${y + cellH + jitter(cellSeed + 7)}`;

        // Cell center Y normalized 0-1
        const centerY = (y + cellH / 2) / 100;

        let color1: string;
        let color2: string;
        let triOpacity1: number;
        let triOpacity2: number;

        if (zone) {
          const bleedProb = zone.bleedProbability ?? 0.15;
          const inDarkZone = centerY >= zone.yStart && centerY <= zone.yEnd;
          const nearBoundary =
            Math.abs(centerY - zone.yStart) < 0.08 ||
            Math.abs(centerY - zone.yEnd) < 0.08;

          // Determine if this cell bleeds into the opposite zone
          const bleeds = nearBoundary && seededRandom(cellSeed + 50) < bleedProb;

          if (inDarkZone && !bleeds) {
            // Dark zone — high opacity dark tiles
            color1 = DARK_COLORS[Math.floor(seededRandom(cellSeed + 10) * DARK_COLORS.length)];
            color2 = DARK_COLORS[Math.floor(seededRandom(cellSeed + 20) * DARK_COLORS.length)];
            triOpacity1 = 0.8 + seededRandom(cellSeed + 30) * 0.2;
            triOpacity2 = 0.8 + seededRandom(cellSeed + 40) * 0.2;
          } else if (!inDarkZone && !bleeds) {
            // Bright zone — vivid accent tiles
            color1 = BRIGHT_COLORS[Math.floor(seededRandom(cellSeed + 10) * BRIGHT_COLORS.length)];
            color2 = BRIGHT_COLORS[Math.floor(seededRandom(cellSeed + 20) * BRIGHT_COLORS.length)];
            triOpacity1 = 0.6 + seededRandom(cellSeed + 30) * 0.4;
            triOpacity2 = 0.6 + seededRandom(cellSeed + 40) * 0.4;
          } else {
            // Bleed — opposite zone colors for organic transition
            if (inDarkZone) {
              color1 = BRIGHT_COLORS[Math.floor(seededRandom(cellSeed + 10) * BRIGHT_COLORS.length)];
              color2 = BRIGHT_COLORS[Math.floor(seededRandom(cellSeed + 20) * BRIGHT_COLORS.length)];
              triOpacity1 = 0.4 + seededRandom(cellSeed + 30) * 0.3;
              triOpacity2 = 0.4 + seededRandom(cellSeed + 40) * 0.3;
            } else {
              color1 = DARK_COLORS[Math.floor(seededRandom(cellSeed + 10) * DARK_COLORS.length)];
              color2 = DARK_COLORS[Math.floor(seededRandom(cellSeed + 20) * DARK_COLORS.length)];
              triOpacity1 = 0.6 + seededRandom(cellSeed + 30) * 0.3;
              triOpacity2 = 0.6 + seededRandom(cellSeed + 40) * 0.3;
            }
          }
        } else {
          // Legacy/simple mode
          color1 = palette[Math.floor(seededRandom(cellSeed + 10) * palette.length)];
          color2 = palette[Math.floor(seededRandom(cellSeed + 20) * palette.length)];
          triOpacity1 = 0.3 + seededRandom(cellSeed + 30) * 0.7;
          triOpacity2 = 0.3 + seededRandom(cellSeed + 40) * 0.7;
        }

        result.push(
          { points: `${tl} ${tr} ${br}`, fill: color1, opacity: triOpacity1 },
          { points: `${tl} ${br} ${bl}`, fill: color2, opacity: triOpacity2 }
        );
      }
    }

    return result;
  }, [density, seed, colorSubset, safeZone, mode]);

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ opacity }}
      aria-hidden="true"
    >
      {triangles.map((tri, i) => (
        <polygon
          key={i}
          points={tri.points}
          fill={tri.fill}
          opacity={tri.opacity}
        />
      ))}
    </svg>
  );
}

export const MosaicBackground = memo(MosaicBackgroundInner);
