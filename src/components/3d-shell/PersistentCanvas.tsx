"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Room } from "./rooms/Room";
import { AnchorDriver } from "./AnchorDriver";
import { CameraRig } from "./CameraRig";
import { ActivePanel } from "./ActivePanel";
import { AtmosphereDriver } from "./AtmosphereDriver";
import { AudioDriver } from "./AudioDriver";
import { CongratsBloom } from "./CongratsBloom";
import { TileVoid } from "./TileVoid";
import { CosmosShapes } from "./CosmosShapes";
import { GalleryMarkers } from "./GalleryMarkers";
import { GalleryArrival } from "./GalleryArrival";
import { VIEW_KEYS, advanceRoomPath, getCameraMotion, usePulse, getPendingPath } from "./RoomRegistry";
import { setPresence } from "./presenceIntent";
import { getDayWarmth } from "./timeOfDayIntent";

/**
 * P2 v74 — UNIFY #6: scene lights ride camera motion. Pre-v74 ambientLight
 * (0.45) and directionalLight (0.7) were JSX-baked constants — the room was
 * lit identically whether the camera was at-rest or mid-dolly. v74 makes
 * both intensities a multiplicative function of the per-frame camera motion
 * channel (CameraRig publishes motionAmount via setCameraMotion, RoomRegistry
 * stores it as a module-level scalar). At rest the lights return to their
 * baselines (0.45 / 0.7); at full dolly the ambient lifts ~50% and the
 * directional lifts ~45%, so the entire room visibly brightens during
 * transit. Compounds with v71 (cosmos accelerates + brightens during
 * dolly), v72 (lintel breath brighter during dolly), v73 (fog reach pushes
 * out during dolly). The motion field now spans SIX subsystems — camera
 * (origin), cosmos drift, lintel brightness, fog reach, AND scene lights —
 * with walls coupled via pulse (v69+v70). Single channel, six consumers.
 */
const AMBIENT_BASE = 0.45;
const DIRECTIONAL_BASE = 0.7;
const AMBIENT_MOTION_AMP = 0.5;
const DIRECTIONAL_MOTION_AMP = 0.45;
// P3 v85 — UNIFY #17: ambient + directional light HUE warms with cameraMotion.
// Pairs with v84 fog/bg color warmth — the SAME shared warm amber anchor
// (#ff9966) is the target. v84 warmed the air; v85 warms the light that hits
// every surface — together they close the atmosphere color-axis loop. Lower
// mix than fog's 0.45 because LIGHTS tint everything they touch, not just
// the air — 0.30 keeps room-character readability while making the warmth
// unmistakable at peak dolly. Lights at rest stay white (no per-room hue
// declared); peak dolly pulls 30% toward amber. Second cut on the HUE axis,
// FIRST cut on the lighting subsystem's COLOR dimension (v74 already had
// lights on the magnitude/intensity dimension).
const LIGHT_WARMTH_MIX = 0.3;
const LIGHT_WARM_ANCHOR = new THREE.Color("#ff9966");
const LIGHT_REST_COLOR = new THREE.Color("#ffffff");
// P3 v213 — ENVIRONMENTAL signal source extends to 3rd substrate. v211 wired
// the wall-clock into cosmos hue; v212 wired it into fog/bg hue; v213 now
// wires it into the room's LIGHTS themselves. Same hex anchor pair so the
// three color-axis substrates (cosmos void, room air, room light) all encode
// the wall-clock against THE SAME day/night colors. Pull strength 0.12
// matches v211/v212 — lights tint every surface, so identical mix keeps the
// chord balanced across the substrates that all touch surface readings. The
// rest hue at 03:00 reads as a cool slate-white; at 15:00 as a warm
// copper-white. The v85 cameraMotion amber pull then overlays on top of
// this time-of-day-shifted rest base.
const LIGHT_DAY_WARM = new THREE.Color("#c89072");
const LIGHT_NIGHT_COOL = new THREE.Color("#4a4868");
const LIGHT_TIME_OF_DAY_MIX = 0.12;
// P3 v216 — ENVIRONMENTAL source promotes its 2nd axis (intensity/reach) from
// 1 substrate to CATEGORY. v215 opened the non-color axis on atmosphere
// (fog.far scaled by wall-clock). v216 lands the same axis on a 2nd substrate:
// scene lights' BASELINE intensity. The two substrates that already host
// env-source on color (v212 atmosphere + v213 lights) now both also host
// env-source on magnitude — atmosphere via REACH, lights via INTENSITY. Same
// source, same anchor pair pattern, two substrates × two axes each = 4 cells
// filled in the source×substrate×axis cube. ±12% chosen lower than v215's
// ±15% because lights compound multiplicatively with v74 cameraMotion's ~+45%
// dolly boost (peak): a generous wall-clock swing would mask the motion
// field's headroom. At 03:00 the room reads palpably dimmer (0.88× ambient,
// 0.88× directional); at 15:00 palpably brighter (1.12× both). Compounds
// after v74 boost, so the chain at peak is BASE × dayScale × motionBoost.
const LIGHT_INTENSITY_NIGHT_SCALE = 0.88;
const LIGHT_INTENSITY_DAY_SCALE = 1.12;
// P3 v224 — ENVIRONMENTAL source opens its 4TH AXIS: SPATIAL/POSITION.
// v211–v223 walked color (axis-1, 5 substrates), magnitude (axis-2, 4
// substrates), temporal (axis-3, 4 substrates) — all three axes describe
// WHAT-the-substrate-looks-like or HOW-FAST-it-changes. cameraMotion has
// long carried a 4th axis: SPATIAL — v75 cosmos rotation-axis tilts toward
// cameraForward, v78 wall-pulse trajectory adopts cameraForward, v80
// particles drift along cameraForward. Until v224 no non-motion source had
// touched the spatial axis. Wall-clock controlling LIGHT POSITION is the
// most literal "sun arc" mechanic possible: at 03:00 (dayWarmth=0) the key
// light sits LOW (Y=3) — grazing incidence reads as long horizontal shadows
// and dim ceilings, the room as midnight-lit; at 15:00 (dayWarmth=1) the
// light sits HIGH (Y=14) — steep overhead reads as compressed shadows and
// fully-lit walls, the room as solar-noon-lit. Existing baseline Y=10 sits
// at dayWarmth=0.5 (the 09:00/21:00 sunrise/sunset midpoint). X and Z stay
// fixed — moving only Y avoids fighting the v75 rotation-axis cameraMotion
// consumer and reads as "sun rises/falls" without east-west sweep ambiguity
// (dayWarmth is symmetric in time so it can't distinguish rising vs setting).
// Structural promotion arc: opens axis-4 with cosmos analogue — DirectionalLight
// is the 1st substrate hosting env-source SPATIAL. Per Tom's
// feedback_first-day-unify-not-differentiate.md and CRITICAL
// loop-vision-first-deep-cuts rule, this is the deepest available cut after
// v223 saturated three axes; opens a virgin axis rather than ticking a count.
const LIGHT_Y_NIGHT = 3;
const LIGHT_Y_DAY = 14;

