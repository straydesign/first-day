"use client";

import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";

/**
 * Hand-traced tile shapes from the hero-sunset.png stained-glass artwork.
 * Each tile follows the natural visual boundaries of the image —
 * mountain ridges, sky sections, water reflections, sun glow.
 * Coordinates are percentages (0-100).
 */
const IMAGE_TILES: { id: string; name: string; polygon: [number, number][] }[] = [
  {
    id: "sky-upper-left",
    name: "Upper-left sky",
    polygon: [[0,0],[32,0],[28,8],[22,16],[12,22],[0,28]],
  },
  {
    id: "sky-upper-center-left",
    name: "Pink sky left of center",
    polygon: [[32,0],[48,0],[46,12],[38,18],[28,8]],
  },
  {
    id: "sky-upper-center-right",
    name: "Red sky right of center",
    polygon: [[48,0],[68,0],[72,8],[62,18],[54,12]],
  },
  {
    id: "sky-upper-right",
    name: "Upper-right sky",
    polygon: [[68,0],[100,0],[100,28],[88,22],[78,16],[72,8]],
  },
  {
    id: "mountain-left",
    name: "Left mountain mass",
    polygon: [[0,28],[12,22],[22,16],[28,8],[38,18],[32,32],[22,42],[10,48],[0,52]],
  },
  {
    id: "mountain-right",
    name: "Right mountain mass",
    polygon: [[62,18],[72,8],[78,16],[88,22],[100,28],[100,52],[90,48],[78,42],[68,32]],
  },
  {
    id: "sun-glow",
    name: "Central sun and glow",
    polygon: [[38,18],[46,12],[54,12],[62,18],[68,32],[58,42],[50,46],[42,42],[32,32]],
  },
  {
    id: "water-reflection-center",
    name: "Golden water reflection",
    polygon: [[42,42],[50,46],[58,42],[62,56],[56,68],[50,72],[44,68],[38,56]],
  },
  {
    id: "water-left",
    name: "Left water section",
    polygon: [[0,52],[10,48],[22,42],[32,50],[38,56],[32,72],[18,78],[0,82]],
  },
  {
    id: "water-right",
    name: "Right water section",
    polygon: [[62,56],[68,50],[78,42],[90,48],[100,52],[100,82],[82,78],[68,72]],
  },
];

/**
 * Remaining image area — filled by the base image layer.
 * These are the bottom sections and gaps between the main tiles.
 */
const BOTTOM_TILES: { polygon: [number, number][] }[] = [
  { polygon: [[0,82],[18,78],[32,72],[44,68],[50,72],[56,68],[68,72],[82,78],[100,82],[100,100],[0,100]] },
];

/* ─── Shrink polygon inward to create visible gap ─── */
function shrinkPolygon(
  polygon: [number, number][],
  amount: number,
): [number, number][] {
  // Compute centroid
  let cx = 0, cy = 0;
  for (const [x, y] of polygon) { cx += x; cy += y; }
  cx /= polygon.length;
  cy /= polygon.length;

  return polygon.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return [x, y] as [number, number];
    return [
      x - (dx / len) * amount,
      y - (dy / len) * amount,
    ] as [number, number];
  });
}

