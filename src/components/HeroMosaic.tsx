"use client";

import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { HERO_MOSAIC_TILES, type MosaicTile } from "@/data/hero-mosaic-tiles";

/* ─── Drift settings — subtle breathing for floating tiles ─── */
const DRIFT = {
  amplitude: 4,
  rotateAmp: 0.8,
  baseSpeed: 0.0004,
};

/* ─── Click pulse ─── */
const PULSE = {
  radius: 320,
  strength: 14,
  rotateStrength: 1.4,
  duration: 950,
};

/* ─── Cursor magnet — tiles part around the cursor as it moves ─── */
const MAGNET = {
  radius: 240,
  strength: 6,
  smoothing: 0.08,
};

/* ─── Scroll parallax — tiles drift at varied rates as the page scrolls ─── */
const PARALLAX = {
  yMin: 0.05,        // slowest tile moves at 5% of scroll
  yMax: 0.32,        // fastest tile moves at 32% of scroll
  rotateMax: 0.018,  // max rotation in degrees per pixel scrolled
  fadeStart: 80,     // px scrolled before mosaic begins fading
  fadeEnd: 720,      // px scrolled when mosaic reaches min opacity
  fadeMin: 0.35,     // floor opacity so it never disappears completely
};

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
  x: number;
  y: number;
  startTime: number;
}

