"use client";

import Aurora from "../Aurora";
import { Footer } from "../Footer";
import { HeroSection } from "./HeroSection";
import { TypeYourDreamSection } from "./TypeYourDreamSection";
import { GetYourPlanSection } from "./GetYourPlanSection";
import { DoTheWorkSection } from "./DoTheWorkSection";
import { CelebrateWinsSection } from "./CelebrateWinsSection";
import { ThePitchSection } from "./ThePitchSection";
import { GetStartedSection } from "./GetStartedSection";

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
  onPrivacyPolicy: () => void;
  onTermsOfService: () => void;
}

export function LandingPage({ onGetStarted, onLogin, onPrivacyPolicy, onTermsOfService }: LandingPageProps) {
  return (
    <div className="min-h-screen relative bg-black">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0 w-full h-full">
        <Aurora colorStops={["#7cff67", "#00c7fc", "#5227FF"]} />
      </div>

      {/* Content */}
      <div className="relative z-10 pt-[44px]">
        {/* 1. Hero */}
        <HeroSection onGetStarted={onGetStarted} onLogin={onLogin} />

        {/* 2. Type Your Dream — even (white card) */}
        <TypeYourDreamSection onGetStarted={onGetStarted} />

        {/* 3. Get Your Plan — odd (aurora pass-through) */}
        <GetYourPlanSection onGetStarted={onGetStarted} />

        {/* 4. Do The Work — even (white card) */}
        <DoTheWorkSection onGetStarted={onGetStarted} />

        {/* 5. Celebrate Wins — odd (aurora pass-through) */}
        <CelebrateWinsSection onGetStarted={onGetStarted} />

        {/* 6. The Pitch — even (white card) */}
        <ThePitchSection onGetStarted={onGetStarted} />

        {/* 7. Get Started — odd (aurora pass-through) */}
        <GetStartedSection onGetStarted={onGetStarted} />

        {/* 8. Footer */}
        <Footer onPrivacyClick={onPrivacyPolicy} onTermsClick={onTermsOfService} />
      </div>
    </div>
  );
}
