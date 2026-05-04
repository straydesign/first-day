"use client";
import { CheckCircle2, Lock, Play } from "lucide-react";
import { useMonotone } from "./MonotoneContext";
import { SHARD_CLIPS, DAY_COLORS } from "@/tokens";
import { getNextAvailableDay, isDayCompleted } from "@/lib/engagement";
import type { Plan, ProgressMap, SelectedDay, Activity } from "@/types";

interface WeekCalendarProps {
  weekNumber: number;
  days: Array<{ dayNumber: number }>;
  progress?: ProgressMap;
  onDayClick?: (day: SelectedDay) => void;
  planData?: Plan | null;
}

function activityText(a: string | Activity): string {
  return typeof a === "string" ? a : a.text;
}

function formatCompletedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function WeekCalendar({ days, progress = {}, onDayClick, planData }: WeekCalendarProps) {
  const { monotone } = useMonotone();
  const nextAvailable = getNextAvailableDay(progress);

  return (
    <div className="space-y-2">
      {days.map((day) => {
        const dayProgress = progress[day.dayNumber];
        const completed = isDayCompleted(dayProgress);
        const current = !completed && day.dayNumber === nextAvailable;
        const locked = day.dayNumber > nextAvailable;
        const dayData = planData?.days?.[day.dayNumber];

        const shardClip = SHARD_CLIPS[(day.dayNumber - 1) % SHARD_CLIPS.length];

        if (locked) {
          return (
            <div
              key={day.dayNumber}
              role="button"
              aria-disabled="true"
              aria-label={`Lesson ${day.dayNumber} locked. Complete previous lessons to unlock.`}
              tabIndex={-1}
              className="w-full p-3 md:p-4 flex items-center gap-3 md:gap-4 cursor-not-allowed select-none"
              style={{
                backgroundColor: "rgba(20,20,20,0.85)",
                clipPath: shardClip,
                opacity: 0.45,
              }}
            >
              <div className="w-9 h-9 md:w-10 md:h-10 clip-diamond flex items-center justify-center flex-shrink-0 text-sm md:text-base font-bold bg-black/60 text-white/40">
                {day.dayNumber}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm md:text-base font-bold text-white/30">—</p>
                <p className="text-xs md:text-sm text-white/30">Locked</p>
              </div>
              <div className="flex-shrink-0">
                <Lock className="w-5 h-5 md:w-6 md:h-6 text-white/30" />
              </div>
            </div>
          );
        }

        const title = dayData?.title || `Day ${day.dayNumber}`;
        const activities = dayData?.activities || [];
        const activityCount = activities.length;
        const previewActivity = current && activities.length > 0 ? activityText(activities[0]) : null;

        const shardColor = monotone
          ? "#333333"
          : completed
            ? DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length]
            : DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length];

        const completedDate = completed && dayProgress?.completedAt ? formatCompletedDate(dayProgress.completedAt) : null;

        const handleClick = () => {
          if (!onDayClick) return;
          const useDate = completed && dayProgress?.completedAt ? new Date(dayProgress.completedAt) : new Date();
          onDayClick({
            number: day.dayNumber,
            date: useDate.toISOString(),
            dateDisplay: useDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
            isToday: current,
            title,
            activities,
            tip: dayData?.tip,
          });
        };

        return (
          <button
            key={day.dayNumber}
            onClick={handleClick}
            aria-label={current ? `Start lesson ${day.dayNumber}: ${title}` : `Review lesson ${day.dayNumber}: ${title}`}
            className={`relative w-full p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-smooth hover:scale-[1.02] active:scale-[0.98] ${
              completed ? "ring-2 ring-white/30" : current ? "ring-2 ring-white" : ""
            }`}
            style={{
              backgroundColor: shardColor,
              clipPath: shardClip,
            }}
          >
            <div
              className={`w-9 h-9 md:w-10 md:h-10 clip-diamond flex items-center justify-center flex-shrink-0 text-sm md:text-base font-bold ${
                completed ? "bg-black text-white" : "bg-black/20 text-black"
              }`}
            >
              {day.dayNumber}
            </div>

            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm md:text-base font-bold text-black truncate">{title}</p>
                {current && (
                  <span className="bg-black text-white px-2 py-0.5 text-[10px] md:text-xs font-black uppercase tracking-widest flex-shrink-0">START</span>
                )}
              </div>
              <p className="text-xs md:text-sm text-black/60 truncate">
                {completed && completedDate
                  ? `Completed ${completedDate}`
                  : previewActivity
                    ? previewActivity
                    : `${activityCount} ${activityCount === 1 ? "activity" : "activities"}`}
              </p>
            </div>

            <div className="flex-shrink-0">
              {completed ? (
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-black" />
              ) : (
                <Play className="w-5 h-5 md:w-6 md:h-6 text-black fill-black" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
