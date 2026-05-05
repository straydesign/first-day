#!/usr/bin/env node
/**
 * Extracts the largest stained-glass tiles from /public/hero-sunset.svg
 * and writes them to /src/data/hero-mosaic-tiles.ts.
 *
 * Output: top-N tiles sorted by area, each with vertices, fill color,
 * bounding box, and centroid — ready for HeroMosaic to render as
 * floating interactive shards.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SVG_PATH = resolve("public/hero-sunset.svg");
const OUT_PATH = resolve("src/data/hero-mosaic-tiles.ts");
// Top-N by area become the FLOATING tiles (animated, cursor-magnet, click-pulse).
// Everything else renders as a static tile so the mosaic fully reconstructs
// the artwork — no <img> background needed.
const FLOATING_N = 48;
// Tiles below this are visual noise (pixel-level detail). Keep the bar low
// so coverage stays tight and we don't get visible gaps.
const MIN_AREA = 8;

const svg = readFileSync(SVG_PATH, "utf8");

// Parse viewBox
const vbMatch = svg.match(/viewBox="([\d\s.]+)"/);
const [, , vbW, vbH] = vbMatch[1].split(/\s+/).map(Number);

// Parse class -> fill color
const classFill = new Map();
const styleMatches = svg.matchAll(/\.(st\d+)\s*\{[^}]*fill:\s*(#[a-fA-F0-9]{6})/g);
for (const m of styleMatches) classFill.set(m[1], m[2]);

// Convert path d-attribute to a polygon vertex list.
// Approximation: cubic/quadratic curves contribute only their endpoint;
// good enough for area sorting and visual tile shape.
function pathToVerts(d) {
  const verts = [];
  let x = 0, y = 0, startX = 0, startY = 0;
  // Tokenize: split on commands while keeping them
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
  if (!tokens) return verts;
  let i = 0;
  let cmd = "";
  const num = () => parseFloat(tokens[i++]);
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[a-zA-Z]/.test(t)) { cmd = t; i++; continue; }
    switch (cmd) {
      case "M": x = num(); y = num(); startX = x; startY = y; verts.push([x, y]); cmd = "L"; break;
      case "m": x += num(); y += num(); startX = x; startY = y; verts.push([x, y]); cmd = "l"; break;
      case "L": x = num(); y = num(); verts.push([x, y]); break;
      case "l": x += num(); y += num(); verts.push([x, y]); break;
      case "H": x = num(); verts.push([x, y]); break;
      case "h": x += num(); verts.push([x, y]); break;
      case "V": y = num(); verts.push([x, y]); break;
      case "v": y += num(); verts.push([x, y]); break;
      case "C": num(); num(); num(); num(); x = num(); y = num(); verts.push([x, y]); break;
      case "c": num(); num(); num(); num(); x += num(); y += num(); verts.push([x, y]); break;
      case "S": num(); num(); x = num(); y = num(); verts.push([x, y]); break;
      case "s": num(); num(); x += num(); y += num(); verts.push([x, y]); break;
      case "Q": num(); num(); x = num(); y = num(); verts.push([x, y]); break;
      case "q": num(); num(); x += num(); y += num(); verts.push([x, y]); break;
      case "T": x = num(); y = num(); verts.push([x, y]); break;
      case "t": x += num(); y += num(); verts.push([x, y]); break;
      case "Z": case "z": x = startX; y = startY; i++; cmd = ""; break;
      default: i++;
    }
  }
  return verts;
}

function polygonPointsToVerts(points) {
  const nums = points.trim().split(/[\s,]+/).map(parseFloat).filter(n => !Number.isNaN(n));
  const v = [];
  for (let i = 0; i + 1 < nums.length; i += 2) v.push([nums[i], nums[i + 1]]);
  return v;
}

// Shoelace formula
function signedArea(verts) {
  let a = 0;
  for (let i = 0; i < verts.length; i++) {
    const [x1, y1] = verts[i];
    const [x2, y2] = verts[(i + 1) % verts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function bbox(verts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of verts) {
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

const tiles = [];

// Polygons
const polyRe = /<polygon\s+class="(st\d+)"\s+points="([^"]+)"/g;
for (const m of svg.matchAll(polyRe)) {
  const verts = polygonPointsToVerts(m[2]);
  if (verts.length < 3) continue;
  const fill = classFill.get(m[1]);
  if (!fill) continue;
  tiles.push({ class: m[1], fill, verts });
}

// Paths
const pathRe = /<path\s+class="(st\d+)"\s+d="([^"]+)"/g;
for (const m of svg.matchAll(pathRe)) {
  const verts = pathToVerts(m[2]);
  if (verts.length < 3) continue;
  const fill = classFill.get(m[1]);
  if (!fill) continue;
  tiles.push({ class: m[1], fill, verts });
}

// Compute area + bbox, drop noise, sort by area desc.
// Keep ALL tiles (including the lead matrix) so the mosaic fully reconstructs
// the source artwork — no <img> base layer needed.
const enriched = tiles
  .map(t => {
    const area = Math.abs(signedArea(t.verts));
    const bb = bbox(t.verts);
    return { ...t, area, bb };
  })
  .filter(t => t.area >= MIN_AREA)
  .sort((a, b) => b.area - a.area);

const top = enriched;

// Normalize: emit each tile's vertices as percentages of the tile's own
// bbox (so HeroMosaic can size the tile freely), plus a position in
// viewBox % (so HeroMosaic can place it relative to the page).
const out = top.map((t, i) => {
  const w = t.bb.maxX - t.bb.minX;
  const h = t.bb.maxY - t.bb.minY;
  const verts = t.verts.map(([x, y]) => [
    +((x - t.bb.minX) / w * 100).toFixed(1),
    +((y - t.bb.minY) / h * 100).toFixed(1),
  ]);
  return {
    id: `tile-${i}`,
    fill: t.fill,
    // Position in source artwork (% of viewBox)
    leftPct: +(t.bb.minX / vbW * 100).toFixed(2),
    topPct: +(t.bb.minY / vbH * 100).toFixed(2),
    widthPct: +(w / vbW * 100).toFixed(2),
    heightPct: +(h / vbH * 100).toFixed(2),
    // Polygon vertices as % of tile's own bbox — used in clipPath
    verts,
    // Raw artwork-space area
    area: Math.round(t.area),
    // Top-N by area become the floating/animated tiles; the rest are static
    floating: i < FLOATING_N,
  };
});

const banner = `// AUTO-GENERATED by scripts/extract-mosaic-tiles.mjs from public/hero-sunset.svg.
// Every stained-glass tile (sorted by area desc); the first ${FLOATING_N} are
// flagged \`floating\` so HeroMosaic can animate them while the rest stay
// static. Re-run the script if the artwork changes.\n`;

const ts =
  banner +
  `\nexport interface MosaicTile {\n` +
  `  id: string;\n` +
  `  fill: string;\n` +
  `  /** Position of the tile's bbox top-left within the artwork, 0–100. */\n` +
  `  leftPct: number;\n` +
  `  topPct: number;\n` +
  `  /** Tile bbox size as % of the artwork viewBox. */\n` +
  `  widthPct: number;\n` +
  `  heightPct: number;\n` +
  `  /** Polygon vertices as [xPct, yPct] within the tile's own bbox. */\n` +
  `  verts: [number, number][];\n` +
  `  /** Raw artwork-space area, sorted descending. */\n` +
  `  area: number;\n` +
  `  /** True for the largest tiles — animated with drift/magnet/pulse. */\n` +
  `  floating: boolean;\n` +
  `}\n\n` +
  `export const HERO_MOSAIC_TILES: MosaicTile[] = ${JSON.stringify(out)};\n`;

writeFileSync(OUT_PATH, ts);

const floating = out.filter(t => t.floating).length;
const fills = new Set(out.map(t => t.fill));
console.log(`Wrote ${out.length} tiles (${floating} floating + ${out.length - floating} static) to ${OUT_PATH}`);
console.log(`Distinct fills: ${fills.size}`);
console.log(`Top areas: ${top.slice(0, 8).map(t => t.area.toFixed(0)).join(", ")}`);
