/**
 * POST /api/generate-plan — builds a 28-day plan for the authenticated user.
 *
 * Replaces the old custom Supabase Edge Function. Auth is verified by validating
 * the caller's Supabase JWT. Plan generation uses Anthropic when a key is set,
 * and always falls back to a deterministic generator so it never hard-fails.
 *
 * This route does NOT write to the DB — the client persists the returned plan
 * via the (RLS-protected) goals table.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generatePlanDeterministic } from "@/lib/plan-generator";
import { generatePlanWithAI } from "@/lib/anthropic";
import type { GoalFormData } from "@/types";

export const runtime = "nodejs";

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

  let body: GoalFormData & { startDate?: string };
  try {
    body = (await req.json()) as GoalFormData & { startDate?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body?.goal || typeof body.goal !== "string" || !body.goal.trim()) {
    return NextResponse.json({ error: "A goal is required" }, { status: 400 });
  }

  const startDate = body.startDate || new Date().toISOString().split("T")[0];

  // AI path first (only fires if ANTHROPIC_API_KEY is set); deterministic fallback.
  try {
    const aiPlan = await generatePlanWithAI(body, startDate);
    if (aiPlan) return NextResponse.json(aiPlan);
  } catch (e) {
    console.error("[generate-plan] AI path failed, falling back to deterministic:", e);
  }

  const plan = generatePlanDeterministic(body, startDate);
  return NextResponse.json(plan);
}
