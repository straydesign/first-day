"use client";
import { ArrowLeft } from "lucide-react";
import { Footer } from "./Footer";

interface PrivacyPolicyProps {
  onBack: () => void;
  onGetStarted: () => void;
  onNavigate?: (page: string) => void;
}

export function PrivacyPolicy({ onBack, onGetStarted, onNavigate }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-4xl mx-auto px-4 py-12 flex-1">
        <button onClick={onBack} className="mb-8 flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-coral-600 text-coral-600 hover:bg-coral-50 transition-all font-medium">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h2 className="text-2xl font-semibold text-gray-900">1. Information We Collect</h2>
          <p className="text-gray-700">We collect information you provide directly: email address, name, and goal-related data you enter into the app. We also collect usage data to improve our service.</p>
          <h2 className="text-2xl font-semibold text-gray-900">2. How We Use Your Information</h2>
          <p className="text-gray-700">Your information is used to provide and improve our service, generate personalized goal plans, send notification reminders, and communicate with you about your account.</p>
          <h2 className="text-2xl font-semibold text-gray-900">3. Data Storage</h2>
          <p className="text-gray-700">Your data is stored securely using Supabase infrastructure with encryption at rest and in transit. We do not sell your personal information to third parties.</p>
          <h2 className="text-2xl font-semibold text-gray-900">4. Your Rights</h2>
          <p className="text-gray-700">You can delete your account and all associated data at any time through the Settings page. You can also request a copy of your data by contacting us.</p>
          <h2 className="text-2xl font-semibold text-gray-900">5. Contact</h2>
          <p className="text-gray-700">For questions about this privacy policy, please visit <a href="https://straydesign.co" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">straydesign.co</a>.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
