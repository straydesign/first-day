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

export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const goal = (params.g || "").slice(0, 80);
  const days = parseInt(params.d || "30", 10);
  const streak = parseInt(params.s || "0", 10);

  const title = goal
    ? `I crushed ${days} days · ${goal} · First Day`
    : `I crushed ${days} days on First Day`;
  const description = goal
    ? `${days} days · ${streak}-day streak · I just finished a 30-day sprint on "${goal}". Start yours on First Day.`
    : `${days} days · ${streak}-day streak. Start your own 30-day sprint on First Day.`;

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
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ShareJourneyView
        goalTitle={params.g}
        days={params.d ? parseInt(params.d, 10) : 30}
        longestStreak={params.s ? parseInt(params.s, 10) : 0}
        totalXP={params.x ? parseInt(params.x, 10) : 0}
        levelName={params.l}
        achievementCount={params.a ? parseInt(params.a, 10) : 0}
      />
    </Suspense>
  );
}
