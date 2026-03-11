"use client";
import { useMemo } from "react";

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
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function MosaicBackground({
  density = 8,
  opacity = 0.04,
  className = "",
}: MosaicBackgroundProps) {
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
        const seed = row * density + col;

        // Each cell splits into 2 triangles along the diagonal
        const jitter = (s: number) => seededRandom(s) * cellW * 0.3;

        const tl = `${x + jitter(seed)},${y + jitter(seed + 1)}`;
        const tr = `${x + cellW + jitter(seed + 2)},${y + jitter(seed + 3)}`;
        const bl = `${x + jitter(seed + 4)},${y + cellH + jitter(seed + 5)}`;
        const br = `${x + cellW + jitter(seed + 6)},${y + cellH + jitter(seed + 7)}`;

        const color1 = ACCENT_COLORS[Math.floor(seededRandom(seed + 10) * ACCENT_COLORS.length)];
        const color2 = ACCENT_COLORS[Math.floor(seededRandom(seed + 20) * ACCENT_COLORS.length)];

        const triOpacity1 = 0.3 + seededRandom(seed + 30) * 0.7;
        const triOpacity2 = 0.3 + seededRandom(seed + 40) * 0.7;

        result.push(
          { points: `${tl} ${tr} ${br}`, fill: color1, opacity: triOpacity1 },
          { points: `${tl} ${br} ${bl}`, fill: color2, opacity: triOpacity2 }
        );
      }
    }

    return result;
  }, [density]);

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