function polygonToClipPath(polygon: [number, number][]): string {
  return `polygon(${polygon.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
}

/* ─── Drift settings — subtle breathing for floating tiles ─── */
const DRIFT = {
  amplitude: 3,
  rotateAmp: 0.6,
  baseSpeed: 0.0003,
};

/* ─── Click pulse ─── */
const PULSE = {
  radius: 350,
  strength: 8,
  rotateStrength: 1,
  duration: 900,
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
  const [imageReady, setImageReady] = useState(false);
  const [assembled, setAssembled] = useState(false);
  const isMobile = useIsMobile();

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

  // Precompute tile clip-paths (full + gapped versions)
  const tileData = useMemo(() =>
    IMAGE_TILES.map((tile) => {
      const centroid: [number, number] = [
        tile.polygon.reduce((s, p) => s + p[0], 0) / tile.polygon.length,
        tile.polygon.reduce((s, p) => s + p[1], 0) / tile.polygon.length,
      ];
      return {
        ...tile,
        centroid,
        clipPath: polygonToClipPath(tile.polygon),
        gapClipPath: polygonToClipPath(shrinkPolygon(tile.polygon, 0.4)),
      };
    }),
  []);

  const bottomClipPaths = useMemo(() =>
    BOTTOM_TILES.map((t) => polygonToClipPath(t.polygon)),
  []);

  // Entrance offsets for floating tiles
  const entranceOffsets = useMemo(() => {
    let seed = 42;
    const rng = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return seed / 2147483647;
    };
    return tileData.map(() => ({
      x: (rng() - 0.5) * 100,
      y: (rng() - 0.5) * 100,
      r: (rng() - 0.5) * 20,
      delay: rng() * 0.6,
    }));
  }, [tileData]);

  // Drift params
  const driftParams = useMemo<DriftParams[]>(() => {
    let seed = 137;
    const rng = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return seed / 2147483647;
    };
    return tileData.map(() => ({
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
  }, [tileData]);

  // Click pulse handler
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

  // Drift animation loop (desktop only)
  useEffect(() => {
    if (!assembled || isMobile) return;

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

        pieceRefs.current.forEach((piece, i) => {
          if (!piece) return;
          const dp = driftParams[i];

          const dx =
            Math.sin(now * dp.freqX + dp.phaseX) * dp.ampX +
            Math.sin(now * dp.freqX * 1.7 + dp.phaseX + 1) * dp.ampX * 0.3;
          const dy =
            Math.sin(now * dp.freqY + dp.phaseY) * dp.ampY +
            Math.cos(now * dp.freqY * 1.3 + dp.phaseY + 2) * dp.ampY * 0.3;
          const dr = Math.sin(now * dp.freqR + dp.phaseR) * dp.ampR;

          let pulseX = 0, pulseY = 0, pulseR = 0;
          const [cxPct, cyPct] = tileData[i].centroid;
          const cx = (cxPct / 100) * rect.width;
          const cy = (cyPct / 100) * rect.height;

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
            `translate(${dx + pulseX}px, ${dy + pulseY}px) rotate(${dr + pulseR}deg)`;
        });

        rafRef.current = requestAnimationFrame(animate);
      };

      rafRef.current = requestAnimationFrame(animate);
    }, 1800);

    window.addEventListener("click", handleClick);
    return () => {
      clearTimeout(startDelay);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("click", handleClick);
    };
  }, [assembled, isMobile, tileData, driftParams, handleClick]);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) cancelAnimationFrame(rafRef.current);
  }, [assembled]);

  const bgStyle = imageReady
    ? { backgroundImage: "url(/hero-sunset.png)", backgroundSize: "100% 100%", backgroundPosition: "center" }
    : {};

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
    >
      {/* Layer 1: Full base image (static, slightly dimmed) */}
      <div
        className="absolute inset-0"
        style={{
          ...bgStyle,
          backgroundColor: "#0a0a0a",
          opacity: assembled ? 0.5 : 0,
          transition: "opacity 1s ease",
        }}
      />

      {/* Layer 2: Bottom fill tiles (static, no animation) */}
      {BOTTOM_TILES.map((tile, i) => (
        <div
          key={`bottom-${i}`}
          className="absolute inset-0"
          style={{
            clipPath: bottomClipPaths[i],
            ...bgStyle,
            backgroundColor: "#0a0a14",
            opacity: assembled ? 1 : 0,
            transition: `opacity 0.8s ease 0.3s`,
          }}
        />
      ))}

      {/* Layer 3: The 10 main tiles — hand-traced from the image's natural shapes */}
      {tileData.map((tile, i) => {
        const off = entranceOffsets[i];
        return (
          <div
            key={tile.id}
            ref={(el) => { pieceRefs.current[i] = el; }}
            className="absolute inset-0"
            style={{
              clipPath: tile.gapClipPath,
              ...bgStyle,
              backgroundColor: "#0a0a14",
              willChange: isMobile ? "auto" : "transform",
              opacity: assembled ? 1 : 0,
              transform: assembled
                ? undefined
                : isMobile
                  ? undefined
                  : `translate(${off.x}vw, ${off.y}vh) rotate(${off.r}deg) scale(0.85)`,
              transition: assembled
                ? isMobile
                  ? `opacity 0.6s ease ${off.delay * 0.5}s`
                  : `opacity 1.2s cubic-bezier(0.25, 1, 0.5, 1) ${off.delay}s, transform 1.2s cubic-bezier(0.25, 1, 0.5, 1) ${off.delay}s`
                : "none",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
            }}
          />
        );
      })}
    </div>
  );
}
