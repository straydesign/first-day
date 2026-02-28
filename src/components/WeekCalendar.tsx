"use client";
import { CheckCircle2, Circle } from "lucide-react";

interface WeekCalendarProps {
  weekNumber: number;
  days: Array<{ dayNumber: number; date: Date; dayOfWeek: number; isToday: boolean; }>;
  progress?: Record<number, { completed?: boolean }>;
  onDayClick?: (day: any) => void;
  planData?: any;
  compact?: boolean;
  startDate?: string;
}

export function WeekCalendar({ weekNumber, days, progress = {}, onDayClick, planData, startDate }: WeekCalendarProps) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const goalStartDate = startDate ? new Date(startDate) : null;
  if (goalStartDate) goalStartDate.setHours(0, 0, 0, 0);

  const paddingCells = weekNumber === 1 && days.length > 0 ? days[0].dayOfWeek : 0;
  const emptyPadding = Array.from({ length: paddingCells }, (_, i) => ({ isEmpty: true, key: `padding-${i}` }));

  return (
    <div>
      <h3 className="text-sm md:text-lg text-teal-900 mb-2 md:mb-3">Week {weekNumber}</h3>
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1">
        {dayNames.map((dayName) => (
          <div key={dayName} className="text-center text-[10px] md:text-xs font-semibold text-teal-700 uppercase">{dayName}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {emptyPadding.map((padding) => (<div key={padding.key} className="aspect-square opacity-0" />))}
        {days.map((day) => {
          const dayData = planData?.days?.[day.dayNumber] || { activities: ["Review your progress", "Take one small action", "Reflect on your journey"] };
          const isCompleted = progress[day.dayNumber]?.completed || false;
          const isPast = day.date < today;
          const isFuture = day.date > today;
          const isBeforeStart = weekNumber === 1 && goalStartDate && day.date < goalStartDate;

          return (
            <button key={day.dayNumber} onClick={() => { if (isBeforeStart) return; onDayClick?.({ number: day.dayNumber, date: day.date.toISOString(), dateDisplay: day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), ...dayData }); }} disabled={!!isBeforeStart}
              className={`aspect-square p-1 md:p-2 rounded border md:border-2 transition-smooth relative flex flex-col items-center justify-center ${
                isBeforeStart ? 'border-transparent bg-transparent cursor-default opacity-0'
                : day.isToday ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-teal-100 shadow-md hover:shadow-md active:scale-95 md:hover:scale-105'
                : isCompleted ? 'border-lime-400 bg-lime-50 shadow-sm hover:shadow-md active:scale-95 md:hover:scale-105'
                : isPast && !isCompleted ? 'border-coral-300 bg-coral-50/50 hover:shadow-md active:scale-95 md:hover:scale-105'
                : 'border-teal-200 hover:border-teal-400 hover:bg-teal-50 hover:shadow-md active:scale-95 md:hover:scale-105'
              }`}>
              {!isBeforeStart && (<>
                <div className={`text-xs md:text-sm leading-none font-medium mb-1 ${isCompleted && isPast ? 'text-green-600' : day.isToday && !isCompleted ? 'text-blue-900' : isPast && !isCompleted ? 'text-coral-600' : isFuture ? 'text-blue-900' : 'text-coral-600'}`}>{dayNames[day.dayOfWeek]}</div>
                <div className="mt-0.5 md:mt-1">
                  {isCompleted ? <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-lime-500" /> : <Circle className={`w-3 h-3 md:w-4 md:h-4 ${day.isToday ? 'text-blue-600' : isPast ? 'text-coral-600' : 'text-teal-400'}`} />}
                </div>
                {day.isToday && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-coral-500 rounded-full animate-pulse" />}
              </>)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
