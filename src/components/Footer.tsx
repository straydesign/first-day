"use client";

import { VoronoiMosaic } from "./VoronoiMosaic";
import { VORONOI_DARK } from "@/constants";

interface FooterProps {
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
}

export function Footer({ onPrivacyClick, onTermsClick }: FooterProps) {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="relative bg-[#0F1B3A] py-6 mt-auto border-t border-white/10 clip-section-top overflow-hidden">
      <VoronoiMosaic seed={999} tileCount={15} margin={6} gap={2} palette={VORONOI_DARK} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-[#0F1B3A]/60" />
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap gap-4 justify-center mb-4">
          {onPrivacyClick ? (
            <button onClick={onPrivacyClick} className="text-white/80 hover:text-white underline text-sm transition-colors">Privacy Policy</button>
          ) : (
            <a href="/privacy" className="text-white/80 hover:text-white underline text-sm transition-colors">Privacy Policy</a>
          )}
          {onTermsClick ? (
            <button onClick={onTermsClick} className="text-white/80 hover:text-white underline text-sm transition-colors">Terms of Service</button>
          ) : (
            <a href="/terms" className="text-white/80 hover:text-white underline text-sm transition-colors">Terms of Service</a>
          )}
        </div>
        <div className="pt-4 text-center text-white/80 text-xs">
          <p>&copy; {currentYear} First Day. All rights reserved.</p>
          <p className="mt-0.5">
            Contact: <a href="mailto:support@firstday.life" className="text-white underline hover:text-white/80 font-medium">support@firstday.life</a>
          </p>
          <p className="mt-0.5">
            Built by <a href="https://straydesign.co" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-white/80 font-medium">Stray Design</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
