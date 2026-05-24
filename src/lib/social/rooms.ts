import { createClient } from "@/lib/supabase/client";
import type { Plan, Goal, PublicRoomMarker, PublicRoomRow } from "@/types";
import { redactPlanForPublish, colorForGoalTitle } from "./projection";
import { pickRoomPosition } from "./positions";

const supabase = () => createClient();

function rowToMarker(row: PublicRoomRow): PublicRoomMarker {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    goalTitle: row.goal_title,
    position: [row.position_x, row.position_y, row.position_z],
    color: row.color,
    updatedAt: row.updated_at,
  };
}

/**
 * Slim index for rendering distant markers in the gallery. Excludes
 * published_plan_json so 1000-room galleries don't blow the wire.
 */
export async function fetchPublicRoomMarkers(): Promise<PublicRoomMarker[]> {
  const { data, error } = await supabase()
    .from("public_rooms")
    .select("id, owner_user_id, goal_title, position_x, position_y, position_z, color, is_public, created_at, updated_at, cleaned_goal, published_plan_json")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as unknown as PublicRoomRow[]).map(rowToMarker);
}

/**
 * Full room payload for the LOD-upgrade moment when the camera arrives at a
 * marker. Loads the REDACTED projection only — there is no raw plan endpoint.
 */
export async function fetchRoomFull(roomId: string): Promise<PublicRoomRow | null> {
  const { data, error } = await supabase()
    .from("public_rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as PublicRoomRow | null) ?? null;
}

export interface PublishRoomInput {
  plan: Plan;
  goal: Goal;
  ownerUserId: string;
}

/**
 * Publish or re-publish the caller's room. Always upserts (the UNIQUE constraint
 * on owner_user_id means one room per owner). Position is sampled the first time
 * and reused on every subsequent publish.
 *
 * CRITICAL: Only the REDACTED projection is written. Never raw Plan / Goal.
 */
export async function publishRoom(input: PublishRoomInput): Promise<PublicRoomRow> {
  const { plan, goal, ownerUserId } = input;
  const projection = redactPlanForPublish(plan, goal);
  const color = colorForGoalTitle(goal.title);

  const existing = await supabase()
    .from("public_rooms")
    .select("id, position_x, position_y, position_z")
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  let pos: [number, number, number];
  if (existing.data) {
    pos = [
      (existing.data as { position_x: number }).position_x,
      (existing.data as { position_y: number }).position_y,
      (existing.data as { position_z: number }).position_z,
    ];
  } else {
    const occupied = await supabase()
      .from("public_rooms")
      .select("position_x, position_y, position_z")
      .eq("is_public", true);
    const taken =
      (occupied.data as Array<{ position_x: number; position_y: number; position_z: number }> | null)?.map(
        (r) => [r.position_x, r.position_y, r.position_z] as [number, number, number]
      ) ?? [];
    pos = pickRoomPosition(ownerUserId, taken);
  }

  const payload = {
    owner_user_id: ownerUserId,
    goal_title: goal.title,
    cleaned_goal: plan.cleanedGoal ?? null,
    published_plan_json: projection,
    position_x: pos[0],
    position_y: pos[1],
    position_z: pos[2],
    color,
    is_public: true,
  };

  const { data, error } = await supabase()
    .from("public_rooms")
    .upsert(payload as never, { onConflict: "owner_user_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as PublicRoomRow;
}

export async function unpublishRoom(ownerUserId: string): Promise<void> {
  const { error } = await supabase()
    .from("public_rooms")
    .update({ is_public: false } as never)
    .eq("owner_user_id", ownerUserId);
  if (error) throw error;
}
