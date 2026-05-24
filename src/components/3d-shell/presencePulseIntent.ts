"use client";

import { subscribeGalleryPresence, subscribeReactionsForRoom } from "@/lib/social/realtime";

/**
 * P6 — cross-room ambient signal. The published-room owner is anywhere in the
 * app (calendar, day, gallery) when another planner dollies into their room;
 * realtime presence tracks visitors-by-room and surfaces a count for the
 * caller's own room. TileVoid and the cosmos shell read `getOwnVisitorCount()`
 * each frame to lift emissive — your room glowing while someone is inside it
 * is the "someone is reading your plan right now" signal without ever leaving
 * the privacy budget (no identities, just a count).
 *
 * The driver is a single Supabase channel per session. start() returns an
 * idempotent dispose; AuthenticatedApp starts on userId-known and stops on
 * logout. Visiting-room reassignments are pushed through restart() so the
 * presence track payload matches what the caller is doing right now.
 */

type Disposer = () => void;

let visitorsByRoom: Map<string, number> = new Map();
let ownRoomId: string | null = null;
let reactionPulseAt = 0;
let activeReactionDispose: Disposer | null = null;
const subs = new Set<() => void>();
// ~1.5s exponential decay — sharp punch on the leading edge, settled by ~3s.
const REACTION_PULSE_TAU_MS = 1500;

function notify(): void {
  subs.forEach((fn) => fn());
}

export function subscribePresencePulse(fn: () => void): () => void {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function setOwnRoomId(id: string | null): void {
  if (ownRoomId === id) return;
  ownRoomId = id;
  // Reaction-pulse channel follows ownRoomId — tear down whatever was watching
  // the prior room, open a new channel for the new room. Server-side filter on
  // `room_id=eq.${id}` so the visitor's cosmos only punches for tiles landing
  // on THEIR wall (not every reaction in the realtime stream).
  activeReactionDispose?.();
  activeReactionDispose = null;
  if (id) {
    activeReactionDispose = subscribeReactionsForRoom(id, () => {
      reactionPulseAt = (typeof performance !== "undefined" ? performance.now() : Date.now());
      notify();
    });
  }
  notify();
}

export function getOwnRoomId(): string | null {
  return ownRoomId;
}

export function getVisitorsByRoom(): Map<string, number> {
  return visitorsByRoom;
}

/** Count of OTHER visitors inside the caller's own published room. */
export function getOwnVisitorCount(): number {
  if (!ownRoomId) return 0;
  return visitorsByRoom.get(ownRoomId) ?? 0;
}

/**
 * Single-shot impulse (0..1) that fires when another planner leaves a mortar
 * tile in the caller's own room and decays exponentially with REACTION_PULSE_TAU_MS.
 * Stronger semantic than visitor presence — mortar is a permanent mark, visit
 * is passing. Read each frame by TileVoid to punch the cosmos emissive.
 */
export function getOwnRoomReactionPulse(): number {
  if (!reactionPulseAt) return 0;
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  return Math.exp(-(now - reactionPulseAt) / REACTION_PULSE_TAU_MS);
}

let activeDispose: Disposer | null = null;
let activeUserId: string | null = null;
let activeVisitingRoomId: string | null = null;

/**
 * Start the presence channel. Idempotent — if called again with the same
 * (userId, visitingRoomId) tuple it no-ops; if either changes, the prior
 * channel is torn down and a new one is opened so the track payload stays
 * current.
 */
export function startPresence(userId: string, visitingRoomId: string | null): void {
  if (activeUserId === userId && activeVisitingRoomId === visitingRoomId) return;
  activeDispose?.();
  activeUserId = userId;
  activeVisitingRoomId = visitingRoomId;
  activeDispose = subscribeGalleryPresence(userId, visitingRoomId, (counts) => {
    visitorsByRoom = counts;
    notify();
  });
}

export function stopPresence(): void {
  activeDispose?.();
  activeDispose = null;
  activeReactionDispose?.();
  activeReactionDispose = null;
  activeUserId = null;
  activeVisitingRoomId = null;
  visitorsByRoom = new Map();
  reactionPulseAt = 0;
  notify();
}
