"use client";

import type { MoodTileKind, ReactionTile } from "@/types";
import { listReactions, insertReaction } from "@/lib/social/reactions";
import { subscribeReactionInserts } from "@/lib/social/realtime";
import { createClient } from "@/lib/supabase/client";

/**
 * P5 — mortar-reaction store. Reactions are persistent colored tiles
 * anchored to (wall_face, u, v) on the visited room's 6-face mini-room.
 * GalleryArrival projects each into 3D and renders a colored cube; over
 * time the visited room's surfaces become a literal mosaic of the
 * encouragement it has received.
 *
 * Store is keyed by target room id; mutations notify a flat subscriber
 * pool (the only consumer is the visiting GalleryArrival, which already
 * knows which target it's reading). Optimistic appends land instantly
 * so the click→tile-in-wall lag is zero; the server insert backfills
 * the real id (or no-ops on dedup-collision via the unique constraint).
 */

const cache = new Map<string, ReactionTile[]>();
const subs = new Set<() => void>();

function notify(): void {
  subs.forEach((fn) => fn());
}

export function subscribeReactions(fn: () => void): () => void {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function getReactionsFor(roomId: string | null): ReactionTile[] {
  if (!roomId) return EMPTY;
  return cache.get(roomId) ?? EMPTY;
}

const EMPTY: ReactionTile[] = [];

export async function loadReactionsFor(roomId: string): Promise<void> {
  try {
    const list = await listReactions(roomId);
    cache.set(roomId, list);
    notify();
  } catch {
    // Fail-soft: leave the cache untouched so optimistic state persists.
  }
}

export function appendReactionLocal(roomId: string, tile: ReactionTile): void {
  const prev = cache.get(roomId) ?? [];
  cache.set(roomId, [...prev, tile]);
  notify();
}

export interface PostReactionInput {
  roomId: string;
  kind: MoodTileKind;
  wallFace: number;
  u: number;
  v: number;
}

/**
 * Optimistically append + insert. Returns the appended-local tile so the
 * caller can animate it in. On server failure the local tile stays put —
 * the next loadReactionsFor refetch reconciles. On dedup-collision the
 * server returns null and we keep the local tile (the existing real row
 * is functionally identical from the user's perspective).
 */
export async function postReaction(input: PostReactionInput): Promise<ReactionTile | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return null;
  const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const optimistic: ReactionTile = {
    id: localId,
    roomId: input.roomId,
    authorUserId: userId,
    kind: input.kind,
    wallFace: input.wallFace,
    u: input.u,
    v: input.v,
    createdAt: new Date().toISOString(),
  };
  appendReactionLocal(input.roomId, optimistic);
  try {
    await insertReaction({
      roomId: input.roomId,
      authorUserId: userId,
      kind: input.kind,
      wallFace: input.wallFace,
      u: input.u,
      v: input.v,
    });
    return optimistic;
  } catch {
    return optimistic;
  }
}

/**
 * Five distinct mood-tile colors. Tuned to read at full brightness against
 * the room's color palette — never relies on the room hue to read.
 */
export const MOOD_COLORS: Record<MoodTileKind, string> = {
  warm: "#ff8a4a",
  cool: "#6ec8ff",
  spark: "#ffe04a",
  weight: "#a07adb",
  quiet: "#8ad4a8",
};

export const MOOD_LABELS: Record<MoodTileKind, string> = {
  warm: "warmth",
  cool: "calm",
  spark: "spark",
  weight: "weight",
  quiet: "quiet",
};

export const MOOD_GLYPHS: Record<MoodTileKind, string> = {
  warm: "◆",
  cool: "○",
  spark: "✦",
  weight: "■",
  quiet: "·",
};

/**
 * P6 — realtime driver. While the caller maintains the visible-rooms set,
 * incoming reaction INSERTs are merged into the per-room cache so other
 * visitors' mortar tiles land in your wall live. Local-id duplicates from
 * the optimistic path are skipped (a local tile and its corresponding real
 * INSERT have different ids but identical (room, kind, face, u≈, v≈) —
 * we de-dup on the bucket key the unique constraint uses).
 */
function bucketKey(t: { kind: MoodTileKind; wallFace: number; u: number; v: number }): string {
  return `${t.kind}|${t.wallFace}|${Math.round(t.u * 20)}|${Math.round(t.v * 20)}`;
}

let realtimeDispose: (() => void) | null = null;
let visibleRoomIdsRef: () => Set<string> = () => new Set();

export function setVisibleRoomIds(get: () => Set<string>): void {
  visibleRoomIdsRef = get;
}

export function startReactionsRealtime(): void {
  if (realtimeDispose) return;
  realtimeDispose = subscribeReactionInserts(
    () => visibleRoomIdsRef(),
    (tile) => {
      const prev = cache.get(tile.roomId) ?? [];
      const key = bucketKey(tile);
      const dupIdx = prev.findIndex(
        (p) => p.authorUserId === tile.authorUserId && bucketKey(p) === key,
      );
      if (dupIdx >= 0) {
        // Reconcile optimistic local-* row with the real server row.
        if (prev[dupIdx].id.startsWith("local-")) {
          const next = [...prev];
          next[dupIdx] = tile;
          cache.set(tile.roomId, next);
          notify();
        }
        return;
      }
      cache.set(tile.roomId, [...prev, tile]);
      notify();
    },
  );
}

export function stopReactionsRealtime(): void {
  realtimeDispose?.();
  realtimeDispose = null;
}
