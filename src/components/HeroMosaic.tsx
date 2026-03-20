"use client";

import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Delaunay } from "d3-delaunay";
import { HERO_PALETTE } from "@/constants";

/* ─── Combined bright palette: HERO_PALETTE (skip near-blacks + forest green) + word colors ─── */
const BRIGHT_POOL = [
  ...HERO_PALETTE.filter(
    (c) => !["#0a1121", "#071671", "#0c144c", "#3a4637"].includes(c),
  ),
  "#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF",
  "#FF10F0", "#FF1493", "#4FC3F7", "#FF4500",
];

/* ─── ~58 seed points — weighted: sparse sky, dense horizon, moderate ground ─── */
const SEED_POINTS: [number, number][] = [
  // Sky (sparse, ~12 points)
  [8, 5], [28, 3], [48, 7], [68, 4], [88, 8],
  [15, 18], [35, 15], [55, 20], [75, 16], [92, 19],
  [5, 30], [42, 28],
  // Horizon band (dense, ~24 points)
  [10, 38], [22, 42], [34, 36], [46, 40], [58, 38], [70, 44], [82, 37], [94, 42],
  [6, 48], [18, 52], [30, 46], [42, 54], [54, 48], [66, 52], [78, 50], [90, 46],
  [14, 58], [26, 62], [38, 56], [50, 60], [62, 58], [74, 64], [86, 56], [96, 62],
  // Ground (moderate, ~16 points)
  [8, 72], [24, 70], [40, 74], [56, 68], [72, 72], [88, 70],
  [12, 82], [32, 85], [52, 80], [72, 84], [92, 82],
  [6, 92], [26, 95], [46, 90], [66, 94], [86, 92],
  // Edge coverage (~6 points)
  [2, 2], [98, 2], [2, 98], [98, 98], [50, 1], [50, 99],
];

/* ─── Expand polygon outward from centroid to eliminate hairline gaps ─── */
function expandPolygon(
  polygon: [number, number][],
  cx: number,
  cy: number,
  amount: number,
): [number, number][] {
  return polygon.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return [x, y] as [number, number];
    return [x + (dx / len) * amount, y + (dy / len) * amount] as [number, number];
  });
}

/* ─── Deterministic "random" color from seed index (fallback before image loads) ─── */
function pickColor(index: number): string {
  const scattered = (index * 7 + 3) % BRIGHT_POOL.length;
  return BRIGHT_POOL[scattered];
}

/* ─── Effect settings (user-tuned) ─── */
const EFFECT = {
  strength: 36,
  radius: 500,
  rotateStrength: 3,
  pushTransition: "transform 0.5s cubic-bezier(0.22, 0.8, 0.36, 1)",
  returnTransition: "transform 1.5s cubic-bezier(0.25, 2.5, 0.5, 1)",
};

interface CellData {
  clipPath: string;
  centroid: [number, number];
  color: string;
}

interface EntranceOffset {
  x: number;
  y: number;
  r: number;
  delay: number;
}

export interface HeroMosaicHandle {
  updateMouse: (clientX: number, clientY: number) => void;
  reset: () => void;
}

export const HeroMosaic = forwardRef<HeroMosaicHandle>(function HeroMosaic(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [imageReady, setImageReady] = useState(false);
  const [assembled, setAssembled] = useState(false);

  // Preload hero image
  useEffect(() => {
    const img = new Image();
    img.src = "/hero-sunset.png";
    img.onload = () => setImageReady(true);
  }, []);

  // Trigger assembly after image loads (or after a timeout for fallback)
  useEffect(() => {
    if (imageReady) {
      const timer = setTimeout(() => setAssembled(true), 100);
      return () => clearTimeout(timer);
    }
    // Fallback: assemble with solid colors after 3s if image fails
    const fallback = setTimeout(() => setAssembled(true), 3000);
    return () => clearTimeout(fallback);
  }, [imageReady]);

  const cells = useMemo<CellData[]>(() => {
    const delaunay = Delaunay.from(SEED_POINTS);
    const voronoi = delaunay.voronoi([0, 0, 100, 100]);
    const result: CellData[] = [];

    for (let i = 0; i < SEED_POINTS.length; i++) {
      const polygon = voronoi.cellPolygon(i);
      if (!polygon) continue;

      const n = polygon.length - 1;
      let cx = 0;
      let cy = 0;
      for (let j = 0; j < n; j++) {
        cx += polygon[j][0];
        cy += polygon[j][1];
      }
      cx /= n;
      cy /= n;

      const expanded = expandPolygon(polygon, cx, cy, 0.4);
      const points = expanded.map(([x, y]) => `${x}% ${y}%`).join(", ");

      result.push({
        clipPath: `polygon(${points})`,
        centroid: [cx, cy],
        color: pickColor(i),
      });
    }

    return result;
  }, []);

  // Deterministic entrance offsets (computed once per cell set)
  const entranceOffsets = useMemo<EntranceOffset[]>(() => {
    // Seeded pseudo-random for deterministic scatter
    let seed = 42;
    const rng = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return seed / 2147483647;
    };
    return cells.map(() => ({
      x: (rng() - 0.5) * 120,
      y: (rng() - 0.5) * 120,
      r: (rng() - 0.5) * 25,
      delay: rng() * 0.5,
    }));
  }, [cells]);

  useImperativeHandle(ref, () => ({
    updateMouse(clientX: number, clientY: number) {
      if (!assembled) return;
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      pieceRefs.current.forEach((piece, i) => {
        if (!piece) return;

        const [cxPct, cyPct] = cells[i].centroid;
        const cx = (cxPct / 100) * rect.width;
        const cy = (cyPct / 100) * rect.height;

        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < EFFECT.radius && dist > 0) {
          const force = (1 - dist / EFFECT.radius) * EFFECT.strength;
          const angle = Math.atan2(dy, dx);
          const pushX = -Math.cos(angle) * force;
          const pushY = -Math.sin(angle) * force;
          const pushR =
            (-Math.cos(angle) * force / EFFECT.strength) * EFFECT.rotateStrength;

          piece.style.transition = EFFECT.pushTransition;
          piece.style.transform = `translate(${pushX}px, ${pushY}px) rotate(${pushR}deg)`;
        } else {
          piece.style.transition = EFFECT.returnTransition;
          piece.style.transform = "";
        }
      });
    },

    reset() {
      pieceRefs.current.forEach((piece) => {
        if (!piece) return;
        piece.style.transition = EFFECT.returnTransition;
        piece.style.transform = "";
      });
    },
  }));

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
    >
      {cells.map((cell, i) => {
        const off = entranceOffsets[i];
        return (
          <div
            key={i}
            ref={(el) => {
              pieceRefs.current[i] = el;
            }}
            className="absolute inset-0"
            style={{
              clipPath: cell.clipPath,
              backgroundColor: cell.color,
              backgroundImage: imageReady ? "url(/hero-sunset.png)" : undefined,
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              willChange: "transform",
              opacity: assembled ? 1 : 0,
              transform: assembled
                ? undefined
                : `translate(${off.x}vw, ${off.y}vh) rotate(${off.r}deg) scale(0.85)`,
              transition: assembled
                ? `opacity 1.2s cubic-bezier(0.25, 1, 0.5, 1) ${off.delay}s, transform 1.2s cubic-bezier(0.25, 1, 0.5, 1) ${off.delay}s`
                : "none",
            }}
          />
        );
      })}
    </div>
  );
});
