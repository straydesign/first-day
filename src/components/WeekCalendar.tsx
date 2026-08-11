"use client";
import { CheckCircle2, Lock, Play } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { COPY } from "@/content/copy";
import { FONT } from "@/lib/design";
import { getNextAvailableDay, isDayCompleted, getPlanTotalDays } from "@/lib/engagement";
import { fireCelebration, getRoomView } from "./3d-shell/RoomRegistry";
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
  const nextAvailable = getNextAvailableDay(progress, getPlanTotalDays(planData));

  return (
    <div className="space-y-2">
      {days.map((day) => {
        const dayProgress = progress[day.dayNumber];
        const completed = isDayCompleted(dayProgress);
        const current = !completed && day.dayNumber === nextAvailable;
        const locked = day.dayNumber > nextAvailable;
        const dayData = planData?.days?.[day.dayNumber];

        if (locked) {
          return (
            <Panel
              key={day.dayNumber}
              contentClassName="p-3 md:p-4"
              style={{ opacity: 0.5 }}
            >
              <div
                role="button"
                aria-disabled="true"
                aria-label={`Lesson ${day.dayNumber} locked. Complete previous lessons to unlock.`}
                tabIndex={-1}
                className="flex items-center gap-3 md:gap-4 cursor-not-allowed select-none"
              >
                <div
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-semibold bg-white/5 text-white/30"
                  style={{ fontFamily: FONT }}
                >
                  {day.dayNumber}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[14px] font-medium text-white/30">{COPY.calendar.dayTitleDash}</p>
                  <p className="text-[12px] text-white/25">{COPY.calendar.dayLockedLabel}</p>
                </div>
                <div className="flex-shrink-0">
                  <Lock className="w-4 h-4 md:w-5 md:h-5 text-white/25" />
                </div>
              </div>
            </Panel>
          );
        }

        const title = dayData?.title || COPY.calendar.dayTitleFallback(day.dayNumber);
        const activities = dayData?.activities || [];
        const activityCount = activities.length;
        const previewActivity = current && activities.length > 0 ? activityText(activities[0]) : null;

        const completedDate = completed && dayProgress?.completedAt ? formatCompletedDate(dayProgress.completedAt) : null;

        const handleClick = () => {
          if (!onDayClick) return;
          fireCelebration(getRoomView(), 0.45);
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
            className="w-full text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Panel
              contentClassName="p-3 md:p-4"
              solid={current}
            >
              <div className="flex items-center gap-3 md:gap-4">
                {/* Day number badge */}
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-semibold tabular-nums ${
                    current
                      ? "bg-black/10 text-black"
                      : completed
                        ? "bg-white/10 text-white"
                        : "bg-white/5 text-white/60"
                  }`}
                  style={{ fontFamily: FONT }}
                >
                  {day.dayNumber}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-[14px] font-semibold truncate ${current ? "text-black" : "text-white"}`}
                      style={{ fontFamily: FONT }}
                    >
                      {title}
                    </p>
                    {current && (
                      <span
                        className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-black/60 flex-shrink-0"
                        style={{ fontFamily: FONT }}
                      >
                        {COPY.calendar.startBadge}
                      </span>
                    )}
                  </div>
                  <p className={`text-[12px] truncate mt-0.5 ${current ? "text-black/50" : "text-white/40"}`}>
                    {completed && completedDate
                      ? COPY.calendar.completedDate(completedDate)
                      : previewActivity
                        ? previewActivity
                        : COPY.calendar.activityCount(activityCount)}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {completed ? (
                    <CheckCircle2 className={`w-5 h-5 md:w-6 md:h-6 ${current ? "text-black/40" : "text-white/50"}`} />
                  ) : (
                    <Play className={`w-4 h-4 md:w-5 md:h-5 ${current ? "fill-black/40 text-black/40" : "fill-white/25 text-white/25"}`} />
                  )}
                </div>
              </div>
            </Panel>
          </button>
        );
      })}
    </div>
  );
}