function SceneLights() {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const lightColorScratch = useRef(new THREE.Color());
  // v213 — second scratch color for wall-clock day/night anchor blend.
  // Pre-allocated so the per-frame anchor lerp allocates zero. Same pattern
  // as v211 cosmos / v212 atmosphere.
  const dayAnchorScratch = useRef(new THREE.Color());
  useFrame(() => {
    const camMotion = getCameraMotion();
    const ambBoost = 1 + AMBIENT_MOTION_AMP * camMotion;
    const dirBoost = 1 + DIRECTIONAL_MOTION_AMP * camMotion;
    // P3 v216 — env-source intensity scalar. Single dayWarmth read drives BOTH
    // the v213 color lerp below AND this magnitude scale, so lights now carry
    // env-source on two distinct axes (color + intensity) — the mirror move
    // to atmosphere's v212+v215 pair. Computed BEFORE motion boost so the
    // wall-clock sets the rest baseline and motion still multiplies on top.
    const dayWarmth = getDayWarmth();
    const dayIntensityScale = LIGHT_INTENSITY_NIGHT_SCALE + (LIGHT_INTENSITY_DAY_SCALE - LIGHT_INTENSITY_NIGHT_SCALE) * dayWarmth;
    if (ambientRef.current) ambientRef.current.intensity = AMBIENT_BASE * dayIntensityScale * ambBoost;
    if (directionalRef.current) {
      directionalRef.current.intensity = DIRECTIONAL_BASE * dayIntensityScale * dirBoost;
      // P3 v224 — SPATIAL axis: directional light Y rides the wall-clock arc.
      // Reuses the same dayWarmth read driving v213 color and v216 intensity —
      // the SAME source signal now branches into THREE distinct axes on the
      // directional light substrate: color (axis-1) + intensity (axis-2) +
      // position (axis-4). Lights joins cosmos as the 2nd substrate hosting
      // env-source on three or more axes; cosmos has color/magnitude/temporal,
      // lights has color/magnitude/spatial. Different axis triples, same depth.
      directionalRef.current.position.y = LIGHT_Y_NIGHT + (LIGHT_Y_DAY - LIGHT_Y_NIGHT) * dayWarmth;
    }
    // UNIFY #17 — hue lerp toward shared warm anchor. Computed once into
    // scratch color, then copied into both lights so ambient and directional
    // warm in perfect lockstep with each other AND with v84 fog/bg warming.
    const warmMix = camMotion * LIGHT_WARMTH_MIX;
    // P3 v213 — environmental source: pre-tint the REST base by wall-clock
    // day/night anchor BEFORE v85's cameraMotion amber pull. Cosmos (v211)
    // and atmosphere (v212) already encode the wall-clock through the same
    // anchor pair; lights join them as the 3rd color-axis substrate so the
    // entire scene (light + air + void) shares one time-of-day identity.
    // v216 hoisted the dayWarmth read up to the intensity block — reused here.
    dayAnchorScratch.current.copy(LIGHT_NIGHT_COOL).lerp(LIGHT_DAY_WARM, dayWarmth);
    lightColorScratch.current.copy(LIGHT_REST_COLOR).lerp(dayAnchorScratch.current, LIGHT_TIME_OF_DAY_MIX);
    if (warmMix > 1e-4) lightColorScratch.current.lerp(LIGHT_WARM_ANCHOR, warmMix);
    if (ambientRef.current) ambientRef.current.color.copy(lightColorScratch.current);
    if (directionalRef.current) directionalRef.current.color.copy(lightColorScratch.current);
    if (process.env.NODE_ENV !== "production") {
      type WindowWithLights = Window & {
        __lights?: {
          camMotion: number;
          ambient: number;
          directional: number;
          warmMix: number;
          hueR: number;
          hueG: number;
          hueB: number;
        };
      };
      (window as unknown as WindowWithLights).__lights = {
        camMotion,
        ambient: AMBIENT_BASE * ambBoost,
        directional: DIRECTIONAL_BASE * dirBoost,
        warmMix,
        hueR: lightColorScratch.current.r,
        hueG: lightColorScratch.current.g,
        hueB: lightColorScratch.current.b,
      };
    }
  });
  return (
    <>
      <ambientLight ref={ambientRef} intensity={AMBIENT_BASE} />
      <directionalLight ref={directionalRef} position={[8, 10, 6]} intensity={DIRECTIONAL_BASE} />
    </>
  );
}

