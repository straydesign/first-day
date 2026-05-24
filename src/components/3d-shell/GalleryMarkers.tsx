"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { fetchPublicRoomMarkers, subscribeRoomInserts } from "@/lib/social";
import { pickRoomPosition } from "@/lib/social/positions";
import {
  FRESH_WINDOW_MS,
  getArrivedMarker,
  getFlyTarget,
  getFreshMarkerElapsed,
  getFreshMarkerId,
  getGalleryMarkers,
  setArrivedMarker,
  setFlyTarget,
  setFreshMarker,
  setGalleryMarkers,
  subscribeGalleryMarkers,
} from "./galleryIntent";
import { useRoomView } from "./RoomRegistry";
import { getVisitorsByRoom } from "./presencePulseIntent";
import type { PublicRoomMarker } from "@/types";

/**
 * Social P3 — InstancedMesh marker field for the gallery room. Each instance
 * represents another planner's published room: position is Poisson-sampled in
 * an 80×40×80 volume around the gallery center, color is the published room's
 * palette anchor. The instanced mesh is the SINGLE draw call for up to 500
 * markers; per-instance scale + breath are mutated each frame.
 *
 * Clicking an instance installs a flyTarget on galleryIntent. RoomRegistry
 * reads that override and the existing camera-lerp dollies the user toward the
 * marker, scaling the focused instance up by 2.2× along the way so the user
 * gets immediate "you locked onto THIS room" feedback. Phase 4 will replace
 * this with a wall-shatter arrival; for P3 the focus scale is the visceral
 * receipt that a click means something.
 *
 * Falls back to a deterministic seed set (80 markers, 16-name pool) when the
 * Supabase fetch returns empty or fails — so the visual ships before the
 * migration is applied and never reads as an empty void.
 */

const GALLERY_CENTER: [number, number, number] = [0, -23, 0];
const APPROACH_DISTANCE = 7;
const MARKER_SIZE = 1.4;
const SEED_COUNT = 80;
const FOCUS_SCALE = 2.2;
const FOCUS_LERP = 0.08;
// P4 — arrival fires when the camera settles within this many units of the
// fly target POSITION (not lookAt — lookAt is the marker itself, which sits
// APPROACH_DISTANCE away from the camera slot). 0.9 ≈ "the dolly has finished
// pulling in"; below this the shatter component takes over.
const ARRIVAL_THRESHOLD_SQ = 0.9 * 0.9;

const SEED_NAMES = [
  "Run a 5K",
  "Learn guitar",
  "Read 12 books",
  "Write a novel",
  "Build a website",
  "Speak Spanish",
  "Cook 30 recipes",
  "Lose 15lb",
  "Meditate daily",
  "Wake at 6am",
  "Save $5k",
  "Quit sugar",
  "Bench 225",
  "Hike 100 miles",
  "Paint a portrait",
  "Pitch 50 clients",
];

function makeSeedMarkers(): PublicRoomMarker[] {
  const seeds: PublicRoomMarker[] = [];
  const positions: Array<[number, number, number]> = [];
  for (let i = 0; i < SEED_COUNT; i++) {
    const id = `seed-${i.toString().padStart(3, "0")}`;
    const pos = pickRoomPosition(id, positions);
    positions.push(pos);
    const hue = (i * 137.508) % 360; // golden-angle so the palette breathes evenly
    seeds.push({
      id,
      ownerUserId: id,
      goalTitle: SEED_NAMES[i % SEED_NAMES.length],
      position: pos,
      color: `hsl(${hue.toFixed(1)}, 62%, 60%)`,
      updatedAt: new Date().toISOString(),
    });
  }
  return seeds;
}

const tmpObj = new THREE.Object3D();
const tmpColor = new THREE.Color();
const tmpBaseColor = new THREE.Color();
const tmpDir = new THREE.Vector3();
const tmpWorld = new THREE.Vector3();
const galleryCenterVec = new THREE.Vector3(...GALLERY_CENTER);
// v239 — color the gallery field warms toward when a marker has visitors
// inside. Bright off-white with a faint warm tint — reads as "lit from
// within" against cooler room palettes, "alive" against warmer ones.
const VISITED_TINT = new THREE.Color("#ffe6c4");

