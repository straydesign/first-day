"use client";

import { useRef, useMemo, useImperativeHandle, forwardRef } from "react";
import { Delaunay } from "d3-delaunay";
import { HERO_PALETTE } from "@/constants";

/* ─── Combined bright palette: HERO_PALETTE (skip near-blacks + forest green) + word colors ─── */
const BRIGHT_POOL = [
  // HERO_PALETTE minus the 3 near-blacks (#0a1121, #071671, #0c144c) and forest green (#3a4637)
  ...HERO_PALETTE.filter(
    (c) => !["#0a1121", "#071671", "#0c144c", "#3a4637"].includes(c),
  ),
  // Tagline word colors (some overlap with HERO_PALETTE, that's fine — increases their weight)
  "#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF",
  "#FF10F0", "#FF1493", "#4FC3F7", "#FF4500",
];

/* ─── ~30 seed points for full-viewport coverage ─── */
const SEED_POINTS: [number, number][] = [
  // Row 1
  [6, 6],   [22, 4],  [38, 8],  [54, 5],  [70, 7],  [86, 4],  [96, 10],
  // Row 2
  [10, 22], [30, 20], [48, 24], [66, 19], [84, 23],
  // Row 3
  [5, 38],  [24, 40], [42, 36], [60, 42], [78, 37], [95, 40],
  // Row 4
  [14, 56], [34, 58], [52, 54], [72, 57], [90, 55],
  // Row 5
  [8, 72],  [28, 74], [46, 70], [64, 75], [82, 71],
  // Row 6
  [12, 88], [36, 92], [56, 86], [76, 90], [94, 88],
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

/* ─── Deterministic "random" color from seed index ─── */
function pickColor(index: number): string {
  // Simple hash-like scatter to avoid adjacent cells getting similar colors
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

export interface HeroMosaicHandle {
  updateMouse: (clientX: number, clientY: number) => void;
  reset: () => void;
}

export const HeroMosaic = forwardRef<HeroMosaicHandle>(function HeroMosaic(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);

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

      // Expand polygon slightly outward to eliminate hairline gaps between cells
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

  useImperativeHandle(ref, () => ({
    updateMouse(clientX: number, clientY: number) {
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
      {cells.map((cell, i) => (
        <div
          key={i}
          ref={(el) => {
            pieceRefs.current[i] = el;
          }}
          className="absolute inset-0"
          style={{
            clipPath: cell.clipPath,
            backgroundColor: cell.color,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
});
