"use client";

import { Button } from "@/components/ui/button";
import { AnimatedSection } from "./AnimatedSection";

interface GetStartedSectionProps {
  onGetStarted: () => void;
}

export function GetStartedSection({ onGetStarted }: GetStartedSectionProps) {
  return (
    <AnimatedSection>
      <section className="w-full py-16 md:py-24 px-4">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4">
            Your first day starts now.
          </h2>
          <p className="text-lg md:text-xl text-teal-700 mb-8">
            Pick a goal. Get a plan. Show up for 30 days.
          </p>
          <Button
            onClick={onGetStarted}
            className="shadow-lg hover:shadow-xl transition-smooth hover:scale-105 px-8 py-6 text-lg"
          >
            Get Started — It&apos;s Free
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required
          </p>
        </div>
      </section>
    </AnimatedSection>
  );
}
