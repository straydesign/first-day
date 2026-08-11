"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/ui/TopBar";
import { Panel } from "@/components/ui/Panel";
import { FONT } from "@/lib/design";
import { COPY } from "@/content/copy";
import { screenTitle } from "@/content/flow";


type LegalTab = "privacy" | "terms";

interface LegalPageProps {
  onBack: () => void;
  initialTab?: LegalTab;
  onTabChange?: (tab: LegalTab) => void;
}

export function LegalPage({ onBack, initialTab = "privacy", onTabChange }: LegalPageProps) {
  const [tab, setTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const switchTab = (next: LegalTab) => {
    if (next === tab) return;
    setTab(next);
    onTabChange?.(next);
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <TopBar
        title={screenTitle(tab)}
        onBack={onBack}
      />
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-8 pb-6 md:pb-12 flex-1 w-full">

        {/* Tab switcher */}
        <div className="flex gap-2 mb-8" role="tablist" aria-label="Legal documents">
          {(["privacy", "terms"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`legal-panel-${t}`}
                onClick={() => switchTab(t)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-white text-black"
                    : "border border-white/15 text-white/70 hover:bg-white/5"
                }`}
                style={{ fontFamily: FONT }}
              >
                {t === "privacy" ? COPY.legal.page.tabPrivacy : COPY.legal.page.tabTerms}
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
          >
            <Panel contentClassName="p-6 md:p-8">
              <div className="prose prose-invert max-w-none space-y-6" style={{ fontFamily: FONT }}>
                {tab === "privacy" ? <PrivacyContent /> : <TermsContent />}
              </div>
            </Panel>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function PrivacyContent() {
  return (
    <>
      <p className="text-white/40 text-sm">{COPY.legal.lastUpdated}</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.privacy.headings.collect}</h2>
      <p className="text-white/70 leading-relaxed">We collect information you provide directly when you create an account and use First Day:</p>
      <ul className="list-disc pl-6 text-white/70 leading-relaxed space-y-1">
        <li><strong className="text-white/90 font-medium">Account information:</strong> Email address and authentication credentials</li>
        <li><strong className="text-white/90 font-medium">Goal data:</strong> Goals you create, your experience level, motivations, and preferences</li>
        <li><strong className="text-white/90 font-medium">Progress data:</strong> Activity completions, daily reflections, and streak information</li>
        <li><strong className="text-white/90 font-medium">Usage data:</strong> Pages visited, features used, and general interaction patterns to improve the service</li>
      </ul>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.privacy.headings.use}</h2>
      <p className="text-white/70 leading-relaxed">Your information is used to:</p>
      <ul className="list-disc pl-6 text-white/70 leading-relaxed space-y-1">
        <li>Create and manage your account</li>
        <li>Generate personalized 4-sprint plans using AI (see Section 4)</li>
        <li>Track your progress and provide daily activities</li>
        <li>Send daily email reminders if you have notifications enabled</li>
        <li>Improve and maintain the service</li>
      </ul>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.privacy.headings.storage}</h2>
      <p className="text-white/70 leading-relaxed">Your data is stored securely using Supabase infrastructure with encryption at rest and in transit. We implement industry-standard security measures to protect your personal information. We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.privacy.headings.ai}</h2>
      <p className="text-white/70 leading-relaxed">First Day uses AI (powered by Anthropic&apos;s Claude API) to generate your personalized 4-sprint plans. When you create a goal, the following data is sent to the AI service for plan generation:</p>
      <ul className="list-disc pl-6 text-white/70 leading-relaxed space-y-1">
        <li>Your goal description and motivation</li>
        <li>Your experience level and learning preferences</li>
      </ul>
      <p className="text-white/70 leading-relaxed">This data is used solely to generate your plan and is not stored by the AI provider beyond the request. We do not use your data to train AI models.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.privacy.headings.cookies}</h2>
      <p className="text-white/70 leading-relaxed">First Day uses essential cookies required for authentication and session management. We do not use third-party advertising cookies or tracking pixels. We may use privacy-respecting analytics to understand general usage patterns and improve the service.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.privacy.headings.retention}</h2>
      <p className="text-white/70 leading-relaxed">We retain your data for as long as your account is active. If you delete your account, all associated data — including goals, plans, and progress — is permanently removed from our systems within 30 days. Backups containing your data are purged within 90 days of account deletion.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.privacy.headings.rights}</h2>
      <p className="text-white/70 leading-relaxed">You have the right to:</p>
      <ul className="list-disc pl-6 text-white/70 leading-relaxed space-y-1">
        <li><strong className="text-white/90 font-medium">Access:</strong> Request a copy of your personal data at any time</li>
        <li><strong className="text-white/90 font-medium">Delete:</strong> Permanently erase all your data — every goal, plan, and day of progress — from the Settings page</li>
        <li><strong className="text-white/90 font-medium">Correct:</strong> Update your account information</li>
        <li><strong className="text-white/90 font-medium">Portability:</strong> Request your data in a machine-readable format</li>
        <li><strong className="text-white/90 font-medium">Opt out:</strong> Disable email notifications at any time</li>
      </ul>
      <p className="text-white/70 leading-relaxed">If you are located in the EU/EEA (GDPR) or California (CCPA), you may have additional rights including the right to restrict processing and the right to object to processing. To exercise any of these rights, contact us at the address below.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.privacy.headings.children}</h2>
      <p className="text-white/70 leading-relaxed">First Day is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such data, please contact us immediately.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.privacy.headings.changes}</h2>
      <p className="text-white/70 leading-relaxed">We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.privacy.headings.contact}</h2>
      <p className="text-white/70 leading-relaxed">For questions about this privacy policy or to exercise your data rights, contact us at <a href="mailto:support@firstday.life" className="text-white font-medium hover:underline">support@firstday.life</a>.</p>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <p className="text-white/40 text-sm">{COPY.legal.lastUpdated}</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.terms.headings.acceptance}</h2>
      <p className="text-white/70 leading-relaxed">By creating an account or using First Day, you agree to these terms. If you do not agree, please do not use the service.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.terms.headings.description}</h2>
      <p className="text-white/70 leading-relaxed">First Day is a goal achievement platform that uses AI to generate personalized 4-sprint plans with daily activities, resource recommendations, and progress tracking. Plans are tailored to your stated goals, experience level, and preferences.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.terms.headings.accounts}</h2>
      <p className="text-white/70 leading-relaxed">You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating your account. You may not share your account with others or create multiple accounts.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.terms.headings.aiContent}</h2>
      <p className="text-white/70 leading-relaxed">Plans, activities, and recommendations generated by First Day are created using artificial intelligence. While we strive for quality and relevance, AI-generated content:</p>
      <ul className="list-disc pl-6 text-white/70 leading-relaxed space-y-1">
        <li>Is provided as guidance and suggestions, not professional advice</li>
        <li>May not be perfectly accurate or suitable for every individual</li>
        <li>Should not replace professional medical, fitness, financial, or legal advice</li>
        <li>May include links to third-party resources that we do not control or endorse</li>
      </ul>
      <p className="text-white/70 leading-relaxed">You are responsible for evaluating whether any suggested activities are appropriate for your situation.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.terms.headings.ownership}</h2>
      <p className="text-white/70 leading-relaxed">You retain ownership of any content you create on First Day, including your goals, reflections, and progress notes. By using the service, you grant us a limited license to store and process your content solely for the purpose of providing the service to you. AI-generated plans are provided for your personal use.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.terms.headings.acceptableUse}</h2>
      <p className="text-white/70 leading-relaxed">You agree not to:</p>
      <ul className="list-disc pl-6 text-white/70 leading-relaxed space-y-1">
        <li>Misuse the service or attempt to access other users&apos; data</li>
        <li>Use the service for any illegal purpose</li>
        <li>Attempt to reverse engineer, scrape, or extract data from the service</li>
        <li>Use automated tools to access the service beyond normal usage</li>
      </ul>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.terms.headings.availability}</h2>
      <p className="text-white/70 leading-relaxed">We aim to keep First Day available and reliable, but we do not guarantee uninterrupted access. The service may be temporarily unavailable for maintenance, updates, or due to circumstances beyond our control. We reserve the right to modify, suspend, or discontinue features of the service with reasonable notice.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.terms.headings.termination}</h2>
      <p className="text-white/70 leading-relaxed">You may permanently erase all your data at any time from the Settings page. We may suspend or terminate accounts that violate these terms. Upon termination, your data will be deleted in accordance with our Privacy Policy.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.terms.headings.liability}</h2>
      <p className="text-white/70 leading-relaxed">First Day is provided &quot;as is&quot; without warranties of any kind, either express or implied. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including but not limited to any outcomes from following AI-generated plans or recommendations.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.terms.headings.changes}</h2>
      <p className="text-white/70 leading-relaxed">We may update these terms from time to time. We will notify you of material changes by posting the updated terms on this page. Continued use of the service after changes constitutes acceptance of the new terms.</p>

      <h2 className="text-xl font-semibold tracking-[-0.01em] text-white">{COPY.legal.terms.headings.contact}</h2>
      <p className="text-white/70 leading-relaxed">For questions about these terms, contact us at <a href="mailto:support@firstday.life" className="text-white font-medium hover:underline">support@firstday.life</a>.</p>
    </>
  );
}
