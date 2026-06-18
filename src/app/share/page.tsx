import type { Metadata } from "next";
import { Suspense } from "react";
import { ShareJourneyView } from "./ShareJourneyView";

interface SharePageProps {
  searchParams: Promise<{
    g?: string;
    d?: string;
    s?: string;
    x?: string;
    l?: string;
    a?: string;
  }>;
}

/** parseInt that falls back to a default for missing/garbage params (avoids "NaN"). */
function num(v: string | undefined, def: number): number {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : def;
}

export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const goal = (params.g || "").slice(0, 80);
  const days = num(params.d, 28);
  const streak = num(params.s, 0);

  const title = goal
    ? `I crushed ${days} days · ${goal} · First Day`
    : `I crushed ${days} days on First Day`;
  const description = goal
    ? `${days} days · ${streak}-day streak · I finished every day on "${goal}". Start your first 7-day sprint on First Day.`
    : `${days} days · ${streak}-day streak. Start your first 7-day sprint on First Day.`;

  const ogParams = new URLSearchParams();
  if (goal) ogParams.set("g", goal);
  ogParams.set("d", String(days));
  ogParams.set("s", String(streak));
  if (params.x) ogParams.set("x", params.x);
  if (params.l) ogParams.set("l", params.l);
  if (params.a) ogParams.set("a", params.a);
  const ogUrl = `/api/og/share?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "First Day",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;
  return (
    <Suspense fallback={<div className="min-h-screen tile-substrate" />}>
      <ShareJourneyView
        goalTitle={params.g}
        days={num(params.d, 28)}
        longestStreak={num(params.s, 0)}
        totalXP={num(params.x, 0)}
        levelName={params.l}
        achievementCount={num(params.a, 0)}
      />
    </Suspense>
  );
}
