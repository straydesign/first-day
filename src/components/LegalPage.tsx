"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/ui/back-button";
import { Footer } from "./Footer";
import { useMonotone } from "./MonotoneContext";
import { VORONOI_LIGHT } from "@/constants";
import { VoronoiMosaic } from "./VoronoiMosaic";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

type LegalTab = "privacy" | "terms";

interface LegalPageProps {
  onBack: () => void;
  initialTab?: LegalTab;
  onTabChange?: (tab: LegalTab) => void;
}

const TAB_CLIPS = [
  "polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)",
  "polygon(0% 0%, 94% 0%, 100% 100%, 6% 100%)",
];

export function LegalPage({ onBack, initialTab = "privacy", onTabChange }: LegalPageProps) {
  const { monotone } = useMonotone();
  const [tab, setTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const switchTab = (next: LegalTab) => {
    if (next === tab) return;
    setTab(next);
    onTabChange?.(next);
  };

  const accent = monotone ? "#FFFFFF" : VORONOI_LIGHT[0];
  const inactive = monotone ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.05)";

  return (
    <div className="min-h-screen relative flex flex-col">
      <VoronoiMosaic seed={3201} tileCount={80} margin={6} gap={3} palette={PANEL_DARK_PALETTE} className="fixed inset-0 w-full h-full pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-[84px] pb-6 md:pb-12 flex-1 w-full">
        <BackButton onClick={onBack} />

        <h1
          className="text-4xl md:text-6xl font-black uppercase text-white mb-6 md:mb-8 leading-[0.95]"
          style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif", letterSpacing: 1 }}
        >
          {tab === "privacy" ? "Privacy Policy" : "Terms of Service"}
        </h1>

        <div className="flex gap-2 mb-8" role="tablist" aria-label="Legal documents">
          {(["privacy", "terms"] as const).map((t, i) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`legal-panel-${t}`}
                onClick={() => switchTab(t)}
                className="px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-base font-black uppercase tracking-wide transition-colors"
                style={{
                  backgroundColor: active ? accent : inactive,
                  color: active ? "#000000" : "rgba(255,255,255,0.65)",
                  clipPath: TAB_CLIPS[i],
                  fontFamily: "var(--font-bebas), system-ui, sans-serif",
                  letterSpacing: 1.5,
                }}
              >
                {t === "privacy" ? "Privacy" : "Terms"}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            id={`legal-panel-${tab}`}
            role="tabpanel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="prose prose-invert max-w-none space-y-6"
          >
            {tab === "privacy" ? <PrivacyContent /> : <TermsContent />}
          </motion.div>
        </AnimatePresence>
      </div>
      <Footer
        onPrivacyClick={() => switchTab("privacy")}
        onTermsClick={() => switchTab("terms")}
      />
    </div>
  );
}

function PrivacyContent() {
  return (
    <>
      <p className="text-white/80">Last updated: March 1, 2026</p>

      <h2 className="text-2xl font-semibold text-white">1. Information We Collect</h2>
      <p className="text-white/80">We collect information you provide directly when you create an account and use First Day:</p>
      <ul className="list-disc pl-6 text-white/80 space-y-1">
        <li><strong>Account information:</strong> Email address and authentication credentials</li>
        <li><strong>Goal data:</strong> Goals you create, your experience level, motivations, and preferences</li>
        <li><strong>Progress data:</strong> Activity completions, daily reflections, and streak information</li>
        <li><strong>Usage data:</strong> Pages visited, features used, and general interaction patterns to improve the service</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white">2. How We Use Your Information</h2>
      <p className="text-white/80">Your information is used to:</p>
      <ul className="list-disc pl-6 text-white/80 space-y-1">
        <li>Create and manage your account</li>
        <li>Generate personalized 30-day plans using AI (see Section 4)</li>
        <li>Track your progress and provide daily activities</li>
        <li>Send daily email reminders if you have notifications enabled</li>
        <li>Improve and maintain the service</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white">3. Data Storage and Security</h2>
      <p className="text-white/80">Your data is stored securely using Supabase infrastructure with encryption at rest and in transit. We implement industry-standard security measures to protect your personal information. We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>

      <h2 className="text-2xl font-semibold text-white">4. AI Processing</h2>
      <p className="text-white/80">First Day uses AI (powered by Anthropic&apos;s Claude API) to generate your personalized 30-day plans. When you create a goal, the following data is sent to the AI service for plan generation:</p>
      <ul className="list-disc pl-6 text-white/80 space-y-1">
        <li>Your goal description and motivation</li>
        <li>Your experience level and learning preferences</li>
      </ul>
      <p className="text-white/80">This data is used solely to generate your plan and is not stored by the AI provider beyond the request. We do not use your data to train AI models.</p>

      <h2 className="text-2xl font-semibold text-white">5. Cookies and Analytics</h2>
      <p className="text-white/80">First Day uses essential cookies required for authentication and session management. We do not use third-party advertising cookies or tracking pixels. We may use privacy-respecting analytics to understand general usage patterns and improve the service.</p>

      <h2 className="text-2xl font-semibold text-white">6. Data Retention</h2>
      <p className="text-white/80">We retain your data for as long as your account is active. If you delete your account, all associated data — including goals, plans, and progress — is permanently removed from our systems within 30 days. Backups containing your data are purged within 90 days of account deletion.</p>

      <h2 className="text-2xl font-semibold text-white">7. Your Rights</h2>
      <p className="text-white/80">You have the right to:</p>
      <ul className="list-disc pl-6 text-white/80 space-y-1">
        <li><strong>Access:</strong> Request a copy of your personal data at any time</li>
        <li><strong>Delete:</strong> Delete your account and all associated data through the Settings page</li>
        <li><strong>Correct:</strong> Update your account information</li>
        <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
        <li><strong>Opt out:</strong> Disable email notifications at any time</li>
      </ul>
      <p className="text-white/80">If you are located in the EU/EEA (GDPR) or California (CCPA), you may have additional rights including the right to restrict processing and the right to object to processing. To exercise any of these rights, contact us at the address below.</p>

      <h2 className="text-2xl font-semibold text-white">8. Children&apos;s Privacy</h2>
      <p className="text-white/80">First Day is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such data, please contact us immediately.</p>

      <h2 className="text-2xl font-semibold text-white">9. Changes to This Policy</h2>
      <p className="text-white/80">We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.</p>

      <h2 className="text-2xl font-semibold text-white">10. Contact</h2>
      <p className="text-white/80">For questions about this privacy policy or to exercise your data rights, contact us at <a href="mailto:support@firstday.life" className="text-white font-bold hover:underline">support@firstday.life</a>.</p>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <p className="text-white/80">Last updated: March 1, 2026</p>

      <h2 className="text-2xl font-semibold text-white">1. Acceptance of Terms</h2>
      <p className="text-white/80">By creating an account or using First Day, you agree to these terms. If you do not agree, please do not use the service.</p>

      <h2 className="text-2xl font-semibold text-white">2. Description of Service</h2>
      <p className="text-white/80">First Day is a goal achievement platform that uses AI to generate personalized 30-day plans with daily activities, resource recommendations, and progress tracking. Plans are tailored to your stated goals, experience level, and preferences.</p>

      <h2 className="text-2xl font-semibold text-white">3. User Accounts</h2>
      <p className="text-white/80">You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating your account. You may not share your account with others or create multiple accounts.</p>

      <h2 className="text-2xl font-semibold text-white">4. AI-Generated Content</h2>
      <p className="text-white/80">Plans, activities, and recommendations generated by First Day are created using artificial intelligence. While we strive for quality and relevance, AI-generated content:</p>
      <ul className="list-disc pl-6 text-white/80 space-y-1">
        <li>Is provided as guidance and suggestions, not professional advice</li>
        <li>May not be perfectly accurate or suitable for every individual</li>
        <li>Should not replace professional medical, fitness, financial, or legal advice</li>
        <li>May include links to third-party resources that we do not control or endorse</li>
      </ul>
      <p className="text-white/80">You are responsible for evaluating whether any suggested activities are appropriate for your situation.</p>

      <h2 className="text-2xl font-semibold text-white">5. Content Ownership</h2>
      <p className="text-white/80">You retain ownership of any content you create on First Day, including your goals, reflections, and progress notes. By using the service, you grant us a limited license to store and process your content solely for the purpose of providing the service to you. AI-generated plans are provided for your personal use.</p>

      <h2 className="text-2xl font-semibold text-white">6. Acceptable Use</h2>
      <p className="text-white/80">You agree not to:</p>
      <ul className="list-disc pl-6 text-white/80 space-y-1">
        <li>Misuse the service or attempt to access other users&apos; data</li>
        <li>Use the service for any illegal purpose</li>
        <li>Attempt to reverse engineer, scrape, or extract data from the service</li>
        <li>Use automated tools to access the service beyond normal usage</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white">7. Service Availability</h2>
      <p className="text-white/80">We aim to keep First Day available and reliable, but we do not guarantee uninterrupted access. The service may be temporarily unavailable for maintenance, updates, or due to circumstances beyond our control. We reserve the right to modify, suspend, or discontinue features of the service with reasonable notice.</p>

      <h2 className="text-2xl font-semibold text-white">8. Account Termination</h2>
      <p className="text-white/80">You may delete your account at any time through the Settings page. We may suspend or terminate accounts that violate these terms. Upon termination, your data will be deleted in accordance with our Privacy Policy.</p>

      <h2 className="text-2xl font-semibold text-white">9. Limitation of Liability</h2>
      <p className="text-white/80">First Day is provided &quot;as is&quot; without warranties of any kind, either express or implied. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including but not limited to any outcomes from following AI-generated plans or recommendations.</p>

      <h2 className="text-2xl font-semibold text-white">10. Changes to Terms</h2>
      <p className="text-white/80">We may update these terms from time to time. We will notify you of material changes by posting the updated terms on this page. Continued use of the service after changes constitutes acceptance of the new terms.</p>

      <h2 className="text-2xl font-semibold text-white">11. Contact</h2>
      <p className="text-white/80">For questions about these terms, contact us at <a href="mailto:support@firstday.life" className="text-white font-bold hover:underline">support@firstday.life</a>.</p>
    </>
  );
}