/**
 * Walks queued waypoints from a non-adjacent transition. Each leg waits the
 * wall-pulse window (1.4s) plus a short settle so the IN-room finishes
 * assembling before the next disassembly begins.
 */
const LEG_DURATION_MS = 1500;

function PathStepper() {
  const { pulse } = usePulse();
  useEffect(() => {
    if (getPendingPath().length === 0) return;
    const id = window.setTimeout(advanceRoomPath, LEG_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [pulse]);
  return null;
}

/**
 * v210 — browser presence writer. Wires window focus/blur and document
 * visibilitychange to the presenceIntent singleton. 1 = the user is here;
 * 0 = they tabbed away or switched windows. Decoupled from the Canvas (lives
 * outside r3f) so the listeners attach to the actual browser events. New
 * SIGNAL FAMILY: every prior canvas-coupled signal was either app data
 * (v209), DOM event (v208), or camera/room state — none lived at the
 * browser substrate. v210 opens that level. TileVoid reads the scalar and
 * dims the cosmos to 40% emissive when the user is away.
 */
function PresenceWatcher() {
  useEffect(() => {
    const sync = () => {
      const focused = typeof document !== "undefined"
        && document.visibilityState !== "hidden"
        && document.hasFocus();
      setPresence(focused ? 1 : 0);
    };
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("blur", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("blur", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return null;
}

export function PersistentCanvas() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        // Pointer events enabled at root so drei Html children can receive them;
        // Canvas itself ignores pointer events via its own attribute below.
        pointerEvents: "none",
      }}
    >
      <PathStepper />
      <PresenceWatcher />
      <AudioDriver />
      <Canvas
        aria-hidden
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 4.5], fov: 55, near: 0.1, far: 200 }}
        style={{ width: "100%", height: "100%" }}
      >
        {/*
         * P2 v68 — no `<color attach="background">`. VISION forbids flat
         * backdrops, and that line WAS the flat backdrop. The scene clears to
         * transparent; the canvas wrapper is transparent; behind every room
         * the camera sees the TileVoid cosmos instead.
         */}
        {/* Per-room atmospheric fog — color, near, far all lerp per active view. */}
        <AtmosphereDriver />
        <Suspense fallback={null}>
          <SceneLights />
          <TileVoid />
          <CosmosShapes />
          {VIEW_KEYS.map((v) => (
            <Room key={v} viewKey={v} />
          ))}
          <GalleryMarkers />
          <GalleryArrival />
          <ActivePanel />
        </Suspense>
        <CameraRig />
        <AnchorDriver anchor={[0, 0, -2]} cssPrefix="--app-anchor" />
        <CongratsBloom />
      </Canvas>
    </div>
  );
}
