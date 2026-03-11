"use client";
import { memo, useMemo } from "react";

const DEFAULT_ACCENT_COLORS = [
  "#FFD38A", "#FFB07C", "#FF8E72", "#F77BAA",
  "#5227FF", "#2437A6", "#8A2C6D", "#0F1B3A",
];

interface GeometricFrameProps {
  children: React.ReactNode;
  seed?: number;
  borderWidth?: number;
  irregularity?: number;
  className?: string;
  accentColors?: string[];
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function GeometricFrameInner({
  children,
  seed = 0,
  borderWidth = 12,
  irregularity = 0.3,
  className = "",
  accentColors,
}: GeometricFrameProps) {
  const colors = accentColors ?? DEFAULT_ACCENT_COLORS;

  const { outerPath, triangles } = useMemo(() => {
    const w = 400;
    const h = 300;
    const bw = borderWidth;
    const points = 16;

    // Generate irregular outer polygon
    const outerPoints: Array<[number, number]> = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const baseX = w / 2 + (w / 2) * Math.cos(angle);
      const baseY = h / 2 + (h / 2) * Math.sin(angle);
      const jitterX = (seededRandom(seed + i * 3) - 0.5) * bw * irregularity * 2;
      const jitterY = (seededRandom(seed + i * 3 + 1) - 0.5) * bw * irregularity * 2;
      outerPoints.push([
        Math.max(0, Math.min(w, baseX + jitterX)),
        Math.max(0, Math.min(h, baseY + jitterY)),
      ]);
    }

    // Generate inner polygon (inset by borderWidth)
    const innerPoints: Array<[number, number]> = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const baseX = w / 2 + (w / 2 - bw) * Math.cos(angle);
      const baseY = h / 2 + (h / 2 - bw) * Math.sin(angle);
      const jitterX = (seededRandom(seed + i * 3 + 100) - 0.5) * bw * irregularity;
      const jitterY = (seededRandom(seed + i * 3 + 101) - 0.5) * bw * irregularity;
      innerPoints.push([
        Math.max(bw / 2, Math.min(w - bw / 2, baseX + jitterX)),
        Math.max(bw / 2, Math.min(h - bw / 2, baseY + jitterY)),
      ]);
    }

    // Create SVG path for outer shape
    const path = outerPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + " Z";

    // Generate mosaic triangles in the border zone
    const tris: Array<{ points: string; fill: string; opacity: number }> = [];
    for (let i = 0; i < points; i++) {
      const next = (i + 1) % points;
      const op = outerPoints[i];
      const onp = outerPoints[next];
      const ip = innerPoints[i];
      const inp = innerPoints[next];

      const c1 = colors[Math.floor(seededRandom(seed + i * 7) * colors.length)];
      const c2 = colors[Math.floor(seededRandom(seed + i * 7 + 3) * colors.length)];

      tris.push({
        points: `${op[0]},${op[1]} ${onp[0]},${onp[1]} ${ip[0]},${ip[1]}`,
        fill: c1,
        opacity: 0.5 + seededRandom(seed + i * 5) * 0.5,
      });
      tris.push({
        points: `${onp[0]},${onp[1]} ${inp[0]},${inp[1]} ${ip[0]},${ip[1]}`,
        fill: c2,
        opacity: 0.5 + seededRandom(seed + i * 5 + 2) * 0.5,
      });
    }

    return { outerPath: path, triangles: tris };
  }, [seed, borderWidth, irregularity, colors]);

  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={`geo-frame-${seed}`}>
            <path d={outerPath} />
          </clipPath>
        </defs>
        <g clipPath={`url(#geo-frame-${seed})`}>
          {triangles.map((tri, i) => (
            <polygon
              key={i}
              points={tri.points}
              fill={tri.fill}
              opacity={tri.opacity}
            />
          ))}
        </g>
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export const GeometricFrame = memo(GeometricFrameInner);
