"use client";
/**
 * Settings — the account surface. Who's signed in, the single daily-reminder
 * toggle, a plain-language note on data, and the destructive "erase everything"
 * path. Reachable from the gear pill on every authenticated screen, and the
 * page the Privacy Policy / Terms point at for the right-to-delete.
 *
 * One screen, only what an account needs: identity, one preference, one
 * data-rights action. Nothing extra.
 */
import { motion } from "framer-motion";
import { Bell, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { TopBar } from "@/components/ui/TopBar";
import { screenTitle } from "@/content/flow";
import { COPY } from "@/content/copy";
import { FONT } from "@/lib/design";
import { staggerContainer, tileEnter } from "@/lib/animations";

interface SettingsProps {
  userEmail: string | null;
  demoMode?: boolean;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onSignOut: () => void | Promise<void>;
  onDeleteData: () => void | Promise<void>;
  onBack: () => void;
}

/** Small section header — uppercase microtitle that runs above each Panel. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/40 mb-2 ml-1">
      {children}
    </p>
  );
}

/** A11y switch in the greyscale system — white when on, hairline when off. */
function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        on ? "bg-white" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full transition-all ${
          on ? "left-6 bg-black" : "left-1 bg-white/70"
        }`}
      />
    </button>
  );
}

export function Settings({
  userEmail,
  demoMode = false,
  notificationsEnabled,
  onToggleNotifications,
  onSignOut,
  onDeleteData,
  onBack,
}: SettingsProps) {
  const C = COPY.settings;

  return (
    <div className="min-h-screen relative pb-20 md:pb-10" role="main" aria-label="Settings">
      <TopBar title={screenTitle("settings")} onBack={onBack} />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-8 space-y-7"
      >
        <motion.p variants={tileEnter} className="text-[15px] leading-relaxed text-white/55 ml-1">
          {C.intro}
        </motion.p>

        {/* Account */}
        <motion.div variants={tileEnter}>
          <SectionLabel>{C.account.heading}</SectionLabel>
          <Panel contentClassName="p-6">
            {demoMode ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[16px] font-semibold text-white" style={{ fontFamily: FONT }}>
                    {C.account.demoHeading}
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-white/55">
                    {C.account.demoBody}
                  </p>
                </div>
                <button
                  onClick={onSignOut}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.99]"
                  style={{ fontFamily: FONT }}
                >
                  <LogOut className="h-4 w-4" />
                  {C.account.exitDemo}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-white/40">
                    {C.account.signedInWith}
                  </p>
                  <p
                    className="mt-1 truncate text-[16px] font-semibold text-white"
                    style={{ fontFamily: FONT }}
                  >
                    {userEmail || "—"}
                  </p>
                </div>
                <button
                  onClick={onSignOut}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:border-white/50"
                  style={{ fontFamily: FONT }}
                >
                  <LogOut className="h-4 w-4" />
                  {C.account.signOut}
                </button>
              </div>
            )}
          </Panel>
        </motion.div>

        {/* Daily reminders */}
        <motion.div variants={tileEnter}>
          <SectionLabel>{C.notifications.heading}</SectionLabel>
          <Panel contentClassName="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <Bell className="mt-0.5 h-5 w-5 shrink-0 text-white/50" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold text-white" style={{ fontFamily: FONT }}>
                    {C.notifications.label}
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-white/55">
                    {C.notifications.description}
                  </p>
                </div>
              </div>
              <Toggle
                on={notificationsEnabled}
                onChange={onToggleNotifications}
                label={C.notifications.label}
              />
            </div>
          </Panel>
        </motion.div>

        {/* Your data */}
        <motion.div variants={tileEnter}>
          <SectionLabel>{C.data.heading}</SectionLabel>
          <Panel contentClassName="p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-white/50" aria-hidden />
              <p className="text-[14px] leading-relaxed text-white/65">{C.data.body}</p>
            </div>
          </Panel>
        </motion.div>

        {/* Danger zone — only for a real (savable) account */}
        {!demoMode && (
          <motion.div variants={tileEnter}>
            <SectionLabel>{C.danger.heading}</SectionLabel>
            <Panel contentClassName="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold text-white" style={{ fontFamily: FONT }}>
                    {C.danger.label}
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-white/55">
                    {C.danger.description}
                  </p>
                </div>
                <button
                  onClick={onDeleteData}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-red-500/40 px-5 py-2.5 text-[14px] font-semibold text-red-300 transition-colors hover:border-red-400 hover:bg-red-500/10"
                  style={{ fontFamily: FONT }}
                >
                  <Trash2 className="h-4 w-4" />
                  {C.danger.button}
                </button>
              </div>
            </Panel>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
