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
  try {
    const ai = await generateSprintWithAI(body, sprintNumber, ctx);
    if (ai) return NextResponse.json(ai);
  } catch (e) {
    console.error("[generate-plan] AI path failed, falling back to deterministic:", e);
  }

  const sprint = generateSprintDeterministic(body, sprintNumber);
  return NextResponse.json(sprint);
}
