"use client";
import { Button } from "@/components/ui/button";
import { PartyPopper, Calendar, Plus } from "lucide-react";
import Aurora from "./Aurora";

export function CongratsView({ onViewCalendar, onDoMore }: { onViewCalendar: () => void; onDoMore: () => void }) {
  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      <div className="fixed inset-0 z-0 w-full h-full">
        <Aurora colorStops={["#7cff67", "#00c7fc", "#5227FF"]} />
      </div>
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 pt-20">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-coral-500 mb-6 shadow-lg animate-bounce">
            <PartyPopper className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-coral-900 animate-fadeIn">Congratulations!</h1>
          <p className="text-base md:text-xl text-coral-700 mb-8 md:mb-12 animate-slideInUp max-w-lg mx-auto px-4">
            You&apos;ve completed today&apos;s activities. Every step forward is progress toward your best self.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Button onClick={onViewCalendar} variant="outline" className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg border-2 border-coral-600 text-coral-600 hover:bg-coral-50 shadow-md hover:shadow-lg transition-smooth hover:scale-105 bg-white">
              <Calendar className="mr-2 w-5 h-5 flex-shrink-0" />View Calendar
            </Button>
            <Button onClick={onDoMore} className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transition-smooth hover:scale-105">
              <Plus className="mr-2 w-5 h-5 flex-shrink-0" /><span className="whitespace-nowrap">More Activities</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
