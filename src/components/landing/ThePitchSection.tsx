"use client";

import { MousePointerClick, Smartphone } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { KeyDecisionCallout } from "./KeyDecisionCallout";

interface ThePitchSectionProps {
  onGetStarted: () => void;
}

export function ThePitchSection({ onGetStarted }: ThePitchSectionProps) {
  return (
    <AnimatedSection>
      <section className="w-full py-8 md:py-16 px-0 md:px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-none md:rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 md:px-10 pt-6 md:pt-10 pb-4 text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-slate-800 mb-2">
              Why First Day works.
            </h2>
            <p className="text-teal-700">
              Designed around the science of behavior change.
            </p>
          </div>

          <div className="px-6 md:px-10 pb-6 md:pb-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-teal-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-teal-600">73%</p>
                <p className="text-xs text-gray-600 mt-1">
                  of goal tracking happens on mobile
                </p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">42%</p>
                <p className="text-xs text-gray-600 mt-1">
                  more habit formation with daily journaling
                </p>
              </div>
              <div className="bg-lime-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-lime-600">3x</p>
                <p className="text-xs text-gray-600 mt-1">
                  longer wait tolerance with progress bars
                </p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">7 days</p>
                <p className="text-xs text-gray-600 mt-1">
                  sprint length for optimal focus
                </p>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 mb-8 text-center">
              <p className="text-gray-700 text-lg italic leading-relaxed">
                &quot;I&apos;ve tried every productivity app out there. First
                Day is different because it actually tells me what to do each
                day instead of just letting me organize tasks.&quot;
              </p>
              <p className="text-sm text-teal-600 font-medium mt-3">
                — Sarah K., completed &quot;Learn Spanish Basics&quot; in 28
                days
              </p>
            </div>

            {/* Key Decisions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KeyDecisionCallout
                number={9}
                icon={MousePointerClick}
                title="Scroll-Triggered Animations"
                description="Progressive disclosure reduces initial cognitive overload by revealing content as users scroll"
              />
              <KeyDecisionCallout
                number={10}
                icon={Smartphone}
                title="Mobile-First Design"
                description="73% of goal tracking happens on phones. Designed for one-thumb use."
              />
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
