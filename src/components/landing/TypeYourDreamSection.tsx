"use client";

import { MessageSquare, Target } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { PhoneMockup } from "./PhoneMockup";
import { KeyDecisionCallout } from "./KeyDecisionCallout";

interface TypeYourDreamSectionProps {
  onGetStarted: () => void;
}

export function TypeYourDreamSection({ onGetStarted }: TypeYourDreamSectionProps) {
  return (
    <AnimatedSection>
      <section className="w-full py-8 md:py-16 px-0 md:px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-none md:rounded-2xl shadow-2xl overflow-hidden px-6 md:px-10 py-10 md:py-16">
          <div className="md:grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Text + Key Decisions */}
            <div className="space-y-6 mb-10 md:mb-0">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Say what matters in your own words.
              </h2>
              <p className="text-gray-600 text-lg">
                Describe your goal. Answer a few quick questions. First Day handles the rest.
              </p>
            </div>

            <div className="space-y-3">
              <KeyDecisionCallout
                number={1}
                icon={MessageSquare}
                title="Goal Context Questions"
                description="Ask experience level, motivation, and time commitment to personalize plans"
              />
              <KeyDecisionCallout
                number={2}
                icon={Target}
                title="One Goal at a Time"
                description="Deliberately limit to one active goal. Research shows multiple goals cancel each other out."
              />
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div>
            <PhoneMockup>
              {/* Goal creation form mockup */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                    What&apos;s your goal?
                  </label>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-900 text-sm">Learn to play guitar</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                    Why does this matter to you?
                  </label>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-600 text-sm italic">
                      I&apos;ve always wanted to jam with friends
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                    Experience level
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center py-2 rounded-full text-sm font-medium bg-teal-600 text-white">
                      Beginner
                    </div>
                    <div className="flex-1 text-center py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-600">
                      Some experience
                    </div>
                    <div className="flex-1 text-center py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-600">
                      Advanced
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold text-sm"
                  onClick={onGetStarted}
                >
                  Generate My Plan
                </button>
              </div>
            </PhoneMockup>
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
