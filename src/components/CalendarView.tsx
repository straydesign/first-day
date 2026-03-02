"use client";
import { Calendar as CalendarIcon, BookOpen, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeekCalendar } from "./WeekCalendar";
import Aurora from "./Aurora";
import { AURORA_COLORS } from "@/constants";
import { useState } from "react";

export function CalendarView({ planData, goalTitle, onDayClick, onEditGoal, onRegeneratePlan, progress = {}, onBack }: any) {
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

  const thirtyDays = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(planStartDate);
    date.setDate(planStartDate.getDate() + i);
    date.setHours(0, 0, 0, 0);
    return { dayNumber: i + 1, date, dateNum: date.getDate(), month: date.getMonth(), year: date.getFullYear(), dayOfWeek: date.getDay(), monthName: date.toLocaleDateString('en-US', { month: 'long' }), isToday: date.getTime() === today.getTime() };
  });

  const weeks: any[] = [];
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
          <div className="mb-4 md:mb-8 animate-fadeIn">
            {onBack && <BackButton onClick={onBack} />}
            {goalTitle && (<div className="text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-2 px-4">{goalTitle}</h1>
              <div className="inline-flex items-center justify-center gap-2 mb-4">
                <CalendarIcon className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg md:text-xl text-teal-700">Your 30-Day Plan</h2>
              </div>
              {onEditGoal && (
                <div className="flex justify-center mb-3">
                  <Button onClick={onEditGoal} variant="outline" size="sm" className="border-2 border-teal-600 text-teal-600 hover:bg-teal-50 transition-smooth hover:scale-105">
                    <Edit2 className="w-4 h-4 mr-1" />Edit Goal
                  </Button>
                </div>
              )}
            </div>)}
          </div>
          <div className="space-y-4 md:space-y-6">
            {weeks.map((week: any, weekIndex: number) => (
              <div key={week.weekNumber} className="relative">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg md:text-xl font-bold text-teal-800">Week {week.weekNumber}: {week.label}</h3>
                    {!week.isUnlocked && <span className="text-xs md:text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full font-medium">Locked</span>}
                  </div>
                </div>
                <Card className={`p-3 md:p-6 shadow-lg border border-gray-200 rounded-xl animate-slideInUp transition-smooth ${week.isUnlocked ? 'bg-white/90 backdrop-blur-sm hover:shadow-xl' : 'bg-gray-100 opacity-60 cursor-not-allowed'}`} style={{ animationDelay: `${weekIndex * 0.1}s` }}>
                  {week.isUnlocked ? (
                    <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                      <div className="w-full md:w-64 md:flex-shrink-0">
                        {week.weeklyBook ? (
                          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-200 h-full overflow-hidden">
                            <button onClick={() => toggleWeekBook(week.weekNumber)} className="w-full p-3 md:p-4 flex items-center justify-between hover:bg-yellow-100/50 transition-colors">
                              <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" /><h3 className="text-xs md:text-sm text-yellow-900 font-medium">Week {week.weekNumber} Reading</h3></div>
                              {expandedWeeks.has(week.weekNumber) ? <ChevronUp className="w-4 h-4 text-yellow-600" /> : <ChevronDown className="w-4 h-4 text-yellow-600" />}
                            </button>
                            {expandedWeeks.has(week.weekNumber) && (
                              <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-1 md:space-y-2">
                                <p className="text-sm md:text-base text-yellow-900 font-semibold">{week.weeklyBook.title}</p>
                                <p className="text-xs md:text-sm text-yellow-600">by {week.weeklyBook.author}</p>
                                <p className="text-xs text-yellow-700 italic mt-1 md:mt-2">{week.weeklyBook.description || week.weeklyBook.reason}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50/30 p-3 md:p-4 rounded-lg border-2 border-gray-100 h-full flex items-center justify-center">
                            <p className="text-xs md:text-sm text-gray-400 text-center">No book recommendation this week</p>
                          </div>
                        )}
                      </div>
                      <div className="flex-1"><WeekCalendar weekNumber={week.weekNumber} days={week.days} progress={progress} onDayClick={onDayClick} planData={planData} startDate={planData?.startDate} /></div>
                    </div>
                  ) : (
                    <div className="text-center py-6 md:py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-purple-100"><BookOpen className="w-8 h-8 text-purple-600" /></div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">Week {week.weekNumber} Coming Soon!</h4>
                      <p className="text-sm text-gray-600 max-w-md mx-auto mb-3">Complete Week {week.weekNumber - 1} to unlock this week.</p>
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
          <div className="mt-4 md:mt-8 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-4 md:p-6 shadow-lg">
            <p className="text-base text-gray-700 font-medium mb-4 text-center">Click on any day to see your activities</p>
            <div className="flex justify-center gap-3 text-sm flex-wrap">
              <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-red-300 bg-red-50 rounded"></div><span className="text-gray-700 font-medium">Missed</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-lime-400 bg-lime-50 rounded"></div><span className="text-gray-700 font-medium">Completed</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-teal-400 bg-teal-50 rounded"></div><span className="text-gray-700 font-medium">Today</span></div>
              <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-gray-300 bg-gray-50 rounded"></div><span className="text-gray-700 font-medium">Upcoming</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
