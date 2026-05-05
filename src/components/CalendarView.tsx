"use client";
import { BookOpen, Edit2, ChevronUp, ChevronDown, AlertTriangle, ArrowLeft, ArrowRight, Flame, Sparkles } from "lucide-react";
import { WeekCalendar } from "./WeekCalendar";
import { PlanCompleteCelebration } from "./PlanCompleteCelebration";
import { OnboardingTour } from "./OnboardingTour";
import { VORONOI_LIGHT, SHARD_CLIPS, LABEL_CLIPS, BUTTON_CLIPS, getClip } from "@/constants";
import { useState, useEffect } from "react";
import { StreakBadge } from "./StreakBadge";
import { StreakFreezeIndicator } from "./StreakFreezeIndicator";
import { motion } from "framer-motion";
import { useMonotone } from "./MonotoneContext";
import { staggerContainerSlow, tileEnter, contentReveal } from "@/lib/animations";
import { getNextAvailableDay, getCompletedDayCount } from "@/lib/engagement";
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
  const [editColorIndex, setEditColorIndex] = useState(0);
  const { monotone } = useMonotone();

  useEffect(() => {
    const timer = setInterval(() => {
      setEditColorIndex(prev => (prev + 1) % VORONOI_LIGHT.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const toggleWeekBook = (weekNumber: number) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) newSet.delete(weekNumber);
      else newSet.add(weekNumber);
      return newSet;
    });
  };

  const completedCount = getCompletedDayCount(progress);
  const nextDay = getNextAvailableDay(progress);
  const allDone = nextDay === 31;
  const nextDayData = !allDone ? planData?.days?.[nextDay] : null;
  const previewActivities = (nextDayData?.activities || []).slice(0, 3);

  const getWeekLabel = (weekNumber: number) => {
    const goalLower = (goalTitle || '').toLowerCase();
    if (goalLower.includes('run') || goalLower.includes('fitness') || goalLower.includes('workout')) return ['Warming Up', 'Building Endurance', 'Hitting Stride', 'Peak Performance'][weekNumber - 1];
    if (goalLower.includes('learn') || goalLower.includes('language') || goalLower.includes('study')) return ['Foundation', 'Building Blocks', 'Gaining Fluency', 'Mastery Mode'][weekNumber - 1];
    if (goalLower.includes('draw') || goalLower.includes('write') || goalLower.includes('creative')) return ['Finding Your Voice', 'Building Skills', 'Creative Flow', 'Finishing Strong'][weekNumber - 1];
    if (goalLower.includes('code') || goalLower.includes('business') || goalLower.includes('career')) return ['Foundations', 'Building Momentum', 'Deep Dive', 'Advanced Mastery'][weekNumber - 1];
    return ['Getting Started', 'Building Momentum', 'Hitting Your Stride', 'Mastering It'][weekNumber - 1];
  };

  const weeks: WeekData[] = [];
  for (let i = 0; i < 30; i += 7) {
    const weekDays: WeekDay[] = Array.from({ length: Math.min(7, 30 - i) }, (_, j) => ({ dayNumber: i + j + 1 }));
    const weekNumber = Math.floor(i / 7) + 1;
    const firstDayNumber = weekDays[0].dayNumber;
    const weeklyBook = planData?.days?.[firstDayNumber]?.weeklyBook || null;
    weeks.push({ weekNumber, days: weekDays, weeklyBook, label: getWeekLabel(weekNumber) });
  }

  const heroAccent = monotone ? "#FFFFFF" : VORONOI_LIGHT[(nextDay - 1) % VORONOI_LIGHT.length];
  const progressPct = Math.round((completedCount / 30) * 100);

  if (allDone) {
    return (
      <PlanCompleteCelebration
        goalTitle={goalTitle}
        engagement={engagement}
        onStartNextGoal={() => onBack?.()}
      />
    );
  }

  return (
    <div className="min-h-screen relative pb-20 md:pb-0" role="main" aria-label="30-day plan calendar">
      <OnboardingTour />
      <div className="relative z-10 p-4 md:p-8 pt-[120px] md:pt-[120px]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="mb-8 md:mb-12"
            variants={contentReveal}
            initial="hidden"
            animate="visible"
          >
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 mb-8 h-10 px-6 text-sm font-bold text-white bg-black hover:scale-105 transition-transform btn-shake"
              >
                <ArrowLeft className="w-5 h-5" />Back
              </button>
            )}
            {goalTitle && (<div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div
                  className="inline-block bg-black px-8 py-3"
                  style={{ clipPath: getClip(LABEL_CLIPS, 1) }}
                >
                  <h1 className="text-3xl md:text-7xl font-bold text-white">{goalTitle}</h1>
                </div>
                {engagement && (engagement.currentStreak > 0 || engagement.isAtRisk) && (
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <StreakBadge streak={engagement.currentStreak} isAtRisk={engagement.isAtRisk} />
                    <StreakFreezeIndicator count={engagement.streakFreezes} isAtRisk={engagement.isAtRisk} />
                  </div>
                )}
              </div>
              {engagement?.isAtRisk && (
                <div className="mb-3 mx-auto max-w-md bg-black border border-coral-500/40 clip-tile-c px-4 py-2 flex items-center gap-2 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-coral-400 flex-shrink-0" />
                  <p className="text-sm text-coral-300 font-medium">
                    Complete a lesson today to keep your {engagement.currentStreak}-day streak alive
                    {engagement.streakFreezes > 0 ? ` — or your freeze will catch you.` : "."}
                  </p>
                </div>
              )}
              {onEditGoal && (
                <div className="flex justify-center mb-3">
                  <button
                    onClick={onEditGoal}
                    className="relative inline-flex items-center justify-center h-10 px-6 text-sm font-bold text-black overflow-hidden hover:scale-105 transition-colors duration-500"
                    style={{
                      clipPath: getClip(BUTTON_CLIPS, 0),
                      backgroundColor: VORONOI_LIGHT[editColorIndex],
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Edit2 className="w-4 h-4" />Edit Goal
                    </span>
                  </button>
                </div>
              )}
            </div>)}
          </motion.div>

          {/* Section A — Hero "Next Lesson" / Goal Crushed card */}
          <motion.div
            className="mb-10 md:mb-14"
            variants={contentReveal}
            initial="hidden"
            animate="visible"
          >
            <div
              className="relative p-6 md:p-10"
              style={{
                backgroundColor: heroAccent,
                clipPath: getClip(SHARD_CLIPS, (nextDay - 1) % SHARD_CLIPS.length),
              }}
            >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-block bg-black text-white px-3 py-1 text-xs md:text-sm font-black uppercase tracking-[0.25em]" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>Next Lesson</span>
                      <span className="text-black/70 text-sm md:text-base font-bold">Lesson {nextDay} of 30</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-black leading-tight mb-4" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>
                      {nextDayData?.title || `Day ${nextDay}`}
                    </h2>
                    {previewActivities.length > 0 && (
                      <ul className="space-y-1.5 mb-5">
                        {previewActivities.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm md:text-base text-black/85">
                            <span className="mt-1.5 w-1.5 h-1.5 bg-black flex-shrink-0" />
                            <span className="truncate">{activityText(a)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      {engagement && engagement.dailyMultiplier > 1 && (
                        <span className="inline-flex items-center gap-1 bg-black text-[#fcd02a] px-3 py-1 text-xs md:text-sm font-black uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" />{engagement.dailyMultiplier}x XP
                        </span>
                      )}
                      {engagement?.dailyChallenge && (
                        <span className="inline-block bg-black/80 text-white px-3 py-1 text-xs md:text-sm font-semibold">
                          {engagement.dailyChallenge.description} +{engagement.dailyChallenge.bonusXP}XP
                        </span>
                      )}
                      {engagement?.isComeback && (
                        <span className="inline-flex items-center gap-1 bg-orange-500 text-black px-3 py-1 text-xs md:text-sm font-black uppercase tracking-wider">
                          <Flame className="w-3 h-3" />Comeback +50%
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onDayClick(buildSelectedDay(nextDay, planData))}
                      className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-black uppercase tracking-wider hover:scale-105 transition-transform"
                      style={{ clipPath: getClip(BUTTON_CLIPS, 0), fontFamily: "var(--font-bebas), system-ui, sans-serif", letterSpacing: 3 }}
                    >
                      Start Lesson <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
            </div>
          </motion.div>

          {/* Section B — Progress summary */}
          <motion.div
            className="mb-10 md:mb-14"
            variants={contentReveal}
            initial="hidden"
            animate="visible"
          >
            <div className="bg-black p-5 md:p-7" style={{ clipPath: getClip(SHARD_CLIPS, 1) }}>
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>{completedCount}</span>
                  <span className="text-white/60 text-base md:text-lg font-bold"> / 30 lessons</span>
                </div>
                <span className="text-white/70 text-sm md:text-base font-bold">{progressPct}%</span>
              </div>
              <div className="flex gap-[2px] h-3 mb-4" aria-label={`${completedCount} of 30 lessons completed`}>
                {Array.from({ length: 30 }, (_, i) => {
                  const isDone = i < completedCount;
                  return (
                    <div
                      key={i}
                      className="flex-1"
                      style={{
                        backgroundColor: isDone ? (monotone ? "#FFFFFF" : VORONOI_LIGHT[i % VORONOI_LIGHT.length]) : "rgba(255,255,255,0.08)",
                        clipPath: getClip(SHARD_CLIPS, i),
                      }}
                    />
                  );
                })}
              </div>
              {engagement && (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {engagement.currentStreak > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-orange-300 font-bold">
                      <Flame className="w-4 h-4" />{engagement.currentStreak}-day streak
                    </span>
                  )}
                  <span className="text-white/70 font-bold">{engagement.totalXP.toLocaleString()} XP</span>
                  <span className="text-white/50">·</span>
                  <span className="text-white/70 font-bold">{engagement.level.name}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Section C — Lesson path */}
          <motion.div className="space-y-12 md:space-y-16" variants={staggerContainerSlow} initial="hidden" animate="visible">
            {weeks.map((week: WeekData) => {
              return (
                <motion.div
                  key={week.weekNumber}
                  className="relative"
                  variants={tileEnter}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="inline-block bg-black px-5 py-2"
                      style={{ clipPath: getClip(LABEL_CLIPS, 2) }}
                    >
                      <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>Week {week.weekNumber}: {week.label}</h3>
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {week.weeklyBook && (
                      <div className="bg-black clip-tile-b overflow-hidden">
                        <button onClick={() => toggleWeekBook(week.weekNumber)} className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-white/5 transition-colors" aria-expanded={expandedWeeks.has(week.weekNumber)} aria-label={`Week ${week.weekNumber} reading recommendation`}>
                          <div className="flex items-center gap-3"><BookOpen className="w-6 h-6 md:w-7 md:h-7 text-[#fcd02a]" /><h3 className="text-2xl md:text-3xl text-[#fcd02a] font-black uppercase tracking-wide">Week {week.weekNumber} Reading</h3></div>
                          {expandedWeeks.has(week.weekNumber) ? <ChevronUp className="w-5 h-5 text-[#fcd02a]" /> : <ChevronDown className="w-5 h-5 text-[#fcd02a]" />}
                        </button>
                        {expandedWeeks.has(week.weekNumber) && (
                          <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-1 md:space-y-2">
                            <p className="text-sm md:text-base text-yellow-100 font-semibold">{week.weeklyBook.title}</p>
                            <p className="text-xs md:text-sm text-yellow-400">by {week.weeklyBook.author}</p>
                            <p className="text-xs text-yellow-300/80 italic mt-1 md:mt-2">{week.weeklyBook.description || week.weeklyBook.reason}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <WeekCalendar weekNumber={week.weekNumber} days={week.days} progress={progress} onDayClick={onDayClick} planData={planData} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 h-40 z-20 pointer-events-none bg-gradient-to-t from-black via-black/60 to-transparent" />
    </div>
  );
}
