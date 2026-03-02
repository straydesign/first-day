"use client";
import { BackButton } from "@/components/ui/back-button";
import { Footer } from "./Footer";

interface TermsOfServiceProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function TermsOfService({ onBack, onNavigate }: TermsOfServiceProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12 flex-1">
        <BackButton onClick={onBack} />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-8">Terms of Service</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h2 className="text-2xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
          <p className="text-gray-700">By using First Day, you agree to these terms. If you do not agree, please do not use the service.</p>
          <h2 className="text-2xl font-semibold text-gray-900">2. Description of Service</h2>
          <p className="text-gray-700">First Day provides AI-generated 30-day goal plans to help you achieve your personal goals. Plans are generated using artificial intelligence and should be used as guidance.</p>
          <h2 className="text-2xl font-semibold text-gray-900">3. User Accounts</h2>
          <p className="text-gray-700">You are responsible for maintaining the security of your account and password. You must provide accurate information when creating your account.</p>
          <h2 className="text-2xl font-semibold text-gray-900">4. Acceptable Use</h2>
          <p className="text-gray-700">You agree not to misuse the service, attempt to access other users&apos; data, or use the service for any illegal purpose.</p>
          <h2 className="text-2xl font-semibold text-gray-900">5. Limitation of Liability</h2>
          <p className="text-gray-700">First Day is provided &quot;as is&quot; without warranties. We are not liable for any damages arising from your use of the service.</p>
          <h2 className="text-2xl font-semibold text-gray-900">6. Contact</h2>
          <p className="text-gray-700">For questions about these terms, please visit <a href="https://straydesign.co" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">straydesign.co</a>.</p>
        </div>
      </div>
      <Footer onPrivacyClick={() => onNavigate?.("privacy")} onTermsClick={() => {}} />
    </div>
  );
}
