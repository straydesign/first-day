"use client";

interface FooterProps {
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
}

export function Footer({ onPrivacyClick, onTermsClick }: FooterProps) {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white/80 backdrop-blur border-t border-gray-200 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            &copy; {currentYear} First Day. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
            {onPrivacyClick ? (
              <button onClick={onPrivacyClick} className="text-gray-600 hover:text-teal-700 underline text-sm transition-smooth hover:scale-105">Privacy Policy</button>
            ) : (
              <a href="/privacy" className="text-gray-600 hover:text-teal-700 underline text-sm transition-smooth hover:scale-105">Privacy Policy</a>
            )}
            {onTermsClick ? (
              <button onClick={onTermsClick} className="text-gray-600 hover:text-teal-700 underline text-sm transition-smooth hover:scale-105">Terms of Service</button>
            ) : (
              <a href="/terms" className="text-gray-600 hover:text-teal-700 underline text-sm transition-smooth hover:scale-105">Terms of Service</a>
            )}
            <a href="https://straydesign.co" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-teal-700 underline text-sm transition-smooth hover:scale-105">Portfolio</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
