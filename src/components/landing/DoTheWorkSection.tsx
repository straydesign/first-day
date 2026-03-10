"use client";

import { Check, Youtube, PenLine } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { PhoneMockup } from "./PhoneMockup";
import { KeyDecisionCallout } from "./KeyDecisionCallout";

interface DoTheWorkSectionProps {
  onGetStarted: () => void;
}

export function DoTheWorkSection({ onGetStarted }: DoTheWorkSectionProps) {
  return (
    <AnimatedSection>
      <section className="w-full py-8 md:py-16 px-0 md:px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-none md:rounded-2xl shadow-2xl overflow-hidden px-6 md:px-10 py-10 md:py-16">
        {/* Section heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Check off tasks. Watch momentum build.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Every day has clear activities, curated resources, and space to reflect.
          </p>
        </div>

        {/* Layout: Mockup LEFT, Text RIGHT on desktop */}
        <div className="md:grid md:grid-cols-[1fr_1fr] gap-8 items-center">
          {/* Phone mockup — shows first on mobile, left on desktop */}
          <div className="mb-10 md:mb-0">
            <PhoneMockup>
              <DayViewContent />
            </PhoneMockup>
          </div>

          {/* Text + Key Decisions */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                A day that&apos;s already planned for you
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Each day comes with curated activities, hand-picked resources,
                and a reflection prompt. Just open the app and start.
              </p>
            </div>

            <div className="space-y-3">
              <KeyDecisionCallout
                number={5}
                icon={Youtube}
                title="Resource Curation"
                description="AI selects YouTube tutorials and articles for each day's activities"
              />
              <KeyDecisionCallout
                number={6}
                icon={PenLine}
                title="Daily Reflections"
                description="Journaling about progress increases habit formation by 42%"
              />
            </div>
          </div>
        </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

function DayViewContent() {
  return (
    <>
      {/* Day header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-lg">
          5
        </div>
        <div>
          <h4 className="text-base font-bold text-gray-900">
            Day 5: Your First Song
          </h4>
          <p className="text-xs text-gray-500">Today&apos;s activities</p>
        </div>
      </div>

      {/* Activity list */}
      <div className="space-y-3">
        {/* Activity 1 — Checked */}
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-lime-500 flex items-center justify-center mt-0.5">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
          <p className="text-sm text-gray-700 line-through decoration-gray-300">
            Practice Am, C, G chord shapes for 10 minutes
          </p>
        </div>

        {/* Activity 2 — Checked + YouTube badge */}
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-lime-500 flex items-center justify-center mt-0.5">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
          <div>
            <p className="text-sm text-gray-700 line-through decoration-gray-300 mb-1.5">
              Learn to play &ldquo;Horse With No Name&rdquo;
            </p>
            <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-medium rounded-md px-2 py-1">
              <Youtube className="w-3.5 h-3.5" />
              Watch Tutorial
            </div>
          </div>
        </div>

        {/* Activity 3 — Unchecked */}
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 mt-0.5" />
          <p className="text-sm text-gray-700">
            Record yourself playing and listen back
          </p>
        </div>
      </div>

      {/* Reflection textarea */}
      <div className="mt-5">
        <p className="text-xs font-medium text-gray-500 mb-1.5">
          Daily Reflection
        </p>
        <div className="bg-gray-50 rounded-xl p-3 min-h-[72px]">
          <p className="text-sm text-gray-400 italic">How did today go?</p>
        </div>
      </div>
    </>
  );
}
