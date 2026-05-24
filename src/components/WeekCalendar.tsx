"use client";
import { CheckCircle2, Lock, Play } from "lucide-react";
import { useMonotone } from "./MonotoneContext";
import { SHARD_CLIPS, DAY_COLORS } from "@/tokens";
import { getNextAvailableDay, isDayCompleted } from "@/lib/engagement";
import { VoronoiMosaic } from "./VoronoiMosaic";
import { fireCelebration, getRoomView } from "./3d-shell/RoomRegistry";
import type { Plan, ProgressMap, SelectedDay, Activity } from "@/types";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

function tonalPalette(hex: string): readonly string[] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (a: number, t: number, target: number) => Math.round(a + (target - a) * t);
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  const rgb = (rr: number, gg: number, bb: number) => `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
  return [
    rgb(mix(r, 0.42, 0), mix(g, 0.42, 0), mix(b, 0.42, 0)),
    rgb(mix(r, 0.20, 0), mix(g, 0.20, 0), mix(b, 0.20, 0)),
    hex,
    rgb(mix(r, 0.18, 255), mix(g, 0.18, 255), mix(b, 0.18, 255)),
    rgb(mix(r, 0.34, 255), mix(g, 0.34, 255), mix(b, 0.34, 255)),
  ];
}

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
              className="relative overflow-hidden w-full p-3 md:p-4 flex items-center gap-3 md:gap-4 cursor-not-allowed select-none"
              style={{
                clipPath: shardClip,
                opacity: 0.45,
              }}
            >
              <VoronoiMosaic seed={3001 + day.dayNumber * 13} tileCount={24} margin={3} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
              <div className="relative z-10 w-9 h-9 md:w-10 md:h-10 clip-diamond flex items-center justify-center flex-shrink-0 text-sm md:text-base font-bold bg-black/60 text-white/40">
                {day.dayNumber}
              </div>
              <div className="relative z-10 flex-1 text-left min-w-0">
                <p className="text-sm md:text-base font-bold text-white/30">—</p>
                <p className="text-xs md:text-sm text-white/30">Locked</p>
              </div>
              <div className="relative z-10 flex-shrink-0">
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
          // Soft acknowledgement impulse — the calendar room registers the pick
          // BEFORE the view-change cascade triggers wall-shatter. Reads as:
          // click → room nudges → walls fall → camera dollies into day room.
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
            className={`relative overflow-hidden w-full p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-smooth hover:scale-[1.02] active:scale-[0.98] ${
              completed ? "ring-2 ring-white/30" : current ? "ring-2 ring-white" : ""
            }`}
            style={{
              clipPath: shardClip,
            }}
          >
            <VoronoiMosaic
              seed={3101 + day.dayNumber * 19}
              tileCount={18}
              margin={3}
              gap={2}
              palette={tonalPalette(shardColor)}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
            <div
              className={`relative z-10 w-9 h-9 md:w-10 md:h-10 clip-diamond flex items-center justify-center flex-shrink-0 text-sm md:text-base font-bold ${
                completed ? "bg-black text-white" : "bg-black/20 text-black"
              }`}
            >
              {day.dayNumber}
            </div>

            <div className="relative z-10 flex-1 text-left min-w-0">
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

            <div className="relative z-10 flex-shrink-0">
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
