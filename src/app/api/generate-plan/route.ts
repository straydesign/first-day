/**
 * POST /api/generate-plan — generates ONE 7-day sprint for the authenticated user.
 *
 * The plan is built forward, a sprint at a time. The body carries `sprint` (1-4,
 * default 1) plus, for sprints 2+, the prior sprint's `priorReflections` and
 * `priorCompletion` so the AI can ADAPT the next week to how the last one went.
 * Anthropic is used when a key is set; otherwise a deterministic fallback returns
 * the fixed template sprint (no adaptation). The response reports `adapted` so the
 * client never over-claims that feedback shaped the plan.
 *
 * This route does NOT write to the DB — the client persists the result via the
 * (RLS-protected) goals table.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateSprintDeterministic } from "@/lib/plan-generator";
import { generateSprintWithAI, type SprintGenContext } from "@/lib/anthropic";
import type { GoalFormData, SprintMeta } from "@/types";

export const runtime = "nodejs";

/**
 * AI generations allowed per user per calendar day. 12 = three complete goals
 * (4 sprints each) in a day, which is far past honest use and far short of a
 * bill worth noticing. Override with PLAN_DAILY_LIMIT.
 */
const DAILY_AI_LIMIT = Number(process.env.PLAN_DAILY_LIMIT) || 12;

type SprintRequest = GoalFormData & {
  startDate?: string;
  sprint?: number;
  sprints?: SprintMeta[];
  priorReflections?: string[];
  priorCompletion?: { completed: number; total: number };
};

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
  }

  // Verify the JWT belongs to a real user before doing any work.
  const supabase = createClient(url, anon);
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Acts AS the caller, so every read/write below is bounded by the same RLS
  // policies the browser gets. A forged user_id can't reach another user's quota.
  const asUser = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: SprintRequest;
  try {
    body = (await req.json()) as SprintRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body?.goal || typeof body.goal !== "string" || !body.goal.trim()) {
    return NextResponse.json({ error: "A goal is required" }, { status: 400 });
  }

  const sprintNumber = Number.isInteger(body.sprint) && body.sprint! >= 1 && body.sprint! <= 4 ? body.sprint! : 1;
  const ctx: SprintGenContext = {
    sprints: body.sprints,
    priorReflections: body.priorReflections,
    priorCompletion: body.priorCompletion,
  };

  // AI path first (only fires if ANTHROPIC_API_KEY is set); deterministic fallback.
  //
  // The cap guards the API key, not the feature: signup is open to anyone with a
  // Google account and each call bills real money, so an uncapped route is an
  // uncapped bill. It only gates the AI path — the deterministic fallback is free
  // and stays available, so hitting the limit degrades quality, never access.
  if (process.env.ANTHROPIC_API_KEY) {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const { count, error: countErr } = await asUser
      .from("plan_generations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", midnight.toISOString());

    // A failed count must not open the gate — treat it as at-limit and fall back.
    const used = countErr ? DAILY_AI_LIMIT : (count ?? 0);
    if (countErr) console.error("[generate-plan] quota read failed, using fallback:", countErr);

    if (used < DAILY_AI_LIMIT) {
      try {
        const ai = await generateSprintWithAI(body, sprintNumber, ctx);
        if (ai) {
          // Logged only on success — a failed model call shouldn't cost the user a slot.
          await asUser
            .from("plan_generations")
            .insert({ user_id: userData.user.id, sprint: sprintNumber });
          return NextResponse.json(ai);
        }
      } catch (e) {
        console.error("[generate-plan] AI path failed, falling back to deterministic:", e);
      }
    }
  }

  const sprint = generateSprintDeterministic(body, sprintNumber);
  return NextResponse.json(sprint);
}
