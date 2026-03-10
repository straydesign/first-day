"use client";

import { Calendar, Hourglass, Check } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { PhoneMockup } from "./PhoneMockup";
import { KeyDecisionCallout } from "./KeyDecisionCallout";

interface GetYourPlanSectionProps {
  onGetStarted: () => void;
}

const WEEK_DAYS = [
  { day: 1, name: "Monday", status: "completed" },
  { day: 2, name: "Tuesday", status: "completed" },
  { day: 3, name: "Wednesday", status: "completed" },
  { day: 4, name: "Thursday", status: "completed" },
  { day: 5, name: "Friday", status: "today" },
  { day: 6, name: "Saturday", status: "upcoming" },
  { day: 7, name: "Sunday", status: "upcoming" },
] as const;

export function GetYourPlanSection({ onGetStarted }: GetYourPlanSectionProps) {
  return (
    <AnimatedSection className="py-16 md:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            AI turns it into 7 days of action.
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            A personalized plan built from your answers — ready in seconds.
          </p>
        </div>

        {/* Two phone mockups side by side */}
        <div className="flex flex-col md:flex-row gap-6 justify-center mb-10">
          {/* Phone 1: Loading Screen */}
          <PhoneMockup>
            <div className="-mx-4 -mt-14 -mb-6">
              <div className="bg-gradient-to-br from-green-200 via-cyan-200 to-indigo-300 min-h-[520px] flex flex-col items-center justify-center px-6">
                <p className="text-slate-700 font-medium text-lg mb-4">
                  Building your plan...
                </p>
                <div className="h-2 bg-white/40 rounded-full w-48 mx-auto">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{ width: "65%" }}
                  />
                </div>
                <p className="text-sm text-slate-500 mt-3">
                  Analyzing your goals...
                </p>
              </div>
            </div>
          </PhoneMockup>

          {/* Phone 2: Week Calendar */}
          <PhoneMockup>
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">Week 1</h3>
                  <p className="text-xs text-gray-500">Getting Started</p>
                </div>
              </div>

              {/* Day rows */}
              <div className="space-y-2">
                {WEEK_DAYS.map((item) => (
                  <div
                    key={item.day}
                    className="flex items-center gap-3 py-1.5"
                  >
                    {/* Day circle */}
                    {item.status === "completed" ? (
                      <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    ) : item.status === "today" ? (
                      <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{item.day}</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400 text-xs font-bold">{item.day}</span>
                      </div>
                    )}

                    {/* Day name */}
                    <span
                      className={`text-sm font-medium flex-1 ${
                        item.status === "upcoming" ? "text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {item.name}
                    </span>

                    {/* Status */}
                    {item.status === "completed" && (
                      <span className="text-xs text-lime-600 font-medium">Completed</span>
                    )}
                    {item.status === "today" && (
                      <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        Today
                      </span>
                    )}
                    {item.status === "upcoming" && (
                      <span className="text-xs text-gray-400">Upcoming</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </PhoneMockup>
        </div>

        {/* Key decisions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
          <KeyDecisionCallout
            number={3}
            icon={Calendar}
            title="Weekly Sprints"
            description="Generate 7 days at a time so plans are digestible and can adapt"
          />
          <KeyDecisionCallout
            number={4}
            icon={Hourglass}
            title="Loading Progress Bar"
            description="Fast-start easing makes 15s generation feel intentional. Users wait 3x longer with progress indicators."
          />
        </div>
      </div>
    </AnimatedSection>
  );
}
