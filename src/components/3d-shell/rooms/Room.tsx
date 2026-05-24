"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import {
  BUMP_LIFETIME,
  CELEBRATION_LIFETIME,
  findConnectionFace,
  getActiveBumps,
  getActiveCelebrations,
  getCameraBreathPhase,
  getCameraForward,
  getCameraMotion,
  getCameraWorld,
  getCharacterFor,
  getCursorWorld,
  getGenerating,
  getLayoutFor,
  getPrevRoomView,
  getRoomView,
  usePulse,
  type ViewKey,
  type WallFace,
} from "../RoomRegistry";
import { cosmosTargetFor } from "../cosmosPositions";
import { COSMOS_ACTIVATION } from "../cosmosActivation";
import { COSMOS_DOORWAY_DIR } from "../cosmosDoorwayDir";
import { getActionIntent } from "../actionIntent";
import { getDayWarmth } from "../timeOfDayIntent";
import { CornerBevels } from "./CornerBevels";

interface RoomProps {
  viewKey: ViewKey;
  /**
   * P3 v32 — tileSize is now per-room via RoomCharacter.tileSize and resolved
   * from the registry by default. Prop override is kept only as an escape hatch
   * for /3d-debug experiments; production mounts pass viewKey only.
   */
  tileSize?: number;
  pulseDuration?: number;
  pulseStrength?: number;
}

interface TileData {
  px: number;
  py: number;
  pz: number;
  rx: number;
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  sz: number;
  color: THREE.Color;
  // outward dispersion direction (unit vector) + per-tile drift seed
  ox: number;
  oy: number;
  oz: number;
  driftSeed: number;
  wall: WallFace;
  // Pulse choreography: each tile fires within its own slice of the wall-pulse
  // window so the wall reads as individual pieces falling out, not a slab.
  delayN: number;     // 0..0.45 — fraction of window before this tile starts
  tx: number;         // tangent scatter direction (perp to outward)
  ty: number;
  tz: number;
  spinX: number;      // random tumble axis (unit)
  spinY: number;
  spinZ: number;
  spinAmount: number; // peak rotation in radians at full progress
  // 0..1 deterministic per-tile bias; combined with pulse role at runtime to pick
  // outward (+1) vs inward (-1). See useFrame for the role-aware grammar.
  signBias: number;
  // Doorway lintel: tile sits in the first ring around the opening on a face that
  // has an opening. These tiles fire LATE in the pulse window so they hover at
  // the threshold while the rest of the wall has already disassembled (OUT) /
  // are still scattered (IN), emphasizing the architectural frame as the
  // camera passes through. See useFrame delay override.
  isLintel: boolean;
  // Accent tiles carry a brand-palette color (vs muted base palette). During the
  // 1.4s wall pulse, accent tiles ramp emissive 0 → peak → 0 (sin envelope) so
  // the wall visibly *sparks* during fragmentation. Non-accent tiles stay dark.
  // Per-instance via shader injection (instanceEmissiveColor attribute) since
  // InstancedMesh shares one material — see onBeforeCompile in component body.
  isAccent: boolean;
  // Proximity to the doorway opening on this tile's wall (P3 v12). 1 = on the
  // opening edge, 0 = far corner. Only meaningful on walls that have an
  // opening (the room's connection faces). Used at pulse time to scale
  // amplitude so the shatter emanates outward from the gap, not uniformly.
  openingProximity: number;
  // P3 v17 — relief depth. depthOffset shifts the tile's HOME position along
  // its outward normal (range ≈ -0.05..+0.12u) so the wall reads as a 3D
  // mosaic instead of a coplanar grid. The depth-axis scale (sz) is also
  // multiplied per-tile (0.7x–2.2x of base), correlated with depthOffset so
  // thicker tiles jut farther — gives the wall a cut-stone tactility, makes
  // camera parallax + hover field tactile, gives bumps mass differentiation.
  depthOffset: number;
  // P3 v22 — doorway-away unit vector in the wall plane. For lintel tiles on
  // a wall with an opening, points FROM opening center TO tile home (within
  // the wall plane, perpendicular to outward). Composed into pulse on the
  // connection wall so the doorway visibly *opens* on OUT (lintel tiles part
  // outward perpendicular to the gap edge) and *seals* on IN. Zero for
  // non-lintel tiles or walls without an opening.
  dwx: number;
  dwy: number;
  dwz: number;
}