function polygonClipPath(verts: [number, number][]): string {
  return `polygon(${verts.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  return isMobile;
}

export function HeroMosaic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const pulsesRef = useRef<PulseEvent[]>([]);
  const cursorRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const smoothCursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const scrollYRef = useRef(0);
  const [assembled, setAssembled] = useState(false);
  const isMobile = useIsMobile();

  // Static tiles render below floating ones — drawn as a separate frozen list
  const { staticTiles, floatingTiles } = useMemo(() => {
    const s: MosaicTile[] = [];
    const f: MosaicTile[] = [];
    for (const t of HERO_MOSAIC_TILES) (t.floating ? f : s).push(t);
    return { staticTiles: s, floatingTiles: f };
  }, []);

  // Static tile clip-paths — computed once, never animated
  const staticData = useMemo(() =>
    staticTiles.map((t) => ({
      ...t,
      clipPath: polygonClipPath(t.verts),
    })),
  [staticTiles]);

  // Floating tile clip-paths + viewport-relative centroids for cursor math
  const floatingData = useMemo(() =>
    floatingTiles.map((t) => {
      const cxLocal =
        t.verts.reduce((s, p) => s + p[0], 0) / t.verts.length;
      const cyLocal =
        t.verts.reduce((s, p) => s + p[1], 0) / t.verts.length;
      const centroidPct: [number, number] = [
        t.leftPct + (cxLocal / 100) * t.widthPct,
        t.topPct + (cyLocal / 100) * t.heightPct,
      ];
      return {
        ...t,
        clipPath: polygonClipPath(t.verts),
        centroidPct,
      };
    }),
  [floatingTiles]);

  useEffect(() => {
    const t = setTimeout(() => setAssembled(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Container fade on scroll — runs always (mobile + reduced-motion fallback).
  // The desktop rAF loop overrides this each frame, which is fine.
  useEffect(() => {
    const apply = () => {
      const container = containerRef.current;
      if (!container) return;
      const sy = window.scrollY;
      const fadeT = Math.min(
        1,
        Math.max(0, (sy - PARALLAX.fadeStart) / (PARALLAX.fadeEnd - PARALLAX.fadeStart)),
      );
      container.style.opacity = String(1 - fadeT * (1 - PARALLAX.fadeMin));
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    return () => window.removeEventListener("scroll", apply);
  }, []);

  // Entrance offsets for floating tiles (off-screen drift-in)
  const entranceOffsets = useMemo(() => {
    let seed = 17;
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    return floatingData.map(() => ({
      x: (rng() - 0.5) * 80,
      y: (rng() - 0.5) * 80,
      r: (rng() - 0.5) * 30,
      delay: rng() * 0.7,
    }));
  }, [floatingData]);

  // Per-tile parallax factors — deterministic, mapped to PARALLAX.yMin..yMax
  const parallaxFactors = useMemo<number[]>(() => {
    let seed = 31337;
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    return floatingData.map(() => {
      const t = rng();
      const factor = PARALLAX.yMin + t * (PARALLAX.yMax - PARALLAX.yMin);
      const rotSign = rng() < 0.5 ? -1 : 1;
      return factor * rotSign < 0 ? -factor : factor;
    });
  }, [floatingData]);

  const parallaxRotSigns = useMemo<number[]>(() => {
    let seed = 4242;
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    return floatingData.map(() => (rng() < 0.5 ? -1 : 1));
  }, [floatingData]);

  // Per-tile drift parameters
  const driftParams = useMemo<DriftParams[]>(() => {
    let seed = 9001;
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    return floatingData.map(() => ({
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
  }, [floatingData]);

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

  const handleMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    cursorRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  }, []);

  const handleLeave = useCallback(() => {
    cursorRef.current.active = false;
  }, []);

  // Drift animation loop (desktop only, only for floating tiles)
  useEffect(() => {
    if (!assembled || isMobile) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const onScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    scrollYRef.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });

    const startDelay = setTimeout(() => {
      pieceRefs.current.forEach((piece) => {
        if (piece) piece.style.transition = "none";
      });

      const animate = (now: number) => {
        const container = containerRef.current;
        if (!container) {
          rafRef.current = requestAnimationFrame(animate);
          return;
        }
        const rect = container.getBoundingClientRect();

        pulsesRef.current = pulsesRef.current.filter(
          (p) => now - p.startTime < PULSE.duration,
        );

        const cur = cursorRef.current;
        smoothCursorRef.current.x += (cur.x - smoothCursorRef.current.x) * MAGNET.smoothing;
        smoothCursorRef.current.y += (cur.y - smoothCursorRef.current.y) * MAGNET.smoothing;

        const sy = scrollYRef.current;
        const fadeT = Math.min(
          1,
          Math.max(0, (sy - PARALLAX.fadeStart) / (PARALLAX.fadeEnd - PARALLAX.fadeStart)),
        );
        container.style.opacity = String(1 - fadeT * (1 - PARALLAX.fadeMin));

        pieceRefs.current.forEach((piece, i) => {
          if (!piece) return;
          const dp = driftParams[i];

          const parallaxY = -sy * parallaxFactors[i];
          const parallaxR = sy * PARALLAX.rotateMax * parallaxRotSigns[i];

          const dx =
            Math.sin(now * dp.freqX + dp.phaseX) * dp.ampX +
            Math.sin(now * dp.freqX * 1.7 + dp.phaseX + 1) * dp.ampX * 0.3;
          const dy =
            Math.sin(now * dp.freqY + dp.phaseY) * dp.ampY +
            Math.cos(now * dp.freqY * 1.3 + dp.phaseY + 2) * dp.ampY * 0.3 +
            parallaxY;
          const dr = Math.sin(now * dp.freqR + dp.phaseR) * dp.ampR + parallaxR;

          const [cxPct, cyPct] = floatingData[i].centroidPct;
          const cx = (cxPct / 100) * rect.width;
          const cy = (cyPct / 100) * rect.height;

          let magX = 0, magY = 0, magR = 0;
          if (cur.active) {
            const mdx = smoothCursorRef.current.x - cx;
            const mdy = smoothCursorRef.current.y - cy;
            const dist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (dist < MAGNET.radius && dist > 0) {
              const t = 1 - dist / MAGNET.radius;
              const force = t * t * MAGNET.strength;
              const angle = Math.atan2(mdy, mdx);
              magX = -Math.cos(angle) * force;
              magY = -Math.sin(angle) * force;
              magR = -Math.cos(angle) * t * 1.5;
            }
          }

          let pulseX = 0, pulseY = 0, pulseR = 0;
          for (const pulse of pulsesRef.current) {
            const pdx = pulse.x - cx;
            const pdy = pulse.y - cy;
            const dist = Math.sqrt(pdx * pdx + pdy * pdy);
            if (dist < PULSE.radius && dist > 0) {
              const elapsed = now - pulse.startTime;
              const t = elapsed / PULSE.duration;
              const falloff = Math.pow(1 - t, 2);
              const force = (1 - dist / PULSE.radius) * PULSE.strength * falloff;
              const angle = Math.atan2(pdy, pdx);
              pulseX += -Math.cos(angle) * force;
              pulseY += -Math.sin(angle) * force;
              pulseR += (-Math.cos(angle) * force / PULSE.strength) * PULSE.rotateStrength * falloff;
            }
          }

          piece.style.transform =
            `translate(${dx + magX + pulseX}px, ${dy + magY + pulseY}px) rotate(${dr + magR + pulseR}deg)`;
        });

        rafRef.current = requestAnimationFrame(animate);
      };

      rafRef.current = requestAnimationFrame(animate);
    }, 1600);

    window.addEventListener("click", handleClick);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      clearTimeout(startDelay);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [assembled, isMobile, floatingData, driftParams, parallaxFactors, parallaxRotSigns, handleClick, handleMove, handleLeave]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
    >
      {/* Static tiles — every non-floating tile in the artwork. Frozen, no animation. */}
      {staticData.map((tile) => (
        <div
          key={tile.id}
          className="absolute"
          style={{
            left: `${tile.leftPct}%`,
            top: `${tile.topPct}%`,
            width: `${tile.widthPct}%`,
            height: `${tile.heightPct}%`,
            clipPath: tile.clipPath,
            backgroundColor: tile.fill,
            opacity: assembled ? 1 : 0,
            transition: assembled ? "opacity 0.6s ease" : "none",
          }}
        />
      ))}

      {/* Floating tiles — top 48 by area, animated with drift + cursor magnet + click pulse */}
      {floatingData.map((tile, i) => {
        const off = entranceOffsets[i];
        return (
          <div
            key={tile.id}
            ref={(el) => { pieceRefs.current[i] = el; }}
            className="absolute"
            style={{
              left: `${tile.leftPct}%`,
              top: `${tile.topPct}%`,
              width: `${tile.widthPct}%`,
              height: `${tile.heightPct}%`,
              clipPath: tile.clipPath,
              backgroundColor: tile.fill,
              willChange: isMobile ? "auto" : "transform",
              opacity: assembled ? 1 : 0,
              transform: assembled
                ? undefined
                : isMobile
                  ? undefined
                  : `translate(${off.x}vw, ${off.y}vh) rotate(${off.r}deg) scale(0.7)`,
              transition: assembled
                ? isMobile
                  ? `opacity 0.6s ease ${off.delay * 0.5}s`
                  : `opacity 1.0s cubic-bezier(0.25, 1, 0.5, 1) ${off.delay}s, transform 1.2s cubic-bezier(0.22, 1, 0.36, 1) ${off.delay}s`
                : "none",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.45))",
            }}
          />
        );
      })}
    </div>
  );
}
