"use client";
import { Button } from "@/components/ui/button";
import { PartyPopper, Calendar, ArrowRight } from "lucide-react";
import Aurora from "./Aurora";
import { AURORA_COLORS } from "@/constants";

interface CongratsViewProps {
  onViewCalendar: () => void;
  onDoMore: () => void;
  goalTitle?: string;
  dayNumber?: number;
  totalDays?: number;
}

export function CongratsView({ onViewCalendar, onDoMore, goalTitle, dayNumber, totalDays = 30 }: CongratsViewProps) {
  const daysRemaining = dayNumber ? totalDays - dayNumber : null;

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <div className="fixed inset-0 z-0 w-full h-full">
        <Aurora colorStops={[...AURORA_COLORS]} />
      </div>
      <div className="relative z-10 flex items-center justify-center p-6 pt-12 md:pt-20 min-h-[80vh] md:min-h-screen">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-full bg-lime-500 mb-4 md:mb-6 shadow-lg motion-safe:animate-bounce">
            <PartyPopper className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-2 text-slate-800 animate-fadeIn">
            {dayNumber ? `Day ${dayNumber} Complete!` : "Congratulations!"}
          </h1>
          {goalTitle && (
            <p className="text-lg md:text-2xl text-teal-800 font-semibold mb-4 animate-fadeIn px-4">
              {goalTitle}
            </p>
          )}
          <p className="text-base md:text-xl text-teal-700 mb-2 animate-slideInUp max-w-lg mx-auto px-4">
            Every step forward is progress toward your goal.
          </p>
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
