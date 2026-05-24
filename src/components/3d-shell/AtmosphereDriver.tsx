"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { getCameraMotion, getCharacterFor, useRoomView } from "./RoomRegistry";
import { getDayWarmth } from "./timeOfDayIntent";

const FOG_LERP = 1.6;
// P3 v84 — UNIFY #16: fog color warms with cameraMotion (first cut on COLOR axis).
// 15 prior UNIFY cuts modulated geometry / brightness / motion / audio. None had
// touched HUE. v84 lerps the per-room fogColor toward a shared warm amber anchor
// as the camera dollies — every room warms toward the SAME anchor when in motion,
// which is exactly the unifying metaphor. FOG_WARMTH_MIX caps the pull at 45% so
// each room's palette identity survives even at full dolly: the warmth is
// unmistakable but the room still reads as itself. First cut on the color/hue
// dimension of the unified motion field — viscerally reads as "the air warms
// when you move."
const FOG_WARMTH_MIX = 0.45;
const FOG_WARM_ANCHOR = new THREE.Color("#ff9966");
// P3 v212 — ENVIRONMENTAL signal source extends to 2nd substrate. v211 wired
// the wall-clock into the cosmos color anchor; v212 wires the SAME clock into
// the room's fog+bg color anchor. Hex anchors deliberately match v211 cosmos
// (#4a4868 / #c89072) so the void hue AND the room air encode time-of-day
// against THE SAME day/night colors — promotes environmental source from a
// one-off to a 2-substrate category covering both depth layers (cosmos
// behind the room, fog inside the room) on the color axis. Pull strength
// 0.12 mirrors v211 cosmos so the lerps are cross-substrate symmetric. The
// time-of-day lerp runs BEFORE the v84 cameraMotion warm pull, so at-rest
// the room air reads as time-of-day tinted and full dolly overlays the
// warm shift on top.
const ATMOSPHERE_DAY_WARM = new THREE.Color("#c89072");
const ATMOSPHERE_NIGHT_COOL = new THREE.Color("#4a4868");
const ATMOSPHERE_TIME_OF_DAY_MIX = 0.12;
// P3 v215 — ENVIRONMENTAL source opens its 2ND AXIS (atmospheric reach /
// intensity) on top of v211/v212/v213/v214's 4-substrate color saturation.
// Atmosphere becomes the first substrate hosting env-source on TWO distinct
// axes: color via v212 + reach via v215. Scales the per-room fog.far baseline
// multiplicatively by a wall-clock factor: at deep night the room reads
// PALPABLY thicker (0.85× reach), at peak afternoon it reads PALPABLY airier
// (1.15× reach). ±15% chosen to be unmistakable but to preserve per-room
// palette identity — peach (privacy room) at 03:00 still reads as peach, just
// fog-compressed; the 1.4× camMotion v73 dolly boost still dominates transit.
// Compounds multiplicatively with the camFarBoost so the four atmospheric
// effects (per-room baseline × env-source reach × motion reach × per-frame
// lerp) all stack into one coherent fog.far value. Symmetry note: v211 made
// cosmos the first substrate hosting 2 distinct color cuts driven by 2
// distinct sources (motion + env); v215 makes atmosphere the first substrate
// hosting 2 distinct AXES driven by 1 source (env on color + reach) — the
// orthogonal cell to v211. Together they prove env-source can do depth-on-
// substrate (v215) AND breadth-across-substrates (v211–v214).
const ATMOSPHERE_FAR_NIGHT_SCALE = 0.85;
const ATMOSPHERE_FAR_DAY_SCALE = 1.15;

/**
 * Per-room atmospheric fog. Each view's character carries a fogColor + fogNear + fogFar;
 * this driver owns a single THREE.Fog instance attached to the scene and lerps its
 * properties per frame as the active view changes. Hand-rolling the lerp instead of
 * remounting a <fog> element avoids a one-frame flicker on transitions and lets
 * neighboring rooms blend their atmosphere as the camera passes between them.
 *
 * VISION.md Phase 5 — "fog in the day room" — mood-as-function. Day room reads as
 * thick midday haze; calendar reads as a clear cool void; congrats reads as a
 * celebratory rose glow.
 */
