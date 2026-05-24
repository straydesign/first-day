import { createClient } from "@/lib/supabase/client";
import type { MoodTileKind, ReactionRow, ReactionTile } from "@/types";

const supabase = () => createClient();

function rowToTile(row: ReactionRow): ReactionTile {
  return {
    id: row.id,
    roomId: row.room_id,
    authorUserId: row.author_user_id,
    kind: row.kind,
    wallFace: row.wall_face,
    u: row.anchor_u,
    v: row.anchor_v,
    createdAt: row.created_at,
  };
}

export async function listReactions(roomId: string): Promise<ReactionTile[]> {
  const { data, error } = await supabase()
    .from("reactions")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data as unknown as ReactionRow[]).map(rowToTile);
}

export interface InsertReactionInput {
  roomId: string;
  authorUserId: string;
  kind: MoodTileKind;
  wallFace: number;
  u: number;
  v: number;
}

/**
 * Mortar one mood tile into a wall at a local-UV position. The UNIQUE
 * constraint at (author, room, kind, wall_face, ~5% UV bucket) means rapid
 * re-clicks in the same region collapse to one tile instead of spamming.
 */
export async function insertReaction(input: InsertReactionInput): Promise<ReactionTile | null> {
  const payload = {
    room_id: input.roomId,
    author_user_id: input.authorUserId,
    kind: input.kind,
    wall_face: input.wallFace,
    anchor_u: Math.max(0, Math.min(1, input.u)),
    anchor_v: Math.max(0, Math.min(1, input.v)),
  };
  const { data, error } = await supabase()
    .from("reactions")
    .insert(payload as never)
    .select("*")
    .maybeSingle();
  if (error) {
    // 23505 = unique_violation. Treat dedup collisions as a no-op so the
    // optimistic UI can stay quiet rather than surfacing an error.
    const code = (error as { code?: string }).code;
    if (code === "23505") return null;
    throw error;
  }
  return data ? rowToTile(data as unknown as ReactionRow) : null;
}

export async function deleteReaction(reactionId: string): Promise<void> {
  const { error } = await supabase().from("reactions").delete().eq("id", reactionId);
  if (error) throw error;
}
