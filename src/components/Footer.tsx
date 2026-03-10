"use client";

interface FooterProps {
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
}

export function Footer({ onPrivacyClick, onTermsClick }: FooterProps) {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-100 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap gap-4 justify-center mb-4">
          {onPrivacyClick ? (
            <button onClick={onPrivacyClick} className="text-gray-600 hover:text-teal-700 underline text-sm transition-colors">Privacy Policy</button>
          ) : (
            <a href="/privacy" className="text-gray-600 hover:text-teal-700 underline text-sm transition-colors">Privacy Policy</a>
          )}
          {onTermsClick ? (
            <button onClick={onTermsClick} className="text-gray-600 hover:text-teal-700 underline text-sm transition-colors">Terms of Service</button>
          ) : (
            <a href="/terms" className="text-gray-600 hover:text-teal-700 underline text-sm transition-colors">Terms of Service</a>
          )}
        </div>
        <div className="pt-4 text-center text-gray-600 text-xs">
          <p>&copy; {currentYear} First Day. All rights reserved.</p>
          <p className="mt-0.5">
            Contact: <a href="mailto:support@firstday.life" className="text-teal-700 underline hover:text-teal-800">support@firstday.life</a>
          </p>
          <p className="mt-0.5">
            Built by <a href="https://straydesign.co" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline hover:text-teal-800">Stray Design</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
