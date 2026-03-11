"use client";
import { CheckCircle2, Circle } from "lucide-react";
import type { Plan, ProgressMap, SelectedDay } from "@/types";

interface WeekCalendarProps {
  weekNumber: number;
  days: Array<{ dayNumber: number; date: Date; dayOfWeek: number; isToday: boolean }>;
  progress?: ProgressMap;
  onDayClick?: (day: SelectedDay) => void;
  planData?: Plan | null;
  startDate?: string;
}

export function WeekCalendar({ weekNumber, days, progress = {}, onDayClick, planData, startDate }: WeekCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const goalStartDate = startDate ? new Date(startDate) : null;
  if (goalStartDate) goalStartDate.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-2">
      {days.map((day) => {
        const dayData = planData?.days?.[day.dayNumber] || {
          title: `Day ${day.dayNumber}`,
          activities: ["Review your progress", "Take one small action", "Reflect on your journey"],
        };
        const isCompleted = progress[day.dayNumber]?.completed || false;
        const isPast = day.date < today;
        const isFuture = day.date > today;
        const isBeforeStart = weekNumber === 1 && goalStartDate && day.date < goalStartDate;

        if (isBeforeStart) return null;

        const activityCount = (dayData.activities || []).length;
        const title = dayData.title || `Day ${day.dayNumber}`;

        const borderColor = isCompleted
          ? "border-l-lime-500"
          : day.isToday
            ? "border-l-white/50"
            : isPast && !isCompleted
              ? "border-l-coral-400"
              : "border-l-white/10";

        const badgeBg = isCompleted
          ? "bg-[#FFE633] text-[#000000]"
          : day.isToday
            ? "bg-white/20 text-white font-bold"
            : isPast && !isCompleted
              ? "bg-coral-400 text-white"
              : "bg-black text-white/80";

        return (
          <button
            key={day.dayNumber}
            onClick={() =>
              onDayClick?.({
                number: day.dayNumber,
                date: day.date.toISOString(),
                dateDisplay: day.date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }),
                isToday: day.isToday,
                ...dayData,
              })
            }
            className={`w-full bg-black/80 backdrop-blur-sm clip-tile-c border-l-4 ${borderColor} p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-smooth hover:bg-white/10 active:scale-[0.98] md:hover:scale-[1.01] border border-white/10`}
          >
            <div
              className={`w-9 h-9 md:w-10 md:h-10 clip-diamond flex items-center justify-center flex-shrink-0 text-sm md:text-base font-bold ${badgeBg}`}
            >
              {day.dayNumber}
            </div>

            <div className="flex-1 text-left min-w-0">
              <p className="text-sm md:text-base font-semibold text-white truncate">{title}</p>
              <p className="text-xs md:text-sm text-white/50">
                {day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                {" · "}
                {activityCount} {activityCount === 1 ? "activity" : "activities"}
              </p>
            </div>

            <div className="flex-shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-lime-500" />
              ) : (
                <Circle
                  className={`w-5 h-5 md:w-6 md:h-6 ${
                    day.isToday ? "text-white" : isPast ? "text-coral-400" : "text-white/30"
                  }`}
                />
              )}
            </div>

            {day.isToday && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white/30 clip-diamond animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
