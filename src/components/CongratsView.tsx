"use client";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Zap } from "lucide-react";
import Aurora from "./Aurora";
import { AURORA_COLORS } from "@/constants";
import { AchievementCard } from "./AchievementCard";
import type { Milestone, XPBreakdown, Achievement } from "@/types";

interface CongratsViewProps {
  onViewCalendar: () => void;
  onDoMore: () => void;
  goalTitle?: string;
  dayNumber?: number;
  totalDays?: number;
  milestone?: Milestone | null;
  xp?: XPBreakdown | null;
  newAchievements?: Achievement[];
}

export function CongratsView({
  onViewCalendar,
  onDoMore,
  goalTitle,
  dayNumber,
  totalDays = 30,
  milestone,
  xp,
  newAchievements = [],
}: CongratsViewProps) {
  const daysRemaining = dayNumber ? totalDays - dayNumber : null;

  // Milestone-aware icon and title
  const icon = milestone?.icon ?? "🎉";
  const title = milestone?.title ?? (dayNumber ? `Day ${dayNumber} Complete!` : "Congratulations!");
  const message = milestone?.message ?? "Every step forward is progress toward your goal.";
  const intensity = milestone?.intensity ?? "normal";

  // Scale animation based on intensity
  const iconSize = intensity === "epic" ? "w-20 h-20 md:w-28 md:h-28" : intensity === "big" ? "w-18 h-18 md:w-26 md:h-26" : "w-16 h-16 md:w-24 md:h-24";
  const iconBg = intensity === "epic" ? "bg-yellow-400" : intensity === "big" ? "bg-lime-400" : "bg-lime-500";

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <div className="fixed inset-0 z-0 w-full h-full">
        <Aurora colorStops={[...AURORA_COLORS]} />
      </div>
      <div className="relative z-10 flex items-center justify-center p-6 pt-12 md:pt-20 min-h-[80vh] md:min-h-screen">
        <div className="max-w-2xl w-full text-center">
          {/* Milestone Icon */}
          <div className={`inline-flex items-center justify-center ${iconSize} rounded-full ${iconBg} mb-4 md:mb-6 shadow-lg motion-safe:animate-bounce`}>
            <span className="text-4xl md:text-5xl">{icon}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-2 text-slate-800 animate-fadeIn">
            {title}
          </h1>
          {goalTitle && (
            <p className="text-lg md:text-2xl text-teal-800 font-semibold mb-4 animate-fadeIn px-4">
              {goalTitle}
            </p>
          )}
          <p className="text-base md:text-xl text-teal-700 mb-2 animate-slideInUp max-w-lg mx-auto px-4">
            {message}
          </p>

          {/* XP Breakdown */}
          {xp && xp.total > 0 && (
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-5 py-2 mb-4 shadow-md animate-countUp">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-bold text-slate-800">+{xp.total} XP</span>
              <span className="text-sm text-gray-500">
                ({xp.base} base
                {xp.activities > 0 && ` + ${xp.activities} activities`}
                {xp.reflection > 0 && ` + ${xp.reflection} reflection`}
                {xp.streakBonus > 0 && ` + ${xp.streakBonus} streak`})
              </span>
            </div>
          )}

          {/* New Achievement Reveals */}
          {newAchievements.length > 0 && (
            <div className="mb-4 animate-slideInUp" style={{ animationDelay: "0.3s" }}>
              <p className="text-sm font-semibold text-yellow-700 mb-2">New Achievement{newAchievements.length > 1 ? "s" : ""} Unlocked!</p>
              <div className="flex justify-center gap-3 flex-wrap">
                {newAchievements.map((a) => (
                  <div key={a.id} className="w-32">
                    <AchievementCard achievement={a} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {daysRemaining !== null && daysRemaining > 0 && (
            <p className="text-sm md:text-base text-slate-600 mb-6 md:mb-12 animate-slideInUp">
              {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining — come back tomorrow for Day {dayNumber! + 1}.
            </p>
          )}
          {daysRemaining === 0 && (
            <p className="text-sm md:text-base text-lime-700 font-semibold mb-6 md:mb-12 animate-slideInUp">
              You did it! All 30 days complete.
            </p>
          )}
          {daysRemaining === null && <div className="mb-6 md:mb-12" />}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Button onClick={onViewCalendar} className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg shadow-lg hover:shadow-xl transition-smooth hover:scale-105">
              <Calendar className="mr-2 w-5 h-5 flex-shrink-0" />View Calendar
            </Button>
            <Button onClick={onDoMore} variant="outline" className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg border-2 border-teal-600 text-teal-600 hover:bg-teal-50 shadow-md hover:shadow-lg transition-smooth hover:scale-105 bg-white">
              <ArrowRight className="mr-2 w-5 h-5 flex-shrink-0" />Back to Goals
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
