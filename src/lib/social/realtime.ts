import { createClient } from "@/lib/supabase/client";
import type { PublicRoomRow, ReactionRow, ReactionTile } from "@/types";

const supabase = () => createClient();

/**
 * Subscribe to reaction inserts across ALL currently-visible rooms. One channel
 * per gallery session, filtered client-side — prevents subscription thrash when
 * the camera flits between markers (reviewer #15).
 *
 * Returns an unsubscribe fn. Caller maintains the visible-ids set and decides
 * whether each incoming tile belongs to a room they care about.
 */
export function subscribeReactionInserts(
  visibleRoomIds: () => Set<string>,
  onInsert: (tile: ReactionTile) => void
): () => void {
  const channel = supabase()
    .channel("gallery-reactions")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "reactions" },
      (payload) => {
        const row = payload.new as ReactionRow;
        if (!visibleRoomIds().has(row.room_id)) return;
        onInsert({
          id: row.id,
          roomId: row.room_id,
          authorUserId: row.author_user_id,
          kind: row.kind,
          wallFace: row.wall_face,
          u: row.anchor_u,
          v: row.anchor_v,
          createdAt: row.created_at,
        });
      }
    )
    .subscribe();
  return () => {
    supabase().removeChannel(channel);
  };
}

/**
 * Subscribe to reaction INSERTs targeting a SINGLE room — server-side filtered
 * so the cosmos can react to mortar landing on the owner's wall regardless of
 * whether they're currently in gallery view. Pairs with presencePulseIntent's
 * own-room reaction pulse (the cosmos punches when someone leaves a tile in
 * YOUR wall — a stronger signal than mere visit presence).
 */
export function subscribeReactionsForRoom(
  roomId: string,
  onInsert: (row: ReactionRow) => void
): () => void {
  const channel = supabase()
    .channel(`room-reactions-${roomId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "reactions", filter: `room_id=eq.${roomId}` },
      (payload) => onInsert(payload.new as ReactionRow)
    )
    .subscribe();
  return () => {
    supabase().removeChannel(channel);
  };
}

/**
 * Subscribe to INSERT events on public_rooms — when ANY planner publishes a
 * room, the new marker lands in every viewer's gallery without a refetch.
 * Pairs with galleryIntent.setFreshMarker so other people's publishes get the
 * same elastic-overshoot materialization as your own (the cosmos is live,
 * not a snapshot).
 */
export function subscribeRoomInserts(
  onInsert: (row: PublicRoomRow) => void
): () => void {
  const channel = supabase()
    .channel("gallery-rooms")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "public_rooms" },
      (payload) => onInsert(payload.new as PublicRoomRow)
    )
    .subscribe();
  return () => {
    supabase().removeChannel(channel);
  };
}

/**
 * Subscribe to UPDATE events on the visited room so plan edits made by the
 * owner during a visit can trigger a wall-rebuild on the visitor's side
 * (reviewer #8).
 */
export function subscribeRoomUpdates(
  roomId: string,
  onUpdate: (row: PublicRoomRow) => void,
  onDelete?: () => void
): () => void {
  const channel = supabase()
    .channel(`room-${roomId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "public_rooms", filter: `id=eq.${roomId}` },
      (payload) => onUpdate(payload.new as PublicRoomRow)
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "public_rooms", filter: `id=eq.${roomId}` },
      () => onDelete?.()
    )
    .subscribe();
  return () => {
    supabase().removeChannel(channel);
  };
}

/**
 * Realtime PRESENCE for the cross-room ambient signal: when a visitor is in
 * your room, you see a faint pulse wherever you are (reviewer #20). Each
 * visitor tracks `{ visitingRoomId }` on the shared "gallery-presence" channel.
 */
export interface PresenceState {
  visitingRoomId: string | null;
  userId: string;
}

export function subscribeGalleryPresence(
  selfUserId: string,
  selfVisitingRoomId: string | null,
  onPresence: (visitorsByRoom: Map<string, number>) => void
): () => void {
  const channel = supabase().channel("gallery-presence", {
    config: { presence: { key: selfUserId } },
  });

  const recompute = () => {
    const state = channel.presenceState<PresenceState>();
    const counts = new Map<string, number>();
    for (const key of Object.keys(state)) {
      const entries = state[key];
      for (const entry of entries) {
        if (entry.visitingRoomId) {
          counts.set(entry.visitingRoomId, (counts.get(entry.visitingRoomId) ?? 0) + 1);
        }
      }
    }
    onPresence(counts);
  };

  channel
    .on("presence", { event: "sync" }, recompute)
    .on("presence", { event: "join" }, recompute)
    .on("presence", { event: "leave" }, recompute)
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ visitingRoomId: selfVisitingRoomId, userId: selfUserId } satisfies PresenceState);
      }
    });

  return () => {
    supabase().removeChannel(channel);
  };
}
