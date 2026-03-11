"use client";
import { Calendar as CalendarIcon, BookOpen, Edit2, ChevronUp, ChevronDown, AlertTriangle, Lock } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { MosaicCard } from "./MosaicCard";
import { WeekCalendar } from "./WeekCalendar";
import Aurora from "./Aurora";
import { AURORA_COLORS, VORONOI_LIGHT } from "@/constants";
import { useState } from "react";
import { StreakBadge } from "./StreakBadge";
import { motion } from "framer-motion";
import type { Plan, ProgressMap, EngagementState, SelectedDay } from "@/types";

interface CalendarViewProps {
  planData: Plan | null;
  goalTitle?: string;
  onDayClick: (day: SelectedDay) => void;
  onEditGoal?: () => void;
  onRegeneratePlan?: () => void;
  progress?: ProgressMap;
  onBack?: () => void;
  engagement?: EngagementState | null;
}

interface WeekDay {
  dayNumber: number;
  date: Date;
  dateNum: number;
  month: number;
  year: number;
  dayOfWeek: number;
  monthName: string;
  isToday: boolean;
}

interface WeekData {
  weekNumber: number;
  days: WeekDay[];
  weeklyBook: { title: string; author: string; description?: string; reason?: string } | null;
  isUnlocked: boolean;
  label: string;
}

