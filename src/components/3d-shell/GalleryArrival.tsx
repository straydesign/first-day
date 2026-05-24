"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { getArrivedMarker, subscribeArrivedMarker } from "./galleryIntent";
import {
  MOOD_COLORS,
  MOOD_GLYPHS,
  MOOD_LABELS,
  getReactionsFor,
  loadReactionsFor,
  postReaction,
  subscribeReactions,
} from "./reactionsIntent";
import type { MoodTileKind, ReactionTile } from "@/types";

/**
 * Social P4 + P5 — when the camera dolly-arrives at a clicked gallery marker
 * (GalleryMarkers' useFrame fires `setArrivedMarker`), THIS component does
 * the visceral reveal: the marker cube splinters into 36 tumbling shards,
 * an HTML panel reveals the published goal, AND prior reactions appear as
 * colored tiles projected onto the 6-face mini-room around the arrival
 * point. Clicking a mood button mortars a new tile in at a deterministic
 * random (face, u, v) so each viewer's encouragement is a permanent
 * piece of that room's wall.
 *
 * The shatter mirrors the wall-pulse idiom (per-piece axis + tangent
 * scatter + gravity per feedback_first-day-walls-must-shatter.md). The
 * reaction tiles persist across visits — they ARE the room's surface for
 * anyone who arrives after.
 */

const GALLERY_CENTER: [number, number, number] = [0, -23, 0];
const FRAGMENT_COUNT = 36;
const FRAGMENT_SIZE = 0.34;
const SHATTER_DURATION = 1.6;
const GRAVITY = 1.4;

// Imagined mini-room dimensions used to project (face, u, v) → 3D position.
// Same coordinate frame as a planner-room (centered on arrival point) so
// the reactions read as walls of that room, not as floating sprites.
const ROOM_WIDTH = 5;
const ROOM_HEIGHT = 3.5;
const ROOM_DEPTH = 5;
const REACTION_TILE_SIZE = 0.42;
// Max reactions an InstancedMesh allocates upfront. Reactions cap at ~500
// per room in the DB; we render the most-recent 200 to keep the field
// readable.
const REACTION_CAPACITY = 200;

const MOOD_KINDS: MoodTileKind[] = ["warm", "cool", "spark", "weight", "quiet"];

interface FragmentSeed {
  dx: number;
  dy: number;
  dz: number;
  ax: number;
  ay: number;
  az: number;
  speed: number;
  spin: number;
}

function makeFragmentSeeds(seedInt: number): FragmentSeed[] {
  let s = seedInt >>> 0;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const seeds: FragmentSeed[] = [];
  for (let i = 0; i < FRAGMENT_COUNT; i++) {
    let u = 0;
    let v = 0;
    let s2 = 0;
    do {
      u = rand() * 2 - 1;
      v = rand() * 2 - 1;
      s2 = u * u + v * v;
    } while (s2 >= 1 || s2 === 0);
    const sq = Math.sqrt(1 - s2);
    const dx = 2 * u * sq;
    const dy = 2 * v * sq;
    const dz = 1 - 2 * s2;
    const ax = rand() * 2 - 1;
    const ay = rand() * 2 - 1;
    const az = rand() * 2 - 1;
    const len = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
    seeds.push({
      dx,
      dy,
      dz,
      ax: ax / len,
      ay: ay / len,
      az: az / len,
      speed: 2.4 + rand() * 2.2,
      spin: 3.0 + rand() * 4.0,
    });
  }
  return seeds;
}

