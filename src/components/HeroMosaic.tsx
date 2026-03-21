"use client";

import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Delaunay } from "d3-delaunay";
import { HERO_PALETTE } from "@/constants";

/* ─── Combined bright palette ─── */
const BRIGHT_POOL = [
  ...HERO_PALETTE.filter(
    (c) => !["#0a1121", "#071671", "#0c144c", "#3a4637"].includes(c),
  ),
  "#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF",
  "#FF10F0", "#FF1493", "#4FC3F7", "#FF4500",
];

/* ─── ~58 seed points — weighted: sparse sky, dense horizon, moderate ground ─── */
const SEED_POINTS: [number, number][] = [
  [8, 5], [28, 3], [48, 7], [68, 4], [88, 8],
  [15, 18], [35, 15], [55, 20], [75, 16], [92, 19],
  [5, 30], [42, 28],
  [10, 38], [22, 42], [34, 36], [46, 40], [58, 38], [70, 44], [82, 37], [94, 42],
  [6, 48], [18, 52], [30, 46], [42, 54], [54, 48], [66, 52], [78, 50], [90, 46],
  [14, 58], [26, 62], [38, 56], [50, 60], [62, 58], [74, 64], [86, 56], [96, 62],
  [8, 72], [24, 70], [40, 74], [56, 68], [72, 72], [88, 70],
  [12, 82], [32, 85], [52, 80], [72, 84], [92, 82],
  [6, 92], [26, 95], [46, 90], [66, 94], [86, 92],
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

function pickColor(index: number): string {
  const scattered = (index * 7 + 3) % BRIGHT_POOL.length;
  return BRIGHT_POOL[scattered];
}

/* ─── Drift settings ─── */
const DRIFT = {
  amplitude: 24,      // px max translate
  rotateAmp: 5,       // deg max rotation
  baseSpeed: 0.002,   // radians per ms — visible organic drift
};

/* ─── Click pulse settings ─── */
const PULSE = {
  radius: 400,        // px — how far the pulse reaches
  strength: 28,       // px — max push distance
  rotateStrength: 4,  // deg
  duration: 1200,     // ms — how long the pulse lasts
};

interface CellData {
  clipPath: string;
  centroid: [number, number];
  color: string;
}

/* ─── Per-piece drift parameters (deterministic) ─── */
interface DriftParams {
  freqX: number;
  freqY: number;
  freqR: number;
  phaseX: number;
  phaseY: number;
  phaseR: number;
  ampX: number;
  ampY: number;
  ampR: number;
}

interface PulseEvent {
  x: number;      // px relative to container
  y: number;
  startTime: number;
}

export function HeroMosaic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const pulsesRef = useRef<PulseEvent[]>([]);
  const [imageReady, setImageReady] = useState(false);
  const [assembled, setAssembled] = useState(false);

  // Preload hero image
  useEffect(() => {
    const img = new Image();
    img.src = "/hero-sunset.png";
    img.onload = () => setImageReady(true);
  }, []);

  // Trigger assembly after image loads
  useEffect(() => {
    if (imageReady) {
      const timer = setTimeout(() => setAssembled(true), 100);
      return () => clearTimeout(timer);
    }
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

  // Deterministic entrance offsets
  const entranceOffsets = useMemo(() => {
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

  // Per-piece drift parameters (unique frequencies so they don't move in unison)
  const driftParams = useMemo<DriftParams[]>(() => {
    let seed = 137;
    const rng = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return seed / 2147483647;
    };
    return cells.map(() => ({
      freqX: DRIFT.baseSpeed * (0.7 + rng() * 0.6),
      freqY: DRIFT.baseSpeed * (0.7 + rng() * 0.6),
      freqR: DRIFT.baseSpeed * (0.5 + rng() * 0.5),
      phaseX: rng() * Math.PI * 2,
      phaseY: rng() * Math.PI * 2,
      phaseR: rng() * Math.PI * 2,
      ampX: DRIFT.amplitude * (0.5 + rng() * 0.5),
      ampY: DRIFT.amplitude * (0.5 + rng() * 0.5),
      ampR: DRIFT.rotateAmp * (0.5 + rng() * 0.5),
    }));
  }, [cells]);

  // Click pulse handler — listen for clicks anywhere on the page
  const handleClick = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container || !assembled) return;

    const rect = container.getBoundingClientRect();
    pulsesRef.current.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      startTime: performance.now(),
    });
  }, [assembled]);

  // Autonomous drift animation loop + click pulse
  useEffect(() => {
    if (!assembled) return;

    // Wait for entrance transitions to finish before starting drift
    const startDelay = setTimeout(() => {
      const animate = (now: number) => {
        const container = containerRef.current;
        if (!container) {
          rafRef.current = requestAnimationFrame(animate);
          return;
        }

        const rect = container.getBoundingClientRect();

        // Clean up expired pulses
        pulsesRef.current = pulsesRef.current.filter(
          (p) => now - p.startTime < PULSE.duration,
        );

        pieceRefs.current.forEach((piece, i) => {
          if (!piece) return;

          const dp = driftParams[i];

          // Layered sine waves for organic drift
          const dx =
            Math.sin(now * dp.freqX + dp.phaseX) * dp.ampX +
            Math.sin(now * dp.freqX * 1.7 + dp.phaseX + 1) * dp.ampX * 0.3;
          const dy =
            Math.sin(now * dp.freqY + dp.phaseY) * dp.ampY +
            Math.cos(now * dp.freqY * 1.3 + dp.phaseY + 2) * dp.ampY * 0.3;
          const dr =
            Math.sin(now * dp.freqR + dp.phaseR) * dp.ampR;

          // Add click pulse offsets
          let pulseX = 0;
          let pulseY = 0;
          let pulseR = 0;

          const [cxPct, cyPct] = cells[i].centroid;
          const cx = (cxPct / 100) * rect.width;
          const cy = (cyPct / 100) * rect.height;

          for (const pulse of pulsesRef.current) {
            const pdx = pulse.x - cx;
            const pdy = pulse.y - cy;
            const dist = Math.sqrt(pdx * pdx + pdy * pdy);

            if (dist < PULSE.radius && dist > 0) {
              const elapsed = now - pulse.startTime;
              const t = elapsed / PULSE.duration;
              // Ease out with overshoot then settle
              const falloff = Math.pow(1 - t, 2);
              const force = (1 - dist / PULSE.radius) * PULSE.strength * falloff;
              const angle = Math.atan2(pdy, pdx);

              pulseX += -Math.cos(angle) * force;
              pulseY += -Math.sin(angle) * force;
              pulseR += (-Math.cos(angle) * force / PULSE.strength) * PULSE.rotateStrength * falloff;
            }
          }

          piece.style.transform =
            `translate(${dx + pulseX}px, ${dy + pulseY}px) rotate(${dr + pulseR}deg)`;
        });

        rafRef.current = requestAnimationFrame(animate);
      };

      rafRef.current = requestAnimationFrame(animate);
    }, 1800); // Wait for entrance animation to finish

    // Listen for clicks
    window.addEventListener("click", handleClick);

    return () => {
      clearTimeout(startDelay);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("click", handleClick);
    };
  }, [assembled, cells, driftParams, handleClick]);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      cancelAnimationFrame(rafRef.current);
    }
  }, [assembled]);

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
}