export function CalendarView({ planData, goalTitle, onDayClick, onEditGoal, onRegeneratePlan, progress = {}, onBack, engagement }: CalendarViewProps) {
  const [expandedWeeks, setExpandedWeeks] = useState(new Set<number>());

  const toggleWeekBook = (weekNumber: number) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) newSet.delete(weekNumber);
      else newSet.add(weekNumber);
      return newSet;
    });
  };

  let planStartDate: Date;
  if (planData?.startDate) {
    const [year, month, day] = planData.startDate.split('-').map(Number);
    planStartDate = new Date(year, month - 1, day);
  } else {
    planStartDate = new Date();
  }
  planStartDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getWeekLabel = (weekNumber: number) => {
    const goalLower = (goalTitle || '').toLowerCase();
    if (goalLower.includes('run') || goalLower.includes('fitness') || goalLower.includes('workout')) return ['Warming Up', 'Building Endurance', 'Hitting Stride', 'Peak Performance'][weekNumber - 1];
    if (goalLower.includes('learn') || goalLower.includes('language') || goalLower.includes('study')) return ['Foundation', 'Building Blocks', 'Gaining Fluency', 'Mastery Mode'][weekNumber - 1];
    if (goalLower.includes('draw') || goalLower.includes('write') || goalLower.includes('creative')) return ['Finding Your Voice', 'Building Skills', 'Creative Flow', 'Finishing Strong'][weekNumber - 1];
    if (goalLower.includes('code') || goalLower.includes('business') || goalLower.includes('career')) return ['Foundations', 'Building Momentum', 'Deep Dive', 'Advanced Mastery'][weekNumber - 1];
    return ['Getting Started', 'Building Momentum', 'Hitting Your Stride', 'Mastering It'][weekNumber - 1];
  };

  const thirtyDays: WeekDay[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(planStartDate);
    date.setDate(planStartDate.getDate() + i);
    date.setHours(0, 0, 0, 0);
    return { dayNumber: i + 1, date, dateNum: date.getDate(), month: date.getMonth(), year: date.getFullYear(), dayOfWeek: date.getDay(), monthName: date.toLocaleDateString('en-US', { month: 'long' }), isToday: date.getTime() === today.getTime() };
  });

  const weeks: WeekData[] = [];
  for (let i = 0; i < 30; i += 7) {
    const weekDays = thirtyDays.slice(i, i + 7);
    const weekNumber = Math.floor(i / 7) + 1;
    const firstDayNumber = weekDays[0].dayNumber;
    const weeklyBook = planData?.days?.[firstDayNumber]?.weeklyBook || null;
    const isUnlocked = planData?.days?.[firstDayNumber] !== undefined;
    weeks.push({ weekNumber, days: weekDays, weeklyBook, isUnlocked, label: getWeekLabel(weekNumber) });
  }

  return (
    <div className="min-h-screen relative bg-black">
      <div className="fixed inset-0 z-0 w-full h-full"><Aurora colorStops={[...AURORA_COLORS]} /></div>
      <div className="relative z-10 p-4 md:p-8 pt-4 md:pt-6">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
          <motion.div
            className="mb-4 md:mb-8"
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {onBack && (
              <motion.button
                onClick={onBack}
                className="relative inline-flex items-center gap-2 mb-8 h-10 px-6 text-sm font-bold text-white overflow-hidden hover:scale-105 transition-transform"
                style={{ clipPath: "polygon(0% 5%, 92% 0%, 98% 92%, 3% 95%)" }}
              >
                <motion.span
                  className="absolute inset-0"
                  animate={{
                    backgroundColor: [...VORONOI_LIGHT, VORONOI_LIGHT[0]].map(c => `${c}80`),
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <span className="absolute inset-0" style={{ border: "1px solid rgba(255,255,255,0.2)" }} />
                <span className="relative z-10 flex items-center gap-2 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                  <ArrowLeft className="w-5 h-5" />Back
                </span>
              </motion.button>
            )}
            {goalTitle && (<div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <h1 className="text-3xl md:text-5xl font-bold text-white px-4">{goalTitle}</h1>
                {engagement && (engagement.currentStreak > 0 || engagement.isAtRisk) && (
                  <StreakBadge streak={engagement.currentStreak} isAtRisk={engagement.isAtRisk} />
                )}
              </div>
              <div className="inline-flex items-center justify-center gap-2 mb-4">
                <CalendarIcon className="w-5 h-5 text-white" />
                <h2 className="text-lg md:text-xl text-white font-bold">Your 30-Day Plan</h2>
              </div>
              {engagement?.isAtRisk && (
                <div className="mb-3 mx-auto max-w-md bg-black border border-coral-500/40 clip-tile-c px-4 py-2 flex items-center gap-2 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-coral-400 flex-shrink-0" />
                  <p className="text-sm text-coral-300 font-medium">Your {engagement.currentStreak}-day streak is at risk! Complete today to keep it alive.</p>
                </div>
              )}
              {onEditGoal && (
                <div className="flex justify-center mb-3">
                  <motion.button
                    onClick={onEditGoal}
                    className="relative inline-flex items-center justify-center h-10 px-6 text-sm font-bold text-white overflow-hidden hover:scale-105 transition-transform"
                    style={{ clipPath: "polygon(4% 8%, 95% 0%, 100% 85%, 8% 100%)" }}
                  >
                    <motion.span
                      className="absolute inset-0"
                      animate={{
                        backgroundColor: [...VORONOI_LIGHT, VORONOI_LIGHT[0]].map(c => `${c}90`),
                      }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    />
                    <span
                      className="absolute inset-0"
                      style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                    />
                    <span className="relative z-10 flex items-center gap-1.5 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                      <Edit2 className="w-4 h-4" />Edit Goal
                    </span>
                  </motion.button>
                </div>
              )}
            </div>)}
          </motion.div>
          <div className="space-y-4 md:space-y-6">
            {weeks.map((week: WeekData, weekIndex: number) => {
              // Progressive fade — week 1 fully visible, further weeks darker
              const weekOpacity = Math.max(0.12, 1 - weekIndex * 0.22);

              return (
                <motion.div
                  key={week.weekNumber}
                  className="relative"
                  initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
                  animate={{ opacity: weekOpacity, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, delay: weekIndex * 0.12, ease: "easeOut" }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl md:text-2xl font-bold text-white">Week {week.weekNumber}: {week.label}</h3>
                    </div>
                  </div>
                  <MosaicCard seed={weekIndex} tileVariant={(["a", "b", "c", "d"] as const)[weekIndex % 4]} className={`p-3 md:p-6 transition-smooth ${week.isUnlocked ? 'backdrop-blur-sm' : 'cursor-not-allowed'}`}>
                    {week.isUnlocked ? (
                      <div className="space-y-3 md:space-y-4">
                        {week.weeklyBook && (
                          <div className="bg-gradient-to-br from-[#FF1493] to-[#FF1493] clip-tile-b border-2 border-yellow-600/30 overflow-hidden">
                            <button onClick={() => toggleWeekBook(week.weekNumber)} className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" /><h3 className="text-xs md:text-sm text-yellow-200 font-medium">Week {week.weekNumber} Reading</h3></div>
                              {expandedWeeks.has(week.weekNumber) ? <ChevronUp className="w-4 h-4 text-yellow-400" /> : <ChevronDown className="w-4 h-4 text-yellow-400" />}
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
                        <WeekCalendar weekNumber={week.weekNumber} days={week.days} progress={progress} onDayClick={onDayClick} planData={planData} startDate={planData?.startDate} />
                      </div>
                    ) : (
                      <div className="relative py-10 md:py-16">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Lock className="w-8 h-8 text-white/20" />
                          <span className="text-2xl md:text-3xl font-black tracking-[0.3em] text-white/15 uppercase">LOCKED</span>
                          <p className="text-xs text-white/20 mt-1">Complete Week {week.weekNumber - 1} to unlock</p>
                        </div>
                      </div>
                    )}
                  </MosaicCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
