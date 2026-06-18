import { createClient } from "@/lib/supabase/client";
import type { Plan, ProgressMap, GoalFormData } from "@/types";

/**
 * Get a fresh access token, refreshing the session if needed.
 * Returns null if the session is invalid (caller should redirect to login).
 */
export async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();

  if (!error && data?.session?.access_token) {
    return data.session.access_token;
  }

  if (data?.session?.refresh_token) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed?.session?.access_token) {
      return refreshed.session.access_token;
    }
  }

  return null;
}

/** Throws a "Session expired" error if there is no valid session. */
async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user?.id) throw new Error("Session expired");
  return data.user.id;
}

/** A day counts as complete when fully done (boolean true, or every activity true). */
function countCompletedDays(progress: ProgressMap | null | undefined): number {
  if (!progress) return 0;
  let n = 0;
  for (const key of Object.keys(progress)) {
    const dp = progress[Number(key)];
    if (!dp) continue;
    const c = dp.completed;
    if (c === true) {
      n++;
    } else if (c && typeof c === "object") {
      const vals = Object.values(c);
      if (vals.length > 0 && vals.every(Boolean)) n++;
    }
  }
  return n;
}

interface GoalListRow {
  id: string;
  title: string;
  time_commitment: string | null;
  start_date: string;
  total_days: number | null;
  progress: ProgressMap | null;
}

interface GoalRow {
  id: string;
  title: string;
  goal: string | null;
  time_commitment: string | null;
  time_slot: string | null;
  available_days: string[] | null;
  wants_weekly_books: boolean | null;
  context_answers: Record<string, string> | null;
  start_date: string;
  total_days: number | null;
  plan: Plan;
  progress: ProgressMap | null;
}

interface SaveGoalPayload {
  goal?: string;
  contextAnswers?: Record<string, string>;
  timeCommitment?: string;
  timeSlot?: string;
  wantsWeeklyBooks?: boolean;
  availableDays?: string[];
  plan: Plan;
}

/** Map a DB row into the flat shape every caller reads. */
function rowToGoalDetail(row: GoalRow) {
  return {
    id: row.id,
    goal: row.goal ?? "",
    title: row.title,
    timeCommitment: row.time_commitment ?? undefined,
    timeSlot: row.time_slot ?? undefined,
    availableDays: row.available_days ?? undefined,
    contextAnswers: row.context_answers ?? undefined,
    wantsWeeklyBooks: row.wants_weekly_books ?? false,
    startDate: row.start_date,
    completedDays: countCompletedDays(row.progress),
    totalDays: row.total_days ?? 28,
    plan: row.plan,
    progress: (row.progress ?? {}) as ProgressMap,
  };
}

function buildRow(payload: SaveGoalPayload) {
  const plan = payload.plan;
  return {
    title: plan?.cleanedGoal || payload.goal || "My Goal",
    goal: payload.goal ?? null,
    time_commitment: payload.timeCommitment ?? null,
    time_slot: payload.timeSlot ?? null,
    available_days: payload.availableDays ?? null,
    wants_weekly_books: payload.wantsWeeklyBooks ?? false,
    context_answers: payload.contextAnswers ?? null,
    start_date: plan?.startDate || new Date().toISOString().split("T")[0],
    total_days: plan?.totalDays ?? 28,
    plan,
  };
}

export const api = {
  goals: {
    /** All of the current user's goals (RLS scopes this to them). */
    async list() {
      await requireUserId();
      const supabase = createClient();
      const { data, error } = await supabase
        .from("goals")
        .select("id, title, time_commitment, start_date, total_days, progress")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message || "Failed to load goals");
      const rows = (data ?? []) as unknown as GoalListRow[];
      const goals = rows.map((row) => ({
        id: row.id,
        title: row.title,
        timeCommitment: row.time_commitment ?? "",
        startDate: row.start_date,
        completedDays: countCompletedDays(row.progress),
        totalDays: row.total_days ?? 28,
      }));
      return { goals };
    },

    /** One goal + its plan + progress, flat. RLS guarantees ownership. */
    async get(goalId: string) {
      await requireUserId();
      const supabase = createClient();
      const { data, error } = await supabase.from("goals").select("*").eq("id", goalId).single();
      if (error || !data) throw new Error(error?.message || "Failed to load goal");
      return rowToGoalDetail(data as unknown as GoalRow);
    },

    async create(payload: SaveGoalPayload) {
      const userId = await requireUserId();
      const supabase = createClient();
      const { data, error } = await supabase
        .from("goals")
        .insert({ ...buildRow(payload), user_id: userId, progress: {} } as never)
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message || "Failed to save goal");
      return { goalId: (data as unknown as { id: string }).id };
    },

    async update(goalId: string, payload: SaveGoalPayload) {
      await requireUserId();
      const supabase = createClient();
      const { error } = await supabase.from("goals").update(buildRow(payload) as never).eq("id", goalId);
      if (error) throw new Error(error.message || "Failed to update goal");
      return { success: true };
    },

    async delete(goalId: string) {
      await requireUserId();
      const supabase = createClient();
      const { error } = await supabase.from("goals").delete().eq("id", goalId);
      if (error) throw new Error(error.message || "Failed to delete goal");
      return { success: true };
    },

    async saveProgress(goalId: string, progress: ProgressMap) {
      await requireUserId();
      const supabase = createClient();
      const { error } = await supabase.from("goals").update({ progress } as never).eq("id", goalId);
      if (error) throw new Error(error.message || "Failed to save progress");
      return { success: true };
    },
  },

  plan: {
    /** Generate a fresh plan via the Next.js route handler (same-origin). */
    async generate(data: GoalFormData & { startDate?: string }): Promise<Plan> {
      const token = await getAuthToken();
      if (!token) throw new Error("Session expired");
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expired");
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to generate plan");
      }
      return res.json() as Promise<Plan>;
    },
  },
};
