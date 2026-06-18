"use client";
import { BookOpen, Edit2, ChevronUp, ChevronDown, AlertTriangle, ArrowRight, Flame, Sparkles } from "lucide-react";
import { WeekCalendar } from "./WeekCalendar";
import { PlanCompleteCelebration } from "./PlanCompleteCelebration";
import { OnboardingTour } from "./OnboardingTour";
import { Panel } from "@/components/ui/Panel";
import { TopBar } from "@/components/ui/TopBar";
import { FONT } from "@/lib/design";
import { useState } from "react";
import { StreakBadge } from "./StreakBadge";
import { fireCelebration, getRoomView } from "./3d-shell/RoomRegistry";
import { StreakFreezeIndicator } from "./StreakFreezeIndicator";
import { motion } from "framer-motion";
import { staggerContainerSlow, tileEnter, contentReveal } from "@/lib/animations";
import { getNextAvailableDay, getCompletedDayCount, getPlanTotalDays } from "@/lib/engagement";
import type { Plan, ProgressMap, EngagementState, SelectedDay, Activity } from "@/types";

interface CalendarViewProps {
  planData: Plan | null;
  goalTitle?: string;
  onDayClick: (day: SelectedDay) => void;
  onEditGoal?: () => void;
  onRegeneratePlan?: () => void;
  progress?: ProgressMap;
  onBack?: () => void;
  engagement?: EngagementState | null;
  onLogout?: () => void;
}

interface WeekDay {
  dayNumber: number;
}

interface WeekData {
  weekNumber: number;
  days: WeekDay[];
  weeklyBook: { title: string; author: string; description?: string; reason?: string } | null;
  label: string;
}

function activityText(a: string | Activity): string {
  return typeof a === "string" ? a : a.text;
}

function buildSelectedDay(dayNumber: number, planData: Plan | null): SelectedDay {
  const dayData = planData?.days?.[dayNumber];
  const today = new Date();
  return {
    number: dayNumber,
    date: today.toISOString(),
    dateDisplay: today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    isToday: true,
    title: dayData?.title || `Day ${dayNumber}`,
    activities: dayData?.activities || [],
    tip: dayData?.tip,
  };
}

