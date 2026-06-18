"use client";
/**
 * Panel — THE canonical surface for First Day.
 *
 * Faceted-but-rounded ("Voronoi corners + Apple radii"): a near-rectangle whose
 * top-right and bottom-left corners are cut into gem facets, then every vertex is
 * rounded with a quadratic curve. Frosted glass fill + hairline outline by default;
 * `solid` flips to an opaque white emphasis surface (black text) for the one thing
 * on a screen that should pop. One primitive, used everywhere — no per-view drift.
 */
import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ---------- faceted-but-rounded geometry ---------- */
type Pt = [number, number];
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Pt, s: number): Pt => [a[0] * s, a[1] * s];
const len = (a: Pt) => Math.hypot(a[0], a[1]) || 1;
const unit = (a: Pt): Pt => mul(a, 1 / len(a));

/** Rounds every vertex of a polygon with a quadratic curve → Apple-soft corners on a faceted shape. */
function roundedPath(pts: Pt[], r: number): string {
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const rr = Math.min(r, len(sub(prev, cur)) / 2, len(sub(next, cur)) / 2);
    const p1 = add(cur, mul(unit(sub(prev, cur)), rr));
    const p2 = add(cur, mul(unit(sub(next, cur)), rr));
    d += `${i === 0 ? "M" : "L"} ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} Q ${cur[0].toFixed(2)} ${cur[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `;
  }
  return d + "Z";
}

/** A near-rectangle with two opposite corners cut into gem facets (Voronoi character). */
function facetPoints(w: number, h: number): Pt[] {
  const f = Math.max(10, Math.min(26, Math.min(w, h) * 0.16));
  return [
    [0, 0],
    [w - f, 0],
    [w, f], // top-right facet
    [w, h],
    [f, h],
    [0, h - f], // bottom-left facet
  ];
}

export interface PanelProps {
  children: React.ReactNode;
  className?: string;
  /** Opaque white emphasis surface with black text. Use sparingly. */
  solid?: boolean;
  /** Inner content wrapper classes (padding/layout). Defaults to p-6. */
  contentClassName?: string;
  style?: React.CSSProperties;
}

function PanelInner({ children, className, solid = false, contentClassName, style }: PanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setS({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const d = s.w && s.h ? roundedPath(facetPoints(s.w, s.h), 16) : "";
  const clip = d ? ({ clipPath: `path('${d}')`, WebkitClipPath: `path('${d}')` } as React.CSSProperties) : undefined;

  return (
    <div ref={ref} className={cn("relative", className)} style={style}>
      {d && (
        <div
          className="absolute inset-0"
          style={
            solid
              ? { ...clip, background: "rgba(255,255,255,0.95)" }
              : {
                  ...clip,
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  background: "rgba(255,255,255,0.045)",
                }
          }
        />
      )}
      {d && !solid && (
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          width={s.w}
          height={s.h}
          viewBox={`0 0 ${s.w} ${s.h}`}
          preserveAspectRatio="none"
        >
          <path d={d} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        </svg>
      )}
      <div className={cn("relative z-10", contentClassName ?? "p-6", solid && "text-black")}>{children}</div>
    </div>
  );
}

export const Panel = memo(PanelInner);
