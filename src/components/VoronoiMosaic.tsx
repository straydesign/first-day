"use client";
import { memo, useMemo } from "react";
import { Delaunay } from "d3-delaunay";
import { VORONOI_PALETTE } from "@/constants";

/** Seeded PRNG — mulberry32 */
function createRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inset a convex polygon by `amount` px (positive = shrink inward) */
function insetPolygon(
  pts: [number, number][],
  amount: number
): [number, number][] {
  const n = pts.length;
  if (n < 3) return pts;

  const result: [number, number][] = [];

  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    // Edge vectors
    const dx1 = curr[0] - prev[0];
    const dy1 = curr[1] - prev[1];
    const len1 = Math.hypot(dx1, dy1) || 1;

    const dx2 = next[0] - curr[0];
    const dy2 = next[1] - curr[1];
    const len2 = Math.hypot(dx2, dy2) || 1;

    // Inward normals (left-hand normals for CW winding)
    const nx1 = dy1 / len1;
    const ny1 = -dx1 / len1;
    const nx2 = dy2 / len2;
    const ny2 = -dx2 / len2;

    // Average normal at vertex
    let nx = nx1 + nx2;
    let ny = ny1 + ny2;
    const nLen = Math.hypot(nx, ny) || 1;
    nx /= nLen;
    ny /= nLen;

    // Scale by 1/cos(half-angle) for correct offset
    const dot = nx1 * nx + ny1 * ny;
    const scale = dot > 0.1 ? amount / dot : amount;

    result.push([curr[0] + nx * scale, curr[1] + ny * scale]);
  }

  return result;
}

/** Check signed area to determine winding direction */
function signedArea(pts: [number, number][]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i][0] * pts[j][1];
    area -= pts[j][0] * pts[i][1];
  }
  return area / 2;
}

interface VoronoiMosaicProps {
  width?: number;
  height?: number;
  seed?: number;
  tileCount?: number;
  margin?: number;
  gap?: number;
  palette?: readonly string[];
  className?: string;
  /** Hide tiles that touch the bounding box edge — creates organic jagged borders */
  hideEdgeTiles?: boolean;
}

/** Check if a cell polygon touches the bounding box edge */
function touchesBoundary(
  pts: [number, number][],
  w: number,
  h: number,
  tolerance = 0.5
): boolean {
  return pts.some(
    ([x, y]) =>
      x <= tolerance || x >= w - tolerance ||
      y <= tolerance || y >= h - tolerance
  );
}

function VoronoiMosaicInner({
  width = 400,
  height = 640,
  seed = 0,
  tileCount = 60,
  margin = 40,
  gap = 3,
  palette = VORONOI_PALETTE,
  className,
  hideEdgeTiles = false,
}: VoronoiMosaicProps) {
  const polygons = useMemo(() => {
    const rng = createRng(seed * 7919 + 31);

    // Generate seed points within margins
    const points: [number, number][] = [];
    for (let i = 0; i < tileCount; i++) {
      points.push([
        margin + rng() * (width - 2 * margin),
        margin + rng() * (height - 2 * margin),
      ]);
    }

    // Compute Voronoi
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    // Build polygon list
    const result: { points: string; fill: string; isEdge: boolean }[] = [];

    for (let i = 0; i < tileCount; i++) {
      const cell = voronoi.cellPolygon(i);
      if (!cell) continue;

      // Remove closing duplicate point
      let cellPts: [number, number][] = cell
        .slice(0, -1)
        .map((p) => [p[0], p[1]] as [number, number]);

      const isEdge = touchesBoundary(cellPts, width, height);

      // Ensure consistent winding (CW for our inset)
      if (signedArea(cellPts) > 0) {
        cellPts = [...cellPts].reverse();
      }

      // Inset for gaps
      const inset = insetPolygon(cellPts, gap);

      if (inset.length < 3) continue;

      const pointsStr = inset
        .map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
        .join(" ");
      const fill = palette[Math.floor(rng() * palette.length)];

      result.push({ points: pointsStr, fill, isEdge });
    }

    return result;
  }, [width, height, seed, tileCount, margin, gap, palette]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {polygons.map((poly, i) => (
        <polygon
          key={i}
          points={poly.points}
          fill={poly.fill}
          stroke="none"
          opacity={hideEdgeTiles && poly.isEdge ? 0 : 1}
        />
      ))}
    </svg>
  );
}

export const VoronoiMosaic = memo(VoronoiMosaicInner);