export function CalendarView({ planData, goalTitle, onDayClick, onEditGoal, progress = {}, onBack, engagement }: CalendarViewProps) {
  const [expandedWeeks, setExpandedWeeks] = useState(new Set<number>());

  const toggleWeekBook = (weekNumber: number) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) newSet.delete(weekNumber);
      else newSet.add(weekNumber);
      return newSet;
    });
  };

  const totalDays = getPlanTotalDays(planData);
  const completedCount = getCompletedDayCount(progress, totalDays);
  const nextDay = getNextAvailableDay(progress, totalDays);
  const allDone = nextDay > totalDays;
  const nextDayData = !allDone ? planData?.days?.[nextDay] : null;
  const previewActivities = (nextDayData?.activities || []).slice(0, 3);

  const sprintsGenerated = planData?.sprintsGenerated ?? 4;
  const planSprints = planData?.sprints;
  const getSprintTitle = (sprintNumber: number): string => {
    if (planSprints && planSprints[sprintNumber - 1]) return planSprints[sprintNumber - 1].title;
    const goalLower = (goalTitle || '').toLowerCase();
    if (goalLower.includes('run') || goalLower.includes('fitness') || goalLower.includes('workout')) return `Sprint ${sprintNumber}: ${['Warming Up', 'Building Endurance', 'Hitting Stride', 'Peak Performance'][sprintNumber - 1]}`;
    if (goalLower.includes('learn') || goalLower.includes('language') || goalLower.includes('study')) return `Sprint ${sprintNumber}: ${['Foundation', 'Building Blocks', 'Gaining Fluency', 'Mastery Mode'][sprintNumber - 1]}`;
    if (goalLower.includes('draw') || goalLower.includes('write') || goalLower.includes('creative')) return `Sprint ${sprintNumber}: ${['Finding Your Voice', 'Building Skills', 'Creative Flow', 'Finishing Strong'][sprintNumber - 1]}`;
    if (goalLower.includes('code') || goalLower.includes('business') || goalLower.includes('career')) return `Sprint ${sprintNumber}: ${['Foundations', 'Building Momentum', 'Deep Dive', 'Advanced Mastery'][sprintNumber - 1]}`;
    return `Sprint ${sprintNumber}: ${['Foundations', 'Build Momentum', 'Stretch', 'Integrate'][sprintNumber - 1] ?? 'Keep Going'}`;
  };
  const getSprintTheme = (sprintNumber: number): string | undefined => planSprints?.[sprintNumber - 1]?.theme;

  const weeks: WeekData[] = [];
  for (let i = 0; i < totalDays; i += 7) {
    const weekDays: WeekDay[] = Array.from({ length: Math.min(7, totalDays - i) }, (_, j) => ({ dayNumber: i + j + 1 }));
    const weekNumber = Math.floor(i / 7) + 1;
    const firstDayNumber = weekDays[0].dayNumber;
    const weeklyBook = planData?.days?.[firstDayNumber]?.weeklyBook || null;
    weeks.push({ weekNumber, days: weekDays, weeklyBook, label: getSprintTitle(weekNumber) });
  }

  const progressPct = Math.round((completedCount / totalDays) * 100);

  if (allDone) {
    return (
      <PlanCompleteCelebration
        goalTitle={goalTitle}
        engagement={engagement}
        totalDays={totalDays}
        onStartNextGoal={() => onBack?.()}
      />
    );
  }

  return (
    <div className="min-h-screen relative pb-20 md:pb-0" role="main" aria-label={`${totalDays}-day plan calendar`}>
      <OnboardingTour />
      <TopBar
        title={goalTitle || "Your Plan"}
        onBack={onBack}
        right={
          <div className="flex items-center gap-3">
            {engagement && (engagement.currentStreak > 0 || engagement.isAtRisk) && (
              <>
                <StreakBadge streak={engagement.currentStreak} isAtRisk={engagement.isAtRisk} />
                <StreakFreezeIndicator count={engagement.streakFreezes} isAtRisk={engagement.isAtRisk} />
              </>
            )}
            {onEditGoal && (
              <button
                onClick={onEditGoal}
                className="rounded-full border border-white/15 text-white/80 hover:bg-white/5 transition px-3 py-1 text-[13px] font-medium flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />Edit
              </button>
            )}
          </div>
        }
      />

      <div className="relative z-10 p-4 md:p-8 pt-6 md:pt-8">
        <div className="max-w-7xl mx-auto">
          {/* At-risk streak warning */}
          {engagement?.isAtRisk && (
            <motion.div variants={contentReveal} initial="hidden" animate="visible" className="mb-4">
              <Panel contentClassName="px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-white/50 flex-shrink-0" />
                  <p className="text-[13px] text-white/70 font-medium">
                    Complete a lesson today to keep your {engagement.currentStreak}-day streak alive
                    {engagement.streakFreezes > 0 ? ` — or your freeze will catch you.` : "."}
                  </p>
                </div>
              </Panel>
            </motion.div>
          )}

          {/* Section A — Hero "Next Lesson" card */}
          <motion.div
            className="mb-8 md:mb-10 sticky top-20 z-30"
            variants={contentReveal}
            initial="hidden"
            animate="visible"
          >
            <Panel contentClassName="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40"
                      style={{ fontFamily: FONT }}
                    >
                      Next Lesson
                    </span>
                    <span className="text-[12px] text-white/30 font-medium tabular-nums">
                      {nextDay} of {totalDays}
                    </span>
                  </div>
                  <h2
                    className="text-[28px] md:text-[36px] font-semibold tracking-[-0.02em] text-white leading-tight mb-4"
                    style={{ fontFamily: FONT }}
                  >
                    {nextDayData?.title || `Day ${nextDay}`}
                  </h2>
                  {previewActivities.length > 0 && (
                    <div className="space-y-2 mb-5">
                      {previewActivities.map((a, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-[6px] h-[18px] w-[18px] shrink-0 rounded-full border-[1.5px] border-white/25" />
                          <span className="text-[14px] leading-snug text-white/75 truncate">{activityText(a)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    {engagement && engagement.dailyMultiplier > 1 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.08em] text-white/40">
                        <Sparkles className="w-3 h-3" />{engagement.dailyMultiplier}x XP
                      </span>
                    )}
                    {engagement?.dailyChallenge && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-[12px] font-medium text-white/55">
                        {engagement.dailyChallenge.description} <span className="text-white/40">+{engagement.dailyChallenge.bonusXP}XP</span>
                      </span>
                    )}
                    {engagement?.isComeback && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-[12px] font-medium text-white/55">
                        <Flame className="w-3 h-3 text-white/40" />Comeback +50%
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      fireCelebration(getRoomView(), 0.65);
                      onDayClick(buildSelectedDay(nextDay, planData));
                    }}
                    className="rounded-full bg-white text-black text-[15px] font-semibold py-3 px-6 inline-flex items-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                    style={{ fontFamily: FONT }}
                  >
                    Start Lesson <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Panel>
          </motion.div>

          {/* Section B — Progress summary */}
          <motion.div
            className="mb-8 md:mb-10"
            variants={contentReveal}
            initial="hidden"
            animate="visible"
          >
            <Panel contentClassName="p-5 md:p-6">
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <span className="text-[32px] font-semibold tracking-[-0.02em] text-white tabular-nums leading-none">{completedCount}</span>
                  <span className="text-white/40 text-[15px] font-medium ml-1">/ {totalDays} lessons</span>
                </div>
                <span className="text-white/40 text-[13px] font-medium tabular-nums">{progressPct}%</span>
              </div>
              {/* Progress bar: track bg-white/10, fill bg-white/85 */}
              <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden mb-4" aria-label={`${completedCount} of ${totalDays} lessons completed`}>
                <div className="h-full rounded-full bg-white/85 transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              {engagement && (
                <div className="flex flex-wrap items-center gap-3 text-[13px]">
                  {engagement.currentStreak > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-white/70 font-medium">
                      <Flame className="w-3.5 h-3.5 text-white/40" />{engagement.currentStreak}-day streak
                    </span>
                  )}
                  <span className="text-white/55 font-medium">{engagement.totalXP.toLocaleString()} XP</span>
                  <span className="text-white/25">·</span>
                  <span className="text-white/55 font-medium">{engagement.level.name}</span>
                </div>
              )}
            </Panel>
          </motion.div>

          {/* Section C — Lesson path */}
          <motion.div className="space-y-10 md:space-y-14" variants={staggerContainerSlow} initial="hidden" animate="visible">
            {weeks.map((week: WeekData) => {
              const sprintNumber = week.weekNumber;
              const isLocked = sprintNumber > sprintsGenerated;
              const theme = getSprintTheme(sprintNumber);
              return (
                <motion.div
                  key={week.weekNumber}
                  className="relative"
                  variants={tileEnter}
                >
                  <div className="mb-3 flex flex-col items-start gap-1">
                    <h3
                      className={`text-[18px] md:text-[20px] font-semibold tracking-[-0.01em] ${isLocked ? "text-white/30" : "text-white"}`}
                      style={{ fontFamily: FONT }}
                    >
                      {week.label}
                    </h3>
                    {theme && (
                      <p className="text-[13px] text-white/45 max-w-2xl leading-snug">{theme}</p>
                    )}
                  </div>
                  {isLocked ? (
                    <Panel contentClassName="p-6 md:p-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl" aria-hidden>🔒</span>
                        <p className="text-[13px] font-medium text-white/40 uppercase tracking-[0.08em]">Generates after Sprint {sprintNumber - 1}</p>
                        <p className="text-[12px] text-white/30 max-w-md mt-1">Finish the current sprint and your next 7 days unlock automatically — tuned to what you just learned.</p>
                      </div>
                    </Panel>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      {week.weeklyBook && (
                        <Panel contentClassName="p-0">
                          <button
                            onClick={() => toggleWeekBook(week.weekNumber)}
                            className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-white/5 transition-colors rounded-[inherit]"
                            aria-expanded={expandedWeeks.has(week.weekNumber)}
                            aria-label={`Sprint ${week.weekNumber} reading recommendation`}
                          >
                            <div className="flex items-center gap-3">
                              <BookOpen className="w-5 h-5 text-white/50" />
                              <span className="text-[15px] font-semibold text-white">Sprint {week.weekNumber} Reading</span>
                            </div>
                            {expandedWeeks.has(week.weekNumber) ? (
                              <ChevronUp className="w-4 h-4 text-white/40" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-white/40" />
                            )}
                          </button>
                          {expandedWeeks.has(week.weekNumber) && (
                            <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-1 md:space-y-2 border-t border-white/[0.06] pt-3">
                              <p className="text-[14px] text-white font-semibold">{week.weeklyBook.title}</p>
                              <p className="text-[12px] text-white/55">by {week.weeklyBook.author}</p>
                              <p className="text-[12px] text-white/40 italic mt-1 md:mt-2">{week.weeklyBook.description || week.weeklyBook.reason}</p>
                            </div>
                          )}
                        </Panel>
                      )}
                      <WeekCalendar weekNumber={week.weekNumber} days={week.days} progress={progress} onDayClick={onDayClick} planData={planData} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
