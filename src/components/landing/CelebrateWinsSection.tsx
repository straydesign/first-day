"use client";

import { Trophy, Palette } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { PhoneMockup } from "./PhoneMockup";
import { KeyDecisionCallout } from "./KeyDecisionCallout";

interface CelebrateWinsSectionProps {
  onGetStarted: () => void;
}

export function CelebrateWinsSection({ onGetStarted }: CelebrateWinsSectionProps) {
  return (
    <AnimatedSection>
      <section className="w-full py-8 md:py-16 px-4">
        {/* Section heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Every milestone deserves a moment.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Celebrate completed weeks with confetti, XP breakdowns, and badge unlocks.
          </p>
        </div>

        {/* Layout: Text LEFT, Mockup RIGHT on desktop */}
        <div className="md:grid md:grid-cols-2 gap-8 items-center">
          {/* Text + Key Decisions — below mockup on mobile, left on desktop */}
          <div className="order-2 md:order-1 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Dopamine hits that keep you coming back
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Variable rewards, XP streaks, and badge unlocks turn daily effort
                into a progression system that feels genuinely satisfying.
              </p>
            </div>

            <div className="space-y-3">
              <KeyDecisionCallout
                number={7}
                icon={Trophy}
                title="Gamification System"
                description="Variable reward schedules drive daily engagement through XP, streaks, and badges"
              />
              <KeyDecisionCallout
                number={8}
                icon={Palette}
                title="Aurora Background"
                description="Ambient animated environment that reduces cognitive load and creates a premium feel"
              />
            </div>
          </div>

          {/* Phone mockup — shows first on mobile, right on desktop */}
          <div className="order-1 md:order-2 mb-10 md:mb-0">
            <PhoneMockup>
              <CongratsScreenContent />
            </PhoneMockup>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

function CongratsScreenContent() {
  return (
    <div className="-mx-4 -mt-14 px-4 pt-14 pb-6 bg-gradient-to-br from-green-100 via-cyan-100 to-indigo-200 min-h-[520px]">
      {/* Confetti emoji */}
      <p className="text-5xl text-center mb-4">🎉</p>

      {/* Heading */}
      <h3 className="text-2xl font-bold text-slate-800 text-center mb-5">
        Day 7 Complete!
      </h3>

      {/* XP Breakdown card */}
      <div className="bg-white/80 backdrop-blur rounded-xl p-4 mb-4">
        <p className="font-bold text-lg text-gray-900 mb-2">+85 XP Earned</p>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Day complete</span>
            <span className="text-lime-600 font-semibold">+25 XP</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">All activities</span>
            <span className="text-lime-600 font-semibold">+35 XP</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Reflection</span>
            <span className="text-lime-600 font-semibold">+15 XP</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Streak bonus</span>
            <span className="text-yellow-600 font-semibold">+10 XP</span>
          </div>
        </div>
      </div>

      {/* Badge unlock card */}
      <div className="bg-white/80 backdrop-blur rounded-xl p-4 mb-4">
        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">
          Badge Unlocked!
        </p>
        <p className="inline-flex items-center gap-2 text-lg font-bold text-gray-900 mb-1">
          ⭐ Perfect Week
        </p>
        <p className="text-xs text-gray-500">
          Complete every activity for 7 consecutive days
        </p>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center bg-white/60 rounded-lg py-2">
          <p className="text-lg font-bold text-gray-900">🔥 12</p>
          <p className="text-xs text-gray-500">Streak</p>
        </div>
        <div className="text-center bg-white/60 rounded-lg py-2">
          <p className="text-lg font-bold text-gray-900">⚡ 1,450</p>
          <p className="text-xs text-gray-500">Total XP</p>
        </div>
        <div className="text-center bg-white/60 rounded-lg py-2">
          <p className="text-lg font-bold text-gray-900">🏆 5/8</p>
          <p className="text-xs text-gray-500">Badges</p>
        </div>
      </div>
    </div>
  );
}