function hashStringToInt(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Project a (wall_face, u, v) anchor onto the imagined mini-room around
 * arrival origin (0,0,0 of the parent group). Faces 0-5 map to ±x, ±y, ±z.
 */
function projectReactionPosition(
  wallFace: number,
  u: number,
  v: number,
): [number, number, number] {
  const ux = u - 0.5;
  const uy = v - 0.5;
  switch (wallFace) {
    case 0: // +x wall: u→z, v→y
      return [ROOM_WIDTH / 2, uy * ROOM_HEIGHT, ux * ROOM_DEPTH];
    case 1: // -x wall
      return [-ROOM_WIDTH / 2, uy * ROOM_HEIGHT, ux * ROOM_DEPTH];
    case 2: // +y ceiling
      return [ux * ROOM_WIDTH, ROOM_HEIGHT / 2, uy * ROOM_DEPTH];
    case 3: // -y floor
      return [ux * ROOM_WIDTH, -ROOM_HEIGHT / 2, uy * ROOM_DEPTH];
    case 4: // +z wall
      return [ux * ROOM_WIDTH, uy * ROOM_HEIGHT, ROOM_DEPTH / 2];
    case 5: // -z wall
    default:
      return [ux * ROOM_WIDTH, uy * ROOM_HEIGHT, -ROOM_DEPTH / 2];
  }
}

const tmpObj = new THREE.Object3D();
const tmpColor = new THREE.Color();
const tmpAxis = new THREE.Vector3();

// v241 — mini-room wall tiles. After the marker shatters and the v240 dolly
// lands the camera inside the imagined mini-room, a 4-wall cage of tiles fades
// in during the last 30% of SHATTER_DURATION so the camera goes from "flying
// through void past shatter fragments" to "standing inside a tile-built room
// that the marker BECAME." Walls are dimmed to ~55% of the marker color so the
// reaction tiles (full MOOD_COLOR brightness) still pop forward.
const WALL_BUILD_START = SHATTER_DURATION * 0.7;
const WALL_BUILD_DURATION = 0.5;
const WALL_TILE_THICKNESS = 0.08;
const WALL_COLS = 4;
const WALL_ROWS = 3;
// v242 — ceiling + floor faces use a square 4×4 grid (along x × along z).
const HORIZ_COLS = 4;
const HORIZ_ROWS = 4;
const MINI_ROOM_WALL_TILE_CAPACITY =
  4 * WALL_COLS * WALL_ROWS + 2 * HORIZ_COLS * HORIZ_ROWS;

interface WallTileSeed {
  pos: [number, number, number];
  size: [number, number, number];
  delay: number;
  colorJitter: number;
  face: number;
  // v254 — assembly origin offset (unit-vector × magnitude). The tile starts
  // life at `pos + scatterDir × scatterMag` and curves into its slot, matching
  // the radial dispersion left by the marker shatter so the cage reads as
  // "the fragment cloud gathering back into a room" rather than two separate
  // physics systems (shatter out radially, wall in radially).
  scatterDir: [number, number, number];
  scatterMag: number;
}

function faceNormalDir(face: number): [number, number, number] {
  switch (face) {
    case 0: return [1, 0, 0];
    case 1: return [-1, 0, 0];
    case 2: return [0, 1, 0];
    case 3: return [0, -1, 0];
    case 4: return [0, 0, 1];
    case 5:
    default: return [0, 0, -1];
  }
}

// v246 — far-wall doorway. The v240 dolly leaves the camera pulled INWARD
// (toward gallery center) from the marker and looking OUTWARD past it, so
// the camera sees the wall whose normal points AWAY from gallery center.
// We skip a 2×2 center cluster on that face so there's a visible opening
// through which the cosmos beyond the room shows through — closes VISION.md's
// "camera dollies forward through the opening" beat. Without this, the cage
// sealed the camera in a closed box with nowhere to look "through."
//
// v251 — bidirectional doorway. The v240 dolly leg 2 physically passes from
// camera_z = APPROACH_DISTANCE-inward TO 1.5-inward, so it CROSSES the back
// wall (the wall facing gallery center) on its way into the room interior.
// Without an opening there the camera clipped through a sealed slab —
// violating "moving through gaps." computeDoorwayFaces now returns BOTH:
//   exit  = outward-pointing face (cosmos view-through)
//   entry = inward-pointing face (where the camera physically arrives)
// Opposite face pairs differ by XOR 1 (0↔1, 2↔3, 4↔5). The mini-room is now a
// true pass-through corridor — cosmos at both ends, camera moves through one
// tile-gap and stares through the other. Shed/inbound pieces can travel
// through either opening so the room visibly exchanges material with cosmos
// on both sides, not just the cosmetic far wall.
function computeDoorwayFaces(markerPos: readonly [number, number, number]): { entry: number; exit: number } {
  const len = Math.hypot(markerPos[0], markerPos[1], markerPos[2]) || 1;
  const nx = markerPos[0] / len;
  const ny = markerPos[1] / len;
  const nz = markerPos[2] / len;
  const ax = Math.abs(nx);
  const ay = Math.abs(ny);
  const az = Math.abs(nz);
  // The exit face's outward normal points AWAY from gallery (+marker dir).
  // e.g. marker at +x → camera looks +x → exit doorway on +x face = 0.
  // Entry = opposite face on the same axis (XOR 1).
  let exit: number;
  if (ax >= ay && ax >= az) exit = nx > 0 ? 0 : 1;
  else if (ay >= ax && ay >= az) exit = ny > 0 ? 2 : 3;
  else exit = nz > 0 ? 4 : 5;
  return { exit, entry: exit ^ 1 };
}

function makeWallTileSeeds(seedInt: number, doorways: { entry: number; exit: number }): WallTileSeed[] {
  let s = seedInt >>> 0;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  // v254 — uniform-sphere sample biased into the face's outward hemisphere so
  // each tile flies in from somewhere in the shatter cloud rather than slabbing
  // up radially from the room center. Magnitude 2.8–4.2 matches the marker
  // shatter peak displacement (speeds 2.4–4.6 × ~0.9s drift).
  const sampleScatter = (face: number): { dir: [number, number, number]; mag: number } => {
    const u = rand() * 2 - 1;
    const phi = rand() * Math.PI * 2;
    const sinTheta = Math.sqrt(Math.max(0, 1 - u * u));
    let sx = sinTheta * Math.cos(phi);
    let sy = u;
    let sz = sinTheta * Math.sin(phi);
    const n = faceNormalDir(face);
    if (sx * n[0] + sy * n[1] + sz * n[2] < 0) {
      sx = -sx; sy = -sy; sz = -sz;
    }
    const BIAS = 0.45;
    sx = sx * (1 - BIAS) + n[0] * BIAS;
    sy = sy * (1 - BIAS) + n[1] * BIAS;
    sz = sz * (1 - BIAS) + n[2] * BIAS;
    const len = Math.hypot(sx, sy, sz) || 1;
    return {
      dir: [sx / len, sy / len, sz / len],
      mag: 2.8 + rand() * 1.4,
    };
  };
  const seeds: WallTileSeed[] = [];
  const halfW = ROOM_WIDTH / 2;
  const halfH = ROOM_HEIGHT / 2;
  const halfD = ROOM_DEPTH / 2;
  const tileDz = ROOM_DEPTH / WALL_COLS;
  const tileH = ROOM_HEIGHT / WALL_ROWS;
  const tileWx = ROOM_WIDTH / WALL_COLS;
  // Vertical-wall doorway zone: 2 center columns × 2 bottom rows (a real
  // doorway shape, not a port-hole).
  const isVertDoorwayTile = (c: number, r: number) =>
    c >= 1 && c <= 2 && r <= 1;
  // Horizontal-face doorway zone (used if entry is via ceiling/floor): center
  // 2×2 of the 4×4 grid.
  const isHorizDoorwayTile = (c: number, r: number) =>
    c >= 1 && c <= 2 && r >= 1 && r <= 2;
  // v251 — skip doorway zone on BOTH entry and exit faces so the camera
  // physically dollies through one opening and looks through the other.
  const isDoorwayFace = (f: number) => f === doorways.entry || f === doorways.exit;
  for (const sign of [1, -1] as const) {
    const face = sign === 1 ? 0 : 1;
    for (let c = 0; c < WALL_COLS; c++) {
      for (let r = 0; r < WALL_ROWS; r++) {
        if (isDoorwayFace(face) && isVertDoorwayTile(c, r)) continue;
        const z = -halfD + (c + 0.5) * tileDz;
        const y = -halfH + (r + 0.5) * tileH;
        const scatter = sampleScatter(face);
        seeds.push({
          pos: [sign * halfW, y, z],
          size: [WALL_TILE_THICKNESS, tileH * 0.94, tileDz * 0.94],
          delay: rand() * 0.3,
          colorJitter: (rand() * 2 - 1) * 0.2,
          face,
          scatterDir: scatter.dir,
          scatterMag: scatter.mag,
        });
      }
    }
  }
  for (const sign of [1, -1] as const) {
    const face = sign === 1 ? 4 : 5;
    for (let c = 0; c < WALL_COLS; c++) {
      for (let r = 0; r < WALL_ROWS; r++) {
        if (isDoorwayFace(face) && isVertDoorwayTile(c, r)) continue;
        const x = -halfW + (c + 0.5) * tileWx;
        const y = -halfH + (r + 0.5) * tileH;
        const scatter = sampleScatter(face);
        seeds.push({
          pos: [x, y, sign * halfD],
          size: [tileWx * 0.94, tileH * 0.94, WALL_TILE_THICKNESS],
          delay: rand() * 0.3,
          colorJitter: (rand() * 2 - 1) * 0.2,
          face,
          scatterDir: scatter.dir,
          scatterMag: scatter.mag,
        });
      }
    }
  }
  // v242 — ±y floor + ceiling, 4×4 grids along x × z. Floor delays lean late
  // (additional 0.06s offset) so the room reads as "settling onto a floor"
  // rather than "snapping shut". Ceiling cascade is normal range so it tucks
  // in over your head while the floor is still landing.
  const tileXh = ROOM_WIDTH / HORIZ_COLS;
  const tileZh = ROOM_DEPTH / HORIZ_ROWS;
  for (const sign of [1, -1] as const) {
    const face = sign === 1 ? 2 : 3;
    const floorBias = sign === -1 ? 0.06 : 0;
    for (let c = 0; c < HORIZ_COLS; c++) {
      for (let r = 0; r < HORIZ_ROWS; r++) {
        if (isDoorwayFace(face) && isHorizDoorwayTile(c, r)) continue;
        const x = -halfW + (c + 0.5) * tileXh;
        const z = -halfD + (r + 0.5) * tileZh;
        const scatter = sampleScatter(face);
        seeds.push({
          pos: [x, sign * halfH, z],
          size: [tileXh * 0.94, WALL_TILE_THICKNESS, tileZh * 0.94],
          delay: floorBias + rand() * 0.3,
          colorJitter: (rand() * 2 - 1) * 0.2,
          face,
          scatterDir: scatter.dir,
          scatterMag: scatter.mag,
        });
      }
    }
  }
  return seeds;
}

// v245 — ambient wall-tile churn. After the cage has fully assembled, every
// ~2.5s ONE random tile briefly flies out through its slot (flyK 1.0 → 1.8 →
// 1.0 over 0.7s) and re-seats. Closes Tom's "individual pieces moving in
// and out through gaps" VISION line — the room reads as ALIVE not a frozen
// CG box while the user dwells in the arrival panel.
const CHURN_PERIOD = 2.5;
const CHURN_DURATION = 0.7;
const CHURN_MAX_FLY = 1.8;

// v247 — doorway-shed rhythm. A SECOND independent agitation: every ~3.5s pick
// a tile on the doorway face (the wall the camera is staring at) and eject it
// far outward — flyK ramps 1.0 → 3.0 → 1.0 over 1.1s. Because the doorway face
// already has a 2×2 hole in its center, the ejected tile is necessarily near
// the gap's edge, so it reads as a piece SHED THROUGH THE OPENING into the
// cosmos beyond. Closes Tom's "pieces falling out and moving in and out through
// gaps" line literally — the room is visibly shedding itself through the door.
const DOORWAY_SHED_PERIOD = 3.5;
const DOORWAY_SHED_DURATION = 1.1;
const DOORWAY_SHED_MAX_FLY = 3.0;

// v248 — inbound mirror of v247. Every ~4s a doorway-face tile materializes
// FAR outside the room (flyK = INBOUND_START_FLY) and easeOut-decays to its
// wall slot over INBOUND_DURATION. Reads as a piece arriving from the cosmos
// through the doorway gap and slamming into the wall. Pairs with v247 outbound
// shed so the room visibly EXCHANGES material with the void — both directions
// of Tom's "moving in and out through gaps" line are now lit.
const INBOUND_PERIOD = 4.0;
const INBOUND_DURATION = 0.9;
const INBOUND_START_FLY = 3.0;

// v250 — exit-crumble duration. When the user navigates away, GalleryArrival
// holds the mini-room mounted for this many seconds while every wall tile flies
// outward + tumbles + drops + scales to zero. Mirrors the elaborate v241 entry
// assembly so leaving a room feels symmetric with arriving — the cage visibly
// crumbles back into cosmos through the doorway rather than instantly vanishing.
const EXIT_DURATION = 1.2;
const EXIT_FLY_GROWTH = 1.6;
const EXIT_GRAVITY = 0.7;

// v253 — active "wall opens for camera" — when the dolly's leg-2 camera
// approaches the entry doorway, tiles whose centers are within
// CAMERA_DILATE_RADIUS of the camera tumble outward proportional to nearness.
// The doorway physically WIDENS for the camera (not a static pre-cut hole)
// then closes behind it — closes Tom's "walls open up by individual pieces
// falling out and moving in and out through gaps" criterion. Only entry/exit
// face tiles are eligible so the side walls don't break apart while the
// camera passes through the middle.
const CAMERA_DILATE_RADIUS = 1.9;
const CAMERA_DILATE_FLY_BOOST = 0.95;

function MiniRoomWalls({
  arrived,
  exitStartedAt,
}: {
  arrived: { id: string; color: string; position: readonly [number, number, number] };
  /** Performance-time (seconds) at which the exit-crumble began, or null. */
  exitStartedAt: number | null;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const startTimeRef = useRef<number>(0);
  const churnRef = useRef<{ idx: number; startedAt: number; nextAt: number }>({
    idx: -1,
    startedAt: 0,
    nextAt: 0,
  });
  // v247 — independent doorway-shed scheduler, runs concurrently with v245
  // radial churn. Picks only from doorway-face tile indices so every cycle
  // visibly ejects a piece through the hole.
  const shedRef = useRef<{ idx: number; startedAt: number; nextAt: number }>({
    idx: -1,
    startedAt: 0,
    nextAt: 0,
  });
  // v248 — inbound mirror scheduler. Tile arrives from far outside (flyK 3.0)
  // and lerps in to its wall slot (flyK 1.0) — opposite trajectory of v247.
  const inboundRef = useRef<{ idx: number; startedAt: number; nextAt: number }>({
    idx: -1,
    startedAt: 0,
    nextAt: 0,
  });

  const doorways = useMemo(
    () => computeDoorwayFaces(arrived.position),
    [arrived.position],
  );

  const seeds = useMemo(
    () => makeWallTileSeeds(hashStringToInt(`walls:${arrived.id}`), doorways),
    [arrived.id, doorways],
  );

  // v251 — shed/inbound pieces draw from EITHER doorway face. Pre-bucketing
  // by face lets the schedulers pick a side at random per cycle so material
  // visibly exchanges through both openings rather than only the far one.
  const doorwayTileIndices = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < seeds.length; i++) {
      if (seeds[i].face === doorways.entry || seeds[i].face === doorways.exit) arr.push(i);
    }
    return arr;
  }, [seeds, doorways]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    startTimeRef.current = performance.now() / 1000;
    mesh.count = seeds.length;
    // Walls inherit marker color, dimmed so reaction tiles pop in front.
    // v243 — per-tile ±20% brightness jitter so the cage reads as individual
    // bricks of varying shade, not a flat cardboard sheet of identical color.
    const baseColor = new THREE.Color(arrived.color).multiplyScalar(0.55);
    for (let i = 0; i < seeds.length; i++) {
      tmpColor.copy(baseColor).multiplyScalar(1 + seeds[i].colorJitter);
      mesh.setColorAt(i, tmpColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [arrived.id, arrived.color, seeds]);

  useFrame(({ camera }) => {
    const mesh = meshRef.current;
    if (!mesh || seeds.length === 0) return;
    const elapsed = performance.now() / 1000 - startTimeRef.current;
    const cageFullyBuiltAt = WALL_BUILD_START + WALL_BUILD_DURATION + 0.3;
    // v253 — camera position in the room's local frame. The mini-room is rooted
    // at GALLERY_CENTER + arrived.position; subtracting that from world-camera
    // yields a vector we can directly compare against each tile's seed.pos
    // (which is also in local coords). Used below to dilate the doorway for
    // the approaching camera.
    const camLocX = camera.position.x - (GALLERY_CENTER[0] + arrived.position[0]);
    const camLocY = camera.position.y - (GALLERY_CENTER[1] + arrived.position[1]);
    const camLocZ = camera.position.z - (GALLERY_CENTER[2] + arrived.position[2]);
    // v245 — schedule the next ambient churn after assembly settles.
    if (elapsed > cageFullyBuiltAt) {
      const churn = churnRef.current;
      if (churn.nextAt === 0) churn.nextAt = elapsed + CHURN_PERIOD;
      if (elapsed >= churn.nextAt) {
        churn.idx = Math.floor(Math.random() * seeds.length);
        churn.startedAt = elapsed;
        churn.nextAt = elapsed + CHURN_PERIOD + Math.random() * 0.8;
      }
      // v247 — concurrent doorway-shed: ejects a doorway-face tile far out
      // through the hole. Offset its first fire by ~1.4s from churn so the
      // two rhythms don't beat-lock and the room reads as steadily restless.
      if (doorwayTileIndices.length > 0) {
        const shed = shedRef.current;
        if (shed.nextAt === 0) shed.nextAt = elapsed + DOORWAY_SHED_PERIOD - 1.4;
        if (elapsed >= shed.nextAt) {
          shed.idx =
            doorwayTileIndices[
              Math.floor(Math.random() * doorwayTileIndices.length)
            ];
          shed.startedAt = elapsed;
          shed.nextAt = elapsed + DOORWAY_SHED_PERIOD + Math.random() * 1.0;
        }
        // v248 — inbound rhythm offset ~2.6s from shed first-fire so outbound
        // and inbound alternate visibly instead of phasing together. Picks a
        // separate doorway-face tile each cycle so the user sees one piece
        // leaving while another arrives.
        const inbound = inboundRef.current;
        if (inbound.nextAt === 0) inbound.nextAt = elapsed + INBOUND_PERIOD;
        if (elapsed >= inbound.nextAt) {
          inbound.idx =
            doorwayTileIndices[
              Math.floor(Math.random() * doorwayTileIndices.length)
            ];
          inbound.startedAt = elapsed;
          inbound.nextAt = elapsed + INBOUND_PERIOD + Math.random() * 1.2;
        }
      }
    }
    const churn = churnRef.current;
    const shed = shedRef.current;
    const inbound = inboundRef.current;
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const tileStart = WALL_BUILD_START + seed.delay;
      const tileEnd = tileStart + WALL_BUILD_DURATION;
      const k =
        elapsed < tileStart
          ? 0
          : elapsed > tileEnd
            ? 1
            : (elapsed - tileStart) / (tileEnd - tileStart);
      // ease-out cubic — tiles snap into place rather than soft-ramp
      const eased = 1 - Math.pow(1 - k, 3);
      // v254 — base flyK becomes 1.0; the assembly trajectory now lives in
      // scatter offsets (see assemblyOffset* below). Churn/shed/inbound/exit
      // still treat flyK as the radial outward control. The "fly IN from 1.6×
      // radially" of v244 read as a uniform radial cloud collapsing; the
      // marker shatter is a SCATTER cloud (random unit vectors × varied
      // speeds), so v254 wall tiles fly in from MATCHING scatter origins so
      // the cage reads as the fragment cloud gathering back into a room
      // rather than two separate physics systems running back-to-back.
      let flyK = 1.0;
      // v249 — per-tile tumble (rotation accumulates over the trip) + gravity
      // (Y droop). Without this, churn/shed/inbound pieces translate radially
      // with rotation locked at (0,0,0) — they read as sliding prisms, not
      // tumbling masonry. CRITICAL feedback note: "wall pulse must read as
      // individual tumbling pieces, never a slab; never simplify back."
      let rotX = 0;
      let rotY = 0;
      let rotZ = 0;
      let offsetY = 0;
      // v254 — scatter-trajectory assembly. While eased<1 each tile sits at
      // pos + scatterDir × scatterMag × buildIn (curving in along a random
      // outward direction that overlaps the shatter cloud's actual extent)
      // with a buildIn-scaled tumble so it visibly spins in. At eased=1 the
      // offset is zero and we're back to the wall-slot pose churn/shed/exit
      // operate on.
      const buildIn = 1 - eased; // 1 → 0 across the per-tile window
      const assemblyOffsetX = seed.scatterDir[0] * seed.scatterMag * buildIn;
      const assemblyOffsetY = seed.scatterDir[1] * seed.scatterMag * buildIn;
      const assemblyOffsetZ = seed.scatterDir[2] * seed.scatterMag * buildIn;
      if (buildIn > 0) {
        rotX += buildIn * Math.PI * 1.2 * (0.6 + seed.colorJitter);
        rotY += buildIn * Math.PI * 0.8;
        rotZ += buildIn * Math.PI * 1.0 * (0.4 + Math.abs(seed.colorJitter));
      }
      // v245 — ambient churn override: if this tile is the active churn tile,
      // bulge flyK out to CHURN_MAX_FLY at midpoint then back to 1.0 (sin arc).
      if (i === churn.idx) {
        const churnT = (elapsed - churn.startedAt) / CHURN_DURATION;
        if (churnT >= 0 && churnT < 1) {
          const arc = Math.sin(churnT * Math.PI);
          flyK = Math.max(flyK, 1.0 + (CHURN_MAX_FLY - 1.0) * arc);
          rotX += churnT * Math.PI * 0.5;
          rotZ += churnT * Math.PI * 0.3;
        }
      }
      // v247 — doorway-shed override: doorway-face tile ejected far through
      // the hole (flyK 1.0 → DOORWAY_SHED_MAX_FLY → 1.0 over 1.1s, sin arc).
      // Larger excursion + longer duration than radial churn so it reads as
      // distinct visceral motion — a piece visibly exiting the room.
      if (i === shed.idx) {
        const shedT = (elapsed - shed.startedAt) / DOORWAY_SHED_DURATION;
        if (shedT >= 0 && shedT < 1) {
          const arc = Math.sin(shedT * Math.PI);
          flyK = Math.max(
            flyK,
            1.0 + (DOORWAY_SHED_MAX_FLY - 1.0) * arc,
          );
          rotX += shedT * Math.PI * 1.4;
          rotZ += shedT * Math.PI * 0.7;
          offsetY -= shedT * shedT * 0.6;
        }
      }
      // v248 — inbound override: doorway-face tile materializes at INBOUND_
      // START_FLY (far outside the room past the gap) and decays easeOut-cubic
      // to 1.0 (wall slot) over INBOUND_DURATION. flyValue >= 1.0 throughout so
      // Math.max cleanly takes precedence over the at-rest steady state.
      if (i === inbound.idx) {
        const inboundT = (elapsed - inbound.startedAt) / INBOUND_DURATION;
        if (inboundT >= 0 && inboundT < 1) {
          const easedIn = 1 - Math.pow(1 - inboundT, 3);
          const flyValue =
            INBOUND_START_FLY - (INBOUND_START_FLY - 1.0) * easedIn;
          flyK = Math.max(flyK, flyValue);
          rotX += (1 - easedIn) * Math.PI * 1.4;
          rotZ += (1 - easedIn) * Math.PI * 0.7;
          offsetY -= (1 - inboundT) * (1 - inboundT) * 0.6;
        }
      }
      // v253 — camera-proximity doorway dilation. Tiles on either doorway face
      // whose centers fall within CAMERA_DILATE_RADIUS of the camera get an
      // extra outward flyK + tumble, scaled by 1 - dist/R. The doorway physically
      // OPENS as the camera arrives and the tiles drift back to their slots
      // after it leaves. Doorway-zone tiles are already skipped from the seed
      // grid; this affects tiles ADJACENT to the gap — the hole widens around
      // the camera path, not stays a static notch.
      if (seed.face === doorways.entry || seed.face === doorways.exit) {
        const ddx = seed.pos[0] - camLocX;
        const ddy = seed.pos[1] - camLocY;
        const ddz = seed.pos[2] - camLocZ;
        const dist = Math.hypot(ddx, ddy, ddz);
        if (dist < CAMERA_DILATE_RADIUS) {
          const punch = 1 - dist / CAMERA_DILATE_RADIUS;
          flyK = Math.max(flyK, 1.0 + CAMERA_DILATE_FLY_BOOST * punch);
          rotX += punch * Math.PI * 0.8;
          rotZ += punch * Math.PI * 0.5;
        }
      }
      // v250 — exit crumble. Once the user navigates away, exitStartedAt is set
      // and every tile flies outward + tumbles + drops + scales to zero over
      // EXIT_DURATION. Doorway-face tiles already point outward through the gap,
      // so their radial flight reads as "pouring through the door"; non-doorway
      // tiles slip through their wall but rapidly shrink so the visual reads as
      // material dissolution rather than clipping. Closes Tom's bidirectional
      // "moving through gaps" criterion — leaving a room mirrors entering it.
      let exitScale = eased;
      if (exitStartedAt !== null) {
        const exitElapsed = elapsed - exitStartedAt;
        const exitT = Math.min(1, Math.max(0, exitElapsed / EXIT_DURATION));
        if (exitT > 0) {
          const exitEased = 1 - Math.pow(1 - exitT, 3);
          flyK = Math.max(flyK, 1.0 + EXIT_FLY_GROWTH * exitEased);
          rotX += exitT * Math.PI * 1.4;
          rotZ += exitT * Math.PI * 0.7;
          offsetY -= exitT * exitT * EXIT_GRAVITY;
          exitScale = eased * Math.max(0, 1 - exitEased);
        }
      }
      tmpObj.position.set(
        seed.pos[0] * flyK + assemblyOffsetX,
        seed.pos[1] * flyK + assemblyOffsetY + offsetY,
        seed.pos[2] * flyK + assemblyOffsetZ,
      );
      tmpObj.rotation.set(rotX, rotY, rotZ);
      tmpObj.scale.set(
        seed.size[0] * exitScale,
        seed.size[1] * exitScale,
        seed.size[2] * exitScale,
      );
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MINI_ROOM_WALL_TILE_CAPACITY]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial vertexColors toneMapped={false} fog />
    </instancedMesh>
  );
}

// v252 — outward normal per wall face so reaction tiles can fly through the
// face they're glued to during exit crumble. Mirrors the wall's own outward
// flyK direction so reactions and walls dissolve through the same physical
// gesture (peel off the wall, tumble, scale to zero) instead of reactions
// freezing in mid-air while the cage crumbles around them.
function reactionOutwardNormal(wallFace: number): [number, number, number] {
  switch (wallFace) {
    case 0: return [1, 0, 0];
    case 1: return [-1, 0, 0];
    case 2: return [0, 1, 0];
    case 3: return [0, -1, 0];
    case 4: return [0, 0, 1];
    case 5:
    default: return [0, 0, -1];
  }
}

function ReactionTiles({
  roomId,
  reactions,
  arrivedAt,
  exitStartedAt,
}: {
  roomId: string;
  reactions: ReactionTile[];
  arrivedAt: number;
  exitStartedAt: number | null;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  // Position cache so we project (face,u,v) once per reaction-list change
  // rather than per frame. Wall-clock arrival time is also cached so each
  // tile can fade/scale in independently when newly appended.
  const projected = useMemo(() => {
    const slice = reactions.slice(-REACTION_CAPACITY);
    return slice.map((r, i) => ({
      tile: r,
      pos: projectReactionPosition(r.wallFace, r.u, r.v),
      normal: reactionOutwardNormal(r.wallFace),
      // Per-tile tumble axis so the exit crumble doesn't look mechanical.
      // Seeded by face+u+v so it's stable across frames.
      tumble: ((Math.sin(r.u * 12.9898 + r.v * 78.233 + r.wallFace) * 43758.5453) % 1 + 1) % 1,
      // Tiles already present at arrival use arrivedAt as their birth so
      // they animate in with the shatter. Tiles posted after arrival use
      // their own row createdAt (or now() for optimistic locals) so they
      // pop in fresh when the click happens.
      bornAt:
        i < reactions.length - 1
          ? arrivedAt
          : performance.now() / 1000,
    }));
  }, [reactions, arrivedAt]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.count = projected.length;
    for (let i = 0; i < projected.length; i++) {
      const { tile } = projected[i];
      tmpColor.set(MOOD_COLORS[tile.kind]);
      mesh.setColorAt(i, tmpColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [projected]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || projected.length === 0) return;
    const now = performance.now() / 1000;
    // v252 — exit crumble for reaction tiles. When exitStartedAt fires, each
    // tile flies outward along its wall normal, tumbles on a seeded axis, drops
    // under gravity, and scales to zero over EXIT_DURATION — mirroring the wall
    // tile crumble so reactions don't freeze in mid-air while the cage around
    // them disintegrates. Reactions and walls dissolve through the same physical
    // language: "everything in this room peels off and tumbles away."
    const exitT =
      exitStartedAt !== null
        ? Math.min(1, Math.max(0, (now - exitStartedAt) / EXIT_DURATION))
        : 0;
    const exitEased = exitT > 0 ? 1 - Math.pow(1 - exitT, 3) : 0;
    for (let i = 0; i < projected.length; i++) {
      const { pos, bornAt, normal, tumble } = projected[i];
      const age = Math.max(0, now - bornAt);
      const t = Math.min(1, age / 1.2);
      const eased = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
      const overshoot = t < 1 ? Math.sin(t * Math.PI) * 0.12 : 0;
      const baseScale = (eased + overshoot) * REACTION_TILE_SIZE;
      const exitScale = exitT > 0 ? Math.max(0, 1 - exitEased) : 1;
      const outDist = exitEased * EXIT_FLY_GROWTH * 1.2;
      const drop = exitT * exitT * EXIT_GRAVITY;
      const rotMagnitude = exitT * Math.PI * 1.4;
      tmpObj.position.set(
        pos[0] + normal[0] * outDist,
        pos[1] + normal[1] * outDist - drop,
        pos[2] + normal[2] * outDist,
      );
      tmpObj.rotation.set(
        rotMagnitude * (0.5 + tumble),
        rotMagnitude * (0.3 + tumble * 0.7),
        rotMagnitude * (0.4 + tumble * 0.5),
      );
      tmpObj.scale.setScalar(baseScale * exitScale);
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={roomId}
      ref={meshRef}
      args={[undefined, undefined, REACTION_CAPACITY]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial vertexColors toneMapped={false} fog />
    </instancedMesh>
  );
}

export function GalleryArrival() {
  const externalArrived = useSyncExternalStore(
    subscribeArrivedMarker,
    getArrivedMarker,
    getArrivedMarker,
  );
  // v250 — hold the last-seen marker across the exit window so the cage can
  // crumble out instead of instantly unmounting when the store clears.
  type ArrivedShape = NonNullable<typeof externalArrived>;
  const [displayedMarker, setDisplayedMarker] = useState<ArrivedShape | null>(null);
  const [exitStartedAt, setExitStartedAt] = useState<number | null>(null);
  useEffect(() => {
    if (externalArrived) {
      setDisplayedMarker(externalArrived);
      setExitStartedAt(null);
      return;
    }
    if (!displayedMarker || exitStartedAt !== null) return;
    setExitStartedAt(performance.now() / 1000);
    const timer = window.setTimeout(() => {
      setDisplayedMarker(null);
      setExitStartedAt(null);
    }, EXIT_DURATION * 1000 + 80);
    return () => window.clearTimeout(timer);
  }, [externalArrived, displayedMarker, exitStartedAt]);
  const arrived = displayedMarker;
  const reactions = useSyncExternalStore(
    subscribeReactions,
    () => getReactionsFor(arrived?.id ?? null),
    () => getReactionsFor(arrived?.id ?? null),
  );
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const startTimeRef = useRef<number>(0);
  const [posting, setPosting] = useState(false);

  const seeds = useMemo<FragmentSeed[]>(() => {
    if (!arrived) return [];
    return makeFragmentSeeds(hashStringToInt(arrived.id));
  }, [arrived]);

  // Load existing reactions when arrival fires. Seed-mode markers
  // (id starts with "seed-") have no row in public_rooms, so we skip
  // the fetch and the panel hides the buttons.
  useEffect(() => {
    if (!arrived) return;
    if (arrived.id.startsWith("seed-")) return;
    void loadReactionsFor(arrived.id);
  }, [arrived]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!arrived || !mesh) return;
    startTimeRef.current = performance.now() / 1000;
    mesh.count = FRAGMENT_COUNT;
    tmpColor.set(arrived.color);
    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      mesh.setColorAt(i, tmpColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [arrived]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!arrived || !mesh || seeds.length === 0) return;
    const elapsed = performance.now() / 1000 - startTimeRef.current;
    const norm = Math.min(1, elapsed / SHATTER_DURATION);
    const ease = 1 - Math.pow(1 - norm, 2);
    const fall = norm * norm * GRAVITY;
    const t = clock.getElapsedTime();
    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      const seed = seeds[i];
      const dist = seed.speed * ease;
      tmpObj.position.set(
        seed.dx * dist,
        seed.dy * dist - fall,
        seed.dz * dist,
      );
      tmpAxis.set(seed.ax, seed.ay, seed.az);
      tmpObj.setRotationFromAxisAngle(tmpAxis, t * seed.spin + i * 0.4);
      const scale =
        norm < 0.95
          ? 1 - norm * 0.35
          : (1 - 0.95 * 0.35) * (1 - (norm - 0.95) / 0.05);
      tmpObj.scale.setScalar(Math.max(0, scale));
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!arrived) return null;

  const worldPos: [number, number, number] = [
    GALLERY_CENTER[0] + arrived.position[0],
    GALLERY_CENTER[1] + arrived.position[1],
    GALLERY_CENTER[2] + arrived.position[2],
  ];

  const isSeed = arrived.id.startsWith("seed-");

  // Deterministic-ish next anchor per arrival × mood — combines the
  // arrival id with the existing reaction count so repeated clicks of
  // the same mood scatter across the room rather than piling at one face.
  const nextAnchor = (kind: MoodTileKind): { face: number; u: number; v: number } => {
    const base = hashStringToInt(`${arrived.id}:${kind}:${reactions.length}`);
    const r1 = ((base >>> 0) % 1000) / 1000;
    const r2 = (((base >>> 10) & 0x3ff) % 1000) / 1000;
    const r3 = (((base >>> 20) & 0x3ff) % 1000) / 1000;
    return {
      face: Math.floor(r1 * 6),
      u: 0.1 + r2 * 0.8,
      v: 0.1 + r3 * 0.8,
    };
  };

  const onMoodClick = async (kind: MoodTileKind) => {
    if (isSeed || posting) return;
    setPosting(true);
    const anchor = nextAnchor(kind);
    try {
      await postReaction({
        roomId: arrived.id,
        kind,
        wallFace: anchor.face,
        u: anchor.u,
        v: anchor.v,
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <group position={worldPos}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, FRAGMENT_COUNT]}
        frustumCulled={false}
      >
        <boxGeometry args={[FRAGMENT_SIZE, FRAGMENT_SIZE, FRAGMENT_SIZE]} />
        <meshBasicMaterial vertexColors toneMapped={false} fog />
      </instancedMesh>
      <MiniRoomWalls arrived={arrived} exitStartedAt={exitStartedAt} />
      <ReactionTiles
        roomId={arrived.id}
        reactions={reactions}
        arrivedAt={startTimeRef.current}
        exitStartedAt={exitStartedAt}
      />
      <Html
        center
        distanceFactor={6}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="px-5 py-4 min-w-[260px] max-w-[320px] text-center"
          style={{
            background: `${arrived.color}26`,
            borderColor: arrived.color,
            borderWidth: 1,
            borderStyle: "solid",
            boxShadow: `0 0 22px ${arrived.color}88`,
            color: "white",
            textShadow: "0 1px 3px rgba(0,0,0,0.85)",
            backdropFilter: "blur(4px)",
            // v250 — fade the goal panel in lock-step with the wall crumble so
            // when the user navigates away both the DOM and canvas disintegrate
            // together rather than the panel hanging in space over flying tiles.
            opacity: exitStartedAt !== null ? 0 : 1,
            transform: exitStartedAt !== null ? "scale(0.85)" : "scale(1)",
            transition: `opacity ${EXIT_DURATION * 0.85}s ease-out, transform ${EXIT_DURATION * 0.85}s ease-out`,
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 opacity-70">
            their goal
          </div>
          <div className="text-base font-semibold leading-tight mb-3">
            {arrived.goalTitle}
          </div>
          {isSeed ? (
            <div className="text-[10px] opacity-60 italic">
              seed marker · publish your room to react
            </div>
          ) : (
            <div
              className="flex justify-center gap-2 pt-2 mt-2 border-t"
              style={{
                borderColor: `${arrived.color}55`,
                pointerEvents: "auto",
              }}
            >
              {MOOD_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => onMoodClick(kind)}
                  disabled={posting}
                  title={MOOD_LABELS[kind]}
                  aria-label={`react with ${MOOD_LABELS[kind]}`}
                  className="w-9 h-9 flex items-center justify-center text-base font-bold transition-transform hover:scale-110 active:scale-95 disabled:opacity-40 cursor-pointer"
                  style={{
                    background: `${MOOD_COLORS[kind]}1f`,
                    border: `1px solid ${MOOD_COLORS[kind]}`,
                    color: MOOD_COLORS[kind],
                    boxShadow: `0 0 10px ${MOOD_COLORS[kind]}55`,
                    textShadow: `0 0 6px ${MOOD_COLORS[kind]}`,
                  }}
                >
                  {MOOD_GLYPHS[kind]}
                </button>
              ))}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
