"use client";
import { TopBar } from "@/components/ui/TopBar";
import { Panel } from "@/components/ui/Panel";
import { FONT } from "@/lib/design";


interface PrivacyPolicyProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function PrivacyPolicy({ onBack, onNavigate }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen relative flex flex-col">
      <TopBar title="Privacy Policy" onBack={onBack} />
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-8 pb-6 md:pb-12 flex-1">
        <Panel contentClassName="p-6 md:p-8">
          <div className="prose prose-invert max-w-none space-y-6" style={{ fontFamily: FONT }}>
            <p className="text-white/40 text-sm">Last updated: March 1, 2026</p>

            <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">1. Information We Collect</h2>
            <p className="text-white/70 leading-relaxed">We collect information you provide directly when you create an account and use First Day:</p>
            <ul className="list-disc pl-6 text-white/70 leading-relaxed space-y-1">
              <li><strong className="text-white/90 font-medium">Account information:</strong> Email address and authentication credentials</li>
              <li><strong className="text-white/90 font-medium">Goal data:</strong> Goals you create, your experience level, motivations, and preferences</li>
              <li><strong className="text-white/90 font-medium">Progress data:</strong> Activity completions, daily reflections, and streak information</li>
              <li><strong className="text-white/90 font-medium">Usage data:</strong> Pages visited, features used, and general interaction patterns to improve the service</li>
            </ul>

            <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">2. How We Use Your Information</h2>
            <p className="text-white/70 leading-relaxed">Your information is used to:</p>
            <ul className="list-disc pl-6 text-white/70 leading-relaxed space-y-1">
              <li>Create and manage your account</li>
              <li>Generate personalized 4-sprint plans using AI (see Section 4)</li>
              <li>Track your progress and provide daily activities</li>
              <li>Send daily email reminders if you have notifications enabled</li>
              <li>Improve and maintain the service</li>
            </ul>

            <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">3. Data Storage and Security</h2>
            <p className="text-white/70 leading-relaxed">Your data is stored securely using Supabase infrastructure with encryption at rest and in transit. We implement industry-standard security measures to protect your personal information. We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>

            <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">4. AI Processing</h2>
            <p className="text-white/70 leading-relaxed">First Day uses AI (powered by Anthropic&apos;s Claude API) to generate your personalized 4-sprint plans. When you create a goal, the following data is sent to the AI service for plan generation:</p>
            <ul className="list-disc pl-6 text-white/70 leading-relaxed space-y-1">
              <li>Your goal description and motivation</li>
              <li>Your experience level and learning preferences</li>
            </ul>
            <p className="text-white/70 leading-relaxed">This data is used solely to generate your plan and is not stored by the AI provider beyond the request. We do not use your data to train AI models.</p>

            <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">5. Cookies and Analytics</h2>
            <p className="text-white/70 leading-relaxed">First Day uses essential cookies required for authentication and session management. We do not use third-party advertising cookies or tracking pixels. We may use privacy-respecting analytics to understand general usage patterns and improve the service.</p>

            <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">6. Data Retention</h2>
            <p className="text-white/70 leading-relaxed">We retain your data for as long as your account is active. If you delete your account, all associated data — including goals, plans, and progress — is permanently removed from our systems within 30 days. Backups containing your data are purged within 90 days of account deletion.</p>

            <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">7. Your Rights</h2>
            <p className="text-white/70 leading-relaxed">You have the right to:</p>
            <ul className="list-disc pl-6 text-white/70 leading-relaxed space-y-1">
              <li><strong className="text-white/90 font-medium">Access:</strong> Request a copy of your personal data at any time</li>
              <li><strong className="text-white/90 font-medium">Delete:</strong> Delete your account and all associated data through the Settings page</li>
              <li><strong className="text-white/90 font-medium">Correct:</strong> Update your account information</li>
              <li><strong className="text-white/90 font-medium">Portability:</strong> Request your data in a machine-readable format</li>
              <li><strong className="text-white/90 font-medium">Opt out:</strong> Disable email notifications at any time</li>
            </ul>
            <p className="text-white/70 leading-relaxed">If you are located in the EU/EEA (GDPR) or California (CCPA), you may have additional rights including the right to restrict processing and the right to object to processing. To exercise any of these rights, contact us at the address below.</p>

            <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">8. Children&apos;s Privacy</h2>
            <p className="text-white/70 leading-relaxed">First Day is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such data, please contact us immediately.</p>

            <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">9. Changes to This Policy</h2>
            <p className="text-white/70 leading-relaxed">We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.</p>

            <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">10. Contact</h2>
            <p className="text-white/70 leading-relaxed">For questions about this privacy policy or to exercise your data rights, contact us at <a href="mailto:support@firstday.life" className="text-white font-medium hover:underline">support@firstday.life</a>.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
