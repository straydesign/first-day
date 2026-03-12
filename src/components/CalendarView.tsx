"use client";
import { BookOpen, Edit2, ChevronUp, ChevronDown, AlertTriangle, Lock, Menu, LogOut, Palette, Target, ArrowLeft } from "lucide-react";
import { MosaicCard } from "./MosaicCard";
import { WeekCalendar } from "./WeekCalendar";
import { VORONOI_LIGHT } from "@/constants";
import { useState, useEffect } from "react";
import { StreakBadge } from "./StreakBadge";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useMonotone } from "./MonotoneContext";
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
  onLogout?: () => void;
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

export function CalendarView({ planData, goalTitle, onDayClick, onEditGoal, onRegeneratePlan, progress = {}, onBack, engagement, onLogout }: CalendarViewProps) {
  const [expandedWeeks, setExpandedWeeks] = useState(new Set<number>());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editColorIndex, setEditColorIndex] = useState(0);
  const { monotone, toggleMonotone } = useMonotone();

  // Discrete color cycling for Edit Goal button
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
      {/* Hamburger menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Menu"
            className="fixed top-[122px] right-4 z-50 bg-black text-white p-4 hover:scale-105 transition-transform"
            style={{ clipPath: "polygon(3% 0%, 100% 5%, 97% 100%, 0% 92%)" }}
          >
            <Menu className="w-6 h-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className={`w-[200px] border-l-2 border-white/10 pt-[140px] ${monotone ? "bg-black" : "backdrop-blur-xl"}`}>
          <div
            className={`px-4 py-3 mb-6 ${monotone ? "bg-white/10" : "bg-black"}`}
            style={{ clipPath: "polygon(0% 0%, 100% 4%, 98% 96%, 2% 100%)" }}
          >
            <SheetTitle className="text-4xl md:text-6xl font-black text-white text-center uppercase tracking-wide" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>Menu</SheetTitle>
          </div>
          <SheetDescription className="sr-only">Navigation options</SheetDescription>
          <nav className="flex flex-col gap-3 px-3">
            {onBack && (
              <button onClick={() => { setMobileMenuOpen(false); onBack(); }} className={`py-3 px-4 font-bold text-sm uppercase tracking-wide hover:scale-105 transition-transform flex items-center gap-2 ${monotone ? "bg-white/10 text-white" : "bg-black text-white"}`} style={{ clipPath: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" }}><Target className="w-4 h-4" />My Goals</button>
            )}
            <button onClick={toggleMonotone} className={`py-3 px-4 font-bold text-sm uppercase tracking-wide hover:scale-105 transition-transform flex items-center gap-2 mt-4 ${monotone ? "bg-white text-black" : "bg-black text-white"}`} style={{ clipPath: "polygon(1% 0%, 98% 3%, 100% 97%, 2% 100%)" }}><Palette className="w-4 h-4" />{monotone ? "Color Mode" : "Monotone"}</button>
            {onLogout && (
              <button onClick={onLogout} className={`py-3 px-4 font-bold text-sm uppercase tracking-wide hover:scale-105 transition-transform flex items-center gap-2 ${monotone ? "bg-white/10 text-white" : "bg-black text-red-400"}`} style={{ clipPath: "polygon(3% 0%, 100% 4%, 97% 100%, 0% 96%)" }}><LogOut className="w-4 h-4" />Logout</button>
            )}
          </nav>
        </SheetContent>
      </Sheet>
      {/* Full-screen mosaic background */}
      <MosaicCard seed={42} className="fixed inset-0 z-0 w-full h-full">{null}</MosaicCard>
      <div className="relative z-10 p-4 md:p-8 pt-[120px] md:pt-[120px]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="mb-8 md:mb-12"
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 mb-8 h-10 px-6 text-sm font-bold text-white bg-black hover:scale-105 transition-transform"
              >
                <ArrowLeft className="w-5 h-5" />Back
              </button>
            )}
            {goalTitle && (<div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div
                  className="inline-block bg-black px-8 py-3"
                  style={{ clipPath: "polygon(2% 0%, 98% 3%, 100% 97%, 0% 100%)" }}
                >
                  <h1 className="text-3xl md:text-7xl font-bold text-white">{goalTitle}</h1>
                </div>
                {engagement && (engagement.currentStreak > 0 || engagement.isAtRisk) && (
                  <StreakBadge streak={engagement.currentStreak} isAtRisk={engagement.isAtRisk} />
                )}
              </div>
              {engagement?.isAtRisk && (
                <div className="mb-3 mx-auto max-w-md bg-black border border-coral-500/40 clip-tile-c px-4 py-2 flex items-center gap-2 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-coral-400 flex-shrink-0" />
                  <p className="text-sm text-coral-300 font-medium">Your {engagement.currentStreak}-day streak is at risk! Complete today to keep it alive.</p>
                </div>
              )}
              {onEditGoal && (
                <div className="flex justify-center mb-3">
                  <button
                    onClick={onEditGoal}
                    className="relative inline-flex items-center justify-center h-10 px-6 text-sm font-bold text-black overflow-hidden hover:scale-105 transition-colors duration-500"
                    style={{
                      clipPath: "polygon(4% 8%, 95% 0%, 100% 85%, 8% 100%)",
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
          {/* Weeks — no panels, separated by vertical space */}
          <div className="space-y-12 md:space-y-16">
            {weeks.map((week: WeekData, weekIndex: number) => {
              return (
                <motion.div
                  key={week.weekNumber}
                  className="relative"
                  initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, delay: weekIndex * 0.12, ease: "easeOut" }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="inline-block bg-black px-5 py-2"
                      style={{ clipPath: "polygon(0% 0%, 97% 5%, 100% 95%, 3% 100%)" }}
                    >
                      <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>Week {week.weekNumber}: {week.label}</h3>
                    </div>
                  </div>
                  {week.isUnlocked ? (
                    <div className="space-y-3 md:space-y-4">
                      {week.weeklyBook && (
                        <div className="bg-black clip-tile-b overflow-hidden">
                          <button onClick={() => toggleWeekBook(week.weekNumber)} className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
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
                      <WeekCalendar weekNumber={week.weekNumber} days={week.days} progress={progress} onDayClick={onDayClick} planData={planData} startDate={planData?.startDate} />
                    </div>
                  ) : (
                    <div
                      className="relative py-10 md:py-16"
                      style={{
                        backgroundColor: "#000000",
                        clipPath: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)",
                      }}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Lock className="w-8 h-8 text-white/30" />
                        <span className="text-2xl md:text-3xl font-black tracking-[0.3em] text-white/20 uppercase">LOCKED</span>
                        <p className="text-xs text-white/30 mt-1">Complete Week {week.weekNumber - 1} to unlock</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Bottom gradient fade — weeks blend into black */}
      <div className="fixed bottom-0 left-0 right-0 h-40 z-20 pointer-events-none bg-gradient-to-t from-black via-black/60 to-transparent" />
    </div>
  );
}
