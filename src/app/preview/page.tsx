"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SimpleGoalCreation } from "@/components/SimpleGoalCreation";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CalendarView } from "@/components/CalendarView";
import { DayView } from "@/components/DayView";
import { CongratsView } from "@/components/CongratsView";
import type { Plan, SelectedDay, EngagementState, Achievement, Milestone, XPBreakdown } from "@/types";

/**
 * Preview / Demo route.
 * Default view: CalendarView with mock data (instant load, no phone frames).
 * ?screen=N: Individual screen for Playwright screenshots.
 */

const MOCK_START_DATE = "2026-03-01";

const MOCK_PLAN: Plan = {
  cleanedGoal: "Learn to play guitar",
  startDate: MOCK_START_DATE,
  days: Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => [
      i + 1,
      {
        title: `Day ${i + 1}`,
        activities: [
          {
            text: i === 4
              ? "Practice the Am, C, and G chord shapes for 10 minutes"
              : `Activity ${i + 1}.1`,
            resources: i === 4
              ? [{ type: "youtube" as const, query: "Am C G chord shapes beginner guitar" }]
              : undefined,
          },
          {
            text: i === 4
              ? 'Learn to play "Horse With No Name" — it only uses 2 chords!'
              : `Activity ${i + 1}.2`,
            resources: i === 4
              ? [{ type: "youtube" as const, query: "Horse With No Name guitar tutorial beginner" }]
              : undefined,
          },
          {
            text: i === 4
              ? "Record yourself playing and listen back for timing"
              : `Activity ${i + 1}.3`,
          },
        ],
        tip: "Focus on clean chord transitions rather than speed.",
        weeklyBook: (i % 7 === 0)
          ? {
              title: ["Guitar Aerobics", "The Guitarist's Way", "Music Theory for Guitarists", "Zen Guitar"][Math.floor(i / 7)] || "Guitar Aerobics",
              author: ["Troy Nelson", "Peter Fischer", "Tom Kolb", "Philip Toshio Sudo"][Math.floor(i / 7)] || "Troy Nelson",
              description: "A comprehensive daily workout program for developing speed, accuracy, and tone.",
            }
          : undefined,
      },
    ])
  ),
};

const MOCK_PROGRESS = {
  1: { completed: { 0: true, 1: true, 2: true }, feedback: "Great first day!", completedAt: "2026-03-01T20:00:00Z" },
  2: { completed: { 0: true, 1: true, 2: true }, feedback: "Getting the hang of it.", completedAt: "2026-03-02T19:30:00Z" },
  3: { completed: { 0: true, 1: true, 2: false }, feedback: "Tough day but pushed through.", completedAt: "2026-03-03T21:00:00Z" },
  4: { completed: { 0: true, 1: true, 2: true }, feedback: "Feeling more confident!", completedAt: "2026-03-04T18:45:00Z" },
  5: { completed: { 0: true, 1: true, 2: true }, feedback: "Nailed it!", completedAt: "2026-03-05T19:00:00Z" },
};

const MOCK_DAY: SelectedDay = {
  number: 5,
  date: "2026-03-05",
  dateDisplay: "Mar 5",
  isToday: true,
  title: "Day 5: Your First Song",
  activities: [
    {
      text: "Practice the Am, C, and G chord shapes for 10 minutes",
      resources: [{ type: "youtube", query: "Am C G chord shapes beginner guitar" }],
    },
    {
      text: 'Learn to play "Horse With No Name" — it only uses 2 chords!',
      resources: [{ type: "youtube", query: "Horse With No Name guitar tutorial beginner" }],
    },
    {
      text: "Record yourself playing and listen back for timing",
    },
  ],
};

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: "first-step", name: "First Step", description: "Complete your first day", icon: "🚀", unlocked: true },
  { id: "on-fire", name: "On Fire", description: "3-day streak", icon: "🔥", unlocked: true },
  { id: "week-warrior", name: "Week Warrior", description: "Complete 7 days total", icon: "⭐", unlocked: false },
  { id: "unstoppable", name: "Unstoppable", description: "7-day streak", icon: "💪", unlocked: false },
  { id: "perfect-week", name: "Perfect Week", description: "7 consecutive days", icon: "🏅", unlocked: false },
  { id: "halfway-hero", name: "Halfway Hero", description: "Complete 15 days", icon: "🎯", unlocked: false },
  { id: "deep-thinker", name: "Deep Thinker", description: "Write 10 reflections", icon: "🧠", unlocked: false },
  { id: "goal-crusher", name: "Goal Crusher", description: "Complete all 30 days", icon: "🏆", unlocked: false },
];