export function AtmosphereDriver() {
  const view = useRoomView();
  const { scene } = useThree();

  const targetColor = useMemo(() => new THREE.Color(), []);
  // v212 — scratch color for wall-clock day/night lerp on fog+bg. Pre-allocated
  // so the per-frame anchor blend allocates zero.
  const dayAnchorScratch = useMemo(() => new THREE.Color(), []);
  const fog = useMemo(() => {
    const initial = getCharacterFor("landing");
    return new THREE.Fog(initial.fogColor, initial.fogNear, initial.fogFar);
  }, []);
  const bgColor = useMemo(() => {
    const initial = getCharacterFor("landing");
    return new THREE.Color(initial.fogColor);
  }, []);

  useEffect(() => {
    scene.fog = fog;
    // P2 v68 — scene background lerps with fog. Pre-v68 PersistentCanvas
    // had a literal <color attach="background" args={["#000000"]} /> — the
    // VISION-forbidden flat backdrop. Replaced by atmosphere-driven bg so
    // the deepest-layer color is always the active room's fogColor (never a
    // raw black), while TileVoid renders distant tile-points in front of it.
    scene.background = bgColor;
    return () => {
      if (scene.fog === fog) scene.fog = null;
      if (scene.background === bgColor) scene.background = null;
    };
  }, [scene, fog, bgColor]);

  useFrame((state, delta) => {
    const c = getCharacterFor(view);
    const camMotion = getCameraMotion();
    targetColor.set(c.fogColor);
    // P3 v212 — environmental source: wall-clock hue on fog+bg. Same anchor
    // pair as v211 cosmos so room air and void hue lerp toward THE SAME
    // day/night palette. Runs BEFORE the v84 cameraMotion warm pull, so
    // motion's #ff9966 amber overlays on top of the time-of-day base hue.
    const dayWarmth = getDayWarmth();
    dayAnchorScratch.copy(ATMOSPHERE_NIGHT_COOL).lerp(ATMOSPHERE_DAY_WARM, dayWarmth);
    targetColor.lerp(dayAnchorScratch, ATMOSPHERE_TIME_OF_DAY_MIX);
    // UNIFY #16 — warm-anchor lerp BEFORE the per-frame lerp into fog.color so
    // both fog AND scene background follow the same warmed target. At rest
    // camMotion=0 → no warming, room reads as authored. Peak dolly → 45% pull
    // toward FOG_WARM_ANCHOR.
    const warmMix = camMotion * FOG_WARMTH_MIX;
    if (warmMix > 1e-4) targetColor.lerp(FOG_WARM_ANCHOR, warmMix);
    const k = 1 - Math.exp(-FOG_LERP * delta);
    fog.color.lerp(targetColor, k);
    bgColor.lerp(targetColor, k);
    // P2 v73 — UNIFY #5: fog reach rides camera motion. During dolly the
    // world "opens up" — fog.far pushes out so distant cosmos tiles surge
    // into clarity exactly as v71's cosmos accelerates past them. Chain
    // is now camera → cosmos drift (v71) → lintel brightness (v72) → fog
    // reach (v73). At rest fog returns to per-room baseline; full dolly =
    // +40% reach. fog.near is left alone (atmosphere depth from the camera
    // stays constant — only the far horizon recedes).
    const camFarBoost = 1 + 0.4 * camMotion;
    // P3 v215 — env-source reach scalar reuses the dayWarmth already computed
    // above for v212's color lerp. Same source, second axis. Night → 0.85×
    // baseline reach (room reads thicker); peak day → 1.15× (room reads airier).
    // Stacks multiplicatively with camFarBoost so dolly transit still dominates.
    const dayFarScale = ATMOSPHERE_FAR_NIGHT_SCALE + (ATMOSPHERE_FAR_DAY_SCALE - ATMOSPHERE_FAR_NIGHT_SCALE) * dayWarmth;
    fog.near = THREE.MathUtils.lerp(fog.near, c.fogNear, k);
    fog.far = THREE.MathUtils.lerp(fog.far, c.fogFar * dayFarScale * camFarBoost, k);

    if (process.env.NODE_ENV !== "production") {
      // Expose the LIVE scene (r3f StrictMode + HMR can recreate scene roots,
      // so re-assign every frame rather than once on mount).
      (window as unknown as { __scene?: THREE.Scene }).__scene = state.scene;
    }
  });

  return null;
}