export function GalleryMarkers() {
  const view = useRoomView();
  const markers = useSyncExternalStore(
    subscribeGalleryMarkers,
    getGalleryMarkers,
    getGalleryMarkers,
  );

  // One-shot bootstrap — fetch live markers, fall back to seed set on empty/error.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const live = await fetchPublicRoomMarkers();
        if (cancelled) return;
        setGalleryMarkers(live.length > 0 ? live : makeSeedMarkers());
      } catch {
        if (!cancelled) setGalleryMarkers(makeSeedMarkers());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime — when ANY planner publishes a room, materialize their marker in
  // YOUR cosmos with the same elastic overshoot as your own publish. The
  // cosmos stops being a snapshot and starts feeling like a live constellation
  // that other people are committing to right now. Dedup vs the local
  // optimistic insert (our own publish hits both paths) by id.
  useEffect(() => {
    const unsub = subscribeRoomInserts((row) => {
      const existing = getGalleryMarkers();
      if (existing.some((m) => m.id === row.id)) return;
      const marker: PublicRoomMarker = {
        id: row.id,
        ownerUserId: row.owner_user_id,
        goalTitle: row.goal_title,
        position: [row.position_x, row.position_y, row.position_z],
        color: row.color,
        updatedAt: row.updated_at,
      };
      setGalleryMarkers([...existing, marker]);
      setFreshMarker(row.id);
    });
    return unsub;
  }, []);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const scaleRef = useRef<Float32Array>(new Float32Array(0));
  // v239 — per-instance smoothed visitor-pulse (0..1). Float32Array sized
  // alongside scaleRef so the same length-resize effect covers both. Lerps
  // toward `min(rawCount, 3) / 3` so a single visitor lights ~33% and a
  // crowded room maxes out without a runaway exponential.
  const visitedPulseRef = useRef<Float32Array>(new Float32Array(0));

  // Resize the per-instance scale buffer + write base matrices/colors when the
  // marker list changes. Subsequent frames mutate the matrix in useFrame; the
  // color buffer is only touched here because palette doesn't change per frame.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (scaleRef.current.length !== markers.length) {
      scaleRef.current = new Float32Array(markers.length).fill(1);
    }
    if (visitedPulseRef.current.length !== markers.length) {
      visitedPulseRef.current = new Float32Array(markers.length);
    }
    mesh.count = markers.length;
    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      tmpObj.position.set(m.position[0], m.position[1], m.position[2]);
      tmpObj.rotation.set(0, 0, 0);
      tmpObj.scale.setScalar(1);
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
      tmpColor.set(m.color);
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [markers]);

  useFrame(({ clock, camera }, delta) => {
    const mesh = meshRef.current;
    if (!mesh || markers.length === 0) return;
    if (scaleRef.current.length !== markers.length) return; // wait for resize effect
    if (visitedPulseRef.current.length !== markers.length) return;
    const visitorsByRoom = getVisitorsByRoom();
    // v239 — exp-lerp at 1.4/s so a visitor lighting up reads in ~500ms
    // (matches the visit-presence feel without being a snap). Same rate
    // decays cleanly when they leave.
    const visK = 1 - Math.exp(-1.4 * delta);
    const fly = getFlyTarget();
    const focusedId = fly?.markerId ?? null;
    // P4 — arrival detection: once the camera settles inside the threshold
    // sphere around fly.position, promote the focused marker into the
    // arrival store. One-shot — the if-not-already-arrived guard prevents
    // re-firing each frame while the camera lingers there.
    if (fly && fly.markerId && !getArrivedMarker()) {
      const dxC = camera.position.x - fly.position[0];
      const dyC = camera.position.y - fly.position[1];
      const dzC = camera.position.z - fly.position[2];
      if (dxC * dxC + dyC * dyC + dzC * dzC < ARRIVAL_THRESHOLD_SQ) {
        const arrived = markers.find((m) => m.id === fly.markerId);
        if (arrived) {
          setArrivedMarker(arrived);
          // v240 — once the dolly has settled at the approach slot, install a
          // SECOND fly target that continues the camera path THROUGH the
          // marker's old position into the room interior. The shatter fires
          // simultaneously, so individual fragments scatter PAST the camera
          // as it flies through the gap. No markerId on this target, so the
          // arrival detection above does not re-fire on the second leg.
          const mwx = arrived.position[0] + GALLERY_CENTER[0];
          const mwy = arrived.position[1] + GALLERY_CENTER[1];
          const mwz = arrived.position[2] + GALLERY_CENTER[2];
          const dlen = Math.hypot(arrived.position[0], arrived.position[1], arrived.position[2]) || 1;
          const dx = arrived.position[0] / dlen;
          const dy = arrived.position[1] / dlen;
          const dz = arrived.position[2] / dlen;
          setFlyTarget({
            position: [mwx - dx * 1.5, mwy - dy * 1.5, mwz - dz * 1.5],
            lookAt: [mwx + dx * 1.0, mwy + dy * 1.0, mwz + dz * 1.0],
            fov: 70,
          });
        }
      }
    }
    const arrivedId = getArrivedMarker()?.id ?? null;
    const freshId = getFreshMarkerId();
    const freshElapsed = freshId ? getFreshMarkerElapsed() : -1;
    const freshWindowSec = FRESH_WINDOW_MS / 1000;
    const t = clock.getElapsedTime();
    let anyColorChanged = false;
    for (let i = 0; i < markers.length; i++) {
      const m = markers[i];
      // v239 — smooth per-instance visitor-pulse. Capped at 3 visitors so
      // a crowded room maxes out the pulse but doesn't blow out the field.
      const rawVisitors = visitorsByRoom.get(m.id) ?? 0;
      const targetPulse = Math.min(1, rawVisitors / 3);
      const prevPulse = visitedPulseRef.current[i];
      const nextPulse = prevPulse + (targetPulse - prevPulse) * visK;
      visitedPulseRef.current[i] = nextPulse;
      // Arrived → marker collapses to 0 (the shatter takes its place);
      // focused-but-not-arrived → swell to FOCUS_SCALE; everyone else →
      // 1 + visitor-pulse loom (up to +25% so populated rooms sit slightly
      // larger than empty ones in the field, without ever competing with
      // the focused-marker scale of 2.2×).
      const baseScale = 1 + nextPulse * 0.25;
      const targetScale =
        arrivedId === m.id ? 0 : focusedId === m.id ? FOCUS_SCALE : baseScale;
      const prev = scaleRef.current[i];
      let next = prev + (targetScale - prev) * FOCUS_LERP;
      // Fresh-marker materialization — easeOutElastic overshoot from 0 → ~1.5 → settles.
      // Bypasses the lerp so the curve actually reads as a snap-overshoot-settle
      // rather than a soft ramp. Active only while the marker is within the fresh
      // window AND not currently arriving (arrival visual takes precedence).
      if (freshId === m.id && freshElapsed >= 0 && arrivedId !== m.id) {
        const k = Math.min(1, freshElapsed / freshWindowSec);
        const c = (2 * Math.PI) / 0.42;
        const elastic = k === 0
          ? 0
          : k === 1
            ? 1
            : Math.pow(2, -9 * k) * Math.sin((k * freshWindowSec - 0.105) * c) + 1;
        next = elastic;
      }
      scaleRef.current[i] = next;
      // Slow per-instance spin so each marker reads as a TURNING room rather
      // than a static cube; phase offset by index so the field isn't synchronized.
      const rotY = t * 0.12 + i * 0.7;
      // Tiny breath so the field has a heartbeat at rest.
      const breathe = 1 + 0.04 * Math.sin(t * 1.2 + i * 0.4);
      tmpObj.position.set(m.position[0], m.position[1], m.position[2]);
      tmpObj.rotation.set(0, rotY, 0);
      tmpObj.scale.setScalar(next * breathe);
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
      // v239 — blend base palette toward VISITED_TINT by smoothed pulse.
      // Only writes the color when the pulse is non-trivial OR was non-trivial
      // last frame (tracked via the smoothed value crossing ~1e-3 in either
      // direction) so the instanceColor.needsUpdate fence stays cheap for
      // empty fields. We always write when pulse > 0.005 to keep the lerp
      // smooth, and snap back to base once it falls below.
      if (nextPulse > 0.005 || prevPulse > 0.005) {
        tmpBaseColor.set(m.color);
        tmpColor.copy(tmpBaseColor).lerp(VISITED_TINT, Math.min(1, nextPulse));
        mesh.setColorAt(i, tmpColor);
        anyColorChanged = true;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (anyColorChanged && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  function onPick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    const id = e.instanceId;
    if (id === undefined || id === null) return;
    const m = markers[id];
    if (!m) return;
    tmpWorld.set(m.position[0], m.position[1], m.position[2]).add(galleryCenterVec);
    tmpDir.copy(tmpWorld).sub(galleryCenterVec);
    if (tmpDir.lengthSq() < 1e-3) tmpDir.set(0, 0, 1);
    tmpDir.normalize();
    const camX = tmpWorld.x - tmpDir.x * APPROACH_DISTANCE;
    const camY = tmpWorld.y - tmpDir.y * APPROACH_DISTANCE;
    const camZ = tmpWorld.z - tmpDir.z * APPROACH_DISTANCE;
    setFlyTarget({
      position: [camX, camY, camZ],
      lookAt: [tmpWorld.x, tmpWorld.y, tmpWorld.z],
      fov: 58,
      markerId: m.id,
    });
  }

  if (view !== "gallery" || markers.length === 0) return null;

  return (
    <group position={GALLERY_CENTER}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, markers.length]}
        onClick={onPick}
        frustumCulled={false}
      >
        <boxGeometry args={[MARKER_SIZE, MARKER_SIZE, MARKER_SIZE]} />
        <meshBasicMaterial vertexColors toneMapped={false} fog />
      </instancedMesh>
    </group>
  );
}
