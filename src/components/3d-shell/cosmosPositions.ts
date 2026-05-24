/**
 * Cosmos shell tile positions — module-level static.
 *
 * v155 (META-PIVOT cut #6): the cosmos slab positions were originally
 * computed inside TileVoid's useMemo and never escaped that component. Wall
 * pulse trajectories (Room.tsx) therefore aimed wall pieces at the GENERIC
 * radial-outward direction from room center — not at any specific cosmos
 * slab. This file lifts the position generator to module scope so:
 *   - TileVoid.tsx consumes them as its instance positions.
 *   - Room.tsx consumes them as wall-pulse target waypoints (each wall tile
 *     by index maps to one cosmos slab; the piece flies toward it).
 * Same LCG seed + same v152 inner-bias + same shell radii → byte-identical
 * positions to the pre-v155 inline generator.
 */
import * as THREE from "three";

export const COSMOS_TILE_COUNT = 720; // matches TileVoid MAX_VOID_TILES
export const COSMOS_SHELL_INNER = 12;
export const COSMOS_SHELL_OUTER = 30;
export const COSMOS_BASE_TILE_SIZE = 0.55;

export interface CosmosPosition {
  px: number;
  py: number;
  pz: number;
  rx: number;
  ry: number;
  rz: number;
  s: number;
}

function generate(): CosmosPosition[] {
  const arr: CosmosPosition[] = [];
  let seed = 1469598103;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const HALF_PI = Math.PI / 2;
  const snapAxis = () => Math.floor(rnd() * 4) * HALF_PI;
  for (let i = 0; i < COSMOS_TILE_COUNT; i++) {
    const u = rnd() * 2 - 1;
    const theta = rnd() * Math.PI * 2;
    // v152 — inner-biased reservoir (exponent > 1 pushes [0,1] toward 0,
    // pulling radius toward SHELL_INNER for near-wall tile reservoir).
    const r = COSMOS_SHELL_INNER + (COSMOS_SHELL_OUTER - COSMOS_SHELL_INNER) * Math.pow(rnd(), 1.8);
    const sinPhi = Math.sqrt(1 - u * u);
    const px = r * sinPhi * Math.cos(theta);
    const py = r * u * 0.55; // flattened cosmos belt
    const pz = r * sinPhi * Math.sin(theta);
    arr.push({
      px,
      py,
      pz,
      rx: snapAxis(),
      ry: snapAxis(),
      rz: snapAxis(),
      s: 0.55 + rnd() * 0.55,
    });
  }
  return arr;
}

export const COSMOS_POSITIONS: ReadonlyArray<CosmosPosition> = generate();

/**
 * Resolve a wall-tile index to its assigned cosmos slab position in WORLD
 * space, accounting for the current uniform group scale (v153 — group scales
 * by activeTileSize / COSMOS_BASE_TILE_SIZE) but NOT for the live rotation
 * of the shell. Snapshot-at-call semantics. v155 callers use this once per
 * wall tile at pulse-start to lock the target direction for that pulse.
 */
export function cosmosTargetFor(
  wallTileIndex: number,
  activeTileSize: number,
  out: THREE.Vector3,
): THREE.Vector3 {
  const p = COSMOS_POSITIONS[wallTileIndex % COSMOS_TILE_COUNT];
  const scale = activeTileSize / COSMOS_BASE_TILE_SIZE;
  out.set(p.px * scale, p.py * scale, p.pz * scale);
  return out;
}