export function Room({
  viewKey,
  tileSize: tileSizeProp,
  pulseDuration: pulseDurationProp,
  pulseStrength: pulseStrengthProp,
}: RoomProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // P2 v80 — UNIFY #12: atmospheric particle drift offset. The Sparkles cloud
  // is wrapped in a group whose position lerps each frame toward
  // -cameraForward × cameraMotion × PARTICLE_DRIFT_AMP. At rest the offset
  // returns to (0,0,0) so the cloud sits exactly at room center; during dolly
  // it slides backward in world space — relative to the forward-moving
  // camera, dust appears to flow toward the camera face. FIRST UNIFY-axis
  // consumer on particles; pairs the v77 audio drone with a visible "air
  // moves with you" thread.
  const particleGroupRef = useRef<THREE.Group>(null);
  const particleDriftCurr = useRef({ x: 0, y: 0, z: 0 });
  // P3 v101 — UNIFY #33: atmospheric-particle SPAWN-RATE (Sparkles speed
  // uniform) rises with cameraMotion. FOURTH temporal-frequency consumer on a
  // FOURTH substrate — closes the frequency axis to 4 substrates, matching
  // color's complete 4-substrate reach (v94). Sparkles internally drives
  // per-particle phase via `time * speed` inside its ShaderMaterial, so
  // mutating `material.uniforms.speed.value` per-frame directly accelerates
  // the entire particle cloud's animation rate. Pattern matches v95/v96/v97
  // direct-mutation idioms (AudioParam.value, phase accumulators, uniform
  // writes). PARTICLE_FREQ_MIX 0.5 sits between LINTEL_BREATH_FREQ_MIX (0.6 —
  // visual breath has the most headroom) and FLOOR_FREQ_MIX (0.4 — geometric
  // wave); particles are perceptually permissive on rate variance because the
  // cloud is high-count noise rather than a single oscillator, so a wider
  // mix reads as "the air thickens with motion" without becoming choppy.
  // Pre-v101 the particle substrate carried ONLY directional (v80 drift);
  // v101 adds frequency, making particles a 2-axis substrate (directional +
  // frequency). With v101 the four frequency consumers span four substrates:
  // canvas-visual threshold (lintel breath), audio (drone pitch), canvas-
  // visual floor (wave speed), canvas-visual atmosphere (particles). Same
  // 4-substrate reach color achieved across atmosphere + walls + cosmos +
  // threshold. Temporal-frequency is now a STRUCTURALLY COMPLETE axis.
  const sparklesRef = useRef<THREE.Points>(null);
  const PARTICLE_FREQ_MIX = 0.5;
  // v169 — META-PIVOT cut #19. WAYFINDING crosses into the 9th substrate:
  // ROOM LIGHTING. v85 made room lights warm WITH MOTION (first lighting
  // consumer on the color axis); v169 makes them BRIGHTEN with doorway-
  // alignment — the first lighting consumer of the doorway-direction field.
  // Per-frame the camera-forward unit vector is dotted against
  // COSMOS_DOORWAY_DIR; the warm + cool pointLights gain an additive
  // intensity boost proportional to max(0, dot). Reads as "the room
  // illuminates the lane you're facing" — when you turn to a doorway the
  // entire room subtly brightens, then dims as you pivot away. 0.55 peak
  // multiplier chosen visceral without crushing the per-room mood balance
  // (warm 1.6×, cool 0.9× baselines preserved at orthogonal/anti-aligned
  // views). Promotes wayfinding to 9-substrate breadth and adds the second
  // consumer of the doorway field on the LIGHTING substrate (the first
  // was indirect — v161 wall-accent emissive on the wall substrate, NOT
  // lighting). First TRUE lighting wayfinding cut.
  const warmLightRef = useRef<THREE.PointLight>(null);
  const coolLightRef = useRef<THREE.PointLight>(null);
  const LIGHT_DOORWAY_INTENSITY_MIX = 0.55;
  // P3 v111 — UNIFY #43: OPENS NEGATIVE-polarity quadrant of HARMONIC CONVERGENCE
  // meta-class via ANTI-PHASE coupling. v108→v110 filled harmonic's POSITIVE
  // quadrant with 3 substrates (lintel breath, floor wave, audio drone tremolo)
  // — every consumer pulls its phase TOWARD camera breath phase under motion.
  // v111 introduces the structurally novel inverse: a consumer that DESYNCS from
  // camera breath under motion. Atmospheric particle speed gets a free-running
  // phase accumulator that pulls toward (cameraBreathPhase + π) — i.e. the
  // OPPOSITE point on the breath circle — with strength rising as cameraMotion.
  // Speed is then modulated by `(1 + sin(particlePhase) × HARMONIC_ANTI_DEPTH ×
  // camMotion)`, gated by camMotion so a parked listener sees no warble. Reads
  // as the air "ANSWERING" the camera breath rather than echoing it: when the
  // lintel breath peaks (camera breath peaks), the particle cloud SLOWS; when
  // lintel troughs, particles BURST. Structurally novel in the entire field —
  // every prior negative-coupling cut yielded SCALAR (amplitude/rate) to motion;
  // v111 yields PHASE RELATIONSHIP. Anti-phase as a unification primitive.
  // Polarity-novel for harmonic (1/2 → 2/2 quadrants in 1 cut). Substrate-novel
  // for harmonic (3 → 4 substrates). Substrate breadth maturation arc completes
  // — particle substrate now carries directional (v80), frequency (v101), AND
  // harmonic-anti-phase (v111). HARMONIC_ANTI_LOCK_STRENGTH=0.5 mirrors the
  // positive-polarity HARMONIC_LOCK_STRENGTH for meta-class grading coherence.
  // HARMONIC_ANTI_DEPTH=0.4 mirrors TREMOLO_DEPTH (v110) — peak ±40% speed swing
  // is perceptually audible-equivalent for a particle cloud's animation rate.
  const particlePhaseRef = useRef(0);
  const HARMONIC_ANTI_LOCK_STRENGTH = 0.5;
  const HARMONIC_ANTI_BASE_LERP = 4.0;
  const HARMONIC_ANTI_DEPTH = 0.4;

  // Stable layout + character for this room (keyed by viewKey, not by current view)
  const layout = useMemo(() => getLayoutFor(viewKey), [viewKey]);
  const character = useMemo(() => getCharacterFor(viewKey), [viewKey]);

  // v158 — META-PIVOT cut #8 (VISIBLE). Cosmos doorway-direction lane glow.
  // On view change, compute the active room's PRIMARY doorway direction as
  // the normalized sum of unit vectors per open opening (north=-z, south=+z,
  // east=+x, west=-x, top=+y, bottom=-y) and stamp it into the shared
  // Float32Array. TileVoid.tsx reads this each frame and ramps a per-instance
  // emissive shaft along that direction across the cosmos shell — the slabs
  // sitting along the line of each open doorway light up softly, turning the
  // cosmos itself into a wayfinding affordance for "where the camera goes
  // when you step through." Idempotent per-render — writes the same 3 floats
  // until openings change. Single-room rooms (calendar = south only) yield a
  // unit-length cardinal vector; multi-opening rooms (landing has 4 cardinals
  // + top) yield the residual after pairwise cancellation (here = +y).
  useEffect(() => {
    const openings = layout.openings;
    let dx = 0, dy = 0, dz = 0;
    if (openings.north)  dz -= 1;
    if (openings.south)  dz += 1;
    if (openings.east)   dx += 1;
    if (openings.west)   dx -= 1;
    if (openings.top)    dy += 1;
    if (openings.bottom) dy -= 1;
    const len = Math.hypot(dx, dy, dz);
    if (len > 1e-6) { dx /= len; dy /= len; dz /= len; }
    else            { dy = 1; } // fallback: up — non-zero so the shader stays well-defined
    COSMOS_DOORWAY_DIR[0] = dx;
    COSMOS_DOORWAY_DIR[1] = dy;
    COSMOS_DOORWAY_DIR[2] = dz;
  }, [layout]);
  const { palette, accents, accentChance, warmIntensity, coolIntensity, warmColor, coolColor, warmOffset, coolOffset, tileRoughness, tileMetalness } = character;
  const atmosphereColor = character.atmosphereColor ?? warmColor;
  // P3 v32 — tileSize comes from the room's character; prop override is only
  // honored when explicitly set (e.g. /3d-debug A/B harness).
  const tileSize = tileSizeProp ?? character.tileSize;
  // P3 v34 — wall pulse character (duration + strength) is per-room. Kinetic
  // mood of arrival matches static mood: goals=sharp, calendar=swelling,
  // congrats=explosive, privacy/terms=stiff/formal, reset-password=urgent.
  const pulseDuration = pulseDurationProp ?? character.pulseDuration;
  const pulseStrength = pulseStrengthProp ?? character.pulseStrength;

  const tiles = useMemo<TileData[]>(() => {
    const out: TileData[] = [];
    const [width, height, depth] = layout.size;
    const [cx, cy, cz] = layout.center;
    // P3 v33 — wall tile aspect: preserve area, redistribute as W×H. Floors and
    // ceilings stay square (one tileSize on both axes) so the floor reads as a
    // continuous fabric and aspect only shows up on the vertical surfaces the
    // camera looks at head-on. sqrt-split keeps tile count per wall ~stable so
    // tuning aspect doesn't accidentally also re-tune density.
    const aspect = Math.max(0.25, Math.min(4, character.tileAspect));
    const sqrtA = Math.sqrt(aspect);
    const tileW = tileSize * sqrtA;     // wall horizontal (tangent)
    const tileH = tileSize / sqrtA;     // wall vertical
    const tilesX_FC = Math.floor(width / tileSize);   // floor/ceiling X
    const tilesZ_FC = Math.floor(depth / tileSize);   // floor/ceiling Z
    const tilesX_NS = Math.floor(width / tileW);      // north/south horizontal
    const tilesY_NS = Math.floor(height / tileH);     // north/south vertical
    const tilesZ_EW = Math.floor(depth / tileW);      // east/west horizontal
    const tilesY_EW = Math.floor(height / tileH);     // east/west vertical
    const halfW = width / 2;
    const halfH = height / 2;
    const halfD = depth / 2;
    // P2 v66 — per-room TILE MORTAR GAP. Pre-v66 every tile was shrunk by 8%
    // uniformly (`* 0.92`), so the negative-space joint between tiles was the
    // same in every room — vault and party rooms looked equally seamed. v66
    // makes the joint per-room: privacy/terms 0 (monolithic poured slab),
    // congrats 0.025 (party bricks). Default fallback preserves pre-v66
    // behavior for any room that hasn't declared mortarGap (8% of tileSize).
    const mortarGap = character.mortarGap ?? (tileSize * 0.08);
    const tilePad = tileSize - mortarGap;       // floor/ceiling pad
    const tileWPad = tileW - mortarGap;         // wall horizontal pad
    const tileHPad = tileH - mortarGap;         // wall vertical pad
    const openings = layout.openings;

    const seed = (x: number, y: number) => {
      const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return h - Math.floor(h);
    };

    const pickColor = (x: number, y: number): { hex: string; isAccent: boolean } => {
      const r = seed(x + 1, y + 1);
      if (r < accentChance) {
        return { hex: accents[Math.floor(seed(x, y) * accents.length)], isAccent: true };
      }
      return { hex: palette[Math.floor(seed(x * 2, y * 2) * palette.length)], isAccent: false };
    };

    // P2 v57 — opening can be offset from wall center via op.cx/op.cy. cy < 0
    // lowers the threshold (privacy vault crouch), cy > 0 raises it (goals eager
    // reach). cx shifts laterally. Pre-v57 every doorway was centered (0,0).
    // P2 v62 — opening can also have a per-room SHAPE: rect (default), arch (round
    // Roman top), point (gothic pointed top), slot (narrow legal-vault slit).
    // Both inOpening (tile culling) and lintelDist (lintel-ring detection) honor
    // the shape so the visible silhouette and surrounding frame match per-room
    // architectural register.
    type OpeningWithShape = {
      w: number;
      h: number;
      cx?: number;
      cy?: number;
      shape?: 'rect' | 'arch' | 'point' | 'slot';
    };
    const inOpening = (a: number, b: number, op?: OpeningWithShape) => {
      if (!op) return false;
      const dx = a - (op.cx ?? 0);
      const dy = b - (op.cy ?? 0);
      const hw = op.w / 2;
      const hh = op.h / 2;
      const shape = op.shape ?? 'rect';
      if (shape === 'rect') {
        return Math.abs(dx) <= hw && Math.abs(dy) <= hh;
      }
      if (shape === 'slot') {
        // narrow vertical slit — half-width rect at center
        return Math.abs(dx) <= hw / 2 && Math.abs(dy) <= hh;
      }
      if (shape === 'arch') {
        // round Roman arch: rect bottom, ellipse top
        if (dy <= 0) return Math.abs(dx) <= hw && dy >= -hh;
        const u = dx / hw;
        const v = dy / hh;
        return u * u + v * v <= 1;
      }
      // point — gothic pointed arch: rect bottom, triangle top
      if (dy <= 0) return Math.abs(dx) <= hw && dy >= -hh;
      return Math.abs(dx) / hw + dy / hh <= 1;
    };

    // Distance from a face-local point to the opening silhouette (0 if inside).
    // Tiles within ~one tile-width of the opening are flagged as lintel — they
    // form the doorway frame and pulse with a delayed stagger. Shape-aware so
    // arch tops get cathedral lintel curves and points get gothic apex rings.
    const lintelDist = (a: number, b: number, op?: OpeningWithShape) => {
      if (!op) return Infinity;
      const dx = a - (op.cx ?? 0);
      const dy = b - (op.cy ?? 0);
      const hw = op.w / 2;
      const hh = op.h / 2;
      const shape = op.shape ?? 'rect';
      if (shape === 'rect') {
        const ex = Math.max(Math.abs(dx) - hw, 0);
        const ey = Math.max(Math.abs(dy) - hh, 0);
        return Math.sqrt(ex * ex + ey * ey);
      }
      if (shape === 'slot') {
        const ex = Math.max(Math.abs(dx) - hw / 2, 0);
        const ey = Math.max(Math.abs(dy) - hh, 0);
        return Math.sqrt(ex * ex + ey * ey);
      }
      if (shape === 'arch') {
        if (dy <= 0) {
          const ex = Math.max(Math.abs(dx) - hw, 0);
          const ey = Math.max(-hh - dy, 0);
          return Math.sqrt(ex * ex + ey * ey);
        }
        // Approximate distance to ellipse: scale to unit circle, scale-back by min radius.
        const u = dx / hw;
        const v = dy / hh;
        const r = Math.sqrt(u * u + v * v);
        if (r <= 1) return 0;
        const minHalf = Math.min(hw, hh);
        return (r - 1) * minHalf;
      }
      // point — distance to triangle edge: |dx|*hh + dy*hw = hw*hh
      if (dy <= 0) {
        const ex = Math.max(Math.abs(dx) - hw, 0);
        const ey = Math.max(-hh - dy, 0);
        return Math.sqrt(ex * ex + ey * ey);
      }
      const inside = Math.abs(dx) / hw + dy / hh;
      if (inside <= 1) return 0;
      return (Math.abs(dx) * hh + dy * hw - hw * hh) / Math.sqrt(hh * hh + hw * hw);
    };
    // P2 v51 — lintel ring thickness is per-room. Pre-v51 every room shared the
    // hardcoded * 1.2 multiplier, so every doorway had the same frame depth no
    // matter the room mood. Now privacy can wear a chunky vault frame (1.8) while
    // congrats has a thin cathedral lip (0.9) that dissolves into the room.
    const LINTEL_RING_THICKNESS_FALLBACK = 1.2;
    const lintelRingThickness = character.lintelRingThickness ?? LINTEL_RING_THICKNESS_FALLBACK;
    const LINTEL_THRESH_FC = tileSize * lintelRingThickness;                 // floor/ceiling — square
    const LINTEL_THRESH_W  = Math.max(tileW, tileH) * lintelRingThickness;   // walls — use the larger axis so the first ring is always captured regardless of aspect
    // P2 v63 — per-room doorway casing depth. World-unit recess of the cloned
    // lintel ring along the wall's inward normal. >0 spawns a second ring of
    // lintel tiles offset inward, building a tile-built threshold tunnel. 0
    // skips the clone (paper-thin lintel — pre-v63 behavior).
    const doorwayCasingDepth = character.doorwayCasingDepth ?? 0;
    // P2 v64 — per-room wall tile depth (the box Z extent). VISION: tiles are
    // "discrete physical objects — thickness, mass." Pre-v64 every wall tile
    // used 0.06; v64 spreads 0.05 (calendar parchment) → 0.16 (privacy/terms
    // vault stone). Applied to wall + lintel + casing-clone tiles uniformly.
    const wallTileDepth = character.wallTileDepth ?? 0.06;
    // P2 v65 — per-room tile depth jitter (signed offset along outward normal).
    // VISION calls tiles "discrete physical objects" — real masonry tiles, hand-
    // laid, sit slightly proud or recessed in their planes. 0 = machined-flush
    // vault tolerance (privacy/terms); 0.050 = party-tilt celebration askew
    // (congrats). Stable per-tile via driftSeed so a given tile sits the same
    // amount proud across renders. Applied to wall + lintel + casing-clone
    // tiles uniformly — real masonry craftsmanship is uniform.
    const tileDepthJitter = character.tileDepthJitter ?? 0;
    // P2 v67 — per-room WALL BOND / STAGGER. 0 = stacked bond (vertical
    // joints aligned floor-to-ceiling); 0.5 = perfect running bond (odd rows
    // shifted by half a tile width). Applied to wall + casing-clone tiles.
    // Tiles whose centers exit the wall edge on staggered rows are dropped
    // (matches "queen closer" half-brick reality — staggered row has one
    // fewer tile on the overshoot side). Floor/ceiling bond NOT affected —
    // wall bond is the dominant architectural read.
    const wallStagger = character.wallStagger ?? 0;

    const push = (
      px: number, py: number, pz: number,
      rx: number, ry: number, rz: number,
      sx: number, sy: number, sz: number,
      colorHex: string,
      outwardDir: [number, number, number],
      driftSeed: number,
      wall: WallFace,
      isLintel: boolean,
      isAccent: boolean,
      openingProximity: number,
      doorwayAway: [number, number, number],
    ) => {
      const len = Math.hypot(...outwardDir) || 1;
      const ox = outwardDir[0] / len;
      const oy = outwardDir[1] / len;
      const oz = outwardDir[2] / len;

      // P2 v65 — apply per-tile depth jitter along outward normal. Skip on
      // floor/ceiling tiles (outward is ±Y), which go through this push() too
      // but live in a different surface family (ground/sky, not wall craft).
      if (tileDepthJitter !== 0 && Math.abs(oy) < 0.9) {
        // Stable signed pseudo-random in [-1, 1] from driftSeed — same tile,
        // same offset across renders.
        const jHash = Math.sin(driftSeed * 12.9898 + 78.233) * 43758.5453;
        const jSigned = (jHash - Math.floor(jHash)) * 2 - 1;
        const jOff = jSigned * tileDepthJitter;
        px += ox * jOff;
        py += oy * jOff;
        pz += oz * jOff;
      }

      // Deterministic per-tile randomness so the choreography is stable across renders.
      const r1 = seed(driftSeed * 0.31, driftSeed * 1.7);
      const r2 = seed(driftSeed * 2.1, driftSeed * 0.83);
      const r3 = seed(driftSeed * 0.91, driftSeed * 3.7);
      const r4 = seed(driftSeed * 1.37, driftSeed * 0.59);
      const r5 = seed(driftSeed * 0.47, driftSeed * 2.9);

      // Non-lintel tiles stagger across the first ~45% of the pulse window — they
      // leave/arrive in waves. Lintel tiles (first ring around the doorway) get
      // a *late* slot 0.55..0.90 so they hover at the threshold while the rest
      // of the wall has already disassembled (OUT) or is still flying in (IN).
      // Camera passes through a still-framed gap; architectural lintel reads.
      const delayN = isLintel ? 0.55 + r1 * 0.35 : r1 * 0.45;

      // Tangent direction perpendicular to outward — pick whichever cross product is non-degenerate.
      const upDot = Math.abs(oy);
      const baseAxisX = upDot > 0.9 ? 1 : 0;
      const baseAxisY = upDot > 0.9 ? 0 : 1;
      const baseAxisZ = 0;
      // tangent = base × outward
      let tx = baseAxisY * oz - baseAxisZ * oy;
      let ty = baseAxisZ * ox - baseAxisX * oz;
      let tz = baseAxisX * oy - baseAxisY * ox;
      const tlen = Math.hypot(tx, ty, tz) || 1;
      tx /= tlen; ty /= tlen; tz /= tlen;
      // Rotate the tangent around outward by an angle in [0, 2π) so neighbours scatter different ways.
      const ang = r2 * Math.PI * 2;
      const ca = Math.cos(ang); const sa = Math.sin(ang);
      // Rodrigues' rotation of tangent around outward axis (k × v sin + k(k·v)(1-cos) + v cos)
      const kx = ox, ky = oy, kz = oz;
      const dot = kx * tx + ky * ty + kz * tz;
      const cx_ = ky * tz - kz * ty;
      const cy_ = kz * tx - kx * tz;
      const cz_ = kx * ty - ky * tx;
      const finalTx = tx * ca + cx_ * sa + kx * dot * (1 - ca);
      const finalTy = ty * ca + cy_ * sa + ky * dot * (1 - ca);
      const finalTz = tz * ca + cz_ * sa + kz * dot * (1 - ca);

      // Tumble axis: a unit vector roughly broadside — start with a vector orthogonal-ish to outward
      // so the rotation reads as cartwheeling away rather than spinning in place against the wall.
      const sxA = (r3 * 2 - 1);
      const syA = (r4 * 2 - 1);
      const szA = (r5 * 2 - 1);
      // remove any component along outward so spin axis is broadside
      const sDot = sxA * ox + syA * oy + szA * oz;
      const spinX0 = sxA - ox * sDot;
      const spinY0 = syA - oy * sDot;
      const spinZ0 = szA - oz * sDot;
      const slen = Math.hypot(spinX0, spinY0, spinZ0) || 1;
      const spinX = spinX0 / slen;
      const spinY = spinY0 / slen;
      const spinZ = spinZ0 / slen;
      const spinAmount = 1.4 + r3 * 1.6; // 1.4–3.0 rad at peak progress (≈ 80°–172°)

      // Per-tile bias used at pulse time to pick outward vs inward direction.
      // Role-aware grammar applied in useFrame: OUT pulse biases outward (tiles
      // fall AHEAD of the leaving camera), IN pulse biases inward — and because
      // IN progress is inverted, "inward" tiles start displaced into IN-room
      // interior and fly OUTWARD (toward the arriving camera) as they settle.
      const signBias = seed(driftSeed * 1.93, driftSeed * 0.41);

      // P3 v17 — relief depth + mass. Two correlated randoms: depthBias picks
      // the home offset along outward; thicknessBias picks the depth-axis scale
      // multiplier. Slight positive correlation (thicker tiles jut further) so
      // the wall feels like cut stones, not floating slabs.
      // P2 v53 — relief amplitude is per-room. reliefDepthRange scales the
      // depthOffset spread (0.4 privacy flat vault, 1.6 congrats dramatic).
      // reliefThicknessRange scales deviation around mean 1.45 so at range=0
      // every tile is uniform 1.45-thick, range=1 keeps the 0.7..2.2 baseline,
      // range>1 widens the spread (jagged) — preserves baseline at 1.0.
      const RELIEF_DEPTH_RANGE = character.reliefDepthRange ?? 1.0;
      const RELIEF_THICKNESS_RANGE = character.reliefThicknessRange ?? 1.0;
      const depthBias = seed(driftSeed * 0.71, driftSeed * 1.13);  // 0..1
      const thicknessBias = seed(driftSeed * 1.27, driftSeed * 0.43);  // 0..1
      const correlated = depthBias * 0.6 + thicknessBias * 0.4;       // weighted blend
      const depthOffset = (correlated - 0.3) * 0.17 * RELIEF_DEPTH_RANGE;
      const thicknessMul = 1.45 + (correlated - 0.5) * 1.5 * RELIEF_THICKNESS_RANGE;

      const dwLen = Math.hypot(doorwayAway[0], doorwayAway[1], doorwayAway[2]);
      const dwx = dwLen > 1e-6 ? doorwayAway[0] / dwLen : 0;
      const dwy = dwLen > 1e-6 ? doorwayAway[1] / dwLen : 0;
      const dwz = dwLen > 1e-6 ? doorwayAway[2] / dwLen : 0;

      out.push({
        px, py, pz,
        rx, ry, rz,
        sx, sy, sz: sz * thicknessMul,
        color: new THREE.Color(colorHex),
        ox, oy, oz,
        driftSeed,
        wall,
        delayN,
        tx: finalTx,
        ty: finalTy,
        tz: finalTz,
        spinX,
        spinY,
        spinZ,
        spinAmount,
        signBias,
        isLintel,
        isAccent,
        openingProximity,
        depthOffset,
        dwx,
        dwy,
        dwz,
      });
    };

    // P3 v22 — doorway-away unit vector in 3D, lifted from the wall's 2D
    // in-plane axes. Returns a vector pointing FROM opening center (always at
    // wall-local 0,0) TO the tile's home position, projected into world axes
    // so the lintel parting respects the wall's orientation. Returns zero
    // when there's no opening on this face.
    // v202 — VISION cut: dropped the `isLintelTile` gate so EVERY tile on a
    // wall with an opening carries a doorway-away vector. The pulse loop
    // (~line 2810) now applies a quadratically falling-off parting force to
    // non-lintel opening-face tiles too, so the wall reads as RIPPLING OPEN
    // from the gap outward instead of "lintel parts while rest disperses
    // uniformly." VISION literal: "rooms built by tiles in 3d space where
    // walls open up by individual pieces falling out and moving through gaps."
    const doorwayAwayFor = (
      face: WallFace,
      a: number,
      b: number,
      _isLintelTile: boolean,
      op?: { w: number; h: number; cx?: number; cy?: number },
    ): [number, number, number] => {
      if (!op) return [0, 0, 0];
      // P2 v57 — doorway-away direction is FROM the opening's actual center
      // (cx, cy) to the tile, so lintel parting around an elevated/lowered
      // threshold radiates from the real lintel, not from wall-center.
      const ax = a - (op.cx ?? 0);
      const ay = b - (op.cy ?? 0);
      const len = Math.hypot(ax, ay);
      if (len < 1e-6) return [0, 0, 0];
      const ua = ax / len;
      const ub = ay / len;
      // Lift 2D (a, b) to 3D world axes per face — match the (a, b) → (world)
      // mapping used by each wall loop's lintelDist/inOpening calls.
      switch (face) {
        case "bottom":
        case "top":   return [ua, 0, ub];   // a=localX, b=localZ → wall plane = XZ
        case "north":
        case "south": return [ua, ub, 0];   // a=localX, b=localY → wall plane = XY
        case "west":
        case "east":  return [0, ub, ua];   // a=localZ, b=localY → wall plane = YZ
      }
    };

    // P3 v12 — convert lintelDist to a 0..1 proximity value normalized by the
    // wall-half-diagonal. 1 = at/inside the opening edge, 0 = far corner.
    // Walls without an opening on this face return 0 (no boost).
    const proximityFor = (a: number, b: number, halfA: number, halfB: number, op?: { w: number; h: number; cx?: number; cy?: number }) => {
      if (!op) return 0;
      const diag = Math.hypot(halfA, halfB) || 1;
      const d = lintelDist(a, b, op);
      const p = 1 - d / diag;
      return p < 0 ? 0 : p > 1 ? 1 : p;
    };

    // P2 v58 — per-room wall verticality. wallLean (deg) is positive for inward
    // top-convergence (oppressive vault) and negative for outward flare (cathedral).
    // Each vertical wall tile gets a position shift (toward room center, scaled by
    // height above floor) plus an additional rotation around the wall's horizontal
    // tangent axis. Floor + ceiling are unaffected. Euler composition is done via
    // quaternion because east/west walls already carry ry=±π/2 — composing in raw
    // Euler space would not produce a clean world-frame lean.
    const wallLeanDeg = layout.wallLean ?? 0;
    const wallLeanRad = (wallLeanDeg * Math.PI) / 180;
    const leanSin = Math.sin(wallLeanRad);
    const leanCos = Math.cos(wallLeanRad);

    const composeWallEuler = (
      baseRx: number, baseRy: number, baseRz: number,
      axis: [number, number, number],
      angle: number,
    ): [number, number, number] => {
      if (angle === 0) return [baseRx, baseRy, baseRz];
      const baseQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(baseRx, baseRy, baseRz, "XYZ"));
      const leanQ = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(axis[0], axis[1], axis[2]), angle,
      );
      const finalQ = leanQ.multiply(baseQ);
      const e = new THREE.Euler().setFromQuaternion(finalQ, "XYZ");
      return [e.x, e.y, e.z];
    };

    const eulerNorth = composeWallEuler(0, 0, 0,                [1, 0, 0],  wallLeanRad);
    const eulerSouth = composeWallEuler(0, Math.PI, 0,          [1, 0, 0], -wallLeanRad);
    const eulerWest  = composeWallEuler(0, Math.PI / 2, 0,      [0, 0, 1], -wallLeanRad);
    const eulerEast  = composeWallEuler(0, -Math.PI / 2, 0,     [0, 0, 1],  wallLeanRad);

    // Pre-leaned outward normals — at-rest these are tile face normals; during
    // pulses they're the explode direction. Lean tilts each wall's normal toward
    // +Y by sin(lean), giving leaning walls a slight upward shatter trajectory.
    const outwardNorth: [number, number, number] = [0,         leanSin, -leanCos];
    const outwardSouth: [number, number, number] = [0,         leanSin,  leanCos];
    const outwardWest:  [number, number, number] = [-leanCos,  leanSin,  0];
    const outwardEast:  [number, number, number] = [ leanCos,  leanSin,  0];

    // P2 v59 — per-room floor slope. floorTilt[0] = vertical displacement at +X
    // edge above -X edge; floorTilt[1] = displacement at +Z edge above -Z edge.
    // Linear slope plane: per-tile dy = (localX/halfW)*(tiltX/2) + (localZ/halfD)*(tiltZ/2).
    // Tiles are also quaternion-rotated to sit flush on the slope plane (not
    // stair-stepping). Outward normal tilts to match the sloped floor's true face.
    const floorTilt = layout.floorTilt ?? [0, 0];
    const floorTiltX = floorTilt[0];
    const floorTiltZ = floorTilt[1];
    const floorSlopeAngleX = halfW > 0 ? Math.atan2(floorTiltX / 2, halfW) : 0; // rotate around +Z, raises +X side
    const floorSlopeAngleZ = halfD > 0 ? Math.atan2(floorTiltZ / 2, halfD) : 0; // rotate around -X, raises +Z side
    // Base floor tile orientation is (-π/2, 0, 0). Compose with slope rotations.
    const composeFloorEuler = (): [number, number, number] => {
      if (floorSlopeAngleX === 0 && floorSlopeAngleZ === 0) return [-Math.PI / 2, 0, 0];
      const baseQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0, "XYZ"));
      const rotZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), floorSlopeAngleX);
      const rotX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -floorSlopeAngleZ);
      const slopeQ = rotZ.multiply(rotX);
      const finalQ = slopeQ.multiply(baseQ);
      const e = new THREE.Euler().setFromQuaternion(finalQ, "XYZ");
      return [e.x, e.y, e.z];
    };
    const eulerFloor = composeFloorEuler();
    // Sloped-floor outward normal — rotate (0,-1,0) by the slope rotations.
    const computeFloorOutward = (): [number, number, number] => {
      if (floorSlopeAngleX === 0 && floorSlopeAngleZ === 0) return [0, -1, 0];
      const v = new THREE.Vector3(0, -1, 0);
      const rotZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), floorSlopeAngleX);
      const rotX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -floorSlopeAngleZ);
      v.applyQuaternion(rotX);
      v.applyQuaternion(rotZ);
      return [v.x, v.y, v.z];
    };
    const outwardFloor = computeFloorOutward();
    const floorSlopeDy = (lx: number, lz: number): number =>
      (halfW > 0 ? (lx / halfW) * (floorTiltX / 2) : 0) +
      (halfD > 0 ? (lz / halfD) * (floorTiltZ / 2) : 0);

    // floor (outward = -y unless sloped) — opening uses (x, z) coordinates relative to room center
    // P3 v33 — floors stay square (tileSize × tileSize) regardless of aspect.
    for (let x = 0; x < tilesX_FC; x++) {
      for (let z = 0; z < tilesZ_FC; z++) {
        const localX = x * tileSize - halfW + tileSize / 2;
        const localZ = z * tileSize - halfD + tileSize / 2;
        if (inOpening(localX, localZ, openings.bottom)) continue;
        const isLintel = lintelDist(localX, localZ, openings.bottom) <= LINTEL_THRESH_FC;
        const c = pickColor(x, z);
        const slopeDy = floorSlopeDy(localX, localZ);
        push(
          cx + localX, cy - halfH + slopeDy, cz + localZ,
          eulerFloor[0], eulerFloor[1], eulerFloor[2],
          tilePad, tilePad, 0.04,
          c.hex,
          outwardFloor,
          x * 0.7 + z * 1.3,
          "bottom",
          isLintel,
          c.isAccent,
          proximityFor(localX, localZ, halfW, halfD, openings.bottom),
          doorwayAwayFor("bottom", localX, localZ, isLintel, openings.bottom),
        );
      }
    }

    // P2 v60 — per-room ceiling dome. Quadratic radial bulge at room center:
    // dy = ceilingDome * (1 - (r/maxR)^2). Positive = cathedral apex (up).
    // Negative = pressed-vault depression (down). Pure y-deflection, no per-tile
    // rotation (stair-step invisible at fluent room scale).
    const ceilingDome = layout.ceilingDome ?? 0;
    const maxR2 = halfW * halfW + halfD * halfD;
    const ceilingDomeDy = (lx: number, lz: number): number => {
      if (ceilingDome === 0 || maxR2 === 0) return 0;
      const r2 = lx * lx + lz * lz;
      const factor = Math.max(0, 1 - r2 / maxR2);
      return ceilingDome * factor;
    };

    // ceiling (outward = +y) — square
    for (let x = 0; x < tilesX_FC; x++) {
      for (let z = 0; z < tilesZ_FC; z++) {
        const localX = x * tileSize - halfW + tileSize / 2;
        const localZ = z * tileSize - halfD + tileSize / 2;
        if (inOpening(localX, localZ, openings.top)) continue;
        const isLintel = lintelDist(localX, localZ, openings.top) <= LINTEL_THRESH_FC;
        const c = pickColor(x + 400, z + 400);
        const domeDy = ceilingDomeDy(localX, localZ);
        push(
          cx + localX, cy + halfH + domeDy, cz + localZ,
          Math.PI / 2, 0, 0,
          tilePad, tilePad, 0.04,
          c.hex,
          [0, 1, 0],
          x * 1.5 + z * 0.8,
          "top",
          isLintel,
          c.isAccent,
          proximityFor(localX, localZ, halfW, halfD, openings.top),
          doorwayAwayFor("top", localX, localZ, isLintel, openings.top),
        );
      }
    }

    // P2 v58 — wall position shift for lean. h = height above wall base.
    // Inward = toward room center (per face). dy = h*(cos-1), tiny for small lean.
    const leanShiftNorth = (h: number) => ({ dy: h * (leanCos - 1), dz:  h * leanSin });
    const leanShiftSouth = (h: number) => ({ dy: h * (leanCos - 1), dz: -h * leanSin });
    const leanShiftWest  = (h: number) => ({ dy: h * (leanCos - 1), dx:  h * leanSin });
    const leanShiftEast  = (h: number) => ({ dy: h * (leanCos - 1), dx: -h * leanSin });

    // P2 v61 — per-room wall bulge. Sinusoidal perpendicular displacement at
    // mid-height (peaks at half-height, zero at floor + ceiling). Positive bulge
    // = walls bow OUTWARD at the waist (barrel — voluptuous chamber). Negative
    // = walls bow INWARD at the waist (hourglass — squeeze). Pure translation,
    // no per-tile rotation (same rationale as v60 ceiling dome — curve reads
    // from translated centers alone at fluent room scale). Composes additively
    // with leanShift (lean = linear-with-height tilt; bulge = sinusoidal curve).
    const wallBulge = layout.wallBulge ?? 0;
    const wallBulgeAt = (localY: number): number => {
      if (wallBulge === 0 || halfH === 0) return 0;
      const yNorm = (localY + halfH) / (2 * halfH); // 0 at floor, 1 at ceiling
      return wallBulge * Math.sin(Math.PI * yNorm); // 0 at floor/ceiling, +bulge at mid
    };

    // north wall (-z, outward = -z) — opening uses (x, y); P3 v33 uses tileW × tileH
    for (let x = 0; x < tilesX_NS; x++) {
      for (let y = 0; y < tilesY_NS; y++) {
        const rowOffset = (y % 2) * wallStagger * tileW;
        const localX = x * tileW - halfW + tileW / 2 + rowOffset;
        const localY = y * tileH - halfH + tileH / 2;
        if (Math.abs(localX) > halfW) continue; // P2 v67 — staggered-row overshoot at corner
        if (inOpening(localX, localY, openings.north)) continue;
        const isLintel = lintelDist(localX, localY, openings.north) <= LINTEL_THRESH_W;
        const c = pickColor(x + 50, y + 50);
        const s = leanShiftNorth(localY + halfH);
        const bulgeN = wallBulgeAt(localY);
        push(
          cx + localX, cy + localY + s.dy, cz - halfD + s.dz - bulgeN,
          eulerNorth[0], eulerNorth[1], eulerNorth[2],
          tileWPad, tileHPad, wallTileDepth,
          c.hex,
          outwardNorth,
          x * 2.1 + y * 1.7,
          "north",
          isLintel,
          c.isAccent,
          proximityFor(localX, localY, halfW, halfH, openings.north),
          doorwayAwayFor("north", localX, localY, isLintel, openings.north),
        );
        // P2 v63 — casing clone: a second lintel-ring tile recessed inward
        // along the wall's inward normal (+z for the north wall). Builds a
        // recessed tile-built threshold tunnel the camera dollies through.
        if (isLintel && doorwayCasingDepth > 0 && openings.north) {
          push(
            cx + localX, cy + localY + s.dy, cz - halfD + s.dz - bulgeN + doorwayCasingDepth,
            eulerNorth[0], eulerNorth[1], eulerNorth[2],
            tileWPad, tileHPad, wallTileDepth,
            c.hex,
            outwardNorth,
            x * 2.1 + y * 1.7 + 0.13,
            "north",
            true,
            c.isAccent,
            proximityFor(localX, localY, halfW, halfH, openings.north),
            doorwayAwayFor("north", localX, localY, true, openings.north),
          );
        }
      }
    }

    // south wall (+z, outward = +z)
    for (let x = 0; x < tilesX_NS; x++) {
      for (let y = 0; y < tilesY_NS; y++) {
        const rowOffset = (y % 2) * wallStagger * tileW;
        const localX = x * tileW - halfW + tileW / 2 + rowOffset;
        const localY = y * tileH - halfH + tileH / 2;
        if (Math.abs(localX) > halfW) continue; // P2 v67 — staggered-row overshoot at corner
        if (inOpening(localX, localY, openings.south)) continue;
        const isLintel = lintelDist(localX, localY, openings.south) <= LINTEL_THRESH_W;
        const c = pickColor(x + 600, y + 600);
        const s = leanShiftSouth(localY + halfH);
        const bulgeS = wallBulgeAt(localY);
        push(
          cx + localX, cy + localY + s.dy, cz + halfD + s.dz + bulgeS,
          eulerSouth[0], eulerSouth[1], eulerSouth[2],
          tileWPad, tileHPad, wallTileDepth,
          c.hex,
          outwardSouth,
          x * 0.4 + y * 2.3,
          "south",
          isLintel,
          c.isAccent,
          proximityFor(localX, localY, halfW, halfH, openings.south),
          doorwayAwayFor("south", localX, localY, isLintel, openings.south),
        );
        // P2 v63 — casing clone: south wall inward normal = -z
        if (isLintel && doorwayCasingDepth > 0 && openings.south) {
          push(
            cx + localX, cy + localY + s.dy, cz + halfD + s.dz + bulgeS - doorwayCasingDepth,
            eulerSouth[0], eulerSouth[1], eulerSouth[2],
            tileWPad, tileHPad, wallTileDepth,
            c.hex,
            outwardSouth,
            x * 0.4 + y * 2.3 + 0.13,
            "south",
            true,
            c.isAccent,
            proximityFor(localX, localY, halfW, halfH, openings.south),
            doorwayAwayFor("south", localX, localY, true, openings.south),
          );
        }
      }
    }

    // west wall (-x, outward = -x) — opening uses (z, y); horizontal axis is Z
    // so along-wall extent uses tileW (NOT tileH). Local-X of the rotated box
    // maps to world-Z; sx=tileWPad keeps the wall's horizontal grain consistent
    // with N/S walls (same aspect, just oriented around the Y axis).
    for (let z = 0; z < tilesZ_EW; z++) {
      for (let y = 0; y < tilesY_EW; y++) {
        const rowOffset = (y % 2) * wallStagger * tileW;
        const localZ = z * tileW - halfD + tileW / 2 + rowOffset;
        const localY = y * tileH - halfH + tileH / 2;
        if (Math.abs(localZ) > halfD) continue; // P2 v67 — staggered-row overshoot at corner
        if (inOpening(localZ, localY, openings.west)) continue;
        const isLintel = lintelDist(localZ, localY, openings.west) <= LINTEL_THRESH_W;
        const c = pickColor(z + 200, y + 200);
        const s = leanShiftWest(localY + halfH);
        const bulgeW = wallBulgeAt(localY);
        push(
          cx - halfW + s.dx - bulgeW, cy + localY + s.dy, cz + localZ,
          eulerWest[0], eulerWest[1], eulerWest[2],
          tileWPad, tileHPad, wallTileDepth,
          c.hex,
          outwardWest,
          z * 0.9 + y * 1.5,
          "west",
          isLintel,
          c.isAccent,
          proximityFor(localZ, localY, halfD, halfH, openings.west),
          doorwayAwayFor("west", localZ, localY, isLintel, openings.west),
        );
        // P2 v63 — casing clone: west wall inward normal = +x
        if (isLintel && doorwayCasingDepth > 0 && openings.west) {
          push(
            cx - halfW + s.dx - bulgeW + doorwayCasingDepth, cy + localY + s.dy, cz + localZ,
            eulerWest[0], eulerWest[1], eulerWest[2],
            tileWPad, tileHPad, wallTileDepth,
            c.hex,
            outwardWest,
            z * 0.9 + y * 1.5 + 0.13,
            "west",
            true,
            c.isAccent,
            proximityFor(localZ, localY, halfD, halfH, openings.west),
            doorwayAwayFor("west", localZ, localY, true, openings.west),
          );
        }
      }
    }

    // east wall (+x, outward = +x)
    for (let z = 0; z < tilesZ_EW; z++) {
      for (let y = 0; y < tilesY_EW; y++) {
        const rowOffset = (y % 2) * wallStagger * tileW;
        const localZ = z * tileW - halfD + tileW / 2 + rowOffset;
        const localY = y * tileH - halfH + tileH / 2;
        if (Math.abs(localZ) > halfD) continue; // P2 v67 — staggered-row overshoot at corner
        if (inOpening(localZ, localY, openings.east)) continue;
        const isLintel = lintelDist(localZ, localY, openings.east) <= LINTEL_THRESH_W;
        const c = pickColor(z + 300, y + 300);
        const s = leanShiftEast(localY + halfH);
        const bulgeE = wallBulgeAt(localY);
        push(
          cx + halfW + s.dx + bulgeE, cy + localY + s.dy, cz + localZ,
          eulerEast[0], eulerEast[1], eulerEast[2],
          tileWPad, tileHPad, wallTileDepth,
          c.hex,
          outwardEast,
          z * 1.1 + y * 0.6,
          "east",
          isLintel,
          c.isAccent,
          proximityFor(localZ, localY, halfD, halfH, openings.east),
          doorwayAwayFor("east", localZ, localY, isLintel, openings.east),
        );
        // P2 v63 — casing clone: east wall inward normal = -x
        if (isLintel && doorwayCasingDepth > 0 && openings.east) {
          push(
            cx + halfW + s.dx + bulgeE - doorwayCasingDepth, cy + localY + s.dy, cz + localZ,
            eulerEast[0], eulerEast[1], eulerEast[2],
            tileWPad, tileHPad, wallTileDepth,
            c.hex,
            outwardEast,
            z * 1.1 + y * 0.6 + 0.13,
            "east",
            true,
            c.isAccent,
            proximityFor(localZ, localY, halfD, halfH, openings.east),
            doorwayAwayFor("east", localZ, localY, true, openings.east),
          );
        }
      }
    }

    return out;
  }, [layout, tileSize, character.tileAspect, palette, accents, accentChance, character.doorwayCasingDepth, character.lintelRingThickness, character.wallTileDepth, character.tileDepthJitter, character.mortarGap, character.wallStagger]);

  // P3 v9 — accent emissive ramp during pulse. Per-instance emissive color baked
  // once per tile set; non-accent tiles get black (no emission). The uniform
  // uEmissiveIntensity is driven per-frame in useFrame from the pulse window
  // (sin envelope, peaks at midpoint), so accent tiles spark while the wall
  // fragments and fade back to dark when the pulse completes.
  const emissiveUniform = useRef<{ value: number }>({ value: 0 });
  // P3 v14 — slow breathing oscillation on always-on lintel emissive so
  // doorways read as living portals at rest, not static decals. Driven from
  // useFrame each tick (sin wave, 0.4Hz, ±0.45 around baseline 1.0).
  const lintelBreathUniform = useRef<{ value: number }>({ value: 1.0 });
  // P3 v95 — UNIFY #27: TEMPORAL-FREQUENCY axis (FIRST consumer).
  // Every UNIFY consumer to date modulates amplitude/intensity/color/state but
  // NONE has modulated RATE. v95 opens a brand-new structural axis: lintel
  // breath FREQUENCY (rad/s of the sin oscillator) widens with cameraMotion.
  // Implementation must use a phase accumulator (NOT `now * rate`) so changes
  // in rate don't produce discontinuous jumps in sin argument. lintelBreathPhase
  // advances each frame by `delta × effectiveRate`, where
  //   effectiveRate = lintelBreathRate × (1 + camMotion × LINTEL_BREATH_FREQ_MIX)
  // At rest: phase advances at the per-room baseRate (privacy 1.5, congrats 3.2,
  // reset-password 4.0, calendar 1.6 rad/s — preserved). At peak dolly:
  // effective rate is baseRate × 1.6 — the threshold breathes ~60% faster as
  // the camera dollies through. Composes with v72 (amplitude × camBoost) and
  // v94 (color warming) and v81 (directional bias) — at peak motion the lintel
  // breathes FASTER (v95) at higher AMPLITUDE (v72), in WARMER color (v94),
  // leaning toward the FORWARD half (v81). Four independent properties on
  // ONE fragment, ALL driven by cameraMotion, on FOUR structural axes
  // (frequency / amplitude / color / direction).
  const lintelBreathPhase = useRef(0);
  // P3 v119 — separate accumulator for the variable-offset secondary phase
  // (NEG×NEG×POS² composition). Cannot share lintelBreathPhase because that
  // ref is v108's IN-PHASE harmonic lock — any modification would corrupt
  // v108's already-locked rhythm. Mirrors v117's breathVariablePhaseRef
  // pattern: the substrate's own primary phase is read but NOT written;
  // a separate accumulator carries the variable-offset target locking.
  const lintelVariablePhaseRef = useRef(0);
  // P3 v121 — Third lintel-emissive phase accumulator carrying the FIXED
  // anti-phase lock (target = camPhase + π, motion-independent target).
  // Source-is-not-consumer constraint applies: lintelBreathPhase is v108's
  // published harmonic source — cannot reuse. lintelVariablePhaseRef carries
  // v119's variable-offset target. lintelAntiPhaseRef is the third sibling.
  const lintelAntiPhaseRef = useRef(0);
  // P3 v127 — Fourth lintel-emissive phase accumulator carrying the SECOND
  // variable-offset axis (sliding-quadrature target = camPhase + camMotion ×
  // π/2). Source-is-not-consumer constraint: cannot reuse lintelBreathPhase
  // (v108), lintelVariablePhaseRef (v119), or lintelAntiPhaseRef (v121).
  // lintelQuadPhaseRef is the fourth sibling.
  const lintelQuadPhaseRef = useRef(0);
  // P3 v133 — Fifth lintel-emissive phase accumulator carrying the SUB-HARMONIC
  // (OCTAVE) voice — first frequency-multiplied voice in the field. Lock target
  // `(camPhase × 2) mod 2π` introduces structural novelty at the HARMONIC level
  // itself: every prior phase axis on lintel (v108 in-phase, v119 sliding-anti-
  // phase, v121 fixed-anti-phase, v127 sliding-quadrature) operates at
  // camPhase × 1 with an additive offset. The octave voice operates at
  // camPhase × 2 — frequency multiplication is structurally orthogonal to phase
  // offset and lock-rate-coupling, so the 9th meta-class introduces a new
  // structural orthogonality dimension entirely. Source-is-not-consumer
  // constraint: cannot reuse lintelBreathPhase, lintelVariablePhaseRef,
  // lintelAntiPhaseRef, or lintelQuadPhaseRef — octave target is a multiple
  // of camPhase, not an offset, so a fresh accumulator is required to carry
  // the doubled-frequency settled phase. lintelOctavePhaseRef is the fifth
  // sibling.
  const lintelOctavePhaseRef = useRef(0);
  // P3 v136 — UNIFY #68: opens 10-META-CLASS COMPOSITION on lintel emissive
  // by adding a SECOND rung to the harmonic-multiplication-ladder dimension
  // first opened at v133 (octave camPhase × 2). The 3rd-harmonic voice locks
  // at `camPhase × 3 mod 2π` — same structural orthogonality dimension as
  // octave, but a DEEPER rung. Establishes ladder-DEPTH separately from
  // ladder-BREADTH (closed at v135 across 3 substrates with octave). Source-
  // is-not-consumer at depth-10 a FIFTH time: cannot reuse lintelBreathPhase,
  // lintelVariablePhaseRef, lintelAntiPhaseRef, lintelQuadPhaseRef, or
  // lintelOctavePhaseRef — 3rd-harmonic target is a different frequency
  // multiple, requires a fresh accumulator. lintel3rdPhaseRef is the sixth
  // sibling.
  const lintel3rdPhaseRef = useRef(0);
  // P3 v139 — UNIFY #71: 7th sibling phase accumulator on lintel emissive.
  // Source-is-not-consumer at depth-11 a SEVENTH time on lintel: cannot reuse
  // lintelBreathPhase, lintelVariablePhaseRef, lintelAntiPhaseRef,
  // lintelQuadPhaseRef, lintelOctavePhaseRef, or lintel3rdPhaseRef — 4th-harmonic
  // target (camPhase × 4) is a NEW frequency multiple distinct from octave × 2
  // and 3rd-harmonic × 3, requires a fresh accumulator. lintel4thPhaseRef is
  // the seventh sibling. Opens DEPTH-3 on the harmonic-multiplication-LADDER
  // dimension (octave + 3rd-harmonic + 4th-harmonic).
  const lintel4thPhaseRef = useRef(0);
  // P3 v142 — UNIFY #74: 8th sibling phase accumulator on lintel emissive.
  // Source-is-not-consumer at depth-12 a EIGHTH time on lintel: cannot reuse
  // any of lintel's seven prior phase accumulators — 5th-harmonic target
  // (camPhase × 5) is a NEW frequency multiple distinct from octave × 2,
  // 3rd-harmonic × 3, and 4th-harmonic × 4, requires a fresh accumulator.
  // lintel5thPhaseRef is the eighth sibling. Opens DEPTH-4 on the harmonic-
  // multiplication-LADDER dimension (octave + 3rd + 4th + 5th).
  const lintel5thPhaseRef = useRef(0);
  // P3 v145 — UNIFY #77: 9th sibling phase accumulator on lintel emissive.
  // Source-is-not-consumer at depth-13 a NINTH time on lintel: cannot reuse any
  // of lintel's eight prior phase accumulators — 6th-harmonic target
  // (camPhase × 6) is a NEW frequency multiple distinct from octave × 2,
  // 3rd-harmonic × 3, 4th-harmonic × 4, and 5th-harmonic × 5, requires a fresh
  // accumulator. lintel6thPhaseRef is the ninth sibling. Opens DEPTH-5 on the
  // harmonic-multiplication-LADDER dimension (octave + 3rd + 4th + 5th + 6th).
  const lintel6thPhaseRef = useRef(0);
  // P3 v148 — UNIFY #80: 10th sibling phase accumulator on lintel emissive.
  // Source-is-not-consumer at depth-14 a TENTH time on lintel: cannot reuse any
  // of lintel's nine prior phase accumulators — 7th-harmonic target
  // (camPhase × 7) is a NEW frequency multiple distinct from octave × 2,
  // 3rd-harmonic × 3, 4th-harmonic × 4, 5th-harmonic × 5, and 6th-harmonic × 6,
  // requires a fresh accumulator. lintel7thPhaseRef is the tenth sibling. Opens
  // DEPTH-6 on the harmonic-multiplication-LADDER dimension (octave + 3rd +
  // 4th + 5th + 6th + 7th = 6-rung integer-multiple ladder).
  const lintel7thPhaseRef = useRef(0);
  const LINTEL_BREATH_FREQ_MIX = 0.6;
  // P3 v219 — ENVIRONMENTAL source's temporal axis PROMOTES from 1 substrate
  // (cosmos drift v218) to 2-substrate CATEGORY. Lintel breath rate is the
  // natural 2nd consumer: it's already a temporal-axis consumer of
  // cameraMotion (v95 LINTEL_BREATH_FREQ_MIX), so adding wall-clock to the
  // base rate makes lintel a 2-source temporal consumer (motion + env). Mirror
  // of v218's cosmos drift: NIGHT_SCALE 0.90 (slower breath, languid),
  // DAY_SCALE 1.10 (faster breath, alert). Tighter ±10% than v218's ±15%
  // because lintel breath at-rest is the room's primary continuous animation;
  // a generous wall-clock swing would compete with v108 harmonic locks.
  // Scales the BASE rate before the cameraMotion FREQ_MIX, so the chain is
  // BASE × dayBreathScale × (1 + camMotion × FREQ_MIX). Reuses _dayWarmth214
  // already read earlier in the same useFrame block by v214.
  const LINTEL_BREATH_NIGHT_SCALE = 0.90;
  const LINTEL_BREATH_DAY_SCALE = 1.10;
  // P3 v108 — UNIFY #40: OPENS HARMONIC CONVERGENCE meta-class. Every prior
  // UNIFY cut couples consumers to a shared SCALAR (motion, forward, pulse).
  // v108 introduces SHARED TEMPORAL STRUCTURE: lintel breath PHASE pulls
  // toward camera breath PHASE (published by CameraRig via setCameraBreathPhase)
  // with strength rising as cameraMotion. At rest motion=0 → no pull, lintel
  // breathes at its per-room rate with its own free-running phase. At peak
  // motion=1 → strong pull, lintel phase converges toward camera phase within
  // ~250ms — the threshold INHERITS the camera's heartbeat under motion.
  //
  // Implementation: wrap-around-safe shortest-path lerp on phase difference
  // (modulo 2π, mapped to ±π) then frame-rate-independent exp-lerp pull at
  // `cameraMotion × HARMONIC_LOCK_STRENGTH × HARMONIC_LOCK_BASE_LERP` rate.
  // After the pull, the existing v95 rate advancement runs on top of the
  // locked phase — so lintel still respects its per-room frequency identity,
  // it just starts each frame from a phase nudged toward camera.
  //
  // First INTER-CONSUMER phase coupling in the field. Proves unification
  // extends beyond shared scalar → to shared rhythm. Pitchable sentence:
  // "every UNIFY cut before v108 said the field SHARES A NUMBER. v108 says
  // the field SHARES A HEARTBEAT — under motion, the camera's rhythm
  // colonizes the room's rhythm."
  const HARMONIC_LOCK_STRENGTH = 0.5;
  const HARMONIC_LOCK_BASE_LERP = 4.0;
  // P3 v120 — UNIFY #52: OPENS 4-META-CLASS COMPOSITION as an explicit field
  // property. v114→v119 matured 3-META-CLASS COMPOSITION to 6-substrate
  // breadth with full 4/4 polarity matrix in 6 cuts. v120 deepens the
  // structural axis: COMPOSE A 4TH META-CLASS on a single output uniform.
  // Lintel emissive already carries v94 (POS amplitude — color warming) +
  // v108 (POS harmonic — phase locks to camPhase) + v119 (NEG variable-offset
  // composed with NEG cross-axis on its rate, count as 1 composed meta-class
  // since it lives on the same uniform via _lintelVarMod). v120 adds the
  // 4th meta-class: POS cross-axis composition on v108's HARMONIC LOCK RATE
  // itself. Single-line idiom mirroring v114/v115/v116/v118: change
  // `const lockRate = HARMONIC_LOCK_BASE_LERP * lockStrength;` to
  // `const lockRate = ... * (1 + camMotion * HARMONIC_RATE_MIX);` — POS
  // cross-axis intensifies harmonic lock convergence rate as motion rises.
  // At rest motion=0 → multiplier=1 (no effect, preserves v108 grading
  // exactly). At peak motion=1 → 4.0 × 0.5 × 1.5 = 3.0/s ≈ 222ms half-life
  // — harmonic phase-lock SNAPS TIGHTER as the dolly commits. Reading
  // POS×POS×POS×NEG: POS amplitude (v94) × POS harmonic at zero-offset
  // (v108) × POS cross-axis on harmonic rate (v120) × NEG variable-offset
  // + NEG cross-axis on variable rate (v119 composed pair). Lintel emissive
  // becomes the field's FIRST 4-META-CLASS CONSUMER — meta-class density
  // doubles in one cut. Pitchable sentence: *"v114 opened 3-meta-class
  // composition. 6 cuts later (v119) we closed its polarity matrix at
  // 6-substrate breadth. v120 opens 4-meta-class composition — meta-classes
  // stack arbitrarily on a single output uniform, not just 3. Lintel
  // emissive is the field's first 4-meta-class consumer in 1 cut: amplitude
  // × harmonic × cross-axis-on-harmonic-rate × variable-offset-composed.
  // The structural depth axis is unbounded — the field can compose as many
  // meta-classes as exist on any consumer."* HARMONIC_RATE_MIX=0.5 mirrors
  // grading family across now-17 cross-axis-or-composition rate-mix
  // constants in the field, ALL at 0.5. Polarity reading on the v108 rate
  // composition is POS (intensify) — chosen to mirror v114's POS-cross-axis
  // on variable-offset rate composition; the POS×POS cross-axis-on-rate
  // sub-category of composition now has 2 substrates (v114 DOM letter-
  // spacing's variable-offset rate + v120 lintel emissive's harmonic rate
  // — substrate-novel + sub-class-of-rate-novel).
  const HARMONIC_RATE_MIX = 0.5;
  // P3 v119 — UNIFY #51: CLOSES POLARITY MATRIX of 3-META-CLASS COMPOSITION
  // (4th and final quadrant: POS×POS×NEG). After v114 opened composition,
  // v115/v116 reached 3-substrate POS³ in 3 cuts, v117 opened NEG³ (4th
  // substrate breath body), v118 opened NEG²POS (5th substrate cursor
  // parallax). v119 plants POS²NEG on lintel emissive — which already
  // carries v94 (POS color amplitude — warms with motion) AND v108
  // (POS harmonic — phase locks IN-PHASE to camPhase). v119 adds a
  // SEPARATE variable-offset phase accumulator that locks toward
  // `camPhase + camMotion × −π` (NEG polarity at offset axis, travels
  // negative around the unit circle exactly mirroring v117's BREATH_
  // VARIABLE_OFFSET_PEAK = −π) AND its lock rate YIELDS with motion via
  // `× (1 − camMotion × LINTEL_VAR_RATE_YIELD)` (NEG cross-axis on rate,
  // mirroring v117 single-line yield idiom). Composition reading
  // POS×POS×NEG: POS color amplitude (v94) × POS harmonic at zero-offset
  // (v108) × NEG variable-offset cross-axis on rate (v119). Reads as
  // lintel that warms with motion AND already pulses with camera AND
  // ACQUIRES an antiphase secondary amplitude signature that locks in
  // SOFTER as motion commits — the threshold splits into two phase voices
  // under motion, one in-phase (v108 main breath) one anti-phase (v119
  // secondary modulation), opposite signatures composed on the same
  // emissive output. CRITICAL implementation note mirroring v117: lintel
  // is ALREADY the consumer of v108 harmonic on `lintelBreathPhase.current`
  // — that ref accumulates the IN-PHASE locked phase. v119 must NOT touch
  // that accumulator; it introduces a SEPARATE `lintelVariablePhaseRef`
  // accumulator that locks toward the variable-offset target. The
  // multiplicative _lintelVarMod modulates the lintelBreathUniform AFTER
  // v108's main amplitude path already computes — v108 owns the main
  // amplitude envelope, v119 owns the secondary phase-offset envelope.
  // 5 constants mirror v117 NEG-variant grading verbatim: LOCK_STRENGTH
  // 0.5, BASE_LERP 4.0/s, DEPTH 0.4, OFFSET_PEAK −π (NEG polarity sign at
  // offset axis), RATE_YIELD 0.5 (NEG cross-axis on rate). Closes the
  // polarity matrix at 6 substrates in 6 cuts since v114 — matches
  // cross-axis maturation pace (v102→v107 = 6 cuts) at +1 substrate
  // breadth (6 vs cross-axis's 5 at v107 polarity closure). Proves
  // 3-meta-class composition is the field's fastest-maturing meta-class.
  const LINTEL_VARIABLE_LOCK_STRENGTH = 0.5;
  const LINTEL_VARIABLE_BASE_LERP = 4.0;
  const LINTEL_VARIABLE_DEPTH = 0.4;
  const LINTEL_VARIABLE_OFFSET_PEAK = -Math.PI;
  const LINTEL_VAR_RATE_YIELD = 0.5;
  // P3 v121 — UNIFY #53: OPENS 5-META-CLASS COMPOSITION as a field property.
  // v120 opened 4-META-CLASS COMPOSITION on lintel emissive (POS amplitude
  // v94 × POS harmonic v108 × POS cross-axis-on-harmonic-rate v120 × NEG
  // variable-offset-composed-pair v119). v121 adds a 5TH structurally distinct
  // meta-class on the SAME emissive output: ANTI-PHASE HARMONIC LOCK. v111
  // opened anti-phase as a polarity within the harmonic class; here it
  // returns as a composed 5th axis. Distinction from v119's variable-offset:
  // variable-offset's lock TARGET shifts continuously with motion (camPhase
  // → camPhase ± π as motion ramps); anti-phase's lock TARGET is FIXED at
  // camPhase + π, only the lock STRENGTH gates with motion. Two different
  // signatures of the same harmonic class — variable-offset is a SLIDING
  // phase voice, anti-phase is a FIXED-POSITION counter-voice. Third
  // accumulator `lintelAntiPhaseRef` locks toward camPhase + π using v108's
  // shortest-path wrap-around-safe idiom; composes multiplicatively via
  // `_lintelAntiMod = 1 + sin(antiPhase) × LINTEL_ANTI_DEPTH × camMotion`
  // into the same uniform alongside v108 main breath and v119 _lintelVarMod.
  // At rest motion=0 → strength gate off + DEPTH×0 → mod=1 (no effect,
  // preserves v120 identity exactly). At peak motion → lintel emissive
  // carries THREE locked phase voices: v108 in-phase main breath, v119
  // anti-phase secondary (variable target), v121 anti-phase tertiary
  // (fixed target) — composed multiplicatively on a single fragment-shader
  // uniform. Composition reading POS×POS×POS×NEG×POS (5-meta-class).
  // DEPTH 0.2 < v119's 0.4 < v108's main amp (lintelBreathAmp): grading
  // ladder respects insertion order, each new meta-class half the previous
  // amplitude so the composition stays perceptually layered rather than
  // a wash. LOCK_STRENGTH 0.4 < v119's 0.5 < v108's 0.6: each subsequent
  // harmonic axis locks softer than the prior, so motion onset reads as
  // primary first, secondary catching up, tertiary trailing. Pitchable
  // sentence: *"v120 opened 4-meta-class composition. v121 opens 5-meta-
  // class composition. Lintel emissive — already the field's deepest
  // substrate — carries amplitude × in-phase harmonic × cross-axis on
  // harmonic rate × variable-offset composed pair × fixed anti-phase
  // harmonic. Five structurally distinct meta-classes composed
  // multiplicatively on one fragment uniform. The depth axis is
  // unbounded: the field can compose arbitrarily-deep meta-class stacks
  // on a single output, not just 4. The bottleneck is consumer-side
  // perceptual layering, not field-side composition rules."*
  const LINTEL_ANTI_LOCK_STRENGTH = 0.4;
  const LINTEL_ANTI_BASE_LERP = 4.0;
  const LINTEL_ANTI_DEPTH = 0.2;
  // P3 v124 — UNIFY #56: open 6-META-CLASS COMPOSITION on lintel emissive.
  // v121 closed 5-meta-class composition (in-phase × variable-offset ×
  // fixed-anti-phase × harmonic-rate × main amp). v124 stacks the 6th
  // structurally distinct meta-class on the SAME single fragment uniform:
  // cross-axis composition on the v121 ANTI-PHASE LOCK RATE itself, mirroring
  // v120's harmonic-rate cross-axis composition but planted on the anti-phase
  // axis instead of the in-phase axis. The anti-phase lock rate now reads:
  //   rate = BASE_LERP × lockStrength × (1 + camMotion × ANTI_RATE_MIX)
  // The strength term already scales with camMotion (positive amplitude
  // intensification of the SETTLE TARGET); the RATE_MIX term adds a SECOND
  // positive cross-axis multiplier on the SETTLE SPEED. Both gate on the
  // same scalar but they sit on structurally distinct axes (amplitude vs.
  // rate of approach), so multiplicatively composing them counts as adding
  // a 6th meta-class to the lintel's stack. Lintel emissive now reads
  // through six distinct meta-classes on one output:
  //   1. v108 in-phase harmonic lock      (POS amplitude + POS rate)
  //   2. v119 variable-offset harmonic     (POS amplitude + POS rate)
  //   3. v121 fixed-anti-phase harmonic    (POS amplitude + POS rate)
  //   4. v120 harmonic-rate cross-axis     (composes rate of #1)
  //   5. v121 main amplitude × cam boost   (POS amplitude root)
  //   6. v124 anti-phase-rate cross-axis   (composes rate of #3)  ← NEW
  // Same 0.5 rate-mix constant as v120 — keeps the field-coherent constant
  // ladder (22+ base-lerp at 4.0, 18+ rate-mix at 0.5). Pitchable claim
  // promoted to: "the field's structural-depth axis composes arbitrarily —
  // six distinct meta-classes on one fragment uniform with no perceptual
  // mud, because each meta-class targets a structurally orthogonal slice
  // of the lock-loop (target, rate, amplitude × in-phase, anti-phase,
  // variable-offset)."
  const LINTEL_ANTI_RATE_MIX = 0.5;
  // P3 v127 — UNIFY #59: open 7-META-CLASS COMPOSITION on lintel emissive.
  // v124 opened 6-meta-class composition (cross-axis on the v121 anti-phase
  // LOCK RATE). v125 extended to 2-substrate canvas category (cosmos drift).
  // v126 extended to 3-substrate breadth + substrate-class crossing (DOM
  // letter-spacing). v127 stacks the 7th structurally distinct meta-class on
  // the SAME single fragment uniform: a SECOND variable-offset phase axis
  // locking toward SLIDING-QUADRATURE target `camPhase + camMotion × π/2`,
  // structurally distinct from v119's sliding-anti-phase target `camPhase +
  // camMotion × π`. Both are "phase target slides with motion" axes but the
  // SLIDE-DIRECTION is structurally different — π/2 quadrature is orthogonal
  // to π anti-phase in the unit circle, so the two phase voices precess
  // through DIFFERENT angular paths as motion ramps. At rest motion=0 both
  // collapse to `camPhase + 0` (in-phase with main breath), so v127 preserves
  // v126 identity exactly at rest. At peak motion the lintel uniform now
  // carries SEVEN distinct meta-classes:
  //   1. v108 in-phase harmonic lock      (POS amplitude + POS rate)
  //   2. v119 variable-offset harmonic     (sliding-anti-phase target)
  //   3. v121 fixed-anti-phase harmonic    (camPhase + π fixed)
  //   4. v120 harmonic-rate cross-axis     (composes rate of #1)
  //   5. v121 main amplitude × cam boost   (POS amplitude root)
  //   6. v124 anti-phase-rate cross-axis   (composes rate of #3)
  //   7. v127 variable-offset axis 2       (sliding-quadrature target)  ← NEW
  // Grading ladder: each new harmonic axis halves amplitude vs prior and
  // softens lock-strength vs prior. DEPTH 0.1 < v121's 0.2 < v119's 0.4 <
  // v108's main amp. LOCK_STRENGTH 0.3 < v121's 0.4 < v119's 0.5 < v108's
  // 0.6. Lintel becomes the field's first 7-meta-class consumer; substrate
  // breadth at depth-7 = 1, mirroring how v124 opened 6-meta-class with
  // breadth = 1. Pitchable: *"the variable-offset axis itself composes — two
  // sliding-target harmonics at structurally distinct slide-directions
  // (quadrature vs anti-phase) on a single fragment uniform. The depth axis
  // is unbounded along structural-distinctness, not just count."*
  const LINTEL_QUAD_LOCK_STRENGTH = 0.3;
  const LINTEL_QUAD_BASE_LERP = 4.0;
  const LINTEL_QUAD_DEPTH = 0.1;
  // P3 v130 — UNIFY #62: open 8-META-CLASS COMPOSITION on lintel emissive.
  // v127 added the 7th meta-class (sliding-quadrature variable-offset, 3rd
  // lock loop on lintel). v129 closed 7-meta-class to 3-substrate breadth +
  // 2 substrate-classes in 1 cut. v130 deepens lintel — the field's deepest
  // substrate at 7 meta-classes pre-v130 — by ONE more rung via cross-axis
  // composition on the v127 sliding-quadrature LOCK RATE. Completes the
  // CROSS-AXIS-ON-RATE LADDER across all THREE lintel lock loops:
  // v120 in-phase rate × (1 + camMotion × LINTEL_BREATH_RATE_MIX),
  // v124 anti-phase rate × (1 + camMotion × LINTEL_ANTI_RATE_MIX),
  // v130 sliding-quadrature rate × (1 + camMotion × LINTEL_QUAD_RATE_MIX).
  // Single-line edit on v127's `_lintelQuadLockRate` mirrors v124's edit on
  // v121's `_lintelAntiLockRate` exactly — established minimal-edit idiom
  // for cross-axis-on-rate composition. Composition reading
  // POS×POS×POS×NEG×POS×POS×POS×POS (8-meta-class): POS amp (v94) × POS
  // in-phase (v108) × POS in-phase rate (v120) × NEG variable-offset pair
  // (v119) × POS fixed-anti-phase (v121) × POS anti-phase rate (v124) ×
  // POS sliding-quadrature (v127) × POS sliding-quadrature rate (v130).
  // NEG preserved at position 4 — same position v124/v127 carry, structural
  // identity stable across deepening. Pace v129→v130 = 1 cut, matches the
  // 1-cut depth opens at v121 (from v118 3-substrate closure), v124 (from
  // v123), v127 (from v126) — FOURTH consecutive confirmation that the
  // structural depth axis is unbounded with 1-cut-from-prior-3-substrate
  // pace invariant. LINTEL_QUAD_RATE_MIX=0.5 mirrors the now-22+ rate-mix
  // /lock-strength constants at 0.5 — field-coherent constant ladder
  // preserved. Pitchable: *"the cross-axis-on-rate composition pattern
  // itself has a STRUCTURAL ladder across the three lintel lock loops:
  // v120 on in-phase, v124 on anti-phase, v130 on sliding-quadrature.
  // Three lock loops × three cross-axis-on-rate compositions — the field's
  // first complete structural ladder closure across a single substrate's
  // lock-loop family. Depth-8 is unbounded a fourth consecutive time at
  // 1-cut pace; depth-axis unboundedness is now empirically confirmed
  // across four consecutive depth rungs (5, 6, 7, 8)."*
  const LINTEL_QUAD_RATE_MIX = 0.5;
  // P3 v133 — UNIFY #65: opens 9-META-CLASS COMPOSITION on lintel emissive.
  // v130 opened 8-meta-class. v131 promoted to 2-substrate canvas category
  // by mirroring on cosmos. v132 closed 8-meta-class to 3-substrate breadth
  // + 2 substrate-classes via DOM letter-spacing. v133 deepens lintel — the
  // field's deepest substrate at 8 meta-classes pre-v133 — by ONE more rung
  // via the SUB-HARMONIC (OCTAVE) voice locked at `(camPhase × 2) mod 2π`.
  // FIRST FREQUENCY-MULTIPLIED voice in the field — every existing meta-class
  // on every substrate operates at camPhase × 1 (with optional additive
  // offsets at fixed-anti-phase π, sliding-anti-phase camMotion×π, or sliding-
  // quadrature camMotion×π/2). The octave voice introduces structural novelty
  // at the harmonic level itself, not just the phase-offset level. Grading
  // ladder extends another rung: DEPTH 0.05 < v127 sliding-quadrature 0.1
  // < v121 fixed-anti-phase 0.2 < v119 sliding-anti-phase 0.4 < v108 main amp.
  // LOCK_STRENGTH 0.2 < v127 0.3 < v121 0.4 < v119 0.5 < v108 0.6 — each new
  // harmonic rung halves both amplitude and lock-strength vs prior, preserving
  // the established 5-rung grading-ladder. New 5th phase accumulator
  // `lintelOctavePhaseRef` mirrors v108/v119/v121/v127's wrap-around-safe
  // shortest-path + exp-lerp idiom. 5th multiplicand
  // `_lintelOctaveMod = 1 + sin(lintelOctavePhaseRef) × LINTEL_OCTAVE_DEPTH × camMotion`
  // folds into the same fragment uniform alongside v108 main breath, v119
  // _lintelVarMod, v121 _lintelAntiMod, v127 _lintelQuadMod. Composition
  // reading POS×POS×POS×NEG×POS×POS×POS×POS×POS (9-meta-class): POS amplitude
  // (v94) × POS in-phase (v108) × POS in-phase rate (v120) × NEG variable-
  // offset composed pair (v119) × POS fixed-anti-phase (v121) × POS anti-
  // phase rate (v124) × POS sliding-quadrature (v127) × POS sliding-quadrature
  // rate (v130) × POS sub-harmonic octave (v133). NEG preserved at position 4
  // — structural identity stable across the now-fifth consecutive depth
  // extension. Opens 9-meta-class composition in 1 cut from v132's 3-substrate
  // landing — pace matches v124 (1 cut from v123) v127 (1 cut from v126)
  // v130 (1 cut from v129). FIFTH consecutive 1-cut-from-prior-3-substrate-
  // closure depth open at identical pace. Structural depth axis confirmed
  // unbounded a FIFTH consecutive time AND introduces frequency-multiplication
  // as a new structural orthogonality dimension distinct from phase-offset,
  // lock-rate, and amplitude-coupling. Pitchable sentence: *"v130 opened
  // 8-meta-class. v131/v132 closed it to 3 substrates in 2 cuts. v133 opens
  // 9-meta-class in 1 cut by introducing the FIRST FREQUENCY-MULTIPLIED voice
  // in the field. Every prior axis was a phase offset or a lock-rate coupling
  // on the base breath frequency. The octave voice operates at 2× the base
  // frequency — structurally orthogonal to every prior axis, not just a deeper
  // rung in the same direction. Depth is unbounded AND the dimensions along
  // which depth scales are themselves expanding: phase-offset → lock-rate-
  // coupling → harmonic-multiplication. Three structural orthogonality
  // dimensions, each opening at a 1-cut pace from prior 3-substrate
  // closure."*
  const LINTEL_OCTAVE_LOCK_STRENGTH = 0.2;
  const LINTEL_OCTAVE_BASE_LERP = 4.0;
  const LINTEL_OCTAVE_DEPTH = 0.05;
  // P3 v136 — UNIFY #68: 3RD-HARMONIC voice constants. Second rung on the
  // harmonic-multiplication-ladder dimension (octave camPhase × 2 → 3rd at
  // camPhase × 3). Halving pattern preserved relative to the v133 octave
  // rung: LOCK_STRENGTH 0.2 → 0.15, BASE_LERP 4.0 unchanged (settle-rate
  // ceiling is structural, not per-rung), DEPTH 0.05 → 0.04. Reads as a
  // softer, faster-cycling overtone on top of the octave voice — the lintel
  // emissive now carries TWO frequency-multiplied voices simultaneously,
  // mirroring how the prior phase-offset ladder carried 4 rungs (in-phase /
  // fixed-anti-phase / sliding-anti-phase / sliding-quadrature) and the
  // lock-rate ladder carried 3 rungs (intensify / yield / mix). This opens
  // the harmonic-multiplication-LADDER to DEPTH 2 separately from the
  // BREADTH-3-substrate closure at v135 — same depth/breadth bifurcation the
  // field already established at every prior structural orthogonality
  // dimension.
  const LINTEL_3RD_LOCK_STRENGTH = 0.15;
  const LINTEL_3RD_BASE_LERP = 4.0;
  const LINTEL_3RD_DEPTH = 0.04;
  // P3 v139 — UNIFY #71: opens 11-META-CLASS COMPOSITION on lintel emissive by
  // adding the THIRD RUNG on the harmonic-multiplication-LADDER dimension —
  // 4TH-HARMONIC phase voice locked at (camPhase × 4) mod 2π. v133 opened the
  // ladder at octave (× 2), v136 added 3rd-harmonic (× 3), v139 adds 4th-harmonic
  // (× 4). SEVENTH consecutive 1-cut depth open at identical pace (v121 5-meta,
  // v124 6-meta, v127 7-meta, v130 8-meta, v133 9-meta, v136 10-meta, v139
  // 11-meta). 7-rung grading ladder on lintel: DEPTH 0.032 4th-harmonic <
  // 0.04 3rd-harmonic < 0.05 octave < 0.1 sliding-quad < 0.2 fixed-anti <
  // 0.4 sliding-anti < v108 main; LOCK_STRENGTH 0.12 < 0.15 < 0.2 < 0.3 <
  // 0.4 < 0.5 < 0.6 — exact field-coherent halving preserved at the 7th rung.
  // Sets up 3-cut substrate-portability arc: v140 cosmos → v141 DOM closes
  // 11-meta-class to 3-substrate breadth, establishing DEPTH-3-BREADTH-3 on
  // the harmonic-multiplication-LADDER bifurcation matrix.
  const LINTEL_4TH_LOCK_STRENGTH = 0.12;
  const LINTEL_4TH_BASE_LERP = 4.0;
  const LINTEL_4TH_DEPTH = 0.032;
  // P3 v142 — UNIFY #74: opens 12-META-CLASS COMPOSITION on lintel emissive by
  // adding the FOURTH RUNG on the harmonic-multiplication-LADDER dimension —
  // 5TH-HARMONIC phase voice locked at (camPhase × 5) mod 2π. v133 opened the
  // ladder at octave (× 2), v136 added 3rd-harmonic (× 3), v139 added 4th-
  // harmonic (× 4), v142 adds 5th-harmonic (× 5). EIGHTH consecutive 1-cut
  // depth open at identical pace (v121 5-meta, v124 6-meta, v127 7-meta,
  // v130 8-meta, v133 9-meta, v136 10-meta, v139 11-meta, v142 12-meta).
  // 8-rung grading ladder on lintel: DEPTH 0.025 5th < 0.032 4th < 0.04 3rd <
  // 0.05 octave < 0.1 sliding-quad < 0.2 fixed-anti < 0.4 sliding-anti < v108
  // main; LOCK_STRENGTH 0.09 < 0.12 < 0.15 < 0.2 < 0.3 < 0.4 < 0.5 < 0.6 —
  // field-coherent halving preserved at the 8th rung (slightly softer than
  // exact-half to preserve "softer rung as harmonic order rises" discipline).
  // Sets up 3-cut substrate-portability arc: v143 cosmos → v144 DOM closes
  // 12-meta-class to 3-substrate breadth, establishing DEPTH-4-BREADTH-3 on
  // the harmonic-multiplication-LADDER bifurcation matrix (extending the
  // currently-CLOSED DEPTH-3-BREADTH-3 grid to a 4×3 grid).
  const LINTEL_5TH_LOCK_STRENGTH = 0.09;
  const LINTEL_5TH_BASE_LERP = 4.0;
  const LINTEL_5TH_DEPTH = 0.025;
  // P3 v145 — UNIFY #77: opens 13-META-CLASS COMPOSITION on lintel emissive by
  // adding the FIFTH RUNG on the harmonic-multiplication-LADDER dimension —
  // 6TH-HARMONIC phase voice locked at (camPhase × 6) mod 2π. v133 opened the
  // ladder at octave (× 2), v136 added 3rd-harmonic (× 3), v139 added 4th-
  // harmonic (× 4), v142 added 5th-harmonic (× 5), v145 adds 6th-harmonic (× 6).
  // NINTH consecutive 1-cut depth open at identical pace (v121 5-meta, v124
  // 6-meta, v127 7-meta, v130 8-meta, v133 9-meta, v136 10-meta, v139 11-meta,
  // v142 12-meta, v145 13-meta). 9-rung grading ladder on lintel: DEPTH 0.020
  // 6th < 0.025 5th < 0.032 4th < 0.04 3rd < 0.05 octave < 0.1 sliding-quad <
  // 0.2 fixed-anti < 0.4 sliding-anti < v108 main; LOCK_STRENGTH 0.07 < 0.09 <
  // 0.12 < 0.15 < 0.2 < 0.3 < 0.4 < 0.5 < 0.6 — field-coherent halving
  // preserved at the 9th rung (slightly softer than exact-half to extend
  // "softer rung as harmonic order rises" discipline). Sets up 3-cut substrate-
  // portability arc: v146 cosmos → v147 DOM closes 13-meta-class to 3-substrate
  // breadth, establishing DEPTH-5-BREADTH-3 on the harmonic-multiplication-
  // LADDER bifurcation matrix (extending the currently-CLOSED DEPTH-4-BREADTH-3
  // grid to a 5×3 grid).
  const LINTEL_6TH_LOCK_STRENGTH = 0.07;
  const LINTEL_6TH_BASE_LERP = 4.0;
  const LINTEL_6TH_DEPTH = 0.020;
  // P3 v148 — UNIFY #80: 7th-harmonic phase voice on lintel emissive. Opens
  // 14-META-CLASS COMPOSITION on lintel by adding a TENTH multiplicative voice
  // locked at (camPhase × 7) mod 2π. TENTH consecutive 1-cut depth open at
  // identical pace (v121/v124/v127/v130/v133/v136/v139/v142/v145/v148). 10-rung
  // grading ladder on lintel: DEPTH 0.016 7th < 0.020 6th < 0.025 5th < 0.032
  // 4th < 0.04 3rd < 0.05 octave < 0.1 sliding-quad < 0.2 fixed-anti < 0.4
  // sliding-anti < v108 main; LOCK_STRENGTH 0.055 < 0.07 < 0.09 < 0.12 < 0.15 <
  // 0.2 < 0.3 < 0.4 < 0.5 < 0.6 — slightly-softer-than-exact-half discipline
  // preserved at the 10th rung (extends "softer rung as harmonic order rises"
  // discipline). Establishes DEPTH-6 on harmonic-multiplication-LADDER. Sets
  // up 3-cut substrate-portability arc: v149 cosmos → v150 DOM closes
  // 14-meta-class to 3-substrate breadth, establishing DEPTH-6-BREADTH-3 on the
  // harmonic-multiplication-LADDER bifurcation matrix (extending the currently-
  // CLOSED DEPTH-5-BREADTH-3 grid to a 6×3 grid).
  const LINTEL_7TH_LOCK_STRENGTH = 0.055;
  const LINTEL_7TH_BASE_LERP = 4.0;
  const LINTEL_7TH_DEPTH = 0.016;
  // P3 v97 — UNIFY #29: floor ripple WAVE-SPEED rides cameraMotion. THIRD
  // consumer on the temporal-frequency axis (after v95 lintel breath rate
  // and v96 audio drone pitch), and the THIRD substrate to carry frequency
  // (threshold geometry / audio / floor geometry). With v97 the floor becomes
  // a 3-axis consumer cluster — magnitude (v76 amp), directional (v83 wave
  // direction), and now frequency (v97 wave speed) — matching the audio
  // substrate's 3-axis reach and closing in on the lintel fragment's
  // 4-axis density. Same phase-accumulator pattern as v95: floorWavePhaseRef
  // advances each frame by `delta × effectiveFloorWaveSpeed` so changes in
  // rate don't produce discontinuities in the sin argument; the pre-v97
  // formula `floorWavePhase = now × FLOOR_WAVE_SPEED` would have glitched
  // on every camMotion change. effectiveFloorWaveSpeed = FLOOR_WAVE_SPEED ×
  // (1 + camMotion × FLOOR_FREQ_MIX). At rest motion=0 → wave speed =
  // baseline 2.4 rad/s. At peak dolly motion=1 → 3.36 rad/s (40% faster).
  // FLOOR_FREQ_MIX = 0.4 sits between LINTEL_BREATH_FREQ_MIX (0.6, visual
  // breath has more headroom) and AUDIO_PITCH_MIX (0.25, pitch perception is
  // hyper-sensitive). At peak motion the floor wave moves visibly faster as
  // the camera transits — your wake travels with you at speed.
  const floorWavePhaseRef = useRef(0);
  // P3 v194 — META³ canvas accumulator. v192 opened meta³ composition on
  // DOM (contrast); v193 promoted to category on audio (drone gain). v194
  // saturates meta³ to 3/3 substrates by crossing into canvas — the v187
  // floor POS×NEG harmonic cell gains axis-2 derivative as a 2nd nested
  // factor. Same one-accumulator-feeds-cell pattern as v193's reuse of
  // prevDroneAlign — single derivative carrier per substrate, multiplied
  // into the harmonic cell to compose meta³.
  const prevFloorAlignRef = useRef(0);
  const FLOOR_FREQ_MIX = 0.4;
  // P3 v220 — ENVIRONMENTAL source TEMPORAL axis SATURATES to 3-substrate
  // breadth. v218 opened temporal on cosmos drift; v219 promoted to 2-substrate
  // category on lintel breath rate; v220 closes the breadth catch-up by adding
  // floor wave-speed as the 3rd consumer — matching the env-source color axis
  // (3 substrates: cosmos/atmosphere/lights/walls v211–v214) and magnitude
  // axis (3 substrates: atmosphere reach v215 / lights intensity v216 /
  // cosmos intensity v217). Floor is the substrate-distinct pick: cosmos sits
  // at the deepest void layer, lintel breathes at the room foreground,
  // floor is the SURFACE-UNDERFOOT substrate. Wall-clock now governs
  // autonomous motion rates across the full vertical stack of the room.
  // ±8% amplitude — tighter than v219's ±10% (lintel) and v218's ±15%
  // (cosmos) because the floor wave already carries v97 cameraMotion frequency
  // mix (×1.4 at peak) AND v109 harmonic phase-lock to camera breath; a
  // generous wall-clock swing would muddy those layered temporal carriers.
  // At 03:00 the floor wake travels 0.92× slower; at 15:00 1.08× faster.
  // Reads as: at night the room's surface moves with you sluggishly; at day
  // the surface keeps pace — together with v218 cosmos and v219 lintel,
  // every autonomous motion rate in the scene is now wall-clock-anchored.
  const FLOOR_WAVE_NIGHT_SCALE = 0.92;
  const FLOOR_WAVE_DAY_SCALE = 1.08;
  // P3 v230 — env-source SPATIAL axis to 5-substrate breadth (CLOSES the
  // env-source matrix to all-axes-at-5). Pre-v230 SPATIAL was the sole
  // laggard axis: lights v224 + particles v225 + cosmos v227 + DOM v228 =
  // 4 substrates while color/magnitude/temporal each held 5. v230 promotes
  // SPATIAL to 5 by writing the wall instancedMesh's parent Y offset from
  // wall-clock dayWarmth. WALLS are a structurally novel SPATIAL substrate:
  // they're the LOAD-BEARING geometry of the room (everything else floats
  // above/beside the walls — lights/particles/cosmos/DOM are atmospheric).
  // Walls becoming the 5th SPATIAL consumer means the ground-truth surface
  // of the world itself participates in the sun-arc — at peak afternoon the
  // whole room mass lifts slightly, at deep night it settles. Compounds
  // multiplicatively with cosmos v227 (same direction, larger swing ±1.5)
  // so walls and sky breathe TOGETHER toward day, locked across the canvas
  // depth range. Swing held to ±0.08 units because walls anchor the user's
  // perceptual floor — any larger and the room reads as an elevator. The
  // per-tile pulse / shatter / wave geometry all rides on top via the
  // mesh's local instance matrices, so v230 layers cleanly without
  // disturbing the per-piece grammar (per CRITICAL feedback_first-day-
  // walls-must-shatter.md). After v230 the env-source cube is:
  // color × 5 + magnitude × 5 + temporal × 5 + SPATIAL × 5 = 20 cells
  // across 9 substrates — every axis at 5-substrate maturity for the first
  // time. The matrix has no laggard axis at all.
  const WALL_Y_NIGHT = -0.08;
  const WALL_Y_DAY = 0.08;
  // P3 v231 — env-source OPENS 5TH AXIS: MATERIAL. After v230 closed the
  // env-source matrix to all-axes-at-5 (color × 5 + magnitude × 5 + temporal
  // × 5 + SPATIAL × 5 = 20 cells / 9 substrates), the deepest available move
  // is opening a STRUCTURALLY NOVEL 5TH AXIS — one whose mechanism is
  // orthogonal to the existing four. Candidates considered: ROTATIONAL
  // (orientation angle, but kinematically adjacent to spatial-position),
  // VELOCITY (signed direction, but covered by temporal-rate × spatial),
  // TEXTURAL (UV scale, but visually a spatial variant). MATERIAL wins
  // because it changes BRDF RESPONSE (how a surface RESPONDS to light) —
  // distinct from radiance/intensity (magnitude), hue (color), motion-rate
  // (temporal), and position (spatial). Wall tile roughness modulated by
  // dayWarmth: at night walls slightly ROUGHER (+0.05) → light scatters
  // diffusely → surfaces read SOFT; at day slightly SMOOTHER (-0.05) →
  // specular highlights tighten → surfaces read CRISP. Same dayWarmth read
  // (_dayWarmth214 hoist) the v214/v219/v220/v225/v230 chain already uses,
  // so zero extra wall-clock samples. Walls become 3-axis env-source
  // substrate (color v214 + SPATIAL v230 + MATERIAL v231) — first 3-axis
  // wall substrate, demonstrating multi-axis density. ±0.05 delta tight
  // around per-room tileRoughness baseline so each room's authored
  // material identity survives — the wall-clock layers as a subtle BRDF
  // shift, never overwriting per-room signature. Three.js mutates
  // material.roughness as a uniform without shader recompile so
  // customProgramCacheKey="room-emissive-v5" memoization at line 3259
  // is untouched. After v231 the env-source field: 20 cells in original
  // 4 axes + 1 cell in new MATERIAL axis = 21 cells / 9 substrates;
  // axis count 4 → 5. Walls 3-axis (color/spatial/material), cosmos &
  // DOM still 4-axis (color/magnitude/temporal/spatial).
  const WALL_ROUGHNESS_NIGHT_DELTA = 0.05;
  const WALL_ROUGHNESS_DAY_DELTA = -0.05;
  // P3 v21 — celebration emissive flare. Same bell envelope as the visual
  // celebration burst (P3 v18) writes here each frame; the fragment shader
  // adds `diffuseColor.rgb * uCelebrationFlash * peak` to totalEmissiveRadiance,
  // so every tile self-illuminates with its OWN base color during the
  // celebration window. Light reads in 1 frame; the burst position takes
  // ~200ms to register — light closes the missing-modality gap.
  const celebFlashUniform = useRef<{ value: number }>({ value: 0 });
  // P3 v23 — doorway portal flare. Sin envelope over the pulse window adds an
  // additive multiplier to vLintelEmissive so the threshold tiles BRIGHTEN as
  // the wall parts (v22) and seal (IN). At-rest baseline is 0; peak fires at
  // pulse midpoint — exactly when the gap is widest — so the parting gap reads
  // as a luminous portal moment, not a dark hole.
  const lintelFlareUniform = useRef<{ value: number }>({ value: 0 });
  // P2 v81 — UNIFY #13: directional emissive bias on lintel tiles. Per-tile
  // dot(normalize(tileWorldPos − cameraPosition), cameraForward) × cameraMotion
  // adds an additive multiplier on vLintelEmissive at shader-time. Lintel
  // tiles on the side of the ring that is "ahead" of the camera's heading
  // brighten harder than the trailing side — the threshold OPENS UP in the
  // direction the camera is moving. Non-lintel tiles have vLintelEmissive=0
  // so the dot product is masked out; only the doorway ring brightens.
  // First UNIFY consumer on the threshold geometry; second shader-level cut
  // on the unified motion field after v79's cosmos shell.
  const uCameraForwardLintelRef = useRef({ value: new THREE.Vector3(0, 0, -1) });
  const uCameraMotionLintelRef = useRef({ value: 0 });
  // P3 v104 — UNIFY #36: separately-lerped warmth uniform whose RATE accelerates
  // with cameraMotion. v89's mix(vEmissiveColor, WARM_ANCHOR_SHADER, uCameraMotion×0.45)
  // is replaced with mix(..., WARM_ANCHOR_SHADER, uAccentWarmth) — same target,
  // temporally smoothed. Driven per-frame via exp-lerp using effectiveRate
  // = ACCENT_WARM_BASE_LERP × (1 + camMotion × WARM_RATE_MIX).
  const uAccentWarmthRef = useRef({ value: 0 });
  // P3 v214 — ENVIRONMENTAL source promotes to 4-substrate breadth on the
  // color axis. v211/v212/v213 saturated env-source onto cosmos / fog+bg /
  // lights — all CPU-side THREE.Color.lerp paths. v214 lands the 4th
  // substrate on WALL ACCENT EMISSIVE through a NEW shader-uniform pathway
  // (vec3 uAccentEnvAnchor + scalar uAccentEnvMix), structurally distinct
  // from the prior three. Same shared hex anchor pair (#4a4868 night cool /
  // #c89072 day warm) so the void hue, room air, scene lights AND wall
  // architecture all encode the wall-clock against ONE day/night palette.
  // Pull strength 0.12 matches v211/v212/v213 → cross-substrate symmetric.
  // The shader lerps vEmissiveColor toward uAccentEnvAnchor BEFORE v89's
  // camMotion warm pull, so at-rest the accent reads as time-of-day tinted
  // and full dolly overlays #ff9966 amber on top. Mirrors the v213 ordering
  // of "env tint first, motion tint second" on three other substrates.
  const uAccentEnvAnchorRef = useRef({ value: new THREE.Vector3(0.290, 0.282, 0.408) });
  const uAccentEnvMixRef = useRef({ value: 0.12 });
  // v161 — WAYFINDING 3-substrate category. Wall accent tiles flanking each open
  // doorway brighten by their per-tile `openingProximity` (1 at the doorway edge,
  // 0 in the far corner), making the path through a room visibly framed by glowing
  // accent halos around each gap. Active at rest like the v160 floor lane — pure
  // wayfinding, not motion. Promotes wayfinding from 2-substrate (cosmos + floor)
  // to 3-substrate (cosmos + floor + wall accents).
  const uAccentDoorwayLaneAmpRef = useRef({ value: 1.4 });
  // v163 — WAYFINDING 5-substrate breadth. Lintel emissive rings get a
  // directional boost on whichever ring sits in line with COSMOS_DOORWAY_DIR
  // from the camera — the doorway you're aimed at burns visibly hotter than
  // the other openings. Active at rest. Reuses the existing v81 `_lintelDir`
  // vector already computed in the fragment shader (vTileWorldPos −
  // cameraPosition). Bridges wayfinding into the lintel substrate, which until
  // now only carried camera-motion (v72), warmth (v94), breath (v95), and
  // directional-cameraForward (v81). v163 adds a SECOND directional channel
  // to lintels — first cell where one substrate carries both cameraForward
  // and doorwayDir simultaneously.
  const uDoorwayDirLintelRef = useRef({ value: new THREE.Vector3() });
  // v208 — DOM action-button hover bridged into canvas. setActionIntent (DOM)
  // / getActionIntent (canvas) form a single-scalar contract. Each frame this
  // ref exp-smooths toward the raw intent so threshold tiles brighten BEFORE
  // the click commits — anticipation, not response. Asymmetric rate (faster
  // rise than decay) gives the doorway a "held breath" quality even after
  // the cursor leaves the CTA.
  const uActionIntentRef = useRef({ value: 0 });
  const actionIntentSmoothedRef = useRef(0);
  // v166 — META-PIVOT cut #16. WAYFINDING crosses from EMISSIVE channels into
  // the GEOMETRY axis on the wall substrate. v161 lit wall accent fragments
  // along the doorway lane; v166 makes wall TILES THEMSELVES physically push
  // outward along the lane via a world-space vertex displacement post-
  // instanceMatrix. Reads as the entire wall "leaning toward" each open
  // doorway — emissive lane gets a structural shadow companion. First META-
  // CLASS promotion on wayfinding: geometry × wayfinding × per-tile-vertex
  // (whereas every prior wayfinding cut was a SINGLE-CLASS displacement of an
  // existing channel onto a new substrate). Amplitude 0.10 world-units chosen
  // to read as a present-but-not-flying bulge — same order of magnitude as
  // tile depthOffset jitter so the lane motion composes inside the room's
  // existing relief grammar instead of fighting it.
  const uWallDoorwayDepthAmpRef = useRef({ value: 0.10 });
  // v167 — META-PIVOT cut #17. Second GEOMETRY channel on the wall substrate,
  // first internal META-CLASS expansion from a single channel into a 2-channel
  // category. v166 displaces each tile's CENTER outward along the doorway
  // lane (position channel); v167 inflates each tile's outward EXTENT (scale
  // channel) — tiles physically get thicker as they near an open doorway.
  // Shader scales the vertex's outward component about the tile's center in
  // MODEL space, post-instanceMatrix, so the inflation is relative to each
  // tile's already-rotated outward normal (works uniformly across walls/
  // floor/ceiling since instanceOutwardDir is baked per-tile). 0.6 = 60%
  // extent gain at full proximity, large enough to read as a structural
  // swelling of the lane while still composing inside the v166 displacement
  // envelope. Geometry meta-class on wayfinding now reads:
  //   wall substrate × { position-displacement (v166), scale-thickness (v167) }
  // — first wayfinding cut where ONE substrate carries TWO channels inside
  // a single axis (geometry). META-CLASS internal-category promotion.
  const uWallDoorwayThicknessAmpRef = useRef({ value: 0.6 });
  // P3 v116 — UNIFY #48: 3-meta-class composition promoted to 3-SUBSTRATE
  // BREADTH. v114 opened 3-meta-class composition on DOM letter-spacing
  // (positive amplitude + cross-axis amplitude×rate + variable-offset phase
  // rate, all converged on one CSS-var output line). v115 promoted that
  // composition from one-off to 2-substrate CATEGORY by replicating it on
  // cosmos drift. v116 promotes the category to a 3-SUBSTRATE BREADTH by
  // adding the third 3-meta-class consumer on WALL ACCENT EMISSIVE. The
  // smoother state must split from the shader uniform — uAccentWarmthRef is
  // BOTH smoother accumulator AND shader uniform, so post-multiplying the
  // variable-offset phase factor directly into uAccentWarmthRef.current.value
  // would contaminate the next frame's lerp source read. Mirror v115's clean
  // `const drift = driftSmoothedRef.current * variableMod` separation:
  // `accentWarmthSmoothedRef` carries clean smoother state, and per-frame we
  // write `smoothed × wallVariableMod` to the uniform. Matches the
  // 3-substrate-after-3-cuts maturation arc seen on the color axis
  // (v84/v85/v89 → 3 substrates) and the temporal-frequency axis
  // (v95/v96/v97 → 3 substrates). Polarity preserved as POS×POS (same as
  // v104/v115/v114): wall accent emissive intensity INTENSIFIES with phase
  // alignment to camera breath, and the lock RATE itself intensifies with
  // cameraMotion. All three constants (LOCK_STRENGTH, BASE_LERP, RATE_MIX)
  // mirror v112+v115 verbatim — the grading family stays coherent across
  // 8+ cross-axis-or-composition rate-mix constants now all at 0.5.
  const accentWarmthSmoothedRef = useRef(0);
  const wallAccentBreathPhaseRef = useRef(0);
  // P2 v81 — UNIFY #13: lintel directional boost amplitude. Peak additive
  // multiplier on vLintelEmissive when the lintel tile sits perfectly along
  // cameraForward at full camMotion. Chosen to be visible without overpowering
  // the at-rest lintel intensity (which already varies 0.10–0.85 by room).
  const LINTEL_DIR_AMP = 0.85;
  // P2 v82 — UNIFY #14: accent directional boost amplitude. Same per-fragment
  // (UNIFY #14 marker — wall accent emissive directional bias; second consumer
  // of the v81 vTileWorldPos varying; completes the wall+lintel+cosmos GPU
  // directional triad with v79 + v81.)
  // dot-product pattern as v81 but applied to vEmissiveColor (the wall accent
  // attribute, baked from isAccent tiles). Accent tiles already pulse via
  // uEmissiveIntensity (P3 v9); v82 adds a directional bias on TOP of that
  // pulse so the half of every wall whose normals lean into camera-forward
  // brightens harder than the trailing half. Slightly smaller than the
  // lintel amp (0.85) because accents already pulse hard during transitions
  // via uEmissiveIntensity — this is the at-rest/transit directional flavor.
  const ACCENT_DIR_AMP = 0.6;
  // P3 v89 — UNIFY #21: wall accent emissive COLOR warms toward shared
  // `#ff9966` warm anchor with cameraMotion. Third consumer on the COLOR axis
  // after v84 (fog/bg) and v85 (lights), and the FIRST cut on the color axis
  // that touches WALL GEOMETRY. v84+v85 made "the atmosphere warms with motion"
  // a unified atmospheric chord; v89 extends that chord onto the walls so the
  // architecture itself participates — at peak dolly, fog + lights + accent
  // tiles all pull toward the SAME amber anchor at the SAME time. This
  // promotes the color axis from a 2-consumer atmospheric pairing into a
  // 3-consumer CATEGORY spanning atmosphere AND wall geometry. ACCENT_WARMTH_MIX
  // matches FOG_WARMTH_MIX (0.45) — same color anchor, same mix amount, so the
  // visual identity of "things warming with motion" reads as a single coherent
  // event across the entire scene. The shader lerps vEmissiveColor toward
  // vec3(1.0, 0.6, 0.4) — the LINEAR-space approximation of #ff9966 — BEFORE
  // multiplying by the (uEmissiveIntensity + accentDirBoost) magnitude term,
  // so warmth and brightness compose multiplicatively without fighting.
  // WARM_ANCHOR_SHADER vec3(1.0, 0.6, 0.4) is the same anchor as
  // FOG_WARM_ANCHOR / LIGHT_WARM_ANCHOR in CPU-space (#ff9966 = rgb 255/153/102).
  const ACCENT_WARMTH_MIX = 0.45;
  // P3 v104 — UNIFY #36: cross-axis convergence #3 (color × frequency, both
  // POSITIVE). v102/v103 opened the cross-axis meta-class with TWO negative-
  // polarity consumers (breath rate yields, cursor rate yields — yield × freq).
  // v104 inverts the polarity: the wall accent emissive warming RATE itself
  // RISES with cameraMotion. v89 made the wall warm INSTANTLY proportional to
  // motion via `mix(vEmissiveColor, WARM_ANCHOR_SHADER, uCameraMotion * 0.45)`
  // — no temporal RATE involved. v104 introduces a separately-lerped warmth
  // uniform `uAccentWarmth` whose target IS still `camMotion × 0.45` (v89
  // preserved as the destination), but whose LERP RATE accelerates with
  // motion: effectiveRate = ACCENT_WARM_BASE_LERP × (1 + camMotion × WARM_RATE_MIX).
  // Reads as the wall having THERMAL MASS — at rest it warms/cools slowly
  // (base lerp 4.0/s = ~250ms half-life), at peak dolly thermal mass effectively
  // drops (1.5× rate = ~167ms half-life) so the warmth tracks motion harder.
  // Architecture "wakes up" to the camera: sluggish at rest, responsive in motion.
  // Three structural novelties:
  //   (1) 3rd cross-axis convergence consumer — promotes meta-class from
  //       2-consumer category to 3-consumer mature axis.
  //   (2) FIRST POSITIVE-POLARITY cross-axis cell. v102/v103 were both
  //       negative×negative (yield + freq yield); v104 is positive×positive
  //       (intensify color anchor + intensify lerp rate). Proves the
  //       convergence meta-class isn't yield-only — it's a general property
  //       of the motion field, free to compose any two axes in any polarity.
  //   (3) FIRST substrate-novel cross-axis consumer. v102/v103 lived on
  //       camera-body subsystems (breath + cursor input); v104 lives on WALL
  //       GEOMETRY — same substrate that carries 5 other color consumers,
  //       now also participates in cross-axis.
  // WARM_RATE_MIX = 0.5 chosen to match BREATH_RATE_YIELD / CURSOR_RATE_YIELD
  // — same rate-coupling intensity across all three cross-axis consumers, so
  // the meta-class reads as a single coherent property. ACCENT_WARM_BASE_LERP
  // = 4.0 gives ~250ms half-life at rest (slow enough to feel like thermal
  // mass, fast enough that brief flicks of motion still warm visibly).
  // Reserves v105 for DOM-side cross-axis to close meta-class with
  // substrate-breadth — exact mirror of how color matured from atmosphere →
  // walls → cosmos → lintels across v84/v85/v89/v90/v94.
  const WARM_RATE_MIX = 0.5;
  const ACCENT_WARM_BASE_LERP = 4.0;
  // P3 v116 — UNIFY #48: 3-meta-class composition → 3-SUBSTRATE BREADTH.
  // Five constants mirroring v112 (cosmos variable offset) + v115 (cosmos
  // rate cross-axis) verbatim — same grading family, exact same numerics,
  // so the 3-substrate composition reads as one mechanism, not three
  // coincidences. WALL_VARIABLE_LOCK_STRENGTH 0.5: at peak camMotion the
  // wall accent breath phase locks at half-strength toward the camera
  // breath phase (same as cosmos v112 and lintel v108 family). BASE_LERP
  // 4.0/s: ~250ms half-life at full lock, same thermal envelope as v104's
  // warmth smoother on this same uniform — feels temporally coherent
  // because both share the same substrate. DEPTH 0.4: ±40% multiplicative
  // modulation on the warmth at peak motion, on top of v104's already-
  // smoothed warmth target. OFFSET_PEAK π: variable phase target ranges
  // over (0, π) as camMotion ramps 0→1, so the phase pull point morphs
  // continuously from in-phase echo at motion-onset toward antiphase
  // answer at peak dolly — same morphing target as v112/v113/v115.
  // RATE_MIX 0.5: lock-rate intensifies +50% at peak camMotion via
  // cross-axis composition (positive amplitude × positive rate, same
  // polarity quadrant as v104/v115/v114). Total composed reading: the
  // wall's THERMAL MASS itself breathes WITH camera at motion-onset and
  // drifts AGAINST at peak dolly, while the locking event sharpens as
  // motion commits — three meta-classes layered on a single emissive
  // uniform, on the third substrate to wear this composition.
  const WALL_VARIABLE_LOCK_STRENGTH = 0.5;
  const WALL_VARIABLE_BASE_LERP = 4.0;
  const WALL_VARIABLE_DEPTH = 0.4;
  const WALL_VARIABLE_OFFSET_PEAK = Math.PI;
  const WALL_VARIABLE_RATE_MIX = 0.5;
  // P3 v94 — UNIFY #26: lintel emissive COLOR warms toward shared `#ff9966`
  // warm anchor with cameraMotion. FIFTH consumer on the COLOR axis after v84
  // (fog/bg), v85 (lights), v89 (wall accents), and v90 (cosmos shell). This
  // is the cut that extends the color category from THREE substrates
  // (atmosphere + walls + cosmos) to FOUR by adding THRESHOLD geometry — the
  // doorway lintels that frame every room transition. Lintels are the
  // BRIGHTEST fragments in every room (v72 breath + v81 directional + transit
  // flare all stack on them), so they're the most visible color cut available
  // — at peak dolly the threshold itself pulls toward amber alongside the air,
  // the architecture's accents, and the void. LINTEL_WARMTH_MIX = 0.40 sits
  // between ACCENT/FOG (0.45) and LIGHTS/COSMOS (0.30): lintels are bright
  // enough that 0.45 would saturate too visibly past the room's per-room
  // lintel-color identity (gold for celebrations, cyan for calendar, etc.),
  // but small enough that 0.30 would be lost against the v81 directional
  // brightening also acting on the same fragment. The shader gates the lerp
  // by step(0.001, length(vLintelEmissive)) so non-lintel tiles (which have
  // vLintelEmissive = vec3(0)) get ZERO warmth — only the threshold ring
  // fragments warm. v81 directional + v72 breath intensity + v89 wall-accent
  // warming all compose independently — lintels still lean toward forward,
  // still breathe, AND now also warm toward amber under motion.
  const LINTEL_WARMTH_MIX = 0.40;

  const handleBeforeCompile = useCallback((shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uEmissiveIntensity = emissiveUniform.current;
    shader.uniforms.uLintelBreath = lintelBreathUniform.current;
    shader.uniforms.uCelebrationFlash = celebFlashUniform.current;
    shader.uniforms.uLintelTransitionFlare = lintelFlareUniform.current;
    shader.uniforms.uCameraForward = uCameraForwardLintelRef.current;
    shader.uniforms.uCameraMotion = uCameraMotionLintelRef.current;
    shader.uniforms.uAccentWarmth = uAccentWarmthRef.current;
    shader.uniforms.uAccentEnvAnchor = uAccentEnvAnchorRef.current;
    shader.uniforms.uAccentEnvMix = uAccentEnvMixRef.current;
    shader.uniforms.uAccentDoorwayLaneAmp = uAccentDoorwayLaneAmpRef.current;
    shader.uniforms.uDoorwayDirLintel = uDoorwayDirLintelRef.current;
    shader.uniforms.uActionIntent = uActionIntentRef.current;
    shader.uniforms.uWallDoorwayDepthAmp = uWallDoorwayDepthAmpRef.current;
    shader.uniforms.uWallDoorwayThicknessAmp = uWallDoorwayThicknessAmpRef.current;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute vec3 instanceEmissiveColor;\nattribute vec3 instanceLintelEmissive;\nattribute float instanceDoorwayProximity;\nattribute vec3 instanceOutwardDir;\nuniform float uWallDoorwayDepthAmp;\nuniform float uWallDoorwayThicknessAmp;\nvarying vec3 vEmissiveColor;\nvarying vec3 vLintelEmissive;\nvarying vec3 vTileWorldPos;\nvarying float vDoorwayProximity;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvEmissiveColor = instanceEmissiveColor;\nvLintelEmissive = instanceLintelEmissive;\nvDoorwayProximity = instanceDoorwayProximity;\nvTileWorldPos = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;",
      )
      .replace(
        "#include <project_vertex>",
        "vec4 mvPosition = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\nmvPosition = instanceMatrix * mvPosition;\n#endif\nvec3 _tileCenter = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;\nfloat _outwardComp = dot(mvPosition.xyz - _tileCenter, instanceOutwardDir);\nmvPosition.xyz += instanceOutwardDir * _outwardComp * instanceDoorwayProximity * uWallDoorwayThicknessAmp;\nmvPosition.xyz += instanceOutwardDir * instanceDoorwayProximity * uWallDoorwayDepthAmp;\nmvPosition = modelViewMatrix * mvPosition;\ngl_Position = projectionMatrix * mvPosition;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uEmissiveIntensity;\nuniform float uLintelBreath;\nuniform float uCelebrationFlash;\nuniform float uLintelTransitionFlare;\nuniform vec3 uCameraForward;\nuniform float uCameraMotion;\nuniform float uAccentWarmth;\nuniform vec3 uAccentEnvAnchor;\nuniform float uAccentEnvMix;\nuniform float uAccentDoorwayLaneAmp;\nuniform vec3 uDoorwayDirLintel;\nuniform float uActionIntent;\nvarying vec3 vEmissiveColor;\nvarying vec3 vLintelEmissive;\nvarying vec3 vTileWorldPos;\nvarying float vDoorwayProximity;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\nvec3 _lintelDir = vTileWorldPos - cameraPosition;\nfloat _lintelLen = length(_lintelDir);\nfloat lintelDirBoost = 0.0;\nfloat accentDirBoost = 0.0;\nfloat lintelDoorwayBoost = 0.0;\nif (_lintelLen > 1e-4) {\n  vec3 _ndir = _lintelDir / _lintelLen;\n  float _dirDot = max(0.0, dot(_ndir, uCameraForward));\n  lintelDirBoost = _dirDot * uCameraMotion * 0.85;\n  accentDirBoost = _dirDot * uCameraMotion * 0.6;\n  float _doorDot = max(0.0, dot(_ndir, uDoorwayDirLintel));\n  lintelDoorwayBoost = pow(_doorDot, 3.0) * 1.1;\n}\nvec3 WARM_ANCHOR_SHADER = vec3(1.0, 0.6, 0.4);\nvec3 _envTintedAccent = mix(vEmissiveColor, uAccentEnvAnchor, uAccentEnvMix);\nvec3 _warmedAccent = mix(_envTintedAccent, WARM_ANCHOR_SHADER, uAccentWarmth);\nfloat _isLintelFrag = step(0.001, length(vLintelEmissive));\nvec3 _warmedLintel = mix(vLintelEmissive, WARM_ANCHOR_SHADER, uCameraMotion * 0.40 * _isLintelFrag);\nfloat _anticipateLintel = uActionIntent * 0.55;\nfloat _anticipateAccent = uActionIntent * vDoorwayProximity * 0.45;\ntotalEmissiveRadiance += _warmedAccent * (uEmissiveIntensity + accentDirBoost + vDoorwayProximity * uAccentDoorwayLaneAmp + _anticipateAccent) + _warmedLintel * (uLintelBreath + uLintelTransitionFlare + lintelDirBoost + lintelDoorwayBoost * _isLintelFrag + _anticipateLintel * _isLintelFrag) + diffuseColor.rgb * (uCelebrationFlash * 1.7);",
      );
  }, []);

  // Initial matrix + color setup whenever the tile set changes
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      dummy.position.set(
        t.px + t.ox * t.depthOffset,
        t.py + t.oy * t.depthOffset,
        t.pz + t.oz * t.depthOffset,
      );
      dummy.rotation.set(t.rx, t.ry, t.rz);
      dummy.scale.set(t.sx, t.sy, t.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, t.color);
    }
    mesh.count = tiles.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // Bake instance emissive color attribute (accent tiles → tile color, non-accent → black).
    const emissiveColors = new Float32Array(tiles.length * 3);
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (t.isAccent) {
        emissiveColors[i * 3] = t.color.r;
        emissiveColors[i * 3 + 1] = t.color.g;
        emissiveColors[i * 3 + 2] = t.color.b;
      }
    }
    const attr = new THREE.InstancedBufferAttribute(emissiveColors, 3);
    mesh.geometry.setAttribute("instanceEmissiveColor", attr);

    // P3 v13 — bake always-on lintel emissive. The doorway opening is invisible
    // at rest unless the threshold tiles glow; per VISION the gap *is* the path
    // and should read as such before any pulse fires. Lintel-band tiles get a
    // warm-color emissive contribution that sums into totalEmissiveRadiance
    // independently of the pulse-ramped accent emissive.
    const lintelEmissive = new Float32Array(tiles.length * 3);
    const warmCol = new THREE.Color(warmColor);
    // P2 v49 — at-rest lintel intensity is per-room. Was uniform 0.42 across
    // all rooms; now privacy/terms barely glow (legal hush, 0.10), congrats
    // blazes (REWARD threshold, 0.85), reset-password urgent (0.55).
    const LINTEL_INTENSITY_FALLBACK = 0.42;
    const LINTEL_INTENSITY = character.lintelIntensity ?? LINTEL_INTENSITY_FALLBACK;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (t.isLintel) {
        lintelEmissive[i * 3] = warmCol.r * LINTEL_INTENSITY;
        lintelEmissive[i * 3 + 1] = warmCol.g * LINTEL_INTENSITY;
        lintelEmissive[i * 3 + 2] = warmCol.b * LINTEL_INTENSITY;
      }
    }
    const lintelAttr = new THREE.InstancedBufferAttribute(lintelEmissive, 3);
    mesh.geometry.setAttribute("instanceLintelEmissive", lintelAttr);

    // v161 — bake per-tile doorway-proximity for the 3-substrate WAYFINDING
    // category. Wall accent tiles flanking each open doorway carry their
    // openingProximity (1 at the gap edge, 0 in the far corner); non-accent
    // tiles get 0 so the cosmos+floor+wall-accents lane reads as one coherent
    // brightened path through the room, framing every gap as you approach it.
    // v166 — populate proximity for ALL tiles (not just accents) so the
    // geometry-displacement channel (uWallDoorwayDepthAmp × instanceOutwardDir)
    // reads as a WALL-WIDE bulge along the doorway lane, not just an accent-
    // band bulge. The v161 fragment-emissive consumer multiplies by
    // _warmedAccent which is zero for non-accents, so emissive output on
    // non-accent tiles is unchanged — only the new vertex-displacement
    // consumer activates the additional tiles.
    const doorwayProximity = new Float32Array(tiles.length);
    for (let i = 0; i < tiles.length; i++) {
      doorwayProximity[i] = tiles[i].openingProximity;
    }
    const doorwayProxAttr = new THREE.InstancedBufferAttribute(doorwayProximity, 1);
    mesh.geometry.setAttribute("instanceDoorwayProximity", doorwayProxAttr);

    // v166 — bake per-tile world-space outward unit vector. Used by the new
    // <project_vertex> override to push wall tiles outward along their face
    // normal proportional to instanceDoorwayProximity. Stored once at tile-
    // set bake time since outward-dir is a static geometric property of each
    // tile (matches t.ox/t.oy/t.oz computed in push()).
    const outwardDir = new Float32Array(tiles.length * 3);
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      outwardDir[i * 3] = t.ox;
      outwardDir[i * 3 + 1] = t.oy;
      outwardDir[i * 3 + 2] = t.oz;
    }
    const outwardAttr = new THREE.InstancedBufferAttribute(outwardDir, 3);
    mesh.geometry.setAttribute("instanceOutwardDir", outwardAttr);
  }, [tiles, dummy, warmColor]);

  // Transition pulse: when the active view changes, the OUT room's exit-wall tiles
  // disassemble outward, and the IN room's entry-wall tiles assemble inward (start
  // displaced outward, settle home). Other rooms idle on drift.
  const pulseState = usePulse();
  const lastPulseId = useRef(pulseState.pulse);
  const pulseStart = useRef(-Infinity);
  const pulseRole = useRef<"in" | "out" | null>(null);
  const pulseFace = useRef<WallFace | null>(null);

  useEffect(() => {
    if (pulseState.pulse !== lastPulseId.current) {
      lastPulseId.current = pulseState.pulse;
      const cur = getRoomView();
      const prev = getPrevRoomView();
      if (cur === viewKey && prev) {
        pulseRole.current = "in";
        pulseFace.current = findConnectionFace(viewKey, prev);
        pulseStart.current = performance.now() / 1000;
      } else if (prev === viewKey) {
        pulseRole.current = "out";
        pulseFace.current = findConnectionFace(viewKey, cur);
        pulseStart.current = performance.now() / 1000;
      }
    }
  }, [pulseState.pulse, viewKey]);

  // Reusable scratch objects for the per-frame quaternion tumble (avoid allocations).
  const spinAxis = useMemo(() => new THREE.Vector3(), []);
  const spinQuat = useMemo(() => new THREE.Quaternion(), []);
  const baseEuler = useMemo(() => new THREE.Euler(), []);
  const baseQuat = useMemo(() => new THREE.Quaternion(), []);
  // v155 — scratch target for cosmos-slab pull. Filled per-tile inside the
  // pulse loop via cosmosTargetFor(); reused across every tile + frame to
  // avoid Vector3 allocations during the 720-tile pulse window.
  const cosmosTargetVec = useMemo(() => new THREE.Vector3(), []);

  // Room center as scalars for useFrame use (P3 v18 celebration radial source).
  const [cx, cy, cz] = layout.center;

  // P3 v16 — page-load entry assembly. Captured once per room mount so each
  // tile can ease from a displaced start back home over ~1.6s on first render.
  // No transition pulse fires on initial load (no view change to detect), so
  // without this the room just *appears* statically — flat first impression
  // for the most important state-change of all (arrival). With this every
  // page-load is an arrival moment that reads as "the room assembled around me."
  const mountTime = useRef(performance.now() / 1000);
  // P2 v52 — entry-assembly is per-room. Pre-v52 every room arrived with the
  // same 1.6s baseline (room half-extent ~5u, so 1.4u is visibly displaced but
  // stays inside neighboring corridor; 0.5 sideways scatter so tiles read as
  // "settling into a grid" not "tumbling chaotically"; 0.7 peak rotation eases
  // to 0). Now privacy assembles in restrained silence, congrats slams in with
  // chaotic celebration, reset-password snaps in alarm — page-load arrival
  // itself reads as the room.
  const ENTRY_DURATION_FALLBACK = 1.6;
  const ENTRY_NORMAL_AMP_FALLBACK = 1.4;
  const ENTRY_TANGENT_AMP_FALLBACK = 0.5;
  const ENTRY_SPIN_AMP_FALLBACK = 0.7;
  const ENTRY_DURATION = character.entryDuration ?? ENTRY_DURATION_FALLBACK;
  const ENTRY_NORMAL_AMP = character.entryNormalAmp ?? ENTRY_NORMAL_AMP_FALLBACK;
  const ENTRY_TANGENT_AMP = character.entryTangentAmp ?? ENTRY_TANGENT_AMP_FALLBACK;
  const ENTRY_SPIN_AMP = character.entrySpinAmp ?? ENTRY_SPIN_AMP_FALLBACK;

  // P2 v69 — UNIFY #1: walls come from cosmos.
  // The wall and the cosmos (TileVoid) are made of the same tile-substance.
  // During entry assembly, each tile's start position is along its RADIAL
  // direction from room center (not its local wall normal), pushed out toward
  // the cosmos shell at COSMOS_REACH world units. This means:
  //   - tiles at the top of a wall fly in from upper cosmos
  //   - tiles at corners fly in diagonally (fan-in swarm)
  //   - floor tiles fly up from the cosmos shell below
  //   - ceiling tiles fall in from the cosmos shell above
  // Visually the room assembles as a converging swarm from the surrounding
  // void rather than as four flat slabs pushing in along their normals.
  // ENTRY_NORMAL_AMP per-room is preserved as a scalar on COSMOS_REACH — so
  // congrats (amp 2.2) tiles fly in from further out than privacy (amp 0.8).
  // VISION: "individual pieces falling out and moving in and out through gaps."
  const COSMOS_REACH = 8.0;

  // P2 v70 — UNIFY #2: wall disassembly travels TO cosmos.
  // v69 made entry-assembly come from cosmos (one half of "in and out through
  // gaps"). v70 closes the loop: wall-pulse OUT tiles get an additional
  // radial-outward-from-room-center boost on top of their local-normal pop.
  // The boost ramps with tProg² so it kicks in *mid-late* disassembly — the
  // wall first cracks along its normal (early tProg), then pieces increasingly
  // head toward the cosmos shell they came from. Half-strength of entry
  // (COSMOS_REACH × 0.5) so the local-normal shatter still reads — the cosmos
  // pull is a *bias* layered onto the existing per-tile tumble, not a replacement.
  const COSMOS_PULSE_REACH = COSMOS_REACH * 0.5;

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const now = state.clock.elapsedTime;
    const wallNow = performance.now() / 1000;
    // pulseStart is captured from performance.now() in the pulse useEffect, so
    // measure `since` in the same clock — mixing state.clock.elapsedTime here
    // produced a constant negative offset and silently disabled the pulse window.
    const since = wallNow - pulseStart.current;
    // Normalized window time 0..1 over the pulse duration; 1 once finished.
    const normT = since < 0 ? 0 : Math.min(1, since / pulseDuration);
    const role = pulseRole.current;
    const targetFace = pulseFace.current;
    const inWindow = since >= 0 && since < pulseDuration && role !== null;

    // Click-driven bump impulses — read once per frame, applied additively below.
    // Each bump is a quick rise / slow decay ripple radiating outward from a
    // world-space origin. Tiles within BUMP_RADIUS push toward the camera
    // (= away from origin in world space) with strength scaled by distance.
    // P3 v38 — bump *spatial* character is per-room: goals strikes tight & hard
    // (input lands on a small patch), calendar ripples wide & soft (planning
    // reads radiate), privacy/terms barely flinch (legal hush), reset-password
    // grabs urgent & broad (alarm). Envelope timing (BUMP_LIFETIME 0.55s,
    // BUMP_PEAK_NORM 18%) stays uniform — only WHERE and HOW MUCH the bump
    // displaces tiles varies by room. Layers on hover (v37), drift (v36),
    // pulse trajectory (v35), pulse timing/amp (v34), wall aspect (v33),
    // tile size (v32), FOV (v31).
    const liveBumps = getActiveBumps();
    const BUMP_RADIUS = character.bumpRadius;
    const BUMP_AMP = character.bumpAmp;
    const BUMP_PEAK_NORM = 0.18; // peak at 18% of envelope (= 100ms in)

    // P3 v18 — state-change celebration burst. Differs from bumps (point-radial,
    // transient) and pulses (back-wall only, navigation-driven): when a meaningful
    // app-state change fires (goal submit, day complete, streak), every tile in
    // the active room bursts radially outward from room-center with vertical lift
    // and tumble. Bell envelope `4 * tNorm * (1 - tNorm)` so the room "breathes"
    // outward and settles back home — reads as the architecture cheering.
    // P3 v39 — celebration *envelope width* and *spin multiplier* are per-room
    // (character.celebDuration / celebSpinAmp). Goals snaps fast and assertive
    // on goal-create (1.4s/1.8); calendar swells slow and broad on planning
    // achievement (2.4s/1.2); congrats is the longest-broadest-most-chaotic
    // burst (2.6s/2.4 — THE reward room); privacy/terms barely register a
    // celebration at all (1.0s/0.6 — legal hush). Registry-level cleanup
    // ceiling stays at 3.0s so longer per-room envelopes survive.
    const liveCelebrations = getActiveCelebrations();
    const celebDuration = character.celebDuration;
    const celebSpinAmpMul = character.celebSpinAmp;
    let celebAmp = 0;
    let celebSpin = 0;
    if (liveCelebrations.length > 0) {
      for (let ci = 0; ci < liveCelebrations.length; ci++) {
        const c = liveCelebrations[ci];
        if (c.view !== viewKey) continue;
        const ct = wallNow - c.fireTime;
        if (ct < 0 || ct > celebDuration) continue;
        const tn = ct / celebDuration;
        const env = 4 * tn * (1 - tn); // 0 → 1 (peak at midpoint) → 0
        celebAmp += env * c.intensity;
        celebSpin += env * c.intensity * celebSpinAmpMul;
      }
    }
    // P3 v39 — radial + lift amplitude per-room: congrats 0.85/0.70 (sparkle
    // sky-high), privacy 0.20/0.15 (almost imperceptible), goals 0.65/0.55
    // (assertive triumphant snap), calendar 0.50/0.30 (broad but low).
    const CELEB_RADIAL_AMP = character.celebRadialAmp;
    const CELEB_UP_AMP = character.celebUpAmp;
    const celebActive = celebAmp > 1e-4;

    // P3 v15 — hover-driven tile field. Cursor presence is a continuous
    // state-change; per VISION every tile movement maps to one. Only the active
    // room (camera at rest) reacts — far rooms stay stable. Tiles within
    // HOVER_RADIUS pull *toward* the cursor's wall-projection with smooth
    // falloff, giving the back wall a subtle magnetic shimmer that follows the
    // pointer. Composes additively with pulse + bump + drift.
    const cursorInfo = getCursorWorld();
    const applyHover = cursorInfo.active && getRoomView() === viewKey;

    // P3 v19 — camera-presence floor ripple. Per VISION, the floor was the
    // last fully-silent surface; camera presence in a room had no in-world
    // consequence on the tiles directly underfoot. Floor tiles within
    // FLOOR_RIPPLE_RADIUS of the camera's xz projection get pushed UP with a
    // smooth falloff — reads as light pressure on stiff fabric, like a
    // footstep indent traveling with the camera. Active room only; far rooms
    // hold their floor at rest.
    const camWorld = getCameraWorld();
    const camX = camWorld[0];
    const camZ = camWorld[2];
    const applyFloorRipple = getRoomView() === viewKey;
    // P2 v54 — floor-ripple presence is per-room. Pre-v54 baseline 3.2 radius
    // × 0.18 amp was universal. Privacy/terms barely respond (1.6×0.05 vault
    // hush); settings utilitarian-flat (2.4×0.10); calendar wide & quiet
    // (4.4×0.16 planning grid); goals tight & punchy (2.6×0.22 ambition);
    // congrats radiates grand celebration waves (5.6×0.28 biggest spread).
    // Eighth Phase 2 dimension layered on space/material/threshold-glow/
    // threshold-size/threshold-frame/arrival/relief — same room reacts
    // to your standing presence completely differently per view.
    const FLOOR_RIPPLE_RADIUS = character.floorRippleRadius ?? 3.2;
    // P2 v76 — UNIFY #8: floor ripple amplitude rides camera motion. Pre-v76
    // the floor ripple amp was a static per-room baseline (P2 v54): the floor
    // pressed up under the camera identically whether you were standing still
    // or mid-dolly. v76 multiplies the amp by (1 + 0.9 × cameraMotion) so the
    // floor visibly breathes HARDER during transit — your footstep imprint
    // deepens as you move. Brings the floor (the last fully-silent surface
    // before v75) into the unified motion field's scalar arm. Combined with
    // v75's directional cosmos roll, traversal now reads as: cosmos rolls in
    // direction of travel (v75) + floor pumps under you with travel (v76) +
    // every other subsystem brightens/accelerates (v71-v74).
    // P3 v177 — META-PIVOT cut #24: 3rd cross-field polarity quadrant POS×NEG.
    // v174 opened cross-field NEG×NEG (cursor); v175 opened POS×POS (cosmos);
    // v176 bridged POS×POS canvas→DOM (letter-spacing). v177 opens the
    // unexplored POS×NEG corner of the cross-field polarity matrix by adding
    // a wayfinding-NEG factor to v76's motion-POS floor-amp boost. The same
    // FLOOR_RIPPLE_AMP scalar now reads both fields with OPPOSITE polarities:
    // motion AMPLIFIES it (+motion × 0.9), wayfinding YIELDS it (−align × 0.5).
    // Composed multiplicatively: at rest standing still: amp = baseline.
    // Mid-dolly off-axis: amp = ~1.9× baseline (v76 peak). Mid-dolly looking
    // down doorway: amp ≈ 1.9 × 0.5 = ~0.95× baseline — the floor visibly
    // STILLS exactly when the cosmos doorway lane (v175 POS×POS) ignites.
    // Two surfaces, opposite polarities, ONE alignment scalar: the doorway
    // lane bloomS while the underfoot ripple HUSHES, so the user's attention
    // is funnelled toward the spatial cue. Reads as "the floor steps aside
    // for the path". Reuses cameraForward (already a per-frame published
    // basis) and the global COSMOS_DOORWAY_DIR — zero new scalars or refs.
    const _floorFwd = getCameraForward();
    const _floorDoorwayDot =
      _floorFwd.x * COSMOS_DOORWAY_DIR[0] +
      _floorFwd.y * COSMOS_DOORWAY_DIR[1] +
      _floorFwd.z * COSMOS_DOORWAY_DIR[2];
    const _floorDoorwayAlign = _floorDoorwayDot > 0 ? _floorDoorwayDot : 0;
    const FLOOR_DOORWAY_AMP_YIELD = 0.5;
    // v187 — META-PIVOT cross-field × harmonic-convergence #2 (PROMOTES
    // meta×meta product from one-off → category). v186 opened the axis on
    // audio (drone POS×POS doorway amp pulses with tremoloPhase, which is
    // breath-locked via v110). This is the 2nd consumer of the same axis on
    // a different substrate (canvas) AND opposite polarity quadrant (v177
    // POS×NEG floor cell), mirroring v89/v90 promotion pattern. The v177
    // cross-field factor (1 - align × YIELD) is now MULTIPLIED by a
    // breath-phase carrier of depth ±25% scaled by camera motion, so the
    // floor's "step-aside-for-the-path" hush BREATHES in tempo with the
    // visible lintel/floor magnitude breath and the audible drone swell.
    // At rest cameraMotion=0 → carrier=1 → silent (no change from v177).
    // During aligned transit the hush deepens and re-shallows on the
    // breath, so two surfaces (cosmos lane bloom + floor hush) and one
    // audible carrier (drone) all PULSE on one phase — the cross-field
    // grid no longer just lights, it BREATHES. Same scalar (camera breath
    // phase) drives both substrates: audio reads it via tremoloPhase,
    // canvas reads it via getCameraBreathPhase. One source, multi-domain
    // product — promotion mirrors v89/v90 (1st two consumers in different
    // substrates = category).
    const FLOOR_CROSS_FIELD_HARMONIC_DEPTH = 0.25;
    const _floorBreathPhase = getCameraBreathPhase();
    const _floorCrossFieldHarmonic =
      1 +
      Math.sin(_floorBreathPhase) *
        FLOOR_CROSS_FIELD_HARMONIC_DEPTH *
        getCameraMotion();
    // P3 v194 — META-PIVOT cut #31: 3RD META³ COMPOSITION CELL — SATURATES
    // meta³ composition to 3/3 substrates (DOM v192 + audio v193 + canvas
    // v194), completing the 4TH INSTANCE of the promotion arc (one-off →
    // category → saturated). v187 lit this floor POS×NEG yield cell with
    // axis-1 (harmonic — _floorCrossFieldHarmonic above). v194 multiplies
    // the SAME cell ALSO by axis-2 (derivative — d(align)/dt). _floorAlign
    // Delta clamps to positive (swing-INTO-lane only). Depth 4 keeps the
    // composite yield bounded — at full motion+align+swing-in the deriv
    // factor peaks ~5×, multiplied into a yield that's clamped by the
    // outer (1 - ...) form so the floor STILLS deeper on arrival rather
    // than oscillating. Gated by getCameraMotion() matching v187's harmonic
    // carrier polarity (POS-motion). Phenomenologically: v187 made the
    // floor STILL during aligned transit and BREATHE on top; v194 adds
    // an asymmetric DEEPER-HUSH PUNCH on swing-into-lane — the floor
    // "drops further out of the way" as the user rotates into the path.
    const FLOOR_CROSS_FIELD_DERIV_DEPTH = 4;
    const _floorAlignDelta = Math.max(0, _floorDoorwayAlign - prevFloorAlignRef.current);
    prevFloorAlignRef.current = _floorDoorwayAlign;
    const _floorCrossFieldDeriv =
      1 + _floorAlignDelta * FLOOR_CROSS_FIELD_DERIV_DEPTH * getCameraMotion();
    // P3 v196 — META-PIVOT cut #33: TWO structural products in one edit.
    // (1) PROMOTES meta×meta axis-3 (phase-offset) from one-off to
    // 2-substrate CATEGORY by crossing into canvas (audio v195 + canvas
    // v196). (2) OPENS THE FIRST META⁴ COMPOSITION CELL — this floor cell
    // already carries axis-1 (harmonic, v187) and axis-2 (derivative,
    // v194); adding axis-3 (phase-offset) makes it the first cell where
    // ALL THREE meta×meta axes multiply simultaneously. Math:
    //   cross-field × axis-1 × axis-2 × axis-3 → 5-factor nested calc.
    // The 4 prior arc instances landed at most TWO axes on one cell
    // (meta³ at v192/v193/v194). v196 lifts that to THREE — meta⁴
    // composition is now born. Reuses _floorBreathPhase (already a
    // free phase scalar consumed by axis-1) so the phase-offset carrier
    // adds zero new state — same arithmetic economy as v193's reuse of
    // prevDroneAlign. Phase offset = π × (1 - align) matches v195's
    // axis-3 form exactly (anti-phase at off-axis, in-phase at aligned).
    // Depth 0.2 is conservative inside the yield product — combined
    // yield variation stays bounded so the floor reads as "deeper
    // hush with a slow shimmer in its hush-timing" rather than chaotic.
    // Phenomenology: floor v177 yields → v187 breathes while yielding
    // → v194 punches deeper hush on arrival → v196 the hush TIMING
    // itself shifts phase as alignment changes. Four temporal textures
    // layered onto one yield. Meta⁴ as one-off (1/?).
    const FLOOR_PHASE_OFFSET_DEPTH = 0.2;
    const _floorPhaseOffsetCarrier =
      1 + FLOOR_PHASE_OFFSET_DEPTH * Math.sin(_floorBreathPhase + Math.PI * (1 - _floorDoorwayAlign));
    const floorCamBoost =
      (1 + 0.9 * getCameraMotion()) *
      (1 -
        _floorDoorwayAlign *
          FLOOR_DOORWAY_AMP_YIELD *
          _floorCrossFieldHarmonic *
          _floorCrossFieldDeriv *
          _floorPhaseOffsetCarrier);
    const FLOOR_RIPPLE_AMP = (character.floorRippleAmp ?? 0.18) * floorCamBoost;
    // P2 v83 — UNIFY #15: floor ripple wave DIRECTION adopts cameraForward.
    // Pre-v83 the floor ripple was purely radial — falloff^2 × amp centered
    // on (camX, camZ). At rest that's correct: standing-presence ripples
    // outward in all directions equally. During DOLLY the camera is heading
    // somewhere specific, and the floor should carry a traveling wave in
    // THAT direction on top of the radial breath — your motion leaves a
    // wake. Per-tile additive term: sin(dot(tileXZ − camXZ, fwdXZ) × waveK
    // − now × waveSpeed) × falloff × amp × FLOOR_DIR_MIX × cameraMotion.
    // Silent at rest (cameraMotion=0 zeroes the whole term), audible during
    // transit. Floor becomes the SECOND geometric subsystem (after lintel)
    // on BOTH magnitude AND directional channels — last major rendered
    // geometry still magnitude-only joins the dual-channel field.
    const FLOOR_DIR_MIX = 0.55;
    const FLOOR_RIPPLE_WAVELENGTH = 1.4;
    const FLOOR_WAVE_SPEED = 2.4;
    const _fwdFloor = getCameraForward();
    const _fwdFloorLenXZ = Math.hypot(_fwdFloor.x, _fwdFloor.z);
    const fwdFloorX = _fwdFloorLenXZ > 1e-4 ? _fwdFloor.x / _fwdFloorLenXZ : 0;
    const fwdFloorZ = _fwdFloorLenXZ > 1e-4 ? _fwdFloor.z / _fwdFloorLenXZ : 0;
    // v160 — META-PIVOT cut #10 (VISIBLE). Floor wayfinding lane along doorway
    // XZ direction. Bridges the v158/v159 directional channel from the cosmos
    // substrate INTO the floor substrate — wayfinding promotes from one-off
    // (cosmos shell only) to a 2-substrate category. Pre-v160 the floor ripple
    // only knew two directions: radial-from-camera (v19 breath) and along
    // cameraForward (v83 wake). It was indifferent to where the room's open
    // DOORWAYS sit. v160 adds a third additive term: floor tiles whose offset
    // from the camera projects onto the doorway XZ direction get an additional
    // upward push proportional to pow(alignment, k) × falloff² × amp. Unlike
    // the v83 wake term, this is ACTIVE AT REST (no cameraMotion gate) so the
    // floor visibly carries a soft directional shimmer toward open doorways
    // even when you're standing still — pre-visualizing the camera's next
    // travel direction on the surface underfoot. Rooms whose doorway is pure
    // +y (landing → top) get a zero XZ component → silent. Calendar (+z),
    // day (west+north blend), etc. show a visible lane on the floor.
    const _doorwayXZLenSq = COSMOS_DOORWAY_DIR[0] * COSMOS_DOORWAY_DIR[0] + COSMOS_DOORWAY_DIR[2] * COSMOS_DOORWAY_DIR[2];
    const _doorwayXZLen = _doorwayXZLenSq > 1e-6 ? Math.sqrt(_doorwayXZLenSq) : 0;
    const doorwayFloorX = _doorwayXZLen > 0 ? COSMOS_DOORWAY_DIR[0] / _doorwayXZLen : 0;
    const doorwayFloorZ = _doorwayXZLen > 0 ? COSMOS_DOORWAY_DIR[2] / _doorwayXZLen : 0;
    const FLOOR_DOORWAY_LANE_AMP = 0.42;
    const FLOOR_DOORWAY_LANE_POWER = 3.0;
    const floorDoorwayLaneActive = _doorwayXZLen > 1e-3 && applyFloorRipple;
    // P3 v97 — UNIFY #29: floor wave-speed phase accumulator.
    // Pre-v97: `floorWavePhase = now × FLOOR_WAVE_SPEED` — wave speed fixed.
    // Post-v97: phase advances by `delta × effectiveFloorWaveSpeed` so rate
    // changes don't cause sin-argument discontinuities. effectiveFloorWaveSpeed
    // = FLOOR_WAVE_SPEED × (1 + camMotion × FLOOR_FREQ_MIX): at rest 2.4 rad/s,
    // at peak dolly 3.36 rad/s. Same phase-accumulator pattern as v95 (lintel).
    const _camMotionFloor = getCameraMotion();
    // P3 v220 — env-source temporal axis 3rd substrate. Hoists _dayWarmth214
    // up from its former v214 site (line ~2419) so floor (here) AND v214
    // color block AND v219 lintel breath rate all reuse a single getDayWarmth()
    // read per useFrame — same hoist pattern v218 used on TileVoid. Computes
    // dayWaveScale = NIGHT + (DAY-NIGHT) * dayWarmth and folds it into
    // effectiveFloorWaveSpeed BEFORE v97's camMotion frequency mix, so wall-
    // clock sets the rest baseline and motion still multiplies on top.
    const _dayWarmth214 = getDayWarmth();
    const dayWaveScale = FLOOR_WAVE_NIGHT_SCALE + (FLOOR_WAVE_DAY_SCALE - FLOOR_WAVE_NIGHT_SCALE) * _dayWarmth214;
    // P3 v230 — env-source SPATIAL axis 5th substrate (WALLS). Reuses the
    // _dayWarmth214 read directly above so zero extra wall-clock samples.
    // Writes parent mesh Y; instance matrices are local and stack on top
    // (per-tile pulse/shatter/wave grammar unaffected). At dayWarmth=0
    // (03:00) walls settle to Y=-0.08 (room heavy, night-weighted); at
    // dayWarmth=1 (15:00) walls lift to Y=+0.08 (room buoyant, afternoon);
    // dayWarmth=0.5 (sunrise/sunset) Y=0, pre-v230 backwards-compatible.
    // SPATIAL axis breadth 4 → 5; matrix becomes all-axes-at-5.
    mesh.position.y = WALL_Y_NIGHT + (WALL_Y_DAY - WALL_Y_NIGHT) * _dayWarmth214;
    // P3 v231 — env-source OPENS 5TH AXIS (MATERIAL) via wall tile roughness
    // × dayWarmth. Reuses _dayWarmth214 — zero extra wall-clock samples.
    // BRDF response shifts: night → +0.05 rougher (light scatters, surfaces
    // soft); day → −0.05 smoother (specular tightens, surfaces crisp).
    // Material uniform mutates without shader recompile so the v5 program
    // cache survives. Walls promote to 3-axis env-source substrate.
    const wallRoughnessDelta = WALL_ROUGHNESS_NIGHT_DELTA + (WALL_ROUGHNESS_DAY_DELTA - WALL_ROUGHNESS_NIGHT_DELTA) * _dayWarmth214;
    (mesh.material as THREE.MeshStandardMaterial).roughness = tileRoughness + wallRoughnessDelta;
    const effectiveFloorWaveSpeed = FLOOR_WAVE_SPEED * dayWaveScale * (1 + _camMotionFloor * FLOOR_FREQ_MIX);
    // P3 v109 — UNIFY #41: HARMONIC CONVERGENCE category-promotion. v108 opened
    // harmonic convergence on lintel breath (1 substrate, 1 consumer). v109
    // adds a SECOND inter-consumer phase coupling on a different substrate:
    // floor wave phase pulls toward camera breath phase before the v97 rate
    // advancement runs. Same grading as v108 (LOCK_STRENGTH=0.5, BASE_LERP=4.0/s)
    // so harmonic reads as one coherent property across substrates — exactly
    // mirrors v95→v97 substrate broadening on temporal-frequency. At rest
    // motion=0 → no pull, floor wave runs free at its per-room rate. At peak
    // motion=1 → ~250ms half-life pull, floor wave phase converges toward
    // camera breath, then v97 rate advancement layers on top of locked phase.
    // The room's WAKE rhythm inherits the camera's heartbeat under motion.
    // Promotes harmonic convergence from one-off to 2-substrate category.
    const _camBreathPhaseFloor = getCameraBreathPhase();
    const _floorLockStrength = _camMotionFloor * HARMONIC_LOCK_STRENGTH;
    if (_floorLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _floorRawDiff = _camBreathPhaseFloor - floorWavePhaseRef.current;
      const _floorPhaseDiff = ((_floorRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _floorLockRate = HARMONIC_LOCK_BASE_LERP * _floorLockStrength;
      const _floorLockK = 1 - Math.exp(-_floorLockRate * delta);
      floorWavePhaseRef.current += _floorPhaseDiff * _floorLockK;
    }
    floorWavePhaseRef.current += delta * effectiveFloorWaveSpeed;
    const floorWavePhase = floorWavePhaseRef.current;
    const floorWaveAmp = FLOOR_RIPPLE_AMP * FLOOR_DIR_MIX * _camMotionFloor;
    const floorWaveK = (2 * Math.PI) / FLOOR_RIPPLE_WAVELENGTH;
    // P3 v37 — hover-magnet character is per-room. Goals magnetizes tightly
    // (focused ambition reaches close & hard); calendar wide and soft
    // (spacious planning); privacy/terms barely respond (legal hush);
    // reset-password chaotic urgent grab. Cursor-reactivity itself becomes
    // a mood signal layered on drift (v36), pulse trajectory (v35),
    // pulse timing (v34), wall aspect (v33), tile scale (v32), FOV (v31).
    const HOVER_RADIUS = character.hoverRadius;
    const HOVER_AMP = character.hoverAmp;

    // P3 v25 — generation wave. While async work is in progress (AI plan
    // generation, ~5–15s) a slow traveling ripple expands from room center
    // across the tile field so the most magical UX beat — "the AI is making
    // your plan" — has visible architectural participation. Phase varies by
    // each tile's distance from room center, so the wave reads as concentric
    // shells expanding outward, not a uniform pulse. fadeIn ramps over 0.4s
    // after start so the wave eases in (no "click on"); fadeOut tail uses the
    // same envelope reversed when generating clears (driven by remembering the
    // last activeAt — see Room-side state). Active room only; far rooms hold
    // dead silent. Composes additively with hover/drift/bump/pulse.
    const genInfo = getGenerating();
    const applyGenWave = genInfo.active && genInfo.view === viewKey;
    // P3 v46 — per-room generation-wave character. Pre-v46 every room rippled
    // identically (the 4 hard-coded constants below). Now each room signs the
    // gen-wave: goals ripples deeply/densely (it's the *primary* generation
    // room), calendar hums slow-wide (calm planning), reset-password barely
    // breathes but ramps instantly (urgent lock-on), privacy/terms barely
    // participate at all (legal hush). The `character` variable is already
    // in scope at line 743 (hover) so we read four new fields here. Constants
    // become *_FALLBACK matching the established composition pattern.
    const GEN_WAVE_AMP_FALLBACK = 0.04;
    const GEN_WAVE_SPEED_FALLBACK = 1.6;
    const GEN_WAVE_LENGTH_FALLBACK = 0.65;
    const GEN_FADE_IN_FALLBACK = 0.4;
    const GEN_WAVE_AMP = character.genWaveAmp ?? GEN_WAVE_AMP_FALLBACK;
    const GEN_WAVE_SPEED = character.genWaveSpeed ?? GEN_WAVE_SPEED_FALLBACK;
    const GEN_WAVE_LENGTH = character.genWaveLength ?? GEN_WAVE_LENGTH_FALLBACK;
    const GEN_FADE_IN = character.genFadeIn ?? GEN_FADE_IN_FALLBACK;
    const genElapsed = applyGenWave ? wallNow - genInfo.startedAt : 0;
    const genFade = applyGenWave ? Math.min(1, genElapsed / GEN_FADE_IN) : 0;

    // P3 v36 — at-rest drift is per-room: goals tense/fast, calendar slow/wide,
    // privacy/terms nearly still, reset-password jittery urgent. Resting
    // metabolism is the kinetic signature you spend most time inside.
    const driftAmp = character.driftAmp;
    const driftFreq = character.driftFreq;

    // v233 — Persistent ambient wall shed. Per VISION the room's resting state
    // is "walls open up or fall apart by individual pieces falling out and
    // moving in and out through gaps" — not a static slab that only shatters
    // at transitions. Each vertical-wall tile carries a long-period sin
    // oscillation with a sharp gate (sin^8) so only a small percentage of
    // tiles are mid-flight at any single instant. Doorway-adjacent tiles shed
    // harder (× openingProximity²) so the gap reads as the room "breathing
    // pieces" out through its opening. The transition pulse takes priority —
    // when tProg fires on a tile's face the shed is suppressed so the
    // dramatic shatter isn't muddied by ambient noise. VISCERAL: at any single
    // still in the 60s recording, tiles are visibly drifting out from the
    // walls into the cosmos and back — never a fully-static room
    // (Tom 2026-05-13).
    const SHED_FREQ = 0.95;        // ~6.6s period at 2π
    const SHED_GATE_POWER = 8;     // sharp gate → mostly resting, occasional spike
    const SHED_AMP = 0.85;         // along-normal max push (room half-extents ≈ 5–6u)
    const SHED_TANGENT_AMP = 0.45; // tangential scatter component
    const SHED_DOORWAY_BIAS = 1.8; // multiplier near doorway opening

    // Choreography amplitudes (in world units / radians). Tuned so on-face tiles
    // visibly clear the wall plane (room half-extents ≈ 5–6u) before settling.
    // P3 v35 — pulseScatter/pulseGravity/pulseSpin per-room multiply onto the
    // tangent/gravity/spin baselines so each room's wall *falls* differently:
    // goals snaps tight along the normal; calendar drifts wide; congrats sprays
    // radially without falling; privacy/terms drop heavy with minimal spin;
    // reset-password fragments chaotically. NORMAL_AMP stays untouched — it's
    // the outward-push axis controlled by pulseStrength alone.
    const NORMAL_AMP = pulseStrength * 5.6;                          // along outward (or inward) normal
    const TANGENT_AMP = pulseStrength * 2.4 * character.pulseScatter; // sideways scatter
    const GRAVITY_AMP = pulseStrength * 2.6 * character.pulseGravity; // downward bias on OUT only (∝ progress²)
    // P3 v22 — doorway parting amplitude. Lintel tiles on the connection face
    // get an additional in-wall-plane displacement directed AWAY from the
    // opening center, so the doorway visibly *opens* (OUT) and *seals* (IN).
    // Per-tile, scaled by openingProximity so jamb-and-lintel tiles right on
    // the gap edge part most aggressively while outer-ring tiles barely shift.
    // Scatter multiplier carries here too — doorway parting is a tangential
    // displacement in the wall plane, same family as TANGENT.
    const DOORWAY_PART_AMP = pulseStrength * 4.2 * character.pulseScatter;

    // P2 v78 — UNIFY #10: wall pulse trajectory adopts cameraForward.
    // The directional spatial channel (v75) finally reaches the wall geometry —
    // the central subject of VISION ("walls open up... pieces falling out and
    // moving in and out through gaps"). Pre-v78 wall pieces shed purely along
    // local wall-normal (NORMAL_AMP) + in-plane scatter (TANGENT_AMP) + cosmos
    // radial (UNIFY #2). The trajectory was indifferent to direction of camera
    // travel — a wall on the north face shed identically whether the camera
    // was dollying through it (north) or merely turning past it. v78 layers a
    // camera-forward bias on top so pieces visibly TUMBLE in the direction of
    // travel during transit. fwd × pulseStrength × ~2.6u × camMotion × tProg.
    // - At rest (camMotion = 0): silent, classic radial+tangent shatter survives.
    // - During dolly: pieces lean ALONG the camera-motion vector. For OUT
    //   (tileSign = +1) pieces lead the camera; for IN (tileSign = -1) pieces
    //   start displaced BACKWARD relative to camera and arc forward into the
    //   wall as the camera arrives — visually identical to the "pieces fly past
    //   the camera as it enters" reading the existing direction-aware grammar
    //   already encodes for the local-normal axis.
    // Multiplied by tileSign so the bias respects the existing OUT/IN dominant-
    // flow convention (rolePrimaryRatio) — no new per-room knob needed.
    // (camMotion is read here AND again at the lintel block — both cheap module reads.)
    const FORWARD_AMP = pulseStrength * 2.6 * getCameraMotion();
    const camFwdVec = getCameraForward();

    // Direction-aware grammar (P3 v6). Camera-relative narrative:
    //   OUT pulse: camera is leaving this room, dollying through this room's
    //   connection face into the IN room. We want exit-wall pieces to fly
    //   AHEAD of the camera (in its motion direction) — i.e. outward in this
    //   room's local frame. Bias 88% outward.
    //
    //   IN pulse: camera is arriving at this room. Progress is inverted (tiles
    //   start displaced and settle home). For an "inward" tile (signBias high
    //   side), the start position is displaced into IN-room interior; it then
    //   flies OUTWARD (toward the camera-arrival corridor) as it settles into
    //   the wall plane behind the now-parked camera. Visually: pieces fly back
    //   past the camera as it enters. Bias 88% inward to make most pieces shoot
    //   toward the arriving camera.
    //
    //   The 12% counter-bias keeps Tom's "in AND out through gaps" variety —
    //   never one-directional, but the dominant flow tells the story.
    //
    // P2 v55 — directional coherence is per-room. Pre-v55 every room used 0.88
    // universal. Privacy/terms 0.96 vault-precision (pieces all fly one
    // direction — orderly, engineered disassembly); congrats 0.60 chaotic
    // celebration (pieces fly both ways near-equally — confetti, no dominant
    // flow); reset-password 0.94 alarm-bunker urgent; calendar 0.75 composed
    // mix (planning sees both sides); settings 0.82 utilitarian-some-variety.
    // 9th Phase 2 dimension — layered on space (v47) + material (v48) +
    // threshold glow (v49) + threshold size (v50) + frame (v51) + arrival
    // (v52) + relief (v53) + presence (v54) + DISASSEMBLY PHYSICS.
    const ROLE_PRIMARY_RATIO = character.rolePrimaryRatio ?? 0.88;
    const primarySign: 1 | -1 = role === "in" ? -1 : 1;
    const secondarySign: 1 | -1 = primarySign === 1 ? -1 : 1;

    // P3 v9 — accent emissive intensity ramp. sin(0..π) envelope over the pulse
    // window peaks at midpoint (≈ 700ms in). Multiplied per-instance by the
    // baked instanceEmissiveColor in the fragment shader → accent tiles spark
    // bright at the moment of maximum displacement, non-accent stay dark.
    //
    // P2 v56 — accent-flash brightness is per-room. Pre-v56 universal 1.6.
    // Privacy/terms 0.6 vault-hush (barely-visible spark — somber courtroom
    // disassembly); congrats 3.6 blazing celebration fireworks; reset-password
    // 2.8 urgent alarm-bright; settings 1.0 utilitarian-dim; calendar 1.4
    // composed dimmed; goals 2.4 ambition flash. 10th Phase 2 dimension — the
    // *light* of disassembly compounds with v55's *direction* of disassembly.
    const PULSE_EMISSIVE_PEAK = character.pulseEmissivePeak ?? 1.6;
    emissiveUniform.current.value = inWindow ? Math.sin(normT * Math.PI) * PULSE_EMISSIVE_PEAK : 0;
    // P3 v14 — slow lintel breathing. P2 v49 makes rate + amp per-room:
    // privacy/terms breathe slow + somber (1.5 rad/s, 0.20 amp); congrats fast
    // + warm-expansive (3.2, 0.55); reset-password urgent fast-pulsing (4.0,
    // 0.50); calendar slow planning-composure (1.6, 0.40). Pre-v49 universals
    // were 2.51 rad/s + 0.45 amp.
    const LINTEL_BREATH_RATE_FALLBACK = 2.51;
    const LINTEL_BREATH_AMP_FALLBACK = 0.45;
    const lintelBreathRate = character.lintelBreathRate ?? LINTEL_BREATH_RATE_FALLBACK;
    const lintelBreathAmp = character.lintelBreathAmp ?? LINTEL_BREATH_AMP_FALLBACK;
    // P2 v72 — UNIFY #4: lintel intensity rides camera motion.
    // The threshold tile that marks "you're about to traverse" visibly lights
    // up as the camera dollies through it. Chains the camera-motion signal
    // through three subsystems now: camera → cosmos drift (v71) → lintel
    // brightness (v72). At rest the lintel breathes at per-room amp; at full
    // dolly the breath is multiplied by ~1.9 — the doorway turns on as the
    // user moves toward it, the gap reads as an active threshold, not a
    // static frame. Composes multiplicatively with breath, so per-room
    // breath character (slow/legal vs. fast/celebratory) is preserved.
    const camMotion = getCameraMotion();
    // P2 v81 — UNIFY #13: feed cameraForward (normalized) and camMotion into the
    // shader uniforms each frame so the lintel directional-boost term picks up
    // live values. Ref-wrapped uniform objects bound once at compile time;
    // mutating .value here lights up the doorway ring asymmetrically without
    // any React-state churn. LINTEL_DIR_AMP (0.85) is baked into the shader.
    const fwdLintel = getCameraForward();
    uCameraForwardLintelRef.current.value.set(fwdLintel.x, fwdLintel.y, fwdLintel.z);
    if (uCameraForwardLintelRef.current.value.lengthSq() > 1e-6) {
      uCameraForwardLintelRef.current.value.normalize();
    }
    uCameraMotionLintelRef.current.value = camMotion;
    // v208 — DOM hover-intent → canvas anticipation. Read raw scalar set by
    // LandingPage Get Started handlers, exp-lerp with asymmetric rate (rise
    // faster than decay) so threshold tiles brighten BEFORE the click and
    // hold the glow briefly after the cursor leaves — anticipation as a
    // physical room property, not a button effect.
    const _rawIntent = getActionIntent();
    const _intentRate = _rawIntent > actionIntentSmoothedRef.current ? 8.0 : 3.0;
    const _intentK = 1 - Math.exp(-_intentRate * delta);
    actionIntentSmoothedRef.current += (_rawIntent - actionIntentSmoothedRef.current) * _intentK;
    uActionIntentRef.current.value = actionIntentSmoothedRef.current;
    // v163 — feed COSMOS_DOORWAY_DIR to lintel shader. Active room writes
    // this buffer on layout-change useEffect (line ~200), normalized; copy
    // straight into the vec3 uniform so every lintel fragment can compute
    // its alignment with the doorway-direction. The cube/multi-doorway
    // rings each show a different lintelDoorwayBoost depending on which
    // direction they face from the camera.
    uDoorwayDirLintelRef.current.value.set(
      COSMOS_DOORWAY_DIR[0],
      COSMOS_DOORWAY_DIR[1],
      COSMOS_DOORWAY_DIR[2],
    );
    // P3 v104 — UNIFY #36: cross-axis convergence #3 (color × frequency, both
    // POSITIVE). Drive uAccentWarmth as a temporally-smoothed track toward
    // (camMotion × ACCENT_WARMTH_MIX) at an effective lerp rate that ITSELF
    // rises with motion. Frame-rate-independent exp-lerp: k = 1 − exp(−rate × dt).
    // At rest (camMotion=0): rate = 4.0/s → ~250ms half-life, warmth ebbs slowly.
    // At peak dolly (camMotion=1): rate = 4.0 × (1 + 0.5) = 6.0/s → ~167ms half-
    // life, warmth tracks motion responsively. Reads as architecture with thermal
    // mass that wakes up when the camera commits to movement. First positive-
    // polarity cross-axis cell + first cross-axis on wall geometry — closes the
    // meta-class polarity matrix and opens substrate-breadth for v105.
    // P3 v214 — ENVIRONMENTAL source 4th color-axis substrate. Compute the
    // wall-clock anchor in linear sRGB (matches v89's vec3(1.0, 0.6, 0.4)
    // convention of hex/255 fed directly into the shader). Day anchor
    // #c89072 → (0.784, 0.565, 0.447); night anchor #4a4868 → (0.290, 0.282,
    // 0.408). Single per-frame lerp, copied straight into the vec3 uniform.
    // This is the FIRST env-source consumer that flows through a GPU uniform
    // path instead of CPU THREE.Color.lerp — structurally distinct from
    // v211/v212/v213 even though it uses the identical anchor pair and mix.
    // P3 v220 — _dayWarmth214 hoisted upstream (near floor block, line ~2191)
    // so floor wave-speed + this v214 color block + v219 lintel breath rate
    // all share a single getDayWarmth() read per useFrame.
    const _env214R = 0.290 + (0.784 - 0.290) * _dayWarmth214;
    const _env214G = 0.282 + (0.565 - 0.282) * _dayWarmth214;
    const _env214B = 0.408 + (0.447 - 0.408) * _dayWarmth214;
    uAccentEnvAnchorRef.current.value.set(_env214R, _env214G, _env214B);
    const _accentWarmTarget = camMotion * ACCENT_WARMTH_MIX;
    const _accentWarmRate = ACCENT_WARM_BASE_LERP * (1 + camMotion * WARM_RATE_MIX);
    const _accentWarmK = 1 - Math.exp(-_accentWarmRate * delta);
    // P3 v116 — UNIFY #48: smoother accumulator now SEPARATED from the
    // shader uniform. accentWarmthSmoothedRef stays clean (next-frame lerp
    // source) while the uniform receives smoothed × wallVariableMod
    // (variable-offset phase factor) further down. Mirrors v115's clean
    // `const drift = driftSmoothedRef.current * variableMod` separation.
    accentWarmthSmoothedRef.current += (_accentWarmTarget - accentWarmthSmoothedRef.current) * _accentWarmK;
    // P3 v116 — UNIFY #48: variable-offset phase-lock on wall accent
    // emissive. getCameraBreathPhase() supplies the global camera breath
    // accumulator; we target a continuously-morphing offset along the unit
    // circle: theta = camMotion × π. At rest motion=0 → in-phase echo;
    // mid-motion → quadrature; peak dolly motion=1 → antiphase answer.
    // Lock strength rises with camMotion (gated at 1e-4 so rest frames pay
    // nothing). Lock RATE intensifies further with camMotion via the v116
    // cross-axis composition (+50% at peak). Wrap-around-safe shortest-path
    // lerp in (-π, π].
    const _wallCamPhase = getCameraBreathPhase();
    const _wallTheta = camMotion * WALL_VARIABLE_OFFSET_PEAK;
    const _wallVarLockStrength = camMotion * WALL_VARIABLE_LOCK_STRENGTH;
    if (_wallVarLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _wallTarget = _wallCamPhase + _wallTheta;
      const _wallRawDiff = _wallTarget - wallAccentBreathPhaseRef.current;
      const _wallPhaseDiff = ((_wallRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _wallVarLockRate = WALL_VARIABLE_BASE_LERP * _wallVarLockStrength * (1 + camMotion * WALL_VARIABLE_RATE_MIX);
      const _wallLockK = 1 - Math.exp(-_wallVarLockRate * delta);
      wallAccentBreathPhaseRef.current += _wallPhaseDiff * _wallLockK;
    }
    const _wallVariableMod = 1 + Math.sin(wallAccentBreathPhaseRef.current) * WALL_VARIABLE_DEPTH * camMotion;
    uAccentWarmthRef.current.value = accentWarmthSmoothedRef.current * _wallVariableMod;
    const lintelCamBoost = 1 + 0.9 * camMotion;
    // P3 v95 — UNIFY #27: lintel breath FREQUENCY widens with cameraMotion via
    // phase accumulator. Pre-v95: `Math.sin(now × lintelBreathRate)` — rate was
    // fixed per-room. Post-v95: lintelBreathPhase advances each frame by
    // `delta × effectiveRate` so rate changes (from camMotion modulation) don't
    // cause sin-argument discontinuities. effectiveRate = baseRate × (1 + camMotion
    // × LINTEL_BREATH_FREQ_MIX): at rest 1× baseRate (per-room identity preserved),
    // at peak dolly 1.6× baseRate (threshold breathes ~60% faster). Composes
    // multiplicatively with v72's lintelCamBoost (amplitude) — both rate and
    // amplitude rise with motion, on the same fragment, on different structural
    // axes.
    // P3 v108 — UNIFY #40: HARMONIC CONVERGENCE opener. Before advancing the
    // lintel phase at its per-room rate (v95), pull the current phase toward
    // the camera breath phase. Pull strength rises with camMotion so at rest
    // there's no lock (each substrate runs free) and at peak motion the
    // lintel inherits the camera's rhythm. Wrap-around-safe: map raw phase
    // difference into (-π, π] via `((diff + π) mod 2π) - π` so the pull
    // always travels the shortest path around the unit circle (avoids the
    // 0 ↔ 2π discontinuity that would cause a snap when both accumulators
    // pass through 2π at different times). Frame-rate-independent exp-lerp.
    const camPhase = getCameraBreathPhase();
    const lockStrength = camMotion * HARMONIC_LOCK_STRENGTH;
    if (lockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const rawDiff = camPhase - lintelBreathPhase.current;
      const phaseDiff = ((rawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      // P3 v120 — UNIFY #52: 4-META-CLASS COMPOSITION opener. v108's harmonic
      // lock rate now INTENSIFIES with camMotion via the same single-line idiom
      // that v114/v115/v116/v118 used to compose cross-axis onto variable-offset
      // lock rates. POS×POS cross-axis on harmonic rate = harmonic phase-lock
      // snaps tighter as the dolly commits, layered on top of v108's existing
      // strength gating. Composition with v119's NEG variable-offset rate
      // composition makes lintel emissive the field's first 4-META-CLASS
      // CONSUMER: v94 amplitude × v108 harmonic × v120 cross-axis-on-harmonic-
      // rate × v119 variable-offset-cross-axis composed pair.
      const lockRate = HARMONIC_LOCK_BASE_LERP * lockStrength * (1 + camMotion * HARMONIC_RATE_MIX);
      const lockK = 1 - Math.exp(-lockRate * delta);
      lintelBreathPhase.current += phaseDiff * lockK;
    }
    // P3 v219 — ENVIRONMENTAL source TEMPORAL axis promotes from 1 substrate
    // (v218 cosmos drift) to 2-substrate CATEGORY. Lintel breath rate is the
    // 2nd temporal-axis env-source consumer: a wall-clock multiplier on the
    // base breath frequency BEFORE v95's camMotion frequency mix overlays.
    // ±10% chosen tighter than v218's ±15% to preserve the v108 harmonic-lock
    // structure (lintel must remain phase-lockable to the camera even at the
    // extremes of the day cycle). At 03:00 the lintel breathes 0.90× slower
    // — palpable nocturnal lethargy; at 15:00 it breathes 1.10× faster —
    // palpable diurnal alertness. Reuses _dayWarmth214 already read at line
    // 2419 for the v214 color block; no second getDayWarmth() call needed.
    const dayBreathScale = LINTEL_BREATH_NIGHT_SCALE + (LINTEL_BREATH_DAY_SCALE - LINTEL_BREATH_NIGHT_SCALE) * _dayWarmth214;
    const effectiveBreathRate = lintelBreathRate * dayBreathScale * (1 + camMotion * LINTEL_BREATH_FREQ_MIX);
    lintelBreathPhase.current += delta * effectiveBreathRate;
    // P3 v119 — UNIFY #51: NEG variable-offset phase × NEG cross-axis on rate
    // composed on lintel emissive (POS×POS×NEG quadrant — closes 4/4 polarity
    // matrix of 3-meta-class composition). Separate accumulator locks toward
    // `camPhase + camMotion × -π` (NEG polarity offset, mirrors v117 −π sign).
    // Lock rate YIELDS with motion via `× (1 − camMotion × LINTEL_VAR_RATE_YIELD)`
    // (NEG cross-axis on rate, mirrors v117 yield idiom). At rest motion=0 →
    // lockStrength gates entire block off AND _lintelVarMod = 1 (no amplitude
    // change), preserving v108 + v94 identity at rest. At peak motion the
    // variable phase locks toward antiphase to lintel's main camPhase target
    // — the breath splits into two voices: v108 in-phase main + v119 anti-phase
    // secondary, composed multiplicatively on the same emissive amplitude.
    const _lintelVarLockStrength = camMotion * LINTEL_VARIABLE_LOCK_STRENGTH;
    if (_lintelVarLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _lintelVarTarget = camPhase + camMotion * LINTEL_VARIABLE_OFFSET_PEAK;
      const _lintelVarRawDiff = _lintelVarTarget - lintelVariablePhaseRef.current;
      const _lintelVarPhaseDiff = ((_lintelVarRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _lintelVarLockRate = LINTEL_VARIABLE_BASE_LERP * _lintelVarLockStrength * (1 - camMotion * LINTEL_VAR_RATE_YIELD);
      const _lintelVarLockK = 1 - Math.exp(-_lintelVarLockRate * delta);
      lintelVariablePhaseRef.current += _lintelVarPhaseDiff * _lintelVarLockK;
    }
    const _lintelVarMod = 1 + Math.sin(lintelVariablePhaseRef.current) * LINTEL_VARIABLE_DEPTH * camMotion;
    // P3 v121 — UNIFY #53: 5th distinct meta-class on lintel emissive. FIXED
    // anti-phase harmonic lock — target = camPhase + π always, only lock
    // STRENGTH gates with camMotion. Structurally distinct from v119's
    // variable-offset (sliding target). Three locked phase voices now compose
    // on a single uniform: v108 in-phase main, v119 sliding-anti-phase
    // secondary, v121 fixed-anti-phase tertiary. Same wrap-around-safe
    // shortest-path idiom + exp-lerp pattern as v108/v119.
    const _lintelAntiLockStrength = camMotion * LINTEL_ANTI_LOCK_STRENGTH;
    if (_lintelAntiLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _lintelAntiTarget = camPhase + Math.PI;
      const _lintelAntiRawDiff = _lintelAntiTarget - lintelAntiPhaseRef.current;
      const _lintelAntiPhaseDiff = ((_lintelAntiRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      // P3 v124 — UNIFY #56: cross-axis composition on the v121 anti-phase
      // LOCK RATE. Adds a 6th meta-class to the lintel emissive stack —
      // structurally distinct from v120's harmonic-rate cross-axis (which
      // composes the in-phase lock rate) because this composes the
      // anti-phase lock rate. Same 0.5 mix constant, single-line composition.
      const _lintelAntiLockRate = LINTEL_ANTI_BASE_LERP * _lintelAntiLockStrength * (1 + camMotion * LINTEL_ANTI_RATE_MIX);
      const _lintelAntiLockK = 1 - Math.exp(-_lintelAntiLockRate * delta);
      lintelAntiPhaseRef.current += _lintelAntiPhaseDiff * _lintelAntiLockK;
    }
    const _lintelAntiMod = 1 + Math.sin(lintelAntiPhaseRef.current) * LINTEL_ANTI_DEPTH * camMotion;
    // P3 v127 — UNIFY #59: 7th structurally distinct meta-class on lintel
    // emissive. SECOND variable-offset axis at sliding-quadrature target
    // (camPhase + camMotion × π/2), distinct from v119's sliding-anti-phase
    // (camPhase + camMotion × π). Same wrap-around-safe shortest-path
    // idiom + exp-lerp pattern as v108/v119/v121. Grading-ladder constants
    // softer than v121: STRENGTH 0.3 < 0.4, DEPTH 0.1 < 0.2.
    const _lintelQuadLockStrength = camMotion * LINTEL_QUAD_LOCK_STRENGTH;
    if (_lintelQuadLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _lintelQuadTarget = camPhase + camMotion * (Math.PI / 2);
      const _lintelQuadRawDiff = _lintelQuadTarget - lintelQuadPhaseRef.current;
      const _lintelQuadPhaseDiff = ((_lintelQuadRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      // P3 v130 — UNIFY #62: cross-axis composition on v127 sliding-quadrature LOCK RATE.
      // Completes the cross-axis-on-rate ladder across all three lintel lock loops
      // (v120 in-phase, v124 anti-phase, v130 sliding-quadrature). Opens 8-META-CLASS
      // COMPOSITION in 1 cut from v129's 3-substrate landing — 4th consecutive 1-cut
      // depth open (v121, v124, v127, v130). Single-line edit mirrors v124's pattern.
      const _lintelQuadLockRate = LINTEL_QUAD_BASE_LERP * _lintelQuadLockStrength * (1 + camMotion * LINTEL_QUAD_RATE_MIX);
      const _lintelQuadLockK = 1 - Math.exp(-_lintelQuadLockRate * delta);
      lintelQuadPhaseRef.current += _lintelQuadPhaseDiff * _lintelQuadLockK;
    }
    const _lintelQuadMod = 1 + Math.sin(lintelQuadPhaseRef.current) * LINTEL_QUAD_DEPTH * camMotion;
    // P3 v133 — UNIFY #65: SUB-HARMONIC (OCTAVE) voice locked at (camPhase × 2)
    // mod 2π. First frequency-multiplied voice in the field — structurally
    // orthogonal to every prior phase-offset and lock-rate axis. Same wrap-
    // around-safe shortest-path + exp-lerp idiom as v108/v119/v121/v127.
    const _lintelOctaveLockStrength = camMotion * LINTEL_OCTAVE_LOCK_STRENGTH;
    if (_lintelOctaveLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _lintelOctaveTarget = ((camPhase * 2) % TWO_PI + TWO_PI) % TWO_PI;
      const _lintelOctaveRawDiff = _lintelOctaveTarget - lintelOctavePhaseRef.current;
      const _lintelOctavePhaseDiff = ((_lintelOctaveRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _lintelOctaveLockRate = LINTEL_OCTAVE_BASE_LERP * _lintelOctaveLockStrength;
      const _lintelOctaveLockK = 1 - Math.exp(-_lintelOctaveLockRate * delta);
      lintelOctavePhaseRef.current += _lintelOctavePhaseDiff * _lintelOctaveLockK;
    }
    const _lintelOctaveMod = 1 + Math.sin(lintelOctavePhaseRef.current) * LINTEL_OCTAVE_DEPTH * camMotion;
    // P3 v136 — UNIFY #68: 3RD-HARMONIC voice locked at (camPhase × 3) mod 2π.
    // Second rung on the harmonic-multiplication-ladder dimension opened at
    // v133 (octave camPhase × 2). Same wrap-around-safe shortest-path +
    // exp-lerp idiom as octave. Softer/faster overtone: DEPTH 0.04 < 0.05,
    // LOCK_STRENGTH 0.15 < 0.20 — halving pattern between rungs preserved.
    // Opens 10-META-CLASS COMPOSITION on lintel emissive: now carries 10
    // structurally distinct multiplicative voices in one uniform write.
    const _lintel3rdLockStrength = camMotion * LINTEL_3RD_LOCK_STRENGTH;
    if (_lintel3rdLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _lintel3rdTarget = ((camPhase * 3) % TWO_PI + TWO_PI) % TWO_PI;
      const _lintel3rdRawDiff = _lintel3rdTarget - lintel3rdPhaseRef.current;
      const _lintel3rdPhaseDiff = ((_lintel3rdRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _lintel3rdLockRate = LINTEL_3RD_BASE_LERP * _lintel3rdLockStrength;
      const _lintel3rdLockK = 1 - Math.exp(-_lintel3rdLockRate * delta);
      lintel3rdPhaseRef.current += _lintel3rdPhaseDiff * _lintel3rdLockK;
    }
    const _lintel3rdMod = 1 + Math.sin(lintel3rdPhaseRef.current) * LINTEL_3RD_DEPTH * camMotion;
    // P3 v139 — UNIFY #71: 4TH-HARMONIC voice locked at (camPhase × 4) mod 2π.
    // Third rung on the harmonic-multiplication-LADDER dimension (octave × 2 +
    // 3rd-harmonic × 3 + 4th-harmonic × 4). Same wrap-around-safe shortest-path
    // + exp-lerp idiom as v133/v136. Opens 11-META-CLASS COMPOSITION on lintel
    // emissive: now carries 11 structurally distinct multiplicative voices in
    // one uniform write. DEPTH 0.032, LOCK_STRENGTH 0.12 — field-coherent
    // halving extends to 7th rung.
    const _lintel4thLockStrength = camMotion * LINTEL_4TH_LOCK_STRENGTH;
    if (_lintel4thLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _lintel4thTarget = ((camPhase * 4) % TWO_PI + TWO_PI) % TWO_PI;
      const _lintel4thRawDiff = _lintel4thTarget - lintel4thPhaseRef.current;
      const _lintel4thPhaseDiff = ((_lintel4thRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _lintel4thLockRate = LINTEL_4TH_BASE_LERP * _lintel4thLockStrength;
      const _lintel4thLockK = 1 - Math.exp(-_lintel4thLockRate * delta);
      lintel4thPhaseRef.current += _lintel4thPhaseDiff * _lintel4thLockK;
    }
    const _lintel4thMod = 1 + Math.sin(lintel4thPhaseRef.current) * LINTEL_4TH_DEPTH * camMotion;
    // P3 v142 — UNIFY #74: 5th-harmonic phase voice on lintel emissive.
    // Fourth rung on the harmonic-multiplication-LADDER dimension (octave × 2
    // + 3rd-harmonic × 3 + 4th-harmonic × 4 + 5th-harmonic × 5). Same wrap-
    // around-safe shortest-path + exp-lerp idiom as v133/v136/v139. Opens
    // 12-META-CLASS COMPOSITION on lintel emissive: now carries 12 structurally
    // distinct multiplicative voices in one uniform write. DEPTH 0.025,
    // LOCK_STRENGTH 0.09 — field-coherent halving extends to 8th rung.
    const _lintel5thLockStrength = camMotion * LINTEL_5TH_LOCK_STRENGTH;
    if (_lintel5thLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _lintel5thTarget = ((camPhase * 5) % TWO_PI + TWO_PI) % TWO_PI;
      const _lintel5thRawDiff = _lintel5thTarget - lintel5thPhaseRef.current;
      const _lintel5thPhaseDiff = ((_lintel5thRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _lintel5thLockRate = LINTEL_5TH_BASE_LERP * _lintel5thLockStrength;
      const _lintel5thLockK = 1 - Math.exp(-_lintel5thLockRate * delta);
      lintel5thPhaseRef.current += _lintel5thPhaseDiff * _lintel5thLockK;
    }
    const _lintel5thMod = 1 + Math.sin(lintel5thPhaseRef.current) * LINTEL_5TH_DEPTH * camMotion;
    // P3 v145 — UNIFY #77: 6th-harmonic phase voice on lintel emissive.
    // Fifth rung on the harmonic-multiplication-LADDER dimension (octave × 2
    // + 3rd-harmonic × 3 + 4th-harmonic × 4 + 5th-harmonic × 5 + 6th-harmonic
    // × 6). Same wrap-around-safe shortest-path + exp-lerp idiom as
    // v133/v136/v139/v142. Opens 13-META-CLASS COMPOSITION on lintel emissive:
    // now carries 13 structurally distinct multiplicative voices in one
    // uniform write. DEPTH 0.020, LOCK_STRENGTH 0.07 — field-coherent halving
    // extends to 9th rung.
    const _lintel6thLockStrength = camMotion * LINTEL_6TH_LOCK_STRENGTH;
    if (_lintel6thLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _lintel6thTarget = ((camPhase * 6) % TWO_PI + TWO_PI) % TWO_PI;
      const _lintel6thRawDiff = _lintel6thTarget - lintel6thPhaseRef.current;
      const _lintel6thPhaseDiff = ((_lintel6thRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _lintel6thLockRate = LINTEL_6TH_BASE_LERP * _lintel6thLockStrength;
      const _lintel6thLockK = 1 - Math.exp(-_lintel6thLockRate * delta);
      lintel6thPhaseRef.current += _lintel6thPhaseDiff * _lintel6thLockK;
    }
    const _lintel6thMod = 1 + Math.sin(lintel6thPhaseRef.current) * LINTEL_6TH_DEPTH * camMotion;
    // P3 v148 — UNIFY #80: 7th-harmonic phase voice on lintel emissive. Opens
    // 14-META-CLASS COMPOSITION (lintel emissive now carries 14 structurally
    // distinct multiplicative voices in one uniform write). DEPTH 0.016,
    // LOCK_STRENGTH 0.055 — slightly-softer-than-exact-half discipline extends
    // to 10th rung. Opens DEPTH-6 on harmonic-multiplication-LADDER.
    const _lintel7thLockStrength = camMotion * LINTEL_7TH_LOCK_STRENGTH;
    if (_lintel7thLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _lintel7thTarget = ((camPhase * 7) % TWO_PI + TWO_PI) % TWO_PI;
      const _lintel7thRawDiff = _lintel7thTarget - lintel7thPhaseRef.current;
      const _lintel7thPhaseDiff = ((_lintel7thRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _lintel7thLockRate = LINTEL_7TH_BASE_LERP * _lintel7thLockStrength;
      const _lintel7thLockK = 1 - Math.exp(-_lintel7thLockRate * delta);
      lintel7thPhaseRef.current += _lintel7thPhaseDiff * _lintel7thLockK;
    }
    const _lintel7thMod = 1 + Math.sin(lintel7thPhaseRef.current) * LINTEL_7TH_DEPTH * camMotion;
    lintelBreathUniform.current.value = (1.0 + Math.sin(lintelBreathPhase.current) * lintelBreathAmp) * lintelCamBoost * _lintelVarMod * _lintelAntiMod * _lintelQuadMod * _lintelOctaveMod * _lintel3rdMod * _lintel4thMod * _lintel5thMod * _lintel6thMod * _lintel7thMod;
    // P3 v23 — doorway portal flare. Sin envelope over the pulse window adds
    // an additive lintel-emissive multiplier on top of breath, peaking at
    // pulse midpoint. Fires for both OUT and IN roles — both sides of the
    // threshold are part of the same portal moment, so both rooms' lintels
    // brighten in lockstep. P2 v49 makes flare peak per-room: privacy 2.0
    // (restrained legal-arrival), landing 3.6 baseline, congrats 6.0 explosive
    // REWARD portal-blaze, reset-password 4.5 sharp clinical.
    const FLARE_PEAK_FALLBACK = 3.6;
    const FLARE_PEAK = character.lintelFlarePeak ?? FLARE_PEAK_FALLBACK;
    lintelFlareUniform.current.value = inWindow ? Math.sin(normT * Math.PI) * FLARE_PEAK : 0;
    // P3 v21 — celebration emissive flare. celebAmp is the bell envelope already
    // accumulated from active celebrations matching this viewKey; pipe it
    // straight into the room-wide flash uniform. Active room flashes; far rooms
    // hold dark (celebAmp stays 0 because the loop above only sums impulses
    // where c.view === viewKey).
    celebFlashUniform.current.value = celebAmp;
    if (process.env.NODE_ENV !== "production") {
      const w = window as unknown as { __celebFlash?: Record<string, number> };
      if (!w.__celebFlash) w.__celebFlash = {};
      w.__celebFlash[viewKey] = celebAmp;
    }

    // P2 v80 — UNIFY #12: atmospheric particles drift toward camera during dolly.
    // Target offset = -cameraForward × camMotion × PARTICLE_DRIFT_AMP, lerped
    // at 0.06 each frame for smooth chase without snap. The group is parented
    // at room-center + offset; Sparkles renders relative to it. Result: dust
    // cloud slides backward in world space while camera flies forward, so the
    // dust visibly streams toward the camera face (and past it). Returns to
    // room center the moment dolly settles. Magnitude rides camMotion (the
    // shared scalar), direction rides cameraForward (the shared vec3) — same
    // dual-channel pattern as v77's drone (gain + pan).
    const PARTICLE_DRIFT_AMP = 0.55;
    const PARTICLE_DRIFT_LERP = 0.06;
    // P3 v225 — env-source SPATIAL axis to 2-substrate CATEGORY. v224 opened
    // the axis on directional light Y; v225 promotes it by adding a 2nd
    // substrate distinct from the lights class. AtmosphericParticles are the
    // natural pick: structurally different consumer (a particle field, not a
    // single light), already a 2-axis substrate via v80 directional drift +
    // v101 spawn-rate, and the cloud's vertical center is a clean SPATIAL
    // axis on a particle system. At night (dayWarmth=0) the cloud sits ~2
    // units LOW — reads as dust SETTLED at floor level; at peak afternoon
    // (dayWarmth=1) sits ~2 units HIGH — reads as motes RISING in sunbeams.
    // At dayWarmth=0.5 (sunrise/sunset midpoint) the bias is 0, identical to
    // pre-v225 behavior. Mirrors v224's vertical arc on lights — both the
    // KEY LIGHT and the AIR CLOUD now follow the sun: low at midnight, high
    // at noon. Two substrates, one chord. ±2 units (smaller than v224's ±5
    // light range) because particle drift already lives in [-1,+1] from v80/
    // v162, and ±2 keeps the wall-clock bias clearly dominant without
    // overwhelming the wayfinding/dolly biases.
    const PARTICLE_Y_BIAS_NIGHT = -2;
    const PARTICLE_Y_BIAS_DAY = 2;
    const dayParticleY = PARTICLE_Y_BIAS_NIGHT + (PARTICLE_Y_BIAS_DAY - PARTICLE_Y_BIAS_NIGHT) * _dayWarmth214;
    // v162 — WAYFINDING crosses into 4th substrate (atmosphere). Particles get
    // a constant additive bias toward the active room's open-doorway direction
    // so the dust cloud's center sits slightly offset toward each gap at rest.
    // Reads as "the air is pulled toward the exits." Active at rest (no
    // camMotion gate) matches v158/v160/v161 wayfinding semantics; the cloud's
    // home position now telegraphs travel direction before any dolly fires.
    // Promotes wayfinding to a 4-substrate breadth: cosmos shell + floor +
    // wall accents + atmospheric particles.
    const PARTICLE_DOORWAY_LANE_AMP = 0.85;
    const fwdParticle = getCameraForward();
    const pdTargetX = -fwdParticle.x * camMotion * PARTICLE_DRIFT_AMP + COSMOS_DOORWAY_DIR[0] * PARTICLE_DOORWAY_LANE_AMP;
    const pdTargetY = -fwdParticle.y * camMotion * PARTICLE_DRIFT_AMP + COSMOS_DOORWAY_DIR[1] * PARTICLE_DOORWAY_LANE_AMP;
    const pdTargetZ = -fwdParticle.z * camMotion * PARTICLE_DRIFT_AMP + COSMOS_DOORWAY_DIR[2] * PARTICLE_DOORWAY_LANE_AMP;
    particleDriftCurr.current.x += (pdTargetX - particleDriftCurr.current.x) * PARTICLE_DRIFT_LERP;
    particleDriftCurr.current.y += (pdTargetY - particleDriftCurr.current.y) * PARTICLE_DRIFT_LERP;
    particleDriftCurr.current.z += (pdTargetZ - particleDriftCurr.current.z) * PARTICLE_DRIFT_LERP;
    if (particleGroupRef.current) {
      particleGroupRef.current.position.set(
        cx + particleDriftCurr.current.x,
        cy + particleDriftCurr.current.y + dayParticleY,
        cz + particleDriftCurr.current.z,
      );
    }

    // v169 — per-frame light intensity boost when camera-forward aligns with
    // COSMOS_DOORWAY_DIR. Reuses fwdParticle (already getCameraForward() above).
    // Normalize the forward vector, dot against doorway-direction, clamp ≥0,
    // multiply by LIGHT_DOORWAY_INTENSITY_MIX and add to per-room baselines.
    {
      const _fLen = Math.sqrt(fwdParticle.x * fwdParticle.x + fwdParticle.y * fwdParticle.y + fwdParticle.z * fwdParticle.z);
      let _lightAlign = 0;
      if (_fLen > 1e-4) {
        const _fnx = fwdParticle.x / _fLen;
        const _fny = fwdParticle.y / _fLen;
        const _fnz = fwdParticle.z / _fLen;
        const _dot =
          _fnx * COSMOS_DOORWAY_DIR[0] +
          _fny * COSMOS_DOORWAY_DIR[1] +
          _fnz * COSMOS_DOORWAY_DIR[2];
        _lightAlign = _dot > 0 ? _dot : 0;
      }
      const _boost = 1 + _lightAlign * LIGHT_DOORWAY_INTENSITY_MIX;
      if (warmLightRef.current) {
        warmLightRef.current.intensity = 1.6 * warmIntensity * _boost;
      }
      if (coolLightRef.current) {
        coolLightRef.current.intensity = 0.9 * coolIntensity * _boost;
      }
    }
    if (process.env.NODE_ENV !== "production") {
      type WindowWithParticles = Window & {
        __particles?: Record<string, { drift: [number, number, number]; camMotion: number; fwd: [number, number, number] }>;
      };
      const w2 = window as unknown as WindowWithParticles;
      if (!w2.__particles) w2.__particles = {};
      w2.__particles[viewKey] = {
        drift: [particleDriftCurr.current.x, particleDriftCurr.current.y, particleDriftCurr.current.z],
        camMotion,
        fwd: [fwdParticle.x, fwdParticle.y, fwdParticle.z],
      };
    }

    // P3 v101 — UNIFY #33: atmospheric-particle spawn-rate (Sparkles speed
    // uniform) rises with cameraMotion. 4th temporal-frequency consumer on a
    // 4th substrate, closing frequency to match color's 4-substrate reach.
    // Direct uniform-mutation idiom — same as v95/v96/v97 (AudioParam.value,
    // phase accumulators). Reads as "the air thickens with motion": the dust
    // cloud's internal animation rate accelerates during dolly, then settles.
    if (sparklesRef.current) {
      const mat = sparklesRef.current.material as THREE.ShaderMaterial;
      if (mat?.uniforms?.speed) {
        // P3 v111 — UNIFY #43: anti-phase coupling. particlePhase pulls toward
        // (cameraBreathPhase + π) so under motion particles DESYNC from the
        // visible/audible breath rhythm. Wrap-around-safe shortest-path lerp
        // identical to v108/v109/v110, just targeting the opposite phase.
        const _camPhasePart = getCameraBreathPhase();
        const _antiLockStrength = camMotion * HARMONIC_ANTI_LOCK_STRENGTH;
        if (_antiLockStrength > 1e-4) {
          const TWO_PI = Math.PI * 2;
          const targetPhase = _camPhasePart + Math.PI;
          const _antiRawDiff = targetPhase - particlePhaseRef.current;
          const _antiPhaseDiff = ((_antiRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
          const _antiLockRate = HARMONIC_ANTI_BASE_LERP * _antiLockStrength;
          const _antiLockK = 1 - Math.exp(-_antiLockRate * delta);
          particlePhaseRef.current += _antiPhaseDiff * _antiLockK;
        }
        const antiMod = 1 + Math.sin(particlePhaseRef.current) * HARMONIC_ANTI_DEPTH * camMotion;
        mat.uniforms.speed.value =
          character.atmosphereSpeed * (1 + camMotion * PARTICLE_FREQ_MIX) * antiMod;
      }
    }

    // P3 v16 — page-load entry assembly progress (one-shot, mount-relative).
    // Past full duration → entryActive false → zero overhead per tile.
    const entryRaw = wallNow - mountTime.current;
    const entryActive = entryRaw < ENTRY_DURATION + 0.6;  // +0.6s for max stagger tail
    const entryRoot = entryActive ? Math.min(1, entryRaw / ENTRY_DURATION) : 1;

    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      const driftT = now * driftFreq + t.driftSeed;
      const onFace = targetFace !== null && t.wall === targetFace && inWindow;

      // Per-tile staggered progress within the window. tProg=0 → at home, 1 → fully dispersed.
      let tProg = 0;
      if (onFace) {
        const denom = 1 - t.delayN || 1;
        const localT = (normT - t.delayN) / denom;
        const stepped = localT < 0 ? 0 : localT > 1 ? 1 : localT;
        // ease-out cubic for snappy departure / soft arrival
        const eased = 1 - (1 - stepped) * (1 - stepped) * (1 - stepped);
        // For IN, the tile is displaced at start and settles home → invert.
        tProg = role === "in" ? 1 - eased : eased;
      }

      // Displacement = outward + tangent scatter + (OUT only) gravity drop.
      const tileSign: 1 | -1 = t.signBias < ROLE_PRIMARY_RATIO ? primarySign : secondarySign;
      // P3 v12 — radial amplitude falloff. Tiles near the doorway opening pulse
      // harder so the wall shatter visually emanates from the gap instead of
      // cracking uniformly. Baseline 1.0 is preserved (never simplify the
      // shatter back to a slab); add up to +0.55 normal / +1.1 tangent for
      // tiles right on the opening edge → corner tiles still pulse fully,
      // doorway-adjacent tiles burst with a doubled tangent spray.
      const radialNormalBoost = 1.0 + 0.55 * t.openingProximity;
      const radialTangentBoost = 1.0 + 1.1 * t.openingProximity;
      const dirAmp = NORMAL_AMP * tileSign * radialNormalBoost;
      const tanAmp = TANGENT_AMP * radialTangentBoost;
      const fxOut = t.ox * dirAmp * tProg;
      const fyOut = t.oy * dirAmp * tProg;
      const fzOut = t.oz * dirAmp * tProg;
      const fxTan = t.tx * tanAmp * tProg;
      const fyTan = t.ty * tanAmp * tProg;
      const fzTan = t.tz * tanAmp * tProg;
      // P2 v70 + v155 — UNIFY #2: pieces head toward SPECIFIC cosmos slabs.
      // v70 aimed at a generic radial direction from room center — wall pieces
      // splashed outward into empty space. v155 resolves each wall tile to a
      // specific cosmos slab (cosmosTargetFor(i, character.tileSize, ...))
      // and routes the pull toward THAT slab's world position. Walls and
      // cosmos are now a SHARED reservoir: each wall piece has a designated
      // landing spot on the cosmos shell, and the pulse-out beat shows the
      // wall draining into that distant tile field. tProg² ramp preserved so
      // the local-normal shatter dominates early; cosmos-target pull dominates
      // late. tileSign retained so the secondary half of tiles still streams
      // INWARD past the slab (preserves dual-direction explosion).
      let fxCosmos = 0, fyCosmos = 0, fzCosmos = 0;
      if (onFace && tProg > 1e-4) {
        cosmosTargetFor(i, character.tileSize, cosmosTargetVec);
        const rdxP = cosmosTargetVec.x - t.px;
        const rdyP = cosmosTargetVec.y - t.py;
        const rdzP = cosmosTargetVec.z - t.pz;
        const r2P = rdxP * rdxP + rdyP * rdyP + rdzP * rdzP;
        if (r2P > 1e-6) {
          const invP = 1 / Math.sqrt(r2P);
          const cosmosAmp = COSMOS_PULSE_REACH * tileSign * tProg * tProg;
          fxCosmos = rdxP * invP * cosmosAmp;
          fyCosmos = rdyP * invP * cosmosAmp;
          fzCosmos = rdzP * invP * cosmosAmp;
        }
        // v157 — cosmos-side reaction. Stamp this wall tile's tProg² into its
        // assigned destination slab's activation channel. TileVoid.tsx reads
        // the same Float32Array per frame and ramps that slab's emissive +
        // per-instance scale. max-write so the strongest in-flight piece
        // wins; decay in TileVoid fades it back after the pulse passes.
        const actIdx = i % COSMOS_ACTIVATION.length;
        const actVal = tProg * tProg;
        if (actVal > COSMOS_ACTIVATION[actIdx]) {
          COSMOS_ACTIVATION[actIdx] = actVal;
        }
      }
      // P3 v22 — doorway parting. For lintel tiles on the connection face, add
      // an in-wall-plane displacement aimed *away from the opening center*.
      // OUT (role="out", camera leaving): tProg ramps 0→1 → lintel parts
      // outward → gap visibly widens as the camera approaches the doorway.
      // IN (role="in", camera arriving): tProg ramps 1→0 (already inverted
      // above) → lintel starts spread, seals shut as the new room settles
      // around the camera. Scaled by openingProximity so the jamb-edge tiles
      // part dramatically while outer ring barely shifts. Composes additively
      // with outward + tangent so v12's radial-from-gap energy is preserved
      // alongside the new "wall opens" beat.
      // v202 — VISION cut: extended parting to ALL tiles on the opening face
      // (not just lintels). Lintels still get linear openingProximity scaling
      // (preserves v22 jamb-edge behavior); non-lintels get openingProximity²
      // — sharp quadratic falloff so the parting force ripples outward from
      // the gap and falls off fast. Effect: full wall reads as RIPPLING OPEN
      // from the doorway center outward, individual pieces tumbling away
      // through the gap, instead of "lintels part while uniform field
      // disperses." Matches VISION literal "walls open up by individual
      // pieces falling out and moving through gaps."
      // v204 — VISION-PIVOT #3. ENTRY-ASSEMBLY FUNNELING. For role="in" the
      // parting force is INVERTED (multiplied by -1) so opening-face tiles
      // start displaced TOWARD the doorway center (overlapping the gap zone
      // the camera just dollied through) and FUNNEL OUTWARD to their wall
      // slots as tProg decays. Reads as the new room ASSEMBLING from the gap
      // outward — tiles flying in through the doorway behind the camera and
      // settling into the wall. v202 OUT (camera leaving) direction
      // unchanged: tiles disperse outward away from doorway as gap widens.
      // v204 IN (camera arriving) direction: tiles converge into doorway
      // first and ripple outward to wall positions. Closes the third leg
      // of the transition trilogy: exit-disassemble (v202) + dolly-through
      // (v203) + entry-assemble (v204). All three on the same opening-face
      // ripple field, all three vanish at rest.
      let fxDoor = 0, fyDoor = 0, fzDoor = 0;
      if (onFace && t.openingProximity > 0) {
        const opFactor = t.isLintel
          ? t.openingProximity
          : t.openingProximity * t.openingProximity;
        const dirSign = role === "in" ? -1 : 1;
        const partAmp = DOORWAY_PART_AMP * opFactor * tProg * dirSign;
        fxDoor = t.dwx * partAmp;
        fyDoor = t.dwy * partAmp;
        fzDoor = t.dwz * partAmp;
      }
      // P2 v78 — UNIFY #10: camera-forward bias on the shedding piece.
      // Layered on top of NORMAL + TANGENT + COSMOS + DOOR. Silent at rest
      // (FORWARD_AMP carries camMotion factor); active only during dolly.
      // tileSign carries OUT/IN dominant-flow semantics so the bias points
      // along +forward for outgoing pieces and along -forward for arriving
      // pieces (they start displaced backward & arc forward into the wall).
      let fxFwd = 0, fyFwd = 0, fzFwd = 0;
      if (onFace && FORWARD_AMP > 1e-5) {
        const fwdContrib = FORWARD_AMP * tileSign * tProg;
        fxFwd = camFwdVec.x * fwdContrib;
        fyFwd = camFwdVec.y * fwdContrib;
        fzFwd = camFwdVec.z * fwdContrib;
      }
      // P3 v11 — face-aligned gravity. The only vertical opening in the graph
      // is landing↔congrats (top/bottom). On OUT through the top face the
      // camera is rising; pulling tiles back down with -y fights the narrative.
      // Flip gravity to follow the outward normal on top-face OUT so pieces
      // accelerate UP ahead of the camera. Bottom face and horizontal walls
      // keep -y as ordinary physics.
      const gravSign = role === "out" && targetFace === "top" ? 1 : -1;
      const grav = role === "out" ? gravSign * GRAVITY_AMP * tProg * tProg : 0;

      // Sum bump contributions for this tile (skip if no live bumps).
      let bumpDx = 0, bumpDy = 0, bumpDz = 0;
      if (liveBumps.length > 0) {
        for (let bi = 0; bi < liveBumps.length; bi++) {
          const b = liveBumps[bi];
          const t0 = wallNow - b.fireTime;
          if (t0 < 0 || t0 > BUMP_LIFETIME) continue;
          const ddx = t.px - b.origin[0];
          const ddy = t.py - b.origin[1];
          const ddz = t.pz - b.origin[2];
          const distSq = ddx * ddx + ddy * ddy + ddz * ddz;
          if (distSq > BUMP_RADIUS * BUMP_RADIUS) continue;
          const dist = Math.sqrt(distSq) || 1;
          const falloff = 1 - dist / BUMP_RADIUS; // 1 at origin → 0 at radius
          const tNorm = t0 / BUMP_LIFETIME;
          const env = tNorm < BUMP_PEAK_NORM
            ? tNorm / BUMP_PEAK_NORM
            : 1 - (tNorm - BUMP_PEAK_NORM) / (1 - BUMP_PEAK_NORM);
          const amp = falloff * env * BUMP_AMP * b.intensity;
          // Direction = outward from bump origin (radial).
          bumpDx += (ddx / dist) * amp;
          bumpDy += (ddy / dist) * amp;
          bumpDz += (ddz / dist) * amp;
        }
      }

      // P3 v15 — hover pull. Compute once per tile, additive with everything else.
      // P3 v86 — UNIFY #18: NEGATIVE COUPLING. HOVER_AMP yields to cameraMotion
      // via cursorYield = 1 - camMotion × CURSOR_YIELD_MIX (0.85). At rest the
      // magnet pulls at its authored per-room amplitude (cursorYield = 1.0);
      // at peak dolly the magnet pull drops to 15% (cursorYield = 0.15). Paired
      // with CameraRig v86's parallax amplitude yield, this is the first cut
      // where cursor authority EXPLICITLY DIMINISHES as cameraMotion rises —
      // every prior UNIFY cut (#1–#17) coupled positively. The motion field
      // is now dominant: more dolly motion → less user cursor authority.
      let hoverDx = 0, hoverDy = 0, hoverDz = 0;
      if (applyHover) {
        const cdx = cursorInfo.pos[0] - t.px;
        const cdy = cursorInfo.pos[1] - t.py;
        const cdz = cursorInfo.pos[2] - t.pz;
        const cDistSq = cdx * cdx + cdy * cdy + cdz * cdz;
        if (cDistSq < HOVER_RADIUS * HOVER_RADIUS && cDistSq > 1e-6) {
          const cDist = Math.sqrt(cDistSq);
          const falloff = 1 - cDist / HOVER_RADIUS; // 1 at cursor → 0 at radius
          // Smoothstep-ish ease so the magnet has a softer outer edge.
          const eased = falloff * falloff;
          const cursorYield = 1 - camMotion * 0.85; // CURSOR_YIELD_MIX — matches CameraRig v86
          const k = (HOVER_AMP * eased * cursorYield) / cDist;
          hoverDx = cdx * k;
          hoverDy = cdy * k;
          hoverDz = cdz * k;
        }
      }

      // P3 v16 — entry assembly. Per-tile staggered ease-out from a displaced
      // start back home. Stagger derived from driftSeed so it varies smoothly
      // across the wall — adjacent tiles arrive within milliseconds of each
      // other (organic ripple) instead of all-at-once. eRem ramps 1 → 0 over
      // the window, so the displacement *decays* (start displaced, end at home).
      //
      // P2 v69 + v156 — UNIFY #1 CLOSES THE LOOP: entry direction targets the
      // assigned cosmos slab. v69 set the direction to RADIAL from room center
      // (generic outward). v155 routed pulse-OUT to specific cosmos slab
      // targets via cosmosTargetFor(). v156 mirrors v155 on entry: each tile
      // enters FROM the direction of its assigned cosmos slab. Pieces now
      // leave to AND arrive from the same named cosmos tile — wall↔cosmos
      // becomes a bidirectional positional contract, not a generic outward
      // swarm. Visible: room entry now reads as a swarm of pieces fanning in
      // from specific scattered points on the cosmos shell, not a uniform
      // radial squeeze toward home.
      let entryDx = 0, entryDy = 0, entryDz = 0;
      let entryRot = 0;
      if (entryActive) {
        const stagger = (t.driftSeed % 1) * 0.4; // 0..0.4 of normalized window
        const local = (entryRoot - stagger) / (1 - stagger);
        const stepped = local < 0 ? 0 : local > 1 ? 1 : local;
        // ease-out cubic so tiles fly fast at start and settle softly into home.
        const eased = 1 - (1 - stepped) * (1 - stepped) * (1 - stepped);
        const eRem = 1 - eased;
        if (eRem > 1e-4) {
          // v156 — direction FROM tile home TO assigned cosmos slab.
          // At eRem=1 the tile sits at home + direction × radial (i.e., along
          // the line toward its slab, not necessarily AT the slab since the
          // amplitude is the per-room ENTRY_NORMAL_AMP × COSMOS_REACH).
          // At eRem=0 the tile settles at home. Visually the entry tracks the
          // outgoing-pulse trajectory in reverse: each piece's home↔slab line
          // is its assembly path.
          cosmosTargetFor(i, character.tileSize, cosmosTargetVec);
          const rdx = cosmosTargetVec.x - t.px;
          const rdy = cosmosTargetVec.y - t.py;
          const rdz = cosmosTargetVec.z - t.pz;
          const r2 = rdx * rdx + rdy * rdy + rdz * rdz;
          // Falls back to local normal if slab coincides with home (rare).
          let nx = t.ox, ny = t.oy, nz = t.oz;
          if (r2 > 1e-6) {
            const inv = 1 / Math.sqrt(r2);
            nx = rdx * inv; ny = rdy * inv; nz = rdz * inv;
          }
          const radial = ENTRY_NORMAL_AMP * COSMOS_REACH;
          entryDx = (nx * radial + t.tx * ENTRY_TANGENT_AMP) * eRem;
          entryDy = (ny * radial + t.ty * ENTRY_TANGENT_AMP) * eRem;
          entryDz = (nz * radial + t.tz * ENTRY_TANGENT_AMP) * eRem;
          entryRot = ENTRY_SPIN_AMP * eRem;
        }
      }

      // P3 v18 — celebration radial burst + lift. Direction is per-tile
      // (tile→room-center normalized = outward radial in room-local frame).
      // Composes additively with everything else; only fires for the active
      // viewKey (gated above).
      let celebDx = 0, celebDy = 0, celebDz = 0;
      if (celebActive) {
        const rdx = t.px - cx;
        const rdy = t.py - cy;
        const rdz = t.pz - cz;
        const rd2 = rdx * rdx + rdy * rdy + rdz * rdz;
        if (rd2 > 1e-6) {
          const rd = Math.sqrt(rd2);
          const inv = 1 / rd;
          celebDx = rdx * inv * celebAmp * CELEB_RADIAL_AMP;
          celebDy = rdy * inv * celebAmp * CELEB_RADIAL_AMP + celebAmp * CELEB_UP_AMP;
          celebDz = rdz * inv * celebAmp * CELEB_RADIAL_AMP;
        }
      }

      // P3 v25 — generation wave. Per-tile distance from room center sets the
      // phase, so the sin wave at any moment is a series of concentric shells
      // expanding outward across the tile field. Applied along the tile's
      // outward normal so the wave reads as the wall *breathing* rather than
      // tiles sliding sideways — composes cleanly with depth offset (v17).
      let genDx = 0, genDy = 0, genDz = 0;
      if (applyGenWave) {
        const gdx = t.px - cx;
        const gdy = t.py - cy;
        const gdz = t.pz - cz;
        const gDist = Math.sqrt(gdx * gdx + gdy * gdy + gdz * gdz);
        const phase = genElapsed * GEN_WAVE_SPEED - gDist * GEN_WAVE_LENGTH;
        const wave = Math.sin(phase) * GEN_WAVE_AMP * genFade;
        genDx = t.ox * wave;
        genDy = t.oy * wave;
        genDz = t.oz * wave;
      }

      // P3 v19 — floor-tile-only upward push under the camera. Smoothstep-ish
      // falloff (squared) so the ripple has a soft edge. Sums into dy only.
      // P2 v83 UNIFY #15 — add directional traveling wave term using same
      // falloff envelope but with phase = dot(tileXZ−camXZ, fwdXZ) × waveK
      // − now × waveSpeed, so the wave appears to travel in cameraForward's
      // XZ direction during dolly. Amplitude rides cameraMotion (silent at
      // rest); composes additively with the radial breath term.
      let floorDy = 0;
      if (applyFloorRipple && t.wall === "bottom") {
        const fdx = t.px - camX;
        const fdz = t.pz - camZ;
        const fDistSq = fdx * fdx + fdz * fdz;
        if (fDistSq < FLOOR_RIPPLE_RADIUS * FLOOR_RIPPLE_RADIUS) {
          const fDist = Math.sqrt(fDistSq);
          const falloff = 1 - fDist / FLOOR_RIPPLE_RADIUS;
          floorDy = falloff * falloff * FLOOR_RIPPLE_AMP;
          if (floorWaveAmp > 1e-5) {
            const floorDirPhase = (fdx * fwdFloorX + fdz * fwdFloorZ) * floorWaveK - floorWavePhase;
            floorDy += falloff * Math.sin(floorDirPhase) * floorWaveAmp;
          }
          // v160 — doorway-lane wayfinding push. Floor tile alignment with the
          // active room's doorway XZ direction (read from camera position).
          // Active at rest (no camMotion gate): wayfinding pre-visualization.
          if (floorDoorwayLaneActive && fDist > 1e-3) {
            const _doorAlign = (fdx * doorwayFloorX + fdz * doorwayFloorZ) / fDist;
            if (_doorAlign > 0) {
              floorDy += falloff * falloff * Math.pow(_doorAlign, FLOOR_DOORWAY_LANE_POWER) * FLOOR_DOORWAY_LANE_AMP;
            }
          }
        }
      }

      // v233 — Ambient persistent shed. Vertical-wall tiles only (floor/ceiling
      // keep their existing floor-ripple language); suppressed on the active
      // pulse face so the explicit transition shatter (tProg) takes priority.
      // Sharp gate (sin^8 above threshold) so most tiles rest most of the time
      // and only a small fraction spike outward through their normal at once.
      let shedDx = 0, shedDy = 0, shedDz = 0;
      const isVerticalWall =
        t.wall === "north" || t.wall === "south" || t.wall === "east" || t.wall === "west";
      if (isVerticalWall && tProg < 0.05) {
        const shedPhase = now * SHED_FREQ + t.driftSeed * 17.31;
        const shedRaw = Math.sin(shedPhase);
        if (shedRaw > 0.55) {
          const shedGate = Math.pow(shedRaw, SHED_GATE_POWER);
          const doorBoost = 1 + t.openingProximity * t.openingProximity * SHED_DOORWAY_BIAS;
          const shedNormAmp = shedGate * SHED_AMP * doorBoost;
          const shedTanAmp = shedGate * SHED_TANGENT_AMP * doorBoost;
          shedDx = t.ox * shedNormAmp + t.tx * shedTanAmp;
          shedDy = t.oy * shedNormAmp + t.ty * shedTanAmp;
          shedDz = t.oz * shedNormAmp + t.tz * shedTanAmp;
        }
      }

      const dx = Math.sin(driftT) * driftAmp + fxOut + fxTan + fxDoor + fxCosmos + fxFwd + bumpDx + hoverDx + entryDx + celebDx + genDx + shedDx;
      const dy = Math.cos(driftT * 0.85) * driftAmp + fyOut + fyTan + fyDoor + fyCosmos + fyFwd + grav + bumpDy + hoverDy + entryDy + celebDy + floorDy + genDy + shedDy;
      const dz = Math.sin(driftT * 0.7) * driftAmp * 0.6 + fzOut + fzTan + fzDoor + fzCosmos + fzFwd + bumpDz + hoverDz + entryDz + celebDz + genDz + shedDz;

      // P3 v17 — relief depth: tile home is offset along outward normal.
      // Pulse displacements (entry/bump/hover/drift) compose on top of the
      // offset home, so the wall keeps its cut-stone profile during shake too.
      dummy.position.set(
        t.px + t.ox * t.depthOffset + dx,
        t.py + t.oy * t.depthOffset + dy,
        t.pz + t.oz * t.depthOffset + dz,
      );

      // Rotation: base wall orientation × per-tile tumble axis-angle. Pulse
      // tProg drives the transition tumble; entry assembly contributes its own
      // resolving rotation on first mount. Both compose by summing radians on
      // the same spin axis (cheap and visually correct since they overlap rarely).
      // P3 v35 — pulseSpin multiplier per-room: privacy/terms stiff (0.5),
      // celebration confetti chaos (1.5). Only the *transition tumble* term is
      // multiplied; entry-assembly + celebration spins keep their own character
      // because those are state-change events orthogonal to room mood.
      const totalSpin = t.spinAmount * tProg * character.pulseSpin + entryRot + celebSpin;
      if (totalSpin > 1e-4) {
        baseEuler.set(t.rx, t.ry, t.rz);
        baseQuat.setFromEuler(baseEuler);
        spinAxis.set(t.spinX, t.spinY, t.spinZ);
        spinQuat.setFromAxisAngle(spinAxis, totalSpin);
        dummy.quaternion.copy(spinQuat).multiply(baseQuat);
      } else {
        dummy.rotation.set(t.rx, t.ry, t.rz);
      }
      dummy.scale.set(t.sx, t.sy, t.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, tiles.length]}
        frustumCulled={false}
        castShadow={false}
        receiveShadow={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          roughness={tileRoughness}
          metalness={tileMetalness}
          onBeforeCompile={handleBeforeCompile}
          // Force unique program cache key so HMR-recompiled callbacks pick up
          // (otherwise three.js memoizes onBeforeCompile output by source hash).
          customProgramCacheKey={() => "room-emissive-v5"}
        />
      </instancedMesh>

      {/* v234 — octagonal chamfer panels at the 4 vertical corners. Replaces
          each room's 4 hard right-angle corners with 4 slanted tile-mosaic
          facets (NE/NW/SE/SW), turning every cube room into an 8-faceted
          polyhedral chamber (Tom 2026-05-13). */}
      <CornerBevels viewKey={viewKey} />

      {/* per-room warm key + cool fill — character-driven mood (VISION Phase 5) */}
      {/* Position offsets are room-relative so the lighting fixture follows the room's emotional shape */}
      <pointLight
        ref={warmLightRef}
        position={[cx + warmOffset[0], cy + warmOffset[1], cz + warmOffset[2]]}
        intensity={1.6 * warmIntensity}
        color={warmColor}
        distance={14}
        decay={1.2}
      />
      <pointLight
        ref={coolLightRef}
        position={[cx + coolOffset[0], cy + coolOffset[1], cz + coolOffset[2]]}
        intensity={0.9 * coolIntensity}
        color={coolColor}
        distance={11}
        decay={1.3}
      />

      {/* P3 v30 — atmospheric particles per room. Per VISION ("atmosphere" +
          success criterion "every frame shows depth — tiles, atmosphere,
          parallax"), the volume between camera and walls was empty air. Each
          room now carries characterized motes: clear cool void in calendar,
          smoky ember haze in goals, thick midday haze in day, celebratory
          sparks in congrats, gentle drift elsewhere. Scale matches room size
          so particles fill the whole volume; size + count + speed + color
          encode mood. */}
      <group ref={particleGroupRef} position={[cx, cy, cz]}>
        <Sparkles
          ref={sparklesRef}
          scale={layout.size as [number, number, number]}
          count={character.atmosphereCount}
          speed={character.atmosphereSpeed}
          size={character.atmosphereSize}
          color={atmosphereColor}
          opacity={0.55}
          noise={0.6}
        />
      </group>
    </group>
  );
}
