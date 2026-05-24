"use client";

import type { PublicRoomMarker } from "@/types";

/**
 * P3 v236 — Social P3 surface. Two module-level stores read by the gallery room:
 *
 *   1. galleryMarkers — the published-room marker list. Populated once on
 *      gallery mount from fetchPublicRoomMarkers(); falls back to a deterministic
 *      seed set when the wire is empty or fails. Consumed by GalleryMarkers
 *      (InstancedMesh) and by ActivePanel when a marker is focused.
 *
 *   2. flyTarget — when the user clicks a marker the gallery installs a camera
 *      OVERRIDE here. RoomRegistry.useRoomTarget() consults this store and, while
 *      the view is "gallery", returns the override INSTEAD of TARGETS.gallery —
 *      so the same camera-lerp machinery that dollies between rooms now dollies
 *      toward an arbitrary world position. Clearing on view leave guarantees
 *      that exiting gallery returns to the canonical landing target.
 *
 * Both stores follow the useSyncExternalStore subscribe / getSnapshot contract
 * used throughout the 3D shell (presenceIntent, progressIntent, etc.). No React
 * state, no prop-drilling — the canvas reads directly and the surface stays
 * decoupled from the auth/data lifetime.
 */

export interface FlyTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
  /** Marker the user clicked. Lets GalleryMarkers scale + glow the focus instance. */
  markerId?: string;
}

let markers: PublicRoomMarker[] = [];
const markerSubs = new Set<() => void>();

export function setGalleryMarkers(next: PublicRoomMarker[]): void {
  markers = next;
  markerSubs.forEach((fn) => fn());
}

export function getGalleryMarkers(): PublicRoomMarker[] {
  return markers;
}

export function subscribeGalleryMarkers(fn: () => void): () => void {
  markerSubs.add(fn);
  return () => {
    markerSubs.delete(fn);
  };
}

let flyTarget: FlyTarget | null = null;
const flySubs = new Set<() => void>();

export function setFlyTarget(t: FlyTarget | null): void {
  flyTarget = t;
  // Clearing the fly target ends the visit — drop the arrived marker so the
  // shatter component unmounts and the next click can start a fresh approach.
  if (t === null && arrivedMarker !== null) {
    arrivedMarker = null;
    arrivedSubs.forEach((fn) => fn());
  }
  flySubs.forEach((fn) => fn());
}

export function getFlyTarget(): FlyTarget | null {
  return flyTarget;
}

export function subscribeFlyTarget(fn: () => void): () => void {
  flySubs.add(fn);
  return () => {
    flySubs.delete(fn);
  };
}

/**
 * P4 — arrival store. GalleryMarkers' useFrame loop watches the camera's
 * distance to flyTarget.position and, once it crosses the arrival threshold,
 * promotes the focused marker here. GalleryArrival reads this store, hides
 * its marker, fires a 32-piece shatter burst, and reveals a drei <Html>
 * panel with the published goal — the "wall opens and reveals their plan"
 * cut from the social-surface VISION criterion.
 */
let arrivedMarker: PublicRoomMarker | null = null;
const arrivedSubs = new Set<() => void>();

export function setArrivedMarker(m: PublicRoomMarker | null): void {
  arrivedMarker = m;
  arrivedSubs.forEach((fn) => fn());
}

export function getArrivedMarker(): PublicRoomMarker | null {
  return arrivedMarker;
}

export function subscribeArrivedMarker(fn: () => void): () => void {
  arrivedSubs.add(fn);
  return () => {
    arrivedSubs.delete(fn);
  };
}

/**
 * P6 — fresh-marker materialization. When publishRoom resolves, GalleryView
 * inserts the new PublicRoomMarker into the markers list and flags it here.
 * GalleryMarkers' useFrame reads getFreshMarkerId() and runs an elastic
 * overshoot scale ramp on that instance for FRESH_WINDOW_MS — so the moment
 * the user hits "Publish room" the cosmos visibly RECEIVES their marker:
 * tile snaps into existence, overshoots past 1.0, settles. The publish action
 * stops feeling like a button text change and starts feeling like committing
 * the room to the constellation.
 */
export const FRESH_WINDOW_MS = 1800;
let freshMarkerId: string | null = null;
let freshStartedAt = 0;
const freshSubs = new Set<() => void>();

export function setFreshMarker(id: string | null): void {
  freshMarkerId = id;
  freshStartedAt = id ? performance.now() : 0;
  freshSubs.forEach((fn) => fn());
}

export function getFreshMarkerId(): string | null {
  if (!freshMarkerId) return null;
  if (performance.now() - freshStartedAt > FRESH_WINDOW_MS) {
    freshMarkerId = null;
    return null;
  }
  return freshMarkerId;
}

export function getFreshMarkerElapsed(): number {
  if (!freshMarkerId) return -1;
  return (performance.now() - freshStartedAt) / 1000;
}

export function subscribeFreshMarker(fn: () => void): () => void {
  freshSubs.add(fn);
  return () => {
    freshSubs.delete(fn);
  };
}
