"use client";
import { CheckCircle2, Circle } from "lucide-react";
import { useMonotone } from "./MonotoneContext";
import type { Plan, ProgressMap, SelectedDay } from "@/types";

const DAY_COLORS = ["#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF", "#FF10F0", "#4FC3F7", "#FF4500", "#2979FF"];
const DAY_CLIPS = [
  "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)",
  "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
  "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)",
  "polygon(3% 2%, 100% 0%, 97% 98%, 0% 100%)",
];

interface WeekCalendarProps {
  weekNumber: number;
  days: Array<{ dayNumber: number; date: Date; dayOfWeek: number; isToday: boolean }>;
  progress?: ProgressMap;
  onDayClick?: (day: SelectedDay) => void;
  planData?: Plan | null;
  startDate?: string;
}

export function WeekCalendar({ weekNumber, days, progress = {}, onDayClick, planData, startDate }: WeekCalendarProps) {
  const { monotone } = useMonotone();
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

        const shardColor = monotone ? "#333333" : DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length];
        const shardClip = DAY_CLIPS[(day.dayNumber - 1) % DAY_CLIPS.length];

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
            className={`w-full p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-smooth hover:scale-[1.02] active:scale-[0.98] ${isCompleted ? 'ring-2 ring-white/30' : ''}`}
            style={{
              backgroundColor: shardColor,
              clipPath: shardClip,
            }}
          >
            <div
              className={`w-9 h-9 md:w-10 md:h-10 clip-diamond flex items-center justify-center flex-shrink-0 text-sm md:text-base font-bold ${
                isCompleted ? "bg-black text-white" : "bg-black/20 text-black"
              }`}
            >
              {day.dayNumber}
            </div>

            <div className="flex-1 text-left min-w-0">
              <p className="text-sm md:text-base font-bold text-black truncate">{title}</p>
              <p className="text-xs md:text-sm text-black/60">
                {day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                {" · "}
                {activityCount} {activityCount === 1 ? "activity" : "activities"}
              </p>
            </div>

            <div className="flex-shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-black" />
              ) : (
                <Circle
                  className={`w-5 h-5 md:w-6 md:h-6 ${
                    day.isToday ? "text-black" : isPast ? "text-black/40" : "text-black/20"
                  }`}
                />
              )}
            </div>

            {day.isToday && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-black/40 clip-diamond animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