const MOCK_ENGAGEMENT: EngagementState = {
  currentStreak: 5,
  longestStreak: 5,
  isAtRisk: false,
  totalXP: 560,
  level: { name: "Committed", threshold: 500, nextThreshold: 1200 },
  levelProgress: 0.086,
  achievements: MOCK_ACHIEVEMENTS,
  completionRate: 17,
  totalDaysCompleted: 5,
  streakFreezes: 0,
  dailyMultiplier: 2.0,
  dailyChallenge: { id: "reflect_50", description: "Write a 50+ word reflection", bonusXP: 50, checkKey: "reflect_50" },
  isComeback: false,
};

const MOCK_MILESTONE: Milestone = {
  type: "day",
  icon: "✅",
  title: "Day 5 Complete!",
  message: "You're building real momentum. Keep showing up!",
  intensity: "normal",
};

const MOCK_XP: XPBreakdown = {
  base: 100,
  activities: 20,
  reflection: 25,
  streakBonus: 25,
  multiplier: 2.0,
  challengeBonus: 50,
  comebackBonus: 0,
  total: 340,
};

const NEW_ACHIEVEMENTS: Achievement[] = [
  { id: "on-fire", name: "On Fire", description: "Maintain a 3-day streak", icon: "🔥", unlocked: true },
];

// Phone frame wrapper — only used for ?screen=N screenshots
function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <h2 className="text-2xl font-bold text-white">{label}</h2>
      <div
        className="relative rounded-[2.5rem] border-[8px] border-gray-800 bg-black overflow-hidden shadow-2xl"
        style={{ width: 375, height: 812 }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-black rounded-b-2xl z-50" />
        <div className="w-full h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

const SCREENS = [
  { id: "goal-creation", Component: ({ noop }: { noop: () => void }) => <SimpleGoalCreation onComplete={noop} onCancel={noop} /> },
  { id: "loading-screen", Component: () => <LoadingScreen showProgress estimatedDuration={999999} /> },
  { id: "calendar-view", Component: ({ noop }: { noop: () => void }) => (
    <CalendarView planData={MOCK_PLAN} goalTitle="Learn to play guitar" onDayClick={noop} progress={MOCK_PROGRESS} engagement={MOCK_ENGAGEMENT} />
  )},
  { id: "day-view", Component: ({ noop }: { noop: () => void }) => (
    <DayView day={MOCK_DAY} onComplete={noop} savedProgress={{ completed: { 0: true, 1: true }, feedback: "" }} currentStreak={4} />
  )},
  { id: "congrats-view", Component: ({ noop }: { noop: () => void }) => (
    <CongratsView onViewCalendar={noop} onDoMore={noop} goalTitle="Learn to play guitar" dayNumber={5} totalDays={30} progress={MOCK_PROGRESS} />
  )},
];

function ScreenContent({ screenIndex }: { screenIndex: number }) {
  const noop = () => {};
  const screen = SCREENS[screenIndex];
  if (!screen) return <div>Invalid screen index</div>;
  return <screen.Component noop={noop} />;
}

function PreviewContent() {
  const noop = () => {};
  const searchParams = useSearchParams();
  const screenParam = searchParams.get("screen");
  const allParam = searchParams.get("all");

  // Single screen mode for Playwright screenshots
  if (screenParam !== null) {
    return <ScreenContent screenIndex={parseInt(screenParam, 10)} />;
  }

  // ?all=1 shows all screens in phone frames (old behavior for screenshots)
  if (allParam !== null) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center px-4">
        <h1 className="text-4xl font-bold text-white pt-12 pb-4">First Day — Screen Preview</h1>
        <p className="text-gray-400 mb-8">All 5 app screens rendered with mock data for screenshots.</p>
        {SCREENS.map((screen, i) => (
          <PhoneFrame key={screen.id} label={`${i + 1}. ${screen.id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`}>
            <screen.Component noop={noop} />
          </PhoneFrame>
        ))}
      </div>
    );
  }

  // Default: show CalendarView directly as a demo dashboard
  return (
    <CalendarView
      planData={MOCK_PLAN}
      goalTitle="Learn to play guitar"
      onDayClick={noop}
      progress={MOCK_PROGRESS}
      engagement={MOCK_ENGAGEMENT}
    />
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <PreviewContent />
    </Suspense>
  );
}
