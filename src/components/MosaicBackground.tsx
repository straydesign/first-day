"use client";
import { memo, useMemo } from "react";

const ACCENT_COLORS = [
  "#cc5533",
  "#c8ffbe",
  "#a3e2fd",
  "#b5a6ff",
  "#ff6b6b",
];

interface MosaicBackgroundProps {
  density?: number;
  opacity?: number;
  className?: string;
  seed?: number;
  colorSubset?: string[];
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function MosaicBackgroundInner({
  density = 8,
  opacity = 0.04,
  className = "",
  seed = 0,
  colorSubset,
}: MosaicBackgroundProps) {
  const colors = colorSubset ?? ACCENT_COLORS;

  const triangles = useMemo(() => {
    const result: Array<{
      points: string;
      fill: string;
      opacity: number;
    }> = [];

    const cellW = 100 / density;
    const cellH = 100 / density;

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

        const color1 = colors[Math.floor(seededRandom(cellSeed + 10) * colors.length)];
        const color2 = colors[Math.floor(seededRandom(cellSeed + 20) * colors.length)];

        const triOpacity1 = 0.3 + seededRandom(cellSeed + 30) * 0.7;
        const triOpacity2 = 0.3 + seededRandom(cellSeed + 40) * 0.7;

        result.push(
          { points: `${tl} ${tr} ${br}`, fill: color1, opacity: triOpacity1 },
          { points: `${tl} ${br} ${bl}`, fill: color2, opacity: triOpacity2 }
        );
      }
    }

    return result;
  }, [density, seed, colors]);

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
