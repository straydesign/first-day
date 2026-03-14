"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { Delaunay } from "d3-delaunay";

/* ─── 7 seed points distributed across a 100×100 space ─── */
const SEED_POINTS: [number, number][] = [
  [18, 22], [52, 10], [84, 20],
  [32, 50], [68, 48],
  [20, 80], [76, 78],
];

const COLORS = [
  "#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF",
  "#FF10F0", "#4FC3F7", "#FF4500",
];

interface EffectConfig {
  strength: number;
  radius: number;
  rotateStrength: number;
  pushSpeed: number;
  returnSpeed: number;
  overshoot: number;
}

const DEFAULT_CONFIG: EffectConfig = {
  strength: 40,
  radius: 220,
  rotateStrength: 6,
  pushSpeed: 0.12,
  returnSpeed: 0.55,
  overshoot: 1.5,
};

const SLIDERS: {
  key: keyof EffectConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}[] = [
  { key: "strength", label: "Push Force", min: 5, max: 150, step: 1, unit: "px" },
  { key: "radius", label: "Reach", min: 50, max: 500, step: 5, unit: "px" },
  { key: "rotateStrength", label: "Spin", min: 0, max: 30, step: 1, unit: "deg" },
  { key: "pushSpeed", label: "Push Speed", min: 0.02, max: 0.5, step: 0.01, unit: "s" },
  { key: "returnSpeed", label: "Return Speed", min: 0.1, max: 1.5, step: 0.05, unit: "s" },
  { key: "overshoot", label: "Bounce", min: 1.0, max: 2.5, step: 0.1, unit: "x" },
];

interface CellData {
  clipPath: string;
  centroid: [number, number];
  color: string;
}

export function ShardMosaic() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [config, setConfig] = useState<EffectConfig>(DEFAULT_CONFIG);
  const [panelOpen, setPanelOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const cells = useMemo<CellData[]>(() => {
    const delaunay = Delaunay.from(SEED_POINTS);
    const voronoi = delaunay.voronoi([0, 0, 100, 100]);

    const result: CellData[] = [];

    for (let i = 0; i < SEED_POINTS.length; i++) {
      const polygon = voronoi.cellPolygon(i);
      if (!polygon) continue;

      const points = polygon.map(([x, y]) => `${x}% ${y}%`).join(", ");

      const n = polygon.length - 1;
      let cx = 0;
      let cy = 0;
      for (let j = 0; j < n; j++) {
        cx += polygon[j][0];
        cy += polygon[j][1];
      }

      result.push({
        clipPath: `polygon(${points})`,
        centroid: [cx / n, cy / n],
        color: COLORS[i % COLORS.length],
      });
    }

    return result;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const pushTransition = `transform ${config.pushSpeed}s cubic-bezier(0.22, 0.8, 0.36, 1)`;
      const returnTransition = `transform ${config.returnSpeed}s cubic-bezier(0.25, ${config.overshoot}, 0.5, 1)`;

      pieceRefs.current.forEach((piece, i) => {
        if (!piece) return;

        const [cxPct, cyPct] = cells[i].centroid;
        const cx = (cxPct / 100) * rect.width;
        const cy = (cyPct / 100) * rect.height;

        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < config.radius && dist > 0) {
          const force = (1 - dist / config.radius) * config.strength;
          const angle = Math.atan2(dy, dx);
          const pushX = -Math.cos(angle) * force;
          const pushY = -Math.sin(angle) * force;
          const pushR =
            (-Math.cos(angle) * force / config.strength) * config.rotateStrength;

          piece.style.transition = pushTransition;
          piece.style.transform = `translate(${pushX}px, ${pushY}px) rotate(${pushR}deg)`;
        } else {
          piece.style.transition = returnTransition;
          piece.style.transform = "";
        }
      });
    },
    [cells, config],
  );

  const handleMouseLeave = useCallback(() => {
    const returnTransition = `transform ${config.returnSpeed}s cubic-bezier(0.25, ${config.overshoot}, 0.5, 1)`;
    pieceRefs.current.forEach((piece) => {
      if (!piece) return;
      piece.style.transition = returnTransition;
      piece.style.transform = "";
    });
  }, [config]);

  const handleCopy = () => {
    const output = {
      strength: config.strength,
      radius: config.radius,
      rotateStrength: config.rotateStrength,
      pushTransition: `transform ${config.pushSpeed}s cubic-bezier(0.22, 0.8, 0.36, 1)`,
      returnTransition: `transform ${config.returnSpeed}s cubic-bezier(0.25, ${config.overshoot}, 0.5, 1)`,
    };
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="py-12 md:py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div
          ref={containerRef}
          className="relative w-full aspect-[16/9] cursor-default select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {cells.map((cell, i) => (
            <div
              key={i}
              ref={(el) => {
                pieceRefs.current[i] = el;
              }}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                clipPath: cell.clipPath,
                backgroundColor: cell.color,
                willChange: "transform",
              }}
            >
              <span
                className="absolute font-black text-black/20 pointer-events-none"
                style={{
                  left: `${cell.centroid[0]}%`,
                  top: `${cell.centroid[1]}%`,
                  transform: "translate(-50%, -50%)",
                  fontFamily: "var(--font-bebas), system-ui, sans-serif",
                  fontSize: "clamp(2rem, 5vw, 4rem)",
                }}
              >
                {i + 1}
              </span>
            </div>
          ))}
        </div>

        {/* ─── Tuning Panel ─── */}
        {panelOpen ? (
          <div
            className="mt-6 bg-black/95 border border-white/15 p-5 max-w-sm mx-auto"
            style={{ clipPath: "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <span
                className="text-[#FFE633] font-bold uppercase tracking-widest"
                style={{
                  fontFamily: "var(--font-bebas), system-ui, sans-serif",
                  fontSize: "1rem",
                  letterSpacing: 3,
                }}
              >
                Effect Tuner
              </span>
              <button
                onClick={() => setPanelOpen(false)}
                className="text-white/40 hover:text-white text-lg leading-none transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              {SLIDERS.map(({ key, label, min, max, step, unit }) => {
                const value = config[key];
                return (
                  <div key={key}>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-white/50 text-xs uppercase tracking-wider">
                        {label}
                      </span>
                      <span className="text-white font-mono text-xs">
                        {typeof value === "number" && step < 1
                          ? value.toFixed(2)
                          : value}
                        {unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      onChange={(e) =>
                        setConfig({ ...config, [key]: Number(e.target.value) })
                      }
                      className="w-full h-1 appearance-none bg-white/10 rounded-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#FFE633] [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfig(DEFAULT_CONFIG)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-xs py-2 uppercase tracking-wider font-bold transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 bg-[#FFE633]/10 hover:bg-[#FFE633]/20 text-[#FFE633] text-xs py-2 uppercase tracking-wider font-bold transition-colors"
              >
                {copied ? "Copied!" : "Copy Settings"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-center">
            <button
              onClick={() => setPanelOpen(true)}
              className="bg-black/80 border border-[#FFE633]/30 px-5 py-2 text-[#FFE633] text-xs font-bold uppercase tracking-wider hover:bg-black/90 transition-colors"
              style={{ clipPath: "polygon(3% 0%, 100% 5%, 97% 100%, 0% 92%)" }}
            >
              Tune Effect
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
