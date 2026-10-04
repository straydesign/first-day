/**
 * GET /api/keepalive — a Vercel cron (vercel.json) runs this every 2 days so
 * the free-tier Supabase project never sits idle long enough to pause. It was
 * paused on 2026-10-04, which silently broke sign-in for everyone.
 *
 * One cheap read through PostgREST counts as database activity. RLS returns no
 * rows to the anon key, which is fine — the query still runs.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
  }

  const res = await fetch(`${url}/rest/v1/goals?select=id&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json({ error: `Supabase answered ${res.status}` }, { status: 502 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
